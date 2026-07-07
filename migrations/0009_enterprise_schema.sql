-- Migration 0009 — Enterprise persistence schema.
--
-- Spec source: docs/enterprise-persistence-schema-draft.md (SIGNED OFF
-- at 4672899; four open decisions ruled defer-to-team). Twelve tables:
-- institution, institution_contact, athlete, athlete_activity,
-- athlete_note, athlete_reflection, workshop, workshop_attendance,
-- workshop_followup, exclusion, compliance_audit,
-- cohort_period_snapshot. Depends on `person` (0001) — institution_contact
-- + athlete + workshop_followup + compliance_audit + athlete_note +
-- workshop.facilitator + athlete.person_id all target person.id.
--
-- Schema-only migration. Seed rows land in 0010 (matching the 0001/0002
-- and 0007/0008 precedents — schema first, seed second).
--
-- Conventions carried from 0001 + 0007:
--   - Snake_case column names.
--   - Non-auth timestamps: TEXT ISO 8601.
--   - Ints for booleans (0/1); D1/SQLite has no native boolean type.
--   - Foreign keys: institution-boundary cascade (E1) is CASCADE from
--     institution.id; athlete-boundary cascade (E3 override) is CASCADE
--     from athlete.id; ruling-E person-boundary is CASCADE on
--     institution_contact.person_id and SET NULL on athlete.person_id
--     (§4.2 Option B — anonymize-to-stub runs at endpoint layer).
--   - Table creation order respects FK dependencies: institution →
--     institution_contact / athlete / workshop / exclusion /
--     compliance_audit / cohort_period_snapshot; athlete → athlete_note
--     / athlete_activity / athlete_reflection; workshop + athlete →
--     workshop_attendance; workshop → workshop_followup.
--
-- E11 gate: schema builds now. Write endpoints for all 12 enterprise
-- tables gate on requireGatedEnterprise (twin of requireGatedAdvisor,
-- checks $.enterprise.demo_gate on the owning person row per schema
-- draft §6). Uniform gate posture per §6 sign-off; E3/E6/E8 counsel-
-- gated seams isolate to specific write paths per §4.3.
--
-- Fixture continuity: seed data source is src/data/enterpriseFixtures.js
-- (INST_PROFILES / contacts / endowmentSnapshot / exclusions /
-- complianceAuditLog / workshops / athletes / priorCohortSnapshot /
-- currentCohortSnapshot). Athletes + athlete_* + workshops +
-- attendance + followups + exclusions + audit rows are OUT of the seed
-- per §7 slim-scope ruling; they enter D1 through the gated roster-add
-- write path when wire-surfaces lands.

-- =============================================================================
-- INSTITUTION — the institution row (E1: NO owner column here).
--
-- E1 ruling: institution ownership routes through institution_contact
-- with is_default_operator tie-breaker (see next table). Pilot has one
-- institution — multi-tenancy posture accepted at schema level but not
-- generalized from the ruling.
--
-- E9/Q9 platform-wide guardrail: NO rank / score / priority /
-- suggestion / ordering / rating / grade column may EVER be added to
-- this table — even one cached or derived. Any computed institutional
-- ranking stays client-side, never persisted.
--
-- Parker no-lifecycle-field invariant: NO settlement / processed /
-- refunded / disputed / cleared / reversed column may EVER be added,
-- not even via back-door rename. contract_label is a display string;
-- annual_amount / endowment_annual / endowment_current are money
-- values, NOT lifecycle states.
-- =============================================================================

CREATE TABLE institution (
  id                       TEXT NOT NULL PRIMARY KEY,             -- opaque UUID
  name                     TEXT NOT NULL,
  sector                   TEXT NOT NULL,                          -- e.g. 'Athletics'; per T() fixture helper
  dept                     TEXT,                                    -- e.g. 'Athletic Department'
  contract_label           TEXT,                                    -- e.g. 'Season Residency — Aug 2025 to May 2026'
  tier                     TEXT,                                    -- e.g. 'Revenue Sports Package'
  annual_amount            INTEGER,                                 -- USD dollars
  endowment_annual         INTEGER,                                 -- USD contributed to endowment per year
  endowment_current        INTEGER,                                 -- USD current endowment value (cache)
  program_term             TEXT,                                    -- display label; see contract_label
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL
);

-- =============================================================================
-- INSTITUTION_CONTACT — institution ↔ person join (E1, E4).
--
-- Replaces every fixture name-string cross-reference (workshop.facilitator,
-- workshops.followUps[].owner, INST_PROFILES.facilitator,
-- complianceAuditLog.user) with a real FK to person(id).
--
-- E4 ruling: this row grants ZERO enterprise capability to the referenced
-- person. RequireType('staff') at the /app/enterprise route + the E11 gate
-- on write endpoints are the authoritative capability seams. Enterprise
-- UI READS this table to render staff names next to workshop facilitator
-- slots and audit-log entries; it does NOT authorize.
--
-- E1 tie-breaker: if any institution has multiple contacts, exactly one
-- carries is_default_operator=1. Endpoint layer enforces the "exactly
-- one" invariant on write; DB-level UNIQUE partial index is an option
-- at migration time if D1 supports partial indexes (§9 open item).
--
-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle: NO status column.
-- =============================================================================

CREATE TABLE institution_contact (
  id                       TEXT NOT NULL PRIMARY KEY,             -- opaque UUID
  institution_id           TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  person_id                TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  role_title               TEXT NOT NULL,                          -- e.g. 'Senior Director, Athletic Development', 'Facilitator', 'Program Admin'
  is_default_operator      INTEGER NOT NULL DEFAULT 0,             -- boolean; exactly one per institution enforced at endpoint
  created_at               TEXT NOT NULL
);

-- =============================================================================
-- ATHLETE — the program participant record (E3 OVERRIDE).
--
-- E3 override ruling: separate table with nullable person_id linkage;
-- retention posture INVERTED from ruling E. Athlete data belongs to the
-- athlete. Departure/deletion cascades ALL athlete-related data across
-- the institution (contact fields, athlete_activity, athlete_note,
-- athlete_reflection, workshop_attendance for this athlete).
-- Institutional residual on the athlete row = stub of name, class
-- (year), sport ONLY — "almost useless by design."
--
-- §4.2 Option B RULED: athlete.person_id is ON DELETE SET NULL, NOT
-- CASCADE. When the linked individual-side person row is deleted via
-- ruling E cascade, the athlete row SURVIVES with person_id cleared;
-- the endpoint-layer athlete DELETE handler runs the anonymize-to-stub
-- step. Matches the ruling E anonymize-not-orphan precedent shape.
--
-- §4.2 name-retention RULED: name → 'redacted' at anonymize time
-- (full anonymization; class + sport carry the cohort-tally value
-- without the identity).
--
-- Anonymize-to-stub mechanics (endpoint-layer, on athlete-side DELETE):
--   1. email, phone, notes, position → NULL.
--   2. gps_completed_at, lessons_count, gifts_count, last_active_at
--      → NULL / 0.
--   3. badge → NULL.
--   4. enrollment_status → 'Sunset' (departure marker; SIGNED OFF as
--      the one stub datum beyond name/class/sport — carries no
--      personal signal).
--   5. certified → 0; cert_at → NULL.
--   6. join_date → NULL.
--   7. person_id → NULL.
--   8. name → 'redacted'.
--
-- E9/Q9 platform-wide guardrail: NO rank / score / priority /
-- suggestion / ordering / progression / rating / grade column may EVER
-- be added — even one cached or derived. The enrollment_status column
-- is relationship state; NO status_progression / status_score /
-- priority column may EVER be added. The badge column is descriptive
-- label per E10; NO badge_rank / badge_score column may EVER be added.
--
-- Parker no-lifecycle-field invariant: NO settlement / processed /
-- refunded / disputed / cleared column may EVER be added — not even
-- via back-door rename. 'enrollment_status' is relationship state
-- (Invited/Active/Stalled/Sunset/Certified), acceptable.
--
-- E10: badge is staff-authored descriptive label ONLY. NEVER auto-
-- derived. NEVER a rank. Three-layer enforcement: this docblock +
-- endpoint field allowlist (staff-only writable free text) +
-- seed-copy screen at seed time.
--
-- E3 UNCLAIMED-ROW POSTURE (COUNSEL-GATED, pending):
-- An unclaimed athlete row (person_id IS NULL, but populated with a
-- fresh non-signing-party's name + email at roster-add time — NOT the
-- post-anonymize NULL state) stores real name + email of a non-
-- signing party. The E11 gate on athlete + athlete_* write endpoints
-- holds these writes dark on the production side until counsel
-- confirms the unclaimed-row PII posture. Schema lands; gate holds;
-- seam confirms in parallel.
--
-- E3 UNDER-18 ESCALATION FLAG:
-- The pilot cohort is 18+ collegiate. If a future roster includes
-- minors, an additional cascade layer is required — the guardian
-- likely holds deletion authority, and the athlete-boundary cascade
-- here needs a guardian-authorization gate. Flag for a future ruling
-- when a minor-participant program lands.
-- =============================================================================

CREATE TABLE athlete (
  id                       TEXT NOT NULL PRIMARY KEY,             -- opaque UUID
  institution_id           TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,

  -- §4.2 Option B RULED: SET NULL; anonymize-to-stub runs at endpoint layer.
  person_id                TEXT REFERENCES person(id) ON DELETE SET NULL,

  -- STUB COLUMNS (survive E3 anonymize-to-stub as name='redacted', year, sport).
  name                     TEXT NOT NULL,                          -- 'redacted' at anonymize time per §4.2 ruling
  year                     TEXT,                                    -- e.g. 'Junior', 'Senior' — class
  sport                    TEXT,

  -- CASCADE-AWAY COLUMNS (nulled/emptied at endpoint anonymize step).
  position                 TEXT,
  email                    TEXT,                                    -- 'cooperstate.edu' at pilot; PII tier 3
  phone                    TEXT,
  notes                    TEXT,                                    -- staff-authored field-level observations

  gps_completed_at         TEXT,                                    -- ISO YYYY-MM-DD, nullable
  lessons_count            INTEGER NOT NULL DEFAULT 0,
  gifts_count              INTEGER NOT NULL DEFAULT 0,
  last_active_at           TEXT,                                    -- ISO 8601 or ISO YYYY-MM-DD

  -- E10: staff-authored descriptive label ONLY. NEVER auto-derived. NEVER a rank.
  badge                    TEXT,

  -- Enum: 'Invited' | 'Active' | 'Stalled' | 'Sunset' | 'Certified'.
  -- 'Certified' terminal state is a milestone, not a rank. 'Sunset' is
  -- the anonymize marker per §4.2 step 4.
  enrollment_status        TEXT NOT NULL,
  certified                INTEGER NOT NULL DEFAULT 0,               -- boolean
  cert_at                  TEXT,                                     -- ISO YYYY-MM-DD when certified=1

  join_date                TEXT,                                     -- ISO YYYY-MM-DD

  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL
);

-- =============================================================================
-- ATHLETE_ACTIVITY — timeline events per athlete (cascades on athlete).
--
-- E3 cascade: ON DELETE CASCADE from athlete. All timeline history is
-- removed when the athlete is deleted (E3 retention inversion).
-- Historical cohort snapshot (E9) captures aggregate counts that
-- survive this cascade — see cohort_period_snapshot.
--
-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle: NO settlement / processed / cleared / status
-- column. This is a display log, NOT a state machine — gift lifecycle
-- (per the individual-schema Parker rule) belongs on the `gift` table,
-- never mirrored here.
-- =============================================================================

CREATE TABLE athlete_activity (
  id                       TEXT NOT NULL PRIMARY KEY,             -- opaque UUID
  athlete_id               TEXT NOT NULL REFERENCES athlete(id) ON DELETE CASCADE,
  date                     TEXT NOT NULL,                          -- ISO YYYY-MM-DD
  -- Enum: 'lesson_completed' | 'workshop_attended' | 'gift_made' |
  --       'note_added' | 'gps_completed' | 'certified'
  type                     TEXT NOT NULL,
  label                    TEXT NOT NULL,                          -- display label; e.g. 'Lesson 5: Giving Vehicles'
  created_at               TEXT NOT NULL
);

-- =============================================================================
-- ATHLETE_NOTE — staff-authored notes about individual athletes.
--
-- Separate table (not JSON column on athlete) mirrors advisor
-- client_note posture: staff notes about identified subjects are a
-- sensitive slice; separate table makes row-level access + audit easier
-- and lets a future per-note access control land without an athlete
-- migration.
--
-- E3 cascade: ON DELETE CASCADE from athlete. Staff notes about the
-- athlete are athlete-related data per the E3 override; they do NOT
-- survive the athlete's deletion.
--
-- Author retention: author_person_id has NO ON DELETE cascade UPWARD.
-- Per §3.5 open item + §9 disposition: the FK is NOT NULL for now;
-- endpoint layer refuses to delete a staff person while their notes
-- remain. If the alternative (author_person_id NULL-able for
-- author-orphan) is preferred at build time, this line changes to
-- SET NULL — flagged for the athlete-note write-endpoint slice.
--
-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle: NO status column. Notes are immutable authored
-- content; editing behavior lives in application logic.
-- =============================================================================

CREATE TABLE athlete_note (
  id                       TEXT NOT NULL PRIMARY KEY,             -- opaque UUID
  athlete_id               TEXT NOT NULL REFERENCES athlete(id) ON DELETE CASCADE,
  author_person_id         TEXT NOT NULL REFERENCES person(id),   -- staff person who wrote the note
  date                     TEXT NOT NULL,                          -- ISO YYYY-MM-DD
  content                  TEXT NOT NULL,                          -- freeform text; PII tier 2
  created_at               TEXT NOT NULL
);

-- =============================================================================
-- ATHLETE_REFLECTION — first-person athlete narrative (E6 + E3 cascade).
--
-- Highest-sensitivity slice per the scoping doc PII tiers. Athlete-
-- authored, institution-visible (with the E6 visibility toggle when
-- the athlete claims an individual account).
--
-- E3 cascade: ON DELETE CASCADE from athlete. Reflections are the most
-- athlete-owned tier of content per the PII scoping; when the athlete
-- departs, reflections go with them. Institutional read caches must
-- respect this by re-fetching from D1 rather than persisting local
-- copies.
--
-- E6 visibility bit: when the athlete has claimed their individual
-- account (athlete.person_id IS NOT NULL), they can toggle this per
-- reflection. When unclaimed, the pre-claim posture is set by
-- program-level consent (see below); default here is 1 (visible), but
-- the endpoint enforces the pre-claim gap honestly.
--
-- E6 PRE-CLAIM POSTURE (COUNSEL-GATED, pending):
-- Before the athlete claims an individual account, the visibility
-- toggle is not directly athlete-controllable because there is no
-- signed-in athlete session. The interim posture is program-level
-- consent captured at seed / roster-add time and named honestly on
-- the surface (e.g. "Reflections you record during the program are
-- visible to your athletic department staff. When you claim your
-- StewardHouse account, you gain per-reflection visibility
-- controls."). Counsel-gated on the exact institutional consent
-- language.
--
-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle: NO status column.
-- =============================================================================

CREATE TABLE athlete_reflection (
  id                        TEXT NOT NULL PRIMARY KEY,            -- opaque UUID
  athlete_id                TEXT NOT NULL REFERENCES athlete(id) ON DELETE CASCADE,
  date                      TEXT NOT NULL,                         -- ISO YYYY-MM-DD
  text                      TEXT NOT NULL,                         -- first-person narrative; PII tier 1
  visible_to_institution    INTEGER NOT NULL DEFAULT 1,            -- E6 visibility bit; default visible
  created_at                TEXT NOT NULL
);

-- =============================================================================
-- WORKSHOP — cohort session (institution-scoped).
--
-- E3 cascade note: workshops belong to the institution, NOT to the
-- athlete. A workshop persists after any athlete departs; only that
-- athlete's row in workshop_attendance cascades away.
--
-- facilitator_person_id resolves the fixture's name-string
-- 'facilitator' field to a real person FK per E4. No cascade upward
-- from person (deleting the facilitator does NOT delete workshops
-- they facilitated — historical accuracy).
--
-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle beyond 'status': the status enum is categorical
-- (scheduled/upcoming/completed), NOT a lifecycle state machine. No
-- settlement / processed / cleared column may EVER be added.
-- =============================================================================

CREATE TABLE workshop (
  id                        TEXT NOT NULL PRIMARY KEY,            -- opaque UUID
  institution_id            TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  date                      TEXT NOT NULL,                         -- ISO YYYY-MM-DD
  title                     TEXT NOT NULL,
  -- Enum: 'scheduled' | 'upcoming' | 'completed'
  status                    TEXT NOT NULL,
  notes                     TEXT,
  facilitator_person_id     TEXT REFERENCES person(id),            -- FK correction from fixture text
  module                    TEXT,                                   -- display label; e.g. 'Module 1: Building Your GPS'
  summary                   TEXT,
  created_at                TEXT NOT NULL,
  updated_at                TEXT NOT NULL
);

-- =============================================================================
-- WORKSHOP_ATTENDANCE — dual-transitive ownership.
--
-- Composite PK mirrors advisor cohort_member shape. Ownership is
-- dual-transitive: through workshop → institution AND through athlete
-- → institution (both must belong to the same institution for the row
-- to be valid — endpoint-layer invariant, not schema-enforced).
--
-- E3 cascade: ON DELETE CASCADE from athlete removes their attendance
-- record when the athlete departs. Aggregate cohort attendance rate
-- (E9 snapshot) captures the pre-departure headcount at snapshot time
-- and survives; a mid-cohort departure does NOT retroactively rewrite
-- the past attendance counts on already-taken snapshots.
--
-- Composite PK gives an implicit index on (workshop_id, athlete_id);
-- explicit athlete_id index below covers the reverse lookup ("which
-- workshops did this athlete attend?").
--
-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle: NO status column.
-- =============================================================================

CREATE TABLE workshop_attendance (
  workshop_id               TEXT NOT NULL REFERENCES workshop(id) ON DELETE CASCADE,
  athlete_id                TEXT NOT NULL REFERENCES athlete(id) ON DELETE CASCADE,
  attended                  INTEGER NOT NULL,                      -- boolean
  note                      TEXT,                                   -- optional per-attendance note
  PRIMARY KEY (workshop_id, athlete_id)
);

-- =============================================================================
-- WORKSHOP_FOLLOWUP — follow-up items per workshop.
--
-- owner_display fallback captures the fixture's 'Cohort' owner —
-- a group of self-directed athletes, not a single person. When
-- owner_person_id is NULL, owner_display carries the free-text label.
--
-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle beyond 'status': the status enum is a small
-- state machine on the followup's OWN authoring context (not on the
-- workshop, not on athletes, not on gifts). Acceptable per the
-- advisor practice_lesson.status ('published'|'draft') precedent.
-- =============================================================================

CREATE TABLE workshop_followup (
  id                        TEXT NOT NULL PRIMARY KEY,            -- opaque UUID
  workshop_id               TEXT NOT NULL REFERENCES workshop(id) ON DELETE CASCADE,
  owner_person_id           TEXT REFERENCES person(id),            -- FK correction from fixture text
  owner_display             TEXT,                                   -- fallback text when owner is not a person row (e.g. 'Cohort')
  action                    TEXT NOT NULL,
  target                    TEXT,                                   -- display label; e.g. '4 athletes'
  -- Enum: 'pending' | 'in_progress' | 'completed'
  status                    TEXT NOT NULL,
  completed_at              TEXT,                                   -- ISO YYYY-MM-DD when status='completed'
  due_at                    TEXT,                                   -- ISO YYYY-MM-DD when status='pending' | 'in_progress'
  created_at                TEXT NOT NULL,
  updated_at                TEXT NOT NULL
);

-- =============================================================================
-- EXCLUSION — institution-scoped org exclusion list (E8 AS AMENDED).
--
-- E8 AMENDED content convention on connection_detail: third parties
-- identified by name + role from PUBLIC record only, NEVER relational
-- or private descriptors.
--   OK:  'Board member Dana Reeves'
--   NOT: "Coach Reeves's spouse serves on the board"
-- Convention is authored-content discipline, not schema enforcement —
-- endpoint layer cannot detect a relational descriptor. Seed-copy
-- screen catches at seed time; live-copy review is the exclusion-add
-- authoring path's discipline.
--
-- NEVER-EMIT PLACEMENT: connection_detail sits on the never-emit side
-- of the emit allowlist for all athlete-facing reads (Discover /
-- GivingModeler / any surface an athlete or cross-surface consumer
-- touches). Only staff-authenticated reads on /app/enterprise/compliance
-- emit connection_detail. Enforced at the endpoint layer; the schema
-- docblock cites the policy.
--
-- COUNSEL-GATED (pending): legal inclusion limits — whether naming a
-- third party at all in an institutional exclusion record raises
-- disclosure obligations independent of the emit allowlist. Isolated
-- to the exclusion endpoints via the E11 gate.
--
-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle: NO settlement / processed / cleared column.
-- 'flagged_at' is a timestamp, not a lifecycle state; if an exclusion
-- is later removed, it is DELETED, not marked 'lifted' via a status
-- column.
-- =============================================================================

CREATE TABLE exclusion (
  id                        TEXT NOT NULL PRIMARY KEY,            -- opaque UUID
  institution_id            TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  name                      TEXT NOT NULL,                         -- org name; references shared org catalog by name (no hard FK)
  ein                       TEXT,
  reason                    TEXT NOT NULL,
  flagged_at                TEXT NOT NULL,                         -- ISO YYYY-MM-DD
  connection                TEXT,                                   -- short label
  connection_detail         TEXT,                                   -- E8 AMENDED: never-emit for athlete-facing reads; content-convention gated
  created_at                TEXT NOT NULL,
  updated_at                TEXT NOT NULL
);

-- =============================================================================
-- COMPLIANCE_AUDIT — append-only audit log (E7).
--
-- E7 APPEND-ONLY CONTRACT (endpoint layer):
-- The endpoint contract for /api/compliance-audit accepts POST ONLY.
-- PUT and DELETE return 405 Method Not Allowed. UPDATE and DELETE are
-- not part of the endpoint contract.
-- Verify D1 trigger support at build time. If D1 grows INSTEAD OF
-- trigger support (or if we migrate to a shape with CHECK enforcement),
-- a DB-level enforcement layer supplements the endpoint contract.
-- Until then, endpoint enforcement is the authoritative layer.
--
-- user_role is intentionally DENORMALIZED from the live
-- institution_contact.role_title at audit-write time — historical
-- accuracy demands that a role change today does NOT rewrite past
-- audit-log rows.
--
-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle beyond append-only: an audit row is immutable;
-- no status column, no update column, no updated_at.
-- =============================================================================

CREATE TABLE compliance_audit (
  id                        TEXT NOT NULL PRIMARY KEY,            -- opaque UUID
  institution_id            TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  timestamp                 TEXT NOT NULL,                         -- ISO 8601 with time
  user_person_id            TEXT NOT NULL REFERENCES person(id),   -- who took the action
  user_role                 TEXT NOT NULL,                         -- denormalized role_title at time of action; historical accuracy
  action                    TEXT NOT NULL,                         -- e.g. 'Added organization to exclusion list'
  target                    TEXT,                                   -- e.g. 'Quick Cash Sports Loans LLC'
  reason                    TEXT,
  notes                     TEXT
);

-- =============================================================================
-- COHORT_PERIOD_SNAPSHOT — historical aggregates (E5, E9).
--
-- E5 ruling: separate table from advisor cohort. NO scope discriminator
-- column on the advisor cohort table. Two "cohort" concepts are
-- semantically different (working group vs program-year aggregate) and
-- forcing a discriminator would leak schema-level ambiguity into every
-- query.
--
-- E3 + E9 HARD INVARIANT (schema-enforced by absence, docblocked here):
-- Snapshots store AGGREGATES ONLY. NO per-athlete identifiable column
-- (no athlete_id, no name, no email) may EVER be added to this table.
-- History must survive athlete deletion (per E3 retention inversion)
-- WITHOUT retaining PII. If a future consumer wants per-athlete
-- history for pedagogical review, that lives in a SEPARATE table with
-- its own athlete-boundary cascade — this one stays aggregate-only.
--
-- E9/Q9 guardrail: NO rank / score / priority column may EVER be
-- added. Snapshot comparison never renders as ranking (#77 precedent
-- extends to consumers of this table). Comparison is for understanding
-- outputs, NOT ranking cohorts.
--
-- Parker no-lifecycle: NO status column. A snapshot is a snapshot;
-- there is no 'in progress' vs 'final' vs 'archived' state. If a
-- correction is needed, delete the row and re-snapshot.
-- =============================================================================

CREATE TABLE cohort_period_snapshot (
  id                        TEXT NOT NULL PRIMARY KEY,            -- opaque UUID
  institution_id            TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  cohort_label              TEXT NOT NULL,                         -- e.g. '2024-2025', '2025-2026'
  as_of_note                TEXT,                                   -- e.g. 'Through May 7, 2026 (12-week engagement complete)'
  snapshot_at               TEXT NOT NULL,                         -- ISO 8601 when the snapshot was persisted

  -- AGGREGATES ONLY. Zero per-athlete identifiable columns, ever.
  athletes_count            INTEGER NOT NULL,
  gps_completed_count       INTEGER NOT NULL,
  gps_rate                  INTEGER NOT NULL,                       -- 0-100 percent
  certified_count           INTEGER NOT NULL,
  cert_rate                 INTEGER NOT NULL,                       -- 0-100 percent
  gifts_count               INTEGER NOT NULL,
  dollars_moved             INTEGER NOT NULL,                       -- USD sum at snapshot time
  attendance_rate           INTEGER NOT NULL,                       -- 0-100 percent
  avg_weekly_engagement     INTEGER NOT NULL,                       -- 0-100 percent

  created_at                TEXT NOT NULL
);

-- =============================================================================
-- INDEXES — every "my X" FK indexed from migration time.
--
-- D1 bills rows-read; unindexed full-table scans are surprise bills,
-- not optimizations. Same discipline as migration 0001 + 0007.
--
-- 13 indexes cover the 13 "my X" reads named in schema-draft §8.
-- Four person-side reverse FKs (athlete_note.author_person_id,
-- workshop.facilitator_person_id, workshop_followup.owner_person_id,
-- compliance_audit.user_person_id) are DELIBERATELY unindexed per the
-- §8 sign-off — no "my authored notes" / "my facilitated workshops" /
-- "my owned followups" / "my audit rows" read is scoped at pilot.
-- Flag if any becomes a required read.
--
-- Composite PK on workshop_attendance(workshop_id, athlete_id)
-- implicitly indexes workshop-scoped attendance reads; the explicit
-- athlete_id index below covers the reverse lookup.
-- =============================================================================

CREATE INDEX idx_institution_contact_institution_id     ON institution_contact(institution_id);
CREATE INDEX idx_institution_contact_person_id          ON institution_contact(person_id);
CREATE INDEX idx_athlete_institution_id                 ON athlete(institution_id);
CREATE INDEX idx_athlete_person_id                      ON athlete(person_id);
CREATE INDEX idx_athlete_activity_athlete_id            ON athlete_activity(athlete_id);
CREATE INDEX idx_athlete_note_athlete_id                ON athlete_note(athlete_id);
CREATE INDEX idx_athlete_reflection_athlete_id          ON athlete_reflection(athlete_id);
CREATE INDEX idx_workshop_institution_id                ON workshop(institution_id);
CREATE INDEX idx_workshop_attendance_athlete_id         ON workshop_attendance(athlete_id);
CREATE INDEX idx_workshop_followup_workshop_id          ON workshop_followup(workshop_id);
CREATE INDEX idx_exclusion_institution_id               ON exclusion(institution_id);
CREATE INDEX idx_compliance_audit_institution_id        ON compliance_audit(institution_id);
CREATE INDEX idx_cohort_period_snapshot_institution_id  ON cohort_period_snapshot(institution_id);
