// POST /api/client-notes — creates a client_note under an existing client
// owned by the signed-in advisor. Same ownership pre-check pattern as
// client-sessions.js. client_note.content is the most sensitive advisor-
// authored payload per section 6 - separate table (not JSON column) to keep
// row-level access + audit easier if a future per-note access control lands.

import {
  makeDb, requireGatedAdvisor, rejectRankKeys, jsonError, jsonOk,
} from '../_lib/gate.js';

function validateNoteBody(body) {
  const out = {};
  if (typeof body.clientId !== 'string' || !body.clientId) {
    return { error: 'clientId is required' };
  }
  out.client_id = body.clientId;
  if (typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return { error: 'date must be an ISO YYYY-MM-DD string' };
  }
  out.date = body.date;
  if (typeof body.content !== 'string' || body.content.trim().length === 0) {
    return { error: 'content is required' };
  }
  out.content = body.content.trim();
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      return { error: 'tags must be an array' };
    }
    if (!body.tags.every((t) => typeof t === 'string')) {
      return { error: 'tags must contain only strings' };
    }
    out.tags = body.tags;
  }
  return { fields: out };
}

function toNoteResponse(row) {
  const parse = (s) => { try { return JSON.parse(s); } catch { return []; } };
  return {
    id: row.id,
    clientId: row.client_id,
    date: row.date,
    content: row.content,
    tags: row.tags ? parse(row.tags) : [],
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

  const validated = validateNoteBody(body);
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
    await db.insertInto('client_note').values({
      id,
      client_id: f.client_id,
      date: f.date,
      content: f.content,
      tags: f.tags !== undefined ? JSON.stringify(f.tags) : null,
      created_at: nowIso,
    }).execute();
  } catch (err) {
    return jsonError('Failed to save note', 500);
  }

  const row = await db
    .selectFrom('client_note')
    .select(['id', 'client_id', 'date', 'content', 'tags', 'created_at'])
    .where('id', '=', id)
    .executeTakeFirst();
  return jsonOk(toNoteResponse(row));
}
