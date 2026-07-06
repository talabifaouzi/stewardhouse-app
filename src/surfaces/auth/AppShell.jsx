import { useCallback, useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AppIdentityProvider } from '../../contexts/AppIdentityContext.jsx';

// Shell for the entire authenticated /app/* tree. Fetches /api/me exactly
// ONCE per mount and makes the result available to every child route via
// AppIdentityContext — so a redirect from the dispatcher to a type-specific
// surface (e.g. /app/individual) doesn't require a second fetch, and Chrome
// can read real identity instead of a hardcoded fixture.
//
// identity shape: { type, displayName, email, intake, gifts, scenarios, advisor? } | null
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
            advisor: data.person?.advisor ?? null,
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
    <AppIdentityProvider status={status} identity={identity} updatePracticeProfile={updatePracticeProfile}>
      <Outlet />
    </AppIdentityProvider>
  );
}
