import { useState } from 'react';
import { athletes, engagementTimeline, engagementWeekDates, engagedAthletesByWeek, dailyBriefItems } from '../../data/enterpriseFixtures.js';
import { formatDate } from '../../utils/formatDate.js';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import StatTile from '../../components/StatTile.jsx';
import BarChart from '../../components/BarChart.jsx';
import FilteredAthletesModal from '../../components/FilteredAthletesModal.jsx';
import AthleteProfile from '../../components/AthleteProfile.jsx';
import DailyBrief from '../../components/DailyBrief.jsx';
import { useComms } from '../../contexts/CommsContext.jsx';
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
import { CATEGORY_CONFIG, buildModalTitle } from './shared/categoryFilters.js';

export default function EnterpriseOverview() {
  const { openCompose } = useComms();
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeWeek, setActiveWeek] = useState(null);
  const [activeAthlete, setActiveAthlete] = useState(null);
  const latestEngagement = engagementTimeline[engagementTimeline.length - 1];

  // Unified filter state — bar click and tile click are mutually exclusive
  const config = activeCategory ? CATEGORY_CONFIG[activeCategory] : null;
  let filteredAthletes = [];
  let modalTitle = '';
  let filterModalOpen = false;
  if (activeWeek !== null) {
    const weekIds = engagedAthletesByWeek[activeWeek] || [];
    filteredAthletes = athletes.filter((a) => weekIds.includes(a.id));
    modalTitle = `Engaged athletes — week ending ${formatDate(engagementWeekDates[activeWeek])} — ${filteredAthletes.length} athletes`;
    filterModalOpen = true;
  } else if (config) {
    filteredAthletes = athletes.filter(config.filter);
    modalTitle = buildModalTitle(config, filteredAthletes, activeCategory);
    filterModalOpen = true;
  }

  const closeFilterModal = () => {
    setActiveCategory(null);
    setActiveWeek(null);
  };
  const openCategory = (key) => {
    setActiveCategory(key);
    setActiveWeek(null);
  };
  const openWeek = (i) => {
    setActiveWeek(i);
    setActiveCategory(null);
  };

  return (
    <main style={mainStyle}>
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Program overview</h1>
      <p style={subtitleStyle}>
        Athletes participate as individuals; the department supports structurally — not advisorially.
      </p>

      {/* Daily brief — morning-triage entry point */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <DailyBrief {...dailyBriefItems} />
      </div>

      {/* Primary stat grid — each tile drills into a filtered athlete list */}
      <div style={statGridStyle}>
        <StatTile label="Athletes" value={tot} onClick={() => openCategory('all')} />
        <StatTile label="Actively progressing" value={onTrack} sublabel={`${activelyProgressingPct}% of program`} onClick={() => openCategory('actively-progressing')} />
        <StatTile label="Certified" value={certD} onClick={() => openCategory('certified')} />
        <StatTile label="Not yet active" value={stalled} onClick={() => openCategory('not-yet-active')} />
        <StatTile label="Invited" value={notStarted} onClick={() => openCategory('invited')} />
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
          labels={engagementWeekDates.map((d) => formatDate(d, { omitYear: true }))}
          onBarClick={(_, i) => openWeek(i)}
          ariaLabel={`Weekly engagement rate over 12 weeks ending ${formatDate(engagementWeekDates[engagementWeekDates.length - 1])}, ranging from ${Math.min(...engagementTimeline)}% to ${Math.max(...engagementTimeline)}%. Current week: ${engagementTimeline[engagementTimeline.length - 1]}%. Click a bar to see engaged athletes for that week.`}
        />
        <p style={engagementCaptionStyle}>
          Current week: {latestEngagement}% active — up from {engagementTimeline[0]}% in week 1.
        </p>
      </Card>

      {/* Drill-down: filtered list (from tile or bar) → individual profile */}
      <FilteredAthletesModal
        isOpen={filterModalOpen}
        onClose={closeFilterModal}
        title={modalTitle}
        athletes={filteredAthletes}
        onAthleteClick={setActiveAthlete}
      />

      <AthleteProfile
        isOpen={activeAthlete !== null}
        onClose={() => setActiveAthlete(null)}
        athlete={activeAthlete}
        onSendReminder={(a) => openCompose({ name: a.name, email: a.email }, 'Reminder')}
      />
    </main>
  );
}

const mainStyle = {
  maxWidth: 'var(--sh-content-max)',
  margin: '0 auto',
  padding: 'var(--sh-space-10) clamp(var(--sh-space-3), 4vw, var(--sh-space-8)) var(--sh-space-16)',
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
