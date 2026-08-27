// Single source of truth for athlete-state derivation and sort order.
// Render-only — no scoring or evaluative weight implied.

// Branch order: Pending, certified, not-yet-active, invited, outreach-paused,
// fallthrough. First match wins.
export function statusFor(a) {
  if (a.status === 'pending') return 'Not yet invited';
  if (a.certified) return 'Certified';
  if (a.lessons > 0 && !a.gpsCompleted) return 'Not yet active';
  if (a.status === 'invited' || a.lessons === 0) return 'Invited';
  if (a.status === 'inactive') return 'Outreach paused';
  return 'Actively progressing';
}

export const STATUS_ORDER = {
  'Certified': 1,
  'Actively progressing': 2,
  'Not yet active': 3,
  'Outreach paused': 4,
  'Invited': 5,
  'Not yet invited': 6,
};

// Consent/claim state for the roster Access column + profile line (C-3b). Four
// states, distinct from enrollment status: an athlete first CLAIMS their
// account (person_id bind), then CHOOSES how it's managed (management_mode).
// Deny-by-default: a claimed athlete who hasn't chosen yet reads "Pending
// choice". LIVE-only — `claimed` is a boolean on authenticated roster elements
// (toAthleteElement); demo fixtures don't carry it, so consumers render this
// only on the authenticated tree.
export function accessLabel(a) {
  if (!a.claimed) return 'Unclaimed';
  if (a.managementMode === 'self') return 'Self-managed';
  if (a.managementMode === 'delegated') return 'Delegated';
  return 'Pending choice';
}

// ACCESS_ORDER, and the name is the point (SORTING RULED 2026-08-27).
//
// This is the FIRST ordering constant created since §7 filing (a) clause 3
// renamed STATUS_PRIORITY to STATUS_ORDER, for doing rhetorical work the data
// did not support. It is named ACCESS_ORDER as the exact parallel: "order" is
// the word that ruling accepted, and ACCESS_PRIORITY, ACCESS_RANK, ACCESS_LEVEL
// or ACCESS_TIER would each reintroduce precisely what the rename removed.
//
// The sequence is CLAIM PROGRESSION, a fact of the record: an athlete has not
// claimed, or has claimed and not yet chosen, or has chosen. It asserts nothing
// about which state is better, and no number derived from it is ever rendered:
// it exists only to order rows the operator asked to order.
//
// NOTE the direction differs from STATUS_ORDER and that is deliberate, not an
// oversight to be tidied. STATUS_ORDER runs best-first (Certified = 1).
// ACCESS_ORDER runs earliest-first, so an ascending sort surfaces Unclaimed at
// the top, which is the case the ruling names: "delete the unclaimed ones" is
// unusable if they sort last.
export const ACCESS_ORDER = {
  'Unclaimed': 1,
  'Pending choice': 2,
  'Self-managed': 3,
  'Delegated': 4,
};

// YEAR_ORDER: an explicit class sequence, because alphabetical yields Freshman,
// Junior, Senior, Sophomore, which is meaningless (SORTING RULED). A year
// outside this set maps to undefined, which the caller turns into null and the
// table sorts last, rather than guessing where an unrecognised class belongs.
export const YEAR_ORDER = {
  'Freshman': 1,
  'Sophomore': 2,
  'Junior': 3,
  'Senior': 4,
};
