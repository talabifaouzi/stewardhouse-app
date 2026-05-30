import { statusFor } from './athleteStatus.js';

// Shared category-filter config and modal-title builder.
// Previously duplicated across Overview and Roster — single source of truth
// for the 5-tile drill-down semantics.

export const CATEGORY_CONFIG = {
  'all':                  { label: 'All athletes',         filter: () => true },
  'actively-progressing': { label: 'Actively progressing', filter: (a) => statusFor(a) === 'Actively progressing' },
  'certified':            { label: 'Certified',            filter: (a) => a.certified },
  'not-yet-active':       { label: 'Not yet active',       filter: (a) => statusFor(a) === 'Not yet active' },
  'outreach-paused':      { label: 'Outreach paused',      filter: (a) => statusFor(a) === 'Outreach paused' },
  'invited':              { label: 'Invited',              filter: (a) => statusFor(a) === 'Invited' },
};

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
