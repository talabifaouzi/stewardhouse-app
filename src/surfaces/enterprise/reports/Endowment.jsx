import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/Card.jsx';

export default function Endowment() {
  return (
    <main style={mainStyle}>
      <BackLink />
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Endowment</h1>
      <Card tint>
        <p style={scaffoldedNoteStyle}>
          Section scaffolded · content arrives in a later sub-slice.
        </p>
      </Card>
    </main>
  );
}

function BackLink() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to="/enterprise/reports"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-block',
        color: hovered ? 'var(--sh-text-primary)' : 'var(--sh-text-muted)',
        textDecoration: 'none',
        fontSize: 'var(--sh-text-xs)',
        marginBottom: 'var(--sh-space-3)',
        letterSpacing: '0.04em',
        transition: 'color 150ms ease',
      }}
    >
      ← Reports
    </Link>
  );
}

const mainStyle = {
  maxWidth: 'var(--sh-content-max)',
  margin: '0 auto',
  padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
};

const eyebrowStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--sh-space-2)',
};

const titleStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-2xl)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-6)',
};

const scaffoldedNoteStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  textAlign: 'center',
  lineHeight: 1.6,
  padding: 'var(--sh-space-6)',
};
