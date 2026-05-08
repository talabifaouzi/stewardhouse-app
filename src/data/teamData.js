// Team Workspace fixtures — grants, calendar events, role definitions.
// Used until grant management is wired to live data.

export const SAMPLE_GRANTS = [
  { id: 1, org: 'Lighthouse Youth Center', amount: 5000, type: 'unrestricted', vehicle: 'daf', commitment: { total: 3, paid: 1, nextDate: 'Jul 15, 2026' }, agreement: 'signed', report: { status: 'pending', due: 'Sep 1, 2026' }, ack: 'received' },
  { id: 2, org: 'NextStep Scholars', amount: 2500, type: 'unrestricted', vehicle: 'personal', commitment: null, agreement: null, report: null, ack: 'pending' },
  { id: 3, org: 'Southside Community Arts', amount: 10000, type: 'directed', vehicle: 'daf', commitment: { total: 2, paid: 0, nextDate: 'Aug 1, 2026' }, agreement: 'sent', report: { status: 'pending', due: 'Dec 1, 2026' }, ack: 'pending' },
  { id: 4, org: 'Fresh Futures Academy', amount: 1000, type: 'unrestricted', vehicle: 'personal', commitment: null, agreement: null, report: null, ack: 'received' },
];

export const SAMPLE_EVENTS = [
  { id: 1, date: 'Jul 15', title: 'Payment due — Lighthouse Youth Center ($5,000)', type: 'payment' },
  { id: 2, date: 'Aug 1', title: 'Payment due — Southside Community Arts ($10,000)', type: 'payment' },
  { id: 3, date: 'Aug 20', title: 'Site visit — Lighthouse Youth Center', type: 'visit' },
  { id: 4, date: 'Sep 1', title: 'Report due — Lighthouse Youth Center', type: 'report' },
  { id: 5, date: 'Oct 15', title: 'Annual giving review', type: 'review' },
  { id: 6, date: 'Nov 1', title: 'Tax season prep — gather acknowledgments', type: 'tax' },
];

export const ROLES = [
  { id: 'guardian', label: 'Guardian', desc: 'Parent / Legal Guardian', sees: 'GPS summary, gift history, payments, agreements, full workspace', notSees: 'Can view all — has financial authority' },
  { id: 'manager', label: 'Manager', desc: 'Assistant / Chief of Staff', sees: 'Payments, acknowledgments, agreements, calendar, gift history', notSees: 'GPS content, personal answers' },
  { id: 'financial', label: 'Financial Advisor', desc: 'CPA / Financial Advisor', sees: 'Payment history, vehicles, acknowledgments, annual summary', notSees: 'GPS, relationship notes, org details' },
  { id: 'advisor', label: 'Philanthropic Advisor', desc: 'Giving Strategy Advisor', sees: 'GPS, giving strategy, org relationships, reports', notSees: 'Payment details, bank info, tax docs' },
  { id: 'agent', label: 'Agent', desc: 'Agent / Manager / Rep', sees: 'GPS summary, giving status, pending solicitations', notSees: 'Gift amounts, financial details, personal answers' },
];
