// POST /api/cohorts — creates a cohort owned by the signed-in advisor.
// cohort_member operations EXCLUDED (Q7-gated per §6 — client_id FK).
// Response shape mirrors AdvisorSurface's initialState cohort shape:
// { id, name, focus, started, nextSessionDate, summary, externalMembers,
//   assignedLessons, updates, sessions, memberIds: [], createdAt, updatedAt }.

import {
  makeDb, requireGatedAdvisor, rejectRankKeys, jsonError, jsonOk,
} from '../_lib/gate.js';

function validateCohortBody(body, { requireAll }) {
  const out = {};
  if (requireAll || body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return { error: 'name is required' };
    }
    out.name = body.name.trim();
  }
  if (body.focus !== undefined) {
    if (body.focus !== null && typeof body.focus !== 'string') {
      return { error: 'focus must be a string or null' };
    }
    out.focus = body.focus;
  }
  if (body.started !== undefined) {
    if (body.started !== null &&
        (typeof body.started !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.started))) {
      return { error: 'started must be an ISO YYYY-MM-DD string or null' };
    }
    out.started = body.started;
  }
  if (body.nextSessionDate !== undefined) {
    if (body.nextSessionDate !== null &&
        (typeof body.nextSessionDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.nextSessionDate))) {
      return { error: 'nextSessionDate must be an ISO YYYY-MM-DD string or null' };
    }
    out.next_session_date = body.nextSessionDate;
  }
  if (body.summary !== undefined) {
    if (body.summary !== null && typeof body.summary !== 'string') {
      return { error: 'summary must be a string or null' };
    }
    out.summary = body.summary;
  }
  if (body.externalMembers !== undefined) {
    if (!Number.isInteger(body.externalMembers) || body.externalMembers < 0) {
      return { error: 'externalMembers must be a non-negative integer' };
    }
    out.external_members = body.externalMembers;
  }
  if (body.assignedLessons !== undefined) {
    if (!Array.isArray(body.assignedLessons)) return { error: 'assignedLessons must be an array' };
    out.assigned_lessons = body.assignedLessons;
  }
  if (body.updates !== undefined) {
    if (!Array.isArray(body.updates)) return { error: 'updates must be an array' };
    out.updates = body.updates;
  }
  if (body.sessions !== undefined) {
    if (!Array.isArray(body.sessions)) return { error: 'sessions must be an array' };
    out.sessions = body.sessions;
  }
  return { fields: out };
}

function toCohortResponse(row) {
  const parse = (s) => { try { return JSON.parse(s); } catch { return []; } };
  return {
    id: row.id,
    name: row.name,
    focus: row.focus,
    started: row.started,
    nextSession: row.next_session_date,
    summary: row.summary,
    externalMembers: row.external_members,
    assignedLessons: row.assigned_lessons ? parse(row.assigned_lessons) : [],
    updates: row.updates ? parse(row.updates) : [],
    sessions: row.sessions ? parse(row.sessions) : [],
    memberIds: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function onRequestPost(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedAdvisor(db, context);
  if (error) return jsonError(error, status);

  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Body must be an object', 400);
  }
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  const validated = validateCohortBody(body, { requireAll: true });
  if (validated.error) return jsonError(validated.error, 400);
  const f = validated.fields;

  const id = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  try {
    await db.insertInto('cohort').values({
      id,
      owner_advisor_person_id: person.id,
      name: f.name,
      focus: f.focus ?? null,
      started: f.started ?? null,
      next_session_date: f.next_session_date ?? null,
      summary: f.summary ?? null,
      external_members: f.external_members ?? 0,
      assigned_lessons: f.assigned_lessons ? JSON.stringify(f.assigned_lessons) : null,
      updates: f.updates ? JSON.stringify(f.updates) : null,
      sessions: f.sessions ? JSON.stringify(f.sessions) : null,
      created_at: nowIso,
      updated_at: nowIso,
    }).execute();
  } catch (err) {
    return jsonError('Failed to save cohort', 500);
  }

  const row = await db
    .selectFrom('cohort')
    .select([
      'id', 'name', 'focus', 'started', 'next_session_date', 'summary',
      'external_members', 'assigned_lessons', 'updates', 'sessions',
      'created_at', 'updated_at',
    ])
    .where('id', '=', id)
    .executeTakeFirst();
  return jsonOk(toCohortResponse(row));
}

export { validateCohortBody, toCohortResponse };
