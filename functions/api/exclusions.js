// POST /api/exclusions — adds an org to the operator's institution exclusion
// list (E-Slice E-Write-4, E8). Gated dark per E11: requireGatedEnterprise →
// 403 unless the staff person carries $.enterprise.demo_gate=true.
//
// Owner scope: institution_id from the session's institution_contact, NEVER the
// body. flagged_at is server-set to today.
//
// Q2 AUTO-LOG: the exclusion INSERT and its compliance_audit INSERT run as ONE
// env.DB.batch() — a D1 implicit transaction (the E-Write-2 idiom). The audit
// row ("Added organization to exclusion list", target = the org name) is written
// atomically with the exclusion: either both land or neither does. The audit
// endpoint is never called for this; the structural action logs itself here.
//
// Q4 / E8: connection_detail is free text with NO server-side content
// validation — the "public-record name + role only, never relational
// descriptors" convention is undetectable at the endpoint (authoring discipline;
// the field-adjacent caution copy lives in AddExclusionModal). connection_detail
// is emitted ONLY to the staff /api/me read (never-emit everywhere else per E8).
//
// Response: { exclusion: <element>, auditEntry: <element> } so the provider
// splices BOTH the new exclusion and the audit row without a refetch.

import {
  makeDb, requireGatedEnterprise, rejectRankKeys, jsonError, jsonOk,
} from '../_lib/gate.js';
import { prepareAuditInsert, toAuditElement } from '../_lib/audit.js';

// Columns selected for the round-trip + /api/me exclusions read.
export const EXCLUSION_ELEMENT_COLUMNS = [
  'id', 'name', 'ein', 'reason', 'flagged_at', 'connection', 'connection_detail',
];

export function toExclusionElement(row) {
  return {
    id: row.id,
    name: row.name,
    ein: row.ein,
    reason: row.reason,
    flagged: row.flagged_at,          // ISO YYYY-MM-DD; fixture key parity
    connection: row.connection,
    connectionDetail: row.connection_detail,   // E8 never-emit side; staff-only read
  };
}

function validateExclusionBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Body must be an object' };
  }
  const out = {};
  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    return { error: 'name is required' };
  }
  out.name = body.name.trim();
  if (typeof body.reason !== 'string' || body.reason.trim().length === 0) {
    return { error: 'reason is required' };
  }
  out.reason = body.reason.trim();
  for (const k of ['ein', 'connection', 'connectionDetail']) {
    if (body[k] !== undefined) {
      if (body[k] !== null && typeof body[k] !== 'string') {
        return { error: `${k} must be a string or null` };
      }
      out[k] = typeof body[k] === 'string' ? body[k].trim() : body[k];
    }
  }
  return { fields: out };
}

export async function onRequestPost(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedEnterprise(db, context);
  if (error) return jsonError(error, status);

  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  const validated = validateExclusionBody(body);
  if (validated.error) return jsonError(validated.error, 400);
  const f = validated.fields;

  const contact = await db
    .selectFrom('institution_contact')
    .select(['institution_id', 'is_default_operator'])
    .where('person_id', '=', person.id)
    .orderBy('is_default_operator', 'desc')
    .executeTakeFirst();
  if (!contact) {
    return jsonError('No institution is associated with this operator', 403);
  }

  const id = crypto.randomUUID();
  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);

  const exclusionInsert = db.insertInto('exclusion').values({
    id,
    institution_id: contact.institution_id,
    name: f.name,
    ein: f.ein ?? null,
    reason: f.reason,
    flagged_at: today,                 // server-set
    connection: f.connection ?? null,
    connection_detail: f.connectionDetail ?? null,
    created_at: nowIso,
    updated_at: nowIso,
  });

  // Q2: auto-logged audit row, batched atomically with the exclusion insert.
  const { insert: auditInsert, row: auditRow, userDisplay } = await prepareAuditInsert(db, {
    institutionId: contact.institution_id,
    userPersonId: person.id,
    action: 'Added organization to exclusion list',
    target: f.name,
  });

  const compiled = [exclusionInsert.compile(), auditInsert.compile()];
  try {
    await context.env.DB.batch(
      compiled.map((c) => context.env.DB.prepare(c.sql).bind(...c.parameters)),
    );
  } catch (err) {
    return jsonError('Failed to save exclusion', 500);
  }

  const row = await db
    .selectFrom('exclusion')
    .select(EXCLUSION_ELEMENT_COLUMNS)
    .where('id', '=', id)
    .executeTakeFirst();

  return jsonOk({
    exclusion: toExclusionElement(row),
    auditEntry: toAuditElement(auditRow, userDisplay),
  });
}
