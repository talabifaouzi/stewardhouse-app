export function SectionLabel({ children, helpIcon = null }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sh-space-2)',
      marginBottom: 'var(--sh-space-3)',
    }}>
      <span style={{
        fontSize: 'var(--sh-text-xs)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--sh-text-muted)',
        fontWeight: 500,
      }}>
        {children}
      </span>
      {helpIcon}
    </div>
  );
}
