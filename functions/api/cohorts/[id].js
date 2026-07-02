// PUT /api/cohorts/:id — updates a cohort owned by the signed-in advisor.
// Scoped by BOTH id AND owner_advisor_person_id in one WHERE. 404 for both
// "not found" and "not yours".

import {
  makeDb, requireGatedAdvisor, rejectRankKeys, jsonError, jsonOk,
} from '../../_lib/gate.js';
import { validateCohortBody, toCohortResponse } from '../cohorts.js';

export async function onRequestPut(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedAdvisor(db, context);
  if (error) return jsonError(error, status);

  const cohortId = context.params.id;
  if (!cohortId || typeof cohortId !== 'string') return jsonError('Invalid cohort id', 400);

  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Body must be an object', 400);
  }
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  const validated = validateCohortBody(body, { requireAll: false });
  if (validated.error) return jsonError(validated.error, 400);
  const f = validated.fields;
  if (Object.keys(f).length === 0) return jsonError('No editable fields provided', 400);

  const set = {};
  if (f.name !== undefined) set.name = f.name;
  if (f.focus !== undefined) set.focus = f.focus;
  if (f.started !== undefined) set.started = f.started;
  if (f.next_session_date !== undefined) set.next_session_date = f.next_session_date;
  if (f.summary !== undefined) set.summary = f.summary;
  if (f.external_members !== undefined) set.external_members = f.external_members;
  if (f.assigned_lessons !== undefined) set.assigned_lessons = f.assigned_lessons ? JSON.stringify(f.assigned_lessons) : null;
  if (f.updates !== undefined) set.updates = f.updates ? JSON.stringify(f.updates) : null;
  if (f.sessions !== undefined) set.sessions = f.sessions ? JSON.stringify(f.sessions) : null;
  set.updated_at = new Date().toISOString();

  let result;
  try {
    result = await db
      .updateTable('cohort')
      .set(set)
      .where('id', '=', cohortId)
      .where('owner_advisor_person_id', '=', person.id)
      .executeTakeFirst();
  } catch (err) {
    return jsonError('Failed to update cohort', 500);
  }
  const updated = result && typeof result.numUpdatedRows === 'bigint'
    ? Number(result.numUpdatedRows)
    : (result?.numUpdatedRows ?? 0);
  if (updated === 0) return jsonError('Cohort not found', 404);

  const row = await db
    .selectFrom('cohort')
    .select([
      'id', 'name', 'focus', 'started', 'next_session_date', 'summary',
      'external_members', 'assigned_lessons', 'updates', 'sessions',
      'created_at', 'updated_at',
    ])
    .where('id', '=', cohortId)
    .executeTakeFirst();
  return jsonOk(toCohortResponse(row));
}
