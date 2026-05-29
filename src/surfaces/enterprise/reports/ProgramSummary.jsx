import { useState } from 'react';
import { Link } from 'react-router-dom';
import { athletes, engagementTimeline, workshops } from '../../../data/enterpriseFixtures.js';
import { Card } from '../../../components/Card.jsx';
import { SectionLabel } from '../../../components/SectionLabel.jsx';

// Duplicated from EnterpriseOverview / EnterpriseRoster — no shared-helper
// refactor this slice (tracked as polish-pass item: "extract enterprise
// stats to shared helper").
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
const certRate = Math.round((certD / tot) * 100);

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export default function ProgramSummary() {
  const latestEngagement = engagementTimeline[engagementTimeline.length - 1];

  return (
    <main style={mainStyle}>
      <BackLink />
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Program Summary</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-5)' }}>
        {/* Cohort snapshot */}
        <Card>
          <SectionLabel>Cohort snapshot</SectionLabel>
          <div style={statGridStyle}>
            <Stat label="Athletes" value={tot} />
            <Stat label="GPS completed" value={`${gpsRate}%`} />
            <Stat label="Certified" value={`${certRate}%`} />
            <Stat label="Total gifts" value={tGi} />
          </div>
        </Card>

        {/* Status breakdown */}
        <Card>
          <SectionLabel>Status breakdown</SectionLabel>
          <p style={narrativeStyle}>
            {onTrack} Actively progressing, {certD} Certified, {stalled} Not yet active, {notStarted} Invited.
          </p>
        </Card>

        {/* Engagement */}
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

        {/* Workshops to date */}
        <Card>
          <SectionLabel>Workshops to date</SectionLabel>
          <ul style={listResetStyle}>
            {workshops.map((w, i) => {
              const isLast = i === workshops.length - 1;
              return (
                <li key={w.id} style={workshopRowStyle(isLast)}>
                  <div style={workshopDateStyle}>{w.date}</div>
                  <div style={workshopTitleStyle}>{w.title}</div>
                  <div style={workshopMetaStyle}>
                    {w.attendees != null ? `${w.attendees} attended` : capitalize(w.status)}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div style={statTileStyle}>
      <p style={statLabelStyle}>{label}</p>
      <p style={statValueStyle}>{value}</p>
    </div>
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

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 'var(--sh-space-4)',
  marginTop: 'var(--sh-space-3)',
};

const statTileStyle = {
  padding: 'var(--sh-space-3) 0',
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

const narrativeStyle = {
  fontSize: 'var(--sh-text-md)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
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

const listResetStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  marginTop: 'var(--sh-space-3)',
};

function workshopRowStyle(isLast) {
  return {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--sh-space-4)',
    padding: 'var(--sh-space-3) 0',
    borderBottom: isLast ? 'none' : `1px solid var(--sh-card-border)`,
  };
}

const workshopDateStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.04em',
  minWidth: '120px',
  flexShrink: 0,
};

const workshopTitleStyle = {
  flex: 1,
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
};

const workshopMetaStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  whiteSpace: 'nowrap',
};
