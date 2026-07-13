// GET /api/roster — the live Operations roster (O-3, Ruling 1.1 live-gated
// mode; scoping at docs/operations-roster-scoping.md).
//
// GATED READ, ops-type only (Q5): requireOps enforces session → person →
// type==='ops' server-side (the client-side RequireType guard on
// /app/operations is not sufficient on its own for a data endpoint). No
// demo_gate — being ops-typed IS the gate for the read; the future invite
// WRITE endpoint gets a $.ops.demo_gate twin. Pattern mirrors gifts.js's
// onRequestGet (session-gated list), swapping ownership scope for the ops gate.
//
// Export is onRequestGet ONLY — Cloudflare Pages Functions auto-405s POST/PUT/
// DELETE. The roster is read-only until the invite-form slice adds writes.
//
// Response shapes:
//   No session:               401, { error: 'Not signed in' }
//   Session, no person match:  403, { error: 'No account found for session' }
//   Session, non-ops:          403, { error: 'Not authorized' }
//   Success:                   200, { roster: [ { id, displayName, type,
//     sourceSurface, inviteEmail, pending } ] }  (pending = boolean, true when
//     the account is unclaimed/invited — auth_user_id IS NULL)
//
// Row scope (FT-ruled):
//   - soft_deleted_at IS NULL — deleted persons never appear.
//   - invite_email IS NULL OR NOT LIKE '%.invalid' — the RFC 2606 `.invalid`
//     TLD is the synthetic-seed marker (the demo-roster identities
//     demo-*@example.invalid); the §7 LIVE-honesty boundary requires that
//     fictional seed identities NEVER render as live rows in the operator
//     view. A NULL invite_email row (e.g. the restored standalone Marcus) is
//     kept — it is a real account row with no invite address, rendered "—".
//   - ORDER BY type, then display_name COLLATE NOCASE (case-insensitive).
//   - NO pagination — deliberate at pilot scale; revisit ~200 rows.
//
// No `created_at` / "Added" column: the person table has no such column
// (see migrations 0001/0004). Row-creation timestamps arrive with the
// invite-form slice (which owns the person-row write path); the roster's
// "Added" column is deferred until then and is not part of this response.

import { sql } from 'kysely';
import { makeDb, requireOps, jsonError, jsonOk } from '../_lib/gate.js';

export async function onRequestGet(context) {
  const db = makeDb(context);

  const resolved = await requireOps(db, context);
  if (resolved.error) return jsonError(resolved.error, resolved.status);

  const rows = await db
    .selectFrom('person')
    .select((eb) => [
      'id', 'display_name', 'type', 'source_surface', 'invite_email',
      sql`(auth_user_id IS NULL)`.as('pending'),
    ])
    .where('soft_deleted_at', 'is', null)
    .where((eb) => eb.or([
      eb('invite_email', 'is', null),
      eb('invite_email', 'not like', '%.invalid'),
    ]))
    .orderBy('type')
    .orderBy(sql`display_name COLLATE NOCASE`)
    .execute();

  const roster = rows.map((row) => ({
    id: row.id,
    displayName: row.display_name,
    type: row.type,
    sourceSurface: row.source_surface,
    inviteEmail: row.invite_email,
    pending: !!row.pending,
  }));

  return jsonOk({ roster });
}
