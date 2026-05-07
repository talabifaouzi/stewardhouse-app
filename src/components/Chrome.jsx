import { Link, useNavigate } from 'react-router-dom';
import { SHLogo } from './SHLogo.jsx';

const SURFACE_CONFIG = {
  individual: {
    label: 'Individual',
    accent: 'var(--sh-individual-accent)',
    role: 'Member view',
  },
  enterprise: {
    label: 'Enterprise',
    accent: 'var(--sh-enterprise-accent)',
    role: 'Institutional admin',
  },
  advisor: {
    label: 'Advisor',
    accent: 'var(--sh-advisor-accent)',
    role: 'Practice workspace',
  },
  operations: {
    label: 'Operations',
    accent: 'var(--sh-operations-accent)',
    role: 'Internal admin',
  },
};

export default function Chrome({ surface, userName, userRole, navItems = [], activeNav }) {
  const config = SURFACE_CONFIG[surface] || SURFACE_CONFIG.individual;
  const navigate = useNavigate();

  return (
    <>
      {/* Surface accent strip — subtle context cue */}
      <div style={{
        height: '3px',
        background: config.accent,
        width: '100%',
      }} />

      {/* Top chrome bar */}
      <header style={{
        background: 'var(--sh-card)',
        borderBottom: 'var(--sh-border-thin)',
        padding: '0 var(--sh-space-8)',
        height: 'var(--sh-chrome-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--sh-space-6)',
      }}>
        {/* Left: brand + surface label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sh-space-4)' }}>
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sh-space-2)',
            color: 'var(--sh-text-primary)',
            textDecoration: 'none',
          }}>
            <SHLogo />
            <span style={{
              fontFamily: 'var(--sh-font-serif)',
              fontSize: 'var(--sh-text-md)',
              letterSpacing: '0.01em',
            }}>
              StewardHouse
            </span>
          </Link>
          <span style={{
            width: '1px',
            height: '20px',
            background: 'var(--sh-card-border)',
          }} aria-hidden="true" />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            lineHeight: 1.2,
          }}>
            <span style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
            }}>
              {config.label}
            </span>
            <span style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
            }}>
              {config.role}
            </span>
          </div>
        </div>

        {/* Center: navigation tabs */}
        {navItems.length > 0 && (
          <nav style={{
            display: 'flex',
            gap: 'var(--sh-space-1)',
            flex: 1,
            justifyContent: 'center',
            overflow: 'auto',
          }}>
            {navItems.map((item) => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  style={{
                    background: isActive ? 'var(--sh-bronze-tint)' : 'transparent',
                    color: isActive ? 'var(--sh-bronze-deep)' : 'var(--sh-text-secondary)',
                    border: 'none',
                    padding: 'var(--sh-space-2) var(--sh-space-3)',
                    fontSize: 'var(--sh-text-sm)',
                    fontWeight: isActive ? 500 : 400,
                    borderRadius: 'var(--sh-radius-md)',
                    transition: 'all var(--sh-transition-fast)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right: user identity */}
        {userName && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sh-space-3)',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              lineHeight: 1.2,
            }}>
              <span style={{
                fontSize: 'var(--sh-text-sm)',
                color: 'var(--sh-text-primary)',
                fontWeight: 500,
              }}>
                {userName}
              </span>
              {userRole && (
                <span style={{
                  fontSize: 'var(--sh-text-xs)',
                  color: 'var(--sh-text-muted)',
                }}>
                  {userRole}
                </span>
              )}
            </div>
            <Avatar name={userName} accent={config.accent} />
          </div>
        )}
      </header>
    </>
  );
}

function Avatar({ name, accent }) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: '34px',
      height: '34px',
      borderRadius: '50%',
      background: 'var(--sh-bronze-tint)',
      color: 'var(--sh-bronze-deep)',
      fontSize: 'var(--sh-text-xs)',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      letterSpacing: '0.04em',
      border: `1px solid ${accent}`,
    }}>
      {initials}
    </div>
  );
}
