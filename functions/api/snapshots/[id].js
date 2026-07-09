// DELETE /api/snapshots/:id — removes a cohort period snapshot (E-Slice
// E-Write-5, Q7). Gated dark per E11.
//
// Q7 / 0009 docblock: delete-and-re-snapshot is the RULED correction path for a
// snapshot ("A snapshot is a snapshot … If a correction is needed, delete the
// row and re-snapshot"). There is no UPDATE — a snapshot is immutable; a wrong
// one is deleted and a fresh one taken.
//
// Owner scope: the snapshot must belong to the operator's institution
// (institution_contact). 404 is IDENTICAL for "no such snapshot" and "exists
// but not this institution's" so a caller can't probe which ids exist.

import {
  makeDb, requireGatedEnterprise, jsonError, jsonOk,
} from '../../_lib/gate.js';

export async function onRequestDelete(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedEnterprise(db, context);
  if (error) return jsonError(error, status);

  const snapshotId = context.params.id;
  if (!snapshotId || typeof snapshotId !== 'string') {
    return jsonError('Invalid snapshot id', 400);
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

  const existing = await db
    .selectFrom('cohort_period_snapshot')
    .select(['id'])
    .where('id', '=', snapshotId)
    .where('institution_id', '=', contact.institution_id)
    .executeTakeFirst();
  if (!existing) {
    return jsonError('Snapshot not found', 404);
  }

  try {
    await db
      .deleteFrom('cohort_period_snapshot')
      .where('id', '=', snapshotId)
      .where('institution_id', '=', contact.institution_id)
      .execute();
  } catch (err) {
    return jsonError('Failed to remove snapshot', 500);
  }

  return jsonOk({ id: snapshotId, deleted: true });
}
