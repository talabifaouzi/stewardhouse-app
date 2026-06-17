import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { Tag } from './Tag.jsx';
import { ROLE_LABEL } from './UserProfile.jsx';

// Contacts directory list modal. Each row is a button that opens the
// individual contact's profile via onContactClick.

export default function ContactsDirectory({ isOpen, onClose, contacts, onContactClick }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contacts">
      <ul style={listStyle}>
        {contacts.map((c, i) => (
          <li key={c.id}>
            <ContactRow
              contact={c}
              isLast={i === contacts.length - 1}
              onClick={() => onContactClick(c)}
            />
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function ContactRow({ contact, isLast, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...rowStyle(isLast),
        background: hovered ? 'var(--sh-bg-tint)' : 'transparent',
        outline: focused ? '2px solid var(--sh-bronze)' : 'none',
        outlineOffset: '-2px',
      }}
    >
      <div style={leftStyle}>
        <p style={nameStyle}>{contact.name}</p>
        <p style={metaStyle}>{contact.title} · {contact.organization}</p>
      </div>
      <Tag color="bronze" tracking="loose" style={{ flexShrink: 0 }}>
        {ROLE_LABEL[contact.role] || contact.role}
      </Tag>
    </button>
  );
}

const listStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

function rowStyle(isLast) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--sh-space-3)',
    width: '100%',
    border: 'none',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
    padding: 'var(--sh-space-3) var(--sh-space-2)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'background 150ms ease',
  };
}

const leftStyle = {
  flex: 1,
  minWidth: 0,
};

const nameStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-1)',
};

const metaStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.4,
};

