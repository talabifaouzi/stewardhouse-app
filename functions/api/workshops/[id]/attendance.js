// PUT /api/workshops/:id/attendance — records the workshop's roster attendance
// (E-Slice E-Write-3b). Gated dark per E11: requireGatedEnterprise → 403 unless
// the staff person carries $.enterprise.demo_gate=true (production rows carry
// none; local smoke only).
//
// Q4 ruling — composite-PK UPSERT: attendance is idempotent per
// (workshop_id, athlete_id). Re-recording the same athlete updates attended +
// note; it never duplicates. "Mark the roster" (Q3) is a single full-roster
// batch: { records: [{ athleteId, attended, note? }] }, one record per active
// athlete. The whole batch is atomic — see below.
//
// FIRST UPSERT IN THE REPO. cohort-members.js (the other composite-PK table) is
// insert-that-rejects-duplicate; this is the opposite (INSERT … ON CONFLICT …
// DO UPDATE).
//
// Dual-transitive ownership (schema-draft §3.8, verbatim): "Ownership is
// dual-transitive: through workshop → institution AND through athlete →
// institution (both must belong to the same institution for the row to be
// valid)." Enforced at the endpoint layer (not the schema) by two scoped reads
// BEFORE the write:
//   (a) the workshop must belong to the operator's institution — 404 identical
//       for absent / not-yours (no existence probe; the athletes/[id].js idiom);
//   (b) EVERY athleteId must belong to the same institution AND be an ACTIVE
//       roster row (enrollment_status != 'Sunset'). One IN query; the returned
//       count is compared to the distinct requested count. Any shortfall →
//       400 reject-WHOLE-batch.
//
// Sunset exclusion (Q4): an anonymized athlete's row RETAINS institution_id, so
// a plain institution scope would wrongly admit it. The `!= 'Sunset'` filter
// excludes stubs. It also prevents a subtle resurrection: E-Write-2 DELETEs an
// anonymized athlete's existing attendance, so recording new attendance against
// a stub would resurrect rows pointing at a name='redacted' athlete.
//
// Reject-whole-batch atomicity (Q3): "mark the roster" is ONE action, and the
// write is a SINGLE multi-row INSERT … ON CONFLICT statement — inherently
// atomic. No env.DB.batch() is needed (that is only for heterogeneous
// statements, e.g. the E-Write-2 anonymize). Validation happens up front, so a
// partial write is structurally impossible: either all rows land or none do.
//
// Q5: `note` carries NO authoring caution (absence logistics; no E8 convention
// attaches — that is scoped to exclusion.connection_detail). WorkshopDetail is
// staff-only mounted, so `note` never reaches an athlete-facing read.
//
// Q6: returns the FULL updated workshop element (toWorkshopElement with the new
// attendance nested), so WorkshopsProvider replaces the workshop object cleanly.

import {
  makeDb, requireGatedEnterprise, rejectRankKeys, jsonError, jsonOk,
} from '../../../_lib/gate.js';
import { WORKSHOP_ELEMENT_COLUMNS, toWorkshopElement } from '../../workshops.js';

function validateRecords(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Body must be an object' };
  }
  const { records } = body;
  if (!Array.isArray(records) || records.length === 0) {
    return { error: 'records must be a non-empty array' };
  }
  const out = [];
  const seen = new Set();
  for (const r of records) {
    if (!r || typeof r !== 'object' || Array.isArray(r)) {
      return { error: 'each record must be an object' };
    }
    if (typeof r.athleteId !== 'string' || r.athleteId.trim().length === 0) {
      return { error: 'each record needs a non-empty athleteId' };
    }
    const athleteId = r.athleteId.trim();
    if (seen.has(athleteId)) {
      return { error: `duplicate athleteId in records: ${athleteId}` };
    }
    seen.add(athleteId);
    if (typeof r.attended !== 'boolean') {
      return { error: 'each record needs a boolean attended' };
    }
    if (r.note !== undefined && r.note !== null && typeof r.note !== 'string') {
      return { error: 'note must be a string or null' };
    }
    // Allowlist pick — any extra per-record keys (incl. rank-ish ones) are
    // ignored, never written.
    out.push({
      athleteId,
      attended: r.attended,
      note: typeof r.note === 'string' ? r.note.trim() : null,
    });
  }
  return { records: out };
}

export async function onRequestPut(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedEnterprise(db, context);
  if (error) return jsonError(error, status);

  const workshopId = context.params.id;
  if (!workshopId || typeof workshopId !== 'string') {
    return jsonError('Invalid workshop id', 400);
  }

  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  const validated = validateRecords(body);
  if (validated.error) return jsonError(validated.error, 400);
  const records = validated.records;

  // Owner scope: institution from the session's institution_contact, NEVER the
  // body (prefer the default-operator row).
  const contact = await db
    .selectFrom('institution_contact')
    .select(['institution_id', 'is_default_operator'])
    .where('person_id', '=', person.id)
    .orderBy('is_default_operator', 'desc')
    .executeTakeFirst();
  if (!contact) {
    return jsonError('No institution is associated with this operator', 403);
  }

  // (a) Workshop must belong to this institution. 404 identical for absent /
  // not-yours (no probe).
  const workshop = await db
    .selectFrom('workshop')
    .select(['id'])
    .where('id', '=', workshopId)
    .where('institution_id', '=', contact.institution_id)
    .executeTakeFirst();
  if (!workshop) {
    return jsonError('Workshop not found', 404);
  }

  // (b) Every athleteId must be an ACTIVE roster row on this institution. One IN
  // query (pulls management_mode for the (c) claim-state gate); shortfall →
  // reject the WHOLE batch (no partial write).
  const athleteIds = records.map((r) => r.athleteId);
  const validAthletes = await db
    .selectFrom('athlete')
    .select(['id', 'management_mode', 'person_id'])
    .where('id', 'in', athleteIds)
    .where('institution_id', '=', contact.institution_id)
    .where('enrollment_status', '!=', 'Sunset')
    .execute();
  if (validAthletes.length !== athleteIds.length) {
    return jsonError('One or more athletes are not on this institution roster', 400);
  }

  // (c) C-1 claim-state gate (deny-by-default): a staff write requires the
  // athlete to have delegated management. management_mode must equal
  // 'delegated' EXACTLY — NULL (unclaimed / no choice made) and 'self'
  // (athlete-managed, staff read-only) both block. Reject the WHOLE batch,
  // naming the non-delegated ids so staff know which athletes to follow up.
  // D7 (P-2): reject not-delegated OR person_id-NULL orphans. athlete.person_id
  // is ON DELETE SET NULL, so a departed owning account leaves a row that still
  // reads management_mode='delegated' but is no longer claim-backed — staff must
  // not write against it. management_mode must be 'delegated' EXACTLY AND
  // person_id must be set.
  const notDelegated = validAthletes
    .filter((a) => a.management_mode !== 'delegated' || a.person_id == null)
    .map((a) => a.id);
  if (notDelegated.length > 0) {
    return jsonError(
      `Cannot record attendance — athlete(s) have not delegated management to staff (or the linked account was removed): ${notDelegated.join(', ')}`,
      403,
    );
  }

  // Single multi-row upsert — atomic on its own. excluded.<col> pulls the
  // would-be-inserted value on conflict.
  const rows = records.map((r) => ({
    workshop_id: workshopId,
    athlete_id: r.athleteId,
    attended: r.attended ? 1 : 0,
    note: r.note,
  }));
  try {
    await db
      .insertInto('workshop_attendance')
      .values(rows)
      .onConflict((oc) => oc
        .columns(['workshop_id', 'athlete_id'])
        .doUpdateSet((eb) => ({
          attended: eb.ref('excluded.attended'),
          note: eb.ref('excluded.note'),
        })))
      .execute();
  } catch (err) {
    return jsonError('Failed to record attendance', 500);
  }

  // Q6: return the full updated workshop element (attendance nested).
  const workshopRow = await db
    .selectFrom('workshop')
    .select(WORKSHOP_ELEMENT_COLUMNS)
    .where('id', '=', workshopId)
    .executeTakeFirst();
  const attendanceRows = await db
    .selectFrom('workshop_attendance')
    .select(['workshop_id', 'athlete_id', 'attended', 'note'])
    .where('workshop_id', '=', workshopId)
    .execute();
  return jsonOk(toWorkshopElement(workshopRow, attendanceRows));
}
