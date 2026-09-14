// Instant formatter for the send-log view (A13, element 5).
//
// Renders a stored `attempted_at` as a DATE AND A TIME OF DAY. The existing
// operations helper, formatAdded (OperationsRoster.jsx:34-38), is date-only BY
// DESIGN and is deliberately untouched: an account's "Added" date is a fact
// about a day, and the time it was minted carries nothing an operator needs.
//
// THIS VIEW IS THE OPPOSITE CASE, and it is the reason a second helper exists
// rather than a widened first one. The July 2026 incident (CLAUDE.md §11) ran
// for five days with attempts minutes apart; under a date-only format those
// collapse into five identical-looking dates and the one thing a reader wants
// to see — that attempts kept arriving and kept failing, and at what cadence —
// is exactly what is erased. Ruling (1) sharpens it further: FT signs in and
// then looks for THAT attempt, moments old. A date cannot answer that question
// on the day it is asked.
//
// -----------------------------------------------------------------------------
// THE OUTPUT IS UTC. THE OPERATOR READING IT IS NOT IN UTC. BOTH HALVES MATTER.
//
// WHAT IT RENDERS: the instant exactly as stored, in UTC, with the zone named
// in the string itself — "Sep 14, 2026 · 14:30:47 UTC". The label is not
// decoration. A bare "14:30:47" beside a row would be read as the reader's own
// wall clock by default, and would be wrong by whatever their offset is, with
// nothing on screen to say so.
//
// WHY UTC, three reasons and they compound:
//
//   1. IT IS WHAT IS STORED. auth.js:454 writes new Date().toISOString(), a
//      fixed-width UTC instant, and is the sole writer of the table. Rendering
//      UTC is a transcription; rendering local is a conversion, and a
//      conversion has a direction, a DST discontinuity, and a way to be wrong.
//
//   2. IT IS THE HOUSE CONVENTION, ALREADY RULED ONCE. Both existing date
//      helpers render UTC deliberately: formatAdded slices the ISO string
//      field-wise rather than touching Date at all, and formatSessionDate
//      (src/data/clients.js:889-899) pins timeZone:'UTC' under ADV-012, bundle
//      12, so the day "stays stable regardless of the local clock". A grep of
//      src/ finds exactly one timeZone pin, and it is that one. A view that
//      rendered local time would be the only place in the product that does,
//      which is worse for an operator than a consistent offset.
//
//   3. IT IS STABLE ACROSS READERS. Two people comparing what they see, or one
//      person comparing against a deployment tail or a Resend dashboard entry,
//      read the same string. A local-time render makes the same row look
//      different to different viewers and turns "which row do you mean" into a
//      timezone question.
//
// WHAT IT COSTS, stated rather than glossed, because the cost lands on exactly
// the act ruling (1) makes the acceptance test. FT is UTC-4 in daylight time
// and UTC-5 outside it. A sign-in at 10:47 on their clock appears here as
// 14:47, or 15:47 in winter. Confirming "my attempt is in the view" therefore
// requires a subtraction, and the subtraction changes twice a year. That is a
// real friction and it is accepted in exchange for the three reasons above; the
// visible "UTC" is what makes it a subtraction rather than a confusion.
//
// -----------------------------------------------------------------------------
// PARSED FIELD-WISE, NOT THROUGH Date. Same technique as formatAdded and for
// the same reason: slicing a known-fixed-width string cannot be perturbed by
// the runtime's timezone, so there is no path by which a machine in another
// zone renders a different day. new Date(iso).toISOString() would also work and
// is one more moving part than the job needs.
//
// TWO ABSENT CASES, KEPT DISTINCT, each following an existing precedent:
//   - NOTHING STORED -> "—", matching formatAdded. Reached only by the two
//     allTime marks, which are genuinely nullable when no success or no failure
//     has ever been recorded. attempted_at itself is NOT NULL (0021:100), so a
//     row never takes this branch.
//   - STORED BUT UNREADABLE -> the value passed through unchanged, matching
//     formatSessionDate (clients.js:892, `if (Number.isNaN(...)) return iso`).
//     Collapsing this into "—" would report a value that EXISTS as absent,
//     which is the class of quiet lie this surface is built to avoid. It should
//     never fire while auth.js:454 is the sole writer; if it ever does, the
//     screen shows what is actually in the column.

// Third module-local copy in this surface, after OperationsRoster.jsx:29 and
// OperationsSurface.jsx:168. Neither is exported, and extracting a shared one
// would edit two shipped files, which is outside this element. Recorded so the
// duplication is a known quantity rather than a discovery.
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The shape auth.js:454 produces: YYYY-MM-DDTHH:mm:ss, with or without the
// .sssZ tail. Anchored at the start; the tail is not inspected because
// milliseconds are noise at this reading distance.
const ISO_INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;

/**
 * Format a stored ISO instant for display, in UTC, with the zone named.
 *
 * @param {string|null|undefined} iso - `attempted_at` as stored, or a nullable
 *   allTime mark.
 * @returns {string} 'Sep 14, 2026 · 14:30:47 UTC' for a readable instant;
 *   '—' when there is nothing stored; the input unchanged when something is
 *   stored that does not parse.
 */
export function formatInstantUTC(iso) {
  if (!iso) return '—';
  if (typeof iso !== 'string') return String(iso);

  const m = ISO_INSTANT.exec(iso);
  if (!m) return iso;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  // Range-guarded so a nonsense month cannot index past MONTH_SHORT and render
  // the literal string "undefined" as a date.
  if (month < 1 || month > 12 || day < 1 || day > 31) return iso;

  return `${MONTH_SHORT[month - 1]} ${day}, ${year} · ${m[4]}:${m[5]}:${m[6]} UTC`;
}
