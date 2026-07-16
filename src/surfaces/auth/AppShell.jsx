import { useCallback, useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AppIdentityProvider } from '../../contexts/AppIdentityContext.jsx';

// Shell for the entire authenticated /app/* tree. Fetches /api/me exactly
// ONCE per mount and makes the result available to every child route via
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

export default function AppShell() {
  const [status, setStatus] = useState('loading');
  const [identity, setIdentity] = useState(null);

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

  useEffect(() => {
    let cancelled = false;
    fetch('/api/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
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
          setStatus('ready');
        } else {
          setStatus('unauthenticated');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('unauthenticated');
      });
    return () => { cancelled = true; };
  }, []);

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
