// DEMO SIMULATION ONLY.
// Represents cohort-mates who have already opted in and signaled in the real
// product; replace with a real signal store when persistence lands. The
// current member (c-001) is NOT in here — his signals are live session
// state held in CohortMemberContext.
//
// Constraint: each entry's themes MUST be a subset of that member's real
// givingPlan.themes from clients.js — no signaling a theme they don't carry.

export const simulatedMemberSignals = {
  'c-005': ['youth-sports-access'],
  'c-008': [],
};
