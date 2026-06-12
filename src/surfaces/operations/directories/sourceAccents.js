// Source-tag accent treatment shared across the Operations directory pages
// (Individuals, Institutions, Advisor Practices, Organizations). Keys are
// lowercase Person/Institution/etc. sourceSurface values, including the
// 'synthetic' bundle.
//
// This is intentionally distinct from OperationsSurface.SURFACE_COLORS,
// which is keyed by Title-cased ActivityItem.surface emissions (Individual /
// Advisor / Enterprise / Operations) for the Recent Activity card and
// carries no 'Synthetic' entry. Same accent tokens for the three real
// surfaces; synthetic uses the warm-neutral muted token to read as seed
// data rather than a fourth real surface.

export const SOURCE_ACCENT = {
  individual: 'var(--sh-individual-accent)',
  advisor:    'var(--sh-advisor-accent)',
  enterprise: 'var(--sh-enterprise-accent)',
  synthetic:  'var(--sh-text-muted)',
};

export const SOURCE_ACCENT_FALLBACK = 'var(--sh-text-muted)';

// QA-048 — Resolver with explicit dev-time signal when a sourceSurface key
// has no accent in the map. Production behavior matches the previous silent
// `|| 'var(--sh-text-muted)'` fallback exactly (same return value, no
// console output). The dev warn makes a future map/data drift loud instead
// of silent. Callers should prefer this over indexing SOURCE_ACCENT directly
// when the key may originate from data.
export function resolveSourceAccent(key) {
  const hit = SOURCE_ACCENT[key];
  if (hit !== undefined) return hit;
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[sourceAccents] No accent for sourceSurface "${key}" — falling back to muted.`);
  }
  return SOURCE_ACCENT_FALLBACK;
}
