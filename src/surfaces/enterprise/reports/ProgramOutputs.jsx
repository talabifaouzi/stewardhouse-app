import { Card } from '../../../components/Card.jsx';
import { SectionLabel } from '../../../components/SectionLabel.jsx';
import BackLink from '../../../components/BackLink.jsx';
import StatTile from '../../../components/StatTile.jsx';
import DataTable from '../../../components/DataTable.jsx';
import { athletes, workshops } from '../../../data/enterpriseFixtures.js';

const fmtUSD = (n) => `$${n.toLocaleString('en-US')}`;
const fmtCount = (n) => n.toLocaleString('en-US');

const RECIPIENT_COLUMNS = [
  { key: 'organization', label: 'Organization',     lead: true, render: (r) => r.organization },
  { key: 'giftCount',    label: 'Athletes giving',  render: (r) => r.giftCount },
  { key: 'totalAmount',  label: 'Total received',   render: (r) => fmtUSD(r.totalAmount) },
];

// Parse gift_made activity events from each athlete: "$500 to Org Name"
const giftEvents = athletes.flatMap((a) =>
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

// Aggregate by recipient organization
const recipientOrgs = giftEvents.reduce((acc, g) => {
  if (!acc[g.organization]) {
    acc[g.organization] = { organization: g.organization, totalAmount: 0, giftCount: 0 };
  }
  acc[g.organization].totalAmount += g.amount;
  acc[g.organization].giftCount += 1;
  return acc;
}, {});

const recipientRows = Object.values(recipientOrgs).sort(
  (a, b) => b.totalAmount - a.totalAmount,
);

// Activity totals
const totalDollarsMoved = giftEvents.reduce((s, g) => s + g.amount, 0);
const totalGiftsTracked = giftEvents.length;
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

const totalAthletes = athletes.length;
const certifiedPct = Math.round((athletesCertified / totalAthletes) * 100);
const gpsPct = Math.round((gpsCompleted / totalAthletes) * 100);
const avgLessonsPerAthlete = Math.round((totalLessonsCompleted / totalAthletes) * 10) / 10;

export default function ProgramOutputs() {
  return (
    <main style={mainStyle}>
      <BackLink to="/enterprise/reports" label="Reports" />
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Program outputs</h1>
      <p style={subtitleStyle}>
        Activity summary across the program — dollars moved, athletes certified, gifts made, workshops held. Outputs reporting, not return calculation.
      </p>

      {/* Section 1 — Activity Summary */}
      <Card style={{ marginBottom: 'var(--sh-space-5)' }}>
        <SectionLabel>Activity summary</SectionLabel>
        <p style={contextLineStyle}>
          Cumulative program outputs as of Nov 17, 2026 (mid-program).
        </p>
        <div style={statGridStyle}>
          <StatTile
            variant="inline"
            label="Total dollars moved"
            value={fmtUSD(totalDollarsMoved)}
            sublabel={`${totalGiftsTracked} tracked gifts`}
          />
          <StatTile
            variant="inline"
            label="Athletes certified"
            value={`${athletesCertified} of ${totalAthletes}`}
            sublabel={`${certifiedPct}% of cohort`}
          />
          <StatTile
            variant="inline"
            label="Athletes making gifts"
            value={`${athletesWithGifts} of ${totalAthletes}`}
            sublabel={`${totalGifts} gifts total (tracked + untracked)`}
          />
          <StatTile
            variant="inline"
            label="Workshops held"
            value={`${workshopsHeld} of ${workshopsHeld + workshopsScheduled}`}
            sublabel={`${workshopsScheduled} remaining this term`}
          />
        </div>
      </Card>

      {/* Section 2 — Recipient Organizations */}
      <Card style={{ marginBottom: 'var(--sh-space-5)' }}>
        <SectionLabel>Recipient organizations</SectionLabel>
        <p style={contextLineStyle}>
          {recipientRows.length} organizations received gifts. Sorted by total dollars received.
        </p>
        <DataTable
          columns={RECIPIENT_COLUMNS}
          data={recipientRows}
          rowKey={(r) => r.organization}
        />
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
