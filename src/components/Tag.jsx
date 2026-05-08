export function Tag({ children, color = 'default', accent = false }) {
  const resolvedColor = accent ? 'bronze' : color;
  const colorSchemes = {
    default: { bg: 'var(--sh-bg-tint)', text: 'var(--sh-text-secondary)', border: 'var(--sh-card-border)' },
    bronze: { bg: 'var(--sh-bronze-tint)', text: 'var(--sh-bronze-deep)', border: 'var(--sh-bronze-border)' },
    accent: { bg: '#F0EBDF', text: '#5A554C', border: '#D9C9B0' },
  };
  const c = colorSchemes[resolvedColor] || colorSchemes.default;

  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: 'var(--sh-radius-full)',
      background: c.bg,
      color: c.text,
      border: `0.5px solid ${c.border}`,
      fontSize: 'var(--sh-text-xs)',
      fontWeight: 400,
      letterSpacing: '0.02em',
      lineHeight: 1.3,
    }}>
      {children}
    </span>
  );
}
