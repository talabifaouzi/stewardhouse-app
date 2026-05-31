// Public read API for the unified data layer.
//
// Empty in slice 1 (skeleton + types only). The assembled store + query
// helpers land in slice 6, after the three adapters (slices 2–4) and the
// synthetic seed (slice 5).
//
// Consumers will eventually import from here:
//   import unified from '../../data/unified/index.js';
//   unified.persons, unified.institutions, unified.advisorPractices,
//   unified.programParticipations, unified.gifts, unified.orgs, unified.cohorts,
//   unified.personsBy({type, sourceSurface}), unified.countBy(entity, predicate),
//   unified.byId(entity, id), etc.

export default {};
