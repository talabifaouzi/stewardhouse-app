// POST /api/snapshots — records a cohort period snapshot for the operator's
// institution (E-Slice E-Write-5, E9). Gated dark per E11.
//
// Q5 DERIVATION: the six SOURCED aggregates are derived server-side from live
// D1 at snapshot time, institution-scoped over the ACTIVE roster (non-Sunset):
//   athletes_count      — COUNT active athletes
//   gps_completed_count — COUNT gps_completed_at IS NOT NULL; gps_rate = round%
//   certified_count     — COUNT certified=1;                   cert_rate = round%
//   gifts_count         — SUM(athlete.gifts_count) SOFT COUNTER (a per-athlete
//                         tally, not a gift-row count — docblocked as such)
//   attendance_rate     — SUM(attended)/COUNT across the institution's
//                         workshop_attendance rows (joined through workshop)
// The two UNSOURCED aggregates are written NULL (migration 0013 made them
// nullable): dollars_moved (no enterprise gift-dollar table) and
// avg_weekly_engagement (no engagement-tracking table). NULL = "not tracked";
// never 0 (a real 0% / $0 reading) and never staff-entered.
//
// Rate representation matches the fixture (enterpriseFixtures cohort snapshots):
// integer percent 0-100, no '%' — CohortComparison adds the sign via fmtPct.
// Zero-denominator guard: with 0 athletes (or 0 attendance rows) the rate is 0,
// NOT NULL — gps_rate/cert_rate/attendance_rate stay NOT NULL columns, so 0 is
// the honest "nothing yet" value (athletes_count=0 already signals no cohort).
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

  // Roster aggregates (active, non-Sunset).
  const agg = await db
    .selectFrom('athlete')
    .select(() => [
      sql`COUNT(*)`.as('athletes_count'),
      sql`COALESCE(SUM(CASE WHEN gps_completed_at IS NOT NULL THEN 1 ELSE 0 END), 0)`.as('gps_completed_count'),
      sql`COALESCE(SUM(CASE WHEN certified = 1 THEN 1 ELSE 0 END), 0)`.as('certified_count'),
      sql`COALESCE(SUM(gifts_count), 0)`.as('gifts_count'),
    ])
    .where('institution_id', '=', instId)
    .where('enrollment_status', '!=', 'Sunset')
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
  const giftsCount = Number(agg?.gifts_count ?? 0);
  const attTotal = Number(att?.total ?? 0);
  const attAttended = Number(att?.attended ?? 0);

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
      gifts_count: giftsCount,
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
