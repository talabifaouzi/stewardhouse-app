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

---

## Session — 2026-09-01 (second)

Every line number and count below was re-proven against the tree at HEAD
`4cee27a`, not carried from session notes.

**Scope, and a boundary worth stating precisely.** `git rev-list --count
24a6682..HEAD` returns SEVEN, but this entry covers SIX. The seventh is
`ef2f0c4`, which is the PREVIOUS session's own closing commit: it wrote the
`## Session — 2026-09-01` block above and the CLAUDE.md size-guard paragraph. A
log entry cannot cover the commit that wrote the entry before it, so `ef2f0c4`
is named here rather than logged, and the chain reads continuously.

**The shape of the session.** Six commits, of which **exactly one changed
code**. The other five are `docs/filed-defects.md` appends: three defect
filings and two parked rulings. Every one was a pure append with zero
deletions, verified before each commit by a line-count reconciliation and a
sha256 of the region above the insertion.

---

### The six commits

#### 1. `d0091c1` — File the empty-authenticated-roster null% sublabel

An authenticated enterprise roster with NO athletes renders the literal string
`"null% of program"` as the Actively progressing tile's sublabel.
`consentAware` is `athletes.some(a => typeof a.claimed === 'boolean')`
(`enterpriseStats.js:38`), which returns false on an empty array without
invoking its predicate, so control takes the template-literal branch and
stringifies a null `activelyProgressingPct`. The R4 guard that would catch it is
nested inside the `consentAware`-true arm and is never reached in the one state
that produces this null.

Both `EnterpriseRoster.jsx:139-141` and `EnterpriseOverview.jsx:39-41` carry it,
from character-identical expressions; those are the only two unguarded
interpolations of the value in `src/`. A non-empty authenticated roster CANNOT
reach it, established by enumerating every `setAthletes` call site in
`AthletesContext.jsx` rather than assumed: four insertion paths route through
`toAthleteElement`, whose `claimed` is `!!row.person_id` (`athletes.js:111`),
and the fifth writes `claimed: false` (`AthletesContext.jsx:163`).

**A citation collision is recorded in the filing rather than worked around.**
The rate rule is labelled R4 at `enterpriseStats.js:94-95`, but the R4 in
CLAUDE.md §5.1 is the unrelated P-3c standalone-consent-card ruling. CLAUDE.md
carries the rate rule unlabelled in §5, inside FORK 1. The filing cites the code
and §5, not §5.1.

#### 2. `9ec0f4c` — Withdraw the label line-height term from the stat-grid filing

A second correction inside the stat-grid stacking filing. The `label 18` term
was `11 × 1.6`, and 1.6 never reaches that element: `labelStyle`
(`StatTile.jsx:79-86`) declares `fontSize` and no `lineHeight`, and every tile
renders through `ClickableTile`, which is a `<button>`. `global.css:54-57` gives
`button` only `font-family: inherit` and `cursor: pointer`, so the UA
stylesheet's directly-applied `line-height: normal` wins over the inherited
`--sh-line-normal`. Confirmed by grep: no `line-height` or `font-size`
declaration targets `button` anywhere in `src/styles/`, and `src/` carries no
third stylesheet.

**No replacement figure was given, deliberately.** `normal` resolves from the
font's own ascent, descent and line-gap metrics, which are not in the source,
and the filing had already been wrong twice from assumed line-heights (1.2, then
1.6). The term is recorded as UNSOUND and WITHDRAWN rather than corrected a
third time, and the totals become upper bounds with the linear sensitivity
stated so a later reader can rescale.

#### 3. `e396306` — Park the iOS app scoping item

FT ruled 2026-09-01 that a StewardHouse iOS app, IF built, must be a real
functioning app designed for the phone, not a truncated or reflowed desktop
view, and that a PWA or add-to-home-screen wrapper does not satisfy the ruling.
Audience: individuals certainly, advisors and enterprise possibly, Operations
OUT. **PARKED**: no design, no build, no dependency, nothing in the current arc
shaped around it.

Scoping notes carry the obstacles with their evidence: the session rides a
cookie (`me.js:43`, `auth.js:174`, `credentials: 'include'` on every client
call) and no inbound bearer path exists in the tree, the only `Bearer` being the
outbound Resend key at `sender.js:39`. Magic links, the Apple Developer account
and App Store review are recorded with their platform requirements marked
UNVERIFIED, because none is establishable from this repository. The
honesty-surface note observes that the current discipline holds partly because
there is ONE renderer.

#### 4. `4cc46de` — File the flow-content-inside-button violation

Flow content is rendered inside `<button>` at **20 sites across 7 files**. The
HTML content model for `button` is phrasing content; `p`, `div`, `h1`-`h6`,
`ul`, `li` and `table` are flow content and are not permitted there. The filing
enumerates every site by file and line.

**`Button.jsx` is CLEAN**, and the filing says so, because it means the shared
button component is not the problem. It renders a bare `{children}` at `:107`;
of 124 call sites exactly one passes an element child
(`CurriculumLibrary.jsx:122`, a `<span>` wrapping a `<Tag>`, which renders a
`<span>` root at `Tag.jsx:22`). Both phrasing. The 20 sites are all hand-rolled
`<button>` elements written outside the shared component.

Consequence is stated as what is and is not established: browsers render it
without visible error, which is why it survived, and whether it changes
accessibility-tree exposure or screen-reader announcement is UNVERIFIED and
cannot be established from the tree.

**The count itself is the durable part.** The first scan reported 3 sites, not
20, because its matcher was built by string concatenation and lost a backslash
twice. It was caught by asserting a known-positive control. That hazard is now
also filed in CLAUDE.md §10.

#### 5. `7cff1c1` — Move the enterprise tile-grid floor from 180px to 160px

**The session's only code change.** Four lines across two files: the `minmax`
floor at `EnterpriseRoster.jsx:429` and `EnterpriseOverview.jsx:233`, and the
comment above each, which names the number and therefore moved with it.

**Scope was ruled to these two grids only.** Seven other sites carry the
identical 180px declaration and were deliberately left: `PracticeHome.jsx:69`,
`Endowment.jsx:281`, `AdvisorPracticeDetail.jsx:387`, `IndividualDetail.jsx:652`,
`InstitutionDetail.jsx:205`, `OrganizationDetail.jsx:183` and
`OperationsSurface.jsx:451`. They span three surfaces and hold different content
at different densities. `ProgramSummary.jsx:288` was already at 160px, so the
value was not new to the tree.

**Screened locally by FT, and confirmed live on production at 6+1.** At 375px
the grid goes from ONE column to TWO, so the change reaches the full current
iPhone range rather than only 390px and above. At 1104px and up every desktop
viewport gains a column, 5 to 6, wrapping seven tiles as 6+1 rather than 5+2.
Seven tiles still cannot occupy one row at either floor: that needs 1216px of
content box against a 1136px ceiling.

**THE COMMIT MESSAGE WAS AMENDED TWICE BEFORE THE MERGE, and the first amend
corrected a FALSE CLAIM.** The original body asserted, with emphasis, that 375px
was UNCHANGED at one column. It is not; FT's screen showed two. The scoping
arithmetic had been right, putting the 2-column threshold at 366px, but it was
summarized wrong and the error carried into the message. The second amend added
which boundaries the screen confirms and which remain source arithmetic: the
four widths screened confirm 366px and 1104px, while 557px, 748px and 928px are
unscreened. Both amends were message-only, proven by an identical tree hash
`7537d83e` and an empty `git diff 73c141c HEAD`.

**Not demo-tree byte-identical, and deliberately so**: the grid is ungated, so
both trees change identically. Nothing leaked between them.

#### 6. `4cee27a` — Park the athlete soft-delete ruling and its gap

FT ruled 2026-09-01 that athlete deletion should be SOFT rather than hard: a
deleted record hidden from the surface but RETAINED, as notes or metadata, for a
period, and available if requested. **The retention period is NOT SET** and is a
founder-judgment item.

Shipped behaviour does not match, at two sites. `athletes.js:446` and
`athletes/[id].js:100` are true hard deletes, writing no marker and deleting no
children because both rely on the four inbound `ON DELETE CASCADE` foreign keys.
The row and its children are unrecoverable. The anonymize path
(`athletes/[id].js:119-146`) is recorded accurately rather than lumped in: a row
survives and the surface hides it, which is the ruling's shape, but `name` goes
to `'redacted'` and every identifying column is NULLed, so it retains nothing.

**Scope is why it is parked.** Twelve `selectFrom('athlete')` sites exist in
`functions/` and they do not share a predicate: six carry the Sunset exclusion
and six do not. Missing one leaks a deleted athlete back onto a roster, visibly
at `me.js:403`. No soft-delete column exists on `athlete`, so it needs a
migration; `person` carries `soft_deleted_at` from 0001, but
`invites/[id].js:52-63` records that column as DELIBERATELY UNUSED because the
purge ruling E assumes does not exist.

**The legal retention standard is explicitly not answered**, and the entry
states no retention period, no statutory requirement and no compliance claim.

---

### Branch pruning

**ONE branch was pruned this session**, not five. The five recorded under the
previous entry at `:362-371` were pruned in that session and are not restated
here.

`slice-tile-floor-160` was cut off `main` at `4cc46de`, carried the tile-floor
commit, was merged fast-forward, then deleted BY NAME. Before deletion its tip
and `main` were the same commit, `git rev-list --count main..slice-tile-floor-160`
returned 0, and `git ls-remote --heads origin slice-tile-floor-160` returned
zero refs, so nothing was removed from the remote and no ref was orphaned.

Local branches stand at four: `main` and the three audit branches. No
`--merged` sweep was used, per the §6.9 bulk-prune hazard.

---

### Open items carried out of the session

**Two parked rulings, neither scheduled.** The iOS app (`e396306`) and athlete
soft delete (`4cee27a`). Both are recorded to be FOUND later rather than acted
on, and both name a founder-judgment item left open: the Apple Developer account
identity in one, the retention period in the other.

**The soft-delete ruling makes an open CLAUDE.md filing downstream of itself.**
The §10 foreign-key entry asks whether production D1 enforces the cascades that
`athletes.js:446` and `athletes/[id].js:100` depend on. If soft delete is built,
those two paths stop existing in their present form and the question stops being
load-bearing for them.

**One supersession banked without confirmation.** `4cee27a`'s body records that
the ruling supersedes an earlier same-session direction to add a precondition
guard to the hard-delete paths. That direction could not be located in the
agent's visible context at write time, and the discrepancy was flagged before
the commit and again before the push. It banked either way. If the
characterization is wrong the correction is a new appended entry, not a message
edit, since the commit is now pushed.

**Three of the five filings rest on source arithmetic, not rendered
measurement**, and each says so in its own text. The one code change is the
exception: it was screened by FT locally and confirmed on production.

---

## Session — 2026-09-01 (third)

Every count below was re-proven against the tree at HEAD `2726d40`, not carried
from session notes.

**Scope, and it is narrower than it first looks.** `git rev-list --count
55b0434..HEAD` returns ONE. This entry covers TWO commits, because `55b0434` is
the commit that WROTE the block above and so could not be covered by it, the
same self-reference the second block records for `ef2f0c4`.

**Two commits named in the session brief are ALREADY COVERED and are referenced
rather than restated:** `7cff1c1`, the tile-grid floor, at `#### 5.` of the
second block, and `4cee27a`, the parked athlete soft-delete ruling, at
`#### 6.`. Neither is repeated here.

**The shape of the session.** One docs commit and one build slice. The build
slice is the substantive work and is the first change to the authentication path
since the July outage.

---

### The two commits

#### 1. `55b0434` — Amend the FK filing, file the scanner defect, log the session

Three docs-only edits, 284 insertions with zero deletions across CLAUDE.md and
this file.

The §10 foreign-key filing was AMENDED rather than rewritten. Its claim that
local evidence was "a node:sqlite session, not D1" understated it: a stronger
probe predates the filing by twelve days at `invites/[id].js:65-75`, dated
2026-08-15, run through `wrangler d1 execute --local` against a `VACUUM INTO`
scratch copy, exercising CASCADE, SET NULL and a NO ACTION rejection. Local
enforcement is VERIFIED; production remains unverified, so the conclusion is
unchanged and only the evidence base moved. The amendment also records the
delete-path asymmetry and notes the filing is now downstream of the parked
soft-delete ruling.

§10 gained a new `### Filed —` sub-block for the scanner defect: a matcher built
by string concatenation lost a backslash twice, once writing the script to disk
and once in JavaScript's single-quoted string evaluation, leaving the literal
class `[s>/]` so tags followed by a space never matched. It reported 3 sites
where there were 20. The lesson recorded is to assert a KNOWN-POSITIVE CONTROL
before trusting any scan count.

#### 2. `2726d40` — Stamp magic-link send outcomes to auth_send_log

**The session's substantive work, and the first change to the auth path since
the July outage.** Migration **0021** adds `auth_send_log`, append-only, one row
per ATTEMPTED send, with a TEXT UUID key, TEXT ISO timestamp and a CHECK on
outcome. `sendMagicLink` now CATCHES the send failure, STAMPS the outcome, and
RETHROWS the original error object unwrapped.

**THE FINDING THAT MADE THE RULING LOAD-BEARING, and it is the reason this slice
is worth a log entry at all.** better-auth's magic-link endpoint awaits the
callback and then returns `ctx.json({ status: true })` UNCONDITIONALLY
(`dist/plugins/magic-link/index.mjs:75-81`). It inspects no return value and
wraps the call in no try/catch. **So swallowing the error would have produced a
200 and told users their email had been sent when it had not.** FT's no-quiet-
lies ruling was therefore the difference between a correct implementation and a
broken one, NOT a preference expressed over a working alternative. Catch-and-
swallow was never a viable shape here; RETHROW was the only one, and the
constraint is what surfaced that rather than a design instinct.

The second constraint has its own mechanism: the stamp write carries its OWN
try/catch and swallows, so a D1 failure inside the stamp cannot replace the send
error. That is concrete rather than defensive, because §11's diagnosis reads
`Resend send failed: {status}` to name the cause, and a stamp error surfacing in
its place would destroy exactly that signal.

**SCREENED END TO END BY FT, on all three paths.** A successful send wrote a
success row. A DELIBERATE 401 wrote a failure row **with the Resend diagnostic
intact**, and the user still saw "Sign-in is temporarily unavailable", which is
the client-observable-unchanged constraint holding under the exact condition it
was written for. The allowlist refusal wrote NOTHING, as ruled. The slice was
then merged, the migration applied to remote, and the behaviour verified LIVE IN
PRODUCTION with a real send.

**THE LIMIT, stated plainly because the commit body states it and the table's
own docblock states it.** NOTHING READS THIS TABLE. There is no cron, no
scheduled worker and no triggers block anywhere in this project, so nothing can
read it on a schedule. **This bought FINDABILITY, not MONITORING.** A human who
already suspects a problem can now answer "since when" from D1 instead of from a
live reproduction; nobody is told. Alerting is PARKED, and unparking it needs a
decision about adding scheduled execution to this project, which would be new
infrastructure rather than a slice.

The migration docblock carries the blind spot in full: a row exists only where
the Worker reached the catch block and D1 was writable, a gap means quiet or
broken and cannot distinguish them, the correlation is adverse, and a success
row is the only positive signal against no expected-rate baseline.

---

### Operational findings

Two things went wrong in the mechanics of shipping this, both worth the runbook
because both were silent and neither is in it.

**`d1 migrations list --remote` FAILED WITH 7403 WHILE `d1 execute --remote`
WORKED**, on the same token, the same database and the same account in the same
window. `wrangler whoami` showed the `d1 (write)` scope present. So this was not
a missing permission in any form the tooling reports.

**The workaround used, and it is the transferable part:** read the
`d1_migrations` table directly with a plain SELECT through `d1 execute --remote`,
which returned the applied list and established that production stood at `0020`
with no gaps. The apply itself then ran normally. **The cause is UNKNOWN and is
recorded as unexplained rather than diagnosed.** Two commands against one
database disagreed about authorization, and nothing observed explains why.

**`.dev.vars` WAS CORRUPTED TO UTF-16 A SECOND TIME**, by a deliberate paste
through Notepad. **The failure is silent at every layer**, which is what makes it
worth recording rather than merely annoying: wrangler prints "Using secrets
defined in .dev.vars" whether the file is readable or not, and every variable
loads EMPTY rather than erroring.

**DETECTION: the BOM reads `255 254`.** The check is a one-line node read of the
first two bytes of the file, comparing against those values; UTF-16LE begins
`0xFF 0xFE`, and a correct file does not. The repair is a PowerShell in-place
round-trip, reading the file as `[Text.Encoding]::Unicode` and writing it back
as ASCII.

**THE VISIBLE TELL AT SERVER START is an absence, which is why it is missable:**
NO `env.*` secret lines appear in the bindings table wrangler prints on boot.
Nothing says "these failed to load"; the rows simply are not there, and a reader
who does not know what the table should contain sees a normal-looking startup.

---

### Branch pruning

**ONE branch was pruned.** `slice-auth-send-stamp` was cut off `main` at
`55b0434`, carried the auth slice, was merged fast-forward and then deleted.
Local branches stand at four: `main` and the three audit branches. No `--merged`
sweep was used, per the §6.9 bulk-prune hazard.

---

### Open items carried out of the session

**Alerting is parked and is now the named next decision.** The table records;
nothing watches. Unparking requires scheduled execution, which this project has
never had.

**RETENTION ON `auth_send_log` IS UNBOUNDED AND UNRESOLVED.** Append-only, no
purge, and Ruling E Clause 3's shortest-defensible-window is counsel-gated and
unanswered. It joins four existing unpruned tables, with one difference the
migration records: those grow with deliberate operator actions, and this one
grows with input from anyone who can reach the sign-in form.

**Two operational findings above are recorded here and NOT yet in the runbook
sections they belong to.** The 7403 disagreement belongs beside §6.10's remote
procedure; the `.dev.vars` encoding failure belongs beside §6.12's secrets
discipline, which today covers reading secrets safely and says nothing about the
file being unreadable. Neither move is made in this commit.

**The parked rulings from the second block are unchanged**: the iOS app
(`e396306`) and athlete soft delete (`4cee27a`), each still carrying a
founder-judgment item left open.

---

## Session — 2026-09-01 (fourth)

Queue state, not build state. No commit was made in the session that produced
this entry, and CLAUDE.md is untouched.

**FT ran a read-only COUNT against remote `stewardhouse-pilot` on 2026-09-01:
`cohort_period_snapshot` holds ZERO rows.** A39's window is therefore confirmed
open rather than assumed.

**F5 is answered and has left the FT-only section of `docs/outstanding.md`.**
That section's count moves from 5 to 4, and the remaining IDs are deliberately
not renumbered.

---

## Session — 2026-09-02

Docs only. No code, no migration, no branch per §6.3. **No write of any kind was
issued against remote in this session**: every remote fact below came from an
FT-run read-only SELECT. Tree facts were proven at HEAD `06ed32d`.

**The session opened as a scoping pass on A11**, the Tier 0 entry in
`docs/outstanding.md`, which said migration 0021 was not applied to remote and
that every production send therefore recorded nothing.

---

### Both of A11's premises were refuted

**Premise one, that 0021 was not applied to remote: FALSE.** Remote
`d1_migrations` holds 21 rows, `0001_initial.sql` through
`0021_auth_send_log.sql`, no gaps, 0021 `applied_at` 2026-09-01 17:21:20 UTC,
which is 13:21:20 EDT.

**Premise two, that nothing is stamped on production: FALSE.** `auth_send_log`
exists on remote and holds one row: `attempted_at` 2026-09-01T17:22:27.805Z,
which is 13:22:27 EDT, outcome `success`, `error_text` null. The remote DDL
matches `migrations/0021_auth_send_log.sql` column for column, types, NOT NULL
flags and the `outcome` CHECK included.

**Every timestamp in this entry carries BOTH zones, so the sequence reads
without converting anything.** The two remote stamps are UTC, and only
`attempted_at` labels itself, with an explicit `Z`; `applied_at` carries no
suffix and is UTC as well, which is the pairing worth stating rather than
leaving to a reader. It precedes `attempted_at` by 67 seconds. So the apply was
followed a minute later by a real production sign-in send, and the verifying
event is that live send rather than a smoke. Commit times below are EDT, as
`git log` reports them here, and are paired the same way.

**One thing re-read along the way and worth recording.** The stamp fires on BOTH
paths, not only on success. A non-2xx from Resend throws in
`functions/_lib/sender.js`, lands in the catch at `functions/_lib/auth.js:466`,
and `'failure'` binds at `:467` with the thrown message. The single remote row
is a success row because that is what the one production send did, not because
the failure branch is unreachable.

---

### The session log was right and two other records were not

`docs/session-log.md` already carried the apply, twice, in its third 2026-09-01
entry: "the slice was then merged, the migration applied to remote, and the
behaviour verified LIVE IN PRODUCTION with a real send", and separately "the
apply itself then ran normally". Banked at `0d1f2fe`, 13:30:35 EDT, 17:30:35
UTC, nine minutes after the apply.

`docs/outstanding.md` committed at `d077ea2`, 15:53:49 EDT, 19:53:49 UTC, about
two and a half hours later, carrying A11 and F4 as open. Both were produced from
CLAUDE.md's §11 rider and its §5.1 migration-count correction, which carried
`2726d40`'s commit-time framing and had been overtaken the same day.

**That file's header already states that the session log wins where it disagrees
with it.** The rule was right. In practice the precedence ran the other way,
because CLAUDE.md was read as the state of record and was not reconciled against
the session log. It is now recorded in that header as the second known weak spot
of a sweep built this way.

---

### The commit

One docs-only commit, three files.

**`docs/outstanding.md`.** A11 CLOSED and F4 ANSWERED, both removed with named
notes on the F5 precedent and with no renumbering. Tier 0 kept as an empty
heading so the ruled tier numbering does not move. FJ-1 corrected, kept OPEN and
kept in FOUNDER JUDGMENT. Header counts to 75 OPEN and 3 answerable only by FT,
with the tiers figure made explicit at 8 because it had been left for a reader
to derive by subtraction. Second known weak spot added to the completeness
section.

**CLAUDE.md.** §5.1's 0021 local-only sentence and §11's rider 1 both corrected
to record the apply and the verifying row, with the retired clauses quoted in
place rather than edited away. Rider 2, unbounded retention, untouched and still
live. "WHAT STANDS: nothing reads the table" untouched and still true. §10's
7403 filing amended rather than rewritten.

**`docs/session-log.md`.** This entry.

---

### The third 7403, and the first controlled discriminator

**A third 7403 occurred on 2026-09-02, on the first remote call of the session,
and the identical command succeeded later in the same session.** That is the
first time token, account, database and command were all held constant across a
failure and a success. The 2026-09-01 pair could not do that, because there the
two commands differed.

`docs/arc-history-individual.md` carries a fourth mention, older than all of
these and cross-referenced by none of the 7403 records: a first attempt that
returned a "transient" 7403 masking the real 7500. It is the only place in the
tree that calls a 7403 transient.

**Recorded in CLAUDE.md §10 as an OBSERVATION.** The cause is still unknown, no
diagnosis was written, and no runbook rule was added, because the existing
filing instructs a later session to record what it finds rather than treat the
entry as an explanation, and one controlled pair is not enough to write a step
on.

---

### Open items carried out of the session

**FJ-1's evidence gate is cleared and the item stays OPEN.** The false clause is
gone. What is left is a reading question only FT can settle: BMF precondition 2
names two defects in one sentence, "magic-link sends stamp nothing", now closed
on production, and "there is no health check", still open as A13 and blocked on
scheduled execution. Which of the two "the observability gap" meant decides
whether the rollback path is the only precondition left before the BMF load.
Not ruled here.

**A13 and A12 are unchanged.** Nothing reads `auth_send_log`, and its retention
is still unbounded, waiting on ruling E Clause 3. The apply made the table real
on production; it did not make anything watch it or prune it.

**A count that was previously derivable only by subtraction is now written
down.** The tiers portion of the OPEN breakdown carried no figure, so the total
reconciled only if a reader did the arithmetic. It now reads 8.
