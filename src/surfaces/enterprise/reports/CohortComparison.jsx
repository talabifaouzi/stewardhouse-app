import { useState, useMemo } from 'react';
import { Card } from '../../../components/Card.jsx';
import { SectionLabel } from '../../../components/SectionLabel.jsx';
import { Button } from '../../../components/Button.jsx';
import { Modal } from '../../../components/Modal.jsx';
import BackLink from '../../../components/BackLink.jsx';
import DataTable from '../../../components/DataTable.jsx';
import useMediaQuery, { MOBILE_QUERY } from '../../../hooks/useMediaQuery.js';
import { useBasePath, useOptionalAppIdentity } from '../../../contexts/AppIdentityContext.jsx';
import { useSnapshots } from '../../../contexts/SnapshotsContext.jsx';
import { useAthletes } from '../../../contexts/AthletesContext.jsx';
import { useInstitutionEyebrow } from '../shared/useInstitutionEyebrow.js';
import RecordSnapshotModal from '../RecordSnapshotModal.jsx';

// Cohort comparison (E-Write-5 rewire). Snapshots + roster come from providers
// now (was fixture imports). snapshotCount drives the view (Q8):
//   0   → the gate panel ("becomes available after your first program period
//         closes"); the auth tree still shows the Record affordance to unlock it.
//   1   → single-cohort view (one column, honest header, no comparison framing).
//   ≥2  → year-over-year comparison of the two most recent snapshots
//         (current = snapshots[0], prior = snapshots[1] — newest-first).
// Demo tree is byte-identical: the provider default is [current, prior] fixtures
// (count 2 → comparison), and the two nullable aggregates are numbers in the
// fixtures so "Not tracked" never appears.
//
// NULL aggregates (dollars_moved / avg_weekly_engagement, Q5) render as
// "Not tracked" — never 0, never blank.

const fmtUSD = (n) => `$${n.toLocaleString('en-US')}`;
const fmtPct = (n) => `${n}%`;
const NT = 'Not tracked';
const fmtUSDorNT = (n) => (n == null ? NT : fmtUSD(n));
const fmtPctorNT = (n) => (n == null ? NT : fmtPct(n));

// Year-over-year rows from two snapshots (prior, current).
function buildYoyRows(prior, current) {
  return [
    { metric: 'Athletes', prior: prior.athletes, current: current.athletes },
    {
      metric: 'GPS completion',
      prior: `${fmtPct(prior.gpsRate)} (${prior.gpsCompleted} of ${prior.athletes})`,
      current: `${fmtPct(current.gpsRate)} (${current.gpsCompleted} of ${current.athletes})`,
    },
    {
      metric: 'Certification',
      prior: `${fmtPct(prior.certRate)} (${prior.certified} of ${prior.athletes})`,
      current: `${fmtPct(current.certRate)} (${current.certified} of ${current.athletes})`,
    },
    { metric: 'Total gifts', prior: prior.totalGifts, current: current.totalGifts },
    { metric: 'Total dollars moved', prior: fmtUSDorNT(prior.totalDollarsMoved), current: fmtUSDorNT(current.totalDollarsMoved) },
    { metric: 'Workshop attendance', prior: fmtPct(prior.workshopAttendanceRate), current: fmtPct(current.workshopAttendanceRate) },
    { metric: 'Avg weekly engagement', prior: fmtPctorNT(prior.avgWeeklyEngagement), current: fmtPctorNT(current.avgWeeklyEngagement) },
  ];
}

// Single-cohort rows from one snapshot.
function buildSingleRows(s) {
  return [
    { metric: 'Athletes', value: s.athletes },
    { metric: 'GPS completion', value: `${fmtPct(s.gpsRate)} (${s.gpsCompleted} of ${s.athletes})` },
    { metric: 'Certification', value: `${fmtPct(s.certRate)} (${s.certified} of ${s.athletes})` },
    { metric: 'Total gifts', value: s.totalGifts },
    { metric: 'Total dollars moved', value: fmtUSDorNT(s.totalDollarsMoved) },
    { metric: 'Workshop attendance', value: fmtPct(s.workshopAttendanceRate) },
    { metric: 'Avg weekly engagement', value: fmtPctorNT(s.avgWeeklyEngagement) },
  ];
}

const SPORT_COLUMNS = [
  { key: 'sport',        label: 'Sport',     lead: true, nowrap: true, render: (r) => r.sport },
  { key: 'athleteCount', label: 'Athletes',  render: (r) => r.athleteCount },
  { key: 'gpsCount',     label: 'GPS',       render: (r) => `${r.gpsCount} of ${r.athleteCount}` },
  { key: 'certCount',    label: 'Certified', render: (r) => `${r.certCount} of ${r.athleteCount}` },
  { key: 'giftCount',    label: 'Gifts',     render: (r) => r.giftCount },
];

export default function CohortComparison() {
  const basePath = useBasePath('/enterprise', '/app/enterprise');
  const eyebrow = useInstitutionEyebrow();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const appIdentity = useOptionalAppIdentity();
  const isAuthenticated = !!appIdentity;
  const { snapshots, add, remove, writeError, clearWriteError } = useSnapshots();
  const { athletes } = useAthletes();

  const [recordOpen, setRecordOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const snapshotCount = snapshots.length;

  // Sport-level breakdown from the live roster (provider). Demo: fixture 16.
  const sportRows = useMemo(() => {
    const bySport = athletes.reduce((acc, a) => {
      // C-1: pre-claim athletes carry no sport — bucket them under an explicit
      // label rather than a null/"null" key.
      const sport = a.sport || 'Not yet provided';
      if (!acc[sport]) acc[sport] = { athletes: [], gpsCount: 0, certCount: 0, giftCount: 0 };
      acc[sport].athletes.push(a);
      if (a.gpsCompleted) acc[sport].gpsCount++;
      if (a.certified) acc[sport].certCount++;
      acc[sport].giftCount += a.gifts;
      return acc;
    }, {});
    return Object.entries(bySport)
      .map(([sport, data]) => ({
        sport,
        athleteCount: data.athletes.length,
        gpsCount: data.gpsCount,
        certCount: data.certCount,
        giftCount: data.giftCount,
      }))
      .sort((a, b) => b.athleteCount - a.athleteCount);
  }, [athletes]);

  const handleConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    clearWriteError();
    const ok = await remove(confirmDeleteId);
    setDeleting(false);
    if (ok) setConfirmDeleteId(null);
  };

  // Auth-only snapshot management (Q6): Record affordance + per-snapshot delete.
  // Reachable in every branch (0 / 1 / ≥2) so the first snapshot unlocks the
  // report live. Demo tree: not rendered → byte-identical.
  const managementBlock = isAuthenticated ? (
    <Card style={{ marginBottom: 'var(--sh-space-5)' }}>
      <SectionLabel>Period snapshots</SectionLabel>
      <p style={managementNoteStyle}>
        Captures current program aggregates as a frozen record. To correct one, delete it and re-snapshot.
      </p>
      <div style={ctaRowStyle}>
        <Button variant="secondary" size="sm" onClick={() => setRecordOpen(true)}>Record period snapshot</Button>
      </div>
      {snapshots.length > 0 && (
        <ul style={listResetStyle}>
          {snapshots.map((s, i) => (
            <li key={s.id ?? i} style={snapshotRowStyle(i === snapshots.length - 1)}>
              <div style={snapTextStyle}>
                <span style={snapLabelStyle}>{s.cohortLabel}</span>
                {s.asOfNote && <span style={snapMetaStyle}>{s.asOfNote}</span>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => { clearWriteError(); setConfirmDeleteId(s.id); }}>Delete</Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  ) : null;

  const authModals = isAuthenticated ? (
    <>
      <RecordSnapshotModal
        isOpen={recordOpen}
        onClose={() => setRecordOpen(false)}
        onAdd={add}
        writeError={writeError}
        clearWriteError={clearWriteError}
      />
      <Modal isOpen={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)} title="Delete snapshot">
        <p style={confirmBodyStyle}>
          Delete this snapshot? The ruled correction path is delete and re-snapshot. This cannot be undone.
        </p>
        {writeError && <p style={confirmErrorStyle}>{writeError}</p>}
        <div style={confirmFooterStyle}>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete snapshot'}
          </Button>
        </div>
      </Modal>
    </>
  ) : null;

  // 0 snapshots — gate panel (Q8).
  if (snapshotCount < 1) {
    return (
      <main style={mainStyle}>
        <BackLink to={`${basePath}/reports`} label="Reports" />
        {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
        <h1 style={titleStyle}>Cohort comparison</h1>
        {managementBlock}
        <Card tint>
          <SectionLabel>Not yet available</SectionLabel>
          <p style={gatePanelStyle}>
            Cohort comparison becomes available after your first program period closes.
          </p>
        </Card>
        {authModals}
      </main>
    );
  }

  const isComparison = snapshotCount >= 2;
  const current = snapshots[0];
  const prior = isComparison ? snapshots[1] : null;
  const yoyRows = isComparison ? buildYoyRows(prior, current) : [];
  const singleRows = isComparison ? [] : buildSingleRows(current);

  return (
    <main style={mainStyle}>
      <BackLink to={`${basePath}/reports`} label="Reports" />
      {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
      <h1 style={titleStyle}>Cohort comparison</h1>
      <p style={subtitleStyle}>
        {isComparison
          ? 'Year-over-year and sport-level comparison of structural milestones across cohorts. Outputs reporting, not performance comparison.'
          : 'Structural milestones for the current program period. A year-over-year comparison appears once a second period is recorded.'}
      </p>

      {managementBlock}

      {/* Section 1 — Year-over-year (≥2) OR single-cohort (1) */}
      <Card style={{ marginBottom: 'var(--sh-space-5)' }}>
        {isComparison ? (
          <>
            <SectionLabel>Year-over-year milestones</SectionLabel>
            <p style={contextLineStyle}>
              {prior.cohortLabel}: {prior.asOfNote} · {current.cohortLabel}: {current.asOfNote}
            </p>
            <p style={contextLineStyle}>
              Cohorts are at different stages of their program term — figures are not directly comparable.
            </p>
            {isMobile ? (
              <div>
                {yoyRows.map((row, i) => {
                  const isLast = i === yoyRows.length - 1;
                  return (
                    <div key={row.metric} style={yoyMobileBlockStyle(isLast)}>
                      <p style={yoyMobileMetricStyle}>{row.metric}</p>
                      <div style={yoyMobileValueRowStyle}>
                        <span style={yoyMobileColLabelStyle}>{prior.cohortLabel} full year</span>
                        <span style={yoyMobilePriorStyle}>{row.prior}</span>
                      </div>
                      <div style={yoyMobileValueRowStyle}>
                        <span style={yoyMobileColLabelStyle}>{current.cohortLabel} to date</span>
                        <span style={yoyMobileCurrentStyle}>{row.current}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={yoyGridStyle}>
                <div style={yoyHeaderStyle}></div>
                <div style={yoyHeaderStyle}>{prior.cohortLabel} full year</div>
                <div style={yoyHeaderStyle}>{current.cohortLabel} to date</div>
                {yoyRows.map((row, i) => {
                  const isLast = i === yoyRows.length - 1;
                  return (
                    <YoyRow key={row.metric} row={row} isLast={isLast} />
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <SectionLabel>Current period milestones</SectionLabel>
            <p style={contextLineStyle}>
              {current.cohortLabel}{current.asOfNote ? `: ${current.asOfNote}` : ''}
            </p>
            <div style={singleGridStyle}>
              {singleRows.map((row, i) => {
                const isLast = i === singleRows.length - 1;
                return (
                  <SingleRow key={row.metric} row={row} isLast={isLast} />
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Section 2 — By sport */}
      <Card style={{ marginBottom: 'var(--sh-space-5)' }}>
        <SectionLabel>Sport-level breakdown</SectionLabel>
        <p style={contextLineStyle}>
          Current cohort by sport. Some sports have a single representative — context for interpretation, not comparison.
        </p>
        <DataTable
          columns={SPORT_COLUMNS}
          data={sportRows}
          rowKey={(r) => r.sport}
        />
      </Card>

      {/* Section 3 — About this report */}
      <Card tint>
        <SectionLabel>About this report</SectionLabel>
        <p style={aboutBodyStyle}>
          This report presents structural milestones across cohorts and sport groupings. It is not designed for performance ranking, scoring, or evaluation. Athletes, sports, and cohorts have different starting points, contexts, and goals — comparisons are for understanding outputs, not ranking athletes.
        </p>
      </Card>

      {authModals}
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

function SingleRow({ row, isLast }) {
  return (
    <>
      <div style={yoyMetricStyle(isLast)}>{row.metric}</div>
      <div style={yoyCurrentStyle(isLast)}>{row.value}</div>
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

// Gated-panel copy (auth tree, no closed program period yet).
const gatePanelStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
  maxWidth: '640px',
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

// Auth-only management block (Record + per-snapshot delete).
const managementNoteStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-3)',
  maxWidth: '640px',
};

const ctaRowStyle = {
  display: 'flex',
  justifyContent: 'flex-start',
  marginBottom: 'var(--sh-space-3)',
};

const listResetStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

function snapshotRowStyle(isLast) {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--sh-space-3)',
    padding: 'var(--sh-space-3) 0',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
  };
}

const snapTextStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-1)',
  minWidth: 0,
};

const snapLabelStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
};

const snapMetaStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  lineHeight: 1.4,
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

const singleGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
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

const confirmBodyStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.65,
  marginTop: 0,
  marginBottom: 'var(--sh-space-4)',
};

const confirmErrorStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-bronze-deep)',
  marginBottom: 'var(--sh-space-3)',
};

const confirmFooterStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--sh-space-2)',
  marginTop: 'var(--sh-space-4)',
  paddingTop: 'var(--sh-space-4)',
  borderTop: 'var(--sh-border-thin)',
};
