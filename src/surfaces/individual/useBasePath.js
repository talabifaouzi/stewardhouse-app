import { useLocation } from 'react-router-dom';

// Shared basePath derivation for every Individual sub-screen. Individual is
// mounted at both /individual/* (public demo) and /app/individual/* (real
// authenticated pilot users). Any navigate() call inside these screens MUST
// route relative to whichever tree the user is currently in — a hardcoded
// '/individual/...' literal silently ejects an authenticated user into the
// public demo tree (a SEPARATE IntakeProvider instance seeded with Marcus's
// fixture data), which looks like their real account was replaced by demo
// data. See CLAUDE.md's authenticated-surface path audit rule.
//
// Usage: const basePath = useBasePath(); then navigate(`${basePath}/plan`)
// instead of navigate('/individual/plan').

export function useBasePath() {
  const location = useLocation();
  return location.pathname.startsWith('/app/individual') ? '/app/individual' : '/individual';
}
