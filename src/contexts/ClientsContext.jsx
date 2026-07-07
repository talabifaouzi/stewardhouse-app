import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { clients as clientsFixture } from '../data/clients.js';

// Advisor-scoped client roster with write-through mutations (2b-i).
//
// Copies PracticeContentProvider's write-through pattern exactly:
//   authenticated = initialState !== undefined
// so the fold-in signal at AdvisorSurface drives the branch. Demo actions
// stay sync-local (no fetch fires — grep-verified). Authenticated actions
// await POST/PUT then setState on success (optimistic-none). writeError +
// clearWriteError exposed for consumer error surfacing.
//
// State shape divergence between trees is intentional at this slice:
//  - Demo tree: fixture uses `sessions` + `privateNotes` (existing consumer
//    reads at ClientWorkspace.jsx:50/:191). Provider's demo addSession /
//    addNote append there.
//  - Auth tree: /api/me emits `clientSessions` + `clientNotes` (0-length
//    at seed). Provider's auth addSession / addNote append there.
// 2b-ii resolves the consumer/shape gap when it wires the reads.

const ClientsContext = createContext(null);

async function serverError(res, fallback) {
  try {
    const body = await res.json();
    return body?.error || fallback;
  } catch { return fallback; }
}

export function ClientsProvider({ children, initialState }) {
  const authenticated = initialState !== undefined;
  const [clients, setClients] = useState(initialState ?? clientsFixture);
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
      const saved = await res.json();
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
      const saved = await res.json();
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...saved } : c)));
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to update client');
      return null;
    }
  }, [authenticated]);

  const addSession = useCallback(async (clientId, session) => {
    if (!authenticated) {
      // Demo shape: append to client.sessions (fixture key).
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
      // Auth shape: append to client.clientSessions (server key).
      setClients((prev) => prev.map((c) => (
        c.id === clientId
          ? { ...c, clientSessions: [saved, ...(c.clientSessions || [])] }
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
      // Demo shape: append to client.privateNotes (fixture key).
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
      // Auth shape: append to client.clientNotes (server key).
      setClients((prev) => prev.map((c) => (
        c.id === clientId
          ? { ...c, clientNotes: [saved, ...(c.clientNotes || [])] }
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
