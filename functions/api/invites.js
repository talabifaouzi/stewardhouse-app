// POST /api/invites — mints a claimable person row (the invite-creation form;
// the UI twin of scripts/seed-invites.mjs). Operations "Accounts" view CTA.
//
// GATED WRITE, requireGatedOps (Q5 write-twin): session → person →
// type==='ops' AND $.ops.demo_gate===1. Distinct from the O-3 READ gate
// requireOps (type-only) — writes stay dark on production until FT designates
// the ops person row with $.ops.demo_gate=true (its own --remote step).
//
// Export is onRequestPost ONLY — CF Pages auto-405s GET/PUT/DELETE. There is
// no invite EDIT path. The DELETE path is a SIBLING ROUTE, not this one:
// functions/api/invites/[id].js handles DELETE /api/invites/:id (withdraw an
// unclaimed invite, releasing its address from idx_person_invite_email). A
// DELETE against this collection route still 405s, so the sentence above is
// unchanged and remains true.
//
// Request body (JSON): { email, type, displayName }
//   - email: required; NORMALIZED trim().toLowerCase() and must contain '@'.
//     The normalization is VERBATIM-IDENTICAL to the pre-send invite-gate seam
//     in functions/api/auth/[[route]].js (parsed.email.trim().toLowerCase())
//     and the (c) claim hook's match key. This is load-bearing: the gate admits
//     an address at send time by matching person.invite_email, and the claim
//     hook claims the row by the same key — a case/whitespace drift here would
//     silently break BOTH the allowlist and the claim. Same key, one shape.
//   - type: required, ∈ individual | staff | advisor (ALLOWED_TYPES). This set
//     is NARROWER than seed-invites.mjs by exactly one value: 'ops' is refused
//     here by the ops-minting guard below, so CLI provisioning stays the only
//     path that mints an ops row.
//   - displayName: required, non-empty. A real name at insert time is
//     mandatory (browser-screening runbook §9 — a bespoke row without one
//     renders "New user" in Chrome).
//
// source_surface is DERIVED from type server-side, NEVER client-supplied:
//   individual→individual, advisor→advisor, staff→enterprise.
//   There is deliberately NO ops entry: see the ops-minting guard below. With
//   the mapping absent, re-adding 'ops' to ALLOWED_TYPES and dropping the guard
//   branch fails LOUDLY rather than writing a row with an undefined
//   source_surface, so the guard cannot be undone by halves.
//
// Row written = the seed-invites.mjs 10-column shape (auth_user_id NULL,
// initials NULL, extensions '{"<surface>":{}}', soft_deleted_at/deletion_state
// NULL) PLUS created_at = now ISO (migration 0014).
//
// Response shapes:
//   No session:               401, { error: 'Not signed in' }
//   Session, no person:       403, { error: 'No account found for session' }
//   Session, non-ops/no gate: 403, { error: 'Not authorized' }
//   type 'ops':               403, { error: 'ops accounts cannot be created through this endpoint' }
//   Invalid body:             400, { error: '<reason>' }
//   Duplicate invite_email:   409, { error: 'This address has already been invited.' }
//   Success:                  201, the GET /api/roster element shape + createdAt
//     + emailSent (boolean — the notification-email outcome; create-succeeds-
//     with-warning, so 201 even when emailSent:false):
//     { id, displayName, type, sourceSurface, inviteEmail, pending, createdAt, emailSent }

import { sql } from 'kysely';
import { makeDb, requireGatedOps, rejectRankKeys, jsonError, jsonOk } from '../_lib/gate.js';
import { createSender } from '../_lib/sender.js';
import { buildInviteEmail } from '../_lib/inviteEmail.js';

// API-mintable types. 'ops' is DELIBERATELY ABSENT: see the ops-minting guard
// in onRequestPost. Do not re-add it here without reading that comment first.
const ALLOWED_TYPES = new Set(['individual', 'staff', 'advisor']);

// type → source_surface. Server-derived; the client never supplies it.
// No 'ops' entry: see the ops-minting guard in onRequestPost. Do not re-add it
// here without reading that comment first. The absence is LOAD-BEARING, not an
// omission: it makes this map the last line of the guard rather than a lookup
// table, so a partial undo throws instead of writing an undefined surface.
const SOURCE_SURFACE_FOR_TYPE = {
  individual: 'individual',
  advisor: 'advisor',
  staff: 'enterprise',
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
  // OPS-MINTING GUARD. requireOps (gate.js) authorizes a FULL-FIDELITY,
  // unredacted operator view on TYPE ALONE, and its Q6 note justifies that
  // solely by ops being FT-exclusive. A gated ops operator minting a second
  // ops account would void that precondition silently, widening who can read
  // every person row without anything recording that it happened. So the API
  // refuses the type outright and CLI provisioning (scripts/seed-invites.mjs,
  // which is unchanged and still mints ops rows) stays the only path.
  //
  // This runs BEFORE the ALLOWED_TYPES test on purpose. 'ops' is absent from
  // that set too, so the generic branch would already reject it, but it would
  // read as an unknown-type typo rather than as a boundary someone chose.
  //
  // THREE mechanisms refuse this type, and that is deliberate: the branch here,
  // the absence from ALLOWED_TYPES, and the absence from SOURCE_SURFACE_FOR_TYPE.
  // Removing any one alone still refuses. Removing the first two still throws at
  // the map rather than writing a row with an undefined source_surface, so the
  // failure mode of a careless undo is loud rather than a silently mistyped row.
  //
  // 403 rather than 400 because the caller is authenticated, gated, and sending
  // a well-formed request; what fails is permission to perform this particular
  // creation, not the shape of the ask.
  if (type === 'ops') {
    return jsonError('ops accounts cannot be created through this endpoint', 403);
  }
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

  const element = {
    id: row.id,
    displayName: row.display_name,
    type: row.type,
    sourceSurface: row.source_surface,
    inviteEmail: row.invite_email,
    pending: !!row.pending,
    createdAt: row.created_at,
  };

  // Notification email (FT ruling 2026-07-15). CREATE-SUCCEEDS-WITH-WARNING:
  // the person row is already persisted, and the send is a non-DB side effect
  // (the FIRST in a non-auth endpoint) that CANNOT be transactional with the
  // INSERT — an external Resend call has no rollback. So the send runs in its
  // OWN try/catch and NEVER undoes the create or 500s the response:
  //   - success → stamp $.invite.sentAt + $.invite.messageId on extensions
  //     (json_set, no migration) and return emailSent:true.
  //   - failure → NO stamp, NO throw; the row STANDS and we return
  //     emailSent:false so the operator sees the warning (the invitee can still
  //     self-initiate at /signin).
  // 201 on BOTH paths — the resource was created either way.
  let emailSent = false;
  try {
    const sender = createSender(context.env);
    const { subject, html, text } = buildInviteEmail({ displayName });
    const result = await sender.send({ to: email, subject, html, text });
    const messageId = result && result.id ? String(result.id) : null;
    const sentIso = new Date().toISOString();
    await db
      .updateTable('person')
      .set({
        extensions: sql`json_set(json_set(coalesce(extensions, '{}'), '$.invite.sentAt', ${sentIso}), '$.invite.messageId', ${messageId})`,
      })
      .where('id', '=', id)
      .execute();
    emailSent = true;
  } catch (err) {
    emailSent = false;
  }

  // 201 Created — a new resource (the invite/person row) was minted. (The
  // older write endpoints return 200 via jsonOk's default; this create is
  // deliberately REST-correct.) emailSent flags the notification outcome.
  return jsonOk({ ...element, emailSent }, 201);
}
