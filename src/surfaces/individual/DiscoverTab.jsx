import { useState, useMemo } from 'react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Tag } from '../../components/Tag.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import { ORGS, CAT_META, scoreOrg } from '../../data/orgsData.js';
import { CAUSES } from '../../data/intakeData.js';

export default function DiscoverTab() {
  const { answers: a } = useIntake();
  const [mode, setMode] = useState('gps'); // 'gps' or 'browse'
  const [browseCauses, setBrowseCauses] = useState([]);
  const [savedOrgs, setSavedOrgs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // Active filter
  const activeCauses = mode === 'gps' ? (a.causes || []) : browseCauses;
  const activeGeo = mode === 'gps' ? a.geoDetail : '';

  // Score and sort orgs
  const scoredOrgs = useMemo(() => {
    return ORGS
      .map(org => ({ org, score: scoreOrg(org, activeCauses, activeGeo) }))
      .filter(({ score }) => score > 0 || activeCauses.length === 0)
      .sort((a, b) => b.score - a.score);
  }, [activeCauses, activeGeo]);

  // Group by category
  const grouped = useMemo(() => {
    const groups = { community: [], emerging: [], established: [] };
    scoredOrgs.forEach(({ org, score }) => {
      if (groups[org.cat]) groups[org.cat].push({ org, score });
    });
    return groups;
  }, [scoredOrgs]);

  const toggleSaved = (orgId) => {
    setSavedOrgs(prev => prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]);
  };

  const toggleBrowseCause = (id) => {
    setBrowseCauses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  return (
    <main style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-6) var(--sh-space-16)',
    }}>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
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
        marginBottom: 'var(--sh-space-2)',
        fontWeight: 400,
      }}>
        Organizations doing the work
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-5)',
        lineHeight: 1.6,
      }}>
        These are starting points — places to learn from, not buttons to click. There's no rating, no ranking. You decide who fits.
      </p>

      {/* Mode toggle */}
      <div style={{
        display: 'inline-flex',
        background: 'var(--sh-card)',
        border: 'var(--sh-border-thin)',
        borderRadius: 'var(--sh-radius-full)',
        padding: '4px',
        marginBottom: 'var(--sh-space-5)',
      }}>
        <ModeButton active={mode === 'gps'} onClick={() => setMode('gps')}>
          Matched to my plan
        </ModeButton>
        <ModeButton active={mode === 'browse'} onClick={() => setMode('browse')}>
          Browse all
        </ModeButton>
      </div>

      {/* Browse mode: cause filter */}
      {mode === 'browse' && (
        <Card padding="md" style={{ marginBottom: 'var(--sh-space-4)' }}>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            marginBottom: 'var(--sh-space-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}>
            Filter by cause
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {CAUSES.map(c => {
              const sel = browseCauses.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleBrowseCause(c.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--sh-radius-full)',
                    border: `1.5px solid ${sel ? 'var(--sh-bronze)' : 'var(--sh-card-border)'}`,
                    background: sel ? 'var(--sh-bronze-tint)' : 'transparent',
                    color: sel ? 'var(--sh-bronze-deep)' : 'var(--sh-text-secondary)',
                    fontSize: 'var(--sh-text-xs)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 150ms ease',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Saved orgs callout */}
      {savedOrgs.length > 0 && (
        <Card padding="md" style={{
          marginBottom: 'var(--sh-space-4)',
          background: 'var(--sh-bronze-tint)',
          borderColor: 'var(--sh-bronze-border)',
        }}>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-bronze-deep)',
            fontWeight: 600,
            marginBottom: '4px',
          }}>
            {savedOrgs.length} saved {savedOrgs.length === 1 ? 'organization' : 'organizations'}
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-secondary)',
          }}>
            Saved orgs stay on your shortlist. You decide what's next.
          </p>
        </Card>
      )}

      {/* Results by category */}
      {scoredOrgs.length === 0 ? (
        <Card tint padding="lg" style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            fontStyle: 'italic',
          }}>
            No organizations match those filters. Try selecting different causes or switching to "Matched to my plan."
          </p>
        </Card>
      ) : (
        <>
          {['community', 'emerging', 'established'].map(catKey => {
            const orgs = grouped[catKey];
            if (orgs.length === 0) return null;
            const meta = CAT_META[catKey];
            return (
              <div key={catKey} style={{ marginBottom: 'var(--sh-space-5)' }}>
                <div style={{ marginBottom: 'var(--sh-space-2)' }}>
                  <p style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--sh-bronze)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '2px',
                  }}>
                    {meta.label}
                  </p>
                  <p style={{
                    fontSize: 'var(--sh-text-xs)',
                    color: 'var(--sh-text-muted)',
                    fontStyle: 'italic',
                  }}>
                    {meta.desc}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-2)' }}>
                  {orgs.map(({ org }) => (
                    <OrgCard
                      key={org.id}
                      org={org}
                      expanded={expandedId === org.id}
                      onToggle={() => setExpandedId(expandedId === org.id ? null : org.id)}
                      saved={savedOrgs.includes(org.id)}
                      onToggleSave={() => toggleSaved(org.id)}
                      showFunders={a.trust === 'directed'}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Who's missing footer */}
      <Card tint padding="md" style={{ marginTop: 'var(--sh-space-5)' }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-bronze)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          marginBottom: '4px',
        }}>
          Who's missing?
        </p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-body)',
          lineHeight: 1.6,
        }}>
          This is a starting point, not a complete map. Every list reflects choices about who gets seen. If there's a category, geography, or organization missing, tell us — we'll build a fuller picture together.
        </p>
      </Card>
    </main>
  );
}

function ModeButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 'var(--sh-radius-full)',
        background: active ? 'var(--sh-bronze)' : 'transparent',
        color: active ? '#FFFFFF' : 'var(--sh-text-secondary)',
        fontSize: 'var(--sh-text-xs)',
        fontWeight: 500,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 150ms ease',
      }}
    >
      {children}
    </button>
  );
}

function OrgCard({ org, expanded, onToggle, saved, onToggleSave, showFunders }) {
  const causeLabels = org.causes.map(id => CAUSES.find(c => c.id === id)?.label).filter(Boolean);

  return (
    <Card padding={expanded ? 'lg' : 'md'} interactive>
      <div onClick={onToggle} style={{ cursor: 'pointer' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--sh-space-3)',
          marginBottom: 'var(--sh-space-2)',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: 'var(--sh-text-base)',
              fontWeight: 600,
              color: 'var(--sh-text-primary)',
              marginBottom: '2px',
            }}>
              {org.name}
            </p>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
            }}>
              {org.geo} · {org.years} years · {org.led}
            </p>
          </div>
          <span style={{
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-bronze)',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform 200ms ease',
          }}>
            →
          </span>
        </div>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-body)',
          lineHeight: 1.55,
          marginBottom: 'var(--sh-space-2)',
        }}>
          {org.mission}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {causeLabels.map(c => <Tag key={c}>{c}</Tag>)}
        </div>
      </div>

      {expanded && (
        <div style={{
          marginTop: 'var(--sh-space-4)',
          paddingTop: 'var(--sh-space-3)',
          borderTop: 'var(--sh-border-divider)',
        }}>
          <DetailRow label="Executive director" value={org.ed} />
          <DetailRow label="Board size" value={`${org.boardSize} members`} />
          <DetailRow label="Operating budget" value={org.budget} />
          <DetailRow label="Programs" value={org.programs.join(', ')} />
          <DetailRow label="Communities served" value={org.demo} />
          {showFunders && (
            <DetailRow label="Top funder types" value={org.topFunders.join(', ')} />
          )}

          <div style={{ marginTop: 'var(--sh-space-3)' }}>
            <Button
              variant={saved ? 'primary' : 'secondary'}
              size="sm"
              onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
              style={{ width: '100%' }}
            >
              {saved ? '✓ Saved to my list' : 'Save to my list'}
            </Button>
          </div>

          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: 'var(--sh-space-3)',
            lineHeight: 1.55,
          }}>
            Discovery is for understanding. When you're ready to give, work with your CPA or financial team.
          </p>
        </div>
      )}
    </Card>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ marginBottom: 'var(--sh-space-2)' }}>
      <p style={{
        fontSize: '10px',
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontWeight: 600,
        marginBottom: '2px',
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-body)',
        lineHeight: 1.5,
      }}>
        {value}
      </p>
    </div>
  );
}
