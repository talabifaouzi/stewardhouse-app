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
- **The nine Operations directory routes are third-party records**, so caveat is
  the correct response and P-6's directory work is COPY CHANGES, not a live-data
  build.

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

Gate values used below are **as recorded 2026-07-16** in CLAUDE.md §5.1:
`$.advisor.demo_gate = 0` on all advisor rows, `$.enterprise.demo_gate = 0` on
all staff rows, `$.ops.demo_gate = 1` on one ops row. **Remote D1 was NOT
queried for this scoring.** Any re-score MUST re-verify them with a read-only
aggregate SELECT before reporting a production-usable figure.

---

## 3. Per-surface criteria and status

### Individual — 15 routes + 7 endpoints = 22 units

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Onboarding (5 routes) completes and persists intake | MET | `Questions.jsx:21` POST `/api/intake` |
| 2 | Home, plan, give, history, record-keeping live | MET | `GiveScreen.jsx:84`, `GivingModeler.jsx:133,84`, `RecordKeeping.jsx:64` |
| 3 | No route renders another person's data | MET | `useFixtureIsolated()` called at 5 sites |
| 4 | `discover` applies Ruling A's correct response | MET | Defanged `42851cd`; caveat `Discover.jsx:99,107` |
| 5 | `learn`, `team`, `cohort` honest | MET (Ruling C) | Isolated |
| 6 | `feedback` persists or is removed | **NOT MET** | No `/api/*` call in `Feedback.jsx` |
| 7 | Touch targets meet the §7 44px standard | MET | `Button.jsx` `lg` `minHeight: '44px'`; measured 44px |
| 8 | Every CTA reachable at phone height | MET (Ruling 2.5) | `/individual/welcome` below-fold is accepted debt |

**Routes 14/15** (feedback out). **Endpoints 7/7** (`athlete-consent` 1, `gifts`
2, `intake` 1, `scenarios` 2, `scenarios/[id]` 1; all ungated and live in
production). **Individual = 21/22.**

### Advisor — 14 routes + 14 endpoints = 28 units

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | All routes render a real advisor's own practice data | MET | Reads ungated, `me.js:133` |
| 2 | All write endpoints built and gated as designed | MET (capability, Ruling D) | 13 files reference `requireGatedAdvisor` |
| 3 | No route offers a control that persists nothing | **NOT MET** | `Pipeline.jsx` (no `/api/pipeline`); `PracticeSettings.jsx:222` Rename has no `onClick` |
| 4 | Curriculum authoring lands on the created lesson | **NOT MET** | `LessonEditor.jsx:94,120` call `add({…})` without `await` |
| 5 | Every write surfaces failure in-form | **NOT MET** | `writeError` unread |
| 6 | No control claims an action it does not perform | **NOT MET** | `LessonDetail.jsx:78` `remove()` un-awaited; `PracticeContentContext.jsx:97-104` returns false |

**Routes 10/14.** Out: `pipeline` (no `/api/pipeline` exists), `settings`
(`PracticeSettings.jsx:222` Rename has no `onClick`), the collapsed LessonEditor
unit (`add()` un-awaited), and `curriculum/:lessonId` (`LessonDetail.jsx:78`
`remove()` un-awaited against a modal that promises removal).

Two readings were considered and REJECTED, recorded so they are not re-litigated:

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

**Endpoints 14/14** (`docs/[id]` PUT scores MET per §2.3). **Advisor = 24/28.**

### Enterprise — 11 routes + 10 endpoints = 21 units

Routes: `index`, `roster`, `compliance`, `program`, `setup`, plus the six
`EnterpriseReports` destinations (`index`, `summary`, `cohort`, `readiness`,
`program-outputs`, `endowment`).

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | All routes render live institution data | **NOT AUDITABLE** | See §5, Gap 2 |
| 2 | All write endpoints built and gated as designed | MET (capability) | 9 files reference `requireGatedEnterprise` |
| 3 | Progression recordable and reflected in reports | MET | `athletes/[id].js:185` |
| 4 | No report derives from module-level fixture math | MET | P-1 |
| 5 | `setup` removed or made to persist | **NOT MET** | P-5 not started; `SetupWizard.jsx` 869 lines |

**Routes 10/11** (setup out). **Endpoints 10/10.** **Enterprise = 20/21**, with
criterion 1 unauditable and provisionally scored MET.

### Operations/Admin — 10 routes + 2 endpoints = 12 units

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Accounts/roster live, invites send | MET | `roster.js`, `invites.js`; `$.ops.demo_gate = 1` |
| 2 | Every directory/detail route reads live data or carries a caveat | **NOT MET** | 9 routes read synthetic `unified`; no caveat (§2.4 test) |
| 3 | `/api/me` emits an `ops` block so `userRole` is real | **NOT MET** | `OperationsSurface.jsx:219` hardcodes null |
| 4 | A gated ops user cannot silently mint another ops account | **NOT MET** | `CreateInviteModal.jsx` four-type select |
| 5 | Invite failure recoverable | **NOT MET** | `invites.js:9-10` |
| 6 | No invite copy contradicts what the endpoint does | **NOT MET** | `CreateInviteModal.jsx:102` "No email is sent" vs `invites.js` which sends |

**Routes 1/10.** **Endpoints 2/2.** **Operations = 3/12.**

### Shared infrastructure — 2 endpoints

`auth/[[route]].js` and `me.js`. Both MET. **2/2**, excluded from surface
denominators.

---

## 4. The figures

### Capability (the gate figure)

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
Advisor route units, and P-6's caveat work can move up to nine Operations route
units. P-5 removes the `setup` route, dropping Enterprise's denominator from 11
to 10 while removing a NOT MET unit, which RAISES the percentage without new
capability.

**A re-score must:** re-verify every status against the tree rather than
carrying it forward; re-verify gate values against remote D1 read-only before
reporting production-usable; and re-derive the denominators under §2, since
route and endpoint counts change with the code.
