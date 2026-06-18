# Individual Structural-Rework Scoping

Read-only scoping pass + escalation resolutions. Individual frozen at v0.6.1; full structural rework pending — **REWORK not REBUILD**. Per CLAUDE.md §5 disposition.

---

## 1. Surface inventory

15 surfaces · ~5486 LOC total.

| File | LOC | Class | Role |
|---|---|---|---|
| `IndividualSurface.jsx` | 688 | shell | Route shell + chromeless intake routes + DashboardLayout + IndividualHome |
| `Questions.jsx` | 700 | intake | Multi-step intake (causes / visibility / trust / depth / budget / stages / authority) → IntakeContext |
| `Team.jsx` | 611 | dashboard | Team / grants / events / roles; sole Tag `warning` consumer (#12 paused) |
| `Learn.jsx` | 517 | dashboard | Lesson library + glossary view + advisor assignments toggle |
| `Discover.jsx` | 491 | dashboard | Org discovery + manual-cause filter |
| `GivingModeler.jsx` | 378 | embedded | Embedded in Plan.jsx; not routed independently |
| `History.jsx` | 377 | dashboard | Gift history grouped by org; empty / populated forks |
| `Plan.jsx` | 323 | dashboard | Reads IntakeContext, embeds GivingModeler |
| `GiveScreen.jsx` | 307 | action | Single-shot gift logging form (CTA-summoned) |
| `CohortView.jsx` | 277 | dashboard | Cohort participation; pulls advisor `cohorts` + `clients` cross-surface |
| `Feedback.jsx` | 273 | action | 12-question feedback form (CTA-summoned) |
| `GPSReveal.jsx` | 159 | intake | 5-phase reveal animation for derived Giving Style |
| `Positioning.jsx` | 145 | intake | First onboarding screen — headline + 4 positioning cards |
| `Letter.jsx` | 140 | intake | Founder-letter onboarding step |
| `Privacy.jsx` | 100 | intake | Privacy promises gate before Questions |

**Load-bearing**: IndividualSurface, Questions, Plan, Discover, Learn, History, Team, GPSReveal.
**Entry / action**: Positioning, Letter, Privacy (intake) + GiveScreen, Feedback, CohortView (action / deep).
**Peripheral**: GivingModeler (embedded).

---

## 2. Primitive-adoption map

Honest finding: most shared primitives DON'T apply. No tables, message threads, modals, drill-back, dialog focus traps, or invalid-id routes in Individual. Real value concentrates in a small set.

| Primitive | Sites | Value |
|---|---|---|
| **`<Tag tracking="loose">`** (Enterprise port) | **12 inline bronze-tint pills** — Discover:114, Feedback:210, GiveScreen:293, GPSReveal:75 + :106, IndividualSurface:226, Plan:93, Questions:152, Team:78 + :106 + :127 + :291 | **HIGH** — biggest single collapse, ~80-100 lines of inline style consts removed; direct port of the Enterprise Cluster I #44 pattern |
| **Tag `warning` palette** (#12 paused) | **3 Team.jsx sites** — :338 + :380 `Past due`, :414 `Missing` | **HIGH** — paused-surface unblock; add `--sh-warning-bg/text/border` tokens (currently hex literals `#FCEAE0`/`#A03C18`/`#E8B6A1` in Tag.jsx colorSchemes.warning); 3-line Tag swap, consumers byte-unchanged |
| **Card `interactive`/`onClick`** (#116 paused) | **3 consumers** — IndividualSurface:257 (→ /cohort), IndividualSurface:446 (→ /feedback), Learn:86 (→ glossary) | **MEDIUM** — design call during rework: extract `InteractiveCard` per the #73 ClickableUserIdentity precedent (also benefits Operations drill-tiles) OR keep Card's dual-mode API. Either is forward-compatible. |
| `SegmentedControl` (Enterprise-scoped) | Individual toggles are chips / switches / multi-selects — different primitive shape | **LOW / DO NOT FORCE-FIT** — Discover `toggleSave`/`toggleManualCause`, GiveScreen recurring-toggle, GivingModeler career-toggle, Learn assignment-toggle, Questions multi-select, CohortView signal-toggle, etc. are diverse pickers, not segmented-button rows |
| `DataTable` | 0 sites — no `<table>` anywhere in Individual | None |
| `MessageHistoryCard` | 0 sites — no message-thread rendering | None |
| `Modal` | 0 sites — intake is chromeless full-screen; Learn glossary is a Card branch, not a Modal | None mechanical |
| `BackLink` | 0 sites — sequential intake + chrome nav; no drill-down-with-back | None |
| `Icon` registry | 0 sites identified | None |
| `StateBadge` | 0 sites | None |
| `useDialogA11y` | 0 sites (no dialogs) | None |
| `NotFoundCard` | 0 sites (no `:id` routes) | None |
| **Tag (default `tracking`)** | Already adopted in 5 files: Discover, History, IndividualSurface, Plan, Team | Already in use |

---

## 3. Unified-data-model divergence

**Individual uses ZERO of `src/data/unified/`** (grep verified — no `data/unified/` imports anywhere under `src/surfaces/individual/`).

**Raw fixtures currently read:**
- **`IntakeContext`** (central — 12 of 15 files): wraps `answers` / `gifts` / `lessonsDone` / `assignmentsDone` / `worldLabel` / `givingStyle` / `addGift` / `resetIntake`
- `data/intakeData.js` — `CAUSES, VIS, TRUST, BUDGETS, DEPTH, STAGES_ATHLETICS, AUTHORITY, deriveCelebration`
- `data/orgsData.js` — `ORGS, CAT_META` (also adapted into unified for Operations Organizations directory)
- `data/individualProfile.js` — `individualProfile, getFundingSpotlight, getMicroLearning, visibilityInsights` (also adapted into `unified.persons[].extensions.individual` for audited surfaces)
- `data/lessonsData.js` — `UNIVERSAL_LESSONS, ATHLETICS_LESSONS, VISIBILITY_LESSONS, GLOSSARY, ADVISOR_ASSIGNMENTS`
- `data/teamData.js` — `SAMPLE_GRANTS, SAMPLE_EVENTS, ROLES` (Individual-only)
- `data/themes.js` — `THEMES`
- `data/cohortSignals.js` — `simulatedMemberSignals`
- `data/cohorts.js` — `cohorts` *(advisor fixture, cross-surface pull)*
- `data/clients.js` — `clients` *(advisor fixture, cross-surface pull)*
- `CohortMemberContext` — `useCohortMember` (per-cohort opt-in / signal toggling)

**Five divergences** (in order of severity):

1. **CohortView pulls advisor `cohorts` + `clients` directly — worst offender.** The unified layer already wraps these via `unified/adapters/advisor.js` and exposes them as `unified.cohorts` + `unified.persons` with cross-surface IDs (`coh-001`, `p-advisor-c-001`). Should adopt unified entities during rework.

2. **`IndividualHome` reads `individualProfile` / `getFundingSpotlight` / `getMicroLearning` / `visibilityInsights` raw**, though these are already adapted into `unified.persons[].extensions.individual` for the audited surfaces. **Design call**: route Individual through unified (consistency) OR keep raw access (Individual is the source-of-truth surface). Either is defensible.

3. **Intake-written gifts (`addGift()`) land only in IntakeContext memory, NOT in `unified.gifts`.** The audited surfaces' `unified.gifts` are seed-only. Decide whether intake-written gifts join the unified stream (cross-surface visibility) or stay Individual-local (privacy / separation of concerns).

4. **No cross-surface ID namespacing in IntakeContext writes.** If Individual rework adopts unified entities, ID conventions (`p-individual-<id>`, `gift-individual-<seq>`, etc. — established in `unified/adapters/individual.js`) need to be wired through IntakeContext writes.

5. **Two Individual-local contexts (`IntakeContext` + `CohortMemberContext`).** Audited surfaces use unified queries + per-surface state. Evaluate whether `CohortMemberContext` belongs in unified (a "member-side cohort participation" entity) or stays local.

---

## 4. Paused-surface items (fold into rework — no standalone slices)

| # | Sites | Fold-in plan |
|---|---|---|
| **#12** Tag `warning` palette | Team.jsx:338 + :380 `Past due`, Team.jsx:414 `Missing` | Add 3 tokens to `tokens.css`: `--sh-warning-bg`, `--sh-warning-text`, `--sh-warning-border` (currently hex `#FCEAE0` / `#A03C18` / `#E8B6A1` in Tag.jsx). Tag.jsx swap is 3 lines; consumers byte-unchanged. Pair with Team.jsx rework to avoid two-pass churn. |
| **#63** `borderRadius: '6px'` | GiveScreen.jsx:204, GivingModeler.jsx:290 | Trivial swap to `var(--sh-radius-md)`. Pair with each file's surface rework (Plan/GivingModeler/GiveScreen interconnect — don't ship standalone). |
| **#116** Card `interactive`/`onClick` | IndividualSurface.jsx:257 (→ /cohort), IndividualSurface.jsx:446 (→ /feedback), Learn.jsx:86 (→ glossary) | **Design call during rework**: (a) extract `InteractiveCard` subcomponent per the #73 ClickableUserIdentity precedent — affects all 3 consumers via mechanical migration; also benefits Operations drill-tiles; OR (b) keep Card's existing dual-mode API and document. Both paths are forward-compatible. |

All 3 unblock together when Individual reworks. None requires its own slice.

---

## 5. Escalation resolutions (founder + team decisions)

| Flag | Issue | Resolution |
|---|---|---|
| **5.1** | `Positioning.jsx:10` copy `"Athletes, musicians, entertainers, creators"` violates CLAUDE.md §7 Phase-1 athletes-only LOCKED guard | **ATHLETES-ONLY.** Strip sector language at this site + run a full Individual sector-language sweep during rework (verify no other surface re-introduces music/entertainment/creator copy). |
| **5.2** | Founder letter (`Letter.jsx`, 140 LOC) as onboarding step — voice / audience / gate questions | **KEEP in Individual** (adds the build-rationale at entry). **PARKED strategic thread**: entry-rationale across all three interfaces (letter for Individual; open question for Advisor / Enterprise; intro-video is one option) — founder to revisit. |
| **5.3** | `Feedback.jsx:7` hardcodes personal Gmail endpoint `formsubmit.co/ajax/talabifaouzi@gmail.com` | **KEEP routing to founder email** (no alternative collector yet), but **DE-HARDCODE to config / env** (e.g. `VITE_FEEDBACK_ENDPOINT`) during rework. **Future**: dedicated inbox / form service at real launch (parked). |
| **5.4** | Give / Feedback / Cohort routed but not in `NAV_ITEMS` (6 nav vs 8 routes) | **TEAM CALL: keep the CTA-summoned pattern.** IA principle (name it explicitly): **"nav for recurring, CTA for contextual."** Verify during rework that no deep surface is orphaned — each must have a discoverable entry CTA. |
| **5.5** | GivingModeler embedded-in-Plan rather than routed | **COMPONENT** (stays embedded in Plan, no standalone route). |
| **5.6** | Hardcoded `userName="Marcus Thompson"` persona vs audited surfaces' `CURRENT_USER` fixture pattern | Pure structural — align to `CURRENT_USER` during rework. |
| **5.7** | CohortView cross-surface coupling to advisor fixtures | Pure structural — adopt `unified.cohorts` / `unified.persons` during rework (same as Section 3 divergence #1). |
| **5.8** (additional) | `Plan` ↔ `GivingModeler` ↔ `GiveScreen` triangle: modeler output doesn't flow into GiveScreen | Surfaced during scoping; not yet ruled. Likely lands in the Plan-rework slice's design phase. |
| **5.9** (additional) | `IntakeContext` carries answers + gifts + lessons + assignments + worldLabel + givingStyle — possible scope-too-broad | Surfaced during scoping; not yet ruled. Decide during rework whether to split into intake-only vs activity contexts. |

---

## 6. Rework sequencing (tiers, when rework begins)

**Tier 1 — correctness / safety (early):**
- 5.1 — sector-language sweep on Individual (strip non-athletes copy at Positioning + verify no other sites).
- 5.3 — de-hardcode Feedback endpoint to config / env.

**Tier 2 — settled this session, no longer blocking:**
- 5.2 (founder letter — keep + parked strategic thread).
- 5.4 (CTA-summoned IA principle — name it).
- 5.5 (GivingModeler stays component).

**Tier 3 — structural, the bulk:**
- **12-pill Tag migration** to `<Tag tracking="loose">` (direct Enterprise port).
- **Unified-data-model adoption** — sequence: CohortView first (5.7 / Section 3 divergence #1), then the gifts / ID-namespacing / context decisions (Section 3 divergences #2-5).
- **3 paused-surface folds** — #12 (3 tokens + Tag swap), #63 (radius var), #116 (InteractiveCard design call).
- **`CURRENT_USER` alignment** (5.6).
- **Open design calls** to decide during their rework slice: 5.8 (Plan ↔ Modeler ↔ GiveScreen flow), 5.9 (IntakeContext scope split).

**Approach**: sub-slice discipline (one concern per bank) as proven in the Enterprise arc. Each slice = read-only investigation → propose → HOLD → execute → verify → smoke → commit → ff-bank.

**NOT this session.** Own build arc, fresh runway. This document opens the rework against a settled map.
