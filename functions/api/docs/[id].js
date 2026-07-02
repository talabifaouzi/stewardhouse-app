// PUT /api/docs/:id — updates a doc owned (transitively) by the signed-in
// advisor. Ownership check: SELECT doc JOIN doc_category → verify category's
// owner_advisor_person_id = person.id. 404 for both "not found" and "not
// yours". Scoping via inner JOIN so we don't leak existence.
//
// Editable fields: title, notes, body, categoryId (move between advisor's
// own categories — target category ownership re-checked). updated auto-set
// server-side.

import {
  makeDb, requireGatedAdvisor, rejectRankKeys, jsonError, jsonOk,
} from '../../_lib/gate.js';
import { validateDocBody, toDocResponse } from '../docs.js';

export async function onRequestPut(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedAdvisor(db, context);
  if (error) return jsonError(error, status);

  const docId = context.params.id;
  if (!docId || typeof docId !== 'string') return jsonError('Invalid doc id', 400);

  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Body must be an object', 400);
  }
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  const validated = validateDocBody(body, { requireAll: false });
  if (validated.error) return jsonError(validated.error, 400);
  const f = validated.fields;
  if (Object.keys(f).length === 0) return jsonError('No editable fields provided', 400);

  // Ownership check on the doc's CURRENT category — inner join to
  // doc_category, scope by owner_advisor_person_id.
  const ownedDoc = await db
    .selectFrom('doc')
    .innerJoin('doc_category', 'doc_category.id', 'doc.category_id')
    .select(['doc.id'])
    .where('doc.id', '=', docId)
    .where('doc_category.owner_advisor_person_id', '=', person.id)
    .executeTakeFirst();
  if (!ownedDoc) return jsonError('Doc not found', 404);

  // If categoryId is being changed, verify the TARGET category is also owned.
  if (f.category_id !== undefined) {
    const targetCategory = await db
      .selectFrom('doc_category')
      .select(['id'])
      .where('id', '=', f.category_id)
      .where('owner_advisor_person_id', '=', person.id)
      .executeTakeFirst();
    if (!targetCategory) return jsonError('Target category not found', 404);
  }

  const set = {};
  if (f.category_id !== undefined) set.category_id = f.category_id;
  if (f.title !== undefined) set.title = f.title;
  if (f.notes !== undefined) set.notes = f.notes;
  if (f.body !== undefined) set.body = JSON.stringify(f.body);
  set.updated = new Date().toISOString();

  let result;
  try {
    result = await db
      .updateTable('doc')
      .set(set)
      .where('id', '=', docId)
      .executeTakeFirst();
  } catch (err) {
    return jsonError('Failed to update doc', 500);
  }
  const updated = result && typeof result.numUpdatedRows === 'bigint'
    ? Number(result.numUpdatedRows)
    : (result?.numUpdatedRows ?? 0);
  if (updated === 0) return jsonError('Doc not found', 404);

  const row = await db
    .selectFrom('doc')
    .select(['id', 'category_id', 'title', 'updated', 'notes', 'body', 'created_at'])
    .where('id', '=', docId)
    .executeTakeFirst();
  return jsonOk(toDocResponse(row));
}
