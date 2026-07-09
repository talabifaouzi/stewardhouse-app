import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { athletes as athletesFixture } from '../data/enterpriseFixtures.js';

// Enterprise athlete-roster provider — ClientsProvider mirror, now with the
// roster-add write-through (E-Slice E-Write-1). Read-only paths unchanged.
//
// Fold-in signal (advisor convention): initialState !== undefined ↔
// authenticated. Demo tree passes undefined → the fixture roster (16 Cooper
// State athletes); actions stay sync-local, no fetch fires. Authenticated tree
// passes the /api/me institution roster ([] until athletes are enrolled) →
// add() POSTs to /api/athletes and splices the response. The mount site
// (EnterpriseSurface) keys initialState on identity TYPE ('staff'), never on
// data — the advisor defensive-seam lesson.
//
// Newly-enrolled athletes are spliced to the FRONT to match /api/me's
// `ORDER BY created_at DESC` (newest first).

const AthletesContext = createContext(null);

async function serverError(res, fallback) {
  try {
    const body = await res.json();
    return body?.error || fallback;
  } catch { return fallback; }
}

export function AthletesProvider({ initialState, children }) {
  const authenticated = initialState !== undefined;
  const [athletes, setAthletes] = useState(authenticated ? initialState : athletesFixture);
  const [writeError, setWriteError] = useState(null);

  const clearWriteError = useCallback(() => setWriteError(null), []);

  const add = useCallback(async (athlete) => {
    if (!authenticated) {
      // Demo tree: sync-local, no fetch. The Add affordance is
      // authenticated-only, so this branch is not reached in practice — kept
      // for the ClientsProvider-mirror shape.
      setAthletes((prev) => [athlete, ...prev]);
      return athlete;
    }
    try {
      const res = await fetch('/api/athletes', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(athlete),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to enroll athlete'));
      const saved = await res.json();
      setAthletes((prev) => [saved, ...prev]);
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to enroll athlete');
      return null;
    }
  }, [authenticated]);

  const remove = useCallback(async (id) => {
    if (!authenticated) {
      // Demo tree: sync-local splice, no fetch (mirror shape; the Remove
      // affordance is authenticated-only, so not reached in practice).
      setAthletes((prev) => prev.filter((a) => a.id !== id));
      return true;
    }
    try {
      const res = await fetch(`/api/athletes/${encodeURIComponent(id)}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to remove athlete'));
      // Anonymize-to-stub: the row survives in D1 as a Sunset stub but leaves
      // the active roster (matching /api/me's Sunset exclusion). Splice it out.
      setAthletes((prev) => prev.filter((a) => a.id !== id));
      setWriteError(null);
      return true;
    } catch (err) {
      setWriteError(err.message || 'Failed to remove athlete');
      return false;
    }
  }, [authenticated]);

  const value = useMemo(
    () => ({ athletes, add, remove, writeError, clearWriteError }),
    [athletes, add, remove, writeError, clearWriteError],
  );

  return (
    <AthletesContext.Provider value={value}>
      {children}
    </AthletesContext.Provider>
  );
}

export function useAthletes() {
  const ctx = useContext(AthletesContext);
  if (!ctx) {
    throw new Error('useAthletes must be used inside AthletesProvider');
  }
  return ctx;
}
