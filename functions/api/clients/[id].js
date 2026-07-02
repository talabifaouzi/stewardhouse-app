// PUT /api/clients/:id — updates a client owned by the signed-in advisor.
// Scoped by BOTH id AND owner_advisor_person_id in one WHERE — one advisor
// can never update another's client by guessing an id. Returns 404 for both
// "no such row" and "not yours" (identical response, no existence probe).
//
// name / stage / sport / etc. are all editable — client is a working record.
// No identity-field lock beyond the id itself.

import {
  makeDb, requireGatedAdvisor, rejectRankKeys, jsonError, jsonOk,
} from '../../_lib/gate.js';
import { validateClientBody, toClientResponse } from '../clients.js';

export async function onRequestPut(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedAdvisor(db, context);
  if (error) return jsonError(error, status);

  const clientId = context.params.id;
  if (!clientId || typeof clientId !== 'string') {
    return jsonError('Invalid client id', 400);
  }

  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Body must be an object', 400);
  }
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  const validated = validateClientBody(body, { requireAll: false });
  if (validated.error) return jsonError(validated.error, 400);
  const f = validated.fields;
  if (Object.keys(f).length === 0) {
    return jsonError('No editable fields provided', 400);
  }

  const set = {};
  if (f.name !== undefined) set.name = f.name;
  if (f.initials !== undefined) set.initials = f.initials;
  if (f.sport !== undefined) set.sport = f.sport;
  if (f.level !== undefined) set.level = f.level;
  if (f.stage !== undefined) set.stage = f.stage;
  if (f.relationship_started_year !== undefined) {
    set.relationship_started_year = f.relationship_started_year;
  }
  if (f.summary !== undefined) set.summary = f.summary;
  if (f.next_session_date !== undefined) set.next_session_date = f.next_session_date;
  if (f.giving_plan !== undefined) {
    set.giving_plan = f.giving_plan !== null ? JSON.stringify(f.giving_plan) : null;
  }
  if (f.next_session_agenda !== undefined) {
    set.next_session_agenda = f.next_session_agenda !== null
      ? JSON.stringify(f.next_session_agenda) : null;
  }
  if (f.pipeline_state !== undefined) {
    set.pipeline_state = f.pipeline_state !== null
      ? JSON.stringify(f.pipeline_state) : null;
  }
  set.updated_at = new Date().toISOString();

  let result;
  try {
    result = await db
      .updateTable('client')
      .set(set)
      .where('id', '=', clientId)
      .where('owner_advisor_person_id', '=', person.id)
      .executeTakeFirst();
  } catch (err) {
    return jsonError('Failed to update client', 500);
  }
  const updated = result && typeof result.numUpdatedRows === 'bigint'
    ? Number(result.numUpdatedRows)
    : (result?.numUpdatedRows ?? 0);
  if (updated === 0) return jsonError('Client not found', 404);

  const row = await db
    .selectFrom('client')
    .select([
      'id', 'name', 'initials', 'sport', 'level', 'stage',
      'relationship_started_year', 'summary', 'next_session_date',
      'giving_plan', 'next_session_agenda', 'pipeline_state',
      'created_at', 'updated_at',
    ])
    .where('id', '=', clientId)
    .executeTakeFirst();
  return jsonOk(toClientResponse(row));
}
