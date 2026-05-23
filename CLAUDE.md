# StewardHouse — Project Manifest

This file tells Claude Code how to work in this repository. Read it at the
start of every session. Keep it accurate; update it as locked decisions change.

## What StewardHouse is

A philanthropic planning and education platform for athletes, their advisors,
and athletic departments. The platform is **structural, never advisory or
fiduciary** — it organizes what an advisor or funder decides; it does not
decide for them. Phase 1 scope is **athletes only**.

The core concept is **bilateral transparency** — a two-sided transparency layer
between individual funder and nonprofit, expressed through the **Giving
Partnership Profile (GPP)** (two layers: Giving Style + Giving Identity;
narrative-based, no scores or grades).

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

## Voice & tone (LOCKED)

Quiet, editorial. Closer to Aesop or The Atlantic than a consumer app.

- No exclamation points except in dialogue
- No "congratulations" or celebratory language for routine task completion
- No emoji anywhere in the interface
- Sentences carry weight; clauses do work
- Meet people where they are — never imply users are at a destination
- Spelling: standard English (Merriam-Webster). Correct silently unless the meaning changes.

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
  recommendations. Test: exposure (in) vs. evaluative recommendation (out). If a
  feature would let the platform make an evaluative recommendation (e.g., "you
  should fund X" or "Marcus is ready for a larger gift"), it violates Path B.
  Surface options; never prescribe.
- **Brand tokens only.** Warm beige background `#FAF7F2`, bronze accent `#8B7355`,
  white card surfaces, Libre Baskerville serif headings, Inter/sans body. Zero
  emoji. No AI-generated picture art. SVG icons only. WCAG AA. All via
  `var(--sh-*)` tokens.
- **Section 6 vocabulary (locked):** "between-session pipeline" (the name),
  "surface" (the unified verb), states are Active / Mute / Pause, "cohort
  updates" is the fifth content type. Per-client settings are "default" vs.
  "override"; overrides are preserved when practice-wide defaults change.
- **Phase 1 is athletes only.** No music / entertainment / creator language in
  user-facing copy.
- **Discovery is for understanding; giving is for acting.** No donate button on
  the discovery view.
- **Connection parity across tiers.** Share / Connect / Signal Interest behave
  identically regardless of subscription level.
- **Individual-pushes consent model.** Funders initiate; nonprofits don't push.
- **StewardHouse never authors org-level content** — only structural elements.

## Client roster (Phase 1 — athletics only)

9 fictional athletes across 4 stages (`New` / `Active` / `Mature` / `Sunset`,
renameable per advisor preference):

- Marcus Thompson (canonical demo client — `c-001`)
- Jasmine Rivera
- Reuben Asare
- Ezekiel Banner
- Isaiah Coleman
- Tariq Williams
- Bree Caldwell
- Naomi Pierce
- Jordan Estes

Give each client distinct fictional substance — different sports, gift sizes,
giving identities, and session histories. **Never copy-paste Marcus's content
under another name.** Marcus is the canonical demo client and should carry the
deepest data. Per-stage shape:

- **New:** GPS in progress, 0–1 intro sessions, no curriculum delivered yet
- **Active:** 3–5 sessions, evolving giving plan, ongoing curriculum
- **Mature:** 8+ sessions, established giving plan, lighter touch
- **Sunset:** relationship winding down, transition notes

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

## Sector terminology (FUTURE PHASE — reference only)

Phase 1 is athletes only; the table below is locked terminology for later
phases and must not appear in current user-facing copy.

| Concept | Athletics | Music | Entertainment | Creator |
|---|---|---|---|---|
| Client noun | athletes | clients/artists | clients/talent | clients/creators |
| Admin role | Program Admin | A&R Lead | Talent Manager | Partnerships Lead |
| Compliance role | Compliance Officer | Legal Team | Legal/Business Affairs | Brand Safety |
| Event type | workshop | session | session | workshop |
| Completion | certified | completed | completed | completed |
| Reinvestment term | endowment visible | Program Reinvestment | Program Reinvestment | Program Reinvestment |

Non-athletics sectors use "Program Reinvestment," not "endowment."

## Things this project is NOT

- Not a robo-advisor for charity
- Not a competitor for advisor-client relationships
- Not a fiduciary or evaluative recommender
- Not a platform that custodies funds or processes gifts
- Not advisor-driven matching with scores or rankings

## When in doubt

Ask. Don't assume. Path B violations and brand-token deviations are non-negotiable.
