import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { practiceContentSeed } from '../data/practiceContent.js';

// Holds the advisor's practice-owned curriculum content (forks, authored,
// drafts). AdvisorSurface mounts this provider directly on BOTH trees;
// on the authenticated tree it passes initialState derived from
// AppIdentityContext.identity.advisor.practiceLessons (fold-in shape —
// no wrapping provider), so consumers via usePracticeContent() see
// Morgan's real data via the nearest-ancestor resolution. On the public
// demo tree initialState is undefined and we seed from
// practiceContentSeed.
//
// Write-through (slice 1): mutation actions branch on whether the provider
// was mounted with initialState — that IS the authenticated-tree signal
// (AdvisorSurface passes `advisorData?.practiceLessons ?? undefined`, so
// undefined ↔ public demo tree, non-undefined ↔ authenticated tree).
// Demo actions stay sync-local (no fetch fires; verified by smoke).
// Authenticated actions await POST/PUT /api/practice-content(/:id), THEN
// update local state on success — optimistic-none per the ask. On failure
// they set writeError; local state is unchanged. Consumers that ignore
// the return value continue to work fire-and-forget on both trees;
// consumers using the returned newLesson should `await` — an `await`
// on a non-Promise resolves to the value on demo, so uniform `await`
// works on both trees.

const PracticeContentContext = createContext(null);

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function serverError(res, fallback) {
  try {
    const body = await res.json();
    return body?.error || fallback;
  } catch { return fallback; }
}

export function PracticeContentProvider({ children, initialState }) {
  const authenticated = initialState !== undefined;
  const [lessons, setLessons] = useState(initialState ?? practiceContentSeed);
  const [writeError, setWriteError] = useState(null);

  const clearWriteError = useCallback(() => setWriteError(null), []);

  const add = useCallback(async (lesson) => {
    if (!authenticated) {
      setLessons((prev) => [...prev, lesson]);
      return lesson;
    }
    try {
      const res = await fetch('/api/practice-content', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lesson),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to save lesson'));
      const saved = await res.json();
      setLessons((prev) => [...prev, saved]);
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to save lesson');
      return null;
    }
  }, [authenticated]);

  const update = useCallback(async (id, patch) => {
    if (!authenticated) {
      setLessons((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: todayIso() } : l))
      );
      return { id, ...patch };
    }
    try {
      const res = await fetch(`/api/practice-content/${encodeURIComponent(id)}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to update lesson'));
      const saved = await res.json();
      setLessons((prev) => prev.map((l) => (l.id === id ? saved : l)));
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to update lesson');
      return null;
    }
  }, [authenticated]);

  const remove = useCallback(async (id) => {
    if (!authenticated) {
      setLessons((prev) => prev.filter((l) => l.id !== id));
      return true;
    }
    // No DELETE endpoint in slice 1 — writes are additive here.
    setWriteError('Removing lessons is not yet supported.');
    return false;
  }, [authenticated]);

  const value = useMemo(
    () => ({ lessons, add, update, remove, writeError, clearWriteError }),
    [lessons, add, update, remove, writeError, clearWriteError],
  );

  return (
    <PracticeContentContext.Provider value={value}>
      {children}
    </PracticeContentContext.Provider>
  );
}

export function usePracticeContent() {
  const ctx = useContext(PracticeContentContext);
  if (!ctx) {
    throw new Error('usePracticeContent must be used inside PracticeContentProvider');
  }
  return ctx;
}
