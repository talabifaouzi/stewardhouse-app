# QA Triage — Medium + Low

**Triage date:** 2026-05-31
**Source audit:** `docs/qa-audit-enterprise-2026-05-30.md`
**Branch:** `triage-medium-low`
**Base commit:** `aa56b64` (post all 9 Criticals + all 33 Highs shipped)

---

## Count reconciliation

Working numbers (memory + audit exec summary) said "76 Mediums (#43-102) / 55 Lows (#103-157)." The Medium range `#43-#102` is 60 items, not 76 — the exec summary `Medium: 76` is a typo at source. Verified by counting numbered finding lines.

| Severity | Numbered range | Actual count |
|---|---|---|
| Medium | #43 – #102 | **60** |
| Low | #103 – #157 | **55** |
| **Total triaged** | | **115** |

---

## Disposition summary

| Disposition | Count |
|---|---|
| ALREADY-CLOSED | 6 |
| FIX-NOW | 3 |
| BATCH | 60 |
| WON'T-FIX | 41 |
| DEFER | 5 |
| **Total** | **115** |

**Update 2026-05-31:** Cluster A shipped (commit `bc0beb9`). #93 and #94 moved to ALREADY-CLOSED. Cluster A also resolved audit High **#31** (Chrome `userRole` should be a job title, not a department) — the wire-up to `CURRENT_USER.title` closes #31 as a side effect. #31 was outside this triage's Medium+Low scope but is noted here for cross-reference. Remaining FIX-NOW clusters: B (#91 lesson-count reconciliation) and C (#76 + #82 voice at high-visibility surfaces).

---

## ALREADY-CLOSED (6)

Resolved incidentally by slices shipped this session. Verified against current main.

- **#46** — formatDate helper duplication. Closed by data slice 1 (`be6febc`) — new `src/utils/formatDate.js`, both AthleteProfile + UserProfile import from it.
- **#93** — Chrome `userName` + `userRole` hardcoded vs CURRENT_USER. Closed by Cluster A (`bc0beb9`) — `userName={CURRENT_USER.name}`, `userRole={CURRENT_USER.title}`. Persona swap now propagates. Also closes audit High **#31** (Chrome role slot should be a job title, not a dept) as a side effect.
- **#94** — SetupWizard hardcoded Diane name/email/title vs `contacts` canonical. Closed by Cluster A (`bc0beb9`) — DEFAULT_STATE Diane fields now derive from CURRENT_USER. All three sources of truth collapsed to one.
- **#118** — SetupWizard `'✓'` stepper emoji. Closed by Criticals bundle (`33cb42f`) under Critical #4 (SVG check replacement).
- **#124** — `notionalDate` as embedded date-string, untestable. Closed by data slice 1 (`be6febc`) — now ISO `'2026-11-12'`, routed through `formatDate`.
- **#156** — cert date ↔ activity `certified` event date match. Closed by Criticals bundle (`33cb42f`) under Critical #9 (lessons 7→9 + activity entries appended).

---

## FIX-NOW (3)

Correctness or user-visible-wrong only. Clustered for future slice scoping.

### ~~Cluster A — Persona / data consistency~~ — SHIPPED `bc0beb9` (closes #31, #93, #94)

### Cluster B — Fixture integrity (1)

- **#91** — Activity logs don't reconcile to lesson counts. Marcus `lessons: 5` shows only Lessons 1 & 5 in activity; Devon `lessons: 3` shows 1 & 3; Elijah `lessons: 4` shows 2 & 4. Internal contradiction visible in AthleteProfile (count vs timeline).

### Cluster C — Path B / voice at high-visibility surfaces (2)

- **#76** — `EnterpriseReports.jsx:15` REPORT_CARDS desc: `"$8.5K/yr endowment performance and projections."` "Performance" is Path B-adjacent at a key nav entry point. Reframe → "snapshot and projections."
- **#82** — `enterpriseFixtures.js:410` W2 attendance note: `"Stalled — no contact since Sep 5."` "Stalled" characterizes the athlete pejoratively — same class as Bundle 3 corrections (#38 "fell off"). Trim → "No contact since Sep 5."

---

## BATCH (60)

Real but low-stakes. Clustered so each future slice has coherent scope.

### Cluster I — Shared primitive extractions (5)

- **#43** — DataTable extraction from three near-identical table style blocks (EnterpriseRoster, ProgramOutputs, CohortComparison).
- **#44** — StatusPill extraction (3 near-identical pill style objects); or extend Tag.jsx.
- **#45** — MessageHistoryCard extraction (AthleteProfile + UserProfile duplicate the block verbatim).
- **#47** — StatusDot / Bullet primitive (WorkshopDetail + DailyBrief inline 8px dots).
- **#48** — SegmentedControl extraction (SetupWizard + Endowment segmentButtonStyle helpers disagree on border-right convention).

### Cluster II — Dead code cleanup (7)

- **#49** — `EnterpriseOverview.jsx:23` unused `statusFor` import (re-verified against current main).
- **#50** — `SetupWizard.jsx:489-513` `SelectField` defined, never called.
- **#51** — `SetupWizard.jsx:515-558` `RadioGroup`+`Radio` + 4 supporting styles dead.
- **#52** — `Card.jsx:45-77` `CardHeader` exported, no importers.
- **#53** — `ModalStackContext.jsx` `depth` exposed via context, no consumer (re-verified against current main — confirmed no `.depth` consumer).
- **#54** — `enterpriseStats.js:9` `inProg` exported, only consumed internally — change to `const`.
- **#55** — `Card.jsx:1-43` `accent` prop has no consumer.

### Cluster III — Perf tweaks (2)

- **#56** — `Math.min(...engagementTimeline)`/`Math.max` recomputed in ariaLabel JSX every render (EnterpriseOverview + ProgramSummary). Hoist to module scope.
- **#57** — `WorkshopCalendar.jsx` rebuilds `workshopsByDate`, `nextWorkshop`, 42-cell grid every `currentDate` change. `workshopsByDate`/`nextWorkshop` depend only on `workshops` — `useMemo([workshops])` or lift out.

### Cluster IV — Token discipline (11)

All hardcoded values that should resolve to existing tokens:

- **#58** Modal close-button padding `'4px 8px'` → `var(--sh-space-1) var(--sh-space-2)`.
- **#59** DailyBrief `marginTop: '8px'` → `var(--sh-space-2)`.
- **#60** EnterpriseProgram `minWidth: '32px'` → `var(--sh-space-8)`.
- **#61** SetupWizard `'16px'`/`'32px'`×2 → `var(--sh-space-4)` / `var(--sh-space-8)`.
- **#62** SetupWizard `borderRadius: '4px'` → `var(--sh-radius-sm)`.
- **#63** Five form-input files hardcode `borderRadius: '6px'` → `var(--sh-radius-md)`.
- **#64** Button padding triple — only 8px maps to a token; document remainder as contained primitive.
- **#65** Chrome ad-hoc values incl. `'34px'` avatar — add `--sh-avatar-size` or document.
- **#66** HelpIcon `'14px'`/`'9px'` — verify AA legibility on 9px.
- **#67** WorkshopCalendar `'72px'`, `'2px'`, 6px dot — tokenize.
- **#68** PhilanthropicReadiness `borderLeft: '4px solid ...'` — 4px = `var(--sh-space-1)` but mixed use as spacing vs border weight.

### Cluster V — React keys / patterns (5)

- **#69** Curriculum lists `key={i}` over static strings (EnterpriseProgram + SetupWizard) → `key={title}`.
- **#70** BarChart `key={i}` despite unique `labels[i]` available.
- **#71** WorkshopCalendar 42-cell grid `key={i}` — already computes `dateKey(...)`.
- **#72** Modal `titleIdRef` random suffix evaluates every render (only first sticks) vs `idRef` proper null-guard — pick one pattern.
- **#73** Chrome `UserIdentity` allocates hover state unconditionally; only clickable branch consumes — move into conditional subcomponent.

### Cluster VI — Voice / tone cleanup (18)

- **#74** Page title casing inconsistency ("Program overview" vs "Program Summary" vs "Cohort Comparison" vs single-word "Reports"). Pick sentence case throughout.
- **#75** REPORT_CARDS title casing — pair with #74.
- **#77** "About this report" uses "measuring achievement" in negation; tighten → "measuring merit."
- **#78** WorkshopDetail SectionLabel `"Follow-ups · {n}"` mixes label and count via middle dot — use parens.
- **#79** Workshop 2 note: "2 absent (scheduling conflict)" → spell out + plural fix.
- **#80** Follow-up `action` fields read as task-list shorthand without sentence punctuation — pick one register.
- **#81** "Spring re-engagement scheduled" jargon → "Outreach scheduled for spring."
- **#83** EnterpriseCompliance "tamper-resistant audit log" appears twice — trim duplication.
- **#84** PhilanthropicReadiness "Counts are mutually exclusive across stages" → softer.
- **#85** EnterpriseCompliance "Give Screen" — product-internal terminology, decide on user-facing form (similar class as bundle 3 #41 "Individual surface").
- **#86** Endowment distribution rule reads as compressed financial boilerplate — reframe.
- **#87** Daily-brief "uncontacted N days" → "No contact in 11 days."
- **#88** EnterpriseProgram subtitle "{N} athletes participating · {term} · {dateRange}" — "participating" hangs without parallel structure.
- **#89** "Cooper State athletics" (lc) vs "Cooper State Athletics" (capitalized) — standardize.
- **#100** Marcus reflection "Vehicles lesson opened my eyes" — idiomatic, borderline marketing-tone.
- **#101** "Athlete's own words on their philanthropic practice" — singular/plural register inconsistency.
- **#102** Endowment "How this might grow — interactive modeling" slightly promotional — tighten.
- **#104** EnterpriseProgram "16-lesson v1 curriculum" — "v1" is product-internal.

### Cluster VII — Code quality minor (4)

- **#95** SetupWizard `onClick={() => {}}` empty handler with `disabled` — drop or named no-op.
- **#97** `EnterpriseCompliance.jsx:19` `Date.now()` ID can collide on double-click in same ms — counter or `crypto.randomUUID()`.
- **#98** EnterpriseSurface `contract.split(' — ')[1]` em-dash parse is fragile — add fallback.
- **#127** AthleteProfile + UserProfile call `useComms()` unconditionally before null-check — safe in current usage, fragile to misuse.

### Cluster VIII — Data consistency minor (3)

- **#90** Mixed integer vs string IDs across fixture exports — standardize new entities to strings.
- **#96** Audit log references three exclusions ("Quick Cash Sports Loans LLC," "TigerBet Online Sportsbook," "Premier Athletic Apparel Co") not in live `exclusions[]`. Either tag entries as "removed" or expand exclusions.
- **#123** `programTerm` uses `·` separator; INST_PROFILES contract uses `—`. Standardize.

### Cluster IX — Misc Low cleanup (5)

- **#108** Modal close-button focus-ring inline; global `:focus-visible` (`global.css:59-62`) handles it — drop manual.
- **#111** ComposeMessage `<datalist id="compose-recipients-options">` fixed ID — use `useId()`.
- **#112** HelpIcon `cursor: 'help'` on toggle button — `cursor: 'pointer'` matches behavior.
- **#114** EnterpriseCompliance audit-trail Card has inconsistent source indentation — renders OK, puzzling source.
- **#116** Card.jsx spread `...props` + always-on `hovered` state used inconsistently — document or simplify.

---

## WON'T-FIX (41)

Verified-correct observations + by-design choices + audit-accepted items.

### Audit-marked "accept" or audit's own verification (28)

- **#92** Destiny cert timeline — audit's claim conflated workshops with lessons. Destiny's activity log DOES show Lesson 9 completed Oct 12 (line 287 of fixtures). The Oct 12 → Oct 15 timeline is internally consistent for lesson completion → certification.
- **#103** "advisorially" — deliberate Path B coinage, document the choice.
- **#105** "12 years" numeral — style call, audit acceptable.
- **#106** Morgan "first-time donors" descriptor — acceptable in advisor bio context per audit.
- **#109** Modal backdrop `role="presentation"` — "Accept" per audit.
- **#110** Modal focus-restore — "Leave as is" per audit.
- **#117** WorkshopDetail null guard — "accept for prototype" per audit.
- **#119** WorkshopCalendar prev/next aria — "Acceptable" per audit.
- **#120** BarChart `outline: 'none'` — focus color shift is documented indicator.
- **#121** `§` section symbol — correct typography.
- **#122** priorCohortSnapshot math verified by audit.
- **#125** "model" word — non-evaluative use, audit OK.
- **#126** `status: "inactive"` data-layer state — UI converts correctly (related to closed High #21).
- **#128** W1 absences cosmetic per audit.
- **#129** `engagedAthletesByWeek[0]` vs W1 workshop attendance — disjoint semantics, audit notes "easy to misread but not a bug."
- **#130–139** All "consistent" / "good" / "tight" / "no fix" observations.
- **#141–147** All cross-reference verifications (daily-brief day counts, recent-activity dates, follow-up target names, reflections keys, athlete ID ranges, activity log chronological order).

### Verification-only observations (route + provider) (10)

- **#148** App.jsx 5 top-level routes resolve.
- **#149** EnterpriseSurface NAV_ITEMS align 1:1 with routes.
- **#150** EnterpriseReports REPORT_CARDS slugs align with routes.
- **#151** All 5 report BackLinks point to valid `/enterprise/reports`.
- **#152** `useComms` throws explicitly outside provider — defensive pattern.
- **#153** `CommsProvider` wraps EnterpriseSurfaceInner correctly.
- **#154** BarChart `fmt` rebuilt every render — negligible, audit accept.
- **#155** `philanthropicStage` named correctly with disclaimer comment.
- **#157** Workshop attendance counts (W1=12/16, W2=12/16) match `workshopAttendanceRate: 75%`.

### By-design (3)

- **#131** Telephone format consistent (cosmetic check).
- **#132** Em-dash separators consistent.
- **#136** Reflections work well as quiet observational notes.

---

## DEFER (5)

Revisit on a specific later condition.

- **#99** DocumentationContext race (`addDoc` stale-closure on `categories`). Out of enterprise scope (advisor surface). **Revisit:** when next touching advisor surface Documentation features.
- **#107** Modal `×` close-button glyph rendering on mobile Safari. **Revisit:** during mobile QA pass post-Operations.
- **#113** Eager imports for 5 enterprise sub-routes; `React.lazy` would defer. **Revisit:** when bundle size becomes a real constraint or surface grows past prototype.
- **#115** EnterpriseCompliance pill `letterSpacing: '0.08em'` on 11px text — AA contrast confirmation. **Revisit:** during a dedicated a11y / contrast audit pass.
- **#140** Andre `lastActive: "21d ago"` as relative string. **Revisit:** if we ever want live-updating relative durations (currently frozen demo data).

---

## Notes on mis-severity flags

None of the Medium or Low items rises above its severity to a Critical-class correctness bug. **#91** (lesson count vs activity log inconsistency) is the closest — it's internally contradictory in fixture data visible on AthleteProfile, but it's also a low-magnitude integer mismatch on a prototype with no production users, so Medium severity stands.

**#92** (Destiny cert timeline) was rated Medium for "fixture implausibility," but on re-check the audit's interpretation conflated workshops with lessons — Lesson 9 IS in Destiny's activity log. The finding is therefore WON'T-FIX rather than a deferred fixture issue.

**#94** + **#93** (persona inconsistencies) deserve a slice before any persona-swap demo, but neither is currently visible to a stakeholder browsing the live app as Diane.

---

## What to scope next

The 5 FIX-NOW items group into 3 candidate slices, in priority order:

1. **Persona-canonical wiring** — cluster A (#93 + #94). One slice; both edits in `EnterpriseSurface.jsx` + `SetupWizard.jsx` reading from `CURRENT_USER` / `contacts`. Closes a class of bug ahead of any persona-swap.
2. **Lesson count reconciliation** — cluster B (#91 alone). One slice; adds activity entries for Marcus's lessons 2-4, Devon's lesson 2, Elijah's lessons 1+3. Mirrors the Criticals-bundle approach to #9.
3. **Voice nuances at high-visibility surfaces** — cluster C (#76 + #82). Tiny slice; two string edits in `EnterpriseReports.jsx` and `enterpriseFixtures.js`.

Beyond FIX-NOW, the BATCH clusters could be tackled in any order; the natural pairings are Cluster IV (token discipline, 11 items) and Cluster II (dead code, 7 items) as low-risk hygiene sweeps; Cluster VI (voice cleanup, 18 items) as one bundled editorial pass.

---

*Triage complete. No code changes proposed in this slice — disposition only.*
