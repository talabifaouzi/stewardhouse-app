import { useState } from 'react';
import { athletes, engagementTimeline } from '../../data/enterpriseFixtures.js';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { Modal } from '../../components/Modal.jsx';

const tot = athletes.length;
const gpsD = athletes.filter((a) => a.gpsCompleted).length;
const certD = athletes.filter((a) => a.certified).length;
const inProg = athletes.filter((a) => a.lessons > 0 && !a.certified).length;
const stalled = athletes.filter((a) => a.lessons > 0 && !a.gpsCompleted).length;
const onTrack = inProg - stalled;
const notStarted = athletes.filter((a) => a.lessons === 0).length;
const tGi = athletes.reduce((s, a) => s + a.gifts, 0);
const athletesWithGifts = athletes.filter((a) => a.gifts > 0).length;
const gpsRate = Math.round((gpsD / tot) * 100);
const activelyProgressingPct = Math.round(((certD + onTrack) / tot) * 100);

// Duplicated from EnterpriseRoster — polish-pass item #9 (shared extraction).
function statusFor(a) {
  if (a.certified) return 'Certified';
  if (a.lessons > 0 && !a.gpsCompleted) return 'Not yet active';
  if (a.status === 'invited' || a.lessons === 0) return 'Invited';
  return 'Actively progressing';
}

const CATEGORY_CONFIG = {
  'all':                  { label: 'All athletes',         filter: () => true },
  'actively-progressing': { label: 'Actively progressing', filter: (a) => statusFor(a) === 'Actively progressing' },
  'certified':            { label: 'Certified',            filter: (a) => a.certified },
  'not-yet-active':       { label: 'Not yet active',       filter: (a) => statusFor(a) === 'Not yet active' },
  'invited':              { label: 'Invited',              filter: (a) => statusFor(a) === 'Invited' },
};

export default function EnterpriseOverview() {
  const [activeCategory, setActiveCategory] = useState(null);
  const latestEngagement = engagementTimeline[engagementTimeline.length - 1];

  const config = activeCategory ? CATEGORY_CONFIG[activeCategory] : null;
  const filteredAthletes = config ? athletes.filter(config.filter) : [];
  const modalTitle = config
    ? (activeCategory === 'all'
        ? `${config.label} — ${filteredAthletes.length}`
        : `${config.label} — ${filteredAthletes.length} athletes`)
    : '';

  return (
    <main style={mainStyle}>
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Program overview</h1>
      <p style={subtitleStyle}>
        Department-wide view of the StewardHouse program. Athletes participate as individuals; the department supports structurally — not advisorially.
      </p>

      {/* Primary stat grid — each tile drills into a filtered athlete list */}
      <div style={statGridStyle}>
        <Stat label="Athletes" value={tot} onClick={() => setActiveCategory('all')} />
        <Stat label="Actively progressing" value={onTrack} sublabel={`${activelyProgressingPct}% of program`} onClick={() => setActiveCategory('actively-progressing')} />
        <Stat label="Certified" value={certD} onClick={() => setActiveCategory('certified')} />
        <Stat label="Not yet active" value={stalled} onClick={() => setActiveCategory('not-yet-active')} />
        <Stat label="Invited" value={notStarted} onClick={() => setActiveCategory('invited')} />
      </div>

      {/* Supplementary line */}
      <p style={supplementaryStyle}>
        GPS completed by {gpsD} of {tot} athletes ({gpsRate}%). Total gifts: {tGi} across {athletesWithGifts} athletes.
      </p>

      {/* Engagement panel */}
      <Card>
        <div style={engagementHeaderStyle}>
          <SectionLabel>Weekly active engagement</SectionLabel>
          <p style={engagementRangeStyle}>Last 12 weeks</p>
        </div>
        <Sparkline data={engagementTimeline} />
        <p style={engagementCaptionStyle}>
          Current week: {latestEngagement}% active — up from {engagementTimeline[0]}% in week 1.
        </p>
      </Card>

      {/* Drill-down modal */}
      <Modal
        isOpen={activeCategory !== null}
        onClose={() => setActiveCategory(null)}
        title={modalTitle}
      >
        <ul style={modalListStyle}>
          {filteredAthletes.map((a, i) => {
            const isLast = i === filteredAthletes.length - 1;
            return (
              <li key={a.id} style={athleteRowStyle(isLast)}>
                <p style={athleteNameStyle}>{a.name}</p>
                <p style={athleteSportStyle}>{a.sport}</p>
                <p style={athleteMetaStyle}>{a.year} · {statusFor(a)}</p>
              </li>
            );
          })}
        </ul>
      </Modal>
    </main>
  );
}

function Stat({ label, value, sublabel, onClick }) {
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
        ...statTileStyle,
        borderColor: hovered ? 'var(--sh-bronze)' : 'var(--sh-card-border)',
        outline: focused ? '2px solid var(--sh-bronze)' : 'none',
        outlineOffset: '2px',
      }}
    >
      <p style={statLabelStyle}>{label}</p>
      <p style={statValueStyle}>{value}</p>
      {sublabel && <p style={statSublabelStyle}>{sublabel}</p>}
    </button>
  );
}

function Sparkline({ data }) {
  const width = 600;
  const height = 80;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: '64px', display: 'block' }}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--sh-bronze)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 'var(--sh-space-4)',
  marginBottom: 'var(--sh-space-4)',
};

const statTileStyle = {
  background: 'var(--sh-card)',
  border: '1px solid var(--sh-card-border)',
  borderRadius: 'var(--sh-radius-lg)',
  padding: 'var(--sh-space-5)',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  width: '100%',
  transition: 'border-color 150ms ease',
};

const statLabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--sh-space-2)',
  fontWeight: 500,
};

const statValueStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-2xl)',
  color: 'var(--sh-text-primary)',
  lineHeight: 1.1,
};

const statSublabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  marginTop: 'var(--sh-space-2)',
  lineHeight: 1.5,
};

const supplementaryStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginBottom: 'var(--sh-space-8)',
  maxWidth: '720px',
};

const engagementHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 'var(--sh-space-4)',
  marginBottom: 'var(--sh-space-3)',
};

const engagementRangeStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
};

const engagementCaptionStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.55,
  marginTop: 'var(--sh-space-3)',
};

const modalListStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

function athleteRowStyle(isLast) {
  return {
    paddingTop: 'var(--sh-space-3)',
    paddingBottom: 'var(--sh-space-3)',
    borderBottom: isLast ? 'none' : `1px solid var(--sh-card-border)`,
  };
}

const athleteNameStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-1)',
};

const athleteSportStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  marginBottom: 'var(--sh-space-1)',
};

const athleteMetaStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
};
