import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Chrome from '../../components/Chrome.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Tag } from '../../components/Tag.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import { useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { useBasePath } from './useBasePath.js';
import { useFixtureIsolated } from './useFixtureIsolated.js';
import {
  individualProfile,
  getFundingSpotlight,
  getMicroLearning,
  visibilityInsights,
} from '../../data/individualProfile.js';
import { CAUSES, deriveCelebration } from '../../data/intakeData.js';

import Letter from './Letter.jsx';
import Privacy from './Privacy.jsx';
import Questions from './Questions.jsx';
import GPSReveal from './GPSReveal.jsx';
import Positioning from './Positioning.jsx';
import Plan from './Plan.jsx';
import History from './History.jsx';
import Discover from './Discover.jsx';
import Learn from './Learn.jsx';
import Team from './Team.jsx';
import GiveScreen from './GiveScreen.jsx';
import Feedback from './Feedback.jsx';
import CohortView from './CohortView.jsx';

function getNavItems(basePath) {
  return [
    { key: 'home', label: 'Home', path: basePath },
    { key: 'plan', label: 'Giving plan', path: `${basePath}/plan` },
    { key: 'discover', label: 'Discover', path: `${basePath}/discover` },
    { key: 'learn', label: 'Learn', path: `${basePath}/learn` },
    { key: 'history', label: 'History', path: `${basePath}/history` },
    { key: 'team', label: 'Team', path: `${basePath}/team` },
  ];
}

export default function IndividualSurface() {
  const appIdentity = useOptionalAppIdentity();
  const [dismissed, setDismissed] = useState(false);

  // Consent interstitial (C-3b). A signed-in individual who is ALSO a linked
  // athlete carries identity.athlete; while their management_mode is still
  // unset (deny-by-default), they choose self- vs delegated-management BEFORE
  // anything else on the surface renders — before the onboarding redirect and
  // before the dashboard. The CONDITION gates it, not the route, so it fires
  // regardless of where they land. Ordinary individuals (no identity.athlete)
  // and the public demo tree (no AppIdentityProvider → appIdentity null) never
  // reach it. "Decide later" sets a local flag for THIS mount only and never
  // writes; on the next load management_mode is still null so the card returns.
  const athlete = appIdentity?.status === 'ready' ? appIdentity.identity?.athlete : null;
  const needsConsentChoice = !!athlete && athlete.managementMode === null;
  if (needsConsentChoice && !dismissed) {
    return (
      <ConsentInterstitial
        institutionName={athlete.institutionName}
        onChoose={(mode) => appIdentity?.updateAthleteConsent?.(mode)}
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  return (
    <Routes>
      {/* Onboarding flow — chrome-less, full-screen */}
      <Route path="welcome" element={<Positioning />} />
      <Route path="letter" element={<Letter />} />
      <Route path="privacy" element={<Privacy />} />
      <Route path="questions" element={<Questions />} />
      <Route path="reveal" element={<GPSReveal />} />

      {/* Dashboard — wrapped in chrome */}
      <Route path="*" element={<DashboardLayout />} />
    </Routes>
  );
}

// One-time account-ownership choice for a linked athlete (C-3b). Framed as
// ownership, never "grant staff access": the account belongs to the athlete
// either way. Two writes to POST /api/athlete-consent ('self' | 'delegated');
// dismissal writes nothing (deny-by-default holds). On success the parent's
// updateAthleteConsent closes the gate and the surface renders; on failure the
// server error surfaces in-card (writeError idiom) and dismissal still works.
function ConsentInterstitial({ institutionName, onChoose, onDismiss }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const choose = async (mode) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/athlete-consent', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) {
        let msg = 'Something went wrong. Please try again.';
        try { const b = await res.json(); if (b && b.error) msg = b.error; } catch { /* keep default */ }
        setError(msg);
        setSubmitting(false);
        return;
      }
      onChoose(mode);   // parent closes the gate → surface renders; component unmounts
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div style={interstitialWrapStyle}>
      <Card padding="lg" style={interstitialCardStyle}>
        <h1 style={interstitialHeadingStyle}>Your account, your choice</h1>
        <p style={interstitialBodyStyle}>
          You're enrolled in {institutionName}'s program. You can manage your
          StewardHouse account yourself, or have your program staff help manage
          it for you. Either way, this account and everything in it belongs to
          you — and you can change this anytime.
        </p>
        {error && <p style={interstitialErrorStyle}>{error}</p>}
        <div style={interstitialActionsStyle}>
          <Button variant="primary" size="lg" onClick={() => choose('self')} disabled={submitting} style={fullWidthBtnStyle}>
            I'll manage it myself
          </Button>
          <Button variant="secondary" size="lg" onClick={() => choose('delegated')} disabled={submitting} style={fullWidthBtnStyle}>
            Let program staff manage it
          </Button>
        </div>
        <button type="button" onClick={onDismiss} disabled={submitting} style={interstitialDismissStyle}>
          Decide later
        </button>
      </Card>
    </div>
  );
}

// Consent interstitial styles — full-height centered, chrome-less (mirrors the
// onboarding screens). Fluid: the card is max-width-capped and shrinks to the
// viewport (width:100% + max-width, no fixed px width), padding scales via
// tokens, and the action buttons stack full-width so nothing overflows at phone
// width. No fixed widths, no horizontal scroll.
const interstitialWrapStyle = {
  minHeight: '100vh',
  background: 'var(--sh-bg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--sh-space-6) var(--sh-space-4)',
};

const interstitialCardStyle = {
  width: '100%',
  maxWidth: '480px',
};

const interstitialHeadingStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-xl)',
  color: 'var(--sh-text-primary)',
  fontWeight: 400,
  marginBottom: 'var(--sh-space-3)',
  lineHeight: 1.3,
};

const interstitialBodyStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.65,
  marginBottom: 'var(--sh-space-5)',
};

const interstitialErrorStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-bronze-deep)',
  lineHeight: 1.5,
  marginBottom: 'var(--sh-space-4)',
};

const interstitialActionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-2)',
  marginBottom: 'var(--sh-space-4)',
};

const fullWidthBtnStyle = {
  width: '100%',
};

const interstitialDismissStyle = {
  display: 'block',
  margin: '0 auto',
  background: 'transparent',
  border: 'none',
  color: 'var(--sh-text-muted)',
  fontSize: 'var(--sh-text-xs)',
  fontStyle: 'italic',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontFamily: 'inherit',
  padding: 0,
};

function DashboardLayout() {
  const location = useLocation();
  const path = location.pathname;

  const activeNav =
    path.includes('/plan') ? 'plan' :
    path.includes('/discover') ? 'discover' :
    path.includes('/learn') ? 'learn' :
    path.includes('/history') ? 'history' :
    path.includes('/team') ? 'team' :
    'home';

  const basePath = useBasePath();
  const navItems = getNavItems(basePath);
  const appIdentity = useOptionalAppIdentity();
  const { intakeComplete } = useIntake();

  if (!intakeComplete) {
    return <Navigate to={`${basePath}/welcome`} replace />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--sh-bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Chrome
        surface="individual"
        userName={appIdentity?.status === 'ready' && appIdentity.identity?.displayName ? appIdentity.identity.displayName : individualProfile.name}
        userRole={appIdentity?.status === 'ready' ? 'Member' : `Member · ${individualProfile.worldLabel}`}
        navItems={navItems}
        activeNav={activeNav}
      />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route index element={<IndividualHome />} />
          <Route path="plan" element={<Plan />} />
          <Route path="discover" element={<Discover />} />
          <Route path="learn" element={<Learn />} />
          <Route path="history" element={<History />} />
          <Route path="team" element={<Team />} />
          <Route path="give" element={<GiveScreen />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="cohort" element={<CohortView />} />
          <Route path="*" element={<Navigate to={basePath} replace />} />
        </Routes>
      </div>
    </div>
  );
}

function IndividualHome() {
  const navigate = useNavigate();
  const basePath = useBasePath();
  // TWO distinct questions, deliberately not merged (see useFixtureIsolated.js):
  //   appIdentity      — demo affordance; gates the "Restore Marcus's demo
  //                      profile" button below, which is correctly demo-only.
  //   fixtureIsolated  — isolation; gates fixture content that has no
  //                      authenticated source (the cohort callout).
  // Same predicate today; different reasons. Keep them apart.
  const appIdentity = useOptionalAppIdentity();
  const fixtureIsolated = useFixtureIsolated();
  const [showAllGifts, setShowAllGifts] = useState(false);
  const { answers, gifts, givingStyle, worldLabel, resetIntake, loadDemo, intakeComplete } = useIntake();

  const total = gifts.reduce((sum, g) => sum + g.amount, 0);
  const orgCount = new Set(gifts.map(g => g.org)).size;
  const hasGifts = gifts.length > 0;
  const visibility = visibilityInsights[answers.visibility] || visibilityInsights.private;
  const visibleGifts = showAllGifts ? gifts : gifts.slice(0, 3);

  // Variant-aware Home content
  const fundingSpotlight = getFundingSpotlight(answers.causes || []);
  const microLearning = getMicroLearning(hasGifts);

  const causeLabels = (answers.causes || []).map(id => {
    const found = CAUSES.find(c => c.id === id);
    return found ? { id, label: found.label } : { id, label: id };
  });

  // Show celebration callout for first-step new users (no gifts yet)
  const isFirstStep = answers.existingOrgs?.includes('first step') ||
                      answers.existingOrgs?.includes("haven't given");
  const showWelcome = !hasGifts && isFirstStep;
  const welcomeMsg = deriveCelebration(answers);

  const paths = [];
  if (hasGifts) {
    paths.push({
      title: 'See your giving picture',
      desc: `$${total.toLocaleString()} given to ${orgCount} ${orgCount === 1 ? 'organization' : 'organizations'}. Here's where you are.`,
      action: () => navigate(`${basePath}/history`),
      tone: 'reflect',
    });
  } else {
    paths.push({
      title: 'Sit with your giving plan',
      desc: 'You built your compass. Read it, share it, or just let it settle.',
      action: () => navigate(`${basePath}/plan`),
      tone: 'reflect',
    });
  }

  paths.push({
    title: 'Learn something new',
    desc: 'A short lesson on giving smarter. 2–3 minutes, no homework.',
    action: () => navigate(`${basePath}/learn`),
    tone: 'learn',
  });

  paths.push({
    title: 'Explore organizations',
    desc: `See what's out there — matched to ${causeLabels[0]?.label?.toLowerCase() || 'what you care about'}.`,
    action: () => navigate(`${basePath}/discover`),
    tone: 'act',
  });

  if (hasGifts) {
    paths.push({
      title: 'Log another gift',
      desc: '10 seconds. Keep your giving record growing.',
      action: () => navigate(`${basePath}/give`),
      tone: 'act',
    });
  } else {
    paths.push({
      title: 'Log a gift',
      desc: 'Add any giving you\'ve already made — even small ones count.',
      action: () => navigate(`${basePath}/give`),
      tone: 'act',
    });
  }

  const restartOnboarding = () => {
    resetIntake();
    navigate(`${basePath}/welcome`, { replace: true });
  };

  return (
    <main style={{
      maxWidth: '880px',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
    }}>
      {/* Celebration callout — only for new users at first step */}
      {showWelcome && (
        <Card padding="lg" style={{
          marginBottom: 'var(--sh-space-3)',
          background: 'var(--sh-bronze-tint)',
          borderColor: 'var(--sh-bronze-border)',
          borderLeft: '3px solid var(--sh-bronze)',
        }}>
          <p style={{
            fontSize: '10px',
            color: 'var(--sh-bronze-deep)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 600,
            marginBottom: 'var(--sh-space-2)',
          }}>
            Welcome
          </p>
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-text-primary)',
            lineHeight: 1.55,
          }}>
            {welcomeMsg}
          </p>
        </Card>
      )}

      {/* Identity anchor */}
      <Card style={{ marginBottom: 'var(--sh-space-3)' }}>
        <div style={{
          display: 'inline-block',
          padding: '5px 14px',
          borderRadius: 'var(--sh-radius-full)',
          background: 'var(--sh-bronze-tint)',
          color: 'var(--sh-bronze-deep)',
          fontSize: 'var(--sh-text-xs)',
          fontWeight: 600,
          marginBottom: 'var(--sh-space-3)',
          letterSpacing: '0.02em',
        }}>
          {givingStyle || 'Intentional Giver'}
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: 'var(--sh-space-3)',
        }}>
          {causeLabels.map(c => (
            <Tag key={c.id}>{c.label}</Tag>
          ))}
        </div>
        {answers.geoDetail && (
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
          }}>
            {answers.geoDetail}
          </p>
        )}
      </Card>

      {/* Cohort callout — quiet entry into the member-side cohort view.
          P-3a: DEMO-ONLY. "You're part of a cohort" is an assertion, and on the
          authenticated tree it is false — /api/me emits cohorts only inside the
          advisor block (me.js:358, gated to type==='advisor'), so a signed-in
          individual has no cohort. CohortView itself now renders an honest
          absent state for that user; leaving this callout ungated would put the
          claim "You're part of a cohort" one click from "You're not part of a
          cohort yet." The callout is REMOVED rather than replaced with an
          absent-state line: Home should not advertise a section with nothing in
          it. P-3b-1 routed this through the shared useFixtureIsolated() helper;
          the behaviour is the one shipped and verified live in P-3a. */}
      {!fixtureIsolated && (
        <Card
          interactive
          onClick={() => navigate(`${basePath}/cohort`)}
          style={{
            marginBottom: 'var(--sh-space-3)',
            cursor: 'pointer',
          }}
        >
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            fontWeight: 600,
            color: 'var(--sh-text-primary)',
            marginBottom: '2px',
          }}>
            You're part of a cohort →
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
          }}>
            Athletes working on a giving practice together.
          </p>
        </Card>
      )}

      {/* Living pulse stats */}
      {hasGifts ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 'var(--sh-space-2)',
          marginBottom: 'var(--sh-space-3)',
        }}>
          <PulseCard
            value={`$${total.toLocaleString()}`}
            label="Given this year"
            primary
          />
          <PulseCard
            value={orgCount}
            label={orgCount === 1 ? 'Organization' : 'Organizations'}
          />
          <PulseCard
            value={gifts.length}
            label={gifts.length === 1 ? 'Gift logged' : 'Gifts logged'}
          />
        </div>
      ) : (
        <Card tint style={{ marginBottom: 'var(--sh-space-3)' }}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}>
            Your giving picture starts here. When you log your first gift, it'll begin tracking your year.
          </p>
        </Card>
      )}

      {/* Giving history */}
      {hasGifts && (
        <div style={{ marginBottom: 'var(--sh-space-5)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--sh-space-2)',
          }}>
            <SectionLabel>Giving history</SectionLabel>
            {gifts.length > 3 && (
              <button
                onClick={() => setShowAllGifts(!showAllGifts)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--sh-bronze)',
                  fontSize: 'var(--sh-text-xs)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showAllGifts ? 'Show less' : `View all ${gifts.length}`}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {visibleGifts.map(g => (
              <GiftRow key={g.id} gift={g} />
            ))}
          </div>
        </div>
      )}

      {/* Paths forward */}
      <div style={{ marginBottom: 'var(--sh-space-5)' }}>
        <SectionLabel>When you're ready</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-2)' }}>
          {paths.map((p, i) => (
            <PathCard key={i} path={p} />
          ))}
        </div>
      </div>

      {/* Worth knowing */}
      <Card tint style={{ marginBottom: 'var(--sh-space-3)' }}>
        <p style={{
          fontSize: '10px',
          color: 'var(--sh-bronze)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          marginBottom: 'var(--sh-space-2)',
        }}>
          Worth knowing
        </p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-body)',
          lineHeight: 1.6,
        }}>
          {microLearning}
        </p>
      </Card>

      {/* Visibility insight */}
      <Card style={{ marginBottom: 'var(--sh-space-3)' }}>
        <p style={{
          fontSize: '10px',
          color: 'var(--sh-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          marginBottom: 'var(--sh-space-2)',
        }}>
          {visibility.title}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-body)',
          lineHeight: 1.6,
        }}>
          {visibility.text}
        </p>
      </Card>

      {/* Funding spotlight */}
      <Card style={{
        marginBottom: 'var(--sh-space-3)',
        borderTop: '2px solid var(--sh-bronze)',
      }}>
        <p style={{
          fontSize: '10px',
          color: 'var(--sh-bronze-deep)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          marginBottom: 'var(--sh-space-2)',
        }}>
          Funding spotlight
        </p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-body)',
          lineHeight: 1.6,
          marginBottom: 'var(--sh-space-2)',
        }}>
          {fundingSpotlight.text}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          fontStyle: 'italic',
        }}>
          Source:{' '}
          <a
            href={fundingSpotlight.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--sh-bronze)',
              textDecoration: 'underline',
            }}
          >
            {fundingSpotlight.source}
          </a>
        </p>
      </Card>

      {/* Share feedback */}
      <Card
        interactive
        onClick={() => navigate(`${basePath}/feedback`)}
        style={{
          marginTop: 'var(--sh-space-3)',
          marginBottom: 'var(--sh-space-3)',
          cursor: 'pointer',
        }}
      >
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          fontWeight: 600,
          color: 'var(--sh-text-primary)',
          marginBottom: '2px',
        }}>
          Share feedback
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
        }}>
          Help us build StewardHouse right — takes 2 minutes
        </p>
      </Card>

      {/* Gentle close */}
      <p style={{
        textAlign: 'center',
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        marginTop: 'var(--sh-space-6)',
        marginBottom: 'var(--sh-space-4)',
      }}>
        No rush. Your giving plan is here whenever you need it.
      </p>

      <p style={{
        textAlign: 'center',
        marginTop: 'var(--sh-space-4)',
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--sh-space-4)',
        flexWrap: 'wrap',
      }}>
        {!intakeComplete && (
          <button
            onClick={restartOnboarding}
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
            See the new-user onboarding flow →
          </button>
        )}
        {gifts.length === 0 && !appIdentity && (
          <button
            onClick={loadDemo}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--sh-bronze)',
              fontSize: 'var(--sh-text-xs)',
              fontStyle: 'italic',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: 'inherit',
              padding: 0,
            }}
          >
            ← Restore Marcus's demo profile
          </button>
        )}
      </p>
    </main>
  );
}

function PulseCard({ value, label, primary }) {
  if (primary) {
    return (
      <div style={{
        background: 'var(--sh-bronze)',
        borderRadius: 'var(--sh-radius-lg)',
        padding: 'var(--sh-space-4)',
      }}>
        <p style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: '#FFFFFF',
          fontWeight: 400,
          marginBottom: '2px',
        }}>
          {value}
        </p>
        <p style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.75)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 500,
        }}>
          {label}
        </p>
      </div>
    );
  }

  return (
    <Card padding="sm">
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        marginBottom: '2px',
      }}>
        {value}
      </p>
      <p style={{
        fontSize: '10px',
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 500,
      }}>
        {label}
      </p>
    </Card>
  );
}

function GiftRow({ gift }) {
  const meta = [];
  if (gift.type && gift.type !== 'unrestricted') meta.push(gift.type);
  if (gift.vehicle && gift.vehicle !== 'personal') {
    meta.push(gift.vehicle === 'daf' ? 'DAF' : 'Community Foundation');
  }
  if (gift.recurring) meta.push('Recurring');
  const metaString = [gift.date, ...meta].join(' · ');

  return (
    <div style={{
      background: 'var(--sh-card)',
      border: 'var(--sh-border-thin)',
      borderRadius: 'var(--sh-radius-md)',
      padding: 'var(--sh-space-3) var(--sh-space-4)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 'var(--sh-space-3)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-primary)',
          fontWeight: 500,
          marginBottom: '2px',
        }}>
          {gift.org}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
        }}>
          {metaString}
        </p>
      </div>
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-lg)',
        color: 'var(--sh-bronze-deep)',
        fontWeight: 400,
      }}>
        ${gift.amount.toLocaleString()}
      </p>
    </div>
  );
}

function PathCard({ path }) {
  const [hovered, setHovered] = useState(false);

  const toneColors = {
    reflect: { bg: 'var(--sh-bg-tint)', border: 'var(--sh-card-border)' },
    learn: { bg: '#FBF5E5', border: '#E8DDB8' },
    act: { bg: 'var(--sh-bronze-tint)', border: 'var(--sh-bronze-border)' },
  };
  const tone = toneColors[path.tone] || toneColors.reflect;

  return (
    <div
      onClick={path.action}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: tone.bg,
        border: `1px solid ${hovered ? 'var(--sh-bronze)' : tone.border}`,
        borderRadius: 'var(--sh-radius-lg)',
        padding: 'var(--sh-space-4) var(--sh-space-5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--sh-space-4)',
        cursor: 'pointer',
        transition: 'all 180ms ease',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hovered ? '0 4px 12px rgba(60, 50, 30, 0.05)' : 'none',
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-primary)',
          fontWeight: 500,
          marginBottom: '2px',
        }}>
          {path.title}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-secondary)',
          lineHeight: 1.5,
        }}>
          {path.desc}
        </p>
      </div>
      <span style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-bronze)',
        transform: hovered ? 'translateX(2px)' : 'translateX(0)',
        transition: 'transform 180ms ease',
      }}>
        →
      </span>
    </div>
  );
}
