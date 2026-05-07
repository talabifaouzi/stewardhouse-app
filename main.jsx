import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Chrome from '../../components/Chrome.jsx';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';

const NAV_ITEMS = [
  { key: 'home', label: 'Overview', path: '/operations' },
  { key: 'individuals', label: 'Individuals', path: '/operations/individuals' },
  { key: 'institutions', label: 'Institutions', path: '/operations/institutions' },
  { key: 'advisors', label: 'Philanthropic Advisors', path: '/operations/advisors' },
  { key: 'health', label: 'Platform health', path: '/operations/health' },
];

export default function OperationsSurface() {
  const location = useLocation();
  const path = location.pathname;
  const activeNav =
    path.includes('/individuals') ? 'individuals' :
    path.includes('/institutions') ? 'institutions' :
    path.includes('/advisors') ? 'advisors' :
    path.includes('/health') ? 'health' :
    'home';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--sh-bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Chrome
        surface="operations"
        userName="Faouzi Talabi"
        userRole="Founder"
        navItems={NAV_ITEMS}
        activeNav={activeNav}
      />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route index element={<OperationsHome />} />
          <Route path="individuals" element={<UserList kind="individuals" />} />
          <Route path="institutions" element={<UserList kind="institutions" />} />
          <Route path="advisors" element={<UserList kind="advisors" />} />
          <Route path="health" element={<PlatformHealth />} />
          <Route path="*" element={<Navigate to="/operations" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function OperationsHome() {
  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
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
          Internal · StewardHouse staff
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-3xl)',
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-3)',
        }}>
          Operations
        </h1>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-secondary)',
          maxWidth: '720px',
          lineHeight: 1.6,
        }}>
          Monitor and support across all three end-user surfaces. View user activity, surface issues, and provide support.
          This view is internal-only and is never exposed to platform users.
        </p>
      </div>

      {/* Aggregate stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--sh-space-4)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        <Stat label="Individuals" value="142" sub="Active in last 30 days" />
        <Stat label="Institutions" value="4" sub="Active programs" />
        <Stat label="Philanthropic Advisors" value="11" sub="Practices on platform" />
        <Stat label="Open issues" value="2" sub="Awaiting response" />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: 'var(--sh-space-6)',
      }}>
        <Card>
          <SectionLabel>Recent activity</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <ActivityRow time="14 min ago" surface="Philanthropic Advisor" detail="Morgan Walker created a new fork of 'Reading a 990' lesson" first />
            <ActivityRow time="2 hr ago" surface="Individual" detail="Marcus Thompson reviewed his giving plan" />
            <ActivityRow time="3 hr ago" surface="Enterprise" detail="Cooper State University · 3 athletes added to roster" />
            <ActivityRow time="6 hr ago" surface="Philanthropic Advisor" detail="Cohort 'Cooper State Tigers — basketball' published an update" />
          </div>
        </Card>

        <Card tint>
          <SectionLabel>Open issues</SectionLabel>
          <div style={{
            padding: 'var(--sh-space-3) 0',
            borderBottom: 'var(--sh-border-divider)',
          }}>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-primary)',
              marginBottom: '2px',
            }}>
              Cloudflare deploy fails after merge
            </p>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
            }}>
              Filed 2 hours ago · platform health
            </p>
          </div>
          <div style={{
            padding: 'var(--sh-space-3) 0',
          }}>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-primary)',
              marginBottom: '2px',
            }}>
              Reuben Asare reports content not surfacing
            </p>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
            }}>
              Filed yesterday · individual support
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}

function ActivityRow({ time, surface, detail, first }) {
  const surfaceColors = {
    Individual: 'var(--sh-individual-accent)',
    Enterprise: 'var(--sh-enterprise-accent)',
    'Philanthropic Advisor': 'var(--sh-advisor-accent)',
  };
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--sh-space-4)',
      padding: 'var(--sh-space-3) 0',
      borderTop: first ? 'none' : 'var(--sh-border-divider)',
    }}>
      <div style={{ minWidth: '90px' }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
        }}>
          {time}
        </p>
      </div>
      <span style={{
        fontSize: '10px',
        padding: '2px 8px',
        borderRadius: 'var(--sh-radius-full)',
        background: 'var(--sh-bg-tint)',
        color: 'var(--sh-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontWeight: 500,
        flexShrink: 0,
        border: `0.5px solid ${surfaceColors[surface]}`,
      }}>
        {surface}
      </span>
      <p style={{
        flex: 1,
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-secondary)',
        lineHeight: 1.5,
      }}>
        {detail}
      </p>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={{
      background: 'var(--sh-card)',
      border: 'var(--sh-border-thin)',
      borderRadius: 'var(--sh-radius-lg)',
      padding: 'var(--sh-space-5)',
    }}>
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
        marginBottom: 'var(--sh-space-1)',
      }}>
        {value}
      </p>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
      }}>
        {sub}
      </p>
    </div>
  );
}

function UserList({ kind }) {
  const titleMap = {
    individuals: 'Individuals',
    institutions: 'Institutions',
    advisors: 'Philanthropic Advisors',
  };
  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <h1 style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        marginBottom: 'var(--sh-space-2)',
      }}>
        {titleMap[kind]}
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        Aggregate view across all {titleMap[kind].toLowerCase()} on the platform. Filtering, search, and per-user drill-down.
      </p>
      <Card tint>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-muted)',
          textAlign: 'center',
          fontStyle: 'italic',
          padding: 'var(--sh-space-6)',
        }}>
          Section scaffolded · aggregation queries will land here when data layer is wired.
        </p>
      </Card>
    </main>
  );
}

function PlatformHealth() {
  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <h1 style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        marginBottom: 'var(--sh-space-2)',
      }}>
        Platform health
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        Deploys, errors, latency, and active sessions across the platform.
      </p>
      <Card tint>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-muted)',
          textAlign: 'center',
          fontStyle: 'italic',
          padding: 'var(--sh-space-6)',
        }}>
          Section scaffolded · monitoring will integrate when production traffic begins.
        </p>
      </Card>
    </main>
  );
}
