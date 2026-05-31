// -----------------------------------------------------------------------------
// Unified data layer — entity typedefs
//
// Seven entities the adapter layer normalizes into. Customer surfaces are NOT
// migrated; their fixtures stay as-is. Each adapter reads its source surface
// and emits these shapes. Every record carries `sourceSurface`.
//
// Locked decisions (see docs/cross-surface-data-model-discovery-2026-05-31.md
// section 7 and the build plan):
// - Adapter only, no source-side migration.
// - Shape-normalization only. Same-person dedup across surfaces is DEFERRED:
//   Marcus appears 3x (once per source) — three Person records, no merging.
// - Stage/cohort taxonomies pass through as-is — no normalization this pass.
// - Inter-entity FK pointers are allowed (per ER-pointer decision 2026-05-31):
//   AdvisorPractice.leadPersonId, Institution.partnerAdvisorPracticeId, etc.
//   These are explicit authored pointers between distinct entities, not
//   same-person identity resolution.
//
// Array-ordering contract:
// - Adapters emit records in source order (athlete 1 before athlete 2, etc.).
// - assemble.js concatenates per-source arrays without re-sorting across
//   sources (enterprise records first if enterprise adapter is first; etc.).
// - Consumers sort per query. The unified store makes no global ordering
//   guarantee beyond source-internal stability.
// -----------------------------------------------------------------------------

/**
 * Source surface a record originated from. One of the SOURCE_SURFACE values
 * exported from ./sources.js: 'individual', 'advisor', 'enterprise', 'synthetic'.
 * @typedef {'individual' | 'advisor' | 'enterprise' | 'synthetic'} SourceSurface
 */

/**
 * A human on the platform. Same person can appear multiple times across
 * different sourceSurface values — no dedup this pass.
 *
 * @typedef {Object} Person
 * @property {string} id                Namespaced: `p-{sourceSurface}-{native-id}`.
 * @property {string} name
 * @property {string} initials
 * @property {'individual' | 'staff' | 'advisor' | 'ops'} type
 * @property {{email: string|null, phone: string|null}} contact
 * @property {SourceSurface} sourceSurface
 * @property {Object} extensions       Per-source opaque bag. Holds
 *                                     surface-specific identifying fields
 *                                     (e.g. extensions.advisor.{sport,
 *                                     level}, extensions.enterprise.{year,
 *                                     position, badge, notes}). For sources
 *                                     where the person has no
 *                                     ProgramParticipation context —
 *                                     currently the individual surface —
 *                                     extensions ALSO carries self-reported
 *                                     giving-identity
 *                                     (extensions.individual.{causes,
 *                                     visibility, budget, givingStyle,
 *                                     givingPlanStatement}). Relationship /
 *                                     advisor work-product data (sessions,
 *                                     privateNotes, givingPlan, pipeline,
 *                                     activity log, lesson/cert state) lives
 *                                     on ProgramParticipation.extensions to
 *                                     match the entity boundary.
 */

/**
 * A customer institution (Phase 1: athletic departments).
 *
 * @typedef {Object} Institution
 * @property {string} id               `inst-{slug}`.
 * @property {string} name
 * @property {string} sector           e.g. 'Athletics'.
 * @property {string} dept             e.g. 'Athletic Department'.
 * @property {{contractTerm: string, tier: string, annual: string, startDate: string|null, endDate: string|null}} contract
 * @property {string|null} partnerAdvisorPracticeId    FK → AdvisorPractice.id.
 * @property {Array<string>} staffPersonIds            FKs → Person.id (compliance officer,
 *                                                     dev director, athletic dept admin, etc.).
 * @property {SourceSurface} sourceSurface
 * @property {Object} extensions
 */

/**
 * A philanthropic advisor practice.
 *
 * @typedef {Object} AdvisorPractice
 * @property {string} id               `practice-{slug}`.
 * @property {string} name
 * @property {string} focus
 * @property {string|null} leadPersonId           FK → Person.id (lead advisor).
 * @property {Array<string>} coAdvisorPersonIds   FKs → Person.id.
 * @property {Array<string>} clientPersonIds      FKs → Person.id (derived from
 *                                                ProgramParticipation records).
 * @property {Array<string>} cohortIds            FKs → Cohort.id.
 * @property {SourceSurface} sourceSurface
 * @property {Object} extensions
 */

/**
 * A person's participation in a program — either an institution's program or
 * an advisor practice's client roster. One Person may have multiple
 * ProgramParticipation records (different contexts).
 *
 * Stage/status values PASS THROUGH from source — context-specific vocabulary
 * is preserved (e.g. advisor 'Active'|'New'|'Mature'|'Sunset',
 * enterprise 'active'|'inactive'|'invited'). No normalization this pass.
 *
 * @typedef {Object} ProgramParticipation
 * @property {string} id
 * @property {string} personId                                       FK → Person.id.
 * @property {'institution' | 'advisor_practice'} contextType
 * @property {string} contextId                                      FK → Institution.id or AdvisorPractice.id.
 * @property {string|null} stage                                     Pass-through from source.
 * @property {string|null} joinDate                                  ISO YYYY-MM-DD where known.
 * @property {string|null} lastActive                                Source-shape (ISO or relative-duration string).
 * @property {SourceSurface} sourceSurface
 * @property {Object} extensions     Per-source bag — e.g. extensions.enterprise.{lessons, gifts,
 *                                   gpsCompleted, certified, activity}; extensions.advisor.{sessions,
 *                                   privateNotes, pipeline, nextSessionAgenda}.
 */

/**
 * A monetary gift event.
 *
 * recipientOrgId is FK → Org.id when the source data links structurally
 * (e.g., gift authored against an org record). When the source only carries
 * a name string (individual gifts ref orgs by name; enterprise gifts embed
 * org name in activity label prose), recipientOrgId is null and
 * recipientOrgName carries the string.
 *
 * @typedef {Object} Gift
 * @property {string} id
 * @property {string} giverPersonId                  FK → Person.id.
 * @property {string|null} recipientOrgId            FK → Org.id (null when source has no FK).
 * @property {string|null} recipientOrgName          Name string when recipientOrgId is null.
 * @property {number} amount                         USD.
 * @property {string|null} date                      Source-shape (ISO YYYY-MM-DD or free-form;
 *                                                   individual gifts are free-form,
 *                                                   enterprise gifts are ISO).
 * @property {string|null} type                      e.g. 'unrestricted' — null when source omits.
 * @property {string|null} vehicle                   e.g. 'personal' | 'daf' — null when source omits.
 * @property {boolean|null} recurring                Null when source omits.
 * @property {SourceSurface} sourceSurface
 */

/**
 * A recipient nonprofit organization.
 *
 * @typedef {Object} Org
 * @property {string} id                             `org-{slug-or-id}`.
 * @property {string} name
 * @property {string|null} ein                       Null when source has no EIN.
 * @property {string} mission
 * @property {Array<string>} causes                  Cause IDs (canonical taxonomy from
 *                                                   intakeData.js CAUSES where applicable).
 * @property {string} geo
 * @property {string|null} cat                       'established' | 'community' | 'emerging' (or null).
 * @property {Array<string>} isExcludedByInstitutionIds   FKs → Institution.id; populated
 *                                                       from enterprise exclusions[] during
 *                                                       enterprise-adapter pass.
 * @property {SourceSurface} sourceSurface
 * @property {Object} extensions                     Per-source bag (years, led, badge,
 *                                                   ed, boardSize, budget, programs[],
 *                                                   topFunders[], demo, etc.).
 */

/**
 * A grouping of Persons. Two distinct concepts share this entity per the
 * locked decision (no rename, no merging):
 * - Advisor "cohort": issue-area or team grouping (e.g. coh-001 "Youth and
 *   school athletics access").
 * - Enterprise "cohort": program-year grouping (e.g. "2026-2027").
 * Filter by sourceSurface to distinguish.
 *
 * @typedef {Object} Cohort
 * @property {string} id
 * @property {string} name
 * @property {string|null} focus
 * @property {string|null} started                   Source-shape date string.
 * @property {string|null} summary
 * @property {Array<string>} memberPersonIds         FKs → Person.id (passed through
 *                                                   from source; no cross-source
 *                                                   reconciliation).
 * @property {SourceSurface} sourceSurface
 * @property {Object} extensions
 */

// This file is type definitions only. Consumers import the runtime
// SOURCE_SURFACE enum from ./sources.js and (once landed in slice 6) the
// assembled store + query helpers from ./index.js.
export {};
