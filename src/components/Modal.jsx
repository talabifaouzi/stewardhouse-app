import { useEffect, useRef, useState } from 'react';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Modal({ isOpen, onClose, title, children }) {
  const triggerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const panelRef = useRef(null);
  const titleIdRef = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`);
  const [closeHovered, setCloseHovered] = useState(false);
  const [closeFocused, setCloseFocused] = useState(false);

  // Capture the element that triggered open; restore focus to it on close.
  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement;
    const raf = requestAnimationFrame(() => {
      if (closeButtonRef.current) closeButtonRef.current.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      const t = triggerRef.current;
      if (t && typeof t.focus === 'function') t.focus();
    };
  }, [isOpen]);

  // ESC closes.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Body scroll lock while open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Tab focus trap — cycle within the panel.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key !== 'Tab') return;
      if (!panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div role="presentation" onClick={onClose} style={backdropStyle}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleIdRef.current}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        style={panelStyle}
      >
        <div style={headerStyle}>
          <h2 id={titleIdRef.current} style={titleStyle}>{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            onMouseEnter={() => setCloseHovered(true)}
            onMouseLeave={() => setCloseHovered(false)}
            onFocus={() => setCloseFocused(true)}
            onBlur={() => setCloseFocused(false)}
            aria-label="Close"
            style={{
              ...closeButtonStyle,
              color: closeHovered ? 'var(--sh-text-primary)' : 'var(--sh-text-muted)',
              outline: closeFocused ? '2px solid var(--sh-bronze)' : 'none',
              outlineOffset: '2px',
            }}
          >
            ×
          </button>
        </div>
        <div style={bodyStyle}>{children}</div>
      </div>
    </div>
  );
}

const backdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'var(--sh-overlay-bg)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--sh-space-4)',
};

const panelStyle = {
  background: 'var(--sh-card)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-lg)',
  maxWidth: '600px',
  width: '100%',
  maxHeight: '80vh',
  overflow: 'auto',
  boxShadow: 'var(--sh-shadow-modal)',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 'var(--sh-space-3)',
  padding: 'var(--sh-space-5) var(--sh-space-6)',
  borderBottom: `1px solid var(--sh-card-border)`,
};

const titleStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-md)',
  color: 'var(--sh-text-primary)',
  margin: 0,
  fontWeight: 500,
  lineHeight: 1.3,
};

const closeButtonStyle = {
  background: 'transparent',
  border: 'none',
  padding: '4px 8px',
  fontSize: 'var(--sh-text-lg)',
  fontFamily: 'inherit',
  cursor: 'pointer',
  lineHeight: 1,
  borderRadius: 'var(--sh-radius-sm)',
  transition: 'color 150ms ease',
  flexShrink: 0,
};

const bodyStyle = {
  padding: 'var(--sh-space-5) var(--sh-space-6)',
};
