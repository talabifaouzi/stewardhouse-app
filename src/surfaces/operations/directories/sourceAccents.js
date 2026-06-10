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
