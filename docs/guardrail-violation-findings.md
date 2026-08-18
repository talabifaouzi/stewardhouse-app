# Guardrail violation findings

Read-only survey of git history, 2026-08-18, against `58f465f`. It asks one
question: has a section 7 guardrail ever been violated in this repository, and
if so, what did it cost.

**This is evidence, not an amendment.** It was gathered as the empirical basis
for a possible section 6 protocol change that FT has NOT ruled. Nothing here
proposes a fix, and the two questions the evidence raises are recorded as open
at the foot of this doc rather than answered.

## Method, and what it cannot establish

Every figure comes from `git log`, `git show` and committer timestamps. Rule
origins were dated by searching CLAUDE.md's own history for the rule TEXT, not
for its current sub-heading, because several rules are older than the heading
they now sit under.

**Three limits, stated because they bound what the evidence supports.**

**The production column means "reached `main`", nothing stronger.** Every commit
named here is an ancestor of `main`, and CLAUDE.md section 2 records that `main`
auto-deploys to Cloudflare Pages. **No deployment history was verified**, and
git alone cannot say when auto-deploy was configured. Read it as reachability,
not as a confirmed live exposure.

**`6676b80` is weaker evidence than it first appears.** It is the one commit
that edited the Discover scoring block after the rule existed, changing
`ORGS.map` to `individualOrgs.map` with `let score = 0` unchanged two lines
below. But that slice was scoped as a data-layer rewire, and the scoring block
was CONTEXT around the line it changed rather than its subject. It shows the
rule was available and that a session worked adjacent to the violation. It does
not show a session read section 7 and proceeded anyway.

**Git cannot answer the question this was gathered for.** Whether reading
section 7 at launch would have caught any of these is not recoverable from
history. The evidence establishes what shipped, when, and what removing it
cost. It does not establish what a different reading habit would have prevented.

**One correction carried in from the pass that produced this doc.** Two day
counts were first reported as 468 and 399 and are wrong; recomputed from
committer timestamps they are **103 and 44**. The ordering of the table is
unchanged and both are still by far the longest-standing, so the two-class
finding below is unaffected. The wrong figures are recorded here only so that a
reader meeting them in the session transcript knows they were superseded rather
than mistyped.

## The six instances

| Instance | Rule origin | Code origin | Rule predates | Corrected | Days | Build / remove |
|---|---|---|---|---|---|---|
| Discover scoring | `ea69a8b` 2026-05-16 | `62e79c6` 2026-05-07 | **no** | `42851cd` · `65f2a28` · `76cdb36`, 2026-08-14 to 08-18 | **103** | 1 / **3** |
| Hex literals (`Tag.jsx` warning) | `e318d56` 2026-06-10 | `66876c3` 2026-05-07 | **no** | `cd1a518` 2026-06-20 | **44** | 1 / 1 |
| Demonstrative caveats | `e318d56` 2026-06-10 | `f9efac0` 2026-06-10 | **yes** | `f26c77a` 2026-08-17 | **68** | 4 / 1 |
| Names verbatim | `e318d56` 2026-06-10 | `41ac6ad` 2026-07-08 | **yes** | `c2c73c9` 2026-07-16 | **8** | 1 / 1 |
| SVG-only icons | `ea69a8b` 2026-05-16 | `e26110a` 2026-05-29 | **yes** | `33cb42f` 2026-05-30 | **1** | 3 / 1 |
| Path B copy | `ea69a8b` 2026-05-16 | `064ff78` 2026-05-29 | **yes** | `33cb42f` 2026-05-30 | **1** | 1 / 1 |

Every instance reached `main`, under the limit stated above.

**Rule-origin detail.** CLAUDE.md was created at `ea69a8b`, 2026-05-16, and
carried the no-scoring and Path B rules in that first version: "**No scores, no
rankings, no grades**, applies to nonprofits, advisors, clients, everywhere",
"Not advisor-driven matching with scores or rankings", and "Icons: SVG only,
**ZERO emoji**". `5f0abbe` (2026-05-22) restated the scoring rule. `e318d56`
(2026-06-10) restructured the file into its current section 7, introduced the
named sub-heading "No scoring, no ranking", and FIRST introduced the
demonstrative, names-verbatim and hex-literal rules.

**Dating a rule to its sub-heading would be wrong**, and it is the single
easiest mistake to make when re-running this survey. The no-scoring rule is 25
days older than the heading it now sits under.

**Code-origin detail on the two 2026-05-07 entries.** `62e79c6` and `66876c3`
sit in a run of fourteen same-day commits beginning `0a4a003` "Create
README.md" and including four "Add files via upload" bulk imports. That is the
repository's first day and predates Claude Code entirely.

## Two classes, and the distinction is the finding

### Class 1: legacy code the rule arrived too late to prevent

**Discover scoring (103 days) and the `Tag.jsx` hex literals (44 days). Both
predate CLAUDE.md's existence.** `62e79c6` and `66876c3` are dated 2026-05-07;
the first CLAUDE.md is `ea69a8b`, 2026-05-16, nine days later.

**No process could have prevented these**, because no process existed. They are
the cost of writing rules for a codebase that already exists, and they say
nothing about whether the rules are read. **The two longest-standing violations
in the repository are both of this kind**, which is why raw duration is a
misleading way to rank guardrail failures.

Recorded specifically so a future reader does not cite Discover scoring as
evidence that section 7 goes unread. It is not that, and presenting it as such
would be constructing a finding the history does not support.

### Class 2: violations against a standing rule

**Demonstrative caveats (68 days), names verbatim (8 days), SVG-only icons (1
day), Path B copy (1 day).** In each, the rule was on the record in CLAUDE.md
before the violating code was committed.

**These are the instances that bear on process**, and they divide further:
three where a slice shipped past an available rule, and one where a rule was
invalidated from a distance. The second gets its own section below, because it
is not the same failure at all.

## The demonstrative-caveat instance, in full

**This one refutes access as the explanation, and it is the reason the survey
was worth running.**

| Commit | Timestamp | Event |
|---|---|---|
| `e318d56` | 2026-06-10 **10:37:52** | The rule enters CLAUDE.md |
| `f9efac0` | 2026-06-10 **11:46:27** | Individuals directory, 77 synthetic records, no caveat |
| `48314d8` | 2026-06-10 **12:23:16** | Institutions directory, no caveat |
| `6cd7c35` | 2026-06-12 10:10:45 | Advisor Practices directory, no caveat |
| `deeef10` | 2026-06-12 11:26:51 | Organizations directory, no caveat |
| `f26c77a` | **2026-08-17** 13:16:39 | All eight directory and detail routes caveated |

The rule as written at `e318d56`: "Synthetic-derived UI must be labeled
demonstrative. Only genuinely live signals may carry LIVE framing." All four
directories render synthetic-bundle records. None carried the label.

**The rule was written 69 minutes before the commit that violated it, into the
same file, on the same working day, and was then violated three more times over
the following two days.** It went uncorrected for **68 days**.

**Availability was maximal and the rule was still not applied.** That is the
part that matters. Whatever explains this instance, it cannot be that the rule
was hard to reach, buried in an unread section, or lost in a long document. It
had just been authored, in the file the session was editing. **Any proposed
remedy that works by making section 7 easier to reach does not address this
case.**

## The names-verbatim instance, its own category

**A violation nobody committed, caused by a commit in a different file.**

The Enterprise Reports guards in `ProgramSummary`, `ProgramOutputs` and
`PhilanthropicReadiness` were written 2026-05-29 and 05-30. They keyed on
`athletes.length === 0` as a proxy for the demo tree, and **that proxy was
CORRECT when written**: the authenticated tree could not then have athletes at
all.

`41ac6ad` (2026-07-08, E-Write-1) shipped `POST /api/athletes`. From that moment
the proxy was false, and a real operator adding their first athlete would see
fixture athlete NAMES rendered as stage chips. **None of the three Reports files
was touched by that commit.** Corrected at `c2c73c9`, 2026-07-16, an exposure of
**8 days**.

**No amount of reading section 7 while editing `athletes.js` would have surfaced
this.** The guardrail text was available, the causing commit was correct in its
own scope, and the violated files were not in the diff. The failure is that a
predicate in one file silently changed meaning when a capability landed in
another, and nothing connected the two.

**So the two class-2 shapes need different remedies, or one remedy covering
both.** The demonstrative case is a rule not applied where it plainly bore. This
case is a rule that bore somewhere nobody was looking.

## Where the corrections came from

**Not once from the slice that introduced the violation.** In all six instances
the correcting commit is a different slice with a different purpose, usually a
sweep whose subject was something else.

- **QA audit sweeps.** `33cb42f` ("Audit Criticals: emoji removal, Path B copy
  fixes") corrected BOTH the SVG-only icons and the Path B copy, one day after
  they shipped, as findings 1 to 9 of the enterprise audit. `5792b84` ("Bundle
  3: voice + Path B copy") removed four further Path B sites the following day.
  The audit found in one pass what three consecutive build slices had shipped.
- **A spec-writing pass.** `76cdb36` deleted `scoreOrg`, which had **survived
  both prior removal commits**: `42851cd` defanged the org fixtures and
  `65f2a28` removed the score, cutoff, sort and buckets from the surface, and
  neither touched it, because it sat in `orgsData.js` rather than in
  `Discover.jsx`. It surfaced only because writing
  `docs/discover-surface-spec.md` required enumerating what the page did.
- **A pilot honesty arc slice.** `c2c73c9` (P-1) corrected the names-verbatim
  expiry, found by a read-only gap review rather than by the write arc that
  caused it.
- **A caveat slice.** `f26c77a` (P-6) corrected all four directories at once, 68
  days after the last of them shipped.
- **A rework fold.** `cd1a518` swapped the `Tag.jsx` warning palette off hex
  literals as part of Individual rework Tier 3, incidentally rather than as a
  guardrail fix.

**The pattern: violations are found by passes that read broadly, and missed by
slices that build narrowly.** Every correction here came from something
sweeping, auditing, spec-writing or reviewing. None came from the slice that
was closest to the code.

## Open

Recorded as open. Neither is resolved here and neither carries a
recommendation.

### 1. Whether section 6 gains a guardrail check, and of what shape

A check that fires at slice time would have to catch the demonstrative case,
where the rule was 69 minutes old and maximally available and was still not
applied, AND the names-verbatim case, where the violated files were not in the
diff and the causing commit was correct in its own scope. **The two failures
have opposite shapes**: one is a rule in plain view that was not applied, the
other is a rule that bore on files nobody was editing. Whether a single check
covers both, whether two are needed, or whether the audit-sweep pattern
described above is already the honest answer, is unruled.

### 2. Whether the section 7 defect queue moves

Section 7's "Tap targets and control sizing" sub-heading has accreted nine filed
defects and closed investigations that are not about tap targets, running from
the persistence predicates through the calendar line breaks to the Operations
keyboard finding. The tap-target ruling itself ends well before them. Whether
that queue moves elsewhere, and where, is unruled and is deliberately not
decided by this doc.
