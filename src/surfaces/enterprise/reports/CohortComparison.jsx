import { Card } from '../../../components/Card.jsx';
import { SectionLabel } from '../../../components/SectionLabel.jsx';
import BackLink from '../../../components/BackLink.jsx';
import useMediaQuery, { MOBILE_QUERY } from '../../../hooks/useMediaQuery.js';
import { athletes, priorCohortSnapshot, currentCohortSnapshot } from '../../../data/enterpriseFixtures.js';

const fmtUSD = (n) => `$${n.toLocaleString('en-US')}`;
const fmtPct = (n) => `${n}%`;

// Sport-level breakdown derived from athletes fixture
const bySport = athletes.reduce((acc, a) => {
  if (!acc[a.sport]) acc[a.sport] = { athletes: [], gpsCount: 0, certCount: 0, giftCount: 0 };
  acc[a.sport].athletes.push(a);
  if (a.gpsCompleted) acc[a.sport].gpsCount++;
  if (a.certified) acc[a.sport].certCount++;
  acc[a.sport].giftCount += a.gifts;
  return acc;
}, {});

const sportRows = Object.entries(bySport)
  .map(([sport, data]) => ({
    sport,
    athleteCount: data.athletes.length,
    gpsCount: data.gpsCount,
    certCount: data.certCount,
    giftCount: data.giftCount,
  }))
  .sort((a, b) => b.athleteCount - a.athleteCount);

// Year-over-year rows — values from snapshots
const yoyRows = [
  { metric: 'Athletes', prior: priorCohortSnapshot.athletes, current: currentCohortSnapshot.athletes },
  {
    metric: 'GPS completion',
    prior: `${fmtPct(priorCohortSnapshot.gpsRate)} (${priorCohortSnapshot.gpsCompleted} of ${priorCohortSnapshot.athletes})`,
    current: `${fmtPct(currentCohortSnapshot.gpsRate)} (${currentCohortSnapshot.gpsCompleted} of ${currentCohortSnapshot.athletes})`,
  },
  {
    metric: 'Certification',
    prior: `${fmtPct(priorCohortSnapshot.certRate)} (${priorCohortSnapshot.certified} of ${priorCohortSnapshot.athletes})`,
    current: `${fmtPct(currentCohortSnapshot.certRate)} (${currentCohortSnapshot.certified} of ${currentCohortSnapshot.athletes})`,
  },
  { metric: 'Total gifts', prior: priorCohortSnapshot.totalGifts, current: currentCohortSnapshot.totalGifts },
  { metric: 'Total dollars moved', prior: fmtUSD(priorCohortSnapshot.totalDollarsMoved), current: fmtUSD(currentCohortSnapshot.totalDollarsMoved) },
  { metric: 'Workshop attendance', prior: fmtPct(priorCohortSnapshot.workshopAttendanceRate), current: fmtPct(currentCohortSnapshot.workshopAttendanceRate) },
  { metric: 'Avg weekly engagement', prior: fmtPct(priorCohortSnapshot.avgWeeklyEngagement), current: fmtPct(currentCohortSnapshot.avgWeeklyEngagement) },
];

export default function CohortComparison() {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  return (
    <main style={mainStyle}>
      <BackLink to="/enterprise/reports" label="Reports" />
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Cohort Comparison</h1>
      <p style={subtitleStyle}>
        Year-over-year and sport-level comparison of structural milestones across cohorts. Outputs reporting, not performance comparison.
      </p>

      {/* Section 1 — Year-over-year */}
      <Card style={{ marginBottom: 'var(--sh-space-5)' }}>
        <SectionLabel>Year-over-year milestones</SectionLabel>
        <p style={contextLineStyle}>
          {priorCohortSnapshot.cohortLabel}: {priorCohortSnapshot.asOfNote} · {currentCohortSnapshot.cohortLabel}: {currentCohortSnapshot.asOfNote}
        </p>
        {isMobile ? (
          <div>
            {yoyRows.map((row, i) => {
              const isLast = i === yoyRows.length - 1;
              return (
                <div key={row.metric} style={yoyMobileBlockStyle(isLast)}>
                  <p style={yoyMobileMetricStyle}>{row.metric}</p>
                  <div style={yoyMobileValueRowStyle}>
                    <span style={yoyMobileColLabelStyle}>{priorCohortSnapshot.cohortLabel}</span>
                    <span style={yoyMobilePriorStyle}>{row.prior}</span>
                  </div>
                  <div style={yoyMobileValueRowStyle}>
                    <span style={yoyMobileColLabelStyle}>{currentCohortSnapshot.cohortLabel}</span>
                    <span style={yoyMobileCurrentStyle}>{row.current}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={yoyGridStyle}>
            <div style={yoyHeaderStyle}></div>
            <div style={yoyHeaderStyle}>{priorCohortSnapshot.cohortLabel}</div>
            <div style={yoyHeaderStyle}>{currentCohortSnapshot.cohortLabel}</div>
            {yoyRows.map((row, i) => {
              const isLast = i === yoyRows.length - 1;
              return (
                <YoyRow key={row.metric} row={row} isLast={isLast} />
              );
            })}
          </div>
        )}
      </Card>

      {/* Section 2 — By sport */}
      <Card style={{ marginBottom: 'var(--sh-space-5)' }}>
        <SectionLabel>Sport-level breakdown</SectionLabel>
        <p style={contextLineStyle}>
          Current cohort by sport. Some sports have a single representative — context for interpretation, not comparison.
        </p>
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Sport</th>
                <th style={thStyle}>Athletes</th>
                <th style={thStyle}>GPS</th>
                <th style={thStyle}>Certified</th>
                <th style={thStyle}>Gifts</th>
              </tr>
            </thead>
            <tbody>
              {sportRows.map((r, i) => {
                const isLast = i === sportRows.length - 1;
                return (
                  <tr key={r.sport}>
                    <td style={tdSportStyle(isLast)}>{r.sport}</td>
                    <td style={tdStyle(isLast)}>{r.athleteCount}</td>
                    <td style={tdStyle(isLast)}>{r.gpsCount} of {r.athleteCount}</td>
                    <td style={tdStyle(isLast)}>{r.certCount} of {r.athleteCount}</td>
                    <td style={tdStyle(isLast)}>{r.giftCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 3 — About this report */}
      <Card tint>
        <SectionLabel>About this report</SectionLabel>
        <p style={aboutBodyStyle}>
          This report presents structural milestones across cohorts and sport groupings. It is not designed for performance ranking, scoring, or evaluation. Athletes, sports, and cohorts have different starting points, contexts, and goals — comparisons are for understanding outputs, not measuring achievement.
        </p>
      </Card>
    </main>
  );
}

function YoyRow({ row, isLast }) {
  return (
    <>
      <div style={yoyMetricStyle(isLast)}>{row.metric}</div>
      <div style={yoyPriorStyle(isLast)}>{row.prior}</div>
      <div style={yoyCurrentStyle(isLast)}>{row.current}</div>
    </>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

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
  lineHeight: 1.65,
  marginBottom: 'var(--sh-space-6)',
  maxWidth: '720px',
};

const contextLineStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  marginTop: 'var(--sh-space-2)',
  marginBottom: 'var(--sh-space-4)',
  lineHeight: 1.55,
};

const yoyGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 0,
};

const yoyHeaderStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
  padding: 'var(--sh-space-3) var(--sh-space-3)',
  borderBottom: 'var(--sh-border-thin)',
};

function yoyMetricStyle(isLast) {
  return {
    fontSize: 'var(--sh-text-xs)',
    color: 'var(--sh-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 500,
    padding: 'var(--sh-space-3) var(--sh-space-3)',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
    display: 'flex',
    alignItems: 'center',
  };
}

function yoyPriorStyle(isLast) {
  return {
    fontSize: 'var(--sh-text-base)',
    color: 'var(--sh-text-secondary)',
    padding: 'var(--sh-space-3) var(--sh-space-3)',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
    display: 'flex',
    alignItems: 'center',
  };
}

function yoyCurrentStyle(isLast) {
  return {
    fontSize: 'var(--sh-text-base)',
    color: 'var(--sh-text-secondary)',
    padding: 'var(--sh-space-3) var(--sh-space-3)',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
    display: 'flex',
    alignItems: 'center',
  };
}

const tableWrapperStyle = {
  overflowX: 'auto',
  width: '100%',
};

const tableStyle = {
  width: '100%',
  minWidth: '560px',
  borderCollapse: 'collapse',
};

const thStyle = {
  textAlign: 'left',
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
  padding: 'var(--sh-space-3) var(--sh-space-3)',
  borderBottom: 'var(--sh-border-thin)',
  whiteSpace: 'nowrap',
};

function tdStyle(isLast) {
  return {
    fontSize: 'var(--sh-text-sm)',
    color: 'var(--sh-text-body)',
    padding: 'var(--sh-space-3) var(--sh-space-3)',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
    lineHeight: 1.5,
    verticalAlign: 'top',
    whiteSpace: 'nowrap',
  };
}

function tdSportStyle(isLast) {
  return {
    fontFamily: 'var(--sh-font-serif)',
    fontSize: 'var(--sh-text-base)',
    color: 'var(--sh-text-primary)',
    padding: 'var(--sh-space-3) var(--sh-space-3)',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
    verticalAlign: 'top',
    whiteSpace: 'nowrap',
  };
}

const aboutBodyStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
  maxWidth: '720px',
};

// Mobile yoy styles — per-metric block stack instead of 3-col grid
function yoyMobileBlockStyle(isLast) {
  return {
    paddingTop: 'var(--sh-space-3)',
    paddingBottom: 'var(--sh-space-3)',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
  };
}

const yoyMobileMetricStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
  marginBottom: 'var(--sh-space-2)',
};

const yoyMobileValueRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 'var(--sh-space-3)',
  paddingTop: 'var(--sh-space-1)',
  paddingBottom: 'var(--sh-space-1)',
};

const yoyMobileColLabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  flexShrink: 0,
};

const yoyMobilePriorStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  textAlign: 'right',
};

const yoyMobileCurrentStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  textAlign: 'right',
};
