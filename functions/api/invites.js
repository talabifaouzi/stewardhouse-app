// POST /api/invites — mints a claimable person row (the invite-creation form;
// the UI twin of scripts/seed-invites.mjs). Operations "Accounts" view CTA.
//
// GATED WRITE, requireGatedOps (Q5 write-twin): session → person →
// type==='ops' AND $.ops.demo_gate===1. Distinct from the O-3 READ gate
// requireOps (type-only) — writes stay dark on production until FT designates
// the ops person row with $.ops.demo_gate=true (its own --remote step).
//
// Export is onRequestPost ONLY — CF Pages auto-405s GET/PUT/DELETE. There is
// no invite edit/delete path in this slice.
//
// Request body (JSON): { email, type, displayName }
//   - email: required; NORMALIZED trim().toLowerCase() and must contain '@'.
//     The normalization is VERBATIM-IDENTICAL to the pre-send invite-gate seam
//     in functions/api/auth/[[route]].js (parsed.email.trim().toLowerCase())
//     and the (c) claim hook's match key. This is load-bearing: the gate admits
//     an address at send time by matching person.invite_email, and the claim
//     hook claims the row by the same key — a case/whitespace drift here would
//     silently break BOTH the allowlist and the claim. Same key, one shape.
//   - type: required, ∈ individual | staff | advisor | ops (ALLOWED_TYPES,
//     mirrors seed-invites.mjs).
//   - displayName: required, non-empty. A real name at insert time is
//     mandatory (browser-screening runbook §9 — a bespoke row without one
//     renders "New user" in Chrome).
//
// source_surface is DERIVED from type server-side, NEVER client-supplied:
//   individual→individual, advisor→advisor, staff→enterprise, ops→operations.
//
// Row written = the seed-invites.mjs 10-column shape (auth_user_id NULL,
// initials NULL, extensions '{"<surface>":{}}', soft_deleted_at/deletion_state
// NULL) PLUS created_at = now ISO (migration 0014).
//
// Response shapes:
//   No session:               401, { error: 'Not signed in' }
//   Session, no person:       403, { error: 'No account found for session' }
//   Session, non-ops/no gate: 403, { error: 'Not authorized' }
//   Invalid body:             400, { error: '<reason>' }
//   Duplicate invite_email:   409, { error: 'This address has already been invited.' }
//   Success:                  201, the GET /api/roster element shape + createdAt:
//     { id, displayName, type, sourceSurface, inviteEmail, pending, createdAt }

import { sql } from 'kysely';
import { makeDb, requireGatedOps, rejectRankKeys, jsonError, jsonOk } from '../_lib/gate.js';

const ALLOWED_TYPES = new Set(['individual', 'staff', 'advisor', 'ops']);

// type → source_surface. Server-derived; the client never supplies it.
const SOURCE_SURFACE_FOR_TYPE = {
  individual: 'individual',
  advisor: 'advisor',
  staff: 'enterprise',
  ops: 'operations',
};

export async function onRequestPost(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedOps(db, context);
  if (error) return jsonError(error, status);

  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Body must be an object', 400);
  }
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
  if (!displayName) return jsonError('A display name is required', 400);

  const type = body.type;
  if (!ALLOWED_TYPES.has(type)) {
    return jsonError(`type must be one of ${[...ALLOWED_TYPES].join(', ')}`, 400);
  }

  // Normalization VERBATIM-identical to the auth-gate seam (see docblock).
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email.includes('@')) {
    return jsonError('A valid email address is required', 400);
  }

  const sourceSurface = SOURCE_SURFACE_FOR_TYPE[type];
  const id = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  try {
    await db.insertInto('person').values({
      id,
      auth_user_id: null,
      display_name: displayName,
      initials: null,
      type,
      source_surface: sourceSurface,
      extensions: JSON.stringify({ [sourceSurface]: {} }),
      invite_email: email,
      soft_deleted_at: null,
      deletion_state: null,
      created_at: nowIso,
    }).execute();
  } catch (err) {
    // UNIQUE(invite_email) — this address is already on the allowlist.
    if (String(err && err.message).includes('UNIQUE')) {
      return jsonError('This address has already been invited.', 409);
    }
    return jsonError('Failed to create invite', 500);
  }

  const row = await db
    .selectFrom('person')
    .select((eb) => [
      'id', 'display_name', 'type', 'source_surface', 'invite_email', 'created_at',
      sql`(auth_user_id IS NULL)`.as('pending'),
    ])
    .where('id', '=', id)
    .executeTakeFirst();

  // 201 Created — a new resource (the invite/person row) was minted. (The
  // older write endpoints return 200 via jsonOk's default; this create is
  // deliberately REST-correct.)
  return jsonOk({
    id: row.id,
    displayName: row.display_name,
    type: row.type,
    sourceSurface: row.source_surface,
    inviteEmail: row.invite_email,
    pending: !!row.pending,
    createdAt: row.created_at,
  }, 201);
}
