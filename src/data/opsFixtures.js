// Operations operator persona — separate file because the Operations operator
// is a distinct persona from the Enterprise athletic-department admin that
// lives in enterpriseFixtures.js. Reusing the Enterprise CURRENT_USER would
// cross-wire two surfaces' personas.

export const CURRENT_OPS_USER = {
  name: 'Faouzi Talabi',
  role: 'Founder',
};

// Demonstrative roster (O-2 — Ruling 1.1 demo mode; see
// docs/operations-roster-scoping.md). The five local seed identities (Q7:
// Marcus, Morgan, Reese, Diane, Jordan) in the roster's column shape.
//
// This is a CLEANED demonstrative set, NOT a verbatim mirror of the 0010/0011
// seed rows: (1) readable invite emails on the RFC 2606 `example.org`
// documentation domain replace the seeds' `demo-*@example.invalid` placeholders,
// which read as broken in a table; (2) a claimed/invited mix demonstrates BOTH
// account states (the local seeds are all unbound, which would show an
// all-"invited" column — uninformative). Labeled demonstrative in the UI per §7.
// O-3 replaces this fixture with GET /api/roster live data; the auth tree never
// renders it (honest interim state instead — Ruling 1.1's one-view-honest rule).
//
// status: 'claimed' = a bound account (auth_user_id set); 'invited' = a
// pre-seeded person row awaiting first sign-in. No scoring/ranking (Path B) —
// these are lifecycle states, not judgments.
export const DEMO_ROSTER = [
  { type: 'individual', displayName: 'Marcus Thompson', inviteEmail: 'marcus.thompson@example.org', status: 'claimed', sourceSurface: 'individual', createdAt: '2026-01-12' },
  { type: 'ops',        displayName: 'Reese Donovan',   inviteEmail: 'reese.donovan@example.org',   status: 'claimed', sourceSurface: 'operations', createdAt: '2026-01-05' },
  { type: 'advisor',    displayName: 'Morgan Walker',   inviteEmail: 'morgan.walker@example.org',   status: 'invited', sourceSurface: 'advisor',    createdAt: '2026-02-03' },
  { type: 'staff',      displayName: 'Diane Okonkwo',   inviteEmail: 'diane.okonkwo@example.org',   status: 'invited', sourceSurface: 'enterprise', createdAt: '2026-02-18' },
  { type: 'staff',      displayName: 'Jordan Avery',    inviteEmail: 'jordan.avery@example.org',    status: 'invited', sourceSurface: 'enterprise', createdAt: '2026-02-18' },
];
