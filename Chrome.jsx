export function Card({ children, padding = 'normal', tint = false, style = {}, ...props }) {
  const padMap = {
    none: 0,
    sm: 'var(--sh-space-4)',
    normal: 'var(--sh-space-6)',
    lg: 'var(--sh-space-8)',
  };
  return (
    <div
      style={{
        background: tint ? 'var(--sh-bg-tint)' : 'var(--sh-card)',
        border: 'var(--sh-border-thin)',
        borderRadius: 'var(--sh-radius-lg)',
        padding: padMap[padding],
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 'var(--sh-space-4)',
      marginBottom: 'var(--sh-space-5)',
    }}>
      <div>
        <h3 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-xl)',
          color: 'var(--sh-text-primary)',
          margin: 0,
          marginBottom: subtitle ? 'var(--sh-space-1)' : 0,
        }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-muted)',
            margin: 0,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
