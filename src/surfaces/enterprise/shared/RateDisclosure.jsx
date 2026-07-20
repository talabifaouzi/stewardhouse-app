// FORK 1 (P-2) — shared rate formatting + the writable-denominator disclosure,
// used by the four enterprise rate surfaces (Overview, Roster, ProgramSummary,
// PhilanthropicReadiness). Extracted per the shared-helper threshold (4 > 2
// consumers of identical copy).
//
// Progression rates cover ONLY institution-writable athletes (claimed &&
// managementMode==='delegated') — the same predicate the PUT /api/athletes/:id
// gate enforces. A non-writable athlete's zeros are "not staff-writable", not
// "0% achieved", so they are excluded from the denominator. This line names
// BOTH populations (R3) and renders ONLY on the authenticated tree with a real
// exclusion: consentAware && (tot - writable) > 0. The demo tree (fixtures omit
// `claimed`, so consentAware === false) never renders it.

// Rate → display string. R4: a null rate (rateBaseTotal === 0) renders
// "Not tracked", NEVER "null%".
export function fmtRate(pct) {
  return pct == null ? 'Not tracked' : `${pct}%`;
}

export default function RateDisclosure({ stats }) {
  const { consentAware, tot, writable } = stats;
  const excluded = tot - writable;
  if (!consentAware || excluded <= 0) return null;

  const athletes = writable === 1 ? '1 athlete who has' : `${writable} athletes who have`;
  const others = excluded === 1 ? '1 other manages' : `${excluded} others manage`;
  const claim = excluded === 1 ? 'has' : 'have';

  return (
    <p style={disclosureStyle}>
      Progression rates cover the {athletes} delegated record-keeping to the department.
      {' '}{others} their own records or {claim} not yet claimed their account, and are not counted here.
    </p>
  );
}

const disclosureStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  lineHeight: 1.55,
  letterSpacing: '0.02em',
  marginTop: 'var(--sh-space-2)',
  marginBottom: 'var(--sh-space-4)',
  maxWidth: '720px',
};
