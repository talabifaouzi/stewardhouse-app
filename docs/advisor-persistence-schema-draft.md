# Advisor persistence schema draft — RULED (Q1-Q12), held for FT sign-off

## 1. Status

Ruled schema draft for the Advisor persistence layer. FT ruled all 12
open questions from `docs/advisor-persistence-scoping.md` this session.
Inherits `docs/persistence-schema-draft.md` (Individual pilot, rulings A-F)
as its `person` / `auth_user` / retention substrate. Sequence:
scope → rule → build; this is the **rule** artifact.

**HELD: no migration until FT signs off on this draft.** No `src/`,
`functions/`, or `migrations/` change this pass. The DDL below is a
proposal, not applied.

HEAD at draft: `32d3e4b`.

Cross-references: `docs/advisor-persistence-scoping.md` (inventory + the
12 open questions); `docs/persistence-schema-draft.md` (Individual pilot
schema, rulings A-F); `docs/ruling-e-deletion-retention.md` (deletion at
person boundary, cascade discipline, counsel-gated seams).

---

## 2. FT rulings — Q1-Q12 recorded verbatim, applied downstream

- **Q1 — `client.giving_plan` overlap with Individual intake:**
  advisor-curated snapshot JSON. No sync. No FK to any individual
  `person` row. If the client also has an Individual account, that is
  the individual's own record — the advisor's client.giving_plan is a
  separate authored artifact captured on the advisor's side.
- **Q2 — Cohorts scope:** per-practice. Cohorts belong to the owning
  advisor's `person.id`. Cross-practice cohorts are OUT of Phase 1.
  `cohort_member` FKs to `client.id` inside the same owning practice.
- **Q3 — Provider composition shape:** existing providers widened with
  an optional `initialState` param (matching `IntakeProvider`'s recent
  widening), plus a thin composed wrapper for the authenticated tree.
  No new mega-provider.
- **Q4 — Local-state writes (PrivateNotesPanel + CohortDetail drafts):
  MIDDLE PATH.** Tables built now. Storage of real client data is gated
  on the Q7 posture — matching the ruling-E precedent that keeps the
  `gift` `who-gave-to-whom` view UNBUILT until subpoena posture is set.
  Fictional demo-roster rows are seedable now; real client-record
  storage waits behind Q7.
- **Q5 — Practice profile home:** `person.extensions.advisor.*` on the
  advisor's own person row. Parallel to the `extensions.individual.*`
  pattern already shipped for intake persistence. Single-advisor-per-
  practice constraint accepted for Phase 1.
- **Q6 — Client name PII posture:** plain `client.name` TEXT column,
  owner-scoped. No tokenization at pilot. Every read filtered through
  `owner_advisor_person_id` chokepoint. Advisor's working reality is
  real-name display; tokenization does not survive contact with that
  use.
- **Q7 — Processor-vs-joint-controller:** counsel-gated seam on the
  Derek sheet, isolated. Non-blocking for the rest of the schema draft.
  Isolates to `client` / `client_session` / `client_note` write
  enablement, matching the ruling-E `Clause 6` isolation pattern (schema
  can land; real-people data waits).
- **Q8 — Nested-arrays shape:** real tables for `client`,
  `client_session`, `client_note` (partial-update or row-level-access-
  critical). JSON-replaced-whole columns for `agenda`, `pipeline`,
  `materials` (small, always saved as unit, low concurrency risk).
- **Q9 — Modeler-guardrail expansion:** NO rank / score / priority /
  suggestion / ordering column on ANY participant record — platform-
  wide, not scoped to `scenario`. Hard-commented in all DDL below.
- **Q10 — Base curriculum:** stays in fixture as platform content.
  `practice_lesson.base_id` is a plain TEXT string reference to fixture
  ids (`l-01`..`l-31`) — **NOT a hard FK to a base-lessons D1 table**.
- **Q11 — `/api/me` shape:** single-fetch holds. `/api/me` stays lean
  (`type`, `displayName`, `email`, `intake`, `gifts`, `scenarios`,
  `advisor` if type=advisor with just practice profile). Per-entity
  fetches (`/api/clients`, `/api/practice-content`, `/api/documentation`,
  `/api/cohorts`) on mount from surfaces. Revisit threshold: if any
  single surface routinely fetches ≥3 endpoints on mount OR any endpoint's
  90th-percentile response exceeds ~50 KB gzipped, revisit consolidation.
- **Q12 — `session` name-collision:** `client_session` for the advisor-
  side session record table (better-auth owns `session`).

---

## 3. Tables (RULED shape; DDL for FT sign-off, then migration)

All timestamps are TEXT ISO 8601 unless noted (matching the Individual
schema's `created_at` convention). Every `owner_advisor_person_id` is a
NOT NULL FK to `person.id` with `ON DELETE CASCADE` — per ruling E, hard-
delete at the person boundary cascades to owned entities.

### 3.1 `client` — the advisor's client roster

```sql
CREATE TABLE client (
  id                          TEXT NOT NULL PRIMARY KEY,       -- opaque UUID
  owner_advisor_person_id     TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,

  -- PII columns (Q6): plain TEXT, owner-scoped access enforced in endpoints.
  name                        TEXT NOT NULL,
  initials                    TEXT,

  sport                       TEXT,
  level                       TEXT,                             -- e.g. 'Junior college', 'D1 college'

  -- Relationship state, NOT lifecycle. Enum values: 'New'|'Active'|'Mature'|'Sunset'.
  -- Q9 invariant: 'Sunset' is a relationship-state marker, not a rank.
  -- NO stage_progression / stage_score / priority column may EVER be added.
  stage                       TEXT NOT NULL,

  relationship_started_year   INTEGER,
  summary                     TEXT,
  next_session_date           TEXT,                             -- ISO YYYY-MM-DD, nullable

  -- Q1 ruling: giving_plan is an advisor-curated snapshot JSON. NO sync with
  -- individual.extensions. NO FK to any individual person row. Stored as a
  -- whole-replaced JSON blob; each save writes the full object.
  giving_plan                 TEXT,                             -- JSON | NULL

  -- Q8: JSON-replaced-whole columns for small nested structures.
  next_session_agenda         TEXT,                             -- JSON {topics, openThreads, curriculumLinks}
  pipeline_state              TEXT,                             -- JSON [{type,state,source}] × 5

  created_at                  TEXT NOT NULL,                    -- ISO 8601
  updated_at                  TEXT NOT NULL                     -- ISO 8601
);

-- Q9 platform-wide guardrail (repeated in EVERY participant table):
-- NO rank / score / priority / suggestion / ordering / progression column
-- may EVER be added to this table — even one cached or derived. Advisor-
-- facing displays that surface computed rankings stay client-side
-- derivations, never stored. Parker invariant (docs/advisor-persistence-
-- scoping.md §5.3).

-- Parker no-lifecycle-field invariant:
-- NO settlement / processed / refunded / disputed / status column may EVER
-- be added. 'stage' is relationship-state (see comment above), acceptable.
-- Follows the discipline hard-commented in gift + scenario DDL.
```

Index (D1 rows-read):
```sql
CREATE INDEX idx_client_owner_advisor_person_id ON client(owner_advisor_person_id);
```

### 3.2 `client_session` — session history per client (Q12 naming)

```sql
CREATE TABLE client_session (
  id            TEXT NOT NULL PRIMARY KEY,                       -- opaque UUID
  client_id     TEXT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,                                    -- ISO YYYY-MM-DD
  title         TEXT,
  summary       TEXT,

  -- Q8 JSON-replaced-whole: small text arrays, always saved as unit.
  decisions     TEXT,                                             -- JSON string[]
  action_items  TEXT,                                             -- JSON string[]

  created_at    TEXT NOT NULL                                     -- ISO 8601
);

-- Q9 guardrail: NO rank / score / priority / suggestion / progression column.
-- Parker no-lifecycle: NO settlement / processed / status column beyond the
-- authoring context of the record itself. Session records are historical
-- artifacts; no per-session workflow state.
```

Index:
```sql
CREATE INDEX idx_client_session_client_id ON client_session(client_id);
```

### 3.3 `client_note` — advisor-only private notes (highest-sensitivity slice)

Separate table (not JSON column on `client`) per §6.3 of the scoping
doc: private notes are the most sensitive slice inside client records;
separate table makes row-level access + audit easier and lets a future
per-note access control land without a `client` migration.

```sql
CREATE TABLE client_note (
  id           TEXT NOT NULL PRIMARY KEY,                        -- opaque UUID
  client_id    TEXT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  date         TEXT NOT NULL,                                     -- ISO YYYY-MM-DD
  content      TEXT NOT NULL,                                     -- freeform text; sensitive payload
  tags         TEXT,                                              -- JSON string[]
  created_at   TEXT NOT NULL                                      -- ISO 8601
);

-- Q9 guardrail: NO rank / score / priority / suggestion column.
-- Parker no-lifecycle: NO status column. Notes are immutable authored
-- content; editing behavior lives in application logic, not a lifecycle
-- state field.
```

Index:
```sql
CREATE INDEX idx_client_note_client_id ON client_note(client_id);
```

### 3.4 `practice_lesson` — advisor's forks + authored curriculum

```sql
CREATE TABLE practice_lesson (
  id                        TEXT NOT NULL PRIMARY KEY,           -- 'pl-XXX' or opaque UUID
  owner_advisor_person_id   TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,

  -- Kind is enum: 'fork'|'authored'. Fork requires a base_id; authored has null base_id.
  kind                      TEXT NOT NULL,

  -- Q10: base_id is a plain TEXT reference to a fixture id (e.g. 'l-22').
  -- Base curriculum stays in the code fixture (src/data/content.js) — NOT a
  -- hard FK to a D1 table. This is a deliberate ruling; base curriculum is
  -- platform content, editable via code review / release, not runtime UI.
  base_id                   TEXT,

  -- Q8 status = AUTHORING STATE ONLY. Enum: 'published'|'draft'.
  -- NOT a lifecycle / workflow / settlement state.
  -- Parker no-lifecycle: NO settlement / processed / refunded / disputed
  -- / cleared / reversed column may EVER be added to this table — not even
  -- via back-door rename. Authored content stays authored content.
  status                    TEXT NOT NULL,

  title                     TEXT NOT NULL,
  minutes                   INTEGER,
  scope                     TEXT,                                 -- 'all'|'Athletics'
  category                  TEXT,                                 -- 'primer'|'workflow'
  summary                   TEXT,

  -- Q8 JSON-replaced-whole: materials array, always saved as unit.
  materials                 TEXT,                                 -- JSON [{id,type,title,fileName}]

  created_at                TEXT NOT NULL,                        -- ISO 8601
  updated_at                TEXT NOT NULL                         -- ISO 8601
);

-- Q9 platform-wide guardrail: NO rank / score / priority / suggestion /
-- ordering column may EVER be added. If advisor UX wants "suggested next
-- lesson," it stays a client-side derivation, never a stored column.
```

Index:
```sql
CREATE INDEX idx_practice_lesson_owner_advisor_person_id ON practice_lesson(owner_advisor_person_id);
```

### 3.5 `doc_category` — documentation hub categories

```sql
CREATE TABLE doc_category (
  id                        TEXT NOT NULL PRIMARY KEY,           -- opaque UUID
  owner_advisor_person_id   TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  label                     TEXT NOT NULL,
  hint                      TEXT,
  created_at                TEXT NOT NULL,                        -- ISO 8601

  -- Matches DocumentationProvider.addSection duplicate-label check
  -- (src/contexts/DocumentationContext.jsx:94-97). Enforced at the DB.
  UNIQUE (owner_advisor_person_id, label)
);

-- Q9 guardrail: NO rank / score / priority / ordering column.
-- Parker no-lifecycle: NO status column. Categories are containers.
```

Index:
```sql
CREATE INDEX idx_doc_category_owner_advisor_person_id ON doc_category(owner_advisor_person_id);
```

### 3.6 `doc` — documentation records

```sql
CREATE TABLE doc (
  id            TEXT NOT NULL PRIMARY KEY,                       -- slug-based, unique via category+id combo
  category_id   TEXT NOT NULL REFERENCES doc_category(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  updated       TEXT NOT NULL,                                    -- display timestamp string (as in fixture)
  notes         TEXT,                                             -- one-line description
  body          TEXT NOT NULL,                                    -- JSON string[] paragraphs
  created_at    TEXT NOT NULL                                     -- ISO 8601
);

-- Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle: NO status column. Docs are authored artifacts;
-- editing behavior lives in application logic.
```

Index:
```sql
CREATE INDEX idx_doc_category_id ON doc(category_id);
```

### 3.7 `cohort` — practice's cohorts (Q2 per-practice)

```sql
CREATE TABLE cohort (
  id                        TEXT NOT NULL PRIMARY KEY,           -- 'coh-XXX' or opaque UUID
  owner_advisor_person_id   TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,

  name                      TEXT NOT NULL,
  focus                     TEXT,                                 -- e.g. 'Issue-area cohort', 'Team cohort'
  started                   TEXT,                                 -- display month string (as in fixture)
  next_session_date         TEXT,                                 -- ISO YYYY-MM-DD, nullable
  summary                   TEXT,

  external_members          INTEGER NOT NULL DEFAULT 0,           -- count of non-roster members

  -- Q8 JSON-replaced-whole columns: small arrays, always saved as unit.
  assigned_lessons          TEXT,                                 -- JSON string[]
  updates                   TEXT,                                 -- JSON [{title,body,date}]
  sessions                  TEXT,                                 -- JSON [] — cohort-level session records

  created_at                TEXT NOT NULL,                        -- ISO 8601
  updated_at                TEXT NOT NULL                         -- ISO 8601
);

-- Q9 guardrail: NO rank / score / priority / success_score column may EVER
-- be added — even one cached or derived.
-- Parker no-lifecycle: NO status / phase / stage column beyond the
-- relationship-shape data already present.
```

Index:
```sql
CREATE INDEX idx_cohort_owner_advisor_person_id ON cohort(owner_advisor_person_id);
```

### 3.8 `cohort_member` — cohort ↔ client junction

```sql
CREATE TABLE cohort_member (
  cohort_id     TEXT NOT NULL REFERENCES cohort(id)  ON DELETE CASCADE,
  client_id     TEXT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  joined_at     TEXT NOT NULL,                                    -- ISO 8601
  PRIMARY KEY (cohort_id, client_id)
);

-- Composite PK gives an implicit index on (cohort_id, client_id) —
-- covers cohort-scoped membership reads. Explicit index on client_id
-- alone (below) covers the reverse-lookup "which cohorts is this client
-- in?" read used in ClientWorkspace.jsx.
```

Index:
```sql
CREATE INDEX idx_cohort_member_client_id ON cohort_member(client_id);
```

### 3.9 Practice profile — no new table (Q5)

Per Q5, practice profile lives on the advisor's own `person` row as
`extensions.advisor.*` JSON (parallel to `extensions.individual.*`
already shipped for intake persistence). Fields:

```
person.extensions.advisor = {
  practiceName:  "Walker Philanthropic Advisory",
  advisorTitle:  "Principal Advisor",
  practiceFocus: "Athletes in early career",
  yearsActive:   7
}
```

`advisorName` is NOT duplicated here — Chrome reads `person.display_name`
directly (identity chokepoint).

Writes to `extensions.advisor.*` reuse the `json_set` write discipline
proven in `functions/api/intake.js:24-131` — field allowlist, `sql\`...
json(...)\`` wrapping for arrays/booleans, `json_set(coalesce(extensions,
'{}'), ...fragments)` composition. **No advisor-schema migration needed
for practice profile** — `person.extensions` already exists.

---

## 4. Deletion / retention

Inherits ruling E from `docs/persistence-schema-draft.md` §4 verbatim:
two-phase soft-then-hard deletion at the **`person` boundary**.

**Cascade shape (advisor person hard-delete):**
- `client` (via `owner_advisor_person_id` CASCADE) → `client_session` +
  `client_note` (via `client_id` CASCADE) → deleted.
- `practice_lesson` (via `owner_advisor_person_id` CASCADE) → deleted.
- `doc_category` (via `owner_advisor_person_id` CASCADE) → `doc` (via
  `category_id` CASCADE) → deleted.
- `cohort` (via `owner_advisor_person_id` CASCADE) → `cohort_member`
  (via `cohort_id` CASCADE) → deleted.

**Parker hard constraint honored:** no lifecycle-field back-door. None
of these 8 tables gains a `deleted_at` status column. Deletion is a
`person`-level state that cascades through the FK graph.

**Client close-out ≠ client delete.** Ending an advisor-client working
relationship is a relationship-state change, NOT a row deletion.
`client.stage = 'Sunset'` already carries this state (§7 lock). No
`client.closed_at` column, no `client.status='closed'` column — the
existing stage enum handles it. Only when the OWNING ADVISOR account
hard-deletes does the `client` row itself disappear via CASCADE.

**Anonymize-not-orphan** exception from ruling E: any structurally-
retained fact (aggregate counts, audit-log references) uses opaque
markers rather than orphaning the FK to a deleted person. Advisor-side
retention decisions inherit this — if a client-session record needs to
survive person deletion for an audit / compliance reason (a Derek
question), it becomes anonymized rather than left with a dangling FK.

---

## 5. Parker invariants — hard-commented in ALL DDL above

Two invariant families, both stated inline in every table's DDL:

### 5.1 Q9 — No rank/score/priority/suggestion/ordering columns (platform-wide)

Applies to ALL 8 advisor tables. This is an EXPANSION of the scenario-
specific modeler guardrail (`docs/persistence-schema-draft.md` §3 note
on scenario) to the platform. Advisor UX may compute rankings, priority
orderings, or suggested-next-lesson affordances CLIENT-SIDE — those
stay derivations, never persisted. Any future proposal to add a column
matching this pattern requires re-opening Q9 as a founder-path decision.

### 5.2 Parker no-lifecycle-field rule

Applies to ALL 8 advisor tables. No settlement / processed / refunded /
disputed / cleared / reversed / status column may EVER be added, not
even via back-door rename. Two acceptable near-neighbors, explicitly
NOT lifecycle:

- `practice_lesson.status: 'published' | 'draft'` — authoring state.
  Acceptable, hard-commented as authoring-only.
- `client.stage: New | Active | Mature | Sunset` — relationship state.
  Acceptable, hard-commented as relationship-shape not rank.

Every table's DDL comment names this discipline explicitly to prevent
drift under future feature pressure.

---

## 6. The Q4/Q7 gate — tables built now, real client data waits

**Middle-path resolution (Q4) stated the way ruling E stated who-gave-
to-whom UNBUILT.**

- **Migration authoring**: all 8 tables above ship in the advisor
  persistence migration when it lands. Schema is ready for real client
  data.
- **Write endpoints for `client` / `client_session` / `client_note`**:
  build, ship, and gate — write paths land in code but reject real-people
  input pending Q7 confirmation. Options for the gate:
  (a) feature-flag: `ADVISOR_CLIENT_WRITES_ENABLED` env-var checked in
      the endpoint before accepting non-demo payloads;
  (b) role gate: writes accepted only for demo/staff advisor accounts
      until FT flips the switch after Derek confirms;
  (c) row gate: `client.owner_advisor_person_id` allowlist against a
      curated set of pilot practices with confirmed processor DPA.
  FT to pick the gate mechanism as part of the build slice.
- **Read endpoints for `client` / `client_session` / `client_note`**:
  land at the same time; reading FROM a table with only seed rows is
  fine. Reading real-client rows is inert until writes are enabled.
- **`practice_lesson` / `doc_category` / `doc` / `cohort` / `cohort_member`**:
  NOT gated by Q7. These entities are the advisor's OWN authored content
  (curriculum, practice-ops docs, cohorts of the advisor's own
  clients — the cohort_member row references a `client.id`, so the gate
  transitively covers cohort_member for real clients too). Practice
  content and documentation writes can enable at ship time.
- **Cohort membership caveat**: `cohort_member` FKs to `client.id` — if
  `client` writes are gated, `cohort_member` real-client rows are
  transitively gated. `cohort` writes for cohorts WITHOUT real members
  (e.g. demo cohorts with `external_members` only, no `cohort_member`
  rows) are ungated.

**Parallel to ruling E precedent**: ruling E clause 6 keeps the `who-
gave-to-whom` view UNBUILT until subpoena posture is set. This draft
keeps the `client` / `client_session` / `client_note` write path GATED
until Q7 (processor-vs-joint-controller) is set. Same pattern; different
counsel question; both isolate cleanly to one seam without blocking the
rest of the build.

---

## 7. Seed story

Advisor seed sits atop the Individual pilot seed (migration 0002:
17 orgs + Marcus + 3 gifts) and the demo-roster migration (migration
0005: Jordan Avery `type='staff'`, Morgan Walker `type='advisor'`,
Reese Donovan `type='ops'` — all pending, `demo-*@example.invalid`).

**Practice profile seed** (no advisor-schema migration needed — reuses
`person.extensions`):

- On the advisor migration (or as a seed sub-slice), Morgan Walker's
  demo-roster person row (from migration 0005) gets its
  `extensions.advisor.*` blob populated:
  `{ practiceName: "Walker Philanthropic Advisory", advisorTitle:
     "Principal Advisor", practiceFocus: "Athletes in early career",
     yearsActive: 7 }`.
- `person.display_name` already "Morgan Walker" from 0005; no change.

**Practice-authored content seed** (ungated, per §6):

- 5 `practice_lesson` rows (pl-001..pl-005 from
  `src/data/practiceContent.js`) inserted with
  `owner_advisor_person_id = Morgan Walker's person.id`. Fresh UUIDs OK,
  or preserve pl-XXX ids for demo continuity.
- 2 `doc_category` rows + 4 `doc` rows from `src/data/documentation.js`
  inserted under Morgan's ownership.
- 2 `cohort` rows (coh-001, coh-002) from `src/data/cohorts.js` — but
  their `cohort_member` rows are GATED (see below).

**Client seed** (gated by Q7, per §6):

- **Fictional demo-roster clients (c-001..c-009 from `clients.js`):
  seedable NOW**, before Q7 confirms. These are fictional per the
  fixture's opening comment ("All names, organizations, and figures in
  this file are fictional. Used for demo purposes only."). Seeding
  them as `client` rows under Morgan's ownership is the demo-parallel
  of Marcus's seed gifts — fictional data used to demonstrate the
  persistence shape, not real-people data.
- **Marcus c-001 note**: the fictional Marcus in `clients.js` c-001 is
  the SAME demo character as the Individual pilot's Marcus (persons
  `p-individual-c-001`, `p-advisor-c-001`, `p-enterprise-1` — the
  same-person dedup deferred per CLAUDE.md §4). If Advisor seeds c-001
  as a `client` row owned by Morgan, that row's `client.name = "Marcus
  Thompson"` mirrors the fictional Marcus already in the Individual
  `person` table (0002 seed). Same fictional identity, two
  representations — no data-integrity issue because both are seed data,
  but a note for the eventual dedup design.
- `cohort_member` rows for coh-001 (memberIds c-001, c-005, c-008) and
  coh-002 (memberIds c-007) reference the c-001..c-008 `client.id`s
  seeded above. Seedable NOW under the fictional interpretation.
- **REAL client rows (real athletes signing on with pilot advisors):
  WAIT.** No real client `client` / `client_session` / `client_note`
  data lands until Q7 (processor-vs-joint-controller) is confirmed and
  the write-endpoint gate (§6) is opened.

---

## 8. Indexing note (schema-first discipline, D1 rows-read)

Every FK backing a "my X" read has an index at migration time.
Consolidated list from §3:

- `idx_client_owner_advisor_person_id` — advisor's "my roster" read.
- `idx_client_session_client_id` — client's session history.
- `idx_client_note_client_id` — client's private notes.
- `idx_practice_lesson_owner_advisor_person_id` — advisor's authored
  curriculum.
- `idx_doc_category_owner_advisor_person_id` — advisor's doc categories.
- `idx_doc_category_id` — docs in a category.
- `idx_cohort_owner_advisor_person_id` — advisor's cohorts.
- `idx_cohort_member_client_id` — client's cohort memberships (reverse
  lookup). The composite PK on `(cohort_id, client_id)` implicitly
  indexes cohort-scoped membership reads.

Existing Individual-schema indexes (`gift.giver_person_id`,
`gift.recipient_org_id`, `scenario.owner_person_id`, `person.auth_user_id`)
are unaffected.

D1 bills rows-read; unindexed full-table scans cause surprise bills.
Table-stakes, not optimization. Same discipline as the Individual
schema draft §6.

---

## 9. Open items (small — flag, don't decide)

The 12 rulings resolve the design surface. A handful of narrow items
remain — flagged here for the build slice or a future micro-ruling
rather than reopened:

- **Q4 gate mechanism**: FT to pick between (a) env-var feature flag,
  (b) role gate on demo/staff advisor rows, (c) row-level allowlist.
  Per §6. Not a schema decision; a deploy-side control.
- **`client.giving_plan` shape versioning**: the JSON blob's inner
  shape (statement, causes, themes, geography, etc.) evolves as the
  advisor uses it. No versioning column drafted here; if the shape
  needs a versioned migration path later, a `giving_plan_version` field
  can be added without a schema change (JSON-shape convention). Flag,
  don't build.
- **`doc.body` size ceiling**: TEXT is unbounded in SQLite but D1 has
  practical limits per row. Fixture bodies are ~10-15 short paragraphs;
  no ceiling drafted here. Flag if a real advisor tries to paste a book
  chapter.
- **Cohort-level `sessions` array**: currently `[]` in all seed rows.
  No shape ruling — the JSON stays open. If cohort sessions become
  first-class (like `client_session`), they'd need their own table via
  a follow-up ruling.
- **`practice_lesson.base_id` orphan check**: Q10 kept base curriculum
  in fixture, so `base_id` is a plain string. If a fixture lesson id
  is removed in a code release, orphan `practice_lesson.base_id`
  references land in an inconsistent state. Application-layer
  validation on load; not a schema constraint.
- **Q11 revisit threshold** metrics: `50 KB gzipped` and `≥3 endpoints
  on mount` are the drafted revisit triggers. Not measured yet; add
  observability as part of the wire-surfaces slice.

---

## 10. Next

**HELD.** Schema draft awaits FT sign-off. On sign-off:

- Migration slice: single migration file creating all 8 tables + all 8
  indexes in one atomic apply. Local-then-remote per CLAUDE.md §6.10.
- Q7 counsel-gated seam handoff to Derek (processor-vs-joint-controller
  question). Parallel work, non-blocking for schema/migration.
- Seed sub-slice: Morgan Walker practice profile + practice-authored
  content + fictional demo clients + cohorts. Per §7.
- Write-endpoint gate mechanism (Q4) selection.
- Wire-surfaces slice: auth ↔ providers bridge, per-entity endpoints,
  Chrome identity swap. Mirrors the Individual wire-surfaces arc.

Two counsel-gated seams remain isolated and do NOT block the schema
migration or the ungated wire-surfaces work: Q7 (Advisor processor-vs-
joint-controller) + ruling E's Clause 3 / Clause 6 (charitable floor +
subpoena posture, carried from Individual).
