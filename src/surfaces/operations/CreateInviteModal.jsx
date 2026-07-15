import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal.jsx';
import { Button } from '../../components/Button.jsx';

// Create-invite form (invite-creation slice). Mints a claimable person row via
// POST /api/invites (requireGatedOps — dark on production until FT sets
// $.ops.demo_gate on the ops row). Renders ONLY on the authenticated Accounts
// view (the ops operator surface). Mirrors AddAthleteModal: reset-on-open,
// canSubmit gating, the real server message surfaced via writeError, form
// contents preserved on failure.
//
// Type display labels follow the naming ruling (ops → "Admin"); the SUBMITTED
// value stays the raw enum ('ops'). source_surface is derived server-side from
// type — the form never sends it.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'advisor', label: 'Advisor' },
  { value: 'staff', label: 'Staff' }, // bootstrap-only; canonical staff provisioning = docs/enterprise-provisioning-runbook.md
  { value: 'ops', label: 'Admin' },
];

const BLANK = { displayName: '', email: '', type: 'individual' };

export default function CreateInviteModal({ isOpen, onClose, onCreate, writeError, clearWriteError }) {
  const [form, setForm] = useState(BLANK);
  const [submitting, setSubmitting] = useState(false);
  // Outcome notice shown after a successful create. This is a WARNING ON A
  // SUCCESS (first of its kind): the row is created either way; the notice
  // reports whether the notification email went out. Distinct from writeError
  // (a failed create) — quiet, token-styled.
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm(BLANK);
      setSubmitting(false);
      setNotice(null);
      clearWriteError();
    }
  }, [isOpen, clearWriteError]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const emailOk = EMAIL_REGEX.test(form.email.trim());
  const canSubmit = form.displayName.trim().length > 0 && emailOk && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    clearWriteError();
    const saved = await onCreate({
      displayName: form.displayName.trim(),
      email: form.email.trim(),
      type: form.type,
    });
    setSubmitting(false);
    if (saved) {
      // The row was created and spliced into the table by onCreate. Show the
      // email outcome instead of closing immediately.
      setNotice(saved.emailSent
        ? { emailSent: true, text: 'Invite created — email sent.' }
        : { emailSent: false, text: 'Invite created, but the email could not be sent. The invitee can still sign in at steward-house.org/signin.' });
    }
    // On failure onCreate already set writeError (the real server message, e.g.
    // the 403 gate message or the 409 duplicate); form preserved for correction.
  };

  if (notice) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create invite">
        <p style={notice.emailSent ? noticeSuccessStyle : noticeWarnStyle}>{notice.text}</p>
        <div style={footerStyle}>
          <Button variant="primary" size="sm" onClick={onClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create invite">
      <Field label="Display name" required>
        <input type="text" value={form.displayName} onChange={set('displayName')} placeholder="Full name" style={inputStyle} />
      </Field>
      <Field label="Email" required>
        <input type="email" value={form.email} onChange={set('email')} placeholder="name@example.org" style={inputStyle} />
        {form.email.trim() !== '' && !emailOk && (
          <p style={fieldErrorStyle}>Enter a valid email address.</p>
        )}
      </Field>
      <Field label="Type" required>
        <select value={form.type} onChange={set('type')} style={inputStyle}>
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      <p style={cautionStyle}>
        The invite adds this address to the sign-in allowlist. No email is sent
        now — the person signs in when they choose, and their first sign-in
        claims this record.
      </p>

      {writeError && <p style={formErrorStyle}>{writeError}</p>}

      <div style={footerStyle}>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? 'Creating…' : 'Create invite'}
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

const cautionStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  lineHeight: 1.5,
  marginTop: 'var(--sh-space-2)',
  marginBottom: 'var(--sh-space-4)',
};

const fieldErrorStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-bronze-deep)',
  marginTop: 'var(--sh-space-1)',
};

const formErrorStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-bronze-deep)',
  marginBottom: 'var(--sh-space-3)',
};

// Warning-on-a-success notices — quiet, token-styled, distinct from the bronze
// writeError (which marks a FAILED create). Success reads neutral-quiet; the
// email-failed case reads as a soft warning tint.
const noticeSuccessStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  padding: 'var(--sh-space-3) var(--sh-space-4)',
  background: 'var(--sh-bg-tint)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  margin: 0,
};

const noticeWarnStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-warning-text)',
  lineHeight: 1.6,
  padding: 'var(--sh-space-3) var(--sh-space-4)',
  background: 'var(--sh-warning-bg)',
  border: '1px solid var(--sh-warning-border)',
  borderRadius: 'var(--sh-radius-md)',
  margin: 0,
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--sh-space-2)',
  marginTop: 'var(--sh-space-5)',
  paddingTop: 'var(--sh-space-4)',
  borderTop: 'var(--sh-border-thin)',
};
