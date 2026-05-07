// All names, organizations, and figures in this file are fictional.
// Used for demo purposes only.
//
// Phase 1 scope: athletes only. Music, entertainment, and creator
// segments are deferred to phase 2.

export const advisorPracticeProfile = {
  practiceName: "Walker Philanthropic Advisory",
  advisorName: "Morgan Walker",
  advisorTitle: "Principal Advisor",
  practiceFocus: "Athletes in early career",
  yearsActive: 7,
  clientCount: 23,
};

export const clients = [
  {
    id: 'c-001',
    name: 'Marcus Thompson',
    initials: 'MT',
    sport: 'Basketball',
    level: 'Junior college',
    stage: 'Active',
    relationshipStartedYear: 2024,
    summary: 'Junior college basketball; first NIL contract in fall 2024. Family-rooted giving interest, particularly youth sports access in northeast Ohio.',
    nextSession: 'May 14, 2026',
    activeContent: 3,
  },
  {
    id: 'c-002',
    name: 'Jasmine Rivera',
    initials: 'JR',
    sport: 'Soccer',
    level: 'D1 college',
    stage: 'New',
    relationshipStartedYear: 2026,
    summary: 'D1 women\'s soccer; signed first endorsement deal three weeks ago. Onboarding in progress.',
    nextSession: 'May 9, 2026',
    activeContent: 0,
  },
  {
    id: 'c-003',
    name: 'Reuben Asare',
    initials: 'RA',
    sport: 'Track and field',
    level: 'Professional',
    stage: 'Active',
    relationshipStartedYear: 2023,
    summary: 'Professional track athlete; recent sponsorship growth post-World Championships. Interested in pan-African educational nonprofits.',
    nextSession: 'May 15, 2026',
    activeContent: 3,
  },
  {
    id: 'c-004',
    name: 'Ezekiel Banner',
    initials: 'EB',
    sport: 'Football',
    level: 'Retired professional',
    stage: 'Mature',
    relationshipStartedYear: 2021,
    summary: 'Retired NFL defensive back; transitioning to long-term endowment planning. Multiple existing relationships with grantees in his hometown.',
    nextSession: 'June 3, 2026',
    activeContent: 1,
  },
  {
    id: 'c-005',
    name: 'Isaiah Coleman',
    initials: 'IC',
    sport: 'Football',
    level: 'D1 college',
    stage: 'Active',
    relationshipStartedYear: 2024,
    summary: 'D1 college quarterback; significant NIL collective income. Considering structured giving toward HBCU athletics programs.',
    nextSession: 'May 12, 2026',
    activeContent: 2,
  },
  {
    id: 'c-006',
    name: 'Tariq Williams',
    initials: 'TW',
    sport: 'Football',
    level: 'High school',
    stage: 'New',
    relationshipStartedYear: 2026,
    summary: 'Top-ranked high school recruit in Georgia; NIL income via collective. Just beginning to think about giving structure with family.',
    nextSession: 'May 11, 2026',
    activeContent: 0,
  },
  {
    id: 'c-007',
    name: 'Bree Caldwell',
    initials: 'BC',
    sport: 'Basketball',
    level: 'D1 college',
    stage: 'New',
    relationshipStartedYear: 2026,
    summary: 'D1 women\'s basketball; NIL deals from athletic apparel brand. Onboarding sessions in progress.',
    nextSession: 'May 16, 2026',
    activeContent: 1,
  },
  {
    id: 'c-008',
    name: 'Naomi Pierce',
    initials: 'NP',
    sport: 'Track and field',
    level: 'D1 college',
    stage: 'Active',
    relationshipStartedYear: 2024,
    summary: 'Olympic prospect in 400m hurdles; multiple sponsorship streams. Focused on access programs for youth track in underfunded districts.',
    nextSession: 'May 19, 2026',
    activeContent: 2,
  },
  {
    id: 'c-009',
    name: 'Jordan Estes',
    initials: 'JE',
    sport: 'Football',
    level: 'Retired professional',
    stage: 'Sunset',
    relationshipStartedYear: 2019,
    summary: 'Retired NFL veteran; established giving practice. Transitioning to direct foundation governance.',
    nextSession: 'July 7, 2026',
    activeContent: 0,
  },
];

export const stages = ['New', 'Active', 'Mature', 'Sunset'];

// Phase 1 scope: athletics is the only sector. The roster includes a single
// non-categorized "Other" bucket for non-standard cases (e.g., athletes
// with cross-discipline situations).
export const sectors = ['Athletics', 'Other'];

export function clientsByStage(stage) {
  return clients.filter(c => c.stage === stage);
}
