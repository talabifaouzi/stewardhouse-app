# Operations surface — current-state review

**Date:** 2026-05-31
**Scope:** Audit-first inventory of the Operations surface as it exists today, before any build-out scoping. Read-only — no Operations code touched.
**Branch at review time:** `main` at `a1b505b`.

---

## 1. Existence + location

**Exists.** Single file: **`src/surfaces/operations/OperationsSurface.jsx`** (322 lines). No subdirectory structure (contrast with Enterprise's `surfaces/enterprise/reports/`, `surfaces/enterprise/setup/`, `surfaces/enterprise/shared/`). No subcomponents in separate files. The entire surface is one file containing the route shell, five page components, and two helper components.

---

## 2. IA + routing

| Layer | Detail |
|---|---|
| App-level route (`App.jsx:15`) | `/operations/*` → `OperationsSurface` |
| Reached from | Landing page (`Landing.jsx:31-36`) — Operations card in surface picker |
| Chrome integration | `surface="operations"` — wired in `Chrome.jsx:22-26` (label "Operations", accent `--sh-operations-accent: #3D3A33` "dark warm — internal", role "Internal admin"). Token defined in `tokens.css:33`. |
| Chrome props | `userName="Faouzi Talabi"`, `userRole="Founder"` — **hardcoded string literals** (same pattern Cluster A removed from Enterprise) |
| Sub-routes (inside OperationsSurface) | 5 nav items, 5 routes + 1 catch-all |
| `/operations` (index) | `<OperationsHome />` |
| `/operations/individuals` | `<UserList kind="individuals" />` |
| `/operations/institutions` | `<UserList kind="institutions" />` |
| `/operations/advisors` | `<UserList kind="advisors" />` |
| `/operations/health` | `<PlatformHealth />` |
| `*` | redirect to `/operations` |

---

## 3. Per-route build state

| Route | Component | State | What it does / completeness |
|---|---|---|---|
| `/operations` | `OperationsHome` | **PARTIAL (cosmetic shell, fully hardcoded data)** | Renders eyebrow + title + subtitle; 4 stat tiles (`142` individuals, `4` institutions, `11` advisors, `2` open issues — all literal strings); "Recent activity" Card with 4 hardcoded ActivityRows; "Open issues" Card with 2 hardcoded items. Visual design complete; **every value is a string literal in JSX**. No data layer. |
| `/operations/individuals` | `UserList(kind='individuals')` | **EMPTY-PLACEHOLDER** | Title + subtitle + tinted card: *"Section scaffolded · aggregation queries will land here when data layer is wired."* |
| `/operations/institutions` | `UserList(kind='institutions')` | **EMPTY-PLACEHOLDER** | Identical scaffold. |
| `/operations/advisors` | `UserList(kind='advisors')` | **EMPTY-PLACEHOLDER** | Identical scaffold. |
| `/operations/health` | `PlatformHealth` | **EMPTY-PLACEHOLDER** | Title + subtitle + tinted card: *"Section scaffolded · monitoring will integrate when production traffic begins."* |

---

## 4. Component inventory

- **Operations-specific** (all in OperationsSurface.jsx, none extracted): `OperationsHome`, `UserList`, `PlatformHealth`, `ActivityRow`, `Stat`. Five internal helpers, zero in `src/components/`.
- **Shared components reused**: `Chrome`, `Card`, `SectionLabel` — three.
- **No Operations-specific shared components.**

---

## 5. Data backbone

**None.** No `src/data/operationsFixtures.js`. Every value displayed by the surface is a string literal inline in OperationsSurface.jsx:

- 4 aggregate stat values
- 4 recent-activity rows (time, surface tag, detail)
- 2 open issues (title, filed-when, source)

No imports from `src/data/`. The surface is structurally unwired from any data source — fixture, context, or otherwise. (Contrast: Enterprise consumes from a 750+ line `enterpriseFixtures.js` plus contexts.)

---

## 6. Cross-surface relationship + purpose

**Self-described** (`OperationsSurface.jsx:83-85`):
> *"Monitor and support across all three end-user surfaces. View user activity, surface issues, and provide support. This view is internal-only and is never exposed to platform users."*

Eyebrow: **"Internal · StewardHouse staff"**. Chrome user persona "Faouzi Talabi / Founder" reinforces that this is the platform-owner view.

**Conceptual purpose** (inferred from naming, routes, comments):
- Cross-cutting admin/owner view over the three customer-facing surfaces (Individual, Enterprise, Advisor).
- Three of the five nav entries correspond 1:1 to those surfaces (Individuals → Individual; Institutions → Enterprise; Philanthropic Advisors → Advisor) — the Operations team browses users on each surface from here.
- Two cross-cutting concerns: aggregate recent activity and open issues (Overview), and platform health (separate route).

**Nomenclature drift to flag:** Operations NAV calls them "Institutions" while the surface itself is named "Enterprise" elsewhere in the codebase. Same target audience (athletic departments), two names.

---

## 7. Gaps / TODOs / inconsistencies

- **No `TODO` / `FIXME` / `XXX` / `HACK` comments anywhere** in the file (grep clean).
- **Inline placeholder text explicitly acknowledges deferred work**: "data layer is wired", "monitoring will integrate when production traffic begins" — intent is documented in the placeholders themselves.
- **All numbers on Overview are fictional + unbacked**: 142 / 4 / 11 / 2 don't correspond to anything in fixtures.
- **Recent-activity rows reference real fixture entities** (Marcus Thompson, Morgan Walker, Cooper State) but no link to those entities exists — purely visual.
- **Operations Open Issues includes an issue against itself** ("Cloudflare deploy fails after merge") — meta but unwired.
- **Same persona-hardcode pattern Cluster A removed from Enterprise** (`bc0beb9`): `userName="Faouzi Talabi" / userRole="Founder"` are string literals. Operations would benefit from the same `CURRENT_USER`-style wiring once an operations-user fixture exists.
- **No tests** (no `src/surfaces/operations/__tests__` or `.test.jsx` files for this surface; tests don't appear to exist anywhere in the repo).
- **No drill-down patterns** — Enterprise has `AthleteProfile` modal, `WorkshopDetail` modal, `ContactsDirectory` etc. Operations has zero modals or per-user views.
- **No issue tracker**, **no health monitor**, **no user management** — the four nav entries beyond Overview are all unbuilt.

---

## Assessment

**Scope-and-build, not QA-and-polish.**

- **Built**: ~15% — Overview's visual shell, 5 routes, Chrome wiring, surface-accent token, route from Landing.
- **Scaffolded**: ~5% — 3 UserList stubs + 1 PlatformHealth stub (literal "scaffolded" placeholders).
- **Unbuilt**: ~80% — no fixtures, no user lists, no issue tracker, no health monitor, no drill-downs, no contexts, no modals, no per-entity views.

For comparison, when QA-auditing Enterprise we found 173 issues across 6 fully-implemented routes backed by 752 lines of fixtures. Auditing Operations today would surface ~4 findings, all variants of "this page doesn't exist yet." The wrong tool for what's actually needed.

**Next step is build-scoping with the advisory team**, not a QA audit. The scoping conversation should answer: which of the four placeholder pages comes first, what data sources back them, what the MVP feature set is per page, and whether the existing Overview's hardcoded numbers stay fictional for demo or need a real aggregation pipeline. Once the build lands, then a QA pass.

The cross-surface data-model discovery (companion doc `cross-surface-data-model-discovery-2026-05-31.md`) defines the unified data layer that Operations will read from. Build-out of Operations depends on that layer landing first.
