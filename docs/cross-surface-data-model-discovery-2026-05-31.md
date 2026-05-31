# Cross-surface data-model discovery

**Date:** 2026-05-31
**Scope:** Map the current data shapes across all three customer surfaces (Individual, Advisor, Enterprise). Foundation for designing the unified data layer that Operations aggregates over. Read-only — no fixtures or surface code touched.
**Branch at review time:** `main` at `a1b505b`.
**Companion doc:** `operations-current-state-2026-05-31.md`

---

## 1. Per-surface data inventory

### Individual surface (`src/surfaces/individual/`)

| File | Exports | Shape |
|---|---|---|
| `data/individualProfile.js` | `individualProfile` (singleton) | `{id: 'c-001', name, initials, sport, level, geoDetail, causes: [{id,label}], visibility: 'public'\|'selective'\|'private', budget, givingStyle, worldLabel}` |
| | `gifts` (array) | `[{id, org: string, amount: number, date: 'Month D, YYYY' (free-form), type: 'unrestricted', vehicle: 'personal'\|'daf', recurring: bool}]` |
| | `givingPlanStatement` (string) | Plain prose — Marcus's GPS narrative |
| | `getFundingSpotlight(causes)` / `fundingSpotlight` | Returns one of 4 cause-keyed variants `{text, source, sourceUrl}` |
| | `getMicroLearning(hasGifts)` / `microLearning` | Conditional copy string |
| | `visibilityInsights` | Keyed by visibility value → `{title, text}` |
| `data/intakeData.js` | `CAUSES` (9 entries: education, arts, sports, food, economic, health, housing, environment, faith) | `[{id, label}]` |
| | `VIS`, `TRUST`, `DEPTH`, `BUDGETS`, `AUTHORITY`, `GEO_OPTIONS`, `STAGES_ATHLETICS` | Intake taxonomy option lists |
| | `deriveGivingStyle(a)`, `deriveCelebration(a)` | Pure derivation from intake answers |
| `data/orgsData.js` | `ORGS` (17 nonprofit fixtures) | `[{id, name, mission, causes[], geo, cat: 'established'\|'community'\|'emerging', years, led, badge, ed, boardSize, budget, programs[], topFunders[], demo}]` |
| | `CAT_META`, `scoreOrg(org, userCauses, userGeo)` | Cause-category metadata + scoring fn |
| `data/themes.js` | `THEMES` | Theme taxonomy (recipient-org cause groupings) |
| `data/cohortSignals.js` | `simulatedMemberSignals` | Cohort intra-member signals |
| `data/teamData.js` | `SAMPLE_GRANTS`, `SAMPLE_EVENTS`, `ROLES` | Team workspace fixtures |

### Advisor surface (`src/surfaces/advisor/`)

| File | Exports | Shape |
|---|---|---|
| `data/clients.js` | `advisorPracticeProfile` (singleton) | `{practiceName, advisorName, advisorTitle, practiceFocus, yearsActive}` |
| | `clients` (9 entries) | `[{id: 'c-001'..'c-009', name, initials, sport, level, stage: 'New'\|'Active'\|'Mature'\|'Sunset', relationshipStartedYear, summary, nextSession (free-form date), activeContent: number, givingPlan: {...}\|null, sessions: [{id,date,title,summary,decisions[],actionItems[]}], privateNotes: [{id,date,content,tags[]}], nextSessionAgenda: {topics[],openThreads[],curriculumLinks[]}, pipeline: [{type, state, source}]}]` |
| | `stages`, `sectors`, `clientsByStage(stage)` | Taxonomy + filter helper |
| `data/cohorts.js` | `cohorts` | `[{id, name, focus, started, nextSession, summary, memberIds: ['c-001',...], externalMembers: number, assignedLessons[], updates[], sessions[]}]` |
| `data/content.js` | `lessons`, `contentTypes`, `spotlights`, `pipelineDefaults`, `getLessonById`, `findLesson` | Curriculum + content-types + pipeline-aggregate defaults |
| `data/practiceContent.js` | `practiceContentSeed`, `getPracticeLessonById` | Practice-author content (forks) |
| `data/documentation.js` | `docCategories`, `findDocById` | Documentation hub categories + docs |
| Shared with Individual | `themes.js`, `cohorts.js` (Individual reads cohorts in CohortView) | — |

### Enterprise surface (`src/surfaces/enterprise/`)

Single file: **`data/enterpriseFixtures.js`** with JSDoc typedefs.

| Export | Shape |
|---|---|
| `INST_PROFILES` (1 entry) | `[{id, sector, name, dept, contract, facilitator, tier, annual, endowment}]` |
| `athletes` (16 entries) | `[{id: int, name, sport, year, position, gpsCompleted, gpsDate: ISO\|null, lessons: int, gifts: int, lastActive: relative-duration str, status: 'active'\|'inactive'\|'invited', joinDate: ISO\|null, badge, certified, certDate: ISO\|null, email, phone, notes, activity: [{date: ISO, type: 'lesson_completed'\|'gift_made'\|'workshop_attended'\|'gps_completed'\|'note_added'\|'certified', label}]}]` |
| `workshops` (5 entries) | `[{id, date: ISO, title, status, attendees, notes, facilitator, module, summary, attendance: [{athleteId: int, attended: bool, note}], followUps: [{id, owner, ownerRole, action, target, status, completedDate?, dueDate?}]}]` |
| `contacts` (5 entries) | `[{id: str, name, title, organization, email, phone, role: 'athletic_dept_admin'\|'facilitator'\|'co_advisor'\|'stewardhouse_rep', bio}]` |
| `exclusions` (5 entries) | `[{id, name, ein, reason, flagged, connection, connectionDetail}]` |
| `complianceAuditLog` (5 entries) | `[{id, timestamp: ISO datetime, user, userRole, action, target?, reason?, notes?}]` |
| `endowmentSnapshot` | `{currentValue, contributionsToDate, growthToDate, asOfDate: ISO, annualContribution, programTerm}` |
| `priorCohortSnapshot` / `currentCohortSnapshot` | `{cohortLabel, athletes, gpsCompleted, gpsRate, certified, certRate, totalGifts, totalDollarsMoved, workshopAttendanceRate, avgWeeklyEngagement, asOfNote}` |
| `engagementWeekDates`, `engagedAthletesByWeek`, `engagementTimeline` (derived) | 12-week activity timeseries |
| `dailyBriefItems` | `{notionalDate: ISO, attention[], priorities[], recentActivity[], upcoming[]}` |
| `athleteReflections` | `{[athleteId]: [{date: ISO, text}]}` (first-person quotes) |
| `CURRENT_USER` | `contacts.find(c => c.id === 'diane')` — single canonical "logged-in user" |
| `T()`, `F()` | Sector-aware terminology helpers (athletics-only currently) |

---

## 2. Shared entities — same concept, different shapes

### Person (athlete / client / individual)

The same human appears in up to three surfaces. **Marcus Thompson is the canonical example: `c-001` in Individual + Advisor, but `id: 1` in Enterprise — different ID scheme, different shape, overlapping fields.**

| Field | Individual `individualProfile` | Advisor `clients[]` | Enterprise `athletes[]` |
|---|---|---|---|
| **id** | `'c-001'` (string) | `'c-001'` (string) | `1` (integer, institution-scoped) |
| name | yes | yes | yes |
| initials | yes | yes | derived from name |
| sport | yes | yes | yes |
| level | `'Junior college'` | `'Junior college'` (matches!) | `year: 'Junior'` + `position: 'Guard'` — different decomposition |
| geo | `geoDetail: 'Cleveland, Ohio area'` | embedded in `givingPlan.geography` | absent (only `email` per institution) |
| causes | `causes: [{id,label}]` (intake taxonomy) | `givingPlan.causes: ['youth basketball', ...]` (free-form strings) + `themes: [...]` | absent (not modeled) |
| visibility | top-level enum | nested in `givingPlan.visibility` | absent |
| budget | top-level string `'$1K–$10K'` | embedded in `givingPlan.annualPace` (prose) | absent |
| giving style | top-level `'Quiet builder'` | implicit in narrative | absent (badge serves a narrative role: `'The Quiet Builder'`) |
| status / stage | derived from intake | `stage: 'Active'\|'New'\|'Mature'\|'Sunset'` | `status: 'active'\|'inactive'\|'invited'` (different vocabulary) + `certified: bool` |
| program progress | `gifts` count derivable | `activeContent: 3` | `lessons: int`, `gifts: int`, `certified`, `gpsCompleted`, `lastActive` |
| sessions/activity | none | `sessions: [...]` (full session records with decisions + action items) | `activity: [...]` (event log of mixed types) |
| notes | none | `privateNotes` (advisor-only, tagged) | `notes` (free string, visible) |
| contact info | none | none | `email`, `phone` |
| Institution link | none | none | implicit via fixture scoping |

**Three shapes of "athlete," none speak to each other.**

### Institution / "Enterprise" customer

| Field | Enterprise `INST_PROFILES[]` | Operations | Anywhere else |
|---|---|---|---|
| id | `'athletics'` (string slug) | not modeled | not modeled |
| name | `'Cooper State University'` | hardcoded literal in Operations activity row | string literal in advisor sessions referencing Cooper State |
| sector | `'Athletics'` | implied by NAV label "Institutions" | — |
| dept | `'Athletic Department'` | — | — |
| contract | free-form string `'Season Residency — Aug 2026 to May 2027'` | — | — |
| facilitator | `'Morgan Walker'` (name string, not an ID/ref) | — | — |
| tier, annual, endowment | strings | — | — |

**INST_PROFILES has only one entry.** Operations Overview claims "4" institutions but no fixture backs it.

### Advisor / facilitator / practice

| Field | Advisor `advisorPracticeProfile` | Enterprise `contacts[]` | Individual |
|---|---|---|---|
| name | `advisorName: 'Morgan Walker'` | `contacts[id='morgan'].name: 'Morgan Walker'` — matches | string in references |
| title | `advisorTitle: 'Principal Advisor'` (advisor surface) | `contacts[id='morgan'].title: 'Founding Partner'` (enterprise surface) — **disagreement** |
| organization | `practiceName: 'Walker Philanthropic Advisory'` | `contacts[id='morgan'].organization: 'Walker Philanthropic Advisory'` — matches |
| focus | `practiceFocus: 'Athletes in early career'` | embedded in `contacts.bio` |
| years | `yearsActive: 7` | not present |
| id | none | `'morgan'` (string slug) |

Morgan Walker has **two titles** across two fixtures.
Co-advisors (N. Park, T. Reeves) exist only in `contacts`, not in `advisorPracticeProfile`.

### Recipient organization

| Field | Individual `ORGS[]` | Enterprise `exclusions[]` (negative space) | Anywhere |
|---|---|---|---|
| id | integer | integer | — |
| name | yes | yes | yes — embedded in `athletes[].activity[].label` prose, not linked |
| ein | absent | yes | — |
| mission | rich | absent | — |
| causes | array | absent | — |
| geo, cat, years, led, etc | full org metadata | absent | — |

**Enterprise athletes' gifts reference orgs by name in prose**, not by ID. Two independent universes.

### Cohort

| Field | Advisor `cohorts[]` | Enterprise | Individual `simulatedMemberSignals` |
|---|---|---|---|
| id | `'coh-001'` | not modeled (workshop attendance is the closest analog) | references advisor cohort IDs |
| name | yes | `currentCohortSnapshot.cohortLabel: '2026-2027'` (year, not name) | — |
| memberIds | `['c-001', 'c-005', 'c-008']` (string IDs) | `engagedAthletesByWeek` uses integer athlete IDs | — |

**Two cohort concepts:** advisor's named issue/team cohort vs enterprise's program-year cohort. Not the same thing; same word.

### Gift / giving event

| Field | Individual `gifts[]` | Advisor `clients[].sessions` | Enterprise `athletes[].activity` filtered `type='gift_made'` |
|---|---|---|---|
| id | `'g-001'` | — | absent (positional) |
| org | string | — | embedded in `label`: `"$250 to Detroit Youth Hoops"` |
| amount | number | — | embedded in `label` (must regex-extract) |
| date | `'March 12, 2026'` (free-form) | — | ISO YYYY-MM-DD (post data slice 1) |
| type | `'unrestricted'` | — | absent |
| vehicle | `'personal'\|'daf'` | — | absent |
| recurring | bool | — | absent |

Enterprise gifts are **prose embedded in activity labels** and must be regex-extracted. Individual gifts are structured. No common field set.

### Lesson / curriculum content

| Field | Advisor `content.js` + `practiceContent.js` | Individual `lessonsData.js` | Enterprise `SetupWizard DEFAULT_LESSONS` + activity labels |
|---|---|---|---|
| id | `'l-22'` | various ids | none — referenced by `"Lesson 1: Building Your GPS"` string |
| Universe | advisor-authored | individual-facing learn content | enterprise program curriculum |

**Three lesson universes.** They overlap in concept but don't share IDs or shape.

---

## 3. Relationships

### Within-surface relationships (currently modeled)

| Surface | Relationship | How |
|---|---|---|
| Advisor | client ↔ cohort | `cohorts[].memberIds` → `clients[].id` |
| Advisor | client ↔ session | nested: `clients[].sessions[]` |
| Advisor | client ↔ pipeline | nested: `clients[].pipeline[]` |
| Advisor | session ↔ curriculum | `nextSessionAgenda.curriculumLinks[].lessonId` → `lessons[].id` |
| Enterprise | athlete ↔ workshop | `workshops[].attendance[].athleteId` (int) → `athletes[].id` (int) |
| Enterprise | athlete ↔ reflection | `athleteReflections[athleteId]` keyed by int id |
| Enterprise | athlete ↔ engagement | `engagedAthletesByWeek[w]: [athleteIds]` |
| Enterprise | follow-up ↔ contact | **name-string match only** (`followUps[].owner === 'Morgan Walker'`) — no foreign key |
| Enterprise | exclusion ↔ audit | **name-string match only** — no foreign key |
| Individual | profile ↔ org recommendation | `scoreOrg(org, profile.causes, profile.geo)` — runtime function, no stored link |
| Individual | profile ↔ cohort | reads `clients` from advisor data to display cohort membership — read-only cross-surface |

### Cross-surface relationships (currently unmodeled)

| Conceptual relationship | Should connect | Reality |
|---|---|---|
| Same person across surfaces | Individual `c-001` ↔ Advisor `c-001` ↔ Enterprise `id:1` | **No link.** Two distinct ID schemes; co-existence is coincidental string equality on names. |
| Athlete ↔ institution | Enterprise `athletes[]` should belong to an INST_PROFILES entry | **Implicit.** Single INST_PROFILES entry, athletes belong by virtue of being in the same fixture file. No `institutionId` field. |
| Athlete ↔ advisor practice | Enterprise athletes attend workshops led by `'Morgan Walker'`, who is `advisorPracticeProfile.advisorName` | **String match only.** No FK from enterprise athlete or workshop to advisor practice. |
| Advisor client ↔ enterprise athlete | Marcus appears in both as the same person | **No link.** |
| Gift ↔ recipient org | Individual gifts reference orgs by string name; Enterprise gifts embed org name in label prose | **No FK to ORGS.** Three independent universes. |
| Engagement signals ↔ cohort | Individual `simulatedMemberSignals` references cohort IDs from advisor data | One half-link via shared cohort ID, but the rest doesn't reciprocate. |

The codebase has **no concept of a shared identity layer**. Each surface assumes itself as the universe.

---

## 4. Conflicts + drift

| Drift | Where | Reconciliation needed |
|---|---|---|
| **ID scheme mismatch** | `'c-001'` (advisor/individual) vs `1` (enterprise) for the same person | Pick one — UUID, slug, or namespaced (`'athlete:cooperstate:1'`). |
| **"Institutions" vs "Enterprise"** | Operations NAV calls it `'Institutions'`; Chrome/surface label is `'Enterprise'`; fixtures call them `INST_PROFILES` | Pick one user-facing term. Code term can stay distinct. |
| **"client" vs "athlete"** | Advisor `clients[]`; Enterprise `athletes[]`; conceptually the same person | Either standardize on `'member'` / `'participant'` (sector-agnostic) or accept the per-context naming and add a shared identity layer underneath. |
| **Stage vocabulary** | Advisor: `New\|Active\|Mature\|Sunset`; Enterprise: `active\|inactive\|invited` (+ `certified` flag) | Two orthogonal axes — advisor stages describe relationship maturity, enterprise statuses describe program engagement. Unified model needs both. |
| **Title disagreements** | Morgan Walker: "Principal Advisor" vs "Founding Partner"; Diane Okonkwo: contacts canonical "Senior Director, Athletic Development" (post Bundle 1) | Canonical source: `contacts[]` record. Operations will need the same canonicalization pattern. |
| **Date format drift** | Individual gifts: `'March 12, 2026'` (free-form); Advisor sessions: ISO; Enterprise (post data slice 1): ISO; Operations: relative `'14 min ago'` literals | Standardize storage on ISO; render via shared formatter (data slice 1 did this for Enterprise; `formatDate.js` exists; Individual still on free-form). |
| **Cause taxonomy** | Individual intake `CAUSES` (9 canonical IDs); Advisor `givingPlan.causes[]` (free-form strings) + `themes[]` (separate slug taxonomy); Enterprise — absent | Pick one taxonomy and apply across; free-form prose loses queryability. |
| **Org references** | Individual gifts ref ORGS by name; Enterprise gifts embed in label prose; ORGS[] live in individual surface only; exclusions in enterprise only | One shared ORGS fixture/table with EIN as canonical id; gifts/exclusions both FK. |
| **Gift shape** | Individual: structured object; Enterprise: prose-embedded; Advisor: not modeled directly | Common Gift entity. |
| **Cohort concept** | Advisor "cohort" (issue/team grouping); Enterprise "cohort" (program-year cohort) | Different concepts; rename one. |
| **Person uniqueness** | Same person can have 3 different records (one per surface) | The unified model is fundamentally a person/identity entity. |

---

## 5. Operations needs — per route

| Operations route | Read needs (in unified terms) |
|---|---|
| **Overview** | Aggregate counts: Persons[type=individual] count; Institutions count; AdvisorPractices count; OpenIssues count. Recent activity (cross-surface activity log). Open issues list. |
| **Individuals** | List of Persons[type=individual] with: name, signup date, last active, gift count, primary causes, visibility setting. Drill-down to a person view. |
| **Institutions** | List of Institutions with: name, sector, contract term, athlete count, partner advisor, status. Drill-down to institution view (the enterprise roster). |
| **Philanthropic Advisors** | List of AdvisorPractices with: practice name, lead advisor, client count, cohort count, sector mix. Drill-down to practice view. |
| **Platform health** | Deploy events, error rate, latency, active sessions (separate operational concern — no fixture overlap with content data). |

Three of five routes are **cross-surface aggregations over person/institution/advisor entities**. Health is a fourth-orthogonal concern.

---

## 6. Persona handling — per surface

| Surface | Pattern | Source | Persona switch possible? |
|---|---|---|---|
| Individual | `userName="Marcus Thompson"`, `userRole="Member · Athletics"` | **Hardcoded string literals** in `IndividualSurface.jsx:75-76` | No (would need to wire to `individualProfile.name`) |
| Advisor | `userName={advisorPracticeProfile.advisorName}`, `userRole={advisorPracticeProfile.advisorTitle}` | Singleton fixture | No (only one practice in fixture) |
| Enterprise | `userName={CURRENT_USER.name}`, `userRole={CURRENT_USER.title}` | `contacts.find(c => c.id === 'diane')` — single canonical (post Cluster A, `bc0beb9`) | Possible by changing the find predicate |
| Operations | `userName="Faouzi Talabi"`, `userRole="Founder"` | **Hardcoded** | No |

**Two surfaces use the same anti-pattern Cluster A just removed from Enterprise** (Individual + Operations). Advisor uses a singleton (no choice). Only Enterprise has a swap-ready pattern, and even that is one-record.

There is **no shared identity entity, no auth concept, no "logged-in user" abstraction that crosses surface boundaries**.

---

## 7. Proposed unified model — design baseline

**Approach decision (locked, 2026-05-31):** ADAPTER layer over existing fixtures. Customer surfaces are NOT migrated. Shape-normalization only; every record tagged with `sourceSurface`. **No cross-surface identity resolution this pass** — the same human in multiple surfaces (Marcus c-001 vs id:1) is NOT deduplicated. Operations shows per-surface populations; no de-duplicated headcount, no person-360.

**Stage/cohort taxonomy:** DEFERRED. Pass context-specific stage/status values through as-is.

**Scale:** SYNTHETIC seed. Add synthetic institutions, advisor practices, and individuals (created directly in unified shape, no source surface) to populate Operations realistically. Kill the fictional 142/4/11 Overview numbers — Overview counts derive from real-adapted + synthetic records.

### Core entities (seven)

```
Person {
  id                                // namespaced per source: 'p-{source}-{native-id}'
  name, initials
  type: 'individual' | 'staff' | 'advisor' | 'ops'
  contact: {email, phone}
  sourceSurface
  extensions: {individual?, advisor?, enterprise?, synthetic?}    // opaque per-source bag
}

Institution {
  id                                // 'inst-{slug}'
  name, sector, dept
  contract: {contractTerm, tier, annual, startDate?, endDate?}
  partnerAdvisorPracticeId          // FK to AdvisorPractice (allowed per ER-pointer decision below)
  sourceSurface
  extensions
}

AdvisorPractice {
  id                                // 'practice-{slug}'
  name, focus
  leadPersonId                      // FK to Person (allowed per ER-pointer decision below)
  coAdvisorPersonIds: []
  clientPersonIds: []               // derived
  cohortIds: []                     // derived
  sourceSurface
  extensions
}

ProgramParticipation {
  id
  personId                          // FK
  contextType: 'institution' | 'advisor_practice'
  contextId                         // FK (institution.id or practice.id)
  stage                             // PASS-THROUGH context-specific values (no normalization)
  joinDate, lastActive
  sourceSurface
  extensions
}

Gift {
  id, giverPersonId, recipientOrgId, recipientOrgName (when no FK), amount, date, type, vehicle, recurring
  sourceSurface
}

Org {
  id, name, ein, mission, causes[], geo, cat, years, led, badge, ...
  isExcludedByInstitutionIds: []
  sourceSurface
}

Cohort {
  id, name, focus, started, summary, memberPersonIds, ...
  sourceSurface
}
```

### Entity-relationship FK decision (recorded 2026-05-31)

**Pragmatic reading: explicit authored pointers between distinct entities ARE allowed.** They are not same-person identity resolution; they are inter-entity FKs that the source data already implies and that the unified shape makes explicit.

Allowed:
- `AdvisorPractice.leadPersonId` may resolve to an enterprise contact (e.g., `'p-enterprise-morgan'`).
- `Institution.partnerAdvisorPracticeId` may resolve to a practice (e.g., `'practice-walker'`).
- Synthetic records carry their own internally-consistent FKs.

Still deferred:
- Same-person dedup across surfaces (Marcus c-001 in individual / c-001 in advisor / id:1 in enterprise → THREE Person records under unified, no merging).

### Surface-current fixtures map onto unified entities as

| Current fixture | Maps to unified |
|---|---|
| `individualProfile` (Marcus) | `Person{type:'individual', sourceSurface:'individual'}` |
| `clients[]` (advisor) | each = `Person` + `ProgramParticipation{contextType:'advisor_practice', contextId:'practice-walker'}` |
| `athletes[]` (enterprise) | each = `Person` + `ProgramParticipation{contextType:'institution', contextId:'inst-cooperstate'}` |
| `contacts[]` (enterprise) | `Person{type:'staff'\|'advisor'\|'ops'}` |
| `advisorPracticeProfile` | one `AdvisorPractice` |
| `INST_PROFILES` | `Institution` |
| `cohorts[]` (advisor) | `Cohort` |
| `gifts[]` (individual) | each = `Gift` |
| Enterprise activity `gift_made` entries | each = `Gift` (after extracting amount + org from label) |
| `ORGS[]` (individual) + `exclusions[]` (enterprise) | unified `Org` table with per-institution exclusion flag |

**Operations becomes natural reads over this:**
- `/operations/individuals` → `Person.where(type='individual')` joined to `Gift` counts and `ProgramParticipation`
- `/operations/institutions` → `Institution` joined to `ProgramParticipation` counts
- `/operations/advisors` → `AdvisorPractice` joined to `ProgramParticipation` and `Cohort` counts
- `/operations` (Overview) → totals across the above
- `/operations/health` → orthogonal — separate metrics layer

---

## Biggest reconciliation risks (carry forward to build)

1. **The same person, three IDs.** Backfilling a Person.id across existing fixtures is the entire migration we are explicitly NOT doing this pass. Under the adapter approach, Marcus shows up as three separate Person records (one per source); Operations sees population totals, not unique humans.
2. **Free-form prose is lossy.** Advisor `givingPlan.causes: ['youth basketball', ...]` and Enterprise gift labels `"$250 to Detroit Youth Hoops"` were never structured. The adapter preserves them in extension bags; consumers either re-parse or surface them as text.
3. **Stage taxonomies don't unify cleanly.** Advisor `New/Active/Mature/Sunset` describes a relationship arc; Enterprise `active/inactive/invited` + `certified` describes program engagement. Per locked decision, both pass through unchanged. Operations displays them per-source.
4. **"Cohort" is two different things.** Advisor's issue-area cohort vs Enterprise's program-year cohort. Per locked decision, no rename; consumers filter by `sourceSurface` if they want one or the other.
5. **The advisor practice is a singleton today.** All multi-practice features Operations would show require synthetic seed (planned: +7 synthetic practices, 8 total).
6. **Operations Overview's hardcoded "142 / 4 / 11" implies a population that has no fixture backing.** Per locked decision, hardcodes are killed and counts derive from real-adapted + synthetic records (planned counts: Individuals 80, Institutions 4, Advisor practices 8).
7. **No auth / no real persona switching.** The unified model assumes a logged-in user; the codebase has no auth. Persona switching is fake (manual prop swap). Backend integration is when the model graduates from fixtures to real data — and when the cross-surface ID scheme has to be settled, not before.
