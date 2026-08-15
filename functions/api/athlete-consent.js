// POST /api/athlete-consent — the ATHLETE sets their management_mode (the C-3
// consent choice) across ALL their linked athlete rows.
//
// Written by the ATHLETE ONLY. Auth is getPersonForSession (an athlete's account
// is type='individual'; there is no demo_gate here, since an athlete is not a
// gated operator), and the UPDATE is scoped to `person_id = the session person`,
// so a caller can only ever set their OWN rows.
//
// TWO independent conditions, deliberately not one: (a) the session person is
// type='individual', CHECKED below; (b) the UPDATE matches at least one athlete
// row bound to them. This docblock previously asserted (b) alone, reasoning that
// "staff never succeed here: their session person has no athlete rows bound to
// it → 0 rows → 403". That was an assumption about a DIFFERENT endpoint's
// behaviour, not a check this one performs. It is the same shape as D7, where
// an orphaned person_id still read 'delegated'. A non-individual person CAN hold
// a bind (both bind paths now refuse to create one, but a row predating those
// checks would persist; no migration backfills it), and if one exists this
// endpoint would let a non-athlete account set an athlete's consent state,
// unlocking or locking the staff write gates that read management_mode live.
// Check (a) makes that unreachable regardless of how the bind arose.
//
// One choice covers ALL linked rows (FT ruling): a single UPDATE across every
// athlete row bound to this person (an athlete may be enrolled at more than one
// institution — no UNIQUE on athlete.email). No per-row divergence.
//
// Deny-by-default is PRESERVED: this endpoint never runs unless the athlete
// acts. Until then management_mode stays NULL and staff writes 403 (the C-1
// attendance gate requires 'delegated' EXACTLY, reading the column live).
//
// CHANGEABLE later: mode ∈ 'self' | 'delegated' can be re-POSTed to flip; the
// C-1 gate reads the column on every write, so a change takes effect
// immediately. A dedicated settings surface is filed (post-C-3b).
//
// POST-only: exports onRequestPost; Cloudflare Pages auto-405s other methods.

import { makeDb, getPersonForSession, jsonError, jsonOk } from '../_lib/gate.js';

const ALLOWED_MODES = new Set(['self', 'delegated']);

export async function onRequestPost(context) {
  const db = makeDb(context);
  const { person, error, status } = await getPersonForSession(db, context);
  if (error) return jsonError(error, status);

  // Condition (a) per the docblock. The message is IDENTICAL to the 0-rows 403
  // below, deliberately: both mean "you have no athlete record to set", and
  // splitting them would make the response an oracle for which person types
  // exist. Same non-disclosure posture as the gate.js guards.
  if (person.type !== 'individual') {
    return jsonError('No athlete record is linked to this account', 403);
  }

  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Body must be an object', 400);
  }

  const mode = body.mode;
  if (!ALLOWED_MODES.has(mode)) {
    return jsonError(`mode must be one of ${[...ALLOWED_MODES].join(', ')}`, 400);
  }

  const res = await db
    .updateTable('athlete')
    .set({ management_mode: mode, updated_at: new Date().toISOString() })
    .where('person_id', '=', person.id)
    .executeTakeFirst();
  const updated = Number(res?.numUpdatedRows ?? 0n);

  if (updated === 0) {
    // The person exists but is not a bound athlete (e.g. a staff/advisor/funder
    // session, or an athlete whose row hasn't been bound yet).
    return jsonError('No athlete record is linked to this account', 403);
  }

  return jsonOk({ mode, updated });
}
