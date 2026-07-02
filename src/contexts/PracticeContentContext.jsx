import { createContext, useCallback, useContext, useState } from 'react';
import { practiceContentSeed } from '../data/practiceContent.js';

// Holds the advisor's practice-owned curriculum content (forks, authored,
// drafts). AdvisorSurface mounts this provider directly on BOTH trees;
// on the authenticated tree it passes initialState derived from
// AppIdentityContext.identity.advisor.practiceLessons (fold-in shape —
// no wrapping provider), so consumers via usePracticeContent() see
// Morgan's real data via the nearest-ancestor resolution. On the public
// demo tree initialState is undefined and we seed from
// practiceContentSeed. Session-only mutations on both trees via
// add / update / remove.

const PracticeContentContext = createContext(null);

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function PracticeContentProvider({ children, initialState }) {
  const [lessons, setLessons] = useState(initialState ?? practiceContentSeed);

  const add = useCallback((lesson) => {
    setLessons((prev) => [...prev, lesson]);
  }, []);

  const update = useCallback((id, patch) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, ...patch, updatedAt: todayIso() } : l
      )
    );
  }, []);

  const remove = useCallback((id) => {
    setLessons((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return (
    <PracticeContentContext.Provider value={{ lessons, add, update, remove }}>
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
