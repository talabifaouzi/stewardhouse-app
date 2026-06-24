# StewardHouse — Project Manifest

Operating context for Claude Code in this repository. Read at the start of every
session. Update as locked decisions change.

---

## 1. Project

**StewardHouse** is a philanthropic planning and education platform for athletes,
their advisors, and athletic departments. The platform is **structural, never
advisory or fiduciary** — it organizes what an advisor or funder decides; it does
not decide for them. Phase 1 scope is **athletes only** (no music / entertainment
/ creator language in user-facing copy).

The core concept is **bilateral transparency** — a two-sided transparency layer
between individual funder and nonprofit, expressed through the **Giving
Partnership Profile (GPP)** (two narrative layers: Giving Style + Giving Identity;
no scores, no grades).

This build is a prototype / stress-test tool, not production. Quality over speed.
Stress-test before moving forward; build it right once.

**Four user-facing surfaces** under `src/surfaces/` (plus a public landing):
- **`individual/`** — funder-facing experience (paused at v0.6.1)
- **`advisor/`** — the advisor surface ("Philanthropic Advisor" in customer copy)
- **`enterprise/`** — institutions (athletic departments, Phase 1)
- **`operations/`** — internal StewardHouse staff view (Overview redesigned 2026)
- **`landing/`** — public entry

---

## 2. Stack & commands

- **React 18 + Vite + react-router-dom**. Plain `.jsx`, no TypeScript.
- **Inline styles over CSS custom properties** — every color, spacing, radius,
  type-size token lives in `src/styles/tokens.css` as `--sh-*`. Use
  `var(--sh-*)` in component styles. **No hex literals in components.**
- **Fixture-driven**, no backend. Source fixtures live in `src/data/`; the
  unified data layer (see §4) reads them via adapters and exposes a query API.
- **Auto-deploys to Cloudflare Pages on push to `main`.**

Commands:
- `npm run dev` — Vite dev server (auto-picks a port if 5173 is taken)
- `npm run build` — production build; the only consistent warning is the
  pre-existing chunk-size note for the single-bundle output
- **Node data verification pattern** (used in slice-verify scripts):
  ```sh
  node --input-type=module -e "import('./src/data/unified/index.js').then(({default: u}) => { ... })"
  ```
  Temp `.mjs` verify scripts at the project root are conventional for slice
  verification; remove after the slice banks.

---

## 3. Repo map

```
src/
├── App.jsx                         # top-level routes (5 surfaces)
├── main.jsx                        # React entry + providers
├── styles/
│   ├── global.css                  # h-reset, focus-visible (incl. [role="button"])
│   └── tokens.css                  # all --sh-* design tokens
├── components/                     # shared across surfaces
│   ├── Card.jsx                    # accepts as / aria-labelledby (a11y bundle 1)
│   ├── SectionLabel.jsx            # heading element with level + id props
│   ├── Chrome.jsx                  # surface chrome (nav, persona, contacts)
│   ├── AthleteProfile.jsx, UserProfile.jsx, WorkshopDetail.jsx, DailyBrief.jsx,
│   ├── ExclusionDetail.jsx, ContactsDirectory.jsx, FilteredAthletesModal.jsx,
│   ├── Modal.jsx, Button.jsx, Tag.jsx, HelpIcon.jsx, BackLink.jsx,
│   ├── Icon.jsx,                   # shared SVG-icon registry (chevron-right/left, plus, close; seed: BackLink chevron idiom; advisor bundles 4 + 6)
│   ├── useDialogA11y.jsx,          # shared dialog-a11y hook (focus trap + initial focus + Escape + trigger-restore; reuses ModalStackContext; .contains()-aware boundary; advisor bundle 6)
│   ├── BarChart.jsx, ComposeMessage.jsx, StatTile.jsx, SHLogo.jsx,
│   └── WorkshopCalendar.jsx
├── surfaces/
│   ├── landing/Landing.jsx
│   ├── individual/                 # 15 .jsx files (paused at v0.6.1)
│   ├── advisor/                    # 16 .jsx files — 8-section IA, audited 2026-06; QA arc complete (bundles 1–12 banked, tail triage included)
│   ├── enterprise/                 # 7 surface files + reports/, setup/, shared/
│   └── operations/
│       ├── OperationsSurface.jsx              # Overview + route shell + 5 directory routes
│       └── directories/
│           ├── IndividualsDirectory.jsx       # 77 records · 4-source chips · URL-state
│           ├── InstitutionsDirectory.jsx      # 4 records · partner-practice FK · URL-state
│           ├── AdvisorPracticesDirectory.jsx  # 7 records · lead-advisor FK · URL-state
│           ├── OrganizationsDirectory.jsx     # 17 records · category + cause chips · URL-state
│           ├── IndividualDetail.jsx           # type-aware: full for individuals, light for staff/advisor
│           ├── InstitutionDetail.jsx          # contract · partner · staff · participants · issues
│           ├── AdvisorPracticeDetail.jsx      # lead · co-advisors · clients · cohorts · partnered institutions
│           ├── OrganizationDetail.jsx         # Candid/GuideStar profile flow
│           ├── NotFoundCard.jsx               # shared invalid-id content card
│           └── sourceAccents.js               # shared source-accent map + resolveSourceAccent helper
├── data/
│   ├── unified/                    # the unified data layer (see §4)
│   │   ├── README.md
│   │   ├── types.js                # JSDoc typedefs for the 9 entities + ActivityItem
│   │   ├── sources.js              # SOURCE_SURFACE enum
│   │   ├── adapters/{enterprise,advisor,individual}.js   # source adapters
│   │   ├── synthetic.js            # synthetic seed bundle + Issue + ConnectionRequest seed
│   │   ├── assemble.js             # eager-evaluates all 4 sources, runChecks
│   │   └── index.js                # public read API (see §4)
│   ├── enterpriseFixtures.js       # athletes, workshops, exclusions, contacts,
│   │                               # endowmentSnapshot, current/priorCohortSnapshot,
│   │                               # dailyBriefItems, complianceAuditLog, reflections,
│   │                               # CURRENT_USER, T() / F() sector helpers
│   ├── clients.js                  # advisorPracticeProfile + 9 clients + stages + sectors + clientsByStage();
│   │                               # plus formatSessionDate(iso) — ISO→display formatter, timeZone:'UTC'
│   │                               # so the day stays stable regardless of local clock (ADV-012, bundle 12)
│   ├── cohorts.js, content.js, intakeData.js,
│   ├── lessonsData.js, orgsData.js, individualProfile.js,
│   ├── practiceContent.js, documentation.js, teamData.js,
│   └── cohortSignals.js, themes.js
└── contexts/                       # IntakeContext, CohortMemberContext, ModalStackContext, CommsContext
docs/                               # see §8
```

---

## 4. Unified data layer (`src/data/unified/`)

Adapter-over-existing pattern: customer-surface fixtures (`enterpriseFixtures.js`,
`clients.js`, `individualProfile.js`, `orgsData.js`, `cohorts.js`) are NOT
migrated. Each adapter reads its source and emits unified-shape records.
Assemble concatenates per-source bundles and wires deferred FKs.

### Nine entities

`persons`, `institutions`, `advisorPractices`, `programParticipations`,
`gifts`, `orgs`, `cohorts`, `connectionRequests`, `issues`.

Every record carries `sourceSurface` ∈ `'individual' | 'advisor' | 'enterprise'
| 'synthetic'`. IDs are namespaced: `p-{sourceSurface}-{native-id}`,
`gift-{sourceSurface}-{seq}`, `cr-synthetic-{seq}`, `issue-synthetic-{seq}`,
etc. **Same-person dedup across surfaces is deferred** — Marcus appears as
`p-individual-c-001`, `p-advisor-c-001`, AND `p-enterprise-1` (three Person
records, no merging).

**Shape note (Candid interleave 2026-06):** `Person.extensions.individual.causes`
is a string-ID array (e.g. `['education','sports','economic']`) — same shape as
`Org.causes`. Consumers resolve labels from the `CAUSES` taxonomy at render time,
so cause-label changes in `intakeData.js` propagate without re-shipping fixtures.

### Four source bundles (assembled into one store)

`enterprise` (21 persons + 1 institution + 16 participations + 18 gifts) ·
`advisor` (9 persons + 1 practice + 9 participations + 2 cohorts) ·
`individual` (1 person + 3 gifts + 17 orgs) ·
`synthetic` (51 individuals + 14 staff/advisor + 3 institutions + 6 practices
+ 51 participations + 105 ConnectionRequests + 14 Issues). Live composition:
**342 records across 9 entity types**.

### Five `runChecks` suites (all live, all passing)

- `assemble.runChecks` — composition integrity (sum-of-sources === assembled),
  global ID uniqueness within each entity type, FK orphan resolution across
  participations / practices / institutions / gifts / connection-requests /
  issues.
- `synthetic.runChecks` — entity counts, sourceSurface tags, FK resolution
  within bundle, first-name uniqueness + collision with real-person set,
  CR stage-count + monotonic timestamps + `gaveAt === Gift.date`, Issue
  enum + status/timestamp coherence + relatedEntity coupling.
- `{enterprise,advisor,individual}.runChecks` — per-adapter counts, FK
  resolution within bundle, self-tests on parsers (`parseGiftLabel`,
  `parseGiftDate`), informational `.info` (gift event-vs-field divergence,
  null-givingPlan count).

### Public read API (`unified.*`)

Direct entity arrays — `persons`, `institutions`, `advisorPractices`,
`programParticipations`, `gifts`, `orgs`, `cohorts`, `connectionRequests`,
`issues`.

Query helpers — `personsBy({type, sourceSurface})`,
`participationsByContext(contextId)`, `giftsByGiver(personId)`,
`countBy(entityName, predicate?)`, `byId(entityName, id)`.

Aggregate-default projections — `connectionFunnel()` (cumulative-reached
funnel, monotonically non-increasing), `connectionFunnelBy({sourceSurface})`,
`pilotMetrics()` (totalIndividuals, per-stage counts, conversions,
`totalDollarsAtGave`, `distinctOrgsAtGave`, `medianDaysMatchedToGave`),
`recentActivity({limit})` (sorted timestamp desc — CR stage transitions +
Issue events; gifts deduped via the CR `gave` transition),
`platformHealth()` (5 runChecks suites + composition + informational +
externalMonitoring), `openIssueCount()`, `openIssues()` (sorted openedAt
desc), `issueCountByStatus()`, `issueCountByCategory()`.

Record-level (explicit, not default landing data) —
`connectionsByGiver(personId)`, `connectionsByTarget(orgIdOrName)`.

---

## 5. Surface status

| Surface | Status |
|---|---|
| **Operations Overview** | **Complete and QA'd.** Overview ships 8 redesign slices (A–H, 2026-06); QA audit on branch `qa-audit-operations` (53 findings + 3 amendments = 56 total, doc at `docs/qa-audit-operations-2026-06-09.md`; **branch unmerged** by design). Fix bundles 1 (a11y highs QA-015–018), 2 (copy + structure QA-001/002/024/054 + lows 025–029), 3 (`801123a` — decision-free fixes QA-003/007/008/020/022/031/037–039/042/043/052, incl. deletion of the dead `UserList` stub), and 4 (`20354cc` — code quality QA-032/033/034/044/046/048/050/053, the `ExpandableRow` extraction, two QA-048 resolvers, three new tokens, and the Mission→Progression internal renames) banked. **Route-pages arc complete** (5 slices, 2026-06): slice 1 deleted the `health` tab + route stub, added Organizations to the nav, wired composition tiles as drills; slices 2–5 shipped live directory pages at `/operations/{individuals,institutions,advisors,organizations}` (77 / 4 / 7 / 17 records, all fixture-faithful with live-derived count headers). **Detail-routes arc complete** (6 slices + Candid interleave, 2026-06): per-record detail routes at `/operations/{dir}/:id` for all four entities — slice 1 (`2d1cf1c` — Institution detail, routing skeleton), 2 (`d327080` — AdvisorPractice detail), 3 (`abe5141` — Organization detail), 4 (`760af13` — Individual detail, type-aware: full view for `type='individual'`, light view for staff/advisor), Candid interleave (`3b7da48` — Organization detail restructured to the GuideStar/Candid profile flow: `foundedYear` literals added to `orgsData.js`, cause label "Economic" → "Economic Mobility" in `intakeData.js`, Person.causes normalized to a string-ID array in `adapters/individual.js`), 5 (`dacde68` — URL-filter state on all four directories: `q` debounced / `source` / `cat` / `causes` / `ids`-override, URL as source of truth, `replace` writes), and 6 (`743de6a` — drill wiring: rows clickable with filter persistence via `location.state.fromQuery`, shared `<AboutLine>` on Issue/Activity expand panels, pre-plan-clients drill behind a build-time derivation gate, ALL FOUR pilot tiles documented-unlinked by founder ruling with per-tile unlock conditions in code) banked. Chrome pattern across detail pages: `<BackLink>` with explicit `to` + `location.state.fromQuery` preservation, shared `<NotFoundCard>` for invalid IDs, dotted-bronze cross-links. **Fix bundle 5** (`e1e3600`) — founder visual cluster: QA-004 (Operations persona wired to `CURRENT_OPS_USER` in new `data/opsFixtures.js`); QA-014 reading A (activity-row chip drops border + adds `cursor:default`, surface accent moves from border to chip text color); QA-021 (muted text inside the Open issues tint card swapped to `--sh-text-secondary` — both the IssueRow meta line and the "Per-issue detail view coming soon." footnote — contrast moves from ~3.46:1 to ~8:1 against `--sh-bg-tint`); QA-030 ruling b1 (`SURFACE_COLORS.Operations` swapped from `--sh-bronze` to `--sh-text-secondary` — Operations now reads quiet internal, distinct from Advisor's bronze). Wontfix per founder ruling: QA-011 (no new funnel footnote, consistent with the pilot-tile decision), QA-013 (SuiteRow copy-to-clipboard defer until attention-state fires), QA-040 (asymmetric `<main>` padding by design), QA-045 (date-helper overlap acceptable per audit), QA-051 (no React.memo at current scale), QA-035 (bronze progression bars on tint track — editorial restraint, 3:1 non-text contrast met), QA-036 (expand-panel prominence asymmetry — intentional: Open issues is the higher-priority attention signal). **Audit posture: 55 of 56 findings resolved**; remaining 1 — QA-023 blocked on a future CR-level filtered view. |
| **Enterprise** | **Built and audited.** All 6 sections live (Overview, Roster, Program, Compliance, Reports (+ 5 sub-pages), Setup wizard). QA audit on branch `qa-audit-enterprise` (**157 findings** — 9 Critical + 33 High + 60 Medium + 55 Low — doc at `docs/qa-audit-enterprise-2026-05-30.md`; **branch unmerged** by design). **Count guard:** the audit's executive-summary "Medium: 76" is a typo (actual Medium = 60, verified by counting numbered lines); CLAUDE.md previously inherited the typo as "173 findings" — corrected here. The 26 Compliments listed in the audit are observations of working-well things, not findings, and are counted separately. **Enterprise does NOT use Advisor's numbered-bundle model.** Criticals + Highs shipped as direct per-finding-or-grouping commits; Mediums + Lows went through the cluster-based triage in `docs/qa-triage-medium-low-2026-05-30.md`. **9 Criticals shipped** (`33cb42f` covered all 9; `3bb9cb1` later completed Critical #9's full activity-log reconciliation as a side effect of fixing Medium #91). **32 of 33 Highs shipped — 1 deferred (#12)** post Sweep 1 + Sweep 2. The original 26 (pre-Sweep) were addressed via `33cb42f` (Criticals bundle's secondary effects), `fd7b2b0` (Diane Okonkwo normalization, #17 + #29), `a525b29` (compliance officer + Andre/Ava + Mia/Jordan + CohortComparison yoy, #18/#21/#23/#24), `be6febc` (ISO dates + cohort framing, #19/#20), `aa56b64` (engagementTimeline derivation, #22), `d0e82fb` (React keys + responsive padding, #25-#28 + #32), `542e893` (ModalStack perf, #42), `bc0beb9` (persona canonical, #31 as side effect), and the `7998c7d` "narrative re-authoring" sweep that closed the voice/internal-leak cluster #30 + #33-#41 (10 items). **Sweep 1** (`daf8ac4`) — token-discipline sweep: closed the 5 brand-token Highs — **#10** (HelpIcon border `#B8AE9E` → `--sh-bronze-border`, accepted visual shift to warmer/lighter accent), **#11** (Tag.jsx accent palette → 3 existing tokens `--sh-divider` / `--sh-text-secondary` / `--sh-bronze-border`), **#13** (Button.jsx primary text `'#FFFFFF'` → `--sh-text-on-accent`), **#14** (SetupWizard stepper text `'#FFFFFF'` → `--sh-text-on-accent`); **deferred #12** (Tag `warning` palette — consumed by paused Individual `Team.jsx`: keep palette, add `--sh-warning-bg/text/border` tokens when Individual resumes — don't remove live-but-dormant code). Sweep 1 ALSO dispositioned **all 11 BATCH Cluster IV items**: substantive token swaps for #58 (Modal padding) / #59 (DailyBrief marginTop) / #60 (EnterpriseProgram minWidth) / #61 (SetupWizard space) / #62 (SetupWizard radius) / #66 (HelpIcon 9px → `--sh-text-xs` F1-nudge per advisor ADV-006 precedent) / #68 (new token `--sh-border-accent-deep: 4px solid var(--sh-bronze-deep)`, matching the bundle-4 `--sh-border-accent` shape; single consumer at PhilanthropicReadiness); partial: #63 (6 of 8 sites swapped to `--sh-radius-md`, 2 Individual sites deferred per paused-surface ruling) + #67 (2px → `--sh-space-half` clean swap; 72px + 6px documented as contained primitives with inline comments); documented-as-contained-primitive: #64 (Button padding triple, per audit's own ruling) + #65 (Chrome 34px avatar, inline comment). **Sweep 2** (`03b77a9`) — a11y Highs: **#15** EnterpriseRoster `<tr>` keyboard support (`tabIndex={0}` + `onKeyDown` Enter/Space with `preventDefault` + `aria-label`; row semantics preserved — no `role="button"` override per WAI-ARIA tabular-data practice, distinct from OperationsSurface `ExpandableRow`'s div-as-button pattern); **#16** HelpIcon a11y additions (`aria-expanded` + `aria-controls` via `useId` + Escape-close `onKeyDown`; `onBlur` preserved). **HelpIcon cross-surface note:** currently consumed only by Advisor's `Pipeline.jsx` (2 sites — `:86` + `:445`); Sweep 1 + Sweep 2 changes benefit that surface + any future Enterprise consumer that picks up the shared component. **Sweep 3** (`ed58670`) — Cluster II dead-code cleanup: 6 removals — **#49** (unused `statusFor` import in EnterpriseOverview), **#50** (uncalled `SelectField` component, SetupWizard), **#51** (uncalled `RadioGroup`/`Radio` components + 4 confined styles, SetupWizard), **#52** (unimported `CardHeader` function, Card.jsx — 33 lines; the `Card` primitive itself + the `accent` prop kept), **#53** (unconsumed `depth` field in ModalStackContext — removed from default context + value object + deps array + JSDoc typedef), **#54** (`inProg` un-exported in enterpriseStats.js — visibility tightening; const stays, just no longer surfaced to consumers). **#55 reclassified NOT-A-FINDING**: the audit flagged `Card`'s `accent` prop as dead, but a live consumer at `OperationsSurface.jsx:275` (Open Issues bronze accent stripe) post-dates the 5/30 audit — the prop is in active use. #55 joins the **#31 / #93 / #94 "audit pre-dated the consumer/fix" pattern** — the audit captured a concern that subsequent independent work resolved, so the disposition is closed-as-not-finding rather than closed-as-fixed. **Net −136 lines** for the Sweep 3 commit. **Sweep 4** (`d90c513`) — Cluster V (React keys / patterns, all 5) + Cluster III (perf tweaks, both 2): **#69** (curriculum `key={i}` → `key={title}` across EnterpriseProgram + SetupWizard, 2 sites), **#70** (BarChart `key={i}` → `key={labels?.[i] ?? i}` with defensive fallback for the undefined-labels case; 2 sites — BarSlot + xAxis span), **#71** (WorkshopCalendar 42-cell grid `key={i}` → `key={key}` reusing the already-computed `dateKey(...)` local var; the highest-value correctness fix — month-nav was relying on positional index across re-renders), **#72** (Modal `titleIdRef` switched from `useRef(\`modal-title-${Math.random()...}\`)` inline template to the null-guard pattern matching the sibling `idRef`; same rendered id stability, no per-render template re-eval), **#73** (Chrome `UserIdentity` refactored — extracted `ClickableUserIdentity` subcomponent so the `useState` hover allocation happens only on the clickable branch; DOM render-equivalent for both branches, verified by visual smoke + grep on `gap: var(--sh-space-3)`), **#56** (`engagementMin` + `engagementMax` hoisted to module-level exports in `shared/enterpriseStats.js`, consumed by EnterpriseOverview + ProgramSummary BarChart ariaLabels — was `Math.min(...spread)`/`Math.max(...spread)` per render; static fixture data, computes once at module load now). **#57 SKIPPED-PREMATURE** per the QA-051 "no React.memo at current scale" lens (N=5 workshops, 42 grid cells; documented, no code). **No new tokens this sweep.** Notable artifacts: `ClickableUserIdentity` in Chrome.jsx, `engagementMin` / `engagementMax` consts in enterpriseStats.js. **Cluster VI** (`ed29a80`) — voice/tone cleanup of the largest editorial bloc (18 items): **12 platform-voice fixes** + **6 not-a-finding closes across two distinct sibling patterns**. **12 fixed**: **#74 + #75** (4 report h1s + REPORT_CARDS Title Case → sentence case — "Program summary" / "Cohort comparison" / "Philanthropic readiness" / "Program outputs"); **#78** (`WorkshopDetail.jsx` `Follow-ups · {n}` middle-dot → `Follow-ups ({n})` parens — middle dot is overloaded elsewhere as a metadata-item separator); **#83** (`EnterpriseCompliance.jsx:106` "tamper-resistant audit log" duplication trimmed — the phrase already lands at `:93`, so `:106` was reduced to "This audit log is read-only in production"); **#85** (`EnterpriseCompliance.jsx:60` product-noun leak "Give Screen" → user-facing "when choosing a gift target" — same class as Highs-tier #41 "Individual surface" leak); **#87** (daily-brief coined "uncontacted N days" → "— no contact in N days"); **#88** (`EnterpriseProgram.jsx:39` subtitle dropped "participating" — `{N} athletes · {term} · {dateRange}` now reads as three parallel noun phrases); **#101** (`AthleteProfile.jsx:93` single-athlete caption grammar fix — "Athlete's" singular possessive paired with "their" plural pronoun was contextually wrong on a single-athlete profile; switched to "Their own words on their philanthropic practice..."); **#102** (`Endowment.jsx:73` "interactive modeling" sell-word → "projection model"); **#104** (`EnterpriseProgram.jsx:74` "16-lesson v1 curriculum" version leak → "16-lesson curriculum"); **#77** (`CohortComparison.jsx:142` "not measuring achievement" → "not ranking athletes" — **explicitly NOT the audit's proposed "merit"**, which reads MORE evaluative than "achievement" and would have moved the wrong direction); **#79** (`enterpriseFixtures.js:445` Workshop 2 note `"2 absent (scheduling conflict). Recording shared."` → `"Two absent — scheduling conflict. Recording shared."`). **6 not-a-finding closes across TWO distinct sibling patterns** — both record reasons a finding closes as not-a-finding, but for different underlying causes: **(a) AUTHORED-VOICE EXEMPT (3)**: **#80** (operator-authored `action` fields on workshop follow-ups — imperative-fragment register is the correct register for action items written by a staff `owner`), **#81** (operator-authored note labels at `enterpriseFixtures.js:280` activity-log entry + `:459` workshop attendance reason — both are operator-written records displayed back), **#100** (`enterpriseFixtures.js:733` Marcus first-person reflection rendered in `AthleteProfile.jsx:88-104` under SectionLabel "Reflections" with the in-code marker `{/* Reflections — athlete's own first-person voice (Path B) */}` — the strongest case in the cluster, since Path B is explicitly invoked in code to mark this content as authored-voice exempt). This trio parallels Advisor **ADV-014** (PracticeHome journal voice) + **ADV-021** (Marcus private-notes voice) — Path B governs **platform-authored** copy, NOT in-character seed content displayed back to its author. **(b) INTENTIONAL-PRECISION (3)**: **#84** (`PhilanthropicReadiness.jsx:74` "Counts are mutually exclusive across stages" — methodology footnote; "mutually exclusive" is the precise statistical term, softer wording would trade precision for warmth in a stat-method context where precision is doing real work), **#86** (`Endowment.jsx:64` 5% payout-rule paragraph — intentional legal/financial precision; the section already carries the `:189` "Not investment advice... subject to legal review prior to partnership finalization" disclaimer, so the compressed technical voice is structurally load-bearing), **#89** (`enterpriseFixtures.js:546` lowercase "Cooper State athletics" — descriptive common-noun reading ("the athletic program at Cooper State"); the capped instances are the proper-noun org name ("Cooper State Athletics Booster Association"); the audit's call for uniform Title Case would erase a grammatically defensible distinction). **Pattern note**: the not-a-finding bookshelf now carries TWO sibling patterns — **audit-pre-dated-the-consumer/fix** (#31 / #55 / #93 / #94 — concern was real at audit time but subsequent independent work resolved it) and **authored-voice-exempt** (#80 / #81 / #100 — Path B's platform-voice scope doesn't reach in-character authored seed content displayed back to its author, ADV-014/021 sibling). Two different reasons a finding closes as not-a-finding. **Minor-cluster sweep VII + VIII + IX** (`8ecdaf3`) — 12 items across the three minor BATCH clusters: **9 fixed** + **3 not-a-finding closes**. **9 fixed**: **#95** (`SetupWizard.jsx:283` empty `onClick={() => {}}` dropped — Button doesn't require a handler; the `disabled` prop carries the intent); **#97** (`EnterpriseCompliance.jsx:20` session id ``Date.now()`` → `crypto.randomUUID()` — eliminates the double-click-in-same-ms collision possibility); **#108** (Modal `closeFocused` state + inline outline removed — the global `:focus-visible` rule at `global.css:59-60` now governs the close button; visible UX delta: ring shows on keyboard Tab navigation but NOT on mouse-open modal mount, aligning with `:focus-visible` spec intent; 8 modal consumers benefit); **#111** (`ComposeMessage.jsx` fixed `compose-recipients-options` datalist ID → `useId()` — resolves modal-stacking collision risk); **#112** (`HelpIcon.jsx:52` `cursor: 'help'` → `'pointer'` — the icon is a click-toggle popup, not a hover-help affordance); **#114** (`EnterpriseCompliance.jsx:89-108` audit-trail Card outdented 2 spaces to 6-space sibling indent matching its actual JSX depth — pure cosmetic, zero behavior); **#116** (`Card.jsx:4` 2-line comment documenting that `hovered` state is always allocated but only consumed when `isClickable`; **InteractiveCard extraction flagged as a Cluster I candidate** — same #73 ClickableUserIdentity precedent, but bigger than minor-cluster scope); **#123** (`enterpriseFixtures.js:641` `programTerm` middle-dot → em-dash `'Season Residency — Aug 2025 to May 2026'` to match the `INST_PROFILES.contract` convention that the `EnterpriseProgram.jsx:28` parser depends on via `.split(' — ')`); **#96** (`enterpriseFixtures.js` `exclusions[]` **EXPANDED 3 → 6** — added Quick Cash Sports Loans LLC (id 4, EIN `04-3367892`), TigerBet Online Sportsbook (id 5, EIN `04-2294516`), Premier Athletic Apparel Co (id 6, EIN `04-1145037`) as real exclusion records so audit-log entries `audit-002`/`003`/`004` now reference orgs that EXIST in the live list — **this is a visible compliance-integrity fix, not hygiene**: the audit trail UI was previously claiming exclusions that weren't in the list. All 3 new connectionDetails use the neutral disclosure-model framing ("Athletes still see the org in their giving view... — disclosure model, not blocking") consistent with the original 3 entries and the #85/Path B ethos). **3 not-a-finding closes**: **#98** (`EnterpriseProgram.jsx:28` + `EnterpriseSurface.jsx:29` `contract.split(' — ')` parses — both sites already carry defensive fallbacks; **joins the audit-pre-dated-the-consumer/fix pattern** alongside #31/#55/#93/#94 as the 5th member); **#127** (`AthleteProfile.jsx:24` + `UserProfile.jsx:20` `useComms()` called unconditionally before any early-return — this is **mandatory** per React Rules of Hooks; the audit's recommendation would itself violate React. Any outside-Provider defense belongs inside `useComms()`, not the consumer call site. **NEW close-reason pattern: AUDIT-FRAMING-WRONG**); **#90** (mixed integer baseline IDs vs string IDs across fixtures — the audit asked to standardize NEW entities to strings, NOT to migrate the integer baseline; every new entity introduced since the audit (unified-layer namespaced IDs, clients, cohorts) already uses string IDs, so the forward policy is already in place. Closes as forward-policy-already-in-place, sibling of AUDIT-FRAMING-WRONG since the audit's read of the policy was off). **NOT-A-FINDING TAXONOMY** — the Enterprise arc surfaced FOUR distinct close-reason patterns. All record "the audit flagged X but X is not a defect," but for different underlying causes; future sessions and re-audits should not treat any of these as open defects without re-checking against the relevant pattern: **(1) AUDIT-PRE-DATED-THE-CONSUMER/FIX** (5 items: #31, #55, #93, #94, #98) — the audit captured a real concern at audit time, but subsequent independent code resolved it; **(2) AUTHORED-VOICE-EXEMPT** (3 items: #80, #81, #100) — Path B governs **platform-authored** copy, not in-character seed content displayed back to its author (workshop staff action-item fragments, operator-written note labels, athlete first-person reflections); direct sibling of Advisor's ADV-014 (PracticeHome journal voice) + ADV-021 (Marcus private-notes voice); **(3) INTENTIONAL-PRECISION** (3 items: #84, #86, #89) — methodology / legal / grammatical-distinction language that should stay precise; softening would trade meaning for warmth in contexts where the precision is doing real work (stat-method footnotes, legal/financial payout-rule disclosures, grammatically defensible proper-noun vs common-noun distinctions); **(4) AUDIT-FRAMING-WRONG** (2 items: #127, #90) — the audit's recommended fix is itself incorrect: would violate a platform invariant (React Rules of Hooks) or misread the existing policy (the standardize-NEW-entities ask was already in force). Closes as the recommendation-itself-is-broken pattern. **Cluster I** (banks `42354ba` → `36a13fa` → `65eb7fd` → `3afe4a0`) — shared-primitive extractions, **the last substantial Enterprise slice** executed as **4 isolated sub-slice banks**. **4 extracted + 1 DEFERRED + 1 NOT-A-FINDING (paused-surface)**: **#45 MessageHistoryCard** (`42354ba`) — extracted verbatim Card block + 6 style consts from `AthleteProfile.jsx` + `UserProfile.jsx` into shared `src/components/MessageHistoryCard.jsx`; pure presentational, takes `messages` as a prop; `useComms()`/`getThread()` STAYS in each parent (Rules-of-Hooks discipline, #127 sibling — pulling the hook into the new component would force every consumer to be inside a CommsProvider); net −120 lines. **#43 DataTable** (`36a13fa`) — extracted shared `src/components/DataTable.jsx` from EnterpriseRoster + ProgramOutputs + CohortComparison; columns API with `lead`-serif + `nowrap` per-column flags (Organization wraps, Sport nowraps); `onRowClick` preserves EnterpriseRoster's Sweep-2 #15 row keyboard-activation a11y (`tabIndex={0}` + Enter/Space + `preventDefault` + `aria-label`, row semantics preserved with NO `role="button"` override per WAI-ARIA tabular-data practice); `minWidth` param (880px Roster, 560px reports default); net −189 lines. **#44 Tag tracking extension** (`65eb7fd`) — extended `Tag.jsx` with `tracking='loose'` preset (letterSpacing `0.06em` — midpoint of pre-existing 0.04em role pills and 0.08em status pills; padding `2px 8px`; weight 500; no border) PLUS additive `style` prop (for ContactsDirectory `flexShrink:0` and EnterpriseProgram `marginLeft`); migrated 6 inline bronze-tint pills (ContactsDirectory `rolePillStyle`, UserProfile `rolePillStyle`, EnterpriseCompliance `sessionPillStyle` SESSION, EnterpriseProgram `pendingPillStyle` "Pending review", Endowment `reviewPillStyle` REVIEW PENDING, SetupWizard `pendingPillStyle` PENDING); Tag's 4 EXISTING Advisor consumers (CurriculumLibrary ×3, DraftsList ×1) **UNAFFECTED** — default tracking unchanged, render byte-identical; net −52 lines. **#48 SegmentedControl** (`3afe4a0`) — extracted **ENTERPRISE-SCOPED** `src/components/SegmentedControl.jsx` from SetupWizard + Endowment (the bordered-jointed treatment) using **Endowment's N-button `borderRight` convention** (generalizes to N > 2; SetupWizard's logic produced double-seams in N > 2) plus a **FREE A11Y UPGRADE** (`role="group"` + `aria-labelledby` + `aria-pressed` per button — the Enterprise pair previously had NONE); `size="sm"` covers SetupWizard padding 4px 12px, default `size="md"` covers Endowment 6px 14px; consumers thread `ariaLabelledBy` via `useId()` against the visible label span; also renamed Endowment's control label `"Term horizon"` → `"Commitment term"` (advisory-team converged copy ruling per Parker/Morgan: relational partnership register, names what the department is committing to — not investment-product voice like "endowment term" or "contribution length"); net −59 lines. **#48 CROSS-SURFACE DIVERGENCE FINDING (important for future re-audits)**: the 5/30 audit framed #48 as a SetupWizard/Endowment `borderRight`-convention disagreement, but pre-build investigation found the 4 SegmentedControl consumers carry **THREE distinct visual treatments** — pill (Advisor `LessonEditor.jsx:365`), fused-rectangle (Advisor `Pipeline.jsx:456`), bordered-jointed (Enterprise pair). The Advisor treatments are **deliberately distinct for different UX contexts** (LessonEditor's category/scope picker vs Pipeline's drawer state-picker), NOT drift to converge. **Ruling: Option C — scoped #48 to the Enterprise pair only; Advisor's `LessonEditor` + `Pipeline` local `SegmentedControl` function components left BYTE-UNCHANGED** (banked Advisor surface preserved, zero regression risk). All 4 consumers share the API + a11y substrate (`options`/`value`/`onChange`/`ariaLabelledBy`, `aria-pressed`, `role="group"`) but NOT the visual treatment. **ADV-044** (radiogroup-vs-aria-pressed deferred decision) stays a single Advisor concern, **NOT resolved** by this extraction. **Future sessions: do NOT re-flag Advisor's two SegmentedControls as un-DRY'd — the divergence is intentional.** **Two non-extracted Cluster I dispositions**: **#47 StatusDot/Bullet — DEFERRED** (2 consumers — `WorkshopDetail.jsx:203-212` status-variant 3-state dot vs `DailyBrief.jsx:165-173` decorative bullet — are semantically different, not real DRY; the #57 / QA-051 premature-abstraction lens applies. Revisit only if a 3rd genuine status-dot consumer appears with the same shape). **#116 InteractiveCard — NOT-A-FINDING (paused-surface)**: multiline grep confirms all 3 `interactive`/`onClick`-bearing Card consumers (`IndividualSurface.jsx:257`, `IndividualSurface.jsx:446`, `Learn.jsx:86`) are in frozen Individual v0.6.1; **ZERO active consumers** in Enterprise / Advisor / Operations / shared components. **4th paused-surface ruling**, sibling pattern alongside #12 (Tag warning palette) + #63 (2 Individual radius sites) + Tag-warning (same #12). `Card.jsx:4` comment (added during the minor-cluster sweep) already documents the consumer set; no extraction performed. Closes when Individual unpauses. **Cluster I net impact**: 4 new shared primitives in `src/components/` (`MessageHistoryCard`, `DataTable`, `Tag` tracking variant, Enterprise-scoped `SegmentedControl`), **~420 lines of duplication collapsed**, +1 free a11y upgrade (Enterprise SegmentedControl pair gained `aria-pressed` + `role="group"` + `aria-labelledby` they previously lacked). **115 Mediums + Lows triaged** into 5 disposition buckets: **ALREADY-CLOSED (6)** — implemented incidentally before triage (includes #93 + #94 moved here from FIX-NOW after Cluster A shipped, per the triage doc's own Update note). **FIX-NOW (3 findings remaining post-Cluster-A-ship)** — all SHIPPED: Cluster B (#91 lesson-count reconciliation) via `3bb9cb1`; Cluster C (#76 Reports card "performance" + #82 W2 "stalled" voice) via `a1b505b`; Cluster A (#93 Chrome persona + #94 SetupWizard Diane) already shipped via `bc0beb9` and moved to ALREADY-CLOSED. **WON'T-FIX (41)** — audit-marked accept / by-design / verification-only observations, resolved by disposition (no code needed). **DEFER (5 M+L)** — revisit on specific later conditions (mobile QA pass, advisor Documentation rework, bundle-size threshold, etc.). **BATCH (60) — 60 dispositioned across Sweeps 1 + 3 + 4 + Cluster VI + minor-cluster sweep VII+VIII+IX + Cluster I, 0 REMAINING**: Sweep 1 resolved Cluster IV (11: token discipline); Sweep 3 resolved Cluster II (7: dead-code cleanup — 6 removed + #55 reclassified not-a-finding); Sweep 4 resolved Cluster V (5: React keys / patterns, all fixed) + Cluster III (2: perf tweaks — 1 fixed, 1 documented-skip); Cluster VI resolved (18: voice / tone — 12 fixed + 6 not-a-finding across the two sibling patterns above); minor-cluster sweep resolved Cluster VII (4: code-quality — 2 fixed + 2 not-a-finding), Cluster VIII (3: data-consistency — 2 fixed + 1 not-a-finding), Cluster IX (5: misc Low — all 5 fixed); Cluster I resolved (5: shared primitive extractions — 4 extracted + #47 DEFERRED + #116 NOT-A-FINDING paused-surface). **All 9 BATCH clusters (I–IX) closed.** **Naming-scheme note:** FIX-NOW uses LETTER clusters A/B/C (all shipped); BATCH uses ROMAN-NUMERAL clusters I–IX. Enterprise still does NOT use Advisor's numbered-bundle model — "**Sweep N**" is a distinct sequencing label introduced for the Enterprise-depth work, parallel to but distinct from Advisor's "Bundle N" cadence. **Audit posture: 156 of 157 SHIPPED-or-dispositioned-or-deferred-or-not-a-finding — 9 Critical + 32 High shipped + 1 High deferred (#12) + 6 ALREADY-CLOSED + 3 FIX-NOW + 41 WON'T-FIX + 5 DEFER (M+L) + 60 BATCH dispositioned (Cluster IV=11, II=7, V=5, III=2, VI=18, VII=4, VIII=3, IX=5, I=5). #12 is the only open implementation item (deferred High, paused-Individual-gated — sibling of #116 / #63 / Tag-warning paused-surface pattern; closes when Individual unpauses).** Arithmetic: 9+32+1+6+3+41+5+60 = 157 all-dispositioned ✓; BATCH internal sum 11+7+5+2+18+4+3+5+5 = 60 — every BATCH cluster closed. **Enterprise depth arc COMPLETE.** Cluster I net impact (restated): 4 new shared primitives (`MessageHistoryCard`, `DataTable`, `Tag` tracking variant, Enterprise-scoped `SegmentedControl`), ~420 lines duplication collapsed, +1 free a11y upgrade. Fixture dates are uniformly shifted −192d for coherence with today (`Enterprise fixture date coherence` commit `7998c7d`). |
| **Advisor** | **Built and audited.** 8-section IA (PracticeHome, ClientRoster, ClientWorkspace, CurriculumLibrary, CohortSpace, Pipeline, Documentation, PracticeSettings; plus auxiliary DocCreate/DocDetail/LessonDetail/LessonEditor/DraftsList/CohortDetail). All 9 clients seeded with distinct fictional substance per the locked roster. QA audit on branch `qa-audit-advisor` (41 findings, doc at `docs/qa-audit-advisor-2026-06-13.md`; **branch unmerged** by design — the audit doc's executive-summary "43 unique IDs" is a typo, verified during tail-triage: ADV-034 and ADV-037 never existed at any heading level or as cross-references; actual H3-header count is 41). Fix bundles 1 (`623c1ab` — copy sweep: ADV-001 "Track and Field" title-case, ADV-003 "Section N" kicker leak removed from 10 user-facing sites), 2 (`c941df3` — brand-token sweep + `StateBadge.jsx` extraction (ADV-004/005/008); three new tokens added: `--sh-state-active-bg` and `--sh-state-active-text` (the system's first non-warm semantic colors) plus `--sh-text-on-accent`), 3 (`5c6f3e7` — pixel-literal sweep (ADV-006); ADV-026/028 deferred to the ADV-025 drawer slice; ADV-033 880px wrapper closed as intentional editorial choice), 4 (`776fa4d` — glyph→SVG sweep (ADV-007 in-scope, 6 sites); established the platform's first shared icon registry at `src/components/Icon.jsx` (`chevron-right`, `chevron-left`, `plus`; idiom seeded by `BackLink.jsx`); `?` re-classified not-finding (standard ASCII punctuation, not icon-substitute); PracticeHome:148 / Pipeline:321 / DocCreate:179 carried to bundles 7 / 6 / 5), 5 (`27e1c8c` — a11y cluster: ADV-016 (search aria-label), ADV-031 (section-error `role="alert"`), ADV-035 (flag-toggle aria-pressed), ADV-039 (LessonDetail file/title aria-labelledby via `useId`), ADV-036 (DocCreate + LessonEditor FormField label association via guarded `cloneElement` onto native input/textarea/select children only — wrapped non-native children pass through unchanged); opened **ADV-044** (SegmentedControl pick-one / aria-pressed semantic mismatch — deferred) and applied SC-α group-labels to LessonEditor's SegmentedControl as the first coverage), and 6 (`2e30b24` — Pipeline ConfigDrawer a11y: ADV-025 focus trap via a new shared hook `src/components/useDialogA11y.jsx` (mirrors `Modal.jsx`'s trap but with a `.contains()`-aware boundary check that's robust to SVG-only button content — a strict improvement over Modal's text-node-dependent comparison, ready for a future Modal-DRY slice; Modal.jsx itself untouched, so the 8 existing Modal consumers carry no regression risk); ADV-026 (two new tokens `--sh-overlay-drawer` + `--sh-shadow-drawer` — distinct from `--sh-overlay-bg`/`--sh-shadow-modal` for the side-drawer geometry); ADV-028 (transition → `--sh-transition-fast`, F1-precedent nudge); the `×` close glyph → Icon registry (added `close`); SC-α group-labels on Pipeline's SegmentedControl AND RadioList), 7 (`226af00` — ADV-009 fake-control removal: 5 dead controls deleted — PracticeHome "New entry", PracticeSettings Change/Change/Configure on the Working preferences card, CohortSpace "Start a cohort" — plus the forced layout cleanup each removal left: vestigial single-child flex wrapper collapsed in CohortSpace, now-purposeless `marginBottom` dropped on PracticeHome's journal meta line, orphaned `Button` import removed from CohortSpace; the advisor surface is now affordance-honest — every visible button has a real handler), 8 (`0a39530` — ADV-015 URL-state sync on ClientRoster: `q` (debounced, 250ms) / `stage` / `sport` synced to the URL via `useSearchParams`, ported faithfully from the Operations slice-5 pattern (URL as source of truth, `replace` writes, default-omission for clean URLs, inline `parseSingleSelect` for the single-select-with-"All"-sentinel shape vs Operations' Set-based multi-select); PracticeHome's 4 stage Stat-card links updated to **C-α literal casing** (`?stage=Active` not `?stage=active`) so they round-trip through the validation; ClientRoster's filtered views are now shareable and refresh-survivable; the Operations slice-5 URL-state pattern now has **5 in-tree consumers** (4 Operations directories + ClientRoster), giving a future `useDirectoryFilters` hook its consumer set for a DRY-extraction slice when prioritized), 9 (`a3654c1` — tail-triage copy/structure: ADV-002 (CohortSpace decorative `<SectionLabel>` → plain `<p>` eyebrow, fixing an h2-above-h3 semantic inversion; the 5 legitimate CohortDetail `<SectionLabel>` section headings left untouched) + ADV-022 (CurriculumLibrary stat-row parallelism "Base/Tailored/Authored" + body-copy "forks"→"tailored lessons" terminology alignment)), 10 (`7c4bf78` — tail-triage affordance honesty: ADV-013 (dropped the false "4 entries this month" journal count from PracticeHome) + ADV-024 (removed the two always-empty CohortDetail Curriculum-track + Sessions sections — no data path, no write affordance; same spirit as ADV-009 bundle 7)), 11 (`41786b9` — tail-triage brand consistency: ADV-020 (`window.confirm()` → Modal-based discard flow using `Modal.jsx` directly, untouched; the advisor surface now has **zero native browser confirms**); ADV-030 closed as not-finding — the inline "+ New section" button is a deliberate visual pairing with the adjacent "+ New document" `<Link>` sibling, converting to `<Button>` would break the pairing and lose the bronze), and 12 (`2c89164` — tail-triage data + a11y: ADV-011 (live `new Date()` → static seed-aligned `'Monday, May 4'` demo date; verified Monday via UTC parse) + ADV-012 (9 client `nextSession` fixtures migrated to ISO `'YYYY-MM-DD'`, new `formatSessionDate(iso)` helper exported from `src/data/clients.js` with `timeZone:'UTC'` for day stability, 4 display sites wrapped — spec-guaranteed parse, byte-identical display output) + ADV-041 (field-level minutes error inside the FormField with `role="alert"` + `aria-invalid` + `aria-describedby` mirroring bundle 5's Documentation section-error a11y pattern; `canSave`/disabled logic unchanged — purely additive feedback)) banked. Locked dispositions: ADV-009 (fake-interactive controls) → **5 removed in bundle 7** (PracticeHome / PracticeSettings × 3 / CohortSpace) **+ 4 Stage Rename buttons carved out as a future sibling slice** per CLAUDE.md §7 ("renameable per advisor preference") — the 4 render from a single `stages.map()` at `PracticeSettings.jsx:57` and are deliberately preserved; **6 closed as not-finding or intentional** — ADV-014 (PracticeHome journal voice) + ADV-021 (Marcus private-notes voice) closed because Path B governs platform-authored copy, not advisor-authored seed displayed back to the advisor (advisor-internal voice); ADV-033 (`maxWidth: '880px'` on PracticeSettings) closed as intentional editorial choice; **ADV-010** (5 local-only state sites with honest disclosure copy) closed per audit author's own "acceptable per prototype scope" framing; **ADV-038** (LessonDetail body placeholder) closed for the same disclosure-acceptable framing; **ADV-030** (Documentation inline "+ New section" button) closed because it's a **deliberate visual pairing with the adjacent "+ New document" `<Link>` sibling** — converting to `<Button>` would break the pairing and lose the bronze; the audit's "inconsistent with `<Button>`" framing missed the local Link↔button consistency the design achieves by intent. **2 deferred** — ADV-019 (3 code-comment "Section N" leaks in ClientWorkspace) folded into a future code-quality refactor slice (not user-facing, no urgency); **ADV-044** (SegmentedControl + RadioList single-select with `aria-pressed` instead of radiogroup semantics) open and deferred — applies to all three single-select controls (LessonEditor SegmentedControl, Pipeline SegmentedControl, Pipeline RadioList); full radiogroup conversion is a future micro-slice. **Audit posture: 33 of 42 dispositioned — 25 fixed (ADV-001/002/003/004/005/006/007/008/009/011/012/013/015/016/020/022/024/025/026/028/031/035/036/039/041), 6 closed as not-finding or intentional (ADV-010, ADV-014, ADV-021, ADV-030, ADV-033, ADV-038), 2 deferred (ADV-019 to a future code-quality slice; ADV-044 to the radiogroup decision).** (**Denominator is 42** — 41 audited findings (the audit summary's "43" is a typo; ADV-034 and ADV-037 never existed) plus ADV-044 opened during bundle 5.) **The Advisor QA arc — audit + all 12 fix bundles + tail triage — is COMPLETE. No planned QA fix bundles remain.** Remaining items are **feature / decision / future-triage, not QA fixes**: **Stage Rename sibling slice** (feature — wire the 4 carved-out `PracticeSettings.jsx:57` Rename controls to a real Modal-based rename flow with state + persistence per CLAUDE.md §7); **ADV-044 radiogroup micro-slice** (decision — accept the `aria-pressed` debt as documented, OR convert all three single-select controls to `role="radiogroup"` + `role="radio"` + `aria-checked` + arrow-key handling). Two **new known-issues discovered during the tail triage** (not part of the audit's 42, not yet triaged): **(a)** `cohort.nextSession` at CohortDetail + CohortSpace has the **same date-parse fragility as ADV-012** but was left out of that fix's client-scoped sweep (cohort fixtures still hold "Month DD, YYYY" display strings); same-class, needs the same ISO+formatter treatment when prioritized. **(b)** LessonEditor **title/minutes field-error inconsistency** — bundle 12's ADV-041 added a field-level error to the minutes input, but the Title field still relies solely on the global bottom-of-form invalidReason hint; accepted for prototype scope, future-polish candidate. |
| **Individual** | **Rework UNDERWAY (thawed this session) — Tier 1 COMPLETE; Tier 3 contained-structural phase COMPLETE (all 3 paused-surface folds closed: #12 + #63 + #116; CohortView unified rewire done); remaining = design-phase decisions only. 5.8 giving-flow design rulings LOCKED this session (`39bcaf0`, docs-only — full record at `docs/5.8-giving-flow-scoping.md`); persistence scoping pass COMPLETE (`d7bfe70`, docs-only — three strands at `docs/persistence-scoping-pass.md`); schema draft RULED A-F (`0eef5e1`, docs-only — full record at `docs/persistence-schema-draft.md`; FINALIZED EXCEPT ruling E, Derek-gated).** 15 surface files (Discover, GPSReveal, GivingModeler, Plan, Positioning, Privacy, Team, History, Learn, CohortView, Letter, Questions, Feedback, GiveScreen, IndividualSurface). v0.6.1 baseline confirmed building clean before first edit. The structural rework began this session; Individual is **no longer untouched-frozen**. **Disposition framing preserved**: the 15 surfaces largely stay; architecture / components / data-flow get restructured — adopting Cluster I primitives (`DataTable`, `MessageHistoryCard`, `Tag` `tracking='loose'` variant, Enterprise-scoped `SegmentedControl`) and aligning to `src/data/unified/`. This is **REWORK (revise the existing surface), NOT REBUILD (discard to zero)**. **Escape hatch exercised**: the scoping pass produced founder/team rulings on 7 escalations (5.1–5.7) + 2 parked (5.8–5.9); scope/direction did NOT pivot the frame — structural stands as primary. **Why no QA-arc audit was run**: auditing frozen code that's about to be restructured would invalidate findings; Enterprise / Advisor / Operations got audits because they were live-and-building. Full plan: `docs/individual-rework-scoping.md`. **Tier 1 COMPLETE** (`44ffb9e`) — correctness/safety items: **5.1 sector-language athletes-only sweep** (investigation found 3 user-facing sites; scoping under-counted at 1): `Positioning.jsx:10` body changed from `"Athletes, musicians, entertainers, creators — people whose careers..."` to `"Athletes — people whose careers..."` (multi-sector list dropped, construction preserved); `lessonsData.js:44` lesson body ending `"...specialize in high-earning professionals across sports, music, entertainment, and creator industries."` → `"...in athletics."` (multi-sector clause dropped); **`Feedback.jsx` Q0 "What world are you in?" (Sports / Music / Entertainment / Creator) DROPPED entirely** — Phase-1 athletes-only makes the sector self-ID meaningless; plus 3 downstream `world` refs cleaned for a complete drop (`buildExport` "World:" line removed, filter exclusion list trimmed, submission payload `world` field removed); QUESTIONS array count 12 → 11 + comment updated. `orgsData.js:12` ("Every Child an Artist NYC" + program names "Teaching Artist Residency" / "In-School Music") LEFT untouched — **not-a-violation, #89 INTENTIONAL-PRECISION precedent**: §7's names-verbatim-from-records guard protects proper-noun org/program names; they aren't platform sector-language. **5.3 feedback endpoint de-hardcode**: `Feedback.jsx:7` → `const FORM_ENDPOINT = import.meta.env.VITE_FEEDBACK_ENDPOINT ?? '<literal>';` — **Option B (env + literal fallback)** chosen over pure-env to avoid a Cloudflare deploy-dashboard dependency; follows the `import.meta.env` pattern already established in Operations (`sourceAccents.js:31`, `OperationsSurface.jsx:146`). Literal preserved as the `??` safety net, no longer a bare assignment. **DEPLOY FOLLOW-UP (parked, founder-initiated)**: set `VITE_FEEDBACK_ENDPOINT` in Cloudflare Pages env-vars dashboard when ready to override the literal; until then the literal ships unchanged. **Tier 2 settled this session, no code**: **5.2** keep founder letter in Individual (cross-interface entry-rationale parked — letter for Individual; open question for Advisor/Enterprise/Operations; intro-video one option); **5.4** "nav for recurring, CTA for contextual" IA principle (Give/Feedback/Cohort stay CTA-summoned, no nav addition); **5.5** GivingModeler stays a COMPONENT (embedded in Plan, no standalone route). **Tier 3 #12 WARNING-PALETTE FOLD COMPLETE** (`cd1a518`) — first Tier 3 build slice: added 3 tokens `--sh-warning-bg` / `--sh-warning-text` / `--sh-warning-border` to `tokens.css`; swapped Tag.jsx `colorSchemes.warning` off hex literals (3 existing `<Tag tone="warning">` consumers at Team:338 / :380 / :414 byte-unchanged); **token-swapped all hand-rolled Team.jsx warning sites — landed at 10 total, NOT the 4 the scoping anticipated** (Team:127 count-badge State-B + Team:193 / :211 / :277 / :320 / :361 / :400 past-due literals **surfaced via grep during the slice, scoping under-counted**). Zero warning hex literals remain outside `tokens.css` across `src/`. Team:127 carries the one intended visual shift (`#F8D7CC` → `#FCEAE0` canonical convergence; both pale warning-pinks); the other 9 sites are exact-value swaps with zero visual delta. **Tier 3 #63 borderRadius fold COMPLETE** (`913f89a`) — second paused-surface fold closed: `GiveScreen.jsx:204` + `GivingModeler.jsx:290` `borderRadius: '6px'` → `var(--sh-radius-md)` (token === 6px confirmed, zero visual change). Scoping count held — 2 anticipated, 2 actual. **Tier 3 CURRENT_USER alignment COMPLETE** (`a3f3c5e`, 5.6): `IndividualSurface.jsx` Chrome props `userName` / `userRole` sourced from `individualProfile` (`name` + `worldLabel`) instead of hardcoded `"Marcus Thompson"` / `"Member · Athletics"` literals; "Member · " prefix kept as call-site string (no single-consumer `roleLabel` field per #47 / QA-051 premature-abstraction lens); restore-button copy at :523 left literal (descriptive UI content, same class as orgsData proper-noun ruling); **NO unified import** — Individual stays raw-aligned, the unified-vs-raw design call deferred to the CohortView slice. 1 site anticipated, 1 actual. **3 of 3 paused-surface folds closed** (#12 + #63 + #116) — **the paused-surface fold list is COMPLETE**. **Tier 3 CohortView unified-data-model adoption COMPLETE** (`eab1c71`) — **FIRST structural Tier 3 slice; FIRST Individual file to read from `src/data/unified/`**. Rewired 5 data lookups from raw `cohorts.js` / `clients.js` to `unified.cohorts` / `unified.programParticipations` / `unified.persons`. **Render byte-identical**: node-parity verified — same cohort name ("Youth and school athletics access"), same self themes (3 themes), same other-member names (Isaiah Coleman, Naomi Pierce), same shared-interest counts (`youth-sports-access:2`, `education-access:2`). **Rulings**: **D1** call-site identity bridge — `const currentMemberId = \`p-advisor-${individualProfile.id}\`;` crosses the deferred same-person dedup gap per CLAUDE.md §4 (the two unified personas `p-individual-c-001` + `p-advisor-c-001` are NOT joined; the cohort + giving-plan data lives under the advisor namespace; documented inline as the line to revisit when dedup lands); **D2** `simulatedMemberSignals` kept raw, prefix-strip translation at the lookup boundary (`simulatedMemberSignals[om.id.replace('p-advisor-', '')]`); **D3 / 5.7** `CohortMemberContext` DEFERRED, stays Individual-local — pure session state with no fixture dependencies; moving it to unified gated on the broader "unified as live store?" / persistence-pilot question (this slice consciously left it Individual-local with an inline 5.7-DEFERRED marker, NOT just parked). Contained to `CohortView.jsx` (no cascade — the 4 raw fixtures it read have zero other Individual consumers; Advisor still reads them raw, out of scope). **Architectural shift**: the unified-vs-raw boundary now runs **through** Individual, not around it. CohortView reads unified; the other 14 Individual files still read raw. Future Individual structural work has a precedent for which side of that boundary to choose. **Tier 3 #116 InteractiveCard CLOSED as documented-debt** (Option (b), **ruled not refactored**) — investigation confirmed exactly 3 interactive-Card consumers (`IndividualSurface.jsx:258` + `:447` + `Learn.jsx:86`), all uniform `<Card interactive onClick={fn}>` shape. Card is a **50-consumer shared primitive** with **only the 3 Individual sites** on the interactive branch (tree-wide grep verified zero non-Individual consumers of the interactive branch). **Declined extraction**: modifying shared `Card.jsx` to resolve a 3-consumer trivial per-mount cost (an always-allocated `useState(false)` for `hovered` consumed only when `isClickable`) is upside-down cost/benefit. Same lens as the #48 SegmentedControl Enterprise-scoping ruling (don't refactor a shared primitive's API in a single-surface slice without cross-surface justification) + the #47 / #57 premature-abstraction-at-current-scale lens. Sibling disposition: the 12-pill migration was also closed by **ruling-not-build** (invalidated-and-skipped by investigation rather than refactored). The `Card.jsx:4-6` comment already documents the finding + consumer set; this slice formalizes it as the FINAL ruling. **Revisit only if** Card's interactive branch becomes heavily cross-surface, OR `Card.jsx` is being refactored for another reason anyway. **Tier 3 REMAINING — design-phase decisions only** (no mechanical rewires left): ~~12-pill Tag `tracking='loose'` migration~~ — **INVALIDATED & SKIPPED** per the `b0f0e0c` scoping correction; **further unified-data-model adoption** if pursued — the gifts / ID-namespacing / context decisions (Section 3 divergences #2-5 in the scoping doc); **5.7** CohortMemberContext location (explicitly DEFERRED and documented inline at the CohortView call site, gated on unified-as-live-store); **5.8** Plan ↔ GivingModeler ↔ GiveScreen flow — **design-LOCKED this session** (`docs/5.8-giving-flow-scoping.md`; full rulings + Parker hard lines + carried debt + NEXT pointer banked below); **5.9** IntakeContext scope split (intake-only vs activity, or one bag?) — folds into the 5.8 schema pass since the gated `intake-gifts-join` question is now answered YES. **All remaining items are product/architecture questions, not mechanical rewires.** **Scoping-count discipline log**: Tier 3 slice tally so far — **12-pill correction** (`b0f0e0c`: 12 → 0 invalidated), **#12 fold** (`cd1a518`: 4 → 10 expanded), **#63 fold** (`913f89a`: 2 → 2 held), **CURRENT_USER** (`a3f3c5e`: 1 → 1 held), **CohortView unified rewire** (`eab1c71`: 5 lookups anticipated → 5 actual; expansion was decision-surface — D1/D2/D3 rulings — not site-surface; the first structural slice still held its count), **#116 ruling** (3 consumers anticipated → 3 actual; closed by disposition not build — second paused/Tier-3 item closed by ruling-not-build, sibling to the 12-pill invalidation). **Tier 3 counts are FLOORS, not ceilings** — contained slices and the first structural slice all held; larger pattern-matching slices (12-pill, #12) moved both directions; ruling slices (#116, 12-pill) closed without site change. Plan investigation time per slice; don't promise the scoping count as the final count until the slice's own grep sweep is done. **5.8 GIVING-FLOW DESIGN RULINGS LOCKED** (`39bcaf0`, docs-only, full record at `docs/5.8-giving-flow-scoping.md` — two read-only investigations preceded the rulings: 5.8-flow shape + the three-shape consolidation blast-radius sweep). **(1) Canonical entity**: Gifts-first ratified; canonical Gift = unified-shape structural spine (explicit `giverPersonId` + real `recipientOrgId` + `recipientOrgName` + ISO `date` + `sourceSurface`) MERGED WITH session-shape display reality (`notes` retained); GiveScreen session writes FEED the canonical store (resolves the gated `intake-gifts-join` question: YES); the three coexisting gift shapes (`individualProfile.gifts` seed / `IntakeContext.state.gifts` session / `unified.gifts`) consolidate into one canonical Gift. **(2) Modeler scenarios**: persisted + lightly versioned as a net-new entity (snapshot-not-history floor — enough for modeled-vs-actual comparison over time). **(3) Flow directionality**: any-entry graph; "Plan" is a lens, not a parent; surfaces read/write shared Gift + Scenario entities; GiveScreen-first entry IS in v1 scope. **Parker hard lines carried into the schema pass** (must survive into any field-set draft): canonical Gift is a donor-DECLARED record with at most an "exported to CPA" marker — **NO payment/execution/settlement/transfer-lifecycle field, ever** (confirmed: none of the 26 fields across the three current shapes carries such state; the invariant now needs schema-level enforcement once gifts persist to accounts); GivingModeler stays a structural canvas the donor builds — never a recommender/optimizer/rank engine (scenario shape must not introduce a scoring/ranking/"suggested allocation" axis). **Carried debt** (persistence/schema pass to absorb, not fixed yet): **(a)** budget-literal mismatch — `individualProfile.js:27` `'$1K–$10K'` (no spaces) vs `intakeData.js:30` BUDGETS array + `GivingModeler.jsx:7` `BUDGET_TO_DEFAULT` keys both `'$1K – $10K'` (spaces) → dead lookup for the canonical demo user, falls through to `5000` default; **(b)** `Date.now()` gift ids at `GiveScreen.jsx:63` → `crypto.randomUUID()` per Enterprise QA #97 precedent, plus submit not disabled in-flight; **(c)** date-format unification to ISO — `parseGiftDate` requires `'Month D, YYYY'` and would null on both session-born `'Apr 23'` and ISO `'2026-03-12'`. **NEXT (still 5.8, planning session)**: canonical Gift field set (recipient-FK seam to watch); scenario-versioning spec (snapshot floor); entity/relationship sketch (surfaces the `GiftRow` extract-or-not question for FT; pre-answers `intake-gifts-join` + `individualProfile`-raw-vs-unified; opens the persistence scoping pass). **THEN persistence scoping pass — 3 strands**: D1 + Workers + unified / hosted-auth diligence / live 4/30 data-protection frame. **PERSISTENCE SCOPING PASS COMPLETE** (`d7bfe70`, docs-only, full record at `docs/persistence-scoping-pass.md` — read-only throughout, no code). Three strands designed together. **Strand 1 (architecture)**: green-field finding — `src/data/unified/` is a pure build-time projection with ZERO write path (no setter, no observer; `unified.gifts` has zero surface readers); no `wrangler` config, no `functions/` or `workers/` dir, no auth/DB deps in `package.json`; the app is a pure static SPA on CF Pages. The live account-backed store is a NEW layer BESIDE unified, not an edit to it. Open rulings for the schema draft: (a) live-store REPLACES vs COEXISTS; (b) seed-data migration story; (c) `sourceSurface:'individual'` partition semantics. Recipient-FK reality refines 5.8 (FK target exists only for 17 individual-catalog orgs; enterprise gifts produce zero Org records). No identity layer today — current user = hardcoded Marcus fixture, not authenticated session. **Strand 2 (auth)**: RECOMMENDATION — `better-auth`, self-hosted in the project's own D1, magic-link EMAIL-ONLY (no SMS), Cloudflare Email Service as send pipe with Resend as named swappable fallback. Rejected hosted SaaS (Clerk / Auth0 / Stytch) on identity-custody grounds (not cost — all free at pilot scale; they hold user identity on their infra, colliding with the data-protection frame); rejected roll-your-own `jose`+JWT on security-burden grounds (build-your-own break-even ~100k MAU). Caveats carried to build: (a) CF Email Service is BETA — abstract sender behind swappable interface (Resend GA is fallback); (b) `better-auth`+D1+Workers sharp edges — one auth/D1 instance per request at middleware top (singleton silently breaks because D1 binding changes per invocation); disable `cookieCache` per session-refresh bug #4203 (trade a D1 read per session check for correctness); (c) 10ms free-tier Worker CPU + indexed session-check read from day one. Resolves `giverPersonId` = FK from auth-user table → Person, both in the project's own D1. **Strand 3 (data-protection — the 4/30 frame now live against the concrete architecture)**: a gift record (`giverPersonId` → `recipientOrgId` + amount + cause) for an athlete / creator / public figure can reveal political / religious / cause alignment + net-worth signal; whose giving is stored changes the stakes. **L1 schema constraints** — identity SEPARABLE from giving data (gifts keyed by opaque person-id; auth-table join as guarded chokepoint); recipient + cause is the SENSITIVE payload (not amount); email lives in two systems (`better-auth` user table + CF Email send logs) — name it. **L2 legal — DEREK NOW CRITICAL-PATH** (3 live questions): controller identity under PBC + captive 501(c)(3); regime scope (giving data touching cause / religion / politics is "special category" under GDPR + post-2024 US state acts); subpoena / legal-process posture (decided BEFORE storing data because it can change a Layer 1 architecture decision); **scoping-for-Derek, not legal advice**. **L3 ops** — magic-link removes the password-breach + credential-stuffing surface but makes the email inbox the account-takeover single point (conscious acceptance); `better-auth` sharp edges are also security items (session bug = security event); D1 production access logged + minimal from day one; D1 Time Travel (30-day restore) is a privacy surface — deleted user data persists in restore points; deletion commitment must account for it. **L4 governance** — 10%-gross commitment + no-third-party-ad posture already answer the biggest governance question (no data monetization, in the operating agreement); retention / deletion policy must exist BEFORE pilot, kept compatible with Parker's no-lifecycle-field rule (a deletable Gift must not reintroduce a lifecycle field by the back door); individual-pushes-consent extends to data. **PERSISTENCE SCHEMA DRAFT RULED A-F** (`0eef5e1`, docs-only, full record at `docs/persistence-schema-draft.md`) — the **rule** artifact in the scope → rule → build sequence; **FINALIZED EXCEPT ruling E** (deletion / retention — Derek-gated). FT rulings verbatim: **A = REPLACE** (live D1 store is the single source of truth for user-authored entities — Person / Gift / Scenario / intake; unified build-time projection serves seed / demo only); **B = person-is-identity CONFIRMED** (the `person` table IS the user identity; `individualProfile.js` becomes seed data loaded into `person` rows, not a parallel truth); **C = `person.id`-opaque separation SUFFICIENT** at pilot (no extra indirection layer; `gift` table alone does not reveal giver identity without the `person` → `auth_user` join — the guarded chokepoint per strand-3 L1); **D = `org` becomes a D1 TABLE** (not a build-time projection; `gift.recipient_org_id` is a real hard FK with referential integrity; the 17 seed orgs migrate as real rows — same seam as Marcus's gifts); **E = PARKED FOR DEREK** (deletion / retention has a legal dimension — what "delete" must mean, compelled-retention — rides with Derek's L2 questions, not ruled blind; Parker constraint: whatever returns must NOT reintroduce a lifecycle field by the back door — no `deleted_at`-as-status drift); **F = Marcus seed-migration CONFIRMED** (Marcus = first real account through real auth; the demo "load Marcus" path IS the account path, exercising the real identity model; Marcus gets a real `auth_user` + `person` row; his 3 seed gifts become real `gift` rows owned by his `person.id`). **Tables (replace-model, all under the live D1 store)**: `auth_user` (better-auth-owned — ONLY place email lives in the data model besides CF Email send logs); `person` (opaque id, nullable `auth_user_id` for seed / demo persons with no account, `source_surface`, `extensions`); `gift` (`giver_person_id` FK, `recipient_org_id` FK nullable by design, `recipient_org_name` always present, `exported_to_cpa` = Parker's ONLY lifecycle-adjacent field — no other lifecycle / status / settlement column, ever); `scenario` (`owner_person_id` FK, `inputs` = 6 modeler knobs, `derived_at_snapshot` cached + nullable, NO rank / score field per Parker Modeler guardrail); `org` (durable id from the 17-catalog ids, now a D1 table per ruling D). **Indexing from migration 1** on every "my X" FK — `gift.giver_person_id`, `gift.recipient_org_id`, `scenario.owner_person_id`, `person.auth_user_id`, plus the session-check read (D1 bills rows-read; unindexed full-table scans = surprise bills). **Folded-item resolutions** (gated items, now resolved): `intake-gifts-join` = YES (5.8); `individualProfile`-raw-vs-unified resolves toward UNIFIED-AS-LIVE-STORE (account-backed Person IS the user identity; `individualProfile` becomes demo-seed, not parallel truth); CohortMemberContext / 5.7 was gated on ruling A (now resolved REPLACE — revisit); ID-namespacing folds into the `sourceSurface` partition question. **NEXT**: Derek returns E → schema finalizes → FT authorizes → build (sequence: schema / migrations → auth → wire surfaces). **NO build proceeds until E returns AND FT authorizes.** The scope → rule → build discipline holds; rule step done except the Derek-gated E. **FOUNDER ACTION**: Derek CRITICAL-PATH — the 3 Layer-2 legal questions (controller identity under PBC + 501c3, special-category regime scope, subpoena posture) PLUS ruling E (deletion / retention) should be in front of him BEFORE the persistence BUILD starts; scoping can continue in parallel. |
| **Landing** | Single file; public entry. |

---

## 6. Slice protocol (build discipline)

Every substantive change runs as a **slice**. The rhythm:

1. **Hard git-state gate.** Confirm current branch and HEAD before starting.
   For most slices: `main` at the expected SHA, working tree clean. Refuse to
   proceed if state is unexpected.
2. **Audit + propose.** Investigate read-only; propose a spec with explicit
   scope, decisions, verification plan, and suggested commit message. Hold for
   review. **Do not edit until decisions are locked.**
3. **Feature branch off main.** One slice = one branch (`slice-{letter}-{name}`,
   `fix-{topic}-bundle-{n}`, `docs-{topic}-refresh`, etc.).
4. **Write the slice.** One file at a time when possible; no truncation; no
   "rest unchanged" markers. Flag anything unusual; do not fix unrelated issues
   inline.
5. **Verify.** `npm run build` clean; node smoke against `unified.*` where
   relevant; per-pattern counts for data slices; UI slices add a dev-server
   visual check at the named URL.
6. **HOLD.** Report diffs, verification output, and visual-check URL when
   relevant. Wait for explicit go-ahead.
7. **Commit.** Exact message dictated by the founder. **Never append
   `Co-Authored-By` or any footer.** Never `--amend` after a hook failure (the
   prior commit didn't happen; fix and create a NEW commit).
8. **Bank.** `git checkout main; git merge --ff-only {branch}; git push origin
   main; git branch -d {branch}`. Fast-forward only — refuse if anything
   intervened on main.
9. **Audit branches are never merged or deleted.** `qa-audit-enterprise` and
   `qa-audit-operations` are reference-only and remain on the local clone +
   origin indefinitely. Findings flow into fix-bundle slices that branch off
   `main`, not off the audit branch.

Stop background shells (dev server, watch loops) at bank time. Use `TaskStop`,
not `kill`.

---

## 7. Guardrails

### Path B — the structural-not-advisory boundary

The platform organizes what advisors and funders decide; it does not decide
for them. **No AI-drafted Giving Partnership Profiles. No custody or payment
rails. No evaluative recommendations.** Test: exposure (in) vs. evaluative
recommendation (out). "You should fund X" or "Marcus is ready for a larger
gift" violates Path B. Surface options; never prescribe.

Not a robo-advisor for charity, not a competitor to advisor-client
relationships, not a fiduciary, not a fund custodian, not advisor-driven
matching with scores or rankings.

### No scoring, no ranking

Nonprofit profiles, advisor discovery, GPS, pipeline — narrative-based
throughout. **Issue severity (`low`/`normal`/`high`) rates the ISSUE's
triage urgency, never a participant.** The same applies anywhere a number
or letter could be read as a judgment of a person or org.

### Brand tokens only

Warm beige bg `#FAF7F2`, bronze accent `#8B7355`, white card surfaces,
Libre Baskerville serif headings, Inter/sans body. Every color / spacing /
radius / type-size goes through a `--sh-*` token in `src/styles/tokens.css`.
**No hex literals in components.** SVG icons only (`role="button"` divs get
the bronze focus-visible ring via global selector). **Zero emoji anywhere
in the interface.** WCAG AA.

### Voice & tone (LOCKED)

Quiet, editorial. Closer to Aesop or The Atlantic than a consumer app.
- No exclamation points except in dialogue.
- No "congratulations" or celebratory language for routine task completion.
- Sentences carry weight; clauses do work.
- Meet people where they are — never imply users are at a destination.
- Spelling: standard English (Merriam-Webster). Correct silently unless the
  meaning changes.

### Aggregate-default with purposeful drill

Default landing data is aggregate (counts, sums, rollups). Record-level
queries are exposed but explicit — `connectionsByGiver()` / `openIssues()`
are separate from `connectionFunnel()` / `openIssueCount()`. UI cards drill
to record level when there's a real target; when no target exists, render a
"detail view coming soon" footnote rather than a dead click.

### Names verbatim from records

Any participant or org name in user-facing copy must come from the assembled
record's `.name` field. Never fabricate, never paraphrase. The Slice C
verify pattern asserts that issue summaries contain the linked record's name
verbatim; the same discipline applies anywhere copy references a record.

### Demonstrative vs LIVE honesty boundary

Synthetic-derived UI must be labeled demonstrative. Only genuinely live
signals (e.g., `platformHealth()` traversing actual `runChecks`) may carry
LIVE framing. On the Operations Overview, the demonstrative-state caveat
explicitly excepts Platform health; all other regions read as synthetic
seed, not live platform traction.

### Section 6 vocabulary (LOCKED)

"Between-session pipeline" (the name), "surface" (the unified verb), states
are Active / Mute / Pause, "cohort updates" is the fifth content type.
Per-client settings are "default" vs "override"; overrides are preserved
when practice-wide defaults change.

### Section 6 data reconciliation invariant

The advisor roster has **9 clients** (c-001 .. c-009). All Section 6 numbers
must reconcile:
- Each client carries a `pipeline` array: one entry per content type, with
  `state` (Active/Muted/Paused) and `source` (default/override).
- A client's `activeContent` count === entries with state Active.
- For each content type, across the 9 clients:
  `clientsOnDefault + overrides === 9`.
- `pipelineDefaults` in `content.js` matches what the client `pipeline`
  arrays actually produce.
- `advisorPracticeProfile.clientCount === 9`.

If pipeline data changes, re-derive and verify equalities BEFORE committing.

### Client roster (Phase 1)

9 fictional athletes across 4 stages (`New` / `Active` / `Mature` / `Sunset`,
renameable per advisor preference): Marcus Thompson (canonical demo —
`c-001`), Jasmine Rivera, Reuben Asare, Ezekiel Banner, Isaiah Coleman,
Tariq Williams, Bree Caldwell, Naomi Pierce, Jordan Estes. Each carries
distinct fictional substance — different sports, gift sizes, giving
identities, session histories. **Never copy-paste Marcus's content under
another name.**

### Phase 1 is athletes only

No music / entertainment / creator language in user-facing copy. Sector
terminology is locked for later phases (athletics → music → entertainment →
creator, with role / event / completion / reinvestment-term substitutions)
but must not appear in current UI text. Non-athletics sectors use "Program
Reinvestment", not "endowment".

### Connection model (Individual surface)

Share / Connect / Signal Interest behave identically regardless of
subscription tier. Funders initiate; nonprofits don't push. Discovery is
for understanding, giving is for acting — **no donate button on the
discovery view**.

### StewardHouse never authors org-level content

Only structural elements (cause tags, fields, scaffolds). Org profile
narrative is org-authored or imported (Candid API integration is future).
Organizations are referenced entities, not platform users — the unclaimed
tier of the content-sourcing model; org records appear as discovery-catalog
entries, gift targets, and connection destinations, and the Operations
Organizations directory is the operator view of those records.

---

## 8. Key docs

- `docs/qa-audit-enterprise-2026-05-30.md` — 157-finding Enterprise audit (on
  `qa-audit-enterprise` branch; HEAD of audit). Exec-summary "Medium: 76" is a
  typo at source (actual 60); CLAUDE.md previously inherited the typo as
  "173 findings" — corrected during the Enterprise ground-truth investigation.
- `docs/qa-audit-operations-2026-06-09.md` — 56-finding Operations audit (on
  `qa-audit-operations` branch; HEAD includes the 3-finding recon amendment).
- `docs/qa-audit-advisor-2026-06-13.md` — 41-finding Advisor audit (on
  `qa-audit-advisor` branch; audit's exec-summary "43" is a typo, ADV-034 +
  ADV-037 never existed; +1 added during bundle 5 → denominator 42).
- `docs/operations-current-state-2026-05-31.md` — Operations surface inventory
  (pre-redesign baseline).
- `docs/operations-overview-discovery-2026-06-01.md` — gap-map between
  candidate Overview signals and live-versus-needs-new-entity classification
  (the foundation for slices A–H).
- `docs/cross-surface-data-model-discovery-2026-05-31.md` — data-shape
  mapping across all four surfaces (foundation for the unified data layer).
- `docs/qa-triage-medium-low-2026-05-30.md` — disposition of the 115 Enterprise
  Medium + Low audit findings.
- `docs/5.8-giving-flow-scoping.md` — Individual 5.8 giving-flow design rulings
  (FT, this session) + current-state baseline of the three gift shapes
  (seed / session / unified) + Parker hard lines + carried debt + next-turn
  placeholder for the canonical Gift field set + scenario-versioning spec.
- `docs/persistence-scoping-pass.md` — persistence scoping pass output (this
  session, read-only). Three strands — Strand 1 (D1 + Workers + unified
  architecture; live store = NEW layer beside unified; three open rulings),
  Strand 2 (`better-auth` self-hosted in D1 + magic-link via CF Email
  Service with Resend fallback; hosted SaaS rejected on custody grounds),
  Strand 3 (4/30 data-protection frame across 4 layers; Derek advanced to
  critical-path). Folded-item resolutions + what the schema draft must
  carry.
- `docs/persistence-schema-draft.md` — ruled persistence schema (FT, this
  session). Rule artifact in scope → rule → build. FT rulings A-F:
  A REPLACE (live D1 = single source of truth), B person-is-identity,
  C `person.id`-opaque sufficient, D `org` → D1 table, **E PARKED FOR
  DEREK** (deletion / retention legal-dimensioned), F Marcus = first real
  account. Tables: `auth_user` (better-auth) / `person` / `gift`
  (`exported_to_cpa` = only lifecycle-adjacent field) / `scenario`
  (no rank / score) / `org`. Index every "my X" FK from migration 1.
  FINALIZED EXCEPT ruling E; no build proceeds until E returns AND FT
  authorizes.
- `src/data/unified/README.md` — unified data layer internal notes.

---

## When in doubt

Ask. Don't assume. Path B violations, brand-token deviations, and Co-Authored-By
footers are non-negotiable.
