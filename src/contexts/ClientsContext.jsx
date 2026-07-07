import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { clients as clientsFixture } from '../data/clients.js';

// Advisor-scoped client roster with write-through mutations.
//
// Copies PracticeContentProvider's write-through pattern exactly:
//   authenticated = initialState !== undefined
// so the fold-in signal at AdvisorSurface drives the branch. Demo actions
// stay sync-local (no fetch fires — grep-verified). Authenticated actions
// await POST/PUT then setState on success (optimistic-none). writeError +
// clearWriteError exposed for consumer error surfacing.
//
// ============================================================================
// CANONICAL CLIENT SHAPE (2b-ii-a — provider-boundary normalization).
// ============================================================================
// Every client object exposed via useClients() carries the FIXTURE keys:
//   client.sessions        (was clientSessions on /api/me)
//   client.privateNotes    (was clientNotes on /api/me)
// The demo tree already ships fixture-shape via src/data/clients.js.
// The authenticated tree passes through `normalizeClientFromServer` at
// provider mount, which renames the two /api/me keys to their fixture
// equivalents. From this line down, consumers never see clientSessions /
// clientNotes — the two-shape era ended here.
//
// Rationale for provider-boundary normalization (option a):
//   * Consumers stay as-is (ClientWorkspace reads client.sessions and
//     client.privateNotes with no fallback chain).
//   * One adapter, one file, one place to grep — no shape drift when
//     future consumers land.
//   * addSession / addNote below append to the canonical keys on BOTH
//     trees uniformly — no tree-specific branch.
// ============================================================================

function normalizeClientFromServer(client) {
  if (!client || typeof client !== 'object') return client;
  const { clientSessions, clientNotes, ...rest } = client;
  return {
    ...rest,
    sessions: Array.isArray(clientSessions) ? clientSessions : (rest.sessions ?? []),
    privateNotes: Array.isArray(clientNotes) ? clientNotes : (rest.privateNotes ?? []),
  };
}

function normalizeClientsFromServer(list) {
  return Array.isArray(list) ? list.map(normalizeClientFromServer) : list;
}

const ClientsContext = createContext(null);

async function serverError(res, fallback) {
  try {
    const body = await res.json();
    return body?.error || fallback;
  } catch { return fallback; }
}

export function ClientsProvider({ children, initialState }) {
  const authenticated = initialState !== undefined;
  const [clients, setClients] = useState(
    authenticated ? normalizeClientsFromServer(initialState) : clientsFixture
  );
  const [writeError, setWriteError] = useState(null);

  const clearWriteError = useCallback(() => setWriteError(null), []);

  const add = useCallback(async (client) => {
    if (!authenticated) {
      setClients((prev) => [...prev, client]);
      return client;
    }
    try {
      const res = await fetch('/api/clients', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to save client'));
      const saved = normalizeClientFromServer(await res.json());
      setClients((prev) => [...prev, saved]);
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to save client');
      return null;
    }
  }, [authenticated]);

  const update = useCallback(async (id, patch) => {
    if (!authenticated) {
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      return { id, ...patch };
    }
    try {
      const res = await fetch(`/api/clients/${encodeURIComponent(id)}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to update client'));
      const saved = normalizeClientFromServer(await res.json());
      // Merge saved fields into existing row — preserves any consumer-side
      // sessions/privateNotes that aren't returned by PUT (endpoint returns
      // fresh client core, not the nested arrays).
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...saved } : c)));
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to update client');
      return null;
    }
  }, [authenticated]);

  // addSession / addNote both append to the CANONICAL keys (`sessions`,
  // `privateNotes`) uniformly across trees — the provider-boundary
  // normalization above erased the two-shape era.

  const addSession = useCallback(async (clientId, session) => {
    if (!authenticated) {
      setClients((prev) => prev.map((c) => (
        c.id === clientId
          ? { ...c, sessions: [session, ...(c.sessions || [])] }
          : c
      )));
      return session;
    }
    try {
      const res = await fetch('/api/client-sessions', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...session, clientId }),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to save session'));
      const saved = await res.json();
      setClients((prev) => prev.map((c) => (
        c.id === clientId
          ? { ...c, sessions: [saved, ...(c.sessions || [])] }
          : c
      )));
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to save session');
      return null;
    }
  }, [authenticated]);

  const addNote = useCallback(async (clientId, note) => {
    if (!authenticated) {
      setClients((prev) => prev.map((c) => (
        c.id === clientId
          ? { ...c, privateNotes: [note, ...(c.privateNotes || [])] }
          : c
      )));
      return note;
    }
    try {
      const res = await fetch('/api/client-notes', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...note, clientId }),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to save note'));
      const saved = await res.json();
      setClients((prev) => prev.map((c) => (
        c.id === clientId
          ? { ...c, privateNotes: [saved, ...(c.privateNotes || [])] }
          : c
      )));
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to save note');
      return null;
    }
  }, [authenticated]);

  const value = useMemo(
    () => ({ clients, add, update, addSession, addNote, writeError, clearWriteError }),
    [clients, add, update, addSession, addNote, writeError, clearWriteError],
  );

  return (
    <ClientsContext.Provider value={value}>
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
