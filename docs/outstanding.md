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

**As committed: 76 OPEN, 9 PARKED, 6 founder-judgment, 4 answerable only by FT,
10 ruled out.** The OPEN count breaks down as six ruled tiers, then
gates-other-work 11, gates-a-stated-commitment 4, BMF-and-Discover 8,
cheap-and-mechanical 18, large 24, and blocker-undetermined 2.

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

**A11 | Migration 0021 is not applied to remote, so every production send today
records nothing.**
Blocker: FT. Remote migration applies are FT-run-only.
Detail: CLAUDE.md §5.1, the migration-count correction; CLAUDE.md §11, the filed
open item on the auth observability gap.
Sharpened by this sweep: `2726d40` IS live on remote and `auth_send_log` is not,
and the insert sits inside a swallowing `catch`, so the stamp fails silently by
design. Sign-in is unaffected. The observability the stamp was built for does
not exist until the apply runs.

### Tier 1

**A39 | The P-2 L4 window closes on the first snapshot write, and nothing guards
it.**
Blocker: none. It is a deadline, not a dependency.
Detail: `docs/session-log.md`, the 2026-08-28 and 2026-08-30 entry, under
rulings that reversed a prior ruling.
**Setting `$.enterprise.demo_gate` is what closes this window permanently**, and
CLAUDE.md §5.1 describes that designation as routine and "never a slice". L4's
mid-series-trend concern is mooted only while `cohort_period_snapshot` holds
zero rows. If it is ever to be revisited on the merits, that must happen before
the first write.
**The zero-row state was OBSERVED on 2026-09-01**, by an FT-run read-only COUNT
against remote `stewardhouse-pilot`, so the window is confirmed open rather than
assumed. This is the answer to the former F5.
Coupled to A69: enterprise writes 403 with no gate set, so the same unset gate
that makes two surfaces non-functional is what holds this window open, and
whenever FJ-3 is ruled, A39 must be settled first or it closes as a side effect.

### Tier 2 — live honesty defects on routes the pilot gate scores as MET

**A17 | `POST /api/snapshots` returns 500 for a write that committed.**
Blocker: none named.
Detail: `docs/filed-defects.md`, "Filed: `POST /api/snapshots` re-SELECTs
outside its try".

**A18 | Three unguarded branches render the literal `null%` on the enterprise
overview and roster.**
Blocker: none named.
Detail: `docs/filed-defects.md`, "Filed: the enterprise overview renders a null
progression rate as the literal `null%`". That filing's own line citations are
stale; the sites moved.

**A19 | An empty authenticated roster renders `null%` from the guarded branch.**
Blocker: none named. Distinct from A18: different branch, different trigger.
Detail: `docs/filed-defects.md`, "Filed: on the AUTHENTICATED enterprise tree, a
roster with no athletes renders".

**A20 | The Workshops-held tile reads "0 of 0" for an institution with no
workshops.**
Blocker: none named. It is the first screen a new institution sees.
Detail: `docs/filed-defects.md`, the filing on that tile rendering "0 of 0".

### Tier 3

**A9 | The D1 org seed carries authored officers, budgets and funders for
identifiable real organizations, at rest on remote.**
Blocker: an FT ruling. See FJ-2.
Detail: `docs/propublica-spike-findings.md`, FT ruling 8, "D1 org seed defanged
fields". The 2026-08-14 defang covered the fixture side only. Nothing reads the
`org` table today, so the data is dormant rather than rendered.

### Tier 4

**A1 | The BMF import rollback path is untested and gates the production load.**
Blocker: a failure has never been exercised; the success path is proven atomic.
Detail: `docs/bmf-load-scoping.md`, open item 1; `docs/filed-defects.md`,
"Filed: the BMF rollback path is a stated precondition on a production BMF
load".

### Tier 5

**A59 | Nav buttons sit at roughly 31px against the LOCKED 44px standard, and
this was never filed anywhere until this sweep.**
Blocker: none named.
Detail: CLAUDE.md §7, "Tap targets and control sizing (LOCKED 2026-08-14)",
which names "the deferred nav slice" in a subordinate clause and nowhere else.
It appears in no defect queue and in no parked set.

### Gates other work

**A47 | Ruling E Clause 3, the charitable-retention floor, is unanswered.**
Blocker: COUNSEL. Gates A12, A14 and every retention decision.
Detail: `docs/ruling-e-deletion-retention.md`, Clause 3.

**A46 | Ruling E Clause 6, the subpoena posture, is unanswered.**
Blocker: COUNSEL. Gates the who-gave-to-whom view and P-C.
Detail: `docs/ruling-e-deletion-retention.md`, Clause 6.

**A42 | Advisor stage-label renaming is blocked on the Q7 allowlist.**
Blocker: Q7, itself COUNSEL-gated.
Detail: `docs/filed-defects.md`, "Filed: advisor stage-label renaming, blocked
on the Q7 allowlist"; `docs/advisor-persistence-schema-draft.md`, the Q4/Q7
gate.

**A56 | P-6 slice 2, the shared 'Not authorized' string across three gate
conditions.**
Blocker: advisor and enterprise gate emissions in `/api/me`, which do not exist.
The blocker moved rather than cleared when slice 1 shipped.
Detail: CLAUDE.md §5.1, the P-6 sub-item on the shared string.

**A13 | Nothing reads `auth_send_log`. The table records and no one is told.**
Blocker: SCHEDULED EXECUTION, which this project has never had.
Detail: CLAUDE.md §11, the filed open item on the auth observability gap.

**A12 | `auth_send_log` retention is unbounded, on the one table Tier 0 is about
to make live.**
Blocker: A47 for the window itself, and the absent scheduled execution for any
purge that would enforce it. Setting a window unilaterally would invent the
standard Clause 3 defers.
Detail: `migrations/0021_auth_send_log.sql`, its retention docblock.

**A14 | No purge path exists on any of the five append-only tables.**
Blocker: the same absent scheduled execution, plus A47. Broader than A12 and NOT
closed by it: `compliance_audit` is an append-only institutional record with its
own obligations, and three others are athlete-scoped. Closing the narrow one
must not read as closing this.
Detail: `migrations/0021_auth_send_log.sql`, its retention docblock, which names
the four tables it joins.

**A66 | The pilot gate has not been re-scored in 86 commits.**
Blocker: none named. A re-score additionally needs an FT-run remote gate read
before any production-usable figure may be reported.
Detail: `docs/pilot-gate-criteria.md`, the re-score log. Several Tier 2 defects
above sit on routes that log scores MET.

**A73 | Bare intra-document line references cannot be found by a citation
scan.**
Blocker: it needs a reading pass, not a grep. The bare form is invisible to a
filename-and-line pattern, and it is also how this project cites a line in a
source file already named in the sentence, so the two cannot be separated by
pattern alone.
Detail: the commit message of the preceding correction slice. One instance was
found and converted; the scope is unknown.

**A15 | Whether production D1 enforces foreign keys is unverified.**
Blocker: it needs a remote write, which is FT-only. Local enforcement IS
verified. Gates A16, which is explicitly downstream of it.
Detail: CLAUDE.md §10, the filed block on foreign-key enforcement.

**A74 | Two audit docs are cited from CLAUDE.md and cannot be opened from
`main`.**
Blocker: a disposition. Committing them to `main` argues against §6.9's
anti-merge posture; amending each pointer to name its branch is the alternative.
Neither is proposed.
Detail: CLAUDE.md §8, its opening note on the two branch-only pointers.

### Gates a stated commitment

**A44 | Every advisor write returns 403 in production.**
Blocker: FT's `$.advisor.demo_gate` designation. See FJ-3.
Detail: CLAUDE.md §5.1, production gate state.

**A69 | Every enterprise write returns 403 in production.**
Blocker: FT's `$.enterprise.demo_gate` designation. See FJ-3, and note A39.
Detail: CLAUDE.md §5.1, production gate state.

**A45 | The pilot has no in-product feedback channel.**
Blocker: a deliberate design problem rather than a restore. It needs explicit
consent, a first-party destination and an honest success state.
Detail: CLAUDE.md §5, the Individual row.

**A54 | Marcus Thompson's person row is unclaimable by any path.**
Blocker: a ruling rather than a patch. See FJ-5.
Detail: `docs/filed-defects.md`, "Filed: the Marcus Thompson person row is
structurally unclaimable".

### BMF and Discover — open questions

These feed the Discover surface and none of them gates it. The item that
actually gates the load is A1, in Tier 4.

**A2 | Whether `REVENUE_AMT` serves any v1 query.**
Blocker: none named.
Detail: `docs/bmf-load-scoping.md`, open item 2.

**A3 | Whether absence from the BMF is the entire revocation and deductibility
signal.**
Blocker: two IRS information-sheet PDFs defeated the spike's tooling.
Detail: `docs/bmf-load-scoping.md`, open item 3.

**A4 | Whether retained Time Travel history counts toward the 10 GB ceiling.**
Blocker: unknown to this project; a vendor answer would settle it.
Detail: `docs/bmf-load-scoping.md`, open item 4.

**A5 | Whether an import FAIL is per-database or per-table.**
Blocker: the closing experiment was ruled not run.
Detail: `docs/bmf-load-scoping.md`, open item 5.

**A6 | The Discover NTEE facet is deferred.**
Blocker: the verbatim label source is unidentified.
Detail: `docs/discover-surface-spec.md`, "4. NTEE: DEFERRED".

**A7 | Whether a staleness threshold should revert Discover to unavailable.**
Blocker: unruled.
Detail: `docs/discover-surface-spec.md`, its closing UNRULED note.

**A8 | The four Discover facets are unbuilt; the page renders an explicit
unavailable state.**
Blocker: the BMF ingest, which is A1 and A9.
Detail: `docs/discover-surface-spec.md`; `docs/bmf-load-scoping.md`.

**A10 | One BMF batch zip is malformed and exits non-zero while extracting
correctly.**
Blocker: no loader exists yet to guard. A load treating a non-zero exit as
failure would discard a complete batch.
Detail: `docs/propublica-spike-findings.md`, its note on the malformed batch.

### Cheap and mechanical

**A75 | `docs/bmf-load-scoping.md` cites its own two-preconditions passage one
line short of where it starts.**
Blocker: none. A self-citation inside a single file.
Detail: that document, section 13, "The availability ruling".

**A76 | CLAUDE.md's manifest-drift note carries a `me.js` citation that never
resolved.**
Blocker: none, but it needs a decision rather than a renumber. This is a
DISTINCT CLASS from a rotted pointer: it was authored wrong, and it was already
wrong at the docs-only commit that wrote it, which implies docs commits have
been written without resolving their own anchors.
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
Detail: that document's section 12, and `62cb061`.

**A33 | Three comments are stale, in three different ways.**
Blocker: none named.
Detail: `docs/filed-defects.md`, "Filed: three comments are stale".

**A50a | The budget literal in `individualProfile` does not match the modeler's
lookup keys, so the canonical demo user falls through to a default.**
Blocker: none named. Carried debt since the 5.8 pass.
Detail: `docs/5.8-giving-flow-scoping.md`, section 4, carried debt.

**A50b | Date formats are not unified and `parseGiftDate`'s English-month regex
survives.**
Blocker: none named. Fixture layer only.
Detail: `docs/5.8-giving-flow-scoping.md`, section 4, carried debt.

**A57 | Twelve `rgba()` literals sit outside the token system.**
Blocker: a design question rather than a sweep, namely whether alpha-variant
whites want tokens at all.
Detail: `docs/filed-defects.md`, "Filed: TWELVE `rgba()` colour literals across
SEVEN files".

**A61 | Two raw persistence predicates want their contexts.**
Blocker: none named.
Detail: `docs/filed-defects.md`, "Filed: convert the two raw persistence
predicates to their contexts".

**A29 | `athlete.badge` has a ruling and no author.**
Blocker: none named.
Detail: `docs/filed-defects.md`, "Filed: `athlete.badge` has a ruling and no
author".

**A30 | `athlete_activity` is a table with an event enum, no writer, and three
consumers reading it as populated.**
Blocker: deciding which acts emit which enum value.
Detail: `docs/filed-defects.md`, "Filed: `athlete_activity` exists as a table
with an event enum".

**A35 | `parseRoster.js`'s header docblock denies a file-upload path that has
existed since 2026-08-27.**
Blocker: none named. Documentation only.
Detail: `docs/filed-defects.md`, "Filed as STALE DOCUMENTATION".

**A53 | The `/individual/welcome` CTA falls below the fold on a short viewport.**
Blocker: none named. Accepted debt under the pilot gate's filed-defect test.
Detail: `docs/filed-defects.md`, "Filed: `/individual/welcome` CTA falls below
the fold on a short viewport".

**A60 | Line breaks are intermittently missing on the enterprise program
calendar.**
Blocker: queued for a full-platform QA pass rather than scheduled alone.
Detail: `docs/filed-defects.md`, "Filed: line breaks intermittently missing".

**A62 | The AppShell retry panel puts a state reset and a navigation 12px
apart.**
Blocker: none named.
Detail: `docs/filed-defects.md`, "Filed: the AppShell retry panel puts a state
reset and a navigation 12px".

**A63 | The plain-vite lever does not establish which failure branch it
produced.**
Blocker: none named.
Detail: `docs/filed-defects.md`, "Filed: the plain-vite lever does not establish
WHICH failure branch".

**A38 | `AddAthleteModal`'s footer carries a small size on all three controls.**
Blocker: none named. A provable 44px violation, and a size prop on three
controls.
Detail: `docs/filed-defects.md`, "Filed: two controls were reported as
mobile-as-app violations".

**A36 | The two enrollment paths disagree about name shape.**
Blocker: filed as an observation, not a defect.
Detail: `docs/filed-defects.md`, "Filed as an OBSERVATION, not a defect: the two
enrollment paths disagree about name shape".

### Large

**A23 | Four of five athlete-state derivations do not route through
`statusFor`.**
Blocker: none named. This is the root cause; its tile-drill symptom is closed.
Detail: `docs/filed-defects.md`, "Filed (D3 + D4, ONE item by FT ruling
2026-08-26)".

**A31 | The staff-writability predicate is hand-maintained in five places, in
two non-identical forms.**
Blocker: none named.
Detail: `docs/filed-defects.md`, "Filed: the staff-writability predicate is
hand-maintained in FIVE places".

**A58 | Flow content is rendered inside `<button>` at 20 sites across 7 files.**
Blocker: none named. `Button.jsx` itself is clean.
Detail: `docs/filed-defects.md`, "Filed: flow content is rendered inside
`<button>` at 20 sites across 7 files".

**A21 | The enterprise roster stat grid stacks tall on a phone.**
Blocker: unruled, namely whether the answer is fewer tiles, a denser tile or a
collapsed row. Partly mitigated by the tile-grid floor change.
Detail: `docs/filed-defects.md`, "Filed: the enterprise roster's stat grid
stacks into seven full-width rows".

**A22 | The `certified` and `not-yet-invited` categories overlap, so six tile
categories no longer partition the roster.**
Blocker: it wants ruling together with A24. Unreachable on both real rosters
today.
Detail: `docs/filed-defects.md`, "Filed: the `certified` and `not-yet-invited`
categories overlap".

**A24 | `resolveStatus` strands a Pending athlete, with certification its only
exit.**
Blocker: none named.
Detail: `docs/filed-defects.md`, "Filed (F-C)".

**A25 | One imported athlete discards a whole attendance batch.**
Blocker: none named.
Detail: `docs/filed-defects.md`, "Filed (G1)".

**A26 | Persisted rate columns fall back to 0 where the render layer says "Not
tracked".**
Blocker: none named.
Detail: `docs/filed-defects.md`, "Filed (F-D)".

**A27 | The render side and the persisted side divide by different
populations.**
Blocker: observable only through A39's window.
Detail: `docs/filed-defects.md`, "Filed: the render side and the persisted side
divide by different populations".

**A28 | `management_mode` carries no CHECK, so the disclosure's buckets are not
exhaustive.**
Blocker: none named. It can only under-count.
Detail: `docs/filed-defects.md`, "Filed: `management_mode` carries no CHECK".

**A32 | CLAUDE.md's E3 snapshot-survival claim is unverifiable from the tree.**
Blocker: it would need snapshot rows to have existed and an anonymize to have
run.
Detail: `docs/filed-defects.md`, "Filed: CLAUDE.md's E3 snapshot-survival claim
is UNVERIFIABLE from the tree".

**A34 | `suggestMapping`'s containment fallback is unaudited for headers outside
the candidate vocabulary.**
Blocker: the shape of a fix is genuinely unobvious.
Detail: `docs/filed-defects.md`, "Filed: `suggestMapping`'s containment fallback
claims a column".

**A37 | No mobile render check has been performed on the sites now rendering
Pending status.**
Blocker: it needs a render, not a fix.
Detail: `docs/filed-defects.md`, "Filed: no mobile render check has been
performed".

**A40 | P-7 defect 2: the milestone editor copies its gate at mount and
`/api/me` is fetch-once.**
Blocker: ruled OPTIMISTIC OFFER PLUS RECOVERY, and unbuilt.
Detail: CLAUDE.md §5.1, P-7.

**A41 | The 403 copy asserts a present-tense fact the screen contradicts.**
Blocker: FT has not ruled which arc owns it. See FJ-4.
Detail: CLAUDE.md §5.1, P-7, its closing NOT RULED note.

**A43 | Advisor pipeline settings persist nothing, and no pipeline endpoint
exists.**
Blocker: none named. Deliberately excluded from P-4 and still its own slice.
Detail: CLAUDE.md §5, the Advisor row, known defects.

**A16 | Two athlete delete paths trust the FK cascade while a third deletes the
same children by hand.**
Blocker: downstream of the parked soft-delete ruling, P-B.
Detail: CLAUDE.md §10, the filed block on foreign-key enforcement.

**A52 | `GiftRow` extract-or-migrate is an open FT ruling.**
Blocker: FT to rule at the migration slice.
Detail: `docs/5.8-giving-flow-scoping.md`, section 5d.

**A55 | QA-023, uneven tab order, is the last open Operations audit finding.**
Blocker: a future CR-level filtered view.
Detail: `docs/qa-audit-operations-2026-06-09.md`, on the `qa-audit-operations`
branch. See A74.

**A64 | One section 7 ordering is recorded as probably fine.**
**NOT WORK. This is a record, not a queued item**, kept so a future scan does
not rediscover it as new. Nothing is expected to be done about it.
Blocker: not applicable.
Detail: `docs/filed-defects.md`, "(b) PROBABLY FINE".

**A65 | Whether section 6 gains a guardrail check, and of what shape.**
Blocker: unruled.
Detail: `docs/guardrail-violation-findings.md`, its Open section, item 1.

**A67 | Four residual items from the enterprise schema draft.**
Blocker: each was flagged for a build-time micro-ruling that has not been made.
Detail: `docs/enterprise-persistence-schema-draft.md`, section 9, open items.

**A78 | Five residual items from the ADVISOR schema draft: `client.giving_plan`
shape versioning, the `doc.body` size ceiling, the cohort-level `sessions`
array, the `practice_lesson.base_id` orphan check, and the Q11 revisit
thresholds.**
Blocker: each was flagged for a build-time micro-ruling that has not been made.
Detail: `docs/advisor-persistence-schema-draft.md`, section 9, "Open items
(small — flag, don't decide)", whose preamble reads "A handful of narrow items
remain — flagged here for the build slice or a future micro-ruling rather than
reopened". Direct sibling of A67, and its absence until now was a miss rather
than a scope choice: the same section in the enterprise twin was carried from
the first pass.

**A68 | Enterprise counsel-gated seams E3, E6 and E8.**
Blocker: COUNSEL.
Detail: `docs/enterprise-persistence-scoping.md`, section 6.2.

### Blocker undetermined

Placed here rather than in PARKED, because an item with no named blocker is not
parked.

**A48 | The account-settings page, except consent reversibility, which shipped.**
Blocker: UNDETERMINED. Recorded as a founder decision with nothing named.
Detail: CLAUDE.md §5, the Individual row.

**A49 | Geo-selection weighting, AI-drafted org descriptions, and the Discover
design pass.**
Blocker: UNDETERMINED for all three; none is named.
Detail: CLAUDE.md §5, the Individual row.

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

Explicit, unresolved, and awaiting FT. Nothing below is ruled.

**FJ-1 | BMF precondition 2: does a durable record satisfy it, or did it ask for
an active signal?**
`docs/bmf-load-scoping.md` section 13, "The availability ruling", requires that
the observability gap be closed and points at CLAUDE.md section 11. The factual
delta, stated without a recommendation: the send-outcome stamp shipped, so
magic-link sends no longer record nothing; no endpoint, health check, alert or
scheduled process reads the table; and because migration 0021 is local-only,
**no production send is stamped today at all**. If a durable record satisfies
the precondition, one item stands between here and the BMF load. If an active
signal was meant, the blocker is scheduled execution, which this project has
never had.

**FJ-2 | A9 disposition: a cleanup slice, or a ruling first on what may sit at
rest in remote D1?**
The seed rows are dormant, unread by any endpoint, and describe real
organizations. Removing them is small. Ruling on the general question is not.

**FJ-3 | A44 and A69: the advisor and enterprise gates have never been set, and
designation is described as "never a slice". Is that the intended posture, or a
gap?**
Every write on two of the four surfaces returns 403 in production, and the pilot
gate's production-usable figure sits far below its capability figure almost
entirely because of it.
A39 must be settled before this is ruled: the unset enterprise gate is what
holds A39's window open, so ruling here closes it as a side effect.

**FJ-4 | A41: which arc owns the 403 copy defect?**
CLAUDE.md §5.1 records it under P-7 while saying it may belong to P-6 slice 2
instead, and that FT has not ruled which.

**FJ-5 | A54: Marcus unclaimable. The filing says the remedy is a ruling, not a
patch.**
No sign-in path recovers the row. What it should become is undecided.

**FJ-6 | The refresh cadence of THIS FILE, and nothing else.**
`docs/outstanding.md` is accurate as of the commit that created it and carries
no update rule. Candidates: refreshed per session alongside
`docs/session-log.md`, refreshed per arc, or refreshed on demand. Without one it
becomes the thing it was written to fix.
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

**F1 | Is the `+screen` test address bound, or an expired invite?**
Query class: a single-row SELECT over `person` for that address, reading its
created timestamp and whether an `auth_user` is bound.

**F2 | Does the `+morgan` advisor test address still exist remotely?**
Query class: an existence check over `person` for that address.

**F3 | How many claimed individual-type rows does FT hold?**
Query class: a COUNT over `person` grouped by type, soft-deleted excluded.
CLAUDE.md §9 records three and §12 names one working address; the two are
unreconciled.

**F4 | Has migration 0021 reached remote?**
Query class: the remote migrations list, or a plain SELECT over the migrations
table if that subcommand returns 7403 again. Both are recorded in CLAUDE.md §10.

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
