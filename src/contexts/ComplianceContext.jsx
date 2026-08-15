import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { exclusions as exclusionsFixture, complianceAuditLog } from '../data/enterpriseFixtures.js';

// Enterprise compliance provider (E-Slice E-Write-4) — one context carrying BOTH
// the exclusion list and the append-only audit log, mirroring the
// AthletesContext / WorkshopsContext fold-in idiom.
//
// Fold-in signal: initialState !== undefined ↔ authenticated. Demo tree passes
// undefined → the fixture exclusions + audit log (read-only + the surface's own
// session-edit overlay stays byte-identical). Authenticated tree passes the
// /api/me { exclusions, audit } → the write actions POST/DELETE and splice the
// server responses. The mount site (EnterpriseSurface) keys initialState on
// identity TYPE ('staff'), never on data — the defensive-seam lesson.
//
// Interdependency (E-Write-4 Q2): a successful exclusion add/remove returns its
// AUTO-LOGGED audit entry alongside; the provider splices the audit row too, so
// the audit log reflects the action without a refetch. Both /api/me arrays are
// newest-first; add() prepends, remove() filters.

const ComplianceContext = createContext(null);

async function serverError(res, fallback) {
  try {
    const body = await res.json();
    return body?.error || fallback;
  } catch { return fallback; }
}

export function ComplianceProvider({ initialState, children }) {
  const authenticated = initialState !== undefined;
  const [exclusions, setExclusions] = useState(
    authenticated ? (initialState.exclusions ?? []) : exclusionsFixture,
  );
  const [audit, setAudit] = useState(
    authenticated ? (initialState.audit ?? []) : complianceAuditLog,
  );
  const [writeError, setWriteError] = useState(null);

  const clearWriteError = useCallback(() => setWriteError(null), []);

  const addExclusion = useCallback(async (payload) => {
    if (!authenticated) {
      // Demo tree: sync-local (the Add affordance is authenticated-only).
      setExclusions((prev) => [payload, ...prev]);
      return payload;
    }
    try {
      const res = await fetch('/api/exclusions', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to add exclusion'));
      const { exclusion, auditEntry } = await res.json();
      setExclusions((prev) => [exclusion, ...prev]);
      if (auditEntry) setAudit((prev) => [auditEntry, ...prev]);
      setWriteError(null);
      return exclusion;
    } catch (err) {
      setWriteError(err.message || 'Failed to add exclusion');
      return null;
    }
  }, [authenticated]);

  const removeExclusion = useCallback(async (id) => {
    if (!authenticated) {
      setExclusions((prev) => prev.filter((e) => e.id !== id));
      return true;
    }
    try {
      const res = await fetch(`/api/exclusions/${encodeURIComponent(id)}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to remove exclusion'));
      const { auditEntry } = await res.json();
      setExclusions((prev) => prev.filter((e) => e.id !== id));
      if (auditEntry) setAudit((prev) => [auditEntry, ...prev]);
      setWriteError(null);
      return true;
    } catch (err) {
      setWriteError(err.message || 'Failed to remove exclusion');
      return false;
    }
  }, [authenticated]);

  const addAuditEntry = useCallback(async (payload) => {
    if (!authenticated) {
      setAudit((prev) => [payload, ...prev]);
      return payload;
    }
    try {
      const res = await fetch('/api/compliance-audit', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to record audit entry'));
      const saved = await res.json();
      setAudit((prev) => [saved, ...prev]);
      setWriteError(null);
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to record audit entry');
      return null;
    }
  }, [authenticated]);

  // `authenticated` is EXPOSED so consumer COPY can follow the same predicate
  // that governs consumer BEHAVIOUR. Every exclusion add/remove writes a
  // compliance_audit row inside the same env.DB.batch() on the authenticated
  // tree (E-Write-4) and mutates local state only on the demo tree, so copy
  // describing whether the audit trail survives has to branch on the same
  // signal. Same addition, same reasoning, as P-4 made to
  // PracticeContentContext.
  //
  // Do NOT substitute useOptionalAppIdentity() in a consumer, and note that
  // Ruling A in docs/pilot-gate-criteria.md does not govern here: it decides
  // isolate-versus-caveat for FIXTURE CONTENT, and this is a behavioural
  // divergence between trees.
  const value = useMemo(
    () => ({ exclusions, audit, addExclusion, removeExclusion, addAuditEntry, writeError, clearWriteError, authenticated }),
    [exclusions, audit, addExclusion, removeExclusion, addAuditEntry, writeError, clearWriteError, authenticated],
  );

  return (
    <ComplianceContext.Provider value={value}>
      {children}
    </ComplianceContext.Provider>
  );
}

export function useCompliance() {
  const ctx = useContext(ComplianceContext);
  if (!ctx) {
    throw new Error('useCompliance must be used inside ComplianceProvider');
  }
  return ctx;
}
