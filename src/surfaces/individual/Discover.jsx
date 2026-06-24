import { useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Tag } from '../../components/Tag.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import { CAUSES } from '../../data/intakeData.js';
import unified from '../../data/unified/index.js';
import { CAT_META } from '../../data/orgsData.js';

export default function Discover() {
  const { answers: a } = useIntake();
  const [expanded, setExpanded] = useState(null);
  const [saved, setSaved] = useState([]);
  const [manualCauses, setManualCauses] = useState([]);
  const [manualGeo, setManualGeo] = useState('');

  const isGPSMode = a && a.causes && a.causes.length > 0;
  const activeCauses = isGPSMode ? a.causes : manualCauses;
  const activeGeo = isGPSMode ? (a.geoDetail || '') : manualGeo;
  const hasFilters = activeCauses.length > 0;

  const toggleManualCause = (id) => {
    setManualCauses(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  // Org catalog — read from the unified data layer (CohortView precedent).
  // Filter explicitly to sourceSurface 'individual' for correctness even
  // though only the individual adapter emits orgs today (future-proofing).
  const individualOrgs = unified.orgs.filter(o => o.sourceSurface === 'individual');

  // Score and filter orgs
  const scoredOrgs = hasFilters ? individualOrgs.map(org => {
    let score = 0;
    const causeOverlap = org.causes.filter(c => activeCauses.includes(c));
    score += causeOverlap.length * 3;
    if (activeGeo && org.geo.toLowerCase().includes(activeGeo.split(',')[0].toLowerCase().trim())) score += 2;
    if (org.geo === 'National') score += 1;
    if (org.geo === 'International' && a?.geo?.includes('international')) score += 2;
    return { ...org, score, matchedCauses: causeOverlap };
  }).filter(o => o.score > 0).sort((x, y) => y.score - x.score) : [];

  const grouped = { established: [], community: [], emerging: [] };
  scoredOrgs.forEach(o => { if (grouped[o.cat]) grouped[o.cat].push(o); });
  const hasResults = scoredOrgs.length > 0;

  const causeLabels = activeCauses
    .map(id => CAUSES.find(c => c.id === id)?.label)
    .filter(Boolean);
  const toggleSave = (id) =>
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const trustLevel = a?.trust || 'directed';
  const wantsDetail = trustLevel === 'directed';

  return (
    <main style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <p style={{
        fontSize: '10px',
        color: 'var(--sh-bronze)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
        marginBottom: 'var(--sh-space-2)',
      }}>
        Discover
      </p>
      <h1 style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        fontWeight: 400,
        marginBottom: 'var(--sh-space-2)',
      }}>
        Organizations {isGPSMode ? 'for you' : ''}
      </h1>

      {/* GPS subtitle */}
      {isGPSMode && (
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-secondary)',
          lineHeight: 1.55,
          marginBottom: 'var(--sh-space-5)',
        }}>
          Matched to your plan — {causeLabels.join(', ')}{activeGeo ? ` · ${activeGeo}` : ''}
        </p>
      )}

      {/* Browse mode tools */}
      {!isGPSMode && (
        <div style={{ marginBottom: 'var(--sh-space-6)' }}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            fontWeight: 600,
            color: 'var(--sh-text-primary)',
            marginBottom: 'var(--sh-space-2)',
          }}>
            What causes interest you?
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: 'var(--sh-space-4)',
          }}>
            {CAUSES.map(c => {
              const sel = manualCauses.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleManualCause(c.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--sh-radius-full)',
                    cursor: 'pointer',
                    fontSize: 'var(--sh-text-sm)',
                    fontWeight: 500,
                    transition: 'all 150ms ease',
                    border: `2px solid ${sel ? 'var(--sh-bronze)' : 'var(--sh-card-border)'}`,
                    background: sel ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
                    color: sel ? 'var(--sh-bronze-deep)' : 'var(--sh-text-secondary)',
                    fontFamily: 'inherit',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            fontWeight: 600,
            color: 'var(--sh-text-primary)',
            marginBottom: 'var(--sh-space-2)',
          }}>
            Where?
          </p>
          <input
            value={manualGeo}
            onChange={e => setManualGeo(e.target.value)}
            placeholder="City, State or leave blank for all"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--sh-radius-md)',
              border: '2px solid var(--sh-card-border)',
              fontSize: 'var(--sh-text-base)',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
              background: 'var(--sh-card)',
            }}
          />
        </div>
      )}

      {/* No filters yet */}
      {!isGPSMode && !hasFilters && (
        <Card tint padding="lg" style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-bronze-deep)',
            marginBottom: '6px',
          }}>
            Start here
          </p>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
          }}>
            Select at least one cause area above to see organizations.
          </p>
        </Card>
      )}

      {/* No results */}
      {hasFilters && !hasResults && (
        <Card padding="lg" style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
          }}>
            No exact matches for those filters yet. We're growing our database.
          </p>
        </Card>
      )}

      {/* Results, grouped */}
      {Object.entries(grouped).map(([catKey, orgs]) => {
        if (orgs.length === 0) return null;
        const meta = CAT_META[catKey];
        return (
          <div key={catKey} style={{ marginBottom: 'var(--sh-space-6)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sh-space-2)',
              marginBottom: '4px',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--sh-bronze)',
                flexShrink: 0,
              }} />
              <p style={{
                fontSize: 'var(--sh-text-sm)',
                fontWeight: 600,
                color: 'var(--sh-text-primary)',
              }}>
                {meta.label}
              </p>
            </div>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              marginBottom: 'var(--sh-space-3)',
              paddingLeft: 'var(--sh-space-4)',
            }}>
              {meta.desc}
            </p>
            {orgs.map(org => (
              <OrgCard
                key={org.id}
                org={org}
                expanded={expanded === org.id}
                onToggle={() => setExpanded(expanded === org.id ? null : org.id)}
                isSaved={saved.includes(org.id)}
                onSave={() => toggleSave(org.id)}
                wantsDetail={wantsDetail}
              />
            ))}
          </div>
        );
      })}

      {/* Who's missing */}
      {hasResults && (
        <Card tint padding="lg">
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            fontWeight: 600,
            color: 'var(--sh-text-primary)',
            marginBottom: '4px',
          }}>
            Who's missing?
          </p>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-body)',
            lineHeight: 1.55,
          }}>
            There may be organizations doing great work that don't appear here — especially smaller, newer ones. If you know of one, we want to hear about it.
          </p>
        </Card>
      )}

      {/* Saved list */}
      {saved.length > 0 && (
        <div style={{ marginTop: 'var(--sh-space-5)' }}>
          <p style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--sh-bronze)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 'var(--sh-space-2)',
          }}>
            Saved ({saved.length})
          </p>
          {saved.map(id => {
            const org = individualOrgs.find(o => o.id === id);
            return org ? (
              <div key={id} style={{
                background: 'var(--sh-bronze-tint)',
                borderRadius: 'var(--sh-radius-md)',
                padding: '10px var(--sh-space-3)',
                marginBottom: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <p style={{
                  fontSize: 'var(--sh-text-sm)',
                  fontWeight: 600,
                  color: 'var(--sh-bronze-deep)',
                }}>
                  {org.name}
                </p>
                <button
                  onClick={() => toggleSave(id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: 'var(--sh-text-xs)',
                    color: 'var(--sh-text-muted)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Remove
                </button>
              </div>
            ) : null;
          })}
        </div>
      )}
    </main>
  );
}

function OrgCard({ org, expanded, onToggle, isSaved, onSave, wantsDetail }) {
  const matchTags = org.matchedCauses
    .map(id => CAUSES.find(c => c.id === id)?.label)
    .filter(Boolean);

  const InfoRow = ({ label, value }) => value ? (
    <p style={{
      fontSize: 'var(--sh-text-sm)',
      color: 'var(--sh-text-body)',
      marginBottom: '6px',
      lineHeight: 1.5,
    }}>
      <strong style={{ color: 'var(--sh-text-primary)' }}>{label}:</strong> {value}
    </p>
  ) : null;

  return (
    <div style={{
      background: 'var(--sh-card)',
      borderRadius: 'var(--sh-radius-lg)',
      border: 'var(--sh-border-thin)',
      marginBottom: 'var(--sh-space-2)',
      overflow: 'hidden',
    }}>
      <div
        onClick={onToggle}
        style={{
          padding: 'var(--sh-space-4) var(--sh-space-4)',
          cursor: 'pointer',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: 'var(--sh-text-base)',
              fontWeight: 600,
              color: 'var(--sh-text-primary)',
              marginBottom: '4px',
            }}>
              {org.name}
            </p>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
              lineHeight: 1.5,
            }}>
              {org.mission}
            </p>
          </div>
          <span style={{
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-text-muted)',
            marginLeft: 'var(--sh-space-3)',
            flexShrink: 0,
          }}>
            {expanded ? '−' : '+'}
          </span>
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          marginTop: 'var(--sh-space-2)',
        }}>
          {matchTags.map(t => <Tag key={t} tone="bronze">{t}</Tag>)}
          <Tag>{org.geo}</Tag>
        </div>
      </div>
      {expanded && (
        <div style={{
          padding: '0 var(--sh-space-4) var(--sh-space-4)',
          borderTop: 'var(--sh-border-divider)',
          paddingTop: 'var(--sh-space-3)',
          marginTop: 'var(--sh-space-2)',
        }}>
          <InfoRow label="Executive Director" value={org.extensions.individual.ed} />
          <InfoRow label="Leadership" value={org.extensions.individual.led} />
          <InfoRow label="Operating" value={`${org.extensions.individual.years} years`} />
          <InfoRow label="Who they serve" value={org.extensions.individual.demo} />

          {org.extensions.individual.programs && org.extensions.individual.programs.length > 0 && (
            <div style={{ margin: 'var(--sh-space-2) 0' }}>
              <p style={{
                fontSize: 'var(--sh-text-xs)',
                fontWeight: 600,
                color: 'var(--sh-bronze)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '6px',
              }}>
                Programs
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
              }}>
                {org.extensions.individual.programs.map(p => <Tag key={p}>{p}</Tag>)}
              </div>
            </div>
          )}

          {wantsDetail && (
            <>
              <InfoRow label="Annual budget" value={org.extensions.individual.budget} />
              <InfoRow label="Board size" value={org.extensions.individual.boardSize ? `${org.extensions.individual.boardSize} members` : null} />
              {org.extensions.individual.topFunders && org.extensions.individual.topFunders.length > 0 && (
                <div style={{ margin: 'var(--sh-space-2) 0' }}>
                  <p style={{
                    fontSize: 'var(--sh-text-xs)',
                    fontWeight: 600,
                    color: 'var(--sh-bronze)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '6px',
                  }}>
                    Top funders
                  </p>
                  <p style={{
                    fontSize: 'var(--sh-text-sm)',
                    color: 'var(--sh-text-body)',
                    lineHeight: 1.5,
                  }}>
                    {org.extensions.individual.topFunders.join(' · ')}
                  </p>
                </div>
              )}
              <Card tint padding="md" style={{ margin: 'var(--sh-space-2) 0' }}>
                <p style={{
                  fontSize: 'var(--sh-text-xs)',
                  fontWeight: 600,
                  color: 'var(--sh-text-primary)',
                  marginBottom: '2px',
                }}>
                  IRS 990 Data
                </p>
                <p style={{
                  fontSize: 'var(--sh-text-xs)',
                  color: 'var(--sh-text-muted)',
                }}>
                  Full financial filings available when Candid API is connected.
                </p>
              </Card>
            </>
          )}

          <Card tint padding="md" style={{ margin: 'var(--sh-space-2) 0 var(--sh-space-3)' }}>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              fontWeight: 600,
              color: 'var(--sh-bronze)',
              marginBottom: '2px',
            }}>
              When you support this organization
            </p>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-body)',
            }}>
              They'll share updates, impact stories, and how your gift was used — right here. Trust is built together.
            </p>
          </Card>

          <Button
            variant="secondary"
            onClick={(e) => { e.stopPropagation(); onSave(); }}
          >
            {isSaved ? '✓ Saved' : 'Save to my list'}
          </Button>
        </div>
      )}
    </div>
  );
}
