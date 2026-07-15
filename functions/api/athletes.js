// POST /api/athletes — enrolls an athlete on the signed-in staff operator's
// institution (E-Slice E-Write-1, roster-add). Gated dark per E11:
// requireGatedEnterprise → 403 unless the staff person carries
// $.enterprise.demo_gate=true (production rows carry none; local smoke only).
//
// Owner scope: institution_id is resolved from the session's
// institution_contact (prefer is_default_operator), NEVER from the body. A
// staff operator can only enroll athletes on their own institution.
//
// E3: person_id is NULL at enrollment (unclaimed). The athlete row is the
// institutional record-of-record; the individual-account claim path populates
// person_id later. Anonymize-to-stub on departure is a SEPARATE later slice —
// this endpoint has NO delete path.
//
// E6: consent. The request MUST carry consentAcknowledged === true (the form
// gates it client-side; requiring it server-side means non-form callers cannot
// skip the program-level consent). consent_acknowledged_at is stamped with the
// create timestamp. The consent LANGUAGE is counsel-gated caution copy behind
// the gate; this endpoint records only that an acknowledgment occurred.
//
// E8: notes is free text. The name+role-from-public-record-only content
// convention is authoring discipline (caution copy adjacent to the field), not
// runtime-enforceable. notes is emitted ONLY to the staff's own /api/me block,
// never to athlete-facing or cross-surface reads (connection_detail precedent).
//
// Q9 guardrail: rejectRankKeys before the allowlist. Progress columns
// (lessons/gifts/certified/gps/timestamps) are server-zeroed at enrollment and
// accrue via later write paths, never accepted from the enrollment body.
//
// C-2: roster-add auto-invite. email is REQUIRED (the invitation can't send
// without an address). After the athlete row commits, a claimable person row
// (type 'individual', keyed by the same normalized invite_email) is minted and
// a notification email sent, mirroring POST /api/invites. The athlete row is
// NEVER rolled back for an invite problem; the outcome rides the response as
// invite ∈ 'sent' | 'skipped' (address already invited) | 'failed' (mint/send
// error). athlete.person_id stays NULL — the athlete↔person claim bind is C-3.
//
// Response shape: the /api/me roster element (camelCase, activity: []) PLUS a
// top-level `invite` outcome flag. AthletesProvider.add() splices the roster
// element into local state (stripping `invite`) and returns the full body so
// the form can surface the invite outcome.

import { sql } from 'kysely';
import {
  makeDb, requireGatedEnterprise, rejectRankKeys, jsonError, jsonOk,
} from '../_lib/gate.js';
import { createSender } from '../_lib/sender.js';
import { buildInviteEmail } from '../_lib/inviteEmail.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// C-1 field lockdown (consent model, docs/enterprise-provisioning-runbook.md
// §4 E6): pre-claim, an athlete record holds name + email ONLY. No other field
// may be set by anyone until the athlete claims their account and delegates
// management to staff (C-3). consentAcknowledged is the E6 gate flag, not a
// stored athlete column. Anything else in the body is rejected 400 (explicit,
// not silently dropped — staff learn the model), matching the rejectRankKeys
// precedent.
const ALLOWED_BODY_KEYS = ['name', 'email', 'consentAcknowledged'];

// DB enrollment_status enum → the lowercase `status` the fixture-shaped
// consumers (statusFor) read. Provisional: roster-add only ever creates
// 'Invited' athletes (lessons 0 → statusFor returns 'Invited' via the
// lessons===0 branch regardless), so the map is not yet exercised beyond
// 'Invited'. Full reconciliation lands with the progress-write slices.
const STATUS_MAP = {
  Invited: 'invited', Active: 'active', Stalled: 'inactive',
  Sunset: 'inactive', Certified: 'active',
};

// Columns selected for the round-trip + /api/me roster read.
export const ATHLETE_ELEMENT_COLUMNS = [
  'id', 'name', 'sport', 'year', 'position', 'email', 'phone', 'badge',
  'gps_completed_at', 'lessons_count', 'gifts_count', 'last_active_at',
  'join_date', 'certified', 'cert_at', 'enrollment_status', 'notes',
];

export function toAthleteElement(row) {
  return {
    id: row.id,
    name: row.name,
    sport: row.sport,
    year: row.year,
    position: row.position,
    email: row.email,
    phone: row.phone,
    badge: row.badge,
    gpsCompleted: !!row.gps_completed_at,
    gpsDate: row.gps_completed_at,
    lessons: row.lessons_count,
    gifts: row.gifts_count,
    lastActive: row.last_active_at,
    joinDate: row.join_date,
    certified: !!row.certified,
    certDate: row.cert_at,
    status: STATUS_MAP[row.enrollment_status] ?? 'active',
    notes: row.notes,
    // athlete_activity is a separate table (empty until the activity-write
    // slice). Always present so AthleteProfile's athlete.activity.map/.filter
    // never touches undefined.
    activity: [],
  };
}

function validateAthleteBody(body) {
  const out = {};
  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    return { error: 'name is required' };
  }
  out.name = body.name.trim();
  // C-1: name + email only. sport/year/position/phone/badge/notes are no longer
  // accepted at enrollment (rejected as extra keys in the handler); they become
  // settable only after the athlete claims and delegates.
  // C-2: email is REQUIRED — roster-add auto-sends an invitation, which cannot
  // go out without an address. Normalized trim().toLowerCase() so the stored
  // athlete email and the minted person.invite_email never diverge (the claim
  // hook + pre-send allowlist both key on invite_email).
  if (typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email.trim())) {
    return { error: 'A valid email is required — the invitation cannot be sent without an address' };
  }
  out.email = body.email.trim().toLowerCase();
  return { fields: out };
}

export async function onRequestPost(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedEnterprise(db, context);
  if (error) return jsonError(error, status);

  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Body must be an object', 400);
  }
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  // C-1 field lockdown: reject any key beyond name + email + the consent flag,
  // naming the offending keys so staff learn the pre-claim model rather than
  // losing data silently. rejectRankKeys (above) catches progress columns with
  // its own message first; this catches sport/year/position/phone/badge/notes
  // and anything else.
  const extraKeys = Object.keys(body).filter((k) => !ALLOWED_BODY_KEYS.includes(k));
  if (extraKeys.length > 0) {
    return jsonError(
      `Field(s) not permitted before the athlete claims their account: ${extraKeys.join(', ')}`,
      400,
    );
  }

  // E6: consent is required server-side, not just in the form.
  if (body.consentAcknowledged !== true) {
    return jsonError('Consent acknowledgment is required to enroll an athlete', 400);
  }

  const validated = validateAthleteBody(body);
  if (validated.error) return jsonError(validated.error, 400);
  const f = validated.fields;

  // Owner scope: institution from the session's institution_contact, NEVER the
  // body. Prefer the default-operator row (idx_institution_contact_person_id).
  const contact = await db
    .selectFrom('institution_contact')
    .select(['institution_id', 'is_default_operator'])
    .where('person_id', '=', person.id)
    .orderBy('is_default_operator', 'desc')
    .executeTakeFirst();
  if (!contact) {
    return jsonError('No institution is associated with this operator', 403);
  }

  const id = crypto.randomUUID();
  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);

  try {
    await db.insertInto('athlete').values({
      id,
      institution_id: contact.institution_id,
      person_id: null,                       // E3: unclaimed at enrollment
      name: f.name,
      sport: null,                           // C-1: locked out pre-claim
      year: null,                            // C-1: locked out pre-claim
      position: null,                        // C-1: locked out pre-claim
      email: f.email,                        // C-2: required + normalized (== person.invite_email)
      phone: null,                           // C-1: locked out pre-claim
      notes: null,                           // C-1: locked out pre-claim (was E8)
      badge: null,                           // C-1: locked out pre-claim (was E10)
      management_mode: null,                 // C-1: deny-by-default; athlete sets at claim (C-3)
      gps_completed_at: null,
      lessons_count: 0,
      gifts_count: 0,
      last_active_at: null,
      certified: 0,
      cert_at: null,
      enrollment_status: 'Invited',          // server-set; not from body
      join_date: today,
      consent_acknowledged_at: nowIso,       // E6: stamped on successful enroll
      created_at: nowIso,
      updated_at: nowIso,
    }).execute();
  } catch (err) {
    return jsonError('Failed to save athlete', 500);
  }

  const row = await db
    .selectFrom('athlete')
    .select(ATHLETE_ELEMENT_COLUMNS)
    .where('id', '=', id)
    .executeTakeFirst();
  const element = toAthleteElement(row);

  // C-2: roster-add auto-invite. The athlete row above is ALREADY COMMITTED and
  // is NEVER rolled back for an invite problem. Mint a claimable person row (the
  // invites.js 10-column shape) keyed by f.email — the SAME normalized value the
  // athlete row stored, so athlete.email and person.invite_email never diverge
  // (the claim hook + pre-send allowlist both pivot on invite_email). Then send
  // the notification email, mirroring the invites.js order. athlete.person_id
  // stays NULL; the athlete↔person bind is C-3's job at claim. The whole block
  // is wrapped so any unexpected throw degrades to invite:'failed' — never a
  // 500, never a non-2xx for an invite problem.
  let invite = 'failed';
  try {
    const personId = crypto.randomUUID();
    let minted = false;
    try {
      await db.insertInto('person').values({
        id: personId,
        auth_user_id: null,
        display_name: f.name,
        initials: null,
        type: 'individual',
        source_surface: 'individual',
        extensions: JSON.stringify({ individual: {} }),
        invite_email: f.email,
        soft_deleted_at: null,
        deletion_state: null,
        created_at: nowIso,
      }).execute();
      minted = true;
    } catch (err) {
      // UNIQUE(invite_email) — the address already has a claimable person row.
      // Skip the mint + send WITHOUT failing the athlete-add (the athlete
      // stands). Any other error rethrows → degrades to 'failed' below.
      if (String(err && err.message).includes('UNIQUE')) {
        invite = 'skipped';
      } else {
        throw err;
      }
    }

    if (minted) {
      // Send in its own step. On success, stamp $.invite.sentAt/messageId on the
      // NEW person row (invites.js json_set shape). A send failure rethrows →
      // the person row stands UNSTAMPED and invite becomes 'failed'.
      const sender = createSender(context.env);
      const { subject, html, text } = buildInviteEmail({ displayName: f.name });
      const result = await sender.send({ to: f.email, subject, html, text });
      const messageId = result && result.id ? String(result.id) : null;
      const sentIso = new Date().toISOString();
      await db
        .updateTable('person')
        .set({
          extensions: sql`json_set(json_set(coalesce(extensions, '{}'), '$.invite.sentAt', ${sentIso}), '$.invite.messageId', ${messageId})`,
        })
        .where('id', '=', personId)
        .execute();
      invite = 'sent';
    }
  } catch (err) {
    // Mint error other than UNIQUE, or a send failure — the committed athlete
    // row stands; report the invite as failed.
    invite = 'failed';
  }

  return jsonOk({ ...element, invite });
}
