# Advisor surface — QA audit (2026-06-13)

**Scope:** entire Advisor surface — 15 files: 8 main IA sections (`PracticeHome`, `ClientRoster`, `ClientWorkspace`, `CurriculumLibrary`, `CohortSpace`, `Pipeline`, `Documentation`, `PracticeSettings`), 6 auxiliaries (`DocCreate`, `DocDetail`, `LessonDetail`, `LessonEditor`, `DraftsList`, `CohortDetail`), plus the `AdvisorSurface` route shell.

**Methodology:** read-only diagnosis. Severity rates the **issue**, not any person. Each finding has a stable ID (`ADV-NNN`), location, problem statement, severity (`high` / `normal` / `low`), category, and any cross-audit analog note. Direction lines are not commitments — triage and fix in follow-up bundles off `main`.

**Repo state at audit start:** `main` HEAD `797e87c189f00b9201a8d8b36d5e378863ca56b5`, working tree clean, branch `qa-audit-advisor` cut from main.

**Triage dispositions locked at audit close (2026-06-13):**
- **ADV-009** (fake-interactive controls): **neutralize-via-removal** for 8 controls; **Stage Rename × 4 carved out** as a future sibling slice per CLAUDE.md §7 ("renameable per advisor preference"). Exact removal count to be verified during the fix bundle (this walk inventoried 9 candidates; founder ruling cites 8 — discrepancy noted, reconciled at fix time).
- **ADV-014** (PracticeHome journal voice) and **ADV-021** (Marcus private-notes voice): **CLOSED as not-findings** — intended advisor-internal voice. Path B governs platform-authored copy; advisor-authored seed content displayed back to the advisor is a different scope. Demo seeds should read like a real advisor's notebook, not like platform copy.

---

## 1. Cross-cutting findings

### ADV-001 — "Track and field" inconsistent title case (SEED)
- **Severity:** low
- **Location:** `ClientRoster.jsx:7`
- **Problem:** `sports = ['All', 'Basketball', 'Football', 'Soccer', 'Track and field']`. Other sports Title Cased; "Track and field" uses lowercase a/f. Per CLAUDE.md voice lock ("standard English (Merriam-Webster)") should be **"Track and Field"**.
- **Category:** copy/structure

### ADV-002 — CohortSpace kicker pattern: `<SectionLabel>` rendered as `cohort.focus` editorial tag (SEED)
- **Severity:** normal
- **Location:** `CohortSpace.jsx:73`; `CohortDetail.jsx:142`
- **Problem:** `<SectionLabel>` post-QA-017 renders as `<h2>`. CohortCard uses it as an editorial framing label (cohort focus area) that sits ABOVE the actual cohort name `<h3>` — semantic/visual hierarchy mismatch. CohortDetail header uses the same `cohort.focus` string as a plain eyebrow `<p>` (different shape but same role).
- **Category:** accessibility + copy/structure
- **Analog:** QA-017 (heading semantics)

### ADV-003 — Internal "Section N" labels leak into user-facing kickers (10 sites)
- **Severity:** normal
- **Locations:** `ClientRoster.jsx:39`, `CurriculumLibrary.jsx:97`, `Pipeline.jsx:53`, `Documentation.jsx:49`, `PracticeSettings.jsx:21`, `CohortSpace.jsx:29`, `DocCreate.jsx:60`, `DraftsList.jsx:59`, `LessonDetail.jsx:99`, `LessonEditor.jsx:134/135/136`
- **Problem:** 10 places render `"Section 2 · Roster"` / `"Section 4 · Curriculum"` etc. as eyebrow kickers. These are internal build-process labels (the "8-section IA" scope language). Advisors don't think in numbered sections.
- **Category:** copy/structure
- **Analog:** QA-024 (Operations "route-pages slice" leak)

### ADV-004 — Hex literals embedded in component bodies (StageBadge + 2× StateBadge + Documentation hint button)
- **Severity:** **high**
- **Locations:**
  - `ClientRoster.jsx:253-258` — `StageBadge` (8 hex literals: `#F0EBDF`, `#5A554C`, `#F5EFE3`, `#5A453A`, `#E8E2D6`, `#3D3A33`, `#F8F6F0`, `#8A8579`)
  - `ClientWorkspace.jsx:695-700` — `StateBadge` (6 hex literals: `#E8F0E5`, `#3E5A3F`, `#F0EBDF`, `#5A554C`, `#F5EFE3`, `#5A453A`)
  - `Pipeline.jsx:214-218` — `StateBadge` (6 hex literals — **duplicate code** of ClientWorkspace's `StateBadge`)
  - `Documentation.jsx:142` — `border: '0.5px solid #B8AE9E'` (1 hex literal)
- **Problem:** **21 hex values** + a duplicated `StateBadge` component across ClientWorkspace and Pipeline. CLAUDE.md guardrail: "No hex literals in components." Either extract to `tokens.css` (new `--sh-stage-*`/`--sh-state-*` tokens) or use existing tokens that approximate.
- **Category:** brand discipline / data integrity

### ADV-005 — Sub-pixel `0.5px` borders
- **Severity:** normal
- **Locations:** `ClientRoster.jsx:141` (FilterGroup chip), `Documentation.jsx:142, 163`
- **Problem:** Browsers round `0.5px` to 0 or 1 unpredictably. Bundle 3 swept this in Operations.
- **Category:** accessibility (rendering)
- **Analog:** QA-022

### ADV-006 — Numeric literal pixel values pervasive
- **Severity:** normal (very pervasive)
- **Sample:** `'10px'`/`'9px'`/`'22px'` font sizes; `'2px'`/`'3px'`/`'4px'`/`'5px'`/`'8px'`/`'11px'`/`'12px'`/`'14px'`/`'16px'` spacing; `'140px'`/`'160px'`/`'180px'`/`'200px'`/`'420px'`/`'880px'` layout widths; `'4px'`/`'6px'` border-radius
- **Problem:** **~40+ sites** across all 15 files without a full sweep. Bundle 4 introduced `--sh-space-half` (2px), `--sh-border-accent`, `--sh-font-mono` for the same kind of literals in Operations. Sweep-style fix needed here.
- **Category:** brand discipline
- **Analog:** QA-031 (10px chip font), QA-032 (spacing literals)

### ADV-007 — Unicode glyphs instead of SVG icons
- **Severity:** normal
- **Locations:**
  - `→` right-arrow: `PracticeHome.jsx:148, 168`, `ClientWorkspace.jsx:274`
  - `+` plus: `Documentation.jsx:79, 98`
  - `?` help-button: `Documentation.jsx:156`
  - `×` close: `Pipeline.jsx:343`
  - `·` required-field indicator: `DocCreate.jsx:179`
  - `←` back: `DraftsList.jsx:109`, `LessonDetail.jsx:312`
- **Problem:** CLAUDE.md guardrail: "SVG icons only · zero emoji anywhere in the interface."
- **Category:** brand discipline

### ADV-008 — Hardcoded color names: `color: 'white'` / `color: '#FFFFFF'`
- **Severity:** normal
- **Locations:** `ClientWorkspace.jsx:576` (Add note button), `CohortDetail.jsx:398` (Publish update button), `Pipeline.jsx:481` (SegmentedControl active state)
- **Category:** brand discipline

### ADV-009 — Fake-interactive controls without `onClick` (DISPOSITION LOCKED)
- **Severity:** **high**
- **Locations (full inventory — exact removal count to verify at fix time):**
  - `PracticeHome.jsx:137-149` — "New entry →" button (no handler) **→ REMOVE**
  - `PracticeSettings.jsx:57` × 4 — Stage "Rename" buttons (no handler) **→ CARVED OUT for future wiring slice per CLAUDE.md §7**
  - `PracticeSettings.jsx:65, 66, 67` — "Change" / "Change" / "Configure" buttons (no handler) **→ REMOVE**
  - `CohortSpace.jsx:48` — "Start a cohort" button (no handler) **→ REMOVE**
- **Problem:** Buttons render with full Button-component styling but do nothing on click. Affordance dishonesty (QA-014 analog).
- **Disposition (2026-06-13):** neutralize-via-removal for the non-stage-rename controls; Stage Rename × 4 carved out as a future sibling slice.
- **Category:** affordance honesty
- **Analog:** QA-014

### ADV-010 — Local-only state with no persistence (disclosed)
- **Severity:** low
- **Locations:**
  - `ClientWorkspace.jsx:569` — PrivateNotes "Notes added in this session are not yet persisted."
  - `CohortDetail.jsx:391` — Updates "Updates published in this session are not yet persisted."
  - `CohortDetail.jsx:250` — Flags "Notes added in this session are not yet persisted."
  - `Documentation.jsx:117` — "Anything you add here is session-only — it won't be saved across refreshes."
  - `DocCreate.jsx:77` — "Anything you add is session-only and won't survive a page refresh."
- **Problem:** Honest disclosure is present at every site. Real interactive UX wires to throwaway state. Acceptable per prototype scope; documented for triage.
- **Category:** affordance honesty (disclosed)

---

## 2. PracticeHome (`/advisor`)

### ADV-011 — `new Date()` runtime date in page header
- **Severity:** low
- **Location:** `PracticeHome.jsx:7-8`
- **Problem:** `const today = new Date(); const dateStr = today.toLocaleDateString(...)`. Live wall-clock date in the page intro. Means screenshots are dated and display depends on user's local clock.
- **Category:** data integrity / honesty

### ADV-012 — `new Date(client.nextSession)` sort key parses free-form strings
- **Severity:** low
- **Location:** `PracticeHome.jsx:18`
- **Problem:** `upcoming = [...clients].sort((a, b) => new Date(a.nextSession) - new Date(b.nextSession))`. If `nextSession` is free-form text (e.g. "May 18, 2026"), Date parsing may produce NaN. Verify `client.nextSession` shape.
- **Category:** data integrity

### ADV-013 — Practice journal entry hardcoded fictional content
- **Severity:** low
- **Location:** `PracticeHome.jsx:128-149`
- **Problem:** The journal "entry" is hardcoded as static fiction. "4 entries this month" badge (line 135) and "New entry →" button (line 148) suggest interactive journaling — none of which exists. Demo frame for an unbuilt feature.
- **Category:** affordance honesty / data integrity
- **Note:** "New entry →" button is part of ADV-009 (REMOVE).

### ADV-014 — Path B borderline language in Practice journal demo content [CLOSED — not-finding, 2026-06-13]
- **Severity:** low
- **Location:** `PracticeHome.jsx:128`
- **Problem (as audited):** Journal entry "Marcus is asking better questions about restricted vs. unrestricted than three months ago. The shift from 'what's the safest gift' to 'what does this organization actually need' is happening on its own — not because of a lesson." Reads as evaluative assessment of client progression.
- **Disposition (2026-06-13):** **CLOSED — not-finding.** Advisor-internal voice (private journal); Path B governs platform-authored copy, not advisor-authored seed content. Demo seeds should read like a real advisor's notebook.
- **Category:** Path B (borderline — closed)

---

## 3. ClientRoster (`/advisor/clients`)

### ADV-015 — `?stage=` URL param not synced after mount
- **Severity:** normal
- **Location:** `ClientRoster.jsx:10-14`
- **Problem:** `useSearchParams` read once at component mount to initialize `activeStage`. If URL changes (back/forward, external link), the chip state doesn't update. Slice 5 of Operations established the URL-as-source-of-truth pattern; ClientRoster predates it.
- **Category:** affordance honesty / data integrity
- **Analog:** Operations slice 5 URL-state pattern

### ADV-016 — Search input has no `aria-label`; label-by-placeholder
- **Severity:** normal
- **Location:** `ClientRoster.jsx:59-73`
- **Problem:** Search `<input>` has only `placeholder="Search by name"` and no `aria-label`. Placeholder disappears when the input has content; screen-reader users lose the label.
- **Category:** accessibility

### ADV-017 — `StageBadge` hex literals
- **Reference:** see ADV-004
- **Location:** `ClientRoster.jsx:253-258`

---

## 4. ClientWorkspace (`/advisor/clients/:clientId`)

### ADV-018 — `StateBadge` hex literals (duplicate of Pipeline's StateBadge)
- **Reference:** see ADV-004
- **Location:** `ClientWorkspace.jsx:695-700`

### ADV-019 — Code comments leak "Section 6" architectural language
- **Severity:** low
- **Location:** `ClientWorkspace.jsx:178, 692` — comments contain "Section 6 — between-session pipeline" and a reference to `section6-step-a`
- **Problem:** Code comments, not user-facing. Flag for cleanup during code-quality refactor.
- **Category:** code organization

### ADV-020 — `window.confirm()` for destructive action (LessonDetail discard)
- **Severity:** low
- **Location:** `LessonDetail.jsx:61` (sibling pattern; documenting here for proximity)
- **Problem:** Native browser confirm dialog visually inconsistent with brand. Should be a custom Modal.
- **Category:** brand consistency

### ADV-021 — Path B borderline observations in Marcus private notes [CLOSED — not-finding, 2026-06-13]
- **Severity:** low
- **Location:** `ClientWorkspace.jsx` → `client.privateNotes` data. Marcus's seeded note: "Marcus's mother is the unnamed third party in every conversation about giving. Worth surfacing — when ready — that her steadiness is what's actually being honored. Don't push."
- **Problem (as audited):** Observational + slightly directive ("Don't push"). Advisor-internal notes scope.
- **Disposition (2026-06-13):** **CLOSED — not-finding.** Same reasoning as ADV-014 — advisor-authored seed content displayed back to the advisor.
- **Category:** Path B (borderline — closed)

---

## 5. CurriculumLibrary (`/advisor/curriculum`)

### ADV-022 — Stat-row labels inconsistent parallelism
- **Severity:** low
- **Location:** `CurriculumLibrary.jsx:136-138`
- **Problem:** "Base lessons" / "Your tailored lessons" / "Your authored" — mixed possessive constructions. Should parallel (e.g. "Base / Tailored / Authored" or "Your base / Your tailored / Your authored").
- **Category:** copy/structure

---

## 6. CohortSpace (`/advisor/cohorts`)

### ADV-023 — "Start a cohort" fake button
- **Reference:** see ADV-009
- **Location:** `CohortSpace.jsx:48`
- **Disposition:** REMOVE

### See also ADV-002 (kicker pattern)

---

## 7. CohortDetail (`/advisor/cohorts/:cohortId`)

### ADV-024 — Curriculum-track + Sessions sections always render empty placeholders
- **Severity:** low
- **Location:** `CohortDetail.jsx:430-451`
- **Problem:** Two sections render with section heading + empty-state message unconditionally. Section scaffolding for unbuilt feature. Adjacent to fully functional Updates section, the contrast reads as half-built.
- **Category:** affordance honesty (acceptable per prototype scope)

### ADV-035 — Flag toggle button lacks `aria-pressed`
- **Severity:** low
- **Location:** `CohortDetail.jsx:284-302`
- **Problem:** Toggle button switches label "Flagged" ↔ "Flag for follow-up" but has no `aria-pressed` attribute. Screen-reader users don't get pressed-state.
- **Category:** accessibility

---

## 8. Pipeline (`/advisor/pipeline`)

### ADV-025 — `ConfigDrawer` accessibility (HIGH)
- **Severity:** **high**
- **Location:** `Pipeline.jsx:275-432`
- **Problem (multiple):**
  - No focus trap inside dialog
  - No initial-focus management on open
  - Tab/Shift-Tab can escape the dialog to background
  - `aria-label` on the `<aside>` instead of `aria-labelledby` pointing at the actual `<h2>` heading at line 312
- **Category:** accessibility (table-stakes modal a11y)

### ADV-026 — Overlay rgba + box-shadow literals
- **Severity:** low
- **Locations:** `Pipeline.jsx:269` (`background: 'rgba(40, 32, 20, 0.32)'`), `:287` (inline rgba box-shadow)
- **Problem:** Hardcoded rgba colors instead of tokens. Tokens.css has `--sh-overlay-bg` (rgba(0,0,0,0.5)) and `--sh-shadow-modal`. Should reuse.
- **Category:** brand discipline

### ADV-027 — `×` close glyph not SVG
- **Reference:** see ADV-007
- **Location:** `Pipeline.jsx:343`

### ADV-028 — Transition literal `'all 150ms ease'`
- **Severity:** low
- **Location:** `Pipeline.jsx:485, 517`
- **Problem:** `--sh-transition-fast: 120ms ease` exists; should reuse.
- **Category:** brand discipline

---

## 9. Documentation (`/advisor/docs`)

### ADV-029 — `0.5px solid #B8AE9E` on hint button
- **Reference:** see ADV-004 + ADV-005
- **Location:** `Documentation.jsx:142`

### ADV-030 — "+ New section" inline-styled button inconsistent with `<Button>` component
- **Severity:** low
- **Location:** `Documentation.jsx:81-99`
- **Problem:** Page also uses the `<Button>` component (e.g. CurriculumLibrary patterns) but here renders an inline-styled button. Inconsistent button system.
- **Category:** consistency

### ADV-031 — Section error rendered without `aria-live`
- **Severity:** normal
- **Location:** `Documentation.jsx:252-260`
- **Problem:** Section-error rendered as italic muted text without `role="alert"` or `aria-live`. Screen-reader users miss the error state change.
- **Category:** accessibility

---

## 10. PracticeSettings (`/advisor/settings`)

### ADV-032 — 7 stub buttons across 4 cards
- **Reference:** see ADV-009 (and ADV-013 for the journal sibling)
- **Locations:** `PracticeSettings.jsx:57` × 4 (Stage Rename — **CARVED OUT**), `:65, 66, 67` (Change/Change/Configure — **REMOVE**)

### ADV-033 — `maxWidth: '880px'` literal narrower than other advisor pages
- **Severity:** low
- **Location:** `PracticeSettings.jsx:9`
- **Problem:** Other advisor pages use `var(--sh-content-max)` (1200px). PracticeSettings narrows to 880px literal. Editorial choice or oversight?
- **Category:** brand consistency

### POSITIVE — Path B boundary card v1.0
- **Location:** `PracticeSettings.jsx:70-89`
- **Note:** Explicit Path B boundary card reads cleanly ("StewardHouse is a structural platform. It does not provide advisory acts..."). Not a finding — recorded as a positive for reference.

---

## 11. DocCreate (`/advisor/docs/new`)

### ADV-036 — Required-field indicator is Unicode "·" middle dot; inputs lack `aria-required`
- **Severity:** low
- **Location:** `DocCreate.jsx:179`
- **Problem:** `{required && <span ... aria-hidden="true">·</span>}`. Middle dot used as required indicator (aria-hidden, so screen-readers don't get it). Inputs themselves don't have `aria-required` or proper `<label for=…>` associations.
- **Category:** accessibility / brand discipline

---

## 12. DocDetail (`/advisor/docs/:docId`)

**No formal findings.** One of the cleaner files. Uses `{categoryLabel}` as kicker (not "Section N") — does not trigger ADV-003.

---

## 13. LessonDetail (`/advisor/curriculum/:lessonId`)

### ADV-038 — "The full lesson is being written" placeholder body
- **Severity:** low
- **Location:** `LessonDetail.jsx:165`
- **Problem:** Body section renders only a placeholder description that "the long-form read will follow." Honest framing. Acceptable per prototype scope; documented for triage.
- **Category:** affordance honesty (disclosed)

### ADV-039 — File-upload input has no associated label
- **Severity:** normal
- **Location:** `LessonDetail.jsx:218-227`
- **Problem:** The preceding `<FieldLabel>` is a `<p>` not associated with the input via `<label for=…>` or `aria-labelledby`. Screen-reader users may not get the connection.
- **Category:** accessibility

---

## 14. LessonEditor (`/advisor/curriculum/new`, `/advisor/curriculum/:id/fork`, `/advisor/curriculum/:id/edit`)

### ADV-040 — "Section 4 · …" kickers in all 3 modes
- **Reference:** see ADV-003
- **Location:** `LessonEditor.jsx:134-136`

### ADV-041 — Numeric input for minutes has no live validation feedback
- **Severity:** low
- **Location:** `LessonEditor.jsx:67`
- **Problem:** `minutesValid = Number.isFinite(minutesNum) && minutesNum >= 1`. Minimum validation in logic, but invalid state surfaces only on attempted save.
- **Category:** accessibility / honesty

---

## 15. DraftsList (`/advisor/curriculum/drafts`)

### ADV-042 — "← Back to library" Unicode arrow
- **Reference:** see ADV-007
- **Location:** `DraftsList.jsx:109`

### ADV-043 — "Section 4 · Drafts" kicker
- **Reference:** see ADV-003
- **Location:** `DraftsList.jsx:59`

---

## Summary tables

### By category

| Category | Findings |
|---|---:|
| Affordance honesty | 5 (ADV-009, ADV-010, ADV-013, ADV-015, ADV-024, ADV-038, ADV-041) |
| Accessibility | 9 (ADV-002, ADV-016, ADV-025, ADV-031, ADV-035, ADV-036, ADV-039, parts of ADV-005) |
| Copy/structure | 5 (ADV-001, ADV-002, ADV-003, ADV-022, parts of ADV-019) |
| Brand discipline (tokens / hex / glyphs) | 10 (ADV-004, ADV-005, ADV-006, ADV-007, ADV-008, ADV-026, ADV-028, ADV-029, ADV-030, ADV-033) |
| Data integrity / honesty | 4 (ADV-011, ADV-012, ADV-015, ADV-038) |
| Path B (closed) | 2 (ADV-014, ADV-021) — both closed as not-findings |
| Code organization | 1 (ADV-019) |
| **Total** | **43** unique IDs (several cross-reference cross-cutting findings) |

### By severity

| Severity | Findings | List |
|---|---:|---|
| critical | 0 | — |
| **high** | 3 | ADV-004, ADV-009, ADV-025 |
| normal | 15 | ADV-002, ADV-003, ADV-005, ADV-006, ADV-007, ADV-008, ADV-015, ADV-016, ADV-018 (= ADV-004), ADV-029 (= ADV-004+5), ADV-031, ADV-039, ADV-040 (= ADV-003), ADV-043 (= ADV-003), plus parts of ADV-022 |
| low | ~20 | ADV-001, ADV-010, ADV-011, ADV-012, ADV-013, ADV-014 (closed), ADV-019, ADV-020, ADV-021 (closed), ADV-022, ADV-023 (= ADV-009), ADV-024, ADV-026, ADV-027 (= ADV-007), ADV-028, ADV-030, ADV-032 (= ADV-009), ADV-033, ADV-035, ADV-036, ADV-038, ADV-041, ADV-042 (= ADV-007) |
| **Total** | **43 unique IDs** | |

### Highs (3) — the urgent ones

- **ADV-004** Hex literals embedded in 4 components (StageBadge + 2× StateBadge + Documentation hint) — 21 hex values, duplicate StateBadge code
- **ADV-009** Fake-interactive controls without `onClick` — 9 buttons across PracticeHome / PracticeSettings / CohortSpace. **Disposition locked**: remove 8, carve out Stage Rename × 4 for a future sibling slice
- **ADV-025** Pipeline `ConfigDrawer` accessibility — no focus trap, no initial focus, escapable Tab, weak labelledby

### Top 5 most important findings (audit's read)

1. **ADV-009** — Fake-interactive buttons (9 sites). User-facing affordance dishonesty across nearly every advisor section.
2. **ADV-004** — Hex literals across 4 files (21 values). Hard CLAUDE.md brand-discipline violation + DRY (duplicate StateBadge).
3. **ADV-025** — Pipeline ConfigDrawer a11y. Modal dialog a11y is table-stakes; this is the surface's most complex interactive element.
4. **ADV-003** — "Section N" labels leak into 10 user-facing kickers. Internal build-process language across nearly every section.
5. **ADV-006** — Numeric pixel literals pervasive (~40+ sites). Sweep-style fix like Operations bundle 4 (QA-032).

---

## Provisional fix-bundle sequencing (PROPOSED, not locked)

This sequencing is a starting point for triage. Order is smallest-first (matching Operations bundle progression) and groups findings that share a fix shape:

1. **Bundle 1 — Copy sweep**: ADV-001 (Track and Field) + ADV-003 (10 Section-N kickers). Trivial copy fixes, no architectural risk.
2. **Bundle 2 — Brand-token sweep**: ADV-004 (hex literals → tokens) + StateBadge DRY extraction (single shared component, no duplicate definition).
3. **Bundle 3 — Pixel/token sweep**: ADV-006 (numeric pixel literals) + ADV-005 (0.5px borders) + ADV-008 (color name literals) + ADV-026 (rgba literals) + ADV-028 (transition literal) + ADV-033 (880px literal). Pure brand-discipline sweep.
4. **Bundle 4 — Glyph → SVG**: ADV-007 (Unicode arrows / plus / × / ? / · / ←). Brand discipline.
5. **Bundle 5 — A11y cluster**: ADV-002 (CohortSpace kicker semantics) + ADV-016 (search aria-label) + ADV-031 (Documentation error aria-live) + ADV-035 (flag aria-pressed) + ADV-036 (DocCreate aria-required + label association) + ADV-039 (file input label) + ADV-041 (live validation feedback).
6. **Bundle 6 — Pipeline drawer dedicated slice**: ADV-025 (focus trap, initial focus, escape prevention, aria-labelledby). Single-component focus; its own slice.
7. **Bundle 7 — ADV-009 removal**: 8 controls removed; Stage Rename × 4 retained pending future wiring slice (see CLAUDE.md §7).
8. **Stage Rename sibling slice (separate)**: Wire the 4 Stage Rename buttons to a real Modal-based rename flow. Per CLAUDE.md §7 ("renameable per advisor preference"). Out of the audit-bundle sequence; ships when prioritized.
9. **Bundle 8 — ADV-015 URL-state sync**: ClientRoster `?stage=` synchronized via `useSearchParams` source-of-truth pattern (matches Operations slice 5).

Items NOT in the sequencing (closed at audit close): ADV-014, ADV-021 (Path B not-findings).

Items NOT scheduled (low / disclosed / acceptable per prototype): ADV-010, ADV-013, ADV-019, ADV-020, ADV-024, ADV-038. Triage in bundles or close as wontfix at founder discretion.

---

**Doc state:** branch `qa-audit-advisor` at HEAD = the commit of this doc. `main` untouched at `797e87c`. No code changes in this audit. Branch preserved as reference-only and never merged, matching `qa-audit-enterprise` and `qa-audit-operations`.
