// Fictional content items used for demo of curriculum library + pipeline.
// Phase 1 scope: athletes only.

export const contentTypes = [
  { key: 'digest', label: 'Digest', description: 'Periodic summary across topics' },
  { key: 'notification', label: 'Notification', description: 'Event-driven, no cadence' },
  { key: 'spotlight', label: 'Sector spotlight', description: 'Editorial deep-dive on a topic or organization type' },
  { key: 'reflection', label: 'Reflection prompt', description: 'Post-session questions for ongoing thinking' },
  { key: 'cohort', label: 'Cohort updates', description: 'Surfaces across cohort membership' },
];

export const lessons = [
  { id: 'l-01', title: 'What is a giving plan?', minutes: 6, scope: 'all', completed: 0.62 },
  { id: 'l-02', title: 'Restricted vs. unrestricted gifts', minutes: 8, scope: 'all', completed: 0.41 },
  { id: 'l-03', title: 'Reading a 990: a non-finance walkthrough', minutes: 11, scope: 'all', completed: 0.28 },
  { id: 'l-04', title: 'Sector landscape: youth sports access', minutes: 9, scope: 'Athletics', completed: 0.55 },
  { id: 'l-05', title: 'When to give to a fiscal sponsor vs. a 501(c)(3)', minutes: 7, scope: 'all', completed: 0.32 },
  { id: 'l-06', title: 'NIL income and giving timing — a working framework', minutes: 10, scope: 'Athletics', completed: 0.46 },
  { id: 'l-07', title: 'Anonymity in giving — what it means and what it costs', minutes: 8, scope: 'all', completed: 0.21 },
  { id: 'l-08', title: 'Year-end giving: timing and tax mechanics', minutes: 9, scope: 'all', completed: 0.38 },
  { id: 'l-09', title: 'Sector landscape: HBCU athletics programs', minutes: 11, scope: 'Athletics', completed: 0.31 },
  { id: 'l-10', title: 'Donor-advised funds: what they do and don\'t do', minutes: 10, scope: 'all', completed: 0.45 },
  { id: 'l-11', title: 'Sector landscape: youth track and access programs', minutes: 9, scope: 'Athletics', completed: 0.27 },
  { id: 'l-12', title: 'Building a giving cycle, not a giving moment', minutes: 9, scope: 'all', completed: 0.30 },
  { id: 'l-13', title: 'When organizations ask for more than money', minutes: 8, scope: 'all', completed: 0.18 },
  { id: 'l-14', title: 'Multi-year vs. one-time gifts: tradeoffs', minutes: 10, scope: 'all', completed: 0.36 },
  { id: 'l-15', title: 'Reading an audit report — a non-finance walkthrough', minutes: 13, scope: 'all', completed: 0.14 },
  { id: 'l-16', title: 'When to fund people, when to fund programs', minutes: 9, scope: 'all', completed: 0.42 },
];

export const spotlights = [
  {
    id: 's-01',
    type: 'spotlight',
    title: 'Black-led foundations gaining ground in athlete-driven philanthropy',
    excerpt: 'A look at five organizations reshaping how athletes direct giving toward Black communities — and the questions advisors should ask before recommending them.',
    publishedAt: 'May 1, 2026',
  },
  {
    id: 's-02',
    type: 'spotlight',
    title: 'The quiet rise of place-based community foundations',
    excerpt: 'Why local infrastructure — not national brands — is where many established donors are concentrating their growth.',
    publishedAt: 'April 22, 2026',
  },
  {
    id: 's-03',
    type: 'spotlight',
    title: 'HBCU athletics: where the funding gaps live',
    excerpt: 'A landscape view of HBCU athletics funding — what works, what hasn\'t, and where athlete philanthropy is finding leverage.',
    publishedAt: 'April 15, 2026',
  },
  {
    id: 's-04',
    type: 'spotlight',
    title: 'Youth sports access programs in the post-NIL era',
    excerpt: 'How athlete-led giving toward youth sports access is evolving as NIL income reshapes the donor profile.',
    publishedAt: 'April 4, 2026',
  },
  {
    id: 's-05',
    type: 'spotlight',
    title: 'Athlete-founded foundations: structural questions to ask early',
    excerpt: 'Most athlete-founded foundations succeed or fail based on decisions made in year one. A short field guide for advisors.',
    publishedAt: 'March 30, 2026',
  },
];

// Sample pipeline state for the between-session pipeline (Section 6)
export const pipelineDefaults = {
  digest: { state: 'Active', cadence: 'Weekly', clientsOnDefault: 19, overrides: 4 },
  notification: { state: 'Active', cadence: 'Event-driven', clientsOnDefault: 22, overrides: 1 },
  spotlight: { state: 'Active', cadence: 'Monthly · first Monday', clientsOnDefault: 15, overrides: 8 },
  reflection: { state: 'Active', cadence: 'Post-session', clientsOnDefault: 23, overrides: 0 },
  cohort: { state: 'Active', cadence: 'As cohort publishes', clientsOnDefault: 12, overrides: 0 },
};
