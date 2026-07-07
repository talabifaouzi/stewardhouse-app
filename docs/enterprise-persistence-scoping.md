# Enterprise persistence scoping pass — data-isolation design inventory

## 1. Purpose & status

Read-only investigation opening the Enterprise persistence arc, following
the completion of the Advisor arc (through `597cbd6` — 2b-ii-b sessions,
notes, membership). No `src/`, `functions/`, or `migrations/` changes in
this pass. Output is THIS doc.

**Status**: rulings CLOSED (E3 overridden, E8 amended). FT ruled on E1–E12
per §11; three counsel-gated seams (E3, E6, E8) marked `pending` and
isolated at the endpoint gate. NEXT deliverable = the schema draft at
`docs/enterprise-persistence-schema-draft.md`, mirroring the shape of
`docs/advisor-persistence-schema-draft.md` and written against the rulings
below.

HEAD at pass open: `597cbd6`. Inherits the persistence precedents banked
during the Individual and Advisor arcs: gift writes/reads, intake
persistence, advisor schema rulings A-F, the fold-in provider write-
through pattern, the `demo_gate` role gate on `person.extensions`, and
the RULED-permanent single-type identity model (one `auth_user` → one
`person` → exactly one `type`; enterprise test identities via
plus-addressing).

**Framing shift from the Advisor pass**: Advisor persistence introduced
third-party PII (data about real people — advisor clients — who are NOT
the advisor account holder). Enterprise persistence goes one step
further: institutional PII about program participants (student-athletes)
displayed to institution staff (multiple third parties viewing data about
another third party). Section 6 leads with the layered-consent
implications.

---

## 2. Surface + entity inventory (from Scoping Pass 1)

### 2.1 Routes (`src/surfaces/enterprise/EnterpriseSurface.jsx:82-88`)

Six tabs under the `/enterprise` root:

| Route | Component |
|---|---|
| `` (index) | `EnterpriseOverview` |
| `roster` | `EnterpriseRoster` |
| `reports/*` | `EnterpriseReports` (nested: `ProgramSummary`, `CohortComparison`, `PhilanthropicReadiness`, `ProgramOutputs`, `Endowment`) |
| `compliance` | `EnterpriseCompliance` |
| `program` | `EnterpriseProgram` |
| `setup` | `EnterpriseSetup` → `setup/SetupWizard.jsx` |

No authenticated tree today — `/app/enterprise` route does not exist;
`AppDispatcher` falls through to the "surface not built yet" placeholder
for `type='staff'` sessions. The Advisor arc's routing pattern is the
reference (`RequireType` guard on `/app/enterprise`).

### 2.2 Fixture inventory (`src/data/enterpriseFixtures.js`, 817 lines)

| Export | Count | Shape |
|---|---|---|
| `INST_PROFILES` | 1 | `{id, sector, name, dept, contract, facilitator, tier, annual, endowment}` |
| `athletes` | 16 | `{id, name, sport, year, position, gpsCompleted, gpsDate, lessons, gifts, lastActive, status, joinDate, badge, certified, certDate, email, phone, notes, activity[]}` |
| `athletes[].activity` | ~33 total | `{date, type, label}` per event |
| `workshops` | 5 | `{id, date, title, status, attendees, notes, facilitator, module, summary, attendance[], followUps[]}` |
| `workshops[].attendance` | ~16 per workshop | `{athleteId, attended, note}` |
| `workshops[].followUps` | ~4 per workshop | `{id, owner, ownerRole, action, target, status, completedDate|dueDate}` |
| `engagementWeekDates` | 12 | ISO date strings |
| `engagedAthletesByWeek` | 12 | 12-week matrix of athlete ids present per week |
| `engagementTimeline` | derived | Weekly percentage from `engagedAthletesByWeek` |
| `exclusions` | 6 | `{id, name, ein, reason, flagged, connection, connectionDetail}` |
| `contacts` | 5 | `{id, name, title, organization, email, phone, ...}` |
| `endowmentSnapshot` | 1 | `{currentValue, contributionsToDate, growthToDate, asOfDate, annualContribution, programTerm}` |
| `priorCohortSnapshot` / `currentCohortSnapshot` | 1 each | Aggregate rollups per program period |
| `dailyBriefItems` | 1 | Bundled `{attention[], priorities[], recentActivity[], upcoming[]}` |
| `complianceAuditLog` | 5 | `{id, timestamp, user, userRole, action, target?, reason?, notes?}` |
| `athleteReflections` | 14 keys | Map `athleteId → [{date, text}]` (first-person by the athlete) |
| `CURRENT_USER` | derived | Hardcoded `contacts.find(c => c.id === 'diane')` — the fixture operator |
| `T()`, `F()` | helpers | Sector terminology (athletics-only for v1) |

### 2.3 FK graph (with schema-gap corrections)

Current fixture cross-references:

- `athletes` = root (no outgoing FKs)
- `workshops.attendance[].athleteId` → `athletes.id` (numeric, clean)
- `workshops.facilitator` → **text ref to contact NAME** (Morgan Walker) — **schema gap**
- `workshops.followUps[].owner` → **text ref to contact NAME** — **schema gap**
- `INST_PROFILES.facilitator` → **text ref to contact NAME** — **schema gap**
- `complianceAuditLog.user` → **text ref to contact NAME** — **schema gap**
- `athleteReflections[athleteId]` → `athletes.id` (map key, clean)
- `engagedAthletesByWeek[week][]` → `athletes.id` (clean)
- `exclusions` → no FK; org names reference the individual-side org
  catalog implicitly, name-based

**Corrections for the schema draft**: every name-string cross-reference
above must land as a real FK to `person(id)` via
`institution_contact.person_id`. The `contacts.id` fixture slug (`diane`,
`sarah`, etc.) is a convenience alias — production replaces it with an
opaque `person.id` UUID. Contact rows themselves become
`institution_contact` records that JOIN person + institution + role.

### 2.4 PII sensitivity tiers

Ranked from most to least sensitive:

1. **`athlete_reflection`** (first-person narrative by the athlete about
   their giving practice, values, family context) — most sensitive.
   Athlete-authored, institution-visible. E6 rules ownership.
2. **`athlete_note`** (staff-authored freeform observations about
   individual athletes — see `athletes[].notes` and per-workshop
   `attendance[].note`). Third-party opinions about identified subjects.
3. **`athlete` PII core** — `name`, `email` (`cooperstate.edu`),
   `phone`, `activity[]` gift history (amount + org + date). Contact-
   grade PII plus behavioral data.
4. **`workshop.attendance`** — per-session attendance record with
   optional staff notes about absence.
5. **`exclusion.connectionDetail`** — free-text that can name individuals
   ("Coach Reeves's spouse serves on the board of this organization").
6. **`compliance_audit`** — timestamped staff actions; sensitive as an
   audit trail, not for PII content per se.
7. **`INST_PROFILES`** aggregate — non-PII institutional metadata.

All athletes on the fixture are collegiate (18+, adults) — no minor-
consent question — but subject to NCAA/NIL rules that add regulatory
overlay to the storage question.

---

## 3. Advisor arc reuse audit

### 3.1 Precedents that transfer directly

- **Fold-in provider write-through** (`initialState !== undefined` signal
  distinguishes auth vs demo): `InstitutionProvider`, `AthletesProvider`,
  `WorkshopsProvider`, `ExclusionsProvider` all use the same pattern.
- **`/api/me` per-type block widening** — /api/me returns an `enterprise`
  block for `type='staff'` sessions (or `type='enterprise'` per E2),
  scoped to the operator's institution.
- **`RequireType` route guard** — `/app/enterprise/*` gated the same way
  `/app/advisor/*` is.
- **`AppDispatcher`** — new `type='staff'` branch redirecting to
  `/app/enterprise`.
- **Sign-out affordance** (from the sign-out slice) — `Chrome.jsx`
  already renders `SignOutButton` on any authenticated tree; enterprise
  gets it for free once mounted.
- **Path B posture** — the surface already reads defensively (see §8
  below); the schema draft carries the platform-wide no-rank/no-score
  invariant.

### 3.2 Advisor tables shared vs new

| Advisor table | Enterprise reuse? |
|---|---|
| `person` | **Shared** — every operator, contact, and (per E3 ruling) athlete slot goes through it |
| `auth_user` / `session` / `verification` | **Shared** (better-auth) |
| `org` | **Shared** — athlete gifts target the same catalog |
| `gift` | **Shared** if E3 rules athletes get individual-account claim path; **separate mirror** if not |
| `scenario` | **Not applicable** — individual-side only |
| `client` / `client_session` / `client_note` | **NOT shared** — enterprise athletes are program participants, not advisor clients; different owner scope (institution vs practice) |
| `practice_lesson` / `doc_category` / `doc` | **NOT shared** — advisor content authored per-practice |
| `cohort` / `cohort_member` | **NOT shared** — advisor cohorts are practice-scoped; enterprise "cohort" is a program-year snapshot bound to an institution. See E5. |

### 3.3 Cross-role identity

Morgan Walker appears in BOTH surfaces: advisor person row (Walker
Philanthropic Advisory) AND enterprise workshop facilitator at Cooper
State. The RULED single-type identity model says one `person` = one
`type`. Options for the cross-role case in E4.

---

## 4. Persona / seed drift

### 4.1 The current state

Two personas exist across the enterprise-adjacent seams and they do NOT
line up:

| Persona | Where they live | Role | `person.type` | `person` row today |
|---|---|---|---|---|
| **Jordan Avery** | `migrations/0005_demo_roster.sql:17` | Bespoke demo-roster staff row | `staff` | Yes (`02000000-0000-4000-8000-000000000001`, pending) |
| **Diane Okonkwo** | `enterpriseFixtures.js:582` (contact id `diane`) + `CURRENT_USER` | Senior Director, Athletic Development (the fixture operator) | — | **No** |

Chrome's `SURFACE_CONFIG.enterprise.role = 'Institutional admin'` — a
generic label that doesn't yet distinguish the two. The fixture assumes
Diane is signed in (`CURRENT_USER = Diane`), but Diane has no `person`
row, so the auth path is unreachable for her today.

### 4.2 Reconciliation options for the seed slice

**Option A — Promote Diane, retire Jordan.** Insert Diane as a
type='staff' (or type='enterprise' per E2) person in the seed migration;
delete the Jordan Avery row from 0005 or leave it as a residual pending
demo-roster entry. Diane becomes the reference enterprise operator, and
the fixture's implicit assumption becomes explicit.

**Option B — Rename Jordan → Diane in 0005.** Rewrite the demo-roster
row in place. Simpler but leaves the migration history less honest.

**Option C — Keep both, add Diane fresh.** Diane joins as a new pilot
`person` row (like Morgan for advisor); Jordan stays as a residual demo
roster entry. Two `type='staff'` people at Cooper State — Diane the
operator, Jordan a lower-tier staff member (Program Admin? — needs a
role decision in E1).

**Recommendation**: Option C. Mirrors how Morgan Walker landed for
advisor (fresh pilot person row, not retrofit). Preserves the migration
history and gives the enterprise fixture two seeded staff to demonstrate
the multi-contact institution model. Ruled under E4.

---

## 5. Schema touchpoints (against migrations 0001-0010 planning)

### 5.1 Proposed entity-candidate tables

Owner-scope path for every enterprise-owned entity terminates at
`institution.owner_operator_person_id` → `person(id)`. Every "my X" FK
gets an index from migration 1 (D1 rows-read discipline).

| Table | Key columns | Owner-scope path | Notes |
|---|---|---|---|
| `institution` | `id PK`, `owner_operator_person_id FK`, `name`, `sector`, `dept`, `contract_label`, `tier`, `annual_amount`, `endowment_annual`, `endowment_current`, `program_term`, `created_at`, `updated_at` | direct | 1 row per pilot institution today |
| `institution_contact` | `id PK`, `institution_id FK`, `person_id FK`, `role_title`, `is_default_operator BOOLEAN` | direct | Replaces the fixture's name-string facilitator/owner refs |
| `athlete` | `id PK`, `institution_id FK CASCADE`, `name`, `sport`, `year`, `position`, `gps_completed_at`, `lessons_count`, `gifts_count`, `last_active_at`, `enrollment_status ENUM('New','Invited','Active','Stalled','Sunset')`, `certified BOOL`, `cert_at`, `badge`, `join_date`, `email`, `phone`, `created_at`, `updated_at` | via institution | E3 rules whether `person_id FK NULL` linkage column exists here |
| `athlete_note` | `id PK`, `athlete_id FK CASCADE`, `author_person_id FK`, `date`, `content` | via athlete → institution | Staff-authored; PII tier 2 |
| `athlete_activity` | `id PK`, `athlete_id FK CASCADE`, `date`, `type ENUM`, `label` | via athlete | Timeline entries — lesson_completed, workshop_attended, gift_made, note_added, gps_completed, certified |
| `athlete_reflection` | `id PK`, `athlete_id FK CASCADE`, `date`, `text` | via athlete | **PII tier 1** — ownership ruled in E6 |
| `workshop` | `id PK`, `institution_id FK`, `date`, `title`, `status ENUM`, `notes`, `facilitator_person_id FK`, `module`, `summary` | direct | facilitator FK replaces the name-string ref |
| `workshop_attendance` | composite PK `(workshop_id, athlete_id)`, `attended BOOL`, `note` | dual-transitive via workshop AND athlete | Q7-analog dual ownership |
| `workshop_followup` | `id PK`, `workshop_id FK`, `owner_person_id FK`, `action`, `target`, `status ENUM('pending','in_progress','completed')`, `completed_at`, `due_at` | via workshop | Real owner FK |
| `exclusion` | `id PK`, `institution_id FK`, `name`, `ein`, `reason`, `flagged_at`, `connection`, `connection_detail` | direct | connectionDetail sensitivity ruled in E8 |
| `compliance_audit` | `id PK`, `institution_id FK`, `timestamp`, `user_person_id FK`, `user_role`, `action`, `target`, `reason`, `notes` | direct | **Append-only** per E7 |
| `cohort_period_snapshot` | `id PK`, `institution_id FK`, `cohort_label`, `athletes_count`, `gps_rate`, `cert_rate`, `gifts_count`, `dollars_moved`, `attendance_rate`, `avg_weekly_engagement`, `as_of_note`, `snapshot_at` | direct | Persist vs derive: ruled in E9 |

### 5.2 Invariants to hard-comment in DDL

Every enterprise table's docblock comment must repeat:

1. **Q9 platform-wide guardrail** — no rank / score / priority /
   suggestion / ordering / progression / rating / grade column may EVER
   be added. `athlete.badge` is a descriptive label (E10), NOT a rank.
   `athlete.enrollment_status` is categorical relationship state, NOT
   lifecycle.
2. **Parker no-lifecycle-field invariant** — no settlement / processed /
   refunded / cleared / reversed column may EVER be added. Applies
   specifically to `athlete_activity` (gift-related events reference the
   `gift` table for lifecycle; the activity row is a display log, not a
   state machine).
3. **Append-only enforcement for `compliance_audit`** — the endpoint
   layer refuses UPDATE and DELETE (400 or 405); the DB doesn't need a
   trigger, but the schema docblock cites the endpoint contract.

---

## 6. Data-protection frame — layered institutional PII

Advisor persistence introduced third-party PII (data about advisor
clients viewed by the advisor). Enterprise persistence layers a second
third-party in: institutional staff (Diane, Sarah, Morgan, Jordan)
viewing data about program participants (16 student-athletes). Every
consent seam that mattered for advisor persistence sharpens here.

### 6.1 L1 schema constraints (advisor arc inheritances that transfer)

- **PII separable from behavior** — athlete identity (`athlete.name/email/
  phone`) is joinable but distinct from `athlete_activity` (gift/lesson/
  workshop events). The schema does not preclude a future
  pseudonymization pass on the activity table.
- **`person.id` opaque** — inherited from ruling C on the individual
  schema. Athletes-as-persons (E3) get opaque UUIDs; the enterprise-side
  `athlete.id` is a separate slug/UUID for the record-of-record even
  when the athlete has a personal account.
- **Email lives in two systems** — same finding as advisor: better-auth
  `auth_user` + CF Email/Resend send logs. Enterprise adds a THIRD:
  athlete emails on `athlete.email` for staff contact. Explicit in the
  data-inventory.

### 6.2 L2 legal (counsel-gated — recurrence of advisor Q7)

Three questions REMAIN counsel-gated (see E3, E6, E8):

1. **Controller identity for institutional data** — Cooper State
   University holds the data-controller role for its athlete records
   (student records under FERPA, NIL compliance data). StewardHouse's
   role is processor or joint controller? Different consent posture per
   answer.
2. **Athlete consent posture** — advisor arc parked Q7 (processor vs
   joint controller for advisor clients) on the client-write path;
   enterprise arc REACTIVATES that question at institutional scale.
   Cohort of 16 student-athletes signed to Cooper State's program is a
   different consent surface than one advisor's individual client
   relationships.
3. **Cross-surface individual data sharing** — if an athlete gets their
   OWN individual account (E3), the platform holds a Person + an
   institution-recorded athlete row about them. Data-sharing rules
   between the two records (who sees what, what the athlete can opt out
   of showing the institution, etc.) are counsel-critical.

### 6.3 L3 ops (advisor precedents carry)

- Magic-link is the only auth. Session-lifetime and CF secrets already
  in place from the sign-out arc.
- Better-auth sharp edges (session refresh bug #4203) still apply.
- CF Email service still BETA; Resend production sender via verified
  domain now live (as of sender config swap — see
  `functions/_lib/sender.js`).

### 6.4 L4 governance (advisor precedents carry)

- Same 10%-gross commitment + no-third-party-ad posture from the
  Individual arc.
- Retention / deletion policy from ruling E on the individual schema
  carries: person-boundary two-phase soft-then-hard deletion cascades
  from person → athlete rows if E3 rules person = athlete linkage.
- Athlete reflections are advisor-of-record work product AND
  athlete-first-person content — the Parker posture on client_note
  ("advisor work product; StewardHouse stores them and never parses,
  mines, surfaces, or acts on their content") extends here; the same
  posture for institutional records is E10 territory.

---

## 7. RULINGS OPEN — 12 questions (E1–E12)

Twelve questions organized by cluster. Each carries: (a) the question,
(b) the options, (c) a RECOMMENDED position drafted below, (d) a
counsel-flag if the answer is counsel-gated.

### 7.1 Structural rulings

**E1 — Institution-scoping model.** Single-institution-per-operator, or
multi-tenancy?

- Options: (a) one operator = one institution (`institution.owner_
  operator_person_id` unique); (b) operator can own many institutions;
  (c) institution owned by many operators via `institution_contact`.

- **RECOMMENDED**: (c) with `institution_contact.is_default_operator`
  breaking ties. Rationale: the fixture assumes multiple staff at Cooper
  State (Diane, Sarah, Morgan, Jordan) — trying to force a single-owner
  model would require immediate over-engineering. The
  `institution_contact` join table already captures multi-staff, so
  making the ownership itself route through it is the smaller schema
  seam. Q4-analog: the join table replaces the fixture's implicit contact
  list.

**E2 — `person.type` for institution staff.**

- Options: (a) keep `staff` (Jordan's seeded type); (b) promote to
  `enterprise`; (c) subdivide by role (`staff-admin`, `staff-compliance`,
  `staff-facilitator`).

- **RECOMMENDED**: (a) keep `staff`. Rationale: the RULED-permanent
  single-type identity model (Sign-out slice) makes `type` a coarse
  routing label, not a role. `staff` is exactly that — an institutional
  operator role. Role granularity belongs on
  `institution_contact.role_title` (free-text or enum), not on
  `person.type`. This also keeps `ops` (Reese) as a distinct top-level
  type without conflating operator-of-institution vs
  operator-of-platform.

**E3 — Athlete = `person` row, or separate `athlete` table with FK?**
**Counsel-gated.**

- Options: (a) `athlete` is a `person` row with `type='individual'` and
  a claim path via institutional email; the fixture `athletes` maps 1:1
  to person rows; (b) `athlete` is a separate table with
  `person_id FK NULLABLE` — nullable so unclaimed records can still be
  captured, populated when the athlete opts in via magic-link; (c)
  `athlete` is a separate table with NO `person_id` link — institution
  records are institution-only, athletes never claim.

- **RECOMMENDED**: (b) separate `athlete` table with nullable
  `person_id` linkage. Rationale: the institutional record MUST exist
  for staff workflow (staff can see the roster before any athlete claims
  an account); the linkage column enables the future athlete-side
  individual account without a schema migration. Not (a) because the
  institution's PII about the athlete SHOULD NOT vanish when an athlete
  deletes their individual account (ruling E person-boundary cascade
  would nuke it); not (c) because we need the seam ready for the
  athlete-side individual arc.

- **COUNSEL FLAG**: whether an unclaimed `athlete` row is "personal
  data" under privacy regimes when it stores a real name + email of a
  non-signing party. Same class as advisor Q7 — parked; the schema
  lands, the endpoint gate can hold until counsel confirms.

- **FT RULING — OVERRIDE (retention inverted)**: agrees with structure
  (b) — separate `athlete` table with nullable `person_id` linkage —
  but INVERTS the retention posture drafted above. Athlete data belongs
  to the athlete. When an athlete departs or is deleted, the cascade
  removes ALL athlete-related data across the institution: contact
  (email/phone), activity timeline, staff-authored notes about the
  athlete, and reflections. Institutional residual on the `athlete`
  row = **stub of name, class, sport ONLY** — "almost useless by
  design." This is anonymize-to-stub, a sibling of the individual
  schema's ruling E "anonymize-not-orphan" (per docs/ruling-e-deletion-
  retention.md). Institutional PII does NOT survive the athlete-side
  deletion; the historical cohort snapshot (E9) captures the aggregate
  numeric trace only. Under-18 roster escalation flagged in the schema
  docblock as a future case that may need a second cascade layer when
  the athlete is a minor and the guardian holds deletion authority.

**E4 — Advisor cross-role identity.** Morgan Walker is both an advisor
person AND enterprise workshop facilitator. Single `person`, or two?

- Options: (a) single `person` row, appears in both surfaces (Morgan's
  advisor row also serves as `institution_contact.person_id`); (b) two
  distinct person rows; (c) contact reference (a lightweight
  `institution_contact` row with `person_id NULL` + name text).

- **RECOMMENDED**: (a) single person row. Rationale: single-type
  identity model + Morgan is one real person; her `type='advisor'`
  routes her to the advisor surface, but nothing prevents her from
  APPEARING in an enterprise workshop as an
  `institution_contact.person_id`. Cross-references are unidirectional:
  Morgan doesn't sign in to enterprise; enterprise staff sees her name
  as facilitator via the join. Aligns with the single-type identity
  model without forcing role duplication.

**E5 — Cohort scope discriminator.** Enterprise "cohort" (program-year
snapshot) vs advisor `cohort` (practice-scoped roster).

- Options: (a) share the `cohort` table with a `scope` column
  discriminator (`'practice'` | `'institution'`); (b) separate table
  `cohort_period_snapshot` for the enterprise notion.

- **RECOMMENDED**: (b) separate tables. Rationale: they're semantically
  different — advisor cohorts are working groups the advisor manages;
  enterprise "cohort" is a program-period aggregate (16 athletes in
  2025-2026 season) with derived rate metrics (gpsRate, certRate). No
  shared read pattern, no shared write pattern, and forcing a
  discriminator would leak schema-level ambiguity into every query. The
  scope discriminator idea always feels clean at first draft and always
  becomes technical debt.

**E9 — Cohort snapshot: persist or derive?**

- Options: (a) persist `cohort_period_snapshot` rows (as sketched in
  §5.1); (b) derive from live `athlete` + `athlete_activity` +
  `workshop_attendance` reads at request time; (c) materialized view /
  precomputed cache.

- **RECOMMENDED**: (a) persist. Rationale: cohort period aggregates are
  HISTORICAL — the prior cohort snapshot (2024-2025) is a frozen record,
  not a live view. If we derive at read time, cohort comparison becomes
  a bug factory whenever an athlete row is edited (a note added to a
  2024 athlete would retroactively change the historical rate). Snapshot
  as a first-class row is honest.

### 7.2 Data-protection rulings (counsel-gated)

**E6 — Athlete reflection ownership.** Athlete-authored, institution-
visible. **Counsel-gated.**

- Options: (a) athlete-owned (deleting the athlete's individual account
  cascades reflections away, even if the institution still sees them);
  (b) institution-owned (staff-visible even after athlete opt-out);
  (c) joint-owned with athlete-controlled visibility toggle.

- **RECOMMENDED**: (c) joint-owned with an athlete visibility bit. If
  E3 lands as recommended (nullable `athlete.person_id` link),
  reflections carry `athlete_id` (institutional) + are visible to staff
  by default; if the athlete claims their individual account (populates
  `athlete.person_id`), they gain the ability to toggle a
  `visible_to_institution` flag per reflection.

- **COUNSEL FLAG**: Institutional consent posture for storing athlete
  first-person content. FERPA-adjacent for student-athletes.

**E7 — Append-only `compliance_audit` enforcement.**

- Options: (a) endpoint-layer only (POST allowed, PUT/DELETE return 405);
  (b) DB-level (trigger rejecting UPDATE/DELETE); (c) both.

- **RECOMMENDED**: (a) endpoint-layer only, docblocked as the contract.
  D1 doesn't ship with triggers today; endpoint enforcement matches the
  Q9 platform-wide guardrail pattern (rank-key rejection is
  endpoint-layer too). The schema docblock cites the contract; a future
  DB-level enforcement (SQLite trigger, or migration to a Postgres shape
  with a proper CHECK) can layer on when D1 grows support.

**E8 — Exclusion `connection_detail` sensitivity.** Free-text can name
individuals (e.g. "Coach Reeves's spouse serves on the board"). **Counsel-gated.**

- Options: (a) treat as institutional record with no per-row access
  control; (b) mark as sensitive-field with restricted staff role
  gating; (c) mask person names at render time (surface-layer
  redaction).

- **RECOMMENDED**: (a) institutional record, docblocked as a caution.
  Institutional exclusion rationale is exactly what an audit committee
  or a legal review would ask about; the seed data example ("Coach
  Reeves") is precisely why staff need it visible. Any redaction pass
  belongs on the surface, not in the schema.

- **COUNSEL FLAG**: Third-party name disclosure inside institutional
  records (individuals who are NOT program participants but appear in
  exclusion rationale).

### 7.3 Platform-invariant rulings

**E10 — `athlete.badge` origin.** Path B check.

- Options: (a) staff-authored descriptive label only (persisted, never
  derived); (b) auto-derived from activity patterns; (c) athlete-
  authored self-descriptor.

- **RECOMMENDED**: (a) staff-authored descriptive label ONLY. **NEVER
  auto-derived, NEVER a rank.** Q9 platform-wide guardrail applies.
  Schema docblock hard-comments that no computed field may populate
  `badge`; endpoint layer allowlists it as a staff-only writable
  free-text field. Existing fixture values ("The Quiet Builder", "The
  Amplifier") are examples of descriptive intent — verify the copy
  reads that way (they do; no evaluative signal).

**E11 — Enterprise write-gate marker.**

- Options: (a) reuse `person.extensions.advisor.demo_gate=true` on
  advisor rows for parallel enterprise writes; (b) distinct
  `person.extensions.enterprise.demo_gate=true` marker; (c) no gate
  (enterprise writes open at slice ship).

- **RECOMMENDED**: (b) distinct `person.extensions.enterprise.demo_gate`
  marker. Rationale: the advisor gate ships Q7-dark for client-side
  writes; the enterprise gate ships until E3/E6/E8 counsel
  clears the athletic-institutional PII posture. Same gate PATTERN (per-
  request check against the owning person row); distinct NAMESPACE so
  the two gates can lift independently. The `requireGatedAdvisor`
  helper's twin, `requireGatedEnterprise`, does exactly the same shape
  against `$.enterprise.demo_gate`.

**E12 — SetupWizard: one-time create OR editable Settings surface?**

- Options: (a) wizard is create-only; edits happen via a separate
  Settings tab (mirroring `PracticeSettings` on the advisor surface);
  (b) wizard is reachable for edits (multi-step form serves as both
  paths); (c) hybrid — wizard creates, Settings edits the identity block
  only, wizard-only for cohort transitions.

- **RECOMMENDED**: (a) wizard creates once. Settings surface handles
  ongoing edits — same shape as `PracticeSettings` inline edit mode.
  Rationale: wizards are onboarding tools, not maintenance tools;
  multi-step navigation for a single-field edit is friction. A future
  cohort-transition workflow (year rollover — "start 2026-2027 program
  period") could be a NEW wizard, but 2025-2026 setup runs once for
  Cooper State.

---

## 8. Path B check (surface baseline)

Enterprise surface is **already Path-B-institutionalized in copy**:

- `CohortComparison.jsx:129` — "not designed for performance ranking,
  scoring, or evaluation"
- `PhilanthropicReadiness.jsx:8/59/66/105` — repeatedly reinforces "not
  a score…structural checklist of progression steps"
- Zero rank/score/priority language in fixture keys
- `athlete.badge` (descriptive labels), `athlete.status` (categorical),
  `athlete.certified` (objective milestone) — all Path B-safe

The schema draft inherits this posture; no new copy pass needed at the
scoping stage.

---

## 9. Critical-path flag

**Counsel advances to critical-path for enterprise persistence.** Three
questions (E3, E6, E8) are counsel-gated; parallel-scoping option holds
(from the advisor arc precedent), meaning the schema draft can land with
those seams marked and the gate (`$.enterprise.demo_gate`) can enforce
counsel-clear before real athletic PII moves. Scoping can continue; the
schema-draft deliverable is unblocked pending E3/E6/E8 confirmation.

---

## 10. Proposed slice sequence (working plan)

| Slice | Deliverable |
|---|---|
| **E-Slice 1** (this doc) | `docs/enterprise-persistence-scoping.md` with E1–E12 rulings PENDING FT review |
| **E-Slice 2** SCHEMA + SEED | migration `0009_enterprise_schema.sql` (11-12 tables + all indexes) + `0010_enterprise_seed.sql` (Cooper State institution row + Diane person + 4 contacts + 16 athletes + 2 completed workshops + reflections). Seed strategy analog to advisor `0008` slim-scope decision — verify at ship whether athletes seed as real rows or defer to endpoint POSTs (E3-adjacent) |
| **E-Slice 3** DISPATCHER + AUTH BRANCH | `AppDispatcher.jsx` staff-type routing (`type='staff'` → `/app/enterprise`), `/api/me` enterprise block widening (institution-scoped), `RequireType type="staff"` guard on `/app/enterprise` (or `type="enterprise"` per E2 ruling) |
| **E-Slice 4** WRITE ENDPOINTS | `POST/PUT /api/institutions`, `/api/athletes*`, `/api/workshops*`, `/api/workshop-attendance`, `/api/workshop-followups`, `/api/exclusions*`, `/api/institution-contacts*`, `POST /api/compliance-audit` (append-only per E7). All gated per `requireGatedEnterprise` (E11). |
| **E-Slice 5** PROVIDERS + FOLD-IN | `InstitutionProvider`, `AthletesProvider`, `WorkshopsProvider`, `ExclusionsProvider`, `ContactsProvider` — same fold-in idiom + write-through pattern as advisor providers. Wire `EnterpriseSurface`'s mount to use folded initialState from `/api/me` |
| **E-Slice 6** SETUP WIZARD PERSISTENCE | Wire wizard to `POST /api/institutions` + `POST /api/institution-contacts` (per E12 create-only ruling) |
| **E-Slice 7+** PER-TAB WIRING | Roster CRUD (biggest — 16-athlete surface with edit + note capture + activity log), Program (workshop schedule + attendance UI + followUps mark-complete), Compliance (exclusion CRUD + audit log append), Reports read-through with correct owner-scope, `Settings` tab (E12) for institution identity edits. Cadence mirrors 2b-i/2b-ii-a/2b-ii-b. |

Each slice runs the standard slice protocol: hard git-state gate,
audit + propose, feature branch off main, verify (build clean + local
smoke), HOLD for review, banked commit.

---

## 11. FT rulings block — TO BE FILLED AT REVIEW

FT rules on E1–E12 below. Recommendations above are the draft; FT
confirms, amends, or overrides each. Counsel-gated items (E3, E6, E8)
carry an EXPLICIT counsel-status flag: `pending`, `confirmed`, or
`overridden`.

| Ruling | FT decision | Counsel status | Notes |
|---|---|---|---|
| **E1** — Institution-scoping model | **agree (c)** — multi-operator via `institution_contact`; `is_default_operator` tie-break | — | pilot has one institution — do not generalize multi-tenancy posture from this ruling |
| **E2** — person.type for staff | **agree (a)** — keep `staff` | — | role granularity on `institution_contact.role_title` |
| **E3** — Athlete = person or separate | **OVERRIDE — (b) structure, retention inverted** | pending | FT ruling: athlete data belongs to the athlete. Departure/deletion cascades ALL athlete-related data (contact, activity, staff notes about the athlete, reflections). Institutional residual = stub of name, class, sport ONLY — "almost useless by design." Anonymize-to-stub, sibling of ruling E anonymize-not-orphan. Nullable `person_id` retained. Counsel pending on unclaimed-row PII posture; under-18 escalation flagged in docblock |
| **E4** — Advisor cross-role identity | **agree (a)** — single `person` row | — | `institution_contact.person_id` grants zero enterprise capability to the referenced person (docblock) |
| **E5** — Cohort scope discriminator | **agree (b)** — separate `cohort_period_snapshot` table | — | separate tables, no scope discriminator |
| **E6** — Reflection ownership | **agree (c)** — joint-owned with athlete-controlled visibility bit | pending | reflections are athlete-owned per E3 ruling — cascade on departure; visibility toggle governs during tenure; pre-claim gap covered by program-level consent, named honestly |
| **E7** — compliance_audit enforcement | **agree (a)** — endpoint-layer only | — | verify D1 trigger support at build time; layer DB-level enforcement then if cheap |
| **E8** — connection_detail sensitivity | **agree (a) AS AMENDED** — institutional record, docblocked; content convention below | pending | content convention: third parties identified by name + role from PUBLIC record only, never relational or private descriptors (e.g. "Board member Dana Reeves", NEVER "Coach Reeves's spouse"). `connection_detail` sits on never-emit side of emit allowlist for all athlete-facing/cross-surface reads. Counsel pending on legal inclusion limits (FT-named ambiguity) |
| **E9** — Cohort snapshot: persist or derive | **agree (a)** — persist `cohort_period_snapshot` rows | — | NEW HARD INVARIANT from E3 override: snapshots store aggregates ONLY, zero per-athlete identifiable data — history must survive athlete deletion without retaining PII. Comparison never renders as ranking (#77 precedent) |
| **E10** — badge origin (Path B) | **agree (a)** — staff-authored descriptive label ONLY, never derived, never a rank | — | three-layer enforcement: docblock + endpoint allowlist + seed-copy screen |
| **E11** — Enterprise write-gate marker | **agree (b)** — distinct `person.extensions.enterprise.demo_gate` marker | — | fix §7 rationale typo "Q3/Q6/Q8" → "E3/E6/E8" (applied) |
| **E12** — SetupWizard: create-only vs edit | **agree (a)** — wizard creates once; ongoing edits via Settings surface | — | year-rollover is a future NEW wizard |

Once filled, the schema draft (`docs/enterprise-persistence-schema-
draft.md`) can be written against these rulings, mirroring the shape of
`docs/advisor-persistence-schema-draft.md`. Any counsel-gated ruling
marked `pending` becomes a schema seam (per the advisor arc's Q7 /
ruling-E precedent): the schema lands, the endpoint holds behind the
gate, the seam confirms in parallel with the build.
