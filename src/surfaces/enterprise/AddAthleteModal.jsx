import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal.jsx';
import { Button } from '../../components/Button.jsx';

// Roster-add form (E-Slice E-Write-1). Enrolls an athlete on the signed-in
// staff operator's institution via AthletesProvider.add() → POST /api/athletes.
// The endpoint is E11-gated (dark on production); this form only ever renders
// on the authenticated tree (Roster gates it on identity).
//
// C-1 field lockdown (consent model, docs/enterprise-provisioning-runbook.md
// §4 E6): pre-claim, an athlete record holds NAME + EMAIL only. The form
// collects nothing else — sport / class / phone / badge / notes are removed,
// and the endpoint rejects those keys 400. They become settable only after the
// athlete claims their account and delegates management to staff (C-3).
//
// Consent (E6): the FT-ruled roster-add copy is shown and a required
// acknowledgment must be checked before submit. The endpoint ALSO requires the
// acknowledgment (consentAcknowledged: true) so non-form callers cannot skip
// it. The copy's opening ("sends them an invitation right away") describes the
// C-2 auto-send, which is not yet wired — the copy is ruled as final text now.
//
// Failure surfacing (E-Write-1 fix): the modal renders the provider's
// writeError (the real server message, e.g. "Not authorized" from the E11
// gate) rather than a generic local string — matching the ClientWorkspace /
// CohortDetail idiom. Form contents are preserved on failure.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// C-1: name + email only. The payload loop in handleSubmit iterates these keys,
// so adding a field here would re-widen the form — keep it to the two.
const BLANK = {
  name: '', email: '',
};

export default function AddAthleteModal({ isOpen, onClose, onAdd, writeError, clearWriteError }) {
  const [form, setForm] = useState(BLANK);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset on open — including any stale provider writeError from a prior submit.
  useEffect(() => {
    if (isOpen) {
      setForm(BLANK);
      setConsent(false);
      setSubmitting(false);
      clearWriteError();
    }
  }, [isOpen, clearWriteError]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const emailOk = form.email.trim() === '' || EMAIL_REGEX.test(form.email.trim());
  const canSubmit = form.name.trim().length > 0 && consent && emailOk && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    clearWriteError();
    // Trim + drop empties to null; the endpoint owns institution/status/dates.
    const payload = { consentAcknowledged: true };
    for (const k of Object.keys(BLANK)) {
      const v = form[k].trim();
      if (k === 'name') payload.name = v;
      else if (v !== '') payload[k] = v;
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
    <Modal isOpen={isOpen} onClose={onClose} title="Add athlete">
      <Field label="Name" required>
        <input type="text" value={form.name} onChange={set('name')} placeholder="Full name" style={inputStyle} />
      </Field>
      <Field label="Email">
        <input type="email" value={form.email} onChange={set('email')} placeholder="name@school.edu" style={inputStyle} />
        {!emailOk && <p style={fieldErrorStyle}>Enter a valid email address, or leave blank.</p>}
      </Field>

      {/* E6 consent — FT-ruled roster-add copy + required acknowledgment.
          NOTE: invitation auto-send lands in C-2; the copy below is ruled as
          final text now (its first sentence describes the C-2 behavior). */}
      <div style={consentBoxStyle}>
        <p style={consentTextStyle}>
          Adding an athlete sends them an invitation right away — give them a heads-up that it&rsquo;s coming and why. Until they accept, their record holds only name and email; nothing else can be added. When they claim their account they choose: manage it themselves, or authorize you to manage it for them. Either way it&rsquo;s theirs, and it leaves with them.
        </p>
        <label style={consentLabelStyle}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={checkboxStyle} />
          <span>I acknowledge the consent model above applies to this athlete.</span>
        </label>
      </div>

      {writeError && <p style={formErrorStyle}>{writeError}</p>}

      <div style={footerStyle}>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? 'Enrolling…' : 'Enroll athlete'}
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

const fieldErrorStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-bronze-deep)',
  marginTop: 'var(--sh-space-1)',
};

const consentBoxStyle = {
  marginTop: 'var(--sh-space-2)',
  marginBottom: 'var(--sh-space-4)',
  padding: 'var(--sh-space-4)',
  background: 'var(--sh-bg-tint)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
};

const consentTextStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 0,
  marginBottom: 'var(--sh-space-3)',
};

const consentLabelStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--sh-space-2)',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.5,
  cursor: 'pointer',
};

const checkboxStyle = {
  marginTop: '3px',
  accentColor: 'var(--sh-bronze)',
  flexShrink: 0,
  cursor: 'pointer',
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
