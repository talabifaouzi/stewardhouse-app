#!/usr/bin/env node
// scripts/provision-institution.mjs
//
// Creates ONE institution + its institution_contact rows, linking already-
// invited staff person rows to the institution. This is the enterprise
// counterpart to seed-invites.mjs: seed-invites.mjs writes claimable staff
// PERSON rows (with invite_email); this script provisions the INSTITUTION and
// the staff↔institution linkage that a staff account needs to operate. Full
// runbook: docs/enterprise-provisioning-runbook.md.
//
// Usage:
//   node scripts/provision-institution.mjs --local            (default target)
//   node scripts/provision-institution.mjs --remote            (FT-RUN ONLY —
//                                                       remote D1 writes are an
//                                                       account-tied action per
//                                                       project protocol, NEVER
//                                                       run by an agent)
//
// Input file (scripts/provision-institution.json, gitignored — real institution
// data, never committed; scripts/provision-institution.example.json is the
// committed template). ONE institution object whose fields match the
// `institution` table (migration 0009/0010), plus a `contacts` array:
//   {
//     "name": "Example State University",       // required (NOT NULL)
//     "sector": "Athletics",                    // required (NOT NULL)
//     "dept": "Athletic Department",            // optional
//     "contract_label": "…",                    // optional
//     "tier": "…",                              // optional
//     "annual_amount": 85000,                   // optional integer USD
//     "endowment_annual": 8500,                 // optional integer USD
//     "endowment_current": 8628,                // optional integer USD
//     "program_term": "…",                      // optional
//     "contacts": [
//       { "email": "lead@school.edu", "role_title": "Senior Director, …",
//         "is_default_operator": 1 }
//     ]
//   }
//
// Validation:
//   - name + sector non-empty (the two NOT NULL institution columns).
//   - contacts non-empty; each role_title non-empty; is_default_operator ∈ 0/1;
//     EXACTLY ONE contact has is_default_operator === 1 (the endpoint-level
//     one-default-operator-per-institution invariant).
//   - each contact.email (normalized trim().toLowerCase()) RESOLVES to an
//     existing person row of type='staff' via invite_email. If an email has no
//     staff person row (invite not created / not the right type), the script
//     fails BEFORE any write — you provision only staff who were already
//     invited (seed-invites.mjs or the Operations invite form).
//
// This script does NOT set the $.enterprise.demo_gate designation flag — that
// is a SEPARATE deliberate step (see the runbook §3e), run only when onboarding
// a real institution.

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const INPUT_PATH = 'scripts/provision-institution.json';
const TMP_SQL_PATH = 'scripts/.provision-batch.tmp.sql';
const RESOLVE_SQL_PATH = 'scripts/.provision-resolve.tmp.sql';
const DB_NAME = 'stewardhouse-pilot';

function fail(msg) {
  console.error(`[provision-institution] ERROR: ${msg}`);
  process.exit(1);
}

function escapeSql(str) {
  return String(str).replace(/'/g, "''");
}

// SQL literal for a value: NULL for null/undefined, bare number for numbers,
// quoted+escaped for strings.
function sqlVal(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  if (typeof v === 'number') return String(v);
  return `'${escapeSql(v)}'`;
}

const args = process.argv.slice(2);
const target = args.includes('--remote') ? '--remote' : '--local';
if (target === '--remote') {
  console.log('[provision-institution] WARNING: --remote targets the LIVE production database.');
  console.log('[provision-institution] Confirm you intend to run this directly — not via an automated agent.');
}

if (!existsSync(INPUT_PATH)) {
  fail(`Input file not found at ${INPUT_PATH}. Copy scripts/provision-institution.example.json to ${INPUT_PATH} and fill in the real institution.`);
}

let spec;
try {
  spec = JSON.parse(readFileSync(INPUT_PATH, 'utf8'));
} catch (e) {
  fail(`Failed to parse ${INPUT_PATH} as JSON: ${e.message}`);
}
if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
  fail(`${INPUT_PATH} must be a single institution object.`);
}

// --- Institution field validation ---
if (!spec.name || typeof spec.name !== 'string') fail('institution "name" is required (non-empty string).');
if (!spec.sector || typeof spec.sector !== 'string') fail('institution "sector" is required (non-empty string).');

const INT_FIELDS = ['annual_amount', 'endowment_annual', 'endowment_current'];
for (const f of INT_FIELDS) {
  if (spec[f] !== undefined && spec[f] !== null && !Number.isInteger(spec[f])) {
    fail(`institution "${f}" must be an integer if present.`);
  }
}

// --- Contacts validation ---
if (!Array.isArray(spec.contacts) || spec.contacts.length === 0) {
  fail('"contacts" must be a non-empty array.');
}
const seenEmails = new Set();
let defaultCount = 0;
const contacts = spec.contacts.map((c, i) => {
  const ctx = `contacts[${i}] (${c?.email ?? 'no email'})`;
  if (!c || typeof c !== 'object') fail(`${ctx}: not an object`);
  if (!c.email || typeof c.email !== 'string') fail(`${ctx}: missing/invalid "email"`);
  const email = c.email.trim().toLowerCase();
  if (!email.includes('@')) fail(`${ctx}: "${c.email}" doesn't look like an email`);
  if (seenEmails.has(email)) fail(`${ctx}: duplicate email "${email}" within the file`);
  seenEmails.add(email);
  if (!c.role_title || typeof c.role_title !== 'string' || !c.role_title.trim()) {
    fail(`${ctx}: "role_title" is required (non-empty string)`);
  }
  const isDefault = c.is_default_operator === 1 ? 1 : (c.is_default_operator === 0 || c.is_default_operator === undefined ? 0 : null);
  if (isDefault === null) fail(`${ctx}: "is_default_operator" must be 0 or 1`);
  if (isDefault === 1) defaultCount += 1;
  return { email, role_title: c.role_title.trim(), is_default_operator: isDefault };
});
if (defaultCount !== 1) {
  fail(`exactly one contact must have is_default_operator=1 (found ${defaultCount}).`);
}

// --- Resolve each contact email to an existing type='staff' person row ---
// Single query against the SAME target DB the writes will apply to. Written to
// a temp .sql file and run via --file (NOT --command): the SQL contains spaces
// and single-quoted literals, which shell:true (needed for npx on Windows)
// would tokenize if passed inline — the --file path has neither. Mirrors the
// apply step and seed-invites.mjs.
const inList = [...seenEmails].map((e) => `'${escapeSql(e)}'`).join(', ');
const resolveSql = `SELECT id, invite_email, type FROM person WHERE invite_email IN (${inList});`;
writeFileSync(RESOLVE_SQL_PATH, resolveSql, 'utf8');
let resolvedRows;
try {
  const out = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', DB_NAME, target, `--file=${RESOLVE_SQL_PATH}`, '--json'],
    { encoding: 'utf8', stdio: 'pipe', shell: true },
  );
  const jsonStart = out.indexOf('[');
  if (jsonStart === -1) fail(`resolve query returned no JSON:\n${out}`);
  const parsed = JSON.parse(out.slice(jsonStart));
  resolvedRows = parsed[0]?.results ?? [];
} catch (e) {
  fail(`resolve query failed: ${e.stdout || e.message}`);
} finally {
  if (existsSync(RESOLVE_SQL_PATH)) unlinkSync(RESOLVE_SQL_PATH);
}

const personByEmail = new Map();
for (const r of resolvedRows) {
  personByEmail.set(String(r.invite_email).toLowerCase(), r);
}
for (const c of contacts) {
  const p = personByEmail.get(c.email);
  if (!p) fail(`no person row found for invite_email "${c.email}" — invite this staff member first (seed-invites.mjs or the Operations invite form).`);
  if (p.type !== 'staff') fail(`person for "${c.email}" is type '${p.type}', not 'staff' — only staff accounts can be institution contacts.`);
  c.person_id = p.id;
}

console.log(`[provision-institution] Validated institution "${spec.name}" with ${contacts.length} staff contact(s), all resolved to staff person rows.`);

// --- Generate institution + institution_contact INSERTs ---
const institutionId = randomUUID();
const nowIso = new Date().toISOString();

const institutionSql =
  `INSERT INTO institution (id, name, sector, dept, contract_label, tier, annual_amount, endowment_annual, endowment_current, program_term, created_at, updated_at) VALUES\n` +
  `  (${sqlVal(institutionId)}, ${sqlVal(spec.name)}, ${sqlVal(spec.sector)}, ${sqlVal(spec.dept ?? null)}, ` +
  `${sqlVal(spec.contract_label ?? null)}, ${sqlVal(spec.tier ?? null)}, ${sqlVal(spec.annual_amount ?? null)}, ` +
  `${sqlVal(spec.endowment_annual ?? null)}, ${sqlVal(spec.endowment_current ?? null)}, ${sqlVal(spec.program_term ?? null)}, ` +
  `${sqlVal(nowIso)}, ${sqlVal(nowIso)});`;

const contactSql = contacts.map((c) =>
  `INSERT INTO institution_contact (id, institution_id, person_id, role_title, is_default_operator, created_at) VALUES\n` +
  `  (${sqlVal(randomUUID())}, ${sqlVal(institutionId)}, ${sqlVal(c.person_id)}, ${sqlVal(c.role_title)}, ${c.is_default_operator}, ${sqlVal(nowIso)});`,
).join('\n');

const sql = `-- Generated by scripts/provision-institution.mjs — temp file, gitignored, deleted after apply\n${institutionSql}\n${contactSql}\n`;

writeFileSync(TMP_SQL_PATH, sql, 'utf8');
console.log(`[provision-institution] Wrote ${TMP_SQL_PATH}`);

try {
  console.log(`[provision-institution] Applying to ${target === '--remote' ? 'REMOTE (live)' : 'local'} D1...`);
  const output = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', DB_NAME, target, `--file=${TMP_SQL_PATH}`, '-y'],
    { encoding: 'utf8', stdio: 'pipe', shell: true },
  );
  console.log(output);
  console.log(`[provision-institution] Done. Institution "${spec.name}" (${institutionId}) + ${contacts.length} contact(s) applied.`);
} catch (e) {
  console.error('[provision-institution] wrangler execution FAILED:');
  console.error(e.stdout || e.message);
  process.exit(1);
} finally {
  if (existsSync(TMP_SQL_PATH)) {
    unlinkSync(TMP_SQL_PATH);
    console.log(`[provision-institution] Cleaned up ${TMP_SQL_PATH}`);
  }
}
