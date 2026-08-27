// better-auth instance factory for stewardhouse-pilot.
//
// PER-REQUEST RULE: makeAuth(env) is called inside onRequest() — once per
// request. Never hoisted to module scope. D1 binding changes per Worker
// invocation; a module-singleton would silently bind to a stale handle.
//
// Stack:
//   - better-auth 1.6.20 (exact pin)
//   - kysely 0.29.2 + kysely-d1 0.4.0 — explicit Kysely instance over the
//     env.DB binding, passed via the documented { db, type } shape. (Note:
//     better-auth 1.6.20's `database:` union also accepts a bare D1Database
//     directly; the Kysely path matches the FT-approved plan and leaves an
//     instance available if our own queries want it later.)
//
// Schema binding: migration 0001 + 0003 created the tables with snake_case
// columns and `auth_user` as the user-table name. Better-auth's defaults
// are camelCase and `user`. We override:
//   - user.modelName: 'auth_user'   (table rename)
//   - per-entity fields: { ... }    (column renames)
// Type inference in callers stays camelCase (e.g. user.emailVerified) —
// only the SQL touches snake_case. (Per better-auth docs.)
//
// cookieCache: explicitly disabled. Default in 1.6.20 is already false,
// but we set it for clarity and as a defense against future default flips
// (the scoping-pass strand 2 caveat about bug #4203).
//
// Plugins (added in sub-slice b):
//   - magicLink — email-only magic-link sign-in. Token stored HASHED (not
//     plaintext) at rest per the locked ruling. Auto-creates auth_user on
//     first verify (disableSignUp:false) so the claim-on-first-sign-in
//     hook in sub-slice (c) can attach the pre-seeded `person` row. The
//     sender is the per-request factory in ./sender.js, keyed on
//     env.SENDER_PROVIDER.
//
// databaseHooks (added in sub-slice c):
//   - user.create.after — claim-or-create person on first sign-in.
//     Tries to claim a pre-seeded person row (matching invite_email =
//     the signing-in email); on no match, inserts a fresh person row
//     with type='individual' (organic self-signups are always
//     individual; enterprise/advisor person rows are PRE-SEEDED by
//     FT/staff before invite, so their first sign-in is a CLAIM of an
//     existing typed row, never a fresh insert). Errors are logged
//     + SWALLOWED — the hook MUST NOT block sign-in completion.
//
//   As of the invite-gate slice, this hook fires ONLY for emails that
//   cleared the pre-send allowlist in functions/api/auth/[[route]].js
//   (an unknown email never gets a verification link, so it never
//   reaches createUser). The fresh-person branch below therefore
//   creates individual rows ONLY for allowlisted invitees whose
//   invite_email claim did not match (e.g. a fresh individual with no
//   pre-seeded row). It is left OPEN deliberately — see the CLAIM
//   MATCH KEY note on the after() body.

import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins/magic-link';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { createSender } from './sender.js';

// ─────────────────────────────────────────────────────────────────────────
// INVITE EXPIRY (Slice A). FT ruling: an unclaimed invite expires 30 days
// after COALESCE(person.invited_at, person.created_at): the invitation instant
// when one was recorded, else the row's birth. Before this, an unclaimed row
// lived forever and its address could request a magic link indefinitely.
//
// A MODULE CONSTANT, deliberately, not an env var and not a column.
//   NOT an env var: §11 records that production env config lives in the
//   Cloudflare Pages dashboard, is not repo-readable, and DRIFTS SILENTLY. A
//   window that differed between local and production would be invisible and
//   would fail exactly the way RESEND_API_KEY did, with nothing erroring.
//   NOT a column: a window is POLICY, not a record of what happened. Migration
//   0018's docblock draws the same line for consent_attested_at, which records
//   THAT an attestation occurred and never the language of it.
//
// ONE enforcement site, not two: the pre-send allowlist in
// functions/api/auth/[[route]].js. The claim hook below does NOT repeat this
// predicate, and that is deliberate.
//
// THE SEND-TO-VERIFY WINDOW IS LEFT OPEN ON PURPOSE AND ABSORBED BY THE CLAIM.
// A link requested on day 29 stays valid after its row crosses day 30, and the
// verify never re-consults the allowlist, so the claim lands slightly past the
// boundary. The overshoot is BOUNDED by the magic link's own lifetime:
// expiresIn is 300 seconds (the magicLink plugin below) and better-auth
// enforces it on consume, so it can never exceed five minutes.
//
// Refusing that claim, which is what shipped at 311773c, was worse. It left
// the invitee with no claim AND an auth_user anyway, and the fresh-person
// branch turned that into an orphan 'New user' individual which NO re-invite
// could recover: the after hook fires only on user creation and never
// re-fires, so a withdrawn-and-reissued invite is never claimed. Confirmed
// empirically before this change. Five minutes of slack at the boundary costs
// less than an unrecoverable account.
//
// A ROW WITH NO CLOCK AT ALL is treated as LIVE, not expired: both invited_at
// and created_at NULL. A NULL created_at alone is not enough, because
// invited_at wins whenever it is set, so a row carrying a stale invited_at is
// refused however old or absent its created_at. This now applies to SITE 1
// ONLY, there being no other site. ELEVEN rows predate migration 0014, which
// deliberately did not backfill them, and one of them is FT's own staff test
// identity on a real deliverable address; migration 0019 did not backfill
// invited_at either, so those rows carry neither clock and stay live. Locking
// out a real person to enforce a policy against four .invalid demo seeds is
// the wrong trade. This is a DECISION, not an oversight: no date at all means
// the age is unknown, and an unknown age is not evidence of expiry.
export const INVITE_EXPIRY_DAYS = 30;

/** ISO instant before which an invite is expired. Rows at or older than this fail. */
export function inviteCutoffIso(nowMs = Date.now()) {
  return new Date(nowMs - INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
}
// ─────────────────────────────────────────────────────────────────────────

// C-3a: bind an athlete's institutional record(s) to their claimed person.
// athlete.person_id FKs person.id (not auth_user.id), and an athlete may hold
// rows at multiple institutions (no UNIQUE on athlete.email) — one person, many
// enrollments — so this binds ALL matching unclaimed rows. Email is normalized
// trim().toLowerCase() to match the exact value POST /api/athletes stored (and
// person.invite_email). management_mode is untouched (stays NULL — the athlete's
// consent choice sets it via /api/athlete-consent). Best-effort: called inside
// the hook's try/catch, so a bind failure never breaks sign-in.
//
// TYPE CHECK (twin of the athletes.js bind-at-enroll check): bind ONLY to a
// type='individual' person. The fresh-person branch hardcodes 'individual', but
// the CLAIM branch resolves whatever pre-seeded row matched invite_email, which
// can be an advisor / staff / ops row when that operator's address also sits on
// an athlete row. The bespoke-type guard above stops the hook CREATING a
// privileged type; it says nothing about binding an athlete to one. Resolved
// here rather than at the call sites so both branches are covered by one check.
async function bindAthleteRows(db, personId, email) {
  if (!personId || typeof email !== 'string') return;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  const owner = await db
    .selectFrom('person')
    .select(['type'])
    .where('id', '=', personId)
    .executeTakeFirst();
  if (!owner || owner.type !== 'individual') {
    console.log(`[auth/claim] skipped athlete bind for person=${personId} (type=${owner?.type ?? 'unknown'})`);
    return;
  }
  const res = await db
    .updateTable('athlete')
    .set({ person_id: personId })
    .where('email', '=', normalized)
    .where('person_id', 'is', null)
    .executeTakeFirst();
  const n = Number(res?.numUpdatedRows ?? 0n);
  if (n > 0) console.log(`[auth/claim] bound ${n} athlete row(s) to person=${personId}`);
}

export function makeAuth(env) {
  const db = new Kysely({
    dialect: new D1Dialect({ database: env.DB }),
  });

  return betterAuth({
    database: { db, type: 'sqlite' },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,

    // basePath omitted — default '/api/auth' matches functions/api/auth/[[route]].js

    user: {
      modelName: 'auth_user',
      fields: {
        emailVerified: 'email_verified',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },

    session: {
      cookieCache: { enabled: false },
      modelName: 'session',
      fields: {
        userId: 'user_id',
        expiresAt: 'expires_at',
        ipAddress: 'ip_address',
        userAgent: 'user_agent',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },

    account: {
      modelName: 'account',
      fields: {
        userId: 'user_id',
        accountId: 'account_id',
        providerId: 'provider_id',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        idToken: 'id_token',
        accessTokenExpiresAt: 'access_token_expires_at',
        refreshTokenExpiresAt: 'refresh_token_expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },

    verification: {
      modelName: 'verification',
      fields: {
        expiresAt: 'expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },

    databaseHooks: {
      user: {
        create: {
          // Claim-or-create person on first sign-in.
          //
          // HOOK TIMING, both halves, because they are OPPOSITE and the
          // difference is what makes `before` able to refuse at all.
          //
          // `create.before` runs INLINE, inside createWithHooks, AHEAD of the
          // adapter INSERT. That is exactly why returning false prevents the
          // row: createWithHooks returns null, createUser returns null, and
          // magic-link's verify takes its `failed_to_create_user` redirect.
          // Nothing has been written at that point, so there is nothing to
          // undo.
          //
          // `create.after` is QUEUED, not immediate. auth.handler wraps the
          // whole router in runWithAdapter, so queueAfterTransactionHook finds
          // a store and pushes onto pendingHooks instead of running inline,
          // and those drain only after handler(request) resolves. This body
          // therefore runs AFTER the entire verify endpoint has finished, past
          // createSession and past setSessionCookie. An earlier version of
          // this comment claimed the queue resolved to immediate execution;
          // that was wrong, and it mattered, because it implied an after hook
          // could still influence the response. It cannot: it runs after the
          // response is built and its return value is discarded.
          //
          // NO TRANSACTION wraps any of this, and that is a property of the
          // CALL SITE rather than of D1 or Kysely: internalAdapter.createUser
          // is unwrapped, while createOAuthUser and /sign-up/email both use
          // runWithTransaction. The durability conclusion is unchanged and in
          // fact stronger than the old wording claimed: the auth_user row is
          // committed well before this body runs.
          //
          // ONCE-PER-EMAIL: magic-link's verify calls `createUser` only
          // when `findUserByEmail` returns nothing. Re-sign-ins skip
          // `createUser` and this hook does NOT re-fire. The SQL's
          // `WHERE auth_user_id IS NULL` is belt-and-braces idempotency.
          //
          // BESPOKE-TYPE GUARD: organic self-signups always reach the
          // fresh-person branch with type='individual'. Enterprise and
          // Advisor person rows are PRE-SEEDED by FT/staff (typed at
          // insert) BEFORE invite, so their first sign-in is a CLAIM
          // of an existing row, never a fresh insert. The hook never
          // creates a privileged type.
          //
          // CLAIM MATCH KEY: invite_email = the signing-in email. Every
          // pre-seeded person row (bespoke staff/advisor/ops via
          // scripts/seed-invites.mjs, or a pre-seeded individual) carries
          // its invitee's email in invite_email; first sign-in claims it.
          // This is the SAME column the pre-send allowlist gate reads, so
          // invite_email is the single source of truth for "who may sign
          // up" AND "which row do they claim". Do NOT broaden to arbitrary
          // matching — the allowlist gate depends on this exact key.
          //
          // FRESH-PERSON BRANCH IS NOW CLOSED, by the `before` hook below.
          // It used to stay open on the reasoning that a claim-miss should
          // degrade gracefully. That reasoning was wrong in one specific way,
          // confirmed empirically before this change: a claim-miss did not
          // degrade, it minted an orphan 'New user' individual holding the
          // invitee's address, and no re-invite could recover it. An operator
          // could withdraw the stale row and create a fresh live one, both
          // endpoints returning success, and the invitee would still sign in
          // as the orphan forever, because `createUser` never fires twice for
          // an address that already has an auth_user and this hook only runs
          // on user creation. An unclaimable signup is now REFUSED instead.
          //
          // The branch below survives for one residual case: a row that passed
          // the before check and lost its claim in the microseconds since. That
          // still yields an orphan, but no ordinary sequence reaches it.
          //
          // COMPLEMENT INVARIANT, and the reason both hooks live in one block
          // where a reader cannot change one without seeing the other: the
          // before predicate and the claim UPDATE MUST stay exact complements
          // over the same two columns, invite_email and auth_user_id. Break it
          // and it breaks in one of two directions. Before too permissive
          // reopens the orphan this slice closed. Before too strict refuses a
          // real invitee whose row would have claimed cleanly. So add nothing
          // to either without adding it to both: no expiry term (site 1 owns
          // expiry, see INVITE_EXPIRY_DAYS), no soft_deleted_at filter, and no
          // re-normalizing of user.email, which better-auth lowercased before
          // either hook saw it.
          //
          // HISTORICAL NOTE: 311773c's commit message states that the claim
          // hook repeats the allowlist predicate to close the outstanding-link
          // window. That was true of what shipped and this makes it false of
          // the tree. The message stands as an accurate record of that slice.
          // ───────────────────────────────────────────────────────────────
          // Refuse a first-time sign-in with no claimable invite row. The two
          // terms below are the exact complement of the claim UPDATE in
          // `after`; see COMPLEMENT INVARIANT above before touching either.
          //
          // NOT WRAPPED in try/catch, deliberately. This is a gate decision,
          // and an unreadable database must not be read as "no invite", which
          // would be indistinguishable in the logs from a real refusal, nor as
          // "invite present", which would reopen the orphan. Letting it throw
          // fails closed (no row is written, since the INSERT is downstream)
          // and surfaces as an error line in the deployment tail.
          before: async (user) => {
            // No address means nothing to claim. Refuse rather than fall
            // through: the old behaviour here was the fresh-person branch.
            if (!user.email) return false;

            const claimable = await db
              .selectFrom('person')
              .select(['id'])
              .where('invite_email', '=', user.email)
              .where('auth_user_id', 'is', null)
              .executeTakeFirst();

            if (claimable) return;

            // Address deliberately not logged. The after hook logs auth_user
            // ids, and there is no id yet at this point.
            console.log('[auth/claim] refused createUser: no claimable invite');
            return false;
          },

          after: async (user) => {
            try {
              let claimed = 0;

              if (user.email) {
                // NO EXPIRY TERM. Expiry is enforced once, at the pre-send
                // allowlist; see INVITE_EXPIRY_DAYS for why the send-to-verify
                // window is left open and absorbed here. These two terms are
                // the exact complement of the `before` predicate above.
                const claim = await db
                  .updateTable('person')
                  .set({ auth_user_id: user.id })
                  .where('auth_user_id', 'is', null)
                  .where('invite_email', '=', user.email)
                  .executeTakeFirst();

                claimed = Number(claim?.numUpdatedRows ?? 0n);
              }

              if (claimed === 1) {
                console.log(`[auth/claim] claimed seed person for auth_user=${user.id}`);
                // C-3a athlete bind: the claim UPDATE above didn't return the
                // person.id, so resolve it, then bind any linked athlete rows.
                const claimedPerson = await db
                  .selectFrom('person')
                  .select(['id'])
                  .where('auth_user_id', '=', user.id)
                  .executeTakeFirst();
                await bindAthleteRows(db, claimedPerson?.id, user.email);
                return;
              }
              if (claimed > 1) {
                // Should be structurally unreachable given the UNIQUE index on
                // invite_email — kept as a defensive trip-wire, not a control path.
                console.warn(`[auth/claim] WARN multi-match (n=${claimed}) for auth_user=${user.id}; treated as claimed`);
                return;
              }

              // Fresh-person path: no seed row matched. Organic signups
              // always get type='individual' per the bespoke-type guard.
              // Supplies every NOT-NULL column from migration 0001:
              // id, display_name, type, source_surface (plus auth_user_id
              // which is nullable but set here for the linkage).
              const personId = crypto.randomUUID();
              await db.insertInto('person').values({
                id: personId,
                auth_user_id: user.id,
                display_name: 'New user',
                type: 'individual',
                source_surface: 'individual',
              }).execute();

              console.log(`[auth/claim] created fresh person ${personId} for auth_user=${user.id}`);
              // C-3a athlete bind: an athlete whose C-2 invite was somehow lost
              // still binds on organic signup with the same email.
              await bindAthleteRows(db, personId, user.email);
            } catch (err) {
              // Log + SWALLOW. Sign-in already succeeded upstream
              // (auth_user + session minted before this hook ran). A
              // claim/insert hiccup must NOT 500 the verify response;
              // the unlinked person row can be recovered manually.
              const msg = err instanceof Error ? err.message : String(err);
              console.log(`[auth/claim] ERROR ${msg} for auth_user=${user.id}`);
            }
          },
        },
      },
    },

    plugins: [
      magicLink({
        expiresIn: 300,             // 5 minutes (better-auth default; explicit for clarity)
        disableSignUp: false,       // auto-create auth_user on first verify
        storeToken: 'hashed',       // never store the plaintext token at rest
        rateLimit: { window: 60, max: 5 },
        sendMagicLink: async ({ email, url }) => {
          const sender = createSender(env);
          // Minimal `&`-only escape for the visible URL — magic-link URLs
          // can contain raw `&` between query params, which would otherwise
          // start an entity in both HTML attribute and text contexts.
          const linkSafe = url.replace(/&/g, '&amp;');
          const subject = 'Sign in to StewardHouse';
          const text = [
            'Sign in to StewardHouse using the link below.',
            '',
            url,
            '',
            'This link expires in five minutes and can be used once.',
            '',
            'If you did not request this, you can disregard this message.',
          ].join('\n');
          const html = [
            '<p>Sign in to StewardHouse using the link below.</p>',
            `<p><a href="${linkSafe}">${linkSafe}</a></p>`,
            '<p>This link expires in five minutes and can be used once.</p>',
            '<p>If you did not request this, you can disregard this message.</p>',
          ].join('\n');
          await sender.send({ to: email, subject, text, html });
        },
      }),
    ],

    // No emailAndPassword (disabled by default).
    // No socialProviders (none configured).
  });
}
