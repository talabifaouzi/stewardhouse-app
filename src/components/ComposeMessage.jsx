import { useState, useEffect } from 'react';
import { Button } from './Button.jsx';
import { Modal } from './Modal.jsx';

// Message compose modal with explicit From + To + Subject + Body fields.
// Recipient prop pre-fills the To input; user can free-type any email or
// pick from the datalist autocomplete (drawn from currentUser's recipients).
// Send is gated on valid email + non-empty subject + non-empty body.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (s) => EMAIL_REGEX.test(s);

export default function ComposeMessage({
  isOpen,
  onClose,
  recipient,
  context,
  currentUser,
  recipients,
  onSend,
}) {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  // Initialize on open — recipient pre-fills To; context pre-fills Subject.
  useEffect(() => {
    if (isOpen) {
      setToEmail(recipient?.email || '');
      if (context && recipient) {
        setSubject(`${context} — ${recipient.name}`);
      } else if (context) {
        setSubject(context);
      } else {
        setSubject('');
      }
      setBody('');
      setSent(false);
    }
  }, [isOpen, recipient, context]);

  // Auto-close after confirmation
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => {
      onClose();
    }, 1500);
    return () => clearTimeout(t);
  }, [sent, onClose]);

  const canSend =
    isValidEmail(toEmail.trim()) &&
    subject.trim().length > 0 &&
    body.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    const trimmedEmail = toEmail.trim();
    const match = (recipients || []).find((r) => r.email === trimmedEmail);
    const toName = match ? match.name : trimmedEmail;
    onSend(trimmedEmail, toName, subject.trim(), body.trim());
    setSent(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send message">
      {sent ? (
        <p style={confirmationStyle}>
          Message queued — would be sent in production.
        </p>
      ) : (
        <>
          {/* From — read-only, locked to current user */}
          <div style={fieldBlockStyle}>
            <label style={labelStyle}>From</label>
            <p style={fromValueStyle}>
              {currentUser.name} · {currentUser.email}
            </p>
          </div>

          {/* To — input with datalist autocomplete */}
          <div style={fieldBlockStyle}>
            <label style={labelStyle}>To</label>
            <input
              type="text"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="Email address"
              list="compose-recipients-options"
              style={inputStyle}
            />
            <datalist id="compose-recipients-options">
              {(recipients || []).map((r) => (
                <option key={r.email} value={r.email}>
                  {r.name}
                </option>
              ))}
            </datalist>
          </div>

          {/* Subject */}
          <div style={fieldBlockStyle}>
            <label style={labelStyle}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              style={inputStyle}
            />
          </div>

          {/* Body */}
          <div style={fieldBlockStyle}>
            <label style={labelStyle}>Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…"
              rows={7}
              style={textareaStyle}
            />
          </div>

          <div style={footerStyle}>
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSend} disabled={!canSend}>
              Send message
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

const fieldBlockStyle = {
  marginBottom: 'var(--sh-space-4)',
};

const labelStyle = {
  display: 'block',
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
  marginBottom: 'var(--sh-space-2)',
};

const fromValueStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  padding: 'var(--sh-space-3)',
  background: 'var(--sh-bg-tint)',
  border: 'var(--sh-border-thin)',
  borderRadius: '6px',
  margin: 0,
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 'var(--sh-space-3)',
  border: 'var(--sh-border-thin)',
  borderRadius: '6px',
  fontFamily: 'inherit',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  background: 'var(--sh-card)',
};

const textareaStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 'var(--sh-space-3)',
  border: 'var(--sh-border-thin)',
  borderRadius: '6px',
  fontFamily: 'inherit',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  background: 'var(--sh-card)',
  resize: 'vertical',
  lineHeight: 1.6,
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--sh-space-2)',
  marginTop: 'var(--sh-space-5)',
  paddingTop: 'var(--sh-space-4)',
  borderTop: 'var(--sh-border-thin)',
};

const confirmationStyle = {
  fontSize: 'var(--sh-text-md)',
  color: 'var(--sh-text-secondary)',
  textAlign: 'center',
  padding: 'var(--sh-space-8) var(--sh-space-4)',
  lineHeight: 1.65,
  fontStyle: 'italic',
};
