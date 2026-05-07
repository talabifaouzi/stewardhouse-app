// Typographic brand mark — letter-spaced "STEWARDHOUSE" in bronze.
// Matches the brand treatment from the existing prototype.

export function SHLogo({ size = 'normal', color }) {
  const sizes = {
    small: { fontSize: '10px', letterSpacing: '0.25em' },
    normal: { fontSize: '11px', letterSpacing: '0.3em' },
    large: { fontSize: '13px', letterSpacing: '0.32em' },
    xl: { fontSize: '16px', letterSpacing: '0.34em' },
  };
  const s = sizes[size] || sizes.normal;

  return (
    <span style={{
      fontFamily: 'var(--sh-font-sans)',
      fontWeight: 300,
      color: color || 'var(--sh-bronze)',
      textTransform: 'uppercase',
      display: 'inline-block',
      ...s,
    }}>
      STEWARDHOUSE
    </span>
  );
}

// Brand mark + accent line (used on landing/intro screens for editorial feel)
export function SHLogoStacked({ size = 'large' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '14px',
    }}>
      <SHLogo size={size} />
      <div style={{
        width: '40px',
        height: '1px',
        background: 'var(--sh-bronze)',
      }} />
    </div>
  );
}
