export function SectionLabel({ children, helpIcon = null, level = 2, id }) {
  const HeadingTag = `h${level}`;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sh-space-2)',
      marginBottom: 'var(--sh-space-3)',
    }}>
      <HeadingTag id={id} style={{
        fontFamily: 'inherit',
        fontSize: 'var(--sh-text-xs)',
        fontWeight: 500,
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        lineHeight: 'inherit',
        margin: 0,
      }}>
        {children}
      </HeadingTag>
      {helpIcon}
    </div>
  );
}
