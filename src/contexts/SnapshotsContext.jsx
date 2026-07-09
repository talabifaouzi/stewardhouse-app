import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { priorCohortSnapshot, currentCohortSnapshot } from '../data/enterpriseFixtures.js';

// Enterprise cohort-snapshot provider (E-Slice E-Write-5) — fold-in idiom.
//
// Fold-in signal: initialState !== undefined ↔ authenticated. Demo tree passes
// undefined → the two fixture snapshots, shaped NEWEST-FIRST ([current, prior])
// to match /api/me's `ORDER BY snapshot_at DESC`, so CohortComparison's
// snapshots[0]=current / snapshots[1]=prior semantics hold identically on both
// trees. Authenticated tree passes the /api/me snapshots (0 / 1 / ≥2). The mount
// site keys initialState on identity TYPE ('staff'), never on data.
//
// add() prepends the new snapshot (newest-first); remove() filters by id. Both
// are authenticated-only affordances (the demo branch is the mirror shape,
// never reached — snapshot-taking is gated on identity).

const SnapshotsContext = createContext(null);

// The fixture snapshots already carry the element keys CohortComparison reads
// (cohortLabel, athletes, gpsCompleted, gpsRate, certified, certRate,
// totalGifts, totalDollarsMoved, workshopAttendanceRate, avgWeeklyEngagement,
// asOfNote). Newest-first: current (2025-2026) before prior (2024-2025).
const FIXTURE_SNAPSHOTS = [currentCohortSnapshot, priorCohortSnapshot];

async function serverError(res, fallback) {
  try {
    const body = await res.json();
    return body?.error || fallback;
  } catch { return fallback; }
}

export function SnapshotsProvider({ initialState, children }) {
  const authenticated = initialState !== undefined;
  const [snapshots, setSnapshots] = useState(authenticated ? initialState : FIXTURE_SNAPSHOTS);
  const [writeError, setWriteError] = useState(null);

  const clearWriteError = useCallback(() => setWriteError(null), []);

  const add = useCallback(async (payload) => {
    if (!authenticated) {
      setSnapshots((prev) => [payload, ...prev]);
      return payload;
    }
    try {
      const res = await fetch('/api/snapshots', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to record snapshot'));
      const saved = await res.json();
      setSnapshots((prev) => [saved, ...prev]);
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to record snapshot');
      return null;
    }
  }, [authenticated]);

  const remove = useCallback(async (id) => {
    if (!authenticated) {
      setSnapshots((prev) => prev.filter((s) => s.id !== id));
      return true;
    }
    try {
      const res = await fetch(`/api/snapshots/${encodeURIComponent(id)}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to remove snapshot'));
      setSnapshots((prev) => prev.filter((s) => s.id !== id));
      setWriteError(null);
      return true;
    } catch (err) {
      setWriteError(err.message || 'Failed to remove snapshot');
      return false;
    }
  }, [authenticated]);

  const value = useMemo(
    () => ({ snapshots, add, remove, writeError, clearWriteError }),
    [snapshots, add, remove, writeError, clearWriteError],
  );

  return (
    <SnapshotsContext.Provider value={value}>
      {children}
    </SnapshotsContext.Provider>
  );
}

export function useSnapshots() {
  const ctx = useContext(SnapshotsContext);
  if (!ctx) {
    throw new Error('useSnapshots must be used inside SnapshotsProvider');
  }
  return ctx;
}
