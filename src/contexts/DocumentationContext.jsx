import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { docCategories as seedCategories } from '../data/documentation.js';

// Session-only state for the documentation hub on demo; write-through
// persistence on the authenticated tree (slice 1). AdvisorSurface mounts
// this provider directly on BOTH trees; on the authenticated tree it
// passes initialState derived from
// AppIdentityContext.identity.advisor.docCategories, so consumers via
// useDocumentation() see Morgan's real doc categories + docs.
// On the public demo tree initialState is undefined and we seed from
// a DEEP COPY of the fixture (so we never mutate the imported module).
//
// Write-through: same signal as PracticeContentProvider —
// `initialState !== undefined` ↔ authenticated tree. Demo actions stay
// sync-local (no fetch fires; verified by smoke). Authenticated actions
// await POST /api/doc-categories or POST/PUT /api/docs(/:id), then update
// local state on success — optimistic-none per the ask. `writeError` +
// `clearWriteError` exposed for consumer error surfacing.

const DocumentationContext = createContext(null);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatToday() {
  const d = new Date();
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function allIds(categories) {
  const ids = new Set();
  for (const cat of categories) {
    for (const doc of cat.docs) ids.add(doc.id);
  }
  return ids;
}

function uniqueId(base, existing) {
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

async function serverError(res, fallback) {
  try {
    const body = await res.json();
    return body?.error || fallback;
  } catch { return fallback; }
}

export function DocumentationProvider({ children, initialState }) {
  const authenticated = initialState !== undefined;
  const [categories, setCategories] = useState(() =>
    initialState ?? structuredClone(seedCategories),
  );
  const [writeError, setWriteError] = useState(null);

  const clearWriteError = useCallback(() => setWriteError(null), []);

  const addDoc = useCallback(async (categoryLabel, { title, notes, body }) => {
    if (!authenticated) {
      const baseSlug = slugify(title) || 'document';
      const newId = uniqueId(baseSlug, allIds(categories));
      const newDoc = {
        id: newId,
        title: title.trim(),
        updated: formatToday(),
        notes: (notes || '').trim(),
        body: Array.isArray(body) ? body : [],
      };
      setCategories((prev) =>
        prev.map((cat) =>
          cat.label === categoryLabel
            ? { ...cat, docs: [...cat.docs, newDoc] }
            : cat,
        ),
      );
      return newId;
    }
    // Authenticated: resolve label→id from current categories state, then
    // POST to /api/docs which validates ownership server-side.
    const category = categories.find((c) => c.label === categoryLabel);
    if (!category) {
      setWriteError('Category not found');
      return null;
    }
    try {
      const res = await fetch('/api/docs', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: category.id,
          title,
          notes: (notes || '').trim() || null,
          body: Array.isArray(body) ? body : [],
        }),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to save doc'));
      const saved = await res.json();
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === category.id
            ? { ...cat, docs: [...cat.docs, saved] }
            : cat,
        ),
      );
      setWriteError(null);
      return saved.id;
    } catch (err) {
      setWriteError(err.message || 'Failed to save doc');
      return null;
    }
  }, [authenticated, categories]);

  const findDocById = useCallback(
    (id) => {
      for (const cat of categories) {
        for (const doc of cat.docs) {
          if (doc.id === id) return { doc, categoryLabel: cat.label };
        }
      }
      return null;
    },
    [categories],
  );

  const addSection = useCallback(async (label, hint) => {
    const trimmedLabel = (label || '').trim();
    if (trimmedLabel.length === 0) return false;
    const trimmedHint = (hint || '').trim();

    if (!authenticated) {
      let added = false;
      setCategories((prev) => {
        if (prev.some((cat) => cat.label === trimmedLabel)) return prev;
        added = true;
        return [
          ...prev,
          { label: trimmedLabel, hint: trimmedHint || undefined, docs: [] },
        ];
      });
      return added;
    }

    // Authenticated: rely on the server's UNIQUE constraint —
    // duplicate labels surface as 400 "Category with that label already exists".
    try {
      const res = await fetch('/api/doc-categories', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: trimmedLabel, hint: trimmedHint || null }),
      });
      if (!res.ok) {
        const msg = await serverError(res, 'Failed to save category');
        setWriteError(msg);
        return false;
      }
      const saved = await res.json();
      setCategories((prev) => [
        ...prev,
        { id: saved.id, label: saved.label, hint: saved.hint || undefined, docs: [] },
      ]);
      setWriteError(null);
      return true;
    } catch (err) {
      setWriteError(err.message || 'Failed to save category');
      return false;
    }
  }, [authenticated]);

  const value = useMemo(
    () => ({ categories, addDoc, addSection, findDocById, writeError, clearWriteError }),
    [categories, addDoc, addSection, findDocById, writeError, clearWriteError],
  );

  return (
    <DocumentationContext.Provider value={value}>
      {children}
    </DocumentationContext.Provider>
  );
}

export function useDocumentation() {
  const ctx = useContext(DocumentationContext);
  if (!ctx) {
    throw new Error('useDocumentation must be used inside DocumentationProvider');
  }
  return ctx;
}
