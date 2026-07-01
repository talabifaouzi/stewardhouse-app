import { createContext, useContext } from 'react';

// Identity context for the authenticated /app/* tree. Populated once by
// AppShell (a single /api/me fetch) and read by any descendant that needs
// to know who's signed in and what type of user they are — the dispatcher,
// Chrome (for display), and any future type-specific surface.
//
// status: 'loading' | 'ready' | 'unauthenticated'
// identity: { type, displayName, email, intake, gifts, scenarios } | null — only non-null when status is 'ready'

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
