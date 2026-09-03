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

**As committed: 90 OPEN, 9 PARKED, 6 founder-judgment of which 5 are now ruled,
3 answerable only by FT, 10 ruled out.** The OPEN count breaks down as six
ruled tiers holding 10, then gates-other-work 13, gates-a-stated-commitment 7,
BMF-and-Discover 8, cheap-and-mechanical 20, large 29, and
blocker-undetermined 3.
**The sixth founder-judgment item, FJ-5, is NOT RULED and says so explicitly**,
with the evidence and the reason for withholding recorded on the entry. An
unruled item and an item nobody has looked at are different states, and the
count distinguishes them.

**AGAINST THE PILOT GATE (classified 2026-09-02): 15 BLOCKING, 50 DEBT, 25 POST**,
of which 5 POST carry "(undetermined)" because their own text does not settle it.
Every OPEN entry carries a `Pilot:` line; nothing else does. BLOCKING means pilot
cannot open with it unresolved, DEBT means pilot can open with it recorded and
honest, POST means no pilot user reaches it.
**THREE OF THE FIFTEEN BLOCKING ITEMS ARE COUNSEL-GATED AND CANNOT BE CLOSED BY
BUILDING: A47, A84 and A68.** So the pre-pilot path is TWO CHAINS, not one: a
build chain, and a counsel chain that no slice advances. What moves the counsel
chain is not uniform, and the record says so in two places rather than one.
`docs/ruling-e-deletion-retention.md` names a reviewing attorney for Clauses 3
and 6, which is A47 and A84. CLAUDE.md §5, the Enterprise row, records the
operating premise for E3, E6 and E8, dated 2026-07-15, as internal review with
no external counsel, which is A68. **Nothing in this repository records counsel
as retained**, and no entry names a date by which either chain moves.
**THE QUEUE COUNT AND THE PILOT-GATE PERCENTAGE MEASURE DIFFERENT THINGS, AND
THIS LINE IS WHAT RECONCILES THEM.** `docs/pilot-gate-criteria.md` scores ROUTES
AND ENDPOINTS THAT EXIST, so 90 open items and a 99% capability figure are not in
conflict: a defect on a route the instrument scores MET moves no unit, and the
instrument has no unit at all for work that was never built. Read the gate figure
for coverage and this line for readiness.

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

**A18 | Three unguarded branches render the literal `null%` on the enterprise
overview and roster.**
Blocker: none named.
Pilot: BLOCKING
Detail: `docs/filed-defects.md`, "Filed: the enterprise overview renders a null
progression rate as the literal `null%`". That filing's own line citations are
stale; the sites moved.

**A19 | An empty authenticated roster renders `null%` from the guarded branch.**
Blocker: none named. Distinct from A18: different branch, different trigger.
Pilot: BLOCKING
Detail: `docs/filed-defects.md`, "Filed: on the AUTHENTICATED enterprise tree, a
roster with no athletes renders".

**A20 | The Workshops-held tile reads "0 of 0" for an institution with no
workshops.**
Blocker: none named. It is the first screen a new institution sees.
Pilot: BLOCKING
Detail: `docs/filed-defects.md`, the filing on that tile rendering "0 of 0".

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
