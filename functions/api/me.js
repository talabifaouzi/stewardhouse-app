// GET /api/me — the caller's own identity (auth_user + person.type/display_name).
// First SELECT query in functions/ — same Kysely-over-D1 pattern already proven by
// the (c) hook's UPDATE/INSERT statements in _lib/auth.js.
//
// Response shapes:
//   No session:                200, body null
//   Session, no person match:  200, body { user: { email }, person: null }
//   Session, matched:          200, body { user: { email }, person: { type, displayName } }
//
// person: null is defensive — the (c) hook always creates or claims a person row on
// sign-in, so this shouldn't happen in practice, but callers must not assume person
// is always present.

import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { makeAuth } from '../_lib/auth.js';

export async function onRequest(context) {
  const auth = makeAuth(context.env);

  const session = await auth.api.getSession({ headers: context.request.headers });

  if (!session || !session.user) {
    return new Response('null', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Kysely({
    dialect: new D1Dialect({ database: context.env.DB }),
  });

  const person = await db
    .selectFrom('person')
    .select(['type', 'display_name', 'extensions'])
    .where('auth_user_id', '=', session.user.id)
    .executeTakeFirst();

  let intake = null;
  if (person && person.extensions) {
    try {
      const parsed = JSON.parse(person.extensions);
      intake = parsed.individual ?? null;
    } catch {
      intake = null;
    }
  }

  const body = {
    user: { email: session.user.email },
    person: person ? { type: person.type, displayName: person.display_name, intake } : null,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
