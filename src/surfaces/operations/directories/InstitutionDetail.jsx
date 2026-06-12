import { useId } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Card } from '../../../components/Card.jsx';
import { SectionLabel } from '../../../components/SectionLabel.jsx';
import BackLink from '../../../components/BackLink.jsx';
import unified from '../../../data/unified/index.js';
import { resolveSourceAccent } from './sourceAccents.js';
import NotFoundCard from './NotFoundCard.jsx';

// First detail page in the detail-routes arc — establishes the chrome pattern
// the other three details (AdvisorPractice / Organization / Individual) follow:
//
//  - <BackLink> top-left, explicit `to=` (never navigate(-1)) so cold-loaded
//    URLs have a valid destination. Preserves the originating directory's
//    filters via location.state.fromQuery when present (directory rows pass
//    that state from slice 6 onward; today no route does, so the fallback
//    is the bare directory path).
//  - Header: h1 entity name verbatim + source chip + sector/dept line.
//  - <NotFoundCard> co-located. Content-area card (not a full-page 404).
//    Plain language; no "coming soon" promise; no icons.
//  - Body sections in <Card as="section" aria-labelledby={...}> blocks —
//    SectionLabel default level=2 yields proper <h2> heading semantics.
//
// Cross-entity links (partner practice, staff, program-participant athletes)
// render as plain text + mono-styled id today. The advisor-practice / person
// detail routes don't exist until slices 2 and 4 respectively; the explicit
// retrofit sites are marked below.

const DIR_PATH = '/operations/institutions';
const DIR_LABEL = 'Institutions';

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

// Resolve a person's title from whichever source-extension carries it.
// Synthetic staff carry their title under extensions.synthetic.title; enterprise
// staff carry it under extensions.enterprise.title. Falls back to the bare type
// when neither is populated.
function personTitle(person) {
  if (!person) return null;
  const ext = person.extensions?.[person.sourceSurface];
  return ext?.title ?? null;
}

export default function InstitutionDetail() {
  const { id } = useParams();
  const location = useLocation();
  const headerLabelId = useId();
  const contractLabelId = useId();
  const partnerLabelId = useId();
  const staffLabelId = useId();
  const participantsLabelId = useId();
  const issuesLabelId = useId();

  const institution = unified.byId('institutions', id);
  if (!institution) {
    return <NotFoundCard kind="institution" id={id} dirPath={DIR_PATH} dirLabel={DIR_LABEL} />;
  }

  const backTo = `${DIR_PATH}${location.state?.fromQuery ?? ''}`;

  // Partner practice (slice-2 retrofit: link this to /operations/advisors/{partner.id}).
  const partner = institution.partnerAdvisorPracticeId
    ? unified.byId('advisorPractices', institution.partnerAdvisorPracticeId)
    : null;
  const partnerLeadName = partner?.leadPersonId
    ? unified.byId('persons', partner.leadPersonId)?.name ?? null
    : null;

  // Staff resolution (slice-4 retrofit: link each to /operations/individuals/{staff.id}).
  const staff = (institution.staffPersonIds || [])
    .map((pid) => unified.byId('persons', pid))
    .filter(Boolean);

  // Suppress facilitatorName if it duplicates the resolved partner lead.
  const facilitatorName = institution.extensions?.enterprise?.facilitatorName ?? null;
  const showFacilitator = facilitatorName && facilitatorName !== partnerLeadName;

  const endowment = institution.extensions?.enterprise?.endowment ?? null;

  // Program participants (slice-4 retrofit: each row → /operations/individuals/{personId}).
  const participations = unified.participationsByContext(institution.id);

  // Issues about this institution.
  const allIssues = unified.issues
    .filter((iss) => iss.relatedEntityType === 'institution' && iss.relatedEntityId === institution.id);
  const openIssues = allIssues.filter((iss) => iss.status === 'open');
  const resolvedIssues = allIssues.filter((iss) => iss.status !== 'open');

  const sourceAccent = resolveSourceAccent(institution.sourceSurface);

  const contract = institution.contract || {};
  const sectorDept = [institution.sector, institution.dept].filter(Boolean).join(' · ');

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
            {institution.name}
          </h1>
          <span style={{
            display: 'inline-block',
            fontSize: 'var(--sh-text-xs)',
            fontWeight: 500,
            padding: 'var(--sh-space-1) var(--sh-space-3)',
            borderRadius: 'var(--sh-radius-full)',
            border: `1px solid ${sourceAccent}`,
            color: sourceAccent,
            textTransform: 'capitalize',
            lineHeight: 'var(--sh-line-tight)',
          }}>
            {institution.sourceSurface}
          </span>
          <span style={MONO_ID_STYLE}>{institution.id}</span>
        </div>
        {sectorDept && (
          <p style={{
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-text-secondary)',
            margin: 0,
          }}>
            {sectorDept}
          </p>
        )}
      </div>

      {/* Contract */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card as="section" aria-labelledby={contractLabelId}>
          <SectionLabel id={contractLabelId}>Contract</SectionLabel>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--sh-space-5)',
          }}>
            <div>
              <p style={META_LABEL}>Term</p>
              <p style={META_VALUE}>{contract.contractTerm ?? '—'}</p>
            </div>
            <div>
              <p style={META_LABEL}>Tier</p>
              <p style={META_VALUE}>{contract.tier ?? '—'}</p>
            </div>
            <div>
              <p style={META_LABEL}>Annual</p>
              <p style={META_VALUE}>{contract.annual ?? '—'}</p>
            </div>
            <div>
              <p style={META_LABEL}>Start date</p>
              <p style={META_VALUE}>{contract.startDate ?? '—'}</p>
            </div>
            <div>
              <p style={META_LABEL}>End date</p>
              <p style={META_VALUE}>{contract.endDate ?? '—'}</p>
            </div>
            {endowment && (
              <div>
                <p style={META_LABEL}>Endowment</p>
                <p style={META_VALUE}>{endowment}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Partner practice */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card as="section" aria-labelledby={partnerLabelId}>
          <SectionLabel id={partnerLabelId}>Partner practice</SectionLabel>
          {partner ? (
            <div>
              <p style={{
                ...META_VALUE,
                marginBottom: 'var(--sh-space-1)',
              }}>
                <Link
                  to={`/operations/advisors/${partner.id}`}
                  style={{ color: 'var(--sh-text-primary)', textDecoration: 'none', borderBottom: '1px dotted var(--sh-bronze)' }}
                >
                  {partner.name}
                </Link>
                {' '}
                <span style={MONO_ID_STYLE}>{partner.id}</span>
              </p>
              {partnerLeadName && (
                <p style={{
                  fontSize: 'var(--sh-text-sm)',
                  color: 'var(--sh-text-secondary)',
                  margin: 0,
                }}>
                  Lead: {partnerLeadName}
                </p>
              )}
              {showFacilitator && (
                <p style={{
                  fontSize: 'var(--sh-text-sm)',
                  color: 'var(--sh-text-secondary)',
                  margin: 0,
                  marginTop: 'var(--sh-space-half)',
                }}>
                  Facilitator: {facilitatorName}
                </p>
              )}
            </div>
          ) : (
            <p style={{ ...META_VALUE, color: 'var(--sh-text-muted)' }}>—</p>
          )}
        </Card>
      </div>

      {/* Staff */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card as="section" aria-labelledby={staffLabelId}>
          <SectionLabel id={staffLabelId}>Staff</SectionLabel>
          {staff.length === 0 ? (
            <p style={{ ...META_VALUE, color: 'var(--sh-text-muted)' }}>None on file.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-3)' }}>
              {staff.map((s) => {
                const title = personTitle(s);
                return (
                  <div key={s.id}>
                    {/* Slice-4 retrofit: wrap name in <Link to={`/operations/individuals/${s.id}`}>. */}
                    <p style={META_VALUE}>
                      {s.name}
                      {' '}
                      <span style={MONO_ID_STYLE}>{s.id}</span>
                    </p>
                    {title && (
                      <p style={{
                        fontSize: 'var(--sh-text-sm)',
                        color: 'var(--sh-text-secondary)',
                        margin: 0,
                      }}>
                        {title}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Program participants */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card as="section" aria-labelledby={participantsLabelId}>
          <SectionLabel id={participantsLabelId}>Program participants</SectionLabel>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            margin: 0,
            marginBottom: 'var(--sh-space-4)',
          }}>
            {participations.length} {participations.length === 1 ? 'active athlete' : 'active athletes'}
          </p>
          {participations.length === 0 ? (
            <p style={{ ...META_VALUE, color: 'var(--sh-text-muted)' }}>None on file.</p>
          ) : (
            <div role="table" aria-label="Program participants">
              <div role="row" style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(160px, 1.6fr) 1fr 1fr',
                gap: 'var(--sh-space-4)',
                padding: 'var(--sh-space-3) 0',
                borderBottom: 'var(--sh-border-default)',
                fontSize: 'var(--sh-text-xs)',
                fontWeight: 500,
                color: 'var(--sh-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                <div role="columnheader">Athlete</div>
                <div role="columnheader">Stage</div>
                <div role="columnheader">Joined</div>
              </div>
              {participations.map((pp, idx) => {
                const person = unified.byId('persons', pp.personId);
                const personName = person ? person.name : '(unresolved)';
                return (
                  <div
                    role="row"
                    key={pp.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(160px, 1.6fr) 1fr 1fr',
                      gap: 'var(--sh-space-4)',
                      padding: 'var(--sh-space-3) 0',
                      borderBottom: idx === participations.length - 1 ? 'none' : 'var(--sh-border-divider)',
                      fontSize: 'var(--sh-text-sm)',
                      color: 'var(--sh-text-body)',
                      alignItems: 'center',
                    }}
                  >
                    <div role="cell">
                      {/* Slice-4 retrofit: wrap personName in <Link to={`/operations/individuals/${pp.personId}`}>. */}
                      <span style={{ color: 'var(--sh-text-primary)' }}>{personName}</span>
                      {' '}
                      <span style={MONO_ID_STYLE}>{pp.personId}</span>
                    </div>
                    <div role="cell" style={{
                      color: 'var(--sh-text-secondary)',
                      textTransform: 'capitalize',
                    }}>
                      {pp.stage}
                    </div>
                    <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>
                      {pp.joinDate ?? '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Issues about this institution */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card as="section" aria-labelledby={issuesLabelId}>
          <SectionLabel id={issuesLabelId}>Issues</SectionLabel>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            margin: 0,
            marginBottom: 'var(--sh-space-4)',
          }}>
            {openIssues.length} open · {resolvedIssues.length} resolved
          </p>
          {allIssues.length === 0 ? (
            <p style={{ ...META_VALUE, color: 'var(--sh-text-muted)' }}>No issues on file.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-4)' }}>
              {openIssues.length > 0 && (
                <div>
                  <p style={META_LABEL}>Open</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-2)' }}>
                    {openIssues.map((iss) => <IssueLine key={iss.id} issue={iss} />)}
                  </div>
                </div>
              )}
              {resolvedIssues.length > 0 && (
                <div>
                  <p style={META_LABEL}>Resolved</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-2)' }}>
                    {resolvedIssues.map((iss) => <IssueLine key={iss.id} issue={iss} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

function IssueLine({ issue }) {
  return (
    <div>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-primary)',
        margin: 0,
        marginBottom: 'var(--sh-space-half)',
        lineHeight: 1.45,
      }}>
        {issue.summary}
      </p>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        margin: 0,
      }}>
        Opened {issue.openedAt} · {issue.category} · {issue.severity}
        {issue.resolvedAt ? ` · resolved ${issue.resolvedAt}` : ''}
      </p>
    </div>
  );
}
