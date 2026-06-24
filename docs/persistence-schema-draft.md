# Persistence schema draft — RULED (A-F)

## 1. Status

Ruled schema draft for the persistence layer. FT ruled A-F this session.
Inherits `docs/5.8-giving-flow-scoping.md` section 5 (canonical Gift /
Scenario / entity sketch) + `docs/persistence-scoping-pass.md` (3 strands).
Sequence: scope → rule → build; this is the **rule** artifact.

**FINALIZED EXCEPT ruling E** (deletion / retention — Derek-gated). Nothing
built yet; build does not proceed until E returns AND FT authorizes.

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
- **E — deletion / retention: PARKED FOR DEREK.** Has a legal dimension
  (what "delete" must mean, compelled-retention) — rides with Derek's L2
  questions, not ruled blind. Schema cannot finalize deletion-cascade
  behavior until E returns. Parker constraint stands: whatever returns must
  NOT reintroduce a lifecycle field by the back door (no `deleted_at`-as-
  status drift).
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

## 4. Deletion / retention — DEREK-GATED (ruling E, not finalized)

**Open:** hard-delete vs soft-delete vs other; account-deletion cascade
(`auth_user` delete → `person` → `gift` / `scenario`); D1 Time Travel
(30-day restore) means "deleted" has a disclosure asterisk regardless.
Legal dimension routes to Derek with the L2 questions.

**Parker hard constraint on whatever returns:** no lifecycle-field
back-door (a deletable Gift must not gain a status sibling via
`deleted_at`).

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

Derek returns E → schema finalizes → FT authorizes build. Build sequence
(from the pass): schema / migrations → auth → wire surfaces. Until E + FT
authorization, NO build proceeds.
