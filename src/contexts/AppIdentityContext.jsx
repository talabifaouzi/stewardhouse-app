import { createContext, useContext } from 'react';

// Identity context for the authenticated /app/* tree. Populated once by
// AppShell (a single /api/me fetch) and read by any descendant that needs
// to know who's signed in and what type of user they are — the dispatcher,
// Chrome (for display), and any future type-specific surface.
//
// status: 'loading' | 'ready' | 'unauthenticated'
// identity: { type, displayName, email, intake, gifts } | null — only non-null when status is 'ready'

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
