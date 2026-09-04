# Outstanding

What is open, in what order, and where the detail lives. Produced on 2026-09-01
by a sweep of the tree and the git history, because this repository had a defect
queue and a session record and neither answered "what is open and in what
order".

**THIS FILE IS AN INDEX, NOT A RECORD.** Each entry carries an ID, a one-line
title, a blocker, and a pointer. It carries no evidence and restates no finding.
`docs/filed-defects.md` holds the detail and the proof; `docs/session-log.md`
holds the narrative of how each session went. Where those disagree with this
file, they are right and this file is stale.

**Last swept: 2026-09-01.** Next sweep due 2026-10-01. That date is read at the
start of every agent session and, once 30 days have passed, it BLOCKS BUILD
SLICES until a sweep runs. Docs commits, rulings and read-only passes are not
blocked. The rule, what a sweep is for, and why the interval is 30 days are in
CLAUDE.md §6, the 30-day sweep.

**REFRESH ON STATE CHANGE (ruled 2026-09-01, FJ-6).** This file is updated when
an item opens, closes, or moves, and the edit rides the commit that caused the
change. That is the per-change cadence; the sweep above is the periodic backstop
for what the cadence misses.

**As committed: 103 OPEN, 10 PARKED, 7 founder-judgment of which 5 are now ruled,
3 answerable only by FT, 10 ruled out.** The OPEN count breaks down as six
ruled tiers holding 8, then gates-other-work 16, gates-a-stated-commitment 7,
BMF-and-Discover 8, cheap-and-mechanical 27, large 34, and
blocker-undetermined 3.
**ARITHMETIC OF THE LAST CHANGE, 2026-09-04: A18 CLOSED.** Its entry sat in
Tier 2, one of the six ruled tiers, so OPEN moves 104 to 103 and the tiers move
9 to 8: 8 + 16 + 7 + 8 + 27 + 34 + 3 = 103. A18 was BLOCKING and is not one of
the four counsel-gated items, so BLOCKING moves 20 to 19: 19 + 59 + 25 = 103.
**THE BUILD CHAIN MOVES TOO, 16 to 15, and this is the figure a totals edit
misses.** The two-chains sentence below defines it as BLOCKING minus the
counsel-gated four, so 19 - 4 = 15. It is DERIVED and is written in commit
messages rather than stated anywhere in this file, which is exactly why
correcting the totals above does not correct it and why a grep for a changed
number cannot find it.
Nothing else moved: PARKED, founder-judgment, FT-only, ruled-out, DEBT, POST,
the counsel-gated four, and the other six group counts are all unchanged.
**TWO founder-judgment items are NOT RULED and both say so explicitly**, FJ-5
and FJ-7, with the evidence and the reason for withholding recorded on each
entry. An unruled item and an item nobody has looked at are different states,
and the count distinguishes them.

**AGAINST THE PILOT GATE (classified 2026-09-02): 19 BLOCKING, 59 DEBT, 25 POST**,
of which 5 POST carry "(undetermined)" because their own text does not settle it,
and of which **one DEBT, A105, is PROPOSED rather than ruled** and says so on its
own line. A total has to place it somewhere, and DEBT is where its proposal
puts it. Every OPEN entry carries a `Pilot:` line. **ONE ENTRY OUTSIDE OPEN
CARRIES ONE TOO, AND IT IS THE ONLY EXCEPTION:** FJ-7, whose disposition FT
ruled DEBT at the same time as filing it. That line is NOT counted in the three
totals above, which remain a count of OPEN entries and sum to 103. The sentence
here previously read "nothing else does", which FJ-7 made false. BLOCKING means
pilot
cannot open with it unresolved, DEBT means pilot can open with it recorded and
honest, POST means no pilot user reaches it.
**FOUR OF THE NINETEEN BLOCKING ITEMS ARE COUNSEL-GATED AND CANNOT BE CLOSED BY
BUILDING: A47, A84, A68 and A110.** So the pre-pilot path is TWO CHAINS, not one:
a build chain, and a counsel chain that no slice advances. What moves the counsel
chain is not uniform, and the record says so in three places rather than one.
`docs/ruling-e-deletion-retention.md` names a reviewing attorney for Clauses 3
and 6, which is A47 and A84. CLAUDE.md §5, the Enterprise row, records the
operating premise for E3, E6 and E8, dated 2026-07-15, as internal review with
no external counsel, which is A68. **A110 is NEW on 2026-09-03**, and its gate is
stated in the schema itself: `migrations/0009_enterprise_schema.sql:298-306`
marks the `athlete_reflection` pre-claim visibility posture counsel-gated on the
exact institutional consent language. It was THREE until the A96 ruling made that
table something the product will write to. **Nothing in this repository records
counsel as retained**, and no entry names a date by which either chain moves.
**THE QUEUE COUNT AND THE PILOT-GATE PERCENTAGE MEASURE DIFFERENT THINGS, AND
THIS LINE IS WHAT RECONCILES THEM.** `docs/pilot-gate-criteria.md` scores ROUTES
AND ENDPOINTS THAT EXIST, so the OPEN count stated above and a 99% capability
figure are not in conflict: a defect on a route the instrument scores MET moves
no unit, and the instrument has no unit at all for work that was never built.
Read the gate figure for coverage and this line for readiness.

**NO LINE NUMBERS INTO DOCS. Citations name a section and a filing title.** That
rule is load-bearing rather than stylistic, and the commit preceding this file
is why: while correcting four rotted pointers it first wrote four fresh ones
that its own insertions would have invalidated before they landed. A recomputed
number is correct once. Citations into SOURCE files keep their line numbers,
because those are checkable against a build.

**THIS FILE DOES NOT CLAIM COMPLETENESS, AND THE REASON IS SPECIFIC.** The sweep
read the tree and the git history. It read `docs/filed-defects.md` and
`docs/session-log.md` directly, and it treated the scoping documents as pointer
TARGETS rather than as sources. **That was wrong, and it was found twice.** A
first bounded check, prompted by verifying a single parked entry, showed that
one plainly legible "Open design calls still parked" list had leaked three of
its four items. A second check across the remaining scoping and rulings
documents then found two more lists, one of them the direct sibling of a section
already carried. Both rounds landed before this file committed, and both were
found by checking rather than by the original pass. **A parked or open-items
list inside a scoping document is therefore the KNOWN WEAK SPOT of a sweep built
this way**, and anyone extending this file should start there rather than with
the queue.

**A SECOND KNOWN WEAK SPOT, found 2026-09-02 and recorded plainly.** The sweep
produced two entries, A11 and F4, from CLAUDE.md's §11 rider and its §5.1
migration-count correction. Both of those passages carried `2726d40`'s
commit-time framing, which was accurate when it was written and had been
overtaken the same day: `docs/session-log.md` recorded the remote apply in its
third 2026-09-01 entry, banked about two and a half hours before this file
committed. This header states that `docs/session-log.md` and
`docs/filed-defects.md` win where they disagree with this file. That is the
rule. In practice the precedence ran the other way, because the sweep read
CLAUDE.md as the state of record and did not reconcile it against the session
log. **So a CLAUDE.md filing whose text predates a later same-day action is the
second known weak spot of a sweep built this way**, and a sweep should reconcile
CLAUDE.md against `docs/session-log.md` rather than read it as authoritative.

**A THIRD KNOWN WEAK SPOT, found 2026-09-02: THIS FILE INDEXES DEFECTS AND DEBT,
AND DEFERRED FEATURE WORK IS NEITHER.** Twelve items of unbuilt or deferred
capability were found outside it, recorded only in code comments, in CLAUDE.md
surface rows, or nowhere at all. They are now filed as A80 through A91 and A42
carries a cross-reference. **One of them, A80, is the terminal step of a shipped
arc**: the roster-import endpoint that moves an athlete off `Pending` is built
and gated and has no caller, so the transition migration 0020 exists to allow
cannot be performed. **How they were found, because the method is the
transferable part.** A grep of `src/` for `TODO`, `FIXME`, `HACK` and `XXX`
returns ZERO matches, so there are no conventional markers to sweep. What the
tree carries instead is DEFERRAL PROSE, in ordinary comments and in rendered
copy, phrases like "a later slice", "not yet supported", "coming soon" and
"arrives in a later release". Reading for that prose is what surfaced all twelve.
**An index built from defect filings cannot see any of it**, because none of it
was ever filed as a defect.

One recalled item, GivingModeler chart quality, was dropped for having no
provenance anywhere in CLAUDE.md, `docs/` or `src/`, which means anything parked
only in conversation is invisible to a sweep of this kind and does not appear
below.

---

## OPEN

Priority order. Tiers 0 through 5 are ruled. Below them the order is: gates
other work, then gates a stated commitment, then cheap and mechanical, then
large. Ties broken by age, oldest first.

### Tier 0

**A11 was CLOSED 2026-09-02** and has left this section; the remaining IDs are
not renumbered, since renumbering would break every reference to them.
**Migration 0021 was applied to remote on 2026-09-01 and verified by a live
production send**, which stamped a success row 67 seconds after the apply, so
`auth_send_log` records on production today. The apply and its verifying row sit
in `docs/session-log.md`, the third 2026-09-01 entry, and in CLAUDE.md §11, the
filed open item on the auth observability gap.

**Tier 0 now holds nothing, and the heading stays.** The ruled tier numbering
does not move, so Tier 1 remains Tier 1 and every reference to a tier by number
still resolves.

### Tier 1

**A39 | The P-2 L4 window closes on the first snapshot write, and nothing guards
it.**
Blocker: none. It is a deadline, not a dependency.
Pilot: DEBT
Detail: `docs/session-log.md`, the 2026-08-28 and 2026-08-30 entry, under
rulings that reversed a prior ruling.
**CORRECTED 2026-09-02. This entry contradicted itself and its own source.** The
sentence here said that setting `$.enterprise.demo_gate` is what closes the
window permanently. That is FALSE, and the entry's own TITLE has the right of it.
**The window closes on the first snapshot WRITE.** The only INSERT into
`cohort_period_snapshot` is `functions/api/snapshots.js:212`, reachable only
through `POST /api/snapshots`, whose only invoker is a person clicking the button
at `src/surfaces/enterprise/reports/CohortComparison.jsx:145`. The gate returns
`{ person }` and writes nothing; there is no cron, no scheduled handler and no
`[triggers]` block. Setting the gate makes the write POSSIBLE. It does not
perform it.
The cited source was right all along: `docs/session-log.md`, that entry, reads
"That window closes the first time a snapshot is written."
**The coupling clause is REMOVED, not corrected.** It claimed A39 must be settled
before FJ-3 or the window closes as a side effect. Neither ruling FJ-3 nor
setting the gate writes a row, so no side effect exists.
L4's mid-series-trend concern is mooted only while `cohort_period_snapshot` holds
zero rows. **The zero-row state was OBSERVED on 2026-09-01**, by an FT-run
read-only COUNT against remote `stewardhouse-pilot`, so the window is confirmed
open rather than assumed. This is the answer to the former F5.
**RULED 2026-09-02: GUARD THE WINDOW, DEFER THE METHODOLOGY.** The guard is A93.
The L4 question itself is DEFERRED until snapshots exist to evaluate: a series
with zero rows cannot be judged on the merits.

**A80 | `PUT /api/athletes/:id/invite` has no caller, so no path moves an
imported athlete off `Pending`.**
Blocker: none named.
Pilot: BLOCKING
Detail: `functions/api/athletes/[id]/invite.js:1-11`, which names the act;
CLAUDE.md §5.2, the F-C ruling.
Placed in Tier 1 by FT ruling 2026-09-02 rather than in a blocker group. It is
the terminal step of the shipped roster-import arc, the enterprise value
proposition depends on it, and its blocker line is "none named". Scope is NOT
ruled here. Migration 0020 added `'Pending'` to the enum for this transition and
`src/surfaces/enterprise/shared/athleteStatus.js:7` renders those athletes "Not
yet invited"; the endpoint is built and gated, and `src/` calls it nowhere.

**A93 | Nothing guards the first snapshot write, which is what closes A39's
window.**
Blocker: none named.
Pilot: DEBT
Detail: A39, this tier, which is the deadline this guards; CLAUDE.md §5.1, the
FORK 1 denominator change.
**RULED 2026-09-02: a server-side guard on `POST /api/snapshots` that refuses the
FIRST write until the denominator change is acknowledged.** Server-side because
the client is not the only caller and a UI-only guard is not a guard. A39's
blocker line reads "none. It is a deadline, not a dependency", and a deadline
with no guard is exactly what its title means by "nothing guards it".
Placed in Tier 1 beside A39 because it is A39's remedy and separating a deadline
from its guard across priority bands would hide the pairing. Scope, message and
acknowledgment mechanism are NOT ruled here.

### Tier 2 — live honesty defects on routes the pilot gate scores as MET

**A17 | `POST /api/snapshots` returns 500 for a write that committed.**
Blocker: none named.
Pilot: BLOCKING
Detail: `docs/filed-defects.md`, "Filed: `POST /api/snapshots` re-SELECTs
outside its try".

**A18 was CLOSED 2026-09-04** and has left this section; the remaining IDs are
not renumbered, since renumbering would break every reference to them. Its title
was "Three unguarded branches render the literal `null%` on the enterprise
overview and roster", and it had absorbed A19 on 2026-09-03.
**WHAT CLOSED IT: the guard moved off `consentAware` and onto `rateBaseTotal`,
and the absence string now comes from the shared `fmtRate`.**
`EnterpriseOverview.jsx` and `EnterpriseRoster.jsx` both import `fmtRate` from
`shared/RateDisclosure.jsx`, derive `const rateTracked = rateBaseTotal > 0` once,
and test it before `consentAware`, so the absence arm is now reached in every
state that produces a null. `reports/ProgramOutputs.jsx:139-141` is where that
derivation and the one-convention-for-absence framing already live; the arm
ORDER is this slice's, not that page's. The inline restatements of the guard are
gone: `activelyProgressingPct == null` at both sublabels, and the nested
`rateBaseTotal === 0` at the GPS line.
**One change of shape fixed all three sites**, including the GPS supplementary
line, which rendered a stranded percent rather than the word and so could not be
found by grepping for the string.
**A20 is UNAFFECTED and still OPEN**, per its own entry below: it shares no file
with this fix and involves no null.

**A19 was CLOSED 2026-09-03 as a DUPLICATE of A18** and has left this section;
the remaining IDs are not renumbered, since renumbering would break every
reference to them. Its title was "An empty authenticated roster renders `null%`
from the guarded branch."
**IT IS A STRICT SUBSET, not an overlap.** A19's two sites,
`src/surfaces/enterprise/EnterpriseRoster.jsx:141` and
`src/surfaces/enterprise/EnterpriseOverview.jsx:41`, are two of A18's three; A18
additionally covers `EnterpriseOverview.jsx:140`. Both entries name the same
else-arm of the same `consentAware` ternary, at `EnterpriseOverview.jsx:39` and
`EnterpriseRoster.jsx:139`, and both have the same trigger: an authenticated
roster with zero athletes.
**A19's ENTRY LINE ASSERTED "Distinct from A18: different branch, different
trigger". THE 2026-09-03 SCOPING PASS COULD NOT REPRODUCE THAT DISTINCTION AT
HEAD**, and the claim is recorded here rather than deleted, because a later
reader meeting A19 in the git history should find why it stopped being separate.
Both filings describe the same sites, the same branch and the same one input
state.
**ITS DIAGNOSIS SURVIVES and is now the load-bearing half of A18**, per the
carry-over paragraph above: the guard is correct and on the wrong side of the
branch. Nothing is lost by the merge except a second entry for one defect.

**A20 | The Workshops-held tile reads "0 of 0" for an institution with no
workshops. COPY RULED 2026-09-03; the build is not done.**
Blocker: none named. It is the first screen a new institution sees.
Pilot: BLOCKING
Detail: `src/surfaces/enterprise/reports/ProgramOutputs.jsx:239-244`, the tile.
The expression is `:242`,
`` value={`${workshopsHeld} of ${workshopsHeld + workshopsScheduled}`} ``, over
`workshopsHeld` at `:95` and `workshopsScheduled` at `:96`, each a filter on
`workshops` by `status`. With no workshop rows both are 0 and the tile renders
"0 of 0" with the sublabel "0 remaining this term". The tile is UNGATED: `:239`
sits outside the `isAuthenticated` ternary that closes at `:238`.
**RULED 2026-09-03 by FT: the tile renders "None yet".**
**None of the three candidates on the filing was ruled.**
`docs/filed-defects.md:1405` named "None scheduled", "Not tracked", and leaving
the honest "0 of 0" as it is. FT ruled a fourth string.
**The reasoning, recorded because it is what distinguishes the four.** "0 of 0"
reads as a MEASUREMENT OF NOTHING on the first screen a new institution sees.
"None scheduled" asserts a fact about the FUTURE that the data does not carry:
`workshopsScheduled` counts rows with a non-`completed` status, and zero such
rows means none exist, not that none is planned.
**"Not tracked" is ruled out by a distinction this entry must not lose.** That
string belongs to R4 and to a CONSENT POPULATION, where the measurement does not
exist. A workshop count is a COUNT OF ROWS, and zero is a real and correct answer
to "how many workshops". `docs/filed-defects.md:1381-1389` records this at
length, including that the resemblance between the two output strings is not a
reason to treat them alike. **A20 is therefore NOT part of the A18 fix**, shares
no file with it, and involves no null at all.
**The copy is ruled; the build is not done**, which is why this stays OPEN and
BLOCKING. Where the string is applied, whether the sublabel changes with it, and
whether any sibling tile takes the same treatment are NOT ruled here.

### Tier 3

**A9 | The D1 org seed carries authored officers, budgets and funders for
identifiable real organizations, at rest on remote.**
Blocker: none. **RULED 2026-09-02 (FJ-2): LEAVE AS IS, narrow and general
both.** No cleanup slice, and no general ruling on what may sit at rest in
remote D1.
Pilot: POST
Detail: `docs/propublica-spike-findings.md`, FT ruling 8, "D1 org seed defanged
fields". The 2026-08-14 defang covered the fixture side only. Nothing reads the
`org` table today, so the data is dormant rather than rendered.
**KEPT OPEN RATHER THAN PARKED, and the reason is the file's own convention.**
PARKED's preamble requires each item to carry a named blocker, and after the
ruling this one carries none. So it stays here as the record that the rows exist
at rest, with nothing scheduled against it. It remains in Tier 3 because tier
placement is FT-ruled and this slice did not rule a move.

### Tier 4

**A1 | The BMF import rollback path is untested and gates the production load.**
Blocker: a failure has never been exercised; the success path is proven atomic.
Pilot: POST
Detail: `docs/bmf-load-scoping.md`, open item 1; `docs/filed-defects.md`,
"Filed: the BMF rollback path is a stated precondition on a production BMF
load".

### Tier 5

**A59 | Nav buttons sit at roughly 31px against the LOCKED 44px standard, and
this was never filed anywhere until this sweep.**
Blocker: none named.
Pilot: DEBT
Detail: CLAUDE.md §7, "Tap targets and control sizing (LOCKED 2026-08-14)",
which names "the deferred nav slice" in a subordinate clause and nowhere else.
It appears in no defect queue and in no parked set.

### Gates other work

**A47 | Ruling E Clause 3, the charitable-retention floor, is unanswered.**
Blocker: COUNSEL. Gates A12, A14 and every retention decision.
Pilot: BLOCKING, and counsel-gated: building cannot close it, but the
record states this policy is required before pilot.
Detail: `docs/ruling-e-deletion-retention.md`, Clause 3.

**A46 | Ruling E Clause 6, the subpoena posture, is unanswered.**
Blocker: COUNSEL. Gates the who-gave-to-whom view and P-C.
Pilot: POST
Detail: `docs/ruling-e-deletion-retention.md`, Clause 6.

**A42 | Advisor stage-label renaming is blocked on the Q7 allowlist.**
Blocker: Q7, itself COUNSEL-gated.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: advisor stage-label renaming, blocked
on the Q7 allowlist"; `docs/advisor-persistence-schema-draft.md`, the Q4/Q7
gate.
Cross-reference added 2026-09-02: CLAUDE.md §5, the Advisor row, calls this the
"Stage Rename sibling slice", which is why a name search for that phrase finds
nothing here. Same item, two names, no second entry.

**A56 | P-6 slice 2, the shared 'Not authorized' string across three gate
conditions.**
Blocker: advisor and enterprise gate emissions in `/api/me`, which do not exist.
The blocker moved rather than cleared when slice 1 shipped.
Pilot: DEBT
Detail: CLAUDE.md §5.1, the P-6 sub-item on the shared string.

**A94 | No alerting on `auth_send_log`. A failure is discoverable only by a
deliberate query someone thinks to run.**
Blocker: SCHEDULED EXECUTION, which this project has never had.
Pilot: POST
Detail: CLAUDE.md §11, the auth-observability filing;
`migrations/0021_auth_send_log.sql`, its retention docblock, on the absence of
cron, scheduled worker and `[triggers]`.
**SPLIT OUT OF A13 on 2026-09-02.** A13 carried both halves of its own title
under one blocker, and SCHEDULED EXECUTION is true of THIS half only. A13 is now
the read surface and sits in cheap and mechanical.

**A92 | Migration 0021 forbids emitting `email` to any client, so a read
endpoint must omit the column or the rule must be amended.**
Blocker: FT. It is a privacy-posture ruling, not infrastructure.
Pilot: POST
Detail: `migrations/0021_auth_send_log.sql`, its E8 discipline note and the
`email` column comment.
Surfaced 2026-09-02 by the FJ-1 ruling. Gates A13, and nothing else. The two
answers are not equivalent: omitting the column leaves an operator unable to
tell which address a failure belongs to.

**A12 | `auth_send_log` retention is unbounded, on the one table Tier 0 is about
to make live.**
Blocker: A47 for the window itself, and the absent scheduled execution for any
purge that would enforce it. Setting a window unilaterally would invent the
standard Clause 3 defers.
Pilot: POST
Detail: `migrations/0021_auth_send_log.sql`, its retention docblock.

**A14 | No purge path exists on any of the five append-only tables.**
Blocker: the same absent scheduled execution, plus A47. Broader than A12 and NOT
closed by it: `compliance_audit` is an append-only institutional record with its
own obligations, and three others are athlete-scoped. Closing the narrow one
must not read as closing this.
Pilot: POST
Detail: `migrations/0021_auth_send_log.sql`, its retention docblock, which names
the four tables it joins.

**A66 | The pilot gate has not been re-scored in 86 commits.**
Blocker: none named. A re-score additionally needs an FT-run remote gate read
before any production-usable figure may be reported.
Pilot: DEBT
Detail: `docs/pilot-gate-criteria.md`, the re-score log. Several Tier 2 defects
above sit on routes that log scores MET.

**A73 | Bare intra-document line references cannot be found by a citation
scan.**
Blocker: it needs a reading pass, not a grep. The bare form is invisible to a
filename-and-line pattern, and it is also how this project cites a line in a
source file already named in the sentence, so the two cannot be separated by
pattern alone.
Pilot: DEBT
Detail: the commit message of the preceding correction slice. One instance was
found and converted; the scope is unknown.

**A15 | Whether production D1 enforces foreign keys is unverified.**
Blocker: it needs a remote write, which is FT-only. Local enforcement IS
verified. Gates A16, which is explicitly downstream of it.
Pilot: POST (undetermined, needs FT)
Detail: CLAUDE.md §10, the filed block on foreign-key enforcement.

**A74 | Two audit docs are cited from CLAUDE.md and cannot be opened from
`main`.**
Blocker: a disposition. Committing them to `main` argues against §6.9's
anti-merge posture; amending each pointer to name its branch is the alternative.
Neither is proposed.
Pilot: DEBT
Detail: CLAUDE.md §8, its opening note on the two branch-only pointers.

**A110 | The `athlete_reflection` pre-claim visibility posture is counsel-gated
and unanswered.**
Blocker: COUNSEL.
Pilot: BLOCKING, and counsel-gated: building cannot close it.
Detail: `migrations/0009_enterprise_schema.sql:298-306`, which states the gap in
its own words. Before an athlete claims an individual account there is no
signed-in athlete session, so the per-reflection visibility toggle "is not
directly athlete-controllable". The interim posture is program-level consent
captured at seed or roster-add time, and the docblock marks the exact
institutional consent language as counsel-gated.
**The column defaults to VISIBLE.** `:316`,
`visible_to_institution INTEGER NOT NULL DEFAULT 1`, so an unclaimed athlete's
reflection is institution-visible by default and by schema.
**Nothing reads or writes the column today**, so the gap is latent rather than
live: a grep for `visible_to_institution` across `functions/` and `src/` returns
nothing, and the table's only code path is a `deleteFrom` at
`functions/api/athletes/[id].js:121`.
**It becomes live the moment A96's build ships**, because A96 ruling 1 gives the
athlete authorship of reflections and ruling 3 makes sharing their affirmative
choice, which is precisely what this docblock says cannot be honoured before
claim.
Filed 2026-09-03 from the A96 inventory pass. **This is the FOURTH counsel-gated
BLOCKING item**, joining A47, A84 and A68.

**A84 | A retention and deletion policy is stated as required BEFORE pilot, and
no entry cited it as a pilot blocker until this one.**
Blocker: A47, COUNSEL. The requirement names soft versus hard delete and what
account deletion does to gift rows; neither is settled.
Pilot: BLOCKING, and counsel-gated: building cannot close it, but the
record states this policy is required before pilot.
Detail: `docs/persistence-scoping-pass.md`, Strand 3, Layer 4, governance.
Coupled to A12 and A14, which are the unbounded-retention items, and to P-B,
which parks the soft-delete build. This is the only pre-pilot requirement found
outside CLAUDE.md §5.1 and `docs/pilot-gate-criteria.md`, and neither of those
carries it.

**A96 | A self-managed athlete has no way to record anything about their own
practice. RULED 2026-09-03; the build is not done.**
Blocker: none. The advisory-team deliberation this entry carried is CLOSED.
Pilot: BLOCKING
Detail: `functions/api/athletes/[id].js:274-276`, the claim-state gate.
**The title CHANGED and the old one is quoted here rather than deleted:** "A
self-managed athlete's record is frozen permanently: no path records progression
for `management_mode = 'self'`." That framing asked whether the INSTITUTION could
track a self-managed athlete. The ruling reframes it: the athlete records for
themselves, and institutional access is a separate question answered by ruling 3.

**RULED 2026-09-03 by FT. Six rulings.**
1. **Authorship determines ownership.** An athlete may author, save, delete and
   share their own records.
2. **A self-managed athlete may log for themselves whatever an advisor would log
   about a client:** lesson completions, notes, reflections, organization
   research, lesson takeaways. **EXCLUDING personal financial information.**
   `gift` remains the separate, already-working financial record.
3. **Sharing is the athlete's affirmative choice, per relationship**, whether to
   staff, to an advisor, or to an appointed manager. Never automatic.
4. **Joining a cohort makes membership visible within that cohort and to staff
   and advisors, disclosed at join.** What is shared INTO a cohort is opt-in item
   by item.
5. **Cohort is a general grouping primitive**, for learning, giving focus or
   program track. It is not giving-specific. An athlete may leave a cohort or
   switch to another.
6. **Pilot scope.**

**BUILD SHAPE, FT-recorded 2026-09-03: phone-first and deliberately minimal.**
Recorded here because the ruling names WHAT may be recorded and this names the
SHAPE it takes. Scope beyond this is not ruled.
- **ONE athlete-authored record type**: text, date, optional attachment
  (`none` | `lesson` | `org`). That one shape covers reflections, notes, lesson
  takeaways and thoughts on an organization.
- **Binary acts are the SAME record with empty text.** Lesson completed, org
  saved: the tap creates the row, and text is optional on top. **Not a separate
  mechanism**, which is the part most likely to be re-invented as one.
- **A saved-org relation is the one genuinely NEW structure.** A list of orgs
  under consideration must be LISTABLE; a note that merely mentions an org is
  not. Nothing at HEAD can express this (see the org finding below).
- **Connections is a DERIVED VIEW and stores nothing**: cohort members, orgs
  given to, orgs saved. Contact is a link out to public contact information.
  **NO in-platform messaging**, ruled out as a moderation, retention and safety
  surface given a young-user population.
- **Sharing generalizes `athlete_reflection`'s inert `visible_to_institution`
  bit** to per-relationship, per-item.
- **Speech-to-text is DEFERRED.** Text only, no stored audio.
- **NO amount field, no capacity prompt, no financial framing anywhere in the
  journal UI.** Free text cannot be constrained; the UI must not INVITE financial
  entry.

**THREE PRIOR DETERMINATIONS ARE AMENDED. Stated as amendments rather than
silently absorbed, because each governs code that ships today.**

**D5 (2026-07-16) is CORRECTED, not reversed.** It was recorded as "self-managed:
staff write NOTHING, 0015:9, no carve-out". Line 9 of
`migrations/0015_athlete_management_mode.sql` reads:
`--   'self'      — athlete-managed. Staff have READ-ONLY access; no staff writes.`
That line forbids STAFF writes and GRANTS staff READ access, which presupposes
content to read. **It never addressed athlete writes at all.** The "no carve-out"
reading was over-read from a line that was silent on the question.

**D6 is AMENDED by ruling 4.** The attendance gate requires
`management_mode = 'delegated'` EXACTLY
(`functions/api/workshops/[id]/attendance.js:174`). Under ruling 4,
**membership, not mode, governs what is recordable in a shared space.**

**FORK 1 MOVES WITH D6**, because its writable denominator was DEFINED as the D6
gate set: `src/surfaces/enterprise/shared/enterpriseStats.js:37`,
`const isWritable = (a) => a.claimed === true && a.managementMode === 'delegated';`
A change to what is recordable changes what that denominator counts.

**WHAT EXISTS AT HEAD, verified 2026-09-03 rather than assumed.**

`athlete_reflection` EXISTS and is WHOLLY INERT.
`migrations/0009_enterprise_schema.sql:311-318`, carrying
`visible_to_institution INTEGER NOT NULL DEFAULT 1` at `:316`. Its docblock
(`:277-309`) describes athlete-authored content with an athlete-controlled
per-reflection toggle. **The only code path that touches the table is a
`deleteFrom` at `functions/api/athletes/[id].js:121`.** No INSERT, no SELECT, no
UPDATE anywhere in `functions/`. Its pre-claim posture is marked COUNSEL-GATED at
`:298-306` and is now filed as A110.

`athlete_note` SEPARATES SUBJECT FROM AUTHOR, and is the only place in the schema
that does. `migrations/0009_enterprise_schema.sql:268-274`: `athlete_id` at
`:270` is the subject; `author_person_id TEXT NOT NULL REFERENCES person(id)` at
`:271` is the writer, commented "staff person who wrote the note". No write path
exists; the `deleteFrom` at `functions/api/athletes/[id].js:120` is the only
statement. **Under ruling 1 an athlete is a legal value for that column**, and the
comment's staff assumption no longer holds.

**Staff already see athlete reflections, rendered from a FIXTURE rather than from
D1.** `src/components/AthleteProfile.jsx:208-219` renders
`src/data/enterpriseFixtures.js:748`. No athlete authored them, and none can.

`scenario` IS THE WORKING PRECEDENT for owner-scoped author, save and delete.
`migrations/0001_initial.sql:185-192`: `owner_person_id` NOT NULL; the INSERT
sets it (`functions/api/scenarios.js:118`); SELECT and DELETE both scope on it
(`functions/api/scenarios.js:147`, `functions/api/scenarios/[id].js:53-54`).
**It carries no sharing concept**, which is exactly what rulings 3 and 4 add.

**Lesson completion has exactly ONE representation, and it records no lesson.**
`athlete.lessons_count` (`migrations/0009_enterprise_schema.sql:197`), a bare
integer 0 to 9, validated at `functions/api/athletes/[id].js:202-205`. No lesson
identity, no date, no per-lesson row. **WHICH lessons were completed is recorded
nowhere.** `athlete_activity` names `'lesson_completed'`
(`migrations/0009_enterprise_schema.sql:236`) and has no INSERT path anywhere.

**Organization research does not exist in ANY form.** No table, column or fixture
records interest in a nonprofit. **The only person-to-org link in the schema is a
completed gift**, `migrations/0001_initial.sql:157`. This is what makes the
saved-org relation the one genuinely new structure in the build shape above.

**No sharing, visibility, permission, grant or audience concept exists anywhere**
beyond the one inert bit above.

**Advisor content types**, in `migrations/0007_advisor_schema.sql`: `client`,
`client_session`, `client_note`, `practice_lesson`, `doc_category`, `doc`,
`cohort`, `cohort_member`. **Only the free-text `giving_plan` (`:88`) can carry
financial content; no typed financial column exists in the advisor schema.**

**CONSTRAINTS, recorded so they are not rediscovered.**
- **E9/Q9 applies to athlete-authored content as it does everywhere:** no rank,
  score, priority, ordering, progression, rating, grade or status column. 48
  guardrail lines across 8 migrations.
- **`client_note` is insert-only**, with no PUT and no DELETE endpoint. Ruling 1
  grants a delete right, so athlete-authored records **DIVERGE from the advisor
  mirror here deliberately**, and the divergence is a decision rather than an
  oversight.

**STILL OPEN, FOUNDER-JUDGMENT, UNRULED.** Recorded on this entry rather than
opened as FJ items, because each is a question about this build and none is
answerable without it.
- Can an athlete un-share something already shared, and what does revocation mean
  once it has been seen?
- What happens to items shared into a cohort when the athlete leaves it?
- Who may create a cohort, and does the institution have any say?
- Are pooled funds categorically out under Path B, or a counsel-chain question?
- Does an athlete-logged lesson completion count the same as a staff-logged one
  in enterprise rates? **LIVE rather than theoretical under the recorded build
  shape**, since `lessons_count` would gain a second source.

**THE PRIOR VERIFICATION STANDS and is kept, because it is what the ruling was
made against.** Four sites write a milestone column and none is reachable for
`'self'`: `functions/api/athletes/[id].js:281-288`, the milestone `set`, gated at
`:274` on `'delegated'` EXACTLY plus a non-null `person_id`;
`functions/api/athletes/[id].js:130-139`, the anonymize zeroing, which is
destruction; `functions/api/athletes.js:205-210`, enrollment, which writes zeros
at creation; and `functions/api/snapshots.js:157-158`, which reads rather than
writes. There is no athlete-facing progression endpoint:
`functions/api/athlete-consent.js` exports `onRequestPost` only and writes
`management_mode` alone.
Coupled to A95, whose ruling drew the line between institution-owned and
athlete-owned records. Ruling 1 sits consistently with it: authorship decides.

**A101 | The invite email copy is FT-ruled for one path and already reused on
another without a ruling.**
Blocker: an FT ruling on whether the copy extends to imported athletes.
Pilot: DEBT
Detail: `functions/_lib/inviteEmail.js:1-10`, which scopes itself to
`POST /api/invites` and marks its strings FT-ruled copy, `do not reword without
a ruling`; `functions/api/athletes.js:311` already calls `buildInviteEmail` on
the roster-add path. The copy names no institution, no program and no inviter,
and its only concession to an unexpected arrival is the closing line, `If you
weren't expecting this invitation, you can disregard this message.`

### Gates a stated commitment

**A44 | Every advisor write returns 403 in production.**
Blocker: a scoping pass on which person rows may be designated, and against
which institutions. See FJ-3.
Pilot: BLOCKING
Detail: CLAUDE.md §5.1, production gate state.
Blocker CHANGED 2026-09-02 from "FT's `$.advisor.demo_gate` designation": FJ-3
ruled the unset gates a GAP rather than an intended posture, so the designation
is no longer the blocker. The scoping pass is.

**A69 | Every enterprise write returns 403 in production.**
Blocker: a scoping pass on which person rows may be designated, and against
which institutions. See FJ-3.
Pilot: BLOCKING
Detail: CLAUDE.md §5.1, production gate state.
Blocker CHANGED 2026-09-02 on the same ruling as A44. The A39 coupling note is
REMOVED: setting this gate cannot close A39's window, because it writes no row.
**A68 MAY GATE THIS ITEM, cross-referenced 2026-09-02.** The coupling is stated
in CLAUDE.md §5, the Enterprise row ("until E3/E6/E8 counsel clears", and the
write arc "gated dark on production pending E3/E6/E8 counsel"), in
`functions/_lib/gate.js:123-125` ("while the E3 ... / E6 ... / E8 ... counsel
seams remain open"), and in `docs/enterprise-persistence-scoping.md:524-526`. If
it holds, the scoping pass named as this item's blocker cannot conclude in
setting the gate until A68 clears.

**A45 | The pilot has no in-product feedback channel.**
Blocker: a deliberate design problem rather than a restore. It needs explicit
consent, a first-party destination and an honest success state.
Pilot: DEBT
Detail: CLAUDE.md §5, the Individual row.

**A54 | Marcus Thompson's person row is unclaimable by any path.**
Blocker: a ruling rather than a patch. See FJ-5.
Pilot: POST
Detail: `docs/filed-defects.md`, "Filed: the Marcus Thompson person row is
structurally unclaimable".

**A81 | The compliance surface renders a card promising NIL disclosure tracking
in a future slice.**
Blocker: an integration with the school's compliance system, which is external
and unscoped.
Pilot: DEBT
Detail: `src/surfaces/enterprise/EnterpriseCompliance.jsx:96-101`, the card and
its own placeholder comment. Tree-invariant: it renders on both trees.

**A82 | The Operations Accounts view tells the operator per-account detail
arrives in a later release.**
Blocker: none named.
Pilot: DEBT
Detail: `src/surfaces/operations/OperationsRoster.jsx:288-295`. Rows are
deliberately non-interactive rather than dead-clicking, per the aggregate-default
guardrail, so the promise is the affordance.

**A83 | The Operations Overview says per-issue and per-activity detail views are
coming soon.**
Blocker: none named. A55 is a different target, a CR-level filtered view.
Pilot: DEBT
Detail: `src/surfaces/operations/OperationsSurface.jsx:356` and `:378`, two
footnotes under the Open issues and Recent activity cards.

### BMF and Discover — open questions

These feed the Discover surface and none of them gates it. The item that
actually gates the load is A1, in Tier 4.

**A2 | Whether `REVENUE_AMT` serves any v1 query.**
Blocker: none named.
Pilot: POST
Detail: `docs/bmf-load-scoping.md`, open item 2.

**A3 | Whether absence from the BMF is the entire revocation and deductibility
signal.**
Blocker: two IRS information-sheet PDFs defeated the spike's tooling.
Pilot: POST
Detail: `docs/bmf-load-scoping.md`, open item 3.

**A4 | Whether retained Time Travel history counts toward the 10 GB ceiling.**
Blocker: unknown to this project; a vendor answer would settle it.
Pilot: POST
Detail: `docs/bmf-load-scoping.md`, open item 4.

**A5 | Whether an import FAIL is per-database or per-table.**
Blocker: the closing experiment was ruled not run.
Pilot: POST
Detail: `docs/bmf-load-scoping.md`, open item 5.

**A6 | The Discover NTEE facet is deferred.**
Blocker: the verbatim label source is unidentified.
Pilot: POST
Detail: `docs/discover-surface-spec.md`, "4. NTEE: DEFERRED".

**A7 | Whether a staleness threshold should revert Discover to unavailable.**
Blocker: unruled.
Pilot: POST
Detail: `docs/discover-surface-spec.md`, its closing UNRULED note.

**A8 | The four Discover facets are unbuilt; the page renders an explicit
unavailable state.**
Blocker: the BMF ingest, which is A1 and A9.
Pilot: DEBT
Detail: `docs/discover-surface-spec.md`; `docs/bmf-load-scoping.md`.

**A10 | One BMF batch zip is malformed and exits non-zero while extracting
correctly.**
Blocker: no loader exists yet to guard. A load treating a non-zero exit as
failure would discard a complete batch.
Pilot: POST
Detail: `docs/propublica-spike-findings.md`, its note on the malformed batch.

### Cheap and mechanical

**A75 | `docs/bmf-load-scoping.md` cites its own two-preconditions passage one
line short of where it starts.**
Blocker: none. A self-citation inside a single file.
Pilot: DEBT
Detail: that document, section 13, "The availability ruling".

**A76 | CLAUDE.md's manifest-drift note carries a `me.js` citation that never
resolved.**
Blocker: none, but it needs a decision rather than a renumber. This is a
DISTINCT CLASS from a rotted pointer: it was authored wrong, and it was already
wrong at the docs-only commit that wrote it, which implies docs commits have
been written without resolving their own anchors.
Pilot: DEBT
Detail: CLAUDE.md §5.1, the manifest-drift note.

**A77 | `intake-gifts-join-unified` is recorded parked in one document and
RESOLVED in another.**
Blocker: none for the correction itself, but it needs a reading of both passages
before either is edited, and that is a separate slice.
This is a DOC DIVERGENCE of the class commit `d08b20e` corrected, not a code
defect. `docs/individual-rework-scoping.md` carries it on its "Open design calls
still parked" list. `docs/persistence-scoping-pass.md`, section 5, "Folded-item
resolutions (the gated items, resolved by the pass)", records it as
"**`intake-gifts-join`:** YES (5.8 ruling) — GiveScreen writes feed the live
store." The persistence pass is the later document, so the rework doc is the one
that reads stale; which to edit is NOT decided here.
Pilot: DEBT
Detail: both documents, at the two anchors quoted above.

**A79 | The ProPublica spike's freshness questions are open, and how many is
UNDETERMINED.**
Blocker: a reading pass. A grep cannot settle it, and the determination was
deliberately not made rather than guessed.
`docs/propublica-spike-findings.md`, section 12, "Freshness and staleness: open
questions only", lists seven, among them that the EO BMF cadence is UNVERIFIED
and what a page means when its three source legs carry different as-of dates.
`62cb061` later recorded a ProPublica freshness answer, and WHICH of the seven
that closes was not established. Carrying seven would assert a count this sweep
did not verify, which is the failure this file exists to end; carrying none
would drop a live list. So it is carried as one item whose own scope is unknown,
the same shape as A73.
Pilot: POST
Detail: that document's section 12, and `62cb061`.

**A33 | Three comments are stale, in three different ways.**
Blocker: none named.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: three comments are stale".

**A50a | The budget literal in `individualProfile` does not match the modeler's
lookup keys, so the canonical demo user falls through to a default.**
Blocker: none named. Carried debt since the 5.8 pass.
Pilot: DEBT
Detail: `docs/5.8-giving-flow-scoping.md`, section 4, carried debt.

**A50b | Date formats are not unified and `parseGiftDate`'s English-month regex
survives.**
Blocker: none named. Fixture layer only.
Pilot: DEBT
Detail: `docs/5.8-giving-flow-scoping.md`, section 4, carried debt.

**A97 was CLOSED 2026-09-03 by `2d984ea`** and has left this section; the
remaining IDs are not renumbered, since renumbering would break every reference
to them. Both consent-interstitial buttons now carry `variant="primary"`
(`src/surfaces/individual/IndividualSurface.jsx:153` and `:156`), so neither
option is weighted above the other and the defect the entry's title named is not
in the tree. **The note sits HERE rather than at the top of the section**, which
is where the Tier 0 and F5 closure notes sit, so that the A104 pairing the sixth
2026-09-02 session deliberately made adjacent stays adjacent.
**FT FIRST RULED BOTH SECONDARY, AND A CONTRAST FINDING REVERSED IT TO BOTH
PRIMARY.** The 2026-09-02 ruling recorded on the closed entry was
`variant="secondary"` on both. Verification before the build reported that two
secondary buttons would both be `--sh-card` on a `--sh-card` interstitial card,
bounded only by `--sh-border-thin` at 1.290:1, below WCAG 1.4.11's 3:1 for
identifying a control as a control. FT reversed to both-primary on that finding:
equal weight was the ruling and secondary was the assumption about how to express
it, and primary expresses it while keeping the affordance at 4.486:1. **What was
ruled did not change; how it is expressed did.**
**The reversal produced two filings rather than none.** The contrast condition is
not confined to this card and is A105 below; the shortfall on the primary token
that the same measurement exposed is FJ-7, because `--sh-bronze` is a locked §7
token and no build slice may move it.
**A104 IS UNAFFECTED AND STILL OPEN, immediately below.** The swap stopped the
surface recommending the dead end; A104 is what would tell the athlete what the
dead end is, and it remains blocked on A96 where this was not.

**A104 | The consent interstitial states no consequence for either option.**
Blocker: none. **UNBLOCKED 2026-09-03 by the A96 ruling.**
Pilot: BLOCKING
Detail: `src/surfaces/individual/IndividualSurface.jsx:112-166`. The card asks
the athlete to choose and tells them what NEITHER option does. Its complete
rendered copy is six strings: `Your account, your choice` (`:144`); the body at
`:146-149`, `You're enrolled in {institutionName}'s program. You can manage your
StewardHouse account yourself, or have your program staff help manage it for
you. Either way, this account and everything in it belongs to you, and you can
change this anytime.`; the two labels `I'll manage it myself` (`:154`) and `Let
program staff manage it` (`:157`); `Decide later` (`:161`); and the error
fallback `Something went wrong. Please try again.` (`:128`, `:136`). None names
an effect.
**THE ASYMMETRY, and it is narrower than it first reads.** A first pass had it as
"the staff side states what delegation ENABLES while the athlete side never
states what `self` DISABLES". **Grep corrects the second half.** Two
athlete-facing strings DO state the disablement, both in `RecordKeeping.jsx` and
neither on the interstitial: `:102`, `Staff at {institutionName} can see your
progress, but cannot add to it.`, and `:116`, `While you manage your own record,
staff will not be able to record anything new.` **What no athlete-facing string
says is that NOBODY can record**, which is the A96 finding. The staff side is
consistent and explicit: `src/components/AthleteProfile.jsx:171-172`,
`{accessLabel(athlete)} — staff can record progress only once record-keeping is
delegated.`; `src/components/WorkshopDetail.jsx:152`, `No one on this roster has
delegated record-keeping, so attendance cannot be recorded here.`; and
`src/surfaces/enterprise/reports/PhilanthropicReadiness.jsx:132`, which comes
closest in the whole tree to naming the freeze, `Athletes who manage their own
records keep any milestones recorded earlier, but their stage will not advance
here.` **The interstitial is the surface that says nothing at all.**
**WHY THIS IS BLOCKED ON A96 WHERE A97 WAS NOT, which is the load-bearing part
and is why A97 could close on 2026-09-03 while this stayed open.**
Every string currently on the interstitial is OUTCOME-INDEPENDENT of A96, which
is why the button swap can proceed without it. **Adding a consequence line is the
point at which outcome-dependence enters.** A line naming what `self` does would
have to be true under all three A96 outcomes: no institutional tracking;
institution-observable facts only; an athlete-facing progression path. Whether
such a line can be written honestly is NOT established.
**`RecordKeeping.jsx` already carries four outcome-dependent strings**, so this
entry and those are one problem rather than two: `:102` `You manage your own
record.` and, in the same paragraph, `Staff at {institutionName} can see your
progress, but cannot add to it.`; `:116` `While you manage your own record, staff
will not be able to record anything new.`; and `:97` `They can record your
progress through the program, workshops you attend, lessons you complete, and
your certification.`, whose enumeration stops distinguishing the two modes under
the institution-observable outcome.
**UNBLOCKED 2026-09-03, and the unblocking carries a condition.** A96 is RULED,
so the three outcomes a consequence line had to be true under are now one. **But
the copy depends on whether the athlete write path SHIPS BEFORE PILOT.** If it
does not, the interstitial must describe TODAY's behaviour, in which a
self-managed athlete can record nothing, and NOT the ruled behaviour. Writing the
ruled behaviour into copy the build has not reached would be the exact §7 defect
this queue exists to catch. Which of the two ships first is not settled here.
Paired with A97, the variant swap, which was not blocked and CLOSED 2026-09-03
by `2d984ea`, and its closure note sits directly above this entry. The pairing is
unchanged by that: the swap stopped the surface recommending the dead end, and
this entry is what would tell the athlete what the dead end is. **A97 closing
does not advance this one by a step.**

**A105 | Secondary buttons are invisible as controls on untinted cards.**
Blocker: none.
Pilot: DEBT (PROPOSED 2026-09-03, NOT RULED. FT's call.) One line of reasoning:
it degrades an affordance rather than asserting anything false, and the label
stays legible at 7.398:1, so a pilot can open with it recorded. But the proposal
rests on a denominator this entry could not verify, and a survey showing the
condition on a control a pilot user must find would move it to BLOCKING.
Detail: three source facts, each verified at `2d984ea` rather than assumed.
`src/components/Button.jsx:21` resolves the `secondary` base background to
`var(--sh-card)`. `src/components/Card.jsx:20` renders `background: tint ?
'var(--sh-bg-tint)' : 'var(--sh-card)'`, so a Card with no `tint` prop is also
`--sh-card`. The only boundary between them is `Button.jsx:23`,
`border: var(--sh-border-thin)`, which `tokens.css:117` resolves to
`0.5px solid var(--sh-card-border)`, `#E8E2D6`.
**THE RATIO IS 1.290:1 AGAINST `#FFFFFF`**, below WCAG 1.4.11's 3:1 for
identifying a UI component. The control is white on white and the hairline is
the only thing separating it from the surface it sits on; the label itself is
fine at 7.398:1, so what fails is the button reading as a BUTTON, not as text.
**THE COUNT, with the unverified part named rather than guessed.** `src/` holds
**124 `<Button>` call sites**: 57 primary, 29 secondary, 38 ghost, and **0 that
rely on the default**. That last figure is worth recording because it removes a
whole class of hidden instances: `Button.jsx:3`'s `variant = 'secondary'` and
`:80`'s `|| variants.secondary` fallback are reachable by no site in the tree
today. It also holds **155 `<Card>` sites, 134 of which pass no `tint` prop**.
**How many of the 29 secondary buttons actually render inside an untinted Card is
UNVERIFIED**, and deliberately not estimated: a Button's nearest Card ancestor is
frequently in a different component, so the question is a render question and not
a grep question. 29 is the ceiling.
**WHERE THIS SURFACED IS NOT WHERE IT LIVES.** It was found on the consent
interstitial during the A97 build, and the A97 swap removed it from that one card
by moving both buttons to primary. **That closed one instance of a
component-level condition and none of the others.** The condition belongs to
`Button.jsx`'s secondary base or to `--sh-border-thin`, and any remedy is a
component or token decision rather than a per-site one.
The counting instrument was itself checked before its output was trusted, per
CLAUDE.md §10, the scanner-control filing: a first parser returned 100 of 124
sites because its delimiter guard mishandled CRLF, and the corrected figures were
confirmed against three independent greps that agree at 57 / 29 / 38.

**A106 | The two consent surfaces disagree about weighting.**
Blocker: none.
Pilot: DEBT
Detail: the same two options are offered on two surfaces with two different
weightings, and only one of the two is ruled.
`src/surfaces/individual/IndividualSurface.jsx:153` and `:156` now both read
`<Button variant="primary" size="lg" …>`, carrying `I'll manage it myself` and
`Let program staff manage it`. `src/surfaces/individual/RecordKeeping.jsx:145`
reads `<Button variant="primary" size="lg" …>` on `I'll manage it myself` and
`:148` reads `<Button variant="secondary" size="lg" …>` on `Let program staff
manage it`, inside the `mode === null` branch, the branch that by its own
comment at `:128-131` "offers both as equal options" because "this is a first
choice, not a flip".
**THE INTERSTITIAL'S WEIGHTING IS THE FT-RULED ONE. RECORDKEEPING'S IS NOT RULED
EITHER WAY**, and was not in the A97 slice's scope by explicit instruction. So
this entry is not "RecordKeeping is wrong"; it is that two surfaces asking one
question answer it differently, and one of the two answers has a ruling behind it
while the other has only precedence.
RecordKeeping's other two primaries, `:134` and `:139`, are the
mutually-exclusive flip branches and are NOT part of this: they render one button
at a time, so no weighting between two options exists there to disagree about.

**A107 | Six independently-restated gating predicates define the writable set,
and two comments assert an equivalence nothing enforces.**
Blocker: none.
Pilot: DEBT
Detail: six sites decide who staff may write for, and **not one imports from
another**. `functions/api/athletes/[id].js:274`,
`functions/api/workshops/[id]/attendance.js:174`,
`functions/api/snapshots.js:163-164`,
`src/surfaces/enterprise/shared/enterpriseStats.js:37`,
`src/components/AthleteProfile.jsx:53`, `src/components/WorkshopDetail.jsx:68`.
Three are server-side and three client-side. A grep for a shared export
(`export const isWritable`, `export function isWritable`, `export.*canRecord`)
returns nothing.
**They already differ in FORM.** `snapshots.js` writes `person_id is not null` in
SQL; `athletes/[id].js` and `attendance.js` write `person_id == null` in JS; the
three client sites substitute the derived boolean `claimed`
(`functions/api/athletes.js:111`, `claimed: !!row.person_id`) for `person_id`
entirely.
**TWO COMMENTS ASSERT AN EQUIVALENCE NOTHING ENFORCES**, which is the part that
makes this a filing rather than a style note:
`src/surfaces/enterprise/shared/enterpriseStats.js:28` says its predicate is
"exactly the predicate the PUT /api/athletes/:id gate enforces", and
`src/surfaces/enterprise/shared/RateDisclosure.jsx:9` makes the same claim. No
test, no import and no build step checks either. Filed 2026-09-03 from the A96
inventory pass. Scope is NOT ruled here.
**Coupled to A96 ruling 4**, which amends D6 and therefore changes what these six
must agree ON, not merely whether they agree.

**A108 | The cohort-comparison consent caveat renders whenever authenticated,
even when nothing is excluded.**
Blocker: none.
Pilot: DEBT
Detail: `src/surfaces/enterprise/reports/CohortComparison.jsx:223-227` gates on
`isAuthenticated` alone, defined at `:92` as `const isAuthenticated =
!!appIdentity;`. It is not gated on `consentAware`, on snapshot count, or on
whether any athlete is actually excluded, so it renders on every authenticated
load of the route.
**The sibling behaves differently**, which is what makes this worth filing rather
than accepting: `src/surfaces/enterprise/shared/RateDisclosure.jsx:62` returns
null when nothing is excluded (`if (!consentAware || excludedTotal == null ||
excludedTotal <= 0) return null;`). One caveat suppresses itself and the other
does not. Filed 2026-09-03. Which behaviour is right is NOT ruled.

**A109 | `/api/me` exports `onRequest` with no method branch, so every HTTP
method is served identically.**
Blocker: none.
Pilot: DEBT
Detail: `functions/api/me.js:40` exports `onRequest`, not `onRequestGet`. A grep
for `request.method`, `onRequestGet`, `onRequestPost`, `onRequestPut` and
`onRequestDelete` in that file returns nothing, so a POST, PUT or DELETE to
`/api/me` is served the same body as a GET rather than being refused.
**It is one of only TWO such exports in `functions/`**, the other being
`functions/api/auth/[[route]].js:55`, which is a catch-all router and needs it.
Every other handler in `functions/` is method-specific and relies on Cloudflare
Pages to auto-405 the rest, an idiom `functions/api/athlete-consent.js:34`
documents explicitly.
**The handler MUTATES NOTHING**, verified: every database call in the file is
`.selectFrom(...)`, and the two matches for a mutation verb are comments (`:3`,
`:555`). So this is a shape defect rather than a write exposure. Filed
2026-09-03.

**A102 | F-C assumes an offline conversation the import path never mentions.**
Blocker: none named.
Pilot: DEBT
Detail: CLAUDE.md §5.2, F-C, which rules the invite `taken after an offline
conversation and athlete acknowledgment`.
`src/surfaces/enterprise/AddAthleteModal.jsx:128` instructs the operator on the
add path: `give them a heads-up that it's coming and why`.
`src/surfaces/enterprise/ImportRosterModal.jsx` says nothing of the kind: a grep
of that file for `invite`, `invited` and `pending` returns ZERO matches.

**A57 | Twelve `rgba()` literals sit outside the token system.**
Blocker: a design question rather than a sweep, namely whether alpha-variant
whites want tokens at all.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: TWELVE `rgba()` colour literals across
SEVEN files".

**A61 | Two raw persistence predicates want their contexts.**
Blocker: none named.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: convert the two raw persistence
predicates to their contexts".

**A29 | `athlete.badge` has a ruling and no author.**
Blocker: none named.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: `athlete.badge` has a ruling and no
author".

**A30 | `athlete_activity` is a table with an event enum, no writer, and three
consumers reading it as populated.**
Blocker: deciding which acts emit which enum value.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: `athlete_activity` exists as a table
with an event enum".

**A35 | `parseRoster.js`'s header docblock denies a file-upload path that has
existed since 2026-08-27.**
Blocker: none named. Documentation only.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed as STALE DOCUMENTATION".

**A53 | The `/individual/welcome` CTA falls below the fold on a short viewport.**
Blocker: none named. Accepted debt under the pilot gate's filed-defect test.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: `/individual/welcome` CTA falls below
the fold on a short viewport".

**A60 | Line breaks are intermittently missing on the enterprise program
calendar.**
Blocker: queued for a full-platform QA pass rather than scheduled alone.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: line breaks intermittently missing".

**A62 | The AppShell retry panel puts a state reset and a navigation 12px
apart.**
Blocker: none named.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: the AppShell retry panel puts a state
reset and a navigation 12px".

**A63 | The plain-vite lever does not establish which failure branch it
produced.**
Blocker: none named.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: the plain-vite lever does not establish
WHICH failure branch".

**A38 | `AddAthleteModal`'s footer carries a small size on all three controls.**
Blocker: none named. A provable 44px violation, and a size prop on three
controls.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: two controls were reported as
mobile-as-app violations".

**A36 | The two enrollment paths disagree about name shape.**
Blocker: filed as an observation, not a defect.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed as an OBSERVATION, not a defect: the two
enrollment paths disagree about name shape".

**A13 | Nothing READS `auth_send_log`, because no endpoint was ever written.**
Blocker: none for the endpoint itself. A92 governs whether `email` may be
emitted.
Pilot: POST
Detail: CLAUDE.md §11, the auth-observability filing; `docs/session-log.md`, the
third 2026-09-01 entry, its "This bought FINDABILITY, not MONITORING" passage,
which draws the read-versus-alerting distinction this entry used to collapse.
**BLOCKER CORRECTED AND ENTRY SPLIT 2026-09-02.** It read SCHEDULED EXECUTION
for both halves of its own title. That is true of ALERTING only, which is now
A94. A read endpoint needs an inbound HTTP request and nothing else:
`requireOps` (`functions/_lib/gate.js:147`) is type-only and reusable, migration
0021 already created `idx_auth_send_log_attempted_at` for the newest-first
shape, and `functions/api/roster.js` is the precedent at 32 executable lines.
**RULED 2026-09-02 (FJ-1): build it as an ordinary slice.** It does not gate the
BMF load.

**A90 | ADV-044, the radiogroup conversion, is deferred across three segmented
controls.**
Blocker: none named. The disposition is recorded as deferred, not as ruled.
Pilot: DEBT
Detail: CLAUDE.md §5, the Advisor row, its deferred list;
`src/surfaces/advisor/Pipeline.jsx:464-468`,
`src/surfaces/advisor/LessonEditor.jsx:420-423`,
`src/components/SegmentedControl.jsx:12-15`. All three keep `aria-pressed` on
single-select controls; `Pipeline.jsx:468` names the three-control span.

### Large

**A95 | An athlete cannot see their own milestones.**
Blocker: none.
Pilot: BLOCKING
Detail: `functions/api/me.js:126-137`, which for a linked athlete selects
`management_mode` and `institution.name` and emits
`linkedAthlete = { managementMode, institutionName }` and nothing else. No
lessons, no GPS date, no certification, no attendance. None of the nine
Individual routes (`src/surfaces/individual/IndividualSurface.jsx:322-330`)
displays them. `src/surfaces/individual/RecordKeeping.jsx:116` tells the athlete
`Progress already recorded stays on your record exactly as it is`, about a
record they have no way to view.
**RULED 2026-09-02 by FT: AN ATHLETE MAY SEE THEIR OWN MILESTONES; STAFF NOTES
STAY INTERNAL.** What the athlete did, meaning lessons, GPS completion,
certification and workshop attendance, is theirs and should be visible to them.
Staff and advisor notes are internal working material and are NOT disclosed.
FT's basis, in his words: an informational call's notes are internal, and the
platform should not force advisors or staff to share theirs either.
**The ruling names WHAT is visible, not what the screen is. Scope is NOT ruled
here.**
**THE DATA-LAYER SPLIT IS CLEAN ON ONE SIDE AND NOT THE OTHER, and the second
half is a correction to how this was first reported.** `athlete_note` IS a
separate table (`migrations/0009_enterprise_schema.sql:268`) and `me.js` never
names it, verified by grep, so note CONTENT is nowhere near an athlete-facing
emit. **But `athlete` carries its own free-text `notes` column**
(`migrations/0020_athlete_pending_status.sql:98`), which sits in
`ATHLETE_ELEMENT_COLUMNS` (`functions/api/athletes.js:78`) and is emitted by
`toAthleteElement` (`:109`). So emitting milestone columns is safe only if
`notes` is excluded by name: it rides the same row and the same column list.
E8 is what keeps it staff-only today (`functions/api/athletes.js:21-24`,
`notes is emitted ONLY to the staff's own /api/me block`; `me.js:399-401` says
the same at the emit site).
**IMPLEMENTATION CONSTRAINT ON THE RULING, not a separate finding, and the part
most likely to be lost between here and the build: `notes` must be excluded BY
NAME from any athlete-facing emit.** A naive "emit the milestone columns"
implementation reuses `ATHLETE_ELEMENT_COLUMNS`
(`functions/api/athletes.js:78`) and `toAthleteElement` (`:109`), both of which
already carry `notes`, and would therefore ship staff-authored notes
(`migrations/0020_athlete_pending_status.sql:98`) to the athlete. That is the
precise disclosure this ruling excludes.

**A98 | Nothing syncs `athlete.email` to `person.invite_email`.**
Blocker: none.
Pilot: DEBT
Detail: `person.invite_email` is written at INSERT and NEVER updated, verified
by grep: the three writers are `functions/api/athletes/[id]/invite.js:210`,
`functions/api/athletes.js:250` and `functions/api/invites.js:140`, and no
`updateTable('person')` anywhere sets the column. The one UPDATE that names it,
`functions/_lib/auth.js:337-342`, has it in the WHERE clause and sets
`auth_user_id`.
`bindAthleteRows` (`functions/_lib/auth.js:129-150`) is the only code joining an
athlete row to a person by email; it fires only from the `createUser` hooks
(`:356`, `:383`), which run once at first sign-in, and its
`.where('person_id', 'is', null)` excludes an already-bound row. So a claimed
athlete's binding is fixed at claim and nothing revisits it.
CLAUDE.md §5.2 files a CASE-divergence observation and calls it cosmetic. **That
verdict rests on the two values being the same address, which a genuine edit
breaks**, and no filing covers the edit case.

**A99 | Three invite refusals instruct an act the product forbids.**
Blocker: none.
Pilot: BLOCKING
Detail: `functions/api/athletes/[id]/invite.js:180` and `:228` both read
`Update the athlete's email address before inviting.`
`ALLOWED_MILESTONE_KEYS` (`functions/api/athletes/[id].js:187`) is
`['lessons', 'gpsCompleted', 'certified']` and rejects `email` as an unpermitted
field at `:193-196`; no UI offers an edit, `AthleteProfile.jsx:111` rendering the
address as a read-only `mailto:` link.
The third refusal, `:147-149`, says the record-keeping mode `needs correcting
first`, and no staff control writes `management_mode` at all.
**That third one is arguably CORRECT AS A REFUSAL and wrong only in its copy**:
staff asserting an athlete's consent choice is precisely what the consent model
exists to prevent, so the absent control is the design rather than the gap.

**A100 | No actor is assigned to the invite send.**
Blocker: none.
Pilot: BLOCKING
Detail: CLAUDE.md §5.2, SCOPE OF THE ATOMIC UNIT, places the send outside the
batch and fixes WHEN, `a step after the committed act`, without naming WHO.
F-C states `There is NO send script`, and
`functions/api/athletes/[id]/invite.js:55` records `no UI; no send`. A grep of
that file for `createSender`, `inviteEmail`, `Resend` and `fetch(` returns zero
matches.
**RULED 2026-09-02 by FT: INVITED ATHLETES RECEIVE AN EMAIL**, the same as any
invite, differing only in entry point and in who triggered it. **The actor
remains UNASSIGNED**: the ruling settles that a send happens, not which code
performs it.

**A103 | A bulk invite has no outcome-reporting shape.**
Blocker: none.
Pilot: DEBT
Detail: `src/contexts/AthletesContext.jsx:43`, `const [writeError, setWriteError]
= useState(null)`, is one provider-level string, so a partial failure across N
invites shows one message with no athlete attached to it.
**Both precedents exist and they diverge deliberately.** The import reports
PER-ROW: `functions/api/athletes/import.js:288-301` builds a `rejected` array of
`{ index, reason }`, and `src/surfaces/enterprise/EnterpriseRoster.jsx:211-228`
renders each against the staged athlete it names. The bulk delete deliberately
does NOT: `functions/api/athletes.js:431-440` returns one message, on the stated
reasoning that naming which ids were absent versus not-yours `would make this an
existence probe`. **That reason does not apply to invite refusals over roster
rows the operator is already looking at.**
**RULED 2026-09-02 by FT: invites are BOTH single and bulk, and most will be
bulk.**

**A23 | Four of five athlete-state derivations do not route through
`statusFor`.**
Blocker: none named. This is the root cause; its tile-drill symptom is closed.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed (D3 + D4, ONE item by FT ruling
2026-08-26)".

**A31 | The staff-writability predicate is hand-maintained in five places, in
two non-identical forms.**
Blocker: none named.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: the staff-writability predicate is
hand-maintained in FIVE places".

**A58 | Flow content is rendered inside `<button>` at 20 sites across 7 files.**
Blocker: none named. `Button.jsx` itself is clean.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: flow content is rendered inside
`<button>` at 20 sites across 7 files".

**A21 | The enterprise roster stat grid stacks tall on a phone.**
Blocker: unruled, namely whether the answer is fewer tiles, a denser tile or a
collapsed row. Partly mitigated by the tile-grid floor change.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: the enterprise roster's stat grid
stacks into seven full-width rows".

**A22 | The `certified` and `not-yet-invited` categories overlap, so six tile
categories no longer partition the roster.**
Blocker: it wants ruling together with A24. Unreachable on both real rosters
today.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: the `certified` and `not-yet-invited`
categories overlap".

**A24 | `resolveStatus` strands a Pending athlete, with certification its only
exit.**
Blocker: none named.
Pilot: BLOCKING
Detail: `docs/filed-defects.md`, "Filed (F-C)".

**A25 | One imported athlete discards a whole attendance batch.**
Blocker: none named.
Pilot: BLOCKING
Detail: `docs/filed-defects.md`, "Filed (G1)".

**A26 | Persisted rate columns fall back to 0 where the render layer says "Not
tracked".**
Blocker: none named.
Pilot: BLOCKING
Detail: `docs/filed-defects.md`, "Filed (F-D)".

**A27 | The render side and the persisted side divide by different
populations.**
Blocker: observable only through A39's window.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: the render side and the persisted side
divide by different populations".

**A28 | `management_mode` carries no CHECK, so the disclosure's buckets are not
exhaustive.**
Blocker: none named. It can only under-count.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: `management_mode` carries no CHECK".

**A32 | CLAUDE.md's E3 snapshot-survival claim is unverifiable from the tree.**
Blocker: it would need snapshot rows to have existed and an anonymize to have
run.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: CLAUDE.md's E3 snapshot-survival claim
is UNVERIFIABLE from the tree".

**A34 | `suggestMapping`'s containment fallback is unaudited for headers outside
the candidate vocabulary.**
Blocker: the shape of a fix is genuinely unobvious.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: `suggestMapping`'s containment fallback
claims a column".

**A37 | No mobile render check has been performed on the sites now rendering
Pending status.**
Blocker: it needs a render, not a fix.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "Filed: no mobile render check has been
performed".

**A40 | P-7 defect 2: the milestone editor copies its gate at mount and
`/api/me` is fetch-once.**
Blocker: ruled OPTIMISTIC OFFER PLUS RECOVERY, and unbuilt.
Pilot: DEBT
Detail: CLAUDE.md §5.1, P-7.

**A41 | The 403 copy asserts a present-tense fact the screen contradicts.**
Blocker: none. Owned by P-7, ruled 2026-09-01. FJ-4 carries the reasoning.
Pilot: BLOCKING
Detail: CLAUDE.md §5.1, P-7, its closing NOT RULED note.

**A43 | Advisor pipeline settings persist nothing, and no pipeline endpoint
exists.**
Blocker: none named. Deliberately excluded from P-4 and still its own slice.
Pilot: BLOCKING
Detail: CLAUDE.md §5, the Advisor row, known defects.

**A16 | Two athlete delete paths trust the FK cascade while a third deletes the
same children by hand.**
Blocker: downstream of the parked soft-delete ruling, P-B.
Pilot: POST
Detail: CLAUDE.md §10, the filed block on foreign-key enforcement.

**A52 | `GiftRow` extract-or-migrate is an open FT ruling.**
Blocker: FT to rule at the migration slice.
Pilot: DEBT
Detail: `docs/5.8-giving-flow-scoping.md`, section 5d.

**A55 | QA-023, uneven tab order, is the last open Operations audit finding.**
Blocker: a future CR-level filtered view.
Pilot: DEBT
Detail: `docs/qa-audit-operations-2026-06-09.md`, on the `qa-audit-operations`
branch. See A74.

**A64 | One section 7 ordering is recorded as probably fine.**
**NOT WORK. This is a record, not a queued item**, kept so a future scan does
not rediscover it as new. Nothing is expected to be done about it.
Blocker: not applicable.
Pilot: DEBT
Detail: `docs/filed-defects.md`, "(b) PROBABLY FINE".

**A65 | Whether section 6 gains a guardrail check, and of what shape.**
Blocker: unruled.
Pilot: DEBT
Detail: `docs/guardrail-violation-findings.md`, its Open section, item 1.

**A67 | Four residual items from the enterprise schema draft.**
Blocker: each was flagged for a build-time micro-ruling that has not been made.
Pilot: POST (undetermined, needs FT)
Detail: `docs/enterprise-persistence-schema-draft.md`, section 9, open items.

**A78 | Five residual items from the ADVISOR schema draft: `client.giving_plan`
shape versioning, the `doc.body` size ceiling, the cohort-level `sessions`
array, the `practice_lesson.base_id` orphan check, and the Q11 revisit
thresholds.**
Blocker: each was flagged for a build-time micro-ruling that has not been made.
Pilot: POST (undetermined, needs FT)
Detail: `docs/advisor-persistence-schema-draft.md`, section 9, "Open items
(small — flag, don't decide)", whose preamble reads "A handful of narrow items
remain — flagged here for the build slice or a future micro-ruling rather than
reopened". Direct sibling of A67, and its absence until now was a miss rather
than a scope choice: the same section in the enterprise twin was carried from
the first pass.

**A68 | Enterprise counsel-gated seams E3, E6 and E8.**
Blocker: COUNSEL.
Pilot: BLOCKING, and counsel-gated: building cannot close it. It gates A69, so
the enterprise surface stays non-functional in production until it clears.
Detail: `docs/enterprise-persistence-scoping.md`, section 6.2.
**PROMOTED from POST (undetermined) to BLOCKING by FT ruling 2026-09-02.** The
first pass labelled it undetermined because this entry's own text does not state
the coupling. FT ruled the coupling in, and it is verified rather than inferred:
CLAUDE.md §5, the Enterprise row, records the gate as staying dark "until
E3/E6/E8 counsel clears" and the write arc as "gated dark on production pending
E3/E6/E8 counsel"; `functions/_lib/gate.js:123-125` records it as dark "while the
E3 ... / E6 ... / E8 ... counsel seams remain open";
`docs/enterprise-persistence-scoping.md:524-526` records that "the enterprise
gate ships until E3/E6/E8 counsel clears"; and that document's §11 rulings table
carries a live counsel-status field reading `pending` on all three. The present
tense in "remain open" is what makes it a standing condition rather than a record
of the past.

**A85 | Lesson deletion has no endpoint, and the authenticated advisor is told
so after the attempt.**
Blocker: none named.
Pilot: DEBT
Detail: `src/contexts/PracticeContentContext.jsx:96-104`. The demo branch
filters locally and returns true; the authenticated branch sets a write error
reading "Removing lessons is not yet supported." and returns false. No DELETE
route exists under `functions/api/practice-content`.

**A86 | Workshops can be created but not edited or deleted.**
Blocker: the Q6 ruling, which put both out of scope for E-Write-3a.
Pilot: DEBT
Detail: CLAUDE.md §5, the Enterprise row, E-Write-3a. `functions/api/workshops.js`
exports `onRequestPost` only, and no `workshops/[id].js` exists.

**A87 | Cohort-detail theme flags persist nothing, on both trees, and the
disclosure that says so is ungated.**
Blocker: none named.
Pilot: DEBT
Detail: `src/surfaces/advisor/CohortDetail.jsx:130-139`, `toggleFlag`, which
writes React state and calls no endpoint; its disclosure at `:361` carries no
`isAuthenticated` test, so it renders to a real advisor too. Sibling of A43,
which is the same shape on Pipeline.
Recorded because a first pass over-counted this: the two adjacent
not-yet-persisted strings, `ClientWorkspace.jsx:1054` and `CohortDetail.jsx:496`,
are both correctly gated to the demo tree, and both of those writes DO persist on
the authenticated tree. This is one site, not three.

**A88 | Cohort signals have no store; the surface reads a demo simulation
module.**
Blocker: none named.
Pilot: POST
Detail: `src/data/cohortSignals.js:1-5`, which names itself DEMO SIMULATION ONLY
and says to replace it "when persistence lands"; consumed at
`src/surfaces/individual/CohortView.jsx:7,190`.

**A89 | E4 facilitator-person wiring is deferred, so every workshop carries a
NULL facilitator.**
Blocker: the E4 wiring itself, named as deferred in two places and scoped in
neither.
Pilot: DEBT
Detail: `functions/api/workshops.js:10-12`, which accepts no facilitator from the
body; `src/surfaces/enterprise/ScheduleWorkshopModal.jsx:13-14`, which does not
collect one.

### Blocker undetermined

Placed here rather than in PARKED, because an item with no named blocker is not
parked.

**A48 | The account-settings page, except consent reversibility, which shipped.**
Blocker: UNDETERMINED. Recorded as a founder decision with nothing named.
Pilot: POST (undetermined, needs FT)
Detail: CLAUDE.md §5, the Individual row.

**A49 | Geo-selection weighting, AI-drafted org descriptions, and the Discover
design pass.**
Blocker: UNDETERMINED for all three; none is named.
Pilot: POST
Detail: CLAUDE.md §5, the Individual row.

**A91 | "Enterprise routing follow-ups / invite runbook" is queued against a
standing list that does not exist in the repository.**
Blocker: UNDETERMINED, and it cannot be named until the list is recovered. The
scope is unrecoverable from the tree.
Pilot: POST (undetermined, needs FT)
Detail: CLAUDE.md §5, the Enterprise row, its NEXT post-arc queue, which reads
"per the standing list". A grep for that phrase returns that one occurrence and
nothing else in CLAUDE.md or `docs/`, so the list is referenced and absent.

---

## PARKED

Each carries a named blocker. Nothing here is scheduled.

**P-A | A StewardHouse iOS app.**
Blocker: an Apple Developer account, which needs a legal entity and a D-U-N-S
number. No entity formation is recorded anywhere in this repository.
Detail: `docs/filed-defects.md`, "PARKED SCOPING ITEM, not a defect and not a
queued build: a StewardHouse iOS".

**P-B | Athlete soft delete. It is ruled, and the tree does the opposite.**
Blocker: the retention period, a founder-judgment item, with the legal standard
needing counsel.
Detail: `docs/filed-defects.md`, "PARKED SCOPING ITEM, not a defect filing and
not a queued build: athlete deletion should be SOFT, and today it is HARD".

**P-C | Enterprise gift tracking.**
Blocker: COUNSEL. Building it reopens the Clause 6 subpoena posture. An accepted
Phase-1 boundary rather than a defect.
Detail: CLAUDE.md §5.1, the accepted Phase-1 boundary note.

**P-D | The PBC and captive 501(c)(3) data-controller question.**
Blocker: COUNSEL.
Detail: `docs/persistence-scoping-pass.md`, Strand 3, Layer 2.

**P-E | Which data-protection regime binds at pilot, given special-category
giving data, and the subpoena posture that follows.**
Blocker: COUNSEL.
Detail: `docs/persistence-scoping-pass.md`, Strand 3, Layer 2.

**P-F | A D1 Time Travel restore must re-apply pending deletions.**
Blocker: A47. The requirement is ruled and no deletion pipeline exists to carry
it.
Detail: `docs/ruling-e-deletion-retention.md`, Clause 4.

**P-H | The Plan / GivingModeler / GiveScreen triangle: modeler output does not
flow into GiveScreen.**
Blocker: the design-phase decision itself. The row records it as "Surfaced
during scoping; not yet ruled. Likely lands in the Plan-rework slice's design
phase."
Detail: `docs/individual-rework-scoping.md`, item 5.8, and its "Open design
calls still parked" list. Unlike 5.7, the table row and the parked-list mention
describe the same item here, so the item number is a safe anchor.

**P-I | `IntakeContext` may be scope-too-broad.**
Blocker: the design-phase decision itself. The row records it as "Surfaced
during scoping; not yet ruled. Decide during rework whether to split into
intake-only vs activity contexts."
Detail: `docs/individual-rework-scoping.md`, item 5.9, and its "Open design
calls still parked" list. Same anchor caveat as P-H.

**P-G | Where `CohortMemberContext` belongs.**
Blocker: the unified-as-live-store question, which the persistence pass left
open.
Detail: `docs/individual-rework-scoping.md`, its "Open design calls still
parked" list. NOT its table row 5.7, which describes the CohortView coupling
that shipped; the two share a number and are different items.

**P-J | Nonprofit accounts as a fourth user-facing surface.**
Blocker: the nonprofit side does not exist. **Banked by FT 2026-09-03 and NOT to
be built or scoped unless and until it does.** Outside pilot, and conditional
rather than sequenced.
Detail: nonprofits logging in; athletes OPTING to be visible to organizations
seeking funders; org-initiated contact. Recorded so the idea is not lost and not
so it is queued.
**IT REVERSES PATH B's DIRECTION OF FLOW, which is why it is parked rather than
filed as work.** CLAUDE.md §7 states the platform surfaces options and never
prescribes, and its connection model is explicit that "Funders initiate;
nonprofits don't push." A surface where organizations seek funders inverts that:
exposure flows IN under Path B today, and this would let solicitation flow OUT.
**It warrants the same scrutiny FT applied to third-party athlete-vetting
products in the vendor review notes**, and for the same reason: a marketplace
that matches parties is a different product from a platform that organizes what
one party decides, however similar the two look at the record level.
**It also interacts with A96 ruling 3 and the A96 build shape.** Ruling 3 makes
sharing the athlete's affirmative choice per relationship, and the build shape
rules out in-platform messaging on moderation, retention and safety grounds given
a young-user population. An org-initiated contact path would reopen exactly that
question with a party that is not on the platform's roster at all.

---

## FOUNDER JUDGMENT

Explicit and awaiting FT unless a RULED line says otherwise. **Ruled items STAY
here** rather than moving or being deleted, per FJ-4's precedent: the reasoning
that preceded a ruling is what makes the ruling readable later.

**FJ-1 | BMF precondition 2: does a durable record satisfy it, or did it ask for
an active signal?**
`docs/bmf-load-scoping.md` section 13, "The availability ruling", requires that
the observability gap be closed and points at CLAUDE.md section 11.
**CORRECTED 2026-09-02, because the clause that used to sit here was false.** It
said that because migration 0021 was local-only, no production send was stamped
at all. The migration was applied to remote on 2026-09-01, and a live production
send stamped a success row 67 seconds later. The stamp records on production
today.
The factual delta. Precondition 2 names TWO defects in one sentence:
"magic-link sends stamp nothing", which is now CLOSED in production, and "there
is no health check", which is OPEN. Nothing reads the table.
**The evidence gate this item was waiting on is therefore cleared, and what
remained was a reading question**: which of those two defects "the observability
gap" was meant to name.
**RULED 2026-09-02: BUILD THE READ SURFACE AS AN ORDINARY SLICE, AND DO NOT
BLOCK THE BMF LOAD ON IT.** Basis: precondition 2 names two defects, the stamp
half is closed on production, and blocking a whole surface on a small endpoint is
the wrong trade. **BMF proceeds on the rollback path alone, which is A1 and is
now the only standing precondition.** The read surface is A13; alerting is A94
and blocks nothing.
**A SUB-ITEM SURFACED BY THIS RULING is filed as A92**, and it is the one part
that is not mechanical: migration 0021 forbids emitting `email` to any client
under E8, so a read endpoint must omit the column or that rule must be amended.
Blocker FT, because it is a privacy-posture ruling rather than infrastructure.

**FJ-2 | A9 disposition: a cleanup slice, or a ruling first on what may sit at
rest in remote D1?**
The seed rows are dormant, unread by any endpoint, and describe real
organizations. Removing them is small. Ruling on the general question is not.
**RULED 2026-09-02 by FT: LEAVE AS IS, narrow and general both.** Neither the
cleanup slice nor the general ruling. Basis: FT ruling 2026-09-02.
A9 carries the corrected blocker and stays OPEN rather than moving to PARKED,
because PARKED requires a named blocker and A9 no longer has one; the reasoning
sits on A9 itself.

**FJ-3 | A44 and A69: the advisor and enterprise gates have never been set, and
designation is described as "never a slice". Is that the intended posture, or a
gap?**
Every write on two of the four surfaces returns 403 in production, and the pilot
gate's production-usable figure sits far below its capability figure almost
entirely because of it.
**RULED 2026-09-02: IT IS A GAP, NOT AN INTENDED POSTURE, and it gets fixed as
its own scoped slice. NOT URGENT: no pilot users exist, so nobody is hitting the
403s.** Basis: the gate is per-person-row per-namespace
(`json_extract(extensions, '$.<ns>.demo_gate')`, `functions/_lib/gate.js:101`,
`:135`, `:205`, each scoped by `WHERE id = person.id`), so designation is safe in
principle. BUT the gate and the institution scope are SEPARATE checks
(`functions/api/snapshots.js:114` then `:127-136`) and nothing in that chain asks
whether the target institution or its athletes are seeded. So it needs a scoping
pass, not a blanket flip.
A44 and A69 stay OPEN with their blocker changed from FT's designation to that
scoping pass.
**The A39 coupling recorded here was WRONG and is removed**: neither ruling this
nor setting the gate closes A39's window, because neither writes a row.
**CROSS-REFERENCE added 2026-09-02, which does NOT alter the ruling above.** The
scoping pass this ruling calls for MAY ITSELF BE BLOCKED BY A68 on the enterprise
side: CLAUDE.md §5, the Enterprise row, `functions/_lib/gate.js:123-125` and
`docs/enterprise-persistence-scoping.md:524-526` each record the enterprise gate
as staying dark until the E3, E6 and E8 counsel seams clear. So the pass can be
scoped and the advisor half acted on, while the enterprise half waits on A68.

**FJ-4 | A41: which arc owns the 403 copy defect?**
CLAUDE.md §5.1 records it under P-7 while saying it may belong to P-6 slice 2
instead, and that FT has not ruled which.
**RULED 2026-09-01: A41 STAYS IN P-7.** It is not moved to P-6 slice 2. A56 is
that slice, and it is blocked on advisor and enterprise gate emissions in
`/api/me` that do not exist and that nothing is scheduled to build, so assigning
A41 there would make an actionable defect unschedulable. P-7 already carries
A40, ruled but unbuilt, so A41 attaches to a live arc instead. The two are
adjacent rather than identical: A41 is copy on one screen, A56 is a shared
string across three gate branches. Kept here rather than deleted so the
reasoning survives.

**FJ-5 | A54: Marcus unclaimable. The filing says the remedy is a ruling, not a
patch.**
No sign-in path recovers the row. What it should become is undecided.
**NOT RULED 2026-09-02, DELIBERATELY, and the record says why rather than
leaving it blank.** On the evidence gathered 2026-09-02, DELETION is the sound
disposition: no code path reads the row (every `person` read in `functions/` is
keyed on `auth_user_id`, on `invite_email`, or on a session-resolved id, and this
row is NULL in both columns); the demo Individual surface is fixture-backed
through `src/data/individualProfile.js` and reads no D1 at all; the blast radius
is 1 `person` row plus 3 fictional `gift` rows via
`migrations/0001_initial.sql:156` ON DELETE CASCADE; and no document rules the
row be retained. The one read that reaches it is `GET /api/roster`, which selects
the whole table and renders it in the Accounts view, which is a render rather
than a dependency.
**The ruling is WITHHELD because executing it is a remote DELETE against
production and whether production D1 enforces foreign keys is UNVERIFIED.**
**FJ-5 is therefore SEQUENCED BEHIND A15.** Four `person` parents are NO ACTION
and two of those are NOT NULL, so cascade behaviour is load-bearing for any
delete, and A15 is the item that establishes it.

**FJ-6 | The refresh cadence of THIS FILE, and nothing else.**
`docs/outstanding.md` is accurate as of the commit that created it and carries
no update rule. Candidates: refreshed per session alongside
`docs/session-log.md`, refreshed per arc, or refreshed on demand. Without one it
becomes the thing it was written to fix.
**RULED 2026-09-01: REFRESH ON STATE CHANGE.** This file is updated when an item
opens, closes, or moves, and the edit RIDES THE COMMIT THAT CAUSED THE CHANGE.
There is no separate refresh cycle, no per-session pass and no per-arc pass.
The 30-day sweep ruled the same day is NOT a refresh cadence and does not
qualify this one: it is a periodic audit of what this cadence missed, and
CLAUDE.md §6, the 30-day sweep, carries it.
The basis, against the three candidates. F5 closing on 2026-09-01 produced a
two-line edit; had a docs commit been pending it would have ridden along at zero
cost. Per session invites narration, which is how the session log stopped being
readable as a queue. Per arc leaves the file stale for weeks. On demand means it
rots until someone notices, and not relying on someone noticing is why this file
exists.
**The known weakness, stated plainly:** it depends on whoever closes an item
updating the index in the same commit. That is the same discipline that already
governs commit messages here, and three commits this year show it does not
always hold: `82b4a39`, `7cff1c1`, and the nine uncredited advisor closures,
each of which changed state without the record moving with it. That gap is what
the 30-day sweep in CLAUDE.md §6 covers.
**A BROADER QUESTION WAS CONSIDERED AND IS RULED OUT**, recorded so it is not
reopened: whether this file lets `docs/session-log.md` or commit-message
discipline carry less. It does not, and neither changes. The sweep that produced
this file was possible BECAUSE of them, and the session log uniquely holds
rulings that never became commits, which no commit history can recover.

**FJ-7 | `--sh-text-on-accent` on `--sh-bronze` misses WCAG 1.4.3 by 0.014.
Adjust a locked brand token, or accept the shortfall and record it?**
Pilot: DEBT
**NOT RULED. This is here rather than in OPEN because no build slice may close
it:** `--sh-bronze` is a §7 locked brand token, and §7 names brand-token
deviations non-negotiable alongside Path B violations. Moving it is FT's call and
nobody else's, which makes this a founder-judgment item by construction rather
than by triage.
The measurement, recomputed at `2d984ea` and confirmed twice before being
written here. `--sh-text-on-accent` (`#FFFFFF`) on `--sh-bronze` (`#8B7355`) is
**4.486:1**. WCAG 1.4.3 requires **4.5:1** for text that is not large, and the
`lg` label is `var(--sh-text-base)` = 14px at `fontWeight: 500`, which is neither
18.66px bold nor 24px, so the 4.5:1 threshold is the applicable one. **It misses
by 0.014.** On hover the fill becomes `--sh-bronze-deep` (`#5A453A`) and the
ratio is **8.947:1**, which passes, but hover is not a resting state and does
not exist on touch.
**The same colour PASSES as a boundary.** `--sh-bronze` against `--sh-card` is
the same 4.486:1 measured against 1.4.11's 3:1, which it clears comfortably. That
is why the A97 reversal to both-primary was sound on its own terms and this entry
is not an argument against it: the fill is fine, the white label on it is not.
**Carried by all 57 `variant="primary"` sites in `src/`**, so this is a property
of the token pair and not of any screen. The A97 swap took one card from one
instance to two; it did not create the condition and closing it would not be
undone by reverting that slice.
**THE TWO DIRECTIONS, STATED PLAINLY, WITH NEITHER RECOMMENDED.**
(a) **Adjust the token.** Darkening `--sh-bronze` far enough to clear 4.5:1
against white text would clear it at all 57 sites at once. The cost is that
`--sh-bronze` is the brand accent and appears far beyond buttons: focus rings
(`global.css:60`), borders, and accent text. The change is therefore a brand
decision with a blast radius well past this finding.
(b) **Accept the shortfall and record it.** 0.014 is below any plausible
perceptual threshold and no user is misled by it; the cost is that §7 states WCAG
AA without qualification, so accepting means §7 gains a named, dated exception
rather than being quietly untrue.
**Nothing here recommends either.** What this entry establishes is that the
figure is measured rather than estimated, that the decision cannot be delegated
to a build slice, and that the current state is direction (b) undeclared: the
shortfall is being accepted today without having been recorded anywhere until
now.

---

## ANSWERABLE ONLY BY FT

Each needs a read-only remote query, which is FT-run-only per CLAUDE.md §6.10
and §6.15.

**F5 was ANSWERED 2026-09-01** and has left this section; the remaining IDs are
not renumbered, since renumbering would break every reference to them. The
answer lives in A39, Tier 1.

**F4 was ANSWERED 2026-09-02** and has left this section on the same terms, with
no renumbering. Migration 0021 had reached remote on 2026-09-01, which is also
what closed A11. The answer lives in the Tier 0 note.

**F1 | Is the `+screen` test address bound, or an expired invite?**
Query class: a single-row SELECT over `person` for that address, reading its
created timestamp and whether an `auth_user` is bound.

**F2 | Does the `+morgan` advisor test address still exist remotely?**
Query class: an existence check over `person` for that address.

**F3 | How many claimed individual-type rows does FT hold?**
Query class: a COUNT over `person` grouped by type, soft-deleted excluded.
CLAUDE.md §9 records three and §12 names one working address; the two are
unreconciled.

---

## RULED OUT — DO NOT RE-LITIGATE

**C1 | An in-app staff notification on a consent flip.** Ruled out on evidence:
no notification surface exists anywhere. CLAUDE.md §5.1, P-3c ruling R3.

**C2 | A sticky roster table header.** Investigated, ruled, dropped: no overflow
value satisfies both requirements. `docs/filed-defects.md`, the sticky-header
ruling inside the stat-grid filing.

**C3 | Adding response-ok checks to the sign-in and landing session probes.**
Not a defect; the proposed fix is a no-op. `docs/filed-defects.md`, "CLOSED
2026-08-21".

**C4 | The four Operations directory rows as a keyboard defect.** Closed, not
deferred, and it carries a trigger-to-watch note. `docs/filed-defects.md`,
"CLOSED 2026-08-17".

**C5 | Modals that do not open through the browser harness.** A harness limit,
not a product defect. `docs/filed-defects.md`, "CLOSED 2026-08-18".

**C6 | Ordering athletes by journey status.** The ordering STANDS; only the
constant was renamed. CLAUDE.md §5.2, the section 7 filing (a) ruling.

**C7 | A name splitter.** Never to be built; the information is not in the cell.
`docs/filed-defects.md`, the name-shape ruling.

**C8 | Candid integration.** Deferred entirely pending an attorney. Do not
design toward it. CLAUDE.md §7, the ruled import architecture.

**C9 | PDF roster import.** Refused by name; a PDF is a rendered document, not
tabular data. CLAUDE.md §5.2.

**C10 | SheetJS from a CDN tarball at a later version.** Rejected; the pinned
registry version carries two HIGH advisories and is filed for SOC 2 readiness
scoping. CLAUDE.md §5.2.
