import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal.jsx';
import { Button } from '../../components/Button.jsx';

// Schedule-workshop form (E-Slice E-Write-3a). Creates a workshop on the
// signed-in staff operator's institution via WorkshopsProvider.add() → POST
// /api/workshops. The endpoint is E11-gated (dark on production); this form
// only ever renders on the authenticated tree (Program gates it on identity).
//
// No consent line: a workshop is an institution record, not personal data (the
// E6 program-consent posture belongs on athlete-facing writes, not here).
//
// Facilitator is NOT collected (Q2) — facilitator_person_id is NULL at create
// and the E4 facilitator-person wiring is deferred to a later slice.
//
// Fields: Title (required), Date (required, native YYYY-MM-DD), Status (select,
// default Scheduled), Module, Summary, Notes. title + date are required both
// here and server-side; the calendar renders by date so an absent date is not
// a valid workshop.
//
// Failure surfacing (E-Write-1 idiom): the modal renders the provider's
// writeError (the real server message, e.g. "Not authorized" from the E11
// gate). Form contents are preserved on failure.

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
];

const BLANK = {
  title: '', date: '', status: 'scheduled',
  module: '', summary: '', notes: '',
};

export default function ScheduleWorkshopModal({ isOpen, onClose, onAdd, writeError, clearWriteError }) {
  const [form, setForm] = useState(BLANK);
  const [submitting, setSubmitting] = useState(false);

  // Reset on open — including any stale provider writeError from a prior submit.
  useEffect(() => {
    if (isOpen) {
      setForm(BLANK);
      setSubmitting(false);
      clearWriteError();
    }
  }, [isOpen, clearWriteError]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSubmit = form.title.trim().length > 0 && form.date.trim() !== '' && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    clearWriteError();
    // title + date + status always sent; other fields dropped when empty.
    const payload = {
      title: form.title.trim(),
      date: form.date.trim(),
      status: form.status,
    };
    for (const k of ['module', 'summary', 'notes']) {
      const v = form[k].trim();
      if (v !== '') payload[k] = v;
    }
    const saved = await onAdd(payload);
    if (saved) {
      onClose();
    } else {
      // add() already set the provider writeError (the real server message);
      // the modal renders it below. Form contents preserved for retry/correct.
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule workshop">
      <Field label="Title" required>
        <input type="text" value={form.title} onChange={set('title')} placeholder="e.g. Giving Vehicles" style={inputStyle} />
      </Field>
      <Field label="Date" required>
        <input type="date" value={form.date} onChange={set('date')} style={inputStyle} />
      </Field>
      <Field label="Status">
        <select value={form.status} onChange={set('status')} style={selectStyle}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Module">
        <input type="text" value={form.module} onChange={set('module')} placeholder="e.g. Module 5: Giving Vehicles" style={inputStyle} />
      </Field>
      <Field label="Summary">
        <textarea value={form.summary} onChange={set('summary')} rows={4} placeholder="What the session covers (optional)" style={textareaStyle} />
      </Field>
      <Field label="Notes">
        <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Staff notes (optional)" style={textareaStyle} />
      </Field>

      {writeError && <p style={formErrorStyle}>{writeError}</p>}

      <div style={footerStyle}>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? 'Scheduling…' : 'Schedule workshop'}
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

const selectStyle = {
  ...inputStyle,
  // Native select needs an explicit height to match text inputs; padding +
  // border-box + full width keep it flush with the other fields at 375px.
  appearance: 'auto',
  cursor: 'pointer',
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  lineHeight: 1.6,
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
