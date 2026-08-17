// PORTABILITY — READ BEFORE RUNNING ------------------------------------------
// The DBF constant below hardcodes a local miniflare store filename
// (e7ff1add…). That hash is MACHINE-SPECIFIC: it is the Durable-Object id
// miniflare derives from the id string wrangler hands it, and it will NOT match
// another clone, another machine, or a different d1_databases config. Do not
// assume it; confirm it.
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
// check.
// ----------------------------------------------------------------------------

// P-3c §7 ITEM 7 SMOKE SEED — LOCAL ONLY. Writes directly to the miniflare D1
// mirror file and has no remote code path at all.
//
// Extends the 2026-08-05 smoke-seed.mjs with the three fixture rows the gate's
// DENY branches need. That seed supplied only the ALLOW subject (smk-ath-1,
// delegated + claimed); every deny branch had no subject at all, so a gate that
// checked nothing would have passed the whole run.
//
// PRESERVED VERBATIM FROM smoke-seed.mjs:
//   - VACUUM INTO backup, never cp (§10 — a filesystem copy silently loses WAL)
//   - idempotent cleanup of THIS seed's footprint only, FK-safe order
//   - §6.12 secret handling: BETTER_AUTH_SECRET read into a local binding,
//     NEVER printed/logged/returned; cookies written to files, only booleans
//     reported
//
// ID DISCIPLINE: every new row is smk-% / p-smoke-% / au-smoke-%, so the
// EXISTING teardown patterns already cover them with no edit.
//
// STORE: the config-resolved mirror. Bare `pages dev`, `d1 execute --local` and
// `d1 migrations apply --local` all pass database_id (8600684c-…), which maps
// to this file. A `--d1 DB=stewardhouse-pilot` flag would bind 7202f096…
// instead (cli.js:302057 puts the NAME in the id slot). VERIFY THE DEV-SERVER
// BANNER READS `env.DB (stewardhouse-pilot)` — not `local-DB=…` — BEFORE
// TRUSTING THIS PATH.
//
// ENROLLMENT_STATUS VALUES INSERTED — all four in-enum for the 0016 CHECK
// (`'Invited','Active','Stalled','Sunset','Certified'`):
//   smk-ath-1  'Certified'   (unchanged from the 08-05 seed)
//   smk-ath-2  'Active'      D7 orphan
//   smk-ath-3  'Active'      static self-managed control
//   smk-ath-4  'Invited'     unclaimed control
// 'Sunset' is DELIBERATELY NOT USED anywhere: both PUT /api/athletes/:id
// (:224) and the attendance validator (:144) exclude Sunset rows and return
// 404 / "not on this institution roster", which would masquerade as a gate
// denial and make the 403 assertions unreadable.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const DBF = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/e7ff1add35026ff038933f5ba06ac3049785578f5ff730414fed1f74d327b9ea.sqlite';
const OUT = process.argv[2]; // scratchpad dir for cookie files
if (!OUT) {
  console.error('usage: node smoke-seed-p3c.mjs <scratchpad-dir>');
  process.exit(2);
}

const INST = '04000000-0000-4000-8000-000000000010';
const DIANE_AUTH_USER = 'au-diane-staging';

// Expected schema baseline, ONE place per script so a shipped migration is a
// one-line update rather than four scattered literals. Bumped 2026-08-17 from
// 17 to 18: migration 0018_client_consent_attested.sql shipped in 4c6eada and
// both P-3c smoke scripts still asserted 17, so both aborted on the correct
// store while reporting it as the wrong one.
//
// RULED 2026-08-17 (FT): KEEP THE LITERAL. Do NOT derive this count from
// migrations/ at runtime, and do NOT add a derived check alongside it.
//
// A derived count would pin the store only to the CURRENT TREE. This script
// asserts specific facts about 0016 (the enrollment_status CHECK) and 0017
// (gifts_count nullability), so derivation would pass GREEN on a tree whose
// schema has outrun those assertions, and the smoke would be checking stale
// facts while reporting success. The literal is what makes an outdated smoke
// detectable at all. Running both checks with two distinct messages was
// considered and rejected: more machinery than a scratch smoke warrants.
//
// Staleness is therefore handled by the ABORT MESSAGE below, which names both
// causes so a count mismatch is never mistaken for a binding problem. That is
// the whole mitigation, and it is deliberate rather than a compromise.
const EXPECTED_MIGRATIONS = 18;

const now = Date.now();
const nowIso = new Date(now).toISOString();
const exp = now + 7 * 24 * 3600 * 1000;

const db = new DatabaseSync(DBF);
db.exec('PRAGMA foreign_keys = ON');

// --- guard: refuse to seed the wrong store -----------------------------------
// The whole point of this slice. If the file we opened is not the expected
// store, we are on 7202 (or something unknown) and the smoke is void.
{
  const migs = db.prepare('SELECT COUNT(*) AS n FROM d1_migrations').get().n;
  const ddl = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='athlete'").get().sql;
  // `notnull` is a SQLite KEYWORD (the `expr NOTNULL` operator), so it cannot be
  // selected bare from pragma_table_info — and qualifying it (ti.notnull) does
  // NOT help either; only quoting does. Verified against node:sqlite 2026-08-13:
  //   bare / qualified-bare -> "near \"notnull\": syntax error"
  //   "notnull" / [notnull] / `notnull` / SELECT * -> OK
  const giftsNotNull = db.prepare(`SELECT "notnull" AS nn FROM pragma_table_info('cohort_period_snapshot') WHERE name='gifts_count'`).get().nn;
  const ok = migs === EXPECTED_MIGRATIONS && /CHECK \(enrollment_status/i.test(ddl) && giftsNotNull === 0;
  if (!ok) {
    console.error('ABORT store fingerprint mismatch. This is NOT necessarily the wrong store.');
    console.error(`  migrations=${migs} (expect ${EXPECTED_MIGRATIONS})  0016 CHECK=${/CHECK \(enrollment_status/i.test(ddl)}  0017 gifts_count nullable=${giftsNotNull === 0}`);
    console.error('  A COUNT mismatch has two causes and they need OPPOSITE fixes:');
    console.error('    (a) WRONG STORE bound. The §10 hazard this guard exists for. Read the');
    console.error('        wrangler banner: `env.DB (stewardhouse-pilot)` is config-resolved and');
    console.error('        correct; `env.DB (local-DB=stewardhouse-pilot)` means a --d1 flag has');
    console.error('        selected a different file. Do NOT edit this script.');
    console.error('    (b) STALE GUARD. A migration shipped after this script was last touched.');
    console.error(`        Check: ls migrations/*.sql | wc -l. If that reads ${migs}, the store is`);
    console.error('        right and EXPECTED_MIGRATIONS is behind. Bump it; do not hunt a binding.');
    console.error('  A CHECK or nullability mismatch is different: that is schema drift, not either');
    console.error('  of the above, and means the store predates 0016/0017.');
    db.close();
    process.exit(1);
  }
  console.log(`store fingerprint OK: ${EXPECTED_MIGRATIONS} migrations, 0016 CHECK present, 0017 applied`);
}

// --- backup FIRST — VACUUM INTO, never cp (§10) -------------------------------
mkdirSync('.wrangler/backups', { recursive: true });
const backupPath = `.wrangler/backups/e7ff.p3c-smoke-backup-${nowIso.replace(/[:.]/g, '-')}.sqlite`;
db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`);

// --- idempotent cleanup of THIS seed's footprint only, FK-safe order ----------
db.exec("DELETE FROM workshop_attendance WHERE workshop_id LIKE 'smk-%'");
db.exec("DELETE FROM workshop WHERE id LIKE 'smk-%'");
db.exec("DELETE FROM athlete WHERE id LIKE 'smk-%'");
db.exec("DELETE FROM session WHERE id LIKE 'smk-sess-%'");
db.exec("DELETE FROM person WHERE id LIKE 'p-smoke-%'");
db.exec("DELETE FROM auth_user WHERE id LIKE 'au-smoke-%'");

// --- auth_users + persons -----------------------------------------------------
// au-smoke-self / p-smoke-self is NEW: smk-ath-3 must be CLAIMED (person_id set)
// and self-managed, so that its 403 isolates management_mode alone. Binding it
// to p-smoke-athlete instead would make one person own two athlete rows, and
// POST /api/athlete-consent updates ALL rows for a person (athlete-consent.js:50)
// — the A2 flip would then move smk-ath-3 too and destroy the static control.
const insAu = db.prepare('INSERT INTO auth_user (id,email,email_verified,created_at,updated_at,name) VALUES (?,?,1,?,?,?)');
insAu.run('au-smoke-athlete', 'smoke-athlete@example.invalid', now, now, 'Smoke Athlete');
insAu.run('au-smoke-solo',    'smoke-solo@example.invalid',    now, now, 'Smoke Solo');
insAu.run('au-smoke-self',    'smoke-self@example.invalid',    now, now, 'Smoke Self');

const insP = db.prepare(`INSERT INTO person (id,auth_user_id,display_name,type,source_surface,extensions,invite_email,created_at)
                         VALUES (?,?,?,?,?,?,?,?)`);
insP.run('p-smoke-athlete', 'au-smoke-athlete', 'Smoke Athlete', 'individual', 'individual', '{}', 'smoke-athlete@example.invalid', nowIso);
insP.run('p-smoke-solo',    'au-smoke-solo',    'Smoke Solo',    'individual', 'individual', '{}', 'smoke-solo@example.invalid',    nowIso);
insP.run('p-smoke-self',    'au-smoke-self',    'Smoke Self',    'individual', 'individual', '{}', 'smoke-self@example.invalid',    nowIso);

// --- athletes: one ALLOW subject + three DENY subjects ------------------------
// gifts_count is 0 on every row: NOT NULL in this schema, and FORK 3 means no
// path writes it. The render layer reports "Not tracked"; the column stays 0.
const insAth = db.prepare(`
  INSERT INTO athlete (
    id, institution_id, person_id, name, year, sport, email,
    gps_completed_at, lessons_count, gifts_count, last_active_at,
    enrollment_status, certified, cert_at,
    join_date, consent_acknowledged_at, management_mode,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, '2026-02-02', ?, ?, ?, ?)
`);

const A = (r) => insAth.run(
  r.id, INST, r.personId, r.name, r.year, r.sport, r.email,
  r.gps, r.lessons, r.lastActive,
  r.status, r.cert, r.certAt,
  r.personId ? nowIso : null, r.mode,
  nowIso, nowIso,
);

// ALLOW — delegated AND claimed. The only row that satisfies both halves of the
// twin predicate ([id].js:231, attendance.js:161). Carries real milestones so
// the A1/A6 writes land on a populated row rather than a blank one.
A({ id: 'smk-ath-1', personId: 'p-smoke-athlete', name: 'Smoke Athlete',
    year: 'Senior', sport: 'Track & Field', email: 'smoke-athlete@example.invalid',
    gps: '2026-04-10', lessons: 6, lastActive: '2026-07-01',
    status: 'Certified', cert: 1, certAt: '2026-06-15', mode: 'delegated' });

// DENY (a) — D7 ORPHAN: management_mode='delegated' but person_id IS NULL.
// The ONLY subject that isolates the person_id half. Without it, a gate that
// checked management_mode alone passes every other assertion in the run.
// enrollment_status 'Active' — in-enum, and consistent with lessons_count 2.
A({ id: 'smk-ath-2', personId: null, name: 'Smoke Orphan',
    year: 'Junior', sport: 'Basketball', email: 'smoke-orphan@example.invalid',
    gps: null, lessons: 2, lastActive: '2026-06-20',
    status: 'Active', cert: 0, certAt: null, mode: 'delegated' });

// DENY (b) — STATIC SELF-MANAGED control, claimed to its OWN person.
// Distinguishes "the gate re-reads the column" from "the gate broke once at A3
// and stayed broken": this row must 403 both BEFORE A1 and AFTER A6, while
// smk-ath-1 returns 200 at both those points.
// Carries gps + lessons so it also exercises the FORK 1 / PhilanthropicReadiness
// case of a non-writable athlete holding real earned milestones.
A({ id: 'smk-ath-3', personId: 'p-smoke-self', name: 'Smoke Self',
    year: 'Senior', sport: 'Swimming', email: 'smoke-self@example.invalid',
    gps: '2026-05-14', lessons: 5, lastActive: '2026-07-05',
    status: 'Active', cert: 0, certAt: null, mode: 'self' });

// DENY (c) — UNCLAIMED: management_mode NULL, person_id NULL. The deny-by-default
// state C-1 exists to enforce. All-zero milestones, 'Invited' — in-enum, and the
// shape POST /api/athletes actually produces.
A({ id: 'smk-ath-4', personId: null, name: 'Smoke Unclaimed',
    year: 'Sophomore', sport: 'Tennis', email: 'smoke-unclaimed@example.invalid',
    gps: null, lessons: 0, lastActive: null,
    status: 'Invited', cert: 0, certAt: null, mode: null });

// --- workshop for the A4 attendance-gate probe --------------------------------
// No workshop_attendance rows are seeded: A4 asserts the gate REJECTS the write,
// so any pre-existing row would make "0 rows after" unreadable.
db.prepare(`INSERT INTO workshop (id,institution_id,date,title,status,notes,facilitator_person_id,module,summary,created_at,updated_at)
            VALUES ('smk-wk-1',?, '2026-06-18','Smoke Workshop','completed',NULL,NULL,NULL,NULL,?,?)`)
  .run(INST, nowIso, nowIso);

// --- sessions -----------------------------------------------------------------
const insS = db.prepare('INSERT INTO session (id,user_id,token,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?)');
const mk = (id, user) => {
  const token = 'smktok_' + crypto.randomUUID().replace(/-/g, '');
  insS.run(id, user, token, exp, now, now);
  return token;
};
const tokAthlete = mk('smk-sess-athlete', 'au-smoke-athlete');
const tokSolo    = mk('smk-sess-solo',    'au-smoke-solo');
const tokSelf    = mk('smk-sess-self',    'au-smoke-self');
const tokDiane   = mk('smk-sess-diane',   DIANE_AUTH_USER);

// --- cookie mint (§6.12: secret opaque, never echoed) -------------------------
// Recipe verified still accurate 2026-08-11 against this install: better-auth is
// exact-pinned at 1.6.20; auth.js passes no `advanced` block so the cookie name
// is the default `better-auth.session_token`; auth.js:104 sets
// cookieCache:{enabled:false} so a minted session row is honoured immediately;
// gate.js:53 delegates verification to auth.api.getSession.
// STANDARD PADDED base64 — better-auth's own base64url-nopad form empirically
// returns null from /api/me (seed-screen-p2.mjs:5-13).
const secret = (() => {
  const line = readFileSync('.dev.vars', 'utf8').split('\n').find((l) => l.startsWith('BETTER_AUTH_SECRET='));
  if (!line) throw new Error('BETTER_AUTH_SECRET not found in .dev.vars');
  return line.slice('BETTER_AUTH_SECRET='.length).trim();
})();
const cookieFor = (t) => `better-auth.session_token=${encodeURIComponent(`${t}.${createHmac('sha256', secret).update(t).digest('base64')}`)}`;
writeFileSync(`${OUT}/.ck-athlete`, cookieFor(tokAthlete));
writeFileSync(`${OUT}/.ck-solo`,    cookieFor(tokSolo));
writeFileSync(`${OUT}/.ck-self`,    cookieFor(tokSelf));
writeFileSync(`${OUT}/.ck-diane`,   cookieFor(tokDiane));

console.log('backup:', backupPath);
console.log('secret loaded: yes');
console.log('cookies written (never echoed): yes');

console.log('\n--- SEEDED ATHLETES (BEFORE any flip) ---');
for (const r of db.prepare(`SELECT id, person_id, management_mode, lessons_count, gps_completed_at,
                                   certified, enrollment_status
                            FROM athlete WHERE id LIKE 'smk-%' ORDER BY id`).all()) {
  const branch = r.management_mode === 'delegated' && r.person_id != null ? 'ALLOW'
    : r.management_mode === 'delegated' ? 'DENY(D7 orphan)'
      : r.management_mode === 'self' ? 'DENY(self)'
        : 'DENY(unclaimed)';
  console.log(`  ${r.id}  ${branch.padEnd(16)} mode=${String(r.management_mode)}  person_id=${r.person_id ? 'set' : 'NULL'}  status=${r.enrollment_status}  lessons=${r.lessons_count}`);
}

// In-enum confirmation, asserted rather than asserted-in-comments.
const ENUM = new Set(['Invited', 'Active', 'Stalled', 'Sunset', 'Certified']);
const bad = db.prepare("SELECT id, enrollment_status FROM athlete WHERE id LIKE 'smk-%'").all()
  .filter((r) => !ENUM.has(r.enrollment_status));
console.log(`\nenrollment_status all in-enum for 0016: ${bad.length === 0}${bad.length ? ' — ' + JSON.stringify(bad) : ''}`);

db.close();
console.log('\nSEED OK');
