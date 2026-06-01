# Operations Overview — discovery (2026-06-01)

Read-only audit, no code changes. Captures the current state of the
Operations Overview surface, the data available from the unified layer,
the gap between what the redesign might want and what real data can power
today, and what each customer surface exposes that an operator might need
to monitor.

Source files referenced:
- `src/surfaces/operations/OperationsSurface.jsx` — current Overview
- `src/data/unified/index.js` — public read API
- `src/data/unified/assemble.js` — store assembly + FK wiring + `runChecks()`
- `src/data/unified/types.js` — entity typedefs
- `src/data/unified/adapters/{enterprise,advisor,individual}.js` — source adapters
- `src/data/unified/synthetic.js` — synthetic seed

Repo state at audit start: `main` HEAD `c890976`, working tree clean,
branch `discovery-operations-overview` cut from `main`.

---

## 1. Current state — `OperationsHome` (lines 61–166 of `OperationsSurface.jsx`)

The Overview currently renders four blocks in order:

### 1a. Header block
- Eyebrow: "Internal · StewardHouse staff"
- H1: "Operations"
- Lede paragraph: "Monitor and support across all three end-user surfaces. View user activity, surface issues, and provide support. This view is internal-only and is never exposed to platform users."

### 1b. Stat tile grid (4 tiles)

| # | Label | Value source | Sub-label | Real or hardcoded |
|---|---|---|---|---|
| 1 | Individuals | `unified.personsBy({ type: 'individual' }).length` → **77** | "On platform" | **Real** (computed at module load) |
| 2 | Institutions | `unified.countBy('institutions')` → **4** | "Active programs" | **Real** (count), but the "Active" qualifier is unsubstantiated — no contract-status filter is applied |
| 3 | Advisor Practices | `unified.countBy('advisorPractices')` → **7** | "On platform" | **Real** (count) |
| 4 | Open issues | hardcoded `"2"` | "Awaiting response" | **Hardcoded** — no Issues entity exists |

The three derived tiles compute eagerly at module load via three `const`
captures at the top of `OperationsSurface.jsx` (lines 11–13). They will
update if the underlying source data changes; they are not memoized
state.

### 1c. Recent activity card (4 rows — all hardcoded literals)

The `<ActivityRow>` instances at lines 118–121 are static JSX with
hardcoded `time`, `surface`, and `detail` props. Each row also picks a
surface accent color via the `surfaceColors` lookup inside
`ActivityRow` (lines 169–173). The actual content:

1. "14 min ago" · Philanthropic Advisor · "Morgan Walker created a new fork of 'Reading a 990' lesson"
2. "2 hr ago" · Individual · "Marcus Thompson reviewed his giving plan"
3. "3 hr ago" · Enterprise · "Cooper State University · 3 athletes added to roster"
4. "6 hr ago" · Philanthropic Advisor · "Cohort 'Cooper State Tigers — basketball' published an update"

No activity stream entity exists in the unified layer; no source feeds
this card. It is purely decorative.

### 1d. Open issues card (2 rows — both hardcoded literals)

Two hardcoded issue entries at lines 130–161:

1. "Cloudflare deploy fails after merge" · "Filed 2 hours ago · platform health"
2. "Reuben Asare reports content not surfacing" · "Filed yesterday · individual support"

No Issues entity exists. The tile count (`"2"`) and the card list are
both hardcoded; they happen to agree but the agreement is coincidence,
not derivation.

### 1e. Inventory of real vs hardcoded

| Element | Real | Hardcoded |
|---|---|---|
| Individuals stat value | ✓ | |
| Institutions stat value | ✓ | |
| Advisor Practices stat value | ✓ | |
| Open issues stat value (`"2"`) | | ✓ |
| Recent activity rows (4) | | ✓ |
| Open issues card list (2) | | ✓ |
| Stat tile sub-labels ("On platform", "Active programs", "Awaiting response") | | static strings, not derived |

**Net:** 3 of the 4 stat tiles read real data; the Recent activity card
and the Open issues card + count are 100% decorative.

---

## 2. Available data — what the unified layer actually exposes today

### 2a. Public API surface (`src/data/unified/index.js`)

Direct entity arrays:
- `unified.persons` (96 records)
- `unified.institutions` (4 records: 1 real Cooper State + 3 synthetic)
- `unified.advisorPractices` (7 records: 1 real Walker + 6 synthetic)
- `unified.programParticipations` (76 records: 16 enterprise + 9 advisor + 51 synthetic)
- `unified.gifts` (21 records: 18 enterprise + 3 individual; synthetic seed currently emits none)
- `unified.orgs` (17 records: all individual source — the 17-org catalog)
- `unified.cohorts` (2 records: both advisor / Walker)

Query helpers:
- `unified.personsBy({ type, sourceSurface })` — filter persons by type (individual/staff/advisor/ops) and/or sourceSurface
- `unified.participationsByContext(contextId)` — list participations within an institution or practice
- `unified.giftsByGiver(personId)` — gifts a given person made
- `unified.countBy(entityName, predicate?)` — counted under optional predicate
- `unified.byId(entityName, id)` — point lookup

### 2b. Person breakdown by type and source

Of the 96 persons:
- **type: individual** → 77 (1 individual-source Marcus + 16 enterprise athletes + 9 advisor clients + 51 synthetic individuals)
- **type: staff** → 8 (enterprise contacts mapped to `staff`)
- **type: advisor** → 11 (enterprise contacts with `facilitator`/`co_advisor` role + synthetic advisors)
- **type: ops** → 0 (no operations-role persons modeled yet)

`personsBy({ sourceSurface })` enables per-source counts:
- enterprise: 21 (16 athletes + 5 contacts)
- advisor: 9 (Walker clients)
- individual: 1 (Marcus)
- synthetic: 65 (51 individuals + 14 staff/advisor)

### 2c. Aggregates derivable from the assembled store today

Direct counts (no work):
- Total persons, institutions, practices, participations, gifts, orgs, cohorts
- Per-type person counts (individual / staff / advisor / ops)
- Per-source person counts
- Per-institution participant count via `participationsByContext`
- Per-practice client count via `participationsByContext` (or precomputed `practice.clientPersonIds.length` — wired in assemble)
- Per-person gift count + total via `giftsByGiver`

Aggregates derivable with simple iteration (no new entity):

| Aggregate | How derived | Notes |
|---|---|---|
| Total gift dollars (all sources) | sum `g.amount` over `unified.gifts` | 21 records; some `amount === null` for unparsed labels (enterprise has 0 unparsed per `runChecks`) |
| Per-institution gift dollars | sum gifts of athletes whose participation contextId matches | Walker advisor practice currently has zero Gift records (giving plans live as participation extensions, not Gift entities) |
| Per-org gift dollars | group `unified.gifts` by `recipientOrgName` | `recipientOrgId` is null for all current gifts; only name-string match available |
| Gift recipients touching the 17-org catalog | name-match between `Gift.recipientOrgName` and `Org.name` | structural FK wiring deferred; resolvable lazily |
| Participation stage histogram | tally `pp.stage` per `pp.contextType` | Advisor uses New/Active/Mature/Sunset; enterprise uses active/inactive/invited — pass-through, no normalization |
| Last-active recency buckets | inspect `pp.lastActive` | Advisor stores `null`; enterprise stores ISO or relative-duration strings (mixed) |
| GPS completion rate (enterprise) | count participations where `extensions.enterprise.gpsCompleted === true` | Enterprise only — concept doesn't exist on advisor/individual |
| Certification rate (enterprise) | count where `extensions.enterprise.certified === true` | Enterprise only |
| Lesson-completed count per athlete | sum activity entries where `type === 'lesson_completed'` in `extensions.enterprise.activity` | Enterprise only; 44 entries across 12 athletes per Cluster B work |
| Sessions count per advisor client | length of `extensions.advisor.sessions` | Advisor only |
| Pipeline-state distribution per content type | iterate `extensions.advisor.pipeline` across all advisor participations | Advisor only; defaults reconcile to 9 clients per CLAUDE.md invariant |
| Org coverage by cause | group `unified.orgs` by `causes[]` | Static catalog; no usage signal |
| Walker cohort composition | `unified.cohorts[i].memberPersonIds` | Cohort entity exists for advisor; enterprise/synthetic emit none |
| Institution staff count | length of `inst.staffPersonIds` | Wired only for `inst-cooperstate` at assemble; synthetic institutions left `[]` |

### 2d. Relationship signals already wired by `assemble.js`

- `inst-cooperstate.partnerAdvisorPracticeId === 'practice-walker'` (only one inst↔practice link)
- `inst-cooperstate.staffPersonIds === ['p-enterprise-diane']`
- `practice-walker.leadPersonId === 'p-enterprise-morgan'`, `coAdvisorPersonIds === ['p-enterprise-npark', 'p-enterprise-treeves']`
- `practice-walker.cohortIds === [advisor cohort IDs]`
- Every practice's `clientPersonIds` computed from participations

These let an Overview surface "practices linked to institutions",
"institution staff per institution", and "clients per practice" without
any additional joins.

### 2e. Integrity hook already present

`assemble.runChecks()` returns `{pass, errors[], info: {composition: {expected, actual}}}` validating:
- composition integrity (per-entity sum-of-sources match)
- global ID uniqueness within each entity type
- FK resolution (participation→person+context, practice→lead/coAdvisor/client/cohort, institution→partner/staff, gift→giver)

A "platform integrity" tile on the Overview could surface
`runChecks().pass` directly — real, no new data needed.

---

## 3. Gap map

Classification:
- **REAL NOW** — derivable from current unified store with no new entity
- **PARTIAL** — partial signal exists; needs additional structure or source data to be complete
- **NEEDS NEW ENTITY** — no underlying record exists; an Overview claim here would be invented

### 3a. Mission / funnel signals

| Candidate Overview signal | Classification | Blocker (if any) |
|---|---|---|
| Total individuals on platform | REAL NOW | — |
| Total institutions | REAL NOW | — |
| Total practices | REAL NOW | — |
| Total dollars moved | PARTIAL | Gift entity exists, but synthetic seed contributes 0 gifts and advisor surface contributes 0 gifts (giving plans aren't a Gift) — figure heavily undercounts platform reality |
| Education-completed-then-gave (the funnel claim) | PARTIAL | Enterprise side has `extensions.enterprise.activity` lesson/gift events with dates; can correlate "any lesson_completed before any gift_made" per athlete. Advisor side cannot answer this — sessions ≠ lessons, and no Gift records exist. Individual side has gifts but no education event |
| Orgs supported via StewardHouse (count, list, sums) | PARTIAL | `Gift.recipientOrgName` populated; `recipientOrgId` always null (FK resolution deferred). Name-match against 17-org catalog works for some gifts, misses gifts to orgs not in catalog |
| Relationships continuing past first gift | NEEDS NEW ENTITY | No "relationship state over time" model. Per-person `giftsByGiver(id).length > 1` is computable (zero today across all giftful persons — none has multiple Gift records), but "continued past first gift" usually means engagement after, not just a second gift |
| GPS/giving-identity completed (Marcus's intake) | PARTIAL | Marcus's `extensions.individual.givingPlanStatement` is populated; no equivalent for the other 76 individuals. Cannot say "X of Y completed GPS" because GPS isn't modeled on enterprise/advisor/synthetic persons |
| Cert/lesson throughput (enterprise) | REAL NOW | `extensions.enterprise.{certified, lessons, activity}` populated for all 16 enterprise athletes; counts roll up cleanly |
| Workshop attendance volume | PARTIAL | enterprise fixture has workshops + attendees, but `synthetic.js` doesn't emit workshop events into ProgramParticipation extensions; advisor doesn't have workshops. Aggregating real + synthetic would mix unequal coverage |

### 3b. Needs-action queues

| Candidate queue | Classification | Blocker |
|---|---|---|
| Nonprofit claim verification (pending claims) | NEEDS NEW ENTITY | No "claim" or "claim state" record exists on Org. `Org.ein` is null across all 17 orgs; no claimedBy/claimedAt fields. Claims would be a new entity (`OrgClaim`) tied to Person + Org |
| LLM-profile post-gen verification (pending reviews) | NEEDS NEW ENTITY | No profile-generation event log; no review-state field. The 17 orgs were authored manually. A profile-review queue presumes a generation pipeline that does not exist in the data |
| Support / issues queue | NEEDS NEW ENTITY | The current "2 open issues" is a literal. No Issue entity, no SupportTicket entity. The 5/31 DELTAS explicitly call this out as future work ("Issues entity") |
| Stalled onboarding | PARTIAL | For enterprise: `pp.stage === 'invited'` ∧ `pp.joinDate` more than N days ago is computable. For advisor: stage `'New'` ∧ no `extensions.advisor.sessions` could mark stalled. For individual: GPS-not-completed signal absent except for Marcus. No unified "onboarded vs stalled" predicate exists |
| Pipeline-default overrides flagged (per CLAUDE.md Section 6 invariant) | REAL NOW | `extensions.advisor.pipeline[].source === 'override'` is iterable; integrity check `clientsOnDefault + overrides === 9` per content type is in CLAUDE.md |
| Compliance disclosures past due | PARTIAL | Enterprise `extensions.enterprise.{certified, certDate}` and synthetic equivalents are populated; "past due" needs a policy (e.g. "uncertified after N days from joinDate"). Disclosures specifically (the NIL/Title IX bundle on EnterpriseCompliance) aren't modeled at the participation level — they live in `enterpriseFixtures.js` complianceState as page-level state, not per-athlete entries |
| Connection-request review (Individual surface) | NEEDS NEW ENTITY | Share/Connect/Signal Interest verbs are CLAUDE.md invariants but no Connection/Request entity exists. The individual surface is paused at v0.6.1 and emits no record |

### 3c. Platform health / integrity

| Candidate signal | Classification | Blocker |
|---|---|---|
| Composition integrity (assembled vs source counts agree) | REAL NOW | `runChecks().info.composition` |
| ID uniqueness check pass/fail | REAL NOW | `runChecks().errors` |
| FK resolution check pass/fail | REAL NOW | `runChecks().errors` |
| Last-build deploy status (Cloudflare green/red) | NEEDS NEW ENTITY | No deploy log surfaced into the app; would need either CI webhook integration or a manually-maintained deploy-events fixture |
| Latency / error rate / active sessions | NEEDS NEW ENTITY | Production traffic doesn't exist; `PlatformHealth` route already acknowledges this with its scaffold copy |
| Unparsed gift labels (enterprise adapter quality) | REAL NOW | `adaptEnterprise()` returns `unparsedGiftCount`; integrity-tile could call into adapter `runChecks` and surface non-zero values |
| Unmapped contact roles | REAL NOW | `adaptEnterprise().unmappedRoles[]` |
| Null giving-plan count (advisor pre-plan clients) | REAL NOW | `adaptAdvisor().nullGivingPlanCount` |
| Branch / git state | NEEDS NEW ENTITY | Out of scope for the data layer; would require shell-out, not appropriate for a client-only build |

### 3d. Summary

Of the candidate Overview signals enumerated above:
- **REAL NOW: 11** — 4 counts, lesson/cert throughput, pipeline-defaults, plus 5 integrity checks
- **PARTIAL: 8** — funnel-style aggregates exist on some sources but not all, or work only when source data is uniform
- **NEEDS NEW ENTITY: 7** — claims, profile-review, issues, connections, deploys, traffic, monitoring

The redesign's hardest constraint is **NEEDS NEW ENTITY** items: no
amount of unified-layer query work substitutes for the missing
`Issue`, `OrgClaim`, `OrgProfileReview`, `ConnectionRequest`, or
`DeployEvent` records. These are the next entities the unified layer
would have to absorb if the Overview is to show them honestly.

---

## 4. Cross-surface monitoring — what each customer surface exposes that operations might watch

### 4a. Advisor surface (`src/surfaces/advisor/`, 8 sections)

Operator-relevant signals visible to a Walker-practice advisor:
- Roster stages (New / Active / Mature / Sunset) and movement between them
- Session count + cadence per client (`extensions.advisor.sessions`)
- Pipeline state per client per content type, with per-client overrides vs practice defaults (Section 6 invariant)
- Cohort membership + cohort updates
- Curriculum library forks authored by the practice
- Journal / practice-home entries

For Operations: stalled-relationship signal (long gap since
`lastActive` is null at advisor; would need to derive from session
dates), pipeline-default drift, fork count per practice.

### 4b. Enterprise surface (`src/surfaces/enterprise/`, 6 sections)

Operator-relevant signals visible to a Cooper State admin:
- Stat grid: enrolled athletes, GPS completed, certified, gifts logged, total dollars logged, workshops held, lessons completed
- 12-week engagement sparkline (engagement-by-week derivation lives in `enterpriseFixtures.engagedAthletesByWeek`)
- Workshop calendar (dates ISO; UTC-day-shift bug fixed)
- Compliance state (NIL docs, disclosures, exclusions — page-level, not per-athlete)
- Program reports: summary, cohort comparison ("full year"/"to date" columns), philanthropic readiness, ROI, endowment
- Setup wizard state (7 steps, persona-canonical via `CURRENT_USER`)

For Operations: enrollment trend, cert/GPS completion rate, exclusion-list churn, setup-wizard completion state (today Cooper State is the only institution past wizard).

### 4c. Individual surface (`src/surfaces/individual/`, paused at v0.6.1)

Operator-relevant signals if/when unfrozen:
- GPP (Giving Style + Giving Identity) completion state
- Giving plan version + statement
- Discovery views (no donate button; bilateral-transparency design)
- Share / Connect / Signal Interest interactions (CLAUDE.md invariant; entity not modeled)
- Org engagement (which orgs the funder has surfaced from the catalog)

For Operations: GPP completion rate (currently only Marcus completes it in fixture; would need broader simulation), connection-request volume (no entity), pipeline of nonprofits surfaced.

### 4d. Cross-surface integrity an operator might want

- **Same-person trail across surfaces**: Marcus has 3 distinct Person records (`p-individual-c-001`, `p-advisor-c-001`, `p-enterprise-m-001`). Same-person dedup is deliberately deferred. An Operations view could flag this — show "people known to multiple surfaces" — but only against a stub identity model (e.g. name-match), and the result would be advisory only.
- **Institution ↔ Practice link**: only `inst-cooperstate ↔ practice-walker` is wired. Synthetic institutions and practices intentionally have no partner wiring. An Operations view that says "X of Y institutions have an advising partner" is computable but reads as 1 of 4 today.
- **Cohort sourcing**: 2 of 2 cohorts originate from the advisor surface (Walker); enterprise and synthetic emit none. "Cohorts authored per surface" is computable and currently uninformative.

---

## Closing note

The redesign's question is not "what query do we run" but "which of
these 7 missing entities do we author next." The unified layer is
ready to accept new entity types in the same adapter pattern; the
gating decisions are which queues are genuinely needed in Phase 1
versus which can stay deferred (alongside the customer-surface
backlog already tracked in the checklist).

No code modified by this discovery. `main` HEAD at `c890976`,
working tree clean.
