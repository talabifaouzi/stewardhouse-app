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
          // POST-COMMIT: better-auth queues `create.after` after the
          // adapter's INSERT returns; with D1+Kysely (no transaction
          // wrapper) the queue resolves to immediate execution, so the
          // auth_user row IS durable when this body runs.
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
          // FRESH-PERSON BRANCH left OPEN, not closed belt-and-braces:
          // with the pre-send gate in place it is reachable only for an
          // allowlisted email, so it can no longer mint an unknown-email
          // account. Closing it would strand an allowlisted individual
          // whose invite_email claim missed (it would leave person=null).
          // Leaving it open keeps claim-or-create graceful. FUTURE-HARDEN:
          // if a non-magic-link signup method is ever added, that path
          // must be gated too, or re-add an allowlist re-check here.
          after: async (user) => {
            try {
              let claimed = 0;

              if (user.email) {
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
