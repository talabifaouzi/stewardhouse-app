import { Link } from 'react-router-dom';
import { SHLogo } from '../../components/SHLogo.jsx';

const surfaces = [
  {
    key: 'individual',
    label: 'Individual',
    sub: 'Member view',
    description: 'For athletes using StewardHouse personally.',
    accent: 'var(--sh-individual-accent)',
    path: '/individual',
  },
  {
    key: 'enterprise',
    label: 'Enterprise',
    sub: 'Institutional admin',
    description: 'For athletic departments and institutions. Includes nested compliance, setup, and onboarding flows.',
    accent: 'var(--sh-enterprise-accent)',
    path: '/enterprise',
  },
  {
    key: 'advisor',
    label: 'Philanthropic Advisor',
    sub: 'Practice workspace',
    description: 'For philanthropic professionals managing a practice. Eight-section information architecture.',
    accent: 'var(--sh-advisor-accent)',
    path: '/advisor',
  },
  {
    key: 'operations',
    label: 'Operations',
    sub: 'Internal admin',
    description: 'Internal view for StewardHouse staff to monitor and support across all three end-user surfaces.',
    accent: 'var(--sh-operations-accent)',
    path: '/operations',
  },
];

export default function Landing() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--sh-bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header strip */}
      <div style={{
        padding: 'var(--sh-space-6) var(--sh-space-8)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sh-space-3)',
      }}>
        <SHLogo size={28} />
        <span style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-lg)',
          color: 'var(--sh-text-primary)',
        }}>
          StewardHouse
        </span>
      </div>

      {/* Hero */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 'var(--sh-space-12) var(--sh-space-8) var(--sh-space-16)',
        maxWidth: '960px',
        margin: '0 auto',
        width: '100%',
      }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--sh-text-muted)',
          marginBottom: 'var(--sh-space-4)',
        }}>
          Prototype demo · v0
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-3xl)',
          color: 'var(--sh-text-primary)',
          textAlign: 'center',
          maxWidth: '720px',
          lineHeight: 1.2,
          marginBottom: 'var(--sh-space-5)',
        }}>
          A platform for stewardship — for athletes and the institutions that support them.
        </h1>
        <p style={{
          fontSize: 'var(--sh-text-lg)',
          color: 'var(--sh-text-secondary)',
          textAlign: 'center',
          maxWidth: '640px',
          marginBottom: 'var(--sh-space-12)',
          lineHeight: 1.55,
        }}>
          StewardHouse has four user surfaces. Each is a distinct working environment for a distinct kind of person.
          Choose where to enter the demo.
        </p>

        {/* Surface picker */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--sh-space-5)',
          width: '100%',
          maxWidth: '880px',
        }}>
          {surfaces.map((s) => (
            <SurfaceCard key={s.key} surface={s} />
          ))}
        </div>

        {/* Footer note */}
        <p style={{
          marginTop: 'var(--sh-space-16)',
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textAlign: 'center',
          maxWidth: '600px',
          lineHeight: 1.6,
        }}>
          All clients, organizations, conversations, and figures shown in this demo are fictional.
          The platform does not provide financial, legal, or compliance advice.
        </p>
      </section>
    </main>
  );
}

function SurfaceCard({ surface }) {
  return (
    <Link
      to={surface.path}
      style={{
        textDecoration: 'none',
        background: 'var(--sh-card)',
        border: 'var(--sh-border-thin)',
        borderRadius: 'var(--sh-radius-lg)',
        overflow: 'hidden',
        transition: 'all var(--sh-transition)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(60, 50, 30, 0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        height: '4px',
        background: surface.accent,
      }} />
      <div style={{
        padding: 'var(--sh-space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sh-space-3)',
        flex: 1,
      }}>
        <div>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--sh-text-muted)',
            margin: 0,
            fontWeight: 500,
          }}>
            {surface.sub}
          </p>
          <h3 style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-xl)',
            color: 'var(--sh-text-primary)',
            margin: 'var(--sh-space-1) 0 0 0',
          }}>
            {surface.label}
          </h3>
        </div>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-secondary)',
          lineHeight: 1.55,
          margin: 0,
        }}>
          {surface.description}
        </p>
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-bronze)',
          fontWeight: 500,
          marginTop: 'var(--sh-space-3)',
        }}>
          Enter →
        </span>
      </div>
    </Link>
  );
}
