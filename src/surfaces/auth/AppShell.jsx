import { useCallback, useEffect, useState } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { AppIdentityProvider } from '../../contexts/AppIdentityContext.jsx';
import { Button } from '../../components/Button.jsx';

// Shell for the entire authenticated /app/* tree. Fetches /api/me ONCE per
// mount when that fetch succeeds, plus up to five bounded retries when it
// fails, and makes the result available to every child route via
// AppIdentityContext — so a redirect from the dispatcher to a type-specific
// surface (e.g. /app/individual) doesn't require a second fetch, and Chrome
// can read real identity instead of a hardcoded fixture.
//
// identity shape: { type, displayName, email, intake, gifts, scenarios, athlete?, advisor?, enterprise? } | null
// — intake is the user's persisted intake answers from
// person.extensions.individual (null for fresh users); gifts and scenarios
// are the arrays of the user's gift records and saved GivingModeler
// scenarios (each empty [] for fresh users who haven't logged/saved any).
// advisor is present ONLY for type='advisor' users, carrying
// { practiceProfile, practiceLessons, docCategories, cohorts } from the
// slim-scope /api/me widening. AdvisorSurface folds practiceLessons +
// docCategories directly into its own PracticeContentProvider +
// DocumentationProvider as initialState (fold-in shape — no wrapping
// authenticated provider). Chrome identity swap also reads from here
// (displayName + advisor.practiceProfile.advisorTitle).

// Retry ladder for a failed /api/me, one rung per retry, consumed in order:
// the initial call is attempt 0, and RETRY_DELAYS_MS[n] is the wait
// scheduled after attempt n fails. Six attempts total, the initial fetch
// plus five retries. When the ladder is exhausted the panel stops on its
// terminal branch and nothing further happens automatically; only Try again
// restarts it, by resetting attempt to 0.
//
// THE CUMULATIVE ~31s IS THE POINT, AND IT IS RULED. Do not trim this
// ladder to make the panel settle sooner. The BMF import window was
// MEASURED at 14,359 to 17,647 ms, and 1+2+4+8+16 clears the upper bound
// with margin. A shorter ladder caps BELOW that bound, which puts the
// worst-case user on the terminal panel while the import is still running,
// and that is the outcome the ladder exists to prevent. Anything that
// shortens it has to answer the window first.
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000];

export default function AppShell() {
  // status: 'loading' | 'ready' | 'unauthenticated' | 'unavailable'.
  //
  // 'unavailable' is INTERNAL and never user-facing. SignIn.jsx:101 renders
  // "Sign-in is temporarily unavailable" for a different failure, and the
  // panel copy below deliberately shares no phrase with it, so a user who
  // meets both can tell them apart. Do NOT derive user-facing text from
  // this identifier.
  const [status, setStatus] = useState('loading');
  const [identity, setIdentity] = useState(null);
  // reason: 'server' | 'unreachable' | null. Only meaningful while status
  // is 'unavailable'; it selects which of the four copy pairs renders.
  const [reason, setReason] = useState(null);
  // attempt: 0-based index into RETRY_DELAYS_MS. Incrementing it re-runs
  // the fetch effect, which is why it sits in that effect's dependency
  // array rather than being held in a ref.
  const [attempt, setAttempt] = useState(0);

  // Practice-profile write-through: PUT /api/practice-profile succeeds,
  // caller passes the 3-field response into this updater, and PracticeHome
  // + Chrome re-render off the same context state without a refetch.
  // Called only from PracticeSettings.jsx save handler on the auth tree.
  // Declared BEFORE early returns to satisfy Rules of Hooks.
  const updatePracticeProfile = useCallback((profile) => {
    setIdentity((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        advisor: {
          ...(prev.advisor || {}),
          practiceProfile: profile,
        },
      };
    });
  }, []);

  // Athlete-consent write-through (C-3b): POST /api/athlete-consent succeeds,
  // the interstitial passes the chosen mode here, and IndividualSurface's
  // consent gate (identity.athlete.managementMode === null) closes without a
  // refetch — the surface renders. Mirrors updatePracticeProfile. No-op when
  // the identity carries no athlete block (ordinary individuals never reach it).
  const updateAthleteConsent = useCallback((mode) => {
    setIdentity((prev) => {
      if (!prev || !prev.athlete) return prev;
      return {
        ...prev,
        athlete: { ...prev.athlete, managementMode: mode },
      };
    });
  }, []);

  // P-7 OBJECTION, ANSWERED HERE SO IT IS NOT RE-ARGUED. P-7 rejected
  // refetching /api/me on cost, but that ruling was about POLLING:
  // continuous, for every user, forever, to learn one boolean. This runs
  // only after the shell has already failed, at most five more times, and
  // it is the only way a user gets back in without acting. P-7 does not
  // bind it.
  //
  // REASON MAPPING, in evaluation order.
  //
  //   fetch() throws            -> 'unreachable'. The request never landed.
  //   !res.ok                   -> 'server', returning BEFORE json() runs.
  //   res.ok, res.json() throws -> 'server'.
  //
  // A 2xx that will not parse maps to 'server', not 'unreachable': the
  // request arrived and the server answered, only the answer was unusable.
  // The production cause is a failed Functions deploy, which serves the
  // static index.html fallback for /api/me (200, text/html). That is the
  // same shape as plain vite in local dev, so this branch is exercised
  // every dev session rather than only in an incident. Do NOT narrow the
  // reasoning to "the handler threw": under this path me.js never executes
  // at all. What makes 'server' correct for both paths is the endpoint's
  // response inventory. me.js constructs exactly two responses (:46-49 and
  // :578-581), both 200 and both parseable JSON, and those two are the only
  // responses carrying a session verdict.
  //
  // The parse call therefore sits in its OWN guard. A single try wrapping
  // both the fetch and the json() would collapse the distinction the
  // mapping exists to make.
  useEffect(() => {
    let cancelled = false;
    let timer = null;

    function fail(nextReason) {
      setReason(nextReason);
      setStatus('unavailable');
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay === undefined) return;
      timer = setTimeout(() => {
        if (!cancelled) setAttempt((n) => n + 1);
      }, delay);
    }

    async function load() {
      let res;
      try {
        res = await fetch('/api/me', { credentials: 'include' });
      } catch {
        if (!cancelled) fail('unreachable');
        return;
      }
      if (cancelled) return;
      if (!res.ok) {
        fail('server');
        return;
      }
      let data;
      try {
        data = await res.json();
      } catch {
        if (!cancelled) fail('server');
        return;
      }
      if (cancelled) return;
      // UNCHANGED, and load-bearing. me.js:46-49 answers an unauthenticated
      // caller with the literal body `null` at status 200, which parses
      // cleanly. That is a legitimate verdict rather than a failure, so it
      // must reach the else below and not any 'unavailable' path.
      if (data && data.user) {
        setIdentity({
          type: data.person?.type ?? null,
          displayName: data.person?.displayName ?? null,
          email: data.user.email,
          intake: data.person?.intake ?? null,
          gifts: data.person?.gifts ?? [],
          scenarios: data.person?.scenarios ?? [],
          // athlete is present ONLY for an individual who is also a linked
          // athlete (C-3a /api/me emission); null for ordinary individuals.
          // Drives IndividualSurface's one-time consent interstitial (C-3b).
          athlete: data.person?.athlete ?? null,
          advisor: data.person?.advisor ?? null,
          enterprise: data.person?.enterprise ?? null,
        });
        setReason(null);
        setStatus('ready');
      } else {
        setStatus('unauthenticated');
      }
    }

    load();

    // Cleanup clears the pending rung as well as flagging cancellation.
    // This is the one new correctness obligation the ladder creates: a
    // timer surviving unmount, or surviving a success, is how this shape
    // breaks. It would fire setAttempt against a dead component, or
    // re-enter the ladder underneath an already-rendered surface.
    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
    };
  }, [attempt]);

  // BFCACHE FIX. After sign-out we hard-navigate to /signin; the browser
  // can back-restore an authenticated /app/* page from its back-forward
  // cache — the JS heap is FROZEN and reused, so useEffect above does NOT
  // re-run, our /api/me call never fires again, and the stale identity
  // (button stuck at "Signing out…") stays visible. Dead session, live UI.
  //
  // Standard remedy: listen for `pageshow` with `event.persisted === true`
  // (the bfcache-restore signal per HTML spec / MDN) and force a real
  // reload. Reload evicts the frozen page and re-mounts AppShell, which
  // re-runs the /api/me effect, sees the dead cookie, and Navigate-bounces
  // to /signin. Narrower mitigations considered — a manual event listener
  // watching for storage change won't fire on same-origin; a Cache-Control
  // `no-store` header on /app/* would block bfcache at the request layer
  // but requires a server response header we don't currently set. Reload
  // is the correct fix at the app boundary; docblock this so a future
  // reader understands why we intentionally invalidate the bfcache.
  useEffect(() => {
    function onPageShow(event) {
      if (event.persisted) window.location.reload();
    }
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--sh-bg)',
        color: 'var(--sh-text-muted)',
        fontSize: 'var(--sh-text-sm)',
      }}>
        Checking your session…
      </div>
    );
  }

  // EARLY RETURN, NOT A PROVIDER MOUNT. Roughly 35 sites test
  // !!useOptionalAppIdentity(), so provider presence is today equivalent to
  // status === 'ready'. Mounting the provider at 'unavailable' would break
  // that equivalence silently, everywhere at once: AppDispatcher.jsx:23
  // would render "we couldn't match it to a pilot account" during an
  // outage, and useFixtureIsolated() would isolate every fixture with
  // nothing to put in its place. A later refactor toward "mount the
  // provider and let children decide" looks like a tidy-up and is not one.
  //
  // A developer meeting this panel in local dev on plain vite is looking at
  // a guaranteed 'server' failure: vite serves index.html for /api/me and
  // never runs functions/ at all. Start the Pages dev server instead.
  if (status === 'unavailable') {
    const retrying = attempt < RETRY_DELAYS_MS.length;
    const title = reason === 'unreachable'
      ? "We couldn't reach the server"
      : "We couldn't load your account";
    let message;
    if (retrying) {
      message = reason === 'unreachable'
        ? 'Check your connection. Trying again…'
        : 'Something went wrong on our end. Trying again…';
    } else {
      message = reason === 'unreachable'
        ? 'Check your connection and try again.'
        : 'Something went wrong on our end. This is not a problem with your sign-in.';
    }
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--sh-bg)',
        padding: 'var(--sh-space-8)',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-xl)',
          color: 'var(--sh-text-primary)',
          margin: 0,
          marginBottom: 'var(--sh-space-2)',
        }}>
          {title}
        </h1>
        <p style={{
          maxWidth: '400px',
          margin: 0,
          fontSize: 'var(--sh-text-sm)',
          lineHeight: 'var(--sh-line-normal)',
          color: 'var(--sh-text-muted)',
        }}>
          {message}
        </p>
        {!retrying && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sh-space-3)',
            marginTop: 'var(--sh-space-5)',
          }}>
            <Button variant="secondary" type="button" onClick={() => setAttempt(0)}>
              Try again
            </Button>
            <span aria-hidden="true" style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-muted)',
            }}>
              ·
            </span>
            {/*
              CLIENT-SIDE <Link>, DELIBERATELY. /signin is a route in this
              same router (App.jsx:29) with no code splitting, so SignIn is
              already in the loaded bundle and this renders with the network
              gone. An <a href> or a window.location assignment is a document
              request and fails in exactly the state this branch exists for.
              AppIdentityContext.jsx:45 uses window.location.href and is NOT
              the idiom to copy: that is sign-out, where dropping provider
              state is the point. Chrome.jsx:183-184 is the idiom.
            */}
            <Link to="/signin" style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
              textDecoration: 'underline',
            }}>
              Sign in again
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/signin" replace />;
  }

  return (
    <AppIdentityProvider
      status={status}
      identity={identity}
      updatePracticeProfile={updatePracticeProfile}
      updateAthleteConsent={updateAthleteConsent}
    >
      <Outlet />
    </AppIdentityProvider>
  );
}
