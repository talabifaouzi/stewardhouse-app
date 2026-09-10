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

**STANDING STATE A FRESH SESSION NEEDS, recorded 2026-09-08. NOT AN ENTRY, and
deliberately so:** none of this has a completion state, so filing it as a counted
item would leave it in the queue permanently. That is the same reasoning
CLAUDE.md §6.10 gives for keeping its branch (c) obligation out of this file.

**TWO LOCAL REFS EXIST THAT ORIGIN DOES NOT HAVE, and one of them is the only
thing holding four commits.** Branch `slice-1-bmf-parser` at `aaf2c46` and tag
`pre-rebase-slice1` at `a130bf9`, **neither pushed**. The tag is the ONLY
reference from which the four PRE-REBASE slice-1 commits — `cb4bf24`, `140b0c9`,
`a130bf9`, `bdb9918` — are reachable; they exist on this clone and nowhere else,
and `git for-each-ref --contains a130bf9` returns exactly one ref. **Deleting
that tag loses them.** The branch's own tip is reachable from `main`, so the
branch ref is a label rather than the only handle.

**THE EXTRACT AND THE EMITTED ARTIFACTS ARE ON DISK AND GITIGNORED**, which is
why §6.20 requires staging by explicit path. `.bmf-cache/` holds the **2026-09-07
extract**, five CSVs totalling **341,097,144 bytes** plus `extract.json`, ignored
by `.gitignore`'s `.bmf-cache/` rule. `scripts/bmf-aside.tmp.sql` is the emitted
artifact at **173,873,096 bytes in 5,805 statements**, and
`scripts/bmf-aside.tmp.json` its sidecar, ignored by the `scripts/*.tmp.sql` and
`scripts/*.tmp.json` rules. **A blanket stage on a branch whose `.gitignore`
lacks those lines commits all of it.**

**THREE SUBAGENT DEFINITIONS AND A VERIFICATION SCRIPT LANDED 2026-09-08.**
`.claude/agents/builder.md`, `adversary.md` and `records.md` are tracked, and
`scripts/verify-commit-tail.mjs` runs the post-commit tail as one pass/fail pass.
**NONE OF THE THREE AGENTS HAS BEEN RUN.** They are definitions only, and the
delegation-message problem is mitigated BY PROMPT rather than by configuration —
each file tells the agent to treat a parent's claims as unverified, and nothing
enforces it. CLAUDE.md §8 carries the same pointer for a reader who starts there.
**THAT FIRST SENTENCE IS RETIRED 2026-09-09, quoted rather than deleted so the
change is visible where the stale claim sat.** `adversary` HAS been run, in a
read-only pass on 2026-09-09 that left three files under
`.claude/agent-memory/adversary/`; `builder` and `records` remain unrun. **The
rest of the paragraph stands unchanged** — the prompt-only mitigation is still
what holds. **That run also established that `adversary` writes, which its own
one-line `description:` denies**, and its memory path is covered by
`.gitignore:11`'s `.claude/*` rather than by any ignore rule naming it, so
CLAUDE.md §6.20's stage-by-explicit-path rule is what keeps it out of a commit.
Detail: `docs/filed-defects.md`, the entry filing that `description` says
"Writes nothing" and it writes; CLAUDE.md §8 carries the correction.

**As committed: 113 OPEN, 10 PARKED, 7 founder-judgment of which 5 are now ruled,
3 answerable only by FT, 10 ruled out.** The OPEN count breaks down as six
ruled tiers holding 7, then gates-other-work 16, gates-a-stated-commitment 7,
BMF-and-Discover 13, cheap-and-mechanical 32, large 35, and
blocker-undetermined 3.
**ARITHMETIC OF THE LAST CHANGE, 2026-09-09: NOTHING OPENED, NOTHING CLOSED, AND
ONE ENTRY WAS UPDATED IN PLACE.** A125's blocker moved from an open fork to a
named dependency, on FT's ruling that the entry is not rulable ahead of slice 2's
boundary, and the ruling with its four grounds was written onto the entry.
**A125 STAYS OPEN AND STAYS BLOCKING**, so no entry changed state, **and every
count is UNCHANGED and was re-derived rather than assumed.**
**OPEN stays 113; BLOCKING 23, DEBT 63, POST 27**, summing to 113; the breakdown
stays 7 + 16 + 7 + 13 + 32 + 35 + 3 = 113, the BMF and Discover tier staying 13;
the restatement further down stays "sum to 113"; and the counsel-gated line stays
FOUR OF THE TWENTY-THREE.
**The build chain stays 19.** The definition is unchanged — BLOCKING minus the
four counsel-gated items — and gives 23 − 4 = 19. **A47, A84, A68 and A110 were
re-confirmed by execution**, not recall: all four present, all four inside OPEN,
all four still carrying the counsel-gated marker, whose anchored count is 4.
**A BLOCKER CHANGING SHAPE IS NOT AN ENTRY CHANGING STATE, and that distinction
is why nothing here moves.** A125 was BLOCKING on an unruled fork and is BLOCKING
on a dependency that has a name. **What it waits for changed; whether it waits
did not**, and only the second is a state this file counts.
**THE DIAGNOSTICS DO NOT MOVE EITHER.** The enumerator stays 111 against 113,
the gap still exactly A50a and A50b, since nothing added or removed an entry
header; and the file-wide `Pilot: DEBT` count stays 64 against 63, the single
extra still being FJ-7's own line inside FOUNDER JUDGMENT.
**ONE CORRECTION RODE THIS CHANGE AND IS COUNTED NOWHERE, because it is in
another file.** CLAUDE.md §5's Individual row named A129, A130 and A131 as the
open questions blocking the slice-2 scoping; all three closed in `c6f0fe5`, the
commit immediately before this one, and the row was corrected to say what blocks
it now.
**THE SUPERSEDED BLOCK IS NOT QUOTED HERE**, per this block's own replace-rather-
than-append rule. It recorded three entries closed and one filed.
**CONTROLS USED FOR THIS CHANGE**, per CLAUDE.md §10: the suffix-aware and naive
patterns each asserted against a known letter-suffixed header AND a known
plain-numeric one, with a mid-line occurrence asserted to match neither, so the
control set spans both id formats rather than only the one the enumerator
handles; each of the six anchored entry-header and classification patterns given
a positive control that fires and a negative control that does not, **one of
which was REBUILT after returning zero for want of a matching sample**, since a
control that cannot fire proves nothing; every figure measured on HEAD and on the
edited file and compared pair by pair, STATED as well as measured, because the
stated side is parsed by first-match and a new paragraph above its source would
shadow it; quoted strings verified against a flattened copy after a line-based
grep returned a **FALSE NEGATIVE** on a phrase wrapped across two lines; and line
endings re-counted as carriage-returns-against-line-count for both files touched,
with a known-LF control asserted to return zero first.
**THE ENUMERATOR THAT REPRODUCES THESE COUNTS IS SUFFIX-AWARE AND SECTION-
SCOPED. A NAIVE ONE IS WRONG BY TWO, AND PLAUSIBLY WRONG**, which is the
dangerous kind. Matching `^\*\*A[0-9]+ \| ` returns 111 rather than 113, because
A50a and A50b carry letter suffixes. The pattern that reproduces the stated
count is `^\*\*A[0-9]+[a-z]? \| `, scoped to the OPEN section, since PARKED and
ANSWERABLE-ONLY-BY-FT reuse A-ids. A file-wide `Pilot: DEBT` count returns 64
rather than 63, for the FJ-7 reason recorded below. Recorded per CLAUDE.md §10,
the scanner filing: assert a known-positive control before trusting a scan
count.
**TWO founder-judgment items are NOT RULED and both say so explicitly**, FJ-5
and FJ-7, with the evidence and the reason for withholding recorded on each
entry. An unruled item and an item nobody has looked at are different states,
and the count distinguishes them.

**AGAINST THE PILOT GATE: 23 BLOCKING, 63 DEBT, 27 POST**, classification ruled
2026-09-02 and the totals re-derived 2026-09-09,
of which 5 POST carry "(undetermined)" because their own text does not settle it,
and of which **one DEBT, A105, is PROPOSED rather than ruled** and says so on its
own line. A total has to place it somewhere, and DEBT is where its proposal
puts it. Every OPEN entry carries a `Pilot:` line. **ONE ENTRY OUTSIDE OPEN
CARRIES ONE TOO, AND IT IS THE ONLY EXCEPTION:** FJ-7, whose disposition FT
ruled DEBT at the same time as filing it. That line is NOT counted in the three
totals above, which remain a count of OPEN entries and sum to 113. The sentence
here previously read "nothing else does", which FJ-7 made false.
**BLOCKING means pilot cannot open with it unresolved, DEBT means pilot can open
with it recorded and honest, POST means no pilot user reaches it.**

**RESOLVED 2026-09-07: THE FIGURES ABOVE WERE A STALE COUNT, NOT A DATED RECORD,
AND ARE NOW RE-DERIVED.** They read "(classified 2026-09-02): 20 BLOCKING, 59
DEBT, 24 POST", which summed to 103 against a live 109.

**THE READING WAS SETTLED BY EVIDENCE RATHER THAN BY PREFERENCE, because the
opposite reading was available and would have meant changing nothing.** At
`593b9bf`, the commit that introduced the line, the live figures WERE exactly
20 / 59 / 24, and this header's own "As committed" said 103 OPEN. **They were
accurate when written and went stale afterwards**, which is what a stale count
is. A dated record would also have been consistent with its own paragraph, and
this one was not: the same paragraph's "sum to" clause was maintained forward
while the three components beside it were not.

**THE CAUSE, which is the part worth keeping.** The arithmetic block above
carries a maintenance checklist naming every figure a change must update. **It
named the "sum to" restatement in this paragraph and omitted the three component
totals one sentence above it.** So the paragraph was half-maintained by
construction, and drifted exactly as far as the checklist failed to reach.
**A checklist of sites to update is itself a count without a list**, and the
sites it misses are invisible precisely because the ones it names keep working.

**WHAT MOVED, so the correction carries its cause and not only its result.**
103 → 109, and the delta is six entries ADDED since 2026-09-04: A113, A115, A116,
A118, A119 and A120. **Nothing was removed.** A114 and A117 were both filed and
closed inside the same window, so they contribute zero. The class shifts follow
from those six plus A117's closure from BLOCKING.

**THE DISTINCTION THIS FILE NOW HAS, stated because it will be needed again.** A
dated figure here describes an EVENT — "A117 was CLOSED 2026-09-07", "ARITHMETIC
OF THE LAST CHANGE" — and is correctly frozen. **A dated figure that describes a
STATE is a live count wearing a date**, and must be maintained or it lies. The
parenthetical here dated the CLASSIFICATION ACT, which is genuinely fixed at
2026-09-02; the TOTALS were never fixed, and pairing the two made a live count
look archival. **The date has been moved off the totals and onto the act.**
**FOUR OF THE TWENTY-THREE BLOCKING ITEMS ARE COUNSEL-GATED AND CANNOT BE CLOSED
BY BUILDING: A47, A84, A68 and A110.** So the pre-pilot path is TWO CHAINS, not
one:
a build chain, and a counsel chain that no slice advances. What moves the counsel
chain is not uniform, and the record says so in FOUR places rather than three.
**CORRECTED 2026-09-08. THIS PARAGRAPH SAID THREE PLACES AND MAPPED ONE OF THEM
WRONG.** It read, verbatim: "the record says so in three places rather than one.
`docs/ruling-e-deletion-retention.md` names a reviewing attorney for Clauses 3
and 6, which is A47 and A84." Quoted rather than edited away, because the
sentence was doing TWO JOBS AT ONCE — mapping clauses to entries, and accounting
for all four counsel-gated items — and collapsing them into one sentence is what
produced the error.
`docs/ruling-e-deletion-retention.md` §6 sends exactly TWO clauses to a reviewing
attorney, 3 and 6, and the entries whose subject is those clauses are **A47 and
A46**, one per clause. **A46 is `Pilot: POST` and is NOT among the counsel-gated
four**, so this source yields one counsel-gated entry and one POST entry, which
is precisely why it could never account for two of the four on its own.
**A84's counsel gate comes from A47, not from this document.** Its blocker line
reads `Blocker: A47, COUNSEL`, and the FT grouping ruling below says the same:
A47 is the narrow predicate its policy waits on. What A84's OWN Detail document
supplies is the PRE-PILOT REQUIREMENT rather than the gate —
`docs/persistence-scoping-pass.md`, Strand 3, Layer 4, governance: "a
retention / deletion policy must exist BEFORE pilot — soft vs hard delete, what
`delete my account` does to gift rows". **That is a fourth source, and this
paragraph never named it.**
CLAUDE.md §5, the Enterprise row, records the operating premise for E3, E6 and
E8, dated 2026-07-15, as internal review with no external counsel, which is A68.
**A110 is NEW on 2026-09-03**, and its gate is stated in the schema itself:
`migrations/0009_enterprise_schema.sql:298-306` marks the `athlete_reflection`
pre-claim visibility posture counsel-gated on the exact institutional consent
language. It was THREE until the A96 ruling made that table something the
product will write to.
**WHAT WAS MEASURED, so the correction is checkable rather than asserted.** A84
carries ZERO occurrences of `subpoena`, against a control returning 2 for
`delete` in the same entry. Its Detail cites Layer 4, governance, while subpoena
posture is Layer 2, item (c) — a different layer of the same document, whose
five counsel mentions all sit in Layer 2 or in §7, which is about the Layer-2
questions. **A47 and A46 are a matched pair**: the only two entries titled
`Ruling E Clause N`, and the only two OPEN entries whose Detail cites the ruling
document by clause, one per counsel-gated clause. The third such Detail belongs
to parked **P-F**, Clause 4. **And this header was the ONLY clause-to-entry
mapping in the tree** — CLAUDE.md, `docs/persistence-schema-draft.md`,
`docs/filed-defects.md` and `migrations/0001_initial.sql` all map a clause to a
SUBJECT and never to an ID, and every one of them agrees with A46 and A47.
**THE BOLD LEAD'S ROSTER OF FOUR IS UNCHANGED: A47, A84, A68 and A110.** A46
stays `Pilot: POST` and stays outside it, and the counsel-gated count remains
FOUR.
**Nothing in this repository records counsel as retained**, and no entry names a
date by which either chain moves.
**FT RULED 2026-09-08: THE FOUR COUNSEL-GATED ITEMS RESOLVE TO TWO
CONVERSATIONS, NOT FOUR.** This is FT's ruling on grouping, recorded here rather
than derived by a pass, and it changes no classification and no count.
- **A47 and A84 are ONE SUBJECT AT TWO ALTITUDES.** A84's blocker line names A47
  directly. A47 is the narrow factual predicate — does any charitable-records
  floor bind — and A84 is the policy that cannot be written until it is answered.
- **A68 is a DISTINCT QUESTION**: controller identity under FERPA and NIL, at
  institutional scale. It overlaps A47 only through Clause 3's "ties to
  controller-identity" phrase, which is a shared input rather than a shared
  question.
- **A110 STANDS ALONE**, and nothing depends on it until A96 ships. Its column
  already defaults to visible and nothing reads or writes it today.
**THIS IS A RULING ABOUT HOW THE QUESTIONS GROUP, NOT A MERGE.** All four
entries stay open, separately classified, separately counted. The counsel-gated
count remains FOUR.
**THE PRE-PILOT CRITICAL PATH, AS IT STANDS AFTER THE 2026-09-04 RULINGS. Read
this first if the question is what comes next.**
**THE CHAIN IS SIX STEPS, NOT THREE, AND A1 GATES ONLY THE LAST.** FT ruled
2026-09-04 that Discover is an intended capability and that pilot cannot open
without it, so A8 is BLOCKING. Its blocker is the BMF ingest, and the ingest is:
create the sandbox (A114), write the ruled-table migration (A117), apply it to
the sandbox, build the loader (A113), test it on the sandbox, then run the
production load. **A1 gates the RUN, and none of the five steps before it.**
**IT READ FIVE UNTIL LATER THE SAME DAY, AND THE SIXTH STEP WAS NOT ADDED, IT
WAS SEPARATED.** The earlier text ran "create the sandbox (A114), apply the
ruled-table migration to it, build the loader (A113)", which folded WRITING the
migration into APPLYING it. Writing it is local code work needing a scope pass;
applying it is an FT-run remote act, and under R5 not a one-time act at all.
Filed as A117.
**THE EARLIER READING PUT A1 AT THE HEAD OF A CYCLE, AND THE RULING BROKE IT.**
FJ-1 named A1 the sole standing precondition on the ingest, which read as a gate
on all of it, and A8's blocker line said "the BMF ingest, which is A1". Under
that equation A1 needed a remote import, the import needed the loader, and the
loader was the thing A1 gated. **R1 ruled that A1 gates running the load rather
than writing it**, so the loader build is reachable today and the order above is
walkable. The first buildable step is A114, which is FT-run.
**A1'S APPROACH IS NOW PARTLY RULED: THREE OF THE TEN QUESTIONS ARE ANSWERED AND
SEVEN STAY OPEN.** A scoping pass on 2026-09-04 established, by execution and
grep at HEAD, that **A1's subject does not exist as code.** There is no BMF
importer: no endpoint, no script, no migration and no `bmf` table. The only
`bmf` strings under `src/` are comments, at `AppShell.jsx:34` and
`DiscoverUnavailable.jsx:18`. `docs/bmf-load-scoping.md` is a plan for a loader,
not a loader.
**WHAT A1 ASKS, AND WHY IT COULD NOT BE EXERCISED.** It asks whether the import
rollback is a transaction or a compensating replay. That guarantee is a
client-side string, printed before the import runs and only on the `--remote`
path (`wrangler-dist/cli.js:231186`, ahead of the init call at `:231190`), which
§7 of the scoping doc already calls the most load-bearing unverified fact in the
plan (`:412`). Exercising it needs a remote import, and until the ruling the
import needed a loader that A1 was thought to gate. **R1 and R2 removed both
obstacles**: the loader is no longer gated by A1, and there is now a target
authorized to run against.
**THE TARGET IS RULED, AND IT IS NOT A THROWAWAY.** `stewardhouse-pilot` was the
only D1 database configured (`wrangler.toml:12-16`), no `preview_database_id`
appears anywhere in the tree, and the prior throwaway `bmf-window-probe` was
deleted 2026-08-19 (`docs/bmf-load-scoping.md:507`). R2 authorizes a STANDING
second database, retained as infrastructure rather than spent on one test, filed
as A114. Creating it is a remote act and is FT-run on that basis alone, per
CLAUDE.md §6.15 category (3).
**WHAT THE FOUR BANKED RUNS DO AND DO NOT ESTABLISH.** The experiment's `CREATE`
omits the PRIMARY KEY that §1 rules on EIN (`scripts/d1-window-generate.mjs:85`
against `docs/bmf-load-scoping.md:60`), so those runs could not have produced a
constraint violation, and their measured windows are LOWER BOUNDS: the ruled
table also carries indexes, whose build cost §1 measured separately (`:137`).
**This is the reasoning R2's sequence rests on**: a loader written against the
existing shape would carry a duplicate-EIN path that nothing had exercised until
the production run, which is why the sandbox and its table come first.
**CORRECTED 2026-09-07: THE LIST IS ON DISK AND IT IS TWENTY-SIX.** This line
read "**Twelve failure modes were enumerated; §4 names four and omits eight**,
including the escaping mode that §2's own script contract already names." The
escaping clause was right and is mode 7. Both counts were wrong: §4 names SIX
under its own bold leads, and a re-derivation from the tree produced twenty-six.
The enumeration is at `docs/bmf-load-scoping.md` §4, "The enumeration, derived
2026-09-07". **Cite the list, never the number.**
**AND A SINGLE RUN WOULD SETTLE NOTHING EITHER WAY**, because an import that
never began and one that rolled back perfectly leave the same observable state,
which is the void-versus-clean hazard open item 5 already records for a
neighbouring probe (`:1216-1221`).
**THE THREE ANSWERED, so none is re-litigated:** the chain order and what A1
gates (R1); the target, its permanence and its protocol (R2, R4, R5); and
whether A1 splits, which it does not.
**THE SEVEN THAT STAY OPEN, and each says so on its own entry rather than
resting on this list:** whether A1 is a question about the service or about this
load; what data fidelity an answer requires beyond the ruled table shape; what
counts as evidence that a rollback recovered; whether §4 is amended before the
loader is written or after; whether sign-in behaviour during the unavailability
window must be settled before the run; whether a sandbox result transfers to
production, filed as A116; and whether the load proceeds on accepted risk if no
experiment this project can run will close A1. **None of these is answered by
adjacency to a ruling on another.**

**WHAT 2026-09-04 CLOSED, AND WHY THE BUILD CHAIN DID NOT SHORTEN.** Three
entries closed: A18 and A20, both BLOCKING live-honesty defects on the
enterprise surface, and A66, the pilot-gate re-score. **The build chain ended
the day exactly where it started, at 16.** It fell 16 to 14 on the two BLOCKING
closures, then rose 14 to 16 when A8 moved DEBT to BLOCKING and A1 moved POST to
BLOCKING. The chain is BLOCKING minus the four counsel-gated items, so it tracks
the BLOCKING count and nothing else.
**Three closures and a chain no shorter is not a contradiction.** What the day
mostly did was RECLASSIFY: two items already open were found to be pilot-
blocking and now say so. **A shorter chain is not the same as less work, and
today is the case that proves it**: the queue got MORE honest and no easier.

**THE CAPABILITY-TO-PRODUCTION-USABLE SPREAD IS 26 UNITS, AND IT IS NOT UNBUILT
WORK. This is CONTEXT for reading the gate figures. It is deliberately NOT an
open item and must not become one.** `docs/pilot-gate-criteria.md` at
`6fb6572` scores capability 83/84 and production-usable 57/84. **The whole of
the 26-unit gap is two unset demo gates.** Advisor's 13 write endpoints and
Enterprise's 13 are built, gated as designed, and return 403 to every caller,
because no advisor row and no staff row carries a gate: verified by an FT-run
remote read on 2026-09-04, advisor gated 0 of 2 and staff gated 0 of 4.
**They are built and DARK.** Setting `$.advisor.demo_gate` and
`$.enterprise.demo_gate` would close most of that gap without a line of code,
and that designation is FT's deliberate per-institution step per
`docs/enterprise-provisioning-runbook.md` §3(e). It is never a slice, so it has
no entry here and should not be given one.

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

**A20 was CLOSED 2026-09-04** and has left this section; the remaining IDs are
not renumbered, since renumbering would break every reference to them. Its title
was "The Workshops-held tile reads "0 of 0" for an institution with no
workshops". FT ruled the value "None yet" on 2026-09-03 and the sublabel on
2026-09-04.
**WHAT CLOSED IT, VALUE:** `src/surfaces/enterprise/reports/ProgramOutputs.jsx`
names the denominator the tile already displayed as `workshopsTotal` and renders
"None yet" when it is 0. `workshopsHeld` and `workshopsScheduled` partition
`workshops` on `status === 'completed'`, so that sum is `workshops.length` on
every path; the guard and the denominator are one expression and cannot
disagree.
**WHAT CLOSED IT, SUBLABEL: FT RULED 2026-09-04 that it DROPS in that state**,
and the reason is the tile's nature rather than a page convention. This page has
TWO absence treatments, not one. The fmtRate tiles drop the sublabel where a
RATE DOES NOT EXIST. The NT tiles carry explanatory copy where a VALUE IS
UNSOURCED. Workshops held is neither: a workshop count is a count of rows, zero
is a real and correct answer, and "None yet" states it completely, so nothing is
left for a sublabel to say. That is the same distinction this entry drew to rule
out "Not tracked". Mechanism follows the fmtRate tiles: an explicit `undefined`,
gated on the same expression as the value.
**A PRIOR RULING ON THIS POINT WAS WITHDRAWN AND RE-MADE**, recorded because the
reason is now A111. The first sublabel ruling instructed the drop as "the
absence convention this page already states at the NT tiles and the fmtRate
tiles", asserting that convention as established fact. No such single convention
exists. The claim originated in the comment at `ProgramOutputs.jsx:137-140`; a
slice report repeated it by quoting the comment rather than opening the tiles;
the assistant's review turn restated it as established fact with the rotted
`:194` and `:220` citations; and the assistant then wrote it into the ruling
prompt as settled. FOUR links, none of which read the tiles, and FT ruled on the
premise in good faith. The slice STOPPED rather than build on it, and the ruling
above was re-made against the tiles.
**Whether any sibling tile takes the same treatment is still NOT ruled.** FT
ruled it a copy pass across six tiles rather than a defect, so it is
deliberately not filed.

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
Pilot: BLOCKING
Detail: `docs/bmf-load-scoping.md`, open item 1; `docs/filed-defects.md`,
"Filed: the BMF rollback path is a stated precondition on a production BMF
load".
**FT RULED 2026-09-04: POST moves to BLOCKING.** A8 is BLOCKING and A1 gates
it. POST is defined in this file as "no pilot user reaches it", and every
organization a pilot user sees will have arrived through the BMF import, so a
pilot user reaches A1 through the whole surface. **The prior POST
classification predated the Discover ruling and was not a judgement made
against it.**
**IT CLOSES BY AN FT-RUN REMOTE WRITE, NOT BY AN AGENT SLICE.** Closing it
means deliberately exercising a failure, and every `--remote` write is FT-only
per CLAUDE.md §6.10 and §6.15. An agent can prepare the exercise; it cannot run
it.
**CORRECTED 2026-09-04 (R4): THE EXERCISE HAPPENS ON THE SANDBOX.** The sentence
above read "against the real target", which R4 now forbids. Deliberate failure
induction against the live database is NOT authorized; testing happens on A114,
and the first production load runs against live at a time FT chooses.
**FJ-1 ALREADY NAMED IT THE SOLE STANDING PRECONDITION**, ruling 2026-09-02
that BMF "proceeds on the rollback path alone, which is A1". With this ruling
that sentence carries more weight than it did: A1 is now the only item between
the queue and the ingest, and the ingest is now BLOCKING.
**FT RULED 2026-09-04 (R1): A1 GATES RUNNING THE LOAD, NOT BUILDING THE
LOADER.** The order is create the sandbox, apply the ruled-table migration to
it, build the loader, test it on the sandbox, then run the production load.
**FJ-1's "sole standing precondition" is UNCHANGED IN SUBSTANCE AND NARROWER IN
SCOPE**: it is the sole precondition on the RUN. The loader build is A113 and
the sandbox A114, and this entry gates neither. The sentence above saying A1 is
"the only item between the queue and the ingest" was true under the prior
reading and is superseded by this one.
**A1 STAYS ONE FILING (ruled 2026-09-04).** Removing a false dependency is not a
split: A1's subject is a single question, and "write the loader" was never
inside it but hung off it.
**STILL UNRULED ON THIS ENTRY, AND NOT MADE RULED BY ADJACENCY:** what counts as
evidence that a rollback recovered, given that an import which never began and
one that rolled back cleanly leave the same observable state; what data fidelity
an answer requires beyond the ruled table shape; whether A1 is a question about
the service or only about this load; and whether the load proceeds on accepted
risk if no experiment this project can run will close it.
**TIER PLACEMENT CONSIDERED AND LEFT UNCHANGED 2026-09-04, TWICE.** A1 stays
alone in Tier 4, re-affirmed after the ruling above. FT has not ruled a move,
and tier placement is FT-ruled, which is the precedent A9's entry states in its
own words. Recorded so a later reader knows this was looked at rather than
missed.

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
**WHAT CLAUSE 6 GATES, relocated here from A128 before that entry closed.** The
ruling document states that the capability to produce a who-gave-to-whom table
stays UNBUILT until the posture is set — "the one place a subpoena answer could
change the schema". `migrations/0001_initial.sql:231-241` states it at the schema
level: no view, no materialized table, no admin query path joining
`gift.giver_person_id` through `person.auth_user_id`, and "The subpoena posture
decision must precede any such construct." CLAUDE.md §5.1's accepted Phase-1
boundary defers enterprise gift tracking on the same grounds, and parked **P-C**
carries it.
**A DESIGNATOR THAT DOES NOT EXIST, recorded so it is not cited again.** This
deferral was described to a 2026-09-08 pass as "P-2's D10". **`D10` does not
exist anywhere in the tree** — zero occurrences, established with a control
showing the same pipeline finds D1, D2, D5, D6, D7 and D11. The deferral is real
and the four sites above carry it; the designator is not.

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

**A66 was CLOSED 2026-09-04** and has left this section; the remaining IDs are
not renumbered, since renumbering would break every reference to them. Its
title was "The pilot gate has not been re-scored in 86 commits."
**WHAT CLOSED IT: the re-score landed in two halves on the same day, and its
blocker was discharged between them.** The capability half was written first
against `be8d01a`, deliberately leaving production-usable unreported because
§2.6 requires gate values re-verified against remote D1 and that read is FT-run
per CLAUDE.md §6.15. FT then ran it: six read-only aggregate counts over
`person`, soft-deleted excluded, all three §2.6 claims holding unchanged from
2026-08-17 (advisor gated 0 of 2, staff gated 0 of 4, ops gated 1 of 2). The
second row followed at `6fb6572` carrying both columns, capability 83/84 = 99%
and production-usable 57/84 = 68%.
**THE BLOCKER LINE WAS RIGHT AND IS WHAT CLOSED IT.** This entry said from the
start that a re-score "additionally needs an FT-run remote gate read before any
production-usable figure may be reported", and on 2026-09-04 that was narrowed
to the whole of its remaining blocker. The read happened, so nothing is left.
**TWO THINGS THE CLOSING RE-SCORE SETTLED THAT THIS ENTRY DID NOT ASK FOR.**
Individual criterion 4 was UNVERIFIED in the first row and FT ruled it MET, so
the capability figure is a number rather than a range. And FT ruled that no
replacement is built for Ruling A's lost caveat example, so
`docs/pilot-gate-criteria.md` §5.1 stands as a decision rather than as an open
defect; it returns when Discover ships, which is A8.
**The corrected clause is recorded here rather than lost with the entry:** its
Detail line read "Several Tier 2 defects above sit on routes that log scores
MET", which was written when Tier 2 held A17, A18 and A20. A18 and A20 both
closed 2026-09-04, so Tier 2 holds A17 alone.

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

**A127 | "Derek" is retired and the tree does not know it. FT ruled 2026-09-08
that the name was an ERROR and no such counsel exists or ever existed.**
Blocker: none for the correction itself; the repair is unscoped and its scoping
is a separate ruling FT has not made.
Pilot: BLOCKING
Detail: the eighteen lines enumerated below, measured at HEAD 2026-09-08.
**NO EXTERNAL COUNSEL IS RETAINED AND NONE IS IN PIPELINE.** That was already
the record — `docs/outstanding.md` states "Nothing in this repository records
counsel as retained" — but the tree simultaneously names a specific person as
the destination for counsel work, which reads as a contact that exists.
**THE SITES, MEASURED RATHER THAN RECALLED: 8 FILES, 18 LINES, 23 OCCURRENCES.**
The occurrence count exceeds the line count because two arc-history files carry
their whole content on one line, `arc-history-individual.md` holding five
occurrences on line 7 alone.
- `CLAUDE.md` — 2 lines: `:2252`, `:2283`
- `docs/advisor-persistence-schema-draft.md` — 3 lines: `:54`, `:438`, `:710`
- `docs/advisor-persistence-scoping.md` — 4 lines: `:434`, `:463`, `:484`, `:642`
- `docs/arc-history-advisor.md` — 1 line: `:7`
- `docs/arc-history-individual.md` — 1 line, 5 occurrences: `:7`
- `docs/persistence-scoping-pass.md` — 3 lines: `:121`, `:133`, `:189`
- `docs/ruling-e-deletion-retention.md` — 3 lines: `:18`, `:117`, `:127`
- `migrations/0001_initial.sql` — 1 line: `:222`
**A FIGURE THIS ENTRY CORRECTS RATHER THAN INHERITS.** An earlier pass reported
"fifteen mentions across eight files". Fifteen is the `docs/`-ONLY LINE count
across SIX files; eight is the WHOLE-TREE FILE count. The two were paired, and
neither number describes what the other counts. Corrected here by measurement.
**THREE ENTRIES ROUTE TO A PERSON WHO DOES NOT EXIST, AND ONLY TWO OF THEM ARE
COUNSEL-GATED.** Checked by resolving each entry's Detail path and grepping it:
A47 and A84 both point at files naming him three times each, and both carry
`Pilot: BLOCKING, and counsel-gated`; A46 points at the same ruling-E file and
is `Pilot: POST`. **A68 and A110 do NOT route to him** — A68's Detail file
contains zero Derek lines and A110's points at a migration. So the claim is
three ENTRIES, two of them counsel-gated, not three counsel-gated items.
**ONE SITE IS IN AN APPLIED MIGRATION AND CANNOT BE EDITED CASUALLY.**
`migrations/0001_initial.sql:222` reads "lives in application config once Derek
(or alternate counsel) confirms." That file is applied to BOTH
`stewardhouse-pilot` and `bmf-sandbox`, and wrangler tracks applied migrations
by NAME with no hash, so an edited file will not re-run and its bytes stop
matching what both databases received. **This is the R13a caution applying to a
file R13a was not written about**: a difference there is a finding to report,
not a diff to accept.
**THE REPAIR IS NOT SCOPED AND WAS DELIBERATELY NOT ATTEMPTED.** No sweep was
run, the migration was not touched, and no replacement name or phrasing is
proposed. Naming the sites is the whole of this filing.
**THE CLASSIFICATION IS INHERITED, NOT RULED.** BLOCKING comes from A47 and A84,
the two counsel-gated items whose Detail files carry the name; nothing here
rules that a naming error independently blocks pilot, and the correction is
closable by editing rather than by counsel — which is why this entry does NOT
carry the counsel-gated marker and the counsel-gated count stays four. FT may
reclassify without that being a correction.

**A128 was CLOSED 2026-09-08 and has left this section; the remaining IDs are
not renumbered, since renumbering would break every reference to them.** Its
fork is RULED: the header sentence was wrong, and the two entries whose subject
is the two counsel-gated clauses are A47 and A46.
**THE REPAIR WAS NOT THE SUBSTITUTION THE ENTRY FRAMED AS ONE OF ITS TWO
READINGS.** Swapping A46 for A84 would have made the clause mapping true while
leaving A84 unaccounted for, and would have put a fifth entry into a paragraph
that enumerates four. The paragraph was doing two jobs that do not reconcile as
one sentence, so it now names FOUR sources rather than three. A84 stays in the
roster of four; A46 stays `Pilot: POST` outside it.
**THE STANDING CONTENT WAS RELOCATED BEFORE CLOSURE**, because closing an entry
deletes it. The corrected mapping, what was measured, and why A46 is not among
the four now sit in this file's HEADER, in the two-chains paragraph, with the
original sentence quoted rather than edited away. What Clause 6 gates, and the
non-existent `D10` designator, moved onto **A46 | Ruling E Clause 6, the subpoena
posture, is unanswered** in `### Gates other work` — the entry whose subject they
are, and whose Detail line was one line long.
**A COUNT THIS ENTRY GOT WRONG ABOUT ITSELF, corrected here rather than deleted
with it.** A128 stated that "`Clause 6` occurs three times in this file".
**Verified by execution at both revisions: THREE at `a9d83ce`, SIXTEEN at
`84fc360`.** It was TRUE when written and was falsified by A128's own text,
which added thirteen.
**THAT IS THE THIRD INSTANCE OF ONE SHAPE IN THREE CONSECUTIVE COMMITS, AND THE
SHAPE IS PROPOSED FOR ITS OWN FILING RATHER THAN FILED HERE.** `c97e946` filed
A128 with three line-number citations that its own insertions invalidated;
`84fc360` repaired them; and this count was falsified by the same commit that
wrote it. **A measurement correct at the moment of writing and falsified by the
commit carrying it** is distinct from a claim that goes stale later: no
subsequent change is required, so no sweep interval catches it, and the author is
the only person positioned to notice. Whether that warrants a filing, and whether
its home is CLAUDE.md §10 beside the instrument hazards or §5.1 beside the
event-versus-state rule, is FT's call and is deliberately not decided here.

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

Every entry here EXCEPT A8 feeds the Discover surface without gating it. A8 IS
the surface, an intended capability that is not built, which is a different kind
of thing from the questions around it. The item that actually gates the load is
A1, in Tier 4.

**A114 was CLOSED 2026-09-07 and has left this section; the remaining IDs are
not renumbered, since renumbering would break every reference to them.** The
sandbox EXISTS: `bmf-sandbox`, `b52292d6-d2a9-4d53-b115-5b57322f4b58`, region
ENAM, all 21 migrations applied remotely in one invocation and closure confirmed
per CLAUDE.md §6.10 by `migrations list --remote` returning "No migrations to
apply!" with no 7403. **The standing half of what that entry carried was
relocated to CLAUDE.md §6.10 branch (c) BEFORE closure**, because closing an
entry deletes it and those warnings outlive the act of creating the database.

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

**A8 | Discover is an INTENDED CAPABILITY and it is not built. The four facets
are unbuilt and the route renders an unavailable state.**
Blocker: the BMF ingest, which is SIX STEPS: create the sandbox (A114), write
the ruled-table migration (A117), apply it to the sandbox, build the loader
(A113), test it on the sandbox, then run the production load. **A1 gates the RUN
and nothing before it**, per the 2026-09-04 ruling; A113, A114 and A117 are not
gated by A1 and are reachable today. **The prior line read "the BMF ingest,
which is A1", which equated the ingest with one of its steps** and would tell a
reader A8 is one answered question from unblocking. **It then read FIVE STEPS
until A117 was filed**, folding writing the migration into applying it.
Pilot: BLOCKING
Detail: `docs/discover-surface-spec.md`; `docs/bmf-load-scoping.md`.
**FT RULED 2026-09-04: THE CAPABILITY IS INTENDED, AND PILOT CANNOT OPEN
WITHOUT IT. Pilot moves DEBT to BLOCKING.** The reasoning: two of the three
pilot metrics run through organizations found on the platform, so a pilot with
no discovery has no path to them. The prior DEBT classification was not a
judgement that pilot could open without Discover; it predated anyone asking.
**RETITLED the same day, and the old title is quoted here rather than deleted
because it is what let this read as settled:** "The four Discover facets are
unbuilt; the page renders an explicit unavailable state." That makes the PAGE
STATE the subject and describes something finished. The subject is the
CAPABILITY.
**NO DOCUMENT IN THIS REPOSITORY RECORDS AN FT RULING TO REMOVE THE
CAPABILITY.** Verified 2026-09-04 across `docs/`, CLAUDE.md and
`docs/session-log.md`, which carries no entry on it at all. The sole ruling
text is one clause inside the commit message of `65f2a28`: "FT ruled removal
now rather than coupling the two." That is a SEQUENCING decision, taking a live
violation down rather than leaving it standing until the ingest lands, and the
clause itself names the two precedents it follows, P-5 (`eb75092`) and the
feedback removal (`fbc1a9a`).
**WHAT WAS ACTUALLY REMOVED WAS THE SCORING MECHANISM, and removing it was
correct.** `Discover.jsx:43-52` computed a weighted score, cut the catalog at
`score > 0`, and sorted descending; results were then grouped into three
evaluative buckets whose copy asserted that some organizations have "Trust you
can't buy" and that others are "doing bold work" whose growth the funder's
support helps. That is a §7 no-scoring violation and a Path B recommendation,
and the cutoff leaked besides: an unconditional National bonus cleared 7 of the
17 orgs for any cause selection with zero cause overlap. **The mechanism was
the defect. The capability was not.**
**BOTH SURROUNDING DOCUMENTS TREAT THE REBUILD AS INTENDED.**
`docs/discover-surface-spec.md` was FT-ruled 2026-08-17, the DAY BEFORE the
removal, and specifies the replacement: four combinable facets, nothing scored,
alphabetical results with the count leading. `docs/bmf-load-scoping.md` says it
outright: "`DiscoverUnavailable.jsx` becomes the fallback, not a deletion", the
route renders results once the load stamp is complete and the unavailable state
otherwise, and "the name `Discover.jsx` was deliberately left free".
**`docs/pilot-gate-criteria.md` SCORES THIS SURFACE MET ON A DELETED FILE.**
Individual criterion 4, "`discover` applies Ruling A's correct response", is MET
with evidence "Defanged `42851cd`; caveat `Discover.jsx:99,107`". That file was
deleted by `65f2a28`. The same citation is Ruling A's ONLY caveat-branch
example and one of §2.4's three reference implementations. The criterion is
therefore UNVERIFIED rather than met. That file is not edited here.
**A9 LEFT THIS BLOCKER LINE 2026-09-04, as a plain statement of fact rather
than a condition.** `docs/discover-surface-spec.md` sources every facet by name:
geography from BMF `CITY` and `STATE`, recognition era from BMF `RULING`, the
card's name and city from the same load, and total expenses from the 990 XML.
Its dependency section states that the BMF load "is the WHOLE of the v1
dependency". **Neither that document nor `docs/bmf-load-scoping.md` names the
D1 `org` table, `orgsData.js` or the 17 records as a source for the rebuilt
surface**, for the directory or for anything on an organization's profile. The
load plan meets A9's subject directly, under its heading "A new table, not the
existing `org` table", and rules the org seed's defanged fields "unrelated
work". So A9's data stays dormant, no pilot user reaches it through Discover,
and it was never a prerequisite for A8.
**A9'S OWN ENTRY AND FJ-2 ARE UNTOUCHED.** FJ-2's LEAVE AS IS ruling of
2026-09-02 stands, A9 stays OPEN in Tier 3 at Pilot POST, and the rows still
sit at rest on remote. What changed is only whether A9 gates A8.

**A10 | One BMF batch zip is malformed and exits non-zero while extracting
correctly.**
Blocker: no loader exists yet to guard. A load treating a non-zero exit as
failure would discard a complete batch.
Pilot: POST
Detail: `docs/propublica-spike-findings.md`, its note on the malformed batch.

**A113 | The BMF loader does not exist. It is the step toward A8 that produces
the most code, and no longer the first one that produces any.**
Blocker: the sandbox, A114, and the migration that creates the table, A117. Both
must land first so the loader is written against a table that already carries
the ruled `PRIMARY KEY` on `EIN` plus indexes.
**BLOCKER DISCHARGED IN SUBSTANCE 2026-09-07, and this note exists because the
line above does not say so.** A114 closed when `bmf-sandbox` was created, and
0022 is now applied to the sandbox AND to live, so **the table exists with the
ruled shape on both databases** — which is precisely what the clause above says
the blocker is for. **A113 is reachable.**
**READ THE BLOCKER AS A STATE, NOT AS AN ENTRY.** A117 remains OPEN on one
remainder, R13a regeneration, which is A113's own work; so a reader following
"Blocker: … A117" literally concludes A113 is blocked by an entry that is
waiting on A113. **It is not.** The blocker was ever the TABLE EXISTING, and it
does.
**FILED, NOT FIXED: a blocker line that names an ENTRY when what it needs is a
STATE will misread the moment that entry stays open for an unrelated reason.**
**R15b, 2026-09-07: THE FINDING STANDS AND R15 DOES NOT RESOLVE IT.** R15 removed
this instance by closing A117; it did not remove the pattern, and the line above
still names an entry rather than the state its own clause describes. **Whether to
rewrite it is NOT ruled.** The entry it names no longer exists, which is itself
the demonstration: a blocker citing an ID survives the ID.

**R13a, INHERITED FROM A117 ON ITS CLOSURE (R15, FT-ruled 2026-09-07). STATED IN
FULL, NOT AS A POINTER, because the entry it came from has been deleted.**

**THE OBLIGATION.** When this slice authors the loader's single named constant
carrying the full table definition (R13), **it REGENERATES
`migrations/0022_bmf_table.sql` from that constant.** Byte-identical output
proves the derivation retroactively; any difference is drift found on day one
rather than on load twelve.
**AMENDED 2026-09-09: THE BYTE-IDENTITY ABOVE IS STRUCTURAL, NOT FULL-FILE.**
Coverage is table shape only, across **all THREE tables the migration creates and
all FIVE indexes**, with **every construct compared AS ATTACHED TO ITS NAMED
OBJECT** — columns by name, type and order; PRIMARY KEY; NOT NULL; CHECK
constraints; foreign keys with their referential actions; and indexes by name, by
columns, and by the table they are on — never comment text, alignment whitespace
or prose. **A construct matching in shape but attached to a different object does
not satisfy the comparison.** **"Proves the derivation retroactively" DOES NOT
SURVIVE that and is not owed by this slice**; "drift found on day one" does,
intact. Full ruling, its three corrections read as one progression, and a surfaced
gap between the wide scope and R13's single-constant wording:
`docs/bmf-load-scoping.md` §15, R31, beside R13a.

**R15c: THE BYTE-IDENTITY REFERENCE IS THE TRACKED FILE
`migrations/0022_bmf_table.sql`, NOT A117's DDL BLOCK.** This is deliberate and
it is what made A117 safe to close: **the comparison target survives the entry's
deletion because it is a tracked file.** Had the reference been the proposal
block inside A117, closing that entry would have deleted it and R13a would have
become unverifiable. **A regenerating reader compares against the file, and the
absence of A117 does not matter.**

**WHY IT SITS HERE AND NOT WHERE IT WAS WRITTEN (R15a).** A117 could not perform
R13a under any circumstances — the constant does not exist and building it is
this slice. **Keeping an entry open for an obligation it cannot discharge is what
created the apparent circle**, making two entries read as waiting on each other
when neither was.

**CAUTION ON REGENERATING: THE FILE HAS BEEN APPLIED to both `bmf-sandbox` and
`stewardhouse-pilot`.** Wrangler tracks applied migrations by NAME, not by hash,
so a regenerated file will NOT re-run, and if its bytes differ the file stops
matching what both databases received. **A difference is therefore a finding to
report, not a diff to accept**, and the applied artifact is the thing the
constant must be made to reproduce.

**KNOWN STALE CONTENT IN THAT FILE, so a regeneration is not surprised by it.**
`migrations/0022_bmf_table.sql:147` reads "D1 REMOTE FK ENFORCEMENT IS UNVERIFIED
(CLAUDE.md §10); local is verified". **Remote enforcement was verified on
`bmf-sandbox` 2026-09-07** and §10 records the closure. The comment was left
deliberately, because an applied migration is a record of what ran. `:11` also
names the A117 entry it was extracted from, which no longer exists; that is a
provenance statement in the past tense and remains true of the extraction.

**D5, INHERITED: THE RULED SHAPE LIVES IN THREE PLACES AND THEY MUST AGREE.**
(1) `migrations/0022_bmf_table.sql`, the applied artifact and the R15c reference;
(2) the aside DDL this slice builds on EVERY run, because SQLite indexes travel
with a table through a rename and the swap renames an aside into place, so the
loader creates the index set every time; (3)
`scripts/d1-window-verify-import.mjs:26`, which carries its own `CREATE TABLE
bmf` with NO primary key and NO indexes. **The third is banked experiment residue
and is left alone by ruling** — §5.2 already records those runs as lower bounds
for exactly that reason — **but a reader grepping `CREATE TABLE bmf` gets three
hits and must know which is authoritative.** Under R13 the loader's constant is,
and (1) derives from it.
Pilot: BLOCKING
Detail: `docs/bmf-load-scoping.md`, §2 for the script shape, §1 for the table,
§4 for the failure modes.
**FT RULED 2026-09-04 (R1): NOT GATED BY A1.** A1 gates running the production
load, not writing the loader, so this entry is reachable now.
**IT IS NO LONGER THE FIRST STEP THAT PRODUCES CODE.** This line read "It is the
first step of the five in A8's blocker line that produces code" until A117 was
filed the same day. Authoring the migration is code and comes before the loader.
**FAILURE HANDLING IS IN SCOPE FOR THIS SLICE, NOT DEFERRED (R3).** Recovery is
restart-from-the-top, consistent with the aside-swap shape and with §4's finding
that this project has no resumable write and should not invent one.
**THE STAMP TABLE RIDES THIS SLICE, ruled 2026-09-04, and is NOT a separate
entry.** §1 rules a stamp table and nothing implements it. Completion is written
LAST and on success only, so a finished load and a load that stopped partway are
distinguishable. **The reasoning, recorded because it is why this is not its own
entry:** a loader that cannot report whether it finished ships the quiet-lie
failure this project rules against, and separating the two invites shipping the
loader without it.
**NOT SCOPED. A ruling ends the rule step only**, and this build has had no
scope pass. **CORRECTED 2026-09-07:** this read "Twelve failure modes are
enumerated in the 2026-09-04 pass and §4 names four of them, so the scope pass
inherits eight the doc does not carry." Nothing was enumerated anywhere; §4 names
six, not four; and the re-derivation found twenty-six. The scope pass inherits
the LIST at `docs/bmf-load-scoping.md` §4, and the three of them no loader can
detect (11, 19, and the empty-generation half of 20) are what it must weigh.
**AN INPUT THE SCOPE PASS MUST WEIGH, RULED 2026-09-07 (Q7): NOTHING IN THIS
PROJECT ALERTS ON A BAD LOAD.** There is no scheduled execution of any kind, so
a load that completes and is WRONG is discoverable only by someone looking. That
raises the value of the loader verifying its own result BEFORE completing the
swap, the swap being the point after which the previous generation is gone.
**THIS IS AN INPUT, NOT THE ANSWER.** How a wrong load gets detected is UNRULED
and is deliberately not settled here. Self-verification is one candidate among
others, and the scope pass must WEIGH it rather than inherit it as decided.
**THE CONNECTION TO A94 IS DRAWN HERE BECAUSE NOTHING ELSE DRAWS IT.** A94
records the same absence on the auth side: `auth_send_log` is written and
nothing reads it, so a send failure is discoverable only by a deliberate query
someone thinks to run. **Same shape, different table, and neither entry pointed
at the other until now** — a durable record that no process observes. A loader
that writes a stamp nothing reads would be the third instance of it.
**RECOVERY IS NOT A SEPARATE ENTRY. IT IS THIS SLICE, ruled 2026-09-07 (R6-R9).**
Twelve rulings landed on the LOADER rather than on a separate recovery path, so
the work holds a sequence position for the first time and that position is INSIDE
this entry. **The reasoning is the one already recorded above for the stamp
table**: a loader whose swap can leave production wrong, with no retained copy and
no check that would have refused, ships the quiet-lie failure this project rules
against, and separating the two invites shipping the loader without them. **A
separate recovery entry would gate nothing this entry does not already gate.**
**WHAT THE SLICE NOW OWES, one line each. Full text and reasoning:
`docs/bmf-load-scoping.md` §15.**
- **R6** the swap RETAINS rather than drops: live is renamed to a dated name and
  the aside renamed into place. Undo is two metadata renames, no data movement and
  no outage. An exported `.sql` was REFUSED as the artifact.
- **R6a** the undo file is itself a remote `d1 execute --file` and inherits A1's
  unverified atomicity, so it must be SAFE TO RERUN: target names checked first,
  so a partial application is re-drivable rather than a third ambiguous state.
- **R7** THREE generations retained. Each load replaces the previous retained
  copy, so cost is flat at roughly 303 MB per generation against a 10 GB ceiling.
- **R8** the loader's PRE-SWAP checks against the aside table GATE the swap: row
  count in band, distinct EIN equal to row count, non-null on the four
  nationally-non-null fields, null rate in band on the two nullable ones, and a
  TREND comparison against retained generations rather than a single prior. Any
  failure means NO SWAP, the aside left named and stamped failed, live untouched.
- **R8a** NO OVERRIDE FLAG. Bands change only by editing the loader, committing
  and rerunning. A wrong block costs investigate-and-rerun with live never
  touched; a wrongly-permitted swap puts a bad table in production that nothing
  else would catch. The two costs are not symmetric.
- **R8b** a POST-SWAP assertion is required as well: live row count matches what
  was just verified, and the dated table exists under the expected name. Nothing
  currently validates the swap operation itself.
- **R8c** PRUNING folds into the loader, dropping the oldest beyond three and only
  AFTER a verified-good swap. Retention becomes mechanism rather than discipline.
- **R8d** PROVENANCE beside every hardcoded measurement: the null-rate figures
  came from one extract at one time, so source and date sit next to the constant.
  Same shape as A111.
- **R8e** FIRST-RUN behaviour stated explicitly: the trend check has no baseline
  until roughly the fourth load, so what runs on loads one through three is
  defined rather than discovered.
- **R8f** NO MONITORING SURFACE until Discover exists. Nothing reads the table, so
  the loader's checks plus the stamp are the COMPLETE detection story for now.
- **R9** the STAMP CARRIES CHECK RESULTS, not a boolean, and this slice proposes
  the amended table shape. **It AMENDS a ruled design** rather than filling in an
  implementation detail: §1 rules completion written last on success only, which
  separates finished from interrupted and not correct from incorrect.
**TWO EMISSION CONSTRAINTS ALSO BIND THIS SLICE, AND THIS ENTRY POINTS AT THEM
RATHER THAN HOUSING THEM (FT-ruled 2026-09-08).** Both were surfaced by the
2026-09-08 scope pass, both close the moment the loader is built correctly, and
neither is independent work — so neither is a standalone entry. **They are NOT
housed here either**, on §2's own fuse reasoning: this entry CLOSES when the
loader exists, which is exactly when both start mattering on every subsequent
load, and a requirement recorded only in the artifact that disappears at first
compliance is a requirement with a fuse on it. The evidence lives in the durable
sections beside the rules it qualifies.
- **How `ein` is kept off any numeric emission path**, which R29 does not cover
  because R29 rules the null path only: `docs/bmf-load-scoping.md` §2, inside the
  EIN quoting HARD REQUIREMENT.
- **The empty-string branch precedes numeric CONVERSION**, `Number('')` being `0`
  rather than `NaN`: `docs/bmf-load-scoping.md` §1, beside "Absent must stay
  distinguishable from zero".
**A READER MOVING EITHER ONE BACK ONTO THIS ENTRY WOULD BE RE-ARMING THE FUSE**,
which is why the ground is stated here and not only there.
**STILL UNRULED, and none of it blocks this entry:** whether a pre-load export is
acceptable given it is itself an availability event; whether §9's Time Travel
disqualification covers only BMF swaps or the database's disaster-recovery story
generally; whether sandbox-before-production ordering becomes a rule and what
enforces it; and **whether the sandbox's existence reopens §13's option (b)**,
which was one of the eight open questions on 2026-09-04 and was absent from the
2026-09-07 list as first delivered. **FT ruled the same day that it STAYS OPEN**,
neither withdrawn nor resolved, so **the unruled set is FOUR, not three.**
**A SCOPE PASS RAN 2026-09-07, READ-ONLY. It did not authorize a build and R10
does not either**: R10 unblocks a RULING, not a build, and slice 1's boundary is
itself unruled. What the pass established is below; the rulings above remain
inputs to a build rather than a substitute for one.
**THE INDEX DDL APPEARS IN BOTH THIS ENTRY AND A117, AND THEY MUST AGREE.**
Recorded nowhere before the pass. SQLite indexes travel with a table through a
rename, and the swap renames an ASIDE into place, so **the loader creates the
indexes on the aside on EVERY RUN.** A117 is therefore not the only place the
ruled set is written. Either both carry identical DDL or one derives it from the
other, and nothing decides which.
**R8-2 AND R8-3 ARE BOTH TAUTOLOGIES AS SPECIFIED, established by execution
rather than argued.** With the PK declared at `CREATE` (R10b), a duplicate `EIN`
is rejected at INSERT with `UNIQUE constraint failed`; the same run's CONTROL
showed a NULL in a `NOT NULL` column rejected identically with
`NOT NULL constraint failed`. **R10a names only R8-2; the control extends it to
R8-3.** Both checks therefore run against an aside that could not exist if they
would fail. **They can only be made able to fail by reframing them as
`sqlite_master` assertions that the constraints EXIST**, which matters because
the sole existing artifact, `scripts/d1-window-generate.mjs:85`, declares
neither.
**WHAT THE PASS FOUND THAT IS NOT A RULING, in one line each.** The twelve
failure modes are asserted three times in this file and **enumerated nowhere on
disk**, so a build inherits a count without a list. **CLOSED 2026-09-07: the
enumeration is at `docs/bmf-load-scoping.md` §4 and it is TWENTY-SIX, re-derived
from the tree rather than recovered.** The finding above is kept as the record of
why the list exists; twelve had no referent, so it was never wrong, only
uncheckable. The only quote-aware CSV
work in the tree is absent: `readRosterFile.js` is browser-only, capped at 10 MB
against a 48.6 MB first file, and has **zero** quote handling against a control
of five `export` hits — while §5 anticipates exactly that bug, six
comma-carrying names in 278,014. `escapeSql` exists in both precedents but
would throw on the two nullable columns. `d1-window-generate.mjs` already
carries byte-accurate chunking, a backpressure-aware streaming write and an
`aside-swap` DDL mode, but its rows are synthetic, it declares no key or index,
and its DDL uses the `DROP` that **R6 now forbids**.
**STILL UNRULED, SIX, and none of them blocks the ruling above.** This read SEVEN
and carried "whether the twelve failure modes get enumerated on disk" as its
fourth item; that item is CLOSED, the enumeration having landed in
`docs/bmf-load-scoping.md` §4 on 2026-09-07, so the count is SIX and the closure
is recorded here rather than the item being deleted silently. The six: whether
R8-2 and R8-3 stay data counts or become `sqlite_master` assertions; what "trend"
means numerically in R8-5 and what runs on loads one through three; whether §5's
EXACT null counts or R8-4's BAND governs a recurring load, since only one can
survive a file the IRS regenerates; where downloaded extracts live and whether
they are cached,
which `.gitignore` does not currently cover; whether credential staleness
mid-import stays unhandled as §4 records it; and whether the pass's proposed
slice-1 boundary is right.
**ALL SIX RULED 2026-09-07 AS R16 THROUGH R21. THE COUNT IS NOW ZERO**, and the
list above is kept rather than deleted so the mapping is checkable: R16 the
constraint assertions, R17 the trend, R18 the exact counts as provenance, R19 the
cache, R20 the pre-flight, R21 the slice-1 boundary. Full text at
`docs/bmf-load-scoping.md` §15.
**WHAT THAT LEAVES OPEN ON THIS ENTRY IS ONE THING, AND THE ENTRY ALREADY NAMES
IT:** "**NOT SCOPED. A ruling ends the rule step only**, and this build has had
no scope pass." **That is still true.** Six rulings end the rule step; the scope
step has not run, and six rulings do not authorize a slice.
**SO THE ENTRY'S STATE IS: UNBLOCKED, FULLY RULED, NOT SCOPED.** Its blocker is
discharged in substance — the sandbox exists and the table exists with the ruled
shape on both databases — and nothing in the rule step remains.
**TWO ITEMS ARE NOW OPEN THAT WERE NOT BEFORE, and neither blocks.** The two
UNMEASURED BANDS, R17's ±10% trend band and R8-4's null-rate band, are revisited
TOGETHER once three or four real extracts exist; neither should be tuned alone.
And **R17c's GAP**: the trend check catches a halved file and misses a small
systematic drop, roughly 78,000 organizations at 4%, which is the failure most
likely to occur.
**R21a BINDS THE SCOPE PASS WHEN IT RUNS: slice 1's definition of done is written
BEFORE it is built.** Its output is a roughly 152 MB gitignored artifact that goes
nowhere until slice 2 exists, so done is a file on disk and a set of numbers
matching, and the proof includes a row-level check on a quoted EIN carrying a
leading zero (R21b), not only the distributional figures.
**ONE CODE CHANGE IS OWED BY THE BUILD AND IS NOT MADE HERE:** the `.gitignore`
line for `.bmf-cache/`, the root cache path ruled under R19.
**THE SCOPE PASS RAN 2026-09-07 AND ITS EIGHT QUESTIONS ARE ALL RULED AS R22
THROUGH R29.** Full text at `docs/bmf-load-scoping.md` §15, with R22, R23, R26,
R28 and R29 also recorded in §5, §3 and §2 beside the text each governs. **The
entry is still NOT BUILT and no slice is open**; what has changed is that the
scope step is now done as well as the rule step.
**THE ONE THAT CHANGED THE DEFINITION OF DONE: R22.** The 2026-08 extract is NOT
OBTAINABLE — `eo2` has no archived snapshot at all, and the other three archive
to three different months — so slice 1 proves against a FRESH download and the
proof is the EXTRACT-INDEPENDENT checks, not §5's four absolute figures. **The
pass had flagged this as a possible tension between R18 and R21; the evidence
settled it.**
**A THIRD OPEN ITEM JOINS THE TWO ALREADY RECORDED ABOVE, and it is not a
ruling:** the ±10% trend band is **roughly two orders of magnitude too loose** —
real month-over-month movement is about 0.2%, roughly 3,800 rows, against a band
tolerating about 196,000. **This is the FIRST ACTUAL DATA on a figure R17a called
a reasoned guess**, and it sharpens R17c's objection rather than resolving it.
**The band is NOT re-tuned**, because R17a rules it revisited together with
R8-4's band once three or four real extracts exist, and one derived comparison is
not that.
**SLICE 1 IS COMPLETE AND BANKED ON `main` 2026-09-08. THIS ENTRY STAYS OPEN:
slices 2 and 3 do not exist.** Three scripts, rebased onto main and
fast-forwarded, so all four slice commits sit on `main` with the docs commit
beneath them.
- `scripts/bmf-fetch.mjs` — acquisition and freezing. Owns the network and the
  cache; does not parse.
- `scripts/bmf-parse.mjs` — parse and emit. Reads the cache only; creates no
  table and contacts no database.
- `scripts/bmf-verify-slice1.mjs` — load and assert. Creates a minimal in-memory
  scratch table under R27 and touches no D1.
**ALL FIFTEEN DEFINITION-OF-DONE ITEMS ARE SATISFIED, one with a stated limit.**
Item 9's subject is the PARSE, and a malformed record produced no row, so the
verifier cannot re-derive it from the loaded table. What it establishes instead
is that nothing was lost between emission and storage — 5,805 of 5,805
statements executed and 1,964,958 rows loaded against 1,964,958 emitted — and it
reports the malformed count FROM THE SIDECAR, labelled as such in both the code
and the output. That figure rests on the parser's own accounting.
**THE EMITTED ARTIFACT: `scripts/bmf-aside.tmp.sql`, 173,873,096 BYTES IN 5,805
STATEMENTS**, largest 29,998 B against the 100,000-byte ceiling, every statement
`INSERT INTO bmf_aside` and never `bmf` (R24). Gitignored at `.gitignore:18`;
the sidecar beside it at `:26`. Measured against the 2026-09-07 extract:
1,964,958 rows equal to distinct EINs, zero duplicates, zero malformed, zero
null `RULING`, and a `REVENUE_AMT` sum of 4,317,294,050,545 over 1,391,216 rows
— a figure §5 records as never measured and forbids asserting from the plan.
**R21a IS MET IN ITS OWN TERMS**, "done is a file on disk and a set of numbers
matching — not a working feature": the file is on disk, and the numbers the
verifier derives independently by SQL agree with what the parser reported.
**SLICE 2 IS NOT STARTED, AND THIS ENTRY IS NOT SCOPED BEYOND SLICE 1.** What it
inherits is the artifact and sidecar above, plus FOUR PROPERTIES THE SCRATCH
TABLE DELIBERATELY DID NOT OBSERVE, each named in the verifier's own output:
R10b's duplicate-`ein` rejection at INSERT, R16's `aside_schema_pk` and
`aside_schema_notnull`, and R13b's post-swap index names. See A125 for the two
things that remain open on the aside itself.

**A116 | Whether a sandbox result transfers to production.**
Blocker: unruled. FT has not ruled it, and it is recorded as open rather than
inferred from the rulings around it.
Pilot: POST
Detail: CLAUDE.md §10, the bound-parameter filing and the foreign-key filing,
which are the same shape.
**R2 AND R4 MAKE THE SANDBOX THE ENTIRE TEST VENUE.** R4 forbids deliberate
failure induction against live, so the whole test programme for the loader and
for A1 runs somewhere that is not production. **R5 closes SCHEMA drift only**;
it says nothing about runtime behaviour, and runtime behaviour is exactly what
A1 asks about.
**THIS IS THE §10 "CORRECT MEASUREMENT OF THE WRONG TARGET" PATTERN AIMED AT THE
TEST PLAN ITSELF.** The two filings there reached opposite dispositions on the
same shape: a local foreign-key probe was accepted as evidence about local and
refused as evidence about remote. Nothing yet says which disposition a sandbox
result inherits.
**UNRULED, AND THE PILOT LINE IS PART OF WHAT IS UNRULED.** POST is recorded
because no pilot user reaches this question; whether it should rise is open,
since it does not gate the run but does bear on what the run's result is worth.
**TWO DATA POINTS EXIST AS OF 2026-09-07, AND THIS ENTRY STAYS OPEN.** They are
recorded as EVIDENCE, not as an answer, and they are of different kinds, which is
why neither settles the question and why both are worth having.
**(1) SCHEMA PARITY.** Migration 0022 applied to `bmf-sandbox` produced eleven
objects matching, object for object, what D6 had measured against a local
`VACUUM INTO` copy of the 21-migration store.
**(2) RUNTIME-BEHAVIOUR PARITY.** Remote D1 on the sandbox REJECTED an orphan
child INSERT with `FOREIGN KEY constraint failed … [code: 7500]`, closing the
CLAUDE.md §10 foreign-key filing's remote half. **This is the kind of evidence
the entry says it lacks:** §10's two filings reached opposite dispositions on the
same shape, and runtime behaviour — not schema — is what A1 asks about.
**WHY THEY DO NOT CLOSE IT.** Both are observations of `bmf-sandbox`, and the
question is whether a sandbox result TRANSFERS. **Two agreements do not establish
a general rule**, and nothing here says which disposition a sandbox result
inherits when it disagrees. FT has not ruled it, and it is not inferred from the
rulings around it.
**(3) IDENTICAL WORK, added 2026-09-07 when 0022 reached live.** Both applies
executed **9 commands**, so the sandbox and production received byte-identical
work from the same file. **It is the weakest of the three and is recorded as
such:** it establishes that the same input produced the same command count, not
that the two engines would agree where they could differ. **Three agreements
still do not answer whether a result TRANSFERS**, because every one of them is a
case where the two AGREED, and the question is what to do when they do not. **The
entry stays open.**

**A117 was CLOSED 2026-09-07 by R15 and has left this section; the remaining IDs
are not renumbered, since renumbering would break every reference to them.** The
BMF table migration is WRITTEN and APPLIED to `bmf-sandbox` and to
`stewardhouse-pilot`, both at 22. **Its one standing remainder, R13a
regeneration, MOVED TO A113**, which is the slice that can discharge it: A117
could not perform R13a under any circumstances, and holding an obligation an
entry cannot discharge is what made A113 and A117 read as waiting on each other.
**The standing content was relocated BEFORE closure**, because closing an entry
deletes it: the seven stamp fields and the R12e cut test to
`docs/bmf-load-scoping.md` §1; R6b's pointer and two others repointed at
`migrations/0022_bmf_table.sql`, a tracked file rather than a queue entry;
`migrations_pattern` and the R11c–R11e reasoning to CLAUDE.md §6.10; and R13a,
R15c and D5 to A113 in full. **The DDL block went with the entry by design** —
`migrations/0022_bmf_table.sql` is byte-identical to it and is the R15c
comparison target. **Its title was corrected three times in one day**, reading
"is not written", then "APPLIED NOWHERE", then "APPLIED TO THE SANDBOX, NOT TO
LIVE"; each was true when written, which is the system working rather than a
record that kept being wrong.

**A123 was CLOSED 2026-09-08 and has left this section; the remaining IDs are
not renumbered, since renumbering would break every reference to them.** Its
question — which assertion form R21b takes — is answered, implemented and proven
in the verifier's own self-test, which refuses the whole run if any instrument
cannot discriminate. **The standing content was relocated BEFORE closure**,
because closing an entry deletes it: the affinity floor and the reason `typeof`
is excluded now sit in `docs/bmf-load-scoping.md` beside R21b, the ruling they
answer, which until then recorded only the question. They also live in
`scripts/bmf-verify-slice1.mjs`, but a code docblock is not where a reader looks
for a ruling, which is why the doc got them too.

**A124 | Slice 1's definition of done does not exist, and a session-open summary
asserted it did.**
Blocker: R21a requires it written BEFORE the slice is built. Nobody has written
it.
Pilot: DEBT
Detail: `docs/bmf-load-scoping.md` §15 R21a and R22; A113 above.
**R21a: "SLICE 1's DEFINITION OF DONE IS WRITTEN BEFORE IT IS BUILT, or it
drifts."**
**IT IS NOT WRITTEN.** Verified at HEAD 2026-09-08: `git grep -in 'definition of
done'` returns three hits and none is a list — R21a's own heading, A113 restating
it, and A113's note that R22 changed it. A113 carries ZERO numbered items; its
only enumerated block is eleven bullets headed "WHAT THE SLICE NOW OWES", which
are R6 through R9 and govern the loader as a whole.
**A 2026-09-08 SESSION-OPEN MESSAGE ASSERTED OTHERWISE, TWICE.** It asserted A113
carried a definition of done of SEVENTEEN items in FOUR groups, and asserted A113
was SCOPED. Neither holds. A113's own closing state reads "**SO THE ENTRY'S STATE
IS: UNBLOCKED, FULLY RULED, NOT SCOPED.**"
**CAUGHT AT THE FIRST LINK, AND THAT IS THE FILING.** The standing instruction to
verify at HEAD by execution rather than from a summary is what caught it: the
assertion was checked against the tree before any work rested on it, and it
failed on the first check. **A111 is the neighbour** — a false claim propagating
through four links until it reached a ruling, recorded at CLAUDE.md §5.1 — and
this is the same claim shape stopped at link one.
**WHY IT IS FILED AT ALL, GIVEN NOTHING WAS ACTED ON.** The count and the
grouping were specific enough to be usable, and a session not told to verify at
HEAD would have had no reason to doubt them. **What made the difference was an
instruction, not a document**, and instructions do not persist across sessions
the way filings do.
**RESOLVED IN SUBSTANCE 2026-09-08: THE DEFINITION OF DONE NOW EXISTS, WRITTEN
BEFORE THE BUILD AS R21a REQUIRES.** It has FIFTEEN items. It was produced by
the 2026-09-08 scope pass and ratified by FT before any of the three scripts was
written, so R21a's "or it drifts" condition was met in order rather than
retroactively.
**WHERE IT LIVES, and this is the weak point rather than the achievement.** The
fifteen items were ruled in conversation and are recorded in the four slice
commit messages on `main`, which map every item to the script that satisfies it.
**They are not written out as a list in any tracked document.** That is the
count-is-not-a-list shape one step short of the filing: a reader can reconstruct
the fifteen from the commit bodies, and nothing in `docs/` enumerates them.
**CORRECTED 2026-09-08: THE PARAGRAPH ABOVE CARRIES TWO FALSE CLAIMS, BOTH
DISPROVEN BY EXECUTION.** They are preserved rather than edited, the treatment
R29 gave §2's `escapeSql` sentence, so the correction is visible where the false
claims sit.
**FALSE, FIRST: "a reader can reconstruct the fifteen from the commit bodies."**
They cannot. **FIVE ARE UNRECOVERABLE — items 3, 4, 5, 11 and 12 — each
occurring exactly ONCE across all four bodies, and only inside a bare list**:
"Satisfies definition-of-done items 3, 4, 5, 9, 10, 11, 12 and 13". No label, no
prose, nothing anywhere tying those numbers to a concept. The CONCEPTS are
present in the bodies — the sidecar, the emitted SQL, the stdout summary, the
per-file sum, zero null `RULING` are all discussed — but **the mapping from
number to concept is absent**, and supplying it would be inference rather than
recovery.
**FALSE, SECOND: the four commit messages "map every item to the script that
satisfies it."** Only `d4b24de` does, and only for its own five, which it labels
parenthetically. **`cd25359` and `aaf2c46` name their items by NUMBER ONLY.**
**HOW MUCH IS ACTUALLY RECOVERABLE, measured:** five items carry a verbatim
label; five more are describable from prose without ever being stated as
requirements, items 9 and 10 being the weakest since they share one sentence
that implies both subjects and states neither; and five are recoverable from no
tracked artifact at all.
**THE UNDERSTATEMENT WAS EXPOSED ONLY BY ATTEMPTING TO USE THE RECORD.** Nothing
about reading this entry revealed it. It surfaced when a pass was asked to
relocate the list and had to extract it, at which point a third of it was simply
not there. **This is A126's thesis holding ONE LEVEL DEEPER THAN A126 STATED
IT**: the entry filed to record the durability problem understated the problem,
in the same way and for the same reason.
**THE FIVE WERE SUPPLIED BY FT FROM THE RATIFICATION** and are now written into
`docs/bmf-load-scoping.md` §15 beside R21a, tagged with that provenance so the
unevenness stays visible.
**WHETHER TO CLOSE THIS ENTRY IS FT's CALL AND IS NOT TAKEN HERE.** Its stated
subject — the definition of done does not exist — is discharged. What is not
discharged is a durable home for the list, and closing the entry would delete
the only place that says so.
**A124 STAYS OPEN 2026-09-08, AND THE REASON HAS CHANGED. It is no longer open
on the EXISTENCE question; it is open on the DURABILITY one, which is now filed
separately as A126.** The definition of done exists and was written before the
build as R21a requires. What this entry exists to prevent — a specific,
usable-looking claim that nobody can check at HEAD — is live again in a new
form, and closing this entry would delete the only record saying the two are the
same shape.
**THE SHAPE, stated once so A126 does not have to restate it.** The original
failure was a session-open summary asserting a definition of done that did not
exist, caught at the first link because a standing instruction said to verify at
HEAD. The successor failure is a definition of done that DOES exist and cannot
be verified at HEAD by anyone who does not already know four commit SHAs. **In
both cases the claim is specific enough to be acted on and not reachable by
someone trying to check it.** A126 carries the current instance; this entry
carries why it is not a new kind of problem.

**A125 | `bmf_aside` has no DDL anywhere in the tree, and three rulings depend on
it existing.**
Blocker: the slice that authors R13's loader constant. **A BUILD, NOT A RULING.**
RULED 2026-09-09 NOT RULABLE AHEAD OF SLICE 2's BOUNDARY: every candidate answer
names a slice, and nothing in the tree bounds slice 2.
**AMENDED 2026-09-09. The blocker line previously read "a scope pass bounding
slice 2, which A113 above records as not made", quoted rather than deleted so the
change is visible where the stale claim sat.** A scope pass now EXISTS, at
`docs/slice-2-scope-pass.md`, and it does not discharge this: it proposes four
candidate boundaries, expresses no preference, and rules none, so it does not by
itself bound slice 2. **What closes this entry is a BUILD**, which this entry's
own closing note already named — "the slice that authors the loader constant
meets R31's three candidate shapes, takes one, and fires R13a's byte-identity
comparison" — so the blocker line is brought into agreement with that note rather
than changed in substance. **STAYS OPEN AND STAYS BLOCKING; no entry changed
state and no count moves.**
Pilot: BLOCKING
Detail: `docs/bmf-load-scoping.md` §15 R13, R16a, R24 and R27; A113's D5 item (2)
above.
**VERIFIED AT HEAD 2026-09-08.** `git grep -n 'bmf_aside'` returns six hits: four
in `docs/bmf-load-scoping.md`, one COMMENT at `migrations/0022_bmf_table.sql:111`,
and one code line — `scripts/d1-window-generate.mjs:36`,
`const LIVE = 'bmf', ASIDE = 'bmf_aside';`. **No `CREATE TABLE bmf_aside`
exists.**
**SUPERSEDED 2026-09-09 BY FT RULING. MARKED, NOT EDITED, NOT DELETED.** The
paragraph immediately above is left exactly as written. **FT's reasoning for
marking rather than removing: a prior wrong correction could only be caught
BECAUSE it stayed on the record.** A half that is deleted is a half that cannot
be audited.
**WHAT IS SUPERSEDED, AND BY WHAT MEASUREMENT. Stated here IN FULL rather than as
a pointer, because the entry that measured it — A131 — closed in the same commit,
and closing deletes it.**
- **The six-hit count.** The stated command never produced the stated number: at
  `23ed8d0`, the commit that introduced the sentence, it returned TWELVE lines,
  and returned exactly the six enumerated only once `docs/outstanding.md` itself
  was excluded. **Both figures verify at that revision. The enumeration was right
  and the command was not.**
  **THE FIGURE A131 GAVE FOR "HEAD" WAS ITSELF WRONG, AND IS CORRECTED HERE
  RATHER THAN CARRIED FORWARD.** It read "21 lines across 6 files", with
  `docs/outstanding.md` at 8. **That is the census at `abb2f92`, the PARENT of
  the commit that wrote it**, where it verifies exactly. At `c8f2988`, the commit
  itself, it was 29 lines across 6 files with `docs/outstanding.md` at 16:
  **A131's own text carried the token six times and that commit's arithmetic
  block twice more, doubling the file's share.** At `f3226eb` it was 30 across
  SEVEN, `docs/session-log.md` having joined. **A131 never measured a seventh
  file because none existed when it looked.**
  **ITS CONTROL FAILED THE SAME WAY, WHICH IS THE SHARPER HALF.** A131 asserted
  that a deliberately-misspelt variant of the token returned zero files. **True
  at `abb2f92`, and FALSE from `c8f2988` onward, because A131 WROTE THAT VARIANT
  INTO THIS FILE and so turned its own negative control into a true positive.**
  The variant is named here in words and deliberately not reproduced, for exactly
  that reason. CLAUDE.md §10 files both halves — a measurement falsified by the
  commit carrying it, and a control that is not a control until verified negative.
  **NO CURRENT-REVISION FIGURE IS GIVEN HERE**, because any text discussing this
  token changes the count, and this block is such text.
- **"No `CREATE TABLE bmf_aside` exists."** True at `23ed8d0` for executable
  code, zero files under `scripts/` or `migrations/`; FALSE at HEAD, where
  `scripts/bmf-verify-slice1.mjs` carries one.
- **"one code line" at `scripts/d1-window-generate.mjs:36`.** EIGHT code lines
  under `scripts/` now carry `bmf_aside`: `bmf-parse.mjs:76`,
  `bmf-verify-slice1.mjs` at `:41`, `:45`, `:71`, `:95`, `:101` and `:106`, and
  `d1-window-generate.mjs:36`.
**THE DEFECT THIS CLOSES IS INTERNAL TO THIS ENTRY.** Its later half names
`scripts/bmf-verify-slice1.mjs` as "the fourth" site, so until this marker the
entry asserted both that no aside CREATE TABLE exists and that one does. **The
marker is what stops the two halves contradicting each other.** Both still-open
items below are unaffected and stand.
**A CORRECTION OF A CORRECTION, CARRIED FORWARD BECAUSE THE SUPERSESSION RULING
RESTS ON IT.** A 2026-09-08 pass reported this entry's FOUR-SITE claim as stale,
on the ground that `scripts/d1-window-verify-import.mjs:26` creates `bmf` rather
than `bmf_aside`. **That reading was wrong and this entry was right**: the
four-site claim is a D5 SHAPE-SITE census, not a `bmf_aside` census, and this
entry says in its own words that `migrations/0022_bmf_table.sql:55` "creates
`bmf`". All four verify at HEAD, each read by line — `0022:55` is "CREATE TABLE
bmf ("; `d1-window-generate.mjs:85` is the interpolated aside DDL;
`d1-window-verify-import.mjs:26` is "CREATE TABLE bmf ("; and
`bmf-verify-slice1.mjs:106` is the literal aside DDL. **That four is a DIFFERENT
four from the six-hit census above and must not be reconciled with it.**
**THE CENSUS HAZARD IS ALREADY FILED AND IS NOT REPEATED HERE**: a literal
`CREATE TABLE bmf_aside` search is blind to `scripts/d1-window-generate.mjs`,
whose DDL is interpolated. CLAUDE.md §10 carries it as the literal-versus-
interpolated format variant.
**THREE RULINGS MEET AT IT.** R24 rules the emitted INSERTs target `bmf_aside`.
R27 permits an in-memory `node:sqlite` check and calls it "the cheapest available
proof that the emitted file is loadable at all". **A load requires the target to
exist**, and nothing says what creates it or with what shape.
**AUTHORITY IS ASSIGNED TO SOMETHING THAT DOES NOT EXIST.** R13 rules the LOADER
authoritative for the DDL, carrying "the full table definition as a single named
constant". R16a states "the loader builds the aside from its own constant and
nothing currently checks that the constant produced what it claims". A113's D5
item (2) describes it in the FUTURE TENSE — "the aside DDL this slice builds on
EVERY run" — so of D5's three places the ruled shape must live, only (1) and (3)
exist at HEAD.
**NO RULING PLACES IT IN A SLICE.** R21 defines slice 1 as "parse and emit, no
database contact". R6a, R14, R24 and R27 name no slice and assign no DDL
authority; R16a names "the loader", which R21 has since split.
**THE ONE EXISTING IMPLEMENTATION IS RESIDUE.**
`scripts/d1-window-generate.mjs:85` emits
`CREATE TABLE bmf_aside (ein TEXT NOT NULL, ...)` with no primary key and no
indexes — the shape R10e flags as producing lower-bound measurements — and its
tail still uses the DROP that R6 replaced with a rename.
**AND A DIRECT COMPARISON IS ALREADY REFUSED AS THE MECHANISM.** R8b: "A PRE-SWAP
SCHEMA COMPARISON WAS REFUSED AS THE PRIMARY MECHANISM… comparing the aside
against the live table validates nothing on load ONE, because live is the empty
table the migration created."
**FILED AS AN OPEN SCOPING QUESTION. No options are enumerated here and none is
recommended.**
**RULED 2026-09-08, OPTION B, AND IMPLEMENTED FOR SLICE 1 ONLY. THIS ENTRY STAYS
OPEN, and the two things still open are named below rather than left to be
inferred.** FT ruled that slice 1's verifier creates a MINIMAL IN-MEMORY SCRATCH
TABLE, not the real aside DDL — a parsing tool under R27, existing for the
duration of one check, explicitly not the aside.
**WHAT SHIPPED.** `scripts/bmf-verify-slice1.mjs` creates seven columns in
shipped order with shipped names, TYPES ONLY: `ein TEXT` per A123's floor, and
`revenue_amt INTEGER` carrying real INTEGER affinity so the text `'null'` R29
describes is VISIBLE rather than swallowed by a TEXT column. Named `bmf_aside`
per R24 so the emitted file loads unmodified. The DDL is written as a LITERAL
rather than interpolated, with a startup guard against drift, so that a reader
auditing `CREATE TABLE bmf_aside` finds the file — a template hid it from that
search, which is the opposite of what its docblock is for.
**STILL OPEN, FIRST: THE REAL ASIDE DDL HAS NO AUTHOR.** Option B settled what
slice 1 creates and settled nothing about the aside. R13 assigns authority to a
loader constant carrying the full table definition; that constant does not
exist, and no ruling places its authorship in a slice. R16a's observation stands
unchanged: "the loader builds the aside from its own constant and nothing
currently checks that the constant produced what it claims."
**STILL OPEN, SECOND: R13a's REGENERATION OBLIGATION HAS NOT FIRED.** Its
trigger is the authoring of that constant, and slice 1 authored none — so the
byte-identity comparison against `migrations/0022_bmf_table.sql` has not been
performed and is not owed by anything banked. It transfers intact to whichever
slice authors the constant, together with the caution that the migration is
applied to both databases and wrangler matches by NAME, so a byte difference is
a finding to report rather than a diff to accept.
**FOUR PROPERTIES WENT UNOBSERVED BY DESIGN**, each printed by the verifier at
the end of every run so it is visible rather than filed: R10b's duplicate-`ein`
rejection at INSERT (no primary key), R16's `aside_schema_pk` (no PK, no PK
autoindex), R16's `aside_schema_notnull` (no NOT NULL on any column), and R13b's
post-swap index names (no indexes). All four defer to the slice that creates the
real aside.
**THE SITE COUNT IS NOW FOUR, measured 2026-09-08 rather than asserted:**
`migrations/0022_bmf_table.sql:55` creates `bmf` and is AUTHORITATIVE;
`scripts/d1-window-generate.mjs:85` and `scripts/d1-window-verify-import.mjs:26`
are banked experiment residue; and the verifier's scratch table is the fourth.
D5 rules the shape must agree across its sites, and the verifier's docblock
enumerates all four so a reader meets them together.
**RULED 2026-09-09: THIS ENTRY IS NOT RULABLE AHEAD OF SLICE 2's BOUNDARY. IT
STAYS OPEN AND STAYS BLOCKING, AND ITS BLOCKER BECOMES A NAMED DEPENDENCY RATHER
THAN AN OPEN FORK.** The superseded line read "Blocker: unruled. The fork is
FT's.", quoted rather than deleted so the change is visible where the stale claim
sat.
**THIS IS A RULING ABOUT RULABILITY AND NOT A DEFERRAL, and the distinction is
the whole of it.** Nothing is put off and no judgement is withheld. What is
recorded is that the question cannot be answered in the right order yet, and what
has to exist before it can be. **A fork waits on someone deciding; a dependency
waits on something being built**, and only the second names what would move it.
**FIRST GROUND: THE TWO STILL-OPEN ITEMS ARE ONE QUESTION, NOT TWO.** The
"STILL OPEN, FIRST" and "STILL OPEN, SECOND" blocks above are the aside DDL
having no author and R13a's regeneration obligation not having fired. Both
resolve when a slice authors the loader constant and neither resolves before it,
because the second names the first's artifact as its own trigger: the obligation
"transfers intact to whichever slice authors the constant". **One question with
two consequences is not two questions**, and ruling the halves apart would rule
the same thing twice.
**SECOND GROUND: EVERY CANDIDATE ANSWER NAMES A SLICE.**
`docs/bmf-load-scoping.md` §15, R31, records three candidate shapes and expresses
no preference between them: that the constant grows to carry all three objects
the migration creates, that the regeneration reference narrows, or that the two
roles split into two constants. **All three describe what a slice must BUILD**
rather than what FT must decide, so there is no fork here for a ruling to take.
**THIRD GROUND: NOTHING IN THE TREE BOUNDS SLICE 2, MEASURED RATHER THAN
ASSERTED.** `docs/bmf-load-scoping.md` carries three slice-named headings, R21,
R22 and R28, and all three are SLICE-1 headings; only R21 states a boundary, "The
slice-1 boundary stands: parse and emit, no database contact", and it bounds
slice 1 by its own title and nothing further. "slice 2" occurs twice in that
file, both inside R21 and both incidental — that slice 2 cannot be proven without
slice 1, and that slice 1's artifact goes nowhere until slice 2 exists. Neither
is a scope. Every other site states the same absence in different words: A113
above, its "SLICE 2 IS NOT STARTED" block, and CLAUDE.md §5's Individual row.
**Ruling authorship now would assign it to an artifact that has no edges.**
**FOURTH GROUND: TWO RULINGS ALREADY POINT FORWARD TO THIS SAME UNSCOPED SLICE,
AND A THIRD WOULD BE WORSE THAN NAMING THE DEPENDENCY OUTRIGHT.** The Option B
ruling above defers four unobserved properties to "the slice that creates the
real aside" and hands R13a's obligation to "whichever slice authors the
constant". R31 leaves the single-constant question surfaced on the stated ground
that ruling how that constant handles three tables "would specify an artifact
whose authoring slice is unscoped", and calls that "A GROUND RATHER THAN A
DEFERRAL" in those words. **A third ruling aimed at the same slice, asserting
something about its contents, would add a claim that slice must satisfy before
anyone has said what the slice is.**
**THE SHAPE IS THE ONE THAT ELIMINATED REPAIR-THEN-COMPARE, AND IT IS NARROWED
HERE RATHER THAN RESTATED.** The closure note below records that option out as
"REPAIR IS CIRCULAR IN SCOPE: two of its candidates could not be classified until
this question was ruled". **That is SELF-reference — an option that could not be
specified before the ruling it was a candidate for — while R31's ground is
FORWARD dependence on an artifact and a slice that do not exist.** They are the
same CLASS, a refusal to rule on something whose edges are not yet fixed, and not
the same circularity. Recorded at that precision because the stronger reading
would assert more than the tree carries.
**WHAT WOULD CLOSE THIS ENTRY, so the dependency is actionable rather than
decorative:** a scope pass bounding slice 2, after which the slice that authors
the loader constant meets R31's three candidate shapes, takes one, and fires
R13a's byte-identity comparison against `migrations/0022_bmf_table.sql` under the
coverage R31 ruled. **The caution rides with it unchanged** — that file is
applied to both databases and wrangler matches by NAME, so a byte difference is a
finding to report rather than a diff to accept.
**A126 was CLOSED 2026-09-08 and has left this section; the remaining IDs are
not renumbered, since renumbering would break every reference to them.** The
durable home is RULED and WRITTEN: `docs/bmf-load-scoping.md` §15, beside R21a.
**FT's reasoning, recorded because it rejects two candidates and a later reader
should not re-propose them.** R21a is the ruling that requires the definition to
exist, so a reader who finds R21a must find the list without hunting further.
**A113 was rejected** for the same fuse reason that moved A121 and A122 out of
it: A113 closes when the loader exists, and the definition of done is a
permanent record of what was proven rather than a checklist that expires. **A
standalone file was rejected** as a third place to look.
**THE STANDING CONTENT WAS RELOCATED BEFORE CLOSURE**, because closing an entry
deletes it. The list itself, its per-item provenance in three classes, item 9's
stated limit, and the exclusion of §5's four absolute figures all now sit in §15.
**WHAT CLOSING THIS ENTRY DOES NOT DELETE, and this is why nothing further is
left behind here.** A124 above carries the correction and the finding — that
five of the fifteen were unrecoverable, that A124's own claim to the contrary
was false, and that the understatement surfaced only when someone tried to use
the record. That is where a later reader meets it, and repeating it here would
be a second copy of a claim that already has a home.
**THREE ENTRIES WERE CLOSED 2026-09-09 AND HAVE LEFT THIS SECTION — A129, A130
AND A131. The remaining IDs are not renumbered and none of the three is reused**,
since each id still appears in this file and reuse would make those references
ambiguous. **They are recorded in ONE note rather than in three.** The
closure-note precedent, measured rather than recalled, is the next-lower
surviving ID in the same section — A117 to A116, A126 to A125, A128 to A127 —
and all three of these resolve to this entry. **Three separate notes here would
be an accumulation rather than an index**, which is what this file is; one note
saying what closed and where each one's content went is the same information
without the pile. **The header's arithmetic block was rejected as the sole
home**, because that block is REPLACED on every change by its own rule, so a
closure recorded only there is erased by the next change.

**A129, BYTE-IDENTITY COVERAGE — CLOSED BY RULING. Byte-identity under R13a
covers TABLE SHAPE ONLY, across ALL THREE tables the migration creates and ALL
FIVE indexes, every construct compared AS ATTACHED TO ITS NAMED OBJECT**: columns
by name, type and order; PRIMARY KEY; NOT NULL; CHECK constraints; foreign keys
including their referential actions; and indexes by name AND by columns AND by
the table they are on. **A construct matching in shape but attached to a DIFFERENT
OBJECT does not satisfy the comparison. NOT comment text, NOT alignment
whitespace, NOT prose.** The durable record is `docs/bmf-load-scoping.md` §15, in
`### R13.`, beside R13a.
**THE RULING WAS CORRECTED THREE TIMES BEFORE IT WAS APPLIED, AND THE THREE READ
AS A PROGRESSION RATHER THAN AS THREE SEPARATE FIXES: index names alone; then
constructs specified without the object they attach to; then objects specified
without the full set of objects.** Each amendment closed one level of
under-specification and left the next open. **The generalisation, which is the
part that travels: an enumeration of a shape stays under-specified until it says
WHAT EACH ELEMENT IS, WHAT IT ATTACHES TO, and ACROSS WHICH OBJECTS THE
COMPARISON RUNS.** **The fork was never in doubt any of the three times; the
enumeration was.**
**FOUR OPTIONS WERE BEFORE FT**, recorded so none is re-proposed: full-file
byte-identity; STRUCTURAL, which was ruled; repair-then-compare; and SQL-only,
comparing the 31 SQL lines and ignoring the 122 comment lines and 5 blanks.
**THE GROUNDS, RE-VERIFIED AT HEAD RATHER THAN RESTATED. R8b is the precedent**,
and it refused a comparison for validating less than it appeared to: a pre-swap
schema comparison "validates nothing on load ONE", and "would first do useful
work on load two, by which point the drift has already shipped once".
**FULL-FILE would require the constant to emit THREE statements false at
emission**, filed in the entry below rather than restated here. **REPAIR IS
CIRCULAR IN SCOPE**: two of its candidates could not be classified until this
question was ruled. **SQL-ONLY CANNOT BE REPRODUCED BY ANY UNIFORM PADDING
RULE** — of the twelve inline comments in `migrations/0022_bmf_table.sql` eleven
begin at column 55 and one at column 56, `:60` carrying "absent stays distinct
from zero", so a generator padding every comment to one column produces a file
differing from the applied artifact by one line.
**THE WIDE SCOPE WAS RULED ON MEASURED GROUNDS, AND THE NARROW WORDING WAS AN
ERROR RATHER THAN A CHOICE.** `bmf`, whose body spans
`migrations/0022_bmf_table.sql:55-63`, carries ZERO CHECK constraints and ZERO
foreign keys; the file's only CHECK is `load_check.passed` at `:156` and its only
`REFERENCES` is `load_check.stamp_id` at `:153`. **A `bmf`-only comparison would
enumerate CHECK constraints and referential actions and then compare none of
either**, so the ruling described a wider scope than its own wording stated. The
narrow reading would also have left uncaught that CHECK, that `REFERENCES` with
its `ON DELETE CASCADE` and the reasoning D2 records at `:142-146`, and two of the
five indexes — **precisely the drift R13a's surviving purpose exists to catch.**
**ONE IMPLICATION IS SURFACED AND NOT RESOLVED, AND IT IS FT'S.** R13 assigns
authority to a loader constant carrying "the full table definition as a single
named constant", while R16a states that constant's job as building the aside, and
the aside is a `bmf` twin. `load_stamp` and `load_check` are never built by the
loader at all. **So the wide scope asks one constant to both BUILD the aside every
run and REPRODUCE the whole migration once**, and those do not currently coincide.
The detail sits in §15 beside R31 rather than here.
**A FULL CONSTRUCT SWEEP FOUND NOTHING ELSE PRESENT TO COMPARE** — no DEFAULT,
UNIQUE, COLLATE, AUTOINCREMENT, WITHOUT ROWID, STRICT, trigger, view, `ON
CONFLICT` or generated column exists in the file, against controls of 13 `NOT
NULL` and 8 `CREATE`.
**ITS STANDING CONTENT WAS RELOCATED BEFORE CLOSURE.** The two-purposes analysis
and the padding measurement went to `docs/bmf-load-scoping.md` §15; the
false-text sites and the two undecidable candidates went to the entry below.
**The wrangler-by-NAME caution moved nowhere**, because A113 above already
carries it in full.

**A130, THE THREE MULTI-LOAD BULLETS — CLOSED BY RULING.** R7, R8c and R8e come
OUT of every slice's definition of done and become POST-LOAD OPERATIONAL
VERIFICATION, each stamped with the load at which it first becomes checkable:
retention at load three, pruning at load four, trend baseline at roughly load
four. **The durable record is `docs/bmf-load-scoping.md` §15, in `### R21.`,
beside R21a's list**, stated in full there rather than pointed at. **It is
deliberately not re-filed here**: it has no completion state until those loads
happen, and this file's header rules that such an item would sit in a counted
queue permanently.

**A131, THE CENSUS CORRECTION — CLOSED, ITS BLOCKER DISCHARGED BY THE
SUPERSESSION RULING ABOVE.** Its measurements and its correction-of-a-correction
are relocated into that marker earlier in this entry, in full. **One sentence it
carried is worth naming as it goes**: it recorded that this entry's earlier half
was "not marked superseded", which the same commit that closed it made false.
**That sentence needed no reconciling, because closing deleted it** — the entry
and its claim left together, which is the cheapest possible resolution of a
self-invalidating claim and is available only when the carrier itself closes.

**A132 | `migrations/0022_bmf_table.sql` holds text a regeneration would make
false, and whether an applied migration is ever corrected is unruled.**
Blocker: unruled. A127 turns on the same root question and a ruling on either
should be made for both.
Pilot: DEBT
Detail: `migrations/0022_bmf_table.sql` at the lines below; A127 in
`### Gates other work`; A113 above, its "KNOWN STALE CONTENT IN THAT FILE" block;
`docs/bmf-load-scoping.md` §15, R13 and R31.
**THIS ENTRY EXISTS BECAUSE THE 2026-09-09 COVERAGE RULING ROUTES AROUND THESE
SITES RATHER THAN RESOLVING THEM.** Structural byte-identity compares table shape
and ignores comment text, so a regenerated file may differ in prose and still
pass. **That removes the sites from the byte-identity question and leaves them
exactly where they were, as a truth question about an applied artifact.**
**THREE SITES, RELOCATED FROM A129 BEFORE ITS CLOSURE AND STATED IN FULL RATHER
THAN AS A POINTER. THEIR MODES DIFFER AND THE SET IS NOT UNIFORM.**
- **`:3` with `:6-7` — FALSE ON REGENERATION.** "HAND-WRITTEN AND PROVISIONAL
  (R13a). THE LOADER IS AUTHORITATIVE FOR THIS DDL", and "THIS FILE IS
  REGENERATED FROM THAT CONSTANT once it exists." A regenerated file is neither
  hand-written nor awaiting regeneration.
- **`:25-27` — FALSE ON REGENERATION, and a SECOND independent assertion rather
  than a restatement of the first.** "R13a: this text is HAND-WRITTEN and
  PROVISIONAL until A113 lands, then REGENERATED from that constant." It sits in
  the `-- R13, AUTHORITY:` block bounded by blank lines at `:20` and `:28`,
  outside the header block at `:1-19` where the first site's two citations both
  fall.
- **`:147` — STALE AT HEAD, NOT REGENERATION-DEPENDENT, AND LEFT DELIBERATELY.**
  "D1 REMOTE FK ENFORCEMENT IS UNVERIFIED (CLAUDE.md §10); local is verified."
  Remote enforcement was verified on `bmf-sandbox` 2026-09-07. A113 records the
  comment as left in place "because an applied migration is a record of what
  ran". **Whether that result transfers to production is A116, still open**, so
  the production half of the sentence is not simply false.
**A FOURTH SITE WAS LISTED BY A129 AND IS NOT ONE. RULED 2026-09-09.** `:11-12`
reads that the body was "extracted VERBATIM from the A117 entry in
docs/outstanding.md as committed at a5be8d9". **A129 called it false on the
ground that A117 does not exist.** That ground fails twice over. The sentence is
TIME-QUALIFIED to `a5be8d9`, a commit that exists and whose `docs/outstanding.md`
carried exactly one A117 entry header, so it is a past-tense provenance
statement. And A113 above had ALREADY dispositioned it in those terms — "that is
a provenance statement in the past tense and remains true of the extraction" —
**in text that predates A129's filing, verified by execution at `c8f2988`.**
**The site survives regeneration and is not a false site.** Recorded because an
entry listed as false something the same file had already found true, and only a
re-derivation caught it.
**THE TWO CANDIDATES A129 RECORDED AS UNDECIDABLE ARE NOT DECIDED BY THE
COVERAGE RULING. THEY ARE REMOVED FROM ITS SCOPE, WHICH IS A DIFFERENT THING.**
Both are prose, and structural coverage does not reach prose, so neither is a
byte-identity question any longer; both remain instances of this entry's
question. **(a) `:13`**, "or once A113 exists, edit the loader constant and
regenerate", whose sentence opens at `:12`, presupposes A113 does not exist.
**(b) A TENSE SPLIT PRESENT AT HEAD AND INDEPENDENT OF REGENERATION**: `:5` reads
"The loader (A113) will" carrying to "carry" at `:6`, while `:23` reads "The
loader (A113) carries" — the same fact in two tenses in one file.
**WHY THIS CANNOT BE CLOSED BY EDITING.** The file is applied to `bmf-sandbox`
and to `stewardhouse-pilot`, both at 22, and wrangler tracks applied migrations
by NAME with no hash, so an edited file will not re-run and its bytes stop
matching what both databases received. A113 and A127 both carry that caution and
it is not restated here as a new finding.
**A127 IS THE SAME ROOT QUESTION AND NOT A DUPLICATE.** Its site is
`migrations/0001_initial.sql:222` and its subject a retired counsel name; these
sites are in `0022` and the subject is derivation provenance. A127 already frames
the shared caution as "the R13a caution applying to a file R13a was not written
about". **What neither entry can answer alone is whether an applied migration
holding text that is no longer true should ever be corrected.**

### Cheap and mechanical

**A119 | One surface carries SIX names, and two of them render in the same
viewport.**
Blocker: unruled — which name wins is FT's call, and the fix is one string once
it is made.
Pilot: DEBT
Detail: this entry; CLAUDE.md §5, the Operations row, "Naming ruled 2026-07-13".
**THE COLLISION A VISITOR ACTUALLY SEES.** The Chrome header reads **Admin** and
the page heading reads **Operations**, on the same screen, for the same surface.
**THREE NAMES ARE USER-VISIBLE.** `Admin` (landing card `Landing.jsx:33`, Chrome
header `Chrome.jsx:27`, roster Type cell via `TYPE_LABELS`, activity chip via
`SURFACE_DISPLAY_LABELS`); `Internal admin` (landing `sub`, Chrome `role`); and
`Operations` (the Overview `<h1>`, under the eyebrow "Internal · StewardHouse
staff").
**THREE MORE ARE INTERNAL IDENTIFIERS**, and these are LEGACY BY DESIGN rather
than drift: `operations` (route, directory, Chrome config key, nav keys,
`--sh-operations-accent`), `ops` (DB `type` enum, `RequireType`, `CURRENT_OPS_USER`,
`$.ops.demo_gate`, `requireOps`), and `'Operations'` as a DATA VALUE in the
unified layer, which the surface-colour lookup keys on.
**`Admin` IS THE RAREST NAME IN THE REPO AND THE ONLY ONE A VISITOR IS GREETED
WITH:** 9 hits in `src/` against 33 for `Operations`, 54 for `operations` and 22
for `ops`.
**THE h1 WAS AN OMISSION FROM THE 2026-07-13 PASS, NOT A DELIBERATE EXCLUSION.
FT SETTLED THIS 2026-09-07 ON THE RULING'S OWN CONVENTION, NOT ON INFERENCE.**
The ruling states that sites kept legacy are "docblocked at each site". **Five
such docblocks exist in `src/` and the Overview `h1` carries none**, so by the
ruling's own test it was never a considered exclusion. The supporting reading
follows, and it is corroboration rather than the basis. The ruling's category is
"surface name **Operations→Admin** at display sites", and it enumerates three:
Landing card, Chrome header, activity chip. **The Overview `h1` displays the
surface name and is not among them.** Three things make omission the better
reading. The ruling used the word "h1" explicitly when it meant the Roster
view's, so h1s were within its vocabulary. What it kept legacy it listed
precisely, and that list is **identifiers only** — route paths, nav keys, the DB
`type` enum — with no display string in it. And it says those legacy sites are
"docblocked at each site": **five such docblocks exist in `src/`, and none is at
the Overview `h1`, which carries no naming comment at all.**
**PILOT DEBT, and the reasoning against the file's own definitions.** A pilot
user reaches the landing page, so this is not POST. But an inconsistency is not
a falsehood: every one of the six names is a true name for the thing, and no
user decision turns on which renders. **Pilot can open with it recorded**, which
is DEBT.
**ALSO IN SCOPE HERE: the Operations intro's "provide support" clause.** FT
ruled 2026-09-07 that it STAYS for now and rides this entry's copy work. It is
OVERSTATED for a visitor, since every write affordance is behind
`writesEnabled`, but it is **not false**, which is a different class from the
access claim corrected the same day. That correction was scoped to the false
claim deliberately; this is the sentence next to it.

**A120 | The landing page's Enterprise card advertises a Setup flow that P-5
removed.**
Blocker: none.
Pilot: DEBT
Detail: `Landing.jsx:19`; CLAUDE.md §5.1, P-5.
**THE STRING:** "For athletic departments and institutions. Includes nested
compliance, setup, and onboarding flows." **P-5 REMOVED the Setup wizard**
(`setup/SetupWizard.jsx`, the `EnterpriseSetup.jsx` re-export, and four
references in `EnterpriseSurface.jsx`), so a stale `/setup` URL now falls to the
catch-all. Compliance and onboarding remain; **setup does not.**
**IT IS ON THE FRONT DOOR**, which is the only reason a one-word staleness is
worth an entry at all.
**PILOT DEBT, and the reasoning, because a case for BLOCKING exists.** It is a
false present-tense claim visible to every visitor, which is the shape §5.1
exists to remove. Against that: the card describes a DEMO on a page that says
"Choose yours to enter the demo", and it misdescribes what the demo CONTAINS
rather than asserting anything false about a user's own data or capabilities.
**No pilot decision turns on it, so pilot can open with it recorded.** The
classification barely matters for scheduling, since the fix is one word.

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

**A111 | ProgramOutputs claims one absence convention where it implements two,
and the comment saying so has rotted.**
Blocker: none named.
Pilot: DEBT
Detail: `src/surfaces/enterprise/reports/ProgramOutputs.jsx:137-140`. It reads
"Both tiles fall back to the page's existing NT constant as their VALUE, with no
sublabel, which is what the two unsourced tiles above already do (value={NT} at
:194 and :220). One convention for absence on this page, not two."
**The comment contains three errors of its own.** The page implements TWO absence
treatments: the fmtRate tiles drop the sublabel where a rate does not exist,
while the NT tiles carry explanatory copy ("No gift-dollar source yet", "No gift
source yet") where a value is unsourced. The NT tiles therefore do NOT render
"with no sublabel", which is what the comment asserts of them. And both
citations have ROTTED: `:194` is a `<Card>` opening tag and `:220` is a bare
`)}`, neither of which is a tile.
**THIS COMMENT CAUSED A DOCUMENTED ERROR IN THE A20 SLICE, 2026-09-04**, which
is why it is filed rather than left. The error passed through FOUR links, and
naming fewer would misplace it. The comment stated a convention the page does
not implement. A slice report then quoted the comment as evidence that the NT
tiles drop their sublabel, without opening the tiles. The assistant's review
turn then restated the claim as established fact, repeating the rotted `:194`
and `:220` citations and describing the page as having an established
convention that drops the sublabel. The assistant then wrote the ruling prompt,
asserting that convention in its own voice and instructing a drop on the
strength of it: "the absence convention this page already states at the NT tiles
and the fmtRate tiles". FT ruled on that premise in good faith, handed to him
already stated as true, from a comment no link in the chain had checked. The
error surfaced when the tiles were finally read; the ruling was withdrawn and
re-made on the tiles themselves. The OUTCOME was the same; the REASONING was
not.
**Fixing the comment is deliberately NOT part of the A20 slice**, which filed it
and stopped. Whether the fix corrects the comment, reconciles the two
treatments, or rules that two treatments are correct and names them as two, is
NOT ruled here.

**A112 | Counts are interpolated bare into plural nouns, so a one-athlete
institution reads "Across 1 athletes" on its first visit.**
Blocker: none named.
Pilot: DEBT
Detail: observed by FT 2026-09-04 during the A20 render check, against a seeded
one-athlete roster. The reported site is
`src/surfaces/enterprise/reports/ProgramOutputs.jsx:309`, whose sublabel is
"Across N athletes, M average per athlete".
**SEVEN SITES, and what separates them is whether a real institution can reach
them.**
**THREE ARE UNGATED and render on both trees.** `ProgramOutputs.jsx:309`
above. `ProgramOutputs.jsx:315`, "N workshops x M eligible", which reads
"1 workshops" at exactly one workshop; zero is correct, so this one appears only
at 1, and "eligible" is an adjective and is fine. And
`src/surfaces/enterprise/shared/categoryFilters.js:72`, in `buildModalTitle`,
"LABEL - N athletes", which EnterpriseOverview and EnterpriseRoster both use and
which fires whenever a tile filter matches exactly one athlete.
**FOUR ARE DEMO-ONLY and no real institution reaches them.**
`ProgramOutputs.jsx:218` and `:244` are the else arms of `isAuthenticated`
ternaries whose auth twins render the "Not tracked" tiles, and the demo fixture
holds 33 gifts across 16 athletes, so neither shows 1 today.
`EnterpriseOverview.jsx:67` and `ProgramSummary.jsx:106` are
engagement-week modal titles, and engagement is gated to "Not tracked" on the
auth tree.
**THE SURFACE ALREADY CARRIES THREE CORRECT TREATMENTS AND THEY DISAGREE WITH
EACH OTHER**, which is why this is one filing rather than a find-and-replace.
`EnterpriseRoster.jsx:216`, `ImportRosterModal.jsx:337` and `:438`
append a conditional "s" to the noun. `shared/RateDisclosure.jsx:64-65` and
`:71` branch the whole clause and carry verb agreement, "1 athlete is"
against "N athletes are". `EnterpriseRoster.jsx:245-246` uses the
parenthetical "row(s)" and "set(s)". Which treatment a fix adopts is NOT ruled
here, and neither is whether the demo-only four are in scope.
**CHECKED AND CLEARED, recorded so a later sweep does not re-flag them:**
`ProgramOutputs.jsx:270` ("N remaining this term") has no noun after the
count; `Endowment.jsx:176` ("N years x ...") is driven by a three-option
control of 5, 10 and 20, so 1 is unreachable, and `:164` ("End of N-year
horizon") is a hyphenated attributive; `PhilanthropicReadiness.jsx:146` and
every `CohortComparison.jsx` string are "N of M" forms;
`ProgramSummary.jsx:238` ("N attended") and `:96` (status labels) carry
no count noun.

**A115 | The build-chain figure is named for work that building closes and
contains at least one item no build can close.**
Blocker: needs an FT ruling on the definition and on the name.
Pilot: POST
Detail: this file's header, the counsel-gated paragraph, which defines the
figure as BLOCKING minus the counsel-gated four.
**FT RULED 2026-09-04: THE FIGURE KEEPS ITS NAME AND ITS DEFINITION FOR NOW**,
because several documents depend on it and renaming today costs more than the
inaccuracy does. The question is FILED rather than resolved, and this entry is
that filing.
**WHAT MAKES IT INACCURATE.** A1 is BLOCKING and is not counsel-gated, so it
counts toward the chain, and R1 with R4 together establish that no build closes
it: it closes by exercising a rollback on the sandbox and by FT running the
production load at a time FT chooses. A114 is the same shape, being FT-run
remote work with no slice behind it. So the figure counts at least two items
that building cannot move.
**THE TWO SUB-QUESTIONS, NEITHER RULED.** Whether a figure named for
build-closable work should exclude items no build can close, which would take it
from 18 to 16 today; and what it should be called if the definition changes.
**RECORDED SO THE NUMBER IS NOT READ AS A PLAN.** Anyone reading the chain
figure as "slices remaining" is over-reading it by at least two.
**FINDINGS FROM THE 2026-09-07 BUILD-CHAIN CHECK. THIS ENTRY IS NOT RESOLVED AND
STAYS FILED; what follows is evidence for the ruling FT still owes it.**
**THE ARITHMETIC ABOVE IS STALE IN BOTH DIRECTIONS.** The chain is **17**, not
18. **A114 has CLOSED**, so one of the two items this entry names as
un-closable-by-building is gone — and it closed by FT running a remote command,
which is the premise holding rather than failing.
**AND TWO ITEMS OF THE SAME SHAPE WERE NEVER NAMED HERE: A44 and A69.** Both are
BLOCKING, neither is counsel-gated, so both count toward the 17. **A build can do
the scoping pass their blocker names; a build cannot perform the closing act**,
which is FT setting `$.advisor.demo_gate` and `$.enterprise.demo_gate` — a remote
write, and per CLAUDE.md §5.1 never a slice. **So the count of chain items no
build can close is at least THREE (A1, A44, A69), not the two this entry
records**, and excluding them would take 17 → 14 rather than 18 → 16.
**A117's CLOSURE IS NEITHER EVIDENCE FOR NOR AGAINST THE PREMISE**, and is
recorded so it is not mistaken for either. Its work WAS a build — a file was
written — and it closed by being built. **But this entry's claim is EXISTENTIAL,
that the chain contains at least one item no build can close, and an item that IS
build-closable cannot refute that.** What A117 does show is that the figure is
not uniformly misnamed: for that item, the chain decremented for exactly the
reason its name implies.
**STATED LIMIT ON THIS CHECK:** the fourteen remaining were judged
build-closable from their titles and blocker lines, not by reading each entry in
full. **Three is a floor, not a total.**

### Large

**A118 | A staging environment is unbuilt, and the two cases it would serve
SEPARATE rather than sharing one solution.**
Blocker: unruled. **FT ruled 2026-09-07 that NOTHING IS BUILT TODAY**, and this
is recorded so the decision is made deliberately when a feature needs it rather
than discovered under pressure.
Pilot: POST
Detail: this entry; CLAUDE.md §9 for the origin-stranding failure it would hit,
§6.10 branch (c) for the sandbox.
**THE PURPOSE, in FT's terms:** catching what breaks when real code meets real
infrastructure. Named cases: a migration that works locally and fails deployed; a
UI change wrong on the deployed build; and later, auth changes such as SSO or
MFA, speech-to-text, and new workflows on existing features.
**THE CASES SEPARATE, AND THAT IS THE CENTRAL FINDING.** Preview deployments
build the SAME artifact production gets, and the four demo surfaces are public
routes needing no auth and no database, **so a preview bound to nothing already
covers deployed-build rendering.** A migration that fails to APPLY is caught by
the sandbox alone with no site, which works today. **Only a migration that
applies cleanly and then breaks the running code against it needs a deployed app
bound to the sandbox.**
**THE COLLISION WITH Q1.** Pointing a preview at the sandbox requires
`[env.preview]`, and `d1_databases` is `notInheritable`, so `[env.production]`
is required too, restructuring production's binding. **Q1 ruled production config
untouched; it cannot hold for that design.**
**THE UNCHECKED PRECONDITION, WHICH BLOCKS ANY CONFIG CHANGE.** With no env
sections today, an absent environment falls back to top-level config, which is
why production works. **Adding ANY `[env.*]` section turns that fallback from a
warning into an error**, the severity branching on whether `rawConfig.env` is
non-empty. Whether production's own build then fails depends on whether
Cloudflare CI sets `PAGES_ENVIRONMENT=production`. **That is CI behaviour, not
visible from the repo, and settleable from a build log.** Settle it before
touching config.
**SIGN-IN DOES NOT WORK ON A NON-PRODUCTION DEPLOYMENT.** `BETTER_AUTH_URL`
feeds better-auth's `baseURL` and preview URLs are per-deployment hashes.
**CLAUDE.md §9 already records this exact failure**: the cookie is set on the
serving origin, the redirect goes elsewhere, and the result is
indistinguishable from an expired session. **A staging site nobody can log into
tests nothing behind `/app`, which is exactly where auth changes would need
testing.**
**TWO HARDCODED PRODUCTION HOSTNAMES, neither environment-aware:**
`functions/_lib/inviteEmail.js` and
`src/surfaces/operations/CreateInviteModal.jsx`. **An invite sent from a preview
would point the recipient at production.**
**THE DATA GAP.** The sandbox holds 44 seeded rows: sufficient for "does this
migration apply", thin for "does this workflow behave correctly at scale". **FT
ruled out pointing any deployment at production data for testing** — one bad
write, no undo, one operator, no alerting.
**NOTHING AUTOMATES applying a migration to the sandbox relative to a deploy.**
No CI, no workflows, no git hooks, no `[build]` section and no lifecycle
scripts, verified by execution. It is manual and FT-run.

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
