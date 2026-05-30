import { engagementTimeline, workshops } from '../../../data/enterpriseFixtures.js';
import { Card } from '../../../components/Card.jsx';
import { SectionLabel } from '../../../components/SectionLabel.jsx';
import Sparkline from '../../../components/Sparkline.jsx';
import BackLink from '../../../components/BackLink.jsx';
import StatTile from '../../../components/StatTile.jsx';
import {
  tot,
  gpsRate,
  certRate,
  tGi,
  onTrack,
  certD,
  stalled,
  notStarted,
} from '../shared/enterpriseStats.js';

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export default function ProgramSummary() {
  const latestEngagement = engagementTimeline[engagementTimeline.length - 1];

  return (
    <main style={mainStyle}>
      <BackLink to="/enterprise/reports" label="Reports" />
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Program Summary</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-5)' }}>
        {/* Cohort snapshot */}
        <Card>
          <SectionLabel>Cohort snapshot</SectionLabel>
          <div style={statGridStyle}>
            <StatTile variant="inline" label="Athletes" value={tot} />
            <StatTile variant="inline" label="GPS completed" value={`${gpsRate}%`} />
            <StatTile variant="inline" label="Certified" value={`${certRate}%`} />
            <StatTile variant="inline" label="Total gifts" value={tGi} />
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
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
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
