// PUT /api/practice-profile — updates the signed-in advisor's practice
// profile fields inside person.extensions.advisor.* via json_set. Field
// allowlist: practiceName, advisorTitle, practiceFocus ONLY. Empty string
// is a permitted value (advisor clearing a field).
//
// NAMESPACE RISK (must be understood before touching this file):
// person.extensions.advisor.demo_gate is the role-gate marker per schema-
// draft §6 (as amended in write slice 1). It lives at the same JSON
// namespace ($.advisor.*) as the user-editable profile fields. The
// field allowlist below is the ONLY barrier keeping a PUT from writing
// $.advisor.demo_gate — because json_set only writes the paths it's given,
// and the paths are built from the closed allowlist set, the key
// `demo_gate` cannot appear in the emitted SQL regardless of payload.
// NEVER add fields to this allowlist casually; every addition is a new
// path the endpoint can write, and any name collision with a future
// server-only $.advisor.* key would be a real security break.
//
// STRUCTURAL FIX (documented debt): the correct long-term shape is a
// dedicated namespace for gate state — either $.gate.* on person.extensions
// or a first-class column like `person.demo_gate BOOLEAN`. That refactor
// is deferred to the Q7-resolution allowlist upgrade when the role gate
// matures into option (c) per-practice allowlist per schema-draft §6.
//
// Response: same 3-key shape /api/me emits for advisor.practiceProfile
// (practiceName, advisorTitle, practiceFocus — no yearsActive, no
// demo_gate, ever).

import { sql } from 'kysely';
import {
  makeDb, requireGatedAdvisor, rejectRankKeys, jsonError, jsonOk,
} from '../_lib/gate.js';

const PROFILE_FIELDS = new Set(['practiceName', 'advisorTitle', 'practiceFocus']);

export async function onRequestPut(context) {
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

  // Reject any key outside the profile allowlist EXPLICITLY — surfaces the
  // exact offending key back to the caller AND (critically) refuses
  // demo_gate + any other future $.advisor.* server-only key by name.
  const entries = Object.entries(body);
  if (entries.length === 0) return jsonError('No fields provided', 400);
  const invalid = entries.find(([k]) => !PROFILE_FIELDS.has(k));
  if (invalid) return jsonError(`Field "${invalid[0]}" is not permitted`, 400);

  // Empty string is permitted (clear a field). null is treated as clear
  // for symmetry. Any non-string non-null value is a type error.
  const fragments = [];
  for (const [key, rawValue] of entries) {
    if (rawValue !== null && typeof rawValue !== 'string') {
      return jsonError(`${key} must be a string or null`, 400);
    }
    const value = rawValue === null ? '' : rawValue.trim();
    const path = `$.advisor.${key}`;
    fragments.push(sql`${path}, ${value}`);
  }

  const setExpr = sql`json_set(coalesce(extensions, '{}'), ${sql.join(fragments, sql`, `)})`;

  try {
    await db
      .updateTable('person')
      .set({ extensions: setExpr })
      .where('id', '=', person.id)
      .execute();
  } catch (err) {
    return jsonError('Failed to save practice profile', 500);
  }

  // Re-read only the 3 allowed fields to build the response — same shape
  // /api/me returns.
  const row = await db
    .selectFrom('person')
    .select((eb) => [
      sql`json_extract(extensions, '$.advisor.practiceName')`.as('practiceName'),
      sql`json_extract(extensions, '$.advisor.advisorTitle')`.as('advisorTitle'),
      sql`json_extract(extensions, '$.advisor.practiceFocus')`.as('practiceFocus'),
    ])
    .where('id', '=', person.id)
    .executeTakeFirst();

  return jsonOk({
    practiceName: row?.practiceName ?? null,
    advisorTitle: row?.advisorTitle ?? null,
    practiceFocus: row?.practiceFocus ?? null,
  });
}
