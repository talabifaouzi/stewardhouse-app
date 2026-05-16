# StewardHouse — Project Context

This file is read automatically at the start of every Claude Code session in this repo. It is the persistent project context. Keep it accurate; update it as locked decisions change.

---

## What this project is

StewardHouse is a philanthropic planning and education platform for athletes, musicians, entertainers, streamers, influencers, and creators, plus the institutions and advisors that work with them. The core innovation is **bilateral transparency** — a two-sided transparency layer between individual funder and nonprofit, expressed through the **Giving Partnership Profile (GPP)** (two layers: Giving Style + Giving Identity; narrative-based, no scores or grades).

The platform serves four user surfaces:
- **Individual** — athletes/creators using StewardHouse personally
- **Advisor** — philanthropic professionals managing an advising practice (active build target)
- **Enterprise** — athletic departments, universities, institutional admins
- **Operations** — internal StewardHouse staff

---

## Stack

- React + Vite
- Static JSON fixtures in `src/data/`
- Browser-based Babel during prototype phase — no build step required
- Cloudflare Pages auto-deploys from `main` branch
- Repo: `github.com/talabifaouzi/stewardhouse-app`
- Live demo: `stewardhouse-app.pages.dev`

---

## File structure

```
src/
  surfaces/
    individual/   — four-tier individual user surface (deployed at parity)
    advisor/      — 8-section advisor working view (active build target)
    enterprise/   — institutional admin
    operations/   — internal StewardHouse staff view
  data/           — JSON-shape fixtures for prototype (clients.js, etc.)
  components/     — shared components
```

---

## Brand tokens (LOCKED — never change)

- Background: `#FAF7F2` (warm beige)
- Accent: `#8B7355` (bronze)
- Headings: Libre Baskerville (serif)
- Body: Inter
- Card surfaces: white
- Icons: SVG only — **ZERO emoji**, no AI-generated picture art
- Accessibility: WCAG AA contrast minimum
- Consistent across all four user surfaces

---

## Path B boundary (LOCKED — never violate)

The platform is always **structural**, never advisory/fiduciary.

- **Test:** exposure (in) vs. evaluative recommendation (out)
- The platform never tells the advisor what to recommend
- The platform organizes what the advisor decides
- No AI-drafted Giving Partnership Profiles
- No custody, no payment rails
- Education-framed lessons (knowledge, not advice)
- User-declared surfacing, not algorithmic recommendation

If a feature would put the platform in a position to make an evaluative recommendation (e.g., "you should fund X" or "Marcus is ready for a larger gift"), it violates Path B. Surface options; never prescribe.

---

## Voice & tone (LOCKED)

Quiet, editorial. Closer to Aesop or The Atlantic than a consumer app.

- No exclamation points except in dialogue
- No "congratulations" or celebratory language for routine task completion
- No emoji anywhere in the interface
- Sentences carry weight; clauses do work
- Meet people where they are — never imply users are at a destination
- Spelling: standard English (Merriam-Webster). Correct silently unless the meaning changes.

---

## Sector terminology (LOCKED)

Different terminology by sector. For Phase 1 (athletics):

| Concept | Athletics | Music | Entertainment | Creator |
|---|---|---|---|---|
| Client noun | athletes | clients/artists | clients/talent | clients/creators |
| Admin role | Program Admin | A&R Lead | Talent Manager | Partnerships Lead |
| Compliance role | Compliance Officer | Legal Team | Legal/Business Affairs | Brand Safety |
| Event type | workshop | session | session | workshop |
| Completion | certified | completed | completed | completed |
| Reinvestment term | endowment visible | Program Reinvestment | Program Reinvestment | Program Reinvestment |

Non-athletics sectors use "Program Reinvestment," not "endowment."

---

## Client roster (Phase 1 — athletics only)

9 fictional athletes across 4 stages (`New` / `Active` / `Mature` / `Sunset`, renameable per advisor preference):

- Marcus Thompson (canonical demo client — `c-001`)
- Jasmine Rivera
- Reuben Asare
- Ezekiel Banner
- Isaiah Coleman
- Tariq Williams
- Bree Caldwell
- Naomi Pierce
- Jordan Estes

When building per-client content, give each client distinct fictional substance — different sports, different gift sizes, different giving identities, different session histories. **Never copy-paste Marcus's content under another name.**

---

## Advisor working view IA (LOCKED — v1.1)

Eight sections, structural parallel to the nonprofit profile view:

1. **Practice Header** — practice identity, current state, practice journal
2. **Client Roster** — clients organized by stage
3. **Client Workspace** — narrative-led depth, the advisor's daily home (active build target)
4. **Curriculum Library** — base + fork + author + drafts (advisor retains IP, platform holds delivery license)
5. **Cohort & Workshop Space** — group programming
6. **Between-Session Pipeline** — 3-tier preference cascade, 5 content types
7. **Documentation Hub** — practice docs, audit log, exports
8. **Practice Settings** — instance configuration

---

## Core principles (LOCKED)

- **No scores, no rankings, no grades** — applies to nonprofits, advisors, clients, everywhere
- **Discovery is for understanding; giving is for acting** — no donate button on discovery view
- **Connection parity across tiers** — Share/Connect/Signal Interest behave identically regardless of subscription level
- **Individual-pushes consent model** — funders initiate; nonprofits don't push
- **StewardHouse never authors org-level content** — only structural elements
- **Quality over speed** — the turtle wins the race
- **Don't fall in love with the work** — anything trashable for a better solution

---

## Active build target (current)

Deepen `src/surfaces/advisor/ClientWorkspace.jsx` through three movements:

1. **Pre-session prep** — agenda, what was left open last session, links into curriculum
2. **In-session notes / journaling** — writable advisor-private notes with state, timestamps, action items
3. **Post-session follow-up** — decisions captured, action items, link to what content surfaced afterward via Section 6 pipeline

**Architecture order:** extend the client data model first (add `givingPlan`, `sessions[]`, `privateNotes[]`, `nextSession` agenda fields to each client in `src/data/clients.js`), then deepen the component to render the new fields. Otherwise every deepening just adds more Marcus-shaped placeholders.

Marcus Thompson is the canonical demo client — give him the deepest data. The other 8 clients should each have distinct fictional content appropriate to their stage:
- **New** clients: GPS in progress, 0–1 intro sessions, no curriculum delivered yet
- **Active** clients: 3–5 sessions, evolving giving plan, ongoing curriculum
- **Mature** clients: 8+ sessions, established giving plan, lighter touch
- **Sunset** clients: relationship winding down, transition notes

---

## Working discipline

- Audit before editing — read existing code structure before adding new
- No silent fixes — flag anything unusual before touching it
- No scope creep — stay on the active build target
- Write complete files without truncation
- One file at a time
- Babel-validate every phase
- Use 2-file patch sets when possible (faster, fewer Windows folder issues)

---

## Things this project is NOT

- Not a robo-advisor for charity
- Not a competitor for advisor-client relationships
- Not a fiduciary or evaluative recommender
- Not a platform that custodies funds or processes gifts
- Not advisor-driven matching with scores or rankings

---

## When in doubt

Ask. Don't assume. Path B violations and brand-token deviations are non-negotiable.
