import { useParams, Link, Navigate } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { clients } from '../../data/clients.js';
import { contentTypes } from '../../data/content.js';

export default function ClientWorkspace() {
  const { clientId } = useParams();
  const client = clients.find(c => c.id === clientId);

  if (!client) return <Navigate to="/advisor/clients" replace />;

  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
    }}>
      {/* Breadcrumb */}
      <div style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        marginBottom: 'var(--sh-space-4)',
        letterSpacing: '0.04em',
      }}>
        <Link to="/advisor/clients" style={{
          color: 'var(--sh-text-muted)',
          textDecoration: 'none',
        }}>
          Clients
        </Link>
        {' · '}
        <span>{client.name}</span>
      </div>

      {/* Header — client identity */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--sh-space-5)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--sh-bronze-tint)',
          color: 'var(--sh-bronze-deep)',
          fontSize: 'var(--sh-text-md)',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}>
          {client.initials}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-2xl)',
            color: 'var(--sh-text-primary)',
            marginBottom: 'var(--sh-space-2)',
          }}>
            {client.name}
          </h1>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-muted)',
            marginBottom: 'var(--sh-space-3)',
          }}>
            {client.sport} · {client.level} · {client.stage} · relationship started {client.relationshipStartedYear}
          </p>
          <p style={{
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-text-body)',
            lineHeight: 1.6,
            maxWidth: '720px',
          }}>
            {client.summary}
          </p>
        </div>
      </div>

      {/* Two-column workspace */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: 'var(--sh-space-6)',
        alignItems: 'start',
      }}>
        {/* Left column — current state */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-5)' }}>
          <Card>
            <SectionLabel>Current giving plan</SectionLabel>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
              lineHeight: 1.6,
              fontStyle: 'italic',
              marginBottom: 'var(--sh-space-4)',
            }}>
              "Direct support to youth basketball programs in the Cleveland area where I grew up.
              Multi-year, unrestricted where possible. Quiet about it — no public attribution unless
              the organization specifically asks."
            </p>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
            }}>
              Last revised: April 16, 2026
            </p>
          </Card>

          <Card>
            <SectionLabel>Recent sessions</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <SessionItem
                date="April 16, 2026"
                title="Restricted vs. unrestricted — working session"
                summary="Walked through three example grant agreements. Marcus drafted preferences for his own giving plan."
                first
              />
              <SessionItem
                date="March 28, 2026"
                title="Sector landscape: youth sports access in Ohio"
                summary="Reviewed three regional organizations. Pulled audit reports for two; flagged questions to bring back."
              />
              <SessionItem
                date="March 7, 2026"
                title="Onboarding follow-up — values conversation"
                summary="Identified the giving anchor: place-based, sport-specific, K-12 access. Marcus drafted his giving identity."
              />
            </div>
          </Card>

          <ActiveInPipelinePanel client={client} />
        </div>

        {/* Right column — advisor-private notes + meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-5)' }}>
          <Card tint>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sh-space-2)',
              marginBottom: 'var(--sh-space-3)',
            }}>
              <SectionLabel>Private notes</SectionLabel>
              <span style={{
                fontSize: '10px',
                color: 'var(--sh-text-muted)',
                fontStyle: 'italic',
              }}>(visible only to you)</span>
            </div>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
              lineHeight: 1.6,
              fontStyle: 'italic',
              marginBottom: 'var(--sh-space-3)',
            }}>
              Marcus's mother is the unnamed third party in every conversation about giving. Worth surfacing — when ready — that her steadiness is what's actually being honored. Don't push.
            </p>
            <button style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--sh-bronze)',
              fontSize: 'var(--sh-text-sm)',
              fontWeight: 500,
              padding: 0,
              cursor: 'pointer',
            }}>
              Add note →
            </button>
          </Card>

          <Card>
            <SectionLabel>Next session</SectionLabel>
            <p style={{
              fontFamily: 'var(--sh-font-serif)',
              fontSize: 'var(--sh-text-lg)',
              color: 'var(--sh-text-primary)',
              marginBottom: 'var(--sh-space-2)',
            }}>
              {client.nextSession}
            </p>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
            }}>
              Working topic: drafting first formal grant inquiry letter
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}

function ActiveInPipelinePanel({ client }) {
  const pipeline = client.pipeline || [];
  const labelByKey = Object.fromEntries(contentTypes.map(ct => [ct.key, ct.label]));
  const total = pipeline.length;
  const active = pipeline.filter(p => p.state === 'Active').length;
  const overrides = pipeline.filter(p => p.source === 'override').length;
  const firstName = client.name.split(' ')[0];

  return (
    <Card>
      <div id="active-in-pipeline" style={{ scrollMarginTop: 'var(--sh-space-6)' }}>
        <SectionLabel>Active in pipeline</SectionLabel>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-secondary)',
          marginBottom: 'var(--sh-space-4)',
          lineHeight: 1.55,
        }}>
          What's currently surfacing to {firstName} between sessions, by content type.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {pipeline.map((entry, i) => (
            <PipelineRow
              key={entry.type}
              label={labelByKey[entry.type] || entry.type}
              state={entry.state}
              source={entry.source}
              first={i === 0}
            />
          ))}
        </div>

        <div style={{
          marginTop: 'var(--sh-space-4)',
          paddingTop: 'var(--sh-space-3)',
          borderTop: 'var(--sh-border-divider)',
        }}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-primary)',
            marginBottom: 'var(--sh-space-1)',
          }}>
            {active} of {total} content types active · {overrides} {overrides === 1 ? 'override' : 'overrides'} from practice default
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            lineHeight: 1.55,
          }}>
            Overrides are preserved when practice-wide defaults change.
          </p>
        </div>
      </div>
    </Card>
  );
}

function PipelineRow({ label, state, source, first }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sh-space-3)',
      paddingTop: first ? 0 : 'var(--sh-space-3)',
      paddingBottom: 'var(--sh-space-3)',
      borderTop: first ? 'none' : 'var(--sh-border-divider)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-primary)',
        }}>
          {label}
        </p>
      </div>
      <StateBadge state={state} />
      <span style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        minWidth: '64px',
        textAlign: 'right',
      }}>
        {source}
      </span>
    </div>
  );
}

function StateBadge({ state }) {
  const colors = {
    Active: { bg: '#E8F0E5', text: '#3E5A3F' },
    Mute:   { bg: '#F0EBDF', text: '#5A554C' },
    Pause:  { bg: '#F5EFE3', text: '#5A453A' },
  };
  const c = colors[state] || colors.Active;
  return (
    <span style={{
      fontSize: '10px',
      padding: '3px 9px',
      borderRadius: 'var(--sh-radius-full)',
      background: c.bg,
      color: c.text,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontWeight: 500,
    }}>
      {state}
    </span>
  );
}

function SessionItem({ date, title, summary, first }) {
  return (
    <div style={{
      paddingTop: first ? 0 : 'var(--sh-space-4)',
      paddingBottom: 'var(--sh-space-4)',
      borderTop: first ? 'none' : 'var(--sh-border-divider)',
    }}>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        marginBottom: '2px',
      }}>
        {date}
      </p>
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-base)',
        color: 'var(--sh-text-primary)',
        marginBottom: 'var(--sh-space-1)',
      }}>
        {title}
      </p>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-secondary)',
        lineHeight: 1.55,
      }}>
        {summary}
      </p>
    </div>
  );
}
