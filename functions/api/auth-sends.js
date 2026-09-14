// GET /api/auth-sends — the magic-link send log, newest first (A13, element 2).
//
// Closes the read half of the auth-observability gap CLAUDE.md §11 files. The
// table has recorded every attempted send since migration 0021 and NOTHING has
// ever read it, so a failure has been discoverable only by a direct d1 execute.
// This is the endpoint that ends that.
//
// GATED READ, ops-type only. requireOps enforces session -> person ->
// type === 'ops' server-side; A13's ruling (5) keeps that gate and adds no
// demo_gate, matching the roster read rather than the invite write.
//
// Export is onRequestGet ONLY — Cloudflare Pages Functions auto-405s POST/PUT/
// DELETE. This table is append-only and is written in exactly one place, the
// send stamp at functions/_lib/auth.js:449. Nothing here writes.
//
// NAMED FOR THE DATA, NOT FOR A VERDICT. The entry calls this "the auth health
// check", and the route deliberately does not. Ruling (5) forbids the view from
// stating a health verdict or having a green state, and an endpoint called
// /api/auth-health would assert in its own path the thing the view is ruled not
// to say. The table is a log of sends; the route says so.
//
// Response shapes:
//   No session:               401, { error: 'Not signed in' }
//   Session, no person match:  403, { error: 'No account found for session' }
//   Session, non-ops:          403, { error: 'This account type cannot read or
//                                      write platform records' }
//   Success:                   200, { sends: [ { id, outcome, attemptedAt,
//                                      status, errorName } ],
//                                    allTime: { lastSuccessAt, lastFailureAt } }
//
// -----------------------------------------------------------------------------
// WHAT IS DELIBERATELY NOT EMITTED, and it is most of the interesting column.
//
// `email` is OMITTED, per ruling (3), and no masked or hashed form replaces it.
// Migration 0021:96 marks the column NEVER emitted to any client under the E8
// discipline, and A92 — whether that rule should be amended so an operator can
// tell which address a failure belongs to — is open and stays open. This
// endpoint ships under the rule as it stands.
//
// `error_text` is SELECTED AND NEVER EMITTED. Ruling (2) requires the raw text
// to stay in the database, so it is read here, handed to parseSendFailure, and
// dropped. What leaves is two derived fields: an integer status and a name that
// survived an allowlist. The parser is pure and documented at
// functions/_lib/sendOutcome.js, including the one thing worth knowing about it
// — its contract is a template literal in sender.js, and a change there degrades
// every row silently.
//
// This is a DERIVE-AND-WITHHOLD read, which the roster precedent does not
// demonstrate: roster.js emits its columns essentially verbatim. The nearest
// precedent for shipping a derived value while withholding its source is
// me.js's ops.writesEnabled boolean.
//
// -----------------------------------------------------------------------------
// THE ACCOUNT TYPE, AND THE CONDITION IT IS EMITTED UNDER (A139, route b).
//
// The section above says what does not leave. This says what does, and why it
// is allowed to — which is a CONDITIONAL answer rather than a settled one.
//
// EMITTED UNDER A92's RULING OF 2026-09-14, WHICH HOLDS ONLY WHILE ops IS
// FT-EXCLUSIVE. The ground is not that a four-value enum is too coarse to
// identify anyone. At one ops account the operator and the subject are the SAME
// PERSON, so the type discloses nothing to its only reader. functions/_lib/
// gate.js:168-171 already states the premise this rests on: requireOps
// authorizes a full-fidelity operator view, "valid ONLY while ops is FT
// exclusively".
//
// IF A SECOND OPS ACCOUNT IS EVER CREATED, THIS IS RE-RULED BEFORE THAT ACCOUNT
// IS USABLE. Not gradually, and not at some population threshold: the
// disclosure becomes real the moment a second reader exists. gate.js:162-166
// carries the same condition and names what keeps it enforced — the ops-minting
// guard in functions/api/invites.js, which refuses type 'ops' with a 403. IF
// THAT GUARD IS EVER REMOVED, THIS EMISSION GOES WITH IT.
//
// IT DOES NOT REOPEN THE email COLUMN. A13's ruling (3) stands: the column is
// omitted and no masked or hashed form replaces it. The type is emitted
// ALONGSIDE that omission, never in place of it — a class label is not a
// substitute for an identifier, and past one account per type it names neither
// the address nor the person. A92 stays open and still governs the address.
//
// -----------------------------------------------------------------------------
// WHY THE JOIN LOWERCASES BOTH SIDES, AND WHAT THAT COSTS.
//
// EVERY OTHER LOOKUP IN THIS CODEBASE COMPARES THE BARE COLUMN — the claim hook
// at _lib/auth.js, the pre-send allowlist at api/auth/[[route]].js — so a reader
// comparing this join to either will find it doing something different. The
// reason is here rather than left to be inferred.
//
// THE TWO SIDES ARE STORED DIFFERENTLY. auth_send_log.email is whatever the user
// TYPED: the middleware forwards the request body unchanged and better-auth's
// magic-link plugin does not normalize. person.invite_email is stored
// trim+lowercased by every path that writes it. A bare comparison therefore
// works today only because nobody has typed a capital letter, and a mixed-case
// sign-in would silently render no type rather than erroring.
//
// THE INDEX COST IS REAL AND IS RECORDED RATHER THAN DISCOVERED.
// idx_person_invite_email is a plain UNIQUE index on the BARE column, so
// lower(p.invite_email) cannot use it and this join is a scan of person. That is
// free at current row counts — person holds single digits — and it is written
// down so a later reader meets it as a known trade rather than as a surprise.
//
// LOWER() COLLAPSES A DISTINCTION THE UNIQUE INDEX PRESERVES, which is the one
// way this join could return more rows than the table holds. The index is on the
// bare column, so 'A@x.com' and 'a@x.com' can BOTH exist; both would match one
// lower() comparison and DUPLICATE a log row.
// FORECLOSED BY EVERY WRITE PATH, not by luck: api/invites.js:122,
// api/athletes.js:135 and scripts/seed-invites.mjs:87 all trim().toLowerCase()
// before storing. The only route in is a migration or hand-written SQL.
// Measured zero case-colliding groups locally. A writer who adds a fourth path
// owes this line a re-check.
//
// -----------------------------------------------------------------------------
// TWO THINGS THIS JOIN DELIBERATELY DOES NOT DO.
//
// IT DOES NOT FILTER soft_deleted_at, AND THAT IS A DECISION RATHER THAN AN
// OMISSION. roster.js:53 does filter it, which makes the absence here look like
// a miss. Two reasons it is not. First, NOTHING IN THIS CODEBASE EVER WRITES
// THAT COLUMN NON-NULL — every INSERT writes NULL and no UPDATE sets it;
// api/invites/[id].js:52-64 records why deliberately, since a soft-deleted row
// still occupies its address under a UNIQUE index with no partial predicate, and
// no purge exists to free it. Second, and decisive even if it were written:
// ROSTER.JS LISTS PERSONS AND THIS LISTS ATTEMPTS. An attempt happened. A
// person's later disposition does not unhappen it, and dropping the row would
// silently shorten a log whose whole purpose is completeness.
//
// IT DOES NOT GUARD person.type AGAINST AN UNEXPECTED VALUE. The enum lives as a
// COMMENT at migrations/0001_initial.sql:127 and nowhere else — there is no
// CHECK — so a value outside individual/staff/advisor/ops is possible in
// principle, reachable only by a migration or a CLI seed. It renders AS ITSELF.
// AN ALLOWLIST WOULD BE WORSE: mapping the four and rendering an em dash
// otherwise would make an unexpected type INDISTINGUISHABLE FROM AN ABSENT ONE,
// which is two different facts collapsed into one display. An operator seeing a
// raw unexpected value learns something true; one seeing an em dash learns
// nothing and is misled about which case they are in.
//
// A JOIN MISS EMITS null, which the view renders through its existing absent
// idiom. What that em dash means in that column, and why it carries only one
// meaning rather than two, is recorded at the view.
//
// -----------------------------------------------------------------------------
// ORDERING, THE WINDOW, AND THE TIE-BREAK.
//
// Ruling (4) fixes the window: the most recent 100 attempts, newest first, no
// pagination. At pilot volume that is the whole table many times over; the cap
// exists so the response cannot grow without bound once it is not.
//
// THE TIE-BREAK IS THE IMPLEMENTER'S, NOT THE RULING'S. attempted_at is an ISO
// string with millisecond precision (auth.js:454, new Date().toISOString()), so
// collisions need two sends inside the same millisecond and are unlikely rather
// than impossible. Ruling (4) says nothing about them, and ordering that is
// undefined among equals is ordering that can differ between two loads of the
// same page for no visible reason. `id DESC` is added as a deterministic
// secondary: it is an opaque UUID, so it sorts arbitrarily but STABLY, which is
// the property being bought. It asserts no chronology and none should be read
// into it.
//
// idx_auth_send_log_attempted_at (0021:104) serves this ORDER BY — SQLite reads
// an index backwards for DESC. It is a single-column index and the tie-break
// falls outside it, which costs nothing at this row count.
//
// -----------------------------------------------------------------------------
// `allTime` IS NESTED SEPARATELY BECAUSE ITS SCOPE IS DIFFERENT, and conflating
// the two is the mistake the shape exists to prevent.
//
// Ruling (4) asks for the time of the last success and of the last failure
// ACROSS THE WHOLE TABLE. Those are NOT derivable from `sends`. Today the table
// is far below 100 rows so the two agree, and the moment it is not, a view that
// computed them from the window would quietly start reporting "last success" as
// the most recent success IN THE LAST 100 ATTEMPTS — which, in a run of 100
// failures, is exactly when the real answer matters most and exactly when the
// window would not contain it.
//
// So they ride a separate key rather than sitting beside the rows, and the
// second query is a whole-table read rather than a pass over what was already
// fetched.
//
// "allTime" IS TRUE ONLY WHILE NOTHING PRUNES. Retention is unbounded and
// unresolved (A12, and migration 0021:52-66: no cron, no scheduled worker, no
// [triggers], so no purge can run on any schedule). If Ruling E Clause 3 ever
// lands a window, this key becomes "all retained time" and both its name and
// whatever the view says about it need revisiting.
//
// MAX() OVER A TEXT COLUMN IS CHRONOLOGICAL HERE, AND THAT IS A PROPERTY OF THE
// WRITER RATHER THAN OF THE TABLE. attempted_at is TEXT (0021:100), and SQLite
// compares TEXT with BINARY collation, so MAX is lexicographic. That equals
// chronological ONLY because every value is a fixed-width UTC ISO 8601 instant:
// auth.js:454 writes new Date().toISOString() and is the SOLE writer of this
// table — verified by a repo-wide search, one INSERT at auth.js:449 and nothing
// else. A writer that ever stored a local time, an offset other than Z, or a
// different precision would break this comparison silently, and no test would
// catch it. A second writer owes this line a re-check.
//
// ONE ROW, ALWAYS. Conditional aggregates with no GROUP BY return exactly one
// row even against an empty table, with both columns NULL. That is why there is
// no empty-result branch below: "no successes have ever been recorded" and "the
// table is empty" both arrive as null, and both are honest as null.
//
// THE INDEX DOES NOT SERVE THIS QUERY. idx_auth_send_log_attempted_at carries no
// outcome column, so the conditional aggregates are a table scan. Immaterial at
// pilot volume, and recorded so the entry's claim that migration 0021 "already
// created the index for the newest-first shape" is not later read as covering
// both halves of ruling (4). It covers the list.

import { sql } from 'kysely';
import { makeDb, requireOps, jsonError, jsonOk } from '../_lib/gate.js';
import { parseSendFailure } from '../_lib/sendOutcome.js';

// Ruling (4): the most recent 100 attempts. Not configurable by the caller —
// there is no pagination, so a query parameter would be an unbounded read
// wearing a limit.
const WINDOW = 100;

export async function onRequestGet(context) {
  const db = makeDb(context);

  const resolved = await requireOps(db, context);
  if (resolved.error) return jsonError(resolved.error, resolved.status);

  const rows = await db
    .selectFrom('auth_send_log as l')
    .leftJoin('person as p', (join) =>
      join.on(sql`lower(p.invite_email) = lower(l.email)`))
    .select([
      'l.id as id',
      'l.outcome as outcome',
      'l.error_text as error_text',
      'l.attempted_at as attempted_at',
      'p.type as type',
    ])
    .orderBy('l.attempted_at', 'desc')
    .orderBy('l.id', 'desc')
    .limit(WINDOW)
    .execute();

  const sends = rows.map((row) => {
    // error_text enters here and does not leave. On a success row it is NULL by
    // the table's own definition and the parser returns nulls for both fields,
    // which is honest: a send that succeeded has no status it recorded and no
    // failure to name.
    const { status, name } = parseSendFailure(row.error_text);
    return {
      id: row.id,
      outcome: row.outcome,
      attemptedAt: row.attempted_at,
      status,
      errorName: name,
      type: row.type ?? null,
    };
  });

  // Sequential rather than concurrent: every multi-read handler in functions/
  // awaits in order (snapshots.js runs five), and a repo-wide search finds no
  // Promise.all anywhere in functions/. Two reads at pilot volume do not earn a
  // departure from that.
  //
  // Raw sql`` conditional aggregates rather than Kysely's fn.max + groupBy: the
  // house idiom for aggregates is the raw template (snapshots.js:156-158,
  // :172-173), and GROUP BY would return zero, one or two rows to be mapped
  // where this returns exactly one.
  const marks = await db
    .selectFrom('auth_send_log')
    .select(() => [
      sql`MAX(CASE WHEN outcome = 'success' THEN attempted_at END)`.as('last_success_at'),
      sql`MAX(CASE WHEN outcome = 'failure' THEN attempted_at END)`.as('last_failure_at'),
    ])
    .executeTakeFirst();

  return jsonOk({
    sends,
    allTime: {
      // ?? null rather than a bare read: executeTakeFirst is typed as possibly
      // undefined, and SQLite returns NULL for an aggregate over no matching
      // rows. Both collapse to null so the view has one absent case, not two.
      lastSuccessAt: marks?.last_success_at ?? null,
      lastFailureAt: marks?.last_failure_at ?? null,
    },
  });
}
