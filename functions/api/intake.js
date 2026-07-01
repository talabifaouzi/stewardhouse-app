// POST /api/intake — partial-update the signed-in user's persisted intake
// answers. Writes to person.extensions.individual.* via SQLite's json_set,
// NOT read-modify-write — this avoids the lost-update race a
// select-parse-mutate-stringify-update pattern would have under concurrent
// writes (verified via local smoke test this session: json_set commits
// against the CURRENT row state per-statement, so two concurrent writes to
// different fields both land correctly; read-modify-write would let a
// slower write silently clobber a faster one's changes).
//
// Value-type handling (verified via local smoke test — see session notes):
//   - strings: plain bound parameter
//   - arrays (causes, geo): must be JSON.stringify()'d then wrapped in
//     SQLite's json(...) function, or they land as an escaped STRING
//     instead of a real JSON array (confirmed bug, now avoided)
//   - booleans (intakeComplete): must be wrapped in json('true'/'false'),
//     or they land as the STRING "true" instead of the JSON boolean true
//
// Field-name allowlist: ONLY the 16 paths below are writable. This is a
// deliberate security boundary — without it, a crafted request could target
// arbitrary keys inside the same extensions JSON blob, including
// legacy_individual_id or other unrelated top-level keys used elsewhere in
// the schema.

import { Kysely, sql } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { makeAuth } from '../_lib/auth.js';

const STRING_FIELDS = new Set([
  'stage', 'authority', 'geoDetail', 'lived', 'influence',
  'visibility', 'trust', 'budget', 'depth', 'existingOrgs', 'legacy',
  'givingStyle', 'worldLabel',
]);
const ARRAY_FIELDS = new Set(['causes', 'geo']);
const BOOLEAN_FIELDS = new Set(['intakeComplete']);
const ALL_ALLOWED = new Set([...STRING_FIELDS, ...ARRAY_FIELDS, ...BOOLEAN_FIELDS]);

export async function onRequestPost(context) {
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

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return new Response(JSON.stringify({ error: 'Body must be an object of field: value pairs' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const entries = Object.entries(body);
  if (entries.length === 0) {
    return new Response(JSON.stringify({ error: 'No fields provided' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const rejected = entries.filter(([key]) => !ALL_ALLOWED.has(key));
  if (rejected.length > 0) {
    return new Response(JSON.stringify({
      error: `Unknown field(s): ${rejected.map(([k]) => k).join(', ')}`,
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const fragments = [];
  for (const [key, value] of entries) {
    const path = `$.individual.${key}`;
    if (ARRAY_FIELDS.has(key)) {
      if (!Array.isArray(value)) {
        return new Response(JSON.stringify({ error: `${key} must be an array` }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
      fragments.push(sql`${path}, json(${JSON.stringify(value)})`);
    } else if (BOOLEAN_FIELDS.has(key)) {
      fragments.push(sql`${path}, json(${value ? 'true' : 'false'})`);
    } else {
      if (typeof value !== 'string') {
        return new Response(JSON.stringify({ error: `${key} must be a string` }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
      fragments.push(sql`${path}, ${value}`);
    }
  }

  const setExpr = sql`json_set(coalesce(extensions, '{}'), ${sql.join(fragments, sql`, `)})`;

  try {
    await db
      .updateTable('person')
      .set({ extensions: setExpr })
      .where('id', '=', person.id)
      .execute();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to save' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
