// POST /api/workshops — schedules a workshop on the signed-in staff operator's
// institution (E-Slice E-Write-3a, workshop create). Gated dark per E11:
// requireGatedEnterprise → 403 unless the staff person carries
// $.enterprise.demo_gate=true (production rows carry none; local smoke only).
//
// Owner scope: institution_id is resolved from the session's
// institution_contact (prefer is_default_operator), NEVER from the body. A
// staff operator can only schedule workshops on their own institution.
//
// Q2 (facilitator): facilitator_person_id is NULL at create — the E4
// facilitator-person wiring (name-string → person FK + a picker) is DEFERRED to
// a later slice. No facilitator field is accepted from the body.
//
// Q3 (status): status ∈ {'scheduled','upcoming','completed'}; server default
// 'scheduled' when omitted. Never a rank — categorical relationship/schedule
// state (Parker no-lifecycle invariant; see migration 0009 docblock).
//
// Q5 (followUps) / Q6 (delete): OUT of scope. This endpoint has NO delete/edit
// path, and workshop_followup is never written or read here.
//
// Q9 guardrail: rejectRankKeys before the allowlist.
//
// date is REQUIRED and validated as YYYY-MM-DD: the `workshop.date` column is
// NOT NULL (migration 0009) and WorkshopCalendar buckets entries by date — an
// absent or malformed date would either 500 on INSERT or break the calendar
// parse. Only `title` and `date` are required; everything else is optional.
//
// Response shape: the /api/me workshop element (camelCase, attendance: [],
// followUps: []) so WorkshopsProvider.add() splices the response into local
// state without transformation, and so a freshly created workshop opened in
// WorkshopDetail (which reads workshop.attendance.filter / workshop.followUps
// .length inline) never touches undefined — the AthleteProfile activity:[]
// lesson.

import {
  makeDb, requireGatedEnterprise, rejectRankKeys, jsonError, jsonOk,
} from '../_lib/gate.js';

const STATUS_ENUM = new Set(['scheduled', 'upcoming', 'completed']);
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Columns selected for the round-trip + /api/me workshops read.
export const WORKSHOP_ELEMENT_COLUMNS = [
  'id', 'date', 'title', 'status', 'module', 'summary', 'notes',
];

// Maps a workshop row (+ its attendance rows, if any) to the fixture-shaped
// element WorkshopCalendar / WorkshopDetail consume. attendanceRows defaults to
// [] so a fresh create (no attendance yet) and the round-trip SELECT both yield
// attendance: []. followUps is ALWAYS [] in 3a — workshop_followup has no write
// path or read here (Q5), so it is never queried.
export function toWorkshopElement(row, attendanceRows = []) {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    status: row.status,
    // Q2: E4 facilitator-person wiring deferred — facilitator_person_id is NULL
    // at create and no name-resolution join runs yet. Always null in 3a.
    facilitator: null,
    module: row.module,
    summary: row.summary,
    notes: row.notes,
    // HARD REQUIREMENT: attendance + followUps always present so WorkshopDetail
    // never reads undefined. Fresh workshop → both [].
    attendance: attendanceRows.map((a) => ({
      athleteId: a.athlete_id,
      attended: !!a.attended,
      note: a.note,
    })),
    followUps: [],
  };
}

function validateWorkshopBody(body) {
  const out = {};

  if (typeof body.title !== 'string' || body.title.trim().length === 0) {
    return { error: 'title is required' };
  }
  out.title = body.title.trim();

  if (typeof body.date !== 'string' || !DATE_REGEX.test(body.date.trim())) {
    return { error: 'date is required (YYYY-MM-DD)' };
  }
  out.date = body.date.trim();

  // status ∈ enum; server default applied at insert when omitted.
  if (body.status !== undefined && body.status !== null) {
    if (typeof body.status !== 'string' || !STATUS_ENUM.has(body.status)) {
      return { error: "status must be one of 'scheduled', 'upcoming', 'completed'" };
    }
    out.status = body.status;
  }

  for (const k of ['module', 'summary', 'notes']) {
    if (body[k] !== undefined) {
      if (body[k] !== null && typeof body[k] !== 'string') {
        return { error: `${k} must be a string or null` };
      }
      out[k] = typeof body[k] === 'string' ? body[k].trim() : body[k];
    }
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
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Body must be an object', 400);
  }
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  const validated = validateWorkshopBody(body);
  if (validated.error) return jsonError(validated.error, 400);
  const f = validated.fields;

  // Owner scope: institution from the session's institution_contact, NEVER the
  // body. Prefer the default-operator row (idx_institution_contact_person_id).
  const contact = await db
    .selectFrom('institution_contact')
    .select(['institution_id', 'is_default_operator'])
    .where('person_id', '=', person.id)
    .orderBy('is_default_operator', 'desc')
    .executeTakeFirst();
  if (!contact) {
    return jsonError('No institution is associated with this operator', 403);
  }

  const id = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  try {
    await db.insertInto('workshop').values({
      id,
      institution_id: contact.institution_id,
      date: f.date,
      title: f.title,
      status: f.status ?? 'scheduled',       // Q3: server default
      notes: f.notes ?? null,
      facilitator_person_id: null,           // Q2: E4 wiring deferred
      module: f.module ?? null,
      summary: f.summary ?? null,
      created_at: nowIso,
      updated_at: nowIso,
    }).execute();
  } catch (err) {
    return jsonError('Failed to save workshop', 500);
  }

  const row = await db
    .selectFrom('workshop')
    .select(WORKSHOP_ELEMENT_COLUMNS)
    .where('id', '=', id)
    .executeTakeFirst();
  // Fresh workshop → no attendance rows yet → element carries attendance: [].
  return jsonOk(toWorkshopElement(row));
}
