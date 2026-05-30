import { useState } from 'react';
import { athletes, engagementTimeline } from '../../data/enterpriseFixtures.js';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import StatTile from '../../components/StatTile.jsx';
import BarChart from '../../components/BarChart.jsx';
import FilteredAthletesModal from '../../components/FilteredAthletesModal.jsx';
import AthleteProfile from '../../components/AthleteProfile.jsx';
import ComposeMessage from '../../components/ComposeMessage.jsx';
import {
  tot,
  gpsD,
  certD,
  stalled,
  onTrack,
  notStarted,
  tGi,
  athletesWithGifts,
  gpsRate,
  activelyProgressingPct,
} from './shared/enterpriseStats.js';
import { statusFor } from './shared/athleteStatus.js';

const CATEGORY_CONFIG = {
  'all':                  { label: 'All athletes',         filter: () => true },
  'actively-progressing': { label: 'Actively progressing', filter: (a) => statusFor(a) === 'Actively progressing' },
  'certified':            { label: 'Certified',            filter: (a) => a.certified },
  'not-yet-active':       { label: 'Not yet active',       filter: (a) => statusFor(a) === 'Not yet active' },
  'invited':              { label: 'Invited',              filter: (a) => statusFor(a) === 'Invited' },
};

export default function EnterpriseOverview() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeAthlete, setActiveAthlete] = useState(null);
  const [composingTo, setComposingTo] = useState(null);
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
        Athletes participate as individuals; the department supports structurally — not advisorially.
      </p>

      {/* Primary stat grid — each tile drills into a filtered athlete list */}
      <div style={statGridStyle}>
        <StatTile label="Athletes" value={tot} onClick={() => setActiveCategory('all')} />
        <StatTile label="Actively progressing" value={onTrack} sublabel={`${activelyProgressingPct}% of program`} onClick={() => setActiveCategory('actively-progressing')} />
        <StatTile label="Certified" value={certD} onClick={() => setActiveCategory('certified')} />
        <StatTile label="Not yet active" value={stalled} onClick={() => setActiveCategory('not-yet-active')} />
        <StatTile label="Invited" value={notStarted} onClick={() => setActiveCategory('invited')} />
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
        <BarChart
          data={engagementTimeline}
          labels={engagementTimeline.map((_, i) => `W${i + 1}`)}
          ariaLabel={`Weekly engagement rate over 12 weeks, ranging from ${Math.min(...engagementTimeline)}% to ${Math.max(...engagementTimeline)}%. Current week: ${engagementTimeline[engagementTimeline.length - 1]}%.`}
        />
        <p style={engagementCaptionStyle}>
          Current week: {latestEngagement}% active — up from {engagementTimeline[0]}% in week 1.
        </p>
      </Card>

      {/* Drill-down: filtered list → individual profile (stacks behind profile) */}
      <FilteredAthletesModal
        isOpen={activeCategory !== null}
        onClose={() => setActiveCategory(null)}
        title={modalTitle}
        athletes={filteredAthletes}
        onAthleteClick={setActiveAthlete}
      />

      <AthleteProfile
        isOpen={activeAthlete !== null}
        onClose={() => setActiveAthlete(null)}
        athlete={activeAthlete}
        onSendReminder={(a) => setComposingTo({ name: a.name, email: a.email })}
      />

      <ComposeMessage
        isOpen={composingTo !== null}
        onClose={() => setComposingTo(null)}
        recipient={composingTo}
        context="Reminder"
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

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 'var(--sh-space-4)',
  marginBottom: 'var(--sh-space-4)',
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
