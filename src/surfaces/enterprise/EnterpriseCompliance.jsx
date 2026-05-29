import { Card } from '../../components/Card.jsx';

export default function EnterpriseCompliance() {
  return (
    <main style={mainStyle}>
      <p style={eyebrowStyle}>Enterprise</p>
      <h1 style={titleStyle}>Compliance</h1>
      <Card tint>
        <p style={scaffoldedNoteStyle}>
          Section scaffolded · content arrives in a later slice.
        </p>
      </Card>
    </main>
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
