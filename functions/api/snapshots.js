// POST /api/snapshots — records a cohort period snapshot for the operator's
// institution (E-Slice E-Write-5, E9). Gated dark per E11.
//
// Q5 DERIVATION: the SOURCED aggregates are derived server-side from live D1 at
// snapshot time, institution-scoped over the WRITABLE roster:
//   athletes_count      — COUNT writable athletes
//   gps_completed_count — COUNT gps_completed_at IS NOT NULL; gps_rate = round%
//   certified_count     — COUNT certified=1;                   cert_rate = round%
//   attendance_rate     — SUM(attended)/COUNT across the institution's
//                         workshop_attendance rows (joined through workshop)
//
// SUPERSEDED, recorded rather than deleted because it was a ruling and not a
// detail. This docblock read, until the write-gate slice: "gps_rate / cert_rate
// denominators stay the FULL non-Sunset roster (P-2 L4 — snapshots are a frozen
// historical series and do NOT adopt the FORK 1 consent-aware denominator,
// which would break a mid-series trend)." FT REVERSED that: the denominator IS
// now the FORK 1 writable population, matching what computeStats renders. The
// mid-series-trend concern L4 raised is not answered by this slice; it is
// mooted for now because the table holds zero rows, so no series exists to
// break. A future reader restarting a series across this change should know the
// denominator moved.
//
// The UNSOURCED aggregates are written NULL (migrations 0013 + 0017 made them
// nullable): gifts_count (P-2 FORK 3 — the athlete.gifts_count soft counter is
// never written by any P-2 path, so SUM would be a frozen, dishonest 0),
// dollars_moved (no enterprise gift-dollar table), and avg_weekly_engagement
// (no engagement-tracking table). NULL = "not tracked"; never 0 (a real 0% / $0
// reading) and never staff-entered.
//
// Rate representation matches the fixture (enterpriseFixtures cohort snapshots):
// integer percent 0-100, no '%' — CohortComparison adds the sign via fmtPct.
//
// WRITE GATE (ruled): with a writable denominator of zero the request is
// REFUSED and no row is written. The prior behaviour wrote gps_rate=0 and
// cert_rate=0, which read as a measured "nobody progressed" while the same
// concept rendered "Not tracked" on screen via computeStats R4.
//
// The gate is a REFUSAL, not a NULL write. gps_rate / cert_rate /
// attendance_rate are NOT NULL columns and stay that way: no migration, no
// schema change, and the F-D filing (docs/filed-defects.md) is untouched.
//
// E3 does NOT mandate this gate, and attributing it to E3 would misread the
// rule. What E3 establishes is that a snapshot, once taken, stays
// byte-identical: there is no correction path except delete-and-re-snapshot
// (0009:513-515). That makes a wrong row permanent, which is why refusing costs
// less than writing. The decision to refuse is FT's, not E3's.
//
// attendance_rate is OUT of scope: it has no render-side twin to contradict it,
// so its denominator and its own zero-guard are unchanged.
//
// E9 HARD INVARIANT (verbatim, 0009): "Snapshots store AGGREGATES ONLY. NO
// per-athlete identifiable column (no athlete_id, no name, no email) may EVER be
// added. History must survive athlete deletion (E3 retention inversion) WITHOUT
// retaining PII." No rank/score/priority, no lifecycle/status column. A snapshot
// is a FROZEN record: the derived counts are captured now and never recomputed,
// so a later athlete anonymize does NOT rewrite an already-taken snapshot.
//
// snapshot_at is server-set. Response: the round-tripped element (fixture keys).

import { sql } from 'kysely';
import {
  makeDb, requireGatedEnterprise, rejectRankKeys, jsonError, jsonOk,
} from '../_lib/gate.js';

export const SNAPSHOT_ELEMENT_COLUMNS = [
  'id', 'cohort_label', 'as_of_note', 'snapshot_at',
  'athletes_count', 'gps_completed_count', 'gps_rate',
  'certified_count', 'cert_rate', 'gifts_count',
  'dollars_moved', 'attendance_rate', 'avg_weekly_engagement',
];

// Maps a cohort_period_snapshot row to the element CohortComparison consumes —
// the SAME keys as the enterpriseFixtures prior/current snapshots, so the
// rewired report reads real rows exactly as it read fixtures. The two nullable
// aggregates pass through as null (rendered "Not tracked").
export function toSnapshotElement(row) {
  return {
    id: row.id,
    cohortLabel: row.cohort_label,
    asOfNote: row.as_of_note,
    snapshotAt: row.snapshot_at,
    athletes: row.athletes_count,
    gpsCompleted: row.gps_completed_count,
    gpsRate: row.gps_rate,
    certified: row.certified_count,
    certRate: row.cert_rate,
    totalGifts: row.gifts_count,
    totalDollarsMoved: row.dollars_moved,           // null = not tracked
    workshopAttendanceRate: row.attendance_rate,
    avgWeeklyEngagement: row.avg_weekly_engagement,  // null = not tracked
  };
}

function validateSnapshotBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Body must be an object' };
  }
  const out = {};
  if (typeof body.cohortLabel !== 'string' || body.cohortLabel.trim().length === 0) {
    return { error: 'cohortLabel is required' };
  }
  out.cohortLabel = body.cohortLabel.trim();
  if (body.asOfNote !== undefined) {
    if (body.asOfNote !== null && typeof body.asOfNote !== 'string') {
      return { error: 'asOfNote must be a string or null' };
    }
    out.asOfNote = typeof body.asOfNote === 'string' ? body.asOfNote.trim() : body.asOfNote;
  }
  return { fields: out };
}

export async function onRequestPost(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedEnterprise(db, context);
  if (error) return jsonError(error, status);

  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  const validated = validateSnapshotBody(body);
  if (validated.error) return jsonError(validated.error, 400);
  const f = validated.fields;

  const contact = await db
    .selectFrom('institution_contact')
    .select(['institution_id', 'is_default_operator'])
    .where('person_id', '=', person.id)
    .orderBy('is_default_operator', 'desc')
    .executeTakeFirst();
  if (!contact) {
    return jsonError('No institution is associated with this operator', 403);
  }
  const instId = contact.institution_id;

  // Roster aggregates over the WRITABLE population, not the full roster.
  //
  // THE COLUMN NAMES NO LONGER MATCH WHAT THEY HOLD, and that is worth meeting
  // here rather than discovering downstream. `athletes_count` is the count of
  // athletes the institution may write for, NOT the roster size;
  // `gps_completed_count` and `certified_count` are numerators over that same
  // subset. The three cohort_period_snapshot columns they feed keep their
  // original names, so a row written after this slice and a row written before
  // it would carry the same column names for different populations. The table
  // holds zero rows today, so no such pair exists yet.
  //
  // The two added predicates are the FORK 1 writable predicate, the same one
  // enterpriseStats.js isWritable applies on the render side and the same one
  // the PUT /api/athletes/:id gate enforces. Both columns live on `athlete`, so
  // this needs no JOIN and no second query.
  const agg = await db
    .selectFrom('athlete')
    .select(() => [
      sql`COUNT(*)`.as('athletes_count'),
      sql`COALESCE(SUM(CASE WHEN gps_completed_at IS NOT NULL THEN 1 ELSE 0 END), 0)`.as('gps_completed_count'),
      sql`COALESCE(SUM(CASE WHEN certified = 1 THEN 1 ELSE 0 END), 0)`.as('certified_count'),
      // FORK 3: gifts_count is NOT summed — it is written NULL below.
    ])
    .where('institution_id', '=', instId)
    .where('enrollment_status', '!=', 'Sunset')
    .where('management_mode', '=', 'delegated')
    .where('person_id', 'is not', null)
    .executeTakeFirst();

  // Attendance aggregate (institution-scoped through workshop).
  const att = await db
    .selectFrom('workshop_attendance as wa')
    .innerJoin('workshop as w', 'w.id', 'wa.workshop_id')
    .select(() => [
      sql`COUNT(*)`.as('total'),
      sql`COALESCE(SUM(wa.attended), 0)`.as('attended'),
    ])
    .where('w.institution_id', '=', instId)
    .executeTakeFirst();

  const athletesCount = Number(agg?.athletes_count ?? 0);
  const gpsCompleted = Number(agg?.gps_completed_count ?? 0);
  const certified = Number(agg?.certified_count ?? 0);
  const attTotal = Number(att?.total ?? 0);
  const attAttended = Number(att?.attended ?? 0);

  // THE GATE. Refuse before anything is written: no row, nothing to correct.
  //
  // 409 rather than 400 or 403. The body is well-formed, so it is not a 400;
  // the caller is a correctly typed and correctly gated operator, so it is not
  // a 403 — reusing 403 here would collapse "you may not write" with "there is
  // nothing to write about". 409 is the established idiom in this tree for an
  // act the record's current state does not permit: thirteen call sites, among
  // them athletes/[id]/invite.js:135 (already invited), :148 (a consent column
  // holding the wrong value, the closest sibling to this guard) and
  // invites/[id].js:138 (already claimed). 422 has zero precedent here.
  if (athletesCount === 0) {
    return jsonError('A snapshot needs at least one athlete with delegated record-keeping.', 409);
  }

  // athletesCount is now guaranteed positive by the guard above, so the zero
  // branch of the next two ternaries is unreachable. Both are RETAINED as
  // defence in depth, on the reasoning ProgramOutputs.jsx:98-99 states for the
  // same shape: a guard that returns early can be moved, and these must never
  // produce NaN into a NOT NULL column if it is. attendanceRate keeps its own
  // guard on its own denominator; it is out of this slice's scope.
  const gpsRate = athletesCount > 0 ? Math.round((100 * gpsCompleted) / athletesCount) : 0;
  const certRate = athletesCount > 0 ? Math.round((100 * certified) / athletesCount) : 0;
  const attendanceRate = attTotal > 0 ? Math.round((100 * attAttended) / attTotal) : 0;

  const id = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  try {
    await db.insertInto('cohort_period_snapshot').values({
      id,
      institution_id: instId,
      cohort_label: f.cohortLabel,
      as_of_note: f.asOfNote ?? null,
      snapshot_at: nowIso,                 // server-set
      athletes_count: athletesCount,
      gps_completed_count: gpsCompleted,
      gps_rate: gpsRate,
      certified_count: certified,
      cert_rate: certRate,
      gifts_count: null,                   // FORK 3: not tracked (never a frozen 0)
      dollars_moved: null,                 // Q5: not tracked
      attendance_rate: attendanceRate,
      avg_weekly_engagement: null,         // Q5: not tracked
      created_at: nowIso,
    }).execute();
  } catch (err) {
    return jsonError('Failed to record snapshot', 500);
  }

  const row = await db
    .selectFrom('cohort_period_snapshot')
    .select(SNAPSHOT_ELEMENT_COLUMNS)
    .where('id', '=', id)
    .executeTakeFirst();
  return jsonOk(toSnapshotElement(row));
}
