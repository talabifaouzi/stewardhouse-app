import { useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';

// P-3c — the consent-reversibility control. The athlete's record-keeping mode
// (management_mode) was previously a ONE-TIME choice: ConsentInterstitial
// (IndividualSurface.jsx:105) fired once while the mode was null and was then
// unreachable forever. POST /api/athlete-consent has always supported a flip
// (athlete-consent.js:18-20 documents it as changeable, and the C-1 gate reads
// the column live on every staff write), but NO client called it again. An
// irreversible choice contradicts the E6 athlete-owns ruling, so this view is
// the missing caller. The endpoint is UNCHANGED by this slice.
//
// Relationship to ConsentInterstitial — mutually exclusive by construction, and
// IndividualSurface.jsx:73 needs no edit. That gate is
// `!!athlete && athlete.managementMode === null` and returns EARLY, before
// <Routes>, so it intercepts this route too. An athlete whose mode is already
// set fails the gate, falls through to the router, and lands here. An athlete
// whose mode is null is either sent to the interstitial or — having dismissed
// it with "Decide later", which writes nothing — arrives here with mode null.
// That is why the null state below is a first-class branch, not a defensive
// one: it is genuinely reachable.
//
// Demo tree: no AppIdentityProvider is mounted, so useOptionalAppIdentity()
// returns null, `athlete` is null, and this renders the absent state. Same
// predicate that already makes ConsentInterstitial demo-invisible. No fixture
// is read here at all, so there is nothing for useFixtureIsolated() to gate.

export default function RecordKeeping() {
  const appIdentity = useOptionalAppIdentity();
  const athlete = appIdentity?.status === 'ready' ? appIdentity.identity?.athlete : null;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  // Reached by URL on the demo tree, or by an individual who is not an enrolled
  // athlete. Absence is the honest state (the P-1 useInstitutionEyebrow idiom:
  // no real source → render nothing), phrased to match CohortView's absent card.
  if (!athlete) {
    return (
      <main style={mainStyle}>
        <p style={eyebrowStyle}>Your account</p>
        <Card>
          <p style={emptyTextStyle}>You're not enrolled in a program.</p>
        </Card>
      </main>
    );
  }

  const mode = athlete.managementMode;
  const institutionName = athlete.institutionName;

  // POST shape identical to ConsentInterstitial:114-119. In-flight guard mirrors
  // :106,110. On failure the mode is left untouched (updateAthleteConsent is
  // called only on 2xx) and the control stays enabled — a retry is harmless and
  // the failure may read as transient to the athlete.
  const choose = async (next) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setConfirmed(false);
    try {
      const res = await fetch('/api/athlete-consent', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: next }),
      });
      if (!res.ok) {
        let msg = 'Something went wrong. Please try again.';
        try { const b = await res.json(); if (b && b.error) msg = b.error; } catch { /* keep default */ }
        setError(msg);
        setSubmitting(false);
        return;
      }
      // Local write-through (AppShell.jsx:50-59), no refetch: identity.athlete
      // .managementMode is patched in place, so the state paragraph and the
      // offered control below swap on the next render.
      appIdentity?.updateAthleteConsent?.(next);
      setConfirmed(true);
      setSubmitting(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <main style={mainStyle}>
      <p style={eyebrowStyle}>Your account</p>
      <h1 style={titleStyle}>How your record is managed</h1>

      <Card>
        {mode === 'delegated' && (
          <p style={bodyStyle}>
            Your program staff at {institutionName} manage your record. They can record your progress through the program — workshops you attend, lessons you complete, and your certification. Everything in this account belongs to you.
          </p>
        )}
        {mode === 'self' && (
          <p style={bodyStyle}>
            You manage your own record. Staff at {institutionName} can see your progress, but cannot add to it. Everything in this account belongs to you.
          </p>
        )}
        {mode === null && (
          <p style={bodyStyle}>
            You haven't chosen yet. You can manage your StewardHouse account yourself, or have your program staff at {institutionName} help manage it for you. Either way, this account and everything in it belongs to you.
          </p>
        )}

        {/* Consequences are disclosed BEFORE the click, always visible — there
            is no confirm step. A confirm modal would signal gravity and
            irreversibility, which is the opposite of what is true here. */}
        {mode === 'delegated' && (
          <p style={consequenceStyle}>
            Progress already recorded stays on your record exactly as it is. While you manage your own record, staff will not be able to record anything new. You can change this back at any time.
          </p>
        )}
        {mode === 'self' && (
          <p style={consequenceStyle}>
            Staff will be able to record your progress through the program. Anything already recorded stays as it is. You can change this back at any time.
          </p>
        )}

        {error && <p style={errorStyle}>{error}</p>}
        {confirmed && !error && <p style={confirmedStyle}>Updated.</p>}

        {/* Two-state card offers ONLY the mode not currently held, so a
            same-mode POST is unreachable from the UI. The null state offers
            both as equal options — there is no current mode to flip away from,
            so this is a first choice, not a flip. */}
        <div style={actionsStyle}>
          {mode === 'delegated' && (
            <Button variant="primary" size="lg" onClick={() => choose('self')} disabled={submitting} style={fullWidthBtnStyle}>
              Manage it myself
            </Button>
          )}
          {mode === 'self' && (
            <Button variant="primary" size="lg" onClick={() => choose('delegated')} disabled={submitting} style={fullWidthBtnStyle}>
              Let program staff manage it
            </Button>
          )}
          {mode === null && (
            <>
              <Button variant="primary" size="lg" onClick={() => choose('self')} disabled={submitting} style={fullWidthBtnStyle}>
                I'll manage it myself
              </Button>
              <Button variant="secondary" size="lg" onClick={() => choose('delegated')} disabled={submitting} style={fullWidthBtnStyle}>
                Let program staff manage it
              </Button>
            </>
          )}
        </div>
      </Card>
    </main>
  );
}

// Layout mirrors CohortView's mainStyle exactly (720px cap, centered, same
// padding triple) so this view sits at the same measure as its sibling
// sub-screens. Mobile mechanics: the cap is a MAX, not a width, so below
// 720px the <main> is viewport-width and the horizontal padding
// (--sh-space-8 = 32px each side) is the only fixed cost. At a 320px
// viewport that leaves 256px, less the Card's own --sh-space-6 padding
// (24px each side) and its 0.5px hairlines => ~207px of text measure.
// Nothing here declares a fixed width, a min-width, or nowrap, so every
// paragraph reflows and the buttons (width:100%) shrink to the container
// rather than pushing it. Button labels are ordinary <button> text with the
// UA default white-space:normal, so the longest label ("Let program staff
// manage it", ~27ch at --sh-text-base 14px) wraps to a second line instead
// of overflowing. overflowWrap on the body copy is the one defensive
// mechanic: institutionName is interpolated from the record and may be a
// comma-joined multi-institution list (me.js:136), so a long unbroken token
// breaks rather than forcing horizontal scroll.
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
  marginBottom: 'var(--sh-space-4)',
  overflowWrap: 'break-word',
};

const consequenceStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginBottom: 'var(--sh-space-4)',
  overflowWrap: 'break-word',
};

const errorStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-bronze-deep)',
  lineHeight: 1.5,
  marginBottom: 'var(--sh-space-4)',
  overflowWrap: 'break-word',
};

const confirmedStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  lineHeight: 1.5,
  marginBottom: 'var(--sh-space-4)',
};

const actionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-2)',
};

const fullWidthBtnStyle = {
  width: '100%',
};

const emptyTextStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  lineHeight: 1.6,
};
