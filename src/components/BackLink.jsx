import { useState } from 'react';
import { Link } from 'react-router-dom';

// Quiet back-navigation link. Prefixes the arrow automatically; pass only
// the destination route + the label text (e.g., label="Reports").

export default function BackLink({ to, label }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--sh-space-1)',
        color: hovered ? 'var(--sh-text-primary)' : 'var(--sh-text-muted)',
        textDecoration: 'none',
        fontSize: 'var(--sh-text-xs)',
        marginBottom: 'var(--sh-space-3)',
        letterSpacing: '0.04em',
        transition: 'color 150ms ease',
      }}
    >
      <svg width="8" height="12" viewBox="0 0 8 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="6 1 1 6 6 11" />
      </svg>
      {label}
    </Link>
  );
}
