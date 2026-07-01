import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AppIdentityProvider } from '../../contexts/AppIdentityContext.jsx';

// Shell for the entire authenticated /app/* tree. Fetches /api/me exactly
// ONCE per mount and makes the result available to every child route via
// AppIdentityContext — so a redirect from the dispatcher to a type-specific
// surface (e.g. /app/individual) doesn't require a second fetch, and Chrome
// can read real identity instead of a hardcoded fixture.
//
// identity shape: { type, displayName, email, intake } | null — intake is
// the user's persisted intake answers from person.extensions.individual,
// null for fresh users who haven't answered anything yet.

export default function AppShell() {
  const [status, setStatus] = useState('loading');
  const [identity, setIdentity] = useState(null);

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
    <AppIdentityProvider status={status} identity={identity}>
      <Outlet />
    </AppIdentityProvider>
  );
}
