# BMF load scoping

The build plan for loading the IRS Exempt Organizations Business Master File
into D1. Scoped 2026-08-18 against the tree at `2f39b8a`. Nothing is built.

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

### The swap, and the finding that it is not atomic

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

**What it does NOT give: atomicity across the DROP and the RENAME.** There is
**no `BEGIN` or `COMMIT` anywhere in the migrations tree**; a grep returns only
`PRAGMA` lines in 0016. `env.DB.batch()` would provide an implicit transaction,
but **that is the Worker API and is unavailable to a CLI script**, which is what
this load is. So the two statements run unwrapped and there is a window between
them where the live table does not exist.

**The failure is ASYMMETRIC, which is the part worth carrying forward.** If the
DROP succeeds and the RENAME does not, **the directory is gone and the data sits
under the aside name until a human renames it by hand.** The reverse case, DROP
failing, changes nothing. Short window, unequal consequences.

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

**A chunk fails mid-load.** The aside table holds a prefix; **the live table is
untouched.** That property is what makes aside-and-swap correct rather than
merely tidy. Recovery is to drop the aside and rerun from the start. **This
project has no resumable write and this slice should not invent one**: a full
rerun is about 6 minutes locally, cheaper than the correctness argument a resume
would require.

**A swap fails.** Two sub-cases, sharply different. DROP succeeded and RENAME
did not: the live table is gone, the data sits under the aside name, and the
surface is broken until someone renames it by hand. DROP failed: nothing
changed. This is the window section 1 names, and it is the argument for the
script verifying and reporting post-swap state rather than trusting the wrangler
return code.

**One failure mode outside the script's control, already measured.** The
`2026_TEOS_XML_05A.zip` archive exits 3 having extracted all 84,172 members
correctly. **A load treating a non-zero exit as failure would discard a complete
batch.** That is the XML route rather than BMF, but it is the same class of trap
and the same script family will meet it.

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
  against miniflare. The repo records no D1 limits.
- **Remote wall-clock**, against about 6 minutes locally.
- **Whether DROP-then-RENAME is atomic against D1's replication**, as distinct
  from against one SQLite file. Local proves SQLite semantics only. This is the
  gap most worth closing before a production swap.
- **Storage headroom.** `wrangler d1 info` reports current size and is a
  `--remote` read, so FT-only.
- **Time Travel interaction.** A large replace-all has restore implications
  nobody has examined.
- **Whether the live surface tolerates the swap window** under real concurrent
  reads.

## 7. What the surface needs next

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

### 1. Peak storage under aside-and-swap is UNMEASURED

The aside table is a full copy, so peak storage is roughly **2x rows plus both
index sets**, during the load. The figure has not been measured, and it bears
directly on open item 2 below.

### 2. The swap design fork, both options recorded, neither ruled

**(a) DROP-then-RENAME.** Transient 2x storage during the load only.
Non-atomic window between the two statements, with the asymmetric failure
recorded in section 1.

**(b) Two fixed tables plus a pointer.** The stamp row names which table is
live. The swap becomes a **single-statement UPDATE**, which is atomic without
any transaction wrapper, so there is no window. The endpoint branches on the
pointer. Cost is **permanent 2x storage** rather than transient, and a branch on
every read.

**This fork is GATED ON OPEN ITEM 1.** Whether permanent 2x storage is
acceptable cannot be decided before peak storage is measured.

### 3. Whether `REVENUE_AMT` serves any v1 query

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

### 4. Whether absence-from-BMF is the entire revocation and deductibility signal

Ruling 1 makes BMF presence load-bearing: revoked organizations were measured
absent from the BMF. Whether that absence is the WHOLE gate, or whether the
revocation list and Pub 78 are also required, is a design question the spike
explicitly left open. The BMF also carries `DEDUCTIBILITY` and `STATUS` columns
whose code meanings are **UNVERIFIED**, both IRS information-sheet PDFs having
defeated the spike's tooling.

**And specifically on a failed swap:** if the DROP succeeds and the RENAME does
not, the directory is gone. What that leaves standing on the **deductibility
gate** has not been reasoned through. An absent table is not an absent
organization, but a gate that reads absence as its signal may not distinguish
them, and the failure mode of that confusion runs in the dangerous direction.

## Provenance note on section 5

**Not an open item, recorded because the question was asked.** The read-only
verification section was produced during the 2026-08-18 scoping pass and was
lost in transit rather than never written. It is reproduced above from that
pass rather than reconstructed, so it is not a gap and is not listed among the
open items.
