# BMF load scoping

The build plan for loading the IRS Exempt Organizations Business Master File
into D1. Scoped 2026-08-18 against the tree at `2f39b8a`, updated
2026-08-19 against `7ffe98e`. Nothing is built.

`propublica-spike-findings.md` describes the SOURCES. `discover-surface-spec.md`
describes the SURFACE. This describes the BUILD between them, and it carries
open items that will change as they resolve, which is why it is its own doc.

The rulings this plan implements are recorded elsewhere and are not re-argued
here: manual FT-run script for v1 with no scheduled process, replace-all built
aside and swapped, header-name parsing, the four-part load stamp, full national
load, seven columns, roughly 30KB chunks sized by bytes, the four-or-five file
set, and EIN as the primary key.

## 1. The migration

**Next number is `0019`.** The tree runs `0001` through `0018`, contiguous.

### A new table, not the existing `org` table

`org` already exists at `migrations/0001_initial.sql:94-105`: `id TEXT PK`,
`name`, `ein`, `mission`, `causes` (JSON array), `geo`, `cat`,
`is_excluded_by_institution_ids` (JSON array), `source_surface`, `extensions`.

**They are different concerns and the BMF load does not go there.** Three
reasons, recorded so this is not revisited as an optimization:

1. **17 curated records against a 1.96M-row federal extract.** The `org` shape
   carries authored narrative (`mission`), StewardHouse-assigned `causes` and
   `cat`, and institution-exclusion state. The BMF carries none of that and
   never will.
2. **Nothing reads the D1 `org` table today.** Every `'org'` match in the tree
   is a type-label string in the fixture and unified layers, not a D1 query. The
   spike recorded this and it still holds.
3. **Forcing them together overloads `source_surface`.** That column distinguishes
   which SURFACE a record came from. A federal extract is not a surface, and
   making it one would break the meaning the column carries everywhere else.

Note separately that ruling 8 still wants the `org` seed's defanged fields
cleaned. That is unrelated work and this plan does not touch it.

### Table shape

The seven ruled columns: `NAME`, `EIN`, `CITY`, `STATE`, `REVENUE_AMT`,
`RULING`, `NTEE_CD`.

**Nullability follows the measured national file**, not assumption:

| Column | Measured | Nullable |
|---|---|---|
| `NAME`, `CITY`, `STATE` | non-null on all 1,957,340 | no |
| `RULING` | **null on 0 rows**, complete coverage | no |
| `REVENUE_AMT` | **null on 569,235, 29.08%** | yes |
| `NTEE_CD` | **null on 574,447, 29.35%** | yes |

**Absent must stay distinguishable from zero.** The selectable no-figure group
in the surface spec depends on it, and folding absent into zero would assert a
filing that does not exist.

**`EIN` is the primary key and its uniqueness is RE-ASSERTED PER LOAD, never
assumed.** It was measured unique across the correct file set (1,957,340 rows,
1,957,340 distinct, zero duplicates, zero malformed), but that is one snapshot of
a file the IRS regenerates. A load that assumes it would fail confusingly on the
first month it stops being true.

### The swap, and the finding that it IS atomic in one invocation

**`0016_athlete_enrollment_status_check.sql` is the in-repo precedent** and does
exactly this shape at `:39`, `:77`, `:90`, `:92`:

```
CREATE TABLE athlete_new (...)
INSERT INTO athlete_new (...) SELECT ...
DROP TABLE athlete;
ALTER TABLE athlete_new RENAME TO athlete;
```

**What SQLite gives:** `ALTER TABLE ... RENAME TO` is a metadata operation, so
the swap does not copy the data.

**THE EARLIER FINDING IN THIS SECTION WAS WRONG AND IS RETIRED.** It held that
the DROP and the RENAME could not be wrapped, reasoning that `env.DB.batch()` is
the Worker API and unavailable to a CLI script. That reasoning does not survive
reading what the CLI actually does.

**Sourced to the shipped `wrangler` 4.111.0 in `node_modules`.** In
`executeLocally`, `wrangler d1 execute --file` reads the file, calls
`splitSqlQuery` on it, and then calls
`db.batch(queries.map((query) => db.prepare(query)))` against a miniflare D1
database. `db.batch()` is exactly the implicit transaction the earlier text
assumed was out of reach. The same shape appears in `d1 migrations apply`, which
runs each migration through `database.batch(splitSqlQuery(query).map(...))`.

**And the CLI refuses to let you wrap it yourself.** `src/d1/trimmer.ts` strips a
single leading `BEGIN TRANSACTION;` and `COMMIT;`, then, if any `BEGIN
TRANSACTION` remains, throws: "Wrangler could not process the provided SQL file,
as it contains several transactions. D1 runs your SQL in a transaction for you.
Please export an SQL file from your SQLite database and try again." So the tool
both supplies the transaction and declines to accept one from you. The migrations
tree carries **no `BEGIN` or `COMMIT` anywhere**, and this is why it needs none.

**So non-atomicity was never a property of DROP-then-RENAME.** It was a property
of issuing two statements as two invocations. One invocation is one batch is one
transaction.

**BINDING CONSTRAINT: the DROP and the RENAME ship in ONE `d1 execute --file`
invocation, never separately.** This is the whole of what makes the swap safe, it
is invisible in the SQL itself, and a later reader who splits the file for any
reason reintroduces the window this doc spent a session describing.

**Two fixed tables plus a pointer is REJECTED.** It was the other half of the
fork. Once one invocation is atomic it buys nothing, and it costs a permanent
second copy plus a branch on every read of a public endpoint.

**0016's `PRAGMA foreign_keys=OFF` guard (`:37`, `:97`) does NOT transfer.** It
exists there because `athlete` has four inbound child FKs. **The BMF table has
none**, so the §10 rebuild hazard does not apply here.

### Indexes

Following the `idx_{table}_{column}` convention used throughout the tree:

- **Geography** filters state, then city. State alone partitions 1.96M into
  human-sized sets; a composite serves both levels.
- **Recognition era** is a range predicate on `RULING`.
- **Alphabetical results** order on `NAME`. This is an ordering rather than a
  filter, and at 1.96M rows an unindexed sort is the likeliest source of slowness.
- **Total expenses band** is a range predicate, but its source is the XML rather
  than the BMF, so that index belongs to whichever table carries expenses.

**The right composite shape is not knowable yet.** It depends on which facet
combinations are common, and nobody has that data because the surface does not
exist. Over-indexing 1.96M rows costs storage and load time on every replace-all.

### Index build timing, measured

**The `CREATE INDEX` open item is CLOSED, and its failure branch did not fire.**
Every index was built AFTER the data was loaded, against all 1,957,340 rows, and
each was run at least twice so that no figure rests on a single cold-cache
reading.

| Index | Run 1 | Run 2 | Run 3 |
|---|---:|---:|---:|
| `UNIQUE (ein)` | **729.0 ms** | 673.1 ms | |
| `(state, city)` | **1379.2 ms** | 1351.1 ms | |
| `(ruling)` | **702.7 ms** | 680.6 ms | |
| `(name)` | **1596.4 ms** | 1510.8 ms | 1524.9 ms |

Run 1 is cold and the later runs are warm; the spread is 4 to 8 percent.

**The worst case is `NAME` at 1596.4 ms, which is 5.3% of the 30-second query
duration in section 8, or 18.8x headroom.** Nothing approaches the limit.

**Supporting wall-clock, for scale rather than as a limit test.** Loading all
1,957,340 rows took **9,742 ms**, and load plus all four indexes end to end took
**14.15 s**, itself under 30 seconds, though that total is not what the limit
governs.

**THIS IS A LOCAL FLOOR, NOT A D1 MEASUREMENT.** Six things it does not
establish, recorded so the number is never read as more than it is:

1. **Different execution path.** This ran through `node:sqlite` on a dev machine
   directly against the store file, not through D1's query path.
2. **Whether D1 meters `CREATE INDEX` against query duration at all is
   UNVERIFIED**, as is the instant from which it would start counting.
3. **Different storage substrate.** Local is a dev SSD with its own page cache;
   D1 is backed by durable object storage.
4. **The remote path builds these indexes server-side inside the R2 import**
   described in section 7, not as a statement a client issues and times.
5. **Single-threaded contention.** Section 8 records D1 as single-threaded. This
   run had the file to itself; a production import contends with live traffic.
6. **Cold start.** Even run 1 was warm from the load that had just written the
   file. A remote import starts genuinely cold.

**So the honest reading is that 1.6 seconds sits far enough under 30 that a
roughly nineteen-fold environmental penalty would be needed to breach it. That
makes the risk low. Low risk is not zero risk, and this number does not make it
zero.**

### Peak storage, measured

**The peak-storage open item is CLOSED.**

| Quantity | Measured | Projected | Kind |
|---|---:|---:|---|
| Per-row payload, over all 1,957,340 rows | **64.240 bytes** | | measured |
| Table | **132.84 MiB** | ~141 MiB | measured |
| `UNIQUE (ein)` | **33.70 MiB** | ~36 MiB | measured |
| `(state, city)` | **38.84 MiB** | ~41 MiB | measured |
| `(ruling)` | **22.45 MiB** | ~24 MiB | measured |
| `(name)` | **74.34 MiB** | ~79 MiB | measured |
| One copy | **302.57 MiB** | ~321 MiB | measured |
| Peak, aside plus live | ~**605 MiB** | ~642 MiB | 2x the measured copy |

**These are now measurements, taken by `PRAGMA page_count` at `page_size` 4096 on
a table built from the five ruled files.** The projections are kept beside them
because the comparison is the useful part: **every figure came in 5.7 to 6.9
percent under projection**, which is a systematic bias rather than noise in any
one line. The projections erred consistently, and on the safe side.

**The 141 MiB gap this section previously recorded as unreconciled is CLOSED by
measurement.** The table measures **132.84 MiB** against the projected 141, so
the projection ran 8.2 MiB high. Measured storage is **71.17 bytes per row**
against the 64.240-byte measured payload, which puts real SQLite row overhead at
**6.93 bytes per row**, not the roughly 7.5 the gap had inferred. **The gap is
closed by measurement rather than still standing open**, which is exactly what
the earlier paragraph said would be required to close it.

**The ceiling is 10 GB per database on Workers Paid**, so peak sits roughly
seventeen times inside it. **Storage does not constrain either swap option**,
which is the gate the swap design fork was waiting on.

### The stamp table

The four ruled parts, **one row per source**, because BMF, the revocation list
and Pub 78 refresh on independent cadences and a single stamp would assert one
freshness for three things.

**Completion is written LAST, on success only.** That field is the only thing
separating "loaded 1,957,340 rows" from "loaded a prefix and stopped", and
without it every other field in the row lies convincingly.

## 2. The script

**Lives in `scripts/`, matching the two precedents closely.**
`seed-invites.mjs` and `provision-institution.mjs` share one skeleton: a usage
docblock naming `--local` (default) and `--remote` (FT-run only); constants for
input path, `TMP_SQL_PATH` and `DB_NAME = 'stewardhouse-pilot'`; `fail(msg)`
exiting 1; `escapeSql(str)`; a `--remote` branch that prints a WARNING; SQL
generated to a gitignored temp file; then `spawnSync` on
`wrangler d1 execute <db> <target> --file=... ` (`seed-invites.mjs:145`,
`provision-institution.mjs:151`).

**`.gitignore:18` already covers `scripts/*.tmp.sql`**, so chunk files inherit
the existing hygiene.

**One structural difference from both precedents, and it is the whole
difficulty.** They generate ONE SMALL temp file. This generates roughly **152 MB
across about 5,600 statements**. Neither precedent has a resumable write, a
progress signal, or a partial-failure state, because neither ever needed one.

**The §6.15 split:**

| Step | Who |
|---|---|
| Download, header assert, parse, chunk | `[agent-ok]` |
| Load, swap, stamp, verify against **`--local`** | `[agent-ok]` |
| Anything `--remote` | **`[FT-only]`** |

## 3. The local sequence, and what proves each step

| Step | Proof |
|---|---|
| **File-set check** | Four or five files, never all six |
| **Download** | Byte counts against recorded sizes; `eo1` is 48,629,769 B and has matched three times |
| **Header assert** | Every header equals the 28-column string exactly. Measured: 5 of 5 matched, 0 malformed rows |
| **Parse** | Row count reaches 1,957,340 and distinct EINs equals it |
| **Chunk** | No statement exceeds the byte budget. The hard ceiling is **100,000 bytes**, bisected, failing as `SQLITE_TOOBIG` |
| **Load aside** | Aside row count equals the parsed count |
| **Stamp** | Stamp row present with completion set |
| **Swap** | Live row count equals the aside's former count; the aside name is gone |
| **Verify** | Section 5 |

**The file-set check comes FIRST.** Taking all six double-loads 4,906
organizations, and the symptom is a duplicate-key failure far downstream from
the cause.

**Identifying the bound local store comes BEFORE any of it.** Two `.sqlite` files
sit under `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`, and applying work
to the wrong one is a silent no-op. The wrangler startup banner gives the MODE:
`env.DB (stewardhouse-pilot)` is config-resolved, while `env.DB (local-DB=...)`
means a `--d1` flag is in play and a different store is bound.

**The lazy-open probe does NOT work, recorded so the next session does not retry
it.** Miniflare opens D1 lazily, so watching a running `pages dev` for a `-shm`
or `-wal` sidecar proves nothing: neither `GET /api/me` nor `GET /api/roster`
with a bogus session cookie caused either store to open a sidecar. **The probe
that works is the mtime delta across a config-resolved `d1 execute --local`
write.** Measured 2026-08-19: one such write moved `e7ff1add...` and left
`7202f096...` untouched, which is what identified the bound store for the timing
run above.

## 4. Failure modes and what each leaves standing

**Bad header.** Refuse before writing anything. Nothing to recover; rerun after
inspecting the change. The cheapest failure, and the one header-name parsing
exists to produce rather than avoid.

**Partial download.** Detectable by byte count against `Content-Length`. Nothing
written; rerun.

**A chunk fails mid-load.** **The earlier text here said the aside table holds a
prefix, and that is wrong for a single-file load.** The correction matters
because the prefix case is the only thing a resumable write would exist to
handle. One `d1 execute --file` is one `db.batch()`, and one remote import is one
operation: either rolls back entirely, leaving the aside table absent rather than
partial. **The prefix case arises only if chunks are issued as separate
invocations.**

**This plan issues ONE invocation.** That is the same constraint the swap rests
on in section 1, holding here for a different reason. Recovery is therefore to
rerun from the start, and **this project has no resumable write and this slice
should not invent one**: a full rerun is about 6 minutes locally, cheaper than
the correctness argument a resume would require.

**A swap fails.** With the DROP and the RENAME in one invocation the batch either
applies or does not, so the asymmetric window the earlier text described here is
gone. What remains is failure of the whole batch, which leaves the live table
standing and the aside table present. **The script should still verify and report
post-swap state rather than trusting the wrangler return code**, because the
constraint that makes this safe is a property of how the file is issued and
nothing in the SQL enforces it.

**One failure mode outside the script's control, already measured.** The
`2026_TEOS_XML_05A.zip` archive exits 3 having extracted all 84,172 members
correctly. **A load treating a non-zero exit as failure would discard a complete
batch.** That is the XML route rather than BMF, but it is the same class of trap
and the same script family will meet it.

**Credential staleness mid-load is UNADDRESSED.** A `wrangler` OAuth token went
stale and failed a `--remote` read in an earlier session, and went stale TWICE
MORE on 2026-08-19, failing a `--remote` write both times. Each was recovered by
`npx wrangler login`. All three were instant and harmless because each hit the
start of a short command. **The same staleness arriving partway through a
multi-minute import would not be**, and nothing in this section covers it. The
remote path in section 7 runs long enough for it to matter. Recorded, not solved.

## 5. Read-only verification after the load

Three tiers. The second is the strong one.

**Structural.** Row count = 1,957,340. Distinct `EIN` = 1,957,340. Zero NULL in
`NAME`, `CITY`, `STATE`, `RULING`. `PRAGMA integrity_check`. `PRAGMA
foreign_key_check`.

**Distributional, against figures measured independently on the source.** This
is close to a checksum because the numbers are specific:

- NULL `REVENUE_AMT` must equal **569,235**
- NULL `NTEE_CD` must equal **574,447**
- NULL `RULING` must equal **0**
- Per-file contribution: eo1 **278,014**, eo2 **719,134**, eo3 **955,286**,
  eo_xx **2,391**, eo_pr **2,515**

**Any parsing error that shifts a column produces a different null count**, so
these catch positional drift that a row count cannot.

**Row-level sampling.** Draw N EINs at random, re-read the source CSVs, compare
all seven fields byte for byte. This is the only tier that catches a value
corrupted WITHIN the correct column, and it is worth aiming at names carrying
commas, since only 6 of 278,014 in eo1 do and a quoting bug would otherwise hide.

**One further check to compute at parse time:** the sum of `REVENUE_AMT` over
non-null rows, compared after load. That figure has not been measured, so it
must be produced during the parse rather than asserted from this plan.

## 6. What local cannot establish about remote

- **Transfer of roughly 152 MB of SQL** to `--remote`, and whether it must be
  split for the network rather than only for the statement limit.
- **Remote statement and batch limits.** The 100,000-byte ceiling was measured
  against miniflare. Section 8 now records the platform limits.
- **Remote wall-clock**, against about 6 minutes locally.
- **Whether DROP-then-RENAME is atomic against D1's replication**, as distinct
  from against one SQLite file. **NARROWED, not closed:** `read_replication.mode`
  reads `disabled` on this database, so there are no read replicas across which a
  swap could be observed inconsistently, which removes the replication half of the
  question. What local still cannot establish is the remote engine's behaviour
  under the import path in section 7. That value came from a `--remote` read and is
  FT-only to re-check.
- **Storage headroom. CLOSED** by the figures in section 1 against the 10 GB
  ceiling. `wrangler d1 info` reports current size and is a `--remote` read, so
  FT-only if a live figure is wanted.
- **Time Travel interaction. ANSWERED, and disqualifying.** See section 9. It is
  not a backstop for this load.
- **Whether the live surface tolerates the swap window** under real concurrent
  reads.

## 7. The remote `--file` path is not what this doc assumed

**Sourced to the shipped `wrangler` 4.111.0.** Section 2 describes the load as
`spawnSync` on `wrangler d1 execute --file`, matching the two script precedents.
That is accurate for `--local`. **`--remote` takes an entirely different path**,
and the plan should be read knowing it.

In `executeRemotely`, when `input.file` is set, wrangler:

1. computes an **md5 of the file** as an `etag`;
2. calls the D1 **import** API with `{ action: "init", etag }`;
3. **uploads the file to R2** when the response carries an `upload_url`;
4. **polls** to completion.

So the remote load is a file upload plus a server-side import, not a stream of
statements over the wire. **That reframes section 6's first bullet**, which asked
whether roughly 152 MB of SQL must be split for the network: the transfer is an
R2 upload, so the statement limit and the network are no longer the same
question.

**Two strings wrangler prints, both load-bearing:**

- **On starting:** "This process may take some time, during which your D1
  database will be unavailable to serve queries." It appears as a confirmation
  prompt when interactive and as a warning otherwise. **The whole database, not
  the BMF table.** Section 12 records what that means when measured: reads
  FAIL with an explicit error, they do not queue.
- **On failure:** "Note: if the execution fails to complete, your DB will return
  to its original state and you can safely retry."

**THE ROLLBACK GUARANTEE IS A CLI STRING, NOT VERIFIED SERVER BEHAVIOUR.** It is
printed by the client before the import runs, so it is a claim about what the
service does rather than an observation of it. **It is the most load-bearing
unverified fact in this plan**: section 4's correction rests on it, and so does
the decision not to build a resumable write.

## 8. Settled limits

| Limit | Figure | Provenance |
|---|---|---|
| Statement size | **100,000 bytes** | matches the bisected `SQLITE_TOOBIG` measurement in section 3 exactly |
| `d1 execute` file import | **5 GB** | platform limit |
| Query duration | **30 seconds** | platform limit |
| Execution | **single-threaded** | platform limit |

**The statement limit is the one measured here**, and the measured ceiling and
the published limit agree exactly. That is worth recording because it means the
chunker can be sized against a documented number rather than against an observed
cliff. The other three are taken as given and were not measured in this repo.

**The file this load produces is recorded twice and the two do not agree.**
Section 2 says roughly 152 MB; the figure carried alongside the 5 GB limit is
about 190 MB. Both are far inside the limit, so nothing turns on it here, and
neither is reconciled in this doc.

**The 30-second limit is now MEASURED against rather than reasoned about.**
Section 1 records the four index builds and the worst is 5.3% of it. The earlier
text here said the limit was not comfortable at this scale and pointed at an open
item; that item is closed and the measurement, with its six stated limits, is in
section 1.

## 9. Time Travel restore is DISQUALIFIED, not a backstop

It reads like the obvious recovery for a failed swap. It is worse than the manual
remedy it appears to replace.

**Time Travel restores the WHOLE DATABASE to a bookmark.** There is no
table-scoped restore. So recovering a failed BMF swap by restoring to a pre-load
bookmark would **discard every `person` and `invite` write committed since that
bookmark**.

**Operations writes are LIVE IN PRODUCTION.** `GET /api/roster` and
`POST /api/invites` both function end-to-end today, so the writes this would
discard are real ones rather than hypothetical. Renaming a table by hand is
recoverable. Silently dropping an operator's invites is not.

**Recorded as disqualified rather than deferred**, so that it is not proposed
again as the answer to a swap failure.

## 10. What the surface needs next

**Ordering: endpoint, then query shape, then the page.**

**The endpoint.** `functions/api/roster.js:41-70` is the precedent: `onRequestGet`
only, gate first, named-column select, server-side filtering and ordering, mapper
to a wire shape. Two differences, both new to this project. It is the **first
ungated D1 read**, since this is public federal data, so the question is not who
may see it but whether an unauthenticated caller can force a scan. And
`roster.js` returns its whole table under a docblocked "no pagination, revisit
~200", which at 1.96M rows is not adjustable but inapplicable.

**The query shape.** Facets applied in SQL and never in JS; a hard result cap the
caller cannot raise; and a floor on selectivity, since a query with no facets set
is a full scan.

**THE SELECTIVITY FLOOR IS LOAD-BEARING, and it arrived as an honesty decision.**
The spec has geography opening PREFILLED while the other facets open empty, so
**there is always at least one predicate**. That was ruled because a prefill
reflecting the funder's own stated choice is honest and a blank facet set is not
a claim. It now also guarantees the query planner a predicate on 1.96M rows.
**Recorded here so it is not "optimized" away later by someone who reads it as a
UI default rather than as two constraints meeting.**

**`DiscoverUnavailable.jsx` becomes the fallback, not a deletion.** It is
tree-invariant with no `isAuthenticated` branch and no `useFixtureIsolated()`
call, so it is already the right shape for "the directory is not loaded". The
natural progression is that the route renders results when the stamp shows a
completed load and the unavailable state otherwise, which makes **the stamp a
precondition of the surface** rather than a detail. Its docblock says the rebuild
should start from the spec rather than from what was there, and the name
`Discover.jsx` was deliberately left free.

**This load yields THREE of the four facets.** Geography, recognition era, and
name and city for the card. **The expenses facet reads the XML, not the BMF**, so
the fourth waits on a second and much larger ingest.

## 11. Live experiment artifacts, and the obligation to delete them: DISCHARGED

**BOTH ARTIFACTS WERE DELETED ON 2026-08-19. Nothing from this experiment exists
on the Cloudflare account, and nothing bills.** This section is kept as the
record of an obligation that was real and was met, not as live work. It also
carries a correction to one of the teardown commands it originally recorded,
which is the part worth reading if these steps are ever needed again.

| Artifact | Identifier | State |
|---|---|---|
| D1 database `bmf-window-probe` | `fb498c9d-0650-44c2-9a43-5090aa3c71b3`, region ENAM, created 2026-08-19 | **DELETED** 2026-08-19. Held 1,957,340 synthetic rows at the end of the last run |
| Probe Worker `bmf-window-probe-worker`, public and unauthenticated, bound to that database | source at `scripts/d1-window-worker/`, still committed | **DELETED** 2026-08-19. The deployment is gone; the source is not |

### What was run, and what it printed

**Both deletions were `[FT-only]` and were FT-run**, because every `--remote`
write is FT-run per CLAUDE.md §6.15. Neither was issued from an agent shell,
which is the condition CLAUDE.md §6.10 records as turning a confirmation prompt
into an auto-answered yes.

**The database.** `npx wrangler d1 delete bmf-window-probe` prompted before
acting, and **the prompt named both the name and the UUID**
`fb498c9d-0650-44c2-9a43-5090aa3c71b3`, so the confirmation was answered against
an identified resource rather than a bare yes. It reported
`Deleted 'bmf-window-probe' successfully.`

**The Worker.** `npx wrangler delete --config scripts/d1-window-worker/wrangler.jsonc`
prompted and **named `bmf-window-probe-worker` before confirmation**. It reported
`Successfully deleted bmf-window-probe-worker`.

**NEITHER DELETE CARRIED A SKIP FLAG.** No `-y`, no `--skip-confirmation`, no
`--force`. Both prompts were answered by a human, which is what the paragraph
below asked for.

### THE CORRECTION: the Worker delete command recorded here was WRONG

**This section originally recorded the Worker deletion as
`npx wrangler delete --name bmf-window-probe-worker`. THAT COMMAND FAILS from
the repo root**, and it fails for a reason worth keeping:

> It looks like you've run a Workers-specific command in a Pages project. For
> Pages, please run `wrangler pages project delete` instead.

**Wrangler read `wrangler.toml`, found the Pages project, and resolved the
command against `stewardhouse-app` rather than against the probe Worker.** The
`--name` flag names a Worker; it does not tell wrangler which project's config to
load, and config resolution happens first.

**The working form names the CONFIG, not the Worker:**

```sh
npx wrangler delete --config scripts/d1-window-worker/wrangler.jsonc
```

**This is the dangerous class of defect, and it is worth naming precisely: a
teardown command that resolves against the wrong project.** A delete that
silently picked up the repo's own config is a delete aimed at the production
project.

**What prevented that was WRANGLER'S OWN REFUSAL**, not a check written into
this doc, not the confirmation prompt, and not the reader. The tool declined a
Workers command inside a Pages project and said so in plain language. **Do not
read that as a general protection.** It fired because the two project TYPES
differ. A wrong-config delete between two resources of the SAME type has no such
guard, and would have reached the confirmation prompt with the wrong name
already filled in, at which point naming the resource in the prompt is the only
thing left standing between the reader and the wrong deletion.

**If these steps are ever needed again, the `--config` form is the one.**

### What verified the deletions, and what did not

**The database deletion is verified BY TWO THINGS.** The CLI reporting
`Deleted 'bmf-window-probe' successfully.`, AND `npx wrangler d1 list` now
returning only `stewardhouse-pilot` (`8600684c-…`). This is the
apply-versus-list distinction from CLAUDE.md §6.10, and it held: a command's own
output cannot be the proof that it worked, because it names the resource on the
successful and the abandoned path alike. **The list was run, and the name is
gone.**

**The Worker deletion rests on ONE thing, its own output.** This section
recorded `npx wrangler deployments list --name bmf-window-probe-worker` as the
absence check and flagged its behaviour against a deleted Worker as UNVERIFIED.
**It was never run, so it is still unverified**, and by this section's own
standard that leaves the Worker's removal on the weaker of the two forms of
evidence. Nothing suggests it did not work. The point is only that the second
check exists so that nothing has to be inferred, and here something was.

### The paragraphs that governed the teardown, kept as written

**DO NOT PASS THE SKIP FLAG.** `d1 delete` takes `-y` / `--skip-confirmation`
and `wrangler delete` takes `--force`; the flags differ, the hazard does not.
**The confirmation prompt is the last guard against deleting the wrong
database.** CLAUDE.md §6.10 records exactly what a confirmation answered without
a human looks like: a `--remote` apply auto-answered yes in a shell with no
stdin, printing `Using fallback value in non-interactive context: yes`. A delete
is irreversible in a way that an additive migration is not.

**ABANDONMENT REQUIRES THE SAME TEARDOWN AS COMPLETION.** An experiment that is
never ruled, or ruled against, leaves both artifacts standing and billing
precisely as a finished one would. **The likeliest way these survive is that
nobody decides anything**, and that is the case in which no one is reading a
phase list, which is why the obligation was recorded here rather than there.

### The Worker SOURCE is still committed, and what to do with it

**`scripts/d1-window-worker/` remains in the repo** (`wrangler.jsonc` plus
`src/index.js`) although the deployment it describes no longer exists. Its
`database_id` names `fb498c9d-0650-44c2-9a43-5090aa3c71b3`, **a database that
has been deleted**, and two docblocks inside it (`src/index.js:13`,
`wrangler.jsonc:11`) cite this section's teardown obligation as still pending.

**RECOMMENDED: KEEP IT, and add a note recording that the binding is dead.** Not
acted on here, and not a docs change.

The reasoning, so it can be overruled on the merits. **Open item 1, the rollback
question, is still open**, and it is open precisely because every import
succeeded, so the failure path was never exercised. Answering it needs this
apparatus again, and rebuilding a probe Worker to re-ask one question is a poor
trade against keeping two small files. **Deleting the source also strands the
four `scripts/d1-window-*` scripts**, which are committed, are the rest of the
same harness, and are not under discussion.

**What makes KEEP-AS-IS the wrong option rather than KEEP.** A committed config
carrying a live-looking UUID that resolves to nothing is the same shape as every
stale citation this project keeps cataloguing: it reads as current until someone
runs it. A reader reaching for it would deploy a Worker bound to a database that
is not there, and the failure would surface as a D1 error rather than as
`this was torn down`. **One line in the config saying the id is dead and must be
replaced turns a trap into a starting point.**

**REMOVE is defensible, and is the option to pick if open item 1 is ruled by
reasoning rather than by measurement**, since the apparatus then has no second
use and git history holds it either way. It is not recommended today because
that ruling has not been made.

## 12. The import window, MEASURED

**The experiment ran, four times. The availability question is CLOSED, and the
answer is the bad one.**

**THE WINDOW IS A RANGE, NOT A POINT: 14,359 to 17,647 ms**, across three runs of
the ruled shape. Spread **3,288 ms**, which is **22.9% of the minimum**. **If a
single figure is forced, use the MAXIMUM observed**, because the decision turns
on how long users are locked out, not on how long they are locked out on average.

**Runs A, B and C are the primary evidence.** All three used the ruled
aside-swap shape at 200 ms sampling, analysed at `--slow-floor-ms=300`, with
stale detection genuinely enabled. Run 1 stays in the record below as the first
observation, with its limits stated.

| Run | File | Rows | Stmts | `sql_duration_ms` | Window | Bound | Baseline p50 | Anomalies |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| **A** | A | 1,900,000 | 5,386 | 16,780.83 | **16,700 ms** | +/-218 ms | 117 ms | 81 |
| **B** | B | 1,957,340 | 5,551 | 17,789.44 | **17,647 ms** | +/-221 ms | 121 ms | 86 |
| **C** | A | 1,900,000 | 5,386 | 14,679.18 | **14,359 ms** | +/-219 ms | 124 ms | 70 |

**MODE: FAIL, now REPRODUCIBLE rather than a single observation.** Three runs,
three FAILs, and across all **239 error samples** exactly **one** distinct error
string:

```
D1_ERROR: Currently processing a long-running import.
```

Reads fail at near-baseline latency rather than queueing, which is the fail
signature the design specified.

**NO STALENESS, now DIRECT rather than inferred.** Zero stale tail samples in all
three runs, with detection genuinely enabled each time. **No partial counts**:
each run returned only its two expected values and nothing between them. **No
queueing inside any window.**

### Run 1, the first observation, and why it is not the primary evidence

| Measurement | Figure |
|---|---|
| Window | **15,044 ms**, bound **+/-1,017 ms** at 1 s sampling |
| Failed samples | **15 consecutive**, out of 97 |
| Import, server-side | **14,435.65 ms**, 5,548 queries, 1,957,340 rows written |
| Database size after | **141.18 MB** (141,176,832 bytes) |
| Baseline latency | p50 **43 ms** over 19 samples, reading an EMPTY table |
| Placement | `served_by_region` ENAM, colo EWR, `total_attempts` 1 |

Run 1 was **INSERT-only into an empty table**, not the ruled shape, and its
**stale detection was never enabled**, because it was analysed without the import
window passed in.

**Its classifier verdict does not stand, and the reason is recorded because it is
a general trap.** The 1,000 ms absolute floor overrode the p50-based threshold:
against a 43 ms baseline, `p50 * 10` is 430 ms, but the floor forced 1,000 ms, so
any stall between roughly 430 ms and 1 s was invisible to the classifier.
Demonstrated on a controlled log carrying a deliberate 600 ms stall:

| Setting | Threshold | Reported | Anomalies | Window |
|---|---:|---|---:|---:|
| default floor 1,000 ms | 1,000 ms | `stale-read` | 1 | none |
| `--slow-floor-ms=300` | 510 ms | `queue` | 15 | 3,091 ms |

**The default missed the stall and mislabelled the boundary as `stale-read`**, so
run 1's single stale-read reading was a boundary artifact of the same kind. Runs
A, B and C settle the question directly instead.

**Run 1's 43 ms baseline is not comparable to the later runs' 117 to 124 ms**,
and the reason is the workload rather than time or path. It read an EMPTY table;
they read a full one. Pooled across all four logs, `count(*)` returns in 43 ms
against 0 rows and 118 to 123 ms against 1.9M, with the same count reading
consistently across runs 37 minutes apart. **Every future run's baseline depends
on what the table held before that import.**

**WHAT THIS MEANS FOR `stewardhouse-pilot`, stated without softening.** During an
import against the pilot database:

- **`/api/me` returns 500.** `me.js:43` calls `getSession` with no try/catch at
  that level, so a D1 throw escapes the handler.
- **The client reads that as logged out.** `AppShell.jsx:64` calls `res.json()`
  with no `res.ok` check, so the 500 body fails to parse, lands in the `.catch`
  at `:87-88`, sets `unauthenticated`, and renders
  `<Navigate to="/signin" replace />` at `:133-134`.
- **Sign-in fails too.** Magic-link writes its verification row through the same
  binding, so the sign-in page returns its 5xx catch-all.

**Every signed-in user is logged out and cannot log back in, for the duration of
the import.** The demo tree is unaffected, because it reads fixtures rather
than D1.

**This section does not rule on what to do about it.** It went to the team, and
**section 13 carries the ruling**, together with the four positions the room did
not agree on.

### The tighter measurement, run

**Why three runs and not one: the variance is large.** Runs A and C used the
**same file** against the **same starting table**, and differ by **2,102 ms
server-side (14.32%)** and **2,341 ms observed (16.30%)**.

**The skipped R2 upload on C accounts for none of it.** Every window sits INSIDE
its own `sql_duration`:

| Run | Window minus `sql_duration` |
|---|---:|
| A | -81 ms |
| B | -142 ms |
| C | -320 ms |

The upload completes before `action:ingest`, and the reported figure is
`sql_duration_ms`, so the upload was never inside the measurement. C skipping it
cannot shorten a number that never contained it. **The gap is run-to-run variance
in server-side execution.**

**What cannot be separated, said plainly.** There is no independent timing of the
upload stage, so this argues from where that stage sits in the state machine
rather than from a measurement of it. And there is no way to rule out a
second-order effect correlated with having just uploaded, such as placement or
cache warmth. With n=2 for that file, "variance" is the residual after removing
the one thing that can be reasoned about.

**SAMPLING PRECISION IS NO LONGER THE LIMITING FACTOR.** The bound is +/-219 ms
against a 3,288 ms spread, so **variance dominates measurement error by about
15x**, and finer sampling would buy nothing.

**The DROP-then-RENAME shape cost is NOT established, and an earlier figure is
WITHDRAWN.** Run 1 was 14,436 ms for 5,548 statements and 1,957,340 rows with no
DROP. **Run C, which does include the DROP, came in at 14,679 ms, within 2% of
it.** The shape cost therefore sits inside the variance. **The "about 20% per
row" figure derived from run A alone is not supported by three runs**, and is
withdrawn rather than carried forward with a caveat.

### How the import window was derived, and how the derivation was checked

The Tee'd wrangler output carries no timestamps, so import end was taken from the
**file mtime**, and start from **end minus `sql_duration_ms`**.

**Validated exactly.** Run A's `import-A.txt` mtime is `1787160909804`, matching
the independently supplied end epoch at **delta 0 ms**.

**The derivation is slightly conservative.** Runs B and C each carried one error
sample **60 ms and 100 ms BEFORE** the derived start, so D1 began refusing
marginally earlier than `end minus sql_duration` implies. The edges bracket the
truth within roughly 100 ms, which is inside the +/-219 ms sampling bound.

### The straggler fix, validated on real data

Run B's baseline carried a **31-sample decaying queue**, draining from **6,086 ms
to 1,147 ms** at 17:47:19. That is **2.5 minutes before its import** and
unrelated to any import window. The median-based threshold absorbed it: `p50 *
10` gave 1,210 ms and none of those samples reached it.

**This is the straggler fix demonstrated on real data rather than on a stub.**
Under the original p95-based threshold, that one burst would have set the bar
past any real stall and silently disabled queue detection for the whole run.

### The realistic file shape, verified locally before the runs

**The realistic file shape is built and locally verified.**
`d1-window-generate.mjs` gained `--shape=insert|aside-swap` and `--rows=N`; the
default is unchanged and still byte-identical to the first run's file
(`sha1 3732e243...`). The `aside-swap` shape emits CREATE aside, the INSERTs,
then DROP live and RENAME aside to live, **all in one file**, which is the swap
fork's binding constraint.

| Check | Result |
|---|---|
| Statements | **5,551** (5,548 INSERT plus CREATE, DROP, RENAME) |
| File size | **166,531,714 bytes**, 158.8 MB |
| DROP against a full table | freed **34,422 pages**, against the ~33,000 estimate |
| Peak during the swap | **68,845 pages**, both copies resident |
| After | 1,957,340 rows intact, aside gone, `integrity_check` ok |

**Three defects were caught while building this, and two would have shipped
silently.** A `\Q...\E` pattern still interpolated `${ASIDE}` as a perl variable,
because `\Q` quotes metacharacters and does not stop interpolation. A patch left
real newlines inside template literals, which would have emitted `;\r\n` into the
generated SQL and **broken `d1-window-verify-import.mjs`, which splits on
`';\n'`**. The same patch left the file with mixed line endings, now normalised
back to all-CRLF. Only the first would have failed loudly.

### What the measurement does NOT establish

Unchanged by three runs, and stated as the design stated them:

- **One table, against the pilot's 29.** Whether the error is per-database or
  per-table is **NARROWED but NOT SETTLED**. The narrowing came free from the
  banked logs and from Cloudflare's own documentation and is recorded in the
  subsection below; the experiment that would settle it is ruled NOT RUN.
- **No concurrent traffic.** The probe was the only reader, while the pilot
  serves auth, `/api/me` and Operations at the same time.
- **Nothing about the failure path.** All four imports succeeded, so the rollback
  claim is untested and **open item 1 stays open**.
- **No tail bound.** Three samples give a range, not a distribution. There is no
  basis for a p99 or a worst case.
- **One time of day, one region, one colo.** All three ran within 19 minutes, all
  ENAM and EWR. No diurnal or placement variation.

### The scope question: NARROWED without an experiment, and NOT run

**RULED 2026-08-19: the per-database-versus-per-table experiment is NOT run.**
Two findings came free from designing it, and together they narrow the question
far enough that the build the experiment would need stopped being proportionate.
**The reasoning is recorded in full, including the evidentiary standard, because
the working assumption at the end rests on documentation rather than on a
measurement and must never be cited as though it were measured.**

**FINDING 1: THE BANKED LOGS ALREADY RULE OUT THE NARROWEST READING.** Runs A, B
and C used the `aside-swap` shape, in which the overwhelming majority of the
import's duration is `INSERT`s into `bmf_aside`. The probe read `bmf`, a
DIFFERENT table, and **it failed for the ENTIRE window** rather than only across
the closing `DROP` and `RENAME`. **That rules out "the import locks only the
table it is currently writing."**

**What survives is two hypotheses, and the banked data CANNOT separate them**: a
whole-database lock, or a lock over the union of tables the file NAMES. `bmf`
sits in that union either way, because the file drops it. **All four banked runs
are blind to the difference for that same reason**, so no reanalysis of the
existing logs can close this.

**FINDING 2: CLOUDFLARE'S OWN SDK DOCBLOCK SAYS PER-DATABASE.** In the shipped
`wrangler` 4.111.0 bundle, the Cloudflare API SDK's docblock on the D1 import
method reads, at `node_modules/wrangler/wrangler-dist/cli.js:69285-69287`, the
method itself being at `:69301`:

> Generates a temporary URL for uploading an SQL file to, then instructing the D1
> to import it and polling it for status updates. **Imports block the D1 for
> their duration.**

The REST path it posts to is `d1/database/${databaseId}/import`: **scoped to a
DATABASE, with no table parameter anywhere in it.** The sibling `export` docblock
uses the same database-level language.

**AND THE GREP-VERIFIED NEGATIVE, which is the half that decides where the answer
can live at all.** The string `long-running import` appears in **ZERO** files
under `node_modules/`. The error every probe recorded therefore comes from the
SERVICE and not from the client, **so its scope cannot be determined by reading
client code**. That is why finding 2 is documentation rather than source: source
was looked for and is not there.

**Line numbers into a bundled file are version-specific.** Both citations are
against `wrangler` 4.111.0, the same version section 7 is sourced to. An upgrade
may move them. The strings are stable and are the thing to grep for.

#### The evidentiary standard, stated without softening

**This docblock is the SAME CLASS OF ARTIFACT as the rollback guarantee**, which
section 7 calls "the most load-bearing unverified fact in this plan" and declines
to treat as settled: it is "printed by the client before the import runs, so it
is a claim about what the service does rather than an observation of it."

**It is arguably WEAKER.** The rollback string is at least emitted by the code
path that runs the import. This is generated SDK documentation attached to a
method signature, one further remove from the service again.

**Accepting one while distrusting the other would be two standards for two
sentences printed by the same binary.** That is the whole of the standard, and it
is recorded here so that nothing downstream can quietly promote finding 2 into a
measurement.

#### Why the experiment is not run

**The documentation asserts the PESSIMISTIC case, which this plan already
assumes.** So the experiment would not test whether the situation is as bad as
feared. **It would test whether D1 is BETTER than its own documentation**,
against first-party text saying it is not.

**That is a low prior against a real build:** a new throwaway database, a Worker
rewrite carrying a second route and a rotating lookup key, a third generator
shape, three seeded tables including a 50,000-row session stand-in, two
concurrent probe processes, and one to three remote runs each carrying their own
teardown obligation.

**And it would test READS ONLY, which is the part most likely to be misread as a
rescue.** Sign-in has a read half and a write half: the invite-allowlist read at
`functions/api/auth/[[route]].js:96-103`, and better-auth's `verification` row
INSERT. **A clean read result would rescue `/api/me` and the allowlist without
establishing that sign-in completes.** Covering the write half means writing
during an import, which is a different question and may perturb the thing being
measured.

#### The working assumption

**PER-DATABASE, on DOCUMENTARY rather than MEASURED evidence, with the standard
above attached.** Every availability consequence in this section is stated on
that assumption, and it is to be cited AS an assumption wherever it is relied on.

**Asking Cloudflare directly is cheaper than the experiment and no less
authoritative than the docblock**, both being the vendor describing its own
service rather than the service being observed. **That is the route if this is to
be settled** without the build above.

**FILED, and created by this renumbering:** five files under
`scripts/d1-window-*` and `scripts/d1-window-worker/` cite "open item 1" in
their docblocks, which now points at a different item. Those are code and were
out of scope for this docs pass. The phrase to correct is "the experiment that
settles open item 1".

**CLOSED, and the filing above UNDERCOUNTED. The undercount is recorded here
rather than edited away.** It named five files and ONE phrase; the reality was
five files and TWO phrases. `d1-window-analyze.mjs` also cited "open item 2" at
`:28` and `:87`, stale in the OPPOSITE direction: rollback was item 2 and is now
item 1, so those two pointed at the `REVENUE_AMT` question. **The filing caught
the citations naming the item this renumbering CLOSED and missed the ones naming
the item it MOVED**, which is the harder half to see, and the reason a stated
count reads as an inventory when it is not one. All seven sites are fixed, and
no replacement names an open-item number: five point at section 12, and the two
in `d1-window-analyze.mjs` name the rollback question directly.

## 13. The availability ruling

**FT RULING 2026-08-19, made with the advisory team.** Section 12 measured the
window and deliberately did not rule on it. This is the ruling, **recorded with
its dissent intact rather than as a consensus**, because the disagreements are
not the same disagreement and flattening them would lose what each one gates.

**DEFER-TO-TEAM. The room converged, independently, on a finding that was NOT one
of the three options in the packet.**

### The root cause is not the import

**`AppShell.jsx:64` calls `res.json()` with no `res.ok` check**, so a 500 from
`/api/me` converges on `setStatus('unauthenticated')` and renders
`<Navigate to="/signin" replace />` at `:133-134`. Both failure shapes reach the
same state: an unparseable error body rejects into the `.catch` at `:87-88`, and
a parseable one falls to the `else` at `:83-85`.

**D1 being unavailable does not have to mean "logged out."** It means a fetch
failed. **The shell has no way to express that**, so it expresses the only other
thing it knows.

**Every seat reached this independently**, which is why it is recorded as the
finding rather than as an aside. The packet framed the question as which storage
arrangement to buy. The room answered that the storage arrangement is not what
makes the outage look like a logout.

### RULED: the shell gains a third status

**A D1 failure renders a RETRY state, not a redirect.** Already-signed-in users
see a stalled surface for the duration of the window and then recover.

**The affected population collapses** to whoever hits sign-in inside a roughly
15-second window on a refresh cadence, rather than every signed-in user across
all four surfaces at once.

### RULED: option (a), accept the window, AFTER the shell fix

**No second database.** The ordering is load-bearing: the window is accepted ON
the shell fix, not instead of it.

**A second D1 database is PERMANENT OPERATIONAL OVERHEAD.** Two migration
lineages, two local stores, two remote stores. It converts section 10's
double-store incident from a post-mortem into a STANDING CONDITION, and that cost
is paid daily, by a one-person build, to avoid an event that currently costs
zero.

**Alex's finding, recorded because it is the argument that decided it:** option
(b) RELOCATES the window onto the directory rather than removing it. The import
still blocks its own database, and that database is the one a funder is reading
when they browse nonprofits.

### RULED: option (c), leaving D1, is REJECTED

**Nobody defended it**, and the packet's accounting went unchallenged: it
discards the migration, the table shape, the atomicity finding and the entire
measurement arc.

### The disagreement, as four positions rather than one

**These are not the same position and none reduces to another.**

**Parker, on the rollback path.** Availability cannot be ruled responsibly while
the rollback path is untested. **The failure path gates the LOAD ITSELF rather
than the window:** a load that cannot be shown to roll back cleanly is a
different risk from one that is briefly unavailable, and the second does not
subsume the first.

**Parker, on manufactured ambiguity.** Accepting the window means GENERATING, ON
A SCHEDULE, an event indistinguishable from the July five-day silent auth outage.
`SignIn.jsx:99-102` renders the identical string for both, and no observability
distinguishes them. **This is a SECOND position, not a restatement of the first:**
it survives even if the rollback path is proven.

**Aisha and James, on pricing.** The database decision should be DEFERRED until
there is a user count to price it against. This does not dispute the ruling; it
disputes that now is when it should be made.

**Jordan, on where the question belongs.** "What does a pilot user see during a
load" should be a PILOT GATE CRITERION rather than an infrastructure question,
which moves it out of this doc and into `docs/pilot-gate-criteria.md`.

### RULED as gating the LOAD, not the window

**Two preconditions on any production BMF load.** Both are Parker's condition,
and both are ACCEPTED:

1. **The rollback path**, open item 1 below, must be closed.
2. **The observability gap** must be closed. It is filed in CLAUDE.md section 11
   as the auth-observability open item: magic-link sends stamp nothing, there is
   no health check, and the July outage therefore ran silently for five days.

**Neither gates the WINDOW, and that distinction is the ruling.** The window is
accepted. The load waits on these two.

### FILED, as LEAVING this arc

**The `AppShell.jsx:64` defect is PRE-EXISTING and fires on ANY 5xx**, not only
during an import. It outlives this ruling, it is not part of the BMF build, and
it gets its own slice. **Filed at `docs/filed-defects.md`**, so it is found by
someone fixing the shell rather than only by someone loading the BMF.

## Open items

Recorded as open. None of these is resolved here and none carries a
recommendation.

**Four items from earlier lists are CLOSED and are not restated as open**: peak
storage, the swap design fork and the `CREATE INDEX` timing, all closed in
section 1, and availability during the load, closed in section 12 by
measurement. The rest keep their substance and are renumbered 1 through 4.

### 1. Whether the import rollback is a transaction or a compensating replay

**NARROWED by the measurement in section 12, and the limit is precise.** The
import committed ATOMICALLY on the success path: the row count was exact, no
partial table was ever visible, and a read taken during the window returned an
error rather than a prefix. **That establishes the SUCCESS path is atomic.**

**It does NOT test the rollback claim, because nothing failed.** Section 7
records the CLI asserting that a failed import returns the database to its
original state, and the run gave it no failure to exercise. The two mechanisms
still differ exactly where it matters: a transaction cannot leave residue, while
a compensating replay can fail partway through its own compensation.

**Success path proven. Failure path untested.**

**GATING, as of the section 13 ruling.** This is now a PRECONDITION ON THE
PRODUCTION LOAD rather than only an open question. Section 13 records it as
Parker's condition, accepted: the failure path gates the load itself rather than
the window, and a load that cannot be shown to roll back cleanly is a different
risk from one that is briefly unavailable.

### 2. Whether `REVENUE_AMT` serves any v1 query

The expenses facet reads the XML, so it is not obvious that `REVENUE_AMT` is
used by anything in v1. It is one of the seven ruled columns and is loaded
regardless.

**Two separate measurements, which must not be conflated:**

- **71% blank-or-zero.** Of 1,957,340 rows, 569,235 are blank AND 825,946 more
  filed exactly zero. This measures **how much of the file carries a usable
  revenue figure**, and it is what killed the facet.
- **29.08% null.** 569,235 of 1,957,340. This measures **column nullability**
  only, and it is what the schema and the verification checks key on.

The first includes the second. They answer different questions and appear in
different places in this doc deliberately.

### 3. Whether absence-from-BMF is the entire revocation and deductibility signal

Ruling 1 makes BMF presence load-bearing: revoked organizations were measured
absent from the BMF. Whether that absence is the WHOLE gate, or whether the
revocation list and Pub 78 are also required, is a design question the spike
explicitly left open. The BMF also carries `DEDUCTIBILITY` and `STATUS` columns
whose code meanings are **UNVERIFIED**, both IRS information-sheet PDFs having
defeated the spike's tooling.

**This item's failed-swap clause is RETIRED rather than answered.** It reasoned
about what a DROP-succeeded-RENAME-failed state leaves standing on the
deductibility gate. Section 1's binding constraint removes that state, so the
question no longer arises in that form. The gate question itself, above, is
untouched by it.

### 4. Whether retained Time Travel history counts toward the 10 GB ceiling

Section 1 puts peak at roughly seventeen times inside the ceiling, which is
comfortable only if the ceiling counts what section 1 counts. **A replace-all of
1.96M rows generates a large amount of history**, and whether retention of it is
billed against the same 10 GB is unknown.

### 5. Whether the import FAIL is per-database or per-table

**ADDED 2026-08-19 and NOT one of the earlier list's items**, so the preamble
above still correctly describes the four it renumbered.

**NARROWED, NOT CLOSED.** Section 12 carries the two findings that narrowed it
and the ruling that the experiment is not run. What now stands: the banked logs
rule out a lock on only the table being written, and Cloudflare's own SDK
docblock says imports block the database. What does not: neither is an
observation of the service, and the banked runs cannot separate a whole-database
lock from a lock over the union of tables the import file names.

**WHAT WOULD CLOSE IT.** One remote run against a throwaway database in which the
import file names NO table the probe reads: an `aside-only` shape that creates
and fills an aside table and then stops, with the probe reading a table absent
from the file. That removes the union ambiguity the banked runs cannot escape. A
FAIL on that read closes it as per-database on a single run. **A CLEAN read needs
a second run and two positive controls**, because under that shape nothing the
probe can see changes, so a void import and a genuine clean result look
identical.

**IT WOULD STILL NOT COVER WRITES.** Sign-in's `verification` INSERT is a
separate question, and a read-only result must not be read as covering it.

**A vendor answer would close it to the same standard as the docblock**, and no
further.

## Provenance note on section 5

**Not an open item, recorded because the question was asked.** The read-only
verification section was produced during the 2026-08-18 scoping pass and was
lost in transit rather than never written. It is reproduced above from that
pass rather than reconstructed, so it is not a gap and is not listed among the
open items.
