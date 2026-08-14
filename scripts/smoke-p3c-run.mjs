// PORTABILITY — READ BEFORE RUNNING ------------------------------------------
// The E7FF / S7202 constants below, and the TRIP baseline, hardcode local
// miniflare store filenames and a measured mtime. Those hashes are
// MACHINE-SPECIFIC: they are Durable-Object ids miniflare derives from the id
// string wrangler hands it, and they will NOT match another clone, another
// machine, or a different d1_databases config. The TRIP mtime/newest-row values
// describe one particular abandoned store on one machine and are meaningless
// elsewhere — on another clone the 7202 tripwire will simply report the store
// absent, which is correct.
//
// Before trusting either smoke script, start the dev server and READ THE
// BANNER. It must show the config-resolved binding:
//
//     env.DB    D1 Database    local
//       stewardhouse-pilot
//
// If it instead reads `env.DB (local-DB=stewardhouse-pilot)`, a `--d1` flag is
// in play: wrangler-dist/cli.js:302057 puts the database NAME into the
// database_id slot, which selects a DIFFERENT store. That divergence produced
// two parallel local databases on 2026-07-16, and the one `pages dev` was
// writing to sat two migrations behind for weeks. The banner line is the whole
// check — and this script REQUIRES you to pass what it said via --banner=.
//
// The P3 schema fingerprint (17 migrations + 0016 CHECK + 0017 nullable) is the
// portable half of the store check and does not depend on any hash.
// ----------------------------------------------------------------------------

// P-3c §7 ITEM 7 SMOKE RUNNER — proves the C-1 gate reads management_mode PER
// REQUEST, not once per session.
//
// Run AFTER smoke-seed-p3c.mjs, against a dev server started with NO --d1 flag.
//
//   npm run build
//   npx wrangler pages dev            <-- no --d1, ever
//   # confirm the banner reads:  env.DB    D1 Database   local
//   #                              stewardhouse-pilot
//   # NOT `env.DB (local-DB=stewardhouse-pilot)` — that is the 7202 store.
//   node smoke-seed-p3c.mjs <scratchpad>
//   node smoke-run-p3c.mjs  <scratchpad> --banner=stewardhouse-pilot
//
// This runner NEVER reads BETTER_AUTH_SECRET. It consumes the cookie FILES the
// seed wrote. §6.12: cookie values are never printed.
//
// WHAT A PER-SESSION-ONLY GATE WOULD LOOK LIKE, and how A3 catches it:
//   (i)  requireGatedEnterprise resolving management_mode once alongside the
//        staff person, instead of a fresh SELECT per request;
//   (ii) better-auth cookieCache enabled with athlete state in the signed
//        payload (auth.js:104 explicitly disables it);
//   (iii) the server trusting AthletesProvider's client-held managementMode
//        from /api/me instead of reading the column.
// Under any of those, A3 returns 200 because the staff session was established
// while the athlete was still delegated. A3 therefore does NOT call /api/me and
// does NOT re-authenticate between A2 and A3 — introducing either would hand a
// per-session implementation a refresh point and destroy the discriminator.

import { readFileSync, statSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const OUT = process.argv[2];
const BANNER = (process.argv.find((a) => a.startsWith('--banner=')) || '').slice('--banner='.length);
const STORE_ARG = (process.argv.find((a) => a.startsWith('--store=')) || '').slice('--store='.length);
const BASE = 'http://localhost:8788';   // §9: localhost, never 127.0.0.1

const D1DIR = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
const E7FF = 'e7ff1add35026ff038933f5ba06ac3049785578f5ff730414fed1f74d327b9ea';
const S7202 = '7202f0963679a34f0afd379d1940cc7cf8e221e7f9a71cf001427cf1b6773de5';

// --- 7202 tripwire baseline (measured read-only 2026-08-11) ------------------
// 7202 has NEVER been cleaned (restore.mjs 2026-08-05 says so in its own output),
// so any write to it is PERMANENT and detectable. That makes it a free tripwire.
//
// mtime is compared with a TOLERANCE, deliberately. NTFS stores this timestamp
// at 100ns granularity (2026-08-05T16:37:29.0526506Z) and no JS Date can hold
// it: `statSync().mtime` is a Date, which ROUNDS to .053Z, while `mtimeMs` is a
// float carrying 1785947849052.6506 and `mtimeNs` a bigint carrying the exact
// value. An earlier version of this file asserted exact equality against
// '…29.052Z' — guessing truncation where the platform rounds — and failed on a
// store that was provably untouched. Whether a given platform/Node truncates or
// rounds is not something this assertion should depend on.
//
// So: compare mtimeMs numerically with a 1000 ms tolerance. This is immune to
// trunc-vs-round (they differ by <1 ms), immune to a fraction rounding across a
// second boundary (which second-level STRING equality is NOT: .9996 rounds up
// into the next second and changes the string), and immune to filesystem
// granularity differences. It still catches any real write by a wide margin —
// the baseline instant is 2026-08-05, so a write today moves mtime by ~10^8 ms,
// five orders of magnitude past the tolerance. There is no write this misses
// that exact comparison would catch.
const TRIP = {
  mtimeMs: 1785947849052.6506,   // statSync(...).mtimeMs, measured 2026-08-13
  mtimeToleranceMs: 1000,
  newestRow: '2026-07-16T19:10:32.615Z',
  migrations: 15,
};

let failures = 0;
const log = (s) => console.log(s);
function ok(name, cond, detail = '') {
  if (cond) log(`  PASS  ${name}${detail ? '  — ' + detail : ''}`);
  else { failures++; log(`  FAIL  ${name}${detail ? '  — ' + detail : ''}`); }
  return cond;
}
function die(msg) { console.error('\nABORT — ' + msg); process.exit(1); }

// =============================================================================
// PRECONDITIONS — abort before touching anything
// =============================================================================
log('=== PRECONDITIONS ===');

if (!OUT) die('usage: node smoke-run-p3c.mjs <scratchpad-dir> --banner=stewardhouse-pilot [--store=<prefix>]');

// (P1) The operator must have READ the dev-server banner and passed what it said.
// This is the only check that can see which store the SERVER bound; nothing
// readable from disk can substitute for it.
if (BANNER !== 'stewardhouse-pilot') {
  die(`--banner must be exactly "stewardhouse-pilot" (what bare \`pages dev\` prints).\n`
    + `        You passed: ${JSON.stringify(BANNER)}\n`
    + `        If the banner shows "local-DB=stewardhouse-pilot", a --d1 flag is in play,\n`
    + `        the server is on ${S7202.slice(0, 4)}…, and this smoke is void. Restart without --d1.`);
}
log('  PASS  dev-server banner confirmed as config-resolved (stewardhouse-pilot)');

// (P2) Exactly one candidate store, or an explicit choice.
const candidates = readdirSync(D1DIR).filter((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite');
let storeFile;
if (candidates.length === 0) die(`no .sqlite under ${D1DIR}`);
if (candidates.length === 1) {
  storeFile = candidates[0];
  log(`  PASS  exactly one candidate store: ${storeFile.slice(0, 8)}…`);
} else if (!STORE_ARG) {
  die(`${candidates.length} .sqlite files exist under ${D1DIR} and no --store was given:\n`
    + candidates.map((c) => '          ' + c).join('\n')
    + `\n        Pass --store=<id-prefix> to choose explicitly. Refusing to guess.`);
} else {
  const matches = candidates.filter((c) => c.startsWith(STORE_ARG));
  if (matches.length !== 1) die(`--store=${STORE_ARG} matched ${matches.length} files; need exactly 1`);
  storeFile = matches[0];
  log(`  PASS  explicit store choice: ${storeFile.slice(0, 8)}…  (${candidates.length} candidates present)`);
}
const STORE = `${D1DIR}/${storeFile}`;

// (P3) Schema fingerprint — the chosen store must BE the 17-migration store.
// Independent of the banner: if these disagree, stop, do not reconcile by guess.
{
  const db = new DatabaseSync(STORE, { readOnly: true });
  const migs = db.prepare('SELECT COUNT(*) AS n FROM d1_migrations').get().n;
  const ddl = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='athlete'").get().sql;
  // `notnull` is a SQLite KEYWORD — must be quoted, and qualifying it does not
  // help. See the note in smoke-seed-p3c.mjs; verified 2026-08-13.
  const nn = db.prepare(`SELECT "notnull" AS nn FROM pragma_table_info('cohort_period_snapshot') WHERE name='gifts_count'`).get().nn;
  db.close();
  const hasCheck = /CHECK \(enrollment_status/i.test(ddl);
  if (migs !== 17 || !hasCheck || nn !== 0) {
    die(`chosen store is not the 17-migration store: migrations=${migs} (expect 17), `
      + `0016 CHECK=${hasCheck}, 0017 nullable=${nn === 0}`);
  }
  if (!storeFile.startsWith(E7FF.slice(0, 8))) {
    log(`  WARN  store fingerprint matches but filename is not ${E7FF.slice(0, 8)}… — proceeding on fingerprint`);
  }
  log('  PASS  store fingerprint: 17 migrations, 0016 CHECK, 0017 applied');
}

// (P4) Cookie files present. Values are read but NEVER printed (§6.12).
const CK = {};
for (const who of ['diane', 'athlete', 'solo', 'self']) {
  try { CK[who] = readFileSync(`${OUT}/.ck-${who}`, 'utf8').trim(); }
  catch { die(`missing cookie file ${OUT}/.ck-${who} — run smoke-seed-p3c.mjs first`); }
}
log('  PASS  four cookie files loaded (values never echoed)');

// (P5) 7202 tripwire — BEFORE the run.
function tripwire(phase) {
  const f = `${D1DIR}/${S7202}.sqlite`;
  let present = true;
  try { statSync(f); } catch { present = false; }
  if (!present) { ok(`tripwire ${phase}: 7202 absent`, true, 'nothing to protect'); return; }
  // mtimeMs, not mtime — see the TRIP docblock. Reported as a delta so a real
  // failure is instantly legible as "moved by N ms" rather than two near-equal
  // timestamps the reader has to diff by eye.
  const mtMs = statSync(f).mtimeMs;
  const drift = Math.abs(mtMs - TRIP.mtimeMs);
  const db = new DatabaseSync(f, { readOnly: true });
  const migs = db.prepare('SELECT COUNT(*) AS n FROM d1_migrations').get().n;
  // MAX() over session.created_at: 7202 holds MIXED storage types here (one
  // hand-minted INTEGER row, one better-auth TEXT row). SQLite orders
  // INTEGER < TEXT, so MAX returns the TEXT value. Deterministic because 7202 is
  // frozen; compared as an exact string, which TEXT round-trips losslessly.
  const newest = db.prepare('SELECT MAX(created_at) AS mx FROM session').get().mx;
  db.close();
  ok(`tripwire ${phase}: 7202 file mtime unchanged`, drift < TRIP.mtimeToleranceMs,
    `drift ${drift.toFixed(4)} ms (tolerance ${TRIP.mtimeToleranceMs} ms)`);
  ok(`tripwire ${phase}: 7202 newest row unchanged`, newest === TRIP.newestRow, `${newest}`);
  ok(`tripwire ${phase}: 7202 still at 15 migrations`, migs === TRIP.migrations, `${migs}`);
}
tripwire('PRE');
if (failures) die('preconditions failed — not running the smoke');

// =============================================================================
// helpers
// =============================================================================
async function call(method, path, cookie, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Cookie: cookie, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, body: json, msg: json && json.error ? json.error : null };
}
function q(sql) {
  const db = new DatabaseSync(STORE, { readOnly: true });
  try { return db.prepare(sql).all(); } finally { db.close(); }
}
const lessonsOf = (id) => q(`SELECT lessons_count FROM athlete WHERE id='${id}'`)[0]?.lessons_count;
const modeOf = (id) => q(`SELECT management_mode FROM athlete WHERE id='${id}'`)[0]?.management_mode;

// Exact strings. `403` alone is ambiguous: requireGatedEnterprise returns 403
// with "Not authorized" when $.enterprise.demo_gate is unset. Asserting the
// message is what distinguishes the C-1 gate from the demo gate.
const MSG_PROGRESSION = 'Cannot record progression — the athlete has not delegated record-keeping to staff';
const MSG_ATTEND_PRE = 'Cannot record attendance — athlete(s) have not delegated management to staff';
const MSG_DEMO_GATE = 'Not authorized';
const MSG_NO_ATHLETE = 'No athlete record is linked to this account';

function assertGate403(name, r, expectMsgStartsWith) {
  ok(`${name}: status 403`, r.status === 403, `got ${r.status}`);
  ok(`${name}: message is the C-1 gate, not the demo gate`, r.msg !== MSG_DEMO_GATE, `msg=${JSON.stringify(r.msg)}`);
  ok(`${name}: exact message`, typeof r.msg === 'string' && r.msg.startsWith(expectMsgStartsWith), `msg=${JSON.stringify(r.msg)}`);
}

// Static deny controls — run BEFORE A1 and again AFTER A9, so "denied" is shown
// to be a stable property of those rows and not an artifact of the A2 flip.
async function staticDenyControls(phase) {
  log(`\n--- A7/A8/A8b static deny controls (${phase}) ---`);
  const a7 = await call('PUT', '/api/athletes/smk-ath-3', CK.diane, { lessons: 1 });
  assertGate403(`A7 ${phase} self-managed smk-ath-3`, a7, MSG_PROGRESSION);
  ok(`A7 ${phase}: no write landed`, lessonsOf('smk-ath-3') === 5, `lessons=${lessonsOf('smk-ath-3')}`);

  const a8 = await call('PUT', '/api/athletes/smk-ath-2', CK.diane, { lessons: 1 });
  assertGate403(`A8 ${phase} D7 orphan smk-ath-2`, a8, MSG_PROGRESSION);
  ok(`A8 ${phase}: no write landed`, lessonsOf('smk-ath-2') === 2, `lessons=${lessonsOf('smk-ath-2')}`);

  const a8b = await call('PUT', '/api/athletes/smk-ath-4', CK.diane, { lessons: 1 });
  assertGate403(`A8b ${phase} unclaimed smk-ath-4`, a8b, MSG_PROGRESSION);
  ok(`A8b ${phase}: no write landed`, lessonsOf('smk-ath-4') === 0, `lessons=${lessonsOf('smk-ath-4')}`);
}

// =============================================================================
// THE RUN
// =============================================================================
log('\n=== SMOKE ===');
await staticDenyControls('pre');

log('\n--- A1 allow branch ---');
const a1 = await call('PUT', '/api/athletes/smk-ath-1', CK.diane, { lessons: 7 });
ok('A1: 200', a1.status === 200, `got ${a1.status} ${JSON.stringify(a1.msg)}`);
ok('A1: lessons_count == 7 in D1', lessonsOf('smk-ath-1') === 7, `lessons=${lessonsOf('smk-ath-1')}`);

// ---------------------------------------------------------------------------
// A2 -> A3: THE DISCRIMINATOR. Nothing may run between them. In particular NO
// /api/me call, no re-authentication, no new cookie. The staff cookie used in
// A3 is byte-identical to the one used in A1, and the flip is performed by a
// DIFFERENT session (the athlete's own), scoped WHERE person_id = session person
// (athlete-consent.js:50) — staff cannot flip it themselves (see A11).
// ---------------------------------------------------------------------------
log('\n--- A2 athlete flips delegated -> self (athlete session) ---');
const a2 = await call('POST', '/api/athlete-consent', CK.athlete, { mode: 'self' });
ok('A2: 200', a2.status === 200, `got ${a2.status} ${JSON.stringify(a2.msg)}`);
ok('A2: body {mode:self, updated:1}', a2.body?.mode === 'self' && a2.body?.updated === 1, JSON.stringify(a2.body));
ok('A2: D1 column now self', modeOf('smk-ath-1') === 'self', `mode=${modeOf('smk-ath-1')}`);
ok('A2: flip did NOT touch the static self control', modeOf('smk-ath-3') === 'self', `mode=${modeOf('smk-ath-3')}`);

log('\n--- A3 SAME staff cookie, no re-auth, no /api/me: must now 403 ---');
const a3 = await call('PUT', '/api/athletes/smk-ath-1', CK.diane, { lessons: 8 });
assertGate403('A3', a3, MSG_PROGRESSION);
ok('A3: NO partial write — lessons_count still 7', lessonsOf('smk-ath-1') === 7, `lessons=${lessonsOf('smk-ath-1')}`);
ok('A3: >>> PER-REQUEST GATE PROVEN (a per-session gate returns 200 here) <<<', a3.status === 403);

log('\n--- A4 attendance twin gate, same staff cookie ---');
const a4 = await call('PUT', '/api/workshops/smk-wk-1/attendance', CK.diane,
  { records: [{ athleteId: 'smk-ath-1', attended: true }] });
assertGate403('A4', a4, MSG_ATTEND_PRE);
ok('A4: message names the blocked athlete', typeof a4.msg === 'string' && a4.msg.includes('smk-ath-1'), `msg=${JSON.stringify(a4.msg)}`);
ok('A4: whole-batch rejection — 0 attendance rows', q("SELECT COUNT(*) AS n FROM workshop_attendance WHERE workshop_id='smk-wk-1'")[0].n === 0);

log('\n--- A5 athlete flips back to delegated ---');
const a5 = await call('POST', '/api/athlete-consent', CK.athlete, { mode: 'delegated' });
ok('A5: 200', a5.status === 200, `got ${a5.status}`);
ok('A5: D1 column now delegated', modeOf('smk-ath-1') === 'delegated', `mode=${modeOf('smk-ath-1')}`);

log('\n--- A6 SAME staff cookie: must be allowed again (not a latch) ---');
const a6 = await call('PUT', '/api/athletes/smk-ath-1', CK.diane, { lessons: 8 });
ok('A6: 200', a6.status === 200, `got ${a6.status} ${JSON.stringify(a6.msg)}`);
ok('A6: lessons_count == 8 in D1', lessonsOf('smk-ath-1') === 8, `lessons=${lessonsOf('smk-ath-1')}`);
ok('A6: >>> gate re-reads in BOTH directions — 403 was not a one-way latch <<<', a6.status === 200);

// A9 is positioned HERE, after A6, deliberately. Without it every 403 above has
// a second explanation — a dead or expired staff cookie — which is exactly the
// failure mode that consumed 2026-08-05 (repeated `GET /api/me 200` with a null
// body, indistinguishable from a gate denial).
log('\n--- A9 same staff cookie still resolves (the 403s were the gate, not the session) ---');
const a9 = await call('GET', '/api/me', CK.diane);
ok('A9: 200', a9.status === 200, `got ${a9.status}`);
// Key path is body.person.enterprise, NOT body.enterprise: me.js:534 spreads the
// staff block INSIDE the person object (`...(enterprise && { enterprise })`), and
// me.js:8 documents the shape as { user, person: { type, displayName, …, advisor? } }.
// The first run of this file asserted the top-level path and reported
// enterprise=false against a perfectly healthy response.
ok('A9: staff enterprise block present', !!a9.body?.person && !!a9.body?.person?.enterprise,
  `person=${!!a9.body?.person} person.type=${a9.body?.person?.type} person.enterprise=${!!a9.body?.person?.enterprise}`);

await staticDenyControls('post');

log('\n--- A10 individual with no athlete row ---');
const a10 = await call('POST', '/api/athlete-consent', CK.solo, { mode: 'self' });
ok('A10: 403', a10.status === 403, `got ${a10.status}`);
ok('A10: exact message', a10.msg === MSG_NO_ATHLETE, `msg=${JSON.stringify(a10.msg)}`);

log('\n--- A11 staff cannot flip an athlete consent ---');
const a11 = await call('POST', '/api/athlete-consent', CK.diane, { mode: 'self' });
ok('A11: 403', a11.status === 403, `got ${a11.status}`);
ok('A11: athlete row untouched by the staff attempt', modeOf('smk-ath-1') === 'delegated', `mode=${modeOf('smk-ath-1')}`);

tripwire('POST-RUN');

// =============================================================================
// TEARDOWN + BASELINE VERIFICATION
// =============================================================================
log('\n=== TEARDOWN ===');
{
  const db = new DatabaseSync(STORE);      // read-write, deliberately
  db.exec('PRAGMA foreign_keys = ON');
  db.exec("DELETE FROM workshop_attendance WHERE workshop_id LIKE 'smk-%'");
  db.exec("DELETE FROM workshop WHERE id LIKE 'smk-%'");
  db.exec("DELETE FROM athlete WHERE id LIKE 'smk-%'");
  db.exec("DELETE FROM session WHERE id LIKE 'smk-sess-%'");
  db.exec("DELETE FROM person WHERE id LIKE 'p-smoke-%'");
  db.exec("DELETE FROM auth_user WHERE id LIKE 'au-smoke-%'");
  db.close();
  log('  teardown executed (smk-% / p-smoke-% / au-smoke-%, FK-safe order)');
}

log('\n=== BASELINE VERIFICATION ===');
const one = (sql) => q(sql)[0];
ok('migrations == 17', one('SELECT COUNT(*) AS n FROM d1_migrations').n === 17);
ok("last migration == 0017_snapshot_gifts_nullable.sql",
  one('SELECT MAX(name) AS mx FROM d1_migrations').mx === '0017_snapshot_gifts_nullable.sql');
ok('athlete == 0', one('SELECT COUNT(*) AS n FROM athlete').n === 0);
ok('workshop == 0', one('SELECT COUNT(*) AS n FROM workshop').n === 0);
ok('workshop_attendance == 0', one('SELECT COUNT(*) AS n FROM workshop_attendance').n === 0);
ok('session == 0', one('SELECT COUNT(*) AS n FROM session').n === 0);
ok('person == 6', one('SELECT COUNT(*) AS n FROM person').n === 6);
ok('no p-smoke-/scr-/smk- persons',
  one("SELECT COUNT(*) AS n FROM person WHERE id LIKE 'p-smoke-%' OR id LIKE 'scr-%' OR id LIKE 'smk-%'").n === 0);
ok('auth_user == 1', one('SELECT COUNT(*) AS n FROM auth_user').n === 1);
ok("auth_user id == au-diane-staging", one('SELECT id FROM auth_user').id === 'au-diane-staging');
ok('gift == 3', one('SELECT COUNT(*) AS n FROM gift').n === 3);
ok("institution name == Cooper State University",
  one("SELECT name FROM institution WHERE id='04000000-0000-4000-8000-000000000010'").name === 'Cooper State University');
{
  const d = one(`SELECT type, json_extract(extensions,'$.enterprise.demo_gate') AS gate,
                        (auth_user_id IS NOT NULL) AS claimed
                 FROM person WHERE id='04000000-0000-4000-8000-000000000001'`);
  ok('Diane staff + demo_gate 1 + claimed', d.type === 'staff' && d.gate === 1 && d.claimed === 1, JSON.stringify(d));
}
{
  const ddl = one("SELECT sql FROM sqlite_master WHERE type='table' AND name='athlete'").sql;
  ok('0016 CHECK still present', /CHECK \(enrollment_status/i.test(ddl));
  ok('0017 gifts_count still nullable',
    one(`SELECT "notnull" AS nn FROM pragma_table_info('cohort_period_snapshot') WHERE name='gifts_count'`).nn === 0);
}

// --- residue sweep -----------------------------------------------------------
// CORRECTED from the plan-stage version, which would have FALSE-FAILED on the
// baseline: auth_user's single row carries created_at/updated_at = 1784220345000
// (= 2026-07-16T16:45:45.000Z), which EXCEEDS the 2026-07-08 threshold. That row
// is baseline, not residue. So auth_user is asserted by exact value and excluded
// from the threshold sweep; every other timestamped table must be <= 2026-07-08.
{
  const au = one('SELECT created_at AS c, updated_at AS u FROM auth_user');
  ok('auth_user baseline stamp exact (excluded from sweep)',
    Number(au.c) === 1784220345000 && Number(au.u) === 1784220345000, JSON.stringify(au));

  // Compared as INSTANTS (epoch ms), not as normalized ISO strings.
  //
  // The previous form built ISO strings and compared them with `>`, which is
  // only correct while every value happens to share the identical 24-char
  // shape. A value stored with a space separator — "2026-07-07 16:33:11", the
  // d1_migrations idiom, and nothing stops another table adopting it — is
  // ordered by the ' ' (0x20) vs 'T' (0x54) byte at index 10 rather than by
  // time. That is the same class of defect as the mtime constant: an assertion
  // resting on a representation the data does not faithfully round-trip.
  //
  // Day-granularity is the real intent, so the bound is an exclusive
  // start-of-next-day rather than a spurious .999 millisecond.
  const CUTOFF_MS = Date.parse('2026-07-09T00:00:00.000Z');
  const toMs = (v) => {
    if (v == null) return null;
    if (typeof v === 'number') return v;                                  // epoch ms
    const s = String(v);
    if (/^\d{10,}$/.test(s)) return Number(s);                            // epoch ms as text
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return Date.parse(s + 'T00:00:00.000Z');
    const t = Date.parse(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
    return Number.isNaN(t) ? NaN : t;                                     // NaN => reported, never skipped
  };
  const db = new DatabaseSync(STORE, { readOnly: true });
  const tables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' "
    + "AND name NOT LIKE '_cf%' AND name NOT IN ('d1_migrations','auth_user')").all().map((r) => r.name);
  const offenders = [];
  for (const t of tables) {
    const cols = db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name)
      .filter((c) => /(created_at|updated_at|flagged_at|opened_at|sent_at|taken_at|recorded_at)$/.test(c));
    for (const c of cols) {
      const mx = db.prepare(`SELECT MAX(${c}) AS mx FROM ${t}`).get().mx;
      const ms = toMs(mx);
      if (ms == null) continue;                                   // genuinely empty column
      if (Number.isNaN(ms)) offenders.push(`${t}.${c} = ${mx} (UNPARSEABLE — not silently skipped)`);
      else if (ms >= CUTOFF_MS) offenders.push(`${t}.${c} = ${mx}`);
    }
  }
  db.close();
  ok(`residue sweep: every non-auth_user stamp before 2026-07-09`, offenders.length === 0,
    offenders.length ? offenders.join('; ') : 'clean');
}

log(`\n=== RESULT: ${failures === 0 ? 'ALL ASSERTIONS PASSED' : failures + ' FAILURE(S)'} ===`);
process.exit(failures === 0 ? 0 : 1);
