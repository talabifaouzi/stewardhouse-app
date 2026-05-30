import { useState } from 'react';
import { exclusions } from '../../data/enterpriseFixtures.js';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import ExclusionDetail from '../../components/ExclusionDetail.jsx';

export default function EnterpriseCompliance() {
  const [activeExclusion, setActiveExclusion] = useState(null);
  const [exclusionOverrides, setExclusionOverrides] = useState({});
  const [hoveredId, setHoveredId] = useState(null);

  const displayedExclusions = exclusions.map((e) => ({ ...e, ...exclusionOverrides[e.id] }));

  const handleSave = (updated) => {
    setExclusionOverrides((prev) => ({ ...prev, [updated.id]: updated }));
  };

  const hasOverride = activeExclusion
    ? Boolean(exclusionOverrides[activeExclusion.id])
    : false;

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

        {/* Excluded organizations — clickable list */}
        <Card>
          <SectionLabel>Excluded organizations</SectionLabel>
          <p style={explainerStyle}>
            Organizations flagged by the department. Athletes still see these in the Give Screen with a contextual note explaining the flag — disclosure model, not blocking.
          </p>
          <ul style={listResetStyle}>
            {displayedExclusions.map((org, i) => {
              const isLast = i === displayedExclusions.length - 1;
              const isHovered = hoveredId === org.id;
              return (
                <li key={org.id}>
                  <button
                    type="button"
                    onClick={() => setActiveExclusion(org)}
                    onMouseEnter={() => setHoveredId(org.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      ...rowButtonStyle(isLast),
                      background: isHovered ? 'var(--sh-bg-tint)' : 'transparent',
                    }}
                  >
                    <p style={orgNameStyle}>{org.name}</p>
                    <p style={metaStyle}>EIN: {org.ein}</p>
                    <p style={reasonStyle}>Reason: {org.reason}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <ExclusionDetail
        isOpen={activeExclusion !== null}
        onClose={() => setActiveExclusion(null)}
        exclusion={activeExclusion}
        onSave={handleSave}
        hasOverride={hasOverride}
      />
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

function rowButtonStyle(isLast) {
  return {
    display: 'block',
    width: '100%',
    border: 'none',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
    padding: 'var(--sh-space-4) var(--sh-space-3)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'background 150ms ease',
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
