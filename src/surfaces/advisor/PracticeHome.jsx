import { Link } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { Icon } from '../../components/Icon.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { advisorPracticeProfile, formatSessionDate, stages, PRACTICE_JOURNAL } from '../../data/clients.js';
import { useBasePath, useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { useClients } from '../../contexts/ClientsContext.jsx';

export default function PracticeHome() {
  const basePath = useBasePath('/advisor', '/app/advisor');
  const appIdentity = useOptionalAppIdentity();
  const isAuthenticated = !!appIdentity;
  const practiceProfile = appIdentity?.identity?.advisor?.practiceProfile ?? null;
  // Fixture fallback ONLY on the public demo tree. On auth with no
  // practiceName set, we render a neutral heading — never Morgan's fixture.
  const practiceName = practiceProfile?.practiceName
    ?? (isAuthenticated ? 'Your practice' : advisorPracticeProfile.practiceName);
  const { clients } = useClients();
  // Real current date (first-run polish ruling 2026-07-15, reversing ADV-011's
  // static screenshot date): both trees show today's date.
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

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
          {practiceName}
        </h1>
      </div>

      {/* Stat row. Floor wrapped in min() per 88e07ea: a bare 180px floor is a
          hard minimum and scrolls the PAGE horizontally below it. Above 180px of
          available width the behaviour is identical. */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
        gap: 'var(--sh-space-4)',
        marginBottom: 'var(--sh-space-10)',
      }}>
        {stages.map((stage) => (
          <Stat key={stage} label={stage} value={stageCounts[stage]} link={`${basePath}/clients?stage=${stage}`} />
        ))}
      </div>

      {/* First-run guidance — authenticated advisor with no clients yet. */}
      {isAuthenticated && clients.length === 0 && (
        <Card style={{ marginBottom: 'var(--sh-space-6)' }}>
          <SectionLabel>Set up your practice</SectionLabel>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            lineHeight: 1.6,
            marginBottom: 'var(--sh-space-2)',
          }}>
            Complete your practice identity in{' '}
            <Link to={`${basePath}/settings`} style={{ color: 'var(--sh-bronze)', fontWeight: 500, textDecoration: 'none' }}>Settings</Link>.
          </p>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            lineHeight: 1.6,
            margin: 0,
          }}>
            Add your first client from the{' '}
            <Link to={`${basePath}/clients`} style={{ color: 'var(--sh-bronze)', fontWeight: 500, textDecoration: 'none' }}>Roster</Link>.
          </p>
        </Card>
      )}

      {/* Two-column working area (single-column on the authenticated tree,
          where the demo-only journal card doesn't render). */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isAuthenticated ? 'minmax(0, 1fr)' : 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: 'var(--sh-space-6)',
        alignItems: 'start',
      }}>
        {/* Upcoming sessions */}
        <Card>
          <SectionLabel>Upcoming sessions</SectionLabel>
          {upcoming.length === 0 ? (
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-muted)',
              padding: 'var(--sh-space-3) 0',
              fontStyle: 'italic',
            }}>
              Your clients will appear here.
            </p>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {upcoming.map((client, i) => (
              <Link
                key={client.id}
                to={`${basePath}/clients/${client.id}`}
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
                    {formatSessionDate(client.nextSession)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          )}
        </Card>

        {/* Practice journal — the advisor's own private reflection space.
            DEMO TREE ONLY (journal-leak fix): rendered from the PRACTICE_JOURNAL
            fixture on the public tree; the authenticated tree renders NO journal
            Card at all — not even an empty state, because no persistence exists,
            so no feature would be implied. Previously a hardcoded literal that
            leaked to the auth tree (missed by slice-2's import-grep). */}
        {!isAuthenticated && PRACTICE_JOURNAL.map((entry, i) => (
          <Card tint key={i}>
            <SectionLabel>Practice journal</SectionLabel>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
              lineHeight: 1.6,
              fontStyle: 'italic',
              marginBottom: 'var(--sh-space-4)',
            }}>
              "{entry.quote}"
            </p>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
            }}>
              {entry.date}
            </p>
          </Card>
        ))}
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
            <Link to={`${basePath}/pipeline`} style={{
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
            {clients.length === 0
              ? 'Pipeline activity will appear here once you add clients.'
              : `${totalActiveContent} content items active across ${clients.length} clients · 5 content types in rotation`}
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
