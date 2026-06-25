-- Migration 0001 — initial schema for stewardhouse-pilot D1.
--
-- Spec source: docs/persistence-schema-draft.md (FULLY FINALIZED; ruling E
-- resolved). Five tables (auth_user, person, gift, scenario, org) per §3
-- with FK relationships per §3 and indexing-from-migration-1 per §6.
--
-- Counsel-gated seams isolated and deliberately NOT built in this
-- migration (Clause 3 charitable-floor; Clause 5 deletion ledger; Clause 6
-- subpoena posture / who-gave-to-whom view). See sections marked
-- "COUNSEL-GATED — UNBUILT" below for the explicit list.
--
-- Conventions:
--   - Snake_case column names throughout. Auth tables also use snake_case;
--     the auth slice (separate, later) configures better-auth `fields` and
--     model maps so it binds to these names without migration rework.
--   - Auth-table timestamps: INTEGER (epoch ms) — matches better-auth's
--     D1 default behavior, no extra date-serialization config needed.
--   - Non-auth timestamps: TEXT ISO 8601 — matches the schema draft and
--     the rest of the codebase's fixture convention.
--   - Booleans: INTEGER 0/1 (SQLite has no native BOOLEAN type).
--   - JSON-typed columns: TEXT (D1/SQLite has no native JSON type; the
--     JSON1 extension reads TEXT columns).
--   - Foreign keys: ON DELETE CASCADE where ruling E requires the
--     person-boundary cascade; ON DELETE SET NULL where the FK is
--     by-design-nullable.
--   - Table creation order respects FK dependencies: auth_user →
--     session/account/verification → org → person → gift/scenario.

-- =============================================================================
-- AUTH (better-auth-owned). Mirrors the canonical better-auth shape in
-- snake_case. The `name` and `image` columns are intentionally OMITTED:
-- magic-link signup does not require either at account creation, and
-- display identity lives on `person.display_name` per ruling B
-- (person-is-identity). The auth slice configures better-auth's `user`
-- model fields map to bind to these column names and to mark name/image
-- as not-required.
--
-- ONLY place email lives in the data model (besides CF Email send logs)
-- per the strand-3 L1 constraint.
-- =============================================================================

CREATE TABLE auth_user (
  id              TEXT    PRIMARY KEY NOT NULL,
  email           TEXT    NOT NULL UNIQUE,
  email_verified  INTEGER NOT NULL DEFAULT 0,  -- boolean
  created_at      INTEGER NOT NULL,            -- epoch ms
  updated_at      INTEGER NOT NULL             -- epoch ms
);

CREATE TABLE session (
  id          TEXT    PRIMARY KEY NOT NULL,
  user_id     TEXT    NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  token       TEXT    NOT NULL UNIQUE,         -- session-check read pivots on this
  expires_at  INTEGER NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE account (
  id                       TEXT    PRIMARY KEY NOT NULL,
  user_id                  TEXT    NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  account_id               TEXT    NOT NULL,
  provider_id              TEXT    NOT NULL,
  access_token             TEXT,
  refresh_token            TEXT,
  id_token                 TEXT,
  access_token_expires_at  INTEGER,
  refresh_token_expires_at INTEGER,
  scope                    TEXT,
  password                 TEXT,
  created_at               INTEGER NOT NULL,
  updated_at               INTEGER NOT NULL
);

CREATE TABLE verification (
  id          TEXT    PRIMARY KEY NOT NULL,
  identifier  TEXT    NOT NULL,
  value       TEXT    NOT NULL,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- =============================================================================
-- ORG (ruling D — D1 table, durable ids from the 17-catalog).
--
-- id format: 'org-1'..'org-17' for the 17 seed orgs, matching what
-- Discover already reads from unified.orgs post-rewire (commit 6676b80).
-- causes / is_excluded_by_institution_ids / extensions are JSON in TEXT.
-- =============================================================================

CREATE TABLE org (
  id                              TEXT NOT NULL PRIMARY KEY,
  name                            TEXT NOT NULL,
  ein                             TEXT,
  mission                         TEXT,
  causes                          TEXT NOT NULL DEFAULT '[]',  -- JSON string array
  geo                             TEXT,
  cat                             TEXT,                         -- 'community'|'established'|'emerging'|NULL
  is_excluded_by_institution_ids  TEXT NOT NULL DEFAULT '[]',   -- JSON id array
  source_surface                  TEXT NOT NULL,                -- 'individual'|'advisor'|'enterprise'|'synthetic'
  extensions                      TEXT                          -- JSON; per-source nesting
);

-- =============================================================================
-- PERSON (ruling B — person IS the identity; auth_user_id NULLABLE for
-- seed/demo rows with no account).
--
-- soft_deleted_at + deletion_state support ruling E's two-phase soft-then-
-- hard deletion at the person boundary (cascades to gift/scenario via
-- ON DELETE CASCADE below). The hard-delete interval literal is
-- COUNSEL-GATED (Clause 3 — charitable-retention-floor) and is NOT baked
-- into schema or migration. The cron cadence / threshold value lives in
-- application config once counsel confirms.
--
-- Parker invariant note: per-Gift status column NEVER added — deletion is
-- a person-boundary cascade, not a per-Gift lifecycle marker.
-- =============================================================================

CREATE TABLE person (
  id               TEXT NOT NULL PRIMARY KEY,                          -- opaque; not name/email-derived
  auth_user_id     TEXT REFERENCES auth_user(id) ON DELETE SET NULL,   -- NULLABLE: seed/demo persons have no account
  display_name     TEXT NOT NULL,
  initials         TEXT,
  type             TEXT NOT NULL,                                       -- 'individual'|'staff'|'advisor'|'ops'
  source_surface   TEXT NOT NULL,                                       -- 'individual'|'advisor'|'enterprise'|'synthetic'
  extensions       TEXT,                                                -- JSON; per-source nesting
  soft_deleted_at  TEXT,                                                -- ISO 8601; NULL = active
  deletion_state   TEXT                                                 -- NULL|'soft'|'hard-pending'; hard interval = Clause 3 counsel-gated
);

-- =============================================================================
-- GIFT
--
-- Parker invariant (CODE-ENFORCED HERE; never relax this rule):
--   exported_to_cpa is the ONLY lifecycle-adjacent column on gift. NO
--   status / settlement / payment-lifecycle / transfer-state / processed
--   / cleared / refunded / reversed / disputed column may EVER be added
--   to this table — not even via back-door rename. A donor-DECLARED record
--   stays a donor-DECLARED record.
--
-- recipient_org_id is NULLABLE BY DESIGN: write-ins and enterprise gifts
-- have no FK target. recipient_org_name is the always-present display
-- fallback. A delete of the referenced org sets the FK to NULL but does
-- NOT remove the gift (the gift survives the org-table state change with
-- recipient_org_name intact).
--
-- ON DELETE CASCADE from person (ruling E): hard-deletion of a person
-- removes their gifts; soft-delete does not.
-- =============================================================================

CREATE TABLE gift (
  id                  TEXT    NOT NULL PRIMARY KEY,
  giver_person_id     TEXT    NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  recipient_org_id    TEXT             REFERENCES org(id)    ON DELETE SET NULL,
  recipient_org_name  TEXT    NOT NULL,
  amount              INTEGER NOT NULL,              -- whole dollars (matches current fixture convention)
  date                TEXT    NOT NULL,              -- ISO 8601 'YYYY-MM-DD'
  type                TEXT,                          -- 'unrestricted' etc.
  vehicle             TEXT,                          -- 'personal'|'daf' etc.
  recurring           INTEGER NOT NULL DEFAULT 0,    -- boolean
  notes               TEXT,
  source_surface      TEXT    NOT NULL,
  exported_to_cpa     INTEGER NOT NULL DEFAULT 0     -- boolean; Parker's ONLY lifecycle-adjacent field
);

-- =============================================================================
-- SCENARIO
--
-- Parker Modeler guardrail (CODE-ENFORCED HERE; never relax this rule):
--   NO rank / score / suggestion / recommendation / priority / ordering
--   column may EVER be added to this table — even one cached or derived.
--   The Modeler is a structural canvas the donor builds, never a
--   recommender / optimizer / rank engine.
--
-- inputs holds the 6 modeler knobs as JSON in TEXT:
--   { annual, years, growth, grantPct, careerOn, careerRate }
-- derived_at_snapshot is the cached structural output:
--   { finalFund, totalIn, totalOut }
-- created_at is the version axis (lightly-versioned per 5.8 ruling).
-- =============================================================================

CREATE TABLE scenario (
  id                   TEXT NOT NULL PRIMARY KEY,
  owner_person_id      TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  label                TEXT NOT NULL,
  created_at           TEXT NOT NULL,                -- ISO 8601 (the version axis)
  inputs               TEXT NOT NULL,                -- JSON {annual,years,growth,grantPct,careerOn,careerRate}
  derived_at_snapshot  TEXT                          -- JSON {finalFund,totalIn,totalOut}; nullable cache
);

-- =============================================================================
-- INDEXES — every "my X" FK from migration 1.
--
-- D1 bills rows-read; unindexed full-table scans are surprise bills, not
-- optimizations. These are table-stakes, present from row one.
-- =============================================================================

CREATE INDEX idx_gift_giver_person_id     ON gift(giver_person_id);
CREATE INDEX idx_gift_recipient_org_id    ON gift(recipient_org_id);
CREATE INDEX idx_scenario_owner_person_id ON scenario(owner_person_id);
CREATE INDEX idx_person_auth_user_id      ON person(auth_user_id);
CREATE INDEX idx_session_user_id          ON session(user_id);
-- session.token is the session-check pivot. The UNIQUE constraint already
-- implicitly indexes it (sqlite_autoindex_session_*); the explicit index
-- below makes the intent legible and matches §6 "session-check read also
-- needs its index" from the schema draft.
CREATE INDEX idx_session_token            ON session(token);
CREATE INDEX idx_account_user_id          ON account(user_id);
CREATE INDEX idx_verification_identifier  ON verification(identifier);

-- =============================================================================
-- COUNSEL-GATED — UNBUILT (deliberate, recorded for traceability)
-- =============================================================================
--
-- Clause 3 — charitable-retention-floor (UNBUILT in schema):
--   This migration provides the soft-delete columns on `person`
--   (soft_deleted_at + deletion_state) without any hard-delete interval
--   literal. The retention duration / cron cadence is COUNSEL-GATED and
--   lives in application config once Derek (or alternate counsel) confirms.
--   Do NOT bake a literal interval into schema in any future migration
--   until that confirmation lands.
--
-- Clause 5 — deletion ledger (NOT CREATED in this migration):
--   The opaque-marker-keyed deletion ledger table required by ruling E
--   clause 5 is NOT created here. A later migration adds it and wires the
--   hard-delete cascade to write through it.
--
-- Clause 6 — subpoena posture / who-gave-to-whom view (NOT CREATED):
--   NO view, materialized table, or admin query path joining
--   gift.giver_person_id through person.auth_user_id is built. The
--   chokepoint stays inside application code, gated. This migration
--   deliberately does NOT create:
--     - any view named gift_with_giver_email / gift_admin / similar
--     - any join projection joining person → auth_user for operator surfaces
--     - any indexed lookup path returning giver identity alongside gift records
--   The subpoena posture decision must precede any such construct.
