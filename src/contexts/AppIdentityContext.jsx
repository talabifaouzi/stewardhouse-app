import { createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';

// Identity context for the authenticated /app/* tree. Populated once by
// AppShell (a single /api/me fetch) and read by any descendant that needs
// to know who's signed in and what type of user they are — the dispatcher,
// Chrome (for display), and any future type-specific surface.
//
// status: 'loading' | 'ready' | 'unauthenticated'
// identity: { type, displayName, email, intake, gifts, scenarios, advisor? } | null — only non-null when status is 'ready'; advisor sub-block present only when type='advisor'

const AppIdentityContext = createContext(null);

export function AppIdentityProvider({ status, identity, children }) {
  return (
    <AppIdentityContext.Provider value={{ status, identity }}>
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
