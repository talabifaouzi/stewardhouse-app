// Send-outcome vocabulary for auth_send_log (A13, element 1).
//
// PURE. No I/O, no D1, no env. Given the `error_text` column as stored, returns
// the HTTP status as an integer and Resend's error name when that name is one
// this project recognizes. Ruling (2) of A13's five requires the derivation to
// happen server-side so the raw `error_text` never leaves the database; this
// module is that derivation, and the endpoint emits only what it returns.
//
// -----------------------------------------------------------------------------
// THE CONTRACT IS A TEMPLATE LITERAL IN ANOTHER FILE, AND THAT IS THE WHOLE RISK.
//
// FORK 1 (FT-ruled) chose PARSE over structured capture: no migration, and no
// edit to functions/_lib/auth.js or functions/_lib/sender.js. So the input to
// this parser is not a column with a type. It is whatever string was thrown, and
// for the Resend path that string is built at exactly one site:
//
//     functions/_lib/sender.js:52
//     throw new Error(`Resend send failed: ${res.status} ${errText}`);
//
// stored verbatim by the stamp at functions/_lib/auth.js:467
// (`err.message`, unwrapped) into auth_send_log.error_text.
//
// IF THAT LITERAL CHANGES, EVERY ROW DEGRADES TO "unrecognized failure",
// SILENTLY. The parse stops matching, status becomes null, name becomes null,
// and the view goes on rendering — it simply stops saying anything. There is no
// error, no warning, and no partial signal; the failure mode is uniform silence,
// which reads exactly like a run of failures nobody could classify.
//
// NO TEST CATCHES IT. This project has no test runner, no CI and no hooks
// (CLAUDE.md §6, its opening posture note), so nothing anywhere will fail if
// sender.js:52 is reworded. The only thing standing between that edit and a
// silently useless view is a reader of this docblock.
//
// A reader who edits sender.js:52 owes this file the same edit.
//
// -----------------------------------------------------------------------------
// THE ALLOWLIST IS INCOMPLETE, AND ITS INCOMPLETENESS IS SAFE.
//
// Ruling (2) admits Resend's error name "only when it belongs to Resend's
// documented set". THAT SET IS NOT IN THIS REPOSITORY and was not fetched to
// write this file. One name is evidenced here — `validation_error`, in the
// response body quoted in CLAUDE.md §11's 2026-07-20 incident record — and it is
// seeded below on that evidence alone.
//
// Everything absent from this set reads as an unrecognized name, which is the
// default ruling (2) already mandates. So an incomplete list errs toward saying
// LESS rather than toward saying something false, which is the correct direction
// for a view whose whole posture (ruling 5) is that it states no verdict. The
// cost is only that a genuine Resend name renders as unrecognized until someone
// adds it.
//
// COMPLETING THIS SET IS AN FT DECISION, not a tidy-up: it needs a source, and
// the source is Resend's published error documentation rather than anyone's
// recollection. Adding a name without one is the failure A136 exists to record.
//
// -----------------------------------------------------------------------------
// WHAT PRODUCES A ROW WITH NO STATUS, so a reader does not treat null as a bug.
// Three classes, all of them real and all of them correct:
//
//   1. The send never reached Resend. `fetch` rejected, so no response and no
//      status ever existed. sender.js:36 throws whatever the runtime threw.
//   2. createSender refused before any network call — an unknown
//      SENDER_PROVIDER (sender.js:30) or the unimplemented cf-email provider
//      (sender.js:28). CLAUDE.md §9's standing rule has smokes override
//      SENDER_PROVIDER precisely to reach the first of those, so rows of this
//      shape exist deliberately.
//   3. The row is a SUCCESS row. error_text is NULL by the table's own
//      definition (migrations/0021_auth_send_log.sql:99), and a success has no
//      failure to classify.
//
// A caller wanting ruling (2)'s "unrecognized failure" tests for BOTH fields
// being null. A row with a status but no recognized name is not unrecognized —
// the status is the thing that was recognized, and the view renders it.

// Resend error names this project recognizes. See the allowlist note above
// before adding to it: entries need a documented source, not a recollection.
export const RESEND_DOCUMENTED_ERROR_NAMES = new Set([
  // Evidenced at CLAUDE.md §11, the 2026-07-20 production incident, which
  // quotes the response body verbatim:
  //   {"statusCode":401,"name":"validation_error","message":"API key is invalid"}
  'validation_error',
]);

// The shape sender.js:52 produces. Anchored, so a body that happens to contain
// the same words cannot be mistaken for the prefix. Three digits because an
// HTTP status is always three; `res.status` cannot be anything else.
const RESEND_FAILURE_PREFIX = /^Resend send failed: (\d{3})(?: |$)/;

/**
 * Derive the emittable vocabulary from a stored auth_send_log.error_text.
 *
 * @param {string|null|undefined} errorText - the column as stored, verbatim.
 * @returns {{ status: number|null, name: string|null }}
 *   status - the HTTP status Resend answered with, or null when no response
 *            ever arrived (see the three no-status classes above).
 *   name   - Resend's error name, ONLY when it is in the allowlist above.
 *            null for an unlisted name, an unparseable body, or no body.
 *
 * Never throws. Never returns the input or any part of it: the raw text does
 * not leave the database, per ruling (2).
 */
export function parseSendFailure(errorText) {
  const none = { status: null, name: null };
  if (typeof errorText !== 'string' || errorText === '') return none;

  const match = RESEND_FAILURE_PREFIX.exec(errorText);
  if (!match) return none;

  const status = Number(match[1]);

  // Everything after the prefix is the raw Resend body. It is JSON in the
  // documented failure cases and can be anything at all otherwise (an HTML
  // error page from an edge, an empty string when the body was empty), so the
  // parse is attempted and discarded on any failure.
  const body = errorText.slice(match[0].length);
  let name = null;
  if (body !== '') {
    try {
      const parsed = JSON.parse(body);
      // The body's own `statusCode` is deliberately IGNORED. `res.status` is
      // what the transport actually returned; statusCode is Resend echoing
      // itself inside a payload, and the two disagreeing would be a fact about
      // Resend rather than about this send.
      const candidate = parsed?.name;
      if (typeof candidate === 'string' && RESEND_DOCUMENTED_ERROR_NAMES.has(candidate)) {
        name = candidate;
      }
    } catch {
      // Not JSON. The status still stands on its own; only the name is lost.
    }
  }

  return { status, name };
}
