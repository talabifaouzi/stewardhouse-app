import { useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Tag } from '../../components/Tag.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import { CAUSES } from '../../data/intakeData.js';

export default function HistoryTab() {
  const { gifts, answers: a } = useIntake();
  const [copied, setCopied] = useState(false);

  const total = gifts.reduce((sum, g) => sum + g.amount, 0);
  const orgCount = new Set(gifts.map(g => g.org)).size;
  const avgGift = gifts.length > 0 ? Math.round(total / gifts.length) : 0;
  const unrestricted = gifts.filter(g => g.type === 'unrestricted' || !g.type);
  const unrPct = gifts.length > 0 ? Math.round((unrestricted.length / gifts.length) * 100) : 0;
  const recurring = gifts.filter(g => g.recurring);

  const byOrg = {};
  gifts.forEach(g => { byOrg[g.org] = (byOrg[g.org] || 0) + g.amount; });
  const orgList = Object.entries(byOrg).sort((a, b) => b[1] - a[1]);

  const byVehicle = {};
  gifts.forEach(g => {
    const v = g.vehicle === 'daf' ? 'DAF' : g.vehicle === 'community' ? 'Community Foundation' : 'Personal';
    byVehicle[v] = (byVehicle[v] || 0) + g.amount;
  });

  const causeLabels = (a.causes || []).map(id => CAUSES.find(c => c.id === id)?.label).filter(Boolean);

  const onExport = () => {
    const txt = `MY 2026 GIVING SUMMARY

Total: $${total.toLocaleString()}
Organizations: ${orgCount}
Gifts: ${gifts.length}

By Organization:
${orgList.map(([n, a]) => `  ${n}: $${a.toLocaleString()}`).join('\n')}

Unrestricted: ${unrPct}%
Directed: ${100 - unrPct}%

— StewardHouse`;
    navigator.clipboard?.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Empty state
  if (gifts.length === 0) {
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
          My Giving Journey
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-8)',
          fontWeight: 400,
        }}>
          2026 Year in Review
        </h1>

        <div style={{ textAlign: 'center', paddingTop: 'var(--sh-space-6)' }}>
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-xl)',
            color: 'var(--sh-bronze)',
            marginBottom: 'var(--sh-space-3)',
          }}>
            Your story hasn't started yet
          </p>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            lineHeight: 1.6,
            maxWidth: '420px',
            margin: '0 auto var(--sh-space-5)',
          }}>
            When you log your first gift, this page becomes your giving record — totals by organization, by vehicle, and a reflection on your year.
          </p>
          <Card tint padding="md">
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-body)',
              lineHeight: 1.6,
            }}>
              <span style={{ fontWeight: 600, color: 'var(--sh-text-primary)' }}>What you'll see here:</span>{' '}
              total given (current year and all-time), organizations supported, unrestricted vs. directed breakdown, giving by vehicle (Personal, DAF, Community Foundation), and a reflection on how your giving aligns with your plan.
            </p>
          </Card>
        </div>
      </main>
    );
  }

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
        My Giving Journey
      </p>
      <h1 style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        marginBottom: 'var(--sh-space-5)',
        fontWeight: 400,
      }}>
        2026 Year in Review
      </h1>

      {/* Hero stats */}
      <div style={{
        background: 'var(--sh-bronze)',
        borderRadius: 'var(--sh-radius-lg)',
        padding: 'var(--sh-space-6) var(--sh-space-5)',
        marginBottom: 'var(--sh-space-3)',
      }}>
        <p style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: '40px',
          fontWeight: 400,
          color: '#FFFFFF',
          lineHeight: 1.1,
        }}>
          ${total.toLocaleString()}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'rgba(255,255,255,0.75)',
          marginTop: '4px',
          marginBottom: 'var(--sh-space-4)',
        }}>
          Total given
        </p>
        <div style={{ display: 'flex', gap: 'var(--sh-space-5)' }}>
          <HeroStat value={orgCount} label="Organizations" />
          <HeroStat value={gifts.length} label="Gifts" />
          <HeroStat value={`$${avgGift.toLocaleString()}`} label="Avg gift" />
        </div>
        {recurring.length > 0 && (
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'rgba(255,255,255,0.7)',
            marginTop: 'var(--sh-space-3)',
          }}>
            {recurring.length} recurring gift{recurring.length !== 1 ? 's' : ''} active
          </p>
        )}
      </div>

      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 'var(--sh-space-4)',
      }}>
        In the full release, this summary separates current year from all-time history.
      </p>

      {/* Restricted vs unrestricted */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--sh-space-2)',
        marginBottom: 'var(--sh-space-4)',
      }}>
        <Card padding="md" style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: '32px',
            color: 'var(--sh-bronze-deep)',
            fontWeight: 400,
            lineHeight: 1.1,
          }}>
            {unrPct}%
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            marginTop: '4px',
          }}>
            Unrestricted
          </p>
        </Card>
        <Card padding="md" style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: '32px',
            color: 'var(--sh-text-primary)',
            fontWeight: 400,
            lineHeight: 1.1,
          }}>
            {100 - unrPct}%
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            marginTop: '4px',
          }}>
            Directed
          </p>
        </Card>
      </div>

      {/* By organization */}
      <p style={{
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--sh-text-primary)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 'var(--sh-space-2)',
      }}>
        By organization
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: 'var(--sh-space-4)' }}>
        {orgList.map(([name, amt]) => {
          const pct = Math.round((amt / total) * 100);
          return (
            <Card key={name} padding="sm">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '6px',
              }}>
                <p style={{
                  fontSize: 'var(--sh-text-sm)',
                  fontWeight: 600,
                  color: 'var(--sh-text-primary)',
                }}>
                  {name}
                </p>
                <p style={{
                  fontFamily: 'var(--sh-font-serif)',
                  fontSize: 'var(--sh-text-md)',
                  color: 'var(--sh-bronze-deep)',
                }}>
                  ${amt.toLocaleString()}
                </p>
              </div>
              <div style={{
                height: '4px',
                borderRadius: '2px',
                background: 'var(--sh-card-border)',
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: '4px',
                  borderRadius: '2px',
                  background: 'var(--sh-bronze)',
                  transition: 'width 500ms ease',
                }} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* By vehicle */}
      {Object.keys(byVehicle).length > 0 && (
        <>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--sh-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 'var(--sh-space-2)',
          }}>
            By vehicle
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: 'var(--sh-space-4)' }}>
            {Object.entries(byVehicle).map(([v, amt]) => (
              <div key={v} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: 'var(--sh-space-2) var(--sh-space-4)',
                background: 'var(--sh-card)',
                borderRadius: 'var(--sh-radius-md)',
                border: 'var(--sh-border-thin)',
              }}>
                <span style={{ fontSize: 'var(--sh-text-sm)', color: 'var(--sh-text-body)' }}>{v}</span>
                <span style={{ fontSize: 'var(--sh-text-sm)', fontWeight: 600, color: 'var(--sh-text-primary)' }}>
                  ${amt.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Cause alignment */}
      {causeLabels.length > 0 && (
        <>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--sh-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 'var(--sh-space-2)',
          }}>
            Your plan's cause areas
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: 'var(--sh-space-4)' }}>
            {causeLabels.map(c => <Tag key={c} accent>{c}</Tag>)}
          </div>
        </>
      )}

      {/* Reflection */}
      <Card tint padding="lg" style={{ marginBottom: 'var(--sh-space-4)' }}>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          fontWeight: 600,
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-2)',
        }}>
          Reflect
        </p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-body)',
          lineHeight: 1.7,
        }}>
          You supported {orgCount} organization{orgCount !== 1 ? 's' : ''} with ${total.toLocaleString()} this year.{' '}
          {unrPct >= 50
            ? "More than half your giving was unrestricted — you're trusting the people closest to the work."
            : 'Most of your giving was directed — you know where you want your money to go.'}{' '}
          Look at your plan. Does your giving reflect your values? What would you change next year?
        </p>
      </Card>

      {/* Export */}
      <Button variant="secondary" onClick={onExport} style={{ width: '100%', marginBottom: 'var(--sh-space-3)' }}>
        {copied ? 'Copied ✓' : 'Copy summary for CPA'}
      </Button>

      <p style={{
        textAlign: 'center',
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
      }}>
        Your giving tells a story. This is the 2026 chapter.
      </p>
    </main>
  );
}

function HeroStat({ value, label }) {
  return (
    <div>
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-xl)',
        fontWeight: 400,
        color: '#FFFFFF',
        lineHeight: 1.1,
      }}>
        {value}
      </p>
      <p style={{
        fontSize: '11px',
        color: 'rgba(255,255,255,0.7)',
        marginTop: '2px',
      }}>
        {label}
      </p>
    </div>
  );
}
