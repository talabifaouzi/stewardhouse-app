import { exclusions } from '../../data/enterpriseFixtures.js';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';

export default function EnterpriseCompliance() {
  return (
    <main style={mainStyle}>
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Compliance</h1>
      <p style={subtitleStyle}>
        The department surfaces compliance-relevant information to athletes. Final filings and approvals remain with the school's compliance officer; the platform does not gatekeep or evaluate.
      </p>

      <div style={cardStackStyle}>
        {/* NIL disclosure tracking — placeholder */}
        <Card tint>
          <SectionLabel>NIL disclosure tracking</SectionLabel>
          <p style={nilNoteStyle}>
            Per-athlete NIL disclosure tracking will integrate with the school's compliance system in a future slice. Athletes participate in the StewardHouse program independent of NIL filings.
          </p>
        </Card>

        {/* Excluded organizations — real list */}
        <Card>
          <SectionLabel>Excluded organizations</SectionLabel>
          <p style={explainerStyle}>
            Organizations flagged by the department. Athletes still see these in the Give Screen with a contextual note explaining the flag — disclosure model, not blocking.
          </p>
          <ul style={listResetStyle}>
            {exclusions.map((org, i) => {
              const isLast = i === exclusions.length - 1;
              return (
                <li key={org.id} style={rowStyle(isLast)}>
                  <p style={orgNameStyle}>{org.name}</p>
                  <p style={metaStyle}>EIN: {org.ein}</p>
                  <p style={reasonStyle}>Reason: {org.reason}</p>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
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
  marginBottom: 'var(--sh-space-3)',
};

const subtitleStyle = {
  fontSize: 'var(--sh-text-md)',
  color: 'var(--sh-text-secondary)',
  maxWidth: '720px',
  lineHeight: 1.65,
  marginBottom: 'var(--sh-space-8)',
};

const cardStackStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-5)',
};

const nilNoteStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
  maxWidth: '640px',
};

const explainerStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-3)',
  maxWidth: '640px',
};

const listResetStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

function rowStyle(isLast) {
  return {
    paddingTop: 'var(--sh-space-4)',
    paddingBottom: 'var(--sh-space-4)',
    borderBottom: isLast ? 'none' : `1px solid var(--sh-card-border)`,
  };
}

const orgNameStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-1)',
};

const metaStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  marginBottom: 'var(--sh-space-1)',
};

const reasonStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.55,
};
