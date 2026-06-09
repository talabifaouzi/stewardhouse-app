# Operations surface — QA audit (2026-06-09)

**Scope:** entire Operations surface — `src/surfaces/operations/OperationsSurface.jsx`
(OperationsHome / Overview plus all components: `MissionFunnel`, `FunnelRow`,
`PlatformHealthCard`, `SuiteRow`, `IssueRow`, `ActivityRowInteractive`,
`Chevron`, `Stat`, `UserList`, `PlatformHealth`, helpers `daysAgo`,
`formatFiled`, `formatTimeAgo`, `formatAbsDate`); the four non-home route stubs;
the surface's consumption of `unified.*`. Total 951 lines.

**Methodology:** read-only diagnosis. Severity rates the **issue**, not any
person. Each finding has a stable ID, location, problem statement, severity
(high / normal / low), and a one-line suggested direction. Direction lines are
not commitments — review and triage in a follow-up slice.

**Repo state at audit start:** `main` HEAD `ab4af01`, working tree clean,
branch `qa-audit-operations` cut from main.

---

## 1. Data binding & provenance/honesty

### QA-003 — Open issues tile sub-label "Awaiting response" is interpretive
- **Severity:** normal
- **Location:** `OperationsHome`, platform composition strip, line 232
- **Problem:** `<Stat label="Open issues" value={OPEN_ISSUE_COUNT} sub="Awaiting response" />`. Not all open issues await a response — three of the six current open issues are platform-level / data-integrity / content-review work items where there's no person to respond to. The sub-label asserts something the underlying data doesn't guarantee.
- **Direction:** rephrase to a descriptive sub (e.g. "Currently open" or "On the queue") that matches what an `Issue.status === 'open'` actually means.

### QA-004 — `Chrome` props `userName="Faouzi Talabi"` / `userRole="Founder"` hardcoded
- **Severity:** normal
- **Location:** `OperationsSurface`, lines 109–110
- **Problem:** Surface persona is plaintext hardcoded. Enterprise was rewired to a `CURRENT_USER` canonical pattern in commit `bc0beb9` (Cluster A); Operations is the only remaining surface with hardcoded persona. Listed as carried-forward work in `FOUNDER_CHECKLIST_DELTAS_2026-05-31.md`.
- **Direction:** wire to a `CURRENT_USER`-style import for Operations to match the Enterprise persona pattern.

### QA-005 — "Advisor Practices" vs "Philanthropic Advisors" — two labels for the same concept
- **Severity:** normal
- **Location:** platform composition tile line 231 ("Advisor Practices") vs `NAV_ITEMS` line 86 ("Philanthropic Advisors") routing to `/operations/advisors`
- **Problem:** Within one surface, the same concept renders under two different brand names. The composition tile counts practices (Walker + 6 synthetic = 7); the nav points to a stub view also implicitly about advisors. The reader sees "Advisor Practices" in the strip but "Philanthropic Advisors" in the nav.
- **Direction:** pick one canonical brand label and apply to both.

### QA-006 — `PlatformHealth` route stub conflicts with the live `<PlatformHealthCard>` on Overview
- **Severity:** normal
- **Location:** `PlatformHealth` route, lines 916–951 vs `PlatformHealthCard`, lines 350–492
- **Problem:** The `/operations/health` stub copy describes "Deploys, errors, latency, and active sessions across the platform" and says "Section scaffolded · monitoring will integrate when production traffic begins." But the Overview's live `<PlatformHealthCard>` already surfaces what we honestly can — data-layer integrity, which is real. The stub describes future-state monitoring as if no health view exists; the operator who navigated to `/operations/health` from the nav is told nothing's wired when something is. **Recon detail (2026-06-09 nav inventory):** the stub's subtitle promise — *"Deploys, errors, latency, and active sessions"* — names exactly the four external-monitoring placeholders the live `<PlatformHealthCard>` flags as `External monitoring: not wired`. Same surface name (`PlatformHealth` route component / `PlatformHealthCard` Overview component), contradictory promises within one surface: one says nothing's wired; the other says all five live `runChecks` suites are passing.
- **Direction:** rewrite the route stub to acknowledge the data-layer integrity view that exists, point operators back to the Overview pillar for the live signal, and re-scope the stub copy to the genuine deferred work (external monitoring, deploys).

### QA-007 — `RECENT_ACTIVITY` uses hardcoded `limit: 105` as a "fetch all" proxy
- **Severity:** low
- **Location:** line 53
- **Problem:** `unified.recentActivity({ limit: 105 })` uses `105` because that's the current full-feed size. If the seed grows past 105 (or a future production data set has more events), this silently truncates before the issue-opened filter runs, and the card under-reports. The magic number isn't documented and isn't tracked anywhere; only a careful reader will know it must change in lockstep with the projection.
- **Direction:** expose a "no limit" option on `unified.recentActivity()` (e.g. `{ limit: Infinity }` or a separate `all: true`), or pull the total from `unified.connectionRequests.length + unified.issues.length * 2` to make the upper bound data-derived.

### QA-008 — `HEALTH.composition.sources` includes `synthetic` as a "source"
- **Severity:** low
- **Location:** Composition rollup line 449
- **Problem:** Renders as `sources: enterprise · advisor · individual · synthetic`. From a code POV the four bundles are sources of records; from a reader POV "sources" reads like customer surfaces, and "synthetic" is the seed not a surface. Minor honesty drift between code-level naming and operator-facing copy.
- **Direction:** either relabel (`bundles:` or `feeds:`) to acknowledge the code meaning, or break "synthetic seed" out separately ("3 real sources + synthetic seed").

---

## 2. Interaction & the all-cards-interactive principle

### QA-009 — Platform composition tiles are not clickable (drill blocked on route-pages)
- **Severity:** normal
- **Location:** lines 222–234
- **Problem:** The four tiles (Individuals 77, Institutions 4, Advisor Practices 7, Open issues 6) display numbers without click-through. CLAUDE.md principle: "all lists and cards interactive across every surface." Routes `/operations/individuals`, `/operations/institutions`, `/operations/advisors` exist (stubs); the tiles could navigate to them today. Open issues already has a card with `IssueRow` drill; the tile itself isn't clickable.
- **Direction:** wire each tile to navigate to its corresponding route page, and add a card-level deferred-drill footnote acknowledging the routes are stubs until the route-pages slice lands.

### QA-010 — Pilot headline tiles are not clickable (drill blocked on route-pages)
- **Severity:** normal
- **Location:** lines 198–217
- **Problem:** Same shape concern as QA-009. "Relationships continuing 5", "Orgs supported 21", "Total given via StewardHouse $13,400", "Matched → gave 20%" are static numbers. An operator might want to drill to the 5 ongoing relationships, the 21 distinct orgs, the 21 underlying gifts, or the 21-vs-105 conversion records. None are reachable.
- **Direction:** mark as deferred-drill in a card-level footnote (mirror the Recent activity / Open issues card pattern); wire the actual drill once route pages exist.

### QA-011 — Mission funnel rows have no deferred-drill note
- **Severity:** low
- **Location:** `MissionFunnel`, lines 285–303
- **Problem:** Funnel aggregates 105 / 55 / 35 / 25 / 21 / 5 are deliberately aggregate-only (Slice B spec). But the Open issues + Recent activity cards have explicit "Per-issue/Per-activity drill-down pending" footnotes. Funnel has none — silently aggregate-only.
- **Direction:** add a parallel footnote ("Per-record breakdown pending — Operations route-pages slice") so the deferred-drill state is consistent across all cards.

### QA-012 — `PlatformHealthCard` informational entries have no drill or copy
- **Severity:** low
- **Location:** lines 453–480
- **Problem:** The card surfaces "Advisor pre-plan clients: 3 clients with no givingPlan yet" — operator may want to see which 3 clients. The detail string mentions the count but doesn't link or expose record IDs. Same for the enterprise gift divergence (18 vs 33 — the 15 missing-from-log gifts aren't reachable).
- **Direction:** acceptable to defer as read-only this slice (Slice H spec said so), but a small "View affected records" deferred-drill link would maintain interaction parity once the route pages land.

### QA-013 — `SuiteRow` errors block is not copyable / not interactive
- **Severity:** low
- **Location:** lines 526–561
- **Problem:** When suites fail, errors are shown verbatim in monospace. Operators who need to act on errors will likely copy them; the block has no copy-to-clipboard control, no link, no drill. Read-only is appropriate for current state (all pass), but flag for the attention-state UX.
- **Direction:** when attention-state genuinely fires, consider a copy-to-clipboard button or a route to a longer trace view.

### QA-014 — Activity rows mix interactive (chevron expand) and informational (surface chip) affordances
- **Severity:** low
- **Location:** `ActivityRowInteractive` lines 727–834
- **Problem:** Row click expands. Surface chip looks tappable but isn't (clicking it triggers the same row expand, not a filter-by-surface). Both look interactive but only the row click does anything.
- **Direction:** either make the chip an actual filter ("show only Enterprise events"), or visually de-emphasize it so it doesn't suggest interaction.

### QA-055 — Organizations have no operator view (drill-to-composition breaks at every org reference)
- **Severity:** normal
- **Location:** `NAV_ITEMS` lines 82–88 (no `orgs` route); references in pilot headlines (line 205, `METRICS.distinctOrgsAtGave` = 21) and recent-activity descriptions (cr-gave / cr-connected items naming target orgs verbatim, e.g. "Chris Walker's connection with Small Town Sports Coalition is ongoing")
- **Problem:** 17 nonprofit Org records live in `unified.orgs` and surface in two places on the Overview today — the "Orgs supported" pilot headline (21 distinct) and the Recent activity descriptions (every cr-* event names a target org). But no Operations nav route lists organizations. The drill-to-composition principle ("all lists and cards interactive across every surface") breaks at every org reference: an operator can read about "Small Town Sports Coalition" in a recent-activity row but has no path to an organization-detail view, because organizations as a concept have no nav home in Operations. The 4 nav routes (Individuals / Institutions / Philanthropic Advisors / Platform health) silently exclude `orgs` from the operator IA — they exist in the data layer but not in the surface's mental model.
- **Direction:** the route-pages spec adds an Organizations directory route (e.g. `/operations/organizations`), and either the pilot headline or the recent-activity expand drills into it. Without that, every org-mentioning row dead-ends on the Overview.

---

## 3. Accessibility

### QA-015 — `IssueRow` and `ActivityRowInteractive` missing `aria-expanded`
- **Severity:** high
- **Location:** lines 647 (`IssueRow`) and 741 (`ActivityRowInteractive`)
- **Problem:** Both have `role="button"` and toggle a visible expand panel, but neither sets `aria-expanded={expanded}`. Screen-reader users can't tell whether the row is currently expanded. Also no `aria-controls` pointing at the expand panel id.
- **Direction:** add `aria-expanded={expanded}` to the outer div on both row components; consider `aria-controls` paired with an id on the expand panel.

### QA-016 — No visible focus state for keyboard navigation
- **Severity:** high
- **Location:** `IssueRow` lines 646–668 and `ActivityRowInteractive` lines 740–762
- **Problem:** Outer divs have `tabIndex={0}` (keyboard-focusable) and an `onKeyDown` Enter/Space handler, but no `:focus` or `:focus-visible` styling. Hover state uses a bronze-tint background; focus produces no visual change. A keyboard user tabbing through the page has no idea which row is currently focused.
- **Direction:** add a `:focus-visible` outline (brand bronze ring or text-primary outline) via a small style hook (inline `outline` on focus state, or a CSS class).

### QA-017 — `SectionLabel` renders as `<span>` — no heading semantics
- **Severity:** high
- **Location:** `src/components/SectionLabel.jsx` (called from OperationsSurface lines 223, 264, 242, 291, 373, etc.) — confirmed from prior reads
- **Problem:** Card titles "Mission funnel", "Platform composition", "Recent activity", "Open issues", "Platform health" all render as styled `<span>` not as `<h2>` / `<h3>`. Screen-reader users cannot jump by heading or build a page outline. The `<h1>` "Operations" is the only heading on the page.
- **Direction:** out-of-scope concern (touches the shared component) but worth flagging — when the surface treats card titles as section titles, the markup should match.

### QA-018 — `<Card>` components carry no semantic wrapper
- **Severity:** high
- **Location:** all Card usages (lines 241, 263, 290, 365, etc.)
- **Problem:** `<Card>` is a `<div>` (confirmed from Card.jsx). Major content regions — Mission funnel, Platform health, Recent activity, Open issues — have no `<section>` or `aria-labelledby` wiring. Screen-reader region navigation will treat them as anonymous divs.
- **Direction:** out-of-scope (touches Card.jsx), but document — a future a11y slice should add `role="region"` + `aria-labelledby` patterns to Card or to its sectioned consumers.

### QA-019 — `LIVE` badge has no `aria-label` or hidden context
- **Severity:** normal
- **Location:** lines 374–388
- **Problem:** The badge text says "Live" alone. A screen reader will read "Live" with no context as to what's Live (Platform health? Stream? Data?). Visual sighted users get the placement next to "Platform health" — screen-reader users get isolated word.
- **Direction:** add `aria-label="Platform health is a live signal"` or wrap the badge inside the heading text so the relationship is implicit.

### QA-020 — Relative-time strings have no absolute-date fallback for assistive tech
- **Severity:** normal
- **Location:** `formatTimeAgo` lines 593–604 (Recent activity) and `formatFiled` lines 577–583 (Open issues)
- **Problem:** Visual users see "5 days ago" / "Filed 4 days ago". Screen-reader users get the same text — accurate but no precise date is exposed at row level (the absolute date is only in the expand panel). For a row that's NOT expanded, no precise date reaches AT.
- **Direction:** add a visually-hidden absolute date alongside the relative text (e.g. `<time dateTime={iso} title={formatAbsDate(iso)}>{relative}</time>`).

### QA-021 — Contrast risk on `var(--sh-text-muted)` against `var(--sh-bg-tint)`
- **Severity:** normal
- **Location:** Open issues `<Card tint>` (line 263) — internal muted text (sub labels, time labels)
- **Problem:** Open issues card uses `bg-tint` (#FBF8F3) as its background. Several text elements inside use `var(--sh-text-muted)` — verify WCAG AA 4.5:1 for normal body text. Without precise hex for `--sh-text-muted`, can't compute here, but flag as suspect — the Card is the most muted background and muted text on muted background is the classic contrast trap.
- **Direction:** spot-check `--sh-text-muted` against `--sh-bg-tint` with a contrast tool; bump to `--sh-text-secondary` inside tint cards if the ratio is below 4.5:1.

### QA-022 — Surface chip `0.5px` border may not meet 3:1 non-text contrast
- **Severity:** normal
- **Location:** `ActivityRowInteractive`, line 788
- **Problem:** `border: 0.5px solid ${surfaceAccent}` — `0.5px` is at the edge of browser rendering (some browsers round to 1px, some to 0). The 4 surface accent colors against `var(--sh-bg-tint)` (chip bg) need 3:1 minimum for non-text UI elements per WCAG AA.
- **Direction:** verify each accent's contrast against `bg-tint`; consider `1px` solid for guaranteed render.

### QA-023 — Tab order across cards is uneven
- **Severity:** low
- **Location:** entire OperationsHome
- **Problem:** Tab traversal: page header has no focusable elements → Platform health (no focusables) → caveat (none) → Mission funnel (none) → Pilot headlines (none) → Platform composition (none) → Recent activity (6 focusable rows) → Open issues (6 focusable rows). The bottom row has 12 tab stops; everything above has zero. Keyboard navigation feels lopsided.
- **Direction:** once aggregate tiles become drillable (QA-009/QA-010), the focusable surface area will distribute. No standalone fix recommended now.

---

## 4. Copy & labeling

### QA-001 — Mission-funnel framing reads as sales-funnel conversion language (seeded)
- **Severity:** normal
- **Location:** `<MissionFunnel>` line 285, `<SectionLabel>Mission funnel</SectionLabel>` line 291; "Matched → gave 20%" headline line 213–217; narrowing-bar visualization in `<FunnelRow>` lines 305–348
- **Problem:** The "Mission funnel" label, the "matched → gave 20%" conversion-rate headline, and the narrowing-bar viz read as sales-funnel/conversion language. This is off-brand for a relationship-first framing — the mission isn't to maximize conversion, it's to structure giving relationships.
- **Direction:** reframe toward relationship progression (e.g. "Relationship progression" pillar; headline shifts from "Matched → gave 20%" to a relationship-stage figure; bar viz reconsidered as a stage indicator, not a narrowing funnel).

### QA-002 — Platform-health "Live" badge likely unneeded (seeded)
- **Severity:** low
- **Location:** lines 374–388
- **Problem:** The honesty callout that follows ("These checks run live over the assembled data layer…") already carries the live framing. The "Live" pill duplicates and risks over-claiming as marketing badge ("LIVE!") rather than honest signal.
- **Direction:** drop the pill; keep the callout. Card title "Platform health" + the callout sentence carry the meaning.

### QA-054 — Overview IA leads with Platform health — sysadmin-first ordering on a mission-stewardship surface
- **Severity:** normal
- **Location:** `OperationsHome` lines 128–283, top-down: page header (lines 135–162) → Platform health Card (lines 164–169, Slice H placement) → demonstrative caveat (lines 171–184) → Mission funnel (lines 186–189) → Pilot headlines (lines 192–218) → Platform composition (lines 220–234) → bottom row Recent activity + Open issues (lines 236–280)
- **Problem:** The page's three implicit questions for the operator — *(1) what needs attention right now*, *(2) is the mission progressing*, *(3) is the platform sound* — are all present but inverted in priority. Platform health (Q3) leads; Mission progression (Q2) sits middle; the attention-shaped content (Open issues card, Recent activity feed) lands at the bottom in the two-column row. This is sysadmin-first ordering on a surface whose primary purpose is mission stewardship, not infrastructure monitoring. The Slice H placement chose "above the demonstrative caveat" specifically so the caveat's "below" scoping would stay literal — re-ordering health to the bottom is therefore not just a card swap but requires reframing the caveat (its "below" no longer scopes the demonstrative cards if health moves beneath them).
- **Direction:** reorder so attention-shaped + mission content lead and Platform health anchors the bottom; the demonstrative caveat must be reworded in the same change (its "below" scoping breaks when health moves beneath it). Cross-reference QA-001 (funnel framing) and QA-024 ("route-pages slice" copy leakage) — same copy/structure bundle.

### QA-024 — "Operations route-pages slice" leaks internal terminology into operator-facing copy
- **Severity:** normal
- **Location:** lines 259 (Recent activity footnote) and 277 (Open issues footnote)
- **Problem:** Both deferred-drill footnotes say "Per-X drill-down pending — Operations route-pages slice." The phrase "route-pages slice" is internal build-process language. An operator reader doesn't know what a slice is and shouldn't.
- **Direction:** reword to operator-facing language (e.g. "Per-issue drill-down pending — coming with the operator route pages").

### QA-025 — `<Stat>` sub-label capitalization is inconsistent
- **Severity:** low
- **Location:** lines 198–217, 229–232
- **Problem:** Mix of sentence-case and lowercase across sub-labels in the same view: "On platform" (capital O) vs "post-gift, still engaged" (lowercase) vs "distinct nonprofits at gave or ongoing" (lowercase) vs "Active programs" (capital A) vs "Awaiting response" (capital A) vs "cumulative funnel conversion" (lowercase) vs "across N gifts" (lowercase). Reads accidental.
- **Direction:** pick one case style for all sub-labels (recommend sentence case) and apply across both grids.

### QA-026 — "Matched → gave" uses an arrow as label
- **Severity:** low
- **Location:** lines 213–217
- **Problem:** The headline label combines typography and iconography. Readable but inconsistent with the other 3 tiles ("Relationships continuing", "Orgs supported", "Total given via StewardHouse"). The arrow also carries directional semantics ("→") that imply progression — coupled with QA-001's funnel concern.
- **Direction:** spell out the relationship ("Conversion from matched to gave" or "Matched-to-gave conversion") or rethink entirely under QA-001's reframe.

### QA-027 — OperationsHome lede asserts "three end-user surfaces"
- **Severity:** low
- **Location:** lines 153–161
- **Problem:** "Monitor and support across all three end-user surfaces." Accurate for Individual / Enterprise / Advisor, but reads as a hardcoded number that could date if surfaces evolve.
- **Direction:** prefer "across the customer surfaces" (no count) or pull the count from a data source. Minor; not urgent.

### QA-028 — `Card tint` Open-issues card has no semantic accent that signals attention
- **Severity:** low
- **Location:** line 263
- **Problem:** Open issues uses `<Card tint>` — a warm-tinted background. The visual difference from the Recent activity card (plain Card) signals "needs attention" subtly via background hue alone. Without a brand-token accent or explicit attention cue, the semantic gets lost.
- **Direction:** add a small bronze top-border accent via Card's existing `accent` prop, or a SectionLabel suffix indicating attention (e.g. "Open issues — needs review").

### QA-029 — "External monitoring: not wired" reads like a TODO bullet
- **Severity:** low
- **Location:** lines 483–489
- **Problem:** The literal string "not wired" reads as engineer-speak. Operator-facing copy would say "External monitoring: not yet enabled" or "External monitoring: pending integration."
- **Direction:** revise the display string (the underlying enum `'not-wired'` is fine to keep code-side).

### QA-056 — "Philanthropic Advisors" nav label routes to what the data layer models as `advisorPractices`
- **Severity:** low
- **Location:** `NAV_ITEMS` line 86 (`label: 'Philanthropic Advisors'` → `path: '/operations/advisors'`); routes to `<UserList kind="advisors" />` whose underlying entity is `unified.advisorPractices` (7 records: Walker + 6 synthetic). Compare against unified shape: each `advisorPractice` has a `leadPersonId` (the named advisor), `coAdvisorPersonIds`, `clientPersonIds`, `cohortIds` — the entity is a practice, not a person.
- **Problem:** Nav label implies people ("Philanthropic Advisors"); the entity behind the route is practices (org-shaped: lead + co-advisors + clients). The operator's mental model is two-layer (Walker Practice → Morgan Walker the lead → N. Park + T. Reeves as co-advisors → 9 clients), but the nav label collapses that to "Advisors." Compounds QA-005 (the platform-composition tile uses "Advisor Practices" for the same route — three labels for one concept now: "Philanthropic Advisors" in nav, "Advisor Practices" in tile, `advisorPractices` in code).
- **Direction:** resolve label and content together in the route-pages spec — e.g. "Advisor Practices" route listing each practice with its lead advisor named ("Walker Philanthropic Advisory — Morgan Walker, lead"), and align nav + tile + code on one term.

---

## 5. Brand & visual

### QA-030 — Operations chip bronze-on-bronze concern (flagged at Slice F)
- **Severity:** normal
- **Location:** `SURFACE_COLORS.Operations = 'var(--sh-bronze)'` line 70, chip render line 788
- **Problem:** Operations surface chip uses `var(--sh-bronze)` border. On row hover the row background becomes `var(--sh-bronze-tint)` (warm). The bronze border on warm bronze-tint reads heavier than the Individual / Enterprise / Advisor accent borders (which sit on the same hover background with their own distinct hues). Flagged at Slice F as "verify at visual check" — confirm now whether it actually reads heavier or holds.
- **Direction:** if heavier than peers, swap to `var(--sh-bronze-deep)` or a neutral `var(--sh-text-secondary)` for the Operations chip; otherwise keep.

### QA-031 — Hardcoded `10px` font size on chips (not a token)
- **Severity:** low
- **Location:** lines 375 (LIVE badge) and 779 (surface chip)
- **Problem:** Brand spec is tokens-only for type sizes. `10px` literal is used for the two pill badges. Two violations of "no hex / no literal" rule (extended to type sizes per practice).
- **Direction:** add a `--sh-text-2xs: 10px` token, or accept `var(--sh-text-xs)` (12px) for these pills.

### QA-032 — Hardcoded `2px`, `4px` spacing literals
- **Severity:** low
- **Location:** lines 535 (gap: '4px'), 680 (marginBottom: '2px'), 691 (margin-top), 776 (margin), 794 (line-height), 800-ish — multiple
- **Problem:** Token system is `--sh-space-1` (4px) and finer. Literals like `'2px'` and `'4px'` slip in for fine-grained tweaks. Tokens-only is the rule; these are inconsistencies.
- **Direction:** swap `'4px'` for `var(--sh-space-1)`; consider a `--sh-space-half: 2px` token, or accept `'2px'` as the exception.

### QA-033 — Hardcoded `3px` border-left on expand panels and SuiteRow errors block
- **Severity:** low
- **Location:** lines 531 (SuiteRow), 701 (IssueRow expand), 810 (ActivityRowInteractive expand)
- **Problem:** Bronze left-accent stripes are consistently `3px solid var(--sh-bronze)`. The width literal is shared but not tokenized. The color is tokenized; the width isn't.
- **Direction:** introduce a `--sh-border-accent-width: 3px` token if this pattern is intended to be reused; minor.

### QA-034 — `fontFamily: 'monospace'` in SuiteRow errors block
- **Severity:** low
- **Location:** line 541
- **Problem:** Generic CSS keyword `'monospace'` used instead of a brand-token mono font. If the brand later defines a mono font token, this won't pick it up.
- **Direction:** introduce `--sh-font-mono` (e.g., `ui-monospace, ...`) and use it here.

### QA-035 — Bronze funnel bars on bronze-tint track — low contrast
- **Severity:** low
- **Location:** `FunnelRow` lines 324–336
- **Problem:** Bar fill is `var(--sh-bronze)` (#8B7355) over track `var(--sh-bg-tint)` (#FBF8F3). The fill is clearly visible, but the track-vs-bar relationship reads as "bronze on warm white." Non-text contrast 3:1 is met (bronze vs near-white) but visually thin. The 8px-tall bar may read as too subtle on tablet/mobile.
- **Direction:** consider `--sh-bronze-deep` for the bar fill, or thicker bar height, if visual review confirms subtlety.

### QA-036 — Expand panel `var(--sh-card)` on Recent-activity card (which is also `var(--sh-card)`) — minimal contrast
- **Severity:** low
- **Location:** `ActivityRowInteractive` expand panel line 805–831
- **Problem:** Recent activity card is plain `<Card>` (bg `var(--sh-card)` = white). Expand panel uses `var(--sh-card)` (also white) with a bronze left-stripe + border-radius. The panel reads as a tile-within-tile only because of the bronze stripe. Within Open issues `<Card tint>`, the same expand panel pops more (white on tint). The two cards' expand panels read with different prominence.
- **Direction:** introduce a `var(--sh-card-tint-elevated)` or use a faint background variation on Recent activity's expand panel; or accept the asymmetry.

---

## 6. Layout & responsive

### QA-037 — Bottom row 2fr/1fr grid has no narrow-width stack rule
- **Severity:** normal
- **Location:** lines 236–280
- **Problem:** `gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)'` — Recent activity takes 2 columns, Open issues 1. At narrow widths (e.g. tablet portrait < 720px), the 1fr Open issues column will compress to a few-character width. No `@media` breakpoint or `auto-fit` collapse rule.
- **Direction:** add a media query (or container query) below ~720px that stacks the two cards vertically.

### QA-038 — `FunnelRow` left column `140px` fixed width
- **Severity:** low
- **Location:** line 310
- **Problem:** `gridTemplateColumns: '140px 1fr 56px'`. On narrow mobile widths, the 140px left column compresses the middle bar aggressively. "CONVERSING" is the widest label (~110px); fits, but barely.
- **Direction:** verify mobile rendering; consider switching to `auto 1fr auto` with `min-width` on each column.

### QA-039 — Activity row description has no `wordBreak`
- **Severity:** low
- **Location:** `ActivityRowInteractive` description text lines 792–800
- **Problem:** Long descriptions (e.g. CR-gave with long org names) flow without explicit break rules. Modern browsers handle the wrapping but very long unbroken strings (URLs, hashes) could overflow horizontally and break the layout.
- **Direction:** add `wordBreak: 'break-word'` or `overflowWrap: 'anywhere'` to long-text containers (description, summary).

### QA-040 — `<main>` padding asymmetric: `var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)`
- **Severity:** low
- **Location:** line 133
- **Problem:** 40px top / 32px sides / 64px bottom. Asymmetric padding is a design choice (extra bottom for breathing room), but worth verifying with the design intent. Same pattern in `UserList` and `PlatformHealth` route stubs.
- **Direction:** spot-check with design.

---

## 7. Stubs & dead-ends

### QA-041 — All four non-home routes are obsolete stubs
- **Severity:** high
- **Location:** `UserList` lines 874–914, `PlatformHealth` route lines 916–951
- **Problem:** Each non-home route renders "Section scaffolded · aggregation queries will land here when data layer is wired." The data layer IS wired (the Overview proves it). The stub copy is stale by ~6 slices. A user clicking any nav item from the Operations Overview lands on a stale stub. Three of five nav items are dead-ends.
- **Direction:** rewrite stub copy to reflect current state (data layer wired, route pages pending) AND track the actual route-pages build as next-arc work (already on `FOUNDER_CHECKLIST_DELTAS_2026-05-31.md`).

### QA-042 — `UserList` `titleMap` has no `default` for unknown `kind`
- **Severity:** low
- **Location:** lines 875–879
- **Problem:** `{ titleMap[kind] }` returns `undefined` if a future nav route passes an unrecognized kind. Renders as empty `<h1>`. No graceful fallback.
- **Direction:** add a fallback (`titleMap[kind] || 'Operations'`) or a runtime assertion.

### QA-043 — `UserList` route copy promises "Filtering, search, and per-user drill-down"
- **Severity:** low
- **Location:** lines 894–900
- **Problem:** The copy ("Aggregate view across all X on the platform. Filtering, search, and per-user drill-down.") describes a UX that doesn't exist. Reads as a roadmap planted into a placeholder.
- **Direction:** soften to "Aggregate view across all X on the platform — coming in the route-pages build" until the route page lands.

---

## 8. Code quality & consistency

### QA-044 — `IssueRow` and `ActivityRowInteractive` are 95% structurally identical
- **Severity:** low
- **Location:** lines 635–725 (IssueRow) and 727–834 (ActivityRowInteractive)
- **Problem:** Both have: `useState(false)` for expanded + hovered; outer div with role=button, tabIndex=0, onKeyDown, onMouseEnter/Leave, hover-bronze-tint bg, padding negative-margins, userSelect:none; Chevron in right; expand panel with bronze left-stripe and border-radius-md. The differences are display strings only. Slice F decision was to keep them as siblings; cosmetic duplication is fine but flag.
- **Direction:** if a future slice adds a third row type, extract a shared `<ExpandableRow>` component to take content as children/props.

### QA-045 — `daysAgo`, `formatFiled`, `formatTimeAgo` overlap
- **Severity:** low
- **Location:** lines 569–604
- **Problem:** `formatFiled` is Issue-specific ("Filed N days ago"); `formatTimeAgo` is Activity-specific (relative-with-weeks-fallback). Both call `daysAgo`. Minor; acceptable.
- **Direction:** no action.

### QA-046 — `subLabel` style object defined inside `PlatformHealthCard` function body
- **Severity:** low
- **Location:** lines 351–359
- **Problem:** Style object literal recreated on every render. Should be hoisted to module level alongside `MONTH_SHORT`, `SURFACE_COLORS`, etc. Inconsistent with the rest of the file's pattern (most styles are inline; the few hoisted style maps are at module level).
- **Direction:** hoist the `subLabel` style to module level.

### QA-047 — LIVE badge alignment hack — fragile `marginBottom: var(--sh-space-3)`
- **Severity:** low
- **Location:** lines 383–386
- **Problem:** Comment explains: "SectionLabel has marginBottom var(--sh-space-3); shift the badge up so it sits on the title baseline rather than the gap below it." This is a layout workaround dependent on `SectionLabel.jsx`'s internal margin. If SectionLabel ever changes its margin, the LIVE badge falls out of alignment silently.
- **Direction:** either pull SectionLabel into a flex parent that doesn't rely on its margin, or restructure the title row to use a shared baseline / `<h2>` with the badge as a child span. (Especially relevant if QA-002 drops the badge.)

### QA-048 — `SURFACE_COLORS` fallback to `var(--sh-text-muted)` is silent
- **Severity:** low
- **Location:** line 738
- **Problem:** `const surfaceAccent = SURFACE_COLORS[item.surface] || 'var(--sh-text-muted)';` — if a future activity item has a surface not in the map (e.g., a new "Operations Admin" surface added to Slice E), the chip silently renders as grey-bordered. No console warning, no test failure.
- **Direction:** either add a runtime assert / dev warning, or expand `SURFACE_COLORS` whenever `ActivityItem.surface` enum changes; consider co-locating the surface map next to the projection's surface derivation in `unified/index.js`.

### QA-049 — `PlatformHealth` route component name collides with `PlatformHealthCard`
- **Severity:** low
- **Location:** function `PlatformHealth` line 916 vs `PlatformHealthCard` line 350
- **Problem:** Two React components with near-identical names — one is a stub route, the other is the live Overview pillar. A reader can confuse them in stack traces or component-tree views.
- **Direction:** rename `PlatformHealth` (route stub) to `PlatformHealthRoute` to distinguish from `PlatformHealthCard`.

### QA-050 — `onKeyDown` handlers duplicated across `IssueRow` and `ActivityRowInteractive`
- **Severity:** low
- **Location:** lines 651–656 and 745–750
- **Problem:** Identical Enter/Space toggle handler in both. If a third interactive row type is added, the pattern triples.
- **Direction:** extract a `handleEnterSpace(toggle)` utility, or fold into the shared row component proposed in QA-044.

### QA-051 — No `React.memo` on row components
- **Severity:** low
- **Location:** all row components
- **Problem:** `IssueRow`, `ActivityRowInteractive`, `SuiteRow`, `Stat` are not memoized. Parent re-renders re-render all rows. Negligible at current scale (6–14 rows) but worth flagging if data grows.
- **Direction:** consider `React.memo` on row components once the data scale grows.

### QA-052 — Multiple module-level `unified.*` calls (eager evaluation pattern)
- **Severity:** low
- **Location:** lines 12–14, 19–20, 36–37, 53, 60
- **Problem:** The module-level eager pattern is documented and intentional (the unified import is eager; calling helpers at module load is one-time work). But: this means importing `OperationsSurface.jsx` runs the entire data pipeline. Test/import isolation suffers.
- **Direction:** acceptable; document this pattern in the surface's header comment so a future test author understands what an import costs.

### QA-053 — `RECENT_ACTIVITY` filter inline; not exposed for testing
- **Severity:** low
- **Location:** lines 53–55
- **Problem:** The card-level curation (`filter(i => i.sourceEventType !== 'issue-opened')`) is inline in module-level capture. No unit test surface; the filter rule is only visible by code reading.
- **Direction:** extract a tiny helper (`curateForRecentActivityCard(items)`) so the rule is named and testable.

---

## Summary table

### By category

| Category | Findings |
|---|---:|
| 1. Data binding & provenance/honesty | 6 (QA-003, QA-004, QA-005, QA-006, QA-007, QA-008) |
| 2. Interaction & all-cards-interactive | 7 (QA-009, QA-010, QA-011, QA-012, QA-013, QA-014, QA-055) |
| 3. Accessibility | 9 (QA-015, QA-016, QA-017, QA-018, QA-019, QA-020, QA-021, QA-022, QA-023) |
| 4. Copy & labeling | 10 (QA-001, QA-002, QA-024, QA-025, QA-026, QA-027, QA-028, QA-029, QA-054, QA-056) — QA-001/002 seeded |
| 5. Brand & visual | 7 (QA-030, QA-031, QA-032, QA-033, QA-034, QA-035, QA-036) |
| 6. Layout & responsive | 4 (QA-037, QA-038, QA-039, QA-040) |
| 7. Stubs & dead-ends | 3 (QA-041, QA-042, QA-043) |
| 8. Code quality & consistency | 10 (QA-044, QA-045, QA-046, QA-047, QA-048, QA-049, QA-050, QA-051, QA-052, QA-053) |
| **Total** | **56** |

### By severity

| Severity | Findings | List |
|---|---:|---|
| high | 5 | QA-015, QA-016, QA-017, QA-018, QA-041 |
| normal | 16 | QA-001, QA-003, QA-004, QA-005, QA-006, QA-009, QA-010, QA-019, QA-020, QA-021, QA-022, QA-024, QA-030, QA-037, QA-054, QA-055 |
| low | 35 | QA-002, QA-007, QA-008, QA-011, QA-012, QA-013, QA-014, QA-023, QA-025, QA-026, QA-027, QA-028, QA-029, QA-031–QA-036, QA-038–QA-040, QA-042–QA-053, QA-056 |
| **Total** | **56** | |

### Highs (5) — the urgent ones

- **QA-015** Missing `aria-expanded` on IssueRow / ActivityRowInteractive (accessibility)
- **QA-016** No visible keyboard focus state on interactive rows (accessibility)
- **QA-017** `SectionLabel` renders as `<span>` not heading (accessibility, screen reader navigation)
- **QA-018** `<Card>` has no `<section>` / `aria-labelledby` wiring (accessibility)
- **QA-041** All four non-home routes are obsolete stubs (UX dead-ends)

### Normals (14)

QA-001 funnel framing · QA-003 "Awaiting response" sub-label · QA-004 hardcoded persona on Chrome · QA-005 Advisor Practices vs Philanthropic Advisors · QA-006 PlatformHealth route stub vs live pillar conflict · QA-009 platform composition tiles not clickable · QA-010 pilot headline tiles not clickable · QA-019 LIVE badge no aria-label · QA-020 relative-time no absolute fallback for AT · QA-021 muted text on tint card contrast risk · QA-022 chip 0.5px border contrast risk · QA-024 "Operations route-pages slice" leaks internal language · QA-030 Operations chip bronze-on-bronze · QA-037 no narrow-width stack on bottom row

### Lows (33)

The remainder — copy / tokenization / consistency / minor visual / code organization concerns. Prioritize by category when triaging.

---

**Doc state:** branch `qa-audit-operations` at HEAD = the commit of this doc. `main` untouched at `ab4af01`. No code changes in this audit.
