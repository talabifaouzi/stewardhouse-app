// POST /api/practice-content — creates a practice_lesson for the signed-in
// advisor. Owner-scoped: owner_advisor_person_id = person.id (session
// lookup), NEVER from body. Q9-guarded: rejects any payload containing
// rank / score / priority / suggestion / ordering / progression keys.
// Parker no-lifecycle invariant: status is authoring state only
// ('published' | 'draft'), enforced by allowlist.
//
// Ungated per §6 (practice_lesson is advisor's own authored content), but
// still routed through requireGatedAdvisor for symmetry with the client-
// write path landing later — Morgan is the sole real advisor in the pilot,
// and every advisor write goes through the same designation gate until
// FT rules otherwise. Non-Morgan advisors will hit 403 until designated.
//
// Response shapes:
//   401 { error: 'Not signed in' }              — no session
//   403 { error: 'No account found for session' } — session but no person
//   403 { error: 'Not authorized' }             — non-advisor OR not gated
//   400 { error: '<reason>' }                   — invalid body / forbidden key / bad field
//   500 { error: 'Failed to save lesson' }
//   200 { id, kind, baseId, status, title, minutes, scope, category,
//         summary, materials, createdAt, updatedAt }

import { sql } from 'kysely';
import {
  makeDb, requireGatedAdvisor, rejectRankKeys, jsonError, jsonOk,
} from '../_lib/gate.js';

const ALLOWED_KIND = new Set(['fork', 'authored']);
const ALLOWED_STATUS = new Set(['published', 'draft']);

function validateLessonBody(body, { requireAll }) {
  const out = {};
  if (requireAll || body.kind !== undefined) {
    if (!ALLOWED_KIND.has(body.kind)) return { error: 'kind must be one of: fork, authored' };
    out.kind = body.kind;
  }
  if (out.kind === 'fork' || (requireAll && body.baseId !== undefined)) {
    if (body.baseId !== null && typeof body.baseId !== 'string') {
      return { error: 'baseId must be a string (fork) or null (authored)' };
    }
    out.base_id = body.baseId ?? null;
  } else if (out.kind === 'authored') {
    out.base_id = null;
  } else if (body.baseId !== undefined) {
    if (body.baseId !== null && typeof body.baseId !== 'string') {
      return { error: 'baseId must be a string or null' };
    }
    out.base_id = body.baseId;
  }
  if (requireAll || body.status !== undefined) {
    if (!ALLOWED_STATUS.has(body.status)) return { error: "status must be 'published' or 'draft'" };
    out.status = body.status;
  }
  if (requireAll || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      return { error: 'title is required' };
    }
    out.title = body.title.trim();
  }
  if (body.minutes !== undefined) {
    if (body.minutes === null) {
      out.minutes = null;
    } else if (!Number.isInteger(body.minutes) || body.minutes < 0) {
      return { error: 'minutes must be a non-negative integer or null' };
    } else {
      out.minutes = body.minutes;
    }
  }
  if (body.scope !== undefined) {
    if (body.scope !== null && typeof body.scope !== 'string') {
      return { error: 'scope must be a string or null' };
    }
    out.scope = body.scope;
  }
  if (body.category !== undefined) {
    if (body.category !== null && typeof body.category !== 'string') {
      return { error: 'category must be a string or null' };
    }
    out.category = body.category;
  }
  if (body.summary !== undefined) {
    if (body.summary !== null && typeof body.summary !== 'string') {
      return { error: 'summary must be a string or null' };
    }
    out.summary = body.summary;
  }
  if (body.materials !== undefined) {
    if (body.materials !== null && !Array.isArray(body.materials)) {
      return { error: 'materials must be an array or null' };
    }
    out.materials = body.materials;
  }
  return { fields: out };
}

function toResponseShape(row) {
  let materials = null;
  if (row.materials) {
    try { materials = JSON.parse(row.materials); } catch { materials = null; }
  }
  return {
    id: row.id,
    kind: row.kind,
    baseId: row.base_id,
    status: row.status,
    title: row.title,
    minutes: row.minutes,
    scope: row.scope,
    category: row.category,
    summary: row.summary,
    materials,
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

  const validated = validateLessonBody(body, { requireAll: true });
  if (validated.error) return jsonError(validated.error, 400);
  const f = validated.fields;

  const id = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  try {
    await db.insertInto('practice_lesson').values({
      id,
      owner_advisor_person_id: person.id,
      kind: f.kind,
      base_id: f.base_id ?? null,
      status: f.status,
      title: f.title,
      minutes: f.minutes ?? null,
      scope: f.scope ?? null,
      category: f.category ?? null,
      summary: f.summary ?? null,
      materials: f.materials ? JSON.stringify(f.materials) : null,
      created_at: nowIso,
      updated_at: nowIso,
    }).execute();
  } catch (err) {
    return jsonError('Failed to save lesson', 500);
  }

  const row = await db
    .selectFrom('practice_lesson')
    .select([
      'id', 'kind', 'base_id', 'status', 'title', 'minutes', 'scope',
      'category', 'summary', 'materials', 'created_at', 'updated_at',
    ])
    .where('id', '=', id)
    .executeTakeFirst();
  return jsonOk(toResponseShape(row));
}

export { validateLessonBody, toResponseShape };
