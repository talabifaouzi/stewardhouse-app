import { statusFor, STATUS_ORDER } from './athleteStatus.js';

// Shared category-filter config and modal-title builder.
// Previously duplicated across Overview and Roster — single source of truth
// for the tile drill-down semantics.
//
// PAIRING RULE (ruled): every tile counts exactly what its drill filters, and
// the TILE adopts the DRILL's predicate rather than the reverse. Before this
// slice the two sides were derived independently: the drill routed through
// statusFor while the tile read a computeStats count keyed on milestone fields
// alone, so a tile could count an athlete its own drill would not list.
//
// The predicates below are now the ONLY definition of each category. Tile
// counts come from countByCategory, which runs these same functions, so the
// two sides cannot drift by construction rather than by convention.
//
// Six statusFor labels, six keys, plus the catch-all 'all'. 'certified' and
// 'all' keep the predicates they already had: both pairs agreed before this
// slice and neither predicate is changed by it.
export const CATEGORY_CONFIG = {
  'all':                  { label: 'All athletes',         filter: () => true },
  'actively-progressing': { label: 'Actively progressing', filter: (a) => statusFor(a) === 'Actively progressing' },
  'certified':            { label: 'Certified',            filter: (a) => a.certified },
  'not-yet-active':       { label: 'Not yet active',       filter: (a) => statusFor(a) === 'Not yet active' },
  'outreach-paused':      { label: 'Outreach paused',      filter: (a) => statusFor(a) === 'Outreach paused' },
  'invited':              { label: 'Invited',              filter: (a) => statusFor(a) === 'Invited' },
  'not-yet-invited':      { label: 'Not yet invited',      filter: (a) => statusFor(a) === 'Not yet invited' },
};

// The six status categories in ONE order, used by the Overview tiles, the
// Roster tiles and the ProgramSummary status-breakdown sentence alike. The
// catch-all 'all' drops out because its label is not a status; it is rendered
// separately, ahead of these.
//
// DERIVED from STATUS_ORDER rather than hand-listed, and exported rather than
// repeated, for the same reason the counts are: three hand-kept sequences would
// be three chances to drift, and a reader comparing a tile grid against the
// sentence would have no way to tell an intentional difference from a stale
// one. A renumbering of STATUS_ORDER moves all three together.
export const STATUS_CATEGORY_KEYS = Object.keys(CATEGORY_CONFIG)
  .filter((key) => STATUS_ORDER[CATEGORY_CONFIG[key].label] !== undefined)
  .sort((a, b) => STATUS_ORDER[CATEGORY_CONFIG[a].label] - STATUS_ORDER[CATEGORY_CONFIG[b].label]);

// Tile counts, one entry per category key, over the SAME filter the drill runs.
// A tile reading counts[k] and a drill filtering CATEGORY_CONFIG[k].filter are
// then the same predicate applied to the same array, so no input exists on
// which they disagree.
//
// The loop calls every filter for every athlete rather than switching on a
// single statusFor result, because 'all' and 'certified' do not route through
// statusFor and a label-keyed shortcut would have to special-case them. At
// roster scale the cost is not worth the exception.
export function countByCategory(athletes) {
  const counts = {};
  for (const key of Object.keys(CATEGORY_CONFIG)) counts[key] = 0;
  for (const a of athletes) {
    for (const key of Object.keys(CATEGORY_CONFIG)) {
      if (CATEGORY_CONFIG[key].filter(a)) counts[key] += 1;
    }
  }
  return counts;
}

// Modal title format. 'all' category already has "athletes" in its label
// ("All athletes — 16"); other categories get "athletes" suffix
// ("Certified — 4 athletes").
export function buildModalTitle(config, filteredAthletes, activeCategory) {
  if (!config) return '';
  if (activeCategory === 'all') {
    return `${config.label} — ${filteredAthletes.length}`;
  }
  return `${config.label} — ${filteredAthletes.length} athletes`;
}
