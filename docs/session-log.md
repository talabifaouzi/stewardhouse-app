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

## Session — 2026-09-11

Three commits, `9267814` through `5aed229`, all docs. Four files touched across
the three, and no source file, no migration and no script among them:
`CLAUDE.md`, `docs/bmf-load-scoping.md`, `docs/filed-defects.md` and
`docs/outstanding.md`. **The session opened with four docs-train corrections
outstanding and closed with all four made, one queue entry closed, one
reclassified, and a production precondition restored nine days after it was
released.** Session-open figures are anchored to `538a1f5` and session-close
figures to `5aed229`.

**THE COMMITS, in order.** `9267814` corrected two agent-memory absence claims,
filed the false-zero rule as a `### Filed` block in §10, and amended §10's
re-measure filing; it left every citation it displaced unrepaired, because each
had already failed to resolve at `538a1f5`, and it did not touch
`docs/outstanding.md`. `a1306bf` deleted three merged slice labels, converted
four line-number citations into docs to section-and-title form, re-anchored
A127's census, and added case folding to the new rule; it left the citations its
own diff displaced unrepaired, because none of them resolved at `9267814`.
`5aed229` restored precondition 2 on the production BMF load, moved A13 from
POST to BLOCKING, held A92 at POST, and closed A75; it left five displaced
citations in `docs/slice-2-scope-pass.md` unrepaired by ruling. All three are
dated 2026-09-11. This entry's own commit is the fourth and moves no count.

### What was open at session start, and where each landed

Six items: four docs-train corrections and two of R32's start-gating questions.

**The two agent-memory absence claims, CORRECTED at `9267814`.** CLAUDE.md §8's
`.claude/agents/` bullet said nothing in the tree names the agent-memory path,
and `docs/filed-defects.md`'s adversary entry said the path is named nowhere.
Each is true of the ignore rules and false of the tree. The CLAUDE.md sentence
was replaced in place with its original quoted beneath it; the filed-defects
sentence stands and carries an amendment under it, per §6.18's promote-or-amend
clause. Neither paragraph's conclusion changed: the ignore coverage is still
incidental, resting on `.gitignore:11`'s `.claude/*` alone.

**The wrap-artifact pattern, FILED at `9267814`.** It became a `### Filed` block
in §10: a phrase match over stored text returns a false zero when the stored
form differs from the searched form. Three parts, normalize both needle and
haystack, prove the normalizer on a known-positive control for every transform
with one spanning a wrap, and state the scope every absence claim was searched
over.

**`scripts/verify-commit-tail.mjs` check 3, AMENDED at `9267814` and not
changed.** The script is post-commit by design and reads the committed blob, so
it cannot discharge §10's re-measure rule. The pre-commit re-measure is made
against the working tree, and the verifier's green after the commit and before
any push is the check on that re-measure. No line of the script was edited this
session.

**R32's start-gating question 2, where the rollback path lives, STILL OPEN with
its subject moved.** `docs/bmf-load-scoping.md:2508-2510` is byte-identical to
its text at `538a1f5:2478-2480` and was shifted 30 lines by the day's inserts.
What changed is what it points at: it says §13 makes the rollback exercise an
FT-run precondition on the production load, and since `5aed229` the load again
waits on both of §13's preconditions, one of which, A13, is a build rather than
an FT-run act.

**R32's start-gating question 3, which database slice 2 targets and how it is
addressed, STILL OPEN and untouched.** `docs/bmf-load-scoping.md:2511-2514`,
byte-identical and shifted by the same 30 lines.

### Rulings, with the commit that recorded each

Nine. Four of them reverse or supersede prior text, and they are named as such
below: the restoration, the A13 reclassification, the case-folding amendment,
and the replaced CLAUDE.md sentence in the docs-train corrections.

**Precondition 2 on the production BMF load is RESTORED, reversing FJ-1's
2026-09-02 release (`5aed229`).** FJ-1 had ruled that BMF proceeds on the
rollback path alone. The reversal is recorded on FJ-1 itself, quoting the
released sentence rather than deleting it, and takes no R-number. FJ-1's other
half stands: the read surface is still built as an ordinary slice.

**A13 moves POST to BLOCKING (`5aed229`).** It supersedes A13's own second
sentence, "It does not gate the BMF load", quoted in place. The reasoning is
A1's: a pilot user reaches an item through what it gates rather than through the
item itself. A13 stays in cheap and mechanical and its blocker line is
unchanged.

**A92 stays POST (`5aed229`).** A13 can ship without the `email` column under
migration 0021's E8 rule as that rule stands, so the production load does not
wait on A92 even though A13 now gates that load.

**A75 is CLOSED as false on arrival (`5aed229`).** Both of its factual claims
were false when filed, not made false later. Its closure note rides A63, the
next-lower surviving id in its section, and its id is neither renumbered nor
reused.

**Five displaced line-number citations in `docs/slice-2-scope-pass.md` are left
UNREPAIRED (`5aed229`).** R32 records that file as a dated snapshot, so its
citations are not maintained forward.

**The §10 false-zero rule is FILED (`9267814`) and its case folding AMENDED in
(`a1306bf`).** Case folding was added as a transform after two known-present
phrases stored in capitals returned zero without it, and after the same gap made
A127's census appear to fail at both candidate revisions when it resolves at
both.

**§10's re-measure filing is AMENDED (`9267814`)** to record that
`verify-commit-tail.mjs` cannot discharge it, so a reader does not skip the
pre-commit step on the strength of a post-commit green.

**The two docs-train absence claims are CORRECTED (`9267814`), one by
replacement and one by amendment.** CLAUDE.md §8's sentence was REPLACED IN
PLACE, superseding it, with its original text quoted in the correction beneath
it; `docs/filed-defects.md`'s stands and carries an amendment under it, because
§6.18 rules that a finding sharpening an existing filing is an amendment to it
and never a second entry. Each is true of the ignore rules and false of the
tree, and the split in treatment is deliberate rather than incidental. **A127's
census is ANCHORED (`a1306bf`).** Its "measured at HEAD 2026-09-08" clause
stands, and one sentence now records that every listed line resolves at
`c97e946`, the commit that recorded the census.

### Branch pruning

**Three merged slice labels were deleted by name at `a1306bf`**, each asserted 0
commits ahead of `main` first. Every tip is reachable from `main`, re-verified
at this commit by `git merge-base --is-ancestor`, so each SHA is recoverable and
the labels held nothing the history does not:

- `slice-1-bmf-parser` at `aaf2c469aa8d85c8272f25d57d79a0ccc9d7a707`
- `slice-a18-ratebase-guard` at `0497cb63da11d2c03cdf02dabdab31d2f5a6f38a`
- `slice-a20-workshops-copy` at `11fad0b5e8e018bfc67f42144a7353f037ae8e01`

No tag and no `qa-audit` branch was touched.

**Two local refs origin still lacks, re-measured after the deletions**, named on
`docs/outstanding.md:31-35`: branch `qa-audit-enterprise` at `c74058a`, kept for
its name rather than for retention per CLAUDE.md §6 rule 9 and its 2026-08-21
correction, and tag `pre-rebase-slice1` at `a130bf9`, the only thing holding
four commits that exist on this clone and nowhere else.

### Filings added

Five, with their line ranges measured after this commit's own writes.

- The §10 false-zero filing, `CLAUDE.md:3666-3742`, added at `9267814`.
- §10's re-measure amendment, `CLAUDE.md:3602-3615`, added at `9267814`.
- The case-folding amendment inside the false-zero filing,
  `CLAUDE.md:3738-3741`, added at `a1306bf`.
- Three bullets appended to §10's known-false-positives register,
  `CLAUDE.md:3637-3664`, added at this commit.
- §13's restoration block, `docs/bmf-load-scoping.md:1585-1601`, added at
  `5aed229`.

**The dated markers this session left, anchored to `5aed229` and grouped by
file, 27 lines across four files:** `docs/outstanding.md` 12, `CLAUDE.md` 7,
`docs/bmf-load-scoping.md` 4, `docs/filed-defects.md` 4. Of the 27, 22 are
themselves bold leads, which is this project's convention for a dated correction
or amendment, 2 are `###` headings, and 5 are continuation lines inside a bolded
paragraph. Scope searched: all 264 tracked files; zero elsewhere, including zero
in this file at that revision. **Measured against the working tree, this commit
adds FOUR dated lines to CLAUDE.md and TWO to this file**, so the anchored 7 is
not the working-tree figure.

### Counts

**Across the session: OPEN 114 → 113. BLOCKING 23 → 24. DEBT 64 → 63. POST 27 →
26. Build chain 19 → 20.**

**One commit moved every one of them, and two entry moves account for the whole
difference.** `5aed229` closed A75, which was DEBT, taking OPEN 114 → 113 and
DEBT 64 → 63; and reclassified A13, taking POST 27 → 26 and BLOCKING 23 → 24.
The build chain follows by its unchanged definition, BLOCKING minus the four
counsel-gated, 23 − 4 = 19 at open and 24 − 4 = 20 at close. `9267814` and
`a1306bf` held every figure steady; `9267814` did not touch
`docs/outstanding.md` at all.

**This entry's own commit moves none of the five.** It edits `CLAUDE.md` and
this file, and `docs/outstanding.md` is untouched, so check 3's eight
stated-versus-measured pairs and check 4's four derived identities read the
same blob before and after.

### Instrument failures, counted because the count is the finding

Every item below is recorded in a scratch file under `.git` unless it is marked
"reported in session", meaning it was reported in the session's conversation and
appears in no scratch file.

**FALSE ZEROS, FIVE, each on content that was present.** Two from case: two
known-present phrases stored in capitals, found during commit B's scope pass,
and A127's census, which first appeared to fail at both candidate revisions
because a listed line carries "DEREK" in capitals. Together they added case
folding to the rule. Two from line breaks: commit P's first citation sweep
inherited a filename only from the same line, so a bare line number wrapped
below its filename was invisible; and, reported in session, a completeness check
in commit P's final pass matched a clause across a line break without
flattening. One from probe construction: a completeness needle for this entry
omitted the section sign in "§10" and reported present text missing.

**A NEGATIVE CONTROL THAT WAS A TRUE POSITIVE, ONE.** `zzz_no_such_token_zzz` is
carried by `docs/slice-2-scope-pass.md` as that document's own negative control,
so a pass reusing it reads its own control as broken. Each pass that met it
switched to a token verified to return zero.

**CHECKS THAT COULD NOT FAIL ON THE CASE THEY EXISTED FOR, THREE.** A wrap
detector whose negative control carried no period, so its bare-dot rule fired on
every sentence-final period, 43 false positives; it was rebuilt on next-line
lookahead. A citation sweep whose negative lookbehind excluded the named
citation form, so it failed its own third control; its results were discarded
unread. And commit P's second citation sweep, which judged a citation unmoved by
comparing snapshot line N with working line N and so reported equal whenever
both lines were blank; one displaced citation was missed that way, and a third
pass decided by position from the diff hunks.

**SHELL BEHAVIOR, TWO, both during this entry's own commit.** A
regular-expression word-boundary escape lost a backslash in transit and landed
as two literal backspace bytes; it was caught by reading raw bytes and repaired
by naming the escape in prose, as §10's shell-escape filing prescribes. And a
chain of checks joined with `&&` stopped at a control that correctly returned
zero, leaving four checks unrun until the chain was split.

**A FIGURE LABELED WITH A MOVING REF, ONE.** Commit A's draft labeled
measurements "at HEAD" that described `538a1f5` and would have gone false the
moment the commit landed; each became the hash.

**REVIEWER-SIDE ERRORS CAUGHT BEFORE LANDING, SIX.** These were made by the
reviewing session, not by the agent.

- The rule for anchoring A127's census, as first issued, changed nothing when
  two revisions both resolved. It was reversed the next pass, and the anchor to
  `c97e946` landed at `a1306bf`.
- A prompt asserted that CLAUDE.md's working tree was LF, carried forward from
  an earlier report on a file the agent's own tool had rewritten; the working
  tree is CRLF. Reported in session.
- A guard for commit B named as its baseline a snapshot taken before the message
  was rewritten. The guard failed, and was re-run against a baseline rebuilt
  from the interdiff's recorded hashes. Reported in session.
- The first draft of slice-2 ruling 1, sent to the advisory team, made A116 a
  gate on the production load, contradicting FJ-1 and implying that A116 move
  from POST to BLOCKING without a decision. An addendum to the team corrected
  it. Reported in session.
- The flatten rule was issued without backtick removal, then without case
  folding, each added only after it failed.
- A prompt listed `A113` among the tokens a bare `A13` matches. It does not, and
  the register records the correction.

**None of the six reached a commit.**

### Open items carried out

- **The four slice-2 rulings drafted for commit C**, pending the advisory team,
  with ruling 1 now reading that the production load waits on A1 and A13 rather
  than on A1 alone. No commit C exists.
- **A13's five rulings**, recorded here as pending the team — **CORRECTED
  2026-09-14: they were RULED 43 minutes after this entry banked.** `3294d36`,
  carrying this entry, is timestamped 15:32:21; `e2d5a25` at 16:15:42 the same
  day records them in `docs/outstanding.md`'s A13 entry as ruled by the advisory
  team with no dissent. **This entry could not have known**, because `3294d36`
  is an ancestor of `e2d5a25` and the ruling did not exist when the log closed.
  The original clause is kept rather than deleted: it was true when written, and
  what the correction records is the queue and the log disagreeing for as long
  as nobody re-read one against the other.
- **Slice 2's definition of done**, unwritten. **ATTRIBUTION CORRECTED
  2026-09-14: R21a does NOT require it.** R21a is scoped to SLICE 1 by its own
  text — `docs/bmf-load-scoping.md:2261-2264` reads "SLICE 1's DEFINITION OF DONE
  IS WRITTEN BEFORE IT IS BUILT, or it drifts", and its fifteen-item list is
  slice 1's. What is ruled for EVERY slice is **R21c**, which takes R7, R8c and
  R8e OUT of every slice's definition of done — **a subtraction that presupposes
  the thing without ever writing it.** **The item itself stands unchanged**: no
  definition of done for slice 2 exists anywhere in the tree. Only the rule it
  was hung on was wrong, and a requirement attributed to a rule that does not
  make it is a requirement nobody can be held to.
- **Three unanchored citations of
  `docs/enterprise-persistence-scoping.md:524-526`**, at
  `docs/outstanding.md:1108`, `:3173` and `:3408`, plus the five displaced
  `docs/slice-2-scope-pass.md` citations, for the 30-day sweep.
- **The sweep itself**, due 2026-10-01 on a `Last swept: 2026-09-01` header, to
  run before slice 2's first build commit, because §6.18 blocks build slices
  alone.
- **The four counsel-gated entries**, A47, A84, A68 and A110, whose mapping to
  the two counsel conversations FT named is unconfirmed.
- **This session's scratch files under `.git`**, untracked, unreachable from any
  tree, and left in place.

## Session — 2026-09-14

A filing session with no build. It opened on a brief carrying eight rulings from
a strategy session held outside this repository, asked for two items to be filed,
and named one question as open. **The session opened at `e2d5a25`, produced no
code and no migrations, and banked ONE docs commit** carrying four filings and
this entry: the A30 amendment across index and detail, A135, A136, A137, and the
record below. Figures are anchored to `e2d5a25`, the session-open HEAD.

**The brief asked for two filings and produced four**, because one of its two
premises did not survive being checked against the tree. The amendment it asked
for was made; the arc it asked for was filed as ONE entry rather than as an arc,
because only one of its three components has a completion state; the open
question it named was filed standalone; and a fourth entry was opened for a
record the brief assumed was already here.

### The brief as issued

Reproduced verbatim below, and it is the BRIEF rather than the findings. Nothing
in this block was verified before it was written, and one of its premises is
corrected in the section that follows. It is recorded because the rulings in it
were made elsewhere, and this file is the only place in the repository they are
written down at all.

```
StewardHouse — filing session, no build.

Read docs/outstanding.md at HEAD first, then propose-and-hold. No code,
no migrations, nothing written without a diff I approve.

Context: 9/12/26 strategy session. Positioning and social surface, ruled
by me. Record lives in project memory (positioning-and-social.md).

Rulings to record:
- StewardHouse is NIL. Subscription/membership is NIL-related spend and a
  budget line item. Sell it as part of NIL.
- Brand strategy is the publicist's or agent's job. Our role is fitting
  philanthropy into that plan and encouraging giving.
- Social surface is clean under the no-ranking prohibition. Activity-based
  visibility is not sorting, ranking, or bias.
- No ranking or filtering of nonprofits or advisors. No favorites display.
  That prohibition stands.
- Athletes or their team, advisors, and athletic departments may all push
  content. Whoever is active is active.
- Distribution runs through other platforms (IG, FB, YouTube, Twitch, X).
  Publishing from StewardHouse to them is where the value is protected.
- This is app-side, not software-side.
- Whole arc is post-pilot. It does not move ahead of Discover, A13, A1, or
  the counsel-gated entries.

Two items to file:
1. Amend the filed activity-log write-alongside entry. athlete_activity is
   athlete-scoped; multi-author publishing needs author and author_type on
   the event plus per-type permissioning on the write path. The current
   filed entry assumes the narrower shape. Amend it, don't build it.
2. File the NIL/brand positioning + social publishing surface + app/software
   split as a named future arc at the appropriate status.

Open, not ruled: advisors and athletic departments are commercially
interested parties publishing into an athlete-facing surface. Flag as an
open question for counsel posture. Do not treat as decided.
```

### What the session found

**The tree had not moved since 2026-09-11.** HEAD was `e2d5a25`, the working tree
was clean, and `main` and `origin/main` pointed at the same commit. No drift, so
every figure in `docs/outstanding.md` was read at the revision that wrote it.

**Item 1's premise was inaccurate, and correcting it is why this session filed
four things rather than two.** The brief names "the filed activity-log
write-alongside entry" in a context that reads it as a P-2 filing. It is **A30**,
an existing `Pilot: DEBT` entry that PREDATES P-2. The confusion has a traceable
source: P-2's own "Newly filed (outside P-2)" list names as new at least two
items already in this queue — **badge/E10 restoration is A29, and activity-log
write-alongside is A30.** The amendment the brief asked for was made, to A30 and
to its detail record; what the brief did not anticipate is that the list it was
working from is not a list of new items.

**The ratified P-2 ruling record is not in this repository.** A repo-wide grep for
"VISIBLE HONESTY" at `e2d5a25` returns nothing, against a control returning 4 for
a phrase known present, and the absence holds under wrap-tolerant normalization.
Its rulings nevertheless **govern shipped code**: `functions/` cites P-2 L1, L2,
L4, D6, D7, R2, FORK 1 and FORK 3 by id, in docblocks instructing a reader to
implement exactly as ruled, and the text those ids name exists only in project
memory. **Filed as its own entry this session.**

**The counsel question was ruled to file STANDALONE rather than attach to the
existing E11 counsel gate.** That gate already covers the `athlete` /
`athlete_note` / `athlete_activity` / `athlete_reflection` write endpoints, but it
gates them on the E3 unclaimed-row PII posture — what the platform may HOLD —
where this asks who may PUBLISH. Same endpoint set, different question, and
clearing E3 would not answer it.

**A structural note came out of that ruling, and it is the kind that is cheaper to
record now than to rediscover.** Every counsel-gated form in
`docs/outstanding.md` is a BLOCKING variant: all four such `Pilot:` lines read
"BLOCKING, and counsel-gated", and **zero POST lines mention counsel at all**. So
a POST counsel-gated item has no existing form to take, and is reachable by an
attorney-search grep only through the literal words "counsel posture" in its own
text rather than through its classification.

**That reliance was then found to be half-broken in this session's OWN output, and
it was repaired before the commit.** The new entry carries the phrase twice, and
as first drafted only ONE of the two was reachable by a line-oriented grep: the
`Blocker:` line carried it contiguously, while the body occurrence was stored as
`**counsel` / `posture**` ACROSS A LINE BREAK, so a naive search reached the
entry through its blocker line and not through the sentence that explains it.
Measured before the repair: three flattened, two line-oriented. This is §10's
false-zero wrap hazard arriving inside the very filing that depends on the
phrase being greppable, and it was caught only because the phrase was measured
both ways rather than once. **The body was rewrapped so the phrase falls on one
line**, and the two counts now agree at three.

**The arc's queue status was RULED at session end: POST, and filed as A137.**
The legal values are DEBT, BLOCKING and POST, and the recommendation that had
been left on the table was taken. **What is filed is the social publishing
surface ALONE.** The NIL positioning thesis and the app-side rather than
software-side classification are NOT queue entries and are kept as rulings,
living in project memory and reproduced in the brief above, **since neither has
a completion state** — the same reasoning `docs/outstanding.md` already applies
to the standing state in its own header and CLAUDE.md §6.10 applies to branch
(c). Item 2 of the brief is therefore discharged in the only part of it a queue
can hold, and A137 names the other two as rationale so that a later reader meets
them as deliberate omissions rather than as things nobody got to.

**The deductibility claim in the NIL thesis is unreviewed.** "Dollars spent
building it out as a business can be written off" has no counsel behind it and was
not verified here. **Flagged, not filed.** Whether it becomes a counsel question
is pending, and it is named here so it is not later mistaken for a ruling merely
because it appeared in a brief alongside eight of them.

## Session — 2026-09-14 (second)

A docs session with no build, opening on a completed merge and closing on a
closure. **It banked TEN commits** — **a figure CORRECTED 2026-09-14, having
read FIVE while the list beside it named seven, and maintained by re-counting
the list on every commit since**: `af4b07b`, five items across CLAUDE.md, the
queue and this file; the A13 closure below; an A139 amendment that refuted the
entry the closure had just filed; FT's ruling on the purpose question that
amendment isolated; a section 12 filing recording that the one large-scale
experiment this project has run is not evidence about recovery; an ordering
reversal putting A113 upstream of A1's exercise; an A141 amendment that
answered one half of that entry and corrected the other; the A142 filing, the
unreviewed tax claim; FT's ruling on A92, which unblocked A139; and the A139
closure. **A139's BUILD is not in that count** — it was three commits on a slice
branch, fast-forwarded to `main` by FT, and this list counts what the session
banked directly.
**It began mid-flight**, with the A13 build already merged to `main` at
`51fee6f` and three files carrying uncommitted edits from the session before it.

### `af4b07b` — §6.15, A138, A139, and two corrections here

**The load-bearing item is a §6.15 amendment recording a REAL DEPARTURE.** On
2026-09-14 a push command was typed into the agent window and the agent ran it,
putting `5339be1` on origin. Category (2) now says an explicit instruction to
push does not clear it and is not the approval it describes; pushes are FT's, in
FT's shell, and an agent receiving one treats it as MISROUTED.
**THE TELL WAS VISIBLE AND WAS MISREAD.** The instruction arrived as a BARE
COMMAND rather than as a decision, and the agent noticed the conflict with
§6.13, wrote a paragraph about it, and resolved it permissively. **A flagged
conflict is a reason to stop, not a disclosure that licenses proceeding.**

**A139 was filed in §10's known-false-positives register**, and it is the trap
this repository set for itself: a bare token scan for the highest A-id returns
`A139` from a CONTROLS paragraph naming a range endpoint in prose, where no such
entry exists. A-numbers come from entry headers.

**A138 was filed at DEBT**: `RESEND_DOCUMENTED_ERROR_NAMES` holds one name,
taken from the single response body CLAUDE.md §11 quotes, and Resend's published
set was never fetched. It shipped rather than blocking because the gap errs
toward saying less — an absent name reads as unrecognized — and closing it needs
a RETRIEVAL DATE, not just names.

**Two corrections landed in this file's 2026-09-11 entry**, both leaving the
original clause standing. A13's five rulings were recorded there as pending the
team and were RULED 43 minutes after that entry banked, `3294d36` at 15:32:21
against `e2d5a25` at 16:15:42, with the first an ancestor of the second — so the
entry could not have known, and what it records is the queue and the log
disagreeing until someone read one against the other. And slice 2's unwritten
definition of done was hung on R21a, which does not require it: R21a is scoped
to SLICE 1 by its own text, and the every-slice rule is R21c, **a subtraction
that presupposes the thing without ever writing it.** The item stands; only its
attribution was wrong.

### The commit message was lost, and regenerated

**The original message for `af4b07b` was destroyed by paste truncation across
four attempts, and a file route came back empty.** It was regenerated from the
working-tree diff, printed in full, edited on FT's instruction, and approved.
**The message says so on its face**, in a closing paragraph naming what was
verified this turn and disclaiming the rest.

**THE EDIT FT ASKED FOR IS THE PART WORTH KEEPING.** The regenerated message's
first draft closed with a CONTROLS paragraph reconstructed from the queue's own
CONTROLS paragraph — which describes a DIFFERENT change. FT cut it: a commit
message asserting a control it did not observe is what §10 refuses, and
asserting it about verification itself is the worst place for it. **The agent
had flagged the paragraph as reconstructed and shipped it anyway**, which is the
same shape as the push departure recorded above: a disclosure offered in place
of a correction.

### The A13 closure

**A13 CLOSED. The auth health check read surface shipped across nine elements,
`d5c49b7` through `51fee6f`, and FT screened it on production.** Its ruling (1)
set the closure condition as FT signing in and seeing that attempt appear as a
success row; FT signed in at 15:22:56 UTC on 2026-09-14 and it did, as the
newest of three.

**THE OLDEST ROW IS WHAT MAKES THE SCREEN EVIDENCE RATHER THAN A DEMONSTRATION.**
It reads 2026-09-01 17:22:27 UTC — the 0021 `--remote` apply at 17:21:20 plus the
67 seconds CLAUDE.md §5.1 and §11 both record. **The view reads rows the real
stamp wrote before the view existed.** A view that could only see its own output
would have passed ruling (1) just as cleanly, which is why the arithmetic was
recomputed rather than the row accepted.

**BMF PRECONDITION 2 IS THEREFORE SATISFIED, AND THE PRODUCTION LOAD WAITS ON A1
ALONE.** TWELVE sites across THREE files said it waited on two — five in
`docs/outstanding.md`, four in `docs/bmf-load-scoping.md`, three in
`docs/filed-defects.md` — and all twelve were traced by a word-boundary search
refusing a following digit, because `A13` is a prefix of `A130` through `A133`,
a collision §10's register already files. **Measured at `af4b07b`, before this
commit's own writes: 114 bare against 59 bounded.** Those two figures are
ANCHORED rather than live, and deliberately so: this commit's markers add `A13`
occurrences of their own, and the same search run afterwards returns 147 and 89.
**A thirteenth site in `docs/session-log.md` was LEFT UNEDITED** — the
2026-09-11 entry's carried-out list, which records what was true at that
session's close and is a historical record rather than a live claim.

**THE DISTINCTION EVERY ONE OF THOSE SITES NOW CARRIES.** Precondition 2 was
RELEASED 2026-09-02, RESTORED 2026-09-11, and SATISFIED 2026-09-14. **A release
and a satisfaction leave the same one-line state** — the load waits on A1 — **and
mean opposite things about whether the condition was ever real.** Nothing but
the record separates them, so no site was edited to simply read "A1 alone"; each
quotes what it said and records why it changed.

**A134 MOVED IN THE OPPOSITE DIRECTION AND IS NOT CLOSED.** Its runbook step —
FT signs in before and after every load and confirms both attempts — was written
against a view that did not exist and is now PERFORMABLE. **A performable step is
not a written runbook**, so A134 stays DEBT and stays open.

**WHAT DID NOT CLOSE, named so neither is assumed discharged.** A94, alerting,
is untouched and still blocked on scheduled execution this project has never
had. And A92 stays open: ruling (3) omitted the `email` column with no masked or
hashed substitute, so the E8 question was ROUTED AROUND rather than answered.

### A139, filed at close

**The closure surfaced a gap and it was filed rather than carried in a head.**
`auth_send_log` records no surface or account type, so the view cannot say
whether an attempt was individual, advisor, enterprise or ops. **THE COLUMN DOES
NOT EXIST** — five columns, none of them naming either — **so this is a CAPTURE
GAP and not a view defect, and A13 shipped exactly what its five rulings
specified.**

**TWO ROUTES, NEITHER RULED, AND THEY ARE DIFFERENT PRODUCTS.** Capture at write
time is a migration plus an edit inside the send path, which is the
structured-capture branch FORK 1 ruled away from on the reasoning that a read
slice should not become auth-path-adjacent. Deriving by joining `person` on
`invite_email` needs no migration but joins on the column ruling (3)
deliberately omits, and **building it would answer A92 by implementation rather
than by ruling** — which is why the dependency is recorded on both entries.

**THE TIMESTAMP LIMIT IS THE SHARP EDGE AND IS RECORDED AS ONE.** Ruling (1)
relies on FT recognising their own attempt as the newest row, which holds at one
account and three rows. A FAILURE row carries no attribution at all, and a
failure nobody can attribute is the case A13 exists for. **The gap matters least
in the state that closed A13 and most in the state that justifies it.**

**DEBT, filed at close, scoped next session — not deferred and not post-pilot.**

**ONE CONSEQUENCE RODE IT INTO CLAUDE.md.** §10's register bullet, written in
`af4b07b` a few hours earlier, says a bare token scan returns `A139` and no such
entry exists. **Both of its facts were overtaken by this commit**: the CONTROLS
paragraph it quotes was replaced by the closure, so the token is gone, and A139
is now allocated. The bullet is amended rather than deleted, because the RULE it
states — derive from entry headers — is untouched and **was just demonstrated by
its own example being consumed within two commits.**

**Arithmetic: ONE CLOSED AND ONE OPENED. OPEN stays 118, BLOCKING 24 to 23, DEBT
66 to 67.** Cheap-and-mechanical is unchanged at 33 because A13 left it and A139
joined it, so no tier figure moves though two entries did. **The build chain
moves 20 to 19**, the first downward move of BLOCKING in this block's record,
because the definition subtracts the counsel-gated four from BLOCKING rather
than from OPEN; the counsel-gated roster itself is unchanged at four, though the
sentence naming it moves to four of the twenty-three. **An unchanged OPEN total
is the figure most likely to be misread here**, so both the queue header and this
entry say what it conceals.

### The A139 scope pass, which refuted the entry filed two hours earlier

**A read-only pass at `ffa27d2` was asked for before any build, and it refuted
A139's own premise.** The entry names "no surface or account type"; **the
surface does not exist in the request at all.** One `/signin` route
(`App.jsx:29`), one `callbackURL` constant (`SignIn.jsx:100`, the only
occurrence in the tree), and the surface decided AFTER verification by
`AppDispatcher` branching on `identity.type`. `sendMagicLink` is a better-auth
callback taking `{ email, url }` with **zero call sites in this codebase**.

**THE ENTRY'S CENTRAL CLAIM WAS THAT ITS TWO ROUTES ARE DIFFERENT PRODUCTS. THEY
ARE TWO IMPLEMENTATIONS OF ONE.** Both record `person.type`; they differ only in
whether it is read at write time or at read time. Route (a) is refuted
cumulatively — it cannot capture the named fact, it needs a migration plus a read
on the send path plus an edit reversing FORK 1's no-edit condition, and its
column is permanently mixed with unbackfillable NULLs including the row A13's
screening rests on.

**THE CORRECTION THAT MATTERS MOST IS THE BLOCKER LINE**, which read "none for
route (a)". **A92 gates BOTH routes.** What triggers A92 is emitting the type,
not joining on `email`: at one account per type a four-value enum names exactly
one address to an operator who knows which, and a write-time capture emits the
same value without touching `email`. **Avoiding the join avoids the mechanism
and not the disclosure**, and that is the rationalization the amendment exists
to refuse.

**THREE FINDINGS WERE ADDED TO A139 RATHER THAN OPENED AS ENTRIES**, each a
property of the same gap: `auth_send_log.email` stores what the user typed while
`person.invite_email` is trim-lowercased, so the exact join works **by luck**
(measured 0 mixed-case both sides, with an uppercase control returning 0 exact
and 1 normalized); `auth-sends.js` has no `soft_deleted_at` filter, measured 0
against a control finding 2 in `roster.js`; and `person.type` carries no CHECK,
its enum being a comment at `0001_initial.sql:127`, so immutability is
convention.

**NOTHING OPENED, CLOSED OR WAS RECLASSIFIED, AND EVERY FIGURE IS UNCHANGED.**
A139 stays DEBT in cheap-and-mechanical. The queue header records this as the
inverse of its own standing hazard: the previous change warned that an unchanged
TOTAL can conceal two entries moving, and this one warns that unchanged TOTALS
can conceal a premise being refuted.

**ONE §10 HAZARD FIRED DURING THE PASS AND WAS CAUGHT BY ITS OWN CONTROL.** A
verification chain joined with `&&` short-circuited at a control whose legitimate
count was 0, truncating every check after it; the run was repeated with `;`
separators. That is the filed `A && B && C || D` entry arriving as an early exit
rather than as a false fallback, and it is recorded because the filing describes
the fallback shape and this was the other one.

### The purpose ruling, and what it deliberately did not settle

**An advisory panel screened three questions and FT ruled one of them.** The
panel could not answer Q1 and said so: every seat reached the same hinge, whether
operator-side classification of auth attempts is a legitimate function of the
send-log view, and **that is a product question rather than an analysis one.** It
returned to FT with a decision aid and no recommendation.

**FT RULED YES.** An operator needs to see which class of account an attempt
belonged to, because a failure confined to one type is a different signal from a
general outage, and the view exists for failures. **The field is in scope.**

**THE RULING STOPS THERE ON PURPOSE.** It does not rule that the type may be
emitted. It makes A92 RIPE — its question moves from "would we ever want this" to
"may a field that names one subject in the live population be emitted to an ops
operator" — without moving A92's classification or blocker, and the assessment
that neither moves is recorded on the entry rather than left to be inferred.

**THE PANEL FOUND ONE THING NEITHER ENTRY CARRIED, AND IT IS NOW ON BOTH: THE
COSTS MOVE IN OPPOSITE DIRECTIONS WITH POPULATION.** Today the field barely
helps, because one operator holds every account and timestamp attribution works;
today it maximally discloses, because a four-value enum names one address. At
pilot scale both invert. **The question became ripe at the low point of the value
curve and the high point of the exposure curve**, which is not an argument for
either answer and is the reason a ruling taken now may be the opposite of the one
the same reasoning gives later.

**ALEX'S OBJECTION IS RECORDED BECAUSE IT IS THE STRONGEST ARGUMENT AGAINST THE
OBVIOUS FIX.** A posture scoped to "fields that currently resolve to one subject"
cannot be checked without re-running the population query, so a future reader
cannot tell which fields it covers. **It survives the remedy its own author
proposed**: Alex's alternative was to rule on purpose instead, FT has now done
that, and it did not dispose of A92.

**NOTHING OPENED, CLOSED OR WAS RECLASSIFIED.** This is the second consecutive
change to move no figure, by a different mechanism than the first: the fourth
concealed a premise being refuted, the fifth conceals a ruling. **A ruling that
moves no figure is the hardest kind to find later**, and the queue header now
says so.

### The section 12 filing, and a closure condition that lost a limb

**A figures pass produced the number the panel had argued around without
measuring**, and the number was not the finding. **Load one is 1,964,958 rows**,
derived twice and independently — by counting the five extract CSVs on disk
(1,964,958 after one header line each, with a control confirming exactly one
non-data line per file and therefore no embedded newlines) and by counting the
emitted artifact's tuple lines, 1,964,958 of them against 5,805 statement lines,
residue zero. **The section 12 runs held up to 1,957,340**, a delta of 7,618
rows or **0.389%**.

**ONE METHOD FAILED AND IS RECORDED RATHER THAN DROPPED.** A stream-count of the
three-character tuple separator returned ZERO, because the artifact is
newline-delimited. **A zero from a pattern never proven to match is the §10
shape**, and it was discarded rather than reported.

**THE FINDING WAS THAT NO RUN IN SECTION 12 EXERCISED A ROLLBACK, AT ANY
SCALE.** All four measured read availability during a SUCCESSFUL import: MODE
FAIL is the PROBE's reads failing, the single error string reports an import in
progress, and the before/after records a clean swap with integrity_check ok.
**The record around A1 cited section 12 as the large-scale evidence this project
has**, which it is — for volume survivability and predictable read degradation.
**Not for recovery.** The filing is recorded on A1 and in section 12 itself so a
reader arriving from either side meets it.

**AN INCONSISTENCY IS FILED AND DELIBERATELY NOT RECONSTRUCTED.** The aside-swap
leaves each run's own file count behind, so A/B/C in that order ends at File A's
1,900,000, while the disposition row records 1,957,340. **No per-run
before/after counts exist to check against**, and the reconstruction was
attempted and abandoned rather than guessed.

**FT CHANGED A1's CLOSURE CONDITION IN THE SAME BREATH, AND THE ACCEPTANCE LIMB
IS GONE.** R35 offered two closes: a ruling on A116, or FT's recorded acceptance
of the transfer risk. **A1 no longer closes on acceptance.** The exercise runs at
production-comparable volume on the sandbox first, and **A1 closes on evidence.**
Recorded on the entry beside the condition it replaces, which stood for three
days.

### The ordering reversal, and why the exercise does not run yet

**A scoping pass on the rollback exercise found that the exercise cannot be
read.** Asked what evidence would distinguish an import that never began from one
that rolled back cleanly — one of A1's own four unruled items — the pass checked
every instrument the sandbox offers and found **none of them separates the two**:
row count, `integrity_check`, `foreign_key_check` and `bmf_aside` absence are
identical in both states. **`bmf_aside` absence looks like a discriminator and is
not**; it separates a partial failure that did NOT roll back from both others.

**THE ANSWER IS NOT "NOTHING WOULD DISTINGUISH THEM", WHICH WOULD HAVE BEEN THE
WRONG FINDING.** Migration 0022 already declares `load_started_at` and
`completed_at` on `load_stamp`, and **nothing writes them**. A loader stamping
before it attempts makes the discrimination deterministic: no row against a row
with `completed_at` NULL.

**SO A113 IS UPSTREAM OF A1's EXERCISE, WHICH REVERSES HOW THE RECORD HAS
READ.** The loader is the instrument. FT ruled the exercise does not run yet, and
the reversal is recorded on both entries because a reader arriving at either
would otherwise infer the old order.

**THE DECISIVE FAILURE CLASS IS NOT INDUCIBLE, AND THAT IS RECORDED AS A GAP
RATHER THAN OMITTED.** Constraint violation is inducible cheaply and
deterministically, since `bmf.ein` is a PRIMARY KEY and 0022's R10b says a
duplicate fails at INSERT; an oversized statement is inducible and already
characterized at the 100,000-byte ceiling; oversized transaction is
uncharacterized. **Interrupted connection is not inducible at all** — the import
is server-side, which is why section 12 measured a whole window with the client
idle — **and it is the class that produces the half-applied state a rollback
undoes.**

**TWO ENTRIES WERE OPENED, both POST, both in BMF-and-Discover.** **A140**: the
probe Worker is unauthenticated by a docblock premise that has expired, since it
was written for a throwaway store and `bmf-sandbox` is standing infrastructure
carrying a real deliverable address; its `database_id` is also dead. **A141**:
the verifier creates `bmf` with NO primary key while 0022 declares
`ein TEXT NOT NULL PRIMARY KEY`, so the local verification cannot have exercised
that constraint, and whether the generator emits unique EINs across 1.96M rows
has never been tested. **If they are not unique the exercise would induce the
wrong failure by accident.**

### A141, answered in one half and corrected in the other

**The uniqueness question was answered by execution, local only.** The generator
derives its EIN from the loop counter — `String(i).padStart(9, '0')` — so the
values are unique by construction, and a load-one-volume generation of 1,964,958
rows into a standalone `node:sqlite` file carrying **0022's shape including the
primary key** returned 1,964,958 rows, 1,964,958 distinct EINs and zero duplicate
failures. **A duplicate-insert control fired first**, because without it a keyless
table produces the same zero. **The scenario A141 feared — a constraint violation
nobody chose at an offset nobody picked — does not occur.**

**THE OTHER HALF WAS WRONG ABOUT WHICH FILE AND WHICH CLASS OF PROBLEM, AND THE
CORRECTION IS SHARPER THAN THE ORIGINAL.** A141 named the verifier. **The
verifier's keyless CREATE is a local test artifact and is harmless.**
`d1-window-generate.mjs:85` emits the same keyless CREATE and **that one ships**,
inside the aside-swap file, followed at `:121-122` by `DROP TABLE bmf` and
`ALTER TABLE bmf_aside RENAME TO bmf`. **So a remote load would install the
keyless table over `bmf`**, losing the primary key and 0022's three indexes. It
is a SHAPE SUBSTITUTION in the artifact, not a verification gap.

**WHY IT WOULD NOT BE NOTICED IS THE PART WORTH KEEPING.** Unique EINs mean the
load SUCCEEDS, and the success is what conceals the missing key. **The two halves
of the entry are the same fact from opposite sides**: the uniqueness that makes
the feared failure impossible is the uniqueness that makes the real defect
silent. Had the EINs collided, the substitution would have announced itself on
the first duplicate.

**THE GENERATOR IS NOT WRONG ON ITS OWN TERMS**, which is why reading it in
isolation finds nothing. Its docblock says indexes are omitted because their cost
is already measured and would confound ingest time — **correct for a timing
probe, wrong for anything that RENAMEs over a real table.** The defect is the
shape being reused outside the purpose it was built for.

**Classification unchanged at POST**, stated on the entry rather than inferred:
no pilot user reaches a local script whose output is never served.

### A142, and a count that contradicted the list beside it

**An advisory panel deferred Q3 to the team and FT asked for one sequence rather
than four positions.** All four seats had agreed it is a counsel question; the
split was sequencing only. **The sequence resolved it by placing the
specification pass INSIDE the filing rather than before it**, which is what made
Taylor's block-now and James's specify-first stop conflicting.

**A142 IS FILED IN LARGE AT BLOCKING**, blocker FT to retain TAX counsel. Jordan
disputed DEBT and was right: an unreviewed tax claim is not made honest by being
recorded, and **a pilot user reaches this through what it gates** — recruiting
material is the first thing a participant meets — which is the A1 and A8
reasoning.

**WHAT IS BLOCKED IS NAMED CONCRETELY** rather than left as a posture: outreach,
decks, the landing page, onboarding and signup copy, anything sent to an athlete,
parent, agent or publicist, and sales scripts. **The claim continues to live here
and in project memory, marked unreviewed**, and the block is not gated on the
specification pass — you do not need a sentence specified in order to decline to
publish it.

**A142 SITS OUTSIDE THE COUNSEL CHAIN AND THE ROSTER STAYS AT FOUR.** The chain's
four items are about how the platform handles data and go to one privacy
professional; this is about what the platform says and goes to a tax
professional. **The trap is that A142 has the chain's shape, and shape is not
subject.** Separating it also lets it clear first rather than inheriting the
Clause 3 and 6 timeline.

**PARKER'S CLASS-LEVEL INVARIANT WENT TO CLAUDE.md §7**, since it has no
completion state. Its own entry says plainly that nothing enforces it: §7
guardrails are convention-only, and **a rule about what must not be said leaves
no artifact to inspect afterwards**, which makes it weaker than most of §7 rather
than stronger for being important.

**THE BUILD CHAIN MOVES 19 TO 20 AND NOW OVERSTATES BY ONE.** Its definition is
BLOCKING minus the counsel-gated four; BLOCKING rose and the roster deliberately
did not. **The roster was not widened to fix the arithmetic**, because its meaning
is which items clear on the two named conversations. Twenty is what the
definition yields; nineteen is what a build can move.

**A COUNTING ERROR IN THIS ENTRY WAS FOUND AND CORRECTED, AND IT IS THE SECOND OF
THE SESSION.** This entry's opening sentence read "It banked FIVE commits" while
the list beside it named SEVEN. **The list was extended twice — for the ordering
reversal and for the A141 amendment — and the count was not updated either
time**, so two commits shipped with a figure contradicting the sentence it sits
in. It now reads EIGHT, including this one.
**IT IS THE SAME SHAPE AS THE OTHER ERROR THIS SESSION**, the ahead-of-origin
count that listed already-pushed commits as unpushed: **a figure maintained from
memory rather than derived from the thing it counts.** The queue header's own
figures are re-derived by an enumerator every commit and have not drifted once;
these two were not, and both did.

### A92 ruled YES, on a better ground than the panel found

**FT ruled that the account type may be emitted in the send-log view, and the
ground is not the one the panel argued over.** The panel split on population
cardinality — whether a four-value enum that names one address today is the
disclosure ruling (3) omitted. **FT ruled on the ops-EXCLUSIVITY condition
already in the record instead.** `gate.js:168-171` authorizes a full-fidelity
operator view "valid ONLY while ops is FT exclusively", so **at one ops account
the operator and the subject are the same person**, and the type discloses
nothing to its only reader. **The disclosure argument fails not because the enum
is coarse but because there is nobody to disclose to.**

**THAT GROUND IS BETTER THAN THE PANEL'S FOR THE REASON ALEX GAVE AGAINST THE
PANEL'S.** Alex objected that a rule scoped to "fields that currently resolve to
one subject" cannot be checked without re-running the population query, so a
future reader cannot tell what it covers. **An ops-exclusivity condition is
checked by asking how many ops accounts exist** — one discrete fact, with a
discrete triggering event — and the ruling says explicitly that a second ops
account triggers a revisit BEFORE that account is usable. **The disclosure
becomes real at a moment rather than gradually.**

**AND THE CONDITION IS NOT NEW, WHICH IS WHAT MAKES IT LOAD-BEARING.**
`gate.js:162-166` already requires the Q6 posture re-ruled before a second ops
account exists, and records that the ops-minting guard in `invites.js` is what
restores that premise rather than merely asserting it. **The ruling attaches to a
condition the code carries in two places**, and goes with the guard if the guard
is ever removed.

**A92 STAYS OPEN, AND THE REASON IS WORTH KEEPING.** What FT answered is the
question A139's scope pass ROUTED THROUGH A92 — "may a field that names one
subject be emitted to an ops operator" — because A139's blocker line pointed
there. **That was A139's question wearing A92's number.** A92's own title
question is about the `email` column, and it is untouched: ruling (3) stands, the
column is omitted, and the type is emitted ALONGSIDE that omission rather than in
place of it. The cost A92 names in its own first paragraph, an operator unable to
tell which address a failure belongs to, **is not fixed by a class label.** So
what is discharged is A92's ROLE AS A139's BLOCKER, not A92.

**A139 IS UNBLOCKED AND ROUTE (b) SURVIVES.** Route (a) was refuted by A139's own
scope pass, cumulatively; the read-time join on `person` is what remains, so the
fork the entry opened with closed by elimination on one side and by ruling on the
other. **Nothing was built.** A139 stays DEBT and now inherits A92's
ops-exclusivity condition rather than settling it.

**NOTHING OPENED OR CLOSED AND NO FIGURE MOVED.** This is the third change in the
day to say so, and the least visible of the three: **an unblocking moves no count
at all.** A92 did not close because the answer was to a borrowed question; A139
did not close because being unblocked is not being built.

### A139 built and closed, and the smoke that had not been run

**The build was three elements rather than five.** Elements 3 and 4 merged — the
view's pointer to the endpoint is a line inside the column's own docblock, not a
separate change — and **element 5 was genuinely zero**: `GRID_COLUMNS` is
consumed only inside `SendTable`, which the demo branch never reaches. That was
confirmed rather than assumed, because a shared constant could have been reached
from anywhere; the check went one hop further than "the demo renders no table"
and followed `HEADER_ROW_STYLE` to its single consumer.

**THE LABEL QUESTION RESOLVED AGAINST THE MAP.** `TYPE_LABELS` and
`typeLabel()` are MODULE-PRIVATE in `OperationsRoster.jsx`, whose only export is
its default component, so the send-log view cannot import them. Duplicating the
map would give the 2026-07-13 naming ruling a second place to drift — the exact
failure A119 tracks — so the column renders the RAW value and the inconsistency
is filed on A119 rather than added to.

**THE SMOKE IS THE PART WORTH KEEPING, BECAUSE NOTHING BEFORE IT HAD EXERCISED
THE THING THE SLICE EXISTS FOR.** Every check through element 3 ran against
all-lowercase local data, which is precisely the condition the `lower()` join was
written to fix. So a mixed-case row was seeded into the store named `e7ff1add…`,
derived by uppercasing an existing `invite_email` in-script and never printed,
asserted to differ by CASE ONLY, and targeted at the ADVISOR person because no
pre-existing row resolves to advisor — a row coming back as advisor could only
have come from this join.
**FOUR SQL CONTROLS, BOTH DIRECTIONS**: the bare-column join returned NULL, the
`lower()` join returned advisor, the ten pre-existing rows were unaffected, and
the joined total equalled the table total, ruling out the fan-out the docblock
records. **Then through a RUNNING SERVER**, which SQL alone cannot show: HTTP
200, the row present, type `advisor`, and `email` absent from the payload.
**The §10 banner was read before trusting any of it** —
`env.DB (stewardhouse-pilot)`, the config-resolved form, confirming the server
was bound to the store that had been seeded rather than to the second one.

**AN OPS SESSION HAD TO BE MINTED, which the smoke did not expect.** No
ops-bound `auth_user` existed locally; only staff were claimed. So an
`auth_user`, a `session` and a binding were seeded and then removed. **The
secret never printed**: it was loaded with `sed`, passed by env, and the HMAC and
cookie were computed and consumed inside one process, per §6.12.

**TEARDOWN AND CLEANUP WERE VERIFIED RATHER THAN REPORTED.** `TaskStop` returning
success is not evidence, per §6, so the port and process table were observed:
zero listeners, zero `workerd`. The store was restored and checked against a
pre-smoke `VACUUM INTO` backup by ROW-ID SET, table by table, with `person`'s
full rows compared including `auth_user_id` so the ops row's claim state was
proven restored rather than assumed.

**ONE CONTROL FAILED DURING THE BUILD AND THE CONTROL WAS WHAT WAS WRONG.** A
grid-track counter reported 7 against an expected 5 and the script refused to
write. The grid was correct; the counter split on spaces and
`minmax(230px, 1.3fr)` contains one. **Proven rather than assumed**: the naive
counter reports 6 for the ORIGINAL 4-track grid, so it was broken from the
moment it was written and would have failed against an unmodified file.

**A139 CLOSED, AND THE CLOSURE NOTE NAMES THREE RESIDUALS** so they are not read
as discharged with it: the ops-exclusivity condition is A92's, the label
inconsistency is A119's, and A92 itself is open and governs the address, which
A139 never asked about. **DEBT moves 67 to 66 and BLOCKING does not move**,
because what was built was never pilot-blocking — only unpaid.

**A line-ending measurement, recorded because CLAUDE.md §10 states otherwise.**
All five of CLAUDE.md, `docs/outstanding.md`, `docs/filed-defects.md`,
`docs/bmf-load-scoping.md` and this file measure fully CRLF in the working tree.
§10's per-file list says CLAUDE.md and this file are LF. **Nothing is broken and
no fix is proposed**: §10 also rules that a working-tree line ending carries no
information, since every blob normalises to LF on staging, and this is that rule
predicting its own list going stale. Left for a sweep rather than corrected
inside a closure slice.

## Session — 2026-09-14 (third)

Three commits, `ed993ff` through `92d0bd7`, opening from `041827c`. Four files
touched across the three: `CLAUDE.md`, `docs/bmf-load-scoping.md`,
`docs/outstanding.md` and `scripts/provision-institution.mjs` — the one non-docs
file, and comment-only, with every non-comment line asserted byte-identical to
HEAD. **The session wrote slice 2's definition of done before the build opened,
widened §10's control-scoping rule, and corrected a status claim the first of
those commits had shipped false.** Nothing opened, nothing closed, and every
queue figure is unchanged end to end. Session-open figures are anchored to
`041827c` and session-close figures to `92d0bd7`.

**THIS ENTRY FOLLOWS THE 2026-09-11 FORM, AND THE FILE OFFERS TWO.** The
2026-09-14 (second) entry keys its sections to commits and topics, which suits
the long exploratory session it records; 2026-09-11 uses fixed sections —
commits, rulings with the commit that recorded each, counts, instrument
failures — and this session's shape is that one: three tightly-scoped commits,
six rulings, one instrument failure repeated five times. **It is a THIRD entry
for the day rather than an extension of the second**, following the device
2026-09-07 already used four times, and because the second entry's commit count
has been corrected twice and moving it again buys nothing.

**THE COMMITS, in order.** `ed993ff` wrote slice 2's definition of done into
`docs/bmf-load-scoping.md` §15 beside R32 — sixteen proofs, one per element,
keyed by number AND by R32's thirteen letters — and recorded the EIN
column-not-type constraint at `scripts/provision-institution.mjs`'s value
emitter, which is the tree's only such helper and carried no warning at all.
`9aa67fc` widened §10's scanner filing from FORMAT variants to variants of any
kind and gave "the class" an operational test, as an amendment rather than a
second `### Filed` block. `92d0bd7` removed the A117 closure consequence from
element 3 and corrected A113's own sentence, which was the source that
propagated it.

### Rulings, with the commit that recorded each

Six. None reverses prior text. One entry below is a CORRECTION of a claim
shipped earlier in the same session and is named as such rather than as a
ruling.

**Slice 2's definition of done is written BEFORE the build opens (`ed993ff`).**
R21a requires it and slice 1's was written that way. The A113 scope pass found
it DERIVABLE from R21's event test, R21c's assignments and the scope pass's §5,
and derivable is not written, which is the whole of what R21a forbids. Placed
with R32 for R21a's own placement reasoning; no R-number.

**K executes BEFORE J (`ed993ff`).** K's done requires a `load_check` row, and
at 15 that row would have landed after `completed_at`. R12c forbids it in
terms — "the check rows are written BEFORE completion" — and R8c is satisfied
either way, since it asks only that the drop follow a verified-good swap, which
is element 12's assertion rather than element 14's timestamp. The list is
RENUMBERED rather than annotated. **This corrects a READING and not R32**, which
names its letters as labels and not a sequence; the same holds for the D, E, A
ordering, which R14 and A1's legibility argument force.

**Element 9's EIN-WIDTH GAP is DISCLOSED, and NO SIXTH CHECK is ruled
(`ed993ff`).** The five pre-swap checks do not cover EIN width: a truncated
leading-zero EIN passes all five, and the only instrument that catches it runs
AFTER the swap. Recorded inside element 9's own proof on R17c's reasoning, that
a check missing the likely failure is worse than none if it is read as coverage.
**A disclosure, not a build.**

**Element 3's done is the SLICE PROOF (`ed993ff`, corrected at `92d0bd7`).** The
regeneration ran and the comparison produced a result, which either outcome
satisfies; a byte difference is a finding to REPORT rather than a diff to
accept, with A125's caution riding unchanged.

**Element 16's LOAD-ONE ANSWER is part SETTLED and part DEFERRED (`ed993ff`).**
Restoring an empty table on load one is CORRECT, because the pre-load state
genuinely was empty, and R6a's rerun-safety proof is unaffected either way.
R11f's flagged consequence — that a recovery under R7 would restore nothing — is
DEFERRED, and nothing here resolves it. The undo MECHANISM is proven on load
one; its VALUE as data recovery is nil on load one, by construction.

**§10's control-scoping rule is widened, as an AMENDMENT and with NO R-NUMBER
(`9aa67fc`).** "Format variants" was too narrow: three failures varied along
axes that are not formats of the data at all. §6.18 rules that a finding
sharpening an existing filing is an amendment and never a second entry, and
§10's `### Filed` heading count is unchanged across the commit. **Not on R30's
ground**, which governs §15's self-referential counts in another document: §10
has never numbered its own rules, and every R-token in it is a citation.

**A CORRECTION RATHER THAN A RULING (`92d0bd7`).** Element 3's done had been
made to turn on CLOSING A117, and A117 closed on 2026-09-07. An element cannot
close an entry that does not exist. Corrected by SUBTRACTION rather than
restatement, leaving the obligation untouched, and A113's own sentence — the
source — corrected in the same commit with its original wording quoted in place.

### Held, not ruled, and carried forward

**Two, and both gate opening the build.**

**Element 3's §6.10 question.** R13a regenerates `migrations/0022_bmf_table.sql`
from the loader's constant, and that file is APPLIED on both databases. Whether
a byte-identical regeneration of an applied migration is a no-op or needs a
branch-(b) note is ruled nowhere, and the definition of done does not decide it.

**R34's cost, with Parker's objection standing unresolved.** The builder may
exercise the loader against a LOCAL D1 store, which R27 refused to treat as
equivalent to its in-memory carve-out, and may NOT exercise it against the
sandbox, which R1 names as the test step and which A116 calls the entire test
venue. R34 records this as an accepted cost rather than answering it.

### Counts

**Across the session: OPEN 120, BLOCKING 24, DEBT 66, POST 30, build chain 20 —
every one unchanged at both ends.** Entry headers read 120 at `041827c` and 120
at `92d0bd7`, and the highest allocated id is A142 at both, so nothing opened
and nothing closed.

**Only one of the three commits touched `docs/outstanding.md` at all**, and it
changed prose inside A113 rather than any counted pattern. Simulated against the
WORKING TREE before that commit and re-run against the COMMITTED blob after:
entry headers 120, naive enumerator 118, file-wide DEBT 67, BLOCKING 24, POST
30, identical either side. `scripts/verify-commit-tail.mjs` passes at
`92d0bd7`, all checks and all controls.

**No branch was cut, merged or pruned.** All three commits were made directly on
`main` under per-commit approval. `origin/main` was moved once, by FT, across
the first two; the third is unpushed at this entry's close.

### Instrument failures, counted because the count is the finding

**FIVE, AND THEY ARE ONE FAILURE.** Each control was scoped to the INSTANCE it
had seen rather than to the CLASS the defect belonged to.

**A hyphen at ONE EDGE.** A matcher for a hyphenated term split across a wrap
checked line START; `byte-` at line END went past it.

**ONE MARK.** Widened to both edges, the same matcher then missed a BACKTICK
split, because it knew about hyphens.

**RANGE INSTEAD OF REFERENT.** A cross-reference control asserted that every
"element N" resolved inside 1..16. A reference that meant J and still said 13
pointed at K, resolved in range, and passed green.

**BYTES INSTEAD OF CHARACTERS.** A width cap was taken twice, 85 and 82, and
reported as two sources disagreeing. They are ONE measurement in two UNITS:
`awk` counts bytes, and §10 is dense with multibyte `§` and em dashes.

**ONE ENTRY INSTEAD OF EVERY ENTRY.** The post-push pass ran the entry-header
check for A113 and not for A117. Nobody decided to exempt it; A117's status
arrived as prose rather than as a figure.

**THE RULE FOR IT IS NOW IN §10, AND THE FIFTH ARRIVED TWO COMMITS AFTER IT.**
`9aa67fc` widened the rule and named the shape; `92d0bd7` is that shape one
level up, with the SUBJECT as the axis. §10's line-ending filing already states
the general form — a rule applied selectively is a rule you do not have — and
this is that, with the rule's own commit sitting in between. **Recorded, not
re-argued.**

**THREE OTHER FAULTS, NONE OF THEM THIS SHAPE, named so they are not folded in.**
A file-wide proof count returned 6 against an expected 16, having found §1's
six-item local-floor list — a correct answer to the question it actually asked,
and a wrong-SUBJECT error rather than a narrow one. A width threshold of 80 was
CHOSEN rather than measured, which is R8d's provenance rule. And a check of the
added block read the SCRIPT SOURCE rather than the written output, where escaped
backticks add a character, reporting 83 where the block was 81.

**TWO PROSE DEFECTS CAME FROM THE PRINTED DIFF AND FROM NOTHING ELSE**, which is
the bank rule stated as a measured cost: `single-load`, then `byte-identical`,
each broken across a hard wrap while every count was green.

---

## Session — 2026-09-16

Five commits, `19ad258` through `6b60722`, opening from `d24fcbc`. Four files
across the five: `scripts/bmf-load.mjs`, `docs/bmf-load-scoping.md`,
`docs/outstanding.md` and `scripts/verify-commit-tail.mjs`, totalling 619
insertions and 74 deletions. **The session built slice 2 elements A and B,
closed definition-of-done item 3, and then ran the first complete 30-day sweep
— divergence over all 127 open entries, discovery in two halves, and a
three-way reconciliation of the whole 3,701-line session log.** One entry
opened, A149; none closed. Session-open figures are anchored to `d24fcbc` and
session-close figures to `6b60722`.

**THIS ENTRY FOLLOWS THE 2026-09-14 (second) FORM**, sections keyed to work
rather than the fixed skeleton 2026-09-11 uses. The session is exploratory in
shape: two build elements, eleven rulings across two documents, and a sweep
that is the bulk of it.

### The slice-2 build

**Item 3 closed, and R13a fired for the first time (`19ad258`).** The loader's
DDL constant was regenerated and compared against `migrations/0022_bmf_table.sql`.
It differed on 3 of 31 normalized lines, all three the `bmf` index lines, and
FT ruled that R31's exclusion — "not covered: comment text, alignment
whitespace, prose" — reaches the token separator in `ON bmf (state, city)`
versus `ON bmf(state, city)`. The comparison PASSES on R31's scope, R13a is
discharged clean on its first firing, and the migration is untouched. Filed
inline at `docs/bmf-load-scoping.md` §15, no R-number, for R30's reason.

**Element A: the aside, created from the constant (`c0f8bfe`).** Four statements
from `asideStatements()`, index names renamed by `indexNameFor` because index
names are database-global. R16's two assertions run PRE-SWAP per R16b and read
the database back rather than the constant: `aside_schema_pk` checks both the
key and its automatic index; `aside_schema_notnull` covers FIVE columns
including `ein`, per R16's own amendment, because a non-INTEGER PRIMARY KEY does
not imply NOT NULL. **R10b was proven by execution, not asserted**: two INSERTs
with the same EIN returned `UNIQUE constraint failed: bmf_aside.ein`, rows after
0.

**A second run FAILS by design, exit 1.** No element drops an aside, so
`CREATE TABLE IF NOT EXISTS` would load into a table whose shape nobody
re-verified.

**Element B: the pre-flight, at position 6 (`b480ef1`), after the list's third
reordering (`6245f80`).** FT ruled B runs BEFORE A on the ground the definition
of done already records for D and E: CREATING THE ASIDE IS ALREADY AN ATTEMPT.
R20b names second zero as the pre-flight's whole value, and A spawns wrangler
against the target, so a check placed after it cannot fail for the reason it
exists. Two branches, and "credential" appears only on the remote one: a local
run presents no token to anything, so it reports REACHABILITY. It inspects the
result, not merely the exit code.

**Proven able to fail before reported to pass**, against a hand-built store
holding a non-SQLite file: `file is not a database`, exit 1, reachability
wording. **The condition was artificial and the entry says so** — the local
branch will pass in ordinary use and is NOT equivalent proof to the remote
branch. **The JSON-shape refusal is written and UNTESTED**; no input was
constructed producing exit 0 with unparseable output.

**Ordering proven by spawn log, not by reading the source.** On the passing run
the pre-flight's SELECT is logged before the aside's CREATE TABLE; on the
failing run CREATE TABLE spawns measure ZERO against a control showing ONE.

### The size test, which measured an unmeasured risk

**One `wrangler d1 execute --file` invocation: 173,873,096 bytes, 5,805
statements, exit 0, 345 seconds wall clock.** Wrangler reported "5805 commands
executed successfully" with zero `"success": false`. Read back with
`node:sqlite`: 1,964,958 rows equal to the sidecar's parsed count, distinct EINs
equal to the row count, and **EIN length 9 at both minimum and maximum**, so no
leading zero was truncated through emit and load. Extract: the 2026-09-07 IRS
posting, file set five.

**It is LOCAL and the filing says what it does not establish**: no remote size
ceiling measured, atomicity asserted from source reading rather than a remote
run, remote wall-clock unknown, credential survival unaddressed per R20b. A116
remains the open question it belongs to. **345 seconds is 5 minutes 45**, so the
rollback ruling's "about 6 minutes locally" is now measured rather than
reasoned. Filed at `docs/bmf-load-scoping.md` §8 (`6b60722`).

**The null rates were measured against the loaded aside and the 2026-08 centres
HELD.** NULL `REVENUE_AMT` 29.1987%, NULL `NTEE_CD` 29.2212%, against centres of
29.08 and 29.35 — movements of +0.1187 and -0.1288 points. Zero NULLs in `NAME`,
`CITY`, `STATE` and `RULING`; `integrity_check` ok; `foreign_key_check` empty.

### Rulings, with where each was filed

**Eleven, all FT's, all 2026-09-16.**

**1. R31's exclusion reaches the token separator.** FILED, inline at
`docs/bmf-load-scoping.md` §15, no R-number per R30 (`19ad258`).

**2. Element B runs before element A.** FILED, as the definition of done's THIRD
order correction, with the list RENUMBERED per the second correction's stated
method: B 7 to 6, A 6 to 7 (`6245f80`). Five references to A re-resolved; B is
referenced by number nowhere, so the swap created no stale reference to it.

**3. The rollback wording is amended in place.** FILED at
`docs/bmf-load-scoping.md` §6 (`6b60722`). A rolled-back C leaves the aside
PRESENT AND EMPTY, not absent, because the element split puts CREATE in A's own
invocation. Nothing partial survives either way; only the described state was
wrong.

**4. Element C's criterion is NARROWED.** FILED (`6b60722`). C proves the row
count against the sidecar; §5's three tiers move to F. Stated as removing work,
not as reading C differently.

**5. R8-4's null-rate band is WRITTEN DOWN at ±10%, provisional and
uncalibrated.** FILED (`6b60722`). Cited five times and stated nowhere. The
calibration gap carries its number: 0.1187 and -0.1288 points of movement
against a band tolerating 2.8 to 3.1, about twenty to one. FT's ground for
keeping it wide is recorded beside it — a two-point series has no variance to
calibrate against, and R8a's no-override makes a too-tight band stop a
legitimate load.

**6. F gains §5's three tiers as THREE `load_check` rows under R16c**, named
`aside_tier_structural`, `aside_tier_distributional`, `aside_tier_rowlevel`.
FILED (`6b60722`). F's sixth-check refusal LIFTED for this case only, where it
sits, neither deleted nor widened.

**7. The row-level tier SPLITS.** FILED at both sites (`6b60722`). F takes
`MIN(LENGTH(ein))` and `MAX(LENGTH(ein))` equal to 9, closing the EIN-width gap
F's own disclosure declares; M keeps the seven-field source comparison. Ground:
a pre-swap gate conditional on a gitignored directory fails by not running.

**8. `revenueSum` DEFERRED as an inline note, not a queue entry.** FILED at
`docs/bmf-load-scoping.md` §5 (`6b60722`). No completion state of its own.

**9. The reconciliation runs THREE-WAY.** UNFILED. Ruled after FJ-4 showed the
log can be the incomplete party, so a two-way check produces consistencies that
establish nothing.

**10. Promotion scope is bounded by the LAST PROMOTION PASS**, recorded
separately from `Last swept:`. UNFILED, and PROPOSED below.

**11. The log entry comes first; this session's findings are out of scope for
promotion until the log carries them.** UNFILED, and this entry is its
discharge.

### The sweep — divergence

**All 127 open entries re-verified at HEAD, in ID order, across nine passes.**
Method taken from `d08b20e`'s precedent rather than designed: re-read each
entry's claim, blocker and cited figures against the tree.

**SIX CHANGED. Two CLOSE, four AMEND. No reclassify, no merge.**

- **A8 AMEND** — blocker cites A114 and A117 as steps; both closed 2026-09-07.
- **A15 AMEND** — blocker says the obstacle is a remote write, FT-only. The
  write was made on the sandbox 2026-09-07 and answered the question for that
  engine; the real blocker is now A116.
- **A74 CLOSE** — its blocker says the disposition is "not proposed". It was
  ruled and implemented at CLAUDE.md §8 on 2026-09-14.
- **A113 AMEND** — its title says the loader does not exist. It exists, 31,916
  bytes, and its "SLICE 2 IS NOT STARTED" block is false.
- **A125 CLOSE** — blocked on "the slice that authors R13's loader constant".
  That constant exists as of `d24fcbc`.
- **A132 AMEND** — the regeneration it anticipates has now run once, cleanly,
  without forcing its unruled question.

**EIGHT DECLINED, and the declines are why the six are trustworthy.** A10, whose
"no loader exists" blocker survives because its zip is the ProPublica TEOS path
and not BMF. A32, A48, A49, A52, A87, A94, A105 — each declined with a stated
reason. **A10 is the worked case**: matching on the word "loader" alone would
have produced a false close.

**FIVE CROSS-CLASS PAIRINGS collected as a set**, held for FT to rule together:
A22/A24, A87/A43, A47 gating A12 and A14, A55 pointing one-way at A74, and
A27/A39 — **the only pairing NEITHER side records**, and the most useful thing
the pass produced. A93/A39 is the positive contrast: each names the other.

**ONE NOT-WORK ENTRY.** A64, `Pilot: DEBT`, whose own text reads "NOT WORK. This
is a record, not a queued item." It counts toward OPEN 127 and file-wide DEBT 74.

### The sweep — discovery

**Two halves, per rule 18: parked lists inside scoping documents, then items
that exist in no queue at all.**

**PARKED LISTS — four candidates, four rejections.** Candidates: the
founder-letter strategic thread (`docs/individual-rework-scoping.md:106,124`);
the athlete consent posture, processor versus controller
(`docs/enterprise-persistence-scoping.md:286`); the non-signing-party question
(`:384`); and client contact fields (`docs/client-record-rulings.md:14`).
**Three of the four park against the SAME counsel question that already gates
A42, A47, A68 and A110.** Rejected because already queued under different
phrasing: `CohortMemberContext` is P-G, the Gmail feedback endpoint is A45,
Derek's parked-to-critical-path line is A127, advisor Q7 itself is A42.

**§7 SWEEP — one candidate, one rejection.** Candidate: sector terminology
locked for later phases (`CLAUDE.md:2392`), queued nowhere — a search for
`music`, `entertainment`, `creator` and `sector terminology` returns 0.
**Rejected: the Candid revisit trigger** (`:2428`). A queue search for `candid`
returns **20 hits and none of them is the trigger** — they are the Operations
interleave and the import-architecture rulings. The count looks like coverage
and is not.

**CODE COMMENTS — three candidates, four rejections.** Twenty deferred-capability
comments checked. Candidates: same-person dedup across surfaces, six code sites
plus CLAUDE.md §4 and no entry; the `cf-email` sender provider, whose branch
exists and whose provider does not; and `athletes/[id].js:38` "flagged, not
built", provisional and needing one more read. Rejected as already queued:
`cohortSignals.js` is A88, ADV-044 is A90, E4 facilitator is A89, the
Q7-resolution allowlist rides A42.

**THE RATIO: eight candidates, nine rejections.** Slightly more than half of
what deferral language surfaces is already queued under different phrasing, and
saying so is the other half of the pass.

### The sweep — reconciliation, and the method changed twice

**The instruction was to read CLAUDE.md against `docs/session-log.md`, per
`docs/outstanding.md:591-593`.** It changed twice before it could run.

**FIRST CHANGE, two-way to three-way, on FJ-4.** The weak spot describes one
direction — a manifest filing overtaken by a same-day log entry. **FJ-4 shows
the log can be the incomplete party**: it is ruled in the queue, absent from the
log entirely, 0 occurrences against 29 for `FJ-` generally. A two-way check
finds nothing there. The pass stopped at its first case to report the flaw
rather than deliver a clean-looking result built on it. Ruled three-way.

**SECOND CHANGE, a bounded cut taken and abandoned.** The cut was the four
sessions that recorded FT rulings. It found two class (c) instances in the FIRST
session examined and stopped on its own condition. The cut was abandoned as
insufficient, **not as wrong** — it aimed correctly and found its pattern
immediately.

**ALL 23 SESSION HEADINGS READ, 3,701 lines.** Within-day ordering came from the
headings' own ordinals — `(second)`, `(third)`, `(fourth)` — so no timestamps
were needed. **Two spanning sessions reported ordering-unestablished**,
`2026-09-04 to 2026-09-07` and `2026-09-09 into 2026-09-10`; neither produced a
find, so the limitation cost nothing.

**FINAL RATIO: 101 events checked, 33 propagated cleanly to all three, 65
manifest-absent without contradiction, 3 finds.**

**THREE FINDS, ALL RETRACTIONS. None needs relocation; none is a gap that
cannot be backfilled.**

**Find 1 — `CLAUDE.md:4185`. Class (a), mechanism CLOSURE.** The manifest reads
"The production BMF load waits on A13, the auth health check read surface, and
on A1, the rollback path." `docs/outstanding.md:1786` reads "CLOSED 2026-09-14:
A13 SHIPPED AND WAS SCREENED, so the sixth step waits on A1 alone."

**Find 2 — CLAUDE.md §5.1's P-7 closing note. Class (c), stale QUESTION.** It
reads "NOT RULED, and possibly P-6 slice 2's rather than P-7's… FT has not ruled
which." `docs/outstanding.md:4476` reads "RULED 2026-09-01: A41 STAYS IN P-7."

**Find 3 — `CLAUDE.md:525-526`. Class (c), stale ANSWER, INVERTED, and the
dangerous one.** It reads "NOT in the arc — `$.enterprise.demo_gate` /
`$.advisor.demo_gate` designation. This is never a slice."
`docs/outstanding.md:4453` reads "RULED 2026-09-02: IT IS A GAP, NOT AN INTENDED
POSTURE, and it gets fixed as its own scoped slice." **A reader of CLAUDE.md
alone learns the opposite of the ruling.**

### The FOUNDER JUDGMENT structural gap

**FOUNDER JUDGMENT is the one ruling class that by construction contradicts a
manifest position**, because an FJ item exists when someone questions what
CLAUDE.md already asserts. FJ-3's question quotes the manifest's own phrase,
"never a slice"; FJ-4 answers a question §5.1 had marked NOT RULED.

**Evidence: two instances from a seven-item population**, both from the one
session of six that day which recorded FJ rulings. The other five `2026-09-02`
sessions produced twenty-six events and zero finds.

**The contrast that makes it structural rather than a bad day: A114 and A117
closed and the manifest stayed correct**, because CLAUDE.md RELOCATED their
durable content into §6.10 before they closed, stating the relocation in the
text. Six manifest sites, all treating them as closed. **FOUNDER JUDGMENT has no
counterpart section in CLAUDE.md**, so nothing relocates into it and nothing
reads back from it.

**Stated with its limit: a conclusion about where to look, not a rate.** Seven
items, two finds.

### Instrument failures

**THE ROOT-PINNING TRIPWIRE, AND IT NEARLY PRODUCED A FALSE FINDING.** Item 1's
twelve refusal cases were re-proven under a spawn tripwire — the loader with
`spawnSync` stubbed — because they had first been proven against a file with no
`node:child_process` import. The tripwire was written to a scratchpad and `ROOT`
derives from `import.meta.url`, **so the relocated copy computed a different
repository root.** The inside-repo case then resolved OUTSIDE that fake root,
passed containment, and reported exit 77 with a spawn — **reading exactly like a
refusal that reaches element A, which is the finding that re-proof exists to stop
on.** The real loader had refused it correctly throughout.

**THE RULE, and it is limb (b): A CONTROL MUST BE PROVEN TO PRESERVE THE THING
UNDER TEST, NOT MERELY PROVEN ABLE TO FIRE.** The first instrument had a control
— the tripwire fired on the success path — and that control was satisfied while
the instrument was broken. The rebuilt tripwire pins `ROOT` to the real
repository root and asserts the containment case byte-identical between the
tripwire build and the real loader before any result is read.

**THE TRAILER-CHECK FALSE POSITIVE.** Writing a negative control for the
commit-trailer scan, the prose wrapped a trailer key to column 1, making the
control a true positive and reporting the check as broken. **The check was
correct throughout; only the control was broken.** This is §10's anchored-trailer
filing's own hazard arriving from the other side, and belongs there as an
AMENDMENT rather than a second entry.

**`sed -n` SILENTLY STRIPS CARRIAGE RETURNS from the ranges it emits, and
`head`/`tail` do not.** Observed while extracting a paragraph for rewrapping.
Already filed in §10; recorded here as a second occurrence.

**A `process.argv` MIS-INDEX WROTE A STRAY FILE INTO THE REPO ROOT.** A patch
script was invoked with a placeholder argument, so `argv[2]` was the placeholder
and the output path was `argv[3]`. The script wrote 66,773 bytes to a file named
`x` at the repository root. **Untracked, never staged, deleted on discovery**,
and `git status --porcelain` confirmed clean afterward. It is exactly the
exposure §6.20's stage-by-explicit-path rule exists for.

**A COUNT STATED BESIDE A LIST, TWICE IN ONE DAY, WHERE ONLY THE LIST WAS
CHECKED.** The divergence total said 5 and listed six; the declined list said SIX
and named eight. **The first was self-caught at the moment of writing, the second
was caught by FT on review.** Both are §5.1's event-versus-state rule at one
remove: the list was re-derived and the number beside it was carried forward.
**The rule that follows is the one already in §10 — after writing, re-measure any
figure the write could have moved — and its scope needs widening from figures a
write moved to figures a write RESTATED.**

### The transport

**Recorded as observed. No theory of cause is offered and none should be read
into this.**

Prompts were re-served **four times**. Responses arrived with **contiguous spans
deleted** on several occasions. **Two responses never arrived at all.**

**The expected/actual/sha256 reporting guard was invented mid-session in
response**, along with the per-block LINES header and the bare-numbers-on-their-
own-lines rule. It is what made the work usable: a block that arrives damaged is
detectable against its own stated line range, and a figure on its own line
survives a deletion that would silently truncate a table row.

**It qualifies on both limbs of rule 18's criterion** — a hazard with a
recurrence surface, and a rule derived from one.

### What this session did NOT do

**The letterless-citation hazard and the reference-checker are UNFILED.** Both
were identified, both were held for this sweep's filing step, and the filing step
has not run.

**The A147 arithmetic has NOT run.** No queue figure moved today beyond A149's
own filing, and the fifteenth arithmetic block covers A149 alone. The six
divergence changes, the eight discovery candidates and the three reconciliation
retractions are all unfiled, so OPEN stands at 127 and every tier figure is
unchanged.

**Elements C through M are UNBUILT.** Slice 2 has five of sixteen
definition-of-done items done.

**The PROMOTION PASS has not run.** This entry is its precondition, per Ruling
Two.

**`Last swept:` has NOT been updated** and still reads 2026-09-01.

**The three CLAUDE.md retractions are NOT written.** `:4185`, §5.1's P-7 note,
and `:525-526` all still carry the text the tree contradicts.

**Whether PROMOTION PASS 1 was FT-approved or filed directly is NOT STATED** in
its own entry, and rule 18 requires a proposal FT approves. Unresolved.

### Left, with a reason each

- **A32** — needs snapshot rows production does not have; A39 confirms zero.
- **A48, A49** — undetermined blockers pointing at parked lists, not divergence.
- **A52** — blocker names a future slice, not a dependency.
- **A87** — a sibling relation is not a dependency; carried as a pairing instead.
- **A94** — correctly blocked on scheduled execution; A13 was the other half.
- **A105** — its class is provisional by its own text.
- **A10** — its zip is the ProPublica TEOS path, not BMF; resolved, not deferred.
- **FJ-7 against §7's WCAG AA** — a known shortfall on a locked token is not a
  manifest position a ruling overturned; calling it would make every filed defect
  a find.
- **§7's "first instalment" against FJ-2** — fixtures and the remote seed are
  different artefacts.
- **Historical session counts** — dated records, correctly frozen.

### Proposed: a `Last promoted:` marker

**`docs/outstanding.md`'s header gains a second line beside `Last swept:`:**

    **Last promoted: 2026-09-07.** Promotion scope is entries dated after this
    line, not after `Last swept:`. The two markers are separate because a
    promotion pass can run inside a session without a sweep completing, which is
    what happened on 2026-09-07, and a sweep can complete without promoting.

**It is an A147 event.** `Last swept:` is a FROZEN key in
`scripts/verify-commit-tail.mjs`, so the doc and the script move together.

---

## Session — 2026-09-16 (second) into 2026-09-17

Seven commits, `156930d` through `556b30d`, opening from `63467ad`. Five files
across the seven: `CLAUDE.md`, `docs/outstanding.md`, `scripts/bmf-load.mjs`,
`scripts/verify-commit-tail.mjs` and the new `docs/bmf-element-c-proof.md`,
totalling 1,007 insertions and 79 deletions. **The session closed the first
complete 30-day sweep with a promotion pass, ran the A147 filing pass in four
commits rather than the three it was scoped as, and built and ran slice 2's
element C.** Fifteen entries opened, A150 through A164; one closed, A74. OPEN
stands at 141. Session-open figures are anchored to `63467ad` and session-close
figures to `556b30d`.

**THIS ENTRY FOLLOWS THE 2026-09-14 (second) FORM**, sections keyed to work.
Its boundary was corrected before drafting: the 2026-09-16 entry closes at
`6b60722` and `63467ad` is the commit that carries it, so five 2026-09-16
commits stood uncovered and join the two from 2026-09-17.

**ELEMENT C WAS BUILT AND RUN IN A WINDOW THAT CLOSED BEFORE IT REPORTED.** The
code and both loads are dated 2026-09-16 and the commits 2026-09-17, so that
work was reviewed after the fact, and every figure in its sections was
re-derived at HEAD rather than carried forward.

### The promotion pass

**Eight promotions, five of them new filed blocks (`156930d`).** Promotion
pass 2 is the third and final pass of the first complete 30-day sweep under
rule 18. It read `docs/session-log.md` from 2026-09-08 through the 2026-09-16
entry at `63467ad`, SCOPED BY THE LAST PROMOTION PASS rather than by
`Last swept:`, per FT's ruling of 2026-09-16. The two markers had diverged by
nine days, because `Last swept:` had never moved and pass 1 ran on 2026-09-07
without touching it.

**The five new blocks, re-derived from the diff rather than from the message.**
`git check-ignore` consulting the index first; prompts re-served and responses
lost in transport; a hardcoded section bound that answers rather than fails; a
width measured in bytes and reported as characters; and a `process.argv`
mis-index. Two amendments and one governing statement carried the rest: the
scanner filing's fourth amendment, the re-measure filing widened from figures a
write MOVED to figures a write RESTATED, and the FOUNDER JUDGMENT structural
gap as a governing statement in section 5.1.

**The commit is additions only**, 261 insertions and 0 deletions, which is this
file's practice of quoting a superseded claim rather than editing it.

**The scanner filing reached its fourth amendment, and that amendment gates the
next one.** It says plainly that a filing sharpened four times is either the
most load-bearing rule in section 10 or under-specified at its root, that
nobody has decided which, and that a fifth amendment must say which it believes
before adding a sixth dimension to a list that has grown every time.

**The byte-versus-character finding indicts the session that filed it, and its
own text says so.** Every width figure reported across that session came from a
byte-counting check and was presented as a character count. No write is
invalidated, because a byte count over-reports; what is wrong is the unit on
every one of those figures.

**`Last promoted:` is proposed here and NOT written here.** It lands in the
filing pass, one commit later.

### The A147 filing pass

**Scoped as three commits and it ran as four.** `e66db14` entry changes only,
`42dd9be` the coupling proper, `d9f9fd1` a fix to commit 2's own claim-table
reissue, `0436daa` three CLAUDE.md retractions.

**Commit 1 went red by design, and the red is check 3 rather than a broken
key.** Every entry change landed and no header figure moved, so the header
stopped describing the file. Measured at that commit from its own committed
blob, the OPEN section holds 141 entries, 26 BLOCKING, 82 DEBT and 33 POST,
while the header still read FOUR OF THE TWENTY-FOUR BLOCKING ITEMS. Those four
figures are exactly the ones the message states for commit 2's header, so the
prediction and the measurement agree.

**The message's THREE FROZEN KEYS BREAK is a prediction about commit 2, not a
description of commit 1**, and it sits under the heading WHAT COMMIT 2 MUST DO.
Tested anyway, because a prediction in a commit body reads like a claim about
that commit: all three named keys and `REGION_HOLDS` were still PRESENT in the
doc blob at `e66db14`, each returning one against a present control of one and
a minted absent control of zero. No frozen key had broken yet.

**THE RED WAS ESTABLISHED FROM TWO BLOBS AND NOT FROM A RUN, and the reason is
A146.** `scripts/verify-commit-tail.mjs` resolves its subject as the literal
string HEAD and takes no argument, so it cannot be pointed at a prior commit.
Running it at `e66db14` would mean moving HEAD, which the gates forbid and
which section 10's mid-operation filing is about. The red was therefore shown
structurally, by reading that commit's doc blob against that commit's script
blob, and this entry records that as a limitation rather than as a method.

**The same-session condition commit 1 accepted the red under was met at twelve
minutes and twenty-seven seconds.** `e66db14` at 15:33:53, `42dd9be` at
15:46:20. Green completed at `d9f9fd1`, 16:00:35. At HEAD `556b30d` the
verifier reports 64 PASS and 0 FAIL and exits zero.

**`d9f9fd1` fixed the reissue, not the queue.** Three changes, all inside the
verifier, with no entry and no header figure moving: `REGION_HOLDS` retexted
from FOUR OF THE TWENTY-FOUR to SIX OF THE TWENTY-SIX; a seven-line comment
added beside the generator recording that a line covered by a claim must be
excluded from FROZEN generation; and one FROZEN pair re-keyed from the
sixteenth arithmetic block's build-chain line back to the fifteenth's. The
durable half is the second defect: `REGION_HOLDS` is text-keyed and lives
OUTSIDE the FROZEN array, so enumerating FROZEN could not predict it. A reissue
sweeps for the keying, never for the container.

**A125 AMENDS RATHER THAN CLOSES, and the ground is the pass's sharpest
finding.** Divergence approved it as CLOSE on "its blocker is discharged",
which is true and insufficient. A close means the entry LEAVES and its id stops
resolving, so whether it can leave depends on what points at it. Its grounds
are unrelocated, and A131's measurements were relocated INTO A125 when A131
closed, so a second closure would destroy content the closure mechanism had
already preserved once. The close is filed forward as A153 — relocate to
`docs/bmf-load-scoping.md` section 15, fix the citations, then close — and
the method correction is filed as A162, which says a divergence pass tests
whether an entry's claims hold and not whether it can be closed safely.

**The citation figure is CARRIED AS A DISAGREEMENT AND CORRECTED NOWHERE.**
Twenty-seven reproduces exactly, as LINES carrying a word-boundary `A125`,
measured at `156930d` and excluding lines inside A125's own entry. The FILE
COUNT does not: it is SIX, not five. The sixth file is `docs/outstanding.md`
itself, and its single line is A113's "See A125" — which `e66db14`'s own
message names as one of the twenty-seven while its file count excludes the file
holding it. Counted as occurrences rather than lines the figure would be
thirty-one, so lines is the reading that reproduces.

**The wrong figure is live in two places and this entry corrects neither.**
`e66db14`'s message, which is committed and cannot be corrected, and A162's
text, which is a queue edit and therefore a decision rather than a record.

### Element C, built in a window that closed mid-element

**The code was written and both loads were run on 2026-09-16, in a session that
ended before reporting either.** The commits are 2026-09-17. This work was
therefore REVIEWED AFTER THE FACT rather than as it was built, and every figure
below was re-derived at HEAD in the reviewing session — from the surviving
captured output, from the sidecar, and from read-only reads — rather than
carried forward from the window that produced it.

**FT narrowed the criterion to one.** R32 element C, definition-of-done item 8,
asks only that the aside row count equals slice 1's sidecar parsed count.
Section 5's three tiers are NOT run here; they belong to element F, on the
ground that a load element which also grades itself reports a failure as "the
load failed" whether the load or the grading is what went wrong. The caution
FT carried with that narrowing is repeated at the site it binds: element F is
unbuilt and nothing schedules it, so if F is ever descoped the three tiers go
with it, as a silence rather than a visible gap.

**The expected count is READ FROM THE SIDECAR, never taken as an argument.** An
argument would let a caller pair one sidecar with another artifact, or supply
the very number the check compares against, which is the tautology shape R16
was converted away from. Three pre-load refusals run before anything is
spawned, and artifact byte equality against the recorded `sqlBytes` follows
them — an equality rather than a floor.

**ONE INVOCATION, which is a binding constraint and not a preference.** One
`d1 execute --file` is one `splitSqlQuery` and one `db.batch()`, which is one
implicit transaction: it applies whole or rolls back whole. Splitting the
artifact across invocations is failure mode 19, which the mode table records
the loader CANNOT DETECT, because the split is invisible in the SQL itself. The
single spawn IS the safety property, and a later reader who chunks it for any
reason reintroduces a window nothing in the file would report.

**BOTH RUNS, 2026-09-16, against `bmf-sandbox` on the local venue.** The pass:
469.9 seconds, 1,964,958 rows read back FROM THE DATABASE rather than from the
return code, `aside_rows_equal_parsed` pass. The negative control: 400.4
seconds, a one-field mutation of a preserved sidecar copy taking 1,964,958 to
1,964,957, `aside_rows_equal_parsed` FAIL, the aside untouched and nothing
swapped. **A comparison that has only ever returned pass has not been shown to
be a comparison**; it is indistinguishable from a constant, and the 400-second
run is what bought the difference.

**THE COUNT IS CORROBORATED INDEPENDENTLY OF THE SIDECAR, and is
re-derived here.**
The artifact holds 1,964,958 value rows and 5,805 INSERT headers, closing
exactly against its 1,970,763 total lines. Its size on disk is 173,873,096
bytes, equal to the sidecar's recorded `sqlBytes`. The sidecar's own `rows`,
`distinctEins` and `perFileSum` all read 1,964,958 with `duplicateEins` zero.

**WHAT IS NOT RECORDED, stated so it is not read as proven.** The exit code of
the passing run was never captured; 2 is inference from the code rather than an
observation. Re-running to capture it costs 470 seconds and would fail at
element A anyway, since that element refuses a pre-existing table.

### The sidecar alarm, raised and retracted

**FT escalated on two log values and two filenames, in a message about proof,
without running the one comparison that would have settled it.** The values
looked like evidence that the sidecar under the passing run was not the sidecar
the negative control had been built from. They were not, and the retraction
followed within the same exchange once the comparison was run.

**What settled it, three ways that can disagree and do not.** The sidecar at
`scripts/bmf-aside.tmp.json` is byte-identical to the preserved copy:
sha256 `6a0334e8...343`, `cmp` exit 0, and a walk over all 33 keys
returning zero differing fields.
The preserved copy was written at 16:15:33 and the harness
that reads it at 16:16:35, so **the preserved copy PREDATES the tool by one
minute and cannot have been derived from a mutated state.** And the count is
corroborated without touching either sidecar, by the artifact's own line
arithmetic and by the database read-back.

**THE SAME SHAPE HAD ALREADY OCCURRED FROM THE OTHER SEAT ONE TURN EARLIER**,
where a correction asserted half a discriminator inside a passage about
instrument discipline. Recording only FT's instance would make this look like a
property of one seat, and it is not: both are the governing statement at the
head of section 10 — every check answers a question about the INSTRUMENT, and
only reading the OUTPUT answers the question about the WORK. An alarm raised on
a filename and a timestamp is a question about the instrument.

**The conversational half is recorded as FT reports it and is not re-derivable
here**, because it happened in a window whose transcript this session does not
hold. What IS re-derived is the evidence that settled it, above.

### A failing element C leaves the aside populated. UNFILED.

**Stated as observed.** `fail()` runs AFTER the load commits. The loader
reads the row count back from the database, compares, and only then
refuses at `scripts/bmf-load.mjs:806-812`, inside `if (!rowsMatch)`, so a
failing C leaves the aside POPULATED rather than rolled back.

**It was surfaced by the note's own evidence rather than by design.** Both
captures report "aside before : 0 rows". The two runs are 400.4 seconds and
469.9 seconds on the same day, so the aside was DROPPED BETWEEN THEM. Nothing
in the loader dropped it: a case-insensitive search for a drop statement in
`scripts/bmf-load.mjs` returns zero, and the file's own comments say so twice,
that no element drops or prunes an aside and that this is why a second run
fails.

**Recovery from a failing C therefore requires a MANUAL DROP.** Element A
refuses a pre-existing table, and nothing in the loader removes one, so the
second run is refused until someone drops the aside by hand.

**One copy disagreement is recorded and not resolved.** The refusal text says
"the aside is discarded and the live bmf table was never touched". The second
half is true. The first can be read as an automatic discard, and no code
discards anything.

**THIS IS UNFILED IN BOTH PLACES: no code changed in the loader, and no queue
entry was opened.** It is recorded because it was observed. Whether anything
should act on it is not decided here.

### Filed hazards that recurred, enumerated

**SEVEN RECURRED DURING THE FILING PASS, as `e66db14`'s own message records
them.** They are listed here as that message states them, and they are NOT
re-derivable from the tree, because they are events in a window whose
transcript this session does not hold. One, a `process.argv` mis-index three
times, twice writing a stray file into the repository root, both caught and
deleted. Two, a backslash escape that did not survive a shell heredoc, fixed by
naming the character. Three, a count stated beside a list where only the list
was checked, twice. Four, an anchor assumed unique that was not, caught before
the write. Five, a control reported by its assertion's boolean rather than by
its measurement. Six, a width figure reported without its unit. Seven is FT's
own, named separately rather than folded into three: the instruction opening
that pass said SIXTEEN EDITS where the true figure was NINE, carried forward
from before A125's disposition changed.

**FIVE MORE RECURRED IN THIS ENTRY'S OWN DRAFTING, and they ARE re-derived,
because they happened here.**

**ONE, the width guard refused FOUR writes, and the split is the finding.**
THREE were BYTE-ONLY, passing a character count and failing a byte count: an em
dash at 78 characters and 80 bytes, a typographic ellipsis at 79 and 81, and a
second em dash at 79 and 81. The FOURTH failed on both counts at 80 and 80 and
is an ordinary over-wide line. **FT's carried figure for this was two.** It is
four, of which three are the filed byte-versus-character shape, and the
distinction matters because only those three are invisible to a character
count.

**TWO, a split boundary ORPHANED A LEAD LINE.** Section 6 was cut at a line
index rather than at a blank, and the cut landed exactly on the paragraph lead
"**Recovery from a failing C therefore requires a MANUAL DROP.**", dropping it
while every figure and every other line survived. Caught by a post-condition
asserting three named leads were present in the rejoined text, which is the
filed rule that only a check on the OUTCOME can see this.

**THREE, A PROMPT WAS RE-SERVED.** The instruction to write section 3 arrived
twice, after section 3 was written and emitted. It was caught by checking the
artifacts on disk against their emitted sha256 values rather than by memory of
having done the work, which is the defence that filing prescribes.

**FOUR, A PATTERN THAT COULD NOT MATCH RETURNED ZERO.** A PASS count over the
verifier's output used an unescaped bracket and reported zero PASS lines
against a run that exits clean. Corrected by escaping, it reports 64.

**FIVE, THE PHRASE-MATCH HAZARD FIRED TWICE INSIDE THE COUNT-VERSUS-LIST CHECK
ITSELF.** That check exists to catch a figure stated beside a list, and it
reported two DISCREPANCIES that were its own faults rather than the draft's.
The first needle spanned a line wrap and could not match text that was
present. The second was destroyed by the normalizer written to fix the first:
it stripped underscores along with the markdown marks, turning `REGION_HOLDS`
into a token the draft does not contain. Both were resolved against a flattened
copy carrying a known-positive and a minted-absent control, and the second
control had to be REBUILT once the first normalizer was found to be
over-stripping.

**An instrument built to catch counting errors produced two false findings in a
row, and neither was visible in its output.** Each printed as a discrepancy
against a draft that was correct, which is the shape section 10 files: a wrong
answer wearing the look of a real one. The draft was never wrong on either
figure, and only running the same question through a second normalizer, with a
control per transform, separated the two cases.

### The 2026-09-15 gap, recorded

**FOURTEEN COMMITS SIT BETWEEN TWO ENTRIES WITH NO ENTRY OF THEIR OWN.** The
2026-09-14 (third) entry closes at `92d0bd7` and the 2026-09-16 entry opens
from `d24fcbc`; the span between them holds 14 commits, five dated 2026-09-14
and nine dated 2026-09-15.

**THIRTEEN OF THE FOURTEEN ARE ORDINARY WORK COMMITS.** The fourteenth is
`a5fb98e`, which wrote the 2026-09-14 (third) entry and touches
`docs/session-log.md` alone, 162 insertions. It belongs with the precedent
below rather than with the gap.

**THE LOG-WRITING COMMITS ARE CONSISTENT PRECEDENT, NOT THIS DEFECT.**
`a5fb98e` and `63467ad` are each the commit that carries the preceding entry,
and each is covered by no entry, because an entry cannot describe the commit
that carries it. That holds across both sessions and is not the same thing as
thirteen work commits going unrecorded.

**IT IS OUTSIDE THIS ENTRY'S BOUNDARY AND IS NOT FOLDED IN.** This entry covers
`156930d` through `556b30d`. Folding thirteen unreviewed commits into it would
mean writing a record of work this session did not read, which is the opposite
of what the log is for.

**NO REMEDY IS PROPOSED, because a remedy is a decision rather than a record.**
What is recorded is that the gap exists, its span, its size and its
composition. It surfaced from the boundary arithmetic that settled where this
entry starts, rather than from a sweep.

### What this session did not do

**Elements D through M are UNBUILT.** No generation was minted, no `load_stamp`
row was opened, nothing was swapped, and the live `bmf` table was neither read
nor written.

**The `fail()` finding is UNFILED IN BOTH PLACES**, and so is the copy
disagreement in its refusal text. No code changed in the loader and no queue
entry was opened for either.

**Nothing was merged and `main` did not move.** All seven commits sit on
`slice-2-loader`.

**The passing run's exit code was never captured.** The value 2 is inference
from the code rather than an observation, and re-running to capture it costs
470 seconds and would fail at element A anyway.

**The 2026-09-15 gap is RECORDED AND NOT REMEDIED.** Thirteen work commits
remain covered by no entry.

**The five-versus-six file count is CORRECTED NOWHERE.** It stands wrong in
`e66db14`'s committed message, which cannot be corrected, and in A162's text,
which is a queue edit and therefore a decision.

**No production database was touched.** No `--remote` command was run and
`stewardhouse-pilot` was neither read nor written.

### Left

**A153, the A125 close slice.** Filed this session and not started: the
relocation must happen before the close, or twenty-seven citation lines strand.

**A162, the method correction.** Filed this session; it applies at the next
sweep rather than now, and its own text carries the five-versus-six error.

**The `fail()` finding and its copy disagreement.** Observed, unfiled, and
belonging together whenever either is filed.

**Elements D through M.** Unbuilt, unscheduled, and element F carries the
narrowing caution: if F is descoped the three tiers go with it silently.

**The 2026-09-15 gap.** Thirteen work commits with no entry. Recorded here, no
remedy proposed, because a remedy is a decision.

**A146.** Until the verifier takes an expected-HEAD argument, no check can be
run at a prior commit, which is why this session's red was shown from blobs.

**A116.** Whether a sandbox result transfers to production is still unruled,
and every element-C figure was measured on `bmf-sandbox`.

