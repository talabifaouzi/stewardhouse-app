// POST /api/docs — creates a doc row under an existing doc_category, owned
// (transitively) by the signed-in advisor: category ownership check runs
// as a scoped SELECT before INSERT. body is a JSON string[] (paragraphs).
//
// Response shape: { id, categoryId, title, updated, notes, body, createdAt }.

import {
  makeDb, requireGatedAdvisor, rejectRankKeys, jsonError, jsonOk,
} from '../_lib/gate.js';

function validateDocBody(body, { requireAll }) {
  const out = {};
  if (requireAll || body.categoryId !== undefined) {
    if (typeof body.categoryId !== 'string' || !body.categoryId) {
      return { error: 'categoryId is required' };
    }
    out.category_id = body.categoryId;
  }
  if (requireAll || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      return { error: 'title is required' };
    }
    out.title = body.title.trim();
  }
  if (body.notes !== undefined) {
    if (body.notes !== null && typeof body.notes !== 'string') {
      return { error: 'notes must be a string or null' };
    }
    out.notes = body.notes && body.notes.trim() ? body.notes.trim() : null;
  }
  if (requireAll || body.body !== undefined) {
    if (!Array.isArray(body.body)) return { error: 'body must be an array of strings' };
    if (!body.body.every((p) => typeof p === 'string')) {
      return { error: 'body must contain only strings' };
    }
    out.body = body.body;
  }
  return { fields: out };
}

function toDocResponse(row) {
  let bodyArr = [];
  try { bodyArr = JSON.parse(row.body); if (!Array.isArray(bodyArr)) bodyArr = []; }
  catch { bodyArr = []; }
  return {
    id: row.id,
    categoryId: row.category_id,
    title: row.title,
    updated: row.updated,
    notes: row.notes,
    body: bodyArr,
    createdAt: row.created_at,
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

  const validated = validateDocBody(body, { requireAll: true });
  if (validated.error) return jsonError(validated.error, 400);
  const f = validated.fields;

  // Verify category ownership BEFORE insert: SELECT scoped by category id AND
  // owner_advisor_person_id in one WHERE. 404 covers both "no such category"
  // and "not your category" — same response, no existence probe.
  const owningCategory = await db
    .selectFrom('doc_category')
    .select(['id'])
    .where('id', '=', f.category_id)
    .where('owner_advisor_person_id', '=', person.id)
    .executeTakeFirst();
  if (!owningCategory) return jsonError('Category not found', 404);

  const id = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  try {
    await db.insertInto('doc').values({
      id,
      category_id: f.category_id,
      title: f.title,
      updated: nowIso,
      notes: f.notes ?? null,
      body: JSON.stringify(f.body),
      created_at: nowIso,
    }).execute();
  } catch (err) {
    return jsonError('Failed to save doc', 500);
  }

  const row = await db
    .selectFrom('doc')
    .select(['id', 'category_id', 'title', 'updated', 'notes', 'body', 'created_at'])
    .where('id', '=', id)
    .executeTakeFirst();
  return jsonOk(toDocResponse(row));
}

export { validateDocBody, toDocResponse };
