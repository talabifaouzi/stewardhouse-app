// /api/cohort-members — POST adds a cohort_member row, DELETE removes one.
// Body on BOTH: { cohortId, clientId }. DELETE with body is nonstandard but
// supported by CF Pages Functions (context.request.json() works on DELETE
// the same as POST), and cleaner than trailing /:cohortId/:clientId path
// segments for a composite-key junction table.
//
// DUAL ownership check: cohort_member has NO owner_advisor_person_id column
// - ownership is transitive through BOTH the cohort AND the client (0007
// DDL). Both must belong to the session advisor. Otherwise a compromised
// or curious advisor could (a) add their own client to another advisor's
// cohort or (b) add another advisor's client to their own cohort - either
// direction is a real data leak.
//
// Two scoped SELECTs run BEFORE any junction write. 404 is identical for
// either side failing - no existence probe, no side-probe. Duplicate
// membership on POST surfaces as SQLite PRIMARY KEY violation, translated
// to 400 "Already a member".
//
// joined_at is server-set at INSERT time - not accepted from the body.

import {
  makeDb, requireGatedAdvisor, rejectRankKeys, jsonError, jsonOk,
} from '../_lib/gate.js';

async function verifyDualOwnership(db, personId, cohortId, clientId) {
  const cohortRow = await db
    .selectFrom('cohort')
    .select(['id'])
    .where('id', '=', cohortId)
    .where('owner_advisor_person_id', '=', personId)
    .executeTakeFirst();
  if (!cohortRow) return false;
  const clientRow = await db
    .selectFrom('client')
    .select(['id'])
    .where('id', '=', clientId)
    .where('owner_advisor_person_id', '=', personId)
    .executeTakeFirst();
  if (!clientRow) return false;
  return true;
}

function parseIds(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Body must be an object' };
  }
  const { cohortId, clientId } = body;
  if (typeof cohortId !== 'string' || !cohortId) {
    return { error: 'cohortId is required' };
  }
  if (typeof clientId !== 'string' || !clientId) {
    return { error: 'clientId is required' };
  }
  return { cohortId, clientId };
}

export async function onRequestPost(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedAdvisor(db, context);
  if (error) return jsonError(error, status);

  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  const ids = parseIds(body);
  if (ids.error) return jsonError(ids.error, 400);

  const owned = await verifyDualOwnership(db, person.id, ids.cohortId, ids.clientId);
  if (!owned) return jsonError('Cohort or client not found', 404);

  const joinedAt = new Date().toISOString();

  try {
    await db.insertInto('cohort_member').values({
      cohort_id: ids.cohortId,
      client_id: ids.clientId,
      joined_at: joinedAt,
    }).execute();
  } catch (err) {
    const msg = (err && err.message) || '';
    // Composite PK violation - membership row already exists.
    if (/UNIQUE|PRIMARY KEY/i.test(msg)) {
      return jsonError('Already a member', 400);
    }
    return jsonError('Failed to add member', 500);
  }

  return jsonOk({
    cohortId: ids.cohortId,
    clientId: ids.clientId,
    joinedAt,
  });
}

export async function onRequestDelete(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedAdvisor(db, context);
  if (error) return jsonError(error, status);

  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  const ids = parseIds(body);
  if (ids.error) return jsonError(ids.error, 400);

  const owned = await verifyDualOwnership(db, person.id, ids.cohortId, ids.clientId);
  if (!owned) return jsonError('Cohort or client not found', 404);

  let result;
  try {
    result = await db
      .deleteFrom('cohort_member')
      .where('cohort_id', '=', ids.cohortId)
      .where('client_id', '=', ids.clientId)
      .executeTakeFirst();
  } catch (err) {
    return jsonError('Failed to remove member', 500);
  }
  const deleted = result && typeof result.numDeletedRows === 'bigint'
    ? Number(result.numDeletedRows)
    : (result?.numDeletedRows ?? 0);
  if (deleted === 0) return jsonError('Cohort or client not found', 404);

  return jsonOk({
    cohortId: ids.cohortId,
    clientId: ids.clientId,
    deleted: true,
  });
}
