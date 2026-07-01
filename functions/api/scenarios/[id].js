// DELETE /api/scenarios/:id — deletes one of the signed-in user's saved
// scenarios. Scoped by BOTH id AND owner_person_id in the same WHERE clause
// (never trust the id alone) so one user can never delete another's row by
// guessing an id. Returns 404 for both "no such scenario" and "exists but
// isn't yours" — deliberately identical responses, so a caller can't use
// the error code to probe which ids exist.
//
// Schema note: scenario has zero inbound foreign keys (confirmed via full
// migration audit) — a single-row DELETE here has no cascade, no orphan,
// and no other side effect anywhere in the schema.

import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { makeAuth } from '../../_lib/auth.js';

export async function onRequestDelete(context) {
  const auth = makeAuth(context.env);
  const session = await auth.api.getSession({ headers: context.request.headers });

  if (!session || !session.user) {
    return new Response(JSON.stringify({ error: 'Not signed in' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Kysely({
    dialect: new D1Dialect({ database: context.env.DB }),
  });

  const person = await db
    .selectFrom('person')
    .select(['id'])
    .where('auth_user_id', '=', session.user.id)
    .executeTakeFirst();

  if (!person) {
    return new Response(JSON.stringify({ error: 'No account found for session' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  const scenarioId = context.params.id;
  if (!scenarioId || typeof scenarioId !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid scenario id' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  let result;
  try {
    result = await db
      .deleteFrom('scenario')
      .where('id', '=', scenarioId)
      .where('owner_person_id', '=', person.id)
      .executeTakeFirst();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to delete scenario' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const deletedCount = result && typeof result.numDeletedRows === 'bigint'
    ? Number(result.numDeletedRows)
    : (result?.numDeletedRows ?? 0);

  if (deletedCount === 0) {
    return new Response(JSON.stringify({ error: 'Scenario not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ id: scenarioId, deleted: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
