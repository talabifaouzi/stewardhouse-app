import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
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
  // saveStaged reads the CURRENT list without taking `athletes` as a dependency,
  // which would rebuild the callback on every roster change and churn every
  // consumer's memo.
  const athletesRef = useRef(athletes);
  athletesRef.current = athletes;

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

  // REVIEW BEFORE SAVE (ruled 2026-08-27). Staged rows are CLIENT STATE and are
  // never written to D1. They live in the same array as persisted athletes,
  // flagged `uncommitted: true`, so the roster table renders one list and the
  // operator reviews in place. A refresh loses them, which the ruling calls
  // correct: the operator still has the file.
  //
  // The synthesized shape is a full athlete element rather than a partial one,
  // so every column, comparator and status derivation treats a staged row
  // exactly like a Pending athlete. `status: 'pending'` is the STATUS_MAP token
  // for enrollment_status 'Pending', so statusFor returns "Not yet invited",
  // which is what these rows will read as once saved.
  const stageImport = useCallback((rows) => {
    const staged = rows.map((r, i) => ({
      id: `staged-${i}-${Math.random().toString(36).slice(2, 10)}`,
      uncommitted: true,
      name: `${r.firstName} ${r.lastName}`,
      email: r.email,
      sport: null,
      year: null,
      position: null,
      phone: null,
      badge: null,
      notes: null,
      status: 'pending',
      gpsCompleted: false,
      gpsDate: null,
      lessons: 0,
      gifts: 0,
      lastActive: null,
      joinDate: null,
      certified: false,
      certDate: null,
      managementMode: null,
      claimed: false,
      activity: [],
      payload: r,          // the exact {firstName,lastName,email} the endpoint wants
    }));
    setAthletes((prev) => [...staged, ...prev]);
    setWriteError(null);
    return staged.length;
  }, []);

  // Discard drops them from memory. No endpoint, no cleanup, no orphan risk.
  const discardStaged = useCallback(() => {
    setAthletes((prev) => prev.filter((a) => !a.uncommitted));
    setWriteError(null);
  }, []);

  // Drop ONE staged row before save. Deleting an uncommitted row is not a write,
  // so it never reaches the server.
  const dropStaged = useCallback((id) => {
    setAthletes((prev) => prev.filter((a) => !(a.uncommitted && a.id === id)));
  }, []);

  // Save is the FIRST time anything is written. The staged rows are replaced
  // wholesale by what the server returns, so their throwaway client ids never
  // outlive the request.
  const saveStaged = useCallback(async () => {
    const staged = athletesRef.current.filter((a) => a.uncommitted);
    if (staged.length === 0) return { ok: true, imported: 0, matches: { onRoster: [], withinPaste: [] } };
    if (!authenticated) {
      return { ok: true, imported: 0, matches: { onRoster: [], withinPaste: [] } };
    }
    try {
      const res = await fetch('/api/athletes/import', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athletes: staged.map((a) => a.payload) }),
      });
      let body = null;
      try { body = await res.json(); } catch { body = null; }
      if (!res.ok) {
        setWriteError((body && body.error) || 'Failed to save the imported athletes');
        // The staged rows STAY. A rejected save must not silently discard the
        // operator's reviewed list; rejected[] indices still line up with it.
        return { ok: false, rejected: (body && body.rejected) || [] };
      }
      setAthletes((prev) => [...body.athletes, ...prev.filter((a) => !a.uncommitted)]);
      setWriteError(null);
      return { ok: true, imported: body.imported, matches: body.matches };
    } catch (err) {
      setWriteError('Failed to save the imported athletes');
      return { ok: false, rejected: [] };
    }
  }, [authenticated]);

  // Bulk hard delete of Pending athletes. Whole-batch: the endpoint refuses the
  // entire request if any id is not removable, so this splice is never partial.
  const removeMany = useCallback(async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return { ok: true, deleted: 0 };
    if (!authenticated) {
      setAthletes((prev) => prev.filter((a) => !ids.includes(a.id)));
      return { ok: true, deleted: ids.length };
    }
    try {
      const res = await fetch('/api/athletes', {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      let body = null;
      try { body = await res.json(); } catch { body = null; }
      if (!res.ok) {
        setWriteError((body && body.error) || 'Failed to remove the selected athletes');
        return { ok: false, deleted: 0 };
      }
      const gone = new Set(body.ids || ids);
      setAthletes((prev) => prev.filter((a) => !gone.has(a.id)));
      setWriteError(null);
      return { ok: true, deleted: body.deleted ?? ids.length };
    } catch (err) {
      setWriteError('Failed to remove the selected athletes');
      return { ok: false, deleted: 0 };
    }
  }, [authenticated]);

  const value = useMemo(
    () => ({
      athletes, add, update, remove,
      stageImport, discardStaged, dropStaged, saveStaged, removeMany,
      writeError, clearWriteError,
    }),
    [athletes, add, update, remove,
      stageImport, discardStaged, dropStaged, saveStaged, removeMany,
      writeError, clearWriteError],
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
