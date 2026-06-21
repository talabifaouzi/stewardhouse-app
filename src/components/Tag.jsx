export function Tag({ children, color = 'default', tone, accent = false, tracking = 'normal', style = {} }) {
  // Support both 'color' and 'tone' props for compatibility
  const resolvedColor = accent ? 'bronze' : (tone || color);
  const colorSchemes = {
    default: { bg: 'var(--sh-bg-tint)', text: 'var(--sh-text-secondary)', border: 'var(--sh-card-border)' },
    bronze: { bg: 'var(--sh-bronze-tint)', text: 'var(--sh-bronze-deep)', border: 'var(--sh-bronze-border)' },
    accent: { bg: 'var(--sh-divider)', text: 'var(--sh-text-secondary)', border: 'var(--sh-bronze-border)' },
    warning: { bg: 'var(--sh-warning-bg)', text: 'var(--sh-warning-text)', border: 'var(--sh-warning-border)' },
  };
  const c = colorSchemes[resolvedColor] || colorSchemes.default;

  // ENT #44 — tracking variant. 'normal' (default) preserves original Tag
  // shape: 4px 10px padding, weight 400, letterSpacing 0.02em, hairline
  // border. 'loose' is the status-pill preset migrated from 6 inline
  // rolePillStyle / sessionPillStyle / pendingPillStyle / reviewPillStyle
  // sites: tighter padding (2px 8px), heavier weight (500), looser tracking
  // (0.06em — midpoint of pre-existing 0.04em role pills and 0.08em status
  // pills), no border.
  const isLoose = tracking === 'loose';

  return (
    <span style={{
      display: 'inline-block',
      padding: isLoose ? '2px 8px' : '4px 10px',
      borderRadius: 'var(--sh-radius-full)',
      background: c.bg,
      color: c.text,
      border: isLoose ? 'none' : `0.5px solid ${c.border}`,
      fontSize: 'var(--sh-text-xs)',
      fontWeight: isLoose ? 500 : 400,
      letterSpacing: isLoose ? '0.06em' : '0.02em',
      lineHeight: 1.3,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {children}
    </span>
  );
}
