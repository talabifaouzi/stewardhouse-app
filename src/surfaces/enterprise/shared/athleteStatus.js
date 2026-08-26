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
