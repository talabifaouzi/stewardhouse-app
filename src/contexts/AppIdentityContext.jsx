import { createContext, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Identity context for the authenticated /app/* tree. Populated once by
// AppShell (a single /api/me fetch) and read by any descendant that needs
// to know who's signed in and what type of user they are — the dispatcher,
// Chrome (for display), and any future type-specific surface.
//
// status: 'loading' | 'ready' | 'unauthenticated'
// identity: { type, displayName, email, intake, gifts, scenarios, advisor?, enterprise? } | null — only non-null when status is 'ready'; advisor sub-block present only when type='advisor', enterprise sub-block only when type='staff'

const AppIdentityContext = createContext(null);

// Shared sign-out helper. POSTs to better-auth's sign-out endpoint (kills
// the session row server-side via internalAdapter.deleteSession + emits an
// expired Set-Cookie to clear the browser cookie), then hard-navigates to
// /signin so all provider state drops — no stale identity in memory, no
// SPA-cache lingering after the session is dead.
//
// finally-branch hard-nav: even if fetch throws or the cookie couldn't be
// cleared (network drop, etc), we STILL navigate to /signin. From the
// user's perspective, a click on Sign out that leaves them on an
// authenticated surface is a worse failure than a client-only nav; the
// server session may survive, but it's Q-3-minutes stale and the /signin
// visit will overwrite the cookie on next successful auth.
export async function performSignOut() {
  try {
    // Content-Type header is REQUIRED — better-auth's sign-out endpoint has
    // `requireHeaders: true` and rejects any request without
    // `Content-Type: application/json` with 415 UNSUPPORTED_MEDIA_TYPE.
    // Verified against
    // node_modules/better-auth/dist/api/routes/sign-out.mjs and reproduced
    // in the slice smoke — omitting the header lets the browser send the
    // fetch but the server refuses to touch the session, leaving a dead
    // affordance from the user's point of view.
    await fetch('/api/auth/sign-out', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  } catch {
    // Swallow — hard-nav below is the durable exit.
  } finally {
    window.location.href = '/signin';
  }
}

export function AppIdentityProvider({ status, identity, updatePracticeProfile, children }) {
  return (
    <AppIdentityContext.Provider value={{ status, identity, updatePracticeProfile, signOut: performSignOut }}>
      {children}
    </AppIdentityContext.Provider>
  );
}

export function useAppIdentity() {
  const ctx = useContext(AppIdentityContext);
  if (!ctx) {
    throw new Error('useAppIdentity must be used within AppIdentityProvider (i.e. inside the /app/* tree)');
  }
  return ctx;
}

// Safe variant of useAppIdentity for components that render on BOTH the
// public demo tree (no AppIdentityProvider ancestor) and the authenticated
// /app/* tree (has one). Returns null instead of throwing when used outside
// a provider — useContext itself never throws; it returns createContext's
// default (null) when there's no matching Provider ancestor, so no
// try/catch is needed (unlike useAppIdentity's manual throw-on-missing
// check). Second consumer of this exact pattern (after IndividualSurface.jsx's
// local version, extracted here) — crosses the #47/#57 threshold for shared
// extraction since the logic is byte-identical across both consumers.
export function useOptionalAppIdentity() {
  return useContext(AppIdentityContext);
}

// Route-level type guard for /app/individual and /app/advisor. Closes the
// parked defect where an authenticated wrong-type visitor (e.g. an
// individual signed in and navigating directly to /app/advisor) would see
// the fixture-seeded surface instead of being bounced to their own. Wraps
// each type-specific /app/* route element in App.jsx symmetrically.
//
// GUARD, NOT A PROVIDER. This wrapper reads AppIdentityContext (which
// AppShell already provides one level up) and passes children through
// verbatim — it does NOT mount its own AppIdentityProvider. The slice-1
// fold-in lesson (nearest-ancestor context resolution silently shadowing
// an outer seed) is therefore not in play here: no parallel provider
// exists to shadow anything, and children read the same context AppShell
// established.
//
// Loading branch is defensive-only. AppShell's own gate does not render
// <Outlet /> while status is 'loading' — it renders "Checking your
// session…" and blocks all descendants — so this branch is unreachable
// today. It stays as a documented safety net in case AppShell's gating
// logic ever changes; a premature Navigate on an in-flight /api/me
// would bounce valid users.
//
// Unauthenticated case is already handled upstream by AppShell (redirects
// to /signin before children mount), so we only need to distinguish the
// wrong-type case here (Navigate to /app so AppDispatcher re-routes to
// the correct surface).
export function RequireType({ type, children }) {
  const { status, identity } = useAppIdentity();
  if (status !== 'ready') {
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
  if (identity?.type !== type) {
    return <Navigate to="/app" replace />;
  }
  return children;
}

// Mount-aware base-path derivation. Surfaces mounted at both a public
// demo route (e.g. /advisor/*) AND an authenticated route (e.g.
// /app/advisor/*) can call this hook to get the right prefix for
// navigate() / <Link to> without hardcoding either. Extracted here from
// the Individual-scoped private hook at surfaces/individual/useBasePath.js
// on the second-consumer threshold — Advisor's §6.11 path-fix slice adds
// 48 call sites across 13 files, crossing the #47/#57 threshold.
// Individual's original file remains as a thin no-arg delegate so its 10
// consumers do not change. See CLAUDE.md's authenticated-surface path
// audit rule.
//
// Usage:
//   const basePath = useBasePath('/advisor', '/app/advisor');
//   navigate(`${basePath}/clients`);
export function useBasePath(demoBase, appBase) {
  const location = useLocation();
  return location.pathname.startsWith(appBase) ? appBase : demoBase;
}
