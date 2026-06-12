import { useId } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Card } from '../../../components/Card.jsx';
import { SectionLabel } from '../../../components/SectionLabel.jsx';
import BackLink from '../../../components/BackLink.jsx';
import unified from '../../../data/unified/index.js';
import { resolveSourceAccent } from './sourceAccents.js';
import NotFoundCard from './NotFoundCard.jsx';

// Detail page for advisor practices — follows the chrome pattern established
// in InstitutionDetail (slice 1). Per the slice spec:
//
//  - Co-advisor names surface here for the first time (deliberately withheld
//    from the practices directory).
//  - Person cross-links (lead, co-advisors, clients) render as plain text +
//    mono id; the Individual detail route doesn't exist until slice 4, where
//    each of those stubs becomes a live <Link>.
//  - Institutions partnered is a reverse lookup that resolves to existing
//    InstitutionDetail routes — those links ARE live in this slice.
//  - Cohorts render as plain text with member counts (no cohort detail
//    route this arc, per ruling D11).

const DIR_PATH = '/operations/advisors';
const DIR_LABEL = 'Advisor Practices';

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

const LINK_STYLE = {
  color: 'var(--sh-text-primary)',
  textDecoration: 'none',
  borderBottom: '1px dotted var(--sh-bronze)',
};

// Resolve a person's title from whichever source-extension carries it.
function personTitle(person) {
  if (!person) return null;
  const ext = person.extensions?.[person.sourceSurface];
  return ext?.title ?? null;
}

export default function AdvisorPracticeDetail() {
  const { id } = useParams();
  const location = useLocation();
  const headerLabelId = useId();
  const leadLabelId = useId();
  const coAdvisorsLabelId = useId();
  const clientsLabelId = useId();
  const cohortsLabelId = useId();
  const profileLabelId = useId();
  const institutionsLabelId = useId();

  const practice = unified.byId('advisorPractices', id);
  if (!practice) {
    return <NotFoundCard kind="advisor practice" id={id} dirPath={DIR_PATH} dirLabel={DIR_LABEL} />;
  }

  const backTo = `${DIR_PATH}${location.state?.fromQuery ?? ''}`;

  // Lead (slice-4 retrofit: link this to /operations/individuals/{lead.id}).
  const lead = practice.leadPersonId
    ? unified.byId('persons', practice.leadPersonId)
    : null;
  const leadTitle = personTitle(lead);

  // Co-advisors (slice-4 retrofit: link each).
  const coAdvisors = (practice.coAdvisorPersonIds || [])
    .map((pid) => unified.byId('persons', pid))
    .filter(Boolean);

  // Clients — pair each with the matching programParticipation stage from
  // participationsByContext(practiceId). Walker expects 9, synthetic 3–4.
  const participations = unified.participationsByContext(practice.id);
  const stageByPersonId = (() => {
    const m = {};
    for (const pp of participations) m[pp.personId] = pp.stage;
    return m;
  })();
  const clients = (practice.clientPersonIds || [])
    .map((pid) => unified.byId('persons', pid))
    .filter(Boolean);

  // Cohorts (no route this arc — plain text with member counts).
  const cohorts = (practice.cohortIds || [])
    .map((cid) => unified.byId('cohorts', cid))
    .filter(Boolean);

  // Practice profile extras.
  const ext = practice.extensions?.[practice.sourceSurface] ?? {};
  const yearsActive = ext.yearsActive ?? null;
  const geo = ext.geo ?? null;
  // Suppress duplicated advisorName when it matches the resolved lead.
  const extAdvisorName = ext.advisorName ?? null;
  const showExtAdvisorName = extAdvisorName && extAdvisorName !== lead?.name;

  // Reverse lookup: which institutions name this practice as partner?
  // These ARE live links — InstitutionDetail exists (slice 1).
  const partneredInstitutions = unified.institutions
    .filter((i) => i.partnerAdvisorPracticeId === practice.id);

  const sourceAccent = resolveSourceAccent(practice.sourceSurface);

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
            {practice.name}
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
            {practice.sourceSurface}
          </span>
          <span style={MONO_ID_STYLE}>{practice.id}</span>
        </div>
        {practice.focus && (
          <p style={{
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-text-secondary)',
            margin: 0,
          }}>
            {practice.focus}
          </p>
        )}
      </div>

      {/* Lead advisor */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card as="section" aria-labelledby={leadLabelId}>
          <SectionLabel id={leadLabelId}>Lead advisor</SectionLabel>
          {lead ? (
            <div>
              <p style={META_VALUE}>
                {/* Slice-4 retrofit: wrap in <Link to={`/operations/individuals/${lead.id}`}>. */}
                {lead.name}
                {' '}
                <span style={MONO_ID_STYLE}>{lead.id}</span>
              </p>
              {leadTitle && (
                <p style={{
                  fontSize: 'var(--sh-text-sm)',
                  color: 'var(--sh-text-secondary)',
                  margin: 0,
                }}>
                  {leadTitle}
                </p>
              )}
              {showExtAdvisorName && (
                <p style={{
                  fontSize: 'var(--sh-text-sm)',
                  color: 'var(--sh-text-secondary)',
                  margin: 0,
                  marginTop: 'var(--sh-space-half)',
                }}>
                  Advisor name on file: {extAdvisorName}
                </p>
              )}
            </div>
          ) : (
            <p style={{ ...META_VALUE, color: 'var(--sh-text-muted)' }}>—</p>
          )}
        </Card>
      </div>

      {/* Co-advisors */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card as="section" aria-labelledby={coAdvisorsLabelId}>
          <SectionLabel id={coAdvisorsLabelId}>Co-advisors</SectionLabel>
          {coAdvisors.length === 0 ? (
            <p style={{ ...META_VALUE, color: 'var(--sh-text-muted)' }}>None.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-3)' }}>
              {coAdvisors.map((co) => {
                const title = personTitle(co);
                return (
                  <div key={co.id}>
                    {/* Slice-4 retrofit: wrap name in <Link to={`/operations/individuals/${co.id}`}>. */}
                    <p style={META_VALUE}>
                      {co.name}
                      {' '}
                      <span style={MONO_ID_STYLE}>{co.id}</span>
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

      {/* Clients */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card as="section" aria-labelledby={clientsLabelId}>
          <SectionLabel id={clientsLabelId}>Clients</SectionLabel>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            margin: 0,
            marginBottom: 'var(--sh-space-4)',
          }}>
            {clients.length} {clients.length === 1 ? 'client' : 'clients'}
          </p>
          {clients.length === 0 ? (
            <p style={{ ...META_VALUE, color: 'var(--sh-text-muted)' }}>None.</p>
          ) : (
            <div role="table" aria-label="Clients">
              <div role="row" style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(160px, 1.6fr) 1fr',
                gap: 'var(--sh-space-4)',
                padding: 'var(--sh-space-3) 0',
                borderBottom: 'var(--sh-border-default)',
                fontSize: 'var(--sh-text-xs)',
                fontWeight: 500,
                color: 'var(--sh-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                <div role="columnheader">Client</div>
                <div role="columnheader">Stage</div>
              </div>
              {clients.map((c, idx) => {
                const stage = stageByPersonId[c.id] ?? '—';
                const isDash = stage === '—';
                return (
                  <div
                    role="row"
                    key={c.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(160px, 1.6fr) 1fr',
                      gap: 'var(--sh-space-4)',
                      padding: 'var(--sh-space-3) 0',
                      borderBottom: idx === clients.length - 1 ? 'none' : 'var(--sh-border-divider)',
                      fontSize: 'var(--sh-text-sm)',
                      color: 'var(--sh-text-body)',
                      alignItems: 'center',
                    }}
                  >
                    <div role="cell">
                      {/* Slice-4 retrofit: wrap name in <Link to={`/operations/individuals/${c.id}`}>. */}
                      <span style={{ color: 'var(--sh-text-primary)' }}>{c.name}</span>
                      {' '}
                      <span style={MONO_ID_STYLE}>{c.id}</span>
                    </div>
                    <div role="cell" style={{
                      color: isDash ? 'var(--sh-text-muted)' : 'var(--sh-text-secondary)',
                    }}>
                      {stage}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Cohorts */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card as="section" aria-labelledby={cohortsLabelId}>
          <SectionLabel id={cohortsLabelId}>Cohorts</SectionLabel>
          {cohorts.length === 0 ? (
            <p style={{ ...META_VALUE, color: 'var(--sh-text-muted)' }}>None.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-3)' }}>
              {cohorts.map((c) => {
                const memberCount = (c.memberPersonIds || []).length;
                return (
                  <div key={c.id}>
                    {/* Cohort detail route is out of scope this arc per ruling D11.
                        Plain text with member count; no fake link. */}
                    <p style={META_VALUE}>
                      {c.name}
                      {' '}
                      <span style={MONO_ID_STYLE}>{c.id}</span>
                    </p>
                    <p style={{
                      fontSize: 'var(--sh-text-sm)',
                      color: 'var(--sh-text-secondary)',
                      margin: 0,
                    }}>
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      {c.focus ? ` · ${c.focus}` : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Practice profile */}
      {(yearsActive != null || geo) && (
        <div style={{ marginBottom: 'var(--sh-space-6)' }}>
          <Card as="section" aria-labelledby={profileLabelId}>
            <SectionLabel id={profileLabelId}>Profile</SectionLabel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--sh-space-5)',
            }}>
              {yearsActive != null && (
                <div>
                  <p style={META_LABEL}>Years active</p>
                  <p style={META_VALUE}>{yearsActive}</p>
                </div>
              )}
              {geo && (
                <div>
                  <p style={META_LABEL}>Geography</p>
                  <p style={META_VALUE}>{geo}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Institutions partnered (reverse lookup — live links) */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card as="section" aria-labelledby={institutionsLabelId}>
          <SectionLabel id={institutionsLabelId}>Institutions partnered</SectionLabel>
          {partneredInstitutions.length === 0 ? (
            <p style={{ ...META_VALUE, color: 'var(--sh-text-muted)' }}>None.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-3)' }}>
              {partneredInstitutions.map((inst) => (
                <div key={inst.id}>
                  <p style={META_VALUE}>
                    <Link to={`/operations/institutions/${inst.id}`} style={LINK_STYLE}>
                      {inst.name}
                    </Link>
                    {' '}
                    <span style={MONO_ID_STYLE}>{inst.id}</span>
                  </p>
                  {inst.sector && (
                    <p style={{
                      fontSize: 'var(--sh-text-sm)',
                      color: 'var(--sh-text-secondary)',
                      margin: 0,
                    }}>
                      {inst.sector}{inst.dept ? ` · ${inst.dept}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
