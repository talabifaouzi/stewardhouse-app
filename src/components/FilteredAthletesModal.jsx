import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { statusFor } from '../surfaces/enterprise/shared/athleteStatus.js';

// Shared filtered-athletes list modal. Each row is a button that calls
// onAthleteClick(athlete) — wires the drill-down from a category filter
// (e.g., "Actively progressing — 8 athletes") to an individual profile.

export default function FilteredAthletesModal({ isOpen, onClose, title, athletes, onAthleteClick }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <ul style={listStyle}>
        {athletes.map((a, i) => (
          <li key={a.id}>
            <AthleteRow
              athlete={a}
              isLast={i === athletes.length - 1}
              onClick={() => onAthleteClick(a)}
            />
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function AthleteRow({ athlete, isLast, onClick }) {
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
      <p style={nameStyle}>{athlete.name}</p>
      <p style={sportStyle}>{athlete.sport}</p>
      <p style={metaStyle}>{athlete.year} · {statusFor(athlete)}</p>
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
    display: 'block',
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

const nameStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-1)',
};

const sportStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  marginBottom: 'var(--sh-space-1)',
};

const metaStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
};
