// PUT /api/athletes/:id/invite — invite a Pending athlete (roster-import arc, F-C).
//
// The invite is a STAFF ACT taken in the UI after an offline conversation and
// the athlete's acknowledgment. There is no send script and no scheduled job.
// This endpoint performs the act and nothing else: the notification send, its
// sent-stamp, and the conditional UNIQUE-collision bind are all OUT of scope
// (CLAUDE.md §5.2, SCOPE OF THE ATOMIC UNIT).
//
// Sub-resource route, matching workshops/[id]/attendance.js. The act is not an
// edit of the athlete's fields, so it does not belong on the sibling
// PUT /api/athletes/:id, whose body is the milestone allowlist.
//
// ATOMIC, TWO WRITES, ONE BATCH (F-C + WRITE COUNT CORRECTED 2026-08-27):
//   1. UPDATE athlete SET enrollment_status 'Pending' -> 'Invited'
//   2. INSERT person carrying invited_at as a column (invited_at lives on
//      person, never on athlete; PRAGMA table_info(athlete) has no such column)
// They succeed or fail together via env.DB.batch(), a D1 implicit transaction,
// following the heterogeneous multi-table precedent in the sibling
// onRequestDelete. Every parameter is bound before the first statement runs,
// which is why the three excluded steps above cannot be batch members: each
// depends on an outcome the batch cannot observe from inside itself.
//
// COLLISION DISPOSITION: ABORT (ruled). person.invite_email carries a UNIQUE
// index (idx_person_invite_email, migration 0004). A pre-batch SELECT gives the
// operator an honest message naming the address as already in use. That SELECT
// NARROWS the race and cannot close it; when it loses, the INSERT violates the
// index, D1 rolls the whole batch back, and the athlete stays 'Pending' with no
// partial state. That abort IS the correct outcome. ON CONFLICT DO NOTHING is
// REJECTED by ruling: it would report success while flipping the athlete to
// 'Invited' with no claimable person row behind it.
//
// THE UNIQUE INDEX IS THE REAL CONCURRENCY GUARD, and it is worth naming. Two
// simultaneous invites for the same athlete, or for two athletes sharing an
// address (athlete.email has no unique index, so a roster may hold duplicates),
// both reach the batch. The first commits; the second collides on invite_email
// and aborts entirely. No application-level lock is needed for that case.
//
// LAYER-8 GATE, INVERTED (ruled). The sibling PUT requires a CLAIMED, delegated
// athlete because it records progression on an account the athlete controls.
// The invite is the act that precedes a claim, so it requires the opposite:
// enrollment_status = 'Pending' AND person_id IS NULL. Gate layers 1-7 transfer
// unchanged from that endpoint.
//
// 409 rather than 403 for the layer-8 refusals, deliberately. A 403 would say
// the operator may not do this, which is false: they are gated, scoped, and
// entitled. What is wrong is the ATHLETE'S STATE, which is what 409 Conflict
// describes. invites.js:149 already returns 409 for the duplicate-address case,
// so the code is established in this repo for exactly this meaning. Layers 1-7
// keep the sibling's shapes and codes verbatim.
//
// A Sunset stub returns the layer-7 404, never a 409, so an anonymized athlete
// is indistinguishable from one that never existed.
//
// NOT HERE: resolveStatus is untouched and never advances an athlete off
// 'Pending' (ruled); no UI; no send.

import {
  makeDb, requireGatedEnterprise, rejectRankKeys, jsonError, jsonOk,
} from '../../../_lib/gate.js';
import { ATHLETE_ELEMENT_COLUMNS, toAthleteElement, EMAIL_REGEX } from '../../athletes.js';

// The act carries NO fields: display_name and invite_email are read from the
// athlete row, never from the caller, so there is nothing legitimate to send.
// Any key is therefore rejected rather than ignored, matching the sibling
// endpoint's extra-key posture (staff learn the model instead of watching a
// field vanish). The body must still be a JSON object, so `{}` is the payload.
function validateInviteBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Body must be an object' };
  }
  const extra = Object.keys(body);
  if (extra.length > 0) {
    return { error: `Field(s) not permitted: ${extra.join(', ')}` };
  }
  return { ok: true };
}

export async function onRequestPut(context) {
  const db = makeDb(context);

  // Layer 1: gated staff only ($.enterprise.demo_gate=1; production rows carry
  // none, so this is 403 in production until FT designates an institution).
  const { person, error, status } = await requireGatedEnterprise(db, context);
  if (error) return jsonError(error, status);

  // Layer 2: route param.
  const athleteId = context.params.id;
  if (!athleteId || typeof athleteId !== 'string') {
    return jsonError('Invalid athlete id', 400);
  }

  // Layer 3: body parses.
  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }

  // Layer 4: §7 no-ranking allowlist.
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  // Layer 5: body shape (no fields permitted).
  const validated = validateInviteBody(body);
  if (validated.error) return jsonError(validated.error, 400);

  // Layer 6: owner scope from institution_contact, NEVER the body.
  const contact = await db
    .selectFrom('institution_contact')
    .select(['institution_id', 'is_default_operator'])
    .where('person_id', '=', person.id)
    .orderBy('is_default_operator', 'desc')
    .executeTakeFirst();
  if (!contact) {
    return jsonError('No institution is associated with this operator', 403);
  }

  // Layer 7: id AND institution AND non-Sunset. 404 is IDENTICAL for absent /
  // not-this-institution's / Sunset stub, so a caller cannot probe which ids
  // exist. Pulls the columns layer 8, the mint, and the collision check need.
  const row = await db
    .selectFrom('athlete')
    .select(['id', 'name', 'email', 'enrollment_status', 'person_id', 'management_mode'])
    .where('id', '=', athleteId)
    .where('institution_id', '=', contact.institution_id)
    .where('enrollment_status', '!=', 'Sunset')
    .executeTakeFirst();
  if (!row) {
    return jsonError('Athlete not found', 404);
  }

  // Layer 8, INVERTED. Two distinct messages: the operator is looking at this
  // athlete's row and can act on either answer, so collapsing them would hide
  // which correction is needed. Neither discloses anything about another
  // account.
  if (row.enrollment_status !== 'Pending') {
    return jsonError('This athlete has already been invited', 409);
  }
  if (row.person_id != null) {
    return jsonError('This athlete already has a linked account', 409);
  }
  // A record-keeping choice before invitation is an ANOMALY, not a state the
  // product produces: the athlete makes that choice at claim (C-3b), which
  // cannot have happened yet on a Pending row. Import sets it NULL, so a
  // non-NULL value here means some other path asserted a consent choice the
  // athlete never made. Refuse rather than invite over it, because nothing
  // downstream would catch it until an attendance or progression write behaved
  // as though consent had been given.
  if (row.management_mode != null) {
    return jsonError('This athlete\'s record-keeping mode was set before invitation; the record needs correcting first', 409);
  }

  // The address. athlete.email is NULLABLE, so an imported row may carry none,
  // and nothing upstream has validated its shape. A malformed address would
  // mint a person row that can never be claimed, so it is refused here rather
  // than written. 409 for the same reason as layer 8: the request is
  // well-formed and the record is not ready.
  const rawEmail = typeof row.email === 'string' ? row.email.trim() : '';
  if (rawEmail.length === 0) {
    return jsonError('This athlete has no email address on file', 409);
  }
  if (!EMAIL_REGEX.test(rawEmail)) {
    return jsonError('This athlete\'s email address is not a valid address', 409);
  }
  // Normalized VERBATIM the way the auth-gate seam and the claim hook normalize
  // (trim().toLowerCase()), so person.invite_email matches what those two read.
  // athlete.email is NOT rewritten: that would be a third write, outside the
  // ruled atomic unit. A row imported with mixed case therefore keeps its case
  // on athlete.email while person.invite_email is lowercased; the claim matches
  // on the person column, so the difference is cosmetic.
  const email = rawEmail.toLowerCase();

  // Collision pre-check. Existence only: the colliding row's type and claim
  // state are NOT read and NOT reported. athletes.js:290 records why, having
  // once put a person type in a 200 body.
  const clash = await db
    .selectFrom('person')
    .select(['id'])
    .where('invite_email', '=', email)
    .executeTakeFirst();
  if (clash) {
    return jsonError(`${email} is already in use on the platform. Update the athlete's email address before inviting.`, 409);
  }

  const nowIso = new Date().toISOString();
  const personId = crypto.randomUUID();

  // The two writes. The UPDATE re-asserts the layer-8 predicate in its WHERE:
  // if the athlete stopped being invitable between the SELECT and here, it
  // matches no rows rather than resurrecting a stub that was anonymized in the
  // interval. See the post-batch check below for how that outcome is reported.
  const compiled = [
    db.updateTable('athlete')
      .set({ enrollment_status: 'Invited', updated_at: nowIso })
      .where('id', '=', athleteId)
      .where('institution_id', '=', contact.institution_id)
      .where('enrollment_status', '=', 'Pending')
      .where('person_id', 'is', null)
      .compile(),
    // The invites.js 11-column mint, plus invited_at. created_at is the row's
    // birth and stays the operator-visible "Added" date; invited_at is the
    // invitation instant the expiry predicate reads through
    // COALESCE(invited_at, created_at). Both are now: the row is born invited.
    db.insertInto('person').values({
      id: personId,
      auth_user_id: null,
      display_name: row.name,
      initials: null,
      type: 'individual',
      source_surface: 'individual',
      extensions: JSON.stringify({ individual: {} }),
      invite_email: email,
      soft_deleted_at: null,
      deletion_state: null,
      created_at: nowIso,
      invited_at: nowIso,
    }).compile(),
  ];

  try {
    await context.env.DB.batch(
      compiled.map((c) => context.env.DB.prepare(c.sql).bind(...c.parameters)),
    );
  } catch (err) {
    // The UNIQUE(invite_email) violation lands here when the pre-check lost the
    // race. D1 has already rolled both statements back, so the athlete is still
    // 'Pending' and no person row exists. Same message as the pre-check: the
    // operator does not need to know which of the two paths caught it.
    if (String(err && err.message).includes('UNIQUE')) {
      return jsonError(`${email} is already in use on the platform. Update the athlete's email address before inviting.`, 409);
    }
    return jsonError('Failed to invite athlete', 500);
  }

  const updated = await db
    .selectFrom('athlete')
    .select(ATHLETE_ELEMENT_COLUMNS)
    .where('id', '=', athleteId)
    .executeTakeFirst();

  // The batch committed, but a lost race on the UPDATE's re-asserted predicate
  // leaves the athlete unflipped while the person row stands. Never report
  // success for that: the invite did not happen, and the stray unclaimed row is
  // withdrawable through the Operations Accounts view.
  if (!updated || updated.enrollment_status !== 'Invited') {
    return jsonError('This athlete\'s record changed during the invite; it was not sent', 409);
  }

  return jsonOk(toAthleteElement(updated));
}
