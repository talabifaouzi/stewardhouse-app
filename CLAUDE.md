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
| **Enterprise** | **Built and audited.** All 6 sections live (Overview, Roster, Program, Compliance, Reports (+ 5 sub-pages), Setup wizard). QA audit on branch `qa-audit-enterprise` (**157 findings** — 9 Critical + 33 High + 60 Medium + 55 Low — doc at `docs/qa-audit-enterprise-2026-05-30.md`; **branch unmerged** by design). **Count guard:** the audit's executive-summary "Medium: 76" is a typo (actual Medium = 60, verified by counting numbered lines); CLAUDE.md previously inherited the typo as "173 findings" — corrected here. The 26 Compliments listed in the audit are observations of working-well things, not findings, and are counted separately. **Enterprise does NOT use Advisor's numbered-bundle model.** Criticals + Highs shipped as direct per-finding-or-grouping commits; Mediums + Lows went through the cluster-based triage in `docs/qa-triage-medium-low-2026-05-30.md`. **9 Criticals shipped** (`33cb42f` covered all 9; `3bb9cb1` later completed Critical #9's full activity-log reconciliation as a side effect of fixing Medium #91). **32 of 33 Highs shipped — 1 deferred (#12)** post Sweep 1 + Sweep 2. The original 26 (pre-Sweep) were addressed via `33cb42f` (Criticals bundle's secondary effects), `fd7b2b0` (Diane Okonkwo normalization, #17 + #29), `a525b29` (compliance officer + Andre/Ava + Mia/Jordan + CohortComparison yoy, #18/#21/#23/#24), `be6febc` (ISO dates + cohort framing, #19/#20), `aa56b64` (engagementTimeline derivation, #22), `d0e82fb` (React keys + responsive padding, #25-#28 + #32), `542e893` (ModalStack perf, #42), `bc0beb9` (persona canonical, #31 as side effect), and the `7998c7d` "narrative re-authoring" sweep that closed the voice/internal-leak cluster #30 + #33-#41 (10 items). **Sweep 1** (`daf8ac4`) — token-discipline sweep: closed the 5 brand-token Highs — **#10** (HelpIcon border `#B8AE9E` → `--sh-bronze-border`, accepted visual shift to warmer/lighter accent), **#11** (Tag.jsx accent palette → 3 existing tokens `--sh-divider` / `--sh-text-secondary` / `--sh-bronze-border`), **#13** (Button.jsx primary text `'#FFFFFF'` → `--sh-text-on-accent`), **#14** (SetupWizard stepper text `'#FFFFFF'` → `--sh-text-on-accent`); **deferred #12** (Tag `warning` palette — consumed by paused Individual `Team.jsx`: keep palette, add `--sh-warning-bg/text/border` tokens when Individual resumes — don't remove live-but-dormant code). Sweep 1 ALSO dispositioned **all 11 BATCH Cluster IV items**: substantive token swaps for #58 (Modal padding) / #59 (DailyBrief marginTop) / #60 (EnterpriseProgram minWidth) / #61 (SetupWizard space) / #62 (SetupWizard radius) / #66 (HelpIcon 9px → `--sh-text-xs` F1-nudge per advisor ADV-006 precedent) / #68 (new token `--sh-border-accent-deep: 4px solid var(--sh-bronze-deep)`, matching the bundle-4 `--sh-border-accent` shape; single consumer at PhilanthropicReadiness); partial: #63 (6 of 8 sites swapped to `--sh-radius-md`, 2 Individual sites deferred per paused-surface ruling) + #67 (2px → `--sh-space-half` clean swap; 72px + 6px documented as contained primitives with inline comments); documented-as-contained-primitive: #64 (Button padding triple, per audit's own ruling) + #65 (Chrome 34px avatar, inline comment). **Sweep 2** (`03b77a9`) — a11y Highs: **#15** EnterpriseRoster `<tr>` keyboard support (`tabIndex={0}` + `onKeyDown` Enter/Space with `preventDefault` + `aria-label`; row semantics preserved — no `role="button"` override per WAI-ARIA tabular-data practice, distinct from OperationsSurface `ExpandableRow`'s div-as-button pattern); **#16** HelpIcon a11y additions (`aria-expanded` + `aria-controls` via `useId` + Escape-close `onKeyDown`; `onBlur` preserved). **HelpIcon cross-surface note:** currently consumed only by Advisor's `Pipeline.jsx` (2 sites — `:86` + `:445`); Sweep 1 + Sweep 2 changes benefit that surface + any future Enterprise consumer that picks up the shared component. **Sweep 3** (`ed58670`) — Cluster II dead-code cleanup: 6 removals — **#49** (unused `statusFor` import in EnterpriseOverview), **#50** (uncalled `SelectField` component, SetupWizard), **#51** (uncalled `RadioGroup`/`Radio` components + 4 confined styles, SetupWizard), **#52** (unimported `CardHeader` function, Card.jsx — 33 lines; the `Card` primitive itself + the `accent` prop kept), **#53** (unconsumed `depth` field in ModalStackContext — removed from default context + value object + deps array + JSDoc typedef), **#54** (`inProg` un-exported in enterpriseStats.js — visibility tightening; const stays, just no longer surfaced to consumers). **#55 reclassified NOT-A-FINDING**: the audit flagged `Card`'s `accent` prop as dead, but a live consumer at `OperationsSurface.jsx:275` (Open Issues bronze accent stripe) post-dates the 5/30 audit — the prop is in active use. #55 joins the **#31 / #93 / #94 "audit pre-dated the consumer/fix" pattern** — the audit captured a concern that subsequent independent work resolved, so the disposition is closed-as-not-finding rather than closed-as-fixed. **Net −136 lines** for the Sweep 3 commit. **Sweep 4** (`d90c513`) — Cluster V (React keys / patterns, all 5) + Cluster III (perf tweaks, both 2): **#69** (curriculum `key={i}` → `key={title}` across EnterpriseProgram + SetupWizard, 2 sites), **#70** (BarChart `key={i}` → `key={labels?.[i] ?? i}` with defensive fallback for the undefined-labels case; 2 sites — BarSlot + xAxis span), **#71** (WorkshopCalendar 42-cell grid `key={i}` → `key={key}` reusing the already-computed `dateKey(...)` local var; the highest-value correctness fix — month-nav was relying on positional index across re-renders), **#72** (Modal `titleIdRef` switched from `useRef(\`modal-title-${Math.random()...}\`)` inline template to the null-guard pattern matching the sibling `idRef`; same rendered id stability, no per-render template re-eval), **#73** (Chrome `UserIdentity` refactored — extracted `ClickableUserIdentity` subcomponent so the `useState` hover allocation happens only on the clickable branch; DOM render-equivalent for both branches, verified by visual smoke + grep on `gap: var(--sh-space-3)`), **#56** (`engagementMin` + `engagementMax` hoisted to module-level exports in `shared/enterpriseStats.js`, consumed by EnterpriseOverview + ProgramSummary BarChart ariaLabels — was `Math.min(...spread)`/`Math.max(...spread)` per render; static fixture data, computes once at module load now). **#57 SKIPPED-PREMATURE** per the QA-051 "no React.memo at current scale" lens (N=5 workshops, 42 grid cells; documented, no code). **No new tokens this sweep.** Notable artifacts: `ClickableUserIdentity` in Chrome.jsx, `engagementMin` / `engagementMax` consts in enterpriseStats.js. **115 Mediums + Lows triaged** into 5 disposition buckets: **ALREADY-CLOSED (6)** — implemented incidentally before triage (includes #93 + #94 moved here from FIX-NOW after Cluster A shipped, per the triage doc's own Update note). **FIX-NOW (3 findings remaining post-Cluster-A-ship)** — all SHIPPED: Cluster B (#91 lesson-count reconciliation) via `3bb9cb1`; Cluster C (#76 Reports card "performance" + #82 W2 "stalled" voice) via `a1b505b`; Cluster A (#93 Chrome persona + #94 SetupWizard Diane) already shipped via `bc0beb9` and moved to ALREADY-CLOSED. **WON'T-FIX (41)** — audit-marked accept / by-design / verification-only observations, resolved by disposition (no code needed). **DEFER (5 M+L)** — revisit on specific later conditions (mobile QA pass, advisor Documentation rework, bundle-size threshold, etc.). **BATCH (60) — 25 SHIPPED across Sweeps 1 + 3 + 4, 35 REMAINING across 5 clusters**: Sweep 1 resolved Cluster IV (11: token discipline); Sweep 3 resolved Cluster II (7: dead-code cleanup — 6 removed + #55 reclassified not-a-finding); Sweep 4 resolved Cluster V (5: React keys / patterns, all fixed) + Cluster III (2: perf tweaks — 1 fixed, 1 documented-skip). Remaining: I (5: shared primitive extractions), VI (18: voice / tone cleanup), VII (4: code quality minor), VIII (3: data consistency minor), IX (5: misc Low cleanup). **All three mechanical BATCH clusters (II dead-code, V keys, III perf) are now complete** — remaining work is judgment-heavy (VI editorial voice pass + I architectural extractions + minor VII / VIII / IX). **Naming-scheme note:** FIX-NOW uses LETTER clusters A/B/C (all shipped); BATCH uses ROMAN-NUMERAL clusters I–IX. Enterprise still does NOT use Advisor's numbered-bundle model — "**Sweep N**" is a distinct sequencing label introduced for the Enterprise-depth work, parallel to but distinct from Advisor's "Bundle N" cadence. **Audit posture: 122 of 157 dispositioned-or-shipped — 9 Critical + 32 High shipped + 1 High deferred (#12) + 6 ALREADY-CLOSED + 3 FIX-NOW + 41 WON'T-FIX + 5 DEFER (M+L) + 25 BATCH dispositioned (Cluster IV=11, II=7, V=5, III=2). 35 outstanding implementation candidates — all in remaining BATCH (Clusters I/VI/VII/VIII/IX).** Arithmetic: 9+32+1+6+3+41+5+25 = 122 dispositioned; 5+18+4+3+5 = 35 outstanding; 122+35 = 157 ✓. The remaining 35 BATCH items are the scope of future Enterprise-depth sweeps; the dominant outstanding bloc is Cluster VI (voice cleanup, 18) as a single editorial pass; Cluster I (shared primitive extractions, 5) is a larger refactor; Clusters VII / VIII / IX (4+3+5 = 12) are minor cleanup. Fixture dates are uniformly shifted −192d for coherence with today (`Enterprise fixture date coherence` commit `7998c7d`). |
| **Advisor** | **Built and audited.** 8-section IA (PracticeHome, ClientRoster, ClientWorkspace, CurriculumLibrary, CohortSpace, Pipeline, Documentation, PracticeSettings; plus auxiliary DocCreate/DocDetail/LessonDetail/LessonEditor/DraftsList/CohortDetail). All 9 clients seeded with distinct fictional substance per the locked roster. QA audit on branch `qa-audit-advisor` (41 findings, doc at `docs/qa-audit-advisor-2026-06-13.md`; **branch unmerged** by design — the audit doc's executive-summary "43 unique IDs" is a typo, verified during tail-triage: ADV-034 and ADV-037 never existed at any heading level or as cross-references; actual H3-header count is 41). Fix bundles 1 (`623c1ab` — copy sweep: ADV-001 "Track and Field" title-case, ADV-003 "Section N" kicker leak removed from 10 user-facing sites), 2 (`c941df3` — brand-token sweep + `StateBadge.jsx` extraction (ADV-004/005/008); three new tokens added: `--sh-state-active-bg` and `--sh-state-active-text` (the system's first non-warm semantic colors) plus `--sh-text-on-accent`), 3 (`5c6f3e7` — pixel-literal sweep (ADV-006); ADV-026/028 deferred to the ADV-025 drawer slice; ADV-033 880px wrapper closed as intentional editorial choice), 4 (`776fa4d` — glyph→SVG sweep (ADV-007 in-scope, 6 sites); established the platform's first shared icon registry at `src/components/Icon.jsx` (`chevron-right`, `chevron-left`, `plus`; idiom seeded by `BackLink.jsx`); `?` re-classified not-finding (standard ASCII punctuation, not icon-substitute); PracticeHome:148 / Pipeline:321 / DocCreate:179 carried to bundles 7 / 6 / 5), 5 (`27e1c8c` — a11y cluster: ADV-016 (search aria-label), ADV-031 (section-error `role="alert"`), ADV-035 (flag-toggle aria-pressed), ADV-039 (LessonDetail file/title aria-labelledby via `useId`), ADV-036 (DocCreate + LessonEditor FormField label association via guarded `cloneElement` onto native input/textarea/select children only — wrapped non-native children pass through unchanged); opened **ADV-044** (SegmentedControl pick-one / aria-pressed semantic mismatch — deferred) and applied SC-α group-labels to LessonEditor's SegmentedControl as the first coverage), and 6 (`2e30b24` — Pipeline ConfigDrawer a11y: ADV-025 focus trap via a new shared hook `src/components/useDialogA11y.jsx` (mirrors `Modal.jsx`'s trap but with a `.contains()`-aware boundary check that's robust to SVG-only button content — a strict improvement over Modal's text-node-dependent comparison, ready for a future Modal-DRY slice; Modal.jsx itself untouched, so the 8 existing Modal consumers carry no regression risk); ADV-026 (two new tokens `--sh-overlay-drawer` + `--sh-shadow-drawer` — distinct from `--sh-overlay-bg`/`--sh-shadow-modal` for the side-drawer geometry); ADV-028 (transition → `--sh-transition-fast`, F1-precedent nudge); the `×` close glyph → Icon registry (added `close`); SC-α group-labels on Pipeline's SegmentedControl AND RadioList), 7 (`226af00` — ADV-009 fake-control removal: 5 dead controls deleted — PracticeHome "New entry", PracticeSettings Change/Change/Configure on the Working preferences card, CohortSpace "Start a cohort" — plus the forced layout cleanup each removal left: vestigial single-child flex wrapper collapsed in CohortSpace, now-purposeless `marginBottom` dropped on PracticeHome's journal meta line, orphaned `Button` import removed from CohortSpace; the advisor surface is now affordance-honest — every visible button has a real handler), 8 (`0a39530` — ADV-015 URL-state sync on ClientRoster: `q` (debounced, 250ms) / `stage` / `sport` synced to the URL via `useSearchParams`, ported faithfully from the Operations slice-5 pattern (URL as source of truth, `replace` writes, default-omission for clean URLs, inline `parseSingleSelect` for the single-select-with-"All"-sentinel shape vs Operations' Set-based multi-select); PracticeHome's 4 stage Stat-card links updated to **C-α literal casing** (`?stage=Active` not `?stage=active`) so they round-trip through the validation; ClientRoster's filtered views are now shareable and refresh-survivable; the Operations slice-5 URL-state pattern now has **5 in-tree consumers** (4 Operations directories + ClientRoster), giving a future `useDirectoryFilters` hook its consumer set for a DRY-extraction slice when prioritized), 9 (`a3654c1` — tail-triage copy/structure: ADV-002 (CohortSpace decorative `<SectionLabel>` → plain `<p>` eyebrow, fixing an h2-above-h3 semantic inversion; the 5 legitimate CohortDetail `<SectionLabel>` section headings left untouched) + ADV-022 (CurriculumLibrary stat-row parallelism "Base/Tailored/Authored" + body-copy "forks"→"tailored lessons" terminology alignment)), 10 (`7c4bf78` — tail-triage affordance honesty: ADV-013 (dropped the false "4 entries this month" journal count from PracticeHome) + ADV-024 (removed the two always-empty CohortDetail Curriculum-track + Sessions sections — no data path, no write affordance; same spirit as ADV-009 bundle 7)), 11 (`41786b9` — tail-triage brand consistency: ADV-020 (`window.confirm()` → Modal-based discard flow using `Modal.jsx` directly, untouched; the advisor surface now has **zero native browser confirms**); ADV-030 closed as not-finding — the inline "+ New section" button is a deliberate visual pairing with the adjacent "+ New document" `<Link>` sibling, converting to `<Button>` would break the pairing and lose the bronze), and 12 (`2c89164` — tail-triage data + a11y: ADV-011 (live `new Date()` → static seed-aligned `'Monday, May 4'` demo date; verified Monday via UTC parse) + ADV-012 (9 client `nextSession` fixtures migrated to ISO `'YYYY-MM-DD'`, new `formatSessionDate(iso)` helper exported from `src/data/clients.js` with `timeZone:'UTC'` for day stability, 4 display sites wrapped — spec-guaranteed parse, byte-identical display output) + ADV-041 (field-level minutes error inside the FormField with `role="alert"` + `aria-invalid` + `aria-describedby` mirroring bundle 5's Documentation section-error a11y pattern; `canSave`/disabled logic unchanged — purely additive feedback)) banked. Locked dispositions: ADV-009 (fake-interactive controls) → **5 removed in bundle 7** (PracticeHome / PracticeSettings × 3 / CohortSpace) **+ 4 Stage Rename buttons carved out as a future sibling slice** per CLAUDE.md §7 ("renameable per advisor preference") — the 4 render from a single `stages.map()` at `PracticeSettings.jsx:57` and are deliberately preserved; **6 closed as not-finding or intentional** — ADV-014 (PracticeHome journal voice) + ADV-021 (Marcus private-notes voice) closed because Path B governs platform-authored copy, not advisor-authored seed displayed back to the advisor (advisor-internal voice); ADV-033 (`maxWidth: '880px'` on PracticeSettings) closed as intentional editorial choice; **ADV-010** (5 local-only state sites with honest disclosure copy) closed per audit author's own "acceptable per prototype scope" framing; **ADV-038** (LessonDetail body placeholder) closed for the same disclosure-acceptable framing; **ADV-030** (Documentation inline "+ New section" button) closed because it's a **deliberate visual pairing with the adjacent "+ New document" `<Link>` sibling** — converting to `<Button>` would break the pairing and lose the bronze; the audit's "inconsistent with `<Button>`" framing missed the local Link↔button consistency the design achieves by intent. **2 deferred** — ADV-019 (3 code-comment "Section N" leaks in ClientWorkspace) folded into a future code-quality refactor slice (not user-facing, no urgency); **ADV-044** (SegmentedControl + RadioList single-select with `aria-pressed` instead of radiogroup semantics) open and deferred — applies to all three single-select controls (LessonEditor SegmentedControl, Pipeline SegmentedControl, Pipeline RadioList); full radiogroup conversion is a future micro-slice. **Audit posture: 33 of 42 dispositioned — 25 fixed (ADV-001/002/003/004/005/006/007/008/009/011/012/013/015/016/020/022/024/025/026/028/031/035/036/039/041), 6 closed as not-finding or intentional (ADV-010, ADV-014, ADV-021, ADV-030, ADV-033, ADV-038), 2 deferred (ADV-019 to a future code-quality slice; ADV-044 to the radiogroup decision).** (**Denominator is 42** — 41 audited findings (the audit summary's "43" is a typo; ADV-034 and ADV-037 never existed) plus ADV-044 opened during bundle 5.) **The Advisor QA arc — audit + all 12 fix bundles + tail triage — is COMPLETE. No planned QA fix bundles remain.** Remaining items are **feature / decision / future-triage, not QA fixes**: **Stage Rename sibling slice** (feature — wire the 4 carved-out `PracticeSettings.jsx:57` Rename controls to a real Modal-based rename flow with state + persistence per CLAUDE.md §7); **ADV-044 radiogroup micro-slice** (decision — accept the `aria-pressed` debt as documented, OR convert all three single-select controls to `role="radiogroup"` + `role="radio"` + `aria-checked` + arrow-key handling). Two **new known-issues discovered during the tail triage** (not part of the audit's 42, not yet triaged): **(a)** `cohort.nextSession` at CohortDetail + CohortSpace has the **same date-parse fragility as ADV-012** but was left out of that fix's client-scoped sweep (cohort fixtures still hold "Month DD, YYYY" display strings); same-class, needs the same ISO+formatter treatment when prioritized. **(b)** LessonEditor **title/minutes field-error inconsistency** — bundle 12's ADV-041 added a field-level error to the minutes input, but the Title field still relies solely on the global bottom-of-form invalidReason hint; accepted for prototype scope, future-polish candidate. |
| **Individual** | **Paused at v0.6.1.** 15 surface files present (Discover, GPSReveal, GivingModeler, Plan, Positioning, Privacy, Team, History, Learn, CohortView, Letter, Questions, Feedback, GiveScreen, IndividualSurface). Frozen until further notice. |
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
- `src/data/unified/README.md` — unified data layer internal notes.

---

## When in doubt

Ask. Don't assume. Path B violations, brand-token deviations, and Co-Authored-By
footers are non-negotiable.
