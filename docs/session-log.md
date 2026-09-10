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

---

## Session — 2026-09-02 (second)

Two commits. The first banked and pushed the correction slice logged above; this
entry covers the read-only investigation pass that followed it and the filing
commit that closed what the pass found. No code, no migration, no branch.

**The question scoped**, and it was not a defect question: `docs/outstanding.md`
indexes defects and debt, and nothing indexes WHAT REMAINS TO BE BUILT. The pass
gathered evidence for whether such an index should exist. It built nothing and
ruled nothing.

---

### The absent artifact, which is the finding

**No document enumerates required features that are not yet built**, and the
three candidates each decline the role in their own text.

`docs/pilot-gate-criteria.md` **exists and is the instrument**, ruled 2026-08-14,
with five rulings, a counting method and a re-score log. It cannot carry unbuilt
features by construction: its units are one per user-facing DESTINATION and one
per exported HTTP handler, so a feature with no route and no handler has no unit.
It says so of itself, "This instrument measures the tree as it stands", and two
of its own rows record the percentage RISING because units were deleted.

`docs/outstanding.md` is scoped to defects and debt by its own header.
`docs/filed-defects.md` carries the closest artifact, the parked-work set, and
disclaims the role twice: "proposes no build", and "No item here is marked as
belonging in an app, and none is ranked."

**A grep for a roadmap or backlog across CLAUDE.md and `docs/` returns two hits
and neither is one.**

---

### The pilot gate figures are stale, and by how much

**The last score is 2026-08-18 at `fbc1a9a`: capability 80/81 = 99%,
production-usable 57/81 = 70%.** That is A66, which records the gate as
un-rescored, and the pass measured the drift: `grep -c "^export async function
onRequest" functions/api/` returns **38** where the instrument records **35**,
twice, at `87f36f0`. The three new handlers are `athletes/import.js`
`onRequestPost`, `athletes/[id]/invite.js` `onRequestPut`, and `athletes.js`
`onRequestDelete`.

**THE CAPABILITY-VERSUS-USABLE GAP IS ENTIRELY THE TWO ZERO GATES**, which the
instrument states in its own §4: "The gap of 24 units (~29 percentage points) is
entirely the two zero gates." Setting `$.advisor.demo_gate` and
`$.enterprise.demo_gate` would close it without a line of code. That is A44, A69
and FJ-3, and it is FT's step rather than a slice.

---

### Twelve items outside the queue

**How they were found is the transferable part.** A grep of `src/` for `TODO`,
`FIXME`, `HACK` and `XXX` returns **ZERO matches**, so there are no conventional
markers to sweep. The tree records deferral as PROSE instead, in ordinary
comments and in rendered copy: "a later slice", "not yet supported", "coming
soon", "arrives in a later release". Reading for that prose surfaced all twelve.
An index built from defect filings cannot see any of it.

**A80 is the sharpest, and it is the terminal step of a shipped arc.**
`PUT /api/athletes/:id/invite` is built, gated, and ruled a staff act; `src/`
calls it nowhere. Migration 0020 added `'Pending'` to the athlete enum for
exactly this transition, and `athleteStatus.js:7` renders those athletes "Not yet
invited". There is no path in the product from that state to Invited. FT ruled it
into Tier 1 beside A39 rather than into a blocker group.

**One item shrank on re-derivation, and the correction is recorded rather than
quietly applied.** The pass first reported THREE advisor session-scoped writes
that never persist. Re-reading the branches showed two of them,
`ClientWorkspace.jsx:1054` and `CohortDetail.jsx:496`, are correctly gated to the
demo tree, and both of those writes DO persist on the authenticated tree. Only
`CohortDetail.jsx:130-139`, the theme flags, persists nothing on either tree, and
its disclosure at `:361` is ungated. **One site, not three**, filed as A87.

---

### The commit

`docs/outstanding.md`: twelve entries added as A80 through A91, continuing the
existing sequence with nothing renumbered, each placed by the group its blocker
dictates. A42 gained a cross-reference recording that CLAUDE.md calls the same
item the "Stage Rename sibling slice", so a name search finds it. Header counts
to 87 OPEN with the full sub-breakdown recounted against the body first. A third
known weak spot added to the completeness section.

**A84 is not one of the twelve and is worth naming separately.**
`docs/persistence-scoping-pass.md`, Strand 3, Layer 4 states that a retention and
deletion policy must exist BEFORE pilot. No entry cited it as a pilot blocker.
It is the only pre-pilot requirement anywhere outside CLAUDE.md §5.1 and the
criteria doc, and neither of those carries it.

`docs/session-log.md`: this entry.

---

### Open items carried out of the session

**Nothing was ruled about scope.** A80 is placed and its basis recorded; what to
build is not decided here. The other eleven carry the blocker the tree names and
no more.

**The queue is now 87 OPEN and still is not a build plan.** It indexes what is
wrong and what is deferred, in priority order, with blockers. What a pilot
REQUIRES remains one sentence in CLAUDE.md §5.1 plus an instrument that measures
only what already exists.

---

## Session — 2026-09-02 (third)

Decision record. Docs only, no code, no migration, no branch, and no remote
command of any kind. One read-only investigation pass, then this filing.

---

### Ruled

**FJ-1. Build the auth health-check READ SURFACE as an ordinary slice; do not
block the BMF load on it.** Basis: precondition 2 names two defects, the stamp
half is closed on production, and blocking a whole surface on a small endpoint is
the wrong trade. A1, the rollback path, becomes the only standing precondition on
the BMF load.

**FJ-2. Leave A9 as is, narrow and general both.** Basis: FT ruling 2026-09-02.
No cleanup slice and no general ruling on what may sit at rest in remote D1.

**FJ-3. The unset advisor and enterprise gates are a GAP, not an intended
posture, and get fixed as their own scoped slice. Not urgent.** Basis: the gate
is per-person-row per-namespace so designation is safe in principle, but gate and
institution scope are separate checks and nothing asks whether the target
institution or its athletes are seeded. No pilot users exist, so nobody is
hitting the 403s.

**A39. Guard the window; defer the methodology.** Basis: a deadline with no
guard is what "nothing guards it" means. The L4 question cannot be judged with
zero rows.

**NOT RULED, deliberately: FJ-5, the Marcus row.** Deletion is the sound
disposition on the evidence and the record now says so. Withheld because
executing it is a remote DELETE against production and whether production D1
enforces foreign keys is unverified. Sequenced behind A15.

---

### Corrected

**A39 contradicted itself and its own source.** Its bolded sentence claimed
setting `$.enterprise.demo_gate` closes the window. The only INSERT into
`cohort_period_snapshot` is `functions/api/snapshots.js:212`, reachable only
through `POST /api/snapshots`, whose only invoker is a person clicking
`CohortComparison.jsx:145`. The gate returns `{ person }`. Its title and its
cited source were both already right. The A69 coupling clause is removed rather
than corrected: neither ruling FJ-3 nor setting the gate writes a row.

**A13's blocker was wrong for half its own title.** It read SCHEDULED EXECUTION
for both "nothing reads the table" and "no one is told". That blocker is true of
alerting only. The entry is split.

**CLAUDE.md §11 listed three absences as one item with one blocker**, which is
where A13's conflation originated. Amended to separate the read surface from
alerting. The retention rider and "nothing reads the table" as a statement of
current fact both stand untouched.

---

### Deferred

**The P-2 L4 methodology question**, until snapshots exist to evaluate.

**A92**, whether `email` may be emitted from a read endpoint, to FT. It is a
privacy-posture ruling, not infrastructure, and it gates A13 and nothing else.

**FJ-5's execution**, behind A15.

---

### Queue delta

OPEN 87 to 90. Three added: A92 the E8 email-emission ruling, gates other work,
blocker FT; A93 the snapshot-write guard, Tier 1, blocker none named; A94
alerting, gates other work, blocker SCHEDULED EXECUTION.

Two blockers changed. A44 and A69 move from FT's designation to a scoping pass on
which person rows may be designated and against which institutions.

One blocker cleared. A9 moves from an FT ruling to none, ruled leave-as-is, and
stays OPEN because PARKED requires a named blocker and A9 no longer has one.

One entry re-homed. A13 moves from gates other work to cheap and mechanical, its
blocker corrected to none for the endpoint itself with A92 governing the column.

Founder-judgment ruled count 2 to 5 of 6. FJ-5 is the sixth and is explicitly
not ruled.

Tiers 9 to 10; gates-other-work 12 to 13; cheap-and-mechanical 19 to 20. Every
other group unchanged. Recounted against the body before writing: 10 + 80 = 90.

---

## Session — 2026-09-02 (fourth)

Decision record. Docs only, no code, no migration, no branch, no remote command.
A classification pass over `docs/outstanding.md`, and nothing else: no blocker,
tier, group, ID or ordering was changed.

---

### Classified

Every OPEN entry gained one line, `Pilot: BLOCKING | DEBT | POST`, placed after
its Blocker line. PARKED, FOUNDER JUDGMENT, ANSWERABLE ONLY BY FT and RULED OUT
got none.

**BLOCKING** means pilot cannot open with it unresolved: a real user of any
surface would hit it, be misled by it, or be unable to complete a core act.
**DEBT** means pilot can open with it if it is recorded and honest. **POST**
means no pilot user reaches it.

---

### Totals

15 BLOCKING, 50 DEBT, 25 POST. 90 lines for 90 entries, verified by grep against
the file after writing.

**5 of the 25 POST carry "(undetermined)"**: A15, A67, A78, A48, A91. Each was
labelled POST because its own text does not settle the question, and the marker
makes the uncertainty visible rather than guessed.

**The 15 BLOCKING, in file order.** A80, the athlete invite act with no caller.
A17, A18, A19 and A20, the four Tier 2 live honesty defects. A47 and A84, the
retention policy the record states is required before pilot. A44 and A69, every
advisor and every enterprise write returning 403. A24, a Pending athlete stranded
with certification its only exit. A25, one imported athlete discarding a whole
attendance batch. A26, persisted rate columns storing 0 where the render says
"Not tracked". A41, 403 copy asserting what the screen contradicts. A43, advisor
pipeline settings persisting nothing with no disclosure. A68, the enterprise
counsel seams.

---

### A68 promoted, by ruling rather than by inference

**FT RULED 2026-09-02 that A68 is BLOCKING**, moving it from the POST
(undetermined) the first pass gave it. The first pass declined to promote it
because A68's own entry does not state the coupling to A69, and the
classification rule was to judge each entry on its own text.

**The coupling was VERIFIED before the label changed**, in four places, and all
four use standing conditional language rather than a point-in-time observation.
CLAUDE.md §5, the Enterprise row: the gate stays dark "until E3/E6/E8 counsel
clears", and the write arc is "gated dark on production pending E3/E6/E8
counsel". `functions/_lib/gate.js:123-125`: dark "while the E3 ... / E6 ... /
E8 ... counsel seams remain open". `docs/enterprise-persistence-scoping.md`
:524-526: "the enterprise gate ships until E3/E6/E8 counsel clears". And that
document's §11 rulings table carries a live counsel-status field, defined as
`pending` / `confirmed` / `overridden`, reading `pending` on all three.

**What settles it is the present tense.** "remain open" is a condition on
current state; a historical note would read "were open".

Cross-references were added on A69 and on FJ-3's ruling recording the same
coupling. **FJ-3's ruling itself is unaltered**, and the cross-reference says so:
the scoping pass it ruled can still be scoped, and the advisor half acted on,
while the enterprise half waits on A68.

---

### The build chain and the counsel chain

**Three of the fifteen BLOCKING items are counsel-gated and cannot be closed by
building: A47, A84 and A68.** The pre-pilot path is therefore two chains, and no
slice advances the second one.

**What moves the counsel chain is not uniform, and the record splits it.**
`docs/ruling-e-deletion-retention.md` names a reviewing attorney for Clauses 3
and 6, which are A47 and A84. CLAUDE.md §5, the Enterprise row, records the
operating premise for E3, E6 and E8, dated 2026-07-15, as internal review with no
external counsel, which is A68. **Nothing in this repository records counsel as
retained**, and no entry names a date by which either chain moves.

**A12 and A14 are POST while A47 and A84 are BLOCKING**, and the split is
deliberate: the retention POLICY is the pre-pilot requirement, while the purge
MECHANISM needs scheduled execution, which this project has never had and which
cannot arrive before pilot.

---

### Reconciliation added to the header

The three totals, the counsel-chain sentence, and one statement that the queue
count and the pilot-gate percentage measure different things.
`docs/pilot-gate-criteria.md` scores routes and endpoints that EXIST, so 90 open
items and a 99% capability figure are not in conflict: a defect on a route the
instrument scores MET moves no unit, and the instrument has no unit at all for
work never built.

---

### Standing

**This is a FIRST PASS and is expected to be corrected by use.** Each label was
judged from the entry's own text, which is thinner than the filing behind it, so
a label that looks wrong when someone works the item probably is wrong. A68 is
the worked example: the entry's text was thinner than the coupling, the first
pass marked it undetermined rather than guessing, and FT ruled it. Correct the
rest the same way, on the entry, in the commit that surfaced it, per FJ-6.

---

## Session — 2026-09-02 (fifth)

Decision record. Docs only, no code, no migration, no branch, no remote command.
An A80 scoping pass across four areas, then this filing. Every claim below was
re-verified against the tree before it was written, not carried from the pass.

---

### Filed

Nine entries, A95 through A103, continuing the sequence with nothing renumbered.
Five BLOCKING, four DEBT.

**A95** an athlete cannot see their own milestones. **A96** a self-managed
athlete's record is frozen permanently. **A97** the consent interstitial makes
the dead end the primary button. **A98** nothing syncs `athlete.email` to
`person.invite_email`. **A99** three invite refusals instruct an act the product
forbids. **A100** no actor is assigned to the invite send. **A101** the invite
copy is FT-ruled for one path and reused on another. **A102** F-C assumes an
offline conversation the import path never mentions. **A103** a bulk invite has
no outcome-reporting shape.

---

### Ruled

**AN ATHLETE MAY SEE THEIR OWN MILESTONES; STAFF NOTES STAY INTERNAL (A95).**
What the athlete did, lessons, GPS completion, certification and workshop
attendance, is theirs. Staff and advisor notes are internal working material and
are not disclosed. FT's basis, in his words: an informational call's notes are
internal, and the platform should not force advisors or staff to share theirs
either. The ruling names WHAT is visible, not what the screen is.

**INVITED ATHLETES RECEIVE AN EMAIL (A100).** The same as any invite, differing
only in entry point and in who triggered it. The actor remains unassigned: the
ruling settles that a send happens, not which code performs it.

**INVITES ARE BOTH SINGLE AND BULK, AND MOST WILL BE BULK (A103).**

---

### Deferred

**A96 goes to the ADVISORY TEAM, not to FT.** Three options to be argued, in the
order FT gave them and unranked: leave it as is, with no institutional tracking
at all; institution-observable facts only, meaning attendance at the
institution's own events and athlete-owned facts never; or an athlete-facing
progression path. A95's ruling draws a line between institution-owned and
athlete-owned records, and whichever way A96 is decided must sit consistently
with it. That is recorded as an observation, not as a prejudgment.

---

### One correction the verification produced

**A95's data-layer claim was half right as it reached this filing, and the
filing carries the accurate version.** The pass reported that `athlete_note` is a
separate table the `/api/me` query does not join, so emitting milestone columns
exposes no note content. The first half holds and was re-checked: the table is at
`migrations/0009_enterprise_schema.sql:268` and `me.js` never names it. **The
conclusion does not follow on its own**, because `athlete` carries its OWN
free-text `notes` column (`migrations/0020_athlete_pending_status.sql:98`), which
sits in `ATHLETE_ELEMENT_COLUMNS` (`athletes.js:78`) and is emitted by
`toAthleteElement` (`:109`). Milestone columns are safe to emit only if `notes`
is excluded by name, since it rides the same row and the same column list. E8 is
what keeps it staff-only today.

---

### Queue delta

OPEN 90 to 99. Gates-other-work 13 to 15 (A96, A101); cheap-and-mechanical 20 to
22 (A97, A102); large 29 to 34 (A95, A98, A99, A100, A103). Tiers unchanged at
10; gates-a-stated-commitment, BMF-and-Discover and blocker-undetermined all
unchanged.

Pilot totals 15/50/25 to 20/54/25, undetermined unchanged at 5. The
counsel-gated subset is unchanged at three, so the header sentence moves from
"three of the fifteen" to "three of the twenty" without its list changing.

Recounted against the body before writing: 10 + 89 = 99, and 20 + 54 + 25 = 99.

---

## Session — 2026-09-02 (sixth)

Decision record. Docs only, no code, no migration, no branch, no remote command.
An A97 scoping pass, then this filing. Every claim was re-verified against the
tree before it was written, and one was corrected by that check.

---

### Ruled

**BOTH CONSENT-INTERSTITIAL BUTTONS BECOME `variant="secondary"`, AND THE COPY
STAYS EXACTLY AS IT IS (A97).** Neither option is a house default on a consent
choice. `Button.jsx:3` already defaults to `secondary` and `:80` falls back to
it, so `variant="primary"` is an opt-in either way; the ruling removes the
opt-in rather than moving it to the other button.

**THE CONSEQUENCE LINE WAITS ON A96 (A104).** A line naming what `self` does
would have to be true under all three A96 outcomes, and whether such a line can
be written honestly is not established. It is filed rather than attempted.

---

### Filed

**A104, the consent interstitial states no consequence for either option.**
Blocker A96, Pilot BLOCKING, placed in cheap and mechanical immediately after
A97 so the pairing is adjacent on the page. The card renders six strings and none
names an effect.

---

### A97 narrowed

A97's title is the variant, and the swap closes exactly that. Its Detail also
carried the no-consequence finding, which the swap does NOT close, so that moved
to A104. **A97 keeps `Blocker: none` and is NOT marked closed**, the slice being
unbanked. Both entries carry a cross-reference to the other.

**Why the split is the load-bearing part.** Every string currently on the
interstitial is OUTCOME-INDEPENDENT of A96, which is why the swap can proceed
without it. Adding a consequence line is the point at which outcome-dependence
enters. Keeping them as one entry would have blocked a fix that is not blocked.

---

### One claim corrected by verification

**The asymmetry was reported as "the staff side states what delegation ENABLES
while the athlete side never states what `self` DISABLES". Grep corrects the
second half.** Two athlete-facing strings DO state the disablement, both in
`RecordKeeping.jsx` and neither on the interstitial: `:102` `Staff at
{institutionName} can see your progress, but cannot add to it.` and `:116`
`While you manage your own record, staff will not be able to record anything
new.` **What no athlete-facing string says is that NOBODY can record**, which is
the A96 finding rather than this one.

**And one staff-facing string comes closer to naming the freeze than anything on
the athlete side**, `PhilanthropicReadiness.jsx:132`: `Athletes who manage their
own records keep any milestones recorded earlier, but their stage will not
advance here.` The entry carries the corrected version.

---

### Queue delta

OPEN 99 to 100; cheap-and-mechanical 22 to 23; every other group unchanged.
Pilot totals 20/54/25 to 21/54/25, undetermined unchanged at 5. The
counsel-gated subset is unchanged at three, so that sentence moves from "three
of the twenty" to "three of the twenty-one" without its list changing.

Recounted against the body before writing: 10 + 90 = 100, and 21 + 54 + 25 = 100.

---

## Session — 2026-09-03

One build slice, banked and pushed, then this filing. The slice was one line.
The ruling behind it changed mid-slice, and that reversal is the part worth
reading.

---

### Banked

**`2d984ea`, both consent-interstitial buttons become `variant="primary"`.**
One file, one line, net against `9ff661f`:
`src/surfaces/individual/IndividualSurface.jsx:156` moved from
`variant="secondary"` to `variant="primary"`, joining `:153`. No string, label
or heading changed. Fast-forward merged, branch `slice-a97-consent-variant`
deleted by name per §6.9, pushed to origin on FT's instruction. Build clean.

---

### The ruling reversed mid-slice, and why

**FT ruled BOTH SECONDARY. The slice was built that way, verified, and held.**
Verification then reported that two secondary buttons would both be `--sh-card`
on a `--sh-card` interstitial card, separated only by `--sh-border-thin` at
**1.290:1**, below WCAG 1.4.11's 3:1 for identifying a control as a control. On
a card whose entire interaction is choosing between two options, neither option
reading as a button is a worse defect than the one being fixed.
**FT REVERSED TO BOTH PRIMARY on that finding**, and named the distinction
precisely: equal weight was the ruling, secondary was the assumption about how to
express it. Primary expresses it too, at **4.486:1**, and keeps the affordance.
**The ruling did not change. Its expression did.**
**The reversal is the case for the HOLD.** §6.6 exists so a verified spec meets
FT before it banks, and here the verification step produced a fact that changed
the answer. Had the slice committed on approval of the spec alone, a compliant
one-line change would have shipped an unreadable pair of controls.

---

### Filed

**A105, secondary buttons are invisible as controls on untinted cards.** Blocker
none, Pilot DEBT **proposed and explicitly not ruled**. The chain is
`Button.jsx:21` (secondary base is `--sh-card`), `Card.jsx:20` (an untinted Card
is `--sh-card`), `Button.jsx:23` into `tokens.css:117` (the only boundary is
`0.5px #E8E2D6`), giving 1.290:1. **The interstitial is where it surfaced, not
where it lives**, and the A97 swap closed exactly one instance of it. Counted:
124 `<Button>` sites, 29 secondary, and **0 relying on the default**; 155
`<Card>` sites, 134 untinted. **How many of the 29 sit inside an untinted Card is
UNVERIFIED and was not estimated**, because a Button's nearest Card ancestor is
usually in another component, so it is a render question. 29 is the ceiling.

**FJ-7, `--sh-text-on-accent` on `--sh-bronze` misses WCAG 1.4.3 by 0.014.**
4.486:1 against 4.5:1 for 14px/500 label text at `size="lg"`; 8.947:1 on hover,
which passes but is not a resting state and does not exist on touch. Carried by
all 57 `variant="primary"` sites. **Filed as founder-judgment rather than OPEN
because `--sh-bronze` is a §7 locked token and no build slice may move it.** Two
directions stated, neither recommended: adjust the token, or accept the shortfall
and record it. The entry notes that the current state is the second one
undeclared.

**A106, the two consent surfaces disagree about weighting.** Blocker none, Pilot
DEBT. The interstitial now renders both options equal; `RecordKeeping.jsx:145`
and `:148` still render the same two options primary and secondary, inside the
`mode === null` branch whose own comment calls them "equal options". **The
interstitial's weighting is FT-ruled and RecordKeeping's is not ruled either
way**, so the entry is not that RecordKeeping is wrong.

---

### One instrument corrected before its output was used

The Button census first returned **100 of 124** call sites. The parser's
delimiter guard mishandled CRLF, so every site whose tag opened at a line ending
was skipped. It was caught by cross-checking against three independent greps,
which agree at 57 primary / 29 secondary / 38 ghost. **A count that plausible is
exactly the shape CLAUDE.md §10's scanner-control filing warns about**, and the
control is the same one that filing prescribes: verify the instrument against a
figure already known before reading the figure you do not know.

---

### Queue delta

OPEN 100 to 101; cheap-and-mechanical 23 to 24 (A97 out, A105 and A106 in); every
other group unchanged. Founder judgment 6 to 7, unruled 1 to 2. Pilot totals
21/54/25 to 20/56/25, undetermined unchanged at 5. The counsel-gated subset is
unchanged at three, so that sentence moves from "three of the twenty-one" to
"three of the twenty" without its list changing.

**One header invariant was made false by this filing and was amended rather than
left standing.** "Every OPEN entry carries a `Pilot:` line; nothing else does"
stopped being true when FJ-7 took a `Pilot:` line under FT's instruction. The
header now names FJ-7 as the single exception and states that its line is outside
the three totals, which is why the Pilot lines sum to 102 while OPEN sums to 101.

Recounted against the body before writing: 10 + 15 + 7 + 8 + 24 + 34 + 3 = 101,
and 20 + 56 + 25 = 101.

---

## Session — 2026-09-03 (closing)

**This entry covers the WHOLE DAY, not one slice.** Eight commits were banked
across seven working sessions; the seven per-session entries above carry their
own detail and this one does not repeat it.

**A DATE DISCREPANCY A LATER READER WILL MEET.** Seven entries sit under two
dates. `## Session — 2026-09-02` covers `8c1689d`, which WAS banked 2026-09-02
and is correctly dated. The five headed `(second)` through `(sixth)` cover
2026-09-03 commits under a 2026-09-02 heading: the date was wrong in the prompts
that produced them and was caught late in the day. **They are NOT retroactively
changed**, because each records what it recorded when it was written.
`d0258e6`'s commit message carries the same error into immutable history.

---

### Banked

| Commit | Subject | Pushed |
|---|---|---|
| `9af2705` | File twelve deferred-feature items the defect queue could not see | yes |
| `04db42a` | Rule FJ-1, FJ-2 and FJ-3, correct A39 and A13, and split the read surface from alerting | yes |
| `ab18de2` | Classify every open item against the pilot gate | yes |
| `d0258e6` | Ignore QUEUE.md, and add section 6 rule 19 on silent pivots | yes |
| `7ab623f` | File nine A80 findings, and record three rulings and one deferral | yes |
| `9ff661f` | File A104, narrow A97 to the variant, and record two consent rulings | yes |
| `2d984ea` | Make both consent-interstitial buttons primary | yes |
| `28ea227` | Close A97, and file the three findings its slice surfaced | yes |

**`2d984ea` is the day's only code commit.** Every other one is docs, and
`d0258e6` touched neither `docs/outstanding.md` nor this file.

---

### Ruled

| Item | Ruling | Basis |
|---|---|---|
| FJ-1 | Build the auth health-check READ SURFACE as an ordinary slice; do not block the BMF load on it. | Precondition 2 names two defects, the stamp half is closed on production, and blocking a whole surface on a small endpoint is the wrong trade. |
| FJ-2 | Leave A9 as is, narrow and general both. | No cleanup slice, and no general ruling on what may sit at rest in remote D1. |
| FJ-3 | The unset advisor and enterprise gates are a GAP, not an intended posture; fixed as their own scoped slice, not urgent. | The gate is per-person-row per-namespace so designation is safe in principle, but gate and institution scope are separate checks and nothing asks whether the target institution is seeded. |
| A39 | Guard the window, defer the methodology. | A series with zero rows cannot be judged on the merits. |
| A93 | A server-side guard on `POST /api/snapshots` refusing the FIRST write until the denominator change is acknowledged. | The client is not the only caller, so a UI-only guard is not a guard. |
| A95 | An athlete may see their own milestones; staff notes stay internal. | What the athlete did is theirs; an informational call's notes are internal, and the platform should not force staff to share theirs. |
| A100 | Invited athletes receive an email, the same as any invite. | It differs only in entry point and in who triggered it. The actor stays unassigned. |
| A103 | Invites are BOTH single and bulk, and most will be bulk. | Stated by FT. No scope ruled. |
| A97 | Both consent-interstitial buttons become `variant="secondary"`. | Neither option is a house default on a consent choice. |
| A97 | REVERSED mid-slice to both `variant="primary"`. | Two secondary buttons would be `--sh-card` on a `--sh-card` card at 1.290:1, below WCAG 1.4.11's 3:1. Equal weight was the ruling; secondary was the assumption about how to express it. |
| A104 | The consequence line waits on A96. | It would have to be true under all three A96 outcomes, and whether it can be written honestly is not established. |

---

### Deferred

| To | What | Why |
|---|---|---|
| Advisory team | A96, the self-managed athlete's frozen record. Three options: leave as is; institution-observable facts only; an athlete-facing progression path. | Not an FT ruling. Its entry says so on its blocker line. |
| Counsel | Nothing NEW. A47, A84 and A68 were CLASSIFIED as counsel-gated in `ab18de2`, not newly sent. | Nothing in this repository records counsel as retained. |
| Withheld | FJ-5, the Marcus row. Deletion is sound on the evidence and the ruling is deliberately not made. | Executing it is a remote DELETE against production, and whether production D1 enforces foreign keys is unverified. Sequenced behind A15. |
| Deferred in place | A39's L4 methodology; A97's scope beyond the variant; A95's, A100's and A103's scope. | Each ruling names WHAT, not what the screen or the slice is. |

---

### Queue delta

| | Open of day (`8c1689d`) | Close of day (`28ea227`) |
|---|---|---|
| OPEN | 75 | 101 |
| PARKED | 9 | 9 |
| Founder judgment | 6, of which 2 ruled | 7, of which 5 ruled |
| Answerable only by FT | 3 | 3 |
| Ruled out | 10 | 10 |
| Pilot gate | not yet classified | 20 BLOCKING / 56 DEBT / 25 POST |

**What moved, per commit.** `9af2705` +12 (A80 to A91, deferred-feature items no
defect queue could see). `04db42a` +3 (A92, A93, A94, from the FJ-1 and A39
rulings). `ab18de2` +0, and the first pilot classification at 15/50/25.
`7ab623f` +9 (A95 to A103), and 15/50/25 to 20/54/25. `9ff661f` +1 (A104), and
20/54/25 to 21/54/25. `28ea227` A97 out, A105 and A106 in, FJ-7 added, and
21/54/25 to 20/56/25.

**Net for the day: +26 OPEN, +1 founder-judgment item, +3 founder-judgment
rulings.** The rise is filing, not regression: nothing built today broke
anything, and A97 is the only item closed.

---

### Open at close, in priority order

Tier 0 is empty. **Tier 1 holds the next three:**

1. **A80**, `PUT /api/athletes/:id/invite` has no caller, so no path moves an
   imported athlete off `Pending`. Blocker none named. Pilot BLOCKING. It is the
   terminal step of the shipped roster-import arc.
2. **A39**, the P-2 L4 window closes on the first snapshot write and nothing
   guards it. Blocker none; it is a deadline, not a dependency.
3. **A93**, the server-side guard that closes A39. Blocker none named.

Below them: Tier 2's four live honesty defects on routes the pilot gate scores
as MET (A17, A18, A19, A20), then A9, A1, A59, and the grouped bands. **Three
BLOCKING items are counsel-gated and no slice advances them:** A47, A84, A68.

---

### Protocol added

**CLAUDE.md section 6 gained ONE numbered row, rule 19, carrying TWO
prohibitions** (`d0258e6`): never pivot silently, and never pivot over
uncommitted edits. Source: a queue-document prompt arrived two-thirds through
the A80 scoping pass and the pass was lost. It was read-only, so nothing was
damaged. FT's explicit interrupt always wins, and the rule says the cause is
usually upstream.

**`.gitignore` gained QUEUE.md** in the same commit. It is a generated view of
`docs/outstanding.md`, ignored so it cannot become a second source of truth. **No
generator exists in the repo**; it is produced by an agent prompt on demand.

The other CLAUDE.md change today (`04db42a`) was a section 11 amendment, not a
protocol rule: it split the auth read surface from alerting, which had been
recorded as sharing one blocker.

---

### Audit of this log, run before this entry was written

**`d0258e6` HAS NO SESSION-LOG ENTRY**, and this entry does not retroactively
create one. It moved no queue item, which is likely why the FJ-6 per-change
cadence missed it: that cadence fires when an item opens, closes or moves.
**A commit that changes only protocol or configuration is a gap in the cadence
as ruled**, and is recorded here rather than fixed.

Every other commit today has an entry, and **no entry names a commit that is not
on `main`.** Only three entries name shas at all.

---

## Session — 2026-09-04 to 2026-09-07

**ONE COMMIT, AND THE REST IS RULINGS THAT PRODUCED NO CODE.** `6e76fd8` is the
only bank. Everything else recorded here is decisions and findings that would
otherwise exist only in a chat transcript, which is the gap this file exists to
close.

**DATE SPAN, stated because this file already carries one date discrepancy.**
The commit is dated 2026-09-04. The session continued without a break and the
later rulings were made on 2026-09-07. Entries inside `docs/outstanding.md`
dated 2026-09-04 are correct for what they date; Q7 and Q9 below are 2026-09-07.

---

### Banked

**`6e76fd8`** filed A117, the BMF table migration, and recorded the Q1 and Q2
sandbox rulings on A114. OPEN 107 to 108, BLOCKING 22 to 23, build chain 18 to
19. **A8's ingest chain went from five steps to six, and the sixth was SEPARATED
rather than added**: writing the migration had been folded into applying it.

**Q1 ruled the sandbox stays OUT of `wrangler.toml`.** Q2 then resolved the fork
rather than trading it off: a separate `bmf-sandbox.toml` passed with `--config`
leaves production config untouched AND keeps the migrations runner. The
isolation is tool-enforced, since `pages dev` and `pages deploy` both throw on
`--config`, so no Pages command can reach the sandbox config at all.

---

### Ruled, with no commit

**Q7: FT RUNS EVERY STEP OF THE BMF LOAD, INCLUDING THE UNDO.** There is no
second operator, so time-to-recovery is bounded by FT's availability. **This is
the half of Q7 with no home in the queue**: it is a ruling about a recovery path
that does not exist, so it fits no current entry and no section of
`docs/bmf-load-scoping.md`. It belongs in that doc when a recovery section is
written, which is after the eight questions below are answered. Recorded here so
it survives the conversation that produced it. The other half of Q7, that
nothing alerts on a bad load and the scope pass must therefore weigh loader
self-verification, went onto A113 in this commit.

**Q9: THE PROMOTION AND RECOVERY PATH IS SCOPED TO THE BMF LOAD, NOT TO
ENVIRONMENT PROMOTION GENERALLY.** The BMF path has real mechanism behind it,
being the retained dated table, the stamp and the two-rename undo. A general
rule would be discipline the tooling cannot enforce: both configs share one
`migrations/` directory and the runner applies everything pending in one shot.
**The general question is deliberately unanswered rather than dropped.**

**PROMOTION DISSOLVED UNDER INVESTIGATION RATHER THAN BEING DEFERRED**, which is
why nothing was filed for it. There is no promotion OPERATION for schema: one
file set, two targets, byte-identical files, the only differences being the
target, the per-database `d1_migrations` table and which set is pending. For
data, no supported mechanism copies rows between D1 databases at all. What
remained was ordering discipline, and Q9 set that aside.

**RECOVERY WAS JUDGED TOO EARLY TO FILE, AND FT ADOPTED THAT JUDGEMENT.** An
entry would have carried two ruled facts against eight undecided ones, where the
eight are the substance. It also fails A114's own filing test, which asks
whether an item gates a build AND holds a ruled sequence position: recovery
gates the production load but has no ruled position, because nobody has ruled
whether the undo is built before the first load or reached for after one goes
wrong. **The eight that remain unruled**: the recovery window; retained dated
table versus exported `.sql` as the artifact; whether a pre-load export is
acceptable given it is itself an availability event; whether undo is table-level
or database-level and what §9's Time Travel disqualification covers; how a wrong
load gets detected; whether the stamp must distinguish completed-but-wrong from
stopped-partway; whether sandbox-before-production ordering becomes a rule and
what enforces it; and whether the sandbox's existence reopens §13's option (b).

---

### Findings

**THE REMOTE `--file` PATH HAS NO CLIENT-SIDE TRANSACTION, so a four-statement
load file INHERITS A1's unverified rollback guarantee rather than adding to it.**
`executeRemotely` in the pinned wrangler 4.111.0 contains zero occurrences of
`batch` or `splitSqlQuery`: with `--file` it computes an md5 etag, calls the
import API, uploads to R2 and polls; with `--command` it posts a single `query`
call. The `db.batch()` implicit transaction §1 relies on is a LOCAL-path
property only. **What this settles is narrower than it first looks**: adding a
fourth statement does not change the shape of the remote operation, which is one
file, one etag, one import, one poll either way, so the retained-dated-table
variant adds no atomicity risk beyond the one A1 already tracks. **It had been
recorded as "still atomic" earlier the same day, which was an overclaim carried
over from the local path, and the correction is the finding.**

**THE EM-DASH RULE IS SCOPED TO EXTERNAL-FACING CONTENT ONLY.** Repo docs,
commit messages and internal artifacts carry no such constraint. **The prior
framing as a blanket prohibition was wrong**, and it is recorded because a rule
applied wider than it was written costs edits nobody asked for.

**NO ADVISOR-SCREENING OR ADVISOR-QUESTION CONTENT EXISTS ANYWHERE IN THE TREE.**
Not shipped, not dark, not planned. Verified by grep at HEAD. The nearest
analogue is lesson u2, "How to vet a nonprofit", which screens GRANTEES rather
than advisors and shares none of the relevant questions.

**WHETHER ADVISOR-SCREENING CONTENT FALLS INSIDE PATH B IS UNRULED, AND IT IS
FILED NOWHERE.** Recorded here as an open question rather than as a queue entry,
deliberately. The nonprofit analogue was ruled exposure-only, which is
suggestive and is not a ruling about advisors.

---

### Instrument failures, and the generalization

**TWO CHECKS WRITTEN IN-SESSION RETURNED CONFIDENT WRONG ANSWERS, and a third
false positive was reported from an earlier session.** All three are the
CLAUDE.md §10 scanner shape: output that reads like a finding rather than a
fault.

**1. The OPEN-entry enumerator was blind to letter-suffixed IDs.**
`^\*\*A[0-9]+ \| ` returned 105 where the file stated 107. **Five controls were
asserted before the count was trusted, and all five passed**: A8, A113, A114,
A115 and A116, each present exactly once. **Every one was a plain-numeric ID**,
so the control set could not see the defect. The cause was A50a and A50b. The
pattern that reproduces the stated count is `^\*\*A[0-9]+[a-z]? \| `.

**2. An `awk` nearest-preceding-bold-line heuristic reported an orphan entry
that did not exist.** It correctly surfaced A50a and A50b, then flagged a
`Pilot:` line whose entry header sat above an intervening bold paragraph. Two
true positives and one false one from the same run.

**3. FT-REPORTED, from an earlier session and not observed here: a trailer check
matching a bare case-insensitive "claude" fired on the word CLAUDE.md in a
commit body.** The replacement matches anchored trailer forms, `^Key: value`
with hyphenated keys, plus named keys and the footer text, and returned zero on
`6e76fd8`.

**A FOURTH HYPOTHESIS WAS RAISED AND DISPROVED, recorded because a later reader
will reach for it too.** The enumerator was suspected of being under-scoped,
file-wide rather than limited to the OPEN section. **It is not.** PARKED and
ANSWERABLE-ONLY-BY-FT contain ZERO A-headers, so scoping changes nothing:
measured at HEAD, naive file-wide and naive OPEN-only both return 106, and
suffix-aware OPEN-only returns 108. **There was ONE enumerator defect with ONE
cause, not two.**

**THE GENERALIZATION: a check's controls must span the FORMAT VARIANTS the check
may encounter, not merely confirm that the check ran.** Five passing controls
established that the enumerator worked on the shape it was given, and said
nothing about the shape it was not. This is §10's known-positive-control filing
one turn further in: **having a control is not sufficient if every control
shares the property the defect exploits.**

**One instrument failed SAFELY the same day, and it is the counter-example worth
keeping.** The edit script asserted that each replacement matched exactly once,
so when LF patterns were run against a CRLF file it refused with zero matches
rather than writing a mangled document. **That is the assertion the enumerator
lacked.**

**AND A FIFTH INSTRUMENT FAILED WHILE THIS SECTION WAS BEING WRITTEN**, caught
by that same assertion. The line-ending check used to decide how to patch these
two files was a `grep -c` against a shell ANSI-C carriage-return escape, and in
this shell that escape evaluated to an EMPTY PATTERN, which matches every line.
It reported "2173 of 2173" and "1629 of 1629", figures that read as confirmation
and assert nothing. **It happened to be RIGHT about `docs/outstanding.md`, which
is CRLF, and WRONG about `docs/session-log.md`, which is LF-only**, so the patch
script converted its patterns to CRLF and matched nothing. Counting CRLF pairs
directly gives 2297 and 0. **A check whose failure mode is "matches everything"
cannot be distinguished from success by reading its output**, which is the
enumerator's defect arriving from the opposite direction.

**A SIXTH, recorded because it is the same lesson a third time in one day:
writing the paragraph above CORRUPTED it.** The carriage-return escape was
embedded literally in the patch content, did not survive the shell, and landed
in the file as a line break mid-sentence. **The printed diff caught it. No check
did**, because no check was looking at prose. Printing the full diff before
committing is the only thing that stood between that and a mangled permanent
record, which is the argument for the bank rule stated as a measured cost rather
than as protocol.

---

## Session — 2026-09-07 (second)

**CONTINUES THE ENTRY ABOVE AND DELIBERATELY DOES NOT EXTEND IT.** That entry was
written at `8a553aa`, and its opening sentence is "ONE COMMIT, AND THE REST IS
RULINGS THAT PRODUCED NO CODE. `6e76fd8` is the only bank." **That was true when
written and seven more commits followed the same day**, so appending to it would
falsify its own first line. This entry starts where that one stops.

**EIGHT COMMITS ARE DATED 2026-09-07**, verified by count against a control date
that returns a different figure. The first of them, `8a553aa`, is the one that
carries the entry above, which is why that entry could not name it.

---

### Banked

| Commit | What it did |
|---|---|
| `8a553aa` | Q7's detection input onto A113; the morning session-log entry |
| `d71a4a9` | R6-R9, the recovery rulings, onto A113 and A117; §1 amended in place |
| `297f95f` | Q6 and the sandbox's contents onto A114; the sandbox's standing purpose into CLAUDE.md §6.10 branch (c) |
| `726ea83` | **A114 CLOSED**, its standing warnings relocated to §6.10 first; A118 filed on staging; `bmf-sandbox.toml` tracked |
| `ee7e59d` | The Operations false access claim corrected; A119 and A120 filed |
| `9be3597` | R10, the ruled index set; the A113 scope-pass findings |
| `f127abd` | R11, Q4 ruled; the count-is-not-a-list pattern into CLAUDE.md §5.1 |
| `58934fd` | R12, the load stamp design; the four-part count corrected at every site |

**ONE ENTRY CLOSED ALL DAY, A114, and one code change shipped**, the Operations
access sentence. Everything else is rulings and record.

---

### The ruling whose REASONING lives only here

**THE ADVERSARIAL PASS THAT REVERSED THE STAMP'S SHAPE.** `58934fd` records
`load_check` as the design. **It does not record that JSON was proposed first,
defended, and then argued down by the seat that proposed it.** Three objections
carried it: nothing validates a JSON column, it is not queryable across rows, and
**a provisional check set means JSON silently changes shape where columns would
not** — which matters because R10c already made the index set provisional and the
check set inherits that. The clinching property is that **adding a check adds
ROWS, not columns**, so the set can move without a migration.

**THE SAME PASS ALSO CUT TWO FIELDS AND KEPT TWO, ON ONE TEST.** `checks_passed`
went as a second source of truth derived from the check rows; `source_id` went as
redundant with `source_date` and `file_set` together. The test: **the stamp is
the only thing that outlives a generation, so a field belongs in it if and only
if you would want it after the table is pruned.**

**AND THE `source_id` CUT HELD FOR A REASON ESTABLISHED LATER THAN THE CUT.** It
was cut by pointing at `file_set`, which nobody had defended at the time. It
survives on its own grounds — four files and five files are both valid and
produce different data, and nothing else distinguishes them — but the order was
backwards, and that is recorded rather than tidied.

**THE STAMP BECAME TWO TABLES IN THAT PASS**, which changed what A117 carries and
had appeared in no earlier round.

---

### The count-is-not-a-list rule was filed and then violated three times in one day

**ALL THREE PROPAGATED THROUGH PROMPTS, NOT THROUGH THE TREE**, and that is the
part worth keeping. Each time a number was carried forward from a prior report
without opening the source.

1. **Twelve failure modes with no list.** Asserted three times in
   `docs/outstanding.md`; no document enumerates twelve. Still unenumerated.
2. **Four stamp parts with no parts.** "The four-part load stamp" in three
   documents; no document named the four. R12 resolved it by **defining seven
   fresh rather than recovering four**, on the reasoning that a count nobody can
   source is not a constraint.
3. **"Cited in three documents" when it was five lines across four files.**

**THE THIRD IS THE ONE THAT MATTERS, AND IT IS NOT AN EMBARRASSMENT TO SOFTEN.**
The rule was filed into CLAUDE.md §5.1 at `f127abd`, 14:41. **It was violated at
15:05, twenty-four minutes later, by the person who filed it, in a prompt whose
SUBJECT was that rule.** The prompt ruling R12 said the phrase was cited in three
documents; it is five lines across four files, one of which is the §5.1 note
itself.

**AND A117'S OWN ENTRY CARRIED THE SAME ERROR.** The entry recording that the
list was missing said "cited in three documents" — **an entry about an
undercounted referent undercounting its own citations.**

**WHAT ACTUALLY CAUGHT BOTH: counting the sites, not rereading the claim.** The
claim reads correctly either way. Nothing about "cited in three documents"
signals that it is wrong, which is precisely why a count survives restatement
and a list does not.

**FT NAMED HIMSELF THE PROPAGATING LINK THREE TIMES TODAY**, and asked for that
to be recorded rather than absorbed. It is recorded because the rule's value
depends on it: a rule that only its author's errors escape would be worth less
than one that catches them.

---

### The seventh instrument failure, and it is the sharpest because the assertion PASSED

**ANCHOR-ON-HEADER.** Replacing the arithmetic block in `docs/outstanding.md`,
the replacement was anchored on the block's **two-line header** rather than on
its full extent. The exactly-once assertion **matched that header exactly once
and reported success.** The old R11 body — nineteen lines — was left orphaned
below the new text, so **the file briefly carried two arithmetic blocks with
contradicting counts**, one saying the change was the second consecutive zero and
one saying the third.

**WHY IT IS DISTINCT FROM THE OTHERS, and it is not a variant of either.** The
enumerator's blind spot was a matcher that could not see a format variant. The
empty-pattern line-ending check was a matcher so loose it matched everything.
**Here the matcher was CORRECT.** It matched exactly what it was told to match.
**What was too narrow was the SPECIFICATION**, and no control on the matcher
could have caught that, because the matcher had no fault.

**THE GENERALIZATION IS NARROWER THAN "ASSERT YOUR REPLACEMENTS": when replacing
a BLOCK, anchor on its FULL EXTENT.** A header anchor matches exactly once,
satisfies the assertion, and leaves the body behind. The cheap post-condition
that would have caught it is asserting the old block's CLOSING line is gone,
which is a check on the OUTCOME rather than on the matcher.

**IT WAS CAUGHT BY THE PRINTED DIFF AND BY NOTHING ELSE.** Counts were unchanged,
controls held, line endings were preserved, the assertion reported one clean
match, and the file was wrong.

---

### Whether the seven share a generalization above "controls must span the format variants"

**They do, and it is already half-written in CLAUDE.md §6.14 for a different
medium.** §6.14 requires a RENDER rather than structural proof when a claim is
load-bearing, because a structural check confirms a string is in the bundle and
not that a visitor sees it. **Today established that the same split applies to
text edits, not only to rendered pages.**

**THE RULE: every check answers a question about the INSTRUMENT. Only reading the
OUTPUT answers the question about the WORK.**

**The evidence is two failures in one day where the instrument was clean and the
work was wrong.** The shell carriage-return-escape corruption mangled a paragraph
mid-sentence with every check passing; the anchor-on-header orphaned nineteen
lines with the assertion reporting success. **Both were caught by the printed
diff. Neither was caught by anything else.** The same day's render requirement
caught a missing space that a bundle grep had confirmed as present and correct —
three instances of one shape.

**WHAT THIS DOES NOT REPLACE.** The controls discipline still stands and is still
what catches matcher faults: the enumerator, the trailer substring, the empty
pattern. **It is not the same rule and does not subsume it.** Controls verify the
instrument; the diff verifies the work; and today the two failed independently.

**STATED WITH ITS LIMIT: this is one day plus the §6.14 precedent**, not a
measured pattern across the project's history. It is recorded because the
mechanism was visible each time, not because the sample is large.

**AN EIGHTH FAILURE OCCURRED WHILE WRITING THIS SECTION, AND IT IS A REPEAT OF
THE SIXTH.** Writing the sentence above that DESCRIBES the carriage-return-escape
corruption reproduced it: the literal token did not survive the shell and broke
the sentence mid-line, exactly as it had hours earlier in the paragraph that
first recorded it. **Recording a hazard does not prevent it.** The earlier fix
had worked by naming the escape in prose instead of writing it, and that lesson
was available and not applied.

**TWO FURTHER INSTRUMENTS FAILED DURING THE REPAIR ITSELF.** A `node -e` repair
script whose own escaping was wrong, caught by its own assertion rather than by
inspection. And a verification `grep -E` with a trailing backslash, which errored
IDENTICALLY on the check and on its control — **which is the control doing its
job**, since two matching failures showed the instrument was broken rather than
the file clean. **The repair succeeded only from a script FILE, where the shell
does no expansion**, which is exactly where the sixth failure had already
pointed.

---

### The OPEN-versus-READY gap, OBSERVED and NOT filed

**Three consecutive commits moved zero counts while resolving the blockers on the
longest chain in the queue.** `9be3597` ruled the index set, `f127abd` ruled Q4,
`58934fd` ruled the stamp design. **A117 went from blocked to writable in full
across those three, and OPEN stayed at 110 throughout**, with BLOCKING, DEBT and
POST unmoved as well.

**THE COUNT TRACKS WHAT IS OPEN AND NOT WHAT IS READY, and nothing in
`docs/outstanding.md` distinguishes those states.** An entry can be unblocked and
unmoved at the same time. A reader watching totals across those three commits
sees a queue that did not move.

**RECORDED AS AN OBSERVATION, NOT FILED AS A DEFECT.** FT has not ruled it one,
and it is not obvious that it is: a queue that counted readiness would need a
per-entry ready state that nothing currently maintains, and the arithmetic block
already names the gap each time it occurs. **This is the note, not the filing.**

---

### Technical findings that live nowhere else

**Recorded because each was established by execution or source reading today and
none reached a commit**, being adjacent to the work rather than part of it.

**`d1 create` HAS NO `--json` AND CANNOT WRITE A TOML CONFIG.** Its args are
`name`, `location`, `jurisdiction` plus `use-remote`, `update-config`, `binding`;
`--json` is neither there nor a global flag. The `database_id` arrives **inside a
printed TOML block**, not on its own line. And the config write is gated on
`JSON_CONFIG_FORMATS = ["json","jsonc"]`, so **against a `.toml` config the write
branch is unreachable and `--update-config` and `--binding` are inert.** This
matters for any A114-style runbook: the id must be copied by hand.

**WRANGLER STRIPS A UTF-8 BOM AND THROWS ON UTF-16 AND UTF-32.**
`removeBOMAndValidate` refuses the wide BOMs with "Configuration file contains
{encoding} byte order marker", then does `if (content.charCodeAt(0) === 65279)
return content.slice(1)`. **`bmf-sandbox.toml` carries a UTF-8 BOM and one stray
CRLF, both left alone by ruling**, and both are harmless for this reason. The
§10 Notepad hazard did NOT occur: no `FF FE`, no NUL bytes.

**`d1 export --remote` IS ITSELF AN AVAILABILITY EVENT**, warning in its own
confirmation that the database will be unavailable to serve queries — which is
what decided R6 against an exported `.sql` as the backup artifact. It also
**defaults to LOCAL when neither `--local` nor `--remote` is given**, since
neither flag carries a default and the handler branches on `remote` being truthy.
Its download link is a **presigned URL valid one hour**.

**MIGRATION FILENAMES NEED NOT BE CONTIGUOUS.** `getUnappliedMigrationNames` is a
pure set difference on NAMES against `d1_migrations.name`, and ordering comes
from `leadingMigrationNumber` sorting numerically with a lexicographic fallback.
**Nothing anywhere validates contiguity.** One caution: a naive case-insensitive
grep for `gap` returns three hits in `cli.js` that are all the letters inside
`xdgAppPaths`.

---

## Session — 2026-09-07 (third)

**SCOPE NOTE: this entry is the session's commits plus the RETROACTIVE PROMOTION
LIST, and it is deliberately not the full ceremonial entry.** No branch was cut
(docs commits need none per §6.3) and no branch was pruned. The substantive
content is the promotion list, which is what the entry exists to preserve.

### The five commits

| Commit | What it did |
|---|---|
| `d842d4d` | Enumerated the **twenty-six** BMF failure modes into `bmf-load-scoping.md` §4 and corrected the "twelve" and "§4 names four" counts at every citation. Both counts were asserted and neither was true; §4 names six. |
| `a5be8d9` | Ruled **R13** (the loader is authoritative for the DDL, the migration derives from it) and **R14** (`bmf_gen_YYYYMMDDTHHMMSSZ`), and filed the **EIN quoting hazard** as a HARD REQUIREMENT in §2's script contract rather than on A113, because A113 closes at the moment the requirement starts mattering. |
| `a4710e7` | Wrote `migrations/0022_bmf_table.sql`, body byte-identical to the DDL at `a5be8d9`. **Applied nowhere.** Carried the §6.10 branch-(b) deferral note into CLAUDE.md §5.1 and corrected A117's title, which the commit itself would otherwise have made false. |
| `cccb8ae` | Filed the line-ending check that could not fail as §10's eighth entry, its **second** occurrence, and corrected the repo's actual convention. |
| `0c1cae1` | Added **PROMOTION** as rule 18's third purpose, routing recurring hazards out of this log into CLAUDE.md. |

### Why this entry exists, and it is the point

**The list below was derived, ruled on, and existed only in conversation.** At
session end it would have been lost, and the first promotion pass would have had
to re-derive nine findings from 2,030 lines **and re-make a ruling FT had already
made**.

**That is a finding recorded where it happened rather than where the next session
looks** — the exact pattern rule 18's promotion step was added to prevent,
arriving inside the commit that added it. The rule demonstrated its own necessity
twice in one session: once on the OPEN enumerator, and once on its own output.

### The retroactive promotion list — NINE findings, NOT promoted here

**Derived by applying rule 18's promotion criterion to all 15 entries of this log
and the 17 distinct findings in them.** The promotion pass itself is a SEPARATE
commit; this records only what is promotable and what was ruled.

**TWO ARE AMENDMENTS to existing CLAUDE.md §10 filings, never second entries:**

1. **The OPEN-entry enumerator blind to letter-suffixed IDs**, together with its
   generalization that *controls must span the FORMAT VARIANTS the check may
   encounter*. **Amends** §10's "a scanner reported 3 sites where there were 20"
   filing, which it takes one turn further.
2. **Wrangler's BOM handling** — strips UTF-8, throws on UTF-16 and UTF-32.
   **Amends** §10's "`.dev.vars` corrupted to UTF-16 fails SILENTLY" filing,
   whose subject it completes.

**SEVEN ARE NEW:**

3. **The trailer check matching a bare case-insensitive "claude"**, which fired
   on the word `CLAUDE.md` in a commit body.
4. **The shell carriage-return escape corrupting prose**, which recurred
   immediately while the paragraph describing it was being written.
5. **Anchor-on-header**: the exactly-once assertion PASSED and left nineteen
   orphaned lines, because the matcher was correct and the specification was too
   narrow.
6. **The instrument-versus-work rule**: *every check answers a question about the
   INSTRUMENT; only reading the OUTPUT answers the question about the WORK.* This
   is limb (b) of the criterion in action — a rule, not a hazard, and it would
   have stayed here permanently under limb (a) alone.
7. **`d1 create` has no `--json` and cannot write a TOML config**; the
   `database_id` arrives inside a printed TOML block, and `--update-config` and
   `--binding` are inert against a `.toml`, so the id must be copied by hand.
8. **`d1 export --remote` DEFAULTS TO LOCAL** when neither `--local` nor
   `--remote` is given.
9. **Migration filenames need not be contiguous.**
   **FT RULED 2026-09-07: PROMOTE, and it is no longer borderline.** The agent
   had classified it borderline on the grounds that it is a fact rather than a
   hazard. **The reasoning that overrode that: this record repeatedly cites
   contiguity as EVIDENCE and nothing validates it, which is a false confidence
   with a citation habit behind it.** `getUnappliedMigrationNames` is a pure set
   difference on names; no code anywhere checks for a gap.
10. **`A && B && C || D` FIRES `D` WHEN `A` FAILS, which is indistinguishable
    from `C` running and finding nothing. NEW FILING, not an amendment** — see
    the judgement below.
    **What happened, later the same day and after this list was written.** A
    chain ending in a pointer search reported **"no live pointers remain"** from
    a `grep` that **never executed**: `python` was absent on this machine, the
    chain short-circuited at the first command, and the `||` fallback printed a
    message shaped exactly like a clean result. **Both pointers were intact**,
    and were found by re-checking with a control.
    **WHY IT IS A SIBLING OF THE OTHER NINE AND NOT A DUPLICATE OF ANY.** The
    nine are matchers that reported WRONGLY — a pattern that lost a backslash, a
    control set blind to a format variant, an escape that collapsed to a bare
    anchor. **This is a matcher that NEVER RAN, with the SHELL supplying an
    output that reads like a result.** The failure arrives through **control
    flow** rather than through pattern construction, and no existing §10 filing
    covers that mechanism.
    **THEREFORE A NEW FILING RATHER THAN AN AMENDMENT, and the test is the
    mechanism rather than the symptom.** Amendments belong where a later
    occurrence sharpens the SAME mechanism, which is why items 1 and 2 amend the
    scanner and UTF-16 filings. Folding this into the scanner filing would bury a
    distinct cause under a heading about how patterns are built.
    **WHAT REPLACES IT: separate the commands, or assert that the precondition
    actually ran, or choose a fallback message that cannot be mistaken for a
    clean result.** "No matches" and "the search never happened" must not print
    the same way.
    **AND THE EXISTING DISCIPLINE HELD EVEN THOUGH THE MECHANISM WAS NEW: A
    CONTROL IS WHAT CAUGHT IT.** Re-running the search with a string known
    present exposed the gap immediately. **Record that, because it is the
    strongest available evidence that the controls rule generalises past the
    failures it was written for.**

### The five LEFT, with their reasons, so the first pass does not re-judge them

- **The `awk` nearest-preceding-bold orphan heuristic.** A one-off ad-hoc script
  with no recurrence surface.
- **The edit script that failed SAFELY.** A counter-example rather than a hazard;
  it is the assertion the enumerator lacked, and it belongs to the generalization
  at item 1 rather than standing alone.
- **The Button-census CRLF delimiter bug.** Subsumed by the line-ending filing
  already promoted at `cccb8ae`.
- **The A95 `notes`-column correction.** A ruling's reasoning, and it reached the
  filing where the ruling lives; excluded by the criterion.
- **The OPEN-versus-READY gap.** An observation FT has not ruled a defect, and
  this log already marks it "the note, not the filing".
  **ONE CAVEAT, recorded because it is the only leave that can rot:** it is an
  observation about the queue's own arithmetic, so if it is never ruled it stays
  invisible, and nothing will surface it again.

### Three findings were ALREADY promoted, verified rather than assumed

The 7403 authorization failure, the `.dev.vars` UTF-16 corruption, and the
line-ending check promoted this session. **Absence-or-presence in CLAUDE.md was
established by grep with a POSITIVE CONTROL** — a string known present returned
2 — so the zeros for the unpromoted findings are a measurement rather than a
matcher that always returns zero.

### What the session did AFTER this list was written

**The list above was recorded mid-session and the work continued**, which is why
the bullets below needed correcting within hours of being written. **Three
further commits, counted against the table rather than asserted** — the first
draft of this line said six.

| Commit | What it did |
|---|---|
| `33dd689` | Recorded FT's **sandbox apply of 0022** — 9 commands, `d1_migrations` 21 → 22, eleven objects matching D6's local measurement, three empty tables. **Closed §10's remote foreign-key question**: an orphan child INSERT was rejected remotely with `FOREIGN KEY constraint failed … [code: 7500]`. **Narrowed §10's 7403** from the session to the migrations endpoint, since `execute --remote` succeeded twice on the same token seconds later. |
| `e6a5bc4` | Recorded FT's **live apply of 0022** — 9 commands in 2.91 ms, `d1_migrations` 21 → 22, `person` at 12 so production is intact and serving. **§6.10 branch (b) DISCHARGED**, both databases at 22. **Filed the blocker-names-an-entry problem** between A113 and A117. |
| `1825e05` | **Closed A117 under R15**, moved R13a to A113 stated in full with R15c, and **relocated its standing content BEFORE deleting it**. |

**THE THING WORTH KEEPING FROM THE CLOSURE, and it is not the closure.** Nothing
load-bearing died with A117, and **that was not luck**: every D-series
disposition that mattered had been written into the DDL's own comments rather
than left in surrounding prose, so it shipped inside
`migrations/0022_bmf_table.sql` and survived. **The placement rule was applied at
the time, and closing the entry is what tested it.**

**FLAGGED AND LEFT FOR FT: the 2026-09-02 classification snapshot.** The header
reads "20 BLOCKING, 59 DEBT, 24 POST", which sums to 103 and does not match the
live 21 / 61 / 27. **Pre-existing, not caused by the closure, and deliberately
not re-derived** — re-running a classification is FT's.

### Open items carried out of the session

**THE FOUR BULLETS BELOW ARE KEPT AS WRITTEN AND ALL FOUR HAVE MOVED.** They
recorded the state at the moment the promotion list was written; the corrected
state is above and restated here so a reader does not act on them. **The list is
TEN, not nine. 0022 is applied to BOTH databases, not nowhere. A117 is CLOSED,
not open. OPEN stands at 109, not 110**, A117 having left from BLOCKING, which
went 22 → 21.

- **The first promotion pass has NOT run.** It is a separate commit and carries
  the nine above.
- **Migration 0022 is applied NOWHERE** — not the local dev store, not
  `bmf-sandbox`, not remote. Every apply is FT-run per §6.10 and §6.15, and the
  branch-(b) note is in CLAUDE.md §5.1.
- **A117 stays open** with three named remainders: the apply, the §6.10 branch-(c)
  sandbox obligation, and R13a regeneration once A113's loader constant exists.
- **OPEN stands at 110**, corrected this session from the 108 that four commits
  reported. The deltas were right; the level was wrong by two, and the cause was
  finding 1 above sitting unpromoted in this file.

---

## Session — 2026-09-07 (fourth): PROMOTION PASS 1

**The first promotion pass under rule 18's third purpose, covering the WHOLE log
per the first-pass exception.** The list was not re-derived; it was taken
item-by-item from the entry above, which exists so this pass would not repeat
that work. **Every item was re-verified ABSENT from CLAUDE.md before promotion**,
with four positive controls proving the matcher finds strings that are present.
**Zero had been promoted incidentally.** Four items returned a hit outside §10 —
rule 18's own demonstration paragraphs and one unrelated use of "short-circuits"
in §5.2 — and a section-scoped count returned 0, so all ten stood.

### Promoted — TWO amendments

- **Item 1, the OPEN-enumerator blind to letter-suffixed IDs** → amended into
  §10's scanner filing. **The amended rule: controls must span the FORMAT
  VARIANTS the check may encounter.** Five controls passed and all five were
  plain-numeric IDs, so the control set could not see the defect.
- **Item 2, wrangler's BOM handling** → amended into §10's UTF-16 filing. It
  THROWS on the wide BOMs and silently STRIPS a UTF-8 one, so the two corruptions
  behave oppositely and the entry's silent failure applies to only one of them.

### Promoted — SEVEN new `### Filed —` blocks

Trailer check firing on the word `CLAUDE.md`; the carriage-return escape that
does not survive the shell; anchor-on-header passing its exactly-once assertion;
`d1 create` having no `--json` and an unreachable config write; `d1 export`
defaulting to LOCAL; migration filenames not being contiguity-checked; and
`A && B && C || D` reporting the fallback when `A` fails.

**All seven are written as WARNINGS, not history**: each opens with the mechanism
in the present tense, carries the incident as evidence rather than as subject, and
names a replacement practice. **None had to be padded to fit that shape**, which
was the test for whether an item belonged here at all.

### Promoted — ONE governing statement, NOT a filed block

**Item 6** — *every check answers a question about the INSTRUMENT; only reading
the OUTPUT answers the question about the WORK* — was placed at the HEAD of §10's
filing series rather than as a ninth block. **Reasoning: every block opens with a
mechanism that bit someone, and this has none.** It is what several of them have
in common, and it governs two siblings outside §10 as well, the delta-counting
hazard in §6 and the minified-bundle grep in §9, which it names so that it
governs the family rather than one section.

### LEFT — five, JUDGED, and not to be re-judged

**Rule 18 records dispositions so the same judgement is not re-made every 30
days. These five are judged; a later sweep skips them.**

- **The `awk` orphan heuristic** — one-off ad-hoc script, no recurrence surface.
- **The edit script that failed SAFELY** — a counter-example, not a hazard; it
  belongs to the amended scanner filing rather than standing alone.
- **The Button-census CRLF delimiter bug** — subsumed by the line-ending filing.
- **The A95 `notes`-column correction** — a ruling's reasoning, recorded where
  the ruling lives; excluded by the criterion.
- **The OPEN-versus-READY gap** — an observation FT has not ruled a defect. **The
  one leave that can rot**, since nothing else will surface it.

### One repair, recorded because it was caught by a post-condition and not by review

The seven new blocks were first inserted **inside** the UTF-16 filing, splitting
it and orphaning its scope note and its fresh amendment below them, and the
insertion also **concatenated two lines**. **Counts were unchanged and correct
throughout** — 15 blocks either way — so no count check could have seen it. It
was caught by printing the heading order and repaired by script with assertions
on the boundaries. **That is the governing statement promoted in this same pass,
demonstrated by the pass itself:** the instrument said 15 and the work was wrong.

### Counts

**§10 filed blocks 8 → 15**, plus one governing statement that is not a block.
**OPEN does not move: 109**, because nothing in the queue changed. `migrations/`
22 files, both databases at 22.

### `origin/main` ADVANCING WHILE THE AGENT NEVER PUSHED IS EXPECTED, NOT AN ANOMALY

**Recorded so a later session does not re-open it. This applies to the whole day,
not only to the promotion pass above.** During the A113 scope pass the agent
found `origin/main` equal to local HEAD after fourteen unpushed commits, with
reflog entries reading "update by push", and stopped to investigate rather than
assume. **The explanation is mundane and is now confirmed: FT pushes manually
from PowerShell at the end of each approval batch, including two batches before
this session.** There is **no hook, no scheduled job and no auto-sync** —
verified at the time: zero non-sample hooks, no `core.hooksPath`, no push alias
or `push.default` config. **The "update by push" reflog lines are FT's terminal.**
**SO THE INSTRUCTION HELD.** "Do not push" was given to the AGENT and the agent
did not push; FT pushing is a separate act by a separate actor. **An agent seeing
0/0 against origin after a run of unpushed commits should read it as FT having
pushed**, not as a state change to diagnose. **This is a two-actor workflow that
reads as one when only one side is visible**, which is why it looked anomalous
and why it is written down rather than filed: it is not a hazard and not a
defect, so it belongs in neither `docs/outstanding.md` nor CLAUDE.md §10.
**Also verified at the time, and worth keeping:** across all fourteen commits
there were **zero files under `src/` and zero under `functions/`** — only
`CLAUDE.md`, four `docs/` files and `migrations/0022_bmf_table.sql`. Every
resulting Pages deploy therefore rebuilt an identical app, and a deploy does not
apply migrations, **so no behavioural change reached production.**

## Session — 2026-09-08 to 2026-09-09

Fourteen commits, `23ed8d0` through `5bd916f`, across TWO arcs: the BMF slice-1
build, and an agent-infrastructure build that came out of it. Recorded here
because most of what FT ruled in this session did not become a commit of its own.

**THE COMMITS, in order.** `23ed8d0` filed three open questions and refreshed the
counts; `9365cd1` filed two findings measured against the live IRS endpoint;
`d4b24de` `cd25359` `aaf2c46` are slice 1's three files; `7c3357b` recorded the
first live extract capture; `009c048` recorded slice 1 landing on main; `b4c3dd3`
closed A123 and filed A126; `a9d83ce` wrote the definition of done into §15;
`c97e946` filed A127 and A128; `84fc360` repaired A128's citations; `abb2f92`
ruled A128's fork and closed it; `c8f2988` filed A129, A130 and A131; `0247a23`
consolidated the standing discipline into CLAUDE.md; `ccc7dd4` added three
subagent definitions; `5bd916f` added the verification script.

**SLICE 1 IS BUILT AND PROVEN.** `scripts/bmf-fetch.mjs` acquires and freezes,
`scripts/bmf-parse.mjs` parses and emits, `scripts/bmf-verify-slice1.mjs` loads
and asserts. The emitted artifact is `scripts/bmf-aside.tmp.sql`, **173,873,096
bytes in 5,805 statements**, carrying **1,964,958 rows equal to distinct EINs**,
zero duplicates, zero malformed, zero null RULING, and a REVENUE_AMT sum of
4,317,294,050,545 over 1,391,216 rows. R21a is met in its own terms: done is a
file on disk and a set of numbers matching.

### The rulings that did not become their own commits

**A125 RULED OPTION B, FOR SLICE 1 ONLY.** Slice 1's verifier creates a MINIMAL
IN-MEMORY SCRATCH TABLE — a parsing tool under R27, existing for one check, named
`bmf_aside` per R24 so the emitted file loads unmodified, and explicitly NOT the
aside. **The real aside DDL still has no author**, and **R13a has not fired**,
because its trigger is the authoring of the loader's constant and slice 1
authored none. Both remainders transfer intact to whichever slice authors it.

**A123 RULED: `ein TEXT` IS THE AFFINITY FLOOR, and the assertion is on VALUE and
LENGTH, never on `typeof`.** The reason is that `typeof` CANNOT FAIL here: on an
`ein TEXT` column it returns `text` for a correctly quoted EIN and for a defective
unquoted one alike, so an assertion built on it passes in both cases and
discriminates nothing. That is the check-that-cannot-fail class, caught before it
shipped rather than after. The affinity floor and the reason `typeof` is excluded
were relocated to `docs/bmf-load-scoping.md` §15 beside R21b BEFORE A123 closed,
because closing an entry deletes it.

**THE DEFINITION OF DONE'S DURABLE HOME RULED: `docs/bmf-load-scoping.md` §15,
beside R21a.** FT rejected two candidates and the reasons are recorded so neither
is re-proposed. **A113 was rejected** on the fuse reason that moved A121 and A122
out of it: A113 closes when the loader exists, and the definition of done is a
permanent record of what was proven rather than a checklist that expires. **A
standalone file was rejected** as a third place to look. R21a is the ruling that
requires the list to exist, so a reader who finds the ruling finds the list.

**FIVE OF THE FIFTEEN ITEMS WERE UNRECOVERABLE from any tracked artifact** and
were supplied by FT from the ratification. That gap is the sharpest confirmation
of A126 available, and the list carries its provenance in three classes rather
than being smoothed into one uniform set.

**A128's FORK RULED: THE HEADER SENTENCE WAS WRONG, AND THE REPAIR WAS A FOURTH
SOURCE RATHER THAN A SUBSTITUTION.** `docs/ruling-e-deletion-retention.md` §6
sends exactly two clauses to a reviewing attorney, 3 and 6, and the entries whose
subject is those clauses are A47 and A46 — the only two entries titled
`Ruling E Clause N`, one per clause. A84 carries no clause in its own text: zero
occurrences of `subpoena` against a control returning 2 for `delete` in the same
entry, a Detail citing Strand 3 Layer 4 while subpoena posture is Layer 2 item
(c), and a blocker line naming A47.

**WHY A SUBSTITUTION WAS REFUSED, which is the transferable half.** Swapping A46
for A84 would have made the clause mapping true while leaving A84 unaccounted for,
and would have put a FIFTH entry into a paragraph that enumerates FOUR. **The
paragraph was doing two jobs that do not reconcile as one sentence** — mapping
clauses to entries, and accounting for all four counsel-gated items — so it now
names FOUR sources rather than three. The roster of four is unchanged and A46
stays `Pilot: POST` outside it.

**ONE SOURCE IS DESCRIBED DIFFERENTLY FROM HOW THE RULING FRAMED IT**, because
the document does not support the stronger form. The ruling said A84 is
counsel-gated by its own Detail document at Strand 3 Layer 4. **Layer 4 contains
no counsel gate**: its text is the governance requirement that a retention and
deletion policy exist before pilot, which is why A84 is BLOCKING. That file's five
counsel mentions all sit in Layer 2 or in §7. So Layer 4 was written as supplying
the PRE-PILOT REQUIREMENT and A47 as supplying the GATE.

**THE COUNSEL GROUPING RULED: THE FOUR COUNSEL-GATED ITEMS RESOLVE TO TWO
CONVERSATIONS, NOT FOUR.** A47 and A84 are ONE SUBJECT AT TWO ALTITUDES, A84's
blocker line naming A47 directly: A47 is the narrow factual predicate and A84 is
the policy that cannot be written until it is answered. A68 is a DISTINCT
QUESTION, controller identity under FERPA and NIL at institutional scale,
overlapping A47 only through a shared input. A110 STANDS ALONE and nothing depends
on it until A96 ships. **It is a ruling about how the questions group, not a
merge**: all four stay open, separately classified, separately counted, and the
counsel-gated count remains FOUR.

**FT RULED "DEREK" A RETIRED NAME.** No such counsel exists or ever existed, no
external counsel is retained and none is in pipeline. The name survives on 18
lines across 8 files, including `migrations/0001_initial.sql:222`, which is an
applied migration and cannot be edited casually. **Scoping the repair is a
separate ruling FT has not made**, and no sweep was run.

### The agent-infrastructure rulings

**`.claude/agents/` IS TRACKED, RULED BY FT.** `.gitignore` line 11 became
`.claude/*` with a `!.claude/agents/` negation. The negation alone would not have
worked: a trailing-slash exclusion stops git descending into the directory, so
the directory pattern had to change too.

**REVIEW MOVED FROM PER-COMMIT TO PER-SESSION ON A WORKING BRANCH**, recorded as
an AMENDMENT to §6.13 rather than a replacement. **Agents may commit freely on a
working branch.** **Nothing reaches `main` and nothing is pushed without FT's
review**, and that half is absolute regardless of how work is batched: never
commit to `main` from an agent session, never push, never write to remote D1. FT
still reads every diff before anything reaches `main`; what changed is the
granularity, not the authority.

**THE REASON THE DISCIPLINE MOVED TO CLAUDE.md AT ALL** is the artifact A126 was
filed about: it was living in session prompts rather than at HEAD, and custom
subagents load the full CLAUDE.md hierarchy at startup. What was already recorded
was quoted and left alone; only what returned zero on a search was added.

### What this session leaves standing

**SLICES 2 AND 3 ARE NOT STARTED**, and A113 is not scoped beyond slice 1. A129
records that byte-identity under R13a may not be satisfiable as stated; A130
records that three of A113's eleven bullets are provable only across multiple
loads, so R21's test admits no boundary that makes them provable on their own;
A131 corrects A125's census. All three are open questions for FT.

**THE THREE AGENTS HAVE NOT BEEN RUN.** They are definitions only, and the
delegation-message problem they guard against is mitigated BY PROMPT rather than
by configuration: each file instructs the agent to treat every claim in a parent's
delegation message as unverified, and nothing enforces that.

### Instrument failures this session, counted because the count is the finding

**Line-wrapped phrases broke THREE separate matchers**, each returning a false
zero on content that was present: a commit-body check, a frontmatter validator,
and a session-log probe. The fix in every case was to normalise whitespace before
matching, and the verification script now does so.

**A negative control was written wrong TWICE**, both times by a line wrapping a
trailer key to column 1, and the second was in a control written specifically to
avoid the first. This produced the amendment recording that a control is not a
control until it is verified negative.

**`sed -n` silently stripped carriage returns from 793 lines mid-splice.** The
rebuilt file had the correct line count and correct content; only counting CRs
against the line count caught it.

**A backslash-r written into a shell-embedded patch collapsed to nothing**,
turning a `replace` into a line comment and breaking a file that had just passed.
It was rebuilt with `String.fromCharCode(13)` and no escape sequence at all.

**A splice used a head count of 1726 where 726 was meant**, duplicating about a
thousand lines. Its own post-condition caught it before anything was installed.

**AND THE VERIFICATION SCRIPT CONTAINED A CHECK THAT COULD NOT FAIL.** Its
`.claude/agents/` assertion used plain `git check-ignore`, which consults the
INDEX first, so a TRACKED path is never reported ignored no matter what the rules
say. Deleting the negation from `.gitignore` left the run green. It now uses
`--no-index`. **That was found by trying to induce the failure**, not by reading
the code, which is the only thing that finds this class.

## Session — 2026-09-09 into 2026-09-10

Seven commits, `f3226eb` through `0d129b0`, all docs — five files touched and no
source file among them. **The session opened with four open items bearing on the
BMF arc and closed with one of them ruled-but-still-open, three closed, two new
entries filed, and slice 2 bounded for the first time.** Every figure below was
re-derived at `0d129b0` rather than carried from session notes.

**THE COMMITS, in order.** `f3226eb` filed two D1 hazards and retired three stale
claims; `c6f0fe5` ruled byte-identity coverage structural and closed A129, A130
and A131 while filing A132; `727613c` ruled A125 not rulable ahead of slice 2's
boundary; `216a758` published the slice-2 scope pass; `de795ed` ruled R32;
`14d28ac` reconciled R31 and ruled R33; `0d129b0` ruled R34 and filed A133. The
first four are dated 2026-09-09 and the last three 2026-09-10.

### What was open at session start, and where each landed

**A129, byte-identity possibly unsatisfiable as stated — CLOSED.** Coverage is
ruled STRUCTURAL: table shape only, across all three tables and all five indexes,
every construct compared as attached to its named object. **R13a's "proves the
derivation retroactively" does not survive**; "drift found on day one" does,
intact. The weaker claim was accepted deliberately, and R31 records why under its
own "WHY THE WEAKER CLAIM WAS ACCEPTED".
**A130, three bullets provable only across a sequence of loads — CLOSED AS
R21c.** R7, R8c and R8e come out of every slice's definition of done and become
post-load operational verification, first checkable at loads three, four and
roughly four. No slice can discharge them and none should carry them.
**A131, A125's census — CLOSED**, absorbed into A125's supersession marker rather
than corrected in place.
**A125, the aside DDL's authorship — STILL OPEN, twice narrowed.** Ruled not
rulable ahead of slice 2's boundary, then given a blocker that names a BUILD
rather than a ruling. **R32 discharged its third and fourth grounds; the second is
untouched and is why it does not become rulable** — every candidate shape
describes what a slice must build, so there is no fork for a ruling to take.
**A132 and A133 were FILED during the session, not carried into it.** A132 is
DEBT and has been untouched since the commit that filed it; A133 is DEBT and is
the last commit's own filing.
**Slice 2's boundary — RULED.** See below.

### R32, the slice-2 boundary

**Candidate 3 of four: the whole loader.** Thirteen elements inside, A through M
— create the aside, pre-flight, load, generation timestamp, stamp, the five
pre-swap checks, `load_check` rows, swap, post-swap assertion, completion,
pruning code, undo file, and read-only verification against D1. **Outside: only
R21c's three, plus the FT-run production preconditions.**

**Element M was unassigned in the first draft and was caught before the ruling
banked.** The scope pass enumerates A through Q; the draft's inside-list ran A–L
and its outside-list named only R21c's three, so M fell in neither. FT ruled it
inside: it is the proof that the load and the swap worked. The ruling diverges
from `docs/slice-2-scope-pass.md` §6 on that line and says so, leaving the scope
pass stale rather than rewriting a dated snapshot.

**Three of four seats recommended the narrower boundary and the ruling went the
other way**, so the dissent is recorded on the ruling. Parker's objection is
orthogonal, stands under every candidate, and was recorded with one overstatement
corrected.

### R31 reconciled, R33 and R34

**R31 carried two dispositions that read as contradictory** — the gap is FT's,
and the slice that authors the constant rules it — in the first and third of
three consecutive blocks. **Reconciled: the gap is FT's to notice and record; the
slice is what resolves it.** Different acts on the same object. The same clause
had propagated into A125 and was corrected in the same commit.

**R33: R13's "a single named constant" is incidental wording, not load-bearing.**
The singular is inherited from R10c, whose stated concern is scattering rather
than the number one. Packaging is the builder's call under §6.17. Shapes 1 and 3
are both available; shape 2 is recorded as **apparently** foreclosed rather than
ruled out, because R31 does not say what the narrowed reference narrows to.

**R34: §6.15(3) covers `bmf-sandbox`.** Every `wrangler --remote` command is
FT-run regardless of target. **It ratifies what three artifacts already assumed**
— the grammar of (3), two existing applications in the tree, and all three agent
definitions. **Its cost is recorded as a cost:** the builder may exercise the
loader in a venue the rulings do not name and may not exercise it in the venue
they do. Parker's objection is accepted, not answered.

### Counts

**Across the session: OPEN 115 → 114. BLOCKING 25 → 23. Build chain 21 → 19.**
DEBT 63 → 64, POST unchanged at 27. The BMF and Discover tier 15 → 14.

**TWO of the seven commits moved counts, not one, and the intermediate figures
are recorded because the endpoints hide them.** `c6f0fe5` took OPEN 115 → 113,
BLOCKING 25 → 23, the chain 21 → 19 and the BMF tier 15 → 13, closing three
entries and filing one. `0d129b0` then took OPEN 113 → 114, DEBT 63 → 64 and the
BMF tier 13 → 14 on A133's filing. **The other five commits held every figure
steady**, which is why a reader comparing only the ends sees a net −1 that no
single commit performed.
**The header's arithmetic block describes the LAST change only**, by its own
replace-rather-than-append rule, so its "113 → 114" is that commit's move and not
the session's.

### Instrument failures, counted because the count is the finding

**Line-oriented greps returned false zeros on hard-wrapped CRLF FOUR times**,
each on content that was present: the R8b quotation, the migration's two-site
phrase count, R32's own discharge clause, and a §15 figure searched in the wrong
case. Each was caught by flattening; none reached the tree. **The discharge
clause is the one re-proven at HEAD in this entry's own verification**: a
line-oriented grep for it returns 0 and exits 1, a flattened grep returns 1, and
the clause wraps across two lines. The other three are attested by the session
rather than re-derivable from the tree.

**A count was falsified by the commit carrying it, twice.** An unanchored
`R32`-inside-A125 measurement would have been the fourth instance of §10's filed
shape; it was anchored to `de795ed` and stated in the past tense. Measured now,
that anchor holds: zero occurrences at `de795ed`, four at HEAD. Its replacement
then enumerated three occurrences where there were four, and the enumerating
clause was dropped rather than renumbered, because any enumeration there moves.

**A hardcoded section bound produced a false OPEN count of 110 twice** — once in
an agent's post-edit check and once in the parent's — because the edit had moved
the bounds it was measured from. Deriving bounds from the `## OPEN` and
`## PARKED` markers returns 114. **The mechanism reproduces**: measured against
`0d129b0`, applying the previous revision's literal bounds to that file returns
**81**, so a stale bound does not fail — it answers confidently and wrongly.
**That figure is ANCHORED to `0d129b0` deliberately, and the reason is this
entry's own subject.** Unanchored it would be a live count, and the commit
carrying this entry moves it: the same stale bounds against the working tree
return 78, because the four staleness corrections shifted the lines they were
measured from. **A demonstration of a stale-bound hazard would otherwise have
gone stale in the act of being written**, which is CLAUDE.md §10's filed shape
and would have been its fourth instance.

**`verify-commit-tail.mjs` check 3 reads the HEAD blob**, so while `0d129b0` was
being prepared it reported green on the then-HEAD's 113 while the working tree
stood at 114. A working-tree simulation with regexes lifted from the script's own
source was what tested that commit; the real verifier became a check on it only
after the commit landed. **The script is not wrong to do this** — its own comment
says a working-tree read passes on edits that were never committed — and it
prints a note when the two diverge. What it cannot do is attest to an uncommitted
edit.
