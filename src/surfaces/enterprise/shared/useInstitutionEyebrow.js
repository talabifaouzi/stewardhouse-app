// Shared institution eyebrow for the enterprise surface (P-1).
//
// Every enterprise page renders the same page-level eyebrow
// ("Athletic Department · <institution>"). Before P-1 all 14 sites hardcoded
// the FIXTURE institution — so a real operator at a different university read
// "Cooper State University" on every page of their own product, while the real
// name sat unused in the /api/me enterprise block. This hook is the single
// source for that line.
//
// Returns a STRING or null. Callers keep their own local eyebrowStyle and
// render conditionally:
//
//   const eyebrow = useInstitutionEyebrow();
//   {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
//
// null → render NOTHING. Mirrors the established EnterpriseSurface precedent
// (surfaceContext = null when institutionName is absent) — an eyebrow with no
// institution is worse than no eyebrow. In practice a provisioned staff account
// always resolves a name (me.js reads it off the joined institution row), so
// null is the defensive path, not an expected state.
//
// Demo parity: the demo tree renders the fixture record's own dept + name, so
// the output is byte-identical to the pre-P-1 literal — and the name comes from
// the record rather than a hand-copied string (§7 names-verbatim).
//
// NO server change: institutionName is already emitted (me.js enterprise block)
// and already consumed for the Chrome subtitle (EnterpriseSurface).

import { useOptionalAppIdentity } from '../../../contexts/AppIdentityContext.jsx';
import { INST_PROFILES } from '../../../data/enterpriseFixtures.js';

// Phase 1 is athletes only (§7) — the enterprise customer IS an athletic
// department, so the department label is fixed on the authenticated tree. The
// institution row carries no department field, and none is emitted. When a
// later phase adds non-athletics sectors this becomes institution-sourced.
const DEPT_LABEL = 'Athletic Department';

// Demo tree: derived from the fixture record, not a hand-copied literal.
const DEMO_EYEBROW = `${INST_PROFILES[0].dept} · ${INST_PROFILES[0].name}`;

export function useInstitutionEyebrow() {
  const appIdentity = useOptionalAppIdentity();
  // Demo tree (no identity provider mounted) → the fixture eyebrow, unchanged.
  if (!appIdentity) return DEMO_EYEBROW;
  // Authenticated tree → the operator's real institution, or nothing.
  const institutionName = appIdentity?.identity?.enterprise?.institutionName ?? null;
  return institutionName ? `${DEPT_LABEL} · ${institutionName}` : null;
}
