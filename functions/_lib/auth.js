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

import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins/magic-link';
import { Kysely } from 'kysely';
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
