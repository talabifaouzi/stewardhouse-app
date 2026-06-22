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
| **`<Tag tracking="loose">`** (Enterprise port) | ~~12 inline bronze-tint pills~~ — see correction below | ~~HIGH~~ → **SKIPPED, NOT a valid target set** *(see correction below)* |
| **CORRECTION — 12-pill investigation read-only this session** | Read each candidate site in context. **0 of 12 are static bronze-tint pills in the Enterprise #44 sense.** The scoping grep matched `borderRadius:'var(--sh-radius-full)'` but that selector mostly catches **pill-shaped INTERACTIVE controls** in Individual, not static informational pills. Breakdown: **8 interactive controls** (`Discover:114`, `Feedback:210`, `GiveScreen:293`, `Questions:152`, `Team:78` + `:106` + `:291`, `GPSReveal:75` *has a deliberate bronze border — different shape*) — do NOT migrate; **1 card-bg chip** (`GPSReveal:106`, `--sh-card` bg not bronze-tint); **2 BORDERLINE display pills** (`IndividualSurface:226`, `Plan:93`) intentionally prominent (weight 600, larger padding, fontSize sm at Plan) — would visibly **SHRINK** if forced into the loose preset → **ruled SKIP** (forcing them loses their display role; a new Tag `tracking="display"` variant was considered and **REJECTED as premature abstraction** per the #47 / QA-051 lens — 2-site case doesn't justify expanding Tag's API); **1 hidden #12 sibling** at `Team:127` — see §4 correction. | **DISPOSITION: 12-pill migration SKIPPED.** Scoping under-estimated the heterogeneity of pill-shaped sites in Individual. The "biggest collapse opportunity" claim does not hold; no forced migration, no new Tag variant. The genuine pill-loose use case is Enterprise-shaped (static informational pills) and Individual doesn't have that shape. |
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

1. **CohortView pulls advisor `cohorts` + `clients` directly — worst offender. DONE (`eab1c71`).** Rewired 5 data lookups to `unified.cohorts` + `unified.programParticipations` + `unified.persons`. Render byte-identical (node-parity verified). **Rulings**: D1 call-site identity bridge (`currentMemberId = \`p-advisor-${individualProfile.id}\``; crosses the deferred same-person dedup gap deliberately, documented inline as the line to revisit when dedup lands); D2 `simulatedMemberSignals` kept raw with prefix-strip translation at lookup boundary; D3 / 5.7 `CohortMemberContext` DEFERRED, stays Individual-local (pure session state, no fixture deps; moving to unified gated on the broader "unified as live store?" / persistence-pilot question). First Individual file to import from `src/data/unified/`. **Architectural note**: the unified-vs-raw boundary now runs **through** Individual, not around it.

2. **`IndividualHome` reads `individualProfile` / `getFundingSpotlight` / `getMicroLearning` / `visibilityInsights` raw**, though these are already adapted into `unified.persons[].extensions.individual` for the audited surfaces. **Design call**: route Individual through unified (consistency) OR keep raw access (Individual is the source-of-truth surface). Either is defensible.

3. **Intake-written gifts (`addGift()`) land only in IntakeContext memory, NOT in `unified.gifts`.** The audited surfaces' `unified.gifts` are seed-only. Decide whether intake-written gifts join the unified stream (cross-surface visibility) or stay Individual-local (privacy / separation of concerns).

4. **No cross-surface ID namespacing in IntakeContext writes.** If Individual rework adopts unified entities, ID conventions (`p-individual-<id>`, `gift-individual-<seq>`, etc. — established in `unified/adapters/individual.js`) need to be wired through IntakeContext writes.

5. **Two Individual-local contexts (`IntakeContext` + `CohortMemberContext`).** Audited surfaces use unified queries + per-surface state. Evaluate whether `CohortMemberContext` belongs in unified (a "member-side cohort participation" entity) or stays local.

---

## 4. Paused-surface items (fold into rework — no standalone slices)

| # | Sites | Fold-in plan |
|---|---|---|
| **#12** Tag `warning` palette — **COMPLETE (`cd1a518`)** | **Landed at 10 sites — NOT the 4 the scoping anticipated.** Sites: 3 existing `<Tag tone="warning">` consumers (Team:338 + :380 `Past due`, :414 `Missing` — byte-unchanged via Tag.jsx token swap); Team:127 count-badge State-B; **+6 past-due sites surfaced during the slice via grep**: Team:193 (overview alert-tile color), Team:211 (caption color inside alert tile), Team:277 (past-due card border, the only `--sh-warning-border` consumer in Individual), Team:320 + :361 (past-due meta captions, identical pattern — replace_all-swapped), Team:400 (past-due caption). | **DONE — see CLAUDE.md §5 / commit `cd1a518`.** 3 tokens added (`--sh-warning-bg/text/border`); Tag.jsx `colorSchemes.warning` reads tokens; Team.jsx fully token-backed via Option-α (hex → token, no behavior/structure change); **zero warning hex literals remain outside `tokens.css`** across `src/`. Team:127 carries the one intended visual shift (`#F8D7CC` → `#FCEAE0` canonical pale-pink convergence); the other 9 sites are exact-value swaps with zero visual delta. Team:127 stays a hand-rolled count-badge span (NOT migrated to `<Tag>`) — count-badge ergonomics (padding 2px 7px / fontSize 10px / fontWeight 700) don't fit Tag's pill primitive; ruling preserved across the slice. |
| **#63** `borderRadius: '6px'` — **COMPLETE (`913f89a`)** | GiveScreen.jsx:204, GivingModeler.jsx:290 — both swapped to `var(--sh-radius-md)`; scoping count held (2 → 2, no expansion). | **DONE** — token-confirmed `--sh-radius-md: 6px` so zero visual change; shipped as standalone slice (paired-with-rework framing in the original scoping was abandoned in favor of capturing the contained fold quickly). Second of 3 paused-surface folds closed; #116 the only one left. |
| **#116** Card `interactive`/`onClick` — **CLOSED as documented-debt (Option (b), ruled not refactored)** | IndividualSurface.jsx:258 (→ /cohort), IndividualSurface.jsx:447 (→ /feedback), Learn.jsx:86 (→ glossary) — confirmed 3 consumers, uniform `<Card interactive onClick={fn}>` shape, no expansion (3 → 3) | **DONE by ruling** — investigation confirmed Card is a **50-consumer shared primitive** with only the 3 Individual sites on the interactive branch. Declined extraction: modifying shared `Card.jsx` for a 3-consumer trivial per-mount cost is upside-down cost/benefit. **#48 SegmentedControl cross-surface-blast lesson** (don't refactor a shared primitive in a single-surface slice) + **#47 / #57 premature-abstraction-at-current-scale lens**. **Sibling pattern**: second paused/Tier-3 item closed by **ruling-not-build** (alongside the 12-pill invalidation). The `Card.jsx:4-6` comment already documents the finding + consumer set; this is the FINAL ruling. **Revisit only if** Card's interactive branch becomes heavily cross-surface, OR `Card.jsx` is refactored for another reason. |

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
| **5.6** | Hardcoded `userName="Marcus Thompson"` persona vs audited surfaces' `CURRENT_USER` fixture pattern | **DONE (`a3f3c5e`)** — aligned to `individualProfile.name` + `\`Member · ${individualProfile.worldLabel}\``, NOT to `unified.persons` (the unified-vs-raw design call deferred to the CohortView slice; consistent with `IndividualHome`'s existing raw-individualProfile pattern). "Member · " prefix kept as call-site string (no single-consumer `roleLabel` field — #47 / QA-051 lens). Restore-button copy at IndividualSurface:523 left literal (descriptive UI content, not an identity prop). Scoping count held (1 → 1, no expansion). |
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
- ~~12-pill Tag migration to `<Tag tracking="loose">`~~ — **SKIPPED per the §2 correction above** (investigation found 0 of 12 are static bronze-tint pills in the Enterprise sense; the 2 borderline display pills don't fit the loose preset and a new variant was rejected as premature).
- ~~Primitive-adoption opener: #12 warning-palette fold (4 sites)~~ → **DONE** (`cd1a518`) — landed at **10 sites, not 4** (6 past-due literals surfaced during the slice via grep; see §4 #12 entry).
- ~~#63 borderRadius fold (2 sites)~~ → **DONE** (`913f89a`) — 2 sites swapped to `var(--sh-radius-md)`; scoping count held; zero visual change. Second paused-surface fold closed.
- ~~CURRENT_USER alignment (5.6)~~ → **DONE** (`a3f3c5e`) — sourced from `individualProfile` (raw, not unified). 1 site, scoping count held.
- ~~CohortView unified-data-model adoption (Section 3 divergence #1)~~ → **DONE** (`eab1c71`) — first structural Tier 3 slice; first Individual file on the unified layer. 5 lookups rewired, render byte-identical. **5.7 explicitly DEFERRED** during this slice (not just parked — `CohortMemberContext` consciously left Individual-local with an inline 5.7-DEFERRED marker in CohortView.jsx; revisit gated on unified-as-live-store).
- ~~#116 InteractiveCard design call~~ → **CLOSED by ruling** — Option (b) documented-debt; 3 of 3 paused-surface folds now closed (#12 + #63 + #116). See §4 #116 entry.
- **Tier 3 contained-structural phase COMPLETE.** All mechanical-rewire work done: 3 paused-surface folds closed; CohortView unified rewire shipped; sector-language sweep + endpoint de-hardcode + CURRENT_USER alignment all banked. What remains is **design-phase decisions only** (product/architecture questions, not mechanical rewires): **further unified-data-model adoption** if pursued (Section 3 divergences #2-5: individualProfile-raw-vs-unified, intake-gifts-join-unified, ID-namespacing in IntakeContext writes, `CohortMemberContext`-in-unified).
- **Open design calls** still parked: **5.7** `CohortMemberContext` location (now explicitly DEFERRED and documented inline at the CohortView call site); **5.8** (Plan ↔ Modeler ↔ GiveScreen flow); **5.9** (IntakeContext scope split); intake-gifts-join-unified.

**Approach**: sub-slice discipline (one concern per bank) as proven in the Enterprise arc. Each slice = read-only investigation → propose → HOLD → execute → verify → smoke → commit → ff-bank.

**Scoping-count discipline log** (added after the #12 fold landed; extended after #63 + CURRENT_USER): Tier 3 slice-by-slice tally —

| Slice | Anticipated | Actual | Δ |
|---|---|---|---|
| 12-pill correction (`b0f0e0c`) | 12 | 0 | **−12 (invalidated)** — original grep matched pill-shaped INTERACTIVE controls, not static informational pills |
| #12 warning-palette fold (`cd1a518`) | 4 | 10 | **+6** — past-due literals surfaced only during the slice's own grep sweep |
| #63 borderRadius fold (`913f89a`) | 2 | 2 | **0** — held; trivial token swap |
| CURRENT_USER alignment (`a3f3c5e`, 5.6) | 1 | 1 | **0** — held; contained prop alignment |
| CohortView unified rewire (`eab1c71`) | 5 | 5 | **0** — held; expansion was decision-surface (D1/D2/D3 rulings), not site-surface |
| #116 InteractiveCard ruling | 3 | 3 | **0** — held; closed by **ruling-not-build** (Option (b) documented-debt — no code change; second Tier-3 item closed by disposition, sibling to the 12-pill invalidation) |

**Pattern observed** (extended after #116): contained slices (#63, CURRENT_USER) and the **first substantial structural slice** (CohortView) **held** their counts. Larger pattern-matching slices (12-pill, #12 — broader-grep-radius) move in **both directions**. **Ruling slices** (12-pill, #116) closed without site change — by **disposition not build** — when investigation found the refactor cost/benefit upside-down. The CohortView slice — anticipated as the "design-heavy" expansion candidate — instead held the site count and **expanded the decision-surface** (D1 identity bridge, D2 signals translation, D3/5.7 deferral). **Decision-surface vs site-surface** is the corrected frame: pattern-matching slices grow at the site level; structural slices grow at the decision level; ruling slices grow at neither (the work IS the ruling). **Tier 3 scoping counts remain FLOORS, not ceilings** — particularly for the structural slices ahead (further unified-data-model adoption if pursued). Plan investigation time per slice; don't promise the scoping count as the final count until the slice's own grep sweep is done — and budget for design-surface expansion on structural slices even when site-count holds.

**NOT this session.** Own build arc, fresh runway. This document opens the rework against a settled map.
