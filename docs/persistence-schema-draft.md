# Persistence schema draft — RULED (A-F)

## 1. Status

Ruled schema draft for the persistence layer. FT ruled A-F this session.
Inherits `docs/5.8-giving-flow-scoping.md` section 5 (canonical Gift /
Scenario / entity sketch) + `docs/persistence-scoping-pass.md` (3 strands).
Sequence: scope → rule → build; this is the **rule** artifact.

**FULLY FINALIZED.** Ruling E (deletion / retention) RESOLVED — accepted
on research synthesis this session; full record at
`docs/ruling-e-deletion-retention.md`. Two counsel-gated seams remain
isolated (charitable-retention-floor confirmation; subpoena posture) —
they do NOT block the build.

HEAD at draft: `d7bfe70`.

---

## 2. FT rulings (A-F, recorded verbatim)

- **A — live-store model: REPLACE.** Live D1 store is the single source of
  truth for user-authored entities (Person / Gift / Scenario / intake).
  Unified build-time projection serves seed / demo data only; no longer owns
  real-user-created data.
- **B — person-is-identity: CONFIRMED.** `person` table IS the user
  identity; `individualProfile.js` becomes seed data loaded into `person`
  rows, not a parallel truth.
- **C — gift separation: `person.id`-opaque is SUFFICIENT.** No extra
  indirection layer at pilot. `gift` table alone does not reveal giver
  identity without the `person` → `auth_user` join (the guarded chokepoint
  per strand 3 L1).
- **D — org: D1 TABLE.** `org` becomes a persisted D1 table (not a
  build-time projection). `gift.recipient_org_id` is a real hard FK with
  referential integrity. The 17 seed orgs migrate into the D1 `org` table
  as real rows (same seam as Marcus's gifts).
- **E — deletion / retention: RESOLVED.** Accepted on research synthesis
  this session — full record `docs/ruling-e-deletion-retention.md`.
  Two-phase soft-then-hard deletion enacted at the **`person` boundary**
  (NOT a per-Gift status column — Parker no-`deleted_at`-as-status
  invariant intact); anonymize-not-orphan for any structurally-retained
  fact; minimal justified retention window; backup / restore re-applies
  pending deletions; deletion ledger keyed by opaque marker; subpoena
  posture = keep identity separable, who-gave-to-whom view stays
  **UNBUILT** until posture set. Two counsel-gated seams remain
  (Clause 3 charitable-floor, Clause 6 subpoena posture) — isolated, do
  NOT block build.
- **F — Marcus seed-migration: CONFIRMED.** Marcus = first real account
  through real auth. The demo "load Marcus" path IS the account path,
  exercising the real identity model. Marcus gets a real `auth_user` +
  `person` row; his 3 seed gifts become real `gift` rows owned by his
  `person.id`.

---

## 3. Tables (replace-model; all under the live D1 store)

- **`auth_user`** (better-auth-owned): `id` (opaque), `email`,
  `email_verified`, `created_at`, + better-auth session / verification
  companion tables. **ONLY place email lives in the data model** (besides
  CF Email send logs).
- **`person`**: `id` (opaque — pseudonymization pivot, NOT name / email-
  derived), `auth_user_id` (FK → `auth_user.id`, **NULLABLE** — seed / demo
  persons have no account), `display_name`, `initials`, `type`
  (individual / staff / advisor / ops), `source_surface`, `extensions`.
  `person` IS the identity (ruling B).
- **`gift`**: `id` (uuid), `giver_person_id` (FK → `person.id`),
  `recipient_org_id` (FK → `org.id`, **NULLABLE by design** —
  write-ins / enterprise have none), `recipient_org_name` (always present),
  `amount`, `date` (ISO), `type`, `vehicle`, `recurring`, `notes`
  (nullable), `source_surface`, `exported_to_cpa` (Parker's ONLY
  lifecycle-adjacent field — **no other lifecycle / status / settlement
  column, ever**). INDEX from row one on `giver_person_id` AND
  `recipient_org_id` (D1 bills rows-read — table-stakes, not optimization).
- **`scenario`**: `id` (scenario-uuid), `owner_person_id` (FK →
  `person.id`), `label`, `created_at` (ISO — the version axis), `inputs`
  (6 modeler knobs: annual / years / growth / grantPct / careerOn /
  careerRate), `derived_at_snapshot` (cached
  `{finalFund, totalIn, totalOut}`, nullable). INDEX on `owner_person_id`.
  **NO rank / score field** (Parker Modeler guardrail).
- **`org`**: `id` (durable, from the 17-catalog ids), `name`, `ein`
  (nullable), `mission`, `causes` (string[]), `geo`, `cat` (nullable),
  `is_excluded_by_institution_ids`, `source_surface`, `extensions`. Now a
  D1 table (ruling D). 17 seed orgs migrate as real rows.

---

## 4. Deletion / retention — RESOLVED (ruling E)

**Resolved:** accepted on research synthesis this session — full record at
`docs/ruling-e-deletion-retention.md`. Two-phase soft-then-hard deletion
at the **`person` boundary** cascading to `gift` / `scenario`;
anonymize-not-orphan exception; minimal justified retention window;
backup / restore re-applies pending deletions (D1 Time Travel 30-day lag
disclosed in policy); deletion ledger keyed by opaque marker; subpoena
posture keeps identity separable + who-gave-to-whom view UNBUILT until
posture set. Two counsel-gated seams remain isolated (Clause 3
charitable-floor; Clause 6 subpoena posture) and do NOT block build.

**Parker hard constraint honored:** no lifecycle-field back-door — a
deletable Gift never gains a status sibling via `deleted_at`. Deletion is
a `person`-level state that cascades, not a per-Gift column.

---

## 5. Carried debt (build absorbs; not rulings)

- Budget-literal mismatch (`'$1K–$10K'` vs `'$1K – $10K'` → dead lookup,
  5000 fallback).
- `Date.now()` gift ids → `crypto.randomUUID()`.
- Date-format → ISO.
- `worldLabel` two-site convergence (`IntakeContext.jsx:32` + `:98`
  hardcoded vs `individualProfile.worldLabel`).

---

## 6. Indexing note (schema-first discipline)

Every FK that backs a "my X" read is indexed from the first migration:
`gift.giver_person_id`, `gift.recipient_org_id`, `scenario.owner_person_id`,
`person.auth_user_id`. Session-check read (`better-auth`, `cookieCache`
disabled per bug #4203) also needs its index. D1 bills rows-read;
unindexed full-table scans cause surprise bills.

---

## 7. Next

Schema **IS finalized** (E resolved); FT has authorized build. Two
counsel-gated seams (Clause 3 charitable-floor; Clause 6 subpoena
who-gave-to-whom capability) are confirmed by counsel in parallel and do
NOT gate the rest of the build. Build sequence (from the pass):
schema / migrations → auth → wire surfaces.
