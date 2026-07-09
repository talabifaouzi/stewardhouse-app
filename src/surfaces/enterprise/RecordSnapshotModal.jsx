import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal.jsx';
import { Button } from '../../components/Button.jsx';

// Record-period-snapshot form (E-Slice E-Write-5). Captures the institution's
// current program aggregates as a FROZEN record via SnapshotsProvider.add() →
// POST /api/snapshots. The server DERIVES every aggregate from live D1 at
// snapshot time; this form supplies only the label + optional note — there are
// no metric inputs (a snapshot is a derived record, not a data-entry form).
// E11-gated (dark on production); authenticated tree only.
//
// dollars_moved + avg_weekly_engagement are recorded NULL ("not tracked") — no
// D1 source (Q5). writeError surfaces in-form.

const BLANK = { cohortLabel: '', asOfNote: '' };

export default function RecordSnapshotModal({ isOpen, onClose, onAdd, writeError, clearWriteError }) {
  const [form, setForm] = useState(BLANK);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(BLANK);
      setSubmitting(false);
      clearWriteError();
    }
  }, [isOpen, clearWriteError]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSubmit = form.cohortLabel.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    clearWriteError();
    const payload = { cohortLabel: form.cohortLabel.trim() };
    const note = form.asOfNote.trim();
    if (note !== '') payload.asOfNote = note;
    const saved = await onAdd(payload);
    if (saved) {
      onClose();
    } else {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record period snapshot">
      <p style={registerStyle}>
        Captures the current program aggregates as a frozen record. Gift dollars and weekly engagement are not tracked and record as “Not tracked.”
      </p>
      <Field label="Cohort label" required>
        <input type="text" value={form.cohortLabel} onChange={set('cohortLabel')} placeholder="e.g. 2025-2026" style={inputStyle} />
      </Field>
      <Field label="As-of note">
        <input type="text" value={form.asOfNote} onChange={set('asOfNote')} placeholder="e.g. Through May 7, 2026 (optional)" style={inputStyle} />
      </Field>

      {writeError && <p style={formErrorStyle}>{writeError}</p>}

      <div style={footerStyle}>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? 'Recording…' : 'Record snapshot'}
        </Button>
      </div>
    </Modal>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={fieldBlockStyle}>
      <label style={labelStyle}>
        {label}{required && <span style={requiredStyle}> *</span>}
      </label>
      {children}
    </div>
  );
}

const registerStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 0,
  marginBottom: 'var(--sh-space-4)',
};

const fieldBlockStyle = { marginBottom: 'var(--sh-space-4)' };

const labelStyle = {
  display: 'block',
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
  marginBottom: 'var(--sh-space-2)',
};

const requiredStyle = { color: 'var(--sh-bronze)' };

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 'var(--sh-space-3)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  fontFamily: 'inherit',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  background: 'var(--sh-card)',
};

const formErrorStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-bronze-deep)',
  marginBottom: 'var(--sh-space-3)',
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--sh-space-2)',
  marginTop: 'var(--sh-space-5)',
  paddingTop: 'var(--sh-space-4)',
  borderTop: 'var(--sh-border-thin)',
};
