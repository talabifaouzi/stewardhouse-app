import { Card } from '../../../components/Card.jsx';
import BackLink from '../../../components/BackLink.jsx';

export default function PhilanthropicReadiness() {
  return (
    <main style={mainStyle}>
      <BackLink to="/enterprise/reports" label="Reports" />
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Philanthropic Readiness</h1>
      <Card tint>
        <p style={scaffoldedNoteStyle}>
          Section scaffolded · content arrives in a later sub-slice.
        </p>
        <p style={pathBNoteStyle}>
          Pending — this report will use structural checklist framing per athlete (modules completed, gates passed, what's outstanding). NOT a numeric composite score; that approach violates the no-scores invariant.
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
  paddingTop: 'var(--sh-space-6)',
  paddingLeft: 'var(--sh-space-6)',
  paddingRight: 'var(--sh-space-6)',
  paddingBottom: 'var(--sh-space-3)',
};

const pathBNoteStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  paddingLeft: 'var(--sh-space-6)',
  paddingRight: 'var(--sh-space-6)',
  paddingBottom: 'var(--sh-space-6)',
  maxWidth: '640px',
  margin: '0 auto',
};
