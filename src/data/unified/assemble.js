// -----------------------------------------------------------------------------
// Unified data layer — assemble
//
// Runs all four sources eagerly at module load, concatenates each entity
// array in source order (enterprise → advisor → individual → synthetic) per
// the ordering contract in types.js, and wires the deferred cross-record FKs
// per the slice 6 decisions (A on D5 + A on D6).
//
// FK wiring done here:
// - practice-walker.leadPersonId        = 'p-enterprise-morgan'
// - practice-walker.coAdvisorPersonIds  = ['p-enterprise-npark','p-enterprise-treeves']
// - practice-walker.cohortIds           = all advisor-sourced cohort ids
// - inst-cooperstate.partnerAdvisorPracticeId = 'practice-walker'
// - inst-cooperstate.staffPersonIds     = ['p-enterprise-diane']
// - <every>practice.clientPersonIds     = COMPUTED from programParticipations
//
// Synthetic practices/institutions already wired their own internal FKs in
// synthetic.js — assemble only TOUCHES practices when computing
// clientPersonIds (an overwrite, but synthetic.js left clientPersonIds:[]
// for assemble to populate). leadPersonId / coAdvisorPersonIds / staffPersonIds
// on synthetic records are NOT touched here.
//
// Mutation note: this file mutates a few records returned by the adapters
// in place. Adapter functions are called once at module load and their
// output is not referenced elsewhere — pragmatic over deep-cloning. If the
// assembled store ever needs to coexist with a fresh adapter pass, switch to
// structured clone of the affected records first.
// -----------------------------------------------------------------------------

import { adaptEnterprise } from './adapters/enterprise.js';
import { adaptAdvisor } from './adapters/advisor.js';
import { adaptIndividual } from './adapters/individual.js';
import { getSynthetic } from './synthetic.js';

// Eagerly run all sources (pure, cacheable).
const sources = {
  enterprise: adaptEnterprise(),
  advisor: adaptAdvisor(),
  individual: adaptIndividual(),
  synthetic: getSynthetic(),
};

const ENTITY_NAMES = [
  'persons',
  'institutions',
  'advisorPractices',
  'programParticipations',
  'gifts',
  'orgs',
  'cohorts',
];

// Source-order concatenation. Sources that don't produce an entity contribute [].
function concat(field) {
  return [
    ...(sources.enterprise[field] || []),
    ...(sources.advisor[field] || []),
    ...(sources.individual[field] || []),
    ...(sources.synthetic[field] || []),
  ];
}

const persons = concat('persons');
const institutions = concat('institutions');
const advisorPractices = concat('advisorPractices');
const programParticipations = concat('programParticipations');
const gifts = concat('gifts');
const orgs = concat('orgs');
const cohorts = concat('cohorts');

// ----------------------------------------------------------------------------
// FK wiring at assemble
// ----------------------------------------------------------------------------

// Walker practice — leadPersonId + coAdvisorPersonIds (D6 = A)
const walker = advisorPractices.find((p) => p.id === 'practice-walker');
if (walker) {
  walker.leadPersonId = 'p-enterprise-morgan';
  walker.coAdvisorPersonIds = ['p-enterprise-npark', 'p-enterprise-treeves'];
}

// Cooper State institution — partner + staff (D5 = A)
const cooperstate = institutions.find((i) => i.id === 'inst-cooperstate');
if (cooperstate) {
  cooperstate.partnerAdvisorPracticeId = 'practice-walker';
  cooperstate.staffPersonIds = ['p-enterprise-diane'];
}

// Every practice — clientPersonIds COMPUTED from participations
for (const practice of advisorPractices) {
  practice.clientPersonIds = programParticipations
    .filter(
      (pp) =>
        pp.contextType === 'advisor_practice' && pp.contextId === practice.id,
    )
    .map((pp) => pp.personId);
}

// Walker — cohortIds from advisor-sourced cohorts (synthetic practices have none)
const advisorCohortIds = cohorts
  .filter((c) => c.sourceSurface === 'advisor')
  .map((c) => c.id);
if (walker) {
  walker.cohortIds = advisorCohortIds;
}

// ----------------------------------------------------------------------------
// Export
// ----------------------------------------------------------------------------

export const assembledStore = {
  persons,
  institutions,
  advisorPractices,
  programParticipations,
  gifts,
  orgs,
  cohorts,
  // Preserved so runChecks can do composition integrity against source lengths.
  sources,
};

// ----------------------------------------------------------------------------
// Sanity assertions
// ----------------------------------------------------------------------------

/**
 * Sanity assertions over the assembled store. All expected values are
 * derived from source counts — no hardcoded build-plan numbers.
 *
 * Hard checks:
 * - Composition integrity: each assembled[E].length === sum of source[E]
 *   lengths (no loss, no duplication).
 * - Global ID uniqueness within each entity type across all sources
 *   (namespacing should make this pass even though Marcus has 3 Person records).
 * - Every FK resolves in the assembled store: participation.personId +
 *   contextId, practice.leadPersonId + coAdvisorPersonIds + clientPersonIds
 *   + cohortIds, institution.partnerAdvisorPracticeId + staffPersonIds,
 *   gift.giverPersonId.
 *
 * Returns {pass, errors[], info{}}.
 */
export function runChecks(store) {
  const s = store || assembledStore;
  const errors = [];

  // Composition integrity
  const compositionExpected = {};
  const compositionActual = {};
  for (const name of ENTITY_NAMES) {
    const expected =
      (s.sources.enterprise[name] || []).length +
      (s.sources.advisor[name] || []).length +
      (s.sources.individual[name] || []).length +
      (s.sources.synthetic[name] || []).length;
    const actual = s[name].length;
    compositionExpected[name] = expected;
    compositionActual[name] = actual;
    if (actual !== expected) {
      errors.push(`composition ${name}: expected ${expected}, got ${actual}`);
    }
  }

  // Global ID uniqueness within each entity type
  for (const name of ENTITY_NAMES) {
    const ids = s[name].map((r) => r.id);
    const uniqueCount = new Set(ids).size;
    if (uniqueCount !== ids.length) {
      const counts = {};
      ids.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });
      const dups = Object.entries(counts)
        .filter(([, n]) => n > 1)
        .map(([id, n]) => `${id}×${n}`);
      errors.push(`${name} id collisions: ${dups.join(', ')}`);
    }
  }

  // FK resolution
  const personIds = new Set(s.persons.map((p) => p.id));
  const instIds = new Set(s.institutions.map((i) => i.id));
  const practiceIds = new Set(s.advisorPractices.map((p) => p.id));
  const cohortIdSet = new Set(s.cohorts.map((c) => c.id));

  // Participations
  const partOrphans = [];
  for (const pp of s.programParticipations) {
    if (!personIds.has(pp.personId)) {
      partOrphans.push({ id: pp.id, missing: 'personId', value: pp.personId });
    }
    if (pp.contextType === 'institution' && !instIds.has(pp.contextId)) {
      partOrphans.push({
        id: pp.id,
        missing: 'contextId(institution)',
        value: pp.contextId,
      });
    } else if (
      pp.contextType === 'advisor_practice' &&
      !practiceIds.has(pp.contextId)
    ) {
      partOrphans.push({
        id: pp.id,
        missing: 'contextId(practice)',
        value: pp.contextId,
      });
    }
  }
  if (partOrphans.length) {
    errors.push(`participation FK orphans: ${JSON.stringify(partOrphans)}`);
  }

  // Practices
  const practiceOrphans = [];
  for (const pr of s.advisorPractices) {
    if (pr.leadPersonId !== null && !personIds.has(pr.leadPersonId)) {
      practiceOrphans.push({
        id: pr.id,
        missing: 'leadPersonId',
        value: pr.leadPersonId,
      });
    }
    for (const c of pr.coAdvisorPersonIds) {
      if (!personIds.has(c)) {
        practiceOrphans.push({
          id: pr.id,
          missing: 'coAdvisorPersonId',
          value: c,
        });
      }
    }
    for (const c of pr.clientPersonIds) {
      if (!personIds.has(c)) {
        practiceOrphans.push({
          id: pr.id,
          missing: 'clientPersonId',
          value: c,
        });
      }
    }
    for (const c of pr.cohortIds) {
      if (!cohortIdSet.has(c)) {
        practiceOrphans.push({ id: pr.id, missing: 'cohortId', value: c });
      }
    }
  }
  if (practiceOrphans.length) {
    errors.push(`practice FK orphans: ${JSON.stringify(practiceOrphans)}`);
  }

  // Institutions
  const instOrphans = [];
  for (const inst of s.institutions) {
    if (
      inst.partnerAdvisorPracticeId !== null &&
      !practiceIds.has(inst.partnerAdvisorPracticeId)
    ) {
      instOrphans.push({
        id: inst.id,
        missing: 'partnerAdvisorPracticeId',
        value: inst.partnerAdvisorPracticeId,
      });
    }
    for (const sid of inst.staffPersonIds) {
      if (!personIds.has(sid)) {
        instOrphans.push({
          id: inst.id,
          missing: 'staffPersonId',
          value: sid,
        });
      }
    }
  }
  if (instOrphans.length) {
    errors.push(`institution FK orphans: ${JSON.stringify(instOrphans)}`);
  }

  // Gifts
  const giftOrphans = [];
  for (const g of s.gifts) {
    if (!personIds.has(g.giverPersonId)) {
      giftOrphans.push({
        id: g.id,
        missing: 'giverPersonId',
        value: g.giverPersonId,
      });
    }
  }
  if (giftOrphans.length) {
    errors.push(`gift FK orphans: ${JSON.stringify(giftOrphans)}`);
  }

  return {
    pass: errors.length === 0,
    errors,
    info: {
      composition: { expected: compositionExpected, actual: compositionActual },
    },
  };
}
