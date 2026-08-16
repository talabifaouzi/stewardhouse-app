// CF Pages Functions catch-all for /api/auth/* — mounts better-auth's
// handler. The [[route]] filename is the Pages-Functions convention for
// a route-segment catch-all (matches /api/auth/, /api/auth/get-session,
// /api/auth/sign-in/magic-link, etc.).
//
// Per-request instance: makeAuth(context.env) MUST run inside onRequest,
// not at module scope. See functions/_lib/auth.js for the rule.
//
// ─────────────────────────────────────────────────────────────────────────
// PRE-SEND SIGNUP GATE (b2 — invite-allowlist at send time)
//
// FT ruling (this slice): production signup is invite-only, and
// person.invite_email is the SINGLE SOURCE OF TRUTH for the allowlist.
// The gate lives HERE — before better-auth ever mints a verification row
// or calls sendMagicLink — because throwing inside the sendMagicLink
// callback happens too late (a verification row is already staged and the
// send throw surfaces as a 500, per the browser-screening runbook §9).
//
// Scope: ONLY the magic-link SEND request (POST /api/auth/sign-in/magic-link).
// An email is allowed through when EITHER
//   (a) an auth_user already exists for it  — a RETURNING sign-in; existing
//       accounts must always be able to sign in, gate or no gate; OR
//   (b) a person row carries it as invite_email AND that invite has not
//       EXPIRED (Slice A: 30 days from person.created_at) — an INVITED
//       (pre-seeded) account, claimable on first verify by the auth.js (c) hook.
// Neither present → unknown email → refuse: no link sent, no auth_user, no
// verification row created. The 403 body mirrors better-auth's own
// disableSignUp error shape ({ code: 'new_user_signup_disabled' }) so
// SignIn.jsx's existing ERROR_MESSAGES copy renders unchanged.
//
// AN EXPIRED ADDRESS RECEIVES THAT SAME 403, BYTE-IDENTICAL. This is the only
// gate in the product facing UNAUTHENTICATED callers, so a distinct expired
// code would turn it into an enumeration oracle: anyone able to POST an email
// could learn whether that address was ever invited to StewardHouse, which for
// a private platform with named pilot participants is a membership disclosure.
// The cost is real and accepted: a lapsed invitee is told sign-up is not open
// rather than that their invitation expired. Their recourse is the operator who
// invited them, who can now withdraw the stale row and re-invite (the delete
// path shipped at 1c9d69d + cd2f41b, which is what unblocked this slice).
//
// Everything else — get-session, the magic-link VERIFY callback, sign-out —
// passes straight through to better-auth with the original request intact.
//
// Why not better-auth's own disableSignUp:true? It would also block invited
// users, whose auth_user does not exist until first verify — they are "new"
// from better-auth's perspective. This custom gate distinguishes invited-new
// (allow) from unknown-new (refuse); disableSignUp cannot.
// ─────────────────────────────────────────────────────────────────────────

import { makeAuth, inviteCutoffIso } from '../../_lib/auth.js';

const MAGIC_LINK_SIGNIN_PATH = '/api/auth/sign-in/magic-link';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let forwarded = request;

  if (request.method === 'POST' && url.pathname === MAGIC_LINK_SIGNIN_PATH) {
    // Buffer the body once: we both inspect the email AND forward it intact.
    const bodyText = await request.text();

    let email = null;
    try {
      const parsed = JSON.parse(bodyText);
      if (parsed && typeof parsed.email === 'string') {
        // Normalize to match how emails are stored: auth_user.email is
        // lowercased by better-auth, person.invite_email is trim+lowercased
        // by seed-invites.mjs and the seed migrations.
        email = parsed.email.trim().toLowerCase();
      }
    } catch {
      email = null;
    }

    // Only gate when we can read an email. An unparseable/absent email falls
    // through to better-auth's own validation (which 400s) — never sends.
    if (email) {
      // Slice A expiry, site (1). Only the PERSON branch gains the predicate.
      //
      // The auth_user branch is UNTOUCHED on purpose: an auth_user row exists
      // only after a successful first verify, so a claimed account is not an
      // invite, it is an account. Expiring it would be a session-lifetime
      // policy, which the ruling does not touch. This also means someone who
      // claims on day 29 keeps access: expiry is a property of the INVITATION,
      // not of the person.
      //
      // NULL created_at passes. Eleven rows predate migration 0014, which
      // deliberately did not backfill them, and one is a real deliverable
      // address. A DECISION, not an oversight: unknown age is not expiry.
      // See INVITE_EXPIRY_DAYS in functions/_lib/auth.js for the full reasoning
      // and for why the claim hook repeats this predicate.
      const cutoff = inviteCutoffIso();
      const allowed = await context.env.DB
        .prepare(
          'SELECT 1 AS ok FROM auth_user WHERE email = ? ' +
          'UNION ALL SELECT 1 AS ok FROM person ' +
          'WHERE invite_email = ? AND (created_at IS NULL OR created_at > ?) LIMIT 1'
        )
        .bind(email, email, cutoff)
        .first();

      if (!allowed) {
        return new Response(
          JSON.stringify({
            code: 'new_user_signup_disabled',
            message: 'Sign-up is not currently open for this address.',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Allowlisted (or unparseable): rebuild the request with the buffered
    // body and hand it to better-auth unchanged.
    forwarded = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: bodyText,
    });
  }

  const auth = makeAuth(context.env);
  return auth.handler(forwarded);
}
