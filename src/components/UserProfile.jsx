import { Card } from './Card.jsx';
import { SectionLabel } from './SectionLabel.jsx';
import { Button } from './Button.jsx';
import { Modal } from './Modal.jsx';

// Generic contact/user profile modal. Three sections plus a footer CTA.
// The "Send message" button calls onSendMessage(contact) — typically the
// caller closes this modal and opens a ComposeMessage modal in response.

export const ROLE_LABEL = {
  athletic_dept_admin: 'Athletic Department',
  facilitator: 'Facilitator',
  co_advisor: 'Advisor',
  stewardhouse_rep: 'StewardHouse rep',
};

export default function UserProfile({ isOpen, onClose, contact, onSendMessage }) {
  if (!contact) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={contact.name}>
      {/* Header meta + role pill */}
      <div style={headerStyle}>
        <p style={metaStyle}>
          {contact.title} · {contact.organization}
        </p>
        <span style={rolePillStyle}>
          {ROLE_LABEL[contact.role] || contact.role}
        </span>
      </div>

      <div style={sectionsStyle}>
        {/* Contact */}
        <Card>
          <SectionLabel>Contact</SectionLabel>
          <Field
            label="Email"
            value={
              <a href={`mailto:${contact.email}`} style={emailLinkStyle}>
                {contact.email}
              </a>
            }
          />
          <Field label="Phone" value={contact.phone} last />
        </Card>

        {/* Bio */}
        <Card>
          <SectionLabel>Bio</SectionLabel>
          <p style={bioStyle}>{contact.bio}</p>
        </Card>
      </div>

      {/* Footer */}
      {onSendMessage && (
        <div style={footerStyle}>
          <Button variant="primary" size="sm" onClick={() => onSendMessage(contact)}>
            Send message
          </Button>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value, last }) {
  return (
    <div style={fieldRowStyle(last)}>
      <span style={fieldLabelStyle}>{label}</span>
      <span style={fieldValueStyle}>{value}</span>
    </div>
  );
}

const headerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-5)',
};

const metaStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.5,
};

const rolePillStyle = {
  display: 'inline-block',
  padding: 'var(--sh-space-1) var(--sh-space-3)',
  background: 'var(--sh-bronze-tint)',
  color: 'var(--sh-bronze-deep)',
  borderRadius: 'var(--sh-radius-full)',
  fontSize: 'var(--sh-text-xs)',
  fontWeight: 500,
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
};

const sectionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-4)',
};

function fieldRowStyle(last) {
  return {
    display: 'flex',
    gap: 'var(--sh-space-3)',
    padding: 'var(--sh-space-2) 0',
    borderBottom: last ? 'none' : 'var(--sh-border-thin)',
    fontSize: 'var(--sh-text-sm)',
    alignItems: 'baseline',
  };
}

const fieldLabelStyle = {
  color: 'var(--sh-text-muted)',
  minWidth: '120px',
  flexShrink: 0,
  fontSize: 'var(--sh-text-xs)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const fieldValueStyle = {
  color: 'var(--sh-text-body)',
  flex: 1,
};

const emailLinkStyle = {
  color: 'var(--sh-bronze)',
  textDecoration: 'none',
};

const bioStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: 'var(--sh-space-5)',
  paddingTop: 'var(--sh-space-4)',
  borderTop: 'var(--sh-border-thin)',
};
