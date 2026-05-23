# StewardHouse — Project Manifest

This file tells Claude Code how to work in this repository. Read it at the
start of every session.

## What StewardHouse is

A philanthropic planning and education platform for athletes, their advisors,
and athletic departments. The platform is **structural, never advisory or
fiduciary** — it organizes what an advisor or funder decides; it does not
decide for them. Phase 1 scope is **athletes only**.

The current build is a prototype / stress-test tool, not production. Quality
over speed is the governing value: stress-test before moving forward, build it
right once, do not optimize for velocity.

## Stack

- React + Vite, deployed on Cloudflare Pages
- react-router-dom for routing
- Static JSON/JS fixtures in `src/data/` (no backend; Candid API integration is future)
- Styling via CSS custom properties (design tokens) in `src/styles/global.css` —
  use `var(--sh-*)` tokens, never hardcoded colors or spacing
- No TypeScript; plain `.jsx`

## Architecture

Five surfaces under `src/surfaces/`, routed in `src/App.jsx`:
- `landing/` — public entry
- `individual/` — the funder-facing experience (paused at v0.6.1)
- `enterprise/` — institutions (athletic departments)
- `advisor/` — the advisor surface (current focus)
- `operations/` — internal operations

The advisor surface (`src/surfaces/advisor/`) has 8 sections:
1. PracticeHome.jsx — practice header + journal
2. ClientRoster.jsx — client roster (stages: New / Active / Mature / Sunset)
3. ClientWorkspace.jsx — per-client workspace (narrative-led, three movements:
   pre-session prep, in-session notes, post-session follow-up)
4. CurriculumLibrary.jsx — base + fork + author
5. CohortSpace.jsx — cohorts and workshops
6. Pipeline.jsx — between-session pipeline (Section 6)
7. Documentation.jsx — documentation hub
8. PracticeSettings.jsx — practice settings

Shared components live in `src/components/` (Card, Button, SectionLabel,
HelpIcon, Chrome). Data fixtures live in `src/data/` (clients.js, content.js,
orgsData.js, etc.).

## Build discipline — follow on every task

1. **Audit before editing.** When asked to change code, first investigate and
   report priority-ranked findings with explicit scope boundaries. Do not edit
   until the change is confirmed.
2. **One file at a time.** Complete files, no truncation, no "... rest unchanged."
3. **Validate every phase.** After each change, run the build / lint and confirm
   it passes before moving on. Do not batch unvalidated edits.
4. **No silent fixes, no out-of-scope refactoring.** Flag anything unusual before
   touching it. If you notice an unrelated problem, surface it — do not fix it
   inline.
5. **Don't fall in love with the work.** Any code is trashable for a better
   solution. Prefer the right structure over the written one.
6. **Commit in small, described increments.** One logical change per commit,
   clear message. Work on a branch for anything non-trivial.

## Product invariants — never violate

- **No scores, no grades, no rankings.** Anywhere — nonprofit profiles, advisor
  discovery, GPS, pipeline. Narrative-based throughout.
- **Path B boundary.** The platform is structural. No AI-drafted Giving
  Partnership Profiles, no custody or payment rails, no evaluative
  recommendations. Test: exposure (in) vs. evaluative recommendation (out).
- **Brand tokens only.** Warm beige background, bronze accent, Libre Baskerville
  serif headings, Inter/sans body. Zero emoji. No AI-generated picture art.
  WCAG AA. All via `var(--sh-*)` tokens.
- **Section 6 vocabulary (locked):** "between-session pipeline" (the name),
  "surface" (the unified verb), states are Active / Mute / Pause, "cohort
  updates" is the fifth content type. Per-client settings are "default" vs.
  "override"; overrides are preserved when practice-wide defaults change.
- **Phase 1 is athletes only.** No music / entertainment / creator language in
  user-facing copy.

## Data reconciliation invariant (Section 6)

The roster has **9 clients** (c-001 .. c-009). All Section 6 numbers must
reconcile against those 9:
- Each client carries a `pipeline` array: one entry per content type, with
  `state` (Active/Muted/Paused) and `source` (default/override).
- A client's `activeContent` count === number of entries with state Active.
- For each content type, across the 9 clients:
  `clientsOnDefault + overrides === 9`.
- `pipelineDefaults` in `content.js` stores those per-type aggregates and must
  match what the client `pipeline` arrays actually produce.
- `advisorPracticeProfile.clientCount === 9`.

If you change pipeline data, re-derive and verify these equalities before
committing. Numbers shown to a user must never contradict each other on screen.
