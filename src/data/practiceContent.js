// Practice-authored curriculum content (forks and authored lessons) used to
// demo the advisor's authoring tools. In this prototype the content lives in
// React state only — see PracticeContentContext. The seed below repopulates on
// every page load; mutations made during a session do not survive a refresh.
//
// Each entry:
//   { id, kind, baseId, status, title, minutes, scope, category, summary,
//     createdAt, updatedAt }
//
//   kind     'fork' | 'authored'
//   baseId   string (l-XX) if kind === 'fork', null otherwise
//   status   'published' | 'draft'
//
// Phase 1 scope: athletes only.

export const practiceContentSeed = [
  {
    id: 'pl-001',
    kind: 'fork',
    baseId: 'l-22',
    status: 'published',
    title: 'Writing a first grant inquiry — Walker Advisory variant',
    minutes: 11,
    scope: 'all',
    category: 'workflow',
    summary: 'A tailored version of the base lesson, tuned for athlete clients writing their first formal inquiry. Adds three sample paragraphs drawn from past Walker Advisory engagements (names removed) and a short list of phrasings the practice has learned to avoid.',
    createdAt: '2026-03-08',
    updatedAt: '2026-04-19',
    materials: [
      { id: 'mat-001', type: 'reading', title: 'Sample first-inquiry paragraphs (athlete clients)', fileName: 'first-inquiry-samples-athletes.pdf' },
      { id: 'mat-002', type: 'task', title: 'Draft a one-paragraph inquiry to a candidate organization', fileName: null },
    ],
  },
  {
    id: 'pl-002',
    kind: 'fork',
    baseId: 'l-25',
    status: 'published',
    title: 'Funder transparency criteria — Walker Advisory phrasings',
    minutes: 9,
    scope: 'all',
    category: 'workflow',
    summary: 'A tailored version with the specific transparency phrasings the practice has refined over its first seven years. Same structure as the base lesson; different example language.',
    createdAt: '2026-02-14',
    updatedAt: '2026-02-14',
  },
  {
    id: 'pl-003',
    kind: 'fork',
    baseId: 'l-31',
    status: 'published',
    title: 'Closing an advisory engagement — Walker Advisory handoff',
    minutes: 10,
    scope: 'all',
    category: 'workflow',
    summary: 'A tailored version adapted for the specific shape of Walker Advisory engagements — what transfers to the client\'s foundation team, what stays with the practice file, and what gets re-read aloud in the closing session.',
    createdAt: '2025-11-20',
    updatedAt: '2026-01-09',
  },
  {
    id: 'pl-004',
    kind: 'authored',
    baseId: null,
    status: 'published',
    title: 'Pacing the first six months — Walker Advisory practice notes',
    minutes: 8,
    scope: 'all',
    category: 'primer',
    summary: 'A practice-authored primer on how Walker Advisory paces the first six months of a new client engagement — when to ask which question, what to leave for later, and how to read the early signals.',
    createdAt: '2026-01-15',
    updatedAt: '2026-04-02',
    materials: [
      { id: 'mat-003', type: 'reading', title: 'Six-month cadence map for new athlete clients', fileName: 'six-month-cadence-map.pdf' },
    ],
  },
  {
    id: 'pl-005',
    kind: 'fork',
    baseId: 'l-23',
    status: 'draft',
    title: 'Multi-year grant agreements: what to ask for (working draft)',
    minutes: 12,
    scope: 'all',
    category: 'workflow',
    summary: 'An in-progress tailored version adding renewal-trigger language specific to athlete-funder relationships. Still finding the right level of detail for the exit-provisions section.',
    createdAt: '2026-04-25',
    updatedAt: '2026-05-10',
  },
];

export function getPracticeLessonById(id, lessons) {
  return lessons.find((p) => p.id === id);
}
