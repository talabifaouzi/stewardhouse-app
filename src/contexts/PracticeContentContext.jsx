import { createContext, useCallback, useContext, useState } from 'react';
import { practiceContentSeed } from '../data/practiceContent.js';

// Holds the advisor's practice-owned curriculum content (forks, authored,
// drafts). Initialized from the seed on every mount — in this prototype there
// is no persistence, matching IntakeContext's "session-only" model. Mutations
// made via add / update / remove live only as long as this provider is mounted.

const PracticeContentContext = createContext(null);

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function PracticeContentProvider({ children }) {
  const [lessons, setLessons] = useState(practiceContentSeed);

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
