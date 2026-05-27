import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { cohorts } from '../../data/cohorts.js';
import { individualProfile } from '../../data/individualProfile.js';
import { useCohortMember } from '../../contexts/CohortMemberContext.jsx';

export default function CohortView() {
  const { optedIn, optIn, optOut } = useCohortMember();
  const cohort = cohorts.find((c) => c.memberIds.includes(individualProfile.id));

  if (!cohort) {
    return (
      <main style={mainStyle}>
        <p style={eyebrowStyle}>Your cohort</p>
        <Card>
          <p style={emptyTextStyle}>You're not part of a cohort yet.</p>
        </Card>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <p style={eyebrowStyle}>Your cohort</p>
      <h1 style={titleStyle}>{cohort.name}</h1>

      {!optedIn ? (
        <>
          <Card style={{ marginBottom: 'var(--sh-space-4)' }}>
            <SectionLabel>How this works</SectionLabel>
            <p style={bodyStyle}>
              You're one of several athletes in this cohort. Each of you is working on your own giving practice; sometimes those practices intersect.
            </p>
            <p style={bodyStyle}>
              If you choose to opt in, you'll be able to see the interests you share with other members and signal which ones you'd like to talk about. You stay in control of what is shared, and what is not.
            </p>
            <p style={{ ...bodyStyle, marginBottom: 'var(--sh-space-5)' }}>
              Until you opt in, nothing about your interests is visible to other members, and you see nothing about theirs. The choice is yours.
            </p>
            <Button variant="primary" onClick={optIn}>
              Opt in
            </Button>
          </Card>

          <p style={persistenceNoteStyle}>
            Your choice in this session is not yet persisted across refreshes.
          </p>
        </>
      ) : (
        <>
          <Card style={{ marginBottom: 'var(--sh-space-4)' }}>
            <SectionLabel>You're opted in</SectionLabel>
            <p style={bodyStyle}>
              Thanks. Shared interests and signaling will appear here in the next slice.
            </p>
          </Card>

          <p style={persistenceNoteStyle}>
            Your choice in this session is not yet persisted across refreshes.
          </p>

          <p style={{ marginTop: 'var(--sh-space-4)', textAlign: 'center' }}>
            <button
              onClick={optOut}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--sh-text-muted)',
                fontSize: 'var(--sh-text-xs)',
                fontStyle: 'italic',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontFamily: 'inherit',
                padding: 0,
              }}
            >
              Opt out
            </button>
          </p>
        </>
      )}
    </main>
  );
}

const mainStyle = {
  maxWidth: '720px',
  margin: '0 auto',
  padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
};

const eyebrowStyle = {
  fontSize: '10px',
  color: 'var(--sh-bronze)',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontWeight: 600,
  marginBottom: 'var(--sh-space-2)',
};

const titleStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-2xl)',
  color: 'var(--sh-text-primary)',
  fontWeight: 400,
  marginBottom: 'var(--sh-space-5)',
};

const bodyStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.65,
  marginBottom: 'var(--sh-space-3)',
};

const emptyTextStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  lineHeight: 1.6,
};

const persistenceNoteStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  lineHeight: 1.55,
  textAlign: 'center',
};
