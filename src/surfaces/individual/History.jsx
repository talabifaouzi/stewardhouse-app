import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Tag } from '../../components/Tag.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import { CAUSES } from '../../data/intakeData.js';

export default function History() {
  const { gifts, answers: a } = useIntake();

  if (gifts.length === 0) {
    return (
      <main style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: 'var(--sh-space-12) var(--sh-space-8)',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '10px',
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
          marginBottom: 'var(--sh-space-3)',
        }}>
          Your story hasn't started yet
        </h1>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-secondary)',
          marginBottom: 'var(--sh-space-6)',
          lineHeight: 1.6,
        }}>
          When you log your first gift, this page becomes your giving record — totals by organization, by vehicle, and a reflection on your year.
        </p>
        <Card tint padding="lg">
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-body)',
            lineHeight: 1.65,
          }}>
            <strong>What you'll see here:</strong> total given (current year and all-time), organizations supported, unrestricted vs. directed breakdown, giving by vehicle (Personal, DAF, Community Foundation), and a reflection on how your giving aligns with your plan.
          </p>
        </Card>
      </main>
    );
  }

  const total = gifts.reduce((s, g) => s + g.amount, 0);
  const orgCount = new Set(gifts.map(g => g.org)).size;
  const avgGift = gifts.length > 0 ? Math.round(total / gifts.length) : 0;
  const unrestricted = gifts.filter(g => g.type === 'unrestricted' || !g.type);
  const unrPct = gifts.length > 0 ? Math.round((unrestricted.length / gifts.length) * 100) : 0;
  const recurring = gifts.filter(g => g.recurring);

  // By org
  const byOrg = {};
  gifts.forEach(g => { byOrg[g.org] = (byOrg[g.org] || 0) + g.amount; });
  const orgList = Object.entries(byOrg).sort((x, y) => y[1] - x[1]);

  // By vehicle
  const byVehicle = {};
  gifts.forEach(g => {
    const v = g.vehicle === 'daf' ? 'DAF' :
              g.vehicle === 'community' ? 'Community Foundation' :
              'Personal';
    byVehicle[v] = (byVehicle[v] || 0) + g.amount;
  });

  const causeLabels = (a?.causes || [])
    .map(id => CAUSES.find(c => c.id === id)?.label)
    .filter(Boolean);

  const copyForCPA = () => {
    const text =
`MY 2026 GIVING SUMMARY

Total: $${total.toLocaleString()}
Organizations: ${orgCount}
Gifts: ${gifts.length}

By Organization:
${orgList.map(([n, amt]) => `  ${n}: $${amt.toLocaleString()}`).join('\n')}

Unrestricted: ${unrPct}%
Directed: ${100 - unrPct}%

— StewardHouse`;
    if (navigator.clipboard) navigator.clipboard.writeText(text);
  };

  return (
    <main style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
    }}>
      {/* Header */}
      <p style={{
        fontSize: '10px',
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
        fontWeight: 400,
        marginBottom: 'var(--sh-space-5)',
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
          fontSize: '36px',
          color: '#FFFFFF',
          fontWeight: 400,
          lineHeight: 1,
          marginBottom: '4px',
        }}>
          ${total.toLocaleString()}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'rgba(255,255,255,0.75)',
          letterSpacing: '0.04em',
        }}>
          Total given
        </p>
        <div style={{
          display: 'flex',
          gap: 'var(--sh-space-6)',
          marginTop: 'var(--sh-space-5)',
        }}>
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

      {/* Restricted / unrestricted split */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--sh-space-2)',
        marginBottom: 'var(--sh-space-5)',
      }}>
        <SplitStat value={`${unrPct}%`} label="Unrestricted" tint />
        <SplitStat value={`${100 - unrPct}%`} label="Directed" />
      </div>

      {/* By organization */}
      <SectionTitle>By organization</SectionTitle>
      {orgList.map(([name, amt]) => {
        const pct = Math.round((amt / total) * 100);
        return (
          <Card key={name} padding="md" style={{ marginBottom: '6px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
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

      {/* By vehicle */}
      {Object.keys(byVehicle).length > 0 && (
        <>
          <SectionTitle style={{ marginTop: 'var(--sh-space-5)' }}>By vehicle</SectionTitle>
          {Object.entries(byVehicle).map(([v, amt]) => (
            <div key={v} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 'var(--sh-space-2) var(--sh-space-3)',
              background: 'var(--sh-card)',
              borderRadius: 'var(--sh-radius-md)',
              border: 'var(--sh-border-thin)',
              marginBottom: '4px',
            }}>
              <p style={{
                fontSize: 'var(--sh-text-sm)',
                color: 'var(--sh-text-body)',
              }}>{v}</p>
              <p style={{
                fontSize: 'var(--sh-text-sm)',
                fontWeight: 600,
                color: 'var(--sh-text-primary)',
              }}>${amt.toLocaleString()}</p>
            </div>
          ))}
        </>
      )}

      {/* Cause alignment */}
      <SectionTitle style={{ marginTop: 'var(--sh-space-5)' }}>Your plan cause areas</SectionTitle>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: 'var(--sh-space-4)',
      }}>
        {causeLabels.map(c => <Tag key={c} tone="bronze">{c}</Tag>)}
      </div>

      {/* Reflection */}
      <Card padding="lg" style={{
        background: '#FBF5E5',
        borderColor: '#E8DDB8',
        marginBottom: 'var(--sh-space-4)',
      }}>
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

      <Button variant="secondary" onClick={copyForCPA} style={{ width: '100%' }}>
        Copy summary for CPA
      </Button>

      <p style={{
        textAlign: 'center',
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        marginTop: 'var(--sh-space-4)',
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
        color: '#FFFFFF',
        fontWeight: 400,
        lineHeight: 1,
        marginBottom: '4px',
      }}>
        {value}
      </p>
      <p style={{
        fontSize: '10px',
        color: 'rgba(255,255,255,0.65)',
        letterSpacing: '0.04em',
      }}>
        {label}
      </p>
    </div>
  );
}

function SplitStat({ value, label, tint }) {
  return (
    <Card padding="md" tint={tint} style={{ textAlign: 'center' }}>
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-xl)',
        color: tint ? 'var(--sh-bronze-deep)' : 'var(--sh-text-primary)',
        marginBottom: '2px',
      }}>
        {value}
      </p>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
      }}>
        {label}
      </p>
    </Card>
  );
}

function SectionTitle({ children, style }) {
  return (
    <p style={{
      fontSize: '11px',
      fontWeight: 600,
      color: 'var(--sh-text-primary)',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      marginBottom: 'var(--sh-space-2)',
      ...style,
    }}>
      {children}
    </p>
  );
}
