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
//                                      status, errorName } ] }
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
    .selectFrom('auth_send_log')
    .select(['id', 'outcome', 'error_text', 'attempted_at'])
    .orderBy('attempted_at', 'desc')
    .orderBy('id', 'desc')
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
    };
  });

  return jsonOk({ sends });
}
