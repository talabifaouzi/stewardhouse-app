import { useState } from 'react';

// Stat tile primitive used across the enterprise surface.
//
// Variants:
//   - 'card'   (default): background + thin border + radius + padding.
//                         Used by Overview and Roster — visually self-contained.
//   - 'inline'          : padding-only, no background/border.
//                         Used by ProgramSummary — sits inside an outer Card.
//
// When onClick is provided, renders as a <button> with hover + focus state.
// When onClick is absent, renders as a <div> with no interactive affordance.

export default function StatTile({ label, value, sublabel, onClick, variant = 'card' }) {
  if (onClick) {
    return (
      <ClickableTile
        label={label}
        value={value}
        sublabel={sublabel}
        onClick={onClick}
        variant={variant}
      />
    );
  }
  return (
    <div style={variant === 'inline' ? inlineContainerStyle : cardContainerStyle}>
      <p style={labelStyle}>{label}</p>
      <p style={valueStyle}>{value}</p>
      {sublabel && <p style={sublabelStyle}>{sublabel}</p>}
    </div>
  );
}

function ClickableTile({ label, value, sublabel, onClick, variant }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const baseStyle = variant === 'inline' ? inlineContainerStyle : cardContainerStyle;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...baseStyle,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        width: '100%',
        transition: 'border-color 150ms ease',
        ...(variant === 'card'
          ? { borderColor: hovered ? 'var(--sh-bronze)' : 'var(--sh-card-border)' }
          : {}),
        outline: focused ? '2px solid var(--sh-bronze)' : 'none',
        outlineOffset: '2px',
      }}
    >
      <p style={labelStyle}>{label}</p>
      <p style={valueStyle}>{value}</p>
      {sublabel && <p style={sublabelStyle}>{sublabel}</p>}
    </button>
  );
}

const cardContainerStyle = {
  background: 'var(--sh-card)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-lg)',
  padding: 'var(--sh-space-5)',
};

const inlineContainerStyle = {
  padding: 'var(--sh-space-3) 0',
};

const labelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--sh-space-2)',
  fontWeight: 500,
};

const valueStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-2xl)',
  color: 'var(--sh-text-primary)',
  lineHeight: 1.1,
};

const sublabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  marginTop: 'var(--sh-space-2)',
  lineHeight: 1.5,
};
