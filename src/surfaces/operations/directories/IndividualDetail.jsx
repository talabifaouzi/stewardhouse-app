import { useId, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Card } from '../../../components/Card.jsx';
import { SectionLabel } from '../../../components/SectionLabel.jsx';
import BackLink from '../../../components/BackLink.jsx';
import unified from '../../../data/unified/index.js';
import { CAUSES } from '../../../data/intakeData.js';
import { resolveSourceAccent } from './sourceAccents.js';
import NotFoundCard from './NotFoundCard.jsx';
import { useBasePath } from '../../../contexts/AppIdentityContext.jsx';

// Detail page for any Person record — handles type='individual' (full view)
// AND type='staff'/'advisor' (light view). The retrofit links from slices 1–3
// (institution staff, institution program participants, advisor-practice
// lead/co-advisor/clients) all point at this route, so a single component
// must dispatch on type.
//
// The path lives under /operations/individuals/:id for nav consistency
// (entries reach this page from the Individuals directory + from staff/advisor
// stubs across slices 1–3). If a future rename to /operations/persons/:id is
// wanted, swap the route in OperationsSurface and update the four call sites
// (InstitutionDetail × 2, AdvisorPracticeDetail × 3).
//
// Founder rulings honored here:
//  - D1: contact email/phone hidden by default. Real <button> toggles
//        "Show contact" ↔ "Hide contact". No logging on reveal.
//  - D2: budget framed as "Self-reported budget tier".
//  - D11: cohorts render plain text + member counts (no cohort route this arc).
//  - D12: same-name matches derive by EXACT full-name match across persons.
//        Framed as records-with-the-same-name, not an identity claim — dedup
//        remains deferred. Section hidden when no matches.

const DIR_SEG = 'individuals';
const DIR_LABEL = 'Individuals';

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

const CAUSE_LABEL_BY_ID = (() => {
  const m = {};
  for (const c of CAUSES) m[c.id] = c.label;
  return m;
})();

const TYPE_LABEL = {
  individual: 'Individual',
  staff: 'Staff',
  advisor: 'Advisor',
};

// Title from whichever source-extension carries it.
function personTitle(person) {
  if (!person) return null;
  const ext = person.extensions?.[person.sourceSurface];
  return ext?.title ?? null;
}

export default function IndividualDetail() {
  const { id } = useParams();
  const location = useLocation();
  const basePath = useBasePath('/operations', '/app/operations');
  const dirPath = `${basePath}/${DIR_SEG}`;
  const [contactRevealed, setContactRevealed] = useState(false);

  const headerLabelId = useId();
  const contactLabelId = useId();
  const profileLabelId = useId();
  const planLabelId = useId();
  const notesLabelId = useId();
  const connectionsLabelId = useId();
  const issuesLabelId = useId();
  const participationLabelId = useId();
  const cohortsLabelId = useId();
  const practiceLabelId = useId();
  const affiliationsLabelId = useId();
  const sameNameLabelId = useId();

  const person = unified.byId('persons', id);
  if (!person) {
    return <NotFoundCard kind="person" id={id} dirPath={dirPath} dirLabel={DIR_LABEL} />;
  }

  const backTo = `${dirPath}${location.state?.fromQuery ?? ''}`;
  const sourceAccent = resolveSourceAccent(person.sourceSurface);
  const ext = person.extensions?.[person.sourceSurface] ?? {};

  // Reverse-lookup affiliations for staff/advisor light view AND for the
  // "Advisor-practice membership" section on individuals.
  const staffAtInstitutions = unified.institutions
    .filter((i) => (i.staffPersonIds || []).includes(person.id));
  const leadOfPractices = unified.advisorPractices
    .filter((pr) => pr.leadPersonId === person.id);
  const coAdvisorAtPractices = unified.advisorPractices
    .filter((pr) => (pr.coAdvisorPersonIds || []).includes(person.id));
  const clientOfPractices = unified.advisorPractices
    .filter((pr) => (pr.clientPersonIds || []).includes(person.id));

  // Context label fragment for the header — "Staff at {institution}" /
  // "Lead of {practice}" / "Co-advisor at {practice}" / "Individual".
  function contextLabel() {
    if (person.type === 'staff' && staffAtInstitutions.length > 0) {
      return `Staff at ${staffAtInstitutions[0].name}`;
    }
    if (person.type === 'advisor' && leadOfPractices.length > 0) {
      return `Lead of ${leadOfPractices[0].name}`;
    }
    if (person.type === 'advisor' && coAdvisorAtPractices.length > 0) {
      return `Co-advisor at ${coAdvisorAtPractices[0].name}`;
    }
    return TYPE_LABEL[person.type] ?? person.type;
  }

  // D12 — same-name records by EXACT full-name match, excluding self.
  const sameNameRecords = unified.persons
    .filter((p) => p.name === person.name && p.id !== person.id);

  // Connections as giver — used in full view (type='individual').
  const connections = person.type === 'individual'
    ? unified.connectionsByGiver(person.id)
    : [];
  const connectionStages = new Set(connections.map((c) => c.stage));

  // Issues about this person.
  const allIssues = unified.issues
    .filter((iss) => iss.relatedEntityType === 'person' && iss.relatedEntityId === person.id);
  const openIssues = allIssues.filter((iss) => iss.status === 'open');
  const resolvedIssues = allIssues.filter((iss) => iss.status !== 'open');

  // Program participations FOR this person (filter all participations, not by context).
  const participations = unified.programParticipations
    .filter((pp) => pp.personId === person.id);

  // Cohort memberships.
  const cohorts = unified.cohorts
    .filter((c) => (c.memberPersonIds || []).includes(person.id));

  const isFullView = person.type === 'individual';

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
            {person.name}
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
            {person.sourceSurface}
          </span>
          <span style={MONO_ID_STYLE}>{person.id}</span>
        </div>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-secondary)',
          margin: 0,
        }}>
          {contextLabel()}
        </p>
      </div>

      {/* Contact — hidden by default; toggle button reveals/conceals (D1) */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card as="section" aria-labelledby={contactLabelId}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 'var(--sh-space-3)',
            marginBottom: 'var(--sh-space-3)',
          }}>
            <SectionLabel id={contactLabelId}>Contact</SectionLabel>
            <button
              type="button"
              onClick={() => setContactRevealed((v) => !v)}
              aria-pressed={contactRevealed}
              style={{
                fontSize: 'var(--sh-text-xs)',
                fontWeight: 500,
                padding: 'var(--sh-space-1) var(--sh-space-3)',
                borderRadius: 'var(--sh-radius-full)',
                border: 'var(--sh-border-default)',
                background: contactRevealed ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
                color: contactRevealed ? 'var(--sh-bronze-deep)' : 'var(--sh-text-secondary)',
                cursor: 'pointer',
                transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
              }}
            >
              {contactRevealed ? 'Hide contact' : 'Show contact'}
            </button>
          </div>
          {contactRevealed ? (
            (person.contact?.email || person.contact?.phone) ? (
              <div style={{
                display: 'grid',
                // Floor wrapped in min() per 88e07ea: identical at or above
                // 220px, and below it the track shrinks rather than overflowing.
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                gap: 'var(--sh-space-5)',
              }}>
                <div>
                  <p style={META_LABEL}>Email</p>
                  <p style={META_VALUE}>{person.contact?.email ?? '—'}</p>
                </div>
                <div>
                  <p style={META_LABEL}>Phone</p>
                  <p style={META_VALUE}>{person.contact?.phone ?? '—'}</p>
                </div>
              </div>
            ) : (
              <p style={{ ...META_VALUE, color: 'var(--sh-text-muted)' }}>None on file.</p>
            )
          ) : (
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-muted)',
              fontStyle: 'italic',
              margin: 0,
            }}>
              Hidden by default.
            </p>
          )}
        </Card>
      </div>

      {/* === Full view (type='individual') === */}
      {isFullView && (
        <>
          {/* Profile (source-aware) */}
          <ProfileSection
            person={person}
            ext={ext}
            labelId={profileLabelId}
          />

          {/* Giving plan statement (individual-source only) */}
          {ext.givingPlanStatement && (
            <div style={{ marginBottom: 'var(--sh-space-6)' }}>
              <Card as="section" aria-labelledby={planLabelId}>
                <SectionLabel id={planLabelId}>Giving plan</SectionLabel>
                <p style={{
                  fontSize: 'var(--sh-text-xs)',
                  color: 'var(--sh-text-muted)',
                  margin: 0,
                  marginBottom: 'var(--sh-space-3)',
                }}>
                  From {person.name}'s giving plan:
                </p>
                <blockquote style={{
                  fontFamily: 'var(--sh-font-serif)',
                  fontSize: 'var(--sh-text-md)',
                  color: 'var(--sh-text-primary)',
                  borderLeft: 'var(--sh-border-accent)',
                  paddingLeft: 'var(--sh-space-4)',
                  margin: 0,
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                }}>
                  {ext.givingPlanStatement}
                </blockquote>
              </Card>
            </div>
          )}

          {/* Advisor notes (enterprise-source only) */}
          {person.sourceSurface === 'enterprise' && ext.notes && (
            <div style={{ marginBottom: 'var(--sh-space-6)' }}>
              <Card as="section" aria-labelledby={notesLabelId}>
                <SectionLabel id={notesLabelId}>Notes</SectionLabel>
                <p style={{
                  fontSize: 'var(--sh-text-sm)',
                  color: 'var(--sh-text-primary)',
                  margin: 0,
                  lineHeight: 1.6,
                }}>
                  {ext.notes}
                </p>
              </Card>
            </div>
          )}

          {/* Connections as giver — per-CR table with org-link resolution */}
          <div style={{ marginBottom: 'var(--sh-space-6)' }}>
            <Card as="section" aria-labelledby={connectionsLabelId}>
              <SectionLabel id={connectionsLabelId}>Connections</SectionLabel>
              <p style={{
                fontSize: 'var(--sh-text-sm)',
                color: 'var(--sh-text-secondary)',
                margin: 0,
                marginBottom: 'var(--sh-space-4)',
              }}>
                {person.name} has {connections.length} {connections.length === 1 ? 'connection' : 'connections'} across {connectionStages.size} {connectionStages.size === 1 ? 'stage' : 'stages'}.
              </p>
              {connections.length === 0 ? (
                <p style={{ ...META_VALUE, color: 'var(--sh-text-muted)' }}>None on file.</p>
              ) : (
                <ConnectionsTable connections={connections} />
              )}
            </Card>
          </div>

          {/* Issues about this person */}
          {allIssues.length > 0 && (
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-4)' }}>
                  {openIssues.length > 0 && (
                    <IssueGroup label="Open" issues={openIssues} />
                  )}
                  {resolvedIssues.length > 0 && (
                    <IssueGroup label="Resolved" issues={resolvedIssues} />
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Program participation — institution-context only here (advisor-practice
              context is covered by the "Advisor practice" section below). Institutions
              are live links. */}
          {(() => {
            const instParts = participations.filter((pp) => pp.contextType === 'institution');
            if (instParts.length === 0) return null;
            return (
              <div style={{ marginBottom: 'var(--sh-space-6)' }}>
                <Card as="section" aria-labelledby={participationLabelId}>
                  <SectionLabel id={participationLabelId}>Program participation</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-3)' }}>
                    {instParts.map((pp) => {
                      const inst = unified.byId('institutions', pp.contextId);
                      return (
                        <div key={pp.id}>
                          <p style={META_VALUE}>
                            {inst ? (
                              <Link to={`${basePath}/institutions/${inst.id}`} style={LINK_STYLE}>
                                {inst.name}
                              </Link>
                            ) : (
                              <span>{pp.contextId}</span>
                            )}
                            {' '}
                            <span style={MONO_ID_STYLE}>{pp.contextId}</span>
                          </p>
                          <p style={{
                            fontSize: 'var(--sh-text-sm)',
                            color: 'var(--sh-text-secondary)',
                            margin: 0,
                          }}>
                            Stage: {pp.stage}{pp.joinDate ? ` · joined ${pp.joinDate}` : ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            );
          })()}

          {/* Cohort memberships (D11 — plain text, no link) */}
          {cohorts.length > 0 && (
            <div style={{ marginBottom: 'var(--sh-space-6)' }}>
              <Card as="section" aria-labelledby={cohortsLabelId}>
                <SectionLabel id={cohortsLabelId}>Cohort memberships</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-3)' }}>
                  {cohorts.map((c) => {
                    const n = (c.memberPersonIds || []).length;
                    return (
                      <div key={c.id}>
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
                          {n} {n === 1 ? 'member' : 'members'}
                          {c.focus ? ` · ${c.focus}` : ''}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* Advisor-practice membership — "Client of {practice}" with LIVE link */}
          {clientOfPractices.length > 0 && (
            <div style={{ marginBottom: 'var(--sh-space-6)' }}>
              <Card as="section" aria-labelledby={practiceLabelId}>
                <SectionLabel id={practiceLabelId}>Advisor practice</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-3)' }}>
                  {clientOfPractices.map((pr) => (
                    <div key={pr.id}>
                      <p style={META_VALUE}>
                        Client of{' '}
                        <Link to={`${basePath}/advisors/${pr.id}`} style={LINK_STYLE}>
                          {pr.name}
                        </Link>
                        {' '}
                        <span style={MONO_ID_STYLE}>{pr.id}</span>
                      </p>
                      {pr.focus && (
                        <p style={{
                          fontSize: 'var(--sh-text-sm)',
                          color: 'var(--sh-text-secondary)',
                          margin: 0,
                        }}>
                          {pr.focus}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* === Light view (type='staff' / 'advisor') === */}
      {!isFullView && (
        <>
          {/* Profile — title + bio where present */}
          {(ext.title || ext.bio) && (
            <div style={{ marginBottom: 'var(--sh-space-6)' }}>
              <Card as="section" aria-labelledby={profileLabelId}>
                <SectionLabel id={profileLabelId}>Profile</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-3)' }}>
                  {ext.title && (
                    <div>
                      <p style={META_LABEL}>Title</p>
                      <p style={META_VALUE}>{ext.title}</p>
                    </div>
                  )}
                  {ext.bio && (
                    <div>
                      <p style={META_LABEL}>Bio</p>
                      <p style={{
                        ...META_VALUE,
                        color: 'var(--sh-text-secondary)',
                        lineHeight: 1.6,
                      }}>{ext.bio}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Affiliations — live links into slice-1/2 detail pages */}
          {(staffAtInstitutions.length > 0
            || leadOfPractices.length > 0
            || coAdvisorAtPractices.length > 0) && (
            <div style={{ marginBottom: 'var(--sh-space-6)' }}>
              <Card as="section" aria-labelledby={affiliationsLabelId}>
                <SectionLabel id={affiliationsLabelId}>Affiliations</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-3)' }}>
                  {staffAtInstitutions.map((inst) => (
                    <p key={`s-${inst.id}`} style={META_VALUE}>
                      Staff at{' '}
                      <Link to={`${basePath}/institutions/${inst.id}`} style={LINK_STYLE}>
                        {inst.name}
                      </Link>
                      {' '}
                      <span style={MONO_ID_STYLE}>{inst.id}</span>
                    </p>
                  ))}
                  {leadOfPractices.map((pr) => (
                    <p key={`l-${pr.id}`} style={META_VALUE}>
                      Lead of{' '}
                      <Link to={`${basePath}/advisors/${pr.id}`} style={LINK_STYLE}>
                        {pr.name}
                      </Link>
                      {' '}
                      <span style={MONO_ID_STYLE}>{pr.id}</span>
                    </p>
                  ))}
                  {coAdvisorAtPractices.map((pr) => (
                    <p key={`c-${pr.id}`} style={META_VALUE}>
                      Co-advisor at{' '}
                      <Link to={`${basePath}/advisors/${pr.id}`} style={LINK_STYLE}>
                        {pr.name}
                      </Link>
                      {' '}
                      <span style={MONO_ID_STYLE}>{pr.id}</span>
                    </p>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Records matching this name (D12) — hidden when no matches */}
      {sameNameRecords.length > 0 && (
        <div style={{ marginBottom: 'var(--sh-space-6)' }}>
          <Card as="section" aria-labelledby={sameNameLabelId}>
            <SectionLabel id={sameNameLabelId}>Records matching this name on other surfaces</SectionLabel>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              fontStyle: 'italic',
              margin: 0,
              marginBottom: 'var(--sh-space-3)',
            }}>
              Same name. Same person dedup is deferred — these are the records we
              know about by exact name match, not a claim of identity.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-3)' }}>
              {sameNameRecords.map((p) => {
                const accent = resolveSourceAccent(p.sourceSurface);
                return (
                  <div key={p.id} style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                    gap: 'var(--sh-space-3)',
                  }}>
                    <Link to={`${basePath}/individuals/${p.id}`} style={LINK_STYLE}>
                      {p.name}
                    </Link>
                    <span style={{
                      display: 'inline-block',
                      fontSize: 'var(--sh-text-xs)',
                      fontWeight: 500,
                      padding: 'var(--sh-space-1) var(--sh-space-3)',
                      borderRadius: 'var(--sh-radius-full)',
                      border: `1px solid ${accent}`,
                      color: accent,
                      textTransform: 'capitalize',
                      lineHeight: 'var(--sh-line-tight)',
                    }}>
                      {p.sourceSurface}
                    </span>
                    <span style={MONO_ID_STYLE}>{p.id}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}

// Source-aware profile section for full-view (type='individual') persons.
function ProfileSection({ person, ext, labelId }) {
  const src = person.sourceSurface;
  const causeChips = (ext.causes || [])
    .map((c) => typeof c === 'string' ? { id: c, label: CAUSE_LABEL_BY_ID[c] ?? c } : c);

  return (
    <div style={{ marginBottom: 'var(--sh-space-6)' }}>
      <Card as="section" aria-labelledby={labelId}>
        <SectionLabel id={labelId}>Profile</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-4)' }}>
          {/* Grid of single-value extension fields */}
          <div style={{
            display: 'grid',
            // Floor wrapped in min() per 88e07ea: identical at or above 180px,
            // and below it the track shrinks rather than overflowing.
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
            gap: 'var(--sh-space-5)',
          }}>
            {ext.sport && (
              <div>
                <p style={META_LABEL}>Sport</p>
                <p style={META_VALUE}>{ext.sport}</p>
              </div>
            )}
            {ext.level && (
              <div>
                <p style={META_LABEL}>Level</p>
                <p style={META_VALUE}>{ext.level}</p>
              </div>
            )}
            {src === 'enterprise' && ext.year && (
              <div>
                <p style={META_LABEL}>Year</p>
                <p style={META_VALUE}>{ext.year}</p>
              </div>
            )}
            {src === 'enterprise' && ext.position && (
              <div>
                <p style={META_LABEL}>Position</p>
                <p style={META_VALUE}>{ext.position}</p>
              </div>
            )}
            {src === 'individual' && ext.geoDetail && (
              <div>
                <p style={META_LABEL}>Geography</p>
                <p style={META_VALUE}>{ext.geoDetail}</p>
              </div>
            )}
            {src === 'individual' && ext.worldLabel && (
              <div>
                <p style={META_LABEL}>World</p>
                <p style={META_VALUE}>{ext.worldLabel}</p>
              </div>
            )}
            {src === 'individual' && ext.visibility && (
              <div>
                <p style={META_LABEL}>Visibility</p>
                <p style={META_VALUE} role="status" aria-label={`Visibility: ${ext.visibility}`}>
                  <span style={{
                    display: 'inline-block',
                    fontSize: 'var(--sh-text-xs)',
                    fontWeight: 500,
                    padding: 'var(--sh-space-1) var(--sh-space-3)',
                    borderRadius: 'var(--sh-radius-full)',
                    border: 'var(--sh-border-default)',
                    color: 'var(--sh-text-secondary)',
                    textTransform: 'capitalize',
                    lineHeight: 'var(--sh-line-tight)',
                  }}>
                    {ext.visibility}
                  </span>
                </p>
              </div>
            )}
            {src === 'individual' && ext.givingStyle && (
              <div>
                <p style={META_LABEL}>Giving style</p>
                <p style={META_VALUE}>{ext.givingStyle}</p>
              </div>
            )}
            {src === 'enterprise' && ext.badge && (
              <div>
                <p style={META_LABEL}>Editorial badge</p>
                <p style={META_VALUE}>{ext.badge}</p>
              </div>
            )}
          </div>
          {/* Causes chips (individual only) */}
          {src === 'individual' && causeChips.length > 0 && (
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
          {/* Self-reported budget tier (D2) — explicit framing */}
          {src === 'individual' && ext.budget && (
            <div>
              <p style={META_LABEL}>Self-reported budget tier</p>
              <p style={META_VALUE}>{ext.budget}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function ConnectionsTable({ connections }) {
  const basePath = useBasePath('/operations', '/app/operations');
  return (
    <div role="table" aria-label="Connections">
      <div role="row" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(180px, 1.6fr) 1fr 1.4fr',
        gap: 'var(--sh-space-4)',
        padding: 'var(--sh-space-3) 0',
        borderBottom: 'var(--sh-border-default)',
        fontSize: 'var(--sh-text-xs)',
        fontWeight: 500,
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        <div role="columnheader">Target org</div>
        <div role="columnheader">Stage</div>
        <div role="columnheader">Key dates</div>
      </div>
      {connections.map((cr, idx) => {
        // Cataloged org? Link the name. Otherwise plain text (no dead links).
        const catOrg = cr.targetOrgId ? unified.byId('orgs', cr.targetOrgId) : null;
        const matchedAt = cr.stageTimestamps?.matchedAt ?? null;
        const stageDate = cr.stageTimestamps?.[`${cr.stage}At`] ?? null;
        const dateLine = matchedAt && stageDate && stageDate !== matchedAt
          ? `matched ${matchedAt} → ${cr.stage} ${stageDate}`
          : (matchedAt ?? '—');
        return (
          <div
            role="row"
            key={cr.id}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 1.6fr) 1fr 1.4fr',
              gap: 'var(--sh-space-4)',
              padding: 'var(--sh-space-3) 0',
              borderBottom: idx === connections.length - 1 ? 'none' : 'var(--sh-border-divider)',
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-body)',
              alignItems: 'baseline',
            }}
          >
            <div role="cell">
              {catOrg ? (
                <Link to={`${basePath}/organizations/${catOrg.id}`} style={LINK_STYLE}>
                  {catOrg.name}
                </Link>
              ) : (
                <span style={{ color: 'var(--sh-text-primary)' }}>{cr.targetOrgName}</span>
              )}
            </div>
            <div role="cell" style={{
              color: 'var(--sh-text-secondary)',
              textTransform: 'capitalize',
            }}>
              {cr.stage}
            </div>
            <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>
              {dateLine}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IssueGroup({ label, issues }) {
  return (
    <div>
      <p style={META_LABEL}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-2)' }}>
        {issues.map((iss) => (
          <div key={iss.id}>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-primary)',
              margin: 0,
              marginBottom: 'var(--sh-space-half)',
              lineHeight: 1.45,
            }}>
              {iss.summary}
            </p>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              margin: 0,
            }}>
              Opened {iss.openedAt} · {iss.category} · {iss.severity}
              {iss.resolvedAt ? ` · resolved ${iss.resolvedAt}` : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
