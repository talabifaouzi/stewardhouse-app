import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal.jsx';
import { Button } from '../../components/Button.jsx';

// Record-audit-entry form (E-Slice E-Write-4). Records a MANUAL compliance-audit
// entry (e.g. "Quarterly compliance review completed") via
// ComplianceProvider.addAuditEntry() → POST /api/compliance-audit. Structural
// actions (exclusion add/remove) auto-log their own audit rows server-side and
// never come through here. E11-gated (dark on production); authenticated tree
// only.
//
// The audit log is append-only (E7): this form only ADDS; there is no edit or
// delete. writeError surfaces in-form.

const BLANK = { action: '', target: '', reason: '', notes: '' };

export default function RecordAuditModal({ isOpen, onClose, onAdd, writeError, clearWriteError }) {
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

  const canSubmit = form.action.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    clearWriteError();
    const payload = { action: form.action.trim() };
    for (const k of ['target', 'reason', 'notes']) {
      const v = form[k].trim();
      if (v !== '') payload[k] = v;
    }
    const saved = await onAdd(payload);
    if (saved) {
      onClose();
    } else {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record audit entry">
      <Field label="Action" required>
        <input type="text" value={form.action} onChange={set('action')} placeholder="e.g. Quarterly compliance review completed" style={inputStyle} />
      </Field>
      <Field label="Organization">
        <input type="text" value={form.target} onChange={set('target')} placeholder="Organization, if applicable (optional)" style={inputStyle} />
      </Field>
      <Field label="Reason">
        <input type="text" value={form.reason} onChange={set('reason')} placeholder="Reason (optional)" style={inputStyle} />
      </Field>
      <Field label="Notes">
        <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Notes (optional)" style={textareaStyle} />
      </Field>

      {writeError && <p style={formErrorStyle}>{writeError}</p>}

      <div style={footerStyle}>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? 'Recording…' : 'Record entry'}
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
