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
        display: 'inline-block',
        color: hovered ? 'var(--sh-text-primary)' : 'var(--sh-text-muted)',
        textDecoration: 'none',
        fontSize: 'var(--sh-text-xs)',
        marginBottom: 'var(--sh-space-3)',
        letterSpacing: '0.04em',
        transition: 'color 150ms ease',
      }}
    >
      ← {label}
    </Link>
  );
}
