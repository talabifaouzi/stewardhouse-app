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
  { id: 'l-01', title: 'What is a giving plan?', minutes: 6, scope: 'all', category: 'primer', summary: 'A working definition of a giving plan — a written statement of intent that names what the client is funding, where, and at what pace — and what it is not.' },
  { id: 'l-02', title: 'Restricted vs. unrestricted gifts', minutes: 8, scope: 'all', category: 'primer', summary: 'What restriction does at the grantee level: the reporting it asks for, the flexibility it removes, and the situations where each form fits the relationship.' },
  { id: 'l-03', title: 'Reading a 990: a non-finance walkthrough', minutes: 11, scope: 'all', category: 'workflow', summary: 'How to read a Form 990 without a finance background. Where to look for the few signals that matter, and where to stop looking before the document starts shaping conclusions it shouldn\'t.' },
  { id: 'l-04', title: 'Sector landscape: youth sports access', minutes: 9, scope: 'Athletics', category: 'primer', summary: 'An overview of the youth sports access landscape — the categories of organization that operate in it, where they get funded, and where the gaps live.' },
  { id: 'l-05', title: 'When to give to a fiscal sponsor vs. a 501(c)(3)', minutes: 7, scope: 'all', category: 'primer', summary: 'Two structures for receiving a gift. What each one means for the grantee\'s day-to-day, and what each one asks of the donor at the agreement stage.' },
  { id: 'l-06', title: 'NIL income and giving timing — a working framework', minutes: 10, scope: 'Athletics', category: 'primer', summary: 'A framework for thinking about gift timing when income arrives in NIL cycles rather than steady payroll. Cash-flow shape, not amount.' },
  { id: 'l-07', title: 'Anonymity in giving — what it means and what it costs', minutes: 8, scope: 'all', category: 'primer', summary: 'What anonymity buys a donor, what it costs the grantee, and the middle paths between fully public and fully private.' },
  { id: 'l-08', title: 'Year-end giving: timing and tax mechanics', minutes: 9, scope: 'all', category: 'workflow', summary: 'The mechanical questions December raises — postmark dates, appreciated assets, contribution limits — without straying into tax advice.' },
  { id: 'l-09', title: 'Sector landscape: HBCU athletics programs', minutes: 11, scope: 'Athletics', category: 'primer', summary: 'An overview of HBCU athletics programs — the funding history, the structural gaps, and the questions to bring to a first grantee conversation.' },
  { id: 'l-10', title: 'Donor-advised funds: what they do and don\'t do', minutes: 10, scope: 'all', category: 'primer', summary: 'A plain-language read on donor-advised funds. What the structure offers, what it doesn\'t, and where it sits in the broader vehicle landscape.' },
  { id: 'l-11', title: 'Sector landscape: youth track and access programs', minutes: 9, scope: 'Athletics', category: 'primer', summary: 'An overview of youth track and field access programs, with attention to district-level and county-level infrastructure rather than national brands.' },
  { id: 'l-12', title: 'Building a giving cycle, not a giving moment', minutes: 9, scope: 'all', category: 'primer', summary: 'Why the difference between an annual cycle and a one-time moment shapes everything downstream — for the grantee, for the donor\'s own clarity, and for the work itself.' },
  { id: 'l-13', title: 'When organizations ask for more than money', minutes: 8, scope: 'all', category: 'primer', summary: 'Time, voice, board service, public association. How to think about the asks that aren\'t financial, and what each one actually obligates.' },
  { id: 'l-14', title: 'Multi-year vs. one-time gifts: tradeoffs', minutes: 10, scope: 'all', category: 'primer', summary: 'What a multi-year commitment offers the grantee, what it asks of the donor, and the situations where a single year remains the right shape.' },
  { id: 'l-15', title: 'Reading an audit report — a non-finance walkthrough', minutes: 13, scope: 'all', category: 'workflow', summary: 'How to read an audit report without a finance background. The sections that carry weight, the language that signals concern, and what to do with what you find.' },
  { id: 'l-16', title: 'When to fund people, when to fund programs', minutes: 9, scope: 'all', category: 'primer', summary: 'Two grant orientations. How each interacts with the grantee\'s structure, and the situations where the choice is more consequential than it appears.' },
  { id: 'l-17', title: 'Giving Identity: what it is and what it is not', minutes: 7, scope: 'all', category: 'primer', summary: 'An introduction to Giving Identity — the narrative layer of who a donor is in their giving — and how it sits next to, but apart from, Giving Style.' },
  { id: 'l-18', title: 'Place in your story: family, geography, formative experiences', minutes: 6, scope: 'all', category: 'primer', summary: 'The three threads most clients return to when they articulate their giving. How to surface them in conversation without leading.' },
  { id: 'l-19', title: 'Family-anchored giving: when the family is in the room', minutes: 9, scope: 'all', category: 'primer', summary: 'When parents, siblings, or spouses sit in the working sessions. What changes about the room, what changes about the work, and how to let the client\'s own voice still arrive.' },
  { id: 'l-20', title: 'Visibility choices: public, selective, private', minutes: 8, scope: 'all', category: 'primer', summary: 'Three visibility postures and what each one means in practice — for the donor, for the grantee, and for the relationship between them.' },
  { id: 'l-21', title: 'Public giving: when and how to talk about it', minutes: 9, scope: 'all', category: 'primer', summary: 'When public visibility serves the work and when it doesn\'t. How to talk about the giving in a way that names the work rather than the giver.' },
  { id: 'l-22', title: 'Writing a first grant inquiry — structure and tone', minutes: 9, scope: 'all', category: 'workflow', summary: 'What a first grant inquiry typically contains, what tone tends to work, and what overstatement tends to cost. Sample phrasings, not scripts.' },
  { id: 'l-23', title: 'Multi-year grant agreements: what to ask for', minutes: 10, scope: 'all', category: 'workflow', summary: 'The agreement language that protects both sides of a multi-year commitment — reporting cadence, renewal triggers, exit provisions — and what each clause actually does.' },
  { id: 'l-24', title: 'Project funding: agreement language and reporting', minutes: 11, scope: 'all', category: 'workflow', summary: 'How project funding gets written into an agreement and what the reporting obligations cost the grantee in overhead. The hidden tax of restriction.' },
  { id: 'l-25', title: 'Funder transparency criteria — how to phrase them', minutes: 8, scope: 'all', category: 'workflow', summary: 'How to ask a grantee for the transparency that matters without inadvertently asking for the wrong thing. Phrasing that invites rather than audits.' },
  { id: 'l-26', title: 'Reading nonprofit audit reports — what to look for', minutes: 12, scope: 'all', category: 'workflow', summary: 'A more technical companion to the non-finance walkthrough. What specific sections to read line by line, what the auditor\'s letter signals, and what to do with footnote disclosures.' },
  { id: 'l-27', title: 'Cross-border giving: structures and constraints', minutes: 13, scope: 'all', category: 'primer', summary: 'What changes when a gift crosses a border — vehicle options, compliance frames, and the structural constraints that shape what is actually possible.' },
  { id: 'l-28', title: 'Successor planning: what readiness looks like', minutes: 10, scope: 'all', category: 'primer', summary: 'What it means for a successor to be ready — for board service, for grantmaking decisions, for the relationship itself — and how to read that readiness over time.' },
  { id: 'l-29', title: 'Private foundation vs. donor-advised fund: governance trade-offs', minutes: 12, scope: 'all', category: 'primer', summary: 'A side-by-side on the two most common vehicles. Where each one\'s governance structure helps, where it constrains, and the situations that often tip the choice.' },
  { id: 'l-30', title: 'Transitioning to direct foundation governance', minutes: 11, scope: 'all', category: 'workflow', summary: 'The practical work of moving from advisor-supported giving to direct foundation governance. What transfers, what doesn\'t, and what the bridge year tends to require.' },
  { id: 'l-31', title: 'Closing an advisory engagement: documentation handoff', minutes: 9, scope: 'all', category: 'workflow', summary: 'What a clean handoff looks like at the end of an advisory engagement — what documentation transfers, what stays with the practice, and how to close the relationship without leaving the work fragile.' },
];

const lessonsById = new Map(lessons.map((l) => [l.id, l]));

export function getLessonById(id) {
  return lessonsById.get(id);
}

// Resolves a lesson id against the base library first, then a caller-supplied
// list of practice lessons (forks / authored). Use this in any view that may
// receive either kind of id. Callers pass practiceLessons from
// usePracticeContent so the lookup tracks live state.
export function findLesson(id, practiceLessons) {
  return getLessonById(id) ?? practiceLessons.find((p) => p.id === id);
}

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

// Sample pipeline state for the between-session pipeline (Section 6).
// Aggregates reconcile against the 9-client roster in clients.js —
// clientsOnDefault + overrides === 9 per type.
export const pipelineDefaults = {
  digest:       { state: 'Active', cadence: 'Weekly',                clientsOnDefault: 8, overrides: 1 },
  notification: { state: 'Active', cadence: 'Event-driven',          clientsOnDefault: 7, overrides: 2 },
  spotlight:    { state: 'Active', cadence: 'Monthly · first Monday', clientsOnDefault: 6, overrides: 3 },
  reflection:   { state: 'Active', cadence: 'Post-session',          clientsOnDefault: 5, overrides: 4 },
  cohort:       { state: 'Active', cadence: 'As cohort publishes',   clientsOnDefault: 4, overrides: 5 },
};
