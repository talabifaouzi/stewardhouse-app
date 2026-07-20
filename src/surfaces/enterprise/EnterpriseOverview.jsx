import { useState } from 'react';
import { engagementTimeline, engagementWeekDates, engagedAthletesByWeek, dailyBriefItems } from '../../data/enterpriseFixtures.js';
import { formatDate } from '../../utils/formatDate.js';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import StatTile from '../../components/StatTile.jsx';
import BarChart from '../../components/BarChart.jsx';
import FilteredAthletesModal from '../../components/FilteredAthletesModal.jsx';
import AthleteProfile from '../../components/AthleteProfile.jsx';
import DailyBrief from '../../components/DailyBrief.jsx';
import { useComms } from '../../contexts/CommsContext.jsx';
import { useAthletes } from '../../contexts/AthletesContext.jsx';
import { useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { useInstitutionEyebrow } from './shared/useInstitutionEyebrow.js';
import { computeStats, engagementBounds } from './shared/enterpriseStats.js';
import RateDisclosure from './shared/RateDisclosure.jsx';
import { CATEGORY_CONFIG, buildModalTitle } from './shared/categoryFilters.js';

export default function EnterpriseOverview() {
  const eyebrow = useInstitutionEyebrow();
  const { openCompose } = useComms();
  const { athletes } = useAthletes();
  // Engagement chart + daily brief have no provider (no D1 timeseries yet);
  // gate them on identity presence — auth-empty on the authenticated tree,
  // fixture on the demo tree. Stat tiles follow the roster data automatically
  // (computeStats([]) → zeros).
  const isAuthenticated = !!useOptionalAppIdentity();
  const stats = computeStats(athletes);
  const { tot, gpsD, certD, stalled, onTrack, notStarted, tGi, athletesWithGifts, gpsRate, activelyProgressingPct,
    consentAware, rateGps, rateActive, rateBaseTotal } = stats;
  const { min: engagementMin, max: engagementMax } = engagementBounds(engagementTimeline);
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
      {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
      <h1 style={titleStyle}>Program overview</h1>
      <p style={subtitleStyle}>
        Athletes participate as individuals; the department supports structurally — not advisorially.
      </p>

      {/* Daily brief — morning-triage entry point. Auth-empty until athletes
          enroll and generate activity; fixture on the demo tree. */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        {isAuthenticated ? (
          <Card>
            <SectionLabel>Today's brief</SectionLabel>
            <p style={emptyStateStyle}>Nothing to review.</p>
          </Card>
        ) : (
          <DailyBrief {...dailyBriefItems} />
        )}
      </div>

      {/* Primary stat grid — each tile drills into a filtered athlete list */}
      <div style={statGridStyle}>
        <StatTile label="Athletes" value={tot} onClick={() => openCategory('all')} />
        <StatTile
          label="Actively progressing"
          value={onTrack}
          sublabel={consentAware
            ? (activelyProgressingPct == null ? 'Not tracked' : `${rateActive} of ${rateBaseTotal} tracked`)
            : `${activelyProgressingPct}% of program`}
          onClick={() => openCategory('actively-progressing')}
        />
        <StatTile label="Certified" value={certD} onClick={() => openCategory('certified')} />
        <StatTile label="Not yet active" value={stalled} onClick={() => openCategory('not-yet-active')} />
        <StatTile label="Invited" value={notStarted} onClick={() => openCategory('invited')} />
      </div>

      {/* Supplementary line — writable-scoped GPS on the auth tree (FORK 1);
          demo tree unchanged.

          FORK 3: the gift clause is split out and gated on isAuthenticated, NOT
          consentAware. gifts_count is written by no path in P-2, so it is a
          structural 0 for EVERY auth athlete regardless of claim/delegation —
          a sourced/unsourced question, not a consent question. Gating on
          consentAware would leave the falsehood standing on a fresh auth roster
          carrying no `claimed` booleans (which falls through to the third
          branch). Demo tree renders the same string as before. */}
      <p style={supplementaryStyle}>
        {consentAware
          ? (rateBaseTotal === 0
              ? <>GPS completion is not tracked yet — no athlete has delegated record-keeping.</>
              : <>GPS completed by {rateGps} of {rateBaseTotal} athletes with delegated record-keeping ({gpsRate}%).</>)
          : <>GPS completed by {gpsD} of {tot} athletes ({gpsRate}%).</>}
        {' '}
        {isAuthenticated
          ? <>Total gifts are not tracked.</>
          : <>Total gifts: {tGi} across {athletesWithGifts} athletes.</>}
      </p>
      <RateDisclosure stats={stats} />

      {/* Engagement panel. UNSOURCED, not merely empty: no engagement-tracking
          table exists at all (migration 0013 ruled avg_weekly_engagement "not
          tracked" for the same reason), so this does NOT arrive when athletes
          join. P-1 corrects the prior copy ("appears here once athletes join
          the program"), which promised a capability the platform has no source
          for. Fixture chart on the demo tree. */}
      {isAuthenticated ? (
        <Card>
          <div style={engagementHeaderStyle}>
            <SectionLabel>Weekly active engagement</SectionLabel>
          </div>
          <p style={emptyStateStyle}>
            Weekly engagement tracking is not yet available.
          </p>
        </Card>
      ) : (
        <Card>
          <div style={engagementHeaderStyle}>
            <SectionLabel>Weekly active engagement</SectionLabel>
            <p style={engagementRangeStyle}>Last 12 weeks</p>
          </div>
          <BarChart
            data={engagementTimeline}
            labels={engagementWeekDates.map((d) => formatDate(d, { omitYear: true }))}
            onBarClick={(_, i) => openWeek(i)}
            ariaLabel={`Weekly engagement rate over 12 weeks ending ${formatDate(engagementWeekDates[engagementWeekDates.length - 1])}, ranging from ${engagementMin}% to ${engagementMax}%. Current week: ${engagementTimeline[engagementTimeline.length - 1]}%. Click a bar to see engaged athletes for that week.`}
          />
          <p style={engagementCaptionStyle}>
            Current week: {latestEngagement}% active — up from {engagementTimeline[0]}% in week 1.
          </p>
        </Card>
      )}

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

// Quiet empty-state line for auth-empty panels (engagement, daily brief).
const emptyStateStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 'var(--sh-space-2)',
};
