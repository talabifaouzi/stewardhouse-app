import { useState } from 'react';

export function Card({ children, padding = 'normal', tint = false, interactive = false, accent = null, style = {}, onClick, as = 'div', 'aria-labelledby': ariaLabelledBy, ...props }) {
  const [hovered, setHovered] = useState(false);

  const padMap = {
    none: 0,
    sm: 'var(--sh-space-4)',
    md: 'var(--sh-space-5)',
    normal: 'var(--sh-space-6)',
    lg: 'var(--sh-space-8)',
  };

  const isClickable = interactive || !!onClick;

  const baseStyle = {
    background: tint ? 'var(--sh-bg-tint)' : 'var(--sh-card)',
    border: 'var(--sh-border-thin)',
    borderRadius: 'var(--sh-radius-lg)',
    padding: padMap[padding],
    transition: 'all 180ms ease',
    cursor: isClickable ? 'pointer' : 'default',
    ...(accent ? { borderTopColor: accent, borderTopWidth: '2px', borderTopStyle: 'solid' } : {}),
    ...(isClickable && hovered ? {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 14px rgba(60, 50, 30, 0.06)',
      borderColor: 'var(--sh-bronze-border)',
    } : {}),
    ...style,
  };

  const Wrapper = as;

  return (
    <Wrapper
      style={baseStyle}
      aria-labelledby={ariaLabelledBy}
      onClick={onClick}
      onMouseEnter={isClickable ? () => setHovered(true) : undefined}
      onMouseLeave={isClickable ? () => setHovered(false) : undefined}
      {...props}
    >
      {children}
    </Wrapper>
  );
}

