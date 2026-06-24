# Ruling E — deletion / retention

## 1. Status

Ruling E (deletion / retention) — **ACCEPTED by FT this session** on a
research synthesis. **NOT legal advice**; founder decision with counsel as
confirm / correct backstop. Resolves the one parked item from the A-F
schema rulings (`docs/persistence-schema-draft.md`). Two counsel-gated seams
remain isolated (Clauses 3 + 6 below). Unblocks the persistence build
except those two seams.

HEAD at ruling: `9bf5a80`.

---

## 2. Why this exists (the de-risk)

E was parked for Derek. Making Derek a hard gate on the whole persistence
build = single point of failure on one contact's responsiveness. FT's
directive: proceed as if counsel may not engage, be able to pivot
regardless. So: research the landscape, rule on it now, build on the
legally-neutral majority, isolate the genuinely architecture-sensitive
seams for counsel confirmation. **Converts E from "blocks everything" to
"builds with two marked seams."**

---

## 3. Research synthesis (landscape, both regimes)

- **Core legal shape.** GDPR Art.17 + CCPA / CPRA both grant a deletion
  right that is **NOT absolute** — a defined exception list permits /
  requires retention (legal-obligation compliance, defense of legal claims,
  and CCPA-specifically: a received government legal demand for that
  person's data).
- **Soft-delete-that-stays-soft is NOT deletion** — it is concealment;
  regulators look at whether data exists / is recoverable, not whether the
  UI hides it. Hence a real hard-purge floor is mandatory (and aligns with
  Parker's no-`deleted_at`-as-status rule).
- **Retention periods.** Neither regime prescribes universal periods; GDPR
  storage-limitation (Art.5(1)(e)) = keep no longer than necessary, justify
  the period. Charitable-records angle: IRS ~7-year recordkeeping floor
  exists but lands on the **donor + receiving charity**; since StewardHouse
  records a **declared gift** and never custodies funds or issues the
  receipt, the argument it binds the platform is weak — **counsel-gated**,
  not assumed.
- **Backup / restore (D1 Time Travel 30-day).** Solved + already legally
  accounted-for. CCPA explicitly permits delaying deletion on backup /
  archived systems until next restored / accessed; GDPR best practice =
  hard-delete live immediately, let backups age out on rotation. The
  30-day window is a documented lag, not a violation, provided restores
  re-apply pending deletions and the policy discloses it.
- **Comparable-platform practice.** Dominant pattern is two-phase —
  soft-delete (immediate suppression from UI + all business use) then
  background hard-purge after any retention window. Deletion ledger keyed
  by a **non-identifiable marker** so it doesn't become a new PII store.
- **Subpoena posture (the architecture-sensitive one).** Strongest
  protection = don't hold the data in readily-producible form. Data
  minimization is the defense. Standard posture (per major providers):
  require valid legal process, narrow overbroad demands, notify affected
  users where not gagged. The build-sensitive lever: whether the platform
  should even be able to produce a clean who-gave-to-whom table on demand
  — **counsel-gated**.

---

## 4. The accepted ruling (6 clauses, FT-accepted)

- **Clause 1 — Two-phase deletion (soft-then-hard).** On account-deletion
  request, immediate suppression of `person` + their gifts / scenarios
  from all reads / business use; then a mandatory background hard-purge
  after a defined retention window. Suppression alone is NOT deletion.
  **Parker reconciliation:** suppression is a `person`-level state, NOT a
  per-Gift status column — a Gift never gains a `deleted_at` sibling;
  deletion is enacted at the person boundary and cascades. No-lifecycle-
  field invariant intact.
- **Clause 2 — Anonymize-not-orphan.** If a referential-integrity /
  aggregate need requires a record to persist past hard-purge, strip
  personal identifiers (sever / null `giver_person_id`, purge free-text
  notes) rather than keep-but-hide. Default is full deletion;
  anonymize-retain is the documented exception.
- **Clause 3 — Retention window minimal / justified [COUNSEL-GATED
  sub-point].** Shortest defensible window (working proposal ~30 days,
  covering accidental-deletion recovery + backup-rotation alignment),
  then hard purge — UNLESS a specific legal-retention obligation
  attaches, in which case retain only the obligated fields, anonymized
  where possible. **Counsel-gated:** whether ANY charitable-records floor
  binds StewardHouse (research lean: probably not — declared-intent
  record, no fund custody — but confirm; ties to controller-identity).
- **Clause 4 — Backup / restore as documented lag.** Hard-purge live D1
  immediately at window expiry; D1 Time Travel restore points age out on
  normal 30-day rotation. **Requirement:** any restore re-applies pending
  deletions (no silent resurrection); privacy policy discloses the
  restore-window lag. Matches CCPA backup-delay allowance + GDPR best
  practice.
- **Clause 5 — Deletion ledger keyed by non-identifiable marker.**
  Minimal record of what / when deleted (audit / defensibility), keyed by
  opaque id / hash — never email / name. Proves deletion without becoming
  a new PII store.
- **Clause 6 — Subpoena posture [COUNSEL-GATED].** Build-now = keep
  identity separable from giving data (opaque person-id + guarded join,
  as designed); do NOT build denormalized donor-name-on-gift or easy
  reverse-lookup views. **Policy (counsel-gated)** = standard posture
  (require valid process, narrow overbroad demands, notify where not
  gagged). The capability to produce a who-gave-to-whom table stays
  **UNBUILT** until the posture is set — the one place a subpoena answer
  could change the schema.

---

## 5. What this unblocks

Schema can finalize and build can proceed on everything EXCEPT the two
counsel-gated seams: (1) confirm no charitable-retention floor binds the
platform; (2) set the subpoena posture governing whether the
who-gave-to-whom capability is ever built. Those isolate cleanly — they
don't block `person` / `gift` / `scenario` / `org` tables, auth, or
surface wiring. Counsel (Derek or alternate) confirms those two;
everything else builds now.

---

## 6. Counsel backstop

This is a research-grounded founder decision, not a legal determination.
A reviewing attorney should confirm **Clauses 3 and 6 specifically**. If
counsel corrects any clause, that clause (and only that clause) reopens;
the rest stands. Derek is no longer a hard gate — he (or alternate
counsel) confirms two isolated seams in parallel with the build.
