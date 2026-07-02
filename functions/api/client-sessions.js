// POST /api/client-sessions — creates a client_session record under an
// existing client owned by the signed-in advisor. Ownership pattern mirrors
// docs.js's category-ownership pre-check: scoped SELECT on client
// (id AND owner_advisor_person_id) before INSERT. 404 for both "no such
// client" and "not your client" — same response, no existence probe.
//
// Nested JSON columns (decisions, action_items) are always-replaced-whole
// per Q8 ruling. session records are historical artifacts — no lifecycle
// state on the row itself, only date + narrative + JSON extras.

import {
  makeDb, requireGatedAdvisor, rejectRankKeys, jsonError, jsonOk,
} from '../_lib/gate.js';

function validateSessionBody(body) {
  const out = {};
  if (typeof body.clientId !== 'string' || !body.clientId) {
    return { error: 'clientId is required' };
  }
  out.client_id = body.clientId;
  if (typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return { error: 'date must be an ISO YYYY-MM-DD string' };
  }
  out.date = body.date;
  if (body.title !== undefined) {
    if (body.title !== null && typeof body.title !== 'string') {
      return { error: 'title must be a string or null' };
    }
    out.title = body.title;
  }
  if (body.summary !== undefined) {
    if (body.summary !== null && typeof body.summary !== 'string') {
      return { error: 'summary must be a string or null' };
    }
    out.summary = body.summary;
  }
  if (body.decisions !== undefined) {
    if (!Array.isArray(body.decisions)) {
      return { error: 'decisions must be an array' };
    }
    if (!body.decisions.every((d) => typeof d === 'string')) {
      return { error: 'decisions must contain only strings' };
    }
    out.decisions = body.decisions;
  }
  if (body.actionItems !== undefined) {
    if (!Array.isArray(body.actionItems)) {
      return { error: 'actionItems must be an array' };
    }
    if (!body.actionItems.every((a) => typeof a === 'string')) {
      return { error: 'actionItems must contain only strings' };
    }
    out.action_items = body.actionItems;
  }
  return { fields: out };
}

function toSessionResponse(row) {
  const parse = (s) => { try { return JSON.parse(s); } catch { return []; } };
  return {
    id: row.id,
    clientId: row.client_id,
    date: row.date,
    title: row.title,
    summary: row.summary,
    decisions: row.decisions ? parse(row.decisions) : [],
    actionItems: row.action_items ? parse(row.action_items) : [],
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

  const validated = validateSessionBody(body);
  if (validated.error) return jsonError(validated.error, 400);
  const f = validated.fields;

  const owningClient = await db
    .selectFrom('client')
    .select(['id'])
    .where('id', '=', f.client_id)
    .where('owner_advisor_person_id', '=', person.id)
    .executeTakeFirst();
  if (!owningClient) return jsonError('Client not found', 404);

  const id = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  try {
    await db.insertInto('client_session').values({
      id,
      client_id: f.client_id,
      date: f.date,
      title: f.title ?? null,
      summary: f.summary ?? null,
      decisions: f.decisions !== undefined ? JSON.stringify(f.decisions) : null,
      action_items: f.action_items !== undefined ? JSON.stringify(f.action_items) : null,
      created_at: nowIso,
    }).execute();
  } catch (err) {
    return jsonError('Failed to save session', 500);
  }

  const row = await db
    .selectFrom('client_session')
    .select([
      'id', 'client_id', 'date', 'title', 'summary',
      'decisions', 'action_items', 'created_at',
    ])
    .where('id', '=', id)
    .executeTakeFirst();
  return jsonOk(toSessionResponse(row));
}
