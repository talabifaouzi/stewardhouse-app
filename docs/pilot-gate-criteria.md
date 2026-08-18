# Pilot gate acceptance criteria

Scored against `main` @ `e13ea0c`, 2026-08-14.

CLAUDE.md §5.1 defines the pilot gate in one sentence: *"full platform
functionality across all four surfaces before any advisor or
athletic-department outreach."* That sentence carries no acceptance criteria,
which is why no completion figure could be defended: the same tree read 100% on
routes-rendering, 57% on real persistence, and 23% on production-usable
depending on what the auditor chose to count.

This document is the measurement instrument. It is deliberately NOT in
CLAUDE.md: §7 sections are LOCKED guardrails, while this carries per-item status
that changes every slice. The rulings below are the load-bearing part. Without
them the criteria are one auditor's opinion with a table around it.

---

## 1. The five rulings (FT, 2026-08-14)

### Ruling A — isolate vs caveat is decided BY CLAIM SUBJECT

When an authenticated route has no real data source, there are two honest
responses, and which one applies is a test, not a preference:

- **ISOLATE** (render nothing) when the fixture asserts something about **THE
  USER**. Current sites: `CohortView.jsx:34`, `IndividualSurface.jsx:291,343`,
  `Learn.jsx:10`, `Team.jsx:12`, all via `useFixtureIsolated()`.
- **CAVEAT** (render the fixture, label it) when the fixture describes **THIRD
  PARTIES the user is browsing**. Current site: `Discover.jsx:99,107`, via the
  raw `!!useOptionalAppIdentity()` presence test plus a §7-idiom caveat.

**Why Rule A and not "by pilot utility":** it fits every existing site exactly,
and it is a test rather than a per-screen judgment, so two auditors reach the
same answer. The principle underneath is that a false claim about you is a
different wrong from unsourced information about someone else. The first
misrepresents your own record, which is the thing this platform exists to be
trustworthy about. The second is a browsing surface, where a label does the
work.

Note that `useFixtureIsolated.js:7` anticipated this divergence before it
existed, naming "an authenticated tree that legitimately shows sample content"
as the case its separation was protecting. Ruling A is that case, ruled.

### Ruling B — caveated fixture content COUNTS as complete, under Ruling A

A route reading fixture data is complete if Ruling A's correct response has been
applied to it. Consequences already determined:

- **Discover is COMPLETE at `42851cd`.** Third-party records, defanged and
  caveated. The three-source import architecture (CLAUDE.md §7) is a data-quality
  upgrade, not a gate item.
- **The eight Operations directory and detail routes are third-party records**,
  so caveat is the correct response and P-6's directory work is COPY CHANGES,
  not a live-data build.

  **Count corrected 2026-08-17: it is EIGHT, not nine.** This bullet said "nine"
  from the first drafting, and the error propagated into criterion 2's evidence
  cell and into the Operations route arithmetic in §3. Operations has ten routes;
  four directories plus four detail routes is eight, and the remaining two are
  the Overview index and Accounts. **FT ruled the Overview index route MET.**
  Nothing on record gives a reason for it to be NOT MET, `OperationsSurface.jsx`
  :303-312 satisfies the §2.4 test on its face, and criterion 3 cannot be the
  disqualifier because the Accounts route inherits the same shell defect and has
  been scored MET in every row of the log. So the ninth unit was never a
  caveat-work unit; it was a miscount.

### Ruling C — honest-but-empty COUNTS as complete

A route that correctly renders an absent state for a user with no such data is
complete. The route behaves correctly and P-3 did exactly what was asked.
Counting correct behaviour as incomplete implies the fix was to fabricate
content, which is precisely the defect removed from Discover at `42851cd`.

Applies to `learn`, `team`, `cohort` on Individual.

### Ruling D — publish BOTH figures, never collapse them

Capability and production-usable measure different things and are reported
separately, always, with the `demo_gate` explanation attached to the second.
**The gate tracks CAPABILITY.** Conflating the two is what made the prior
"65-70%" indefensible.

### Ruling E — weight by ENDPOINTS PLUS ROUTES

Route-count alone under-credits write arcs: Enterprise shipped nine gated
endpoint files with migrations 0012 to 0017 and transactional batches, while
Operations' directories are read-only rendering over an existing data layer.
Endpoints-plus-routes credits that without subjective weighting and stays
countable by anyone.

---

## 2. The counting method

Two auditors must reach the same denominator. These are the unit rules.

### 2.1 The route unit

**One unit per user-facing DESTINATION.**

- Routes mounting the SAME component in different modes COLLAPSE to one unit.
  Applied: `curriculum/new`, `curriculum/:lessonId/fork` and
  `curriculum/:lessonId/edit` are all `<LessonEditor mode=…>`
  (`AdvisorSurface.jsx:114,117,118`) and count as **one** unit, not three.
- A route whose component is a PURE RE-EXPORT does not add a unit beyond its
  target. `EnterpriseSetup.jsx` is a 5-line re-export of `SetupWizard`; the
  `setup` route is one unit.
- A DELEGATING WILDCARD is not a destination. `reports/*`
  (`EnterpriseSurface.jsx:177`) resolves into `EnterpriseReports`, whose six
  child routes are the destinations and are counted instead.
- Catch-all `path="*"` redirects are never units.

### 2.2 The endpoint unit

**One unit per exported HTTP handler, not per file.** `athletes/[id].js` exports
`onRequestDelete` and `onRequestPut` and counts as **two**.

Total exported handlers at HEAD: **35** (`grep -rn "export async function
onRequest" functions/api/ | wc -l`).

**Re-derived 2026-08-17 at `87f36f0`: still 35, but by coincidence rather than
by stasis.** P-4 deleted `docs/[id].js` `onRequestPut` and `1c9d69d` added
`invites/[id].js` `onRequestDelete`, so the total is unchanged while the
per-surface split moved: Advisor 14 to 13, Operations 2 to 3. A re-score that
checked only the total would have missed both.

`auth/[[route]].js` and `me.js` are SHARED INFRASTRUCTURE serving all four
surfaces. They are scored once, separately, and excluded from per-surface
denominators.

### 2.3 What "met" requires

- A route is MET if it renders correctly for a real signed-in user of that type,
  applies Ruling A's correct response to any fixture content, and offers no
  control that persists nothing.
- An endpoint is MET if it is **built and gated as designed**. Caller presence is
  deliberately NOT part of the endpoint test.

  **Ruled 2026-08-14, overruling the first draft.** The draft scored an endpoint
  with no client caller as NOT MET on the reasoning that unreachable code is not
  capability. That is wrong twice over. Capability is whether the platform CAN do
  the thing, and a missing caller is a defect of the ROUTE, which the route
  criteria already count. Scoring both double-counts one gap.

  Applied: `docs/[id].js` `onRequestPut` scores **MET**. It is complete,
  ownership-scoped via `doc JOIN doc_category` on `owner_advisor_person_id`, and
  functional; it simply has no caller (`grep -rn "api/docs/" src/` returns
  nothing).

  **A note for the next auditor, so a falling figure is not misread.** That
  endpoint is separately ruled for DELETION in P-4 rather than for wiring. It
  scores as capability today and disappears next slice, so Advisor's endpoint
  denominator drops from 14 to 13 and capability falls by one unit **without any
  defect having been fixed**. This instrument measures the tree as it stands.
  Capability can fall because dead code was removed, and the re-score log is
  where that is recorded. Do not read such a fall as regression.

### 2.4 The caveat test (Gap 3, ruled)

A caveat is **prose addressed to the reader, in the §7 idiom, placed before the
content it qualifies**. All four conditions.

**A source-filter chip is NOT a caveat.** `AdvisorPracticesDirectory.jsx:33`'s
"Synthetic" entry is a filter CONTROL: it changes what is displayed rather than
telling the reader anything about provenance, it sits inside the filter row
rather than before the content, and it is not prose. A permissive auditor cannot
score it as met.

Reference implementations: `OperationsSurface.jsx:301-312` (demo tree),
`OperationsRoster.jsx:240-250` (demo tree), `Discover.jsx:99-109` (authenticated
tree, condition inverted per Ruling A).

### 2.5 The filed-defect test (Gap 4, ruled)

**A filed defect does NOT block a criterion unless it makes the route dishonest
or unusable.**

- Applied, does NOT block: `/individual/welcome`'s CTA sits 104px below the fold
  at a 642px viewport (CLAUDE.md §7, filed). The CTA is reachable, just not
  without scrolling. Accepted debt.
- **A filed HONESTY defect DOES block.** Applied: the nine Operations directory
  routes render third-party fixture data with no caveat, which fails Ruling A's
  required response, so those criteria are NOT MET despite being filed under
  P-6.

### 2.6 Gate values

Gate values were **verified against remote D1 on 2026-08-17** by FT, with a
read-only aggregate SELECT over `person`, soft-deleted rows excluded. FT ran it
rather than the agent because every `--remote` command is FT-only per CLAUDE.md
§6.15. All three claims this scoring rests on hold: no advisor row and no staff
row carries a gate, and `$.ops.demo_gate = 1` on exactly one of the two ops
rows, which is what the FT-exclusivity premise assumes and is now verified
rather than asserted. Any re-score MUST re-verify them the same way before
reporting a production-usable figure.

**Correction from that same read: the advisor and enterprise gates are NULL,
never set, not `0`.** This document and CLAUDE.md §5.1 both recorded `0`.
**The behaviour is UNCHANGED and this is not a defect:** all three gate checks
are strict (`gate.js:84`, `:118`, `:188` each test `gateRow.gate !== 1`), so a
NULL and a `0` fail identically and every advisor and enterprise write returns
403 either way. What was wrong was only the claim that a value had been set.
`0` asserts a deliberate designation-to-off the database does not evidence;
never-set is what is true. Historical entries in the §6 log and the commentary
under them, and the §4 snapshot, keep `0` as reported at the time (the live
instance is at §6, under the 2026-08-14 P-4 row), per this document's
convention that a log records what was reported rather than what was later
learned; this paragraph is where the correction lives.

---

## 3. Per-surface criteria and status

### Individual — 15 routes + 7 endpoints = 22 units

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Onboarding (5 routes) completes and persists intake | MET | `Questions.jsx:21` POST `/api/intake` |
| 2 | Home, plan, give, history, record-keeping live | MET | `GiveScreen.jsx:84`, `GivingModeler.jsx:133,84`, `RecordKeeping.jsx:64` |
| 3 | No route renders another person's data | MET | `useFixtureIsolated()` called at 10 sites (was 5; `bce9044` added Team's) |
| 4 | `discover` applies Ruling A's correct response | MET | Defanged `42851cd`; caveat `Discover.jsx:99,107` |
| 5 | `learn`, `team`, `cohort` honest | MET (Ruling C) | Isolated |
| 6 | `feedback` persists or is removed | **NOT MET** | No `/api/*` call in `Feedback.jsx` |
| 7 | Touch targets meet the §7 44px standard | MET | `Button.jsx` `lg` `minHeight: '44px'`; measured 44px |
| 8 | Every CTA reachable at phone height | MET (Ruling 2.5) | `/individual/welcome` below-fold is accepted debt |

**Routes 14/15** (feedback out). **Endpoints 7/7** (`athlete-consent` 1, `gifts`
2, `intake` 1, `scenarios` 2, `scenarios/[id]` 1; all ungated and live in
production). **Individual = 21/22.**

### Advisor — 14 routes + 13 endpoints = 27 units

**This table was STALE from P-4 until the 2026-08-17 re-verification.** Criteria
4, 5 and 6 read NOT MET while P-4 had fixed all three at `009eac9`, and the
denominator still counted the `docs/[id]` PUT that P-4 deleted. The table
contradicted its OWN prose below, which has said since 2026-08-15 that criterion
5's "MET stands and is not rescored". The re-score log rows were updated at the
time and this table was not, which is exactly the drift §6's re-score rule
exists to catch.

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | All routes render a real advisor's own practice data | MET | Reads ungated, `me.js:142` (was cited `:133`, which is now the athlete-mode line) |
| 2 | All write endpoints built and gated as designed | MET (capability, Ruling D) | 12 files reference `requireGatedAdvisor` (was 13; `docs/[id].js` deleted by P-4) |
| 3 | No route offers a control that persists nothing | **NOT MET** | `Pipeline.jsx:46-52` `handleSave` sets local state only; no `/api/pipeline` exists. The `PracticeSettings` half of this finding is CLOSED: P-4 removed the dead Rename control |
| 4 | Curriculum authoring lands on the created lesson | MET | P-4 `009eac9`; `await add()` at all three `LessonEditor` branches |
| 5 | Every write surfaces failure in-form | MET | P-4; `writeError` read in both `LessonEditor` and `LessonDetail` |
| 6 | No control claims an action it does not perform | MET | P-4; Discard no longer navigates, and the dead Rename is gone |

**On criterion 5, "every write surfaces failure in-form": it means what it
says (ruled 2026-08-15, recorded so it is not re-litigated).** P-4 satisfied it
literally: the failure IS surfaced. The P-4 verification then found that the
string surfaced is the raw `'Not authorized'` from `gate.js`, identical across
seven conditions in three surfaces, which tells an advisor neither what happened
nor what to do. The auditor flagged that criterion 5 might have been scored too
generously.

**MET stands and is not rescored.** A criterion that smuggles in a quality
judgment is not auditable: two auditors would score "useful" differently, which
is precisely the failure mode the counting method in §2 exists to prevent. If
usefulness is to be measured it needs its OWN criterion with its own test, not
an unstated qualifier on this one. The underlying defect is real and is filed as
a named sub-item of P-6 in CLAUDE.md §5.1, where it belongs.

**Routes 13/14.** Out: `pipeline` ALONE. P-4 closed the other three (`settings`,
the collapsed LessonEditor unit, and `curriculum/:lessonId`).

**The P-4 row in §6 says routes went 10/14 to 14/14. That was one unit too
generous and is corrected here, not there.** P-4 deliberately excluded Pipeline,
which CLAUDE.md's P-4 entry states plainly ("Pipeline deliberately excluded and
still its own slice"), so the correct figure was 13/14. Verified against the tree
2026-08-17: `Pipeline.jsx:46-52` `handleSave` writes React state and nothing
else, and `functions/api/pipeline.js` does not exist. The historical row is left
as written because the log records what was reported at the time; this line is
where the correction lives.

Two readings were considered and REJECTED, recorded so they are not re-litigated.
**Both are now HISTORICAL: P-4 fixed `settings`, so neither reading is live.**

- **Also failing `curriculum`, the library route.** Rejected: it renders
  correctly and reads live practice content. Its only fault is hosting entry
  points to the broken editor, which the collapsed LessonEditor unit already
  counts. Failing both double-counts one defect.
- **Partially passing `settings`**, on the grounds that only the Rename control
  and two hardcoded literals are dead while the rest of the page works.
  Rejected: partial credit would set a precedent this instrument should not
  carry. A unit is met or it is not; half-met is a judgment that would differ
  between auditors, which is the failure mode the counting method exists to
  prevent.

**Endpoints 13/13** (`docs/[id]` PUT was deleted by P-4, so it no longer scores
at all; §2.3's note predicted exactly this). **Advisor = 26/27.**

### Enterprise — 10 routes + 10 endpoints = 20 units

Routes: `index`, `roster`, `compliance`, `program`, plus the six
`EnterpriseReports` destinations (`index`, `summary`, `cohort`, `readiness`,
`program-outputs`, `endowment`). **`setup` is GONE (P-5) and the header figure
above was stale at 11 routes / 21 units until 2026-08-17**, while the totals
below already read 10/10 and 20/20.

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | All routes render live institution data | **NOT AUDITABLE** | See §5, Gap 2 |
| 2 | All write endpoints built and gated as designed | MET (capability) | 9 files reference `requireGatedEnterprise` |
| 3 | Progression recordable and reflected in reports | MET | `athletes/[id].js:185` |
| 4 | No report derives from module-level fixture math | MET | P-1 |
| 5 | `setup` removed or made to persist | **CEASED TO EXIST** (P-5) | The wizard is gone. This criterion did NOT become met: the thing it measured no longer exists, so the unit left the denominator rather than passing |

**Routes 10/10** (P-5 removed the `setup` unit entirely; it was the one NOT MET).
**Endpoints 10/10.** **Enterprise = 20/20**, with criterion 1 unauditable and
provisionally scored MET.

### Operations/Admin — 10 routes + 3 endpoints = 13 units

**The endpoint count rose from 2 to 3**, not by a scoring change but because
`DELETE /api/invites/:id` shipped at `1c9d69d`. The three are `roster.js`
`onRequestGet`, `invites.js` `onRequestPost`, and `invites/[id].js`
`onRequestDelete`.

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Accounts/roster live, invites send | MET | `roster.js`, `invites.js`; `$.ops.demo_gate = 1` verified against remote D1 2026-08-17 |
| 2 | Every directory/detail route reads live data or carries a caveat | MET | All 8 caveated at `f26c77a`, verified by render (§2.4 test) |
| 3 | `/api/me` emits an `ops` block so `userRole` is real | **NOT MET** | `OperationsSurface.jsx:219` hardcodes null; a case-insensitive grep for `ops` in `me.js` returns only `workshops` |
| 4 | A gated ops user cannot silently mint another ops account | MET | `537cc08`; `invites.js` refuses type `ops` with 403, `ALLOWED_TYPES` and `SOURCE_SURFACE_FOR_TYPE` both drop it, select reduced to three options. Smoked 2026-08-17, 16 of 16 assertions |
| 5 | Invite failure recoverable | **NOT MET** | Withdraw shipped (`1c9d69d`, `cd2f41b`) but there is still no resend and no edit; see below |
| 6 | No invite copy contradicts what the endpoint does | MET | `5fa42c9`; the caution now says an email is sent and names delivery as reported after creation |

**Routes 10/10.** **Endpoints 3/3.** **Operations = 13/13.**

**Criterion 5 stays NOT MET, and the reason is worth stating precisely because
two thirds of the finding did close.** `DELETE /api/invites/:id` (`1c9d69d`) and
the Accounts-view affordance (`cd2f41b`) gave the operator a revoke path, so the
original filing's "no resend / edit / revoke path" is stale in its revoke third.
Resend and edit still do not exist. **Withdraw-and-recreate is NOT a resend**: it
deletes the row and mints a new one with a new id and a new `created_at`, rather
than retrying delivery against the existing invite. So the criterion's actual
subject, a failed send being recoverable, is untouched. `invites.js:143-145`
documents the no-retry posture and the catch at `:162-164` swallows the failure,
leaving `emailSent:false` as the only trace. The filing's old citation
`invites.js:9-10` no longer points at that text and has been replaced above.

**Why the route figure reads 10/10 while criterion 5 is still NOT MET.** It is a
defect on the Accounts route, which criterion 1 scores and which the instrument
has counted MET in every row of the log. It does not add or remove a route unit.
Under §2.5 it does not block either: a missing resend leaves the route usable and
does not make it dishonest, since nothing in the UI claims a failed send can be
retried. Criteria 4 and 6, which DID bear on this, are now MET.

**THE CONTINGENT RULING OF 2026-08-17 IS RESOLVED, AND IT DID NOT FIRE.** The
ruling was: Accounts stays MET for the `f26c77a` row, and flips to NOT MET at the
next re-score **if the `CreateInviteModal` contradiction is still live then**.
That was deliberately keyed to the FIX rather than to an interpretation. At this
re-score the condition is FALSE. `5fa42c9` corrected the caution copy, so the
§2.5 honesty defect that would have flipped the unit no longer exists: the
pre-submit caution now says a notification email is sent and that delivery is
reported once the invite is created, which agrees with both post-submit notices
including the failure variant. A repo-wide grep finds no remaining string
claiming no email is sent.

**So Accounts stays MET, by the ruling operating as designed rather than by it
being set aside.** The figures the flip would have produced (Routes 9/10,
Operations 11/12) are not reached. This is the outcome the contingent form was
written to make possible: a fix, not an argument, decided it.

### Shared infrastructure — 2 endpoints

`auth/[[route]].js` and `me.js`. Both MET. **2/2**, excluded from surface
denominators.

---

## 4. The figures

### Capability (the gate figure)

**These are the `e13ea0c` figures from the first scoring and are NOT current.**
§4 is a snapshot of 2026-08-14, kept because the decomposition below explains the
method. **The current figures live in the §6 re-score log**, newest row last.

```
Individual     21 / 22
Advisor        24 / 28
Enterprise     20 / 21
Operations      3 / 12
               ───────
               68 / 83  =  82%

plus shared     2 / 2    ->  70 / 85  =  82%
```

Decomposed, which is more informative than the total:

```
routes         35 / 50  =   70%
endpoints      33 / 33  =  100%
```

**Every surface endpoint is built and gated as designed. The entire remaining
gap is in routes.**

### This is a DIFFERENT MEASUREMENT, not progress

The prior figure was 57%. **No code was written between the two numbers.** The
move is entirely from the rulings in §1 and the counting method in §2:

- Ruling C admits `learn`, `team` and `cohort` (+3 route units).
- Ruling B admits `discover` (+1 route unit).
- Ruling E adds 33 surface endpoint units, all of which are met, because
  route-count alone was crediting none of the write arcs.
- The §2.3 overrule adds one more (`docs/[id]` PUT).

**Anyone reading the jump from 57% to 82% as velocity is reading it wrong.** The
two numbers answer different questions and are not comparable. Only figures in
the §6 re-score log, all produced under this method, are comparable to each
other.

### Production-usable (reported alongside, per Ruling D, never merged)

What a correctly-provisioned production user can exercise TODAY at the gate
values recorded 2026-07-16.

```
Individual     21 / 22   writes are UNGATED and live
Advisor        10 / 28   14 routes render (reads ungated); all 14 endpoints 403
Enterprise     10 / 21   11 routes render; all 10 endpoints 403
Operations      3 / 12   $.ops.demo_gate = 1
               ───────
               44 / 83  =  53%
```

**The gap of 24 units (~29 percentage points) is entirely the two zero
gates.** Setting
`$.advisor.demo_gate` and `$.enterprise.demo_gate` to 1 would move
production-usable to within one or two points of capability without a line of
code. That designation is FT's deliberate per-institution step per
`docs/enterprise-provisioning-runbook.md` §3(e) and is never a slice.

---

## 5. Gap 2 — the one criterion still not auditable

**Enterprise criterion 1, "renders live institution data," is not a test.**

It passes today because P-1 removed module-level fixture math. But a route that
reads a provider whose fixture DEFAULT is still populated passes exactly the
same check, and the two are not the same thing. `AthletesProvider`,
`WorkshopsProvider`, `ComplianceProvider` and `SnapshotsProvider` all carry
fixture defaults so the demo tree renders; whether any of those defaults can be
reached on the AUTHENTICATED tree, for instance when the server returns an empty
array, is not established.

### Proposed test (NOT RULED)

A route is "live" if and only if **every data source it reads resolves, on the
authenticated tree, to data scoped to the signed-in person, and no provider it
consumes can fall back to a fixture default when the server returns empty.**

### What must be enumerated to make it checkable

A provider-by-provider table, built once and re-checked per audit:

| Column | Content |
|---|---|
| Provider | e.g. `AthletesProvider` |
| Fixture default | what it seeds when unauthenticated |
| Auth-tree fallback | can the default render when authenticated? Under what condition? |
| Consumers | which routes read it |

A provider whose default is reachable on the authenticated tree fails the test
for every route that reads it. Until that table exists, Enterprise criterion 1
is scored MET provisionally and should be treated as the least reliable entry in
this document.

---

## 6. Re-score log

| Date | HEAD | Capability | Production-usable | Notes |
|---|---|---|---|---|
| 2026-08-14 | `e13ea0c` | 68/83 = 82% | 44/83 = 53% | First scoring under the ruled method (routes 35/50, endpoints 33/33). Gate values as recorded 2026-07-16, NOT re-verified. Enterprise criterion 1 provisional (Gap 2). NOT comparable to the prior 57%, which used a different method. |
| 2026-08-14 | P-4 | 71/82 = 87% | 44/82 = 54% | P-4. Advisor routes 10/14 → 14/14, endpoints 14/14 → 13/13. Denominator 83 → 82. Gate values still as recorded 2026-07-16, NOT re-verified. |
| 2026-08-15 | P-5 | 71/81 = 88% | 44/81 = 54% | P-5. Enterprise routes 11 → 10; the `setup` unit was removed, not fixed. Denominator 82 → 81. Gate values still as recorded 2026-07-16, NOT re-verified. |
| 2026-08-17 | `f26c77a` | 80/81 = 99% | 53/81 = 65% | The caveat slice, plus the nine-versus-eight correction. Operations routes 1/10 → 10/10 and Operations 3/12 → 12/12. Eight units from `f26c77a` (a §2.4 caveat on every directory and detail route, and three "Every X on the platform" claims removed); one unit from FT's ruling that the Overview index route was always MET and Ruling B had miscounted. Denominator unchanged at 81. Gate values still as recorded 2026-07-16, NOT re-verified. Accounts scored MET per the §3 ruling of 2026-08-17: it stays MET here because criterion 6 did not change at `f26c77a`, and it flips to NOT MET at the next re-score if the `CreateInviteModal` contradiction is still live then, which would give 79/81 and 52/81. |
| 2026-08-17 | `87f36f0` | 80/82 = 98% | 57/82 = 70% | **Full re-verification of every §3 status against the tree**, as the re-score rule requires, not only the two Operations closures that prompted it. Denominator 81 → 82: `DELETE /api/invites/:id` (`1c9d69d`) is a THIRD Operations endpoint, so Operations 12/12 → 13/13. Advisor 27 → 26, a CORRECTION rather than a regression: `pipeline` was never met and the P-4 row overstated its routes as 14/14. Criteria 4 (`537cc08`) and 6 (`5fa42c9`) closed and moved NO unit directly; what they did was resolve the contingent Accounts ruling in the MET direction. §3's Advisor and Enterprise headers were stale and are corrected here. Gate values VERIFIED against remote D1 2026-08-17 by FT, read-only aggregate, soft-deleted excluded (agent-run `--remote` is barred by CLAUDE.md §6.15), so 57/82 stands on current evidence rather than on figures carried from 2026-07-16. All three claims hold. The advisor and enterprise gates read NULL rather than the `0` recorded until now, which changes no behaviour because every gate check is a strict `!== 1`; see §2.6. |

**The `87f36f0` row is mostly a CORRECTION row, and the flat numerator hides
that.** Capability reads 80 before and 80 after, which looks like nothing
happened. Two opposite movements cancelled: Advisor lost one unit that was never
earned (`pipeline`), and Operations gained one that was (the third endpoint).
Read the components, never the total, on this row.

**What the two closures actually bought, since neither moved a unit.** Criterion
4 (`537cc08`, the ops-minting guard) and criterion 6 (`5fa42c9`, the invite
caution) are both defects on the Accounts route, which was already scored MET, so
closing them adds nothing to the numerator. Their effect was to make the
contingent Accounts ruling resolve in the MET direction instead of costing a
unit. **A fix that prevents a loss is worth exactly as much as one that produces
a gain, and this instrument shows it as zero.** That is a limitation of
unit-counting worth knowing when reading any row.

**Production-usable moved 53 to 57, and THREE of those four units are a
correction, not new reach.** Advisor goes 10 to 13 because P-4's route repairs
were production-visible from the day they shipped, since advisor reads are
ungated, and the P-4 row's note that "nothing became usable" was wrong about
that. Only the fourth unit, the new Operations endpoint, is new. The two zero
gates on advisor and enterprise still account for the whole remaining spread.

**The `f26c77a` row is the FIRST in this log where the numerator moved because
code was written.** Every prior row moved for a method change, a denominator
artifact, or both, and each carries a note saying so. This one is eight units of
shipped work plus one unit of correction, against an unchanged denominator.

**Separate the two, because they are not the same kind of thing.** Eight units
came from `f26c77a`: every Operations directory and detail route now carries a
§2.4-compliant caveat, and the three false completeness claims are gone. That is
capability, and it was verified BY RENDER on all eight routes rather than
accepted on structural proof, the first slice on this project where that was
possible. The ninth unit came from FT ruling the Overview index route MET. No
code was written for it and none was needed: the route already satisfied §2.4,
and Ruling B had counted eight routes as nine. **A correction that RAISES the
numerator is the same class of artifact as one that lowers it** (see the P-4 note
below on `docs/[id].js` PUT), and it must not be read as a ninth unit of work.

**Production-usable moved by the same nine units**, 44 to 53, because Operations
writes are live at `$.ops.demo_gate = 1` and caveat copy needs no gate. The gap
in §4 is smaller but unchanged in CAUSE: it is still the two zero gates on
advisor and enterprise. Gate values are carried forward from 2026-07-16 and were
NOT re-verified, per §2.6. Note that re-verifying them is no longer a step the
agent can take on its own: a `--remote` read falls under CLAUDE.md §6.15's
remote-command rule and is FT's.

**The P-5 row is a denominator artifact, not progress.** **The numerator did not
move: 71 before, 71 after.** No capability was built. A unit that was FAILING was
deleted, so the same 71 met units are now measured against 81 instead of 82.

This is the **MIRROR IMAGE of the P-4 note** above about `docs/[id].js` PUT.
There, capability FELL by one when a PASSING unit was deleted. Here it RISES by
one when a FAILING unit is deleted. **Both are denominator artifacts and neither
is progress.** Read them together or each looks like a trend.

Production-usable reads flat at 54% both rows, which is **rounding, not
stasis**: 44/82 = 53.7% and 44/81 = 54.3%. The unit count is unchanged at 44,
and nothing became usable to a production user.

Enterprise criterion 5 did NOT become MET. **It ceased to exist**, because the
thing it measured is gone. A criterion whose subject is deleted leaves the
denominator; it does not pass.

**Two things about the P-4 row that will be misread if not stated.**

**Capability rose while one unit was DELETED rather than fixed.** Advisor's
endpoint denominator fell from 14 to 13 because `docs/[id].js` `onRequestPut`
was removed, not repaired. It scored MET the day before under §2.3. §2.3
predicted exactly this. Four of the five points came from repairing route units
(`pipeline` and `settings` no longer offer controls that do not act, the
LessonEditor unit lands on the server id, `curriculum/:lessonId` no longer
claims a removal it cannot perform); the fifth came from the denominator
shrinking.

**Production-usable rose a point with NO change in what a production user can
do.** The unit count is unchanged at 44. `44/83 = 53.0%` became `44/82 = 53.7%`
purely because the denominator shrank by the deleted endpoint. Every advisor
write still returns 403 at `$.advisor.demo_gate = 0`. Nothing became usable.

**Expected at the next re-score, so it is not misread:** P-4 deletes
`docs/[id].js` PUT, dropping Advisor's endpoint denominator from 14 to 13 and
capability by one unit with no defect fixed (§2.3). P-4 also repairs up to four
Advisor route units, and P-6's caveat work can move up to eight Operations route
units. P-5 removes the `setup` route, dropping Enterprise's denominator from 11
to 10 while removing a NOT MET unit, which RAISES the percentage without new
capability.

**All three of those have now happened** (P-4, P-5, and P-6's caveat work at
`f26c77a`), so this paragraph is a record of predictions that came true, not a
list of pending items. It is kept because each prediction is the reasoning behind
a row above, and because the eight-versus-nine figure in it was corrected here
rather than silently.

**A re-score must:** re-verify every status against the tree rather than
carrying it forward; re-verify gate values against remote D1 read-only before
reporting production-usable; and re-derive the denominators under §2, since
route and endpoint counts change with the code.
