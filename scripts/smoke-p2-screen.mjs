// P-2 FT SCREEN SEED — LOCAL ONLY. Never --remote; this script writes directly
// to ONE miniflare D1 mirror file (named at DBF below) and has no remote code
// path at all.
//
// Built from the recovered Stage B artifacts, not from scratch:
//   - DB writes      : node:sqlite DatabaseSync against the config-resolved
//                      e7ff mirror (see the DBF note below; verify the
//                      dev-server banner matches before smoking).
//                      Same file + idiom as p2_seed.mjs.
//   - Cookie minting : cookieFor() lifted verbatim from p2_smoke.mjs:38-41 —
//                      better-call's signCookieValue form, i.e. HMAC-SHA256
//                      digested as STANDARD PADDED base64, then
//                      encodeURIComponent(`${token}.${signature}`).
//                      Do NOT substitute better-auth's own base64urlnopad HMAC
//                      (mint-session.mjs): empirically returns null from
//                      /api/me. Proven in p2_smoke.mjs:17-18.
//
// §6.12 secrets discipline: BETTER_AUTH_SECRET is read from .dev.vars into a
// local binding and is NEVER printed, logged, or returned. The derived cookie
// is likewise never echoed — it is written to a file and only a boolean is
// reported.
//
// §9 note: a minted cookie is an AGENT-side curl tool. It is NOT usable for a
// browser screen (HttpOnly/SameSite attributes and DevTools re-encoding make
// pasted cookie values fail). FT's browser screen needs the real magic-link
// flow against localhost:8788.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

// --- config-resolved local D1 mirror. Bare `pages dev`, `d1 execute --local`
// and `d1 migrations apply --local` all pass database_id (8600684c-…), which
// maps to this file. Confirmed 2026-08-11 by the dev-server banner reading
// `env.DB (stewardhouse-pilot)`. A `--d1 DB=stewardhouse-pilot` flag would bind
// 7202f096… instead (cli.js:302057 puts the NAME in the id slot), so VERIFY THE
// BANNER before trusting this path.
//
// The prior note here claimed this was "confirmed by sidecar-mtime probe; d1
// execute --local and d1 migrations list --local both converge here". The
// conclusion was right and the warrant was not: those two subcommands share one
// code path, so their agreement is a tautology, and neither touches `pages
// dev`. That reasoning is what ratified the wrong model for four weeks. ---
const DBF = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/e7ff1add35026ff038933f5ba06ac3049785578f5ff730414fed1f74d327b9ea.sqlite';
const BACKUP_DIR = '.wrangler/backups';

const INST = '04000000-0000-4000-8000-000000000010'; // the single institution
const DIANE_PERSON = '04000000-0000-4000-8000-000000000001';
const DIANE_AUTH_USER = 'au-diane-staging';
// Claim target for "claimed" athletes. Any existing person row satisfies the
// claimed:!!person_id emit in me.js; Diane is staff, so this row is never the
// signed-in individual and the me.js linkedAthlete path is not exercised.
const CLAIM_PERSON = '01000000-0000-4000-8000-000000000001';

const INSTITUTION_NAME = 'Ridgeline Polytechnic';
const WORKSHOP_ID = 'scr-wk-1';

const now = Date.now();
const nowIso = new Date(now).toISOString();
const exp = now + 7 * 24 * 3600 * 1000;
const stamp = nowIso.replace(/[:.]/g, '-');

// ---------------------------------------------------------------------------
// 1. BACKUP FIRST — VACUUM INTO, never cp (a file copy silently loses WAL
//    content; VACUUM INTO checkpoints into a consistent standalone file).
//    Written outside miniflare-D1DatabaseObject/ so wrangler never mistakes the
//    backup for a second bound database.
// ---------------------------------------------------------------------------
mkdirSync(BACKUP_DIR, { recursive: true });
const backupPath = `${BACKUP_DIR}/e7ff.screen-p2-backup-${stamp}.sqlite`;

const db = new DatabaseSync(DBF);
db.exec('PRAGMA foreign_keys = ON');
db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`);

// ---------------------------------------------------------------------------
// 2. CLEANUP — exactly the tables THIS seed writes, FK-safe order:
//    workshop_attendance -> workshop -> athlete -> session.
//    Attendance is deleted EXPLICITLY (scoped to the seeded workshop) rather
//    than relying on either CASCADE, so the order is legible and the delete
//    stays scoped to this seed's footprint. The workshop row itself has no
//    parent that would cascade it away, so it must be deleted by id.
//    athlete_activity / athlete_note / athlete_reflection are NOT written by
//    P-2 and are NOT touched.
// ---------------------------------------------------------------------------
db.prepare('DELETE FROM workshop_attendance WHERE workshop_id = ?').run(WORKSHOP_ID);
db.prepare('DELETE FROM workshop WHERE id = ?').run(WORKSHOP_ID);
db.exec("DELETE FROM athlete WHERE id LIKE 'scr-ath-%'");
db.prepare('DELETE FROM session WHERE user_id = ?').run(DIANE_AUTH_USER);

// ---------------------------------------------------------------------------
// 3. INSTITUTION RENAME — the only baseline mutation.
//    person.extensions.$.enterprise.organization still reads the old name and
//    is deliberately NOT updated: me.js:362-365 documents institution_contact /
//    institution as authoritative and that seeded copy as drift-prone. Flagged
//    for FT rather than silently changed.
// ---------------------------------------------------------------------------
db.prepare('UPDATE institution SET name = ? WHERE id = ?').run(INSTITUTION_NAME, INST);

// ---------------------------------------------------------------------------
// 4. ATHLETES
//    writable (FORK 1 rate base) == claimed && management_mode='delegated'.
//    gifts_count is 0 for every row: FORK 3 — no path writes it. That frozen 0
//    is precisely what the screen checks is never rendered as a finding.
// ---------------------------------------------------------------------------
const ins = db.prepare(`
  INSERT INTO athlete (
    id, institution_id, person_id, name, year, sport, email,
    gps_completed_at, lessons_count, gifts_count, last_active_at,
    enrollment_status, certified, cert_at,
    join_date, consent_acknowledged_at, management_mode,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const A = (r) => ins.run(
  r.id, INST, r.claimed ? CLAIM_PERSON : null, r.name, r.year, r.sport, r.email,
  r.gps, r.lessons, r.lastActive,
  r.status, r.cert, r.certAt,
  '2026-02-02', r.claimed ? nowIso : null, r.mode,
  nowIso, nowIso,
);

const ROSTER = [
  // --- writable set: claimed + delegated (5) ---
  { id: 'scr-ath-1', name: 'Amara Osei',          year: 'Sophomore', sport: 'Track & Field',
    claimed: 1, mode: 'delegated', lessons: 0, gps: null,         cert: 0, certAt: null,
    status: 'Invited',   lastActive: null,      email: 'amara.osei@example.org' },

  { id: 'scr-ath-2', name: 'Devin Marchetti',     year: 'Junior',    sport: 'Basketball',
    claimed: 1, mode: 'delegated', lessons: 3, gps: null,         cert: 0, certAt: null,
    status: 'Active',    lastActive: '2026-07-11', email: 'devin.marchetti@example.org' },

  { id: 'scr-ath-3', name: 'Priya Raghunathan',   year: 'Senior',    sport: 'Swimming',
    claimed: 1, mode: 'delegated', lessons: 4, gps: '2026-05-14', cert: 0, certAt: null,
    status: 'Active',    lastActive: '2026-07-14', email: 'priya.raghunathan@example.org' },

  { id: 'scr-ath-4', name: 'Callum Nkemdirim',    year: 'Senior',    sport: 'Soccer',
    claimed: 1, mode: 'delegated', lessons: 9, gps: '2026-03-20', cert: 1, certAt: '2026-06-28',
    status: 'Certified', lastActive: '2026-07-16', email: 'callum.nkemdirim@example.org' },

  { id: 'scr-ath-5', name: 'Sofia Lindqvist',     year: 'Freshman',  sport: 'Volleyball',
    claimed: 1, mode: 'delegated', lessons: 2, gps: '2026-06-02', cert: 0, certAt: null,
    status: 'Active',    lastActive: '2026-07-09', email: 'sofia.lindqvist@example.org' },

  // --- excluded from the rate base (2) ---
  // Self-managed: drives the FORK 1 disclosure AND the AthleteProfile
  // "Record-keeping not delegated — the athlete manages this account." line.
  // Carries milestones so the full-roster snapshot denominators diverge from
  // the writable-scoped live rates.
  { id: 'scr-ath-6', name: 'Theo Abernathy',      year: 'Junior',    sport: 'Baseball',
    claimed: 1, mode: 'self',      lessons: 5, gps: '2026-04-11', cert: 1, certAt: '2026-07-02',
    status: 'Active',    lastActive: '2026-07-15', email: 'theo.abernathy@example.org' },

  // Unclaimed: person_id NULL, mode NULL — "has not yet claimed their account".
  { id: 'scr-ath-7', name: 'Wren Castellanos',    year: 'Sophomore', sport: 'Tennis',
    claimed: 0, mode: null,        lessons: 0, gps: null,         cert: 0, certAt: null,
    status: 'Invited',   lastActive: null,      email: 'wren.castellanos@example.org' },
];

for (const r of ROSTER) A(r);

// ---------------------------------------------------------------------------
// 5. WORKSHOP + ATTENDANCE
//    One completed workshop (p2_seed.mjs's p2-wk shape; facilitator_person_id
//    stays NULL per E-Write-3a Q2, E4-deferred).
//
//    C-1 attendance gate: PUT /api/workshops/:id/attendance accepts a row only
//    for an athlete whose management_mode is EXACTLY 'delegated'. The seed
//    respects that gate rather than writing rows the API itself would reject —
//    so the self-managed Theo and the unclaimed Wren get NO attendance rows.
//    Attendance is therefore scoped to the 5 delegated athletes.
//
//    attendance_rate (snapshots.js:128-146) = SUM(attended) / COUNT(*) over
//    attendance rows joined to this institution's workshops. 3 of 5 attended
//    => 60%: non-zero and believable, deliberately not 100%.
// ---------------------------------------------------------------------------
db.prepare(`
  INSERT INTO workshop (id, institution_id, date, title, status,
                        notes, facilitator_person_id, module, summary,
                        created_at, updated_at)
  VALUES (?, ?, '2026-06-18', 'Foundations of Giving — Session 1', 'completed',
          NULL, NULL, NULL, NULL, ?, ?)
`).run(WORKSHOP_ID, INST, nowIso, nowIso);

const att = db.prepare(`
  INSERT INTO workshop_attendance (workshop_id, athlete_id, attended, note)
  VALUES (?, ?, ?, ?)
`);

// Delegated athletes only (scr-ath-1..5). Note text is factual, never
// evaluative — Path B: a record of what happened, not a judgment of a person.
const ATTENDANCE = [
  { id: 'scr-ath-1', attended: 1, note: null },
  { id: 'scr-ath-2', attended: 0, note: null },
  { id: 'scr-ath-3', attended: 1, note: 'Joined remotely.' },
  { id: 'scr-ath-4', attended: 1, note: null },
  { id: 'scr-ath-5', attended: 0, note: null },
];
for (const a of ATTENDANCE) att.run(WORKSHOP_ID, a.id, a.attended, a.note);

// ---------------------------------------------------------------------------
// 6. DIANE'S GATED SESSION (demo_gate=1 already on her person row — untouched)
// ---------------------------------------------------------------------------
const dianeToken = 'scrtok_diane_' + crypto.randomUUID().replace(/-/g, '');
db.prepare(`
  INSERT INTO session (id, user_id, token, expires_at, created_at, updated_at)
  VALUES ('scr-sess-diane', ?, ?, ?, ?, ?)
`).run(DIANE_AUTH_USER, dianeToken, exp, now, now);

// ---------------------------------------------------------------------------
// 7. COOKIE MINT — p2_smoke.mjs:38-41, verbatim. Secret opaque, cookie never
//    echoed: written to a file, reported only as a boolean.
// ---------------------------------------------------------------------------
const secret = (() => {
  const line = readFileSync('.dev.vars', 'utf8')
    .split('\n')
    .find((l) => l.startsWith('BETTER_AUTH_SECRET='));
  if (!line) throw new Error('BETTER_AUTH_SECRET not found in .dev.vars');
  return line.slice('BETTER_AUTH_SECRET='.length).trim();
})();

function cookieFor(token) {
  const sig = createHmac('sha256', secret).update(token).digest('base64');
  return `better-auth.session_token=${encodeURIComponent(`${token}.${sig}`)}`;
}

writeFileSync(`${BACKUP_DIR}/.screen-p2-cookie`, cookieFor(dianeToken));

// ---------------------------------------------------------------------------
// 8. GROUND TRUTH — what FT checks the screen against.
// ---------------------------------------------------------------------------
const rows = db.prepare(`
  SELECT name, (person_id IS NOT NULL) AS claimed, management_mode,
         lessons_count, (gps_completed_at IS NOT NULL) AS gps, certified, gifts_count
  FROM athlete WHERE id LIKE 'scr-ath-%' ORDER BY id
`).all();

const yn = (v) => (v ? 'yes' : 'no');
const writable = rows.filter((r) => r.claimed && r.management_mode === 'delegated');
const tot = rows.length;
const excluded = tot - writable.length;
const pct = (n, d) => (d ? Math.round((n / d) * 100) : null);

const wGps = writable.filter((r) => r.gps).length;
const wCert = writable.filter((r) => r.certified).length;
const wActive = writable.filter((r) => r.certified || (r.lessons_count > 0 && r.gps && !r.certified)).length;
const fGps = rows.filter((r) => r.gps).length;
const fCert = rows.filter((r) => r.certified).length;

console.log(`\nbackup: ${backupPath}`);
console.log(`institution renamed to: ${INSTITUTION_NAME}`);
console.log(`diane session: scr-sess-diane (token len ${dianeToken.length})`);
console.log(`cookie minted + written to ${BACKUP_DIR}/.screen-p2-cookie (never echoed): yes`);

console.log('\n--- GROUND-TRUTH ROSTER ---');
console.log('name                  | claimed | mode      | lessons | gps | certified | gifts');
console.log('----------------------+---------+-----------+---------+-----+-----------+------');
for (const r of rows) {
  console.log(
    `${r.name.padEnd(21)} | ${yn(r.claimed).padEnd(7)} | ${String(r.management_mode ?? '—').padEnd(9)} | ` +
    `${String(r.lessons_count).padEnd(7)} | ${yn(r.gps).padEnd(3)} | ${yn(r.certified).padEnd(9)} | ${r.gifts_count}`,
  );
}

const attRows = db.prepare(`
  SELECT a.name, wa.attended, wa.note
  FROM workshop_attendance wa
  JOIN athlete a ON a.id = wa.athlete_id
  WHERE wa.workshop_id = ? ORDER BY wa.athlete_id
`).all(WORKSHOP_ID);
const attTotal = attRows.length;
const attAttended = attRows.filter((r) => r.attended).length;

console.log('\n--- WORKSHOP ---');
console.log(`${WORKSHOP_ID}  "Foundations of Giving — Session 1"  2026-06-18  status=completed  facilitator=none`);
console.log('attendance (delegated athletes only — C-1 gate):');
for (const r of attRows) {
  console.log(`  ${r.name.padEnd(21)} ${r.attended ? 'attended' : 'absent  '}${r.note ? `  note: ${r.note}` : ''}`);
}
console.log(`  no attendance row for the self-managed or unclaimed athlete (C-1 gate would reject it)`);

console.log('\n--- EXPECTED DERIVED VALUES ---');
console.log(`tot=${tot}  writable=${writable.length}  excluded=${excluded}  consentAware=true`);
console.log(`attendance: ${attAttended} of ${attTotal} => attendance_rate=${pct(attAttended, attTotal)}%  (snapshots.js: SUM(attended)/COUNT(*))`);
console.log(`workshops held: 1 of 1 (0 remaining)`);
console.log(`live (writable-scoped): gpsRate=${pct(wGps, writable.length)}%  certRate=${pct(wCert, writable.length)}%  activelyProgressing=${pct(wActive, writable.length)}%`);
console.log(`snapshot (full roster): gpsRate=${pct(fGps, tot)}%  certRate=${pct(fCert, tot)}%   <- must READ DIFFERENTLY from the live rates`);
console.log(`RateDisclosure: covers ${writable.length} delegated; ${excluded} excluded (1 self-managed, 1 unclaimed)`);
console.log('FORK 3: every gifts figure must render "Not tracked" / "—", never 0');

db.close();
console.log('\nSCREEN SEED OK');
