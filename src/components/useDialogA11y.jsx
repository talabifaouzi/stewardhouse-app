import { useEffect, useRef } from 'react';
import { useModalStack } from '../contexts/ModalStackContext.jsx';

// Shared dialog accessibility hook. Mirrors Modal.jsx's focus-trap, initial
// focus, Escape close, and trigger-restore semantics so non-Modal dialogs
// (e.g. the Pipeline ConfigDrawer, a right-side slide-in panel) can opt into
// the same a11y guarantees without inheriting Modal's visual chrome.
//
// Stack coordination: each instance registers a unique `dialog-{rand}` id on
// the shared ModalStackContext, distinct from Modal's `modal-{rand}` ids.
// Escape and Tab handlers only fire when this dialog is the top of the stack,
// so a future nested Modal opened ABOVE a dialog (or vice versa) preserves
// correct topmost-only handling and never corrupts the stack for the other
// pattern's consumers.
//
// Args:
//   isOpen           — boolean; effects only register while true
//   onClose          — callback for Escape (and for the consumer's own close UI)
//   panelRef         — ref pointing at the dialog's outer focusable container;
//                      Tab trap queries focusables WITHIN this element
//   initialFocusRef  — optional ref to focus on open; falls back to first
//                      focusable inside panelRef
//
// Modal.jsx itself is NOT migrated to this hook in bundle 6 (8-consumer
// blast radius across the audited Enterprise surface). A future "Modal DRY"
// slice can adopt the hook in Modal too.

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useDialogA11y({ isOpen, onClose, panelRef, initialFocusRef }) {
  const triggerRef = useRef(null);
  const idRef = useRef(null);
  if (idRef.current === null) {
    idRef.current = `dialog-${Math.random().toString(36).slice(2, 9)}`;
  }
  const { push, pop, isTop } = useModalStack();

  // Register on stack while open; pop on unmount.
  useEffect(() => {
    if (!isOpen) return;
    const id = idRef.current;
    push(id);
    return () => pop(id);
  }, [isOpen, push, pop]);

  // Capture the element that triggered open; focus the initial target;
  // restore focus to the trigger on close.
  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement;
    const raf = requestAnimationFrame(() => {
      const target =
        initialFocusRef?.current ||
        panelRef?.current?.querySelector(FOCUSABLE_SELECTOR);
      if (target && typeof target.focus === 'function') target.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      const t = triggerRef.current;
      if (t && typeof t.focus === 'function') t.focus();
    };
  }, [isOpen, initialFocusRef, panelRef]);

  // ESC closes — only when this dialog is top of the stack.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape' && isTop(idRef.current)) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isTop, onClose]);

  // Tab focus trap — only when this dialog is top of the stack.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key !== 'Tab' || !isTop(idRef.current)) return;
      if (!panelRef?.current) return;
      const focusables = panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      // Boundary comparison uses .contains() in addition to strict === so
      // the trap stays correct when a focusable button wraps a non-text
      // child (e.g. an SVG icon). On Shift+Tab from a button whose only
      // content is an SVG path, some browsers report document.activeElement
      // as the descendant element, not the button itself — strict === then
      // fails and the trap leaks. Modal.jsx's close button gets away with
      // strict === only because its content is a plain text node ("×");
      // this hook must work for any consumer regardless of button content.
      const onFirst = first === document.activeElement || first.contains(document.activeElement);
      const onLast = last === document.activeElement || last.contains(document.activeElement);
      if (e.shiftKey && onFirst) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && onLast) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isTop, panelRef]);
}
