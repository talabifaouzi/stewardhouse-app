import { useParams, Link, Navigate } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { clients } from '../../data/clients.js';

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
        <div style={{ display: 'flex', gap: 'var(--sh-space-2)', flexShrink: 0 }}>
          <Button variant="secondary">Schedule session</Button>
          <Button variant="primary">Surface content</Button>
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

          <Card>
            <SectionLabel>Active in pipeline</SectionLabel>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
              marginBottom: 'var(--sh-space-3)',
            }}>
              {client.activeContent} content items currently surfacing to {client.name.split(' ')[0]} between sessions
            </p>
            <Link to="/advisor/pipeline" style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-bronze)',
              fontWeight: 500,
            }}>
              View per-client current state →
            </Link>
          </Card>
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
              marginBottom: 'var(--sh-space-3)',
            }}>
              Working topic: drafting first formal grant inquiry letter
            </p>
            <Button variant="secondary" size="sm">Reschedule</Button>
          </Card>
        </div>
      </div>
    </main>
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
