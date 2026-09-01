# Session log

Rolling. One entry per session, written for a reader who was not present and has
no chat history.

**APPEND NEWEST LAST.** A new session's entry goes at the BOTTOM of this file,
below every existing one, so the file reads forward in time. That is the
ordering `docs/pilot-gate-criteria.md` §6 already states for its re-score log
("newest row last") and the one `docs/filed-defects.md` follows in practice; one
convention across the rolling docs is worth more than each being locally
optimal. Entry headings are `## Session — <date or date range>`.

**Re-prove citations rather than carrying them.** Every line number in an entry
should be checked against the tree at the HEAD that entry closes at. Line
numbers move, and an entry written from session notes will cite positions that
have already shifted.

**What this file is, and is not.** It is a chronological, cross-surface record
of work as it happened. It is NOT a surface history: `docs/arc-history-*.md`
hold those, organized per surface by arc and finding, relocated from CLAUDE.md
§5 on 2026-07-08. It is not a defect queue either; `docs/filed-defects.md` is,
and entries here point into it rather than restating it.

---

## Session — 2026-08-28 and 2026-08-30

Every line number below was re-proven against the tree at HEAD `e0ff617`, not
carried from session notes.

**A correction to the framing this file was asked for, made here rather than
silently.** It was commissioned as "the 2026-08-30 session". The five commits
span **two days**: `811101e`, `e8bb796` and `8a81fd4` are dated 2026-08-28, and
only `3b0f26b` and `e0ff617` are dated 2026-08-30. Author dates from `git log`.
The work is one continuous thread and is logged as one, but a reader searching
by date should know to look at both.

**The baseline.** The session opened at `58c6042` (2026-08-27 18:37, "Add
review-before-save, selection, and hard delete for Pending athletes") and closed
at `e0ff617`. `docs/filed-defects.md` grew from **957 lines to 1357**.

---

### The five commits

#### 1. `811101e` — Name individual exclusion reasons in the rate disclosure
2026-08-28 10:29. Four files, +205 / -37.
`docs/filed-defects.md` · `PhilanthropicReadiness.jsx` · `RateDisclosure.jsx` ·
`enterpriseStats.js`

**Closed.** `RateDisclosure` named two populations in one generic clause. It now
names each exclusion reason with its own count. `computeStats` gained four
bucket counts, their sum as `excludedTotal`, and a `staged` count
(`enterpriseStats.js:79-86`). Staged import rows are excluded from every bucket:
a row carrying `uncommitted: true` has never been written to D1, so counting it
would report a database population that does not exist. The buckets and
`excludedTotal` are **NULL when `consentAware` is false**, not 0, on the same
reasoning R4 applies to a zero-denominator rate; `RateDisclosure.jsx:62` refuses
null explicitly rather than relying on `null <= 0` coercing true.
`PhilanthropicReadiness` stopped hand-writing its own gate and paragraph and
became a real consumer via an optional `note` prop
(`PhilanthropicReadiness.jsx:130-132`). Its third sentence had claimed
unclaimed athletes "remain at Invited", false for Pending athletes; it now says
they cannot have milestones recorded.

**Left out of scope.** The `management_mode` residual, filed not fixed (see
below).

#### 2. `e8bb796` — File five items found absent from the defect queue
2026-08-28 10:57. One file, +191. Docs only.

**Closed.** Nothing in code. A read-only sweep confirmed five items were absent
from the queue and filed all five. None was fixed.

#### 3. `8a81fd4` — Refuse a cohort snapshot with no writable athletes
2026-08-28 13:24. Two files, +109 / -9.
`docs/filed-defects.md` · `functions/api/snapshots.js`

**Closed.** `POST /api/snapshots` derived `gps_rate` and `cert_rate` over the
full non-Sunset roster and wrote them into NOT NULL columns, so a roster with no
delegated athlete froze **0%** where `computeStats` renders "Not tracked". The
roster aggregate now scopes its denominator to the writable population, adding
`management_mode = 'delegated'` (`snapshots.js:163`) and `person_id IS NOT NULL`
(`:164`) beside the existing filters — both columns already on `athlete`, so no
JOIN. A writable denominator of zero returns **409** with "A snapshot needs at
least one athlete with delegated record-keeping." (`:195`), guarded before the
INSERT so no row is written. 409 rather than 400 (the body is well-formed) or
403 (the caller is correctly gated); 409 has thirteen precedents in `functions/`
for an act the record's state does not permit, and 422 has none.

**Left out of scope.** No NULL is written and no schema changes: the three rate
columns stay NOT NULL, there is no migration, and the F-D filing is untouched.
`attendance_rate` keeps its denominator and its own zero-guard, having no
render-side twin to contradict it. The re-SELECT outside the `try` was filed,
not fixed.

**This is the only commit of the five that touches `functions/`.** `npm run
build` is `vite build` and does not read that directory, so it was verified with
`wrangler pages functions build`, which reported `Compiled Worker successfully`.

#### 4. `3b0f26b` — Pair every enterprise tile with the drill it opens
2026-08-30 10:19. Five files, +199 / -35.
`docs/filed-defects.md` · `EnterpriseOverview.jsx` · `EnterpriseRoster.jsx` ·
`ProgramSummary.jsx` · `categoryFilters.js`

**Closed.** Each tile counted a `computeStats` aggregate keyed on milestone
fields while its drill filtered through `statusFor`, so a tile could count an
athlete its own list would not show. On the live local roster the Invited tile
read **46** and its drill listed **none**. `CATEGORY_CONFIG` is now the only
definition of a category, and counts come from `countByCategory`
(`categoryFilters.js:53`), which runs those same filters, so the two sides
cannot drift by construction. `CATEGORY_CONFIG` gained `'not-yet-invited'`
(`:27`); both surfaces now carry seven tiles, the catch-all plus one per
`statusFor` label. 'Outreach paused' had a key and no tile; 'Not yet invited'
had neither. Tile order is `STATUS_ORDER`, derived once as
`STATUS_CATEGORY_KEYS` (`categoryFilters.js:40`) and read by both grids and by
the `ProgramSummary` sentence. That sentence adopted the same counts and now
names all six statuses with zero-count clauses suppressed
(`ProgramSummary.jsx:94`, rendered at `:135`).

**Left out of scope.** `philanthropicStage`, `accessLabel`, the `ProgramOutputs`
`useMemo`, the `CohortComparison` rollup and `snapshots.js`. This slice paired
tiles with drills; it did not unify derivation. `EnterpriseRoster`'s `kindOf`
still gates hard-delete on `statusFor(a) === 'Not yet invited'`, unchanged. The
`certified` / `not-yet-invited` overlap the pairing made visible was filed, not
fixed.

#### 5. `e0ff617` — Take ProgramOutputs' progression rates from computeStats
2026-08-30 10:41. Two files, +109 / -9.
`docs/filed-defects.md` · `ProgramOutputs.jsx`

**Closed.** `ProgramOutputs` derived `certifiedPct` and `gpsPct` itself, dividing
by the full roster and falling back to 0, so Reports said "0% of cohort" on one
sub-page and "Not tracked" on the next. Both now come from `computeStats` and
render through `fmtRate`. **Both lines of each tile** read the writable
population: the value lines take `rateCert`, `rateGps` and `rateBaseTotal` from
`computeStats` rather than deriving new numbers, because pairing a full-roster
count with a writable-scoped percentage would put two denominators in one tile
with nothing on screen saying so. With no writable athlete both tiles render the
page's `NT` constant as their VALUE with no sublabel rather than "0 of 0"
(`ProgramOutputs.jsx:141` gates it), reusing the page's existing absence
convention rather than inventing a second. "of cohort" is gone from both
sublabels. `RateDisclosure` gained its fifth mount
(`ProgramOutputs.jsx:307`), after the last section carrying a rate, because the
two rates sit in different Cards and one instance cannot sit beside both.

**Left out of scope.** The `useMemo`'s other ten derivations,
`philanthropicStage`, `accessLabel`, the `CohortComparison` rollup,
`snapshots.js`, `statusFor` and `CATEGORY_CONFIG`. The "Workshops held" tile,
which renders the same "0 of 0" shape three tiles away, was filed and
deliberately not folded in.

**`RateDisclosure` now has five mounts**, all verified present at HEAD:
`EnterpriseOverview.jsx:146`, `EnterpriseRoster.jsx:179`,
`PhilanthropicReadiness.jsx:130`, `ProgramOutputs.jsx:307`,
`ProgramSummary.jsx:128`.

---

### Branch pruning

Twelve local branches were deleted **by name, one `git branch -d` invocation
each**. No glob, no `--merged` flag, no `-D`. All twelve were ancestors of
`main`, verified before deletion, and all twelve tips remain reachable from
`main`, verified after.

```
slice-0019-0020                     slice-ri-import-upload
slice-ri-auth-comments              slice-ri-invite-endpoint
slice-ri-coalesce-expiry            slice-ri-review-delete
slice-ri-column-sorting             slice-ri-status-branch
slice-ri-import-client              slice-ri-status-map
slice-ri-import-endpoint            slice-rate-disclosure-enumeration
```

Local branches went from 16 to 4. Nothing was pushed or deleted on origin;
`git ls-remote` was byte-identical before and after.

**`qa-audit-enterprise` was protected, and the reason is the point.** It is an
ancestor of `main` with **zero commits ahead** (`c74058a`), so
`git branch --merged main` LISTS it alongside genuinely merged slice branches. A
sweep would have taken it. This is the BULK-PRUNE HAZARD recorded in CLAUDE.md
§6.9 verbatim, and it is why the twelve were named individually rather than
swept. The other two audit branches, `qa-audit-advisor` (1 ahead) and
`qa-audit-operations` (2 ahead), would have survived a sweep **by accident, not
by protection**.

---

### Filings added, with line ranges at HEAD

All nine are in `docs/filed-defects.md`. None was fixed.

| Lines | Filing | Commit |
|---|---|---|
| 959-1014 | `management_mode` carries no CHECK, so the disclosure's four buckets do not exhaustively cover claimed-and-not-delegated | `811101e` |
| 1015-1050 | `athlete.badge` has a ruling and no author | `e8bb796` |
| 1051-1090 | `athlete_activity` exists with an event enum and has no INSERT path | `e8bb796` |
| 1091-1119 | the BMF rollback path is a stated precondition living only in the scoping doc | `e8bb796` |
| 1120-1159 | two controls reported as mobile-as-app violations, one provable and one not | `e8bb796` |
| 1160-1205 | no mobile render check on the sites that now render a Pending athlete | `e8bb796` |
| 1206-1246 | `POST /api/snapshots` re-SELECTs outside its try | `8a81fd4` |
| 1247-1303 | the `certified` and `not-yet-invited` categories overlap | `3b0f26b` |
| 1304-1357 | the "Workshops held" tile renders "0 of 0" | `e0ff617` |

Three of the nine record their own **unverified** clauses rather than asserting
more than was established: whether D1 can return `undefined` from the snapshot
re-SELECT, whether any path can produce a Pending-and-certified row, and whether
the `WorkshopDetail` attendance toggle clears 44px.

---

### Rulings that reversed or superseded a prior ruling

#### P-2 L4 — REVERSED

**This is the one to know about.** `functions/api/snapshots.js` carried, until
`8a81fd4`, a docblock ruling that snapshot rate denominators stay the FULL
non-Sunset roster, attributed to P-2 L4, on the grounds that adopting the FORK 1
consent-aware denominator "would break a mid-series trend."

FT reversed it. The denominator IS now the FORK 1 writable population. The prior
text is **kept verbatim** under a SUPERSEDED heading at `snapshots.js:12-21`
rather than deleted, because it was a ruling and not a detail.

**Current status, and the part with a deadline.** L4's mid-series-trend concern
is **not answered**. It is **mooted**, and only conditionally: the
`cohort_period_snapshot` table holds **zero rows** (re-verified read-only at
HEAD), so there is no series to break. **That window closes the first time a
snapshot is written.** From that row onward a series exists under the new
denominator, and anyone restarting or comparing a series across this change
needs to know the denominator moved. If L4's concern is ever to be revisited on
the merits, it must happen before that first write.

#### The `RateDisclosure` docblock's consumer count — corrected, not reversed

It had claimed four consumers since it was written, while
`PhilanthropicReadiness` rendered its own hand-written gate instead. `811101e`
made the claim true by making that page a real consumer. `e0ff617` then took it
to five.

#### No other reversal

The remaining rulings this session were new, not overturning. `STATUS_PRIORITY`
→ `STATUS_ORDER`, the pairing rule, the enumeration ruling and the refusal
ruling all extended standing positions rather than reversing them.

---

### Open items carried out of the session

**Three unpruned branches**, all fully merged, all zero ahead of `main`. Pruning
is a separate act and was deliberately not folded into any bank.

```
slice-snapshot-write-gate      8a81fd4
slice-tile-drill-pairing       3b0f26b
slice-program-outputs-rates    e0ff617
```

**The D3/D4 root cause is not closed.** The arc paired what renders together; it
did not unify derivation. Four sites still derive athlete state independently of
`statusFor`: `philanthropicStage`, `accessLabel`, the `CohortComparison` rollup
and the `snapshots.js` SQL. `philanthropicStage` and `statusFor` were shown by
execution to disagree on every row of the live local roster.

**Nine filings**, listed above, none fixed.

**The P-2 L4 window**, above.

**Two verification limits worth carrying.** No route was rendered by the agent in
any of the five slices; the browser harness can navigate and read but cannot
reliably click (CLAUDE.md §9), so every claim about what a page shows on load
rests on executing the tree's own expressions, and every claim about what a page
does when used rests on FT's own screening. And `npm run build` covers `src/`
only, which is why `8a81fd4`, the one commit touching `functions/`, needed a
separate bundler.

---

## Session — 2026-09-01

Every line number below was re-proven against the tree at HEAD `24a6682`, not
carried from session notes.

**Scope, stated because it is narrower than the gap it sits in.** This entry
covers TWO commits, `82b4a39` and `24a6682`. THREE commits sit between the
previous entry's closing HEAD (`e0ff617`) and `82b4a39` and are logged nowhere:
`ae4d515` (added this file and pointed CLAUDE.md at it), `a63fcee` and
`a9b5ae9`, the last two both filings, across which `docs/filed-defects.md` grew
from 1357 lines to 1792. They are named so a reader following the chain does not
mistake this entry for a continuous record.

**The baseline.** `82b4a39` was authored 2026-08-30 12:12 and `24a6682` on
2026-09-01 09:08, so the two-commit span crosses two days under a single-date
heading. The session closes at `24a6682`, which is `origin/main`.

---

### The two commits

#### 1. `82b4a39` — Accept both name shapes in the roster importer
2026-08-30 12:12. Four files, +203 / -43.
`functions/api/athletes/import.js` · `AthletesContext.jsx` ·
`ImportRosterModal.jsx` · `parseRoster.js`

**Shipped.** The operator DECLARES whether their roster holds one Name column or
a first/last pair, through a toggle above the mapping dropdowns. Nothing is
inferred from the header or from which fields happen to be mapped, and no
splitter exists at any layer: a single Name cell is stored exactly as written,
two halves are joined with one space. `SHAPE_KEYS` in `parseRoster.js` is the
single source that the modal's target set, the three reset sites, `allMapped`
and `toPayloadRows` all follow. `suggestMapping` gained a single-name vocabulary
ordered most-specific-first and still returns null rather than guessing. On flip
the mapped email is preserved and the name targets are cleared, because email
means the same column in both shapes while neither name target can transfer
without asserting something the file does not encode. The endpoint keys
per-shape allowlists on which keys a row carries, so a row mixing the two shapes
is rejected as unpermitted fields rather than by a special case; the shape is
never transmitted, and rejection messages derive from the keys present.
`AthletesContext` reads the same way, so the staged review table and every
rejected-row label show the name that will be stored.

**Left out of scope.** No migration. `findMatches`, the chunking and the INSERT
are untouched.

#### 2. `24a6682` — Move the Excel parse into a Web Worker
2026-09-01 09:08. Two files, +302 / -64.
`readRosterFile.js` · `rosterExcel.worker.js` (new)

**Shipped, and the framing is load-bearing: CONTAINMENT, NOT REPAIR.** SheetJS
0.18.5 still does not stop on a crafted ZIP local-file header, and the spinning
thread runs until terminated. What changed is that it is no longer the UI
thread, so the page survives, the operator keeps their work, and a timeout
becomes possible at all. All SheetJS work moved into `rosterExcel.worker.js`,
read and sheet inspection and CSV conversion together, so `sheet_to_csv` does
not stay behind on the UI thread. Errors cross as strings, because Error objects
do not survive structured clone intact, and the buffer is transferred rather
than copied. The timeout is 10 seconds, chosen by measurement: 500 rows parses
in 7 ms and 50,000 rows at 8.00 MB in 321 ms, the slowest parse that can legally
reach the parser because `MAX_FILE_BYTES` refuses anything past 10 MB first, so
the ceiling sits at roughly thirty times the slowest legitimate parse. SheetJS
is imported statically in the worker, so no code-splitting is needed and
`vite.config.js` is untouched; the chunk stays lazy, with zero SheetJS in the
main bundle and no worker preload in `index.html`.

**Also in this commit.** The size-guard bypass. An object whose size was absent
or non-numeric skipped both the 10 MB ceiling and the 512-byte floor and reached
the parser; it is now refused at `readRosterFile.js:157-159`, because a ceiling
that exists to fail before reading cannot treat an unknown size as small enough.
CSV and TSV are untouched and never route through the worker.

**Left out of scope.** THE HANG ITSELF. It is contained, not fixed. The trigger
is the compression-method byte at offset 8, method 8 hanging where method 0
throws in 1-3 ms, and `MIN_EXCEL_BYTES` is kept for what it is, a cheap
one-case refusal, with its comment no longer claiming more.

---

### Branch pruning

Five local branches were deleted BY NAME. All five were ancestors of `main` with
ZERO commits ahead, verified by `git merge-base --is-ancestor` and
`git rev-list --count` before deletion, and `git ls-remote` confirmed none of
the five existed on origin, so nothing was removed from the remote.

```
slice-excel-worker              slice-snapshot-write-gate
slice-import-name-shape         slice-tile-drill-pairing
slice-program-outputs-rates
```

Local branches went from nine to four: `main` and the three audit branches.

**`qa-audit-enterprise` was retained, and it is the one that needed protecting.**
It is an ancestor of `main` with zero commits ahead (`c74058a`), so
`git branch --merged main` LISTS it beside genuinely merged slice branches and a
sweep would have taken it. That is the BULK-PRUNE HAZARD recorded verbatim in
CLAUDE.md §6.9, and it is why the five were named rather than swept. It is also
**local-only with no upstream**: `qa-audit-enterprise@{upstream}` resolves to
"fatal: no upstream configured", and origin carries four heads, none of them
this one. Per §6.9 pushing it would preserve nothing, because it is a label on a
commit `main` already contains and its audit doc is present on `main`, verified
here with `git cat-file -e main:docs/qa-audit-enterprise-2026-05-30.md`.

---

### Open items carried out of the session

**The SheetJS hang is CONTAINED, NOT REPAIRED.** The worker still spins a full
core until the 10-second timeout terminates it. Nothing upstream closes this:
`package.json:19` pins `xlsx` at `0.18.5`, which per the SHEETJS VERSION ruling
in CLAUDE.md §5.2 is the newest version npm carries, the fixes having moved
off-registry at 0.19+.

**Three commits are unlogged**, named in the scope note above. This file's own
premise is one entry per session, and `ae4d515`, `a63fcee` and `a9b5ae9` have
none.

**Both commits rest on FT's own Chrome screening**, not on agent render. Per
CLAUDE.md §9 the harness can navigate and read but cannot reliably click, and
every claim above about what these two changes do WHEN USED comes from the
screens recorded in their commit bodies.
