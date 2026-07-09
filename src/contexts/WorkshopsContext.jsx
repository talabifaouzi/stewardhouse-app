import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { workshops as workshopsFixture } from '../data/enterpriseFixtures.js';

// Enterprise workshop provider — AthletesContext mirror, create-only
// write-through (E-Slice E-Write-3a). Attendance recording is 3b; this provider
// carries no remove/edit.
//
// Fold-in signal (advisor convention): initialState !== undefined ↔
// authenticated. Demo tree passes undefined → the fixture calendar (5 Cooper
// State workshops); add() stays sync-local, no fetch fires. Authenticated tree
// passes the /api/me institution workshops ([] until scheduled) → add() POSTs
// to /api/workshops and splices the response. The mount site (EnterpriseSurface)
// keys initialState on identity TYPE ('staff'), never on data — the advisor
// defensive-seam lesson.
//
// Ordering: /api/me returns workshops ORDER BY date. add() splices the saved
// element and re-sorts by date so local state matches the server ordering
// (a page reload re-fetches the same order). WorkshopCalendar buckets by date
// regardless, but keeping the array date-sorted avoids any list-order drift.

const WorkshopsContext = createContext(null);

async function serverError(res, fallback) {
  try {
    const body = await res.json();
    return body?.error || fallback;
  } catch { return fallback; }
}

function byDate(a, b) {
  return String(a.date).localeCompare(String(b.date));
}

export function WorkshopsProvider({ initialState, children }) {
  const authenticated = initialState !== undefined;
  const [workshops, setWorkshops] = useState(authenticated ? initialState : workshopsFixture);
  const [writeError, setWriteError] = useState(null);

  const clearWriteError = useCallback(() => setWriteError(null), []);

  const add = useCallback(async (workshop) => {
    if (!authenticated) {
      // Demo tree: sync-local, no fetch. The Schedule affordance is
      // authenticated-only, so this branch is not reached in practice — kept
      // for the AthletesProvider-mirror shape.
      setWorkshops((prev) => [...prev, workshop].sort(byDate));
      return workshop;
    }
    try {
      const res = await fetch('/api/workshops', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workshop),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to schedule workshop'));
      const saved = await res.json();
      setWorkshops((prev) => [...prev, saved].sort(byDate));
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to schedule workshop');
      return null;
    }
  }, [authenticated]);

  const value = useMemo(
    () => ({ workshops, add, writeError, clearWriteError }),
    [workshops, add, writeError, clearWriteError],
  );

  return (
    <WorkshopsContext.Provider value={value}>
      {children}
    </WorkshopsContext.Provider>
  );
}

export function useWorkshops() {
  const ctx = useContext(WorkshopsContext);
  if (!ctx) {
    throw new Error('useWorkshops must be used inside WorkshopsProvider');
  }
  return ctx;
}
