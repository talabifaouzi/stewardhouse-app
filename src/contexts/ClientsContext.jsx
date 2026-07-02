import { createContext, useContext, useState } from 'react';
import { clients as clientsFixture } from '../data/clients.js';

// Advisor-scoped client roster. Q7-gated: authenticated initialState is
// ALWAYS [] for now (no real client rows land in D1 until the write-
// endpoint role gate opens per schema-draft §6). Demo tree falls through
// to the fixture roster via the null-coalesce fallback inside useState.
// Read-only for now; writes land in a later slice.
//
// Consumer contract (§7 voice):
//   - Roster / list UIs that render clients on the authenticated tree
//     must handle clients.length === 0 with EXACTLY the copy
//     "Your clients will appear here." (no exclamation, no
//     product-internal words like pilot/gate/Q7).
//   - Stat cards computing counts over clients show honest zeros,
//     never placeholders — affordance-honesty precedent.

const ClientsContext = createContext(null);

export function ClientsProvider({ children, initialState }) {
  const [clients] = useState(initialState ?? clientsFixture);
  return (
    <ClientsContext.Provider value={{ clients }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) {
    throw new Error('useClients must be used inside ClientsProvider');
  }
  return ctx;
}
