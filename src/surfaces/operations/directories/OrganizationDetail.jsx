import { useId } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card } from '../../../components/Card.jsx';
import { SectionLabel } from '../../../components/SectionLabel.jsx';
import BackLink from '../../../components/BackLink.jsx';
import unified from '../../../data/unified/index.js';
import { CAUSES } from '../../../data/intakeData.js';
import NotFoundCard from './NotFoundCard.jsx';

// Detail page for organizations — follows the chrome pattern established in
// InstitutionDetail (slice 1). Per the slice spec:
//
//  - Single-source population (all 17 orgs sourced from the individual surface
//    catalog), so the header carries category + "led" chips but NO source chip
//    — same decision the OrganizationsDirectory made for the same reason.
//  - Executive director (extensions.ed) renders as PLAIN TEXT, never as a
//    person stub. Node preflight confirmed zero ed strings match a known
//    person record across all 17 orgs; the ed is org-supplied content, not a
//    cross-link. NO slice-4 retrofit expected in this file — neither the ed
//    nor the funder-examples nor the CR-traffic aggregate involves person
//    stubs that need linking later. Future readers should not hunt for them.
//  - Funder examples are rendered in fixture order with the header doing the
//    de-ranking work (founder ruling D6): exposure framing, no numerals, no
//    ordering cues.
//  - NO gifts section (founder ruling D13): the Gift.recipientOrgId wiring is
//    queued as its own data slice; the page surfaces one honest meta line.
//  - Connection-request traffic is AGGREGATE ONLY (count + per-stage tally);
//    no giver names, no record table.

const DIR_PATH = '/operations/organizations';
const DIR_LABEL = 'Organizations';

const MONO_ID_STYLE = {
  fontFamily: 'var(--sh-font-mono)',
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
};

const META_LABEL = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
  margin: 0,
  marginBottom: 'var(--sh-space-1)',
};

const META_VALUE = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-primary)',
  margin: 0,
  lineHeight: 1.5,
};

const HEADER_CHIP = {
  display: 'inline-block',
  fontSize: 'var(--sh-text-xs)',
  fontWeight: 500,
  padding: 'var(--sh-space-1) var(--sh-space-3)',
  borderRadius: 'var(--sh-radius-full)',
  border: '1px solid var(--sh-bronze-deep)',
  background: 'var(--sh-bronze-tint)',
  color: 'var(--sh-bronze-deep)',
  textTransform: 'capitalize',
  lineHeight: 'var(--sh-line-tight)',
};

const CAUSE_LABEL_BY_ID = (() => {
  const m = {};
  for (const c of CAUSES) m[c.id] = c.label;
  return m;
})();

// Ordered stage keys for the per-stage CR-traffic tally line. Renders only
// stages with ≥1 CRs in this org's set to avoid implying stages that don't
// occur in current data.
const CR_STAGES = ['matched', 'viewed', 'connected', 'conversing', 'gave', 'ongoing'];

export default function OrganizationDetail() {
  const { id } = useParams();
  const location = useLocation();
  const headerLabelId = useId();
  const missionLabelId = useId();
  const aboutLabelId = useId();
  const leadershipLabelId = useId();
  const budgetLabelId = useId();
  const programsLabelId = useId();
  const fundersLabelId = useId();
  const demoLabelId = useId();
  const crLabelId = useId();
  const recordsLabelId = useId();

  const org = unified.byId('orgs', id);
  if (!org) {
    return <NotFoundCard kind="organization" id={id} dirPath={DIR_PATH} dirLabel={DIR_LABEL} />;
  }

  const backTo = `${DIR_PATH}${location.state?.fromQuery ?? ''}`;
  const ext = org.extensions?.individual ?? {};

  const causeChips = (org.causes || [])
    .map((cid) => ({ id: cid, label: CAUSE_LABEL_BY_ID[cid] ?? cid }));

  // CR traffic aggregate (cataloged orgs receive the same set via id or name).
  const crs = unified.connectionsByTarget(org.id);
  const stageTally = {};
  for (const cr of crs) stageTally[cr.stage] = (stageTally[cr.stage] ?? 0) + 1;
  const presentStages = CR_STAGES.filter((s) => stageTally[s]);

  return (
    <main
      aria-labelledby={headerLabelId}
      style={{
        maxWidth: 'var(--sh-content-max)',
        margin: '0 auto',
        padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
      }}
    >
      <BackLink to={backTo} label={DIR_LABEL} />

      {/* Header */}
      <div style={{ marginBottom: 'var(--sh-space-8)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: 'var(--sh-space-3)',
          marginBottom: 'var(--sh-space-2)',
        }}>
          <h1
            id={headerLabelId}
            style={{
              fontFamily: 'var(--sh-font-serif)',
              fontSize: 'var(--sh-text-3xl)',
              color: 'var(--sh-text-primary)',
              margin: 0,
            }}
          >
            {org.name}
          </h1>
          {org.cat && <span style={HEADER_CHIP}>{org.cat}</span>}
          {ext.led && <span style={HEADER_CHIP}>{ext.led}</span>}
          <span style={MONO_ID_STYLE}>{org.id}</span>
        </div>
      </div>

      {/* Mission */}
      {org.mission && (
        <div style={{ marginBottom: 'var(--sh-space-6)' }}>
          <Card as="section" aria-labelledby={missionLabelId}>
            <SectionLabel id={missionLabelId}>Mission</SectionLabel>
            <p style={{
              fontSize: 'var(--sh-text-md)',
              color: 'var(--sh-text-primary)',
              margin: 0,
              lineHeight: 1.6,
            }}>
              {org.mission}
            </p>
          </Card>
        </div>
      )}

      {/* About: causes + geo + founded + badge */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card as="section" aria-labelledby={aboutLabelId}>
          <SectionLabel id={aboutLabelId}>About</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-4)' }}>
            {causeChips.length > 0 && (
              <div>
                <p style={META_LABEL}>Causes</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sh-space-2)' }}>
                  {causeChips.map((c) => (
                    <span key={c.id} style={{
                      display: 'inline-block',
                      fontSize: 'var(--sh-text-xs)',
                      fontWeight: 500,
                      padding: 'var(--sh-space-1) var(--sh-space-3)',
                      borderRadius: 'var(--sh-radius-full)',
                      border: 'var(--sh-border-default)',
                      color: 'var(--sh-text-secondary)',
                      lineHeight: 'var(--sh-line-tight)',
                    }}>
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--sh-space-5)',
            }}>
              {org.geo && (
                <div>
                  <p style={META_LABEL}>Geography</p>
                  <p style={META_VALUE}>{org.geo}</p>
                </div>
              )}
              {ext.years != null && (
                <div>
                  <p style={META_LABEL}>Founded</p>
                  <p style={META_VALUE}>~{ext.years} years ago</p>
                </div>
              )}
              {ext.badge && (
                <div>
                  <p style={META_LABEL}>Editorial tagline</p>
                  <p style={META_VALUE}>{ext.badge}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Leadership: executive director + board size */}
      {(ext.ed || ext.boardSize != null) && (
        <div style={{ marginBottom: 'var(--sh-space-6)' }}>
          <Card as="section" aria-labelledby={leadershipLabelId}>
            <SectionLabel id={leadershipLabelId}>Leadership</SectionLabel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--sh-space-5)',
            }}>
              {ext.ed && (
                <div>
                  <p style={META_LABEL}>Executive director</p>
                  {/* Plain text — never a person stub. Preflight confirmed 0/17 ed
                      strings match a known person record. No slice-4 retrofit. */}
                  <p style={META_VALUE}>{ext.ed}</p>
                </div>
              )}
              {ext.boardSize != null && (
                <div>
                  <p style={META_LABEL}>Board size</p>
                  <p style={META_VALUE}>{ext.boardSize}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Self-reported budget tier — explicit framing (founder ruling D2). */}
      {ext.budget && (
        <div style={{ marginBottom: 'var(--sh-space-6)' }}>
          <Card as="section" aria-labelledby={budgetLabelId}>
            <SectionLabel id={budgetLabelId}>Self-reported budget tier</SectionLabel>
            <p style={META_VALUE}>{ext.budget}</p>
          </Card>
        </div>
      )}

      {/* Programs */}
      {(ext.programs || []).length > 0 && (
        <div style={{ marginBottom: 'var(--sh-space-6)' }}>
          <Card as="section" aria-labelledby={programsLabelId}>
            <SectionLabel id={programsLabelId}>Programs</SectionLabel>
            <ul style={{
              listStyle: 'disc',
              paddingLeft: 'var(--sh-space-5)',
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--sh-space-1)',
            }}>
              {ext.programs.map((p, i) => (
                <li key={i} style={{
                  fontSize: 'var(--sh-text-sm)',
                  color: 'var(--sh-text-primary)',
                  lineHeight: 1.5,
                }}>
                  {p}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Funder examples the organization shares — fixture order preserved.
          No numerals, no ordering cues; the header does the de-ranking work
          (founder ruling D6). */}
      {(ext.topFunders || []).length > 0 && (
        <div style={{ marginBottom: 'var(--sh-space-6)' }}>
          <Card as="section" aria-labelledby={fundersLabelId}>
            <SectionLabel id={fundersLabelId}>Funder examples the organization shares</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-2)' }}>
              {ext.topFunders.map((f, i) => (
                <p key={i} style={META_VALUE}>{f}</p>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Demographic served */}
      {ext.demo && (
        <div style={{ marginBottom: 'var(--sh-space-6)' }}>
          <Card as="section" aria-labelledby={demoLabelId}>
            <SectionLabel id={demoLabelId}>Demographic served</SectionLabel>
            <p style={META_VALUE}>{ext.demo}</p>
          </Card>
        </div>
      )}

      {/* Connection requests — aggregate only (no record table, no giver names). */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card as="section" aria-labelledby={crLabelId}>
          <SectionLabel id={crLabelId}>Connection requests</SectionLabel>
          <p style={META_VALUE}>
            {crs.length} {crs.length === 1 ? 'connection request references' : 'connection requests reference'} this organization.
          </p>
          {presentStages.length > 0 && (
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
              margin: 0,
              marginTop: 'var(--sh-space-2)',
            }}>
              {presentStages.map((s) => (
                <span key={s} style={{ textTransform: 'capitalize' }}>
                  {s}: {stageTally[s]}
                </span>
              )).reduce((acc, el, i) => {
                if (i === 0) return [el];
                return [...acc, ' · ', el];
              }, [])}
            </p>
          )}
        </Card>
      </div>

      {/* Records on file — honest data-state signals. */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card as="section" aria-labelledby={recordsLabelId}>
          <SectionLabel id={recordsLabelId}>Records on file</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-2)' }}>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
              margin: 0,
            }}>
              EIN: pending Candid integration.
            </p>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
              margin: 0,
            }}>
              Gift records: not yet linked to organizations.
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
