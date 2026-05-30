// Single source of truth for athlete-state derivation and sort priority.
// Render-only — no scoring or evaluative weight implied.

export function statusFor(a) {
  if (a.certified) return 'Certified';
  if (a.lessons > 0 && !a.gpsCompleted) return 'Not yet active';
  if (a.status === 'invited' || a.lessons === 0) return 'Invited';
  if (a.status === 'inactive') return 'Outreach paused';
  return 'Actively progressing';
}

export const STATUS_PRIORITY = {
  'Certified': 1,
  'Actively progressing': 2,
  'Not yet active': 3,
  'Outreach paused': 4,
  'Invited': 5,
};
