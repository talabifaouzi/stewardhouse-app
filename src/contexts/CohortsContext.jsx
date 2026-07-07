import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { cohorts as cohortsFixture } from '../data/cohorts.js';

// Advisor-scoped cohorts. Same fold-in shape as PracticeContentProvider +
// DocumentationProvider: AdvisorSurface passes initialState from
// identity.advisor.cohorts on the authenticated tree, seeds from cohorts
// fixture on the public demo tree via the null-coalesce fallback inside
// useState.
//
// Write-through (slice 1): same signal as the other advisor providers —
// `initialState !== undefined` ↔ authenticated tree. Demo actions stay
// sync-local (no fetch fires); authenticated actions await POST /api/cohorts
// or PUT /api/cohorts/:id, THEN update local state on success —
// optimistic-none. cohort_member operations are Q7-gated and excluded
// from this slice. No consumer wires the add/update actions yet (Cohort UI
// today is read-only); the actions land here so slice-2 UI can plug in
// without another provider pass.

const CohortsContext = createContext(null);

async function serverError(res, fallback) {
  try {
    const body = await res.json();
    return body?.error || fallback;
  } catch { return fallback; }
}

export function CohortsProvider({ children, initialState }) {
  const authenticated = initialState !== undefined;
  const [cohorts, setCohorts] = useState(initialState ?? cohortsFixture);
  const [writeError, setWriteError] = useState(null);

  const clearWriteError = useCallback(() => setWriteError(null), []);

  const add = useCallback(async (cohort) => {
    if (!authenticated) {
      setCohorts((prev) => [...prev, cohort]);
      return cohort;
    }
    try {
      const res = await fetch('/api/cohorts', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cohort),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to save cohort'));
      const saved = await res.json();
      setCohorts((prev) => [...prev, saved]);
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to save cohort');
      return null;
    }
  }, [authenticated]);

  const update = useCallback(async (id, patch) => {
    if (!authenticated) {
      setCohorts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      return { id, ...patch };
    }
    try {
      const res = await fetch(`/api/cohorts/${encodeURIComponent(id)}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to update cohort'));
      const saved = await res.json();
      setCohorts((prev) => prev.map((c) => (c.id === id ? saved : c)));
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to update cohort');
      return null;
    }
  }, [authenticated]);

  const addMember = useCallback(async (cohortId, clientId) => {
    if (!authenticated) {
      setCohorts((prev) => prev.map((c) => (
        c.id === cohortId && !(c.memberIds || []).includes(clientId)
          ? { ...c, memberIds: [...(c.memberIds || []), clientId] }
          : c
      )));
      return { cohortId, clientId };
    }
    try {
      const res = await fetch('/api/cohort-members', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohortId, clientId }),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to add member'));
      const saved = await res.json();
      setCohorts((prev) => prev.map((c) => (
        c.id === cohortId
          ? { ...c, memberIds: [...(c.memberIds || []), clientId] }
          : c
      )));
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to add member');
      return null;
    }
  }, [authenticated]);

  const removeMember = useCallback(async (cohortId, clientId) => {
    if (!authenticated) {
      setCohorts((prev) => prev.map((c) => (
        c.id === cohortId
          ? { ...c, memberIds: (c.memberIds || []).filter((id) => id !== clientId) }
          : c
      )));
      return true;
    }
    try {
      const res = await fetch('/api/cohort-members', {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohortId, clientId }),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to remove member'));
      setCohorts((prev) => prev.map((c) => (
        c.id === cohortId
          ? { ...c, memberIds: (c.memberIds || []).filter((id) => id !== clientId) }
          : c
      )));
      setWriteError(null);
      return true;
    } catch (err) {
      setWriteError(err.message || 'Failed to remove member');
      return false;
    }
  }, [authenticated]);

  const value = useMemo(
    () => ({ cohorts, add, update, addMember, removeMember, writeError, clearWriteError }),
    [cohorts, add, update, addMember, removeMember, writeError, clearWriteError],
  );

  return (
    <CohortsContext.Provider value={value}>
      {children}
    </CohortsContext.Provider>
  );
}

export function useCohorts() {
  const ctx = useContext(CohortsContext);
  if (!ctx) {
    throw new Error('useCohorts must be used inside CohortsProvider');
  }
  return ctx;
}
