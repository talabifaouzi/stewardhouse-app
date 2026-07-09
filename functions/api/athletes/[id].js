// DELETE /api/athletes/:id — anonymize-to-stub (E-Slice E-Write-2, E3 override).
//
// Gated dark per E11: requireGatedEnterprise → 403 unless the staff person
// carries $.enterprise.demo_gate=true (production rows carry none; local smoke
// only). Owner scope: the athlete must belong to the operator's institution
// (resolved from institution_contact, prefer is_default_operator) — never
// trust the id alone. 404 is IDENTICAL for "no such athlete" and "exists but
// not this institution's" so a caller can't probe which ids exist.
//
// E3 anonymize-to-stub: the athlete row does NOT vanish — it becomes the STUB
// (name='redacted', class + sport retained, everything else nulled/zeroed,
// enrollment_status='Sunset', person_id NULL). Because the row SURVIVES, the
// four child tables' `ON DELETE CASCADE athlete(id)` FKs do NOT fire on this
// path — so athlete_activity / athlete_note / athlete_reflection /
// workshop_attendance are deleted EXPLICITLY here. (Those cascade FKs serve
// the INSTITUTION-boundary hard delete, schema-draft §4.1 — not this endpoint.)
//
// Atomicity (Q2 ruling): the 4 deletes + the stub UPDATE run as ONE
// env.DB.batch() — a D1 implicit transaction: "each statement will execute and
// commit, sequentially, non-concurrently … If a statement fails … it aborts or
// rolls back the entire sequence" (Cloudflare D1 Worker API docs). No partial
// state: either every child row is gone and the row is stubbed, or nothing.
//
// Idempotent (Q9): a second DELETE on an already-Sunset stub re-runs the batch
// (children already zero, UPDATE re-sets the same stub) and returns 200. No
// special already-anonymized guard.
//
// Under-18 (carried from 0009): the pilot cohort is 18+ collegiate. A minor
// roster would need a guardian-authorization gate before this endpoint fires —
// flagged, not built.

import {
  makeDb, requireGatedEnterprise, jsonError, jsonOk,
} from '../../_lib/gate.js';

export async function onRequestDelete(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedEnterprise(db, context);
  if (error) return jsonError(error, status);

  const athleteId = context.params.id;
  if (!athleteId || typeof athleteId !== 'string') {
    return jsonError('Invalid athlete id', 400);
  }

  // Owner scope: the operator's institution, from institution_contact.
  const contact = await db
    .selectFrom('institution_contact')
    .select(['institution_id', 'is_default_operator'])
    .where('person_id', '=', person.id)
    .orderBy('is_default_operator', 'desc')
    .executeTakeFirst();
  if (!contact) {
    return jsonError('No institution is associated with this operator', 403);
  }

  // Scope by id AND institution. 404 identical for absent + not-yours (no
  // enrollment_status filter — a Sunset stub is still found, so a re-DELETE is
  // idempotent per Q9).
  const athlete = await db
    .selectFrom('athlete')
    .select(['id'])
    .where('id', '=', athleteId)
    .where('institution_id', '=', contact.institution_id)
    .executeTakeFirst();
  if (!athlete) {
    return jsonError('Athlete not found', 404);
  }

  const nowIso = new Date().toISOString();

  // Compile the 5 statements and run them as one D1 batch (implicit
  // transaction, auto-rollback on any failure).
  const compiled = [
    db.deleteFrom('athlete_activity').where('athlete_id', '=', athleteId).compile(),
    db.deleteFrom('athlete_note').where('athlete_id', '=', athleteId).compile(),
    db.deleteFrom('athlete_reflection').where('athlete_id', '=', athleteId).compile(),
    db.deleteFrom('workshop_attendance').where('athlete_id', '=', athleteId).compile(),
    db.updateTable('athlete').set({
      // NULL the identity + contact + progress + consent columns.
      email: null,
      phone: null,
      notes: null,
      position: null,
      badge: null,
      gps_completed_at: null,
      cert_at: null,
      join_date: null,
      last_active_at: null,
      consent_acknowledged_at: null,   // Q1 ruling: NULL in the stub
      // Zero the counters + certification.
      lessons_count: 0,
      gifts_count: 0,
      certified: 0,
      // Departure marker + linkage clear + name redaction (the retained stub is
      // name='redacted' + year + sport only).
      enrollment_status: 'Sunset',
      person_id: null,
      name: 'redacted',
      updated_at: nowIso,
    }).where('id', '=', athleteId).compile(),
  ];

  try {
    await context.env.DB.batch(
      compiled.map((c) => context.env.DB.prepare(c.sql).bind(...c.parameters)),
    );
  } catch (err) {
    return jsonError('Failed to remove athlete', 500);
  }

  return jsonOk({ id: athleteId, anonymized: true });
}
