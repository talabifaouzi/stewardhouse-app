import { useState, useMemo } from 'react';
// DEMO-ONLY fixture imports: the weekly-engagement series has NO live source
// (no engagement-tracking table exists — see migration 0013, which ruled
// avg_weekly_engagement "not tracked" for the same reason). These three feed
// the demo-tree chart branch ONLY; the authenticated tree renders the
// "Not tracked" panel instead and never reads them. The roster and workshop
// imports are gone — those come from providers now.
import {
  engagementTimeline,
  engagementWeekDates,
  engagedAthletesByWeek,
} from '../../../data/enterpriseFixtures.js';
import { Card } from '../../../components/Card.jsx';
import { SectionLabel } from '../../../components/SectionLabel.jsx';
import BarChart from '../../../components/BarChart.jsx';
import BackLink from '../../../components/BackLink.jsx';
import StatTile from '../../../components/StatTile.jsx';
import WorkshopDetail from '../../../components/WorkshopDetail.jsx';
import FilteredAthletesModal from '../../../components/FilteredAthletesModal.jsx';
import AthleteProfile from '../../../components/AthleteProfile.jsx';
import { useComms } from '../../../contexts/CommsContext.jsx';
import { useBasePath, useOptionalAppIdentity } from '../../../contexts/AppIdentityContext.jsx';
import { useAthletes } from '../../../contexts/AthletesContext.jsx';
import { useWorkshops } from '../../../contexts/WorkshopsContext.jsx';
import { useInstitutionEyebrow } from '../shared/useInstitutionEyebrow.js';
import { formatDate } from '../../../utils/formatDate.js';
import { computeStats, engagementBounds } from '../shared/enterpriseStats.js';
import { CATEGORY_CONFIG, STATUS_CATEGORY_KEYS, countByCategory } from '../shared/categoryFilters.js';
import RateDisclosure, { fmtRate } from '../shared/RateDisclosure.jsx';

// P-1 isolation. Cohort snapshot + status breakdown were already live
// (computeStats over the provider roster). What was NOT: athletesById and the
// workshop list were module-level consts over the FIXTURE, so a real operator
// saw five Cooper State workshops and fixture attendee names. Both now come
// from providers. The engagement chart is UNSOURCED (Idiom B) — demo keeps the
// fixture chart, auth gets the "Not tracked" panel.

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export default function ProgramSummary() {
  const basePath = useBasePath('/enterprise', '/app/enterprise');
  const eyebrow = useInstitutionEyebrow();
  const appIdentity = useOptionalAppIdentity();
  const isAuthenticated = !!appIdentity;
  const { openCompose } = useComms();
  const { athletes } = useAthletes();
  const { workshops } = useWorkshops();
  const [activeWorkshop, setActiveWorkshop] = useState(null);
  const [activeWeek, setActiveWeek] = useState(null);
  const [activeAthlete, setActiveAthlete] = useState(null);

  // Attendee-name lookup for WorkshopDetail, over the LIVE roster. Demo tree
  // reproduces the pre-P-1 map via the provider's fixture default.
  const athletesById = useMemo(
    () => Object.fromEntries(athletes.map((a) => [a.id, a])),
    [athletes],
  );

  // Empty roster → honest page-level line (unchanged). Passing this guard no
  // longer reveals fixture data.
  if (athletes.length === 0) {
    return (
      <main style={mainStyle}>
        <BackLink to={`${basePath}/reports`} label="Reports" />
        {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
        <h1 style={titleStyle}>Program summary</h1>
        <p style={emptyLineStyle}>No program data yet.</p>
      </main>
    );
  }

  const stats = computeStats(athletes);
  const { tot, gpsRate, certRate, tGi } = stats;
  // The status breakdown below reads the SAME predicates the Overview and
  // Roster tiles read, and the same ones their drills filter on. This page has
  // no drills, so this is not a pairing change: it removes a contradiction the
  // pairing slice would otherwise create, where Reports and the tiles named the
  // same four statuses with different numbers over the same roster.
  //
  // `onTrack`, `certD`, `stalled` and `notStarted` are no longer destructured
  // here. computeStats still exports all four; only this file's binding moved.
  const categoryCount = countByCategory(athletes);
  // ALL SIX statuses, with zero-count clauses SUPPRESSED, the same shape
  // RateDisclosure uses for its reason lines: name what is present rather than
  // list absences. Four clauses reading zero over a 46-athlete roster is true
  // and not honest, because the 46 sit in a status the sentence never mentions.
  //
  // Suppression cannot empty the sentence. statusFor is total, returning one of
  // these six labels for every athlete, so any roster of one or more produces
  // at least one clause; a roster of zero returns at :63 above and never
  // reaches here.
  const statusClauses = STATUS_CATEGORY_KEYS
    .filter((key) => categoryCount[key] > 0)
    .map((key) => `${categoryCount[key]} ${CATEGORY_CONFIG[key].label}`);
  const { min: engagementMin, max: engagementMax } = engagementBounds(engagementTimeline);
  const latestEngagement = engagementTimeline[engagementTimeline.length - 1];

  // Bar-click membership is demo-only: engagedAthletesByWeek is a fixture id
  // list, and the chart that triggers this never renders on the auth tree.
  const weekAthletes = activeWeek !== null
    ? athletes.filter((a) => (engagedAthletesByWeek[activeWeek] || []).includes(a.id))
    : [];
  const weekTitle = activeWeek !== null
    ? `Engaged athletes — week ending ${formatDate(engagementWeekDates[activeWeek])} — ${weekAthletes.length} athletes`
    : '';

  return (
    <main style={mainStyle}>
      <BackLink to={`${basePath}/reports`} label="Reports" />
      {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
      <h1 style={titleStyle}>Program summary</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-5)' }}>
        {/* Cohort snapshot */}
        <Card>
          <SectionLabel>Cohort snapshot</SectionLabel>
          <div style={statGridStyle}>
            <StatTile variant="inline" label="Athletes" value={tot} />
            <StatTile variant="inline" label="GPS completed" value={fmtRate(gpsRate)} />
            <StatTile variant="inline" label="Certified" value={fmtRate(certRate)} />
            {/* FORK 3: gifts_count is unsourced — "Not tracked" on the auth
                tree (the fmtRate idiom used by the two tiles above), never a
                frozen 0. Demo keeps the fixture figure. */}
            <StatTile variant="inline" label="Total gifts" value={isAuthenticated ? 'Not tracked' : tGi} />
          </div>
          <RateDisclosure stats={stats} />
        </Card>

        {/* Status breakdown */}
        <Card>
          <SectionLabel>Status breakdown</SectionLabel>
          <p style={narrativeStyle}>
            {statusClauses.join(', ')}.
          </p>
        </Card>

        {/* Engagement — UNSOURCED (Idiom B). No engagement-tracking table
            exists (0013), so the auth tree gets "Not tracked", never a chart of
            zeros. Demo renders the fixture chart unchanged. */}
        {isAuthenticated ? (
          <Card>
            <div style={engagementHeaderStyle}>
              <SectionLabel>Weekly active engagement</SectionLabel>
            </div>
            <p style={notTrackedStyle}>
              Not tracked. Weekly engagement tracking is not yet available.
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
              onBarClick={(_, i) => setActiveWeek(i)}
              ariaLabel={`Weekly engagement rate over 12 weeks ending ${formatDate(engagementWeekDates[engagementWeekDates.length - 1])}, ranging from ${engagementMin}% to ${engagementMax}%. Current week: ${engagementTimeline[engagementTimeline.length - 1]}%. Click a bar to see engaged athletes for that week.`}
            />
            <p style={engagementCaptionStyle}>
              Current week: {latestEngagement}% active — up from {engagementTimeline[0]}% in week 1.
            </p>
          </Card>
        )}

        {/* Workshops to date — live (provider). Empty-state mirrors
            EnterpriseProgram's "No workshops scheduled yet." idiom. */}
        <Card>
          <SectionLabel>Workshops to date</SectionLabel>
          {workshops.length === 0 ? (
            <p style={emptyLineStyle}>No workshops scheduled yet.</p>
          ) : (
            <ul style={listResetStyle}>
              {workshops.map((w, i) => {
                const isLast = i === workshops.length - 1;
                return (
                  <li key={w.id}>
                    <WorkshopRow workshop={w} isLast={isLast} onClick={() => setActiveWorkshop(w)} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Workshop detail modal */}
      <WorkshopDetail
        isOpen={activeWorkshop !== null}
        onClose={() => setActiveWorkshop(null)}
        workshop={activeWorkshop}
        athletesById={athletesById}
      />

      {/* Engaged-athletes modal (bar click) → AthleteProfile */}
      <FilteredAthletesModal
        isOpen={activeWeek !== null}
        onClose={() => setActiveWeek(null)}
        title={weekTitle}
        athletes={weekAthletes}
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

function WorkshopRow({ workshop, isLast, onClick }) {
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
        ...workshopRowStyle(isLast),
        background: hovered ? 'var(--sh-bg-tint)' : 'transparent',
        outline: focused ? '2px solid var(--sh-bronze)' : 'none',
        outlineOffset: '-2px',
      }}
    >
      <div style={workshopDateStyle}>{formatDate(workshop.date)}</div>
      <div style={workshopTitleStyle}>{workshop.title}</div>
      <div style={workshopMetaStyle}>
        {workshop.attendees != null ? `${workshop.attendees} attended` : capitalize(workshop.status)}
      </div>
    </button>
  );
}

const mainStyle = {
  maxWidth: 'var(--sh-content-max)',
  margin: '0 auto',
  padding: 'var(--sh-space-10) clamp(var(--sh-space-3), 4vw, var(--sh-space-8)) var(--sh-space-16)',
};

// Quiet page-level empty line (auth tree, no program data yet). Also carries
// the workshops empty-state inside the card.
const emptyLineStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 'var(--sh-space-4)',
};

// "Not tracked" body copy for the unsourced engagement section (auth tree).
// Secondary, not muted — a substantive statement about what the platform
// measures, not an incidental caption. Existing tokens only.
const notTrackedStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 'var(--sh-space-3)',
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
  // Floor wrapped in min() per 88e07ea: identical at or above 160px, and below
  // it the track shrinks to fit rather than overflowing the page sideways.
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
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
    padding: 'var(--sh-space-3) var(--sh-space-2)',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'background 150ms ease',
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
