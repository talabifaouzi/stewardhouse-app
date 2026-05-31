// -----------------------------------------------------------------------------
// Unified data layer — advisor adapter
//
// Pure function: reads clients.js + cohorts.js, returns unified-shape records
// conforming to ../types.js. Tags every record sourceSurface: 'advisor'.
// Emits in source order. Does not mutate source fixtures.
//
// FK wiring across entities is DEFERRED to assemble.js (slice 6):
// - AdvisorPractice.leadPersonId stays null here.
// - AdvisorPractice.coAdvisorPersonIds stays [] here.
// - AdvisorPractice.clientPersonIds stays [] here (derived in assemble from
//   programParticipations).
// - AdvisorPractice.cohortIds stays [] here (derived in assemble).
//
// Entity-boundary placement (per slice 3 decision A):
// - Person.extensions.advisor holds IDENTIFYING fields only (sport, level).
// - Deep relationship records (givingPlan, sessions, privateNotes,
//   nextSessionAgenda, pipeline, summary, activeContent, nextSession,
//   relationshipStartedYear) live on ProgramParticipation.extensions.advisor.
//
// joinDate (per slice 3 decision B):
// - Source carries year-only `relationshipStartedYear`. We do NOT invent a
//   day/month. ProgramParticipation.joinDate stays null; the year remains
//   visible via ProgramParticipation.extensions.advisor.relationshipStartedYear.
// -----------------------------------------------------------------------------

import { clients, advisorPracticeProfile } from '../../clients.js';
import { cohorts } from '../../cohorts.js';
import { SOURCE_SURFACE } from '../sources.js';

const SOURCE = SOURCE_SURFACE.ADVISOR;
const PRACTICE_ID = 'practice-walker';

function deriveInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/**
 * Run the advisor adapter. Pure: does not mutate source fixtures, returns
 * a fresh bundle each call.
 *
 * @returns {{
 *   persons: Array<Object>,
 *   advisorPractices: Array<Object>,
 *   programParticipations: Array<Object>,
 *   cohorts: Array<Object>,
 *   nullGivingPlanCount: number,
 * }}
 */
export function adaptAdvisor() {
  // Persons (9) — one per client
  const persons = [];
  for (const c of clients) {
    persons.push({
      id: `p-advisor-${c.id}`,
      name: c.name,
      // Source already carries initials; fall through to derivation if absent.
      initials: c.initials || deriveInitials(c.name),
      type: 'individual',
      contact: { email: null, phone: null },
      sourceSurface: SOURCE,
      extensions: {
        advisor: {
          sport: c.sport,
          level: c.level,
        },
      },
    });
  }

  // AdvisorPractices (1) — from singleton fixture
  const advisorPractices = [
    {
      id: PRACTICE_ID,
      name: advisorPracticeProfile.practiceName,
      focus: advisorPracticeProfile.practiceFocus,
      // FK wiring deferred to assemble (slice 6).
      leadPersonId: null,
      coAdvisorPersonIds: [],
      clientPersonIds: [],
      cohortIds: [],
      sourceSurface: SOURCE,
      extensions: {
        advisor: {
          advisorName: advisorPracticeProfile.advisorName,
          advisorTitle: advisorPracticeProfile.advisorTitle,
          yearsActive: advisorPracticeProfile.yearsActive,
        },
      },
    },
  ];

  // ProgramParticipations (9) — one per client
  const programParticipations = [];
  for (const c of clients) {
    programParticipations.push({
      id: `pp-advisor-${c.id}`,
      personId: `p-advisor-${c.id}`,
      contextType: 'advisor_practice',
      contextId: PRACTICE_ID,
      stage: c.stage, // pass-through, no normalization
      joinDate: null, // decision B — year-only precision preserved in extensions
      lastActive: null, // not modeled at advisor surface
      sourceSurface: SOURCE,
      extensions: {
        advisor: {
          relationshipStartedYear: c.relationshipStartedYear,
          summary: c.summary,
          activeContent: c.activeContent,
          nextSession: c.nextSession,
          givingPlan: c.givingPlan, // null for pre-plan clients (e.g. c-002 Jasmine)
          sessions: c.sessions,
          privateNotes: c.privateNotes,
          nextSessionAgenda: c.nextSessionAgenda,
          pipeline: c.pipeline,
        },
      },
    });
  }

  // Cohorts (2)
  const cohortsOut = [];
  for (const co of cohorts) {
    cohortsOut.push({
      id: co.id,
      name: co.name,
      focus: co.focus,
      started: co.started,
      summary: co.summary,
      // Member IDs stay advisor-namespaced; no cross-source reconciliation
      // (per locked decision — same-person dedup is deferred).
      memberPersonIds: co.memberIds.map((id) => `p-advisor-${id}`),
      sourceSurface: SOURCE,
      extensions: {
        advisor: {
          nextSession: co.nextSession,
          externalMembers: co.externalMembers,
          assignedLessons: co.assignedLessons,
          updates: co.updates,
          sessions: co.sessions,
        },
      },
    });
  }

  const nullGivingPlanCount = clients.filter((c) => c.givingPlan === null).length;

  return {
    persons,
    advisorPractices,
    programParticipations,
    cohorts: cohortsOut,
    nullGivingPlanCount,
  };
}

/**
 * Sanity assertions over an adapter bundle (or a fresh adapter run).
 * Returns {pass, errors[], expected{}, actual{}, info{}}.
 *
 * Hard checks (failure = adapter bug): persons, advisorPractices,
 * programParticipations, cohorts counts; every cohort.memberPersonIds entry
 * must resolve to a Person in this adapter's output (orphan refs = bug).
 *
 * Informational only: count of clients with null givingPlan (e.g. pre-plan
 * stage). Not a failure — preserved as null on ProgramParticipation.
 */
export function runChecks(adapted) {
  const bundle = adapted || adaptAdvisor();

  const expected = {
    persons: 9,
    advisorPractices: 1,
    programParticipations: 9,
    cohorts: 2,
  };
  const actual = {
    persons: bundle.persons.length,
    advisorPractices: bundle.advisorPractices.length,
    programParticipations: bundle.programParticipations.length,
    cohorts: bundle.cohorts.length,
  };

  const errors = [];
  for (const key of Object.keys(expected)) {
    if (actual[key] !== expected[key]) {
      errors.push(`${key}: expected ${expected[key]}, got ${actual[key]}`);
    }
  }

  // Hard check: every cohort member ID must resolve to a Person in this bundle.
  const personIds = new Set(bundle.persons.map((p) => p.id));
  const orphans = [];
  for (const co of bundle.cohorts) {
    for (const mid of co.memberPersonIds) {
      if (!personIds.has(mid)) {
        orphans.push({ cohortId: co.id, memberPersonId: mid });
      }
    }
  }
  if (orphans.length > 0) {
    errors.push(`cohort member orphans: ${JSON.stringify(orphans)}`);
  }

  const info = {
    nullGivingPlanClients: bundle.nullGivingPlanCount,
    note:
      'Clients without a givingPlan (e.g. pre-plan / New stage) — preserved ' +
      'as null in ProgramParticipation.extensions.advisor.givingPlan.',
  };

  return { pass: errors.length === 0, errors, expected, actual, info };
}

export default adaptAdvisor;
