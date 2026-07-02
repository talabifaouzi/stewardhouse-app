import { createContext, useCallback, useContext, useState } from 'react';
import { docCategories as seedCategories } from '../data/documentation.js';

// Session-only state for the documentation hub. AdvisorSurface mounts
// this provider directly on BOTH trees; on the authenticated tree it
// passes initialState derived from
// AppIdentityContext.identity.advisor.docCategories (fold-in shape —
// no wrapping provider), so consumers via useDocumentation() see
// Morgan's real doc categories + docs via nearest-ancestor resolution.
// On the public demo tree initialState is undefined and we seed from
// a DEEP COPY of the fixture (so we never mutate the imported module).
// State resets on refresh either way — no persistence, no localStorage.
// Writes on the authenticated tree DO NOT sync back to the server yet;
// the write path lands in a follow-up slice (per Q11 per-entity
// endpoint pattern).

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

export function DocumentationProvider({ children, initialState }) {
  const [categories, setCategories] = useState(() =>
    initialState ?? structuredClone(seedCategories),
  );

  const addDoc = useCallback(
    (categoryLabel, { title, notes, body }) => {
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
    },
    [categories],
  );

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

  // Append a new category. Decision (duplicate check) happens INSIDE the
  // functional updater against `prev` to avoid stale-closure risk if called
  // in rapid succession. Returns true on success, false on empty / duplicate.
  const addSection = useCallback((label, hint) => {
    const trimmedLabel = (label || '').trim();
    if (trimmedLabel.length === 0) return false;
    const trimmedHint = (hint || '').trim();

    let added = false;
    setCategories((prev) => {
      if (prev.some((cat) => cat.label === trimmedLabel)) {
        return prev;
      }
      added = true;
      return [
        ...prev,
        {
          label: trimmedLabel,
          hint: trimmedHint || undefined,
          docs: [],
        },
      ];
    });
    return added;
  }, []);

  return (
    <DocumentationContext.Provider value={{ categories, addDoc, addSection, findDocById }}>
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
