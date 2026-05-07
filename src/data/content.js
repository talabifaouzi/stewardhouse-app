// Fictional content items used for demo of curriculum library + pipeline.

export const contentTypes = [
  { key: 'digest', label: 'Digest', description: 'Periodic summary across topics' },
  { key: 'notification', label: 'Notification', description: 'Event-driven, no cadence' },
  { key: 'spotlight', label: 'Sector spotlight', description: 'Editorial deep-dive on a topic or organization type' },
  { key: 'reflection', label: 'Reflection prompt', description: 'Post-session questions for ongoing thinking' },
  { key: 'cohort', label: 'Cohort updates', description: 'Surfaces across cohort membership' },
];

export const lessons = [
  { id: 'l-01', title: 'What is a giving plan?', minutes: 6, sector: 'all', completed: 0.62 },
  { id: 'l-02', title: 'Restricted vs. unrestricted gifts', minutes: 8, sector: 'all', completed: 0.41 },
  { id: 'l-03', title: 'Reading a 990: a non-finance walkthrough', minutes: 11, sector: 'all', completed: 0.28 },
  { id: 'l-04', title: 'Sector landscape: youth sports access', minutes: 9, sector: 'Athletics', completed: 0.55 },
  { id: 'l-05', title: 'When to give to a fiscal sponsor vs. a 501(c)(3)', minutes: 7, sector: 'all', completed: 0.32 },
  { id: 'l-06', title: 'Sector landscape: arts education in K-12', minutes: 10, sector: 'Music', completed: 0.49 },
  { id: 'l-07', title: 'Anonymity in giving — what it means and what it costs', minutes: 8, sector: 'all', completed: 0.21 },
  { id: 'l-08', title: 'Year-end giving: timing and tax mechanics', minutes: 9, sector: 'all', completed: 0.38 },
  { id: 'l-09', title: 'Sector landscape: legal aid for immigrant communities', minutes: 11, sector: 'Entertainment', completed: 0.34 },
  { id: 'l-10', title: 'Donor-advised funds: what they do and don\'t do', minutes: 10, sector: 'all', completed: 0.45 },
  { id: 'l-11', title: 'Sector landscape: mental health for women of color', minutes: 12, sector: 'Creator', completed: 0.27 },
  { id: 'l-12', title: 'Building a giving cycle, not a giving moment', minutes: 9, sector: 'all', completed: 0.30 },
  { id: 'l-13', title: 'When organizations ask for more than money', minutes: 8, sector: 'all', completed: 0.18 },
  { id: 'l-14', title: 'Multi-year vs. one-time gifts: tradeoffs', minutes: 10, sector: 'all', completed: 0.36 },
  { id: 'l-15', title: 'Reading an audit report — a non-finance walkthrough', minutes: 13, sector: 'all', completed: 0.14 },
  { id: 'l-16', title: 'When to fund people, when to fund programs', minutes: 9, sector: 'all', completed: 0.42 },
];

export const spotlights = [
  {
    id: 's-01',
    type: 'spotlight',
    title: 'Black-led foundations gaining ground in athlete-driven philanthropy',
    excerpt: 'A look at five organizations reshaping how athletes direct giving toward Black communities — and the questions advisors should ask before recommending them.',
    sectors: ['Athletics', 'Music'],
    publishedAt: 'May 1, 2026',
  },
  {
    id: 's-02',
    type: 'spotlight',
    title: 'The quiet rise of place-based community foundations',
    excerpt: 'Why local infrastructure — not national brands — is where many established donors are concentrating their growth.',
    sectors: ['Athletics', 'Entertainment', 'Music', 'Creator'],
    publishedAt: 'April 22, 2026',
  },
  {
    id: 's-03',
    type: 'spotlight',
    title: 'Funding K-12 arts: what works, what hasn\'t',
    excerpt: 'A landscape view of arts education funding over the last decade, with patterns and persistent gaps.',
    sectors: ['Music', 'Creator'],
    publishedAt: 'April 15, 2026',
  },
  {
    id: 's-04',
    type: 'spotlight',
    title: 'Legal aid networks for immigrant communities',
    excerpt: 'How regional legal aid networks structure their work — and how donors can find leverage beyond direct service.',
    sectors: ['Entertainment'],
    publishedAt: 'April 4, 2026',
  },
  {
    id: 's-05',
    type: 'spotlight',
    title: 'Women-of-color-led mental health organizations',
    excerpt: 'A growing field with very few institutional funders — what advisors should know before introducing.',
    sectors: ['Creator'],
    publishedAt: 'March 30, 2026',
  },
];

// Sample pipeline state for "Section 6" between-session pipeline
export const pipelineDefaults = {
  digest: { state: 'Active', cadence: 'Weekly', clientsOnDefault: 19, overrides: 4 },
  notification: { state: 'Active', cadence: 'Event-driven', clientsOnDefault: 22, overrides: 1 },
  spotlight: { state: 'Active', cadence: 'Monthly · first Monday', clientsOnDefault: 15, overrides: 8 },
  reflection: { state: 'Active', cadence: 'Post-session', clientsOnDefault: 23, overrides: 0 },
  cohort: { state: 'Active', cadence: 'As cohort publishes', clientsOnDefault: 12, overrides: 0 },
};
