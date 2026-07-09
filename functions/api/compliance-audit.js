// POST /api/compliance-audit — records a MANUAL compliance-audit entry
// (E-Slice E-Write-4, E7). Gated dark per E11: requireGatedEnterprise → 403
// unless the staff person carries $.enterprise.demo_gate=true.
//
// E7 APPEND-ONLY CONTRACT (verbatim, migration 0009): "The endpoint contract
// for /api/compliance-audit accepts POST ONLY. PUT and DELETE return 405 Method
// Not Allowed. UPDATE and DELETE are not part of the endpoint contract." This
// file exports ONLY onRequestPost — CF Pages Functions returns 405 for every
// other method automatically, which IS the enforcement (Q3 ruling: nothing more
// than method restriction + this docblock; D1 has no triggers, so endpoint-layer
// is authoritative).
//
// Parker no-lifecycle beyond append-only: an audit row is immutable — no status
// column, no update column, no updated_at. There is deliberately no read/update/
// delete handler here.
//
// This endpoint covers MANUAL entries (e.g. "Quarterly compliance review
// completed") that are not tied to another mutating write. Structural actions
// (exclusion add/remove) auto-log their audit row inside the exclusion write's
// batch (see functions/api/exclusions.js) — never through this endpoint.
//
// user_role is resolved + frozen at write time by prepareAuditInsert (E7).

import {
  makeDb, requireGatedEnterprise, rejectRankKeys, jsonError, jsonOk,
} from '../_lib/gate.js';
import { prepareAuditInsert, toAuditElement } from '../_lib/audit.js';

function validateAuditBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Body must be an object' };
  }
  const out = {};
  if (typeof body.action !== 'string' || body.action.trim().length === 0) {
    return { error: 'action is required' };
  }
  out.action = body.action.trim();
  for (const k of ['target', 'reason', 'notes']) {
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

  const validated = validateAuditBody(body);
  if (validated.error) return jsonError(validated.error, 400);
  const f = validated.fields;

  // Owner scope: institution from the session's institution_contact.
  const contact = await db
    .selectFrom('institution_contact')
    .select(['institution_id', 'is_default_operator'])
    .where('person_id', '=', person.id)
    .orderBy('is_default_operator', 'desc')
    .executeTakeFirst();
  if (!contact) {
    return jsonError('No institution is associated with this operator', 403);
  }

  const { insert, row, userDisplay } = await prepareAuditInsert(db, {
    institutionId: contact.institution_id,
    userPersonId: person.id,
    action: f.action,
    target: f.target ?? null,
    reason: f.reason ?? null,
    notes: f.notes ?? null,
  });

  try {
    await insert.execute();
  } catch (err) {
    return jsonError('Failed to record audit entry', 500);
  }

  return jsonOk(toAuditElement(row, userDisplay));
}
