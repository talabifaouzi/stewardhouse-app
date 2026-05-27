import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { cohorts } from '../../data/cohorts.js';
import { clients } from '../../data/clients.js';
import { individualProfile } from '../../data/individualProfile.js';
import { THEMES } from '../../data/themes.js';
import { useCohortMember } from '../../contexts/CohortMemberContext.jsx';

export default function CohortView() {
  const { optedIn, optIn, optOut, signaledThemeIds, toggleSignal } = useCohortMember();
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

  // Member-side overlap, read from the same source the advisor C-1 view uses.
  // Anonymized: we count how many OTHER members carry each of the member's
  // themes; we never resolve the others' names here.
  const memberRecord = clients.find((c) => c.id === individualProfile.id);
  const memberThemes = memberRecord?.givingPlan?.themes || [];
  const themeLabelById = Object.fromEntries(THEMES.map((t) => [t.id, t.label]));
  const otherMembers = cohort.memberIds
    .filter((id) => id !== individualProfile.id)
    .map((id) => clients.find((c) => c.id === id))
    .filter(Boolean);
  const sharedInterests = memberThemes
    .map((themeId) => {
      const otherCount = otherMembers.filter((om) => {
        const themes = om.givingPlan?.themes || [];
        return themes.includes(themeId);
      }).length;
      return {
        themeId,
        label: themeLabelById[themeId] || themeId,
        otherCount,
      };
    })
    .filter((s) => s.otherCount >= 1)
    .sort((a, b) => b.otherCount - a.otherCount);

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
            <SectionLabel>Shared with others in your cohort</SectionLabel>
            {sharedInterests.length === 0 ? (
              <p style={emptyTextStyle}>
                You don't have overlapping interests with cohort-mates yet.
              </p>
            ) : (
              <>
                <p style={bodyStyle}>
                  These are interests you share with others in this cohort.
                </p>
                <p style={{
                  fontSize: 'var(--sh-text-xs)',
                  color: 'var(--sh-text-muted)',
                  fontStyle: 'italic',
                  lineHeight: 1.55,
                  marginBottom: 'var(--sh-space-4)',
                }}>
                  Signal any you'd be open to talking about. You'll only be put in touch if a cohort-mate signals the same interest. Names stay private until then.
                </p>
                <ul style={listResetStyle}>
                  {sharedInterests.map((s, idx) => {
                    const isSignaled = signaledThemeIds.includes(s.themeId);
                    return (
                      <li key={s.themeId} style={{
                        paddingTop: idx === 0 ? 0 : 'var(--sh-space-3)',
                        paddingBottom: 'var(--sh-space-3)',
                        borderTop: idx === 0 ? 'none' : 'var(--sh-border-divider)',
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 'var(--sh-space-3)',
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontFamily: 'var(--sh-font-serif)',
                              fontSize: 'var(--sh-text-md)',
                              color: 'var(--sh-text-primary)',
                              marginBottom: 'var(--sh-space-1)',
                            }}>
                              {s.label}
                            </p>
                            <p style={{
                              fontSize: 'var(--sh-text-sm)',
                              color: 'var(--sh-text-secondary)',
                              lineHeight: 1.55,
                            }}>
                              {s.otherCount} {s.otherCount === 1 ? 'other' : 'others'} in your cohort share this.
                            </p>
                          </div>
                          <button
                            onClick={() => toggleSignal(s.themeId)}
                            style={{
                              background: isSignaled ? 'var(--sh-bronze-tint)' : 'none',
                              color: isSignaled ? 'var(--sh-bronze-deep)' : 'var(--sh-text-muted)',
                              border: 'none',
                              padding: isSignaled ? '2px 8px' : 0,
                              borderRadius: isSignaled ? '4px' : 0,
                              fontSize: 'var(--sh-text-xs)',
                              fontWeight: isSignaled ? 500 : 400,
                              letterSpacing: '0.02em',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              flexShrink: 0,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isSignaled ? 'Signaled' : 'Signal interest'}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
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

const listResetStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};
