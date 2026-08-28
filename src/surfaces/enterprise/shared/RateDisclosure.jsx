// FORK 1 (P-2) — shared rate formatting + the writable-denominator disclosure.
// FOUR consumers, and the count is now true of the tree: Overview (:124),
// Roster (:164), ProgramSummary (:106) and PhilanthropicReadiness (:127). The
// fourth was named here from the start but rendered its own hand-written gate
// and paragraph instead; the enumeration slice made it an actual consumer, via
// the optional `note` prop below.
//
// Progression rates cover ONLY institution-writable athletes (claimed &&
// managementMode==='delegated') — the same predicate the PUT /api/athletes/:id
// gate enforces. A non-writable athlete's zeros are "not staff-writable", not
// "0% achieved", so they are excluded from the denominator.
//
// ENUMERATION (ruled 2026-08-28): this names the individual exclusion REASONS
// with counts, not one generic clause. The four counts come from computeStats
// (notInvited / invitedUnclaimed / claimedNoMode / selfManaged) and are derived
// over SAVED rows only, so a staged import row under review is never counted.
// A reason with a count of 0 renders no line at all.
//
// Renders ONLY on the authenticated tree with a real exclusion:
// consentAware && excludedTotal > 0. The demo tree (fixtures omit `claimed`, so
// consentAware === false) never renders it — and on that tree the buckets are
// NULL rather than 0, because unmeasured is not the same as none.

// Rate → display string. R4: a null rate (rateBaseTotal === 0) renders
// "Not tracked", NEVER "null%".
export function fmtRate(pct) {
  return pct == null ? 'Not tracked' : `${pct}%`;
}

// The four reasons, in claim-progression order: not invited, invited, claimed
// without a choice, claimed and self-managing. Each carries a singular and a
// plural predicate so the line agrees with its own count.
const REASONS = [
  {
    key: 'notInvited',
    one: 'has not been invited yet and has not claimed an account',
    many: 'have not been invited yet and have not claimed an account',
  },
  {
    key: 'invitedUnclaimed',
    one: 'has been invited but has not claimed an account',
    many: 'have been invited but have not claimed an account',
  },
  {
    key: 'claimedNoMode',
    one: 'has claimed an account but has not chosen how records are kept',
    many: 'have claimed an account but have not chosen how records are kept',
  },
  {
    key: 'selfManaged',
    one: 'manages their own records',
    many: 'manage their own records',
  },
];

export default function RateDisclosure({ stats, note }) {
  const { consentAware, writable, excludedTotal } = stats;
  // excludedTotal is NULL when !consentAware (the buckets are unmeasured, not
  // zero). Refuse null EXPLICITLY rather than letting `null <= 0` coerce true:
  // the two tests happen to agree today, and a reader should not have to know
  // that to see the guard holds.
  if (!consentAware || excludedTotal == null || excludedTotal <= 0) return null;

  const covered = writable === 1 ? '1 athlete who has' : `${writable} athletes who have`;
  const uncounted = excludedTotal === 1 ? '1 athlete is' : `${excludedTotal} athletes are`;

  const lines = REASONS
    .filter((r) => stats[r.key] > 0)
    .map((r) => ({
      key: r.key,
      text: stats[r.key] === 1 ? `1 athlete ${r.one}` : `${stats[r.key]} ${r.many}`,
    }));

  return (
    <div style={disclosureStyle}>
      <p>
        {writable === 0
          ? `No athletes have delegated record-keeping to the department yet, so progression rates are not tracked. ${uncounted} not counted here:`
          : `Progression rates cover the ${covered} delegated record-keeping to the department. ${uncounted} not counted here:`}
      </p>
      <ul style={listStyle}>
        {lines.map((l) => <li key={l.key} style={itemStyle}>{l.text}</li>)}
      </ul>
      {note && <p style={noteStyle}>{note}</p>}
    </div>
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

// House list idiom: every <ul> in the tree resets the marker and its padding
// (AthleteProfile, ContactsDirectory, WorkshopDetail and nine others). No
// bullet glyph is introduced; the lines separate on their own.
const listStyle = {
  listStyle: 'none',
  margin: 'var(--sh-space-1) 0 0',
  padding: 0,
};

const itemStyle = {
  marginTop: 'var(--sh-space-half)',
};

// The optional note (PhilanthropicReadiness). Same treatment as the lead, with
// a gap separating it from the list above.
const noteStyle = {
  marginTop: 'var(--sh-space-2)',
};
