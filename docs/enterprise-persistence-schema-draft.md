# Enterprise persistence schema draft — RULED (E1-E12), held for FT sign-off

## 1. Status

Ruled schema draft for the Enterprise persistence layer. FT ruled all 12
open questions from `docs/enterprise-persistence-scoping.md` this
session, with E3 as an OVERRIDE (retention inverted) and E8 as an
AMENDMENT (content convention added). Inherits
`docs/persistence-schema-draft.md` (Individual pilot, rulings A-F) as
its `person` / `auth_user` / retention substrate, and
`docs/advisor-persistence-schema-draft.md` as the immediate structural
precedent (fold-in providers, `demo_gate` role gate, per-request write-
gate helper). Sequence: scope → rule → build; this is the **rule**
artifact.

**SIGNED OFF (FT, open decisions ruled defer-to-team) — migration
authoring unblocked against this ruled shape.** No `src/`,
`functions/`, or `migrations/` change this pass. §11 review table
below records the sign-off row-by-row. Four open decisions were ruled
`RULED (FT, defer-to-team)` — the drafted team recommendations are
thereby adopted as the ruled positions and reflected in §3.3 (DDL),
§4.2 (deletion mechanics), §7 (seed story), and §9 (open items).

HEAD at draft: `efdbf9c` (subsequent sign-off amendments in this
commit).

Cross-references: `docs/enterprise-persistence-scoping.md` (inventory +
E1-E12 rulings + §7 E3 override paragraph); `docs/advisor-persistence-
schema-draft.md` (advisor DDL precedent + gate mechanism);
`docs/persistence-schema-draft.md` (Individual pilot A-F);
`docs/ruling-e-deletion-retention.md` (individual-side deletion posture
at the `person` boundary — enterprise E3 override reads as its sibling).

---

## 2. FT rulings — E1-E12 recorded verbatim, applied downstream

- **E1 — Institution-scoping model:** agree (c). Institution ownership
  routes through `institution_contact`; `is_default_operator` breaks
  ties. Pilot has one institution — the multi-tenancy posture is NOT
  generalized from this ruling. No `owner_operator_person_id` column on
  `institution` itself.
- **E2 — `person.type` for institution staff:** agree (a). Keep `staff`
  (Jordan Avery's seeded type). Role granularity lives on
  `institution_contact.role_title`, NOT on `person.type`. This preserves
  the single-type identity model banked in the sign-out slice and keeps
  `ops` distinct.
- **E3 — Athlete = person or separate:** **OVERRIDE (structure (b),
  retention inverted).** Separate `athlete` table with nullable
  `person_id` linkage per (b) — but the retention posture reverses.
  Athlete data belongs to the athlete. Departure/deletion cascades ALL
  athlete-related data across the institution (contact, activity, staff
  notes, reflections). Institutional residual on the `athlete` row =
  **stub of name, class, sport ONLY** — "almost useless by design."
  Anonymize-to-stub, sibling of the individual-schema ruling E
  anonymize-not-orphan. **COUNSEL-GATED** on unclaimed-row PII posture
  (isolated to `athlete` / `athlete_note` / `athlete_activity` /
  `athlete_reflection` write endpoints via the E11 gate); schema lands
  now.
- **E4 — Advisor cross-role identity:** agree (a). Single `person` row
  for Morgan Walker; she appears in enterprise via
  `institution_contact.person_id`. That reference grants ZERO enterprise
  capability to the referenced person (docblocked). Cross-references are
  unidirectional — enterprise staff sees Morgan's name as facilitator via
  the join; Morgan's session never routes to `/app/enterprise`.
- **E5 — Cohort scope discriminator:** agree (b). Separate
  `cohort_period_snapshot` table. NO scope discriminator column on the
  advisor `cohort` table. The two "cohort" concepts are semantically
  different (working group vs program-year aggregate) and forcing a
  discriminator would leak schema-level ambiguity into every query.
- **E6 — Reflection ownership:** agree (c). Joint-owned with an athlete-
  controlled `visible_to_institution` bit. Per E3 override, deletion
  cascades reflections when the athlete departs. Pre-claim visibility
  gap is covered by program-level consent, named honestly. **COUNSEL-
  GATED** on the consent posture during the pre-claim window.
- **E7 — `compliance_audit` append-only enforcement:** agree (a).
  Endpoint-layer contract only: `POST` allowed; `PUT` and `DELETE`
  return 405. No DB trigger at pilot. Docblock cites the contract;
  verify D1 trigger support at build time and layer DB-level enforcement
  then if cheap.
- **E8 — `connection_detail` sensitivity:** **agree (a) AS AMENDED.**
  Institutional record, docblocked as caution. **Content convention
  (new)**: third parties identified by name + role from PUBLIC record
  only, never relational or private descriptors (e.g. "Board member
  Dana Reeves", **NEVER** "Coach Reeves's spouse"). `connection_detail`
  sits on the never-emit side of the emit allowlist for all athlete-
  facing and cross-surface reads. **COUNSEL-GATED** on legal inclusion
  limits.
- **E9 — Cohort snapshot: persist or derive:** agree (a). Persist
  `cohort_period_snapshot` rows. **NEW HARD INVARIANT from E3 override**:
  snapshots store aggregates ONLY, zero per-athlete identifiable data —
  history must survive athlete deletion without retaining PII. Snapshot
  comparison never renders as ranking (#77 precedent extends to
  consumers).
- **E10 — `athlete.badge` origin:** agree (a). Staff-authored descriptive
  label ONLY. NEVER auto-derived. NEVER a rank. Three-layer enforcement:
  DDL docblock + endpoint field allowlist (staff-only writable free
  text) + seed-copy screen at seed time (verify seeded values read as
  descriptive intent, not evaluative signal).
- **E11 — Enterprise write-gate marker:** agree (b).
  `person.extensions.enterprise.demo_gate=true` on the owning `person`
  row. `requireGatedEnterprise` twin of `requireGatedAdvisor` does the
  same shape against `$.enterprise.demo_gate`. Same PATTERN as the
  advisor gate; distinct NAMESPACE so the two gates can lift
  independently as E3/E6/E8 counsel clears the enterprise posture.
- **E12 — SetupWizard: create-only vs edit:** agree (a). Wizard creates
  once; ongoing edits happen via a Settings surface mirroring
  `PracticeSettings`. Year-rollover is a future NEW wizard, not this
  one reopened for editing.

---

## 3. Tables (RULED shape; DDL for FT sign-off, then migration)

All timestamps are TEXT ISO 8601 unless noted (matching the Individual +
Advisor schemas' `created_at` convention). Foreign keys use the FK
corrections from the scoping doc — every name-string cross-reference
from the fixture (`workshop.facilitator`, `workshops.followUps[].owner`,
`INST_PROFILES.facilitator`, `complianceAuditLog.user`) resolves to
`person_id` FK via `institution_contact` when applicable.

### 3.1 `institution` — the institution row

```sql
CREATE TABLE institution (
  id                       TEXT NOT NULL PRIMARY KEY,             -- opaque UUID
  -- E1: NO owner column on institution itself. Ownership routes through
  -- institution_contact.is_default_operator (see 3.2). Multi-operator
  -- posture accepted at schema level; the pilot has one institution.

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

-- E9/Q9 platform-wide guardrail (repeated in EVERY institution-scoped
-- table): NO rank / score / priority / suggestion / ordering / rating /
-- grade column may EVER be added — even one cached or derived. Any
-- computed institutional ranking stays client-side, never persisted.
-- Parker no-lifecycle-field invariant: NO settlement / processed /
-- refunded / disputed / cleared column may EVER be added.
```

No index needed on `institution` (single-institution pilot; a
`name`-unique constraint could be added later if multi-tenancy opens).

### 3.2 `institution_contact` — institution ↔ person join (E1, E4)

Replaces every fixture name-string cross-reference (`facilitator`,
`user`, `owner`, etc.) with a real FK to `person(id)`. Per E4, this row
grants ZERO enterprise capability to the referenced `person` — it is a
directory-of-record only. Enterprise auth still requires `person.type =
'staff'` at the type guard; the join simply records who is at the
institution and in what role.

```sql
CREATE TABLE institution_contact (
  id                       TEXT NOT NULL PRIMARY KEY,             -- opaque UUID
  institution_id           TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  person_id                TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,

  -- Free-text role label — role granularity per E2. Common values today
  -- from the fixture: 'Senior Director, Athletic Development',
  -- 'Athletic Compliance Officer', 'Facilitator', 'Program Admin'.
  role_title               TEXT NOT NULL,

  -- E1 tie-breaker: if any institution has multiple contacts, exactly
  -- one carries is_default_operator=1. Endpoint layer enforces the
  -- "exactly one" invariant on write; DB-level UNIQUE partial index is
  -- an option at migration time if D1 supports partial indexes.
  is_default_operator      INTEGER NOT NULL DEFAULT 0,

  created_at               TEXT NOT NULL
);

-- E4 hard-comment: NO enterprise capability is granted by presence in
-- this table. RequireType('staff') at the /app/enterprise route + the
-- E11 gate on write endpoints are the authoritative capability seams.
-- Enterprise UI READS this table to render staff names next to workshop
-- facilitator slots and audit-log entries; it does NOT authorize.
```

Indexes (D1 rows-read):
```sql
CREATE INDEX idx_institution_contact_institution_id  ON institution_contact(institution_id);
CREATE INDEX idx_institution_contact_person_id       ON institution_contact(person_id);
```

### 3.3 `athlete` — the program participant record (E3 OVERRIDE)

**Retention inverted per E3 override.** Athlete data belongs to the
athlete. When the athlete departs or is deleted (via `person_id`
cascade if claimed, or via `athlete.id` direct delete if unclaimed),
the cascade removes ALL athlete-related data across the institution:
contact fields, `athlete_activity`, `athlete_note`, `athlete_reflection`.
Institutional residual = **stub of `name`, class (`year`), `sport`
ONLY** — "almost useless by design." Anonymize-to-stub, sibling of the
individual-schema ruling E anonymize-not-orphan.

```sql
CREATE TABLE athlete (
  id                       TEXT NOT NULL PRIMARY KEY,             -- opaque UUID
  institution_id           TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,

  -- E3 linkage: nullable. Populated when the athlete claims an
  -- individual account via magic-link. When populated and the athlete
  -- later deletes their individual account, ruling E person-boundary
  -- deletion clears this column and the endpoint-layer anonymize-to-
  -- stub step runs on the surviving athlete row (see §4.2 for the
  -- exact mechanics).
  -- E3/§4.2 RULED Option B: SET NULL; anonymize-to-stub runs at
  -- endpoint layer.
  person_id                TEXT REFERENCES person(id) ON DELETE SET NULL,

  -- STUB COLUMNS (survive E3 anonymize-to-stub).
  -- These three fields are retained after any athlete-side deletion.
  -- They are "almost useless by design" — enough to sustain a cohort
  -- headcount row and a sport tally, not enough to identify or contact.
  name                     TEXT NOT NULL,                          -- becomes 'redacted' or the pre-deletion first name at anonymize time; ruling-time decision
  year                     TEXT,                                    -- e.g. 'Junior', 'Senior' — class
  sport                    TEXT,

  -- CASCADE-AWAY COLUMNS (removed at E3 anonymize).
  -- Every field below is nulled/emptied at the anonymize step. See §4.
  position                 TEXT,
  email                    TEXT,                                    -- 'cooperstate.edu' at pilot; PII tier 3
  phone                    TEXT,
  notes                    TEXT,                                    -- staff-authored; **NOT** relocated to athlete_note table below because these are the field-level staff observations; note-taking UI writes to athlete_note

  gps_completed_at         TEXT,                                    -- ISO YYYY-MM-DD, nullable
  lessons_count            INTEGER NOT NULL DEFAULT 0,
  gifts_count              INTEGER NOT NULL DEFAULT 0,
  last_active_at           TEXT,                                    -- ISO 8601 or ISO YYYY-MM-DD

  -- E10: staff-authored descriptive label ONLY. NEVER auto-derived.
  -- NEVER a rank. Three-layer enforcement: this docblock + endpoint
  -- allowlist (staff-only writable free text) + seed-copy screen.
  -- Existing fixture values ('The Quiet Builder', 'The Amplifier') are
  -- descriptive-intent examples; if the surface ever surfaces a badge
  -- selector, it must remain a descriptive picker, never a rank
  -- generator.
  badge                    TEXT,

  -- Categorical relationship state, NOT lifecycle. Enum:
  --   'Invited' | 'Active' | 'Stalled' | 'Sunset' | 'Certified'
  -- The 'Certified' terminal state is retention-mirror of the boolean
  -- + cert_date pair on the fixture; certified is a milestone, not a
  -- rank.
  enrollment_status        TEXT NOT NULL,
  certified                INTEGER NOT NULL DEFAULT 0,               -- boolean
  cert_at                  TEXT,                                     -- ISO YYYY-MM-DD when certified=1

  join_date                TEXT,                                     -- ISO YYYY-MM-DD

  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL
);

-- E9/Q9 platform-wide guardrail: NO rank / score / priority /
-- suggestion / ordering / progression / rating / grade column may EVER
-- be added to this table — even one cached or derived. The
-- 'enrollment_status' column is relationship state; NO
-- status_progression / status_score / priority column may EVER be
-- added. The badge column is descriptive label; NO badge_rank /
-- badge_score column may EVER be added.
--
-- Parker no-lifecycle-field invariant: NO settlement / processed /
-- refunded / disputed / cleared column may EVER be added — not even
-- via back-door rename. 'enrollment_status' is relationship state
-- (Invited/Active/Stalled/Sunset/Certified), acceptable.
--
-- E3 UNCLAIMED-ROW POSTURE (COUNSEL-GATED, pending):
-- An unclaimed athlete row (person_id IS NULL) stores real name + email
-- of a non-signing party. The E11 gate on athlete + athlete_* write
-- endpoints (see §6) holds these writes dark on the production side
-- until counsel confirms the unclaimed-row PII posture. Schema lands;
-- gate holds; seam confirms in parallel.
--
-- E3 UNDER-18 ESCALATION FLAG:
-- The pilot cohort is 18+ collegiate. If a future roster includes
-- minors, an additional cascade layer is required — the guardian
-- likely holds deletion authority, and the athlete-boundary cascade
-- here needs a guardian-authorization gate. Flag for a future ruling
-- when a minor-participant program lands.
```

Indexes (D1 rows-read):
```sql
CREATE INDEX idx_athlete_institution_id  ON athlete(institution_id);
CREATE INDEX idx_athlete_person_id       ON athlete(person_id);
```

### 3.4 `athlete_activity` — timeline events (cascades on athlete)

```sql
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

-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle: NO settlement / processed / cleared / status
-- column. This is a display log, NOT a state machine — gift lifecycle
-- (per the individual-schema Parker rule) belongs on the `gift` table,
-- never mirrored here.
--
-- E3 cascade: ON DELETE CASCADE from athlete. All timeline history is
-- removed when the athlete is deleted. The historical cohort snapshot
-- (E9) captures aggregate counts that survive this cascade.
```

Index:
```sql
CREATE INDEX idx_athlete_activity_athlete_id  ON athlete_activity(athlete_id);
```

### 3.5 `athlete_note` — staff-authored notes about individual athletes

Separate table (not JSON column on `athlete`) mirrors the advisor
`client_note` posture: staff notes about identified subjects are a
sensitive slice; a separate table makes row-level access + audit easier
and lets a future per-note access control land without an `athlete`
migration.

```sql
CREATE TABLE athlete_note (
  id                       TEXT NOT NULL PRIMARY KEY,             -- opaque UUID
  athlete_id               TEXT NOT NULL REFERENCES athlete(id) ON DELETE CASCADE,
  author_person_id         TEXT NOT NULL REFERENCES person(id),   -- staff person who wrote the note

  date                     TEXT NOT NULL,                          -- ISO YYYY-MM-DD
  content                  TEXT NOT NULL,                          -- freeform text; PII tier 2

  created_at               TEXT NOT NULL
);

-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle: NO status column. Notes are immutable authored
-- content; editing behavior lives in application logic, not a
-- lifecycle state field.
--
-- E3 cascade: ON DELETE CASCADE from athlete. Staff notes about the
-- athlete are athlete-related data per the E3 override; they do NOT
-- survive the athlete's deletion.
--
-- Author retention: author_person_id has NO ON DELETE cascade upward
-- (deleting the staff person does NOT delete the notes they wrote,
-- because the note's substance is about the athlete, not the author).
-- If the author-person is deleted via ruling E person-boundary
-- cascade, the note becomes author-orphaned — the author_person_id
-- FK stays NULL-able via the SET NULL variant. **Alternative to
-- consider at build time**: keep author_person_id NOT NULL and refuse
-- to delete a staff person while notes remain (endpoint-layer).
-- Flagged for the build slice.
```

Index:
```sql
CREATE INDEX idx_athlete_note_athlete_id  ON athlete_note(athlete_id);
```

### 3.6 `athlete_reflection` — first-person athlete narrative (E6 + E3 cascade)

Highest-sensitivity slice per the scoping doc PII tiers. Athlete-
authored, institution-visible (with the E6 visibility toggle when the
athlete claims an individual account).

```sql
CREATE TABLE athlete_reflection (
  id                        TEXT NOT NULL PRIMARY KEY,            -- opaque UUID
  athlete_id                TEXT NOT NULL REFERENCES athlete(id) ON DELETE CASCADE,

  date                      TEXT NOT NULL,                         -- ISO YYYY-MM-DD
  text                      TEXT NOT NULL,                         -- first-person narrative; PII tier 1

  -- E6 visibility bit. When the athlete has claimed their individual
  -- account (athlete.person_id IS NOT NULL), they can toggle this
  -- per reflection. When unclaimed, the pre-claim posture is set by
  -- program-level consent (see docblock below); the default here is
  -- 1 (visible), but the endpoint enforces the pre-claim gap
  -- honestly.
  visible_to_institution    INTEGER NOT NULL DEFAULT 1,

  created_at                TEXT NOT NULL
);

-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle: NO status column.
--
-- E3 cascade: ON DELETE CASCADE from athlete. Reflections are the most
-- athlete-owned tier of content per the PII scoping; when the athlete
-- departs, reflections go with them. Institutional read caches must
-- respect this by re-fetching from D1 rather than persisting local
-- copies.
--
-- E6 PRE-CLAIM POSTURE (COUNSEL-GATED, pending):
-- Before the athlete claims an individual account (athlete.person_id
-- IS NULL), the visibility toggle is not directly athlete-controllable
-- because there is no signed-in athlete session. The interim posture
-- is program-level consent captured at seed / roster-add time and
-- named honestly on the surface (e.g. "Reflections you record during
-- the program are visible to your athletic department staff. When you
-- claim your StewardHouse account, you gain per-reflection visibility
-- controls."). Counsel-gated on the exact institutional consent
-- language.
```

Index:
```sql
CREATE INDEX idx_athlete_reflection_athlete_id  ON athlete_reflection(athlete_id);
```

### 3.7 `workshop` — cohort session (institution-scoped)

```sql
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

-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle beyond 'status': the status enum here is
-- categorical (scheduled/upcoming/completed), NOT a lifecycle state
-- machine. No settlement / processed / cleared column may EVER be
-- added.
--
-- E3 cascade note: workshops belong to the institution, NOT to the
-- athlete. A workshop persists after any athlete departs; only that
-- athlete's row in workshop_attendance cascades away (see 3.8).
```

Index:
```sql
CREATE INDEX idx_workshop_institution_id  ON workshop(institution_id);
```

### 3.8 `workshop_attendance` — dual-transitive ownership

Composite PK — mirrors the advisor `cohort_member` shape. Ownership is
dual-transitive: through workshop → institution AND through athlete →
institution (both must belong to the same institution for the row to
be valid).

```sql
CREATE TABLE workshop_attendance (
  workshop_id               TEXT NOT NULL REFERENCES workshop(id) ON DELETE CASCADE,
  athlete_id                TEXT NOT NULL REFERENCES athlete(id) ON DELETE CASCADE,
  attended                  INTEGER NOT NULL,                      -- boolean
  note                      TEXT,                                   -- optional per-attendance note

  PRIMARY KEY (workshop_id, athlete_id)
);

-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle: NO status column.
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
```

Index:
```sql
CREATE INDEX idx_workshop_attendance_athlete_id  ON workshop_attendance(athlete_id);
```

### 3.9 `workshop_followup` — follow-up items per workshop

```sql
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

-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle beyond 'status': the status enum is a small
-- state machine on the followup's OWN authoring context (not on the
-- workshop, not on athletes, not on gifts). Acceptable per the
-- advisor practice_lesson.status ('published'|'draft') precedent.
--
-- owner_display fallback captures the fixture's 'Cohort' owner —
-- a group of self-directed athletes, not a single person. When
-- owner_person_id is NULL, owner_display carries the free-text label.
```

Index:
```sql
CREATE INDEX idx_workshop_followup_workshop_id  ON workshop_followup(workshop_id);
```

### 3.10 `exclusion` — institution-scoped org exclusion list (E8 AS AMENDED)

```sql
CREATE TABLE exclusion (
  id                        TEXT NOT NULL PRIMARY KEY,            -- opaque UUID
  institution_id            TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,

  name                      TEXT NOT NULL,                         -- org name; references the shared org catalog by name (no hard FK)
  ein                       TEXT,
  reason                    TEXT NOT NULL,
  flagged_at                TEXT NOT NULL,                         -- ISO YYYY-MM-DD
  connection                TEXT,                                   -- short label

  -- E8 AMENDED: connection_detail carries institutional exclusion
  -- rationale. CONTENT CONVENTION (name + role from PUBLIC record
  -- only, NEVER relational or private descriptors):
  --   OK: 'Board member Dana Reeves'
  --   NOT OK: "Coach Reeves's spouse serves on the board"
  -- This convention is authored-content discipline, not schema
  -- enforcement — the endpoint layer cannot detect a relational
  -- descriptor. Seed-copy screen catches it at seed time; live-copy
  -- review is the exclusion-add authoring path's discipline.
  --
  -- NEVER-EMIT PLACEMENT: connection_detail sits on the never-emit
  -- side of the emit allowlist for all athlete-facing reads
  -- (Discover / GivingModeler / any surface an athlete or cross-
  -- surface consumer touches). Only staff-authenticated reads on
  -- /app/enterprise/compliance emit connection_detail. This is
  -- enforced at the endpoint layer; the schema docblock cites the
  -- policy.
  --
  -- COUNSEL-GATED (pending): legal inclusion limits — whether naming
  -- a third party at all in an institutional exclusion record raises
  -- disclosure obligations independent of the emit allowlist. Isolated
  -- to the exclusion endpoints via the E11 gate.
  connection_detail         TEXT,

  created_at                TEXT NOT NULL,
  updated_at                TEXT NOT NULL
);

-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle: NO settlement / processed / cleared column.
-- The 'flagged_at' column is a timestamp, not a lifecycle state; if
-- an exclusion is later removed, it is DELETED, not marked 'lifted'
-- via a status column.
```

Index:
```sql
CREATE INDEX idx_exclusion_institution_id  ON exclusion(institution_id);
```

### 3.11 `compliance_audit` — append-only audit log (E7)

```sql
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

-- E7 APPEND-ONLY CONTRACT (endpoint layer):
-- The endpoint contract for /api/compliance-audit accepts POST ONLY.
-- PUT and DELETE return 405 Method Not Allowed. UPDATE and DELETE
-- are not part of the endpoint contract.
-- Verify D1 trigger support at migration/build time. If D1 grows
-- INSTEAD OF trigger support (or if we migrate to a shape with
-- CHECK enforcement), a DB-level enforcement layer supplements the
-- endpoint contract. Until then, endpoint enforcement is the
-- authoritative layer.
-- The 'user_role' column is intentionally DENORMALIZED from the
-- live institution_contact.role_title at audit-write time — historical
-- accuracy demands that a role change today does NOT rewrite past
-- audit-log rows.
--
-- E9/Q9 guardrail: NO rank / score / priority column.
-- Parker no-lifecycle beyond append-only: an audit row is immutable;
-- no status column, no update column, no updated_at.
```

Index:
```sql
CREATE INDEX idx_compliance_audit_institution_id  ON compliance_audit(institution_id);
```

### 3.12 `cohort_period_snapshot` — historical aggregates (E5, E9)

Separate from advisor `cohort` per E5 (no scope discriminator). Stores
the frozen program-period rollup for CohortComparison.

```sql
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

-- E3 + E9 HARD INVARIANT (schema-enforced by absence, docblocked here):
-- Snapshots store AGGREGATES ONLY. NO per-athlete identifiable
-- column (no athlete_id, no name, no email) may EVER be added to
-- this table. History must survive athlete deletion (per E3
-- retention inversion) WITHOUT retaining PII. If a future consumer
-- wants per-athlete history for pedagogical review, that lives in
-- a separate table with its own athlete-boundary cascade — this one
-- stays aggregate-only.
--
-- E9/Q9 guardrail: NO rank / score / priority column may EVER be
-- added. Snapshot comparison never renders as ranking (#77 precedent
-- extends to consumers of this table). Comparison is for
-- understanding outputs, NOT ranking cohorts.
--
-- Parker no-lifecycle: NO status column. A snapshot is a snapshot;
-- there is no 'in progress' vs 'final' vs 'archived' state. If a
-- correction is needed, delete the row and re-snapshot.
```

Index:
```sql
CREATE INDEX idx_cohort_period_snapshot_institution_id  ON cohort_period_snapshot(institution_id);
```

---

## 4. Deletion / retention

Enterprise deletion follows the individual-schema ruling E person-
boundary discipline as its substrate, EXTENDED by the E3 override
(athlete-boundary anonymize-to-stub). Two deletion boundaries here:
the institution boundary (E1 cascade) and the athlete boundary (E3
cascade).

### 4.1 Institution-boundary cascade (E1)

Deleting an `institution` row cascades to every institution-scoped
child: `institution_contact`, `athlete` (which then triggers 4.2
per-athlete), `workshop` (which triggers `workshop_attendance` +
`workshop_followup`), `exclusion`, `compliance_audit`,
`cohort_period_snapshot`. This is a full institutional withdrawal;
no institutional PII survives.

Institution `person`-row ownership does NOT exist on this schema
(per E1 — no `owner_operator_person_id` column). The default operator
lives on `institution_contact.is_default_operator`. Deleting the
default operator's `person` row via ruling E person-boundary cascade
does NOT delete the institution; the `institution_contact` row is
removed, but the institution persists and the endpoint-layer
"exactly one default operator" invariant is temporarily violated
until another contact is promoted. Endpoint layer must handle this
transient state gracefully (e.g. the enterprise dispatcher shows a
"contact platform admin" placeholder when the institution has zero
`is_default_operator`).

### 4.2 Athlete-boundary cascade (E3 OVERRIDE)

Deleting an `athlete` row cascades to `athlete_activity`,
`athlete_note`, `athlete_reflection`, `workshop_attendance` for that
athlete — every athlete-related row across the institution. This is
the E3 retention inversion.

The `athlete` row itself does NOT vanish. It becomes the STUB:
`name`, `year`, `sport` retained; every other column nulled/emptied
at anonymize time. Anonymize-to-stub mechanics:

1. `email`, `phone`, `notes`, `position` → NULL.
2. `gps_completed_at`, `lessons_count`, `gifts_count`, `last_active_at`
   → NULL / 0.
3. `badge` → NULL.
4. `enrollment_status` → `'Sunset'` (departure marker).
5. `certified` → 0; `cert_at` → NULL.
6. `join_date` → NULL.
7. `person_id` → NULL (the E3 override treats the person linkage as
   athlete-boundary data too).
8. `name` retention posture: **RULED (FT, defer-to-team) — name →
   `'redacted'` at anonymize time.** Full anonymization; class + sport
   carry the cohort-tally value without the identity. The scoping-doc
   §11 "stub of name, class, sport ONLY" phrasing is satisfied by the
   literal string `'redacted'` occupying the `name` column — the row
   still carries three retained values (name / year / sport), the
   name value just no longer identifies.

`athlete_id` on downstream cascaded tables is nulled/deleted per each
table's `ON DELETE CASCADE`. The stub row's `id` (PK) stays stable so
foreign keys from `cohort_period_snapshot` aggregates (which count
this athlete at snapshot time) don't break — but cohort_period_snapshot
has NO `athlete_id` FK by E9's aggregates-only invariant, so this is
moot.

**Institutional withdrawal from the platform-wide deletion cascade**:
if the individual-side `person` row for a claimed athlete is deleted
via ruling E cascade, the E3 override says the enterprise-side
athlete row anonymizes-to-stub. Two options were considered:

- **Option A — REJECTED**: `person_id ON DELETE CASCADE` — the
  athlete row itself vanishes when the linked person is deleted.
  Rejected because it would delete the institutional cohort-tally
  stub the E3 override retains, and would require a separate
  anonymize step BEFORE the cascade to preserve the stub — an
  extra endpoint pre-delete hook that adds a coupling seam.
- **Option B — RULED (FT, defer-to-team)**: `person_id ON DELETE
  SET NULL` — the linkage clears but the athlete row survives;
  anonymize-to-stub runs as the athlete-side DELETE endpoint's
  action. Matches the ruling E anonymize-not-orphan precedent
  shape. §3.3 DDL is updated to `ON DELETE SET NULL` accordingly.

### 4.3 Counsel-gated seams (isolated per Q7/ruling-E precedent)

Three seams stay isolated until counsel confirms:

- **E3 unclaimed-row PII posture** — the E11 gate on `athlete` /
  `athlete_note` / `athlete_activity` / `athlete_reflection` write
  endpoints holds real-athlete writes DARK on production until counsel
  clears whether an unclaimed athlete row (real name + email of a
  non-signing party) is "personal data" under the applicable regimes.
  Same isolation shape as the advisor Q7 gate on `client` writes.
- **E6 pre-claim reflection consent** — the endpoint-layer program-
  level consent language ships as caution copy at seed / roster-add
  time. Counsel confirms the exact language before real athletes are
  onboarded.
- **E8 connection_detail legal inclusion limits** — the content
  convention (name + role from public record only) ships in docblock
  and seed-copy screening; counsel confirms whether naming any third
  party inside institutional exclusion records raises disclosure
  obligations independent of the emit allowlist.

Schema lands; gate holds; seams confirm in parallel with build. Per the
advisor Q7 precedent, this pattern isolates cleanly to specific write
endpoints without blocking the rest of the enterprise arc.

---

## 5. Parker invariants — hard-commented in ALL DDL above

Two invariant families, both stated inline in every table's DDL, plus
one net-new E3-cascade-related invariant on the snapshot table:

### 5.1 E9/Q9 — No rank/score/priority/suggestion/ordering columns

Applies to ALL 12 enterprise tables. This is a re-articulation of the
platform-wide Q9 guardrail on the enterprise side. Enterprise UX may
compute rankings, priority orderings, or suggested-next affordances
CLIENT-SIDE — those stay derivations, never persisted. Any future
proposal to add a column matching this pattern requires re-opening
E9/Q9 as a founder-path decision. The scoping-doc §7 note "#77
precedent" is authoritative: cohort comparison outputs, not rankings.

### 5.2 Parker no-lifecycle-field rule

Applies to ALL 12 enterprise tables. No settlement / processed /
refunded / disputed / cleared / reversed column may EVER be added,
not even via back-door rename. Acceptable near-neighbors, explicitly
NOT lifecycle:

- `workshop.status: 'scheduled' | 'upcoming' | 'completed'` — workshop
  authoring state. Acceptable, hard-commented.
- `workshop_followup.status: 'pending' | 'in_progress' | 'completed'` —
  followup authoring state (small state machine on the followup's own
  context). Acceptable per the advisor `practice_lesson.status`
  precedent.
- `athlete.enrollment_status: 'Invited' | 'Active' | 'Stalled' |
  'Sunset' | 'Certified'` — relationship state. Acceptable.

Every table's DDL comment names this discipline explicitly to prevent
drift under future feature pressure.

### 5.3 E3/E9 — Aggregates-only invariant on `cohort_period_snapshot`

Net-new to the enterprise schema. `cohort_period_snapshot` stores
AGGREGATES ONLY. NO per-athlete identifiable column (no `athlete_id`,
no `name`, no `email`) may EVER be added to this table. History must
survive athlete deletion (per E3 retention inversion) WITHOUT
retaining PII. This is the schema-level enforcement of the E9 hard
invariant recorded in the scoping doc §11.

---

## 6. The E11 gate — tables built now, real athlete data waits

**Middle-path resolution mirroring the advisor Q4/Q7 gate.**

- **Migration authoring**: all 12 tables above ship in the enterprise
  persistence migration when it lands. Schema is ready for real
  athlete data.
- **Write endpoints for `athlete` / `athlete_activity` / `athlete_note`
  / `athlete_reflection`**: build, ship, and gate — write paths land
  in code but reject real-people input pending counsel confirmation of
  E3/E6/E8. **Gate mechanism**: `requireGatedEnterprise` twin of
  `requireGatedAdvisor`, per-request check against the owning
  `person` row's `extensions.enterprise.demo_gate=true` marker.
  Writes accepted only for designated demo/staff person rows.
- **Read endpoints for `athlete` / `athlete_*`**: land at the same
  time; reading FROM a table with only seed rows is fine. Reading
  real-athlete rows is inert until writes are enabled.
- **`institution` / `institution_contact` / `workshop` /
  `workshop_attendance` / `workshop_followup` / `exclusion` /
  `compliance_audit` / `cohort_period_snapshot`**: gated behind the
  same `requireGatedEnterprise` helper as a **uniform posture** (per
  the advisor arc's write-slice-1 amendment that broadened the gate
  across all advisor write endpoints). Rationale: single-institution
  pilot; production enterprise writes are dark until a `person` row is
  designated. Revisit alongside the per-institution allowlist upgrade
  when E3/E6/E8 counsel clears the athletic-institutional PII posture.
- **`connection_detail` never-emit placement** (per E8 amended
  content convention): all athlete-facing reads and cross-surface
  reads MUST omit `exclusion.connection_detail` from their response
  shapes. Only staff-authenticated reads on the compliance surface
  emit it. Emit allowlist enforced at the endpoint layer, docblocked
  on the endpoint file.

**Parallel to advisor Q7 + ruling E precedent**: the counsel-gated
seams (E3/E6/E8) isolate cleanly to specific enterprise write paths
without blocking the schema migration or the ungated wire-surfaces
work. Same pattern; different counsel questions.

---

## 7. Seed story

**DRAFT ONLY — pending FT scope ruling on persona reconciliation.**

The enterprise seed sits atop the Individual pilot seed (migration
0002: 17 orgs + Marcus + 3 gifts), the demo-roster migration (0005:
Jordan Avery `type='staff'`, Morgan Walker `type='advisor'`, Reese
Donovan `type='ops'` — all pending), and the advisor persistence seed
(0008: Morgan's practice profile + practice-authored content).

The scoping doc §4 (persona / seed drift) surfaces the reconciliation
question between the fixture's `CURRENT_USER = Diane Okonkwo` and the
0005-seeded `Jordan Avery`. Three options presented for FT to rule at
seed time:

- **Option A — Promote Diane, retire Jordan.** Insert Diane as a
  `type='staff'` person in the enterprise seed migration; delete the
  Jordan Avery row from 0005 or leave it as a residual pending demo-
  roster entry. Diane becomes the reference enterprise operator.
  Simpler seeded persona map at Cooper State.

- **Option B — Rename Jordan → Diane in 0005.** Rewrite the demo-
  roster row in place. Simpler still, but leaves the migration
  history less honest (a demo-roster seed rewritten by a subsequent
  slice for enterprise-specific reasons).

- **Option C — Keep both, add Diane fresh (recommended in scoping
  §4.2).** Diane joins as a new pilot `person` row (mirroring how
  Morgan Walker landed for the advisor arc); Jordan stays as a
  residual demo-roster entry. Two `type='staff'` people at Cooper
  State — Diane the operator, Jordan a lower-tier staff member.
  Preserves migration history and demonstrates the multi-contact
  institution model.

Under Option C (recommended, pending FT), the seed migration inserts:

- **1 `institution` row** — Cooper State University Athletic
  Department; contract label + tier + endowment amounts from
  `INST_PROFILES` fixture.
- **1 fresh `person` row** for **Diane Okonkwo** — `type='staff'`,
  `source_surface='enterprise'`, `invite_email` for the eventual
  claim path.
- **4 `institution_contact` rows**:
    - Diane → `role_title='Senior Director, Athletic Development'`,
      `is_default_operator=1`
    - Jordan (existing 0005 person) →
      `role_title='Program Admin'`, `is_default_operator=0`
    - Sarah Mitchell (fresh person) → `role_title='Athletic
      Compliance Officer'`, `is_default_operator=0`
    - Morgan Walker (existing 0005 advisor person) →
      `role_title='Facilitator'`, `is_default_operator=0` (per E4:
      references her advisor person row; grants zero enterprise
      capability)
- **Athletes: seed strategy TBD by FT** at the same ruling as the
  Diane/Jordan reconciliation. Options mirror the advisor 0008 slim-
  scope decision:
    - **Slim scope**: NO athlete rows in seed. Athletes enter D1
      exclusively through the gated write endpoints when the wire-
      surfaces slice lands. Fixture `athletes` (16 rows) continues to
      power the public `/enterprise/*` demo mount unchanged. Preserves
      the E11 gate as the sole athlete-write path — real-integration
      test surface. Matches the advisor 0008 slim-scope rationale.
    - **Full seed**: Seed all 16 fictional athletes + their activity /
      reflections / notes as `athlete` + `athlete_*` rows under
      Cooper State. Demonstrates the persistence shape at seed time
      but creates two fixture-to-D1 authorities for the same demo
      state.

- **Workshops**: if athletes are seeded, workshops seed the 5 fixture
  workshops (2 completed + 3 upcoming) with `facilitator_person_id →
  Morgan Walker's person_id` per E4; `workshop_attendance` seeds the
  attendance matrix from `workshops[].attendance[]`; `workshop_followup`
  seeds ~20 followup rows with `owner_person_id → Diane / Sarah /
  Morgan` per name-to-person resolution.
- **Exclusions**: 6 exclusion rows from the fixture, with
  `connection_detail` COPY-SCREENED at seed time to enforce the E8
  content convention (rewrite "Coach Reeves's spouse" → "Board member
  Dana Reeves" or equivalent public-record framing). This copy screen
  is a required seed-slice step.
- **Compliance audit**: 5 audit-log rows from the fixture with
  `user_person_id` resolved to Diane / Sarah where those names appear.
- **Cohort period snapshots**: 2 snapshot rows — `2024-2025` (from
  `priorCohortSnapshot`) + `2025-2026` (from `currentCohortSnapshot`).
  Both are aggregate-only per E9 invariant.

**Display-string normalization at seed time** (per the advisor 0008
FIX 3 precedent):

- Fixture dates in mixed display formats normalize to ISO 8601 at
  seed insert.
- Fixture ids (numeric `1`, `2`, `'audit-001'`, etc.) normalize to
  opaque UUIDs; original ids can be preserved in application logic
  if needed but not as PK identity.

---

## 8. Indexing note (schema-first discipline, D1 rows-read)

Every FK backing a "my X" read has an index at migration time.
Consolidated list from §3:

- `idx_institution_contact_institution_id` — institution's "my staff" read.
- `idx_institution_contact_person_id` — reverse: "which institutions
  does this staff person belong to" (for the cross-role case).
- `idx_athlete_institution_id` — institution's "my roster" read.
- `idx_athlete_person_id` — reverse: "the individual account behind
  this athlete row" (nullable per E3).
- `idx_athlete_activity_athlete_id` — athlete's timeline read.
- `idx_athlete_note_athlete_id` — athlete's notes read.
- `idx_athlete_reflection_athlete_id` — athlete's reflections read.
- `idx_workshop_institution_id` — institution's workshop calendar.
- `idx_workshop_attendance_athlete_id` — reverse "which workshops did
  this athlete attend" (composite PK covers the forward direction).
- `idx_workshop_followup_workshop_id` — workshop's followup list.
- `idx_exclusion_institution_id` — institution's exclusion list.
- `idx_compliance_audit_institution_id` — institution's audit log.
- `idx_cohort_period_snapshot_institution_id` — institution's snapshot
  history.

Every "my X" FK is indexed from migration 1. D1 bills rows-read;
unindexed full-table scans are surprise bills, not optimizations.
Matches the advisor + individual schemas' discipline.

---

## 9. Open items (small — flag, don't decide)

The 12 rulings resolve the design surface. A handful of narrow items
remain — flagged here for the build slice or a future micro-ruling
rather than reopened:

- **`athlete.name` anonymize retention posture**: full-name-retained
  vs first-name-only vs `'redacted'` string. §4.2 recommends
  `'redacted'`; final ruling at build time by FT.
- **`athlete.person_id` FK cascade direction**: `ON DELETE CASCADE`
  vs `ON DELETE SET NULL`. §4.2 recommends `SET NULL` + endpoint-
  layer anonymize step. Final ruling at build time.
- **`athlete_note.author_person_id` staff-deletion posture**:
  `NULL`-able for author-orphan vs endpoint-refuse-delete when notes
  exist. §3.5 flags both options. Final ruling at build time.
- **`workshop_followup.owner_display` free-text**: the fixture's
  `'Cohort'` owner-value carries `owner_person_id NULL` and
  `owner_display='Cohort'`. If a workshop followup's owner is a
  future group other than the cohort, the free-text field carries
  it; no discriminator column drafted. Flag if a real facilitator
  needs multiple non-person owner labels.
- **Institution single-owner UNIQUE partial index**: D1's SQLite
  version may or may not support partial UNIQUE indexes at pilot.
  §3.2 endpoint-enforces the "exactly one default operator"
  invariant. Verify D1 partial-index support at migration time and
  add the DB-level UNIQUE if cheap.
- **`connection_detail` seed copy-screen automation**: §7 requires a
  seed-time copy screen for E8 content convention. Manual review at
  seed insert is the pilot posture; if a future institution has
  hundreds of exclusion rows, a copy-lint step becomes worthwhile.
- **Athlete-side individual-account claim path**: linkage happens via
  `athlete.person_id` write when the athlete magic-link-signs-in
  against their email. The exact claim mechanics (email match to
  `athlete.email`, staff pre-invite, etc.) are for a later slice —
  athlete-side individual arc, out of scope here.

---

## 10. Next

**HELD.** Schema draft awaits FT sign-off. On sign-off:

- Migration slice: single migration file creating all 12 tables + all
  13 indexes in one atomic apply. Local-then-remote per CLAUDE.md
  §6.10.
- Seed sub-slice: FT rules Diane vs Jordan reconciliation (Option A/B/C)
  and athlete slim-scope-vs-full-seed at the same ruling. Then the seed
  migration lands.
- `requireGatedEnterprise` helper: added to `functions/_lib/gate.js`
  as a twin of `requireGatedAdvisor` against
  `$.enterprise.demo_gate`.
- Write-endpoint gate mechanism: identical shape to the advisor gate;
  broadened to cover all 12 enterprise write endpoints per the write-
  slice-1 amendment precedent.
- Wire-surfaces slice: auth ↔ providers bridge, per-entity endpoints,
  Chrome identity swap for enterprise. Mirrors the advisor wire-
  surfaces arc.
- Dispatcher branch: `AppDispatcher.jsx` `type='staff'` → `/app/
  enterprise` route landing; `RequireType type="staff"` guard on
  `/app/enterprise` (per E2 ruling).

Three counsel-gated seams remain isolated and do NOT block the schema
migration or the ungated wire-surfaces work: E3 (unclaimed-row PII
posture), E6 (pre-claim reflection consent), E8 (connection_detail
legal inclusion limits). Same isolation shape as the advisor Q7 +
individual-schema ruling E precedents.

---

## 11. FT schema review — SIGNED OFF

FT ruled DEFER-TO-TEAM on the four open decisions; the drafted team
recommendations are thereby adopted as the ruled positions. Migration
authoring is unblocked against the shape below.

| Item | FT sign-off | Notes |
|---|---|---|
| §3 DDL sketches (12 tables) | SIGNED OFF | with the §4.2 FK amendment below |
| §4.2 athlete-boundary cascade (E3 override mechanics) | SIGNED OFF | E3 override mechanics as drafted |
| §4.2 name-retention posture (full / first-only / redacted) | RULED (FT, defer-to-team) — `'redacted'` | full anonymization; class + sport carry cohort-tally value without identity |
| §4.2 person_id FK direction (CASCADE vs SET NULL) | RULED (FT, defer-to-team) — Option B, `ON DELETE SET NULL` | anonymize-to-stub runs at endpoint layer on athlete-side delete; matches ruling E anonymize-not-orphan shape |
| §5 Parker invariants coverage | SIGNED OFF | |
| §6 gate posture (uniform across all 12 write endpoints) | SIGNED OFF | uniform `$.enterprise.demo_gate` across all write endpoints |
| §7 Diane / Jordan reconciliation (Option A / B / C) | RULED (FT, defer-to-team) — Option C | Diane added fresh as operator, Jordan stays residual staff; demonstrates E1 multi-contact model with real seed data |
| §7 athlete seed strategy (slim scope vs full seed) | RULED (FT) — ONBOARDING (slim) | zero athlete rows in seed; real athletes enter D1 exclusively through the gated roster-add write path, exercising the E11 gate + E8 content convention + E6 consent copy as designed; fixture athletes stay in fixture files powering the public demo; highest-PII-tier content never enters D1 as fictional filler (advisor slim-seed precedent) |
| §8 index list | SIGNED OFF | 4 unindexed person-side reverse FKs accepted — no "my X" read at pilot; flag if any becomes a required read |
| §9 open-items dispositions | SIGNED OFF | Sunset-on-anonymize accepted (FT, defer-to-team): `enrollment_status` is NOT NULL and `'Sunset'` carries no personal signal; noted as the one stub datum beyond name/class/sport |

Any FT amendment lands as an inline edit here with a **FT AMENDMENT**
marker; substantive shape changes reopen the relevant ruling (E1-E12)
rather than being applied silently.
