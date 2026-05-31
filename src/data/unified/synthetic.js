// -----------------------------------------------------------------------------
// Unified data layer — synthetic seed
//
// Hand-authored records that populate Operations realistically alongside the
// adapter output. Customer surfaces are NOT touched. Every record carries
// sourceSurface: 'synthetic'.
//
// What this seed AUTHORS (per slice 5 brief + adjustments):
// - 3 synthetic Institutions (sit alongside Cooper State).
// - 6 synthetic AdvisorPractices (sit alongside Walker Practice).
//   [practice-anchor-bay was dropped pre-write per user instruction; the
//    Olympic-tier angle can re-add later.]
// - 51 synthetic individual Persons (sit alongside the 26 real-adapter
//   individual Persons). Distributed across the 3 institutions (10 each = 30)
//   and the 6 practices (3-4 each = 21). Thin records — no gifts, no
//   sessions, no activity log, no GPS plans, no reflections — preserving
//   real-data truth and avoiding cardboard.
// - 14 synthetic staff/advisor Persons (sit alongside the 5 enterprise
//   contacts). Each synthetic institution gets 2 staff (admin + compliance);
//   each synthetic practice gets 1 lead advisor; two larger practices
//   (Hillcrest + Crestmoor) get an additional co-advisor.
// - 51 synthetic ProgramParticipations (one per synthetic individual).
//
// What this seed does NOT author: gifts, cohorts, orgs (all 0). Synthetic
// individuals do not carry contact info either (Person.contact stays
// {email: null, phone: null}) per slice 5 decision D1.
//
// Inter-entity FK pointers ARE wired here for synthetic-internal records
// (per ER-pointer decision 2026-05-31):
// - Institution.staffPersonIds populated from synthetic staff.
// - Institution.partnerAdvisorPracticeId set on 2 of 3 institutions; 1 left
//   null deliberately so Operations sees a mix of "partnered" / "unpartnered"
//   institution states.
// - AdvisorPractice.leadPersonId + coAdvisorPersonIds populated from
//   synthetic advisor persons.
// - AdvisorPractice.clientPersonIds and cohortIds stay [] — those are
//   derived from ProgramParticipation records in assemble (slice 6).
//
// FIRST-NAME UNIQUENESS contract (per slice 5 adjustment):
// - Every synthetic Person's first name is unique within the synthetic set.
// - No synthetic first name collides with the first name of any real Person
//   in the adapter sources (the REAL_PERSON_FIRST_NAMES set below).
// - runChecks enforces both with HARD failure.
// -----------------------------------------------------------------------------

import { SOURCE_SURFACE } from './sources.js';

const SOURCE = SOURCE_SURFACE.SYNTHETIC;

// Real first names from all three adapter sources — compiled from athletes,
// contacts, advisor clients, individual profile, SetupWizard hardcodes
// (Sarah Mitchell, Sarah Johnson), and the Operations user (Faouzi).
// Synthetic first names must not appear in this set.
const REAL_PERSON_FIRST_NAMES = new Set([
  // enterprise athletes
  'Marcus', 'Aaliyah', 'Devon', 'Jasmine', 'Tyler', 'Keisha', 'Andre', 'Sofia',
  'Chris', 'Maya', 'Elijah', 'Destiny', 'Jordan', 'Mia', 'DeSean', 'Ava',
  // enterprise contacts
  'Diane', 'Morgan',
  // advisor clients (Marcus + Jasmine + Jordan overlap with above)
  'Reuben', 'Ezekiel', 'Isaiah', 'Tariq', 'Bree', 'Naomi',
  // SetupWizard hardcodes
  'Sarah',
  // operations
  'Faouzi',
]);

function deriveInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function firstNameOf(fullName) {
  return fullName.trim().split(/\s+/)[0];
}

// -----------------------------------------------------------------------------
// Institutions (3)
// -----------------------------------------------------------------------------

const SYNTHETIC_INSTITUTIONS = [
  {
    id: 'inst-northern-tech',
    name: 'Northern Tech University',
    sector: 'Athletics',
    dept: 'Athletic Department',
    contract: {
      contractTerm: 'Annual Residency · Sep 2026 to May 2027',
      tier: 'Standard Package',
      annual: '$45,000',
      startDate: null,
      endDate: null,
    },
    partnerAdvisorPracticeId: 'practice-wayfinder',
    staffPersonIds: ['p-synthetic-052', 'p-synthetic-053'],
    sourceSurface: SOURCE,
    extensions: { synthetic: { geo: 'Pittsburgh, PA', endowment: '$4,500/yr' } },
  },
  {
    id: 'inst-westgate',
    name: 'Westgate State College',
    sector: 'Athletics',
    dept: 'Athletics',
    contract: {
      contractTerm: 'Season Residency · Aug 2026 to Apr 2027',
      tier: 'Foundational Package',
      annual: '$25,000',
      startDate: null,
      endDate: null,
    },
    partnerAdvisorPracticeId: null,
    staffPersonIds: ['p-synthetic-054', 'p-synthetic-055'],
    sourceSurface: SOURCE,
    extensions: { synthetic: { geo: 'Indianapolis, IN', endowment: '$2,500/yr' } },
  },
  {
    id: 'inst-river-valley',
    name: 'River Valley University',
    sector: 'Athletics',
    dept: 'Athletic Department',
    contract: {
      contractTerm: 'Season Residency · Aug 2026 to May 2027',
      tier: 'Revenue Sports Package',
      annual: '$85,000',
      startDate: null,
      endDate: null,
    },
    partnerAdvisorPracticeId: 'practice-northstar',
    staffPersonIds: ['p-synthetic-056', 'p-synthetic-057'],
    sourceSurface: SOURCE,
    extensions: { synthetic: { geo: 'Sacramento, CA', endowment: '$8,500/yr' } },
  },
];

// -----------------------------------------------------------------------------
// AdvisorPractices (6)
// -----------------------------------------------------------------------------

const SYNTHETIC_ADVISOR_PRACTICES = [
  {
    id: 'practice-easton',
    name: 'Easton Athlete Advisory',
    focus: 'Early-career athletes in team sports',
    leadPersonId: 'p-synthetic-058',
    coAdvisorPersonIds: [],
    clientPersonIds: [],
    cohortIds: [],
    sourceSurface: SOURCE,
    extensions: { synthetic: { geo: 'Boston, MA', yearsActive: 5 } },
  },
  {
    id: 'practice-hillcrest',
    name: 'Hillcrest Family Office Philanthropy',
    focus: 'Multi-generational athletic family giving',
    leadPersonId: 'p-synthetic-059',
    coAdvisorPersonIds: ['p-synthetic-060'],
    clientPersonIds: [],
    cohortIds: [],
    sourceSurface: SOURCE,
    extensions: { synthetic: { geo: 'Dallas, TX', yearsActive: 11 } },
  },
  {
    id: 'practice-northstar',
    name: 'Northstar Sports Philanthropic Group',
    focus: 'Mid-career professional athletes',
    leadPersonId: 'p-synthetic-061',
    coAdvisorPersonIds: [],
    clientPersonIds: [],
    cohortIds: [],
    sourceSurface: SOURCE,
    extensions: { synthetic: { geo: 'Chicago, IL', yearsActive: 8 } },
  },
  {
    id: 'practice-tributary',
    name: 'Tributary Advisors',
    focus: 'Athletes transitioning out of competition',
    leadPersonId: 'p-synthetic-062',
    coAdvisorPersonIds: [],
    clientPersonIds: [],
    cohortIds: [],
    sourceSurface: SOURCE,
    extensions: { synthetic: { geo: 'New York, NY', yearsActive: 4 } },
  },
  {
    id: 'practice-crestmoor',
    name: 'Crestmoor Philanthropic Partners',
    focus: 'Established veterans of professional sports',
    leadPersonId: 'p-synthetic-063',
    coAdvisorPersonIds: ['p-synthetic-064'],
    clientPersonIds: [],
    cohortIds: [],
    sourceSurface: SOURCE,
    extensions: { synthetic: { geo: 'Washington, DC', yearsActive: 14 } },
  },
  {
    id: 'practice-wayfinder',
    name: 'Wayfinder Athlete Foundation Services',
    focus: 'First-NIL-cycle collegiate athletes',
    leadPersonId: 'p-synthetic-065',
    coAdvisorPersonIds: [],
    clientPersonIds: [],
    cohortIds: [],
    sourceSurface: SOURCE,
    extensions: { synthetic: { geo: 'Atlanta, GA', yearsActive: 3 } },
  },
];

// -----------------------------------------------------------------------------
// Individual Persons (51) + their ProgramParticipations
// Per-individual: [seq, firstName, lastName, sport, contextId, contextType, stage]
// -----------------------------------------------------------------------------

const INDIVIDUAL_ROWS = [
  // Northern Tech (10): 6 active, 2 inactive, 2 invited
  [1,  'Daria',     'Volkov',    'Swimming',       'inst-northern-tech', 'institution', 'active'],
  [2,  'Khalil',    'Foster',    'Football',       'inst-northern-tech', 'institution', 'active'],
  [3,  'Priya',     'Anand',     'Tennis',         'inst-northern-tech', 'institution', 'active'],
  [4,  'Theo',      'Garnier',   'Soccer',         'inst-northern-tech', 'institution', 'active'],
  [5,  'Lila',      'Henderson', 'Volleyball',     'inst-northern-tech', 'institution', 'active'],
  [6,  'Hassan',    'Idris',     'Basketball',     'inst-northern-tech', 'institution', 'active'],
  [7,  'Imani',     'Otieno',    'Track & Field',  'inst-northern-tech', 'institution', 'inactive'],
  [8,  'Cyrus',     'Demetriou', 'Wrestling',      'inst-northern-tech', 'institution', 'inactive'],
  [9,  'Tomoko',    'Sato',      'Gymnastics',     'inst-northern-tech', 'institution', 'invited'],
  [10, 'Felix',     'Marchetti', 'Lacrosse',       'inst-northern-tech', 'institution', 'invited'],
  // Westgate (10): 5 active, 3 inactive, 2 invited
  [11, 'Yara',      'Haddad',    'Soccer',         'inst-westgate',      'institution', 'active'],
  [12, 'Magnus',    'Eriksen',   'Baseball',       'inst-westgate',      'institution', 'active'],
  [13, 'Anya',      'Petrenko',  'Basketball',     'inst-westgate',      'institution', 'active'],
  [14, 'Diego',     'Aguilar',   'Football',       'inst-westgate',      'institution', 'active'],
  [15, 'Suki',      'Yamada',    'Volleyball',     'inst-westgate',      'institution', 'active'],
  [16, 'Demetri',   'Pappas',    'Track & Field',  'inst-westgate',      'institution', 'inactive'],
  [17, 'Kalani',    'Hokulani',  'Swimming',       'inst-westgate',      'institution', 'inactive'],
  [18, 'Ezra',      'Whitfield', 'Tennis',         'inst-westgate',      'institution', 'inactive'],
  [19, 'Selene',    'Argyros',   'Cross Country',  'inst-westgate',      'institution', 'invited'],
  [20, 'Augustine', 'Beaumont',  'Golf',           'inst-westgate',      'institution', 'invited'],
  // River Valley (10): 7 active, 2 inactive, 1 invited
  [21, 'Hana',      'Park',      'Basketball',     'inst-river-valley',  'institution', 'active'],
  [22, 'Lukas',     'Vogel',     'Football',       'inst-river-valley',  'institution', 'active'],
  [23, 'Beatrix',   'Solano',    'Soccer',         'inst-river-valley',  'institution', 'active'],
  [24, 'Roman',     'Novak',     'Baseball',       'inst-river-valley',  'institution', 'active'],
  [25, 'Ines',      'Cardoso',   'Track & Field',  'inst-river-valley',  'institution', 'active'],
  [26, 'Gabriel',   'Nascimento','Football',       'inst-river-valley',  'institution', 'active'],
  [27, 'Astrid',    'Lindqvist', 'Swimming',       'inst-river-valley',  'institution', 'active'],
  [28, 'Vincent',   'Korhonen',  'Wrestling',      'inst-river-valley',  'institution', 'inactive'],
  [29, 'Camila',    'Restrepo',  'Volleyball',     'inst-river-valley',  'institution', 'inactive'],
  [30, 'Bastien',   'Lefevre',   'Tennis',         'inst-river-valley',  'institution', 'invited'],
  // Easton (4): 1 New, 2 Active, 1 Mature
  [31, 'Noor',      'Rahimi',    'Basketball',     'practice-easton',    'advisor_practice', 'New'],
  [32, 'Quentin',   'Albright',  'Soccer',         'practice-easton',    'advisor_practice', 'Active'],
  [33, 'Soraya',    'Najafi',    'Volleyball',     'practice-easton',    'advisor_practice', 'Active'],
  [34, 'Levi',      'Aronson',   'Hockey',         'practice-easton',    'advisor_practice', 'Mature'],
  // Hillcrest (4): 2 Active, 2 Mature
  [35, 'Inara',     'Castellano','Tennis',         'practice-hillcrest', 'advisor_practice', 'Active'],
  [36, 'Wesley',    'Holcomb',   'Golf',           'practice-hillcrest', 'advisor_practice', 'Active'],
  [37, 'Yuki',      'Tanabe',    'Equestrian',     'practice-hillcrest', 'advisor_practice', 'Mature'],
  [38, 'Henrik',    'Sundgren',  'Sailing',        'practice-hillcrest', 'advisor_practice', 'Mature'],
  // Northstar (4): 3 Active, 1 Sunset
  [39, 'Solana',    'Ortiz',     'Basketball',     'practice-northstar', 'advisor_practice', 'Active'],
  [40, 'Mateo',     'Bianchi',   'Soccer',         'practice-northstar', 'advisor_practice', 'Active'],
  [41, 'Iris',      'Brennan',   'Tennis',         'practice-northstar', 'advisor_practice', 'Active'],
  [42, 'Kofi',      'Mensah',    'Track & Field',  'practice-northstar', 'advisor_practice', 'Sunset'],
  // Tributary (3): 1 Active, 2 Mature
  [43, 'Esme',      'Larsson',   'Gymnastics',     'practice-tributary', 'advisor_practice', 'Active'],
  [44, 'Rashid',    'Mehmood',   'Football',       'practice-tributary', 'advisor_practice', 'Mature'],
  [45, 'Junie',     'Achebe',    'Swimming',       'practice-tributary', 'advisor_practice', 'Mature'],
  // Crestmoor (3): 2 Active, 1 Mature
  [46, 'Phoenix',   'Bellweather','Baseball',      'practice-crestmoor', 'advisor_practice', 'Active'],
  [47, 'Adelaide',  'Pemberton', 'Tennis',         'practice-crestmoor', 'advisor_practice', 'Active'],
  [48, 'Saoirse',   'Kavanagh',  'Soccer',         'practice-crestmoor', 'advisor_practice', 'Mature'],
  // Wayfinder (3): 2 New, 1 Active
  [49, 'Cassian',   'Holloway',  'Football',       'practice-wayfinder', 'advisor_practice', 'New'],
  [50, 'Linnea',    'Carlsson',  'Swimming',       'practice-wayfinder', 'advisor_practice', 'New'],
  [51, 'Amir',      'Tahmasebi', 'Basketball',     'practice-wayfinder', 'advisor_practice', 'Active'],
];

// -----------------------------------------------------------------------------
// Staff / advisor Persons (14)
// [seq, firstName, lastName, type, title, organization]
// -----------------------------------------------------------------------------

const STAFF_ROWS = [
  // Institution staff (6)
  [52, 'Reina',      'Castillo',  'staff',   'Compliance Officer',          'Northern Tech University'],
  [53, 'Vikram',     'Patel',     'staff',   'Athletic Department Director','Northern Tech University'],
  [54, 'Eleanor',    'Cho',       'staff',   'Compliance Officer',          'Westgate State College'],
  [55, 'Tobias',     'Pereira',   'staff',   'Athletic Department Director','Westgate State College'],
  [56, 'Imogen',     'Salinas',   'staff',   'Compliance Officer',          'River Valley University'],
  [57, 'Adriana',    'Khoury',    'staff',   'Athletic Department Director','River Valley University'],
  // Practice leads (6)
  [58, 'Olivia',     'Brennan',   'advisor', 'Lead Advisor',                'Easton Athlete Advisory'],
  [59, 'Frederica',  'Sandoval',  'advisor', 'Lead Advisor',                'Hillcrest Family Office Philanthropy'],
  [60, 'James',      'Okada',     'advisor', 'Co-Advisor',                  'Hillcrest Family Office Philanthropy'],
  [61, 'Roberto',    'Halevi',    'advisor', 'Lead Advisor',                'Northstar Sports Philanthropic Group'],
  [62, 'Margaux',    'Olufemi',   'advisor', 'Lead Advisor',                'Tributary Advisors'],
  [63, 'Søren',      'Asante',    'advisor', 'Lead Advisor',                'Crestmoor Philanthropic Partners'],
  [64, 'Caroline',   'Mwangi',    'advisor', 'Co-Advisor',                  'Crestmoor Philanthropic Partners'],
  [65, 'Lennox',     'Tanaka',    'advisor', 'Lead Advisor',                'Wayfinder Athlete Foundation Services'],
];

// -----------------------------------------------------------------------------
// Build the bundle
// -----------------------------------------------------------------------------

function padId(n) {
  return String(n).padStart(3, '0');
}

/**
 * Get the synthetic seed bundle. Pure: same shape every call.
 *
 * @returns {{
 *   persons: Array<Object>,
 *   institutions: Array<Object>,
 *   advisorPractices: Array<Object>,
 *   programParticipations: Array<Object>,
 *   gifts: Array<Object>,
 *   cohorts: Array<Object>,
 *   orgs: Array<Object>,
 * }}
 */
export function getSynthetic() {
  const persons = [];

  // Individual persons (51)
  for (const [seq, firstName, lastName, sport] of INDIVIDUAL_ROWS) {
    const fullName = `${firstName} ${lastName}`;
    persons.push({
      id: `p-synthetic-${padId(seq)}`,
      name: fullName,
      initials: deriveInitials(fullName),
      type: 'individual',
      contact: { email: null, phone: null },
      sourceSurface: SOURCE,
      extensions: { synthetic: { sport } },
    });
  }

  // Staff / advisor persons (14)
  for (const [seq, firstName, lastName, type, title, organization] of STAFF_ROWS) {
    const fullName = `${firstName} ${lastName}`;
    persons.push({
      id: `p-synthetic-${padId(seq)}`,
      name: fullName,
      initials: deriveInitials(fullName),
      type,
      contact: { email: null, phone: null },
      sourceSurface: SOURCE,
      extensions: { synthetic: { title, organization } },
    });
  }

  // ProgramParticipations (51) — one per individual
  const programParticipations = INDIVIDUAL_ROWS.map(
    ([seq, , , , contextId, contextType, stage]) => ({
      id: `pp-synthetic-${padId(seq)}`,
      personId: `p-synthetic-${padId(seq)}`,
      contextType,
      contextId,
      stage,
      joinDate: null,
      lastActive: null,
      sourceSurface: SOURCE,
      extensions: { synthetic: {} },
    }),
  );

  return {
    persons,
    institutions: SYNTHETIC_INSTITUTIONS,
    advisorPractices: SYNTHETIC_ADVISOR_PRACTICES,
    programParticipations,
    gifts: [],
    cohorts: [],
    orgs: [],
  };
}

// -----------------------------------------------------------------------------
// Sanity assertions
// -----------------------------------------------------------------------------

/**
 * Sanity assertions over the synthetic bundle.
 * Returns {pass, errors[], expected{}, actual{}, info{}}.
 *
 * Hard checks (failure = synthetic-seed bug):
 * - Entity counts.
 * - Every record carries sourceSurface === 'synthetic'.
 * - Every participation.personId resolves to a Person in the bundle.
 * - Every participation.contextId resolves to an Institution (when
 *   contextType==='institution') or AdvisorPractice (when 'advisor_practice').
 * - Every institution.staffPersonIds entry resolves to a Person.
 * - Every institution.partnerAdvisorPracticeId (when non-null) resolves to
 *   an AdvisorPractice.
 * - Every practice.leadPersonId (when non-null) resolves to a Person.
 * - Every practice.coAdvisorPersonIds entry resolves to a Person.
 * - First-name uniqueness within the synthetic bundle.
 * - No synthetic first name collides with REAL_PERSON_FIRST_NAMES.
 */
export function runChecks(bundle) {
  const b = bundle || getSynthetic();
  const errors = [];

  const expected = {
    persons: 65, // 51 individuals + 14 staff/advisor
    institutions: 3,
    advisorPractices: 6,
    programParticipations: 51,
    gifts: 0,
    cohorts: 0,
    orgs: 0,
  };
  const actual = {
    persons: b.persons.length,
    institutions: b.institutions.length,
    advisorPractices: b.advisorPractices.length,
    programParticipations: b.programParticipations.length,
    gifts: b.gifts.length,
    cohorts: b.cohorts.length,
    orgs: b.orgs.length,
  };
  for (const key of Object.keys(expected)) {
    if (actual[key] !== expected[key]) {
      errors.push(`${key}: expected ${expected[key]}, got ${actual[key]}`);
    }
  }

  // sourceSurface tag check across all 5 emitted arrays.
  const wrongSource = [];
  const allArrays = [
    ['persons', b.persons],
    ['institutions', b.institutions],
    ['advisorPractices', b.advisorPractices],
    ['programParticipations', b.programParticipations],
  ];
  for (const [arrName, arr] of allArrays) {
    for (const r of arr) {
      if (r.sourceSurface !== SOURCE) {
        wrongSource.push(`${arrName}: ${r.id} sourceSurface=${r.sourceSurface}`);
      }
    }
  }
  if (wrongSource.length > 0) {
    errors.push(`sourceSurface !== 'synthetic': ${JSON.stringify(wrongSource)}`);
  }

  // Referential integrity.
  const personIds = new Set(b.persons.map((p) => p.id));
  const instIds = new Set(b.institutions.map((i) => i.id));
  const practiceIds = new Set(b.advisorPractices.map((p) => p.id));

  const partOrphans = [];
  for (const pp of b.programParticipations) {
    if (!personIds.has(pp.personId)) {
      partOrphans.push({ ppId: pp.id, missing: 'personId', value: pp.personId });
    }
    if (pp.contextType === 'institution' && !instIds.has(pp.contextId)) {
      partOrphans.push({ ppId: pp.id, missing: 'contextId(institution)', value: pp.contextId });
    } else if (pp.contextType === 'advisor_practice' && !practiceIds.has(pp.contextId)) {
      partOrphans.push({ ppId: pp.id, missing: 'contextId(practice)', value: pp.contextId });
    }
  }
  if (partOrphans.length > 0) {
    errors.push(`participation FK orphans: ${JSON.stringify(partOrphans)}`);
  }

  const instOrphans = [];
  for (const inst of b.institutions) {
    for (const sid of inst.staffPersonIds) {
      if (!personIds.has(sid)) instOrphans.push({ instId: inst.id, missing: 'staffPersonId', value: sid });
    }
    if (inst.partnerAdvisorPracticeId !== null && !practiceIds.has(inst.partnerAdvisorPracticeId)) {
      instOrphans.push({ instId: inst.id, missing: 'partnerAdvisorPracticeId', value: inst.partnerAdvisorPracticeId });
    }
  }
  if (instOrphans.length > 0) {
    errors.push(`institution FK orphans: ${JSON.stringify(instOrphans)}`);
  }

  const practiceOrphans = [];
  for (const pr of b.advisorPractices) {
    if (pr.leadPersonId !== null && !personIds.has(pr.leadPersonId)) {
      practiceOrphans.push({ prId: pr.id, missing: 'leadPersonId', value: pr.leadPersonId });
    }
    for (const cid of pr.coAdvisorPersonIds) {
      if (!personIds.has(cid)) practiceOrphans.push({ prId: pr.id, missing: 'coAdvisorPersonId', value: cid });
    }
  }
  if (practiceOrphans.length > 0) {
    errors.push(`practice FK orphans: ${JSON.stringify(practiceOrphans)}`);
  }

  // First-name uniqueness within synthetic bundle.
  const firstNameCounts = {};
  for (const p of b.persons) {
    const fn = firstNameOf(p.name);
    firstNameCounts[fn] = (firstNameCounts[fn] || 0) + 1;
  }
  const dupFirstNames = Object.entries(firstNameCounts)
    .filter(([, n]) => n > 1)
    .map(([fn, n]) => `${fn}×${n}`);
  if (dupFirstNames.length > 0) {
    errors.push(`duplicate first names within synthetic bundle: ${dupFirstNames.join(', ')}`);
  }

  // Collision with real-person first names.
  const collisions = b.persons
    .map((p) => firstNameOf(p.name))
    .filter((fn) => REAL_PERSON_FIRST_NAMES.has(fn));
  if (collisions.length > 0) {
    const unique = [...new Set(collisions)];
    errors.push(`synthetic first names collide with real persons: ${unique.join(', ')}`);
  }

  // Info: per-context participation counts.
  const perContext = {};
  for (const pp of b.programParticipations) {
    perContext[pp.contextId] = (perContext[pp.contextId] || 0) + 1;
  }

  return { pass: errors.length === 0, errors, expected, actual, info: { perContextParticipations: perContext } };
}

export default getSynthetic;
