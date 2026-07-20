import { useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';

// Fixture-isolation gate (P-3b-1 extraction; §6.11 threshold reached at three
// call sites — CohortView, the Home cohort callout, and the Learn advisor
// block, with more expected in P-3b-2).
//
// Returns TRUE when fixture content must NOT render.
//
// The Individual surface is mounted twice: at /individual/* (public demo,
// fixture-seeded) and /app/individual/* (authenticated, real person via
// /api/me). Several sections render fixture data that has NO authenticated
// source at all — /api/me emits only { type, displayName, intake, gifts,
// scenarios, athlete?, advisor?, enterprise? }, so there is no individual-side
// cohort, grant, or assignment relation to read. For those sections the honest
// state is ABSENCE, not a rewire (the P-1 useInstitutionEyebrow idiom: no real
// source → render nothing).
//
// NAMED FOR ISOLATION INTENT, deliberately. The underlying signal is the same
// `!appIdentity` presence test used by the DEMO AFFORDANCE in IndividualHome
// (the "Restore Marcus's demo profile" button, which is correctly demo-only and
// deliberately still reads `!appIdentity` raw). Those are two different
// questions that happen to share a predicate today:
//
//   - "is this the public demo tree?"        → demo affordance  (raw check)
//   - "may fixture content render here?"     → isolation        (this helper)
//
// They are kept separate on purpose. Do not route the demo affordance through
// this helper and do not rename this one toward demo detection — if the two
// ever need to
// diverge (e.g. an authenticated tree that legitimately shows sample content),
// merging them now would make that change unsafe.
//
// Demo tree: no AppIdentityProvider is mounted, so useOptionalAppIdentity()
// returns createContext(null)'s default — null — and this returns false,
// leaving every fixture render untouched and byte-identical.

export function useFixtureIsolated() {
  return !!useOptionalAppIdentity();
}
