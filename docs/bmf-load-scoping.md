# BMF load scoping

The build plan for loading the IRS Exempt Organizations Business Master File
into D1. Scoped 2026-08-18 against the tree at `2f39b8a`, updated
2026-08-19 against `7ffe98e`. Nothing is built.

`propublica-spike-findings.md` describes the SOURCES. `discover-surface-spec.md`
describes the SURFACE. This describes the BUILD between them, and it carries
open items that will change as they resolve, which is why it is its own doc.

The rulings this plan implements are recorded elsewhere and are not re-argued
here: manual FT-run script for v1 with no scheduled process, replace-all built
aside and swapped, header-name parsing, the load stamp, full national
load, seven columns, roughly 30KB chunks sized by bytes, the four-or-five file
set, and EIN as the primary key.

**CORRECTED 2026-09-07 BY R12: this line read "the four-part load stamp".** That
count was asserted and never ruled, and its referent was never written down. The
stamp has SEVEN fields plus a `load_check` child table, enumerated in §1 and
shipped in `migrations/0022_bmf_table.sql`. **Pointer updated 2026-09-07 when
A117 closed**; it read "listed on A117", and an entry is not a durable citation
target because closing one deletes it.

## 1. The migration

**Next number is `0019`.** The tree runs `0001` through `0018`, contiguous.

**CORRECTED 2026-09-08: THE SENTENCE ABOVE IS FALSE, AND IT IS A FALSE MECHANISM
RATHER THAN A STALE FIGURE, WHICH IS WHY NO NUMBER REPLACES IT.** It is quoted
rather than edited, the same treatment R29 gave §2's `escapeSql` sentence, so the
correction is visible where the false claim sits. The tree runs `0001` through
`0022`, observed 2026-09-08. **The migration this sentence anticipates SHIPPED AS
`0022_bmf_table.sql` and is applied to BOTH databases**, `bmf-sandbox` and
`stewardhouse-pilot`, so §1 is no longer waiting on a next number and correcting
`0019` to `0023` would be wrong in kind: it would answer a question this section
has stopped asking. **Line 20 of this same section already cites
`migrations/0022_bmf_table.sql`**, six lines above, so the section contradicted
itself for a day and the contradiction was visible in one screen. Contiguity is
OBSERVED, never tool-checked — CLAUDE.md §10 records that nothing in wrangler
validates it.

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

**AND THE EMPTY-STRING BRANCH MUST PRECEDE NUMERIC CONVERSION, RULED 2026-09-08.
THIS IS A REQUIREMENT ON THE LOADER, NOT A NOTE, and it lives here rather than on
A113 for §2's fuse reasoning:** A113 closes the moment the loader exists, which is
exactly when this starts mattering on every subsequent load, so a requirement
recorded only in the artifact that disappears at first compliance is a requirement
with a fuse on it.

**THE MECHANISM.** `REVENUE_AMT` is null on 569,235 rows of the measured extract,
and an absent CSV field arrives as the EMPTY STRING. **`Number('')` is `0`, not
`NaN`.** So if numeric conversion runs BEFORE an emptiness branch, an absent
revenue becomes the number `0` — which is exactly what the paragraph above
forbids.

**A VALUE EMITTER CANNOT CATCH IT AFTERWARD.** The one value-literal helper in the
tree, `scripts/provision-institution.mjs:74-78`, tests emptiness as `v === ''`,
which a converted `0` no longer satisfies; `0` is a number and takes the number
branch, emitting a bare `0`. Measured 2026-09-08 against that function as written:
`sqlVal('')` returns `NULL` and `sqlVal(0)` returns `0`. **Both are correct for
their inputs**, and the defect is entirely in which one the value has become by
the time it arrives.

**IT IS SILENT AT EVERY LAYER.** A `0` in an INTEGER column is a legal value, so no
constraint fires. §5's null-count check would report a null count LOWER than
measured — and R18 has already ruled those exact counts are provenance rather than
a recurring test, so on a fresh extract nothing compares it against anything.

**STRUCTURALLY IDENTICAL TO R29, ONE STEP EARLIER.** R29 rules the nullable columns
branch BEFORE escaping and emit the bare keyword `NULL`. This is the same shape
moved back one stage: **the empty-string branch must precede CONVERSION, not merely
precede escaping.** A loader that gets R29 right and this wrong emits a
syntactically perfect file asserting 569,235 filings that do not exist.

**`EIN` is the primary key and its uniqueness is RE-ASSERTED PER LOAD, never
assumed.** It was measured unique across the correct file set (1,957,340 rows,
1,957,340 distinct, zero duplicates, zero malformed), but that is one snapshot of
a file the IRS regenerates. A load that assumes it would fail confusingly on the
first month it stops being true.

### The swap, and the finding that it IS atomic in one invocation

**AMENDED 2026-09-07 BY R6: THE DROP IS REPLACED BY A RENAME TO A DATED NAME.**
What follows describes the swap as DROP-then-RENAME and is kept because its
atomicity finding is unchanged and still load-bearing. **The live table is no
longer dropped**; it is renamed to a dated name and retained, three generations
deep per R7. See §15.

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

**RULED 2026-09-07 (R10): THE SET IS THE FOUR MEASURED INDEXES** — `UNIQUE(ein)`,
`(state, city)`, `(ruling)`, `(name)`. Unanimous across four advisory seats, FT
deferring. **The deciding argument: in a replace-all design an index is not a
schema decision.** Every load rebuilds the whole set, so changing it later costs
one DDL edit and one load cycle rather than a migration.

Following the `idx_{table}_{column}` convention used throughout the tree:

- **Geography** filters state, then city. State alone partitions 1.96M into
  human-sized sets; a composite serves both levels.
- **Recognition era** is a range predicate on `RULING`.
- **Alphabetical results** order on `NAME`. This is an ordering rather than a
  filter, and at 1.96M rows an unindexed sort is the likeliest source of slowness.
- **Total expenses band** is a range predicate, but its source is the XML rather
  than the BMF, so that index belongs to whichever table carries expenses.

**R10a, A CORRECTION TO THE FRAMING: `UNIQUE(ein)` IS NOT AN INDEX CHOICE.** This
section rules `EIN` the PRIMARY KEY, and in SQLite a PRIMARY KEY on a
non-INTEGER column IS a unique index, created whether requested or not. **So the
decision is THREE indexes plus what the PK already creates.** Verified by
execution 2026-09-07: a `TEXT PRIMARY KEY` produced `sqlite_autoindex_bmf_1`
with `origin: pk`, no index having been requested.

**R10b: THE PRIMARY KEY IS DECLARED AT `CREATE`, not added after load.** The
consequence is that a duplicate `EIN` fails at INSERT rather than at index
creation. Verified in the same run: a repeated `EIN` was rejected with
`UNIQUE constraint failed: bmf.ein`.

**THIS MAKES BOTH R8-2 AND R8-3 TAUTOLOGIES, and the second half is a finding of
the scope pass rather than of the ruling.** R10a names R8-2, distinct `EIN`
equals row count. **The same run's CONTROL established the other:** a NULL in a
`NOT NULL` column is rejected identically, `NOT NULL constraint failed:
bmf.name`, so R8-3, non-null on the four nationally-non-null fields, cannot fail
either. **Both checks run against an aside that could not have been built if
they would fail.** Whether they become `sqlite_master` assertions that the
constraints EXIST is UNRULED, and that reframing is the only thing that would
make either able to fail.

**R10c: THE SET IS PROVISIONAL AND MUST SAY SO.** It lives in the loader as a
SINGLE NAMED CONSTANT, not scattered through the DDL, carrying a comment that it
is revisable at zero migration cost once Discover reveals real query patterns.

**R10d, A PATH B CONDITION ON THE `name` INDEX.** It is a SEARCH index, and
search is how Discover will surface organizations. **Indexing for retrieval is
inside the §7 boundary; ordering by anything evaluative is not.** Exposure in,
evaluative recommendation out, applies at the QUERY layer, and **nothing in the
schema guards it**: the index is neutral, and the query written against it is
where the boundary can be crossed.

**R10e, A MEASUREMENT FLAG.** The storage and timing figures in this section were
measured against a table with **NO PRIMARY KEY DECLARED**, which is not the shape
that ships. The peak-storage subsection carries the same flag beside the figure.

**SUPERSEDED BY R10, kept because the reasoning is sound and only its conclusion
moved.** This section previously ended: "**The right composite shape is not
knowable yet.** It depends on which facet combinations are common, and nobody has
that data because the surface does not exist. Over-indexing 1.96M rows costs
storage and load time on every replace-all." **That remains true, and it was
functioning as a CIRCULAR BLOCKER**: query patterns cannot be known until
Discover exists, and Discover cannot exist until the table does. R10 breaks the
circle by pricing the cost of being wrong at one load cycle.

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

**R10e, FLAGGED 2026-09-07: EVERY FIGURE ABOVE WAS MEASURED AGAINST A TABLE WITH
NO PRIMARY KEY DECLARED**, which is not the shape R10b ships. **R7's "roughly
303 MB per generation" rests on the 302.57 MiB here**, so that figure is
INHERITED rather than measured against the real shape and **must not be restated
as if it were.** One re-measurement against a table carrying the declared PK
settles it. The direction of the error is not assumed either: the PK's automatic
index may or may not differ in size from the `UNIQUE (ein)` index that was
measured, and nothing here establishes which.

**AMENDED 2026-09-07 BY R7: PEAK IS NO LONGER ASIDE-PLUS-LIVE.** Three
generations are retained, so peak is live plus the aside plus the retained set.
At the measured 302.57 MiB per copy that is roughly 1.5 GB rather than ~605 MiB,
still comfortably inside the ceiling, and the conclusion above is unchanged: **at
no point in the plausible range does storage constrain the design.** Each load
replaces the oldest retained copy per R8c, so the figure does not grow with time.
See §15.

### The stamp table

**AMENDED 2026-09-07 BY R9: THE STAMP CARRIES CHECK RESULTS, NOT A BOOLEAN.**
Completion alone separates finished from interrupted and NOT correct from
incorrect, so the load's check results are recorded too. R12 settles how.

**R12, RULED 2026-09-07: THE FIELDS ARE DEFINED FRESH, NOT RECOVERED, AND THE
COUNT IS NOT PRESERVED.** This section previously opened "The four ruled parts",
and `docs/discover-surface-spec.md` and this plan's own preamble both said "the
four-part load stamp". **That phrase was ASSERTED, never ruled, and its referent
was never written down anywhere**, so it is not a constraint. **There are SEVEN
fields.**

**ENUMERATED HERE 2026-09-07, RELOCATED FROM A117 BEFORE THAT ENTRY CLOSED.**
This read "listed on A117 with the proposed DDL for both tables", which would
have become a pointer to a deleted entry — and a count whose list lives only in
a closing entry is the count-is-not-a-list failure with a delete scheduled.
**The seven, in order:** `source_date`, the extract's own date and what Discover
renders; `file_set`, which four or five files were taken; `load_started_at`;
`load_finished_at`, when it stopped, success or failure; `completed_at`, written
LAST and on success only, null meaning not complete; `row_count`; and
`generation_table`, the dated table this load produced, so R7's retention is
operable rather than inferred from table names. **The shipped DDL for both tables
is `migrations/0022_bmf_table.sql`**, a tracked file rather than a queue entry.

**R12e, THE TEST THAT CUT TWO FIELDS AND KEPT TWO, relocated with them because it
governs any future addition.** `checks_passed` went as a second source of truth
derived from the check rows; `source_id` went as redundant with `source_date` and
`file_set` together. **The rule: the stamp is the only thing that outlives a
generation, so a field belongs in it if and only if you would want it after the
table is pruned.**
**RECORDED HONESTLY: `source_id` WAS CUT BY POINTING AT `file_set`, WHICH NOBODY
HAD DEFENDED AT THE TIME.** The cut holds on `file_set`'s own grounds — four
files and five files are both valid and produce different data, and nothing else
distinguishes them — but it held for a reason established later than the cut,
and that order is recorded rather than tidied.

**ONE ROW PER SOURCE STILL HOLDS**, because BMF, the revocation list and Pub 78
refresh on independent cadences and a single stamp would assert one freshness
for three things. **That reasoning never depended on the count.**

**Completion is written LAST, on success only.** That field is the only thing
separating "loaded 1,957,340 rows" from "loaded a prefix and stopped", and
without it every other field in the row lies convincingly. **R12c extends it:
the check rows are written BEFORE completion**, so completion still means the
record is whole.

**R12b: THE CHECK RESULTS LIVE IN A CHILD TABLE, `load_check`, NOT A JSON
COLUMN.** JSON was proposed and then argued down by the seat that proposed it:
nothing validates it, it is not queryable across rows, and a provisional check
set means JSON silently changes shape where columns would not. **Adding a check
adds ROWS, not columns**, so the check set can move without a migration.

**R12d: NO STATUS ENUM.** The timestamps ARE the status, and no `completed_at`
means not complete. A status column would drift against the timestamps, which is
the defect FORK 2 already ruled against for `enrollment_status`.

**R12f, PARKER'S CONDITION: THE STAMP RECORDS THE LOAD, NOT THE DATA.** Nothing
evaluative or categorical about the organizations — no counts by NTEE code, no
distributions by state, nothing that reads as StewardHouse's account of the
sector. **A single `row_count` is the load's own size, not a characterization.**

**R12g: THE STAMP IS THE EVIDENCE FOR ANY PUBLIC CURRENCY CLAIM.** With
`source_date` and `completed_at` both present, StewardHouse can say "data from
the [month] IRS extract, loaded [date]" and point at a record. **Recorded so a
future reader does not trim fields that look internal.**

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

### HARD REQUIREMENT: every `EIN` is emitted QUOTED

**This is a requirement on the script, not a note.** Ruled 2026-09-07 out of the
A117 DDL review, and placed HERE rather than on A113 for one reason: **A113 closes
the moment the loader exists**, which is exactly when this starts mattering on
every subsequent load. A requirement recorded only in the artifact that
disappears at first compliance is a requirement with a fuse on it. Same reasoning
CLAUDE.md §6.10 applies to the sandbox.

**`ein` is `TEXT`, which is correct for leading zeros and DOES NOT PROTECT
THEM.** SQLite TEXT affinity converts an unquoted numeric literal, so

```
INSERT INTO bmf VALUES (042103594, ...)   -- stores '42103594'
INSERT INTO bmf VALUES ('042103594', ...) -- stores '042103594'
```

**Verified by execution 2026-09-07 against the proposed DDL**: same EIN, one
character shorter, `typeof` still `text`, and **no error of any kind**.

**WHY IT IS A HARD REQUIREMENT AND NOT A CAUTION: EVERY R8 CHECK PASSES.** The
row count is right. The distinct `EIN` count is right. `NOT NULL` holds. **The
PRIMARY KEY holds, because truncated values stay unique.** So the gate that
exists to stop a bad table reaching production cannot see this, and the damage is
silent, national in scope, and confined to organizations whose EIN begins with a
zero — which is a geographic skew, since the leading digit is the IRS district
prefix.

**NO SCHEMA CONSTRUCT PREVENTS IT.** Not the type, not the key, not a CHECK. It
is a property of how the loader emits values, which is why it lives in the script
contract.

**HOW `ein` IS PREVENTED FROM REACHING A NUMERIC EMISSION PATH AT ALL, RULED
2026-09-08. THIS IS PART OF THE REQUIREMENT ABOVE, not a separate note**, and it
is here for the same fuse reasoning that put the requirement here: recorded only
on A113 it would disappear at first compliance, which is when it starts mattering.

**THE REQUIREMENT ABOVE SAYS EVERY `EIN` IS EMITTED QUOTED. IT DOES NOT SAY WHAT
STOPS A GENERIC EMITTER FROM UNQUOTING IT**, and a generic emitter is the obvious
shape to reach for.

**THE OBSERVED BEHAVIOUR.** `scripts/provision-institution.mjs:74-78` is the only
value-literal helper in the tree. Its second branch is
`if (typeof v === 'number') return String(v);`, so a numeric value is emitted
UNQUOTED. Measured 2026-09-08 against the function as written: `sqlVal(42103594)`
returns `42103594`, bare.

**FOR TWO COLUMNS THAT IS CORRECT.** `revenue_amt` is `INTEGER` and `ruling` is
`INTEGER NOT NULL` (`migrations/0022_bmf_table.sql:60-61`), and both want a bare
numeric. **The number branch is not a defect; it is right for two of the seven and
catastrophic for one.**

**FOR `ein` IT IS THIS SECTION'S VIOLATION, PRODUCED BY THE EMITTER ITSELF.**
Verified 2026-09-08 against the shipped `bmf` shape: the unquoted form stores
`42103594` at **length 8**, the quoted form stores `042103594` at **length 9**,
`typeof` is `text` in BOTH cases, and **no error of any kind** is raised on either
— which is the finding stated at the head of this requirement, now traced to a
specific mechanism rather than left as a property of hand-written SQL.

**SO `ein` MUST NEVER REACH A `typeof v === 'number'` TEST.** Whatever emits it
must treat it as text unconditionally, and any numeric conversion applied to the
seven columns must exclude it by name rather than by inspecting its runtime type.

**R29 DOES NOT COVER THIS.** R29 rules the NULL path — nullable columns branch
before escaping and emit the bare keyword `NULL`. **Nothing ruled the NUMBER
path**, and the reason this requirement is HARD applies to it unchanged: every R8
check passes, because truncated EINs stay unique and stay non-null.

**CONCENTRATION AND TYPE-DISCRIMINATION PULL IN OPPOSITE DIRECTIONS HERE, and that
tension is recorded rather than resolved.** The argument for putting all seven
columns through ONE small emitter is that this requirement is invisible to every
R8 check, so the only defence is having exactly one place to get it wrong. **That
argument is intact.** What the measurement adds is that a single GENERIC emitter,
dispatching on runtime type, is itself the mechanism by which `ein` reaches the
number branch. One place to get it wrong is only a defence if that place
discriminates by COLUMN and not by TYPE.

**R29, CORRECTED 2026-09-07: THE TWO PRECEDENTS DIFFER, AND THE DIFFERENCE IS
DANGEROUS.** This paragraph read: "`escapeSql` in both precedents
(`seed-invites.mjs:51`, `provision-institution.mjs:68`) is
`str.replace(/'/g, "''")` and returns the string unquoted, so quoting is the
caller's job at every site." **The last clause is true and the first is false**,
verified by reading both:

- **`seed-invites.mjs:52` is `str.replace(/'/g, "''")`** — it **THROWS** on
  `null`. Loud, and therefore safe.
- **`provision-institution.mjs:69` is `String(str).replace(/'/g, "''")`** — it
  **COERCES** `null` to the literal text `"null"`.

**FOLLOWING THE SENTENCE AS WRITTEN WOULD EMIT `'null'` AS A TEXT VALUE INTO THE
TWO NULLABLE COLUMNS — roughly 1.1 MILLION CELLS — SILENTLY.** `revenue_amt` is
null on 569,235 rows and `ntee_cd` on 574,447. Every R8 check would pass: the row
count, the distinct `EIN`, the `NOT NULL` constraints and the PK are all
untouched by it. **`ntee_cd` would read as the four-character string `null` and
`revenue_amt`, an INTEGER column, would take `'null'` under type affinity.**

**WHICH ONE IS SAFE FOR THIS USE: NEITHER, UNMODIFIED.** `seed-invites`'s form is
the safe BASE, because failing loudly on an unexpected null is the right default
— but slice 1 has 1.1M EXPECTED nulls, so it must not reach `escapeSql` at all.
**The nullable columns are branched BEFORE escaping and emit the bare SQL keyword
`NULL`**, never `''` and never `'null'`. `String()`-wrapping is refused outright
here: it converts the one failure mode that announces itself into the one that
does not.

**Corrected NOW rather than by the build (R29), because a contract left wrong is
a contract the build inherits**, and this is the sentence an implementer would
reach for first.

**Quoting remains the caller's job at every site**, which is what makes the EIN
requirement above a script obligation rather than a schema one.

**This is mode 7 of §4**, and the §4 row is the failure mode; this is the
obligation.

**One structural difference from both precedents, and it is the whole
difficulty.** They generate ONE SMALL temp file. This generates roughly **152 MB
across about 5,600 statements**. Neither precedent has a resumable write, a
progress signal, or a partial-failure state, because neither ever needed one.

**R28, 2026-09-07: THE `--local` / `--remote` SKELETON ABOVE DOES NOT BIND SLICE
1, AND THIS SECTION SAYS SO RATHER THAN LEAVING IT TO BE RECONCILED.** That
contract was written before the slice split existed and assumes a script that
EXECUTES. **Slice 1 makes no database contact by ruling (R21)**, so both flags
are meaningless and a `DB_NAME` constant has nothing to name.

**SLICE 1 IS EXEMPT FROM EXACTLY THREE THINGS:** the `--local` / `--remote`
usage-docblock pair, the `DB_NAME` constant, and the `spawnSync` on
`wrangler d1 execute`. **EVERYTHING ELSE IN THIS SECTION STILL BINDS:** `scripts/`
placement, `fail(msg)` exiting 1, the gitignored temp file, `escapeSql` as
corrected above, chunking to the byte budget, and the EIN quoting HARD
REQUIREMENT.

**Recorded because a contract a slice cannot satisfy is worse than one it is
exempt from:** the first reads as a defect and invites someone to invent a
`--local` flag for a script with nothing to connect to.

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

**THE IRS POSTS ON THE SECOND TUESDAY OF THE MONTH**, documented in IRS
Publication 5926 and consistent with the 2026-08-11 posting. **The cadence is
close but not exact:** the 2026-09 file carries `Last-Modified` 2026-09-07, a day
BEFORE that month's second Tuesday. **A scheduling fact for load planning, not a
rule** — do not build a check that assumes the exact day.

**R26, 2026-09-07: ALL BYTE COUNTS ARE FROZEN ON FIRST DOWNLOAD, the same
treatment the 28-column header string requires.** Only `eo1` at **48,629,769 B**
is recorded above; the other four or five are UNRECORDED, so the Download row's
"recorded sizes" is today a check against one file. **Capture them on the first
run with R8d provenance naming the extract date.**

**AND TREAT THEM AS A DATED RECORD RATHER THAN A PERMANENT CONSTANT**, on R23's
reasoning: a regenerated file changes sizes, so a frozen byte count verifies the
extract it was measured from and nothing else. **The same is true of the header
string, with one difference worth knowing: the header is expected to be STABLE
across extracts and the sizes are expected to MOVE**, so a header mismatch is a
refusal and a size mismatch against a NEW extract is an update.

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

**THE ENUMERATION IS AT THE END OF THIS SECTION, ADDED 2026-09-07.** The six
paragraphs below are kept EXACTLY as written, because three of them carry
retractions that are load-bearing and are not the enumeration's to fold away.
They are modes 3, 2, 10, 18, 4 and 14 of that table, in the order they appear.

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

**R20, 2026-09-07: A PRE-FLIGHT CREDENTIAL CHECK RUNS BEFORE THE MULTI-MINUTE
REMOTE CALL — a cheap authenticated read that exercises the credential, and on
failure REPORTS AND STOPS.** It never auto-relogins (R20a): §10 records that a
precautionary re-login was unnecessary and should not become a habit.

**THE PARAGRAPH ABOVE IS NOT RETIRED BY IT AND STANDS FOR THE MID-CALL CASE.**
The pre-flight **cannot prevent a token expiring DURING the call**, which is
exactly what that paragraph describes, so "credential staleness mid-load is
UNADDRESSED, recorded not solved" remains true as written.

**WHAT THE PRE-FLIGHT DOES BUY, stated so the two are not confused.** It
addresses starting a long operation with an ALREADY-STALE token — the more common
case, and the one that wastes the most time. **And it moves that failure to
second zero, where "did it partially apply" has an unambiguous answer**, which
the mid-call failure does not.

### The enumeration, derived 2026-09-07

**TWENTY-SIX MODES. THE COUNT MOVED BECAUSE A LIST REPLACED A NUMBER, NOT
BECAUSE ANYTHING CHANGED IN THE TREE.** "Twelve failure modes" was asserted in
three places and enumerated in none, which is the count-is-not-a-list pattern
filed in CLAUDE.md §5.1. This is the list. It was re-derived from the tree at
HEAD by execution and grep, deliberately NOT reconstructed from the pass that
asserted twelve, so it is checkable rather than restated: every row cites a line
or a section, and a later reader can delete a row and say why.

**"§4 NAMES FOUR" WAS FALSE IN ALL THREE CITATIONS.** This section names SIX
under its own bold leads, plus a seventh as a clause. That error is checkable in
seconds and survived three restatements, which is the same pattern one level
down from the missing list.

**THE COUNT IS NOT ITSELF A CONSTRAINT, and must not become one.** Nothing here
establishes that twelve was wrong about a set nobody wrote down. What twenty-six
is, is sourced. **Cite the list, never the number.**

`wrangler` citations are against the shipped **4.111.0** in `node_modules`, the
same version §7 and §12 are sourced to. Bundle line numbers are version-specific;
the surrounding strings are stable and are the thing to grep for.

| # | Mode | Mechanism, sourced | §4 before | Loader detects |
|---|---|---|---|---|
| 1 | Wrong file set, all six | Double-loads 4,906 orgs; the symptom is a duplicate key far downstream of the cause. §3, file-set row | UNNAMED | yes, and now at INSERT under R10b |
| 2 | Partial download | Byte count against `Content-Length`. Nothing written | NAMED | yes |
| 3 | Bad header | Every header must equal the 28-column string exactly. §3 | NAMED | yes |
| 4 | Archive exits non-zero having extracted completely | `2026_TEOS_XML_05A.zip` exits 3 with all 84,172 members correct | NAMED | only by not trusting the exit code |
| 5 | Leftover aside from a prior failed run | A failed swap leaves the aside present; the prescribed rerun-from-the-start then fails at `CREATE TABLE` | UNNAMED | yes |
| 6 | CSV quoting, column shift | 6 comma-carrying names in 278,014 (§5). The tree has NO quote-aware CSV parser: `readRosterFile.js` returns zero double-quote matches and is capped at 10 MB against a 48.6 MB first file | UNNAMED | yes, by §5's null counts and row sampling |
| 7 | NULL escaping | `escapeSql(str)` is `str.replace(...)` at `seed-invites.mjs:51-53` and `provision-institution.mjs:68`, so it THROWS on `null`, and the two nullable columns are null on 569,235 and 574,447 rows. The silent branch is worse: `''` where SQL NULL was meant folds absent into zero, which §1 forbids | UNNAMED | throw is loud; the silent branch only by §5's null counts |
| 8 | Statement over the 100,000-byte ceiling | `SQLITE_TOOBIG`, bisected. §3, §8 | UNNAMED | yes, at generation |
| 9 | R2 upload rejected, or bytes do not match the md5 etag | Three guards, one state: `cli.js:231286` non-200, `:231294` missing etag header, `:231297` etag mismatch | UNNAMED | yes, by wrangler |
| 10 | Server-side import error | `cli.js:231314-231318` on `status === "error"`; `:231303` on `!success`. Modes 1, 7, 8 and 15 surface here on the remote path | NAMED, by dependence | yes |
| 11 | Residue after a FAILED import | The rollback guarantee is printed by the client BEFORE the import runs (`cli.js:231184-231188`). §7 calls it the most load-bearing unverified fact in this plan; open item 1 has the success path proven and the failure path untested | the correction rests on it | **NO** |
| 12 | "D1 reset before execute completed!" | `cli.js:231213-231218`, a distinct terminus from mode 10 | UNNAMED | loud, but leaves indeterminate state |
| 13 | Poll loop never terminates | `pollUntilComplete` recurses with no attempt cap, no backoff and no deadline, `cli.js:231302-231336` | UNNAMED | only by wall-clock outside the loader |
| 14 | Credential staleness mid-import | `requireAuth` runs once at `cli.js:231161`; every poll re-uses that token through `d1ApiPost` at `:231337` | NAMED, UNADDRESSED | yes when it fires, not preventable |
| 15 | `EIN` uniqueness stops holding in a regenerated file | §1 re-asserts per load; under R10b it fails at INSERT with `UNIQUE constraint failed: bmf.ein`. Distinct from mode 1 in cause and in remedy | UNNAMED | yes |
| 16 | The R8 gate CANNOT fail on two of its five checks | R10a and R10b make R8-2 and R8-3 tautologies. `d1-window-generate.mjs:85` declares neither a key nor an index | UNNAMED | n/a, a failure of the detector |
| 17 | The R8 gate blocks a GOOD load | Bands hardcoded from one extract at one time (R8d), and §5's EXACT null counts conflict with R8-4's BAND: only one survives a file the IRS regenerates | UNNAMED | n/a, and still unruled |
| 18 | The swap batch fails wholesale | Live standing, aside present | NAMED | yes |
| 19 | The file is split into more than one invocation | §1's BINDING CONSTRAINT; invisible in the SQL itself | NAMED, as a clause | **NO**, which is why post-swap verification beats the return code |
| 20 | First load has nothing to rename away | R11f: the migration supplies it silently, and generation 1 is then EMPTY, so an R7 recovery to it restores nothing | UNNAMED | the first-run branch yes; the empty-generation consequence is flagged and unresolved |
| 21 | Post-swap state differs from what was verified | R8b: nothing validates the swap operation itself, only the data going into it | half-named | yes, and required |
| 22 | The undo file applies partially, a third state | R6a: it carries the same unverified atomicity as the load, so it must check target names FIRST | UNNAMED | yes, if written to check names first |
| 23 | Pruning drops the generation recovery needs | R8c against R7's three, compounded by mode 20's empty generation 1. R10e flags the per-generation figure as INHERITED, not measured | UNNAMED | partly; a count of retained tables is checkable |
| 24 | The stamp is incomplete, or written out of order | Completion LAST and on success only; R12c puts the `load_check` rows before it. Without that ordering every other field lies convincingly | UNNAMED | yes, by the absence of `completed_at` (R12d) |
| 25 | A load COMPLETES, is WRONG, and nothing alerts | R8f plus A113's Q7: no scheduled execution anywhere in this project, no monitoring surface until Discover exists | UNNAMED | only modes 16 and 17 stand between this and production |
| 26 | The import window logs every MOUNTING user out and blocks sign-in | 14,359 to 17,647 ms, MODE FAIL, one error string. §12, §13 | UNNAMED | measured; RULED accepted, after the shell fix |

**MODE 7 CARRIES A HARD REQUIREMENT, NOT A NOTE, AND IT IS IN §2.** The table
above is an inventory of ways a load fails; the OBLIGATION that follows from mode
7 — that the loader emit every `EIN` quoted — is a requirement on the script and
lives in the script contract, because it is the one mode on this list that every
R8 check passes through untouched.

**CONSIDERED AND EXCLUDED, with the reason, so a later reader does not re-add
them as omissions.** Open item 4, whether retained Time Travel history counts
toward the 10 GB ceiling, is a CAPACITY question rather than a mechanism by which
a load fails. And `checkForSQLiteBinary` (`cli.js:231366-231387`) refuses a binary
SQLite file handed to `d1 execute`, which cannot fire on a file this plan
generates.

**THREE MODES THE LOADER CANNOT DETECT AT ALL**, and they are the ones worth
carrying forward: 11, 19, and the empty-generation half of 20. Mode 11 is already
a §13 precondition on the production load. Mode 19 is a property of how the file
is ISSUED and nothing in the SQL enforces it. Mode 20 is flagged in R11f and
resolved nowhere.

**WHERE THE OLD COUNT AND THIS LIST COULD BE RECONCILED, offered as a
reconstruction and NOT as a claim about what the 2026-09-04 pass meant.** Drop
the modes no loader can act on (11, 19, and half of 20), the two that are
failures of the GATE rather than of the load (16, 17), and collapse the four that
surface through a single remote error path (9, 10, 12, 13), and the list lands
near thirteen. That arithmetic is recorded so nobody performs it silently and
concludes the two agree.

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

**R18, 2026-09-07: THE EXACT COUNTS ABOVE VERIFY THE MEASURED EXTRACT AND ARE NOT
A RECURRING TEST.** They were measured from ONE extract in 2026-08. **The IRS
regenerates this file monthly, so a later extract cannot reproduce them, and
asserting them on a recurring load would fail on the second load by
construction.**

**WHAT THEY ARE INSTEAD: the PROVENANCE of R8-4's band centre.** 569,235 and
574,447 over 1,957,340 are **29.08%** and **29.35%**, and those rates — within a
band — are what a recurring load checks. This is the R8d provenance pattern
applied where it had not yet been applied: the measurement stays, next to the
constant it produced, labelled as its origin rather than as its test.

**THE DISTINCTION IS LOAD-BEARING FOR THE FIRST LOAD ONLY.** Against the 2026-08
extract these exact figures ARE the check, and that is the one run where a
column-shift bug is caught by an exact equality. **Every load after it checks
rates.**

**AMENDED BY R22, 2026-09-07: THE SENTENCE ABOVE NO LONGER DESCRIBES THE FIRST
LOAD, BECAUSE THE 2026-08 EXTRACT IS NOT OBTAINABLE.** Checked against the
Wayback availability API: `eo1` is archived at 2026-08-12, one day after the
2026-08-11 posting; **`eo2` has NO archived snapshot at all**; `eo3`'s closest is
2026-02-25; and `eo4`'s is 2026-08-03, which PREDATES the August posting and is
therefore the JULY extract. **Three different months and one missing file.**
Loading that combination would produce a file set that never existed together,
with organizations doubled, absent or stale — **worse than a fresh download, not
better.**

**SO SLICE 1 PROVES AGAINST A FRESH DOWNLOAD, and R22a rules what the proof
is:** the EXTRACT-INDEPENDENT checks — row count equals distinct `EIN`, per-file
contributions summing to the total, zero malformed rows, zero null `RULING`, and
the four row-level checks including R21b's leading-zero EIN and a comma-bearing
name round-tripping byte for byte. **These hold on ANY extract and are what every
future load actually runs.** The four absolute figures above are not the proof,
which R18 had already ruled.

**R22b, THE COST OF A FRESH EXTRACT IS MEASURED AND IS NEAR ZERO.** The IRS
record count went **1,938,732** on an IRS page dated 2026-03-10 to **1,957,340**
measured in 2026-08 — roughly **0.2% per month**. A September extract is not
meaningfully different data. **Stated with its limit: those two figures come from
DIFFERENT SOURCES**, an IRS page and the spike's own measurement, and are not one
series.

**R23: WHEN SLICE 1 MEASURES A FRESH EXTRACT, ITS FIGURES SIT BESIDE THESE AS A
SECOND DATED PROVENANCE RECORD. They do not replace them.** The counts above
remain the ORIGIN of R8-4's band centre and are still load-bearing for that
constant; **replacing them would erase the derivation of a figure still in
use.** Two dated records, each labelled with its extract, per the
event-versus-state distinction filed 2026-09-07.

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

### THE CORRECTION: the affected population is smaller than the phrasing implies

**Recorded here rather than by editing the ruling above**, which records what a
room decided and is not the agent's to revise. The finding is right; what
follows is what the tree does.

**`/api/me` is fetched once per mount and there is no refetch path**, so a
signed-in user already looking at a rendered surface is UNAFFECTED by the shell.
Their identity is in memory and nothing re-checks it. What breaks for them is
WRITES: each one 500s through its own context and surfaces as a `writeError` in
the form that issued it, which is a different failure from being bounced to
`/signin`.

**The shell defect therefore fires only on MOUNT.** Three ways in: a fresh load,
a hard navigation into `/app/*`, and the bfcache reload at
`AppShell.jsx:203-209` (`:109-115` before the slice that fixed this), which
deliberately re-mounts the shell on a back-forward restore.

**So "every signed-in user across all four surfaces at once" is the population
that would MOUNT inside the window, not the population signed in during it.**
That narrows who meets the false logout, and it narrows it in the same direction
the ruling already moved.

**The ruling's decision is UNAFFECTED.** The shell still expressed a failed
fetch as a logout, that was still wrong on every one of those three entry paths,
and the fix is the same fix. A smaller population meeting a false logout is
still meeting a false logout.

## 14. ProPublica data freshness, from correspondence

**Source: an email reply from Andrea at ProPublica, received 2026-08-21,
answering FT's question about data lag. This is CORRESPONDENCE, not a published
source**, and none of it has been independently verified against their API.
Recorded as a finding rather than a ruling. It changes nothing that is built.

**What she stated, in her terms:**

1. The financial filings data in their older table comes from the **IRS SOI
   annual extract** of tax-exempt organization financial data. That extract is
   where the lag lives.
2. Their site's front end pulls financials **directly from the electronic
   filings they receive**, a different and fresher path than the table above.
3. **Exempt status and deductibility code come from the IRS Business Master
   File, which they update MONTHLY**, so those fields track the BMF itself.
4. A **new API is planned**. No date was given; they will publicize on release.

### Why it bears on the load, and where it does not

**The three-source model treats IRS bulk data as the authoritative status gate
and ProPublica as the floor.** Point 3 says ProPublica's STATUS fields track the
BMF on a monthly cadence, and point 1 locates the lag in FINANCIALS, which the
status gate does not read. **So for gate purposes specifically, and for
organizations PRESENT in the BMF, the freshness gap between ProPublica and a
direct BMF load is smaller than the word "floor" implies.**

**THE QUALIFICATION IS LOAD-BEARING AND IS NOT A DETAIL.** It is the whole
reason this finding does not contradict measured evidence already in the repo.
`propublica-spike-findings.md` section 6 records that **31 of 40 auto-revoked
organizations were served by ProPublica as `status=1`, `deductibility=1`**,
including at its freshest snapshot, and states plainly that this "cannot be
corrected by waiting for a fresher ProPublica snapshot."

**Both are true, and the reconciliation is mechanical.** A monthly refresh FROM
the BMF updates rows the BMF still contains. It does not delete rows that have
DISAPPEARED from the BMF, and disappearance is precisely how the IRS expresses
revocation, per ruling 1. **A monthly cadence can therefore be accurate for
every present organization and still never propagate an absence.**

**What that leaves.** For a present organization, Andrea's answer narrows the
gap. For a revoked one it narrows nothing: the direct BMF load buys the entire
gate, because absence is observable in no other source. The measured 31-of-40
finding stands untouched, and so does fork 1 in the spike doc.

### What this does NOT do

**It does not resolve either precondition on a production BMF load.** Section 13
gates the load on the rollback path (open item 1) and on the auth-observability
gap filed in CLAUDE.md section 11. Nothing above addresses either, and this
section must not be cited as bearing on them.

**It does not re-open the load arc**, and it does not answer open item 3, which
asks whether absence-from-BMF is the whole gate. If anything it sharpens that
item without moving it.

**The planned API is not a plan.** No date, no shape, no commitment beyond an
intention to publicize. It is recorded so a future reader knows to check, not so
that anything waits on it.

## 15. Recovery, ruled 2026-09-07

Twelve rulings — R6, R6a, R6b, R7, R8, R8a through R8f, and R9. **They landed on
the LOADER rather than on a separate recovery path**, which is why no recovery
entry was filed: the work's sequence position is inside A113. §1's swap model,
stamp table and peak-storage figure carry amendment markers pointing here.

**R13 THROUGH R21 SIT IN THIS SECTION AND ARE NOT AMONG THE TWELVE.** R13 and R14
came from the A117 DDL review later the same day; R16 through R21 came from the
loader rulings later still. **None came from the recovery ruling**, and they are
here because they govern the tables and the loader that R6 through R9 describe.
**The twelve is enumerated above rather than left as a number**, so a reader who
counts does not have to guess which postdate it.
**Counted 2026-09-07 AFTER the scope-pass rulings: this section carries
THIRTY-ONE `###` headings** — the twelve, plus R13, R14 and R16 through R29,
plus three that name no ruling at all ("Still unruled", "Not a recovery
question", and "Open, from the R16–R21 rulings"). **Twenty-eight are rulings.**
**THIS FIGURE HAS MOVED SEVERAL TIMES IN A SINGLE DAY AND IS EXPECTED TO MOVE ON
EVERY RULING BATCH**, so a reader meeting a stale count should read it as
staleness and recompute, not as an error.

**R30, RULED 2026-09-07: THE COUNT IS KEPT AND ITS CHANGE HISTORY IS DROPPED.**
This paragraph carried four dated corrections, each naming what the figure had
previously read and why it moved. **R30a, the reasoning, which is the general
point: a figure that is CHECKABLE does not need a record of having been wrong; a
LESSON does, and that lesson is already filed.** Four dated corrections in a
section header is prose accumulating around a number anyone can recompute in a
second — the count-versus-list shape in miniature, arriving as its own inverse.

**RECORDED INLINE RATHER THAN AS A `###` RULING OF ITS OWN, deliberately.** A
heading for R30 would make this section thirty-two and its own ruling count
twenty-nine, so recording a ruling about the count would change the count it
governs. **The reason sits next to what it governs, which is §6.16's relocation
test rather than a special case.**

R15 is absent by design: it governs entry closure and is recorded on
`docs/outstanding.md`, not here.

### R6. The backup artifact is a RETAINED DATED TABLE, not an exported `.sql`

Unanimous team recommendation, FT deferred to it. **The deciding argument is that
`d1 export --remote` is itself an availability event**, warning in wrangler's own
words that the database will be unavailable to serve queries. So back-up-then-load
is TWO outage windows rather than one, and recovery from an export is a full
re-import, which reruns the very operation being recovered from.

**Undo is two renames on metadata**: no data movement, no outage, no re-parse.

**R11f, ADDED 2026-09-07: THE MIGRATION IS THIS SWAP'S FIRST GENERATION, and
that is why the empty table it creates is CORRECT rather than merely harmless.**
This ruling renames live to a dated name and the aside into place. **On load ONE
there is nothing to rename away unless the migration created it.** R8e defines
first-run behaviour for the TREND CHECK and nothing defines it for the SWAP;
**the migration supplies it**, silently, and that went unrecorded until the A117
scope pass. **One consequence, flagged and NOT resolved:** generation 1 is then
an EMPTY table, so a recovery to it under R7 would restore nothing.

### R6a. CONDITION on R6: the undo file must be safe to rerun

The undo file is itself a remote `d1 execute --file`, so **it carries the same
unverified atomicity as the load** (§7, and open item 1). It must therefore check
target names FIRST, so that a partial application can be re-driven rather than
leaving a third ambiguous state that is neither the old table nor the new one.

### R6b. CONDITION on R6: the compliance answer depends on the seven fields

**The compliance answer holds BECAUSE the table carries only the seven IRS
fields.** If it ever carries anything derived, computed or enriched, the retained
copies stop being copies of a federal file and become **historical snapshots of
StewardHouse's own characterizations**, which is a different object and touches
§7. **Recorded as a condition on any future column change, not as a discovery
waiting to be made.** Also recorded in `migrations/0022_bmf_table.sql`, which
defines the table. **Pointer updated 2026-09-07 when A117 closed**; it named that
entry, and a closing entry cannot hold a citation.

### R7. Retain THREE generations

**Cost is flat across the plausible range.** Each load replaces the previous
retained copy, so the retained set does not grow with time: roughly 303 MB per
generation against a 10 GB ceiling. **Three buys a wider window to notice a
problem at no marginal cost.**

### R8. The loader's own checks GATE the swap

Run PRE-SWAP, against the aside table:

- row count within a band;
- distinct `EIN` count EQUAL to row count;
- non-null on the four fields measured non-null nationally;
- null rate on the two nullable fields within a band of the measured 29.08% and
  29.35%;
- a TREND comparison against retained generations rather than a single prior.

**Any failure means NO SWAP.** The aside table is left named and stamped failed,
and live is untouched.

**AMENDED 2026-09-07 BY R16, R17 AND R18. The five above are kept verbatim as the
ruled set; what each one MEANS is now settled and two of them changed subject.**

- **Check 2 and check 3 are no longer data counts.** R16 converts them to
  PRE-SWAP CONSTRAINT ASSERTIONS, `aside_schema_pk` and `aside_schema_notnull`.
  As data counts they cannot fail: a duplicate `EIN` and a null in a `NOT NULL`
  column cannot survive the load, verified by execution.
- **Check 4's band centre is now provenance-backed rather than a repeated
  measurement.** R18: §5's exact counts are the ORIGIN of 29.08% and 29.35%, not
  a recurring test.
- **Check 5's "trend" is defined.** R17: computed over `row_count` in STAMP rows,
  ±10%, against the mean of prior COMPLETED loads, skipped on loads one through
  three and RECORDED as skipped.

### R8a. NO override flag

**A failed check cannot be bypassed at runtime.** Bands are changeable only by
editing the loader, committing and rerunning.

**The reasoning is an asymmetry.** The cost of a wrong block is
investigate-and-rerun, which is cheap precisely because live was never touched.
The cost of a wrongly-permitted swap is a bad table in production that nothing
else would catch.

### R8b. POST-SWAP assertion required, not only pre-swap checks

Row count on the LIVE table matches what was just verified, and the dated retained
table exists under the expected name. **Nothing currently validates the swap
operation itself**, only the data going into it.

**AMENDED 2026-09-07 BY R13b: THE ASSERTION ALSO READS `index_list` ON THE LIVE
TABLE AND CHECKS THE THREE INDEX NAMES ARE PRESENT.** Indexes travel with a table
through a rename, so a swap moves whatever the aside was built with, and an aside
built from a drifted DDL puts a differently-indexed table into production with
the row count still correct. **R13 prevents that drift at AUTHORING time by
generation; this catches it at RUN time, and it is the cheaper half.**

**A PRE-SWAP SCHEMA COMPARISON WAS REFUSED AS THE PRIMARY MECHANISM**, and the
reason is worth keeping: comparing the aside against the live table validates
nothing on load ONE, because live is the empty table the migration created and
there is no meaningful prior shape to compare against. **It would first do useful
work on load two, by which point the drift has already shipped once.**

### R8c. Pruning folds into the loader

After a verified-good swap the loader drops the oldest generation beyond three.
**Retention becomes mechanism rather than discipline**, and the drop only ever
runs after a verified swap.

### R8d. Provenance next to any hardcoded measurement

The null-rate figures were measured from ONE extract at ONE time. **Source and
date go next to the constant.** Same shape as A111.

### R8e. First-run behaviour defined explicitly

The trend check has no baseline until roughly the fourth load. **What runs on
loads one through three is stated rather than left to be discovered.**

### R8f. No monitoring surface until Discover exists

Nothing reads the table. **The loader's checks plus the stamp are the COMPLETE
detection story for now**, and that is a deliberate stopping point rather than an
omission.

### R9. The stamp carries CHECK RESULTS, not a boolean, and the upgrade rides A113

§1 rules one row per source with completion written LAST and on success only,
which distinguishes finished from interrupted **but not correct from incorrect**.
The row therefore also carries the R8 results. **A113's scope pass proposes the
amended table shape as part of the slice.**

**This AMENDS a ruled design and is recorded as an amendment, not as an
implementation detail.**

### R13. The LOADER is authoritative for the DDL; the migration derives from it

**Q5 of the 2026-09-07 DDL review.** Authority sits with the artifact that runs on
EVERY load, not the one that ran once. **The loader carries the full table
definition as a single named constant, extending R10c from the index list to the
whole shape.**

**R13a, SEQUENCING, AND IT CONVERTS AN ORDERING PROBLEM INTO A TEST.** A117 comes
before A113, so the migration is written BY HAND first and is the PROVISIONAL
source until the loader lands. **When the loader's constant is authored the
migration is REGENERATED from it: byte-identical proves the derivation
retroactively, and any difference is drift found on day one rather than on load
twelve.** The ordering is not worked around and not inverted; it becomes the
control the regeneration is checked against.

**R13b is recorded at R8b above**, because it amends that ruling and applies
whether or not R13 does.

### R14. A generation table is `bmf_gen_YYYYMMDDTHHMMSSZ`

**Q7 of the 2026-09-07 DDL review.** Concretely `bmf_gen_20260907T164748Z`. Four
properties, each load-bearing:

- **The `bmf_gen_` prefix is a NAMESPACE and must NOT be `bmf_`.** The aside is
  `bmf_aside`, so **a pruner matching `bmf_%` would catch an in-flight aside and
  could delete it mid-load.** This is the only naming decision here that can lose
  data.
- **UTC always, with the `Z`.** A timestamp without a zone is a fact that cannot
  be interpreted later, and retention order depends on interpreting it.
- **ISO 8601 BASIC, no separators but the `T`, so no name ever requires
  quoting.** R6a's undo checks target names first, and a name requiring quoting
  is one someone eventually fails to quote.
- **Lexical order equals chronological order**, so the pruner is `ORDER BY name`
  and parses no dates.

**The timestamp is the load's START and matches `load_stamp.load_started_at`**,
so a stamp row and its generation table are joinable by inspection. **It must
therefore be known when the aside is created**, not computed at swap time.

**R14a. THE UNDO CREATES A GENERATION TABLE TOO.** R6a renames live to a dated
name and the retained generation back into place, so **the undo needs its own
timestamp in the same format, and the stamp row for the undo records it.**
Otherwise a rollback produces a table nothing recorded.

### R16. R8-2 and R8-3 become PRE-SWAP CONSTRAINT ASSERTIONS, not data counts

**As data counts they CANNOT FAIL**, verified by execution: a duplicate `EIN` and
a null in a `NOT NULL` column cannot survive the load. Converted, they check that
**the schema is the one you think it is**: read `table_info` and `index_list` on
the ASIDE, BEFORE the swap, and assert the PRIMARY KEY is on `ein`, the named
columns report `notnull=1`, and the PK's automatic index exists.

**R16 AMENDED ON ITS OWN RULING DAY: `aside_schema_notnull` ASSERTS FIVE COLUMNS
INCLUDING `ein` — `ein`, `name`, `city`, `state`, `ruling`.** As first written it
said "the four columns", meaning the nationally-non-null four, **which would have
left `ein`'s own `NOT NULL` asserted by nothing.** A non-INTEGER `PRIMARY KEY` in
SQLite does not imply `NOT NULL`; §10's promoted filing and the migration's own
comment both record that the explicit `NOT NULL` on `ein` is load-bearing and is
the first thing a tidy-up removes. **So the exact drift R16 exists to catch would
have passed all three assertions as originally specified.**
**RECORDED AS THE SAME CLASS AS ANCHOR-ON-HEADER:** the assertion was correct and
the SPECIFICATION was too narrow. The gap was found by checking the check against
what it was for, which is the only thing that finds this class.

**R16a, WHY THIS IS MORE THAN TIDYING.** R13 makes the loader authoritative for
the DDL and the migration derived from it, so **the loader builds the aside from
its own constant and nothing currently checks that the constant produced what it
claims.** R13b asserts the three index NAMES after the swap and says nothing
about the primary key or the NOT NULLs. **An aside built from a drifted DDL could
carry the right indexes and the wrong constraints, and the swap would ship it
with every count correct.**

**R16b. THEY RUN PRE-SWAP AND ARE PART OF THE GATE**, not a post-swap
observation. R8b catches drift after it shipped; catching it before means the
aside is discarded and live was never touched.

**R16c. THEY ARE NAMED FOR WHAT THEY CHECK** — `aside_schema_pk`,
`aside_schema_notnull` — so the `load_check` rows read honestly. **Two of R8's
five are now checks on the LOADER rather than on the DATA, and the naming must
make that visible.**

### R17. "Trend" is computed over `row_count` in STAMP rows, ±10%

Over stamp rows rather than generation tables, **because stamps accumulate while
generations are pruned at three**. The band is ±10% against the mean of prior
COMPLETED loads.

**R17a. THE BAND IS PROVISIONAL AND MARKED AS SUCH**, the same treatment the
index set gets under R10c. **Nobody has measured month-over-month variance in the
BMF file; 10% is a reasoned guess and must not read as a measurement.** Revisable
once three or four real extracts exist.

**FIRST ACTUAL DATA ON THAT GUESS, 2026-09-07, AND IT IS NOT A RULING: THE BAND
IS ROUGHLY TWO ORDERS OF MAGNITUDE TOO LOOSE.** Real month-over-month movement is
about **0.2%, roughly 3,800 rows**, derived from 1,938,732 on an IRS page dated
2026-03-10 against 1,957,340 measured in 2026-08. **±10% tolerates about
196,000.** Stated with its limit, as at R22b: those two figures come from
different sources and are not one series, and one derived comparison is not a
variance measurement.

**THE BAND IS NOT RE-TUNED HERE**, because R17a rules it revisited TOGETHER with
R8-4's null-rate band once three or four real extracts exist, and **one derived
comparison is not that.** What this does is sharpen the objection already
recorded at R17c: a band that tolerates 196,000 when the real signal is 3,800
catches a halved file and misses the small systematic drop, **which is now
quantified rather than argued.**

**R17b. ON LOADS ONE THROUGH THREE THE CHECK IS SKIPPED AND THE STAMP RECORDS
THAT IT WAS SKIPPED**, not that it passed. A `load_check` row reading "skipped,
insufficient history" is honest; **an absent row reads as an omission.**

**R17c, RECORDED SO IT IS NOT COUNTED AS COVERAGE IT DOES NOT PROVIDE.** A 10%
band catches a file that HALVED. **It does NOT catch a small systematic drop —
4% of 1,957,340 is roughly 78,000 organizations — and that is the failure most
likely to occur.** A tighter band would produce blocked loads requiring a code
edit each time, since R8a permits no override. **This gap is open, not solved.**

### R18. §5's exact null counts become PROVENANCE, not a test

**The band governs a recurring load.** §5 asserts 569,235 and 574,447 exactly,
measured from ONE extract in 2026-08. **A file the IRS regenerates monthly cannot
reproduce them, so asserting them would fail on the second load by
construction.** They are restated as the ORIGIN of R8-4's band centre — those
counts over 1,957,340 being 29.08% and 29.35% — **which is the R8d provenance
pattern applied where it had not yet been applied.**

### R19. Downloaded extracts live in a gitignored cache and are CACHED

**RULED PATH: `.bmf-cache/` AT THE REPO ROOT.** Three reasons for caching at all:
a failed load means re-running, and re-downloading roughly 152 MB turns a
five-minute retry into a twenty-minute one **on the slice most likely to need
several attempts**; caching FIXES the extract across attempts, so a parse
difference between run one and run three is a parse difference and not a file
difference; and a directory is one gitignore line where a filename pattern is a
guess.

**WHY ROOT RATHER THAN `scripts/`, decided against the repo and not by taste.**
`.gitignore` contains **ZERO nested ignored directories**, and all four
`scripts/` entries are FILE patterns; every ignored directory sits at root. It is
tool state the loader maintains and may delete, which is `.wrangler/`'s role, and
`.wrangler/` is at root. Root also survives the loader moving out of `scripts/`.
**Stated honestly: every ignored directory in that file today is TOOL-defined, so
this is the first project-chosen one and sets a precedent rather than following
one.**

**THE `.gitignore` LINE IS NOT WRITTEN HERE.** Recording the ruling is docs; the
line is a code change and is owed by the build slice.

**R19a. THE CACHE RECORDS WHICH EXTRACT IT HOLDS** — source date and download
date, or a directory named for the extract date. **A cached directory with no
marker is how August's file gets loaded in October believing it is October's.**

**R19b. THE CACHE IS NOT A BACKUP.** Safe to delete at any time, and the loader
re-downloads cleanly if it is gone. **If the cache and the stamp's `file_set`
ever disagree, the STAMP is the record and the cache is the suspect.**

### R20. A pre-flight credential check runs before the multi-minute remote call

A cheap authenticated read that exercises the credential; **on failure it REPORTS
AND STOPS.**

**R20a. IT NEVER AUTO-RELOGINS.** §10 already records that a precautionary
re-login was unnecessary and should not become a habit. **The pre-flight reports;
it does not fix.**

**R20b. WHAT IT DOES NOT BUY, and §4's record must keep saying so.** It cannot
prevent a token expiring DURING the call, so §4's "credential staleness mid-load
is UNADDRESSED, recorded not solved" **stands for the mid-call case**. What the
pre-flight addresses is starting a long operation with an ALREADY-STALE token,
which is the more common case and wastes the most time — **and it makes that
failure happen at second zero, where "did it partially apply" has an unambiguous
answer.**

### R21. The slice-1 boundary stands: parse and emit, no database contact

**It is the only part unblocked**, and it isolates the one component with no
precedent in this repo and a failure mode aggregates cannot catch. **The test
that makes it right rather than merely convenient: slice 1 can be PROVEN on its
own against §5's measured distributional figures, and slice 2 cannot be proven
without slice 1.** That is the correct direction.

**R21a. SLICE 1's DEFINITION OF DONE IS WRITTEN BEFORE IT IS BUILT, or it
drifts.** Its output is a roughly 152 MB gitignored artifact that goes nowhere
until slice 2 exists, **so "done" is a file on disk and a set of numbers
matching — not a working feature.**

**R21b. THE PROOF INCLUDES A ROW-LEVEL CHECK, not only the distributional
figures.** Specifically **a quoted EIN carrying a leading zero**, because §5
already warns a quoting bug hides at six-in-278,014 density and §2's EIN quoting
HARD REQUIREMENT lives in this slice.

### R22. Slice 1 proves against a FRESH download, not the 2026-08 extract

**Forced by evidence rather than chosen.** The 2026-08 extract is not obtainable:
`eo1` archived 2026-08-12, **`eo2` not archived at all**, `eo3` closest at
2026-02-25, `eo4` at 2026-08-03 which is the JULY file. **Three months and a
gap** — a set that never existed together. Full detail and the R22a/R22b
reasoning sit in §5, beside the figures they govern.

### R23. New figures sit BESIDE §5's as a second dated provenance record

**They do not replace them.** §5's counts remain the origin of R8-4's band centre
and are still load-bearing for that constant. **Replacing them would erase the
derivation of a figure still in use.**

### R24. The emitted INSERTs target `bmf_aside`

R14 establishes `bmf_gen_` as the generation namespace and `bmf_aside` is already
the aside's name throughout §1 and the generator. **Naming `bmf` would emit
statements that could load straight onto the LIVE table if the file were ever
executed by hand — a foot-gun for zero benefit.**

### R25. Both a JSON sidecar and a stdout summary

The **sidecar** sits beside the emitted `.sql` and is what slice 3's verifier
reads; the **stdout summary** is what a human reads when the run finishes.
`scripts/d1-window-generate.mjs` already writes a JSON summary, so the shape has
precedent.

### R26. All byte counts are frozen on first download

Recorded at §3 with the header string it parallels. **Dated record, not permanent
constant** (R23's reasoning), since a regenerated file changes sizes.

### R27. An in-memory `node:sqlite` parse-check does NOT violate R21

**R21 excludes D1, and the reason it excludes D1 is that D1 is REMOTE, GATED,
SHARED and FT-RUN.** An in-memory database that exists for microseconds inside a
verifier is a **PARSING TOOL, not a database**: no persistence, no target, no
operator step. It is also the cheapest available proof that the emitted file is
loadable at all.

**THE DISTINCTION IS RECORDED AS THE REASONING, NOT JUST THE PERMISSION, so a
later reader does not extend it to a LOCAL D1 STORE — which IS persistent, IS
bound to the tools, and is exactly what §10's double-store filing is about.**
In-memory and ephemeral is the test; "not remote" is not.

### R28. §2's `--local` / `--remote` skeleton does not bind slice 1

Recorded at §2. **Exempt from three things** — the flag pair, `DB_NAME`, and the
`spawnSync` — **and bound by everything else**, including the EIN quoting hard
requirement.

### R29. §2's `escapeSql` sentence is corrected NOW, not by the build

Recorded at §2, with the false clause quoted rather than deleted. **The two
precedents differ: one THROWS on null, one coerces it to the text `"null"`**, and
following the sentence as written would put `'null'` into roughly 1.1 million
nullable cells silently. **A contract left wrong is a contract the build
inherits.**

### Open, from the R16–R21 rulings and not settled by them

**TWO, flagged by the team and recorded as open rather than as rulings.**

**THE TWO UNMEASURED BANDS ARE REVISITED TOGETHER.** R17's ±10% trend band and
R8-4's null-rate band are both reasoned guesses, and **neither should be tuned
alone** — they are revisited once three or four real extracts exist and
month-over-month variance can be measured rather than assumed.

**R17c's GAP STANDS.** The trend check misses the failure most likely to occur, a
small systematic drop. **Recorded here as well as at R17c so it is not lost in a
sub-clause**, because a check that catches the unlikely case and misses the
likely one is worse than none if it is read as coverage.

### Still unruled — FOUR

None of these blocks the loader build.

1. Whether a **pre-load export** is acceptable given it is itself an availability
   event.
2. Whether **§9's Time Travel disqualification** covers only BMF swaps or the
   database's disaster-recovery story generally.
3. Whether **sandbox-before-production ordering** becomes a rule, and what
   enforces it given nothing in this repository is machine-enforced.
4. Whether the **sandbox's existence reopens §13's option (b)**. This was one of
   the eight open questions of 2026-09-04 and was absent from the 2026-09-07 list
   as first delivered. **FT ruled the same day that it STAYS OPEN** — neither
   withdrawn nor resolved — which is why this set is FOUR rather than three.
   **The reasoning:** §13 rejected a second database as a way to dodge the import
   window, and R2 authorized one as a test venue, which are not in conflict.
   **But the overhead §13 priced is now being paid anyway**, and whether that
   changes the availability calculus is unanswered.

### Not a recovery question, surfaced and NOT filed

**There is no user-facing plan for the outage window post-pilot.** No record of
what a user is told, of expected duration, or of whether anyone is notified.
Verified 2026-09-07 as unfiled everywhere: zero hits for outage, downtime,
maintenance or notification across the OPEN queue, and nothing in `docs/` or
CLAUDE.md. **§13 rules what the SOFTWARE RENDERS** during the window, a retry
state rather than a redirect, which is a rendering behaviour and not a plan for
telling anyone. **Pre-pilot it is a non-issue.** Held unfiled pending an FT
ruling.

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
