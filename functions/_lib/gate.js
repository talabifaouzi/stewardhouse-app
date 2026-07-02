// Shared session-resolution + role-gate helpers for the /api/* endpoints.
//
// Two helpers:
//   getPersonForSession(db, context) — resolves the session's person row.
//     Returns { person } on success, or { error, status } on failure. Mirrors
//     the local helper already in functions/api/scenarios.js (kept there as
//     legacy duplicate; not migrated in this slice per "don't fix unrelated
//     issues inline"). Individual endpoints (intake.js, gifts.js) also inline
//     equivalent logic; a future DRY slice can migrate them here.
//   requireGatedAdvisor(db, context) — resolves the person AND enforces the
//     §6 option (b) role gate: type='advisor' AND
//     person.extensions.advisor.demo_gate=true. Same return shape.
//
// §6 gate marker (docs/advisor-persistence-schema-draft.md §6, lines 483-495):
// RULED option (b), role gate keyed on owning person row. Marker chosen for
// this build slice: person.extensions.advisor.demo_gate === true — sits
// alongside Morgan's 0008-seeded practiceProfile fields, additive. Non-gated
// advisor accounts fall through to 403 to keep pilot writes exclusively on
// FT-designated demo/staff rows until Q7 counsel unlocks the row-level
// allowlist upgrade.
//
// Q9 platform-wide guardrail: rejectRankKeys(body) returns the offending key
// name if the body contains any of rank / score / priority / suggestion /
// suggested / ordering / progression, else null. Endpoints that write to
// participant tables call this BEFORE their field allowlist check to fail
// fast + surface the exact key. Strengthens the DDL-comment invariant into
// runtime rejection at every write path in this slice; matches the Parker
// invariant hardened in every table's DDL (see migrations/0007).

import { Kysely, sql } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { makeAuth } from './auth.js';

const FORBIDDEN_KEYS = new Set([
  'rank', 'score', 'priority', 'suggestion', 'suggested',
  'ordering', 'progression',
]);

export function rejectRankKeys(body) {
  if (!body || typeof body !== 'object') return null;
  for (const key of Object.keys(body)) {
    if (FORBIDDEN_KEYS.has(key)) return key;
  }
  return null;
}

export function makeDb(context) {
  return new Kysely({ dialect: new D1Dialect({ database: context.env.DB }) });
}

export async function getPersonForSession(db, context) {
  const auth = makeAuth(context.env);
  const session = await auth.api.getSession({ headers: context.request.headers });
  if (!session || !session.user) return { error: 'Not signed in', status: 401 };
  const person = await db
    .selectFrom('person')
    .select(['id', 'type', 'extensions'])
    .where('auth_user_id', '=', session.user.id)
    .executeTakeFirst();
  if (!person) return { error: 'No account found for session', status: 403 };
  return { person };
}

export async function requireGatedAdvisor(db, context) {
  const resolved = await getPersonForSession(db, context);
  if (resolved.error) return resolved;
  const { person } = resolved;
  if (person.type !== 'advisor') {
    return { error: 'Not authorized', status: 403 };
  }
  // Read the demo_gate flag directly via json_extract — reading it back from
  // the row we already fetched would require parsing extensions JSON on every
  // request, which is fine but slightly slower and more brittle to null/malformed
  // JSON than a single json_extract that returns 1/0/null in one shot.
  const gateRow = await db
    .selectFrom('person')
    .select((eb) => [
      sql`json_extract(extensions, '$.advisor.demo_gate')`.as('gate'),
    ])
    .where('id', '=', person.id)
    .executeTakeFirst();
  // SQLite json_extract of a JSON boolean returns integer 1 (true) or 0 (false),
  // or NULL if path missing. Treat only integer 1 as passing.
  if (!gateRow || gateRow.gate !== 1) {
    return { error: 'Not authorized', status: 403 };
  }
  return { person };
}

export function jsonError(error, status) {
  return new Response(JSON.stringify({ error }), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}

export function jsonOk(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
