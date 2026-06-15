import { Link } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { Icon } from '../../components/Icon.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { advisorPracticeProfile, clients, stages } from '../../data/clients.js';

export default function PracticeHome() {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Client counts by stage
  const stageCounts = stages.reduce((acc, stage) => {
    acc[stage] = clients.filter(c => c.stage === stage).length;
    return acc;
  }, {});

  // Upcoming sessions (mock — first 4 from sorted list)
  const upcoming = [...clients]
    .sort((a, b) => new Date(a.nextSession) - new Date(b.nextSession))
    .slice(0, 4);

  // Active content count (across roster)
  const totalActiveContent = clients.reduce((sum, c) => sum + (c.activeContent || 0), 0);

  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      {/* Page intro */}
      <div style={{ marginBottom: 'var(--sh-space-10)' }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--sh-space-2)',
        }}>
          {dateStr}
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-3xl)',
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-3)',
        }}>
          {advisorPracticeProfile.practiceName}
        </h1>
      </div>

      {/* Stat row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--sh-space-4)',
        marginBottom: 'var(--sh-space-10)',
      }}>
        {stages.map((stage) => (
          <Stat key={stage} label={stage} value={stageCounts[stage]} link={`/advisor/clients?stage=${stage}`} />
        ))}
      </div>

      {/* Two-column working area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: 'var(--sh-space-6)',
        alignItems: 'start',
      }}>
        {/* Upcoming sessions */}
        <Card>
          <SectionLabel>Upcoming sessions</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {upcoming.map((client, i) => (
              <Link
                key={client.id}
                to={`/advisor/clients/${client.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sh-space-4)',
                  padding: 'var(--sh-space-3) 0',
                  borderTop: i === 0 ? 'none' : 'var(--sh-border-divider)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <ClientInitials name={client.name} initials={client.initials} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 'var(--sh-text-base)',
                    color: 'var(--sh-text-primary)',
                    fontWeight: 500,
                    marginBottom: 'var(--sh-space-half)',
                  }}>
                    {client.name}
                  </p>
                  <p style={{
                    fontSize: 'var(--sh-text-xs)',
                    color: 'var(--sh-text-muted)',
                  }}>
                    {client.sport} · {client.stage}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{
                    fontSize: 'var(--sh-text-sm)',
                    color: 'var(--sh-text-secondary)',
                  }}>
                    {client.nextSession}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Practice journal — the advisor's own private reflection space */}
        <Card tint>
          <SectionLabel>Practice journal</SectionLabel>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            lineHeight: 1.6,
            fontStyle: 'italic',
            marginBottom: 'var(--sh-space-4)',
          }}>
            "Marcus is asking better questions about restricted vs. unrestricted than three months ago. The shift from 'what's the safest gift' to 'what does this organization actually need' is happening on its own — not because of a lesson."
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
          }}>
            April 28, 2026
          </p>
        </Card>
      </div>

      {/* Pipeline preview */}
      <div style={{ marginTop: 'var(--sh-space-8)' }}>
        <Card>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--sh-space-4)',
          }}>
            <SectionLabel>Between-session pipeline</SectionLabel>
            <Link to="/advisor/pipeline" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--sh-space-1)',
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-bronze)',
              fontWeight: 500,
              textDecoration: 'none',
            }}>
              Configure
              <Icon name="chevron-right" />
            </Link>
          </div>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            marginBottom: 'var(--sh-space-3)',
          }}>
            {totalActiveContent} content items active across {advisorPracticeProfile.clientCount} clients · 5 content types in rotation
          </p>
        </Card>
      </div>
    </main>
  );
}

function Stat({ label, value, link }) {
  return (
    <Link
      to={link}
      style={{
        textDecoration: 'none',
        background: 'var(--sh-card)',
        border: 'var(--sh-border-thin)',
        borderRadius: 'var(--sh-radius-lg)',
        padding: 'var(--sh-space-5)',
        display: 'block',
        transition: 'all var(--sh-transition-fast)',
      }}
    >
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        margin: 0,
        marginBottom: 'var(--sh-space-2)',
        fontWeight: 500,
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        margin: 0,
      }}>
        {value}
      </p>
    </Link>
  );
}

function ClientInitials({ name, initials }) {
  return (
    <div style={{
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: 'var(--sh-bronze-tint)',
      color: 'var(--sh-bronze-deep)',
      fontSize: 'var(--sh-text-xs)',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      letterSpacing: '0.04em',
      flexShrink: 0,
    }} aria-label={name}>
      {initials}
    </div>
  );
}
