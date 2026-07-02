-- Migration 0007 — Advisor persistence schema.
--
-- Spec source: docs/advisor-persistence-schema-draft.md (RULED; 12
-- rulings applied, plus review amendments — HEAD ef035d3). Eight tables:
-- client, client_session, client_note, practice_lesson, doc_category,
-- doc, cohort, cohort_member. Depends on `person` (0001) — every
-- top-level owner FK targets person.id ON DELETE CASCADE per the
-- ruling-E person-boundary discipline.
--
-- Schema-only migration. Seed rows land in a follow-up seed migration
-- (0008 or later), matching the 0001/0002 precedent (schema first;
-- seed second).
--
-- Conventions carried from 0001:
--   - Snake_case column names.
--   - Non-auth timestamps: TEXT ISO 8601.
--   - JSON-typed columns: TEXT (D1/SQLite has no native JSON type; the
--     JSON1 extension reads TEXT columns).
--   - Foreign keys: ON DELETE CASCADE per the person-boundary cascade
--     (ruling E) — advisor account hard-delete cascades to all owned
--     entities.
--   - Table creation order respects FK dependencies: client →
--     client_session / client_note; doc_category → doc; cohort +
--     client → cohort_member.
--
-- Q4/Q7 gate: schema builds now. Write endpoints for
-- client / client_session / client_note gate on the role-gate ruling
-- (docs/advisor-persistence-schema-draft.md §6 amended review ruling:
-- option (b) — role gate keyed on owning person row; upgrades to
-- option (c) row-level allowlist when Q7 counsel answer lands).
-- Ungated tables: practice_lesson, doc_category, doc, cohort.
-- cohort_member is transitively gated: its client_id FK requires
-- client writes to be enabled.

-- =============================================================================
-- CLIENT — the advisor's client roster.
--
-- Q6 ruling: plain name TEXT column, owner-scoped access enforced in
-- endpoints (owner_advisor_person_id chokepoint).
--
-- Q1 ruling: giving_plan is an advisor-curated snapshot JSON. NO sync
-- with individual.extensions. NO FK to any individual person row.
-- Stored as a whole-replaced JSON blob; each save writes the full
-- object.
--
-- Q8 ruling: agenda + pipeline are small JSON-replaced-whole columns
-- (always saved as unit; no partial-update concurrency risk).
--
-- Q9 platform-wide guardrail (repeated in EVERY participant table):
-- NO rank / score / priority / suggestion / ordering / progression
-- column may EVER be added to this table — even one cached or derived.
-- Advisor-facing displays that surface computed rankings stay
-- client-side derivations, never stored. Parker invariant
-- (docs/advisor-persistence-scoping.md §5.3).
--
-- Parker no-lifecycle-field invariant: NO settlement / processed /
-- refunded / disputed / status column may EVER be added. 'stage' is
-- relationship-state (New | Active | Mature | Sunset), acceptable —
-- 'Sunset' is a relationship-state marker, not a rank. NO
-- stage_progression / stage_score / priority column may EVER be added.
--
-- Close-out ≠ delete: ending an advisor-client working relationship is
-- a stage change (stage = 'Sunset'), NOT a row deletion. Only the
-- OWNING ADVISOR account hard-delete removes the client row via
-- CASCADE.
-- =============================================================================

CREATE TABLE client (
  id                          TEXT NOT NULL PRIMARY KEY,       -- opaque UUID
  owner_advisor_person_id     TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,

  -- PII (Q6): plain TEXT, owner-scoped access enforced in endpoints.
  name                        TEXT NOT NULL,
  initials                    TEXT,

  sport                       TEXT,
  level                       TEXT,                             -- e.g. 'Junior college', 'D1 college'

  -- Relationship state, NOT lifecycle.
  -- Enum: 'New' | 'Active' | 'Mature' | 'Sunset'.
  stage                       TEXT NOT NULL,

  relationship_started_year   INTEGER,
  summary                     TEXT,
  next_session_date           TEXT,                             -- ISO YYYY-MM-DD, nullable

  -- Q1: advisor-curated snapshot JSON. NO sync with individual.extensions.
  giving_plan                 TEXT,                             -- JSON | NULL

  -- Q8: JSON-replaced-whole small nested structures.
  next_session_agenda         TEXT,                             -- JSON {topics, openThreads, curriculumLinks}
  pipeline_state              TEXT,                             -- JSON [{type,state,source}] × 5

  created_at                  TEXT NOT NULL,                    -- ISO 8601
  updated_at                  TEXT NOT NULL                     -- ISO 8601
);

-- =============================================================================
-- CLIENT_SESSION — session history per client.
--
-- Q12 ruling: table named `client_session` (better-auth owns `session`).
--
-- Q8 ruling: decisions + action_items are small text arrays, always
-- saved as unit — JSON-replaced-whole columns.
--
-- Q9 guardrail: NO rank / score / priority / suggestion / progression
-- column. Parker no-lifecycle: NO settlement / processed / status
-- column beyond the authoring context. Session records are historical
-- artifacts; no per-session workflow state.
-- =============================================================================

CREATE TABLE client_session (
  id            TEXT NOT NULL PRIMARY KEY,                       -- opaque UUID
  client_id     TEXT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,                                    -- ISO YYYY-MM-DD
  title         TEXT,
  summary       TEXT,

  -- Q8 JSON-replaced-whole.
  decisions     TEXT,                                             -- JSON string[]
  action_items  TEXT,                                             -- JSON string[]

  created_at    TEXT NOT NULL                                     -- ISO 8601
);

-- =============================================================================
-- CLIENT_NOTE — advisor-only private notes.
--
-- Separate table (not JSON column on client) because private notes are
-- the most sensitive slice inside client records. Separate table makes
-- row-level access + audit easier and lets a future per-note access
-- control land without a client migration.
--
-- Q9 guardrail: NO rank / score / priority / suggestion column.
-- Parker no-lifecycle: NO status column. Notes are immutable authored
-- content; editing behavior lives in application logic.
-- =============================================================================

CREATE TABLE client_note (
  id           TEXT NOT NULL PRIMARY KEY,                        -- opaque UUID
  client_id    TEXT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  date         TEXT NOT NULL,                                     -- ISO YYYY-MM-DD
  content      TEXT NOT NULL,                                     -- freeform text; sensitive payload
  tags         TEXT,                                              -- JSON string[]
  created_at   TEXT NOT NULL                                      -- ISO 8601
);

-- =============================================================================
-- PRACTICE_LESSON — advisor's forks + authored curriculum.
--
-- Q10 ruling: base_id is a plain TEXT reference to a fixture id (e.g.
-- 'l-22'). Base curriculum stays in the code fixture
-- (src/data/content.js) — NOT a hard FK to a D1 table. Base curriculum
-- is platform content, editable via code review / release, not runtime
-- UI. Application-layer validation catches orphan base_id references
-- on load; not a schema constraint.
--
-- Q8 ruling: status is AUTHORING STATE ONLY. Enum:
-- 'published' | 'draft'. NOT a lifecycle / workflow / settlement state.
-- Parker no-lifecycle: NO settlement / processed / refunded / disputed
-- / cleared / reversed column may EVER be added — not even via
-- back-door rename. Authored content stays authored content.
--
-- Q8 ruling: materials is a small JSON-replaced-whole array.
--
-- Q9 platform-wide guardrail: NO rank / score / priority / suggestion /
-- ordering column may EVER be added. If advisor UX wants "suggested
-- next lesson," it stays a client-side derivation, never a stored
-- column.
-- =============================================================================

CREATE TABLE practice_lesson (
  id                        TEXT NOT NULL PRIMARY KEY,           -- 'pl-XXX' or opaque UUID
  owner_advisor_person_id   TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,

  -- Enum: 'fork' | 'authored'. Fork requires base_id; authored has null base_id.
  kind                      TEXT NOT NULL,

  -- Q10: plain TEXT reference to a fixture id — NOT a hard FK.
  base_id                   TEXT,

  -- Q8: AUTHORING STATE ONLY. Enum: 'published' | 'draft'.
  status                    TEXT NOT NULL,

  title                     TEXT NOT NULL,
  minutes                   INTEGER,
  scope                     TEXT,                                 -- 'all' | 'Athletics'
  category                  TEXT,                                 -- 'primer' | 'workflow'
  summary                   TEXT,

  -- Q8 JSON-replaced-whole.
  materials                 TEXT,                                 -- JSON [{id,type,title,fileName}]

  created_at                TEXT NOT NULL,                        -- ISO 8601
  updated_at                TEXT NOT NULL                         -- ISO 8601
);

-- =============================================================================
-- DOC_CATEGORY — documentation hub categories.
--
-- UNIQUE(owner_advisor_person_id, label) matches
-- DocumentationProvider.addSection duplicate-label check
-- (src/contexts/DocumentationContext.jsx:94-97). Enforced at the DB.
--
-- Q9 guardrail: NO rank / score / priority / ordering column.
-- Parker no-lifecycle: NO status column. Categories are containers.
-- =============================================================================

CREATE TABLE doc_category (
  id                        TEXT NOT NULL PRIMARY KEY,           -- opaque UUID
  owner_advisor_person_id   TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  label                     TEXT NOT NULL,
  hint                      TEXT,
  created_at                TEXT NOT NULL,                        -- ISO 8601

  UNIQUE (owner_advisor_person_id, label)
);

-- =============================================================================
-- DOC — documentation records.
--
-- doc.id ruling (post-review amendment): opaque UUID, matching every
-- other table's identity discipline. The fixture's slug ids (e.g.
-- 'onboarding-script', '990-reading-guide') were per-advisor-unique
-- only — DocumentationContext.uniqueId scopes the duplicate check to a
-- single advisor's category set, so slug ids would collide as a global
-- PK across practices once real advisor accounts land. Slug retained
-- only as seed-data provenance in application logic if needed, never
-- as identity.
--
-- doc.updated ruling (post-review amendment): stored as ISO 8601, not
-- the fixture's display string ('April 12, 2026'). Display formatting
-- happens at render via the formatSessionDate precedent
-- (src/data/clients.js — 3 advisor consumers already: CohortSpace,
-- CohortDetail, ClientWorkspace).
--
-- Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle: NO status column. Docs are authored artifacts;
-- editing behavior lives in application logic.
-- =============================================================================

CREATE TABLE doc (
  id            TEXT NOT NULL PRIMARY KEY,                       -- opaque UUID
  category_id   TEXT NOT NULL REFERENCES doc_category(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  updated       TEXT NOT NULL,                                    -- ISO 8601
  notes         TEXT,                                             -- one-line description
  body          TEXT NOT NULL,                                    -- JSON string[] paragraphs
  created_at    TEXT NOT NULL                                     -- ISO 8601
);

-- =============================================================================
-- COHORT — practice's cohorts (Q2 per-practice ruling).
--
-- cohort.started ruling (post-review amendment): stored as ISO 8601
-- (e.g. '2026-02-01' for a February 2026 start), not the fixture's
-- display string ('February 2026'). Fixture month-only strings
-- normalize to first-of-month ISO at seed time.
-- cohort.next_session_date was already ISO in the fixture; this ruling
-- brings cohort.started to the same convention.
--
-- Q8 ruling: assigned_lessons, updates, sessions are small JSON-
-- replaced-whole arrays.
--
-- Q9 guardrail: NO rank / score / priority / success_score column may
-- EVER be added — even one cached or derived.
-- Parker no-lifecycle: NO status / phase / stage column beyond the
-- relationship-shape data already present.
-- =============================================================================

CREATE TABLE cohort (
  id                        TEXT NOT NULL PRIMARY KEY,           -- 'coh-XXX' or opaque UUID
  owner_advisor_person_id   TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,

  name                      TEXT NOT NULL,
  focus                     TEXT,                                 -- e.g. 'Issue-area cohort', 'Team cohort'
  started                   TEXT,                                 -- ISO YYYY-MM-DD, nullable
  next_session_date         TEXT,                                 -- ISO YYYY-MM-DD, nullable
  summary                   TEXT,

  external_members          INTEGER NOT NULL DEFAULT 0,           -- count of non-roster members

  -- Q8 JSON-replaced-whole.
  assigned_lessons          TEXT,                                 -- JSON string[]
  updates                   TEXT,                                 -- JSON [{title,body,date}]
  sessions                  TEXT,                                 -- JSON []

  created_at                TEXT NOT NULL,                        -- ISO 8601
  updated_at                TEXT NOT NULL                         -- ISO 8601
);

-- =============================================================================
-- COHORT_MEMBER — cohort ↔ client junction.
--
-- Q9 platform-wide guardrail: NO rank / score / priority / suggestion /
-- ordering / member_rank / member_order column may EVER be added to
-- this junction table — even one cached or derived. Junction tables
-- are exactly where a "priority member" or "member ordering" column
-- would sneak in through a feature request framed as UX polish;
-- forbid it explicitly. Parker invariant, inline on this table for
-- 8/8 coverage across the migration.
-- Parker no-lifecycle: NO status / joined_state / removed_at column
-- beyond the joined_at timestamp already present.
--
-- Composite PK gives an implicit index on (cohort_id, client_id) —
-- covers cohort-scoped membership reads. Explicit index on client_id
-- alone (in the INDEXES section below) covers the reverse-lookup
-- "which cohorts is this client in?" read used in ClientWorkspace.jsx.
-- =============================================================================

CREATE TABLE cohort_member (
  cohort_id     TEXT NOT NULL REFERENCES cohort(id) ON DELETE CASCADE,
  client_id     TEXT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  joined_at     TEXT NOT NULL,                                    -- ISO 8601
  PRIMARY KEY (cohort_id, client_id)
);

-- =============================================================================
-- INDEXES — every "my X" FK indexed from migration time.
--
-- D1 bills rows-read; unindexed full-table scans are surprise bills,
-- not optimizations. Same discipline as migration 0001. The composite
-- PK on cohort_member(cohort_id, client_id) implicitly indexes
-- cohort-scoped membership reads; the explicit client_id index below
-- covers the reverse lookup.
-- =============================================================================

CREATE INDEX idx_client_owner_advisor_person_id           ON client(owner_advisor_person_id);
CREATE INDEX idx_client_session_client_id                 ON client_session(client_id);
CREATE INDEX idx_client_note_client_id                    ON client_note(client_id);
CREATE INDEX idx_practice_lesson_owner_advisor_person_id  ON practice_lesson(owner_advisor_person_id);
CREATE INDEX idx_doc_category_owner_advisor_person_id     ON doc_category(owner_advisor_person_id);
CREATE INDEX idx_doc_category_id                          ON doc(category_id);
CREATE INDEX idx_cohort_owner_advisor_person_id           ON cohort(owner_advisor_person_id);
CREATE INDEX idx_cohort_member_client_id                  ON cohort_member(client_id);
