# Filed defects and closed records

Relocated verbatim from CLAUDE.md §7, "Tap targets and control sizing (LOCKED
2026-08-14)", on 2026-08-19 (HEAD 17ad9db). The tap-target ruling itself stays in
§7. Everything below had accreted under that sub-heading without being about tap
targets.

This is where the queue recorded as unruled in
`docs/guardrail-violation-findings.md` ("2. Whether the section 7 defect queue
moves") now lives. That doc is a point-in-time survey and is deliberately left
unamended.

**Two blocks below are CLOSED records, and one carries a TRIGGER TO WATCH note.**
They exist to stop a future audit re-filing something already closed. Read
"CLOSED 2026-08-17: the four Operations directory rows are NOT a keyboard defect"
before re-filing those four files, and "CLOSED 2026-08-18: no modal opens through
the BROWSER-AUTOMATION HARNESS" before treating a harness click that changes
nothing as a product defect.

---

**Filed: convert the two raw persistence predicates to their contexts.**
`Documentation.jsx:13` and `EnterpriseCompliance.jsx:32-33` derive
`isAuthenticated` from `!!useOptionalAppIdentity()` and use it to govern
BEHAVIOURAL divergences about persistence. They return the correct answer today
and are not defects. But the pattern ruled in P-4 is that copy describing a
behaviour must follow the same predicate that governs the behaviour, which means
the owning context's `authenticated`, not the identity test: a second predicate
is how copy and behaviour drift apart. Converting them was deliberately NOT done
in the banner slice, because it is scope creep on a blocking honesty fix, so
`EnterpriseCompliance.jsx` now carries both side by side with a comment saying
why. Small; touches two files; no endpoint, no migration. Does not block the
pilot gate: nothing is currently false.

**Filed: advisor stage-label renaming, blocked on the Q7 allowlist.** P-4 removed
the dead Rename control from `PracticeSettings.jsx` along with the paragraph
above it that instructed the advisor to use it. The stage labels still display;
only the ability to change them is gone, and it was never present. Making it
work is BLOCKED, not merely unbuilt: `practice-profile.js:33` allowlists exactly
`practiceName`, `advisorTitle` and `practiceFocus`, `:14` warns against casual
additions, and `:20-22` defers expansion to the Q7-resolution allowlist upgrade.
Stage renaming therefore depends on that upgrade landing first and cannot be
picked up as an isolated slice. CLAUDE.md §5 already carries a "Stage Rename
sibling slice" as deferred; this names its blocker.

**Filed: `/individual/welcome` CTA falls below the fold on a short viewport.**
Found during the 2026-08-14 device pass, **PRE-EXISTING and not caused by the
tap-target slice**: measured with `minHeight` forced to 0 it reads the same 746
either way. At a 640x642 viewport the CTA bottom sits at 746, i.e. 104px below
the fold, so the first onboarding screen requires a scroll to find its only
action. The other four onboarding screens are clear at the same height (letter
587, privacy 535, questions 401, reveal 517). Short-viewport layout defect on
`Positioning.jsx`; its own slice.

**Filed: line breaks intermittently missing on the enterprise/program
calendar. BANKED FOR A FULL-PLATFORM QA PASS, not recorded as a live
defect.** Observed 2026-08-17 on localhost only, so it may be a local
rendering artifact rather than anything in the tree. This entry deliberately
does not claim otherwise, and no investigation was run: it is a filing, by
ruling, not a diagnosis.

**What is NOT known, said plainly so a later reader does not inherit this as
established.** Whether it reproduces at all. Whether it appears in a deployed
build or only under the dev server. What conditions trigger it. It was seen,
not reproduced, not diagnosed, and no pattern was established, so there is no
frequency, no trigger, and no affected-view list to hand on.

**Starting point for the QA pass, verified against the tree.** The component
is `src/components/WorkshopCalendar.jsx:33`, and enterprise/program mounts it
at TWO call sites in the same ternary: `EnterpriseProgram.jsx:136` (the
authenticated branch, workshops present) and `:142` (the demo branch). That
split matters for whoever picks this up, because which branch the observation
came from is itself unknown, and the two render the same component from
different data. Establish reproduction before reading either file.

**Siblings already filed for that pass, so it is not scheduled alone:** the
`/individual/welcome` short-viewport CTA immediately above, the two raw
persistence predicates, and the advisor stage-label rename blocked on the Q7
allowlist. All four are observation-grade items waiting on a pass rather than
on a decision.

**CLOSED 2026-08-18: no modal opens through the BROWSER-AUTOMATION HARNESS,
and the code is CORRECT.** During the P-7 slice 1 render, neither the
WorkshopDetail modal nor the roster's AthleteProfile modal opened, across four
attempts by element ref and by coordinate, with no console errors. It
reproduced at HEAD with the slice stashed, so it was not caused by that work.
**FT then clicked an athlete row on the demo tree at `/enterprise/roster` in
Chrome on 2026-08-17 and the profile modal opened over the page.** That is the
observation that closes it: the product is fine and the harness is the thing
that cannot click. The standing limit this implies is recorded in §9.

**The code evidence, kept because it is what made the conclusion safe rather
than merely hopeful.** `Modal.jsx:80` returns null while `isOpen` is false and
`:92` renders `role="dialog"` when true, so an ABSENT dialog node in the
accessibility tree means the governing state never changed. It rules out the
harder possibility, a modal that mounted but rendered invisibly, which would
have been a real defect. Every enterprise modal holds its OWN local state (ten
sites across five files, `activeWorkshop`, `activeAthlete`, `addOpen` and so
on), so one broken hook cannot explain all of them. `ModalStackProvider` wraps
everything at `main.jsx:11-17` and could not be the cause even if it were
absent, since `ModalStackContext.jsx:11-16` supplies no-op defaults and the
stack is consulted only AFTER the `isOpen` guard. Nothing in the modal path has
changed since `8ecdaf3` (2026-06-17), and the FT milestone screen of
2026-07-16 exercised both `AddAthleteModal` and the WorkshopDetail attendance
editor successfully, which is after every change to that path.

**The calendar line-break observation above is PROBABLY UNRELATED.** Different
layer and different mechanism: text wrapping rather than event delivery, and
the calendar rendered correctly in every screenshot taken during this work.
Keep the two ADJACENT in the QA pass rather than merging them, because they
share one property that is worth testing once: both were seen only through this
tooling against a local dev server.

**Filed: two §7 orderings from the 2026-08-18 platform-wide scan, plus the
scan's own boundary.** The scan was prompted by the Discover score and swept
every sort, every score token and every `.slice(0, N)` in `src/`. It found four
things. Two shipped as fixes: the Discover score, cutoff and sort (recorded in
`docs/discover-surface-spec.md`), and `scoreOrg`, an exported org-ranking
function with zero consumers, DELETED in this slice. The other two are recorded
here because nothing else in the repo holds them.

**(a) UNRULED: `EnterpriseRoster.jsx:65-69` orders athletes by journey status,
best first.** It sorts on `STATUS_PRIORITY[statusFor(a)]`
(`athleteStatus.js:12-18`: Certified 1, Actively progressing 2, Not yet active
3, Outreach paused 4, Invited 5), with `localeCompare` only as a tiebreak. §7
permits severity that rates an ISSUE's triage urgency and "never a
participant"; this rates the participant, through a constant named priority.
It is a DEFENSIBLE OPERATIONAL ORDERING and it is not obviously inside the
permission §7 grants, which is why it is filed unruled rather than as a defect.
**What a ruling would have to decide:** whether ordering people by a status
each of them holds is materially different from ranking them, since the status
itself is a fact of the record rather than an assessment; whether the harm §7
guards against is the ORDER a staff member sees or the JUDGMENT it implies;
and, if the ordering stands, whether the constant should stop being called
priority, since the name is doing rhetorical work the data does not support.

**(b) PROBABLY FINE, recorded so a future scan does not rediscover it as
novel: `ProgramOutputs.jsx:73` orders recipient organizations by dollars.** It
sorts `b.totalAmount - a.totalAmount`. The figure comes from the INSTITUTION'S
OWN GIFT RECORD rather than from any StewardHouse assessment, so it orders orgs
by a fact the institution already holds about its own giving. That is the same
shape as `History.jsx:67`, where a funder's own orgs are ordered by their own
totals. Filed rather than dismissed because "a list of organizations sorted
high to low" is exactly the pattern a scan should stop on, and the next reader
deserves the reasoning rather than having to re-derive it.

**The scan's BOUNDARY, which is the useful part.** Every other sort in the tree
is chronological or alphabetical. Every `.slice(0, N)` is initials, string
truncation, ISO date slicing, a column subset, a show-all toggle, or the next
four sessions chronologically. **No other cutoff-by-computed-value exists.** A
later scan can start from that and look only for what is new.

**The ASYMMETRY the scan exposed, which outlasts all four findings.**
`rejectRankKeys` (`functions/_lib/gate.js:62`, key set at `:57-60`: rank,
score, priority, suggestion, suggested, ordering, progression) enforces the
no-ranking rule on what gets **STORED**, at every participant write path.
**NOTHING enforces it on what gets COMPUTED and RENDERED**, which is where all
four findings sit: the Discover score was computed at render from fixture
fields and never written anywhere, and would have passed the write guard
untouched because it never reached it. The guardrail is real and it is enforced
in one layer only.

**CLOSED 2026-08-17: the four Operations directory rows are NOT a keyboard
defect.** The item filed during the withdraw slice (`onClick` on `role="row"`
with zero `tabIndex` and zero `onKeyDown`, so rows read as unreachable by
keyboard) is **CLOSED, not deferred**.

The mechanism is that the row was never the only path. Each directory puts a
`Link` in its lead cell (`IndividualsDirectory.jsx:327`,
`InstitutionsDirectory.jsx:323`, `AdvisorPracticesDirectory.jsx:336`,
`OrganizationsDirectory.jsx:431`, each inside a `role="cell"`), and each
`onRowClick` opens with `if (e.target.closest('a')) return;`
(`:63`, `:47`, `:58`, `:91`) before navigating to the SAME destination
the `Link` points at. So the `Link` is the accessible primitive and the row
`onClick` is a mouse convenience widening the hit area to the full row. Adding
`tabIndex` would insert a SECOND tab stop per row pointing where the adjacent
link already points, which is a cost rather than a fix.

`OperationsRoster.jsx:155-163` is NOT a counter-example, even though it carries
the full keyboard pattern. Its rows contain no link, so there `tabIndex` is the
ONLY keyboard path rather than a duplicate of one.

What remains true and is deliberately NOT being fixed: each row carries
`cursor: 'pointer'` and a full-width hover background that only a pointer can
use, and the row has no accessible name. A sighted mouse user is told the whole
row is clickable; a keyboard user is not. That is a cosmetic asymmetry over an
already-reachable destination, not an access barrier.

**TRIGGER TO WATCH.** A future audit grepping for `onClick` without `tabIndex`
will re-flag these four files, because the grep cannot see the lead-cell `Link`
or the `closest('a')` guard. This entry is what closes that loop: read it before
filing them again.
