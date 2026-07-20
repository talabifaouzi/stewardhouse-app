import { useMemo } from 'react';
import { Card } from '../../../components/Card.jsx';
import { SectionLabel } from '../../../components/SectionLabel.jsx';
import BackLink from '../../../components/BackLink.jsx';
import StatTile from '../../../components/StatTile.jsx';
import DataTable from '../../../components/DataTable.jsx';
import { useBasePath, useOptionalAppIdentity } from '../../../contexts/AppIdentityContext.jsx';
import { useAthletes } from '../../../contexts/AthletesContext.jsx';
import { useWorkshops } from '../../../contexts/WorkshopsContext.jsx';
import { useInstitutionEyebrow } from '../shared/useInstitutionEyebrow.js';

// P-1 isolation. Two classes of section on this page:
//
//   LIVE-BACKABLE — certifications, gifts, GPS, lessons, workshops held +
//   attendances. All derive from useAthletes() / useWorkshops(); the demo tree
//   gets the same numbers via the providers' fixture defaults.
//
//   UNSOURCED — "Total dollars moved" and the Recipient-organizations table.
//   Both parse athlete.activity for gift_made events, but toAthleteElement
//   hardcodes `activity: []` (athlete_activity has no INSERT path anywhere in
//   functions/), and there is no enterprise gift-dollar table at all. This is
//   the SAME pair migration 0013 already ruled unsourced for the cohort
//   snapshot (dollars_moved / avg_weekly_engagement): render "Not tracked",
//   NEVER zero — "$0" and an empty table would read as a real measurement.
//   Demo keeps the fixture render; auth gets the NT panel (Idiom B).
//
// Before P-1 every figure here was a module-level const over the FIXTURE
// roster, guarded only by `athletes.length === 0` — a proxy for "demo tree"
// that expired when the roster-add write path landed (E-Write-1).

const fmtUSD = (n) => `$${n.toLocaleString('en-US')}`;
const fmtCount = (n) => n.toLocaleString('en-US');

// "Not tracked" convention, shared with CohortComparison (E-Write-5 / 0013).
const NT = 'Not tracked';

const RECIPIENT_COLUMNS = [
  { key: 'organization', label: 'Organization',     lead: true, render: (r) => r.organization },
  { key: 'giftCount',    label: 'Athletes giving',  render: (r) => r.giftCount },
  { key: 'totalAmount',  label: 'Total received',   render: (r) => fmtUSD(r.totalAmount) },
];

// Parse gift_made activity events from a roster: "$500 to Org Name".
// Demo only in practice — a live element's activity[] is always empty.
function parseGiftEvents(roster) {
  return roster.flatMap((a) =>
    a.activity
      .filter((e) => e.type === 'gift_made')
      .map((e) => {
        const match = e.label.match(/^\$([\d,]+) to (.+)$/);
        if (!match) return null;
        return {
          amount: Number(match[1].replace(/,/g, '')),
          organization: match[2],
          athleteId: a.id,
          athleteName: a.name,
          date: e.date,
        };
      })
      .filter(Boolean),
  );
}

function aggregateRecipients(giftEvents) {
  const byOrg = giftEvents.reduce((acc, g) => {
    if (!acc[g.organization]) {
      acc[g.organization] = { organization: g.organization, totalAmount: 0, giftCount: 0 };
    }
    acc[g.organization].totalAmount += g.amount;
    acc[g.organization].giftCount += 1;
    return acc;
  }, {});
  return Object.values(byOrg).sort((a, b) => b.totalAmount - a.totalAmount);
}

export default function ProgramOutputs() {
  const basePath = useBasePath('/enterprise', '/app/enterprise');
  const eyebrow = useInstitutionEyebrow();
  const appIdentity = useOptionalAppIdentity();
  const isAuthenticated = !!appIdentity;
  const { athletes } = useAthletes();
  const { workshops } = useWorkshops();

  // Live-backable derivations over provider data. Demo tree reproduces the
  // pre-P-1 numbers exactly via the providers' fixture defaults.
  const stats = useMemo(() => {
    const totalAthletes = athletes.length;
    const totalGifts = athletes.reduce((s, a) => s + a.gifts, 0);
    const athletesCertified = athletes.filter((a) => a.certified).length;
    const athletesWithGifts = athletes.filter((a) => a.gifts > 0).length;
    const gpsCompleted = athletes.filter((a) => a.gpsCompleted).length;
    const totalLessonsCompleted = athletes.reduce((s, a) => s + a.lessons, 0);
    const workshopsHeld = workshops.filter((w) => w.status === 'completed').length;
    const workshopsScheduled = workshops.filter((w) => w.status !== 'completed').length;
    const totalWorkshopAttendances = workshops
      .filter((w) => w.status === 'completed')
      .reduce((sum, w) => sum + w.attendance.filter((a) => a.attended).length, 0);
    // Guard every rate against an empty roster (the page-level guard already
    // returns early, but these must never produce NaN if that guard moves).
    return {
      totalAthletes, totalGifts, athletesCertified, athletesWithGifts,
      gpsCompleted, totalLessonsCompleted, workshopsHeld, workshopsScheduled,
      totalWorkshopAttendances,
      certifiedPct: totalAthletes ? Math.round((athletesCertified / totalAthletes) * 100) : 0,
      gpsPct: totalAthletes ? Math.round((gpsCompleted / totalAthletes) * 100) : 0,
      avgLessonsPerAthlete: totalAthletes
        ? Math.round((totalLessonsCompleted / totalAthletes) * 10) / 10
        : 0,
    };
  }, [athletes, workshops]);

  // Unsourced pair. Computed only for the demo tree; on auth the roster's
  // activity[] is always empty, so these would be $0 / [] — which 0013
  // explicitly rejects in favour of "Not tracked".
  const giftEvents = useMemo(() => parseGiftEvents(athletes), [athletes]);
  const recipientRows = useMemo(() => aggregateRecipients(giftEvents), [giftEvents]);
  const totalDollarsMoved = useMemo(
    () => giftEvents.reduce((s, g) => s + g.amount, 0),
    [giftEvents],
  );

  const {
    totalAthletes, totalGifts, athletesCertified, athletesWithGifts,
    gpsCompleted, totalLessonsCompleted, workshopsHeld, workshopsScheduled,
    totalWorkshopAttendances, certifiedPct, gpsPct, avgLessonsPerAthlete,
  } = stats;

  // Empty roster → honest page-level line (unchanged). Passing this guard no
  // longer reveals fixture data.
  if (athletes.length === 0) {
    return (
      <main style={mainStyle}>
        <BackLink to={`${basePath}/reports`} label="Reports" />
        {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
        <h1 style={titleStyle}>Program outputs</h1>
        <p style={emptyLineStyle}>No program data yet.</p>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <BackLink to={`${basePath}/reports`} label="Reports" />
      {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
      <h1 style={titleStyle}>Program outputs</h1>
      <p style={subtitleStyle}>
        Activity summary across the program — dollars moved, athletes certified, gifts made, workshops held. Outputs reporting, not return calculation.
      </p>

      {/* Section 1 — Activity Summary */}
      <Card style={{ marginBottom: 'var(--sh-space-5)' }}>
        <SectionLabel>Activity summary</SectionLabel>
        {/* As-of line is a fixture literal with no live source (no asOfDate is
            emitted) — hidden on auth, per the Endowment precedent. */}
        {!isAuthenticated && (
          <p style={contextLineStyle}>
            Cumulative program outputs as of Nov 17, 2026 (mid-program).
          </p>
        )}
        <div style={statGridStyle}>
          {/* Unsourced (0013): no gift-dollar source exists — "Not tracked",
              never $0. Demo keeps the fixture figure. */}
          {isAuthenticated ? (
            <StatTile
              variant="inline"
              label="Total dollars moved"
              value={NT}
              sublabel="No gift-dollar source yet"
            />
          ) : (
            <StatTile
              variant="inline"
              label="Total dollars moved"
              value={fmtUSD(totalDollarsMoved)}
              sublabel={`${giftEvents.length} tracked gifts`}
            />
          )}
          <StatTile
            variant="inline"
            label="Athletes certified"
            value={`${athletesCertified} of ${totalAthletes}`}
            sublabel={`${certifiedPct}% of cohort`}
          />
          {/* FORK 3: unsourced — athlete.gifts_count is written by no path, so
              both the count and the "(tracked + untracked)" sublabel would be
              false on the auth tree (the sublabel actively claims untracked
              gifts are counted). Mirrors the "Total dollars moved" tile above.
              Demo keeps the fixture figures. */}
          {isAuthenticated ? (
            <StatTile
              variant="inline"
              label="Athletes making gifts"
              value={NT}
              sublabel="No gift source yet"
            />
          ) : (
            <StatTile
              variant="inline"
              label="Athletes making gifts"
              value={`${athletesWithGifts} of ${totalAthletes}`}
              sublabel={`${totalGifts} gifts total (tracked + untracked)`}
            />
          )}
          <StatTile
            variant="inline"
            label="Workshops held"
            value={`${workshopsHeld} of ${workshopsHeld + workshopsScheduled}`}
            sublabel={`${workshopsScheduled} remaining this term`}
          />
        </div>
      </Card>

      {/* Section 2 — Recipient Organizations. Unsourced on auth (0013): the
          roster's activity[] is always empty, so an empty table would assert
          "no organizations received gifts" — a measurement we cannot make. */}
      <Card style={{ marginBottom: 'var(--sh-space-5)' }}>
        <SectionLabel>Recipient organizations</SectionLabel>
        {isAuthenticated ? (
          <p style={notTrackedStyle}>
            {NT}. Recipient organizations appear here when per-athlete gift records are tracked.
          </p>
        ) : (
          <>
            <p style={contextLineStyle}>
              {recipientRows.length} organizations received gifts. Sorted by total dollars received.
            </p>
            <DataTable
              columns={RECIPIENT_COLUMNS}
              data={recipientRows}
              rowKey={(r) => r.organization}
            />
          </>
        )}
      </Card>

      {/* Section 3 — Engagement Activity */}
      <Card style={{ marginBottom: 'var(--sh-space-5)' }}>
        <SectionLabel>Engagement activity</SectionLabel>
        <p style={contextLineStyle}>
          Cohort-wide engagement outputs across the program term.
        </p>
        <div style={statGridStyle}>
          <StatTile
            variant="inline"
            label="Lessons completed"
            value={fmtCount(totalLessonsCompleted)}
            sublabel={`Across ${totalAthletes} athletes, ${avgLessonsPerAthlete} average per athlete`}
          />
          <StatTile
            variant="inline"
            label="Workshop attendances"
            value={fmtCount(totalWorkshopAttendances)}
            sublabel={`${workshopsHeld} workshops × ${totalAthletes} eligible`}
          />
          <StatTile
            variant="inline"
            label="GPS frameworks completed"
            value={`${gpsCompleted} of ${totalAthletes}`}
            sublabel={`${gpsPct}% of cohort`}
          />
        </div>
      </Card>

      {/* Section 4 — About this report */}
      <Card tint>
        <SectionLabel>About this report</SectionLabel>
        <p style={aboutBodyStyle}>
          Program Outputs reports activity, not return on investment. StewardHouse's posture is structural rather than evaluative — these outputs are dollars moved to recipient organizations, athletes who completed certification milestones, gifts made by program participants, and workshops held during the program term. We do not calculate a return-on-investment figure because (1) athlete giving is personal practice, not institutional outcome, and (2) structural milestones reached are not equivalent to financial return. For investment-style framing, this is the wrong report — and arguably the wrong platform.
        </p>
      </Card>
    </main>
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

// Quiet page-level empty line (auth tree, no program data yet).
const emptyLineStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 'var(--sh-space-4)',
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
  lineHeight: 1.55,
  marginTop: 'var(--sh-space-2)',
  marginBottom: 'var(--sh-space-4)',
};

// "Not tracked" body copy for an unsourced section (auth tree). Secondary, not
// muted — this is a substantive statement about what the platform measures, not
// an incidental caption. Existing tokens only.
const notTrackedStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 'var(--sh-space-3)',
};

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 'var(--sh-space-4)',
  marginTop: 'var(--sh-space-3)',
};

const aboutBodyStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
  fontStyle: 'italic',
  maxWidth: '760px',
};
