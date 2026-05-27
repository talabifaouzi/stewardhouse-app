import { createContext, useCallback, useContext, useState } from 'react';

// Session-only state for the member-side cohort experience.
// Consent boundary: optedIn defaults to FALSE. The member sees no overlap or
// cohort-mate information until they opt in. Opting out clears any signals.
// No persistence — refresh restores the default.

const CohortMemberContext = createContext(null);

const DEFAULT_STATE = {
  optedIn: false,
  signaledThemeIds: [],
};

export function CohortMemberProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE);

  const optIn = useCallback(() => {
    setState((prev) => ({ ...prev, optedIn: true }));
  }, []);

  const optOut = useCallback(() => {
    setState({ optedIn: false, signaledThemeIds: [] });
  }, []);

  const toggleSignal = useCallback((themeId) => {
    setState((prev) => ({
      ...prev,
      signaledThemeIds: prev.signaledThemeIds.includes(themeId)
        ? prev.signaledThemeIds.filter((id) => id !== themeId)
        : [...prev.signaledThemeIds, themeId],
    }));
  }, []);

  return (
    <CohortMemberContext.Provider value={{ ...state, optIn, optOut, toggleSignal }}>
      {children}
    </CohortMemberContext.Provider>
  );
}

export function useCohortMember() {
  const ctx = useContext(CohortMemberContext);
  if (!ctx) {
    throw new Error('useCohortMember must be used inside CohortMemberProvider');
  }
  return ctx;
}
