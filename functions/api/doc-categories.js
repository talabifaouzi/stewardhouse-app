// POST /api/doc-categories — creates a documentation-hub category owned by
// the signed-in advisor. UNIQUE(owner_advisor_person_id, label) is enforced
// at the DB (migration 0007) — a duplicate label surfaces here as a
// constraint failure which we translate to 400 "Category with that label
// already exists".
//
// Response shape: { id, label, hint, createdAt }.

import {
  makeDb, requireGatedAdvisor, rejectRankKeys, jsonError, jsonOk,
} from '../_lib/gate.js';

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

  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (!label) return jsonError('label is required', 400);
  const hint = typeof body.hint === 'string' && body.hint.trim()
    ? body.hint.trim() : null;

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    await db.insertInto('doc_category').values({
      id,
      owner_advisor_person_id: person.id,
      label,
      hint,
      created_at: createdAt,
    }).execute();
  } catch (err) {
    const msg = (err && err.message) || '';
    if (/UNIQUE/i.test(msg)) {
      return jsonError('Category with that label already exists', 400);
    }
    return jsonError('Failed to save category', 500);
  }

  return jsonOk({ id, label, hint, createdAt });
}
