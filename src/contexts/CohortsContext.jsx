import { createContext, useContext, useState } from 'react';
import { cohorts as cohortsFixture } from '../data/cohorts.js';

// Advisor-scoped cohorts. Same fold-in shape as PracticeContentProvider +
// DocumentationProvider from slice 1: AdvisorSurface passes initialState
// from identity.advisor.cohorts on the authenticated tree, seeds from
// cohorts fixture on the public demo tree via the null-coalesce fallback
// inside useState. Read-only for now; writes land in a later slice
// (per Q11 per-entity endpoint pattern).

const CohortsContext = createContext(null);

export function CohortsProvider({ children, initialState }) {
  const [cohorts] = useState(initialState ?? cohortsFixture);
  return (
    <CohortsContext.Provider value={{ cohorts }}>
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
