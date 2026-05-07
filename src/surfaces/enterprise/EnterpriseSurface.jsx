import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import Chrome from '../../components/Chrome.jsx';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';

const NAV_ITEMS = [
  { key: 'home', label: 'Overview', path: '/enterprise' },
  { key: 'roster', label: 'Athletes', path: '/enterprise/athletes' },
  { key: 'onboarding', label: 'Onboarding', path: '/enterprise/onboarding' },
  { key: 'compliance', label: 'Compliance', path: '/enterprise/compliance' },
  { key: 'setup', label: 'Setup', path: '/enterprise/setup' },
];

export default function EnterpriseSurface() {
  const location = useLocation();
  const path = location.pathname;
  const activeNav =
    path.includes('/athletes') ? 'roster' :
    path.includes('/onboarding') ? 'onboarding' :
    path.includes('/compliance') ? 'compliance' :
    path.includes('/setup') ? 'setup' :
    'home';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--sh-bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Chrome
        surface="enterprise"
        userName="Diane Okonkwo"
        userRole="Athletic Department"
        navItems={NAV_ITEMS}
        activeNav={activeNav}
      />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route index element={<EnterpriseHome />} />
          <Route path="athletes" element={<SectionPlaceholder title="Athletes" subtitle="Roster of program athletes participating in the StewardHouse program." />} />
          <Route path="onboarding" element={<SectionPlaceholder title="Onboarding" subtitle="Bring new athletes into the program. Templates, schedules, and progress tracking." note="Sub-flow nested under Enterprise — not a standalone surface." />} />
          <Route path="compliance" element={<SectionPlaceholder title="Compliance" subtitle="NIL compliance documentation, disclosures, and audit trail." note="Sub-flow nested under Enterprise — not a standalone surface." />} />
          <Route path="setup" element={<SectionPlaceholder title="Setup" subtitle="Initial program configuration: program name, advisors, sectors, and stage labels." note="Sub-flow nested under Enterprise — not a standalone surface." />} />
          <Route path="*" element={<Navigate to="/enterprise" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function EnterpriseHome() {
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
          Athletic Department · Cooper State University
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-3xl)',
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-3)',
        }}>
          StewardHouse program — overview
        </h1>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-secondary)',
          maxWidth: '720px',
          lineHeight: 1.6,
        }}>
          Department-wide view of the StewardHouse program. Athletes participate as individuals; the department supports
          structurally — not advisorially.
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--sh-space-4)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        <Stat label="Active athletes" value="38" />
        <Stat label="Onboarding" value="6" />
        <Stat label="Sessions this month" value="42" />
        <Stat label="Compliance current" value="100%" />
      </div>

      {/* Sub-flow shortcuts */}
      <Card>
        <SectionLabel>Department sub-flows</SectionLabel>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--sh-space-3)',
        }}>
          <SubFlowLink to="/enterprise/onboarding" label="Onboarding" desc="Bring new athletes into the program" />
          <SubFlowLink to="/enterprise/compliance" label="Compliance" desc="NIL documentation and audit trail" />
          <SubFlowLink to="/enterprise/setup" label="Setup" desc="Program configuration" />
        </div>
      </Card>

      <div style={{ marginTop: 'var(--sh-space-8)' }}>
        <Card tint>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            textAlign: 'center',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}>
            This enterprise surface absorbs what were previously standalone HTML files (compliance, setup, onboarding) as
            nested sub-flows. The institution is one user; sub-flows are sub-views, not separate surfaces.
          </p>
        </Card>
      </div>
    </main>
  );
}

function SubFlowLink({ to, label, desc }) {
  return (
    <Link to={to} style={{
      display: 'block',
      textDecoration: 'none',
      padding: 'var(--sh-space-4)',
      background: 'var(--sh-bg-tint)',
      border: 'var(--sh-border-thin)',
      borderRadius: 'var(--sh-radius-md)',
      transition: 'all var(--sh-transition-fast)',
    }}>
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-base)',
        color: 'var(--sh-text-primary)',
        marginBottom: '2px',
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
      }}>
        {desc}
      </p>
    </Link>
  );
}

function Stat({ label, value }) {
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
      }}>
        {value}
      </p>
    </div>
  );
}

function SectionPlaceholder({ title, subtitle, note }) {
  return (
    <main style={{
      maxWidth: '880px',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <div style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        marginBottom: 'var(--sh-space-3)',
      }}>
        <Link to="/enterprise" style={{ color: 'var(--sh-text-muted)', textDecoration: 'none' }}>
          Enterprise
        </Link>
        {' · '}
        <span>{title}</span>
      </div>
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
          lineHeight: 1.6,
        }}>
          Section scaffolded · content to migrate from existing prototype.
          {note && <><br />{note}</>}
        </p>
      </Card>
    </main>
  );
}
