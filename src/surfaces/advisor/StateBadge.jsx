// Pipeline state badge — Active / Mute / Pause. Shared by ClientWorkspace
// ("Active in pipeline" panel) and Pipeline (practice-wide defaults panel).
// Extracted in bundle 2 from two duplicate definitions; values mapped to
// brand tokens per ADV-004 ruling. Green-as-active is the first non-warm
// semantic color in the system — see --sh-state-active-* in tokens.css.

const COLORS = {
  Active: { bg: 'var(--sh-state-active-bg)', text: 'var(--sh-state-active-text)' },
  Mute:   { bg: 'var(--sh-divider)',         text: 'var(--sh-text-secondary)' },
  Pause:  { bg: 'var(--sh-bronze-tint)',     text: 'var(--sh-bronze-deep)' },
};

export default function StateBadge({ state }) {
  const c = COLORS[state] || COLORS.Active;
  return (
    <span style={{
      // ADV-006 F1 ruling: was '10px' — swapped to nearest token (11px),
      // +1px nudge per Operations QA-031 precedent.
      fontSize: 'var(--sh-text-xs)',
      padding: '3px 9px',
      borderRadius: 'var(--sh-radius-full)',
      background: c.bg,
      color: c.text,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontWeight: 500,
    }}>
      {state}
    </span>
  );
}
