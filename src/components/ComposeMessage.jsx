import { useState, useEffect } from 'react';
import { Button } from './Button.jsx';
import { Modal } from './Modal.jsx';

// Message compose modal. Subject + body inputs. On send: shows a brief
// confirmation message in place of the form for ~1.5s, then closes.
// No actual API call — prototype scope.

export default function ComposeMessage({ isOpen, onClose, recipient, context }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  // Reset state on each open (pre-fill subject from context if provided)
  useEffect(() => {
    if (isOpen && recipient) {
      setSubject(context ? `${context} — ${recipient.name}` : '');
      setBody('');
      setSent(false);
    }
  }, [isOpen, recipient, context]);

  // Auto-close 1.5s after send
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => {
      onClose();
    }, 1500);
    return () => clearTimeout(t);
  }, [sent, onClose]);

  if (!recipient) return null;

  const canSend = subject.trim().length > 0 && body.trim().length > 0;
  const handleSend = () => {
    if (!canSend) return;
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
          <p style={recipientStyle}>
            To: <span style={recipientNameStyle}>{recipient.name}</span> · {recipient.email}
          </p>

          <div style={fieldsStyle}>
            <div>
              <label style={labelStyle}>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message…"
                rows={7}
                style={textareaStyle}
              />
            </div>
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

const recipientStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  marginBottom: 'var(--sh-space-4)',
  lineHeight: 1.5,
};

const recipientNameStyle = {
  color: 'var(--sh-text-primary)',
  fontWeight: 500,
};

const fieldsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-4)',
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
