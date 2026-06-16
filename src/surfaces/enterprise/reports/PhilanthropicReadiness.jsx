import { Link } from 'react-router-dom';
import { Card } from '../../../components/Card.jsx';
import { SectionLabel } from '../../../components/SectionLabel.jsx';
import BackLink from '../../../components/BackLink.jsx';
import { athletes, exclusions } from '../../../data/enterpriseFixtures.js';

// Stage assignment: each athlete sits at their highest-reached structural
// milestone. Not a score — a checklist of progression steps.
function philanthropicStage(a) {
  if (a.certified) return 5;
  if (a.gifts > 0) return 4;
  if (a.gpsCompleted) return 3;
  if (a.lessons > 0) return 2;
  return 1;
}

const STAGES = [
  {
    n: 1,
    label: 'Invited',
    description: 'Added to program. Initial outreach sent, not yet engaged with curriculum or workshops.',
  },
  {
    n: 2,
    label: 'Engaged',
    description: 'Started the curriculum or attended a workshop. Building familiarity with giving frameworks.',
  },
  {
    n: 3,
    label: 'GPS Defined',
    description: 'Completed the GPS framework. Cause statement drafted, personal connections to causes identified.',
  },
  {
    n: 4,
    label: 'Making Gifts',
    description: 'Active practitioner. Has made at least one philanthropic gift aligned with their GPS.',
  },
  {
    n: 5,
    label: 'Certified',
    description: 'Completed full 9-lesson curriculum and capstone reflection. Sustained practice established.',
  },
];

const stageCounts = STAGES.map((s) => ({
  ...s,
  athletes: athletes.filter((a) => philanthropicStage(a) === s.n),
}));

const totalAthletes = athletes.length;

export default function PhilanthropicReadiness() {
  return (
    <main style={mainStyle}>
      <BackLink to="/enterprise/reports" label="Reports" />
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Philanthropic readiness</h1>
      <p style={subtitleStyle}>
        Cohort progression through structural milestones. Stage-based view of where athletes are in their giving journey — outputs reporting, not numeric readiness score.
      </p>

      {/* Path B intent — about this report */}
      <Card tint style={{ marginBottom: 'var(--sh-space-6)' }}>
        <SectionLabel>About this report</SectionLabel>
        <p style={aboutBodyStyle}>
          Readiness is shown as a structural checklist — which milestones each athlete has reached on their giving journey. Athletes are not scored or ranked on readiness. Each stage represents a step in the practice, not a level of merit. Athletes progress at their own pace, with different starting points and goals.
        </p>
      </Card>

      {/* Cohort at each stage */}
      <div style={sectionHeaderStyle}>
        <h2 style={sectionHeaderTitleStyle}>Cohort at each stage</h2>
        <p style={contextLineStyle}>
          Each athlete shown at their highest-reached stage. Counts are mutually exclusive across stages.
        </p>
      </div>

      {stageCounts.map((stage) => {
        const count = stage.athletes.length;
        const pct = Math.round((count / totalAthletes) * 100);
        return (
          <Card key={stage.n} style={stageCardStyle}>
            <div style={stageHeaderStyle}>
              <span style={stageTitleStyle}>Stage {stage.n}: {stage.label}</span>
              <span style={stageCountStyle}>{count} of {totalAthletes} — {pct}%</span>
            </div>
            <p style={stageDescStyle}>{stage.description}</p>
            {count === 0 ? (
              <p style={emptyStageStyle}>No athletes currently at this stage.</p>
            ) : (
              <div style={chipsRowStyle}>
                {stage.athletes.map((a) => (
                  <span key={a.id} style={chipStyle}>{a.name}</span>
                ))}
              </div>
            )}
          </Card>
        );
      })}

      {/* Compliance posture */}
      <Card style={{ marginTop: 'var(--sh-space-6)' }}>
        <SectionLabel>Compliance posture</SectionLabel>
        <p style={contextLineStyle}>
          Structural compliance status across the program. Not a risk score — current state of policies and reviews.
        </p>
        <div style={postureListStyle}>
          <PostureRow
            label="NIL framework"
            value="Active. Athlete giving treated as personal expression, not institutional benefit."
          />
          <PostureRow
            label="Excluded organizations"
            value={(
              <>
                {exclusions.length} flagged. Reviewed quarterly per advisor independence policy.{' '}
                <Link to="/enterprise/compliance" style={postureLinkStyle}>View list</Link>
              </>
            )}
          />
          <PostureRow
            label="Audit trail"
            value="Session-only in prototype. Production deployment includes timestamped audit log per exclusion edit."
          />
          <PostureRow
            label="Last compliance review"
            value="Nov 1, 2026 — facilitator + athletic department"
            last
          />
        </div>
      </Card>
    </main>
  );
}

function PostureRow({ label, value, last }) {
  return (
    <div style={postureRowStyle(last)}>
      <span style={postureLabelStyle}>{label}</span>
      <span style={postureValueStyle}>{value}</span>
    </div>
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

const aboutBodyStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
  maxWidth: '720px',
};

const sectionHeaderStyle = {
  marginBottom: 'var(--sh-space-4)',
};

const sectionHeaderTitleStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-lg)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-2)',
};

const contextLineStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  lineHeight: 1.55,
  marginTop: 'var(--sh-space-2)',
  marginBottom: 'var(--sh-space-3)',
};

const stageCardStyle = {
  marginBottom: 'var(--sh-space-4)',
  borderLeft: 'var(--sh-border-accent-deep)',
};

const stageHeaderStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-2)',
};

const stageTitleStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-lg)',
  color: 'var(--sh-text-primary)',
};

const stageCountStyle = {
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-secondary)',
};

const stageDescStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  marginBottom: 'var(--sh-space-3)',
  maxWidth: '720px',
};

const emptyStageStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  lineHeight: 1.55,
};

const chipsRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--sh-space-2)',
  marginTop: 'var(--sh-space-2)',
};

const chipStyle = {
  display: 'inline-block',
  padding: '4px 10px',
  background: 'var(--sh-bg-tint)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-full)',
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-secondary)',
  letterSpacing: '0.02em',
  whiteSpace: 'nowrap',
};

const postureListStyle = {
  marginTop: 'var(--sh-space-3)',
};

function postureRowStyle(last) {
  return {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--sh-space-3)',
    paddingTop: 'var(--sh-space-3)',
    paddingBottom: 'var(--sh-space-3)',
    borderBottom: last ? 'none' : 'var(--sh-border-thin)',
  };
}

const postureLabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
  minWidth: '200px',
  flexShrink: 0,
};

const postureValueStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.55,
  flex: 1,
  minWidth: 0,
};

const postureLinkStyle = {
  color: 'var(--sh-bronze)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};
