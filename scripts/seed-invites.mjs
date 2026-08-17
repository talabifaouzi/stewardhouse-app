#!/usr/bin/env node
// scripts/seed-invites.mjs
//
// Reads scripts/pilot-invites.json (gitignored — real pilot roster, never
// committed) and writes claimable person rows to D1 with an invite_email
// for the (c) hook's email-match claim to pick up on first sign-in.
//
// Usage:
//   node scripts/seed-invites.mjs --local            (default target)
//   node scripts/seed-invites.mjs --remote            (FT-run only — remote D1
//                                                       writes are an account-tied
//                                                       action per project protocol,
//                                                       never run by an agent)
//
// Roster file shape (scripts/pilot-invites.json), JSON array of:
//   {
//     "email": "jane@example.org",
//     "type": "individual" | "advisor" | "staff" | "ops",
//     "display_name": "Jane Smith",
//     "source_surface": "individual" | "advisor" | "enterprise" | "operations" | ...,
//     "extra": { ...fields nested under extensions.<source_surface> }
//   }
//
// type accepts 'individual' AND the bespoke privileged types. As of the
// invite-gate slice, production signup is invite-only (pre-send allowlist in
// functions/api/auth/[[route]].js keyed on person.invite_email), so organic
// individuals are no longer auto-created on an unknown email — an individual
// invitee must be pre-seeded here (or, later, through the Operations invite
// form per Ruling 1.1) exactly like a bespoke invitee.
//
// NO EMAIL (FT ruling 2026-07-15): this CLI DELIBERATELY does not send an
// invitation email — it only writes the claimable person row(s). The Operations
// invite FORM (POST /api/invites) sends the notification email; the CLI (bulk
// pre-seed, no request/Resend context) stays silent, and its invitees
// self-initiate at /signin.

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const ROSTER_PATH = 'scripts/pilot-invites.json';
const TMP_SQL_PATH = 'scripts/.invite-batch.tmp.sql';
const DB_NAME = 'stewardhouse-pilot';
const ALLOWED_TYPES = new Set(['individual', 'staff', 'advisor', 'ops']);

function fail(msg) {
  console.error(`[seed-invites] ERROR: ${msg}`);
  process.exit(1);
}

function escapeSql(str) {
  return str.replace(/'/g, "''");
}

const args = process.argv.slice(2);
const target = args.includes('--remote') ? '--remote' : '--local';
if (target === '--remote') {
  console.log('[seed-invites] WARNING: --remote targets the LIVE production database.');
  console.log('[seed-invites] Confirm you intend to run this directly — not via an automated agent.');
}

if (!existsSync(ROSTER_PATH)) {
  fail(`Roster file not found at ${ROSTER_PATH}. Copy scripts/pilot-invites.example.json to ${ROSTER_PATH} and fill in real invitees.`);
}

let roster;
try {
  roster = JSON.parse(readFileSync(ROSTER_PATH, 'utf8'));
} catch (e) {
  fail(`Failed to parse ${ROSTER_PATH} as JSON: ${e.message}`);
}

if (!Array.isArray(roster) || roster.length === 0) {
  fail(`${ROSTER_PATH} must be a non-empty JSON array.`);
}

const seenEmails = new Set();
const rows = [];

roster.forEach((entry, i) => {
  const ctx = `entry #${i} (${entry?.email ?? 'no email'})`;

  if (!entry || typeof entry !== 'object') fail(`${ctx}: not an object`);
  const { email, type, display_name, source_surface, extra } = entry;

  if (!email || typeof email !== 'string') fail(`${ctx}: missing/invalid "email"`);
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.includes('@')) fail(`${ctx}: "${email}" doesn't look like an email`);

  if (seenEmails.has(normalizedEmail)) {
    fail(`${ctx}: duplicate email "${normalizedEmail}" within roster file (the UNIQUE index would reject this)`);
  }
  seenEmails.add(normalizedEmail);

  if (!ALLOWED_TYPES.has(type)) {
    fail(`${ctx}: "type" must be one of ${[...ALLOWED_TYPES].join(', ')} — got "${type}".`);
  }

  if (!display_name || typeof display_name !== 'string') fail(`${ctx}: missing/invalid "display_name"`);
  if (!source_surface || typeof source_surface !== 'string') fail(`${ctx}: missing/invalid "source_surface"`);
  if (extra !== undefined && (typeof extra !== 'object' || extra === null || Array.isArray(extra))) {
    fail(`${ctx}: "extra" must be a plain object if present`);
  }

  const extensions = { [source_surface]: extra ?? {} };

  rows.push({
    id: randomUUID(),
    display_name,
    type,
    source_surface,
    extensions: JSON.stringify(extensions),
    invite_email: normalizedEmail,
  });
});

console.log(`[seed-invites] Validated ${rows.length} invitee row(s) from ${ROSTER_PATH}.`);

// Batch creation timestamp. All rows in this run are inserted in one statement
// at one instant, so they share a single ISO 8601 stamp — the same value shape
// the API path writes per request (functions/api/invites.js:93:
// `const nowIso = new Date().toISOString()`). Before this, created_at was
// omitted; migration 0014 added the column with NO DEFAULT, so CLI-seeded rows
// landed NULL and rendered "—" in the roster "Added" column while form-created
// rows showed a date. nowIso is machine-generated (ISO 8601, no quotes), so it
// is inlined like r.id rather than run through escapeSql.
const nowIso = new Date().toISOString();

const valuesSql = rows.map(r =>
  `('${r.id}', NULL, '${escapeSql(r.display_name)}', NULL, '${r.type}', '${escapeSql(r.source_surface)}', '${escapeSql(r.extensions)}', '${escapeSql(r.invite_email)}', NULL, NULL, '${nowIso}')`
).join(',\n  ');

const sql = `-- Generated by scripts/seed-invites.mjs — temp file, gitignored, deleted after apply
INSERT INTO person (id, auth_user_id, display_name, initials, type, source_surface, extensions, invite_email, soft_deleted_at, deletion_state, created_at) VALUES
  ${valuesSql};
`;

writeFileSync(TMP_SQL_PATH, sql, 'utf8');
console.log(`[seed-invites] Wrote ${TMP_SQL_PATH}`);

try {
  console.log(`[seed-invites] Applying to ${target === '--remote' ? 'REMOTE (live)' : 'local'} D1...`);
  const output = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', DB_NAME, target, `--file=${TMP_SQL_PATH}`, '-y'],
    { encoding: 'utf8', stdio: 'pipe', shell: true }
  );
  console.log(output);
  console.log(`[seed-invites] Done. ${rows.length} invitee row(s) applied.`);
} catch (e) {
  console.error('[seed-invites] wrangler execution FAILED:');
  console.error(e.stdout || e.message);
  process.exit(1);
} finally {
  if (existsSync(TMP_SQL_PATH)) {
    unlinkSync(TMP_SQL_PATH);
    console.log(`[seed-invites] Cleaned up ${TMP_SQL_PATH}`);
  }
}
