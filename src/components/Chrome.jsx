import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SHLogo } from './SHLogo.jsx';
import useMediaQuery, { MOBILE_QUERY } from '../hooks/useMediaQuery.js';

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
    label: 'Philanthropic Advisor',
    accent: 'var(--sh-advisor-accent)',
    role: 'Practice workspace',
  },
  operations: {
    label: 'Operations',
    accent: 'var(--sh-operations-accent)',
    role: 'Internal admin',
  },
};

export default function Chrome({ surface, userName, userRole, navItems = [], activeNav, onUserClick, onContactsClick, surfaceContext }) {
  const config = SURFACE_CONFIG[surface] || SURFACE_CONFIG.individual;
  const isMobile = useMediaQuery(MOBILE_QUERY);

  return (
    <>
      {/* Surface accent strip */}
      <div style={{
        height: '3px',
        background: config.accent,
        width: '100%',
      }} />

      {/* Top chrome bar */}
      <header style={{
        background: 'var(--sh-card)',
        borderBottom: 'var(--sh-border-thin)',
        padding: '0 clamp(var(--sh-space-3), 3vw, var(--sh-space-8))',
        height: 'var(--sh-chrome-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'clamp(var(--sh-space-3), 2vw, var(--sh-space-6))',
      }}>
        {/* Left: brand + surface label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(var(--sh-space-2), 2vw, var(--sh-space-4))' }}>
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
          }}>
            <SHLogo size="normal" />
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
            {surfaceContext && !isMobile && (
              <span style={{
                fontSize: 'var(--sh-text-xs)',
                color: 'var(--sh-text-muted)',
                letterSpacing: '0.04em',
                marginTop: '2px',
              }}>
                {surfaceContext}
              </span>
            )}
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
            {navItems.map((item) => (
              <NavTab key={item.key} item={item} isActive={activeNav === item.key} />
            ))}
          </nav>
        )}

        {/* Right: optional Contacts button + user identity */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(var(--sh-space-2), 2vw, var(--sh-space-4))',
        }}>
          {onContactsClick && (
            <ContactsButton onClick={onContactsClick} />
          )}
          {userName && (
            <UserIdentity
              userName={userName}
              userRole={userRole}
              accent={config.accent}
              onClick={onUserClick}
              hideRole={isMobile}
            />
          )}
        </div>
      </header>
    </>
  );
}

function NavTab({ item, isActive }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const baseStyle = {
    background: isActive ? 'var(--sh-bronze-tint)' : 'transparent',
    color: isActive ? 'var(--sh-bronze-deep)' : 'var(--sh-text-secondary)',
    border: 'none',
    padding: 'var(--sh-space-2) var(--sh-space-3)',
    fontSize: 'var(--sh-text-sm)',
    fontWeight: isActive ? 500 : 400,
    borderRadius: 'var(--sh-radius-md)',
    transition: 'all 150ms ease',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const hoverStyle = !isActive && hovered ? {
    background: 'var(--sh-bg-tint)',
    color: 'var(--sh-text-primary)',
  } : {};

  return (
    <button
      onClick={() => navigate(item.path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...baseStyle, ...hoverStyle }}
    >
      {item.label}
    </button>
  );
}

function ContactsButton({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--sh-bg-tint)' : 'transparent',
        color: hovered ? 'var(--sh-text-primary)' : 'var(--sh-text-secondary)',
        border: 'none',
        padding: 'var(--sh-space-2) var(--sh-space-3)',
        fontSize: 'var(--sh-text-sm)',
        fontFamily: 'inherit',
        borderRadius: 'var(--sh-radius-md)',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        whiteSpace: 'nowrap',
      }}
    >
      Contacts
    </button>
  );
}

function UserIdentity({ userName, userRole, accent, onClick, hideRole }) {
  const [hovered, setHovered] = useState(false);
  const inner = (
    <>
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
        {userRole && !hideRole && (
          <span style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
          }}>
            {userRole}
          </span>
        )}
      </div>
      <Avatar name={userName} accent={accent} />
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'var(--sh-bg-tint)' : 'transparent',
          border: 'none',
          padding: 'var(--sh-space-1) var(--sh-space-2)',
          borderRadius: 'var(--sh-radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sh-space-3)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'background 150ms ease',
        }}
      >
        {inner}
      </button>
    );
  }
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sh-space-3)',
    }}>
      {inner}
    </div>
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
