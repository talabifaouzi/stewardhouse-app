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
      // C-2: `invite` ('sent'|'skipped'|'skipped-other-account'|'failed') is a per-request outcome, not
      // a roster field — strip it before splicing, but return the full body so
      // the form can surface the invite outcome.
      const { invite, ...element } = saved;
      setAthletes((prev) => [element, ...prev]);
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to enroll athlete');
      return null;
    }
  }, [authenticated]);

  // P-2 Stage D: milestone write-through. Auth tree PUTs to /api/athletes/:id
  // and replaces the athlete in state by id from the server's returned element;
  // demo tree merges the patch sync-local (mirror shape — the edit affordance is
  // authenticated-only, so the demo branch is not reached in practice).
  const update = useCallback(async (id, patch) => {
    if (!authenticated) {
      setAthletes((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
      return true;
    }
    try {
      const res = await fetch(`/api/athletes/${encodeURIComponent(id)}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to record progression'));
      const saved = await res.json();
      setAthletes((prev) => prev.map((a) => (a.id === id ? saved : a)));
      setWriteError(null);
      return true;
    } catch (err) {
      setWriteError(err.message || 'Failed to record progression');
      return false;
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

  // Roster import (roster-import arc). Unlike add/update/remove this returns a
  // RESULT OBJECT rather than a boolean, because a rejected import carries
  // per-row detail the caller has to render: the endpoint's 400 body is
  // { error, rejected: [{index, reason}] } and those indices are only meaningful
  // to the client that built the array. serverError() is not used here for the
  // same reason — it extracts body.error and discards body.rejected.
  const importAthletes = useCallback(async (rows) => {
    if (!authenticated) {
      // Demo tree mirror shape; the Import affordance is authenticated-only, so
      // this branch is not reached in practice.
      return { ok: true, imported: 0, matches: { onRoster: [], withinPaste: [] } };
    }
    try {
      const res = await fetch('/api/athletes/import', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athletes: rows }),
      });
      let body = null;
      try { body = await res.json(); } catch { body = null; }
      if (!res.ok) {
        setWriteError((body && body.error) || 'Failed to import athletes');
        return { ok: false, rejected: (body && body.rejected) || [] };
      }
      // Whole-batch: either every row landed or none did, so this splice is
      // never partial. Newest first, matching add().
      setAthletes((prev) => [...body.athletes, ...prev]);
      setWriteError(null);
      return { ok: true, imported: body.imported, matches: body.matches };
    } catch (err) {
      setWriteError('Failed to import athletes');
      return { ok: false, rejected: [] };
    }
  }, [authenticated]);

  const value = useMemo(
    () => ({ athletes, add, update, remove, importAthletes, writeError, clearWriteError }),
    [athletes, add, update, remove, importAthletes, writeError, clearWriteError],
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
