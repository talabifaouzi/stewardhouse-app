import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import Chrome from '../../components/Chrome.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';

const NAV_ITEMS = [
  { key: 'home', label: 'Home', path: '/individual' },
  { key: 'plan', label: 'Giving plan', path: '/individual/plan' },
  { key: 'discover', label: 'Discover', path: '/individual/discover' },
  { key: 'learn', label: 'Learn', path: '/individual/learn' },
  { key: 'history', label: 'History', path: '/individual/history' },
];

export default function IndividualSurface() {
  const location = useLocation();
  const path = location.pathname;
  const activeNav =
    path.includes('/plan') ? 'plan' :
    path.includes('/discover') ? 'discover' :
    path.includes('/learn') ? 'learn' :
    path.includes('/history') ? 'history' :
    'home';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--sh-bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Chrome
        surface="individual"
        userName="Marcus Thompson"
        userRole="Member · Athletics"
        navItems={NAV_ITEMS}
        activeNav={activeNav}
      />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route index element={<IndividualHome />} />
          <Route path="plan" element={<Placeholder title="Giving plan" subtitle="Your current giving plan and history of revisions" />} />
          <Route path="discover" element={<Placeholder title="Discover" subtitle="Organizations to learn about" />} />
          <Route path="learn" element={<Placeholder title="Learn" subtitle="Lessons and reflections" />} />
          <Route path="history" element={<Placeholder title="Giving history" subtitle="Annual summary and year-over-year view" />} />
          <Route path="*" element={<Navigate to="/individual" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function IndividualHome() {
  return (
    <main style={{
      maxWidth: '960px',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <div style={{ marginBottom: 'var(--sh-space-8)' }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--sh-space-2)',
        }}>
          Welcome back
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-3xl)',
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-3)',
        }}>
          Marcus
        </h1>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-secondary)',
          maxWidth: '620px',
          lineHeight: 1.6,
        }}>
          Stewardship is a practice, not an event. Here's what's worth your attention this week.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--sh-space-5)',
      }}>
        <Card>
          <SectionLabel>Your giving plan</SectionLabel>
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-text-primary)',
            marginBottom: 'var(--sh-space-3)',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}>
            "Direct support to youth basketball programs in Cleveland. Multi-year, unrestricted where possible."
          </p>
          <Link to="/individual/plan" style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-bronze)',
            fontWeight: 500,
          }}>
            View plan →
          </Link>
        </Card>

        <Card>
          <SectionLabel>Next session</SectionLabel>
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-lg)',
            color: 'var(--sh-text-primary)',
            marginBottom: 'var(--sh-space-1)',
          }}>
            May 14, 2026
          </p>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            marginBottom: 'var(--sh-space-3)',
          }}>
            With Morgan Walker · 45 min
          </p>
          <Button variant="secondary" size="sm">Reschedule</Button>
        </Card>

        <Card tint>
          <SectionLabel>This week's reading</SectionLabel>
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-base)',
            color: 'var(--sh-text-primary)',
            marginBottom: 'var(--sh-space-2)',
          }}>
            Black-led foundations gaining ground in athlete-driven philanthropy
          </p>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            lineHeight: 1.55,
            marginBottom: 'var(--sh-space-3)',
          }}>
            A look at five organizations reshaping how athletes direct giving toward Black communities.
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
          }}>
            Surfaced by Morgan · 7 min read
          </p>
        </Card>
      </div>

      <div style={{ marginTop: 'var(--sh-space-10)' }}>
        <Card tint>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            textAlign: 'center',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}>
            This individual surface mirrors the existing prototype at talabifaouzi.github.io/stewardhouse-demo/.
            Deep functionality (giving plan editor, discovery, learn library, annual history) will migrate from the
            HTML prototype into this React structure across upcoming sessions.
          </p>
        </Card>
      </div>
    </main>
  );
}

function Placeholder({ title, subtitle }) {
  return (
    <main style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <h1 style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        marginBottom: 'var(--sh-space-2)',
      }}>
        {title}
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        {subtitle}
      </p>
      <Card tint>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-muted)',
          textAlign: 'center',
          fontStyle: 'italic',
          padding: 'var(--sh-space-6)',
        }}>
          Section scaffolded · content to migrate from existing prototype.
        </p>
      </Card>
    </main>
  );
}
