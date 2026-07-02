// PUT /api/practice-content/:id — updates a practice_lesson owned by the
// signed-in advisor. Scoped by BOTH id AND owner_advisor_person_id in one
// WHERE — one advisor can never update another's row by guessing an id.
// Returns 404 for both "no such row" and "not yours" (identical response;
// no existence probe). Only authoring fields are settable — kind + baseId
// are identity, immutable post-create. Q9-guarded via rejectRankKeys.

import {
  makeDb, requireGatedAdvisor, rejectRankKeys, jsonError, jsonOk,
} from '../../_lib/gate.js';
import { validateLessonBody, toResponseShape } from '../practice-content.js';

export async function onRequestPut(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedAdvisor(db, context);
  if (error) return jsonError(error, status);

  const lessonId = context.params.id;
  if (!lessonId || typeof lessonId !== 'string') {
    return jsonError('Invalid lesson id', 400);
  }

  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Body must be an object', 400);
  }
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  // Reject identity-field edits — kind + baseId set at create time.
  if (body.kind !== undefined) return jsonError('kind is not editable', 400);
  if (body.baseId !== undefined) return jsonError('baseId is not editable', 400);

  const validated = validateLessonBody(body, { requireAll: false });
  if (validated.error) return jsonError(validated.error, 400);
  const f = validated.fields;
  if (Object.keys(f).length === 0) return jsonError('No editable fields provided', 400);

  const set = {};
  if (f.status !== undefined) set.status = f.status;
  if (f.title !== undefined) set.title = f.title;
  if (f.minutes !== undefined) set.minutes = f.minutes;
  if (f.scope !== undefined) set.scope = f.scope;
  if (f.category !== undefined) set.category = f.category;
  if (f.summary !== undefined) set.summary = f.summary;
  if (f.materials !== undefined) set.materials = f.materials ? JSON.stringify(f.materials) : null;
  set.updated_at = new Date().toISOString();

  let result;
  try {
    result = await db
      .updateTable('practice_lesson')
      .set(set)
      .where('id', '=', lessonId)
      .where('owner_advisor_person_id', '=', person.id)
      .executeTakeFirst();
  } catch (err) {
    return jsonError('Failed to update lesson', 500);
  }
  const updated = result && typeof result.numUpdatedRows === 'bigint'
    ? Number(result.numUpdatedRows)
    : (result?.numUpdatedRows ?? 0);
  if (updated === 0) return jsonError('Lesson not found', 404);

  const row = await db
    .selectFrom('practice_lesson')
    .select([
      'id', 'kind', 'base_id', 'status', 'title', 'minutes', 'scope',
      'category', 'summary', 'materials', 'created_at', 'updated_at',
    ])
    .where('id', '=', lessonId)
    .executeTakeFirst();
  return jsonOk(toResponseShape(row));
}
