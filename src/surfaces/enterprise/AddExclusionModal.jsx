import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal.jsx';
import { Button } from '../../components/Button.jsx';

// Add-exclusion form (E-Slice E-Write-4). Flags an organization on the signed-in
// staff operator's institution via ComplianceProvider.addExclusion() → POST
// /api/exclusions (which also auto-logs the audit row). The endpoint is
// E11-gated (dark on production); this form only renders on the authenticated
// tree (Compliance gates it on identity).
//
// No consent line: an exclusion is an institution record, not personal data.
//
// E8 (Q4): the Connection detail field carries the authoring-discipline caution
// — third parties by public-record name + role only, never relational or private
// descriptors (the athlete-notes register). There is NO server-side content
// validation; the convention is undetectable at the endpoint, so the caution is
// the enforcement surface.
//
// Failure surfacing: the modal renders the provider's writeError (real server
// message, e.g. "Not authorized" from the E11 gate). Contents preserved on fail.

const BLANK = {
  name: '', ein: '', reason: '', connection: '', connectionDetail: '',
};

export default function AddExclusionModal({ isOpen, onClose, onAdd, writeError, clearWriteError }) {
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

  const canSubmit =
    form.name.trim().length > 0 && form.reason.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    clearWriteError();
    const payload = { name: form.name.trim(), reason: form.reason.trim() };
    for (const k of ['ein', 'connection', 'connectionDetail']) {
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
    <Modal isOpen={isOpen} onClose={onClose} title="Add exclusion">
      <Field label="Organization name" required>
        <input type="text" value={form.name} onChange={set('name')} placeholder="Organization name" style={inputStyle} />
      </Field>
      <Field label="EIN">
        <input type="text" value={form.ein} onChange={set('ein')} placeholder="00-0000000" style={inputStyle} />
      </Field>
      <Field label="Reason" required>
        <input type="text" value={form.reason} onChange={set('reason')} placeholder="e.g. Booster connection" style={inputStyle} />
      </Field>
      <Field label="Connection">
        <input type="text" value={form.connection} onChange={set('connection')} placeholder="Short label (optional)" style={inputStyle} />
      </Field>
      <Field label="Connection detail">
        <textarea value={form.connectionDetail} onChange={set('connectionDetail')} rows={5} placeholder="Context for the flag (optional)" style={textareaStyle} />
        {/* E8 authoring caution — public-record name + role only. */}
        <p style={cautionStyle}>
          Name third parties by public-record name and role only (e.g. “Board member Dana Reeves”) — never relational or private descriptors.
        </p>
      </Field>

      {writeError && <p style={formErrorStyle}>{writeError}</p>}

      <div style={footerStyle}>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? 'Adding…' : 'Add exclusion'}
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

const cautionStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  lineHeight: 1.5,
  marginTop: 'var(--sh-space-2)',
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
