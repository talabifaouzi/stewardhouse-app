export function Button({ children, variant = 'secondary', size = 'normal', onClick, disabled, type = 'button', style = {}, ...props }) {
  const variants = {
    primary: {
      background: 'var(--sh-bronze)',
      color: '#FFFFFF',
      border: '1px solid var(--sh-bronze)',
    },
    secondary: {
      background: 'var(--sh-card)',
      color: 'var(--sh-text-secondary)',
      border: 'var(--sh-border-thin)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--sh-text-secondary)',
      border: '1px solid transparent',
    },
  };
  const sizes = {
    sm: { padding: '6px 10px', fontSize: 'var(--sh-text-xs)' },
    normal: { padding: '8px 14px', fontSize: 'var(--sh-text-sm)' },
    lg: { padding: '10px 18px', fontSize: 'var(--sh-text-base)' },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: 'var(--sh-radius-md)',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all var(--sh-transition-fast)',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
