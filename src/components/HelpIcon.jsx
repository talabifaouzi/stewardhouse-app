import { useState } from 'react';

export function HelpIcon({ definition, position = 'bottom' }) {
  const [open, setOpen] = useState(false);

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
        aria-label="What is this?"
        style={{
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          border: '0.5px solid #B8AE9E',
          background: 'transparent',
          color: 'var(--sh-text-muted)',
          fontSize: '9px',
          lineHeight: 1,
          cursor: 'help',
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
