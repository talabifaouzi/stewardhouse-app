import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import unified from '../../data/unified/index.js';
import { individualProfile } from '../../data/individualProfile.js';
import { THEMES } from '../../data/themes.js';
import { simulatedMemberSignals } from '../../data/cohortSignals.js';
import { useCohortMember } from '../../contexts/CohortMemberContext.jsx';
import { useFixtureIsolated } from './useFixtureIsolated.js';

// CohortView rewire (Tier 3): first Individual file to read from the unified
// data layer. Replaces raw cohorts.js + clients.js reads with
// unified.cohorts + unified.programParticipations + unified.persons. THEMES
// (a taxonomy, not a record entity) and simulatedMemberSignals (a raw
// advisor-namespaced demo fixture) stay raw per the rewire rulings (D2 a).
//
// 5.7 DEFERRED: CohortMemberContext (useCohortMember) stays Individual-local
// for now. It holds pure session state (optedIn + signaledThemeIds) with no
// fixture dependencies, so the unified rewire doesn't touch it. Moving it
// into unified as a "MemberCohortParticipation" entity is gated on the
// broader "unified as live store?" / persistence-pilot question.

// Plural-safe English list joiner: ["A"] → "A", ["A","B"] → "A and B",
// ["A","B","C"] → "A, B, and C".
function joinNames(names) {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export default function CohortView() {
  const { optedIn, optIn, optOut, signaledThemeIds, toggleSignal } = useCohortMember();
  const fixtureIsolated = useFixtureIsolated();

  // P-3a — fixture isolation. Everything below this gate reads the DEMO
  // persona (individualProfile.id = 'c-001') out of the unified layer. There is
  // no individual-side cohort relation to read instead: /api/me emits cohorts
  // ONLY inside the advisor block (me.js:358, gated to type==='advisor'), so a
  // signed-in individual has no cohort source at all. The honest state is
  // therefore ABSENCE, not a rewire (the P-1 useInstitutionEyebrow idiom: no
  // real source → render nothing).
  //
  // Before this gate, a signed-in individual was rendered AS Marcus Thompson —
  // his cohort title, his themes as their interests, and a solicitation naming
  // two real records (Isaiah Coleman, Naomi Pierce) as cohort-mates who "also
  // signaled this — make a connection". A §7 names-verbatim violation that
  // additionally invited an action against people the user has no relation to.
  //
  // Demo tree: useFixtureIsolated() is false (no AppIdentityProvider mounted)
  // → the gate is skipped and the fixture render below is reached unchanged,
  // byte-identical. P-3b-1 routed this through the shared helper; the predicate
  // and the behaviour are the same ones shipped and verified live in P-3a.
  //
  // The copy reuses this file's OWN existing absent-state card (the no-cohort
  // branch below) verbatim — no new phrasing introduced.
  if (fixtureIsolated) {
    return (
      <main style={mainStyle}>
        <p style={eyebrowStyle}>Your cohort</p>
        <Card>
          <p style={emptyTextStyle}>You're not part of a cohort yet.</p>
        </Card>
      </main>
    );
  }

  // D1 identity bridge — the current Individual user (individualProfile.id =
  // 'c-001') is represented in the unified layer as TWO Person records:
  // 'p-individual-c-001' (this surface's source-of-truth persona) and
  // 'p-advisor-c-001' (the same human as a client of Walker Advisory).
  // Same-person dedup is deferred per CLAUDE.md §4 — the two unified personas
  // are NOT joined. The cohort + giving-plan data lives under the advisor
  // namespace, so this call-site bridge crosses the known gap deliberately.
  // When dedup lands, this is the line to revisit.
  const currentMemberId = `p-advisor-${individualProfile.id}`;

  const cohort = unified.cohorts.find((c) => c.memberPersonIds.includes(currentMemberId));

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
  // Themes live on ProgramParticipation.extensions.advisor.givingPlan.themes
  // (per the advisor adapter's entity-boundary placement, decision A).
  const memberPp = unified.programParticipations.find((pp) => pp.personId === currentMemberId);
  const memberThemes = memberPp?.extensions?.advisor?.givingPlan?.themes || [];
  const themeLabelById = Object.fromEntries(THEMES.map((t) => [t.id, t.label]));

  // Project each cohort-mate into a flat { id, name, themes } shape. The id
  // stays the unified Person id (e.g. 'p-advisor-c-005'); name comes from
  // unified.persons; themes come from the cohort-mate's ProgramParticipation.
  const otherMembers = cohort.memberPersonIds
    .filter((id) => id !== currentMemberId)
    .map((id) => {
      const person = unified.byId('persons', id);
      const pp = unified.programParticipations.find((p) => p.personId === id);
      if (!person) return null;
      return {
        id,
        name: person.name,
        themes: pp?.extensions?.advisor?.givingPlan?.themes || [],
      };
    })
    .filter(Boolean);

  const sharedInterests = memberThemes
    .map((themeId) => {
      const otherCount = otherMembers.filter((om) => om.themes.includes(themeId)).length;
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
                    // Names resolve ONLY when the current member has signaled
                    // this theme AND a cohort-mate has signaled the same.
                    // Until that mutual condition holds, identity stays hidden.
                    // D2 (a) — simulatedMemberSignals is a raw advisor-namespaced
                    // demo fixture (kept raw per the rewire ruling). Strip the
                    // 'p-advisor-' prefix to bridge unified IDs back to the
                    // fixture's raw keys.
                    const matchedMembers = isSignaled
                      ? otherMembers.filter((om) =>
                          (simulatedMemberSignals[om.id.replace('p-advisor-', '')] || []).includes(s.themeId),
                        )
                      : [];
                    const isMatched = isSignaled && matchedMembers.length > 0;
                    const isPending = isSignaled && matchedMembers.length === 0;
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
                            {isPending && (
                              <p style={{
                                fontSize: 'var(--sh-text-xs)',
                                color: 'var(--sh-text-muted)',
                                fontStyle: 'italic',
                                lineHeight: 1.55,
                                marginTop: 'var(--sh-space-2)',
                              }}>
                                Signaled — when a cohort-mate signals the same, you'll be able to make a connection.
                              </p>
                            )}
                            {isMatched && (
                              <p style={{
                                fontSize: 'var(--sh-text-sm)',
                                color: 'var(--sh-bronze-deep)',
                                lineHeight: 1.6,
                                marginTop: 'var(--sh-space-2)',
                              }}>
                                {joinNames(matchedMembers.map((m) => m.name))} also signaled this. You're both open to talking about {s.label} — make a connection.
                              </p>
                            )}
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
