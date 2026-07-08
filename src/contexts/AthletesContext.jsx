import { createContext, useContext, useMemo } from 'react';
import { athletes as athletesFixture } from '../data/enterpriseFixtures.js';

// Enterprise athlete-roster provider — ClientsProvider mirror, READ-ONLY for
// E-Slice 6a. No athlete write endpoint exists yet; write-through folds in
// when the gated roster-add path lands (same shape as ClientsProvider's
// add/update). Until then the value carries only the roster array.
//
// Fold-in signal (advisor convention): initialState !== undefined ↔
// authenticated. The demo tree passes undefined → the fixture roster (16
// Cooper State athletes). The authenticated tree passes [] → an empty roster:
// no real athlete rows exist until the write path (slim-seed ruling, migration
// 0010). The mount site (EnterpriseSurface) keys the initialState decision on
// identity TYPE ('staff'), never on whether server data arrived — the advisor
// defensive-seam lesson.

const AthletesContext = createContext(null);

export function AthletesProvider({ initialState, children }) {
  const athletes = initialState !== undefined ? initialState : athletesFixture;
  const value = useMemo(() => ({ athletes }), [athletes]);
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
