# Advisor persistence scoping pass — data-isolation design inventory

## 1. Purpose & status

Read-only investigation opening the Advisor persistence arc, following the
routing-only slice (`ce6d8be`) and the §6.11 path-fix slice (`b8837b9` +
`02aa297`). No `src/`, `functions/`, or `migrations/` changes in this pass.
Output is THIS doc. NEXT deliverable = the design-ruling session against
the 12 open questions collected below, then a schema draft.

HEAD at pass open: `02aa297`. Inherits the persistence precedents banked
during the Individual-wiring arc (CLAUDE.md Individual row items 1-8):
gift writes/reads, intake persistence (POST /api/intake), gift/scenario
schemas, ruling A-F on the Individual schema draft. This pass reuses that
substrate; the design-ruling session must extend it to advisor entities.

**Framing shift from the Individual pass**: Individual persistence stored
the account holder's OWN data. Advisor persistence introduces a new
sensitivity class — **third-party PII**, data about real people (athlete
clients) who are NOT the advisor account holder. Section 6 leads with
this finding.

---

## 2. Provider anatomy — the write-path inventory

Two context providers wrap `AdvisorSurface` at
`src/surfaces/advisor/AdvisorSurface.jsx:45-46`
(`PracticeContentProvider` + `DocumentationProvider`). Both currently seed
unconditionally from fixture on mount — no server hydration, no
persistence, matching Individual's pre-persistence state before this
session's wire-surfaces phase.

### 2.1 `PracticeContentProvider` (`src/contexts/PracticeContentContext.jsx`, 52 lines)

- **State**: single `lessons` array via `useState`, seeded from
  `practiceContentSeed` (5 fork/authored records).
- **Actions** (all `useCallback`, pure functional-updater setState):
  - `add(lesson)` — appends full lesson object; caller supplies id + all
    fields.
  - `update(id, patch)` — merges patch, auto-stamps
    `updatedAt: todayIso()`.
  - `remove(id)` — filters lesson out of array.
- **Consumers of the actions**:
  - `add`: `LessonEditor.jsx handleSaveWith` (fork + author modes).
  - `update`: `LessonEditor.jsx handleSaveWith` (edit mode);
    `LessonDetail.jsx handleAddMaterial` (adds nested materials).
  - `remove`: `LessonDetail.jsx handleConfirmDiscard`.
- **Read-only consumers**: `DraftsList.jsx`, `CurriculumLibrary.jsx`,
  `LessonDetail.jsx`, `LessonEditor.jsx`.

### 2.2 `DocumentationProvider` (`src/contexts/DocumentationContext.jsx`, 125 lines)

- **State**: single `categories` array via `useState`, seeded from
  `structuredClone(seedCategories)` (deep-copy to avoid mutating the
  imported module). 2 categories, 4 docs in seed.
- **Actions**:
  - `addDoc(categoryLabel, {title, notes, body})` — generates slug-based
    id via `uniqueId(slugify(title), allIds(categories))`, timestamps with
    `formatToday()`, appends to matching category. Returns the new id.
  - `addSection(label, hint)` — appends new category. Duplicate check runs
    INSIDE the functional updater against `prev` (documented stale-closure
    defense at `:86-88`). Returns `true` on success, `false` on
    empty/duplicate.
  - `findDocById(id)` — read helper, returns `{doc, categoryLabel}` or
    `null`.
- **Consumers of the actions**:
  - `addDoc`: `DocCreate.jsx handleSave`.
  - `addSection`: `Documentation.jsx handleSaveSection`.
  - `findDocById`: `DocDetail.jsx`.
- **Read-only consumers**: `Documentation.jsx`, `DocCreate.jsx`.

### 2.3 Local-state writes OUTSIDE any provider

The two providers do NOT cover every write. Grep found two additional
persistence surfaces the design must account for:

- **`ClientWorkspace.jsx PrivateNotesPanel`** (`:186`) — advisor's
  private notes per client. Manages its own local `useState` for notes
  content. Writes never touch a provider today; they exist only in
  component-local state and vanish on unmount.
- **`CohortDetail.jsx`** (`:41-44`) — local state slots for cohort
  updates draft (`setUpdates`, `setTitleDraft`, `setBodyDraft`, `setFlags`).
  Cohort updates are authored here and never persisted.

**Write-path total**: **5 mutation actions across 2 providers, plus at
least 2 stand-alone local-state authoring surfaces.** What an
authenticated advisor can persist per-account = these seven surfaces'
cumulative effects.

**Design-ruling flag**: local-state writes must be either promoted to a
provider (persisted) or explicitly accepted as ephemeral. Silently
letting them stay local through the persistence rollout would ship a
regression from the demo experience — the demo already loses these
between page loads; production shouldn't reproduce that.

---

## 3. Fixture boundary map — five fixtures, per-advisor / shared / ambiguous

### 3.1 `src/data/clients.js` (880 lines — dominant fixture)

**`advisorPracticeProfile`** (module const, 5 fields):
`{ practiceName, advisorName, advisorTitle, practiceFocus, yearsActive }`.
Value: Walker Philanthropic Advisory / Morgan Walker / Principal Advisor
/ "Athletes in early career" / 7. **PER-ADVISOR.**

**`clients`** — array of **9 records** (c-001..c-009). Full per-client
record shape (from Marcus c-001 as canonical):

```
{
  id: 'c-001',                     // string, unique within practice
  name: 'Marcus Thompson',
  initials: 'MT',
  sport: 'Basketball',
  level: 'Junior college',
  stage: 'Active',                 // one of stages[] enum
  relationshipStartedYear: 2024,
  summary: '<narrative>',
  nextSession: '2026-05-14',       // ISO YYYY-MM-DD
  activeContent: 3,                // derived count
  givingPlan: {                    // per-client giving plan
    statement, lastRevised, causes[], themes[], geography,
    preferredStructure, visibility, annualPace,
  },
  sessions: [                      // array of session records
    { id, date, title, summary, decisions[], actionItems[] }
    // 5 sessions for Marcus
  ],
  privateNotes: [                  // advisor-only notes, some highly personal
    { id, date, content, tags[] }
    // 3 notes for Marcus, one about mother's passing
  ],
  nextSessionAgenda: {
    topics[], openThreads[], curriculumLinks: [{lessonId}]
  },
  pipeline: [                      // per-client pipeline state
    { type, state, source }
    // 5 entries, one per contentType
  ],
}
```

Roster (9 total): Marcus Thompson / Jasmine Rivera / Reuben Asare /
Ezekiel Banner / Isaiah Coleman / Tariq Williams / Bree Caldwell / Naomi
Pierce / Jordan Estes. **PER-ADVISOR.**

**`stages`** = `['New', 'Active', 'Mature', 'Sunset']`.
**SHARED/PLATFORM** — every advisor's roster uses this stage taxonomy.
§7 lock ("renameable per advisor preference") is a display-rename per
advisor, not a schema shift; enum stays 4-value.

**`formatSessionDate(iso)`** — utility, not data.

**Unified-model overlap**: `src/data/unified/adapters/advisor.js:56-61`
emits `p-advisor-${c.id}` Person records from THIS fixture. Marcus's
c-001 becomes `p-advisor-c-001` in the unified store. Marcus ALSO
exists as `p-individual-c-001` and `p-enterprise-1` — the "same-person
dedup across surfaces is deferred" case per CLAUDE.md §4. The current
advisor `clients` fixture IS the seed for the demo `person` rows the
advisor bundle contributes to unified — but those are demo/seed persons
in fixture-derived state. Real advisor accounts persisting client
rosters would create real `person` rows with matching shape.

**AMBIGUOUS overlap flag**: Marcus's `givingPlan` block inside c-001
mirrors data ALSO present in `individualProfile.js` for the same
person. If Individual persists his intake to `extensions.individual`
(shipped) AND Advisor persists his client-record giving-plan block, the
same data can drift between two representations. → **Design ruling Q1
(FT-gated)**.

### 3.2 `src/data/content.js` (107 lines)

- **`contentTypes`** (5 entries: digest / notification / spotlight /
  reflection / cohort): **SHARED/PLATFORM** enum.
- **`lessons`** (31 base lessons, l-01..l-31): **SHARED/PLATFORM** —
  StewardHouse's base curriculum. All advisors read the same base;
  `PracticeContentProvider` layers per-advisor forks/authored on top.
- **`spotlights`** (5 editorial items, s-01..s-05):
  **SHARED/PLATFORM** — editorial content.
- **`pipelineDefaults`**: {clientsOnDefault, overrides} counts per
  content type. **AMBIGUOUS** — the DEFAULT posture (state: 'Active',
  cadence) is shared; the COUNTS are derived from per-client pipeline
  state and in a live per-advisor system would be derived, not stored.
- Utilities: `getLessonById()`, `findLesson(id, practiceLessons)` — the
  latter takes practiceLessons as a param, resolves ids against BOTH base
  library and practice-authored (current provider-composition pattern).

### 3.3 `src/data/practiceContent.js` (93 lines) → `PracticeContentProvider` seed

- **`practiceContentSeed`** — 5 records (pl-001..pl-005): 3 forks, 1
  authored, 1 draft. Shape:
  `{ id, kind: 'fork'|'authored', baseId, status: 'published'|'draft',
     title, minutes, scope, category, summary, createdAt, updatedAt,
     materials?: [{id, type, title, fileName}] }`.
- **PER-ADVISOR** — Walker Advisory's own curriculum. Every advisor
  practice has its own forks + authored content.

### 3.4 `src/data/documentation.js` (84 lines) → `DocumentationProvider` seed

- **`docCategories`** — 2 categories, 4 docs total ("Onboarding": 2
  docs; "Working notes": 2 docs). Shape:
  `{ label, hint, docs: [{id, title, updated, notes, body: string[]}] }`.
  Bodies are multi-paragraph text arrays voiced as first-person
  authored ("I read 990s in a specific order...").
- **PER-ADVISOR** — practice-ops materials.

### 3.5 `src/data/cohorts.js` (29 lines)

- **`cohorts`** — 2 records (coh-001, coh-002). Shape:
  `{ id, name, focus, started, nextSession, summary, memberIds: string[],
     externalMembers: number, assignedLessons[], updates[], sessions[] }`.
  `memberIds` reference client ids (c-001, etc).
- **AMBIGUOUS** — cohorts group clients so at minimum per-advisor. But
  §7 hints cohorts can span practices (`externalMembers` field carries a
  count of non-roster members). If cohorts are cross-practice in Phase 1,
  they need a home outside single-practice scope. → **Design ruling Q2
  (FT-gated)**.

---

## 4. Individual-pattern reuse audit

### 4.1 Reusable as-is (no new mechanism)

- `/api/me` handler already routes on `person.type`. Dispatcher branch
  for `'advisor'` shipped in `ce6d8be`. Response shape needs widening
  to include advisor-scoped data.
- Session handling (`better-auth` + cookie): type-agnostic; signed-in
  advisor accounts sign in the same way.
- `person` table with `type='advisor'`, `invite_email` claim key, and
  `extensions` JSON: already supports advisor accounts. Claim hook
  (`_lib/auth.js databaseHooks.user.create.after`) uses
  `invite_email = user.email` — same path for pre-seeded advisor rows.
- **`json_set` write discipline** (`functions/api/intake.js:24-131`) —
  battle-tested pattern: field allowlist (STRING_FIELDS / ARRAY_FIELDS /
  BOOLEAN_FIELDS), `sql\`...json(...)\`` wrapping for arrays + booleans,
  `json_set(coalesce(extensions, '{}'), ...fragments)` composition.
  Directly reusable for any advisor data that fits inside
  `extensions.advisor.*`.
- `useOptionalAppIdentity` and `useBasePath(demoBase, appBase)`
  (`src/contexts/AppIdentityContext.jsx`) — already shared, already used
  by all 13 advisor files.
- Bridge-provider pattern (`AuthenticatedIntakeProvider`): SHAPE
  reusable, but the shape assumes one downstream provider (see 4.2).
- `AppShell` single-fetch invariant + `AppIdentityContext` propagation:
  `/api/me` fetched once; identity flows to descendants. Fetch shape
  widens; component contract stays.
- Slice discipline for authenticated wiring (piece-3 pattern): already
  followed for routing + path-fix.
- `getPersonForSession` shared auth+lookup preamble
  (`functions/api/scenarios.js:36-47`) — reusable in every new advisor
  endpoint.

### 4.2 Needs new

- **`AuthenticatedAdvisorProvider` bridge** — `AuthenticatedIntakeProvider`
  seeds ONE provider. Advisor has TWO providers + at least 2 local-state
  writing surfaces. The single-provider shape doesn't compose directly.
- **`PracticeContentProvider` + `DocumentationProvider` `initialState`
  param** — currently seed unconditionally from fixture at
  `useState(seed)`. `IntakeProvider` gained an optional `initialState`
  during the intake-persistence slice; both advisor providers need the
  same widening. → **Design ruling Q3 (team default)**.
- **Server endpoints for advisor entities** — currently ZERO `/api/*`
  calls in `src/surfaces/advisor/` (grep-confirmed). Minimum needed:
  reads (roster / practice content / docs / cohorts) + writes (add /
  update / remove per entity type).
- **`/api/me` response widening** — currently
  `person: { type, displayName, intake, gifts, scenarios }`. Advisor
  accounts would need `practiceProfile`, `clients`, `practiceLessons`,
  `docCategories`, `cohorts` — OR the endpoint stays lean and delegates
  to per-entity fetches. → **Design ruling Q11 (team default)**.
- **Chrome identity plumbing** — `AdvisorSurface.jsx:55-56` hardcodes
  `advisorPracticeProfile.advisorName` and `advisorPracticeProfile.advisorTitle`.
  Would swap to `useOptionalAppIdentity().identity.displayName` +
  a `practiceTitle` field. Same pattern Individual solved via its own
  identity swap.

### 4.3 Where Advisor's shape breaks Individual's assumptions

- **One-provider vs two-provider**: Individual's authenticated wiring
  bridges just `IntakeProvider`. Advisor has TWO providers PLUS local-
  state writes that never touched a provider. The bridge design needs to
  cover all persistence surfaces — provider-mediated AND local-state.
- **Fixture-first vs blank-state**: `AUTHENTICATED_EMPTY_STATE` gives
  fresh Individual users a genuine empty slate to onboard from. Advisor
  is different — a fresh advisor account arrives with a CURATED roster
  (staff/FT pre-seed clients per §5 bespoke ruling), not an empty
  state. Advisor's "authenticated empty state" is a real pre-seeded
  roster, sourced from D1 not from fixtures.
- **Read/write ratio**: Individual's intake is mostly one-time write
  (onboarding) then read-heavy. Advisor is write-heavy throughout the
  working relationship — sessions, notes, updated lessons, docs, agenda
  drafts — every use produces writes.

---

## 5. Schema touchpoints (against migrations 0001-0006)

### 5.1 Existing-table fits

- **`person`** (0001, `invite_email` added 0004): already supports
  `type='advisor'`. `extensions` JSON blob can carry
  `extensions.advisor.*` for practice-profile data (parallel to the
  `extensions.individual` pattern used for intake). `display_name`
  gives Chrome the advisor's real name.
- `auth_user` / `session` / `account` / `verification`: better-auth
  substrate; type-agnostic; advisor accounts sit here unchanged.
- `org`: could be reused if advisor client giving-plans reference orgs
  as candidates. Not currently referenced by advisor entities; ruling
  needed if giving-plan.causes[] should join to `org` rows or stay as
  free-text taxonomy.

### 5.2 The 11 no-home entities

Entities in advisor fixtures that have no home in the current schema.
Each one is a design-ruling question about (a) new table vs JSON column
on parent, (b) FK shape, (c) nested-array handling.

1. **Client roster** — 9-per-advisor rich records. Cannot fit as
   `person.extensions.advisor.clients` — too large, too write-hot,
   would need row-level updates on nested arrays. **Needs `client`
   table.**
2. **Client sessions** — session history per client with nested
   decisions[]/actionItems[] arrays. **Needs table** — name-collision
   with better-auth's `session` requires disambiguation
   (`client_session`, `advisory_session`, etc). → **Q12 (team
   default)**.
3. **Client private notes** — highly-sensitive short-text records per
   client. Could satellite as a `client_note` table with FK to client,
   which makes row-level access easier to audit. → **Q8 nested-JSON-vs-
   table decision cluster**.
4. **Next-session agenda per client** — small `{topics[], openThreads[],
   curriculumLinks[]}`. Could stay as JSON column on `client` (small,
   replaces entirely on save, low concurrency risk).
5. **Client pipeline state** — 5 entries per client. Could stay as JSON
   OR its own table. → **Q8 cluster**.
6. **Practice lessons (forks + authored)** — pl-XXX records, one array
   per advisor. **Needs `practice_lesson` table** with FK to practice
   owner + optional reference to base lesson id (base lessons stay in
   fixture as platform content, OR migrate to D1 per Q10).
7. **Lesson materials** — `{id, type, title, fileName}` per practice
   lesson. Could stay as JSON on `practice_lesson.materials`.
8. **Documentation categories** — `{label, hint, docs[]}`, editable via
   `addSection`. **Needs `doc_category` table** if per-advisor and
   editable.
9. **Documents** — `{id, title, updated, notes, body: string[]}`.
   **Needs `doc` table** with FK to category (or FK to advisor + a
   category label column).
10. **Cohorts + cohort membership** — cohorts group clients (memberIds).
    Per-practice: `cohort` table + `cohort_member` junction to
    `client(id)`. Cross-practice: FK design gets thornier — pending Q2
    ruling.
11. **Practice profile itself** — `advisorPracticeProfile` fields.
    Could sit in `extensions.advisor` on the advisor's `person` row for
    single-advisor practices. Multi-advisor practices would need a
    `practice` table with member advisors as person FKs. → **Q5 (FT-
    gated)**.

### 5.3 Parker invariant checks

**No scores/ranks anywhere** (§7 lock):
- `client.stage` is a 4-value TEXT enum (New / Active / Mature /
  Sunset). Renameable per advisor preference. **Not a rank score.**
  Future schema MUST NOT add a numeric `stage_progression` or
  `stage_score` column and MUST NOT introduce ORDER BY logic implying
  progression ranking.
- `client.activeContent: 3` is a derived count, not a score.
- `client.pipeline[].state` is an Active/Mute/Pause enum, not a
  priority.
- `client.sessions[].decisions[]` and `actionItems[]` are text lists,
  no scoring.
- Cohorts have no `success_score` or ranking. Keep it that way.

**Lifecycle-field ban** (per gift/scenario DDL comments):
- `gift.exported_to_cpa` is the ONLY lifecycle-adjacent field on `gift`.
  Client and practice-lesson tables should follow the same discipline
  with hard-comment DDL invariants so the pattern doesn't drift.
- `practice_lesson.status: 'published' | 'draft'` is
  **authoring-state**, not payment/settlement-state. Acceptable. DDL
  should hard-comment: no settlement / processed / refunded / disputed
  columns EVER on any advisor table.
- `client.stage` is relationship-state, not lifecycle — acceptable.
- `doc.updated` is a plain timestamp, not lifecycle — acceptable.

**Modeler guardrail** (no rank/score/suggestion/priority/ordering
column) is scoped to `scenario` per DDL comment. Advisor entities sit
outside that scope. BUT the SPIRIT — no advisory-recommendation
columns — should apply if advisor UX ever wants "suggested next lesson"
or "priority action." Those stay client-side derivations, never stored.
→ **Q9 (FT-gated)**.

---

## 6. Data-protection frame — advisor persistence introduces third-party PII

**This is the most important finding in this pass.** Individual
persistence stored the account holder's OWN data (intake answers, own
gifts, own scenarios). Every earlier data-protection ruling was framed
around that pattern. **Advisor persistence introduces a new sensitivity
class: third-party PII — data about real people (athlete clients) who
are NOT the advisor account holder.** The data-protection frame does
not simply scale; it changes shape.

### 6.1 The advisor's client records are the sensitive payload

Client records contain:

- `client.name` — real athlete name, PII by itself.
- `client.givingPlan.statement` — freeform narrative including
  motivations, family context, life history.
- `client.givingPlan.annualPace` — dollar-amount ranges (net-worth
  signal).
- `client.givingPlan.causes[]` + `themes[]` — cause/political alignment
  (special-category under GDPR + post-2024 US state acts, same as gift
  records).
- `client.sessions[].summary` + `decisions[]` + `actionItems[]` — the
  advisor's working notes on real conversations, including
  decision-making processes.
- `client.privateNotes[].content` — highly personal. Real example from
  the c-001 seed (fictional Marcus but shape is real): a note about
  the athlete's mother's death, dated April 2026, tagged "relational,
  context." Notes are labeled "advisor-only" in the fixture — the
  advisor is capturing sensitive personal context that the client did
  not directly authorize being stored.
- `client.pipeline[]` — behavioral preferences.

**Advisor client records carry MORE sensitive PII than gift records
about the same person**, and the advisor is the data steward for
another person's information — not the data subject.

### 6.2 The new Derek question

The Individual persistence-scoping pass's Layer-2 legal questions
(controller identity for PBC + captive 501(c)(3); regime scope for
special-category data; subpoena posture) still apply. Advisor
persistence ADDS one:

**Processor-for-the-advisor vs. joint-controller for the client's
data.**

- **Processor** posture: StewardHouse processes client data on the
  advisor's behalf. The advisor is the controller, sets the purpose,
  and holds primary responsibility to the client. StewardHouse's
  obligations run through a Data Processing Agreement with each
  advisor. Client's rights (access, deletion, portability) are exercised
  via the advisor. Right-to-be-forgotten complexity: which system does
  a delete propagate through first?
- **Joint-controller** posture: StewardHouse and the advisor jointly
  determine purposes and means. Both are directly responsible to the
  client. StewardHouse takes on more privacy obligations directly; both
  parties must publish a joint-controller arrangement summary.

This decision is upstream of nearly every advisor-schema choice:
identity separation shape, deletion cascade behavior, subpoena posture
for client data, whose privacy notice governs, what the advisor's
click-through onboarding must disclose, whether the client themselves
must be given a StewardHouse-facing account (impossible without a
consent flow to the client — new UX surface).

Not answering here. Scoping-for-Derek, not legal advice. But this
question must land BEFORE the schema draft.

### 6.3 Layer 1 (data architecture) — new constraints beyond the Individual pass

- Client rows keyed by opaque advisor `person.id` FK, not by email or
  client name. Same identity-separable pattern as
  `gift.giver_person_id`.
- Client name IS itself PII. Must live somewhere; ruling needed on
  whether `client.name` is a plain column or tokenized/hashed. Given
  the demo uses real-name display and the advisor NEEDS the name to
  work, likely a plain column with row-level access gated by owner.
  → **Q6 (FT-gated)**.
- Private notes are the most sensitive slice inside client records.
  Even inside `client`, they may warrant a separate table
  (`client_note`) to make row-level access + audit easier.
- Row-level access: client rows visible ONLY to the owning advisor's
  `person.id`. Same chokepoint pattern as `gift.giver_person_id` +
  `scenario.owner_person_id`. Enforced in every endpoint via
  `.where('owner_advisor_id', '=', person.id)`.

### 6.4 Layer 2 (legal) — the expanded slate for Derek

Beyond the Individual pass's three questions, advisor persistence adds:

- **Processor-vs-joint-controller** (per 6.2) — upstream of everything.
- **Client consent for D1 storage** — new consent surface. Individual
  users consent when they sign up. Advisors consent when they sign up.
  Athletes whose data an advisor stores in StewardHouse's D1 have not
  consented directly — the advisor represents that they have client
  consent, but StewardHouse's policy on relying on that representation
  must be explicit.
- **Subpoena posture for client data** — a subpoena or law-enforcement
  request for a specific athlete's records could reach the advisor OR
  StewardHouse OR both. Advisor's own records (their sessions notes,
  private notes) may also be discoverable in litigation against the
  athlete. Posture per §5 keeps the who-gave-to-whom view UNBUILT
  until posture set; the parallel here is the who-noted-what-about-whom
  view.

### 6.5 Layer 3 (operations)

- Access logging on client-related endpoints: consider from day one
  given sensitivity, whether or not required by regime scope.
- D1 Time Travel (30-day restore) is a privacy surface — the same
  concern as the Individual pass, but the deleted content is more
  sensitive. Deletion commitment for advisor entities must account for
  it, and for the cascade shape (advisor account deletion vs.
  client-record-only deletion).

### 6.6 Layer 4 (governance)

- Retention/deletion (ruling E) at the person boundary cascades: if an
  advisor account is hard-deleted, their `client` rows would cascade
  via `ON DELETE CASCADE` from advisor→client. But client records may
  need their own soft-delete state INDEPENDENT of advisor deletion —
  an advisor "closing out" a client vs. deleting the account entirely
  are different actions with different retention implications.
- Individual-pushes-consent extends to CLIENT consent for their data
  being held in an advisor's D1 store. This is a new consent surface
  the current architecture does not touch.

---

## 7. Open rulings — 12 questions

Collected across sections 2-6. All rulings pending; nothing built yet.
Grouped into (a) 6 FT-required rulings and (b) 6 team-default rulings
awaiting bless-or-override.

### 7.1 FT-required rulings

**Q1 — `client.givingPlan` vs `individualProfile.intake` overlap.**
Same person, two representations. Advisor-curated snapshot? Synced
view? Both surfaces read one underlying record? Downstream: whether
advisor endpoints write anywhere near the `extensions.individual` blob,
whether client shape includes a giving-plan column or a
`giving_plan_source: 'advisor' | 'linked'` marker.

**Q2 — Cohorts: per-practice or cross-practice?** Determines whether
`cohort` FKs to a single advisor or lives outside practice scope.
Ambiguous today: `memberIds` reference clients, `externalMembers` is a
count. Cross-practice cohorts imply a shared table AND a cross-practice
membership junction, plus new access rules ("can I see this cohort if
my client is a member but the cohort is owned by another practice?").

**Q4 — Local-state writes in ClientWorkspace/CohortDetail: promote or
accept as ephemeral?** Currently `PrivateNotesPanel` and CohortDetail
draft state live only in component state. Promoting them to persistence
respects the advisor's actual working pattern; accepting them as
ephemeral would ship a UX regression from what the demo already tells
users they can do. This ruling includes the Parker/Morgan sequencing
disagreement: Parker's read is "any user-authored work must persist by
default"; Morgan's read is "prototype-scope acceptable" — the design-
ruling session must reconcile.

**Q6 — Client name PII posture.** Plain `client.name` column with
row-level access, or tokenized/hashed identity with a separate PII
resolver? Real-name display is the advisor's working reality; tokenized
storage adds an indirection layer that may not survive contact with
"the advisor needs to see the name every time they open the workspace."
Ruling determines the shape of the primary identity column on `client`.

**Q7 — Client consent for D1 storage: when/how obtained.** The advisor
represents that they have client consent; StewardHouse's policy on
relying on that representation must be explicit. Options: (a) advisor's
onboarding attestation covers it; (b) each advisor must upload evidence
of client consent; (c) each client must be given a StewardHouse-facing
account they consent through directly. Each option has different UX,
legal, and schema implications.

**Q9 — Modeler-guardrail expansion beyond `scenario`.** Does "no
rank/score/suggestion/priority/ordering column" apply to advisor-facing
displays too? If the advisor UX ever wants "suggested next lesson" or
"priority action" (both plausible given the pipeline abstraction),
those stay client-side derivations, never stored — OR the guardrail
gets carved out for advisor use with explicit conditions. Founder-Path-
B territory.

### 7.2 Team-default rulings (awaiting bless-or-override)

**Q3 — Provider composition shape.** Team default: **compose the two
providers into a single new `AdvisorProvider` that owns both slices**,
one bridge to seed them, matching the `AuthenticatedIntakeProvider`
pattern's shape. Alternative: nest two bridge providers, widen each
existing provider with an `initialState` param. Default picks the
composition path because it mirrors what Individual already ships.

**Q5 — Practice profile home.** Team default: **`extensions.advisor.*`
on the advisor's `person` row**, following the exact
`extensions.individual` pattern. Practice profile is 5 fields today, a
snug fit for JSON-on-person. Alternative: `practice` table if
multi-advisor practices are in Phase 1 scope. Default accepts the
single-advisor-per-practice constraint that matches the current
fixture's shape (one Morgan Walker at Walker Advisory).

**Q8 — Nested arrays: JSON columns vs satellite tables.** Team
default: **JSON columns for small, always-replaced-on-save nested
arrays** (agenda, pipeline, materials); **satellite tables for
partial-update or row-level-access-critical** (sessions, private notes,
cohort membership). Rationale: JSON columns cost nothing until they
force awkward query patterns; satellite tables add join cost per
lookup. The specific split above matches expected access patterns
(agenda saves whole; private notes may need row-level access controls
independently).

**Q10 — Base curriculum sync.** Team default: **base `lessons` STAY
in fixture as platform content**. `practice_lesson.base_lesson_id` is a
STRING FK to fixture ids (not a hard FK to a base-lessons D1 table).
Alternative: migrate base curriculum to D1 for single-source-of-truth.
Default keeps the base library editable via code review / release, not
runtime UI.

**Q11 — `/api/me` response shape.** Team default: **`/api/me` stays
lean; per-entity fetches for advisor data** (`/api/practice-content`,
`/api/documentation`, `/api/clients`, `/api/cohorts`). Rationale:
Individual's `/api/me` widening was already a smell (identity fetch
carrying gifts + scenarios). Alternative: one big response covering all
advisor entities. Default keeps `/api/me` at "who am I" and lets
surfaces fetch their own data on mount.

**Q12 — `session` table name-collision resolution.** Team default:
**`advisory_session`** for the advisor-side session record table (not
`client_session`, which reads as a client's login session; not
`session_note`, which conflates the primary record with the note
sub-structure). Alternative names: `client_session`, `working_session`,
`meeting`. Default picks `advisory_session` for the domain fit (this is
the advisor-facing name for the working relationship's sessions) and
to keep collision-avoidance obvious in reviews.

---

## 8. Critical-path flag

Same shape as the Individual pass's flag: **Derek advances back to
critical-path** for advisor persistence design. The new question in
6.2 (processor-vs-joint-controller) is upstream of nearly every
schema choice in this pass. Scoping can continue in parallel, but the
schema-draft deliverable cannot land without this legal question
resolved.

FT's parallel-scoping option holds. The finding is the same: do.
