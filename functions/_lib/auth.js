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
//     Tries to claim Marcus's seed person row (matching extensions.
//     legacy_individual_id = 'c-001'); on no match, inserts a fresh
//     person row with type='individual' (organic self-signups are
//     always individual; enterprise/advisor person rows are PRE-SEEDED
//     by FT/staff before invite, so their first sign-in is a CLAIM of
//     an existing typed row, never a fresh insert). Errors are logged
//     + SWALLOWED — the hook MUST NOT block sign-in completion.

import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins/magic-link';
import { Kysely, sql } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { createSender } from './sender.js';

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
          // CLAIM MATCH KEY: extensions.legacy_individual_id = 'c-001'
          // is the seed-specific claim for Marcus. Future bespoke
          // claims will EXTEND THIS LOOKUP HERE (additional legacy_*
          // ids, or invite-token fields stored on the pre-seeded row's
          // extensions). The structure of this UPDATE is the
          // extension point — do NOT broaden to arbitrary matching.
          after: async (user) => {
            try {
              const claim = await db
                .updateTable('person')
                .set({ auth_user_id: user.id })
                .where('auth_user_id', 'is', null)
                .where(
                  sql`json_extract(extensions, '$.legacy_individual_id')`,
                  '=',
                  'c-001',
                )
                .executeTakeFirst();

              const claimed = Number(claim?.numUpdatedRows ?? 0n);

              if (claimed === 1) {
                console.log(`[auth/claim] claimed seed person for auth_user=${user.id}`);
                return;
              }
              if (claimed > 1) {
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
