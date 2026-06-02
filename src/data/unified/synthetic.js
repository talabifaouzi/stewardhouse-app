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
import { adaptEnterprise } from './adapters/enterprise.js';
import { adaptAdvisor } from './adapters/advisor.js';
import { adaptIndividual } from './adapters/individual.js';

const SOURCE = SOURCE_SURFACE.SYNTHETIC;

// ConnectionRequest seed parameters (slice A).
//
// All CRs in this slice carry sourceSurface = 'synthetic' (decision D1) —
// no upstream source (enterprise/advisor/individual) emits ConnectionRequests;
// the entity is born here. The CR seed still draws facts from the adapter
// outputs: 21 CRs at stage 'gave'/'ongoing' are anchored to existing Gift
// records (18 enterprise + 3 individual), so gaveAt === Gift.date exactly.
//
// Marcus the funder is p-individual-c-001 — the Person record carrying the
// explicit giving identity (Marcus also exists as p-advisor-c-001 and
// p-enterprise-m-001; same-person dedup is deferred). All Marcus CRs use
// p-individual-c-001 as giverPersonId.
const PRE_GAVE_BASE = '2026-02-01';      // start of the ~120-day pre-gave window
const MARCUS_FUNDER_ID = 'p-individual-c-001';

// Stage-time spacing (days) for synthesized pre-gave timestamps.
const DAYS_MATCHED_TO_VIEWED = 5;
const DAYS_VIEWED_TO_CONNECTED = 7;
const DAYS_CONNECTED_TO_CONVERSING = 10;
// Backwards offsets for anchored CRs: matched..conversing precede gaveAt.
// Same numeric spacing, applied as subtractions from gaveAt.
const DAYS_CONVERSING_TO_GAVE = 10;
const DAYS_CONNECTED_TO_GAVE = DAYS_CONNECTED_TO_CONVERSING + DAYS_CONVERSING_TO_GAVE; // 20
const DAYS_VIEWED_TO_GAVE = DAYS_VIEWED_TO_CONNECTED + DAYS_CONNECTED_TO_GAVE;          // 27
const DAYS_MATCHED_TO_GAVE = DAYS_MATCHED_TO_VIEWED + DAYS_VIEWED_TO_GAVE;              // 32
const DAYS_GAVE_TO_ONGOING = 60;

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
// ConnectionRequest helpers (slice A)
// -----------------------------------------------------------------------------

// Pure ISO-date addition. Uses Date.UTC for the arithmetic (no string-parsing
// timezone issues — only purely-numeric inputs go in). Avoids the
// new Date('YYYY-MM-DD') UTC-day-shift gotcha the enterprise slice hit.
function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d) + days * 86_400_000;
  const dt = new Date(ms);
  const y2 = dt.getUTCFullYear();
  const m2 = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d2 = String(dt.getUTCDate()).padStart(2, '0');
  return `${y2}-${m2}-${d2}`;
}

// Build the per-stage timestamp bag for a pre-gave CR. Each populated
// timestamp is strictly later than the previous (DAYS_* spacings).
function preGaveTimestamps(matchedAt, stage) {
  const t = {
    matchedAt,
    viewedAt: null,
    connectedAt: null,
    conversingAt: null,
    gaveAt: null,
    ongoingAt: null,
  };
  if (stage === 'matched') return t;
  t.viewedAt = addDays(matchedAt, DAYS_MATCHED_TO_VIEWED);
  if (stage === 'viewed') return t;
  t.connectedAt = addDays(t.viewedAt, DAYS_VIEWED_TO_CONNECTED);
  if (stage === 'connected') return t;
  t.conversingAt = addDays(t.connectedAt, DAYS_CONNECTED_TO_CONVERSING);
  if (stage === 'conversing') return t;
  throw new Error(`preGaveTimestamps: not a pre-gave stage: ${stage}`);
}

// Build the per-stage timestamp bag for a Gift-anchored CR. gaveAt MUST
// equal the anchored Gift's actual date (no contradicting synthesis);
// matched..conversing precede it; ongoingAt follows it when present.
function anchoredTimestamps(giftDate, isOngoing) {
  const matchedAt = addDays(giftDate, -DAYS_MATCHED_TO_GAVE);
  const viewedAt = addDays(giftDate, -DAYS_VIEWED_TO_GAVE);
  const connectedAt = addDays(giftDate, -DAYS_CONNECTED_TO_GAVE);
  const conversingAt = addDays(giftDate, -DAYS_CONVERSING_TO_GAVE);
  return {
    matchedAt,
    viewedAt,
    connectedAt,
    conversingAt,
    gaveAt: giftDate,
    ongoingAt: isOngoing ? addDays(giftDate, DAYS_GAVE_TO_ONGOING) : null,
  };
}

function nameToOrgId(name, orgs) {
  const match = orgs.find((o) => o.name === name);
  return match ? match.id : null;
}

/**
 * Build the synthetic ConnectionRequest seed (105 records). All records
 * carry sourceSurface = 'synthetic' regardless of which source's Gift
 * they anchor to (decision D1).
 *
 * Spread (current-stage counts): matched 50 · viewed 20 · connected 10 ·
 * conversing 4 · gave 16 · ongoing 5. Funnel-cumulative reads:
 * reachedMatched 105 → viewed 55 → connected 35 → conversing 25 → gave 21
 * → ongoing 5.
 *
 * Ground-truth anchors (21 CRs):
 * - Marcus's 3 individual gifts → 3 'ongoing' (giverPersonId = MARCUS_FUNDER_ID).
 * - Enterprise gifts (18) sorted by date ascending; the earliest 2 become
 *   'ongoing' (oldest giving relationships read as continuing); the
 *   remaining 16 stay 'gave'.
 *
 * Pre-gave allocation (84 CRs):
 * - Marcus: 3 matched + 2 viewed + 1 connected + 1 conversing = 7 CRs
 *   targeting orgs that don't collide with Marcus's anchored 3 (by org name).
 * - Other persons (77 slots): one CR per non-Marcus individual across
 *   16 enterprise athletes + 9 advisor clients + 51 synthetic individuals,
 *   plus 1 extra synthetic CR (p-synthetic-001 second org), totaling 77.
 *   Stage assigned by slot index: positions 0-46 matched (47), 47-64 viewed
 *   (18), 65-73 connected (9), 74-76 conversing (3).
 *
 * Org target rule: cycle the 17-org catalog by index. targetOrgId is the
 * matched catalog Org.id; targetOrgName is the catalog Org.name. For anchored
 * CRs, targetOrgName comes from the Gift's recipientOrgName; targetOrgId is
 * populated via name-match against the catalog (null when no match).
 *
 * @param {ReturnType<typeof adaptEnterprise>} enterprise
 * @param {ReturnType<typeof adaptAdvisor>} advisor
 * @param {ReturnType<typeof adaptIndividual>} individual
 * @returns {Array<Object>} ConnectionRequest records
 */
function buildConnectionRequests(enterprise, advisor, individual) {
  const orgs = individual.orgs;
  const crs = [];
  let seq = 0;
  const nextId = () => `cr-synthetic-${++seq}`;

  // Phase 1 — Marcus's 3 individual gifts → 3 'ongoing' CRs.
  for (const g of individual.gifts) {
    crs.push({
      id: nextId(),
      giverPersonId: MARCUS_FUNDER_ID,
      targetOrgId: nameToOrgId(g.recipientOrgName, orgs),
      targetOrgName: g.recipientOrgName,
      stage: 'ongoing',
      stageTimestamps: anchoredTimestamps(g.date, true),
      giftId: g.id,
      sourceSurface: SOURCE,
      extensions: {},
    });
  }

  // Phase 2 — 18 enterprise gifts → 2 'ongoing' (earliest) + 16 'gave'.
  // Sort by date ascending; ties broken by gift id for determinism.
  const enterpriseGiftsSorted = [...enterprise.gifts].sort((a, b) => {
    const dCmp = a.date.localeCompare(b.date);
    return dCmp !== 0 ? dCmp : a.id.localeCompare(b.id);
  });
  enterpriseGiftsSorted.forEach((g, i) => {
    const isOngoing = i < 2;
    crs.push({
      id: nextId(),
      giverPersonId: g.giverPersonId,
      targetOrgId: nameToOrgId(g.recipientOrgName, orgs),
      targetOrgName: g.recipientOrgName,
      stage: isOngoing ? 'ongoing' : 'gave',
      stageTimestamps: anchoredTimestamps(g.date, isOngoing),
      giftId: g.id,
      sourceSurface: SOURCE,
      extensions: {},
    });
  });

  // Phase 3 — Marcus's 7 pre-gave CRs (3m + 2v + 1c + 1conv).
  // Avoid org names Marcus already targets via Phase 1.
  const marcusUsedOrgNames = new Set(
    crs
      .filter((c) => c.giverPersonId === MARCUS_FUNDER_ID)
      .map((c) => c.targetOrgName),
  );
  const marcusStageOrder = [
    'matched', 'matched', 'matched',
    'viewed', 'viewed',
    'connected',
    'conversing',
  ];
  let marcusOrgIdx = 0;
  marcusStageOrder.forEach((stage, k) => {
    // Pick next catalog org Marcus doesn't already target.
    while (marcusUsedOrgNames.has(orgs[marcusOrgIdx % orgs.length].name)) {
      marcusOrgIdx += 1;
    }
    const targetOrg = orgs[marcusOrgIdx % orgs.length];
    marcusOrgIdx += 1;
    marcusUsedOrgNames.add(targetOrg.name);
    // Spread Marcus pre-gave matchedAt dates ~7 days apart across the window.
    const matchedAt = addDays(PRE_GAVE_BASE, k * 7);
    crs.push({
      id: nextId(),
      giverPersonId: MARCUS_FUNDER_ID,
      targetOrgId: targetOrg.id,
      targetOrgName: targetOrg.name,
      stage,
      stageTimestamps: preGaveTimestamps(matchedAt, stage),
      giftId: null,
      sourceSurface: SOURCE,
      extensions: {},
    });
  });

  // Phase 4 — 77 pre-gave CRs across non-Marcus individuals.
  // Persons in deterministic order: 16 enterprise athletes (source order) +
  // 9 advisor clients (source order) + 51 synthetic individuals (1..51),
  // plus 1 extra synthetic (p-synthetic-001 second org) = 77 slots.
  const enterpriseAthletes = enterprise.persons.filter((p) => p.type === 'individual');
  const advisorClients = advisor.persons.filter((p) => p.type === 'individual');
  const syntheticIndividualIds = [];
  for (let i = 1; i <= 51; i += 1) {
    syntheticIndividualIds.push(`p-synthetic-${String(i).padStart(3, '0')}`);
  }
  const otherPersonIds = [
    ...enterpriseAthletes.map((p) => p.id),
    ...advisorClients.map((p) => p.id),
    ...syntheticIndividualIds,
    syntheticIndividualIds[0], // extra: p-synthetic-001 second CR
  ];

  // Stage assignment by slot index — 47 matched + 18 viewed + 9 connected + 3 conversing.
  const stageForSlot = (i) => {
    if (i < 47) return 'matched';
    if (i < 47 + 18) return 'viewed';
    if (i < 47 + 18 + 9) return 'connected';
    return 'conversing';
  };

  otherPersonIds.forEach((personId, i) => {
    const targetOrg = orgs[i % orgs.length];
    const matchedAt = addDays(PRE_GAVE_BASE, i % 119); // spread across the ~120-day window
    crs.push({
      id: nextId(),
      giverPersonId: personId,
      targetOrgId: targetOrg.id,
      targetOrgName: targetOrg.name,
      stage: stageForSlot(i),
      stageTimestamps: preGaveTimestamps(matchedAt, stageForSlot(i)),
      giftId: null,
      sourceSurface: SOURCE,
      extensions: {},
    });
  });

  return crs;
}

// -----------------------------------------------------------------------------
// Build the bundle
// -----------------------------------------------------------------------------

function padId(n) {
  return String(n).padStart(3, '0');
}

/**
 * Get the synthetic seed bundle. Pure: same shape every call.
 *
 * Calls the three adapters internally to source the existing Gift records
 * the ConnectionRequest seed anchors to (decision: keep getSynthetic's
 * argless signature stable; adapters are pure and cheap to re-run).
 *
 * @returns {{
 *   persons: Array<Object>,
 *   institutions: Array<Object>,
 *   advisorPractices: Array<Object>,
 *   programParticipations: Array<Object>,
 *   gifts: Array<Object>,
 *   cohorts: Array<Object>,
 *   orgs: Array<Object>,
 *   connectionRequests: Array<Object>,
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

  // ConnectionRequests (105) — slice A seed.
  // Pull adapter bundles for Gift anchoring (21 anchored CRs reference real
  // Gifts; gaveAt === Gift.date exactly). Adapters are pure; re-calling them
  // here is cheap and keeps getSynthetic's argless signature unchanged.
  const enterprise = adaptEnterprise();
  const advisor = adaptAdvisor();
  const individual = adaptIndividual();
  const connectionRequests = buildConnectionRequests(enterprise, advisor, individual);

  return {
    persons,
    institutions: SYNTHETIC_INSTITUTIONS,
    advisorPractices: SYNTHETIC_ADVISOR_PRACTICES,
    programParticipations,
    gifts: [],
    cohorts: [],
    orgs: [],
    connectionRequests,
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
    connectionRequests: 105, // slice A seed
  };
  const actual = {
    persons: b.persons.length,
    institutions: b.institutions.length,
    advisorPractices: b.advisorPractices.length,
    programParticipations: b.programParticipations.length,
    gifts: b.gifts.length,
    cohorts: b.cohorts.length,
    orgs: b.orgs.length,
    connectionRequests: b.connectionRequests.length,
  };
  for (const key of Object.keys(expected)) {
    if (actual[key] !== expected[key]) {
      errors.push(`${key}: expected ${expected[key]}, got ${actual[key]}`);
    }
  }

  // sourceSurface tag check across all emitted arrays (incl. connectionRequests).
  const wrongSource = [];
  const allArrays = [
    ['persons', b.persons],
    ['institutions', b.institutions],
    ['advisorPractices', b.advisorPractices],
    ['programParticipations', b.programParticipations],
    ['connectionRequests', b.connectionRequests],
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

  // ConnectionRequest-specific hard checks.
  // Current-stage distribution must match the approved spread (D2).
  const expectedStageCounts = {
    matched: 50,
    viewed: 20,
    connected: 10,
    conversing: 4,
    gave: 16,
    ongoing: 5,
  };
  const actualStageCounts = {
    matched: 0, viewed: 0, connected: 0, conversing: 0, gave: 0, ongoing: 0,
  };
  for (const cr of b.connectionRequests) {
    if (cr.stage in actualStageCounts) {
      actualStageCounts[cr.stage] += 1;
    } else {
      errors.push(`unknown CR stage: ${cr.id} stage=${cr.stage}`);
    }
  }
  for (const key of Object.keys(expectedStageCounts)) {
    if (actualStageCounts[key] !== expectedStageCounts[key]) {
      errors.push(
        `CR stage ${key}: expected ${expectedStageCounts[key]}, got ${actualStageCounts[key]}`,
      );
    }
  }

  // giftId presence rule: REQUIRED at 'gave'/'ongoing'; null at all earlier stages.
  const giftIdViolations = [];
  for (const cr of b.connectionRequests) {
    const isAtGave = cr.stage === 'gave' || cr.stage === 'ongoing';
    if (isAtGave && cr.giftId === null) {
      giftIdViolations.push({ id: cr.id, stage: cr.stage, reason: 'null giftId at gave/ongoing' });
    }
    if (!isAtGave && cr.giftId !== null) {
      giftIdViolations.push({ id: cr.id, stage: cr.stage, reason: `non-null giftId at ${cr.stage}` });
    }
  }
  if (giftIdViolations.length > 0) {
    errors.push(`CR giftId presence violations: ${JSON.stringify(giftIdViolations)}`);
  }

  // Stage-timestamp monotonicity per CR (any non-null timestamp implies all
  // earlier-stage timestamps are non-null AND non-decreasing).
  const STAGE_ORDER = ['matchedAt', 'viewedAt', 'connectedAt', 'conversingAt', 'gaveAt', 'ongoingAt'];
  const monotonicityViolations = [];
  for (const cr of b.connectionRequests) {
    const ts = cr.stageTimestamps;
    let lastSeen = null;
    let firstNullIdx = -1;
    for (let i = 0; i < STAGE_ORDER.length; i += 1) {
      const v = ts[STAGE_ORDER[i]];
      if (v === null) {
        if (firstNullIdx === -1) firstNullIdx = i;
      } else {
        if (firstNullIdx !== -1) {
          monotonicityViolations.push({
            id: cr.id,
            reason: `non-null ${STAGE_ORDER[i]} after null ${STAGE_ORDER[firstNullIdx]}`,
          });
        }
        if (lastSeen !== null && v < lastSeen) {
          monotonicityViolations.push({
            id: cr.id,
            reason: `${STAGE_ORDER[i]}=${v} precedes prior ${lastSeen}`,
          });
        }
        lastSeen = v;
      }
    }
  }
  if (monotonicityViolations.length > 0) {
    errors.push(`CR stage-timestamp monotonicity: ${JSON.stringify(monotonicityViolations)}`);
  }

  // gaveAt MUST equal anchored Gift.date exactly (D3 correction).
  // Cross-check by collecting all anchored CRs and verifying via Gift lookup.
  // We re-pull adapter outputs once here for the cross-check; pure call.
  const allGifts = [
    ...adaptEnterprise().gifts,
    ...adaptIndividual().gifts,
  ];
  const giftById = new Map(allGifts.map((g) => [g.id, g]));
  const gaveAtViolations = [];
  for (const cr of b.connectionRequests) {
    if (cr.giftId === null) continue;
    const g = giftById.get(cr.giftId);
    if (!g) continue; // FK-orphan check is in assemble.runChecks; skip here
    if (cr.stageTimestamps.gaveAt !== g.date) {
      gaveAtViolations.push({
        id: cr.id,
        giftId: cr.giftId,
        gaveAt: cr.stageTimestamps.gaveAt,
        giftDate: g.date,
      });
    }
  }
  if (gaveAtViolations.length > 0) {
    errors.push(`CR gaveAt ≠ Gift.date: ${JSON.stringify(gaveAtViolations)}`);
  }

  // Cumulative-reached funnel (D1 correction): each later stage must be
  // a subset of all earlier stages. Returned as info for read-API self-tests.
  const reached = { matched: 0, viewed: 0, connected: 0, conversing: 0, gave: 0, ongoing: 0 };
  for (const cr of b.connectionRequests) {
    for (const stageName of Object.keys(reached)) {
      if (cr.stageTimestamps[`${stageName}At`] !== null) reached[stageName] += 1;
    }
  }
  // Hard check: funnel is non-increasing.
  const funnelOrder = ['matched', 'viewed', 'connected', 'conversing', 'gave', 'ongoing'];
  for (let i = 1; i < funnelOrder.length; i += 1) {
    if (reached[funnelOrder[i]] > reached[funnelOrder[i - 1]]) {
      errors.push(
        `funnel non-monotonic: reached.${funnelOrder[i]}=${reached[funnelOrder[i]]} > reached.${funnelOrder[i - 1]}=${reached[funnelOrder[i - 1]]}`,
      );
    }
  }
  // Hard check: reachedMatched === total CR count (every CR has matchedAt).
  if (reached.matched !== b.connectionRequests.length) {
    errors.push(
      `reached.matched=${reached.matched} ≠ connectionRequests.length=${b.connectionRequests.length}`,
    );
  }

  // Info: per-context participation counts; current-stage counts; reached counts.
  const perContext = {};
  for (const pp of b.programParticipations) {
    perContext[pp.contextId] = (perContext[pp.contextId] || 0) + 1;
  }

  return {
    pass: errors.length === 0,
    errors,
    expected,
    actual,
    info: {
      perContextParticipations: perContext,
      currentStageCounts: actualStageCounts,
      reachedCounts: reached,
    },
  };
}

export default getSynthetic;
