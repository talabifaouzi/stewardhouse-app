// Public read API for the unified data layer.
//
// Imports the assembled store from ./assemble.js (which runs the three
// adapters + synthetic seed eagerly at module load and wires the deferred
// FKs) and exposes both direct entity-array access and a small set of
// query helpers.
//
// Consumers import this module as the single entry point:
//
//   import unified from '../../data/unified/index.js';
//   unified.persons                            → Array<Person>
//   unified.institutions                       → Array<Institution>
//   unified.advisorPractices                   → Array<AdvisorPractice>
//   unified.programParticipations              → Array<ProgramParticipation>
//   unified.gifts                              → Array<Gift>
//   unified.orgs                               → Array<Org>
//   unified.cohorts                            → Array<Cohort>
//
//   unified.personsBy({type, sourceSurface})   → Array<Person> (both filters optional)
//   unified.participationsByContext(contextId) → Array<ProgramParticipation>
//   unified.giftsByGiver(personId)             → Array<Gift>
//   unified.countBy(entityName, predicate?)    → number
//   unified.byId(entityName, id)               → record | null

import { assembledStore } from './assemble.js';

const {
  persons,
  institutions,
  advisorPractices,
  programParticipations,
  gifts,
  orgs,
  cohorts,
} = assembledStore;

const ENTITY_MAP = {
  persons,
  institutions,
  advisorPractices,
  programParticipations,
  gifts,
  orgs,
  cohorts,
};

const unified = {
  persons,
  institutions,
  advisorPractices,
  programParticipations,
  gifts,
  orgs,
  cohorts,

  personsBy({ type, sourceSurface } = {}) {
    return persons.filter(
      (p) =>
        (type === undefined || p.type === type) &&
        (sourceSurface === undefined || p.sourceSurface === sourceSurface),
    );
  },

  participationsByContext(contextId) {
    return programParticipations.filter((pp) => pp.contextId === contextId);
  },

  giftsByGiver(personId) {
    return gifts.filter((g) => g.giverPersonId === personId);
  },

  countBy(entityName, predicate) {
    const arr = ENTITY_MAP[entityName];
    if (!arr) throw new Error(`unknown entity: ${entityName}`);
    return predicate ? arr.filter(predicate).length : arr.length;
  },

  byId(entityName, id) {
    const arr = ENTITY_MAP[entityName];
    if (!arr) throw new Error(`unknown entity: ${entityName}`);
    return arr.find((r) => r.id === id) || null;
  },
};

export default unified;
