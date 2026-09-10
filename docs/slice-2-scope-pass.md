# Slice 2 scope pass — the BMF loader

**A proposed boundary and the open questions inside it. It does not build and it
does not rule.**

Pass run 2026-09-09, read-only, at HEAD `727613c` on `main`, tree clean including
untracked, local equal to `origin/main`.

**EVERY FIGURE IN THIS DOCUMENT WAS MEASURED AT `727613c` AND IS NOT RE-DERIVED
HERE.** This file is a publication of a pass already run. Where a claim rests on
a count, a line number, a byte size or a grep result, that value is as observed
during the pass and carries no later verification. A reader who needs a figure
to be current re-measures it rather than quoting this file.

**THIS FILE IS A SNAPSHOT. `docs/bmf-load-scoping.md` §15 AND
`docs/outstanding.md` REMAIN THE AUTHORITATIVE HOMES** for every ruling and every
queue entry it cites, and where either disagrees with this file, they are right
and this file is stale. It is a dated record of one pass, never a second place
where the rulings live.

**THE `727613c` MARKER DATES THE PASS, NEVER THE FILE'S OWN HISTORY, AND THE TWO
WERE NEVER THE SAME.** This file did not exist at `727613c`: the pass ran there,
and the file was published afterward at `216a758`, whose parent is `727613c`.
Every figure here is still as observed during that pass and none has been
re-derived, which is exactly what the paragraph above says and the whole of what
it says. **The file HAS been amended since publication**, by the commit carrying
this paragraph and by any that follow. A reader must not take the marker as a
guarantee that nothing here has been touched: it guarantees only that no figure
was recomputed.

**THE SNAPSHOT STATEMENT ABOVE PREVIOUSLY EXISTED ONLY IN `216a758`'s COMMIT
MESSAGE**, which is the shape A126 filed and which `docs/bmf-load-scoping.md` §15
records beside R21a — content that satisfies its requirement in a commit body and
then lives in no tracked document. It is written into the file it governs so a
reader meets it here rather than in `git log`. **The paragraph immediately above
is new**, and is not a relocation of anything.

**NO PREFERENCE IS EXPRESSED AND NOTHING IS RECOMMENDED.** The four candidate
boundaries in §6 are set out for the seats to weigh. The pass declines to rank
them, and that is deliberate rather than an omission.

---

## 0. What slice 2 is, and why its boundary is unwritten

*For a reader who has not read `docs/bmf-load-scoping.md` §15.*

Slice 1 of the BMF loader is built and banked. It downloads the IRS Business
Master File, parses it, and writes one large SQL file to disk — 1,964,958 rows
of INSERT statements aimed at a table named `bmf_aside`. That file is where the
work stops. Nothing has created `bmf_aside`, nothing has loaded the file into any
database, and no organization from it is visible anywhere in the product.

Slice 2 is whatever closes some part of that gap. Between the file on disk and
live data sit roughly a dozen steps: create the table, load it, run five checks
against it, swap it into place, assert the swap worked, retain and prune older
copies, and keep a rollback available. Every one of those steps has been ruled in
detail. None has been built.

What has never been written down is where slice 2 stops. The rulings describe the
whole loader and name only slice 1 and slice 3; slice 2 is mentioned twice in
passing and bounded nowhere. This pass proposes four places the line could fall
and weighs each against the project's own test for whether a boundary is
legitimate. It recommends none.

---

## 1. Git state at the time of the pass

| Check | Result |
|---|---|
| `git fetch origin` | ran — `.git/FETCH_HEAD` written 2026-09-09T21:52:41Z |
| Branch | `main` |
| HEAD | `727613cda3dd8883b789ab0e224b4d450bce8c13` |
| `main` vs `origin/main` | identical SHA; `rev-list --left-right --count` → `0	0` |
| Working tree, incl. untracked | clean — `git status --porcelain --untracked-files=all` returned 0 lines |
| `node scripts/verify-commit-tail.mjs` | **exit 0**, ALL CHECKS AND CONTROLS PASSED (six sections, every control ok) |

The BMF cache and emitted artifact do not appear in `status` because
`.gitignore:26` (`.bmf-cache/`), `:19` (`scripts/*.tmp.sql`) and `:27`
(`scripts/*.tmp.json`) cover them — verified by the script's own section 6.

---

## 2. What slice 1 actually produces

Read at HEAD: `scripts/bmf-fetch.mjs` (398 lines), `scripts/bmf-parse.mjs` (460),
`scripts/bmf-verify-slice1.mjs` (457).

**The emitted artifact is `scripts/bmf-aside.tmp.sql`.** Measured on disk at
`727613c`: **173,873,096 bytes, 1,970,763 lines, mtime 2026-09-08 11:00.**

**Its form, by execution rather than by the docblock:**

- `grep -c '^INSERT INTO bmf_aside'` → **5,805**
- `grep -c "^('"` → **1,964,958**
- 5,805 + 1,964,958 = 1,970,763 = the file's total line count. **There is nothing
  else in it.**
- `grep -c -E '^(CREATE|BEGIN|COMMIT|DELETE|DROP|PRAGMA|ALTER|UPDATE)'` → **0**

So the artifact is **INSERT statements and nothing else**. No DDL, no transaction
control, no target-table creation, no cleanup. Each statement is
`INSERT INTO bmf_aside (ein, name, city, state, revenue_amt, ruling, ntee_cd)
VALUES` followed by comma-separated tuples, terminated `;\n`. Target table is
`bmf_aside`, never `bmf` — `TARGET_TABLE` is a bound constant at
`bmf-parse.mjs:76`, per R24.

Emission does **no numeric conversion at all**: `bmf-parse.mjs` binds one emitter
per column by name in the `EMIT` table (`:135-148`). `ein`/`name`/`city`/`state`
go through `sqlText` unconditionally; `ntee_cd` and `revenue_amt` branch on
`raw === ''` **first** and emit the bare keyword `NULL`; `ruling` and
`revenue_amt` are validated as integer literals and emitted **verbatim**, never
through `Number()`. The only `Number`-class conversion in the file is
`BigInt(raw.revenue_amt)` on the accounting path for the item-13 sum, after the
emptiness branch.

**The sidecar is `scripts/bmf-aside.tmp.json`** (1,877 bytes). Read in full. It
carries: extract `2026-09-07`, fileSet `five`, targetTable `bmf_aside`,
`sqlBytes` 173,873,096 (matches the file exactly), `statements` 5,805,
`maxStatementBytes` 29,998 against a 100,000 ceiling, `rows` 1,964,958,
`distinctEins` 1,964,958, `duplicateEins` 0, `malformed` 0, `nullRuling` 0,
`nullRevenueAmt` 573,742, `nullNteeCd` 574,184, per-file breakdown summing to
1,964,958, `revenueAmtSum` "4317294050545" over 1,391,216 rows, and the two R21b
captures (`000019818` in eo1; `NORTH COUNTRY HOSPITAL & HEALTH CENTER,INC` EIN
`030185556` in eo1). Four checks, all `passed: true`.

**The state the artifact is in when slice 1 finishes:** on disk, gitignored,
**untracked**, and pointing at a table that **does not exist in any database**.
`bmf-verify-slice1.mjs` proved it loads — but into a `DatabaseSync(':memory:')`
scratch table declared **TYPES ONLY** (`SCRATCH_DDL`, `:106-114`): no PRIMARY
KEY, no NOT NULL, no indexes, no CHECK. The file itself says so at `:26-33` and
the verifier prints the four unobserved properties at the end of every run.

---

## 3. Every §15 ruling that constrains anything after parse-and-emit

**Search shown, with controls.** §15 spans lines **1645–2408** (`## 15.` at 1645;
`## Open items` at 2409), measured at `727613c`.

```
awk 'NR>=1645 && NR<=2408 && /^### /{print NR": "$0}' docs/bmf-load-scoping.md   → 31 headings
grep -c '^### ' docs/bmf-load-scoping.md                                          → 67   (control: file-wide is larger)
grep -c '^#### ' docs/bmf-load-scoping.md                                         → 3    (negative control: not the level counted)
```

31 matches the doc's own claim ("THIRTY-ONE `###` headings … Twenty-eight are
rulings"). Inline sub-rulings were found by token extraction over the same span,
controlled on a line known to carry two tokens (`:1834`, returned `R31` and
`R13a`) and on a line carrying none (returned 0).

**The full list. "Names a slice" means names one by number.**

### Constrains after parse-and-emit

| Ruling | What it requires | Names a slice |
|---|---|---|
| **R6** | Backup is a RETAINED DATED TABLE. Swap renames live to a dated name and the aside into place. Exported `.sql` REFUSED (it is itself an availability event). Undo is two metadata renames. | no |
| **R11f** *(inline in R6)* | The migration is the swap's first generation; on load one there is nothing to rename away unless it created it. Generation 1 is EMPTY, so an R7 recovery to it restores nothing — "flagged and NOT resolved". | no |
| **R6a** | The undo file is itself a remote `d1 execute --file` and inherits the same unverified atomicity, so it **must be safe to rerun**: check target names FIRST. | no |
| **R6b** | The compliance answer holds only because the table carries the seven IRS fields. A condition on any future column change. | no |
| **R7** | Retain THREE generations, ~303 MB each against a 10 GB ceiling. | no — R21c assigns it **out of every slice** |
| **R8** | Five PRE-SWAP checks against the aside GATE the swap. Any failure means NO SWAP; aside left named and stamped failed; live untouched. | no |
| **R8a** | **NO override flag.** Bands change only by editing the loader, committing and rerunning. | no |
| **R8b** | POST-SWAP assertion required: live row count matches what was verified, and the dated retained table exists under the expected name. A pre-swap schema comparison was REFUSED as the primary mechanism. | no |
| **R8c** | Pruning folds into the loader; drops the oldest beyond three, **only after a verified-good swap**. | no — R21c assigns it out |
| **R8d** | Provenance beside every hardcoded measurement (source and date next to the constant). | no |
| **R8e** | First-run behaviour defined: no trend baseline until roughly the fourth load. | no — R21c assigns it out |
| **R8f** | **No monitoring surface until Discover exists.** The loader's checks plus the stamp are the COMPLETE detection story. | no |
| **R9** | The stamp carries CHECK RESULTS, not a boolean. Amends a ruled design. | names **A113** (an entry, not a slice) |
| **R13** | The **LOADER** is authoritative for the DDL; the migration derives from it. The loader carries the full table definition as **a single named constant**. | no |
| **R13a** | When that constant is authored, `migrations/0022_bmf_table.sql` is REGENERATED from it. | "whichever slice authors the constant" — **unnamed** |
| **R13b** *(recorded at R8b)* | The post-swap assertion also reads `index_list` on the live table and checks the three index names are present. | no |
| **R31** | Byte-identity under R13a is **structural, table shape only**, across **all three tables and all five indexes**, every construct compared **as attached to its named object**. "Proves the derivation retroactively" **does not survive**; "drift found on day one" does. Records **three candidate constant shapes** and expresses no preference. | "the slice that authors the constant" — **unnamed** |
| **R14** | Generation table is `bmf_gen_YYYYMMDDTHHMMSSZ`. Prefix must not be `bmf_` (a `bmf_%` pruner would catch an in-flight aside). UTC with `Z`. ISO basic. Lexical order = chronological. Timestamp is the load's START, matches `load_stamp.load_started_at`, and **must be known when the aside is created**. | no |
| **R14a** | The undo creates a generation table too, needs its own timestamp in the same format, and its stamp row records it. | no |
| **R16** | R8-2 and R8-3 become PRE-SWAP **constraint assertions** on the aside: PRIMARY KEY on `ein`, `notnull=1` on **five** columns including `ein`, and the PK autoindex exists. | no |
| **R16a** | Reason: the loader builds the aside from its own constant and **nothing currently checks that the constant produced what it claims**. | no |
| **R16b** | They run PRE-SWAP and are **part of the gate**, not a post-swap observation. | no |
| **R16c** | Named for what they check — `aside_schema_pk`, `aside_schema_notnull` — so the `load_check` rows read honestly. | no |
| **R17** | "Trend" is computed over `row_count` in STAMP rows, ±10% against the mean of prior **COMPLETED** loads. | no |
| **R17a** | The band is PROVISIONAL and must say so. Revisited **together with** R8-4's null-rate band; neither tuned alone. | no |
| **R17b** | On loads one through three the check is **skipped and the stamp records that it was skipped**, not that it passed. | no |
| **R17c** | The 10% band catches a halved file and **misses a ~4% systematic drop (~78,000 orgs)**, which is the likelier failure. **Open, not solved.** | no |
| **R18** | §5's exact null counts become the **provenance** of R8-4's band centre (29.08% / 29.35%), not a recurring test. | no |
| **R19b** | The cache **is not a backup**. If cache and stamp's `file_set` disagree, **the STAMP is the record and the cache is the suspect**. | no |
| **R20 / R20a / R20b** | A pre-flight credential check runs **before the multi-minute remote call**; reports and stops; **never auto-relogins**; does not cover mid-call expiry, which stays UNADDRESSED. | no |
| **R21c** | R7, R8c and R8e come out of **every slice's** definition of done and become **post-load operational verification** — first checkable at loads three, four and roughly four. | deliberately **none** |
| **R24** | The emitted INSERTs target `bmf_aside`, never `bmf`. Binds slice 1 (satisfied) **and** the load target. | no |
| **R27** | An in-memory `node:sqlite` check does not violate R21 — **and must not be extended to a LOCAL D1 store**, which is persistent, bound to the tools, and the subject of §10's double-store filing. | no |
| **R29** | Nullable columns branch **before** escaping and emit the bare keyword `NULL`, never `''` and never `'null'`. Binds emission (satisfied) and every future load. | no |
| **"Open, from the R16–R21 rulings"** | Two open: the two unmeasured bands revisited together; R17c's gap stands. | no |
| **"Still unruled — FOUR"** | Pre-load export acceptability; §9's Time Travel scope; sandbox-before-production as a rule; whether the sandbox reopens §13's option (b). | no |

The table lists 36 rows because R20/R20a/R20b are grouped and the two
non-ruling headings are included; the ruling count is 32 plus two open-item
headings.

### Constrains slice 1 only, or is provenance — 9

**R21** (the slice-1 boundary; but its *test* is general — see §5), **R21a**
(slice 1's definition of done, the fifteen items), **R21b** (slice 1's row-level
check), **R22** (slice 1 proves against a fresh download), **R23** (new figures
sit beside §5's), **R26** (byte counts frozen on first download; header mismatch
= REFUSAL, size mismatch = UPDATE), **R28** (§2's `--local`/`--remote` skeleton
does not bind slice 1), **R30/R30a** (the heading count), **R25** — which is the
odd one: it rules the sidecar and stdout summary for slice 1's parse, but says
the sidecar "is what **slice 3's** verifier reads."

### Rulings that name a slice by number

`grep -n -i 'slice 2' docs/bmf-load-scoping.md` → **exactly two hits, `:2165` and
`:2170`, both inside R21, both incidental.** `grep -n -i 'slice 3'` → **exactly
one hit, `:2328`, inside R25.**

So: **R21, R21a, R21b, R22 and R28 name slice 1. R25 names slice 3. Nothing names
slice 2.** R21c names none deliberately. R13a and R31 name an unnamed slice
defined only by what it authors.

---

## 4. Everything between the emitted artifact and data being live

Code column derived by grep across the tree excluding `.git`, `node_modules` and
`.bmf-cache`, with a negative control (`zzz_no_such_token_zzz` → exit 1) and a
positive control (`bmf_gen_` → 3 files, all documentation or migration).

| # | Step | Governing rulings | Code today |
|---|---|---|---|
| **A** | **Create the aside table** `bmf_aside` on the target database, with the ruled PK and index set | R24, R13, R16a, R10a/R10b/R10c, D5, R31 | **NONE for a real database.** `scripts/d1-window-generate.mjs:85` emits `CREATE TABLE bmf_aside (…)` with **no PK and no indexes** — banked experiment residue, and its tail still uses the **retired DROP**. `scripts/bmf-verify-slice1.mjs:106` is an in-memory scratch, explicitly not the aside. |
| **B** | **Pre-flight credential check** before the multi-minute remote call | R20, R20a, R20b | **none** |
| **C** | **Load the emitted file into the aside** | §3 "Load aside"; §7 (remote = md5 + R2 upload + server-side import + poll); §8 (100,000 B statement, 5 GB file); §2's script contract; modes 5, 9, 10, 12, 13 | **none.** Precedent shape only: `provision-institution.mjs:151` and `seed-invites.mjs:145` spawnSync `wrangler d1 execute … --file=`. Both hardcode `DB_NAME = 'stewardhouse-pilot'`. |
| **D** | **Mint the generation timestamp**, known at aside-creation time | R14 | **none** |
| **E** | **Open the stamp row** — seven fields, `load_started_at` set | §1 stamp table, R9, R12, R12b–R12g | **NONE writes it.** `migrations/0022_bmf_table.sql:117` creates `load_stamp`; `grep -rl 'load_stamp\|load_check'` returns only docs, the migration, and one **comment** at `bmf-fetch.mjs:357`. |
| **F** | **The five PRE-SWAP checks** — row count in band; `aside_schema_pk`; `aside_schema_notnull` (five columns); null rate in band on the two nullable columns; trend ±10% | R8, R8a, R8d, R16, R16a–c, R17, R17a–c, R18 | **none** |
| **G** | **Write `load_check` rows**, BEFORE completion | R12b, R12c, R16c | **none** (table exists at `0022:151`) |
| **H** | **The swap** — rename live → `bmf_gen_…`, rename aside → `bmf`, **in ONE `d1 execute --file` invocation** | R6, R11f, R14, §1's BINDING CONSTRAINT, mode 19 | **none for the ruled shape.** `d1-window-generate.mjs:122` emits `DROP TABLE bmf; ALTER TABLE bmf_aside RENAME TO bmf;` — the shape R6 replaced. |
| **I** | **Post-swap assertion** — live row count, dated table present, three index names in `index_list` | R8b, R13b, mode 21 | **none** |
| **J** | **Write completion LAST, on success only** | §1, R12c, R12d | **none** |
| **K** | **Prune** the oldest generation beyond three, only after a verified-good swap | R8c, R7 | **none** |
| **L** | **The undo / rollback file** — safe to rerun, checks target names first, mints its own generation table and stamps it | R6a, R14a, mode 22; gated by A1 and §13 | **none** |
| **M** | **Read-only verification after the load** — structural, distributional (as *rates*, R18), row-level sampling | §5, R18, R22a | **none against D1.** `bmf-verify-slice1.mjs` runs the in-memory analogue. |
| **N** | **Retention observed across three generations** | R7 | **none** — R21c: post-load operational verification |
| **O** | **Trend baseline** | R8e | **none** — R21c: post-load, ~load four |
| **P** | **Preconditions on the PRODUCTION run** (not on a slice): A1's rollback path closed; the auth-observability gap closed; failure induction confined to the sandbox | §13's two accepted preconditions; A1; R4 | n/a — FT-run |
| **Q** | **Alerting on a wrong load** | R8f (deliberately none); A113's Q7 records it as **UNRULED** | **none, by ruling** |

---

## 5. Which steps satisfy R21's test on their own

**R21's test, verbatim** (`docs/bmf-load-scoping.md:2163-2166`):

> **The test that makes it right rather than merely convenient: slice 1 can be
> PROVEN on its own against §5's measured distributional figures, and slice 2
> cannot be proven without slice 1.**

**R21c's generalisation of it, verbatim** (`:2278-2280`):

> **R21 admits a boundary when a set can be PROVEN on its own, and a proof that
> is not an event cannot satisfy that test at any boundary.**

### Provable on their own

**A, B, C, D, E, G, J, and four of F's five.** Each produces an observation at its
own step.

- **A** is self-proving by the R16 assertions themselves: `table_info` and
  `index_list` on the created aside, compared to the constant. R16b already rules
  those run pre-swap.
- **C** has an explicit proof row in §3: "Aside row count equals the parsed
  count." Stronger: **all three of §5's tiers can run against the ASIDE before
  anything is swapped** — structural, distributional-as-rates, and row-level
  sampling against a source re-read. That is the same class of proof slice 1
  already ran, against a real table instead of a scratch one.
- **F**'s checks 1–4 are single-load observations. Check 5, trend, is not.
- **B** is provable at second zero, which R20b names as its whole value.

### Not provable without a step that follows

- **H, the swap.** Its correctness is observable only through **I**, the post-swap
  assertion — R8b says so in its own words: "**Nothing currently validates the
  swap operation itself**, only the data going into it." H and I cannot be
  separated by a boundary.
- **F check 5 (trend), N (R7 retention), O (R8e baseline), K (R8c pruning).** All
  four need a *sequence*. **R21c has already ruled exactly this** and assigned
  R7, R8c and R8e out of every slice's definition of done, on precisely this
  test.
- **L, the undo.** Its rerun-safety (R6a) *is* provable as an event — run the file
  twice. But whether it **recovers** is only provable by inducing a failure, which
  R4 confines to the sandbox, A1 records as untested, and A116 leaves unruled as
  to whether a sandbox result transfers. `docs/outstanding.md` A1 also records the
  void-versus-clean hazard: an import that never began and one that rolled back
  perfectly leave the same observable state.
- **M** is provable, but it is the *proof of* C and H rather than a step with a
  proof of its own.

**The result carried into §6:** after R21c, the only things between the artifact
and live data that cannot be proven at their own step are (a) the three R21c
already removed, (b) the swap-without-its-assertion, and (c) the rollback
recovery. Everything else clears R21's test individually.

---

## 6. Four candidate boundaries

**No preference is expressed and nothing is recommended.**

### Candidate 1 — Create the aside and load it. Stop before the swap.

**Inside:** A (the R13 constant + the aside DDL), B, C, D, E, F checks 1–4 with 5
recorded as skipped per R17b, G, the stamp's outcome fields, M against the aside.

**Outside:** H, I, K, L, N, O, and every production step.

**Satisfies R21's test if:** the aside's correctness is establishable without the
swap. It is — §5's three tiers and R16's two assertions all run against the aside,
pre-swap, by ruling (R16b). The proof is a single event.

**Would have to be true first:** A125's authorship question is answered, one of
R31's three candidate shapes is taken, and R13a's structural comparison against
`migrations/0022_bmf_table.sql` fires.

**What it leaves standing:** live is never touched, so mode 11, mode 19 and mode
20's empty-generation half do not arise inside it. The artifact is one step less
inert and still goes nowhere.

### Candidate 2 — Everything through the swap and its post-swap assertion.

**Inside:** A through J, with H and I as one indivisible unit.

**Outside:** K, L, N, O.

**Satisfies R21's test if:** H+I is treated as a single step, which R8b already
forces. Everything else in the set clears individually.

**Would have to be true first:** Candidate 1's preconditions, **plus** a target
database that is not live — R4 makes that the sandbox — and the §6.15 split
resolved for it.

**What it leaves standing:** it ships the swap without R6's undo, which is the
recovery for a bad swap. Mode 11 and mode 20's empty generation 1 are both live
inside it, and R11f already flags the second as unresolved.

### Candidate 3 — The whole loader: create, load, check, swap, assert, prune, and the undo file.

**Inside:** A through L. Writing the pruning code is inside; *observing* R8c is
outside by R21c.

**Outside:** only R21c's three.

**Satisfies R21's test if:** L's proof is accepted as an event on the sandbox.
Every other element clears individually, and A113 already describes this shape in
its own words — "**RECOVERY IS NOT A SEPARATE ENTRY. IT IS THIS SLICE**" — with
the reasoning that separating them "invites shipping the loader without them."

**Would have to be true first:** Candidate 2's preconditions, plus a ruling on
whether a sandbox rollback exercise counts as proof (A116), and A1's disposition
on what counts as evidence that a rollback recovered.

### Candidate 4 — Author the loader constant only. No database contact.

**Inside:** the R13 single named constant, a choice among R31's three candidate
shapes, R13a's regeneration and the structural byte-identity comparison against
`migrations/0022_bmf_table.sql` under R31's coverage.

**Outside:** everything else.

**Satisfies R21's test if:** a file-to-file structural comparison counts as a
proof that is an event. It is one, and it needs no later step.

**Would have to be true first:** nothing that does not already exist. It closes
A125's two still-open items directly.

**The tension to name rather than resolve:** A125 is ruled **not rulable ahead of
slice 2's boundary**, and this candidate makes constant-authorship *be* that
boundary. Whether taking the dependency counts as answering it, or is the
circularity A125's ruling was avoiding, is FT's.

---

## 7. Open questions a ruling would have to answer

Seventeen. Not answered here.

1. **R13's constant under R31's three candidates.** Does the constant grow to
   carry all three tables and five indexes; does the regeneration reference narrow
   to `bmf` alone; or do the two roles — BUILD the aside every run, REPRODUCE the
   whole migration once — split into two constants? R31 records all three and
   expresses no preference.
2. **Where the rollback path lives (A1).** Is the undo file authored by the slice
   that ships the swap, or its own? A113 says recovery "IS THIS SLICE"; R6a and
   R14a name no slice; §13 makes the *exercise* an FT-run precondition on the
   production load rather than on any build.
3. **Which database slice 2 targets, and how it is addressed.** R28 exempts slice
   1 from `--local`/`--remote` and `DB_NAME`; nothing extends or withholds that
   for slice 2. `bmf-sandbox` requires `--config bmf-sandbox.toml`; both script
   precedents hardcode `DB_NAME = 'stewardhouse-pilot'` with no `--config`.
4. **How §6.15's split applies to the sandbox.** §2's table reads `[agent-ok]` for
   "Load, swap, stamp, verify against `--local`" and `[FT-only]` for "Anything
   `--remote`". The sandbox is remote. Taken literally, an agent-built loader
   cannot be run by its builder anywhere R4 permits running it.
5. **Whether slice 2 consumes the on-disk artifact or re-parses.** The artifact is
   untracked, 173.9 MB, and not byte-reproducible from a later extract (R22b:
   ~0.2%/month drift). Nothing rules which input slice 2 takes.
6. **Whether the loader shells out to `wrangler d1 execute --file` or calls the
   import API.** §7 establishes the remote path is md5 + R2 upload + poll; §2's
   precedent is spawnSync. Nothing chooses.
7. **What clears a leftover aside.** R8 leaves a failed aside "named and stamped
   failed"; §4 mode 5 says the prescribed rerun then fails at `CREATE TABLE`.
   Nothing rules the disposition.
8. **R8's check 1 band has no value anywhere.** R8 bullet 1 is "row count within a
   band" and no centre or width is stated in the tree. R17's ±10% is the *trend*
   band and R8-4 is the *null-rate* band; neither is this one.
9. **What "stamped failed" means against R12d.** R12d rules **no status enum** —
   "the timestamps ARE the status". The seven stamp fields carry no failure field.
   Whether "failed" is `load_finished_at` set with `completed_at` null plus a
   `load_check` row at `passed=0` is inferable and not ruled.
10. **Ordering of the stamp row against aside creation.** R14 requires the
    generation timestamp to be known when the aside is created and to match
    `load_stamp.load_started_at`, which orders the *values* and not the *writes*.
11. **Mode 19 — one invocation.** §1's binding constraint is "invisible in the SQL
    itself" and §4 marks it undetectable by the loader. Nothing rules what
    enforces it.
12. **Mode 20 — empty generation 1.** R11f flags that a recovery to generation 1
    restores nothing, and resolves it nowhere.
13. **A113's Q7 — how a wrong load gets detected.** Recorded as UNRULED, with
    self-verification named as "one candidate among others" that this pass "must
    WEIGH rather than inherit as decided."
14. **A125 — who authors the real aside DDL**, and R13a's regeneration obligation,
    which A125 rules are one question with two consequences.
15. **A132 — whether an applied migration is ever corrected.** `0022`'s `:3`,
    `:6-7` and `:25-27` become false on regeneration; the file is applied to both
    databases and wrangler matches by NAME.
16. **A116 — whether a sandbox result transfers.** Three agreements recorded as
    evidence; the entry stays open because every one is a case where the two
    agreed.
17. **Is there a slice 3, and what is it?** R25 names "slice 3's verifier" as the
    sidecar's reader, and slice 1 shipped a verifier that reads it.

---

## 8. What the tree does not say that a scope pass needs it to say

- **Nothing in the tree bounds slice 2.** Measured, not asserted: "slice 2"
  appears **twice** in `docs/bmf-load-scoping.md`, both inside R21, both
  incidental. A125 states this as its third ground and it verifies.
- **No band exists for R8's first check.** The row-count band is named and never
  given a value.
- **No slice owns the aside DDL constant**, and **no slice owns the undo file.**
  R13, R16a, R6a and R14a all describe artifacts and assign none.
- **No ruling says which database a build slice targets**, nor whether R28's three
  exemptions lapse for a slice that executes.
- **`load_stamp` has no way to express failure**, while R8 uses the phrase
  "stamped failed" and R12d forbids a status column.
- **The 2026-09-04 sandbox rulings R1–R5 are stated in full nowhere.** They exist
  only as parenthetical citations in `docs/outstanding.md` (`:293`, `:594`,
  `:602`, `:1324`, `:1329`, `:1561-1563`) and CLAUDE.md §6.10. In
  `docs/bmf-load-scoping.md`, **"R2" means Cloudflare R2 object storage** at
  `:277`, `:748`, `:905`, `:911`, `:1246` — a live token collision in the arc's
  own documents.
- **R25's "slice 3's verifier"** is the only forward slice reference in the doc
  and it skips slice 2 entirely.
- **Citation drift, minor and checkable:** `bmf-parse.mjs:17` and §2 both cite
  `.gitignore:18` for `scripts/*.tmp.sql`; `cat -n .gitignore` puts it at
  **`:19`**. `.bmf-cache/` is `:26` and `scripts/*.tmp.json` is `:27`. A113's "ONE
  CODE CHANGE IS OWED BY THE BUILD" for `.bmf-cache/` is discharged and the entry
  does not say so.

---

## Claims the pass could not verify by execution or grep

1. **Every fact about remote D1.** That `stewardhouse-pilot` and `bmf-sandbox`
   both stand at 22 migrations; that `bmf`, `load_stamp` and `load_check` are
   empty on either; that `$.ops.demo_gate = 1` on one row. All are FT-run-only per
   §6.10 and §6.15. The pass ran no remote command.
2. **§5's four absolute figures** (569,235 / 574,447 / 1,957,340 / the per-file
   split). R22 records the 2026-08 extract as unobtainable. Slice 1's fresh figures
   differ and sit beside them per R23; the pass compared the two and verified
   neither against a source.
3. **§12's window measurements** (14,359–17,647 ms, MODE FAIL, 239 error samples).
   Read from the document. The probe database and Worker were deleted 2026-08-19.
4. **That the emitted artifact loads into a real `bmf_aside`.** Slice 1 proved it
   loads into a scratch table with no PK, no NOT NULL and no indexes. Nothing in
   the tree has loaded it into the ruled shape, and R10b means a duplicate `ein`
   that the scratch table accepted silently would fail at INSERT against the real
   one.
5. **Every `wrangler` bundle line citation** (`cli.js:231161`, `:231286`,
   `:231302-231336`, `:302057`, and the `executeRemotely` / `splitSqlQuery` /
   `trimmer.ts` findings). The pass confirmed the installed version resolves to
   **4.111.0** and did not open the bundle.
6. **That `git fetch` reached the network.** `.git/FETCH_HEAD` was rewritten at
   2026-09-09T21:52:41Z, which is the pass's own session; no remote round-trip was
   independently confirmed beyond that.
7. **`.gitignore` coverage of the two artifacts** was taken from
   `verify-commit-tail.mjs`'s own `git check-ignore` checks plus `cat -n`, not
   from an independent `check-ignore` run.
