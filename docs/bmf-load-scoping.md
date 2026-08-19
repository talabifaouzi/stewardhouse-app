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

### Peak storage, measured

**The former open item 1 is CLOSED.**

| Quantity | Figure | Kind |
|---|---|---|
| Per-row payload, over all 1,957,340 rows | **64.240 bytes** | measured |
| Table at 0.95 fill | ~**141 MiB** | arithmetic |
| Four indexes | ~**180 MiB** | arithmetic |
| One copy | ~**321 MiB** | arithmetic |
| Peak, aside plus live | ~**642 MiB** | arithmetic |
| Range across plausible fill factors | **610 to 880 MiB** | arithmetic |

**The per-row figure is a measurement. Everything below it is arithmetic on top
of that measurement**, and the distinction is not pedantry: the index projections
in particular assume index shapes that do not exist yet, since section 1 records
that the right composite is not knowable until the surface exists. **The only
thing that closes them is `PRAGMA page_count` on a built table**, which cannot be
run before the load this doc plans.

**One figure in this table does not reproduce from the one above it, and the gap
is recorded rather than closed.** 64.240 bytes x 1,957,340 rows is **119.91 MiB**
of payload, and 0.95 fill gives **126.2 MiB**. The **141 MiB** figure therefore
implies roughly **7.5 bytes per row of SQLite row overhead** beyond the measured
payload, which the source measurement did not state. **Neither figure is adjusted
here.** This is an unreconciled arithmetic gap rather than a correction, and it
closes the same way the rest of the table does, by `PRAGMA page_count` on a
built table.

**The ceiling is 10 GB per database on Workers Paid**, so peak sits roughly
sixteen times inside it. **Storage does not constrain either swap option**, which
is the gate the former open item 2 was waiting on.

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
stale and failed a `--remote` read in an earlier session. The same staleness
arriving partway through a multi-minute load is not covered anywhere in this
section, and the remote path in section 7 runs long enough for it to matter.
Recorded, not solved.

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
  the BMF table.**
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

**The 30-second limit is not comfortable at this scale.** It is what open item 1
below turns on.

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

## Open items

Recorded as open. None of these is resolved here and none carries a
recommendation.

**Two items from the previous list are CLOSED and are not restated as open**:
peak storage, closed in section 1, and the swap design fork, closed in section 1
with a binding constraint. The two that survive keep their substance and are
renumbered 4 and 5.

### 1. `CREATE INDEX` on `NAME` against the 30-second limit at 1,957,340 rows

**UNMEASURED, and it is the item that can invalidate the shape of the load.** The
`NAME` index is the ordering index section 1 calls the likeliest source of
slowness at this row count, and building it is a single statement against 1.96M
rows under the 30-second query duration in section 8.

**If it exceeds, single-file is impossible**, and what that calls for is
restructuring the load rather than choosing a different swap. Recorded that way
deliberately, because the failure points at the chunking and not at section 1's
fork, which is closed.

### 2. Availability during the load

The import takes **the whole database offline**, not just Discover, on wrangler's
own warning in section 7. **Operations writes are live in production.** So the
load makes the platform unavailable to an operator mid-invite for as long as the
import runs, and nobody has decided what that costs or when it may run.

**UNRULED.**

### 3. Whether the import rollback is a transaction or a compensating replay

Section 7 records the CLI's claim that a failed import returns the database to
its original state. **Which mechanism delivers that is unknown**, and the two
differ exactly where it matters: a transaction cannot leave residue, while a
compensating replay can fail partway through its own compensation.

### 4. Whether `REVENUE_AMT` serves any v1 query

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

### 5. Whether absence-from-BMF is the entire revocation and deductibility signal

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

### 6. Whether retained Time Travel history counts toward the 10 GB ceiling

Section 1 puts peak at roughly sixteen times inside the ceiling, which is
comfortable only if the ceiling counts what section 1 counts. **A replace-all of
1.96M rows generates a large amount of history**, and whether retention of it is
billed against the same 10 GB is unknown.

## Provenance note on section 5

**Not an open item, recorded because the question was asked.** The read-only
verification section was produced during the 2026-08-18 scoping pass and was
lost in transit rather than never written. It is reproduced above from that
pass rather than reconstructed, so it is not a gap and is not listed among the
open items.
