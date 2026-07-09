import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal.jsx';
import { Button } from '../../components/Button.jsx';

// Roster-add form (E-Slice E-Write-1). Enrolls an athlete on the signed-in
// staff operator's institution via AthletesProvider.add() → POST /api/athletes.
// The endpoint is E11-gated (dark on production); this form only ever renders
// on the authenticated tree (Roster gates it on identity).
//
// Consent (E6): the verbatim program-consent line is shown and a required
// acknowledgment must be checked before submit. The endpoint ALSO requires the
// acknowledgment (consentAcknowledged: true) so non-form callers cannot skip
// it. COUNSEL-GATED: the exact consent language is pending counsel; it ships
// behind the $.enterprise.demo_gate as caution copy until confirmed.
//
// E8: the notes field carries the authoring-discipline caution — third parties
// by public-record name + role only, never relational/private descriptors.
//
// Failure surfacing (E-Write-1 fix): the modal renders the provider's
// writeError (the real server message, e.g. "Not authorized" from the E11
// gate) rather than a generic local string — matching the ClientWorkspace /
// CohortDetail idiom. Form contents are preserved on failure.
//
// Position (E-Write-1 fix, FT ruling): the form no longer collects Position.
// The `athlete.position` column and the endpoint's allowlist entry remain
// (advisor idiom — the endpoint contract stays complete for future callers;
// the form is one caller that chooses not to collect it).

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BLANK = {
  name: '', sport: '', year: '',
  email: '', phone: '', badge: '', notes: '',
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
      <Field label="Sport">
        <input type="text" value={form.sport} onChange={set('sport')} placeholder="e.g. Basketball" style={inputStyle} />
      </Field>
      <Field label="Class">
        <input type="text" value={form.year} onChange={set('year')} placeholder="e.g. Junior" style={inputStyle} />
      </Field>
      <Field label="Email">
        <input type="email" value={form.email} onChange={set('email')} placeholder="name@school.edu" style={inputStyle} />
        {!emailOk && <p style={fieldErrorStyle}>Enter a valid email address, or leave blank.</p>}
      </Field>
      <Field label="Phone">
        <input type="tel" value={form.phone} onChange={set('phone')} placeholder="(555) 000-0000" style={inputStyle} />
      </Field>
      <Field label="Badge">
        <input type="text" value={form.badge} onChange={set('badge')} placeholder="Descriptive label (optional)" style={inputStyle} />
      </Field>
      <Field label="Notes">
        <textarea value={form.notes} onChange={set('notes')} rows={4} placeholder="Staff observations (optional)" style={textareaStyle} />
        {/* E8 authoring caution — name+role from public record only. */}
        <p style={cautionStyle}>
          Name third parties by public-record name and role only (e.g. “Board member Dana Reeves”) — never relational or private descriptors.
        </p>
      </Field>

      {/* E6 consent — verbatim program-consent line + required acknowledgment.
          COUNSEL-GATED: exact language pending counsel; ships behind the gate. */}
      <div style={consentBoxStyle}>
        <p style={consentTextStyle}>
          Reflections you record during the program are visible to your athletic department staff. When you claim your StewardHouse account, you gain per-reflection visibility controls.
        </p>
        <label style={consentLabelStyle}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={checkboxStyle} />
          <span>I acknowledge the program consent posture above applies to this athlete.</span>
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
