import { useId, useState } from 'react';

// ENT #16 known limitations recorded during the additive a11y sweep:
//   • onBlur-closes is correct ONLY while `definition` is a plain text node
//     (current usage: 2 Advisor Pipeline call sites pass strings). If a future
//     consumer passes JSX with focusable children inside the popup, focus
//     moving INTO the popup will fire blur on the trigger and close it. At
//     that point switch from onBlur-closes to outside-click + Escape close.
//   • role="tooltip" is preserved for additive-only scope. A future
//     refinement should reshape this widget as a proper disclosure
//     (role="region" + the button as a true disclosure trigger), since the
//     interaction is click-toggled rather than hover/focus.
export function HelpIcon({ definition, position = 'bottom' }) {
  const [open, setOpen] = useState(false);
  const popupId = useId();

  const popupPositions = {
    bottom: { top: '22px', left: '0' },
    top: { bottom: '22px', left: '0' },
    right: { top: '0', left: '22px' },
  };

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && open) {
            setOpen(false);
          }
        }}
        aria-label="What is this?"
        aria-expanded={open}
        aria-controls={popupId}
        style={{
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          // ENT #10: was hardcoded #B8AE9E — swapped to --sh-bronze-border
          // (#D9C9B0); slight visual shift to warmer/lighter accepted per
          // founder ruling R4 (visible color change, dev-server verified).
          border: '0.5px solid var(--sh-bronze-border)',
          background: 'transparent',
          color: 'var(--sh-text-muted)',
          // ENT #66 F1-nudge precedent (advisor bundle 3 ADV-006): was '9px' —
          // nearest token is --sh-text-xs (11px, +2px nudge). Shared component
          // — affects both Enterprise consumers AND Advisor's Pipeline.
          fontSize: 'var(--sh-text-xs)',
          lineHeight: 1,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'inherit',
          padding: 0,
        }}
      >
        ?
      </button>
      {open && (
        <span
          id={popupId}
          role="tooltip"
          style={{
            position: 'absolute',
            ...popupPositions[position],
            background: 'var(--sh-bg-tint)',
            border: '0.5px solid var(--sh-card-border)',
            borderRadius: 'var(--sh-radius-md)',
            padding: '10px 12px',
            fontSize: 'var(--sh-text-xs)',
            lineHeight: 1.55,
            color: 'var(--sh-text-secondary)',
            width: '240px',
            zIndex: 10,
            textTransform: 'none',
            letterSpacing: 0,
            fontWeight: 400,
            textAlign: 'left',
          }}
        >
          {definition}
        </span>
      )}
    </span>
  );
}
