import { useState } from 'react';

export function Button({ children, variant = 'secondary', size = 'normal', onClick, disabled, type = 'button', style = {}, ...props }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const variants = {
    primary: {
      base: {
        background: 'var(--sh-bronze)',
        color: 'var(--sh-text-on-accent)',
        border: '1px solid var(--sh-bronze)',
      },
      hover: {
        background: 'var(--sh-bronze-deep)',
        borderColor: 'var(--sh-bronze-deep)',
      },
    },
    secondary: {
      base: {
        background: 'var(--sh-card)',
        color: 'var(--sh-text-secondary)',
        border: 'var(--sh-border-thin)',
      },
      hover: {
        background: 'var(--sh-bronze-tint)',
        color: 'var(--sh-bronze-deep)',
        borderColor: 'var(--sh-bronze-border)',
      },
    },
    ghost: {
      base: {
        background: 'transparent',
        color: 'var(--sh-text-secondary)',
        border: '1px solid transparent',
      },
      hover: {
        background: 'var(--sh-bg-tint)',
        color: 'var(--sh-text-primary)',
      },
    },
  };

  const sizes = {
    sm: { padding: '6px 10px', fontSize: 'var(--sh-text-xs)' },
    normal: { padding: '8px 14px', fontSize: 'var(--sh-text-sm)' },
    lg: { padding: '10px 18px', fontSize: 'var(--sh-text-base)' },
  };

  const v = variants[variant] || variants.secondary;
  const computedStyle = {
    ...v.base,
    ...sizes[size],
    borderRadius: 'var(--sh-radius-md)',
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 150ms ease',
    transform: pressed && !disabled ? 'translateY(1px)' : 'translateY(0)',
    ...(hovered && !disabled ? v.hover : {}),
    ...style,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={computedStyle}
      {...props}
    >
      {children}
    </button>
  );
}
