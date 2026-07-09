// DELETE /api/exclusions/:id — hard-removes an exclusion from the operator's
// institution list (E-Slice E-Write-4, E8 / Q1). Gated dark per E11.
//
// Q1 ruling: removal is a HARD DELETE, not a 'lifted' status flip (the exclusion
// table carries no lifecycle column — migration 0009 docblock: "if an exclusion
// is later removed, it is DELETED, not marked 'lifted' via a status column").
//
// Owner scope: the exclusion must belong to the operator's institution
// (institution_contact). 404 is IDENTICAL for "no such exclusion" and "exists
// but not this institution's" so a caller can't probe which ids exist.
//
// Q2 AUTO-LOG: the exclusion DELETE and its removal audit INSERT run as ONE
// env.DB.batch() (D1 implicit transaction). The org name is captured from the
// scoped SELECT BEFORE the delete, so the audit target survives the row's
// removal ("Removed organization from exclusion list", target = name).
//
// Response: { id, deleted: true, auditEntry: <element> } so the provider drops
// the exclusion and prepends the removal audit row without a refetch.

import {
  makeDb, requireGatedEnterprise, jsonError, jsonOk,
} from '../../_lib/gate.js';
import { prepareAuditInsert, toAuditElement } from '../../_lib/audit.js';

export async function onRequestDelete(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedEnterprise(db, context);
  if (error) return jsonError(error, status);

  const exclusionId = context.params.id;
  if (!exclusionId || typeof exclusionId !== 'string') {
    return jsonError('Invalid exclusion id', 400);
  }

  const contact = await db
    .selectFrom('institution_contact')
    .select(['institution_id', 'is_default_operator'])
    .where('person_id', '=', person.id)
    .orderBy('is_default_operator', 'desc')
    .executeTakeFirst();
  if (!contact) {
    return jsonError('No institution is associated with this operator', 403);
  }

  // Scope by id AND institution; capture the name BEFORE deleting (audit target).
  const existing = await db
    .selectFrom('exclusion')
    .select(['id', 'name'])
    .where('id', '=', exclusionId)
    .where('institution_id', '=', contact.institution_id)
    .executeTakeFirst();
  if (!existing) {
    return jsonError('Exclusion not found', 404);
  }

  const exclusionDelete = db
    .deleteFrom('exclusion')
    .where('id', '=', exclusionId)
    .where('institution_id', '=', contact.institution_id);

  const { insert: auditInsert, row: auditRow, userDisplay } = await prepareAuditInsert(db, {
    institutionId: contact.institution_id,
    userPersonId: person.id,
    action: 'Removed organization from exclusion list',
    target: existing.name,
  });

  const compiled = [exclusionDelete.compile(), auditInsert.compile()];
  try {
    await context.env.DB.batch(
      compiled.map((c) => context.env.DB.prepare(c.sql).bind(...c.parameters)),
    );
  } catch (err) {
    return jsonError('Failed to remove exclusion', 500);
  }

  return jsonOk({
    id: exclusionId,
    deleted: true,
    auditEntry: toAuditElement(auditRow, userDisplay),
  });
}
