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
| **Operations Overview** | **Complete and QA'd.** Overview ships 8 redesign slices (A–H, 2026-06); QA audit on branch `qa-audit-operations` (53 findings + 3 amendments = 56 total, doc at `docs/qa-audit-operations-2026-06-09.md`; **branch unmerged** by design). Fix bundles 1 (a11y highs QA-015–018), 2 (copy + structure QA-001/002/024/054 + lows 025–029), 3 (`801123a` — decision-free fixes QA-003/007/008/020/022/031/037–039/042/043/052, incl. deletion of the dead `UserList` stub), and 4 (`20354cc` — code quality QA-032/033/034/044/046/048/050/053, the `ExpandableRow` extraction, two QA-048 resolvers, three new tokens, and the Mission→Progression internal renames) banked. **Route-pages arc complete** (5 slices, 2026-06): slice 1 deleted the `health` tab + route stub, added Organizations to the nav, wired composition tiles as drills; slices 2–5 shipped live directory pages at `/operations/{individuals,institutions,advisors,organizations}` (77 / 4 / 7 / 17 records, all fixture-faithful with live-derived count headers). **Detail-routes arc complete** (6 slices + Candid interleave, 2026-06): per-record detail routes at `/operations/{dir}/:id` for all four entities — slice 1 (`2d1cf1c` — Institution detail, routing skeleton), 2 (`d327080` — AdvisorPractice detail), 3 (`abe5141` — Organization detail), 4 (`760af13` — Individual detail, type-aware: full view for `type='individual'`, light view for staff/advisor), Candid interleave (`3b7da48` — Organization detail restructured to the GuideStar/Candid profile flow: `foundedYear` literals added to `orgsData.js`, cause label "Economic" → "Economic Mobility" in `intakeData.js`, Person.causes normalized to a string-ID array in `adapters/individual.js`), 5 (`dacde68` — URL-filter state on all four directories: `q` debounced / `source` / `cat` / `causes` / `ids`-override, URL as source of truth, `replace` writes), and 6 (`743de6a` — drill wiring: rows clickable with filter persistence via `location.state.fromQuery`, shared `<AboutLine>` on Issue/Activity expand panels, pre-plan-clients drill behind a build-time derivation gate, ALL FOUR pilot tiles documented-unlinked by founder ruling with per-tile unlock conditions in code) banked. Chrome pattern across detail pages: `<BackLink>` with explicit `to` + `location.state.fromQuery` preservation, shared `<NotFoundCard>` for invalid IDs, dotted-bronze cross-links. **Fix bundle 5** (`e1e3600`) — founder visual cluster: QA-004 (Operations persona wired to `CURRENT_OPS_USER` in new `data/opsFixtures.js`); QA-014 reading A (activity-row chip drops border + adds `cursor:default`, surface accent moves from border to chip text color); QA-021 (muted text inside the Open issues tint card swapped to `--sh-text-secondary` — both the IssueRow meta line and the "Per-issue detail view coming soon." footnote — contrast moves from ~3.46:1 to ~8:1 against `--sh-bg-tint`); QA-030 ruling b1 (`SURFACE_COLORS.Operations` swapped from `--sh-bronze` to `--sh-text-secondary` — Operations now reads quiet internal, distinct from Advisor's bronze). Wontfix per founder ruling: QA-011 (no new funnel footnote, consistent with the pilot-tile decision), QA-013 (SuiteRow copy-to-clipboard defer until attention-state fires), QA-040 (asymmetric `<main>` padding by design), QA-045 (date-helper overlap acceptable per audit), QA-051 (no React.memo at current scale), QA-035 (bronze progression bars on tint track — editorial restraint, 3:1 non-text contrast met), QA-036 (expand-panel prominence asymmetry — intentional: Open issues is the higher-priority attention signal). **Audit posture: 55 of 56 findings resolved**; remaining 1 — QA-023 blocked on a future CR-level filtered view. **Operations roster arc OPENED (Ruling 1.1 confirmed, scoping at `docs/operations-roster-scoping.md`).** **O-1 authenticated routing SHIPPED** (`slice-ops-routing`): `AppDispatcher` `type==='ops'` branch → `/app/operations`; `/app/operations` route mounts the FULL Operations surface behind `RequireType type="ops"` (Q5 — read gated by type alone; ops accounts are FT-exclusive); Chrome identity swap (real `displayName` on the auth tree, `CURRENT_OPS_USER` fixture only on demo; `userRole` null on auth until an ops `/api/me` block exists). **Routing only** — mirrors the advisor `ce6d8be` precedent. **Interim state (deliberate, enterprise-4a precedent):** the authenticated ops user sees FIXTURE data everywhere (Overview + directories) until O-2/O-3 land — §7 requires the ROSTER view to be honest when it lands, not this slice to isolate everything. **O-1 path-fix SHIPPED** (`slice-ops-pathfix`): the §6.11 audit's 45 hardcoded `/operations/` nav sites across 9 files rewired through a shared `useBasePath('/operations','/app/operations')` (13 hook calls, one per navigating component; module-level `DIR_PATH` constants → in-component `dirPath` derived from basePath; `NAV_ITEMS` → `getNavItems(basePath)`; fallback `Navigate` → `to={basePath}`). Demo tree byte-identical (basePath resolves to `/operations` off `/app/operations`); on the auth tree nav/drill links now resolve to `/app/operations/…`. Zero hardcoded nav literals remain (grep-verified); build clean; both mounts serve 200. **O-2 roster READ (demonstrative mode) SHIPPED** (`slice-ops-roster-demo`): new `OperationsRoster.jsx` view + `Roster` nav item + `roster` route (all four types per Q2, distinct from the per-type directories); **two modes per Ruling 1.1** — demo tree renders the `DEMO_ROSTER` fixture (five local seed identities, Q7; cleaned demonstrative set with `example.org` emails + a claimed/invited mix) under a §7 demonstrative caveat, authenticated tree renders an HONEST interim state ("The live roster is not yet connected…"), NEVER the fixture (the one view Ruling 1.1 requires honest from birth; switched on `useOptionalAppIdentity`). DataTable idiom (6 cols: type · name · invite email · status · source · added) in an `overflow-x:auto` wrapper (mobile scroll — a forward-improvement over the directories); rows NON-interactive with a "detail arrives with the live roster" footnote (aggregate-default guardrail, no dead click); "Create invite" CTA home reserved in the header flex (no placeholder). Both branches + fixture verified present in the built bundle. **O-3 live-gated roster READ SHIPPED** (`slice-ops-roster-live`): new `requireOps(db, context)` in `functions/_lib/gate.js` (session → person → `type==='ops'`, TYPE-ONLY, no `demo_gate` per Q5; write-twin `$.ops.demo_gate` deferred) + new `functions/api/roster.js` (`onRequestGet` only, gifts.js pattern) SELECTing `id/display_name/type/source_surface/invite_email/(auth_user_id IS NULL) AS pending` from `person` WHERE `soft_deleted_at IS NULL AND (invite_email IS NULL OR NOT LIKE '%.invalid')` ORDER BY `type, display_name COLLATE NOCASE` (no pagination, revisit ~200; `.invalid` seeds excluded per §7 LIVE-honesty); `OperationsRoster.jsx` auth branch swapped from the interim card to a live `fetch('/api/roster')` `LiveRoster` (loading/error-no-retry/empty/rows into the shared `RosterTable`); "Added" column dropped from both branches (`person` has no `created_at` — arrives with the invite-form slice). Smoke: unauth→401, non-ops→403, ops→200 rows matching local D1 after filters. **Naming ruled 2026-07-13** (`slice-ops-naming`, display-layer only): on the Operations surface, type label `ops`→**Admin** (roster Type cell via `TYPE_LABELS`), view **Roster→Accounts** (nav + h1 + aria-label + captions), surface name **Operations→Admin** at display sites (Landing card, Chrome header, activity-chip via `SURFACE_DISPLAY_LABELS` — color lookup still keys on raw `Operations`). Route paths (`/operations`, `/…/roster`, `GET /api/roster`), nav keys, and the DB `type` enum stay LEGACY by design (docblocked at each site). Enterprise "Roster" (athletes) untouched. **Invite-creation form SHIPPED** (`slice-ops-invite-form`): migration **0014** (`person.created_at` nullable TEXT/ISO — LOCAL-applied, `--remote` a post-bank step per §6.10; 5 pre-0014 rows NULL → "—"); new `requireGatedOps` write-twin in `functions/_lib/gate.js` (`type==='ops'` AND `$.ops.demo_gate===1`, beside the type-only READ `requireOps`, per Q5); `POST /api/invites` (`onRequestPost` only — `requireGatedOps` → `{email,type,displayName}`, email normalized VERBATIM-identical to the auth-gate seam + claim key, `source_surface` derived server-side, INSERT the `seed-invites.mjs` 10-column shape + `created_at`, UNIQUE→409, re-SELECT→201 roster-element+`createdAt`); `GET /api/roster` emits `createdAt`; `OperationsRoster.jsx` auth-tree-only "Create invite" CTA + `CreateInviteModal` (four-type select, `ops→"Admin"` label but `'ops'` value, gate/409 via `writeError`, splice-sorted on success) + **Added column restored to both branches** (live `createdAt`, NULL→"—"; demo synthetic dates under the §7 caveat). Smoke: unauth→401, ops-without-gate→403, gated ops→201, duplicate→409, demo Added from fixture. **Invite-email SHIPPED** (`slice-invite-email`, FT ruling 2026-07-15): creating an invite now sends the invitee a NOTIFICATION email (not a magic link) via `functions/_lib/inviteEmail.js` → `createSender` → Resend, pointing to `steward-house.org/signin`; **create-succeeds-with-warning** — the send runs in its own try/catch after the INSERT (non-transactional; the row stands either way), success stamps `$.invite.sentAt`/`$.invite.messageId` on `extensions` (json_set, no migration) + `emailSent:true`, failure leaves no stamp + `emailSent:false` (201 both), surfaced in `CreateInviteModal` as a quiet warning-on-success; CLI `seed-invites.mjs` stays silent by ruling; §9 test-sender caveat corrected (verified `signin@steward-house.org` sender is live). **LIVE ON PRODUCTION** (corrected P-0, verified against remote D1 2026-07-16): both former activation steps are DONE — `wrangler d1 migrations list --remote` reports "No migrations to apply!" (all 15 applied, incl. 0014), and `$.ops.demo_gate=1` on one remote ops row. The prior "**Dark on production** until (a) … (b) … **NEXT:** those two activation steps" text was STALE and is retired. Operations is the ONLY surface whose writes are live in production: `GET /api/roster` (`requireOps`, type-only) and `POST /api/invites` (`requireGatedOps`) both function end-to-end for FT today. **Known defects (P-6 filed; citations re-verified against the tree 2026-08-17, and three of them had gone stale):** **CLOSED `5fa42c9`: the `CreateInviteModal` copy contradiction is FIXED.** The caution at `CreateInviteModal.jsx:106-111` now says the invite sends a notification email and that delivery is reported once the invite is created, so it agrees with the send at `invites.js:187` and with the component's own success notice at `:68-70` (a citation corrected from `:63-65`, which is now the tail of the submit payload). The copy this filing quoted is GONE from the tree and is deliberately not restated here; a repo-wide grep finds no string claiming no email is sent, and the citation `:101-105` no longer points at one. **CLOSED `20c0a22`: the `seed-invites.mjs` `created_at` gap is FIXED.** The CLI writes the column now (`:127` stamps `nowIso`, `:134` carries it in the INSERT), so CLI-seeded rows no longer render "—" in the Added column. The filing's citation `seed-invites.mjs:124` no longer says what it was quoted as saying: that line is now part of the comment explaining the fix. **PARTLY CLOSED: revoke shipped, resend and edit did not.** `1c9d69d` added `DELETE /api/invites/:id` and `cd2f41b` the Accounts-view affordance, so "No resend / edit / revoke path" is stale in its revoke third. There is still no resend and no edit, and **a failed send remains UNRECOVERABLE from the UI, because withdraw-and-recreate is not a resend**: it mints a new row rather than retrying delivery on the existing one (`invites.js:143-145` documents the no-retry posture; the catch at `:162-164` swallows the failure). The filing's citation `invites.js:9-10` no longer points at the quoted text either; those lines now describe the sibling DELETE route. **CLOSED `f26c77a`:** the four directories and four detail routes now carry a §2.4-compliant demonstrative caveat, tree-invariant and verified by render on all eight, and the three "Every X on the platform" completeness claims are gone; the Overview caveat (`OperationsSurface.jsx:301-312`) was always honest and is untouched. Organizations still shows no source chip by design (`OrganizationsDirectory.jsx:19-23`, a citation corrected from `:22-26`), which is a provenance affordance rather than a caveat and is no longer a gap now that the caveat is present. **CLOSED `1632fbf` (P-6 slice 1): `/api/me` emits an `ops` block.** One derived boolean, `ops.writesEnabled` (`me.js:544-561`, spread at `:574`), true iff `json_extract(extensions,'$.ops.demo_gate') === 1`, ABSENT rather than null for the other three types. The `me.js` non-passthrough docblocks (`:146-153`, `:366-368`) do NOT forbid it: FT ruled 2026-08-17 that a derived boolean describing only the requesting account's own gate state is not a `$.<surface>.*` passthrough (§5.1). **`userRole` STAYS null by ruling** (`OperationsSurface.jsx:235`, a citation corrected from `:219`) because ops has no relational source for a role title; the reasoning is docblocked at `:211-230`. **CLOSED `537cc08`: the ops-minting gap is FIXED.** `POST /api/invites` refuses `type='ops'` with a 403 before the shape test (`invites.js:114-116`); `ALLOWED_TYPES` is individual/staff/advisor (`:62`) and `SOURCE_SURFACE_FOR_TYPE` carries no `ops` entry (`:69-73`); and the modal's `TYPE_OPTIONS` offers three options (`CreateInviteModal.jsx:24-28`), so the filing's citation `:22` no longer points at a four-type select. Smoked 16 of 16. `gate.js:135-140` now records the FT-exclusivity precondition `requireOps` rests on as ENFORCED rather than assumed. **P-6's REMAINING scope after `1632fbf`: SLICE 2 ONLY.** The shared `'Not authorized'` string now returns from THREE conditions, not seven: slice 1 gave the four TYPE rejections distinct messages, leaving only the GATE rejections on the shared literal (`functions/_lib/gate.js:108`, `:142`, `:212`) plus the `!gateRow` anomaly folded into each. Those stay bound by the unsplit ruling in §5.1 and are BLOCKED on advisor and enterprise gate emissions, which do not exist. `gate.js:158-164` records the FT-exclusivity precondition as ENFORCED (a citation corrected from `:135-140`, shifted by slice 1's docblock). |
| **Enterprise** | **Built and audited; depth arc COMPLETE.** All 5 sections live (Overview, Roster, Program, Compliance, Reports + 5 sub-pages; the Setup wizard was REMOVED in P-5). 157-finding QA audit (9 Critical + 33 High + 60 Medium + 55 Low) on unmerged `qa-audit-enterprise` branch (`docs/qa-audit-enterprise-2026-05-30.md`). Audit posture: **156 of 157 dispositioned** — 9 Critical + 32 High shipped; all Mediums/Lows resolved across Sweeps 1–4 + Clusters I–IX + the 4-pattern not-a-finding taxonomy. **Only open item: #12** (Tag `warning` palette — deferred High, paused-Individual-gated; closes when Individual unpauses). Fixture dates uniformly shifted −192d (`7998c7d`). Enterprise does NOT use Advisor's numbered-bundle model. **Authenticated build LIVE**: `/app/enterprise` routing + staff-type dispatch (4a/4b), `/api/me` staff block + endowment (5a/6b), Chrome identity swap + staff test identity 0011 (5b), full fixture isolation on the auth tree (6a/6b — computeStats/AthletesProvider + empty states + CohortComparison gate). **Write arc OPEN**: E-Write-1 roster-add shipped — `requireGatedEnterprise` (E11 twin), `POST /api/athletes` (institution-scoped, E6 consent-required + `consent_acknowledged_at` migration 0012, E8 notes caution, E10 badge), `/api/me` roster emission + `AthletesProvider.add()` write-through, Roster CTA + `AddAthleteModal` (+ FT-screen fix `f8a235b`: gate error surfaced in-form via `writeError`, Position field dropped). **E-Write-2 anonymize-to-stub shipped** — `DELETE /api/athletes/:id` (E3 override): explicit delete of the 4 athlete-child tables + stub UPDATE (`name='redacted'`, class+sport retained, all else NULL/0/`Sunset`, `person_id` + `consent_acknowledged_at` NULL) as ONE `env.DB.batch()` implicit transaction; `/api/me` roster excludes `Sunset` stubs (E9-snapshot residue only); `AthletesProvider.remove()` + `AthleteProfile` "Remove from roster" → nested confirm modal; idempotent re-DELETE, id+institution scope with identical 404. Gate stays DARK on production (local-smoke-only; Faouzi `04…0002` the designated test identity) until E3/E6/E8 counsel clears. **E-Write-3a workshop-create shipped** — `POST /api/workshops` (create-only; institution-scoped from session, `facilitator_person_id` NULL per Q2 E4-deferred, `status` staff-set from enum with server default `scheduled`, `title`+`date` required, `date` validated YYYY-MM-DD for the NOT-NULL column + calendar parse); shared `WORKSHOP_ELEMENT_COLUMNS`/`toWorkshopElement` (element always carries `attendance:[]` + `followUps:[]` so `WorkshopDetail` never reads undefined; `facilitator:null` in 3a); `/api/me` staff block emits `enterprise.workshops` ORDER BY date with nested `attendance[]` (Q7 documented debt: revisit to per-workshop fetch when a real institution's payload is measurable); new `WorkshopsContext` (fold-in + `add()` write-through, date-sorted splice) mounted beside `AthletesProvider`; `EnterpriseProgram` rewired off the fixture import to `useWorkshops()` (demo tree byte-identical via the provider's fixture default) + "Schedule workshop" affordance → `ScheduleWorkshopModal` (AddAthleteModal idiom, no consent line — workshops are institution records). No workshop delete/edit (Q6); `workshop_followup` out of scope (Q5); zero E9/snapshot obligations. **E-Write-3b workshop-attendance upsert shipped** — `PUT /api/workshops/:id/attendance` (first two-level nested route `workshops/[id]/attendance.js`; first `ON CONFLICT DO UPDATE` upsert in the repo, composite PK `(workshop_id, athlete_id)`): full-roster batch `{ records:[{athleteId, attended, note?}] }` (Q3, one record per active athlete, attended default false), dual-transitive scope (workshop institution-scoped 404 + single IN query validating every athleteId is on the institution roster AND `enrollment_status != 'Sunset'` per Q4, **reject-whole-batch** — one atomic multi-row statement, no partial write), Q5 no note caution, Q6 returns full updated element; `WorkshopsProvider.updateAttendance` wholesale-replace write-through; `WorkshopDetail` read-render re-keyed on `attendance.length` (Q2, no implicit status flip — demo-parity-safe via fixture `completed⟺rows` equivalence) + auth-only edit mode (per-athlete toggle+note, empty-roster guard, `writeError` in-form). **E-Write-4 compliance writes shipped** — `POST /api/exclusions` (create; institution-scoped, `flagged_at` server-set; `connection_detail` free text with NO server validation per E8/Q4, field-adjacent caution copy in `AddExclusionModal`) + `DELETE /api/exclusions/:id` (Q1 hard-delete, no edit); **Q2 auto-log** — each exclusion add/remove writes its `compliance_audit` row inside the SAME `env.DB.batch()` (atomic; action + target frozen, `user_role` denormalized from `institution_contact.role_title` at write time via shared `functions/_lib/audit.js`); `POST /api/compliance-audit` for MANUAL entries (Q3 append-only — exports ONLY `onRequestPost`, CF auto-405s PUT/DELETE, E7 docblock; no edit/delete/updated_at); `/api/me` emits `enterprise.exclusions` + `enterprise.complianceAudit` (staff-only — `connection_detail` never-emit elsewhere per E8; audit newest-first, author display resolved via person leftJoin, `user_role` NOT re-derived); new `ComplianceProvider` (one context, both arrays, add/remove/addAudit write-through splicing the auto-logged audit row without refetch); `EnterpriseCompliance` rewired off withheld-fixtures to the provider (demo tree byte-identical incl. its session-edit overlay) + auth-only "Add exclusion" / "Record entry" affordances and `ExclusionDetail` remove-confirm (E-Write-2 idiom). **E-Write-5 cohort snapshot shipped** — migration **0013** (`dollars_moved` + `avg_weekly_engagement` → NULLABLE via the SQLite table-rebuild; local-applied, **remote rides the bank**); `POST /api/snapshots` (Q5 — derives the six sourced aggregates server-side from live D1 at snapshot time: athletes_count non-Sunset, gps/cert counts+rates, attendance_rate through workshop join, gifts_count = SUM(athlete.gifts_count) soft counter; the two unsourced write **NULL** = "not tracked", never 0/staff-entered; the `gifts_count = SUM(…)` clause above is **STALE and retired by P-2 FORK 3** (`5af1340`): `snapshots.js:122,164` no longer sums it, it writes **NULL**, so the unsourced-NULL columns are **three** as of migration 0017 (`dollars_moved`, `avg_weekly_engagement`, `gifts_count`), not the two that were true at E-Write-5 time; zero-athlete guard → rate 0 on NOT-NULL rate columns; integer-percent representation matches the fixture) + `DELETE /api/snapshots/:id` (Q7 delete-and-re-snapshot); `/api/me` emits `enterprise.snapshots` (newest-first); `SnapshotsProvider` fold-in (fixture default `[current, prior]`); **`CohortComparison` rewired off fixtures onto `useSnapshots()` + `useAthletes()`** (Q8 — 0 → gate panel, 1 → single-cohort view, ≥2 → year-over-year of the two most recent; NULL → "Not tracked"; demo byte-identical) + auth-only "Record period snapshot" / per-snapshot delete-confirm. **E3 survival proven in smoke: anonymizing an athlete leaves already-taken snapshots byte-identical** (frozen aggregates, the arc's capstone invariant). **ENTERPRISE WRITE ARC COMPLETE** — roster-add · anonymize · workshop-create · attendance · compliance (exclusions+audit) · cohort-snapshot, all gated dark on production pending E3/E6/E8 counsel. **A SEVENTH endpoint was added later by P-2** — progression (`PUT /api/athletes/:id`, `6f1b501`); the six-endpoint list above is the arc as it closed, not the current endpoint count. **Consent-enforcement arc OPEN** (E6 ruling, athlete-owns-and-data-leaves-with-them): **C-1 shipped** (`ee12991`) — migration **0015** (`athlete.management_mode`, deny-by-default) + `POST /api/athletes` name+email lockdown (extra keys → 400) + attendance claim-state gate (`management_mode='delegated'` EXACTLY, whole-batch 403) + anonymize nulls `management_mode` + `AddAthleteModal` trimmed to Name+Email. **C-2 shipped** (`afea99d`) — roster-add auto-invite: `POST /api/athletes` requires email (normalized `trim().toLowerCase()`, stored on `athlete.email` + minted `person.invite_email`), mints a claimable `person` (invites.js 10-col shape) + sends the notification email after the athlete row commits; athlete NEVER rolled back, always 2xx, outcome rides `invite ∈ 'sent'|'skipped'(UNIQUE)|'failed'`; `athlete.person_id` stays NULL (bind deferred to C-3). **C-3a shipped** (`e041a49`) — claim-hook athlete bind in `functions/_lib/auth.js` (shared `bindAthleteRows`: `UPDATE athlete SET person_id WHERE email = user.email lowercased AND person_id IS NULL`, ALL linked rows, best-effort in the hook try/catch, both `claimed===1` re-SELECT + fresh-person paths) + bind-at-enroll in `athletes.js` UNIQUE-skip branch (A1: existing person already claimed → bind the just-created row; `management_mode` stays NULL, invite stays `'skipped'`) + new `POST /api/athlete-consent` (`getPersonForSession`, `mode ∈ 'self'|'delegated'` else 400, UPDATE all rows WHERE `person_id`=session person, 0 rows → 403, athlete-only + changeable + deny-by-default) + `/api/me` emissions (individual `person.athlete {managementMode uniform-or-null, institutionName}` conditional-spread; `managementMode` on staff roster via shared `ATHLETE_ELEMENT_COLUMNS/toAthleteElement`). No migration (`management_mode` exists), no UI. **C-3b shipped** (`b51ea14`) — the consent UI: one-time account-ownership interstitial ("Your account, your choice", self/delegated → `POST /api/athlete-consent`, "Decide later" never writes) gating IndividualSurface for a linked athlete with `managementMode===null` (condition-gated, before onboarding + dashboard; ordinary individuals + demo tree never reach it; AppShell `athlete` emit + `updateAthleteConsent` write-through) + roster **Access column** (four states Unclaimed/Pending choice/Self-managed/Delegated via shared `accessLabel`, AUTHENTICATED-ONLY — demo tree byte-identical, FT-ratified — + the quiet AthleteProfile line) + server `claimed:!!row.person_id` boolean emit (raw `person_id` never shipped). **CONSENT-ENFORCEMENT ARC COMPLETE** (C-1 `ee12991` · C-2 `afea99d` · C-3a `e041a49` · C-3b `b51ea14`) — the **FT milestone screen PASSED 2026-07-16**, all eight steps clean on FT's own account (roster-add → invite email → claim → choice card → delegated → staff attendance write). With the arc banked + deployed, the runbook §3(e) `$.enterprise.demo_gate` designation precondition is now **SATISFIABLE**; the designation itself remains FT's deliberate per-institution step, never run for test rows. **P-2 PROGRESSION WRITES SHIPPED** (`d9ee100` · `6f1b501` · `90de25e` · `5af1340`, 2026-07-20) — the frozen-columns finding at §5.1 is closed. Stage A: migrations **0016** (`athlete.enrollment_status` CHECK, TitleCase enum `'Invited','Active','Stalled','Sunset','Certified'` — FORK 2, applied via table-rebuild with four inbound child FKs, `PRAGMA foreign_keys=OFF` outside a transaction, child survival proven on a scratch copy) + **0017** (`cohort_period_snapshot.gifts_count` → NULLABLE, FORK 3). **Both applied local AND `--remote`; parity-verified read-only 2026-07-20** — `wrangler d1 migrations list --remote` reports "No migrations to apply!", the CHECK is present in remote `sqlite_master` (`CREATE TABLE "athlete"`, the table-rebuild signature), and remote `PRAGMA table_info(cohort_period_snapshot)` shows `gifts_count notnull=0`; §6.10 satisfied with no carried deferral. Stage B: `PUT /api/athletes/:id` (`functions/api/athletes/[id].js:185`) records milestones (lessons 0..9 / gpsCompleted / certified) behind the FULL staff-write gate (`requireGatedEnterprise` + institution scope + non-Sunset + `management_mode='delegated'` EXACTLY + `person_id IS NOT NULL`); `certified`+`cert_at` authoritative, `enrollment_status` the act-derived mirror (R2: Invited→Active only on a positive milestone, never backward, never Stalled/Sunset); gifts excluded per FORK 3; attendance.js D7 rejects delegated-but-`person_id`-NULL orphans. Stage C: `enterpriseStats.computeStats` D2 (`onTrack` a direct set count, fixing a mis-counted certified-without-GPS athlete) + **FORK 1** — progression rates divide by institution-writable athletes ONLY (`claimed && managementMode==='delegated'`, the same predicate as the PUT gate), `consentAware`-gated to the auth tree so the demo fixture stays byte-identical, `rateBaseTotal===0` → rates null → "Not tracked", never 0%; drops the `?? 'active'` status laundering in `athletes.js` (safe because 0016 CHECK-constrains the column). Stage D+E: AthleteProfile milestone editor (auth-only), shared `RateDisclosure` naming both populations, and **FORK 3 widened** — `gifts_count` is written by NO path, so every live gift-counter site now reads "Not tracked" / "—" rather than a structural 0 (EnterpriseOverview, ProgramSummary, ProgramOutputs, EnterpriseRoster, CohortComparison, AthleteProfile); render-layer only, `enterpriseStats.js` untouched, demo tree byte-identical at every site. **Gift tracking itself remains unbuilt — an accepted Phase-1 boundary, not a defect (see §5.1).** **NEXT** (post-arc queue): enterprise routing follow-ups / invite runbook (per the standing list); production activation waits on the consent-enforcement arc (C-3) banked + deployed and FT's deliberate `$.enterprise.demo_gate` designation per runbook §3(e) — the operating premise (2026-07-15) is internal review, no external counsel. Scoping: `docs/enterprise-persistence-scoping.md` + `docs/enterprise-persistence-schema-draft.md`. **Full arc history** (every Critical/High commit, Sweeps 1–4, Cluster I–IX detail, the not-a-finding taxonomy): `docs/arc-history-enterprise.md`. |
| **Advisor** | **Built and audited; QA arc COMPLETE** (audit + 12 fix bundles + tail triage). 8-section IA; all 9 clients seeded. 41-finding audit on unmerged `qa-audit-advisor` branch (`docs/qa-audit-advisor-2026-06-13.md`); 33 of 42 dispositioned. **Advisor persistence arc CLOSED** (`9736096` — FT acceptance walk, real email flow both environments, prod open-signup finding, 2026-07-07): routing ✓, path-fix ✓ (§6.11, 48 sites / 13 files), scoping ✓ (12 rulings), schema ✓ (migration 0007), slim seed ✓ (0008), authenticated reads ✓ (slice 1 `7ca21e9`), fixture isolation ✓ (slice 2 `8c3e4f7`), `RequireType` type-guard ✓ (`e8683f3`). **Single-type identity RULED PERMANENT** (FT 2026-07-02). **WRITE ENDPOINTS SHIPPED — the prior "REMAINING: write endpoints + provider write-through" text was STALE and is retired** (corrected P-0, 2026-07-16). **THIRTEEN advisor write endpoints shipped 2026-07-02 → 2026-07-07** and are wired to UI through FOUR contexts: `POST /api/clients` + `PUT /api/clients/:id` (`ClientsContext.jsx:72,94`), `POST /api/client-sessions` (`:127`), `POST /api/client-notes` (`:157`), `POST /api/cohorts` + `PUT /api/cohorts/:id` (`CohortsContext.jsx:41,63`), `POST`/`DELETE /api/cohort-members` (`:89,119`), `POST /api/docs` (`DocumentationContext.jsx:101`), `POST /api/doc-categories` (`:161`), `POST /api/practice-content` + `PUT /api/practice-content/:id` (`PracticeContentContext.jsx:56,80`), `PUT /api/practice-profile` (direct fetch, `PracticeSettings.jsx:93`). Reads and writes are gated DIFFERENTLY and deliberately: **reads are UNGATED** (`me.js:133` keys on `person.type==='advisor'` alone — an ungated advisor sees their own empty practice), **writes are ALL behind `requireGatedAdvisor`** (`gate.js:64-88`: type `advisor` AND `json_extract(extensions,'$.advisor.demo_gate')===1`, strict integer 1; verified all 13 endpoints, no ungated advisor write exists). **NO production advisor row carries `$.advisor.demo_gate` at all** (verified against remote D1 2026-08-17; the value is NULL, never set, corrected from the `0` recorded until then, and the behaviour is identical because `gate.js:84` tests `!== 1`) — so every advisor write returns 403 in production today. Designation is FT's deliberate step, NOT a slice (see §5.1). **Known defects (P-4 filed):** lesson-authoring is BROKEN on the auth tree — `LessonEditor.jsx:94` calls `add({id:'pl-001',…})` WITHOUT `await` and then `afterSave(newId)` navigates to the client-minted id, but `practice-content.js:136` does `crypto.randomUUID()` and ignores it; `PracticeContentContext.jsx:64` correctly RETURNS the server id and the caller discards it, so `LessonDetail.jsx:37-41` can't resolve the lesson and `<Navigate replace/>` bounces the advisor to the library (same defect in `author` mode, `:119-133`). `writeError` is never surfaced in `LessonEditor.jsx:36` / `LessonDetail.jsx:21`, so with the gate at 0 every curriculum write fails SILENTLY. `LessonDetail.jsx:76-80` navigates away on "Discard" though `PracticeContentContext.jsx:96-104` returns false (no DELETE endpoint exists). `docs/[id].js` PUT has NO caller — docs are write-once. `Pipeline.jsx:36-38` renders Morgan's fixture counts to any advisor with ≥1 client and `handleSave` persists nothing (no `/api/pipeline` exists). `PracticeSettings.jsx:222` "Rename" has no `onClick`; `:230-232` renders literal "45 minutes"/"America/New_York" as if they were the advisor's settings. **RESOLVED — production signup invite-gated** (slice `slice-invite-gate`, this session): pre-send allowlist (b2) in `functions/api/auth/[[route]].js` intercepts `POST /api/auth/sign-in/magic-link` before better-auth engages — unknown email (no `auth_user` AND no matching `person.invite_email`) → 403 `{code:'new_user_signup_disabled'}`, NO link sent / verification row / `auth_user` created; existing account OR invited (pre-seeded `invite_email`) → passes through unchanged. `person.invite_email` is the single source of truth (same key the claim hook reads). `SignIn.jsx` renders the existing "Sign-up is not currently open for this address." copy on the 403. `seed-invites.mjs` now accepts `type='individual'` (CLI is the interim invite path per Ruling 1.1). **CORRECTED 2026-08-18: the fresh-person branch is CLOSED, not open.** This row said it was "left OPEN by design (reachable only via allowlisted sends)", which was true when written and was closed by `1c64296` (2026-08-16) without this row being updated. The `user.create.before` hook at `functions/_lib/auth.js:303-321` refuses `createUser` unless a `person` row exists with `invite_email` matching the address AND `auth_user_id IS NULL`: no email means `return false` (`:306`), no claimable row means `return false` (`:320`). **The practical consequence, which is sharper than it sounds: a `person` row carrying a NULL `invite_email` is UNCLAIMABLE BY ANY PATH.** No magic link, no allowlisted send, no manual step short of writing an `invite_email` first. Found while rendering the authenticated Individual tree for the feedback slice, where Marcus (`invite_email` NULL) could not be signed in as at all until a local seed write. No migration — gate activates on the auto-deploy after bank. Local smoke green (unknown→403 no-rows / seeded staff+individual→pass / existing bound→pass / demo routes 200); baseline restored. Deferred: ADV-044 radiogroup micro-slice; Stage Rename sibling slice. **Full arc history**: `docs/arc-history-advisor.md`. |
| **Individual** | **The reference surface — rework underway + persistence build LIVE.** 15 surface files. Tier 1 ✓; Tier 3 contained-structural ✓ (3 paused folds #12 / #63 / #116 closed; CohortView unified-data rewire done — first Individual file reading `src/data/unified/`). Persistence schema RULED A–F; ruling E (deletion / retention) RESOLVED (`4b9d1b5`); **FT AUTHORIZED build**. **Live on remote D1** (`stewardhouse-pilot`, id `8600684c-...`): migrations 0001–0006 applied `--remote`; auth arc (`better-auth` magic-link, email-only, Resend sender) **PROVEN LIVE ON PRODUCTION** end-to-end. **Individual-wiring arc COMPLETE**: `/app` type-dispatcher + `functions/api/me.js` + AppShell / `AppIdentityContext`; `/app/individual` authenticated surface with per-user data isolation (two-instance IntakeProvider), real identity display, gated onboarding, `useBasePath` path isolation (drove the §6.11 full-directory rule). **Persistence writes live**: `POST/GET /api/gifts` (`8bcc00c`; 5-option taxonomy + migration 0006 `192d640`), `/api/intake` (`json_set`), `POST/GET/DELETE /api/scenarios` (snapshot-not-history; `4e17a95` / `4cdf278`). Sign-out live across authenticated surfaces (`c020556`). Marcus un-reconciled to a standalone person row; FT row is a genuine clean slate. **NEXT**: see the **Pilot Honesty Arc (§5.1)** — **P-3c IS CLOSED, and it was never unstarted** — the control shipped across `c360540` (Step 1), `14003a0` (the RecordKeeping card), `25c587e`, `4df7f75` and `4d37595`, and `RecordKeeping.jsx:6-13` names itself the consent-reversibility control. R1, R2 and R4 are met by the shipped card; R3 is RULED OUT ON EVIDENCE rather than deferred; R5 is unblocked and sits OUTSIDE P-3c (§5.1). **No Individual item remains.** The prior "**P-3** carries the Individual-surface work (`CohortView.jsx:42` Marcus identity bug, `Team.jsx`, `Learn.jsx` advisor block, + the consent-reversibility control)" text was accurate when written and is now **SUPERSEDED**: all three fixture-isolation items SHIPPED 2026-07-20 — `a8d51a9` (CohortView + Home callout, verified live under a real login), `fa836ad` (`useFixtureIsolated()` extraction + Learn advisor block), `bce9044` (Team — every panel gated, authored absent state, nav item hidden). **INDIVIDUAL FIXTURE ISOLATION IS COMPLETE**: a signed-in individual no longer sees another person's cohort, another person's assignments, or another person's grant portfolio and delegates presented as their own. The prior "NEXT: Operations roster UI (demo + live-gated per Ruling 1.1) → invite-creation form on top" text was STALE and is retired (corrected P-0, 2026-07-16): both shipped — O-2 (`a1d13b2`) / O-3 (`2fe0aad`) and `slice-ops-invite-form` (`e3804bd`). **Counsel-gated seams (isolated, non-blocking)**: Clause 3 charitable-retention-floor; Clause 6 subpoena posture — who-gave-to-whom view stays UNBUILT until posture set. **Parked**: account-settings page — **EXCEPT consent reversibility, which is NO LONGER PARKED**: the UI for the existing `POST /api/athlete-consent` mode flip moved into **P-3** (§5.1), because an irreversible one-time choice contradicts the E6 athlete-owns ruling (`athlete-consent.js:45` supports the change; no client calls it after the C-3b interstitial). The REST of the settings pass stays parked. Also parked: geo-selection weighting; AI-drafted org descriptions; Discover design pass. **Discover org directory: the BMF load is SCOPED, nothing built** (`docs/bmf-load-scoping.md`, 2026-08-18, four items open; the import rulings and the record / surface / build split are in §7). **FILED AND UNSCHEDULED, new 2026-08-18: the pilot has NO in-product feedback channel.** `fbc1a9a` removed the Individual feedback route rather than persisting it, because the form POSTed to a third-party relay while telling the user the response went directly to the founder, and collected a behavioral block the user never saw. Removal was the honest disposition and it left a real hole: there is now no way for a pilot participant to tell us anything from inside the product. Rebuilding it is a DELIBERATE design problem, not a restore: it needs explicit consent for whatever is collected, a first-party destination rather than a relay, and a success state that reflects whether the write happened. Unscheduled, and deliberately not folded into another arc. **Full arc history**: `docs/arc-history-individual.md`. |
| **Landing** | Single file; public entry. |

---

## 5.1 PILOT HONESTY ARC (FT-ruled 2026-07-16)

**The pilot gate:** full platform functionality across all four surfaces before
any advisor or athletic-department outreach.

**Acceptance criteria per surface: `docs/pilot-gate-criteria.md`** (ruled
2026-08-14). That sentence alone carries no criteria, which is why no completion
figure was defensible. The doc carries the five rulings, the counting method,
per-surface status, and BOTH figures: capability, which is what the gate tracks,
and production-usable, reported alongside and never merged into it.

**Gap-review verdict (read-only review, 2026-07-16, HEAD `7eb7ee0`).** The
platform is not one arc from the gate. The write arcs are genuinely built and
the gates are disciplined; the *data-isolation seam that makes those writes
honest* was applied to some files and not others. **Three of the four surfaces
assert falsehoods to a real signed-in user** — they do not merely omit truth.
Absence is acceptable; fabrication is not. The arc below closes that gap.

**Headline findings:**

- **The expired guard (Enterprise Reports).** `ProgramSummary` /
  `ProgramOutputs` / `PhilanthropicReadiness` guard only on
  `athletes.length === 0`, using roster-emptiness as a proxy for "demo tree".
  Their own comments say the derivations stay demo-scoped "until the enterprise
  athlete write path lands" — **it landed** (E-Write-1, `athletes.js:129`). The
  proxy was valid only while the auth tree could never HAVE athletes. Module-level
  fixture math (computed at import, before the in-component `useAthletes()`
  shadow) now renders the moment a real operator adds their first athlete:
  fixture athlete NAMES as stage chips (`PhilanthropicReadiness.jsx:49,112`),
  fixture gift totals and recipient orgs (`ProgramOutputs.jsx:20-68`), the
  fixture 12-week chart and 5 fixture workshops (`ProgramSummary.jsx:53,110`).
  A §7 "names verbatim from records" violation. **P-1.**
  **RESOLVED `c2c73c9`** (2026-07-16) — the finding above is preserved as the
  record of why P-1 exists; it no longer describes the tree. The eyebrow is a
  single shared source (`useInstitutionEyebrow.js`, 10 consumer files), and the
  three Reports pages derive from providers rather than module-level fixture
  math.
- **Frozen journey-status columns.** `athleteStatus.js:4-10` derives status from
  `certified` / `lessons` / `gpsCompleted`. Those columns are written in exactly
  TWO places: `athletes.js:195-199` (INSERT, all zeros) and
  `athletes/[id].js:86-95` (anonymize, back to zeros). **There is no
  `PUT /api/athletes/:id`** — no update path exists. Every real athlete reads
  "Invited" forever. Downstream, `snapshots.js:7-9` derives GPS rate, cert rate
  and gift count from those same frozen columns, so every real snapshot reports
  0% / 0% / 0 except attendance. Progression tracking is the enterprise value
  proposition and progression cannot be recorded. **P-2.**
  **RESOLVED `d9ee100`·`6f1b501`·`90de25e`·`5af1340`** (2026-07-20) — the
  finding above is preserved as the record of why P-2 exists; it no longer
  describes the tree. `PUT /api/athletes/:id` exists
  (`functions/api/athletes/[id].js:185`), so journey status is writable and
  `athleteStatus.js` derives off live columns. Two clauses of the finding were
  answered by RULING rather than by a write, and the distinction matters:
  GPS + cert rates are now live but divide by **institution-writable athletes
  only** (FORK 1), and `gifts_count` is written **NULL = not tracked**
  (`snapshots.js:164`, FORK 3) rather than a frozen 0 — the falsehood was
  removed, the capability was not built (see the Phase-1 boundary note below).
- **The Marcus identity bug.** `CohortView.jsx:42` —
  ``const currentMemberId = `p-advisor-${individualProfile.id}` `` — hardcodes
  the fixture id `c-001`, ignoring `/api/me` entirely. **Every signed-in
  individual is treated as Marcus Thompson.** Reachable unconditionally from
  Home (`IndividualSurface.jsx:417`). **P-3.**
  **RESOLVED `a8d51a9` · `fa836ad`** (2026-07-20, verified live under a real
  login) — the finding above is preserved as the record of why P-3 exists; it
  no longer describes the tree. The fixture id is never read on the auth tree;
  the view renders an honest absent state, and the Home callout that asserted
  "You're part of a cohort" is gated alongside it, so neither side makes a
  cohort claim to a signed-in user. `fa836ad` then routed both sites through
  the shared `useFixtureIsolated()` helper without changing behaviour.
- **Consent reversibility contradicts E6.** `athlete-consent.js:45` supports
  changing the mode and `:19-20` documents it as changeable, but NO client
  calls it after the one-time C-3b interstitial. A delegated athlete cannot
  revert. The E6 ruling is athlete-owns-and-data-leaves-with-them; an
  irreversible one-time choice is not ownership. **P-3.**

**The arc, as FT ruled it (verbatim):**

- **P-0** — CLAUDE.md reconciliation (this slice; docs only).
- **P-1** — Enterprise Reports isolation (ProgramSummary / ProgramOutputs /
  PhilanthropicReadiness expired guards) + institution-name threading (the 12
  hardcoded "Cooper State University" headers + the $8.5K literal).
- **P-2** — Athlete progression writes: scoping pass FIRST (milestone model +
  who-writes rulings), then `PUT /api/athletes/:id` + milestone UI. Unfreezes
  journey-status and snapshots.
- **P-3** — Individual fixture isolation (`CohortView.jsx:42` Marcus identity
  bug, `Team.jsx`, `Learn.jsx` advisor block) + the consent-reversibility
  control (UI for the existing athlete-consent mode flip — closes the E6
  "change this anytime" gap).
- **P-4** — Advisor lesson-authoring fix (`await add()`, use the server id) +
  `writeError` surfacing in `LessonEditor` / `LessonDetail`.
- **P-5** — Setup wizard: **REMOVE** (FT-ruled; a wizard that persists nothing
  is worse than none; rebuild when a real institution's onboarding demands it).
- **P-6** — Gate-aware UI (emit gate state in `/api/me` so ungated users get
  honest messaging, not blind 403s) + ops directory caveats + the
  `seed-invites` `created_at` one-liner.

**Arc status (as banked; the seven bullets above are FT's ruling verbatim and
are never edited to carry status).**

- **P-0 BANKED** `a7c73e5` (2026-07-16) — CLAUDE.md reconciliation, docs only.
- **P-1 BANKED** `c2c73c9` (2026-07-16) — Reports isolation + institution-name
  threading. **Site-count amendment:** the verbatim bullet says "the 12
  hardcoded … headers"; the true figure is **15 sites / 12 files, of which 14
  were in scope**. 14 is the in-scope count cited everywhere else (the commit
  message and the `useInstitutionEyebrow.js:4` docblock both say 14); the 15th
  site is `SetupWizard.jsx:138`, deliberately excluded because **P-5 removes
  the wizard**. The 12 files are 10 eyebrow consumers + the hook itself +
  SetupWizard. Both denominators are recorded here so the discrepancy is not
  re-litigated. **CLOSED by P-5:** the wizard is gone, so the 15th site went with
  it. 15 and 14 have CONVERGED and 12 files became 11. This amendment is now
  HISTORY rather than a live caution: there is no longer a discrepancy to
  reconcile, and `useInstitutionEyebrow.js`'s own docblock ("all 14 sites") was
  correct throughout and needed no change.
- **P-2 BANKED** `d9ee100` (Stage A, migrations 0016+0017) · `6f1b501`
  (Stage B, `PUT /api/athletes/:id` + attendance D7) · `90de25e` (Stage C,
  `enterpriseStats` D2 + FORK 1 denominators) · `5af1340` (Stage D+E, milestone
  editor + FORK 1 disclosure + FORK 3 gift honesty), 2026-07-20. Migrations
  0016 + 0017 applied local **and** `--remote`, parity-verified 2026-07-20
  (see §5 Enterprise row for the verification method).
- **P-3 — COMPLETE, fixture isolation AND P-3c.** Three of the
  four filed items are banked: **P-3a BANKED** `a8d51a9` (CohortView Marcus
  identity fix + Home cohort callout gated; verified live in production under a
  real login) · **P-3b-1 BANKED** `fa836ad` (`useFixtureIsolated()` extracted +
  Learn advisor block isolated + P-3a's two inline sites folded in) ·
  **P-3b-2 BANKED** `bce9044` (Team — all fixture panels gated, authored absent
  state, Team nav item hidden), 2026-07-20. **The reusable artifact is
  `src/surfaces/individual/useFixtureIsolated.js`** — returns true when fixture
  content must NOT render; it is named for ISOLATION intent and deliberately
  kept separate from the identical-today `!appIdentity` DEMO AFFORDANCE test
  (the "Restore Marcus's demo profile" button, which still reads the predicate
  raw), because merging the two would make it unsafe to ever let an
  authenticated tree show sample content.
  **P-3c IS CLOSED (FT-ruled 2026-08-18). It was never unstarted.** The control
  shipped across `c360540` (Step 1), `14003a0` (the RecordKeeping card),
  `25c587e`, `4df7f75` and `4d37595`, and `RecordKeeping.jsx:6-13` opens by
  naming itself the consent-reversibility control. The line that used to sit
  here said P-3c was the sole P-3 remainder and opened with a scoping pass; the
  build preceded the scoping pass, which is why the manifest and the tree
  disagreed. R1, R2 and R4 are met by the shipped card. R3 is ruled out on
  evidence. R5 moves outside P-3c. The five rulings, as they now stand:
  - **R1 FT-RULED** — the athlete may flip delegated↔self **freely, no staff
    approval** (the E6 athlete-owns ruling; approval-gating would contradict
    ownership).
  - **R2 FT-RULED** — already-recorded delegated milestones **RETAIN FROZEN**
    on a mode flip (consistent with the E3 anonymize-survival invariant).
  - **R4 FT-RULED** — a **standalone consent card**, not an unparked settings
    route.
  - **R5 FT-RULED, and now OUTSIDE P-3c and outside P-7** — the FORK 1 rate
    shift on revoke is **ACCEPTED**: the athlete leaves the institution-writable
    denominator (`enterpriseStats.js:37`), so live progression rates move
    without staff action. A `RateDisclosure` line must name this, and what
    ships does not. `RateDisclosure.jsx` names the two POPULATIONS (who is
    counted, who is not) but not that the denominator MOVES without staff
    action, which is the part R5 asked for. It also self-suppresses at `:23`
    (`!consentAware || excluded <= 0`), so an institution where nobody has
    flipped yet sees no disclosure at all, and that is precisely the population
    most likely to be surprised by the first flip. UNBLOCKED and small: one
    component, four mount sites. Its own slice, belonging to neither arc item.
  - **R3 RULED OUT ON EVIDENCE, NOT DEFERRED (FT 2026-08-18)** — it asked for an
    **active in-app notification to staff** when an athlete changes
    record-keeping mode, explicitly not the roster Access-column signal and not
    email unless in-app proved impossible. The feasibility question it left
    open is now ANSWERED: **no notification surface exists anywhere.** No inbox,
    no unread persistence, no delivery mechanism, and `/api/me` is fetch-once
    (`AppShell.jsx:61-63`, with a bfcache reload at `:109-115` as the only
    re-fetch). So R3 as written is a notification SUBSYSTEM built to prevent one
    stale affordance. **The ruled replacement is the P-6 slice 1 pattern: do not
    offer an action the server will refuse.** That work is P-7 below, not P-3c:
    it lives on a different surface and serves a different user.
- **P-4 BANKED** `009eac9` (2026-08-14) — narrow plus three: await/server-id at
  all THREE LessonEditor branches (the `edit` branch was not in the filing),
  `writeError` surfaced in LessonEditor and LessonDetail, Discard stopped
  navigating with tree-divergent copy, `docs/[id].js` PUT deleted, PracticeSettings
  dead Rename and invented literals removed. Pipeline deliberately excluded and
  still its own slice. Verified against a running server, eight checks.
- **P-5 BANKED** (2026-08-15) — the enterprise Setup wizard REMOVED. Six code
  sites: `setup/SetupWizard.jsx` (869 lines, sole occupant of the directory, so
  the directory goes too), the 5-line `EnterpriseSetup.jsx` re-export, and four
  references in `EnterpriseSurface.jsx` (import, nav item, `activeNav` branch,
  route). A stale `/setup` URL now falls to the catch-all
  `<Navigate to={basePath} replace />` and the `activeNav` chain falls through to
  `'home'`, so the highlighted nav item and the landed route agree. Nothing was
  orphaned: `SegmentedControl` keeps five consumers, `formatDate` thirteen.
  **`synthetic.js` was the trap** and is not in the filing: `'Sarah'` sits in
  `REAL_PERSON_FIRST_NAMES`, which `synthetic.runChecks` asserts against, so the
  comment was reworded and the ENTRY DELIBERATELY KEPT. That set is a collision
  guard against names in git history and in any surviving fixture or seed, not an
  index of names in current code; it only ever grows.
- **P-6 PARTLY BANKED** `f26c77a` (2026-08-17): the ops directory caveats
  sub-item only, a §2.4-compliant caveat on all eight Operations directory and
  detail routes, tree-invariant and verified by render, plus removal of the
  three "Every X on the platform" completeness claims. The `seed-invites`
  `created_at` one-liner named in FT's ruling was closed separately at
  `20c0a22`. The `CreateInviteModal` copy contradiction closed at `5fa42c9`,
  the ops-minting guard at `537cc08`, and the `/api/me` ops block plus the four
  type-rejection messages at `1632fbf` (P-6 slice 1). **REMAINING: SLICE 2
  ONLY**, the three gate conditions and the `!gateRow` anomaly, still bound by
  the unsplit ruling and now BLOCKED on advisor and enterprise gate emissions
  rather than on the ops one.
- **P-6 sub-item, named so it is not rediscovered: the shared `'Not authorized'`
  string, now THREE conditions rather than seven.** Slice 1 (`1632fbf`) split
  the four TYPE rejections off, so `functions/_lib/gate.js` returns the shared
  literal from the three GATE conditions only (`:108` advisor gate, `:142`
  enterprise gate, `:212` ops gate), each still folding the `!gateRow` anomaly
  into the same branch. It no longer collapses *wrong account type* with
  *account not designated for writes*; what it still collapses is a genuine
  designation refusal with a server fault, since `!gateRow` means the person row
  vanished between two queries in one request. `jsonError` (`:217-221`) passes
  it to the client unchanged, which is what P-4's `writeError` surfacing renders.
  **SLICE 2, still UNSPLIT, and the blocker MOVED rather than cleared:** the
  client can only know before the click once `/api/me` emits that surface's gate
  state, and it now does so for OPS alone. Advisor and enterprise carry no
  emission, so improving their message alone would still leave an advisor
  discovering the gate by losing a form submission. Any change must preserve the
  gate docblocks' non-disclosure posture: the message must not become an oracle
  for which types and gates exist.
  **THE FOUR MESSAGES SLICE 1 SHIPPED ARE NOT SLICE 2's TO EDIT**, recorded here
  because slice 2 opens the same file: `:92` cannot write practice records,
  `:130` cannot write institution records, `:179` and `:200` cannot read or write
  platform records (ops shares one message across its read and write gates). Each
  names the RESOURCE and attributes the refusal to the account's TYPE, and none
  names the type that would be served. The rationale is docblocked at
  `gate.js:30-51`.
- **P-6 sub-item, ruled so an implementer does not stop at the prohibition:
  `/api/me` emits a DERIVED BOOLEAN, never the blob.** Read naively, P-6's
  gate-state emission reverses a prohibition `me.js` states twice. The advisor
  docblock (`:146-153`) refuses to pass `parsed.advisor` through precisely
  because `$.advisor.demo_gate` lives at that JSON path, so the blob would leak
  the gate flag to every authenticated client on every `/api/me` poll; the
  enterprise docblock (`:366-368`) says never emit `extensions` or any
  `$.enterprise.*` server-side key to the client. **FT RULING 2026-08-17: the
  prohibition is against PASSTHROUGH of `$.<surface>.*`, and a purpose-built
  boolean describing only the requesting account's own gate state is a
  different object.** It is not a secret from the account it describes, since
  that account learns it the instant it attempts a write, and it discloses
  nothing about other accounts, other types, or the internal representation of
  the designation. **The existing discipline stands unchanged.** What is added
  is an explicit exception naming why a derived boolean is not a passthrough,
  so a future reader does not have to infer it or correctly stop. The
  non-disclosure posture in the sub-item above binds this too: the boolean
  answers for its own caller and must not become an oracle for which types and
  gates exist.
  **SHIPPED `1632fbf` as `ops.writesEnabled`** (`me.js:544-561`, spread `:574`,
  consumed at `OperationsRoster.jsx:403`).
  **READ THE GATE THE WAY THE GATE READS ITSELF: `json_extract`, never a JS
  parse of `person.extensions`.** The row is already in hand, so parsing it in
  JS is the obvious shortcut and it is WRONG. SQLite `json_extract` returns
  integer 1 for a JSON `true` AND for a JSON `1`, while a JS
  `parsed.ops.demo_gate === 1` is false for `true`. A gated operator would have
  been told they cannot write, and the write would then have succeeded, which is
  the exact class of falsehood the pilot honesty arc exists to remove. Proven
  during slice 1 against all four representations (absent, `0`, `1`, `true`):
  the emitted boolean agreed with the endpoint's own 403 or 201 in every state.
  Any future surface emitting its gate must use the same predicate as its gate,
  and if `gate.js` ever moves that predicate, `me.js` moves with it.

- **P-7 OPEN (FT-ruled 2026-08-18), INSIDE the Pilot Honesty Arc.** Subject: the
  ENTERPRISE surface offers staff actions the server refuses. Deliberately NOT
  filed under P-3c, whose subject is the athlete's control over their own
  consent: different surface, different user. It sits inside the arc because it
  is the arc's exact shape, a screen asserting a capability the server does not
  grant, and it is the same defect P-6 slice 1 fixed on the ops CTA.
  Two defects, ruled IN THIS ORDER:
  - **FIRST, the missing gate.** `EnterpriseProgram.jsx:174` passes
    `editable={isAuthenticated}` with NO mode predicate, so the attendance
    editor is offered for Self-managed, Pending choice and Unclaimed athletes on
    every authenticated load. This is wrong on FIRST LOAD with a perfectly fresh
    roster, which is why it is ordered first: it is not a staleness bug at all.
    **Ruled PER-ROW gating, not whole-editor.** The roster is already in hand, so
    per-row moves the blast radius from a whole rejected batch to one row.
    `attendance.js:160-167` rejects the WHOLE batch on one offending athlete, so
    a stale or ungated roster there loses every entry and note the staff member
    just typed, not one.
  - **SECOND, staleness.** `AthleteProfile.jsx:53` copies the gate predicate at
    mount (`claimed === true && managementMode === 'delegated'`, gating the
    milestone editor at `:120`), and `/api/me` is fetch-once, so a staff member
    can act on a mode the athlete has since changed. **Ruled OPTIMISTIC OFFER
    PLUS RECOVERY**: no polling a payload that heavy for one boolean, and the
    server returns the state it found so the screen corrects itself. Rejected on
    cost: interval refetch and focus revalidation both re-pull the entire staff
    payload (roster, workshops with nested attendance, exclusions, audit,
    snapshots) to learn one boolean, and neither closes the window.
  **Why the ops CTA analogy only HALF transfers, recorded because it is the
  reasoning most likely to be lost.** In P-6 slice 1 the gate could not change
  under the operator: `/api/me` carried it at load and only FT could alter it.
  Here the value is owned by a DIFFERENT PERSON who can change it at any moment.
  The AFFORDANCE half transfers (do not offer what will be refused); the
  FRESHNESS half does not, and that is the whole difficulty.
  **NOT RULED, and possibly P-6 slice 2's rather than P-7's:** the 403 copy.
  `athletes/[id].js:231-232` and `attendance.js:160-167` each assert a
  present-tense fact the screen contradicts, telling a staff member looking at
  "Delegated" that the athlete has not delegated. Neither says the state
  changed or that the view is stale. The attendance string additionally names
  athletes by RAW ID, which appears nowhere in the staff UI, and folds two
  causes into one message ("or the linked account was removed"). That is P-6
  slice 2's sibling problem, a refusal that does not tell the caller what to do,
  and it may belong there instead. FT has not ruled which.

**Accepted Phase-1 boundary — enterprise gift tracking.** P-2 made every
surface report `gifts_count` honestly as "Not tracked"; it did not build
enterprise gift tracking, which stays deliberately out of Phase 1 because
building it reopens the Clause 6 subpoena posture (the who-gave-to-whom view
is UNBUILT until that posture is set — see §8, `docs/ruling-e-deletion-retention.md`).
This is a scope boundary, not a filed defect.

**NOT in the arc — `$.enterprise.demo_gate` / `$.advisor.demo_gate`
designation.** This is never a slice. It remains FT's deliberate
per-institution step per `docs/enterprise-provisioning-runbook.md` §3(e), and
is **never run for test rows**. P-6 makes the UI honest about the gate; it does
not set it.

**Production gate state (migrations re-verified against remote D1 2026-08-17;
gate values re-verified there the same day — the gate read was FT-run,
read-only aggregate).** All
**18** migrations applied `--remote`, newest `0018_client_consent_attested.sql`
(count re-derived from `migrations/`, `0001`–`0018` contiguous — the prior
"All 17" was correct at the time and is superseded by 0018, not corrected).
**Local and remote AGREE at 18**, on the same newest name, and `client` carries
`consent_attested_at` on BOTH: nullable `TEXT`, no default, appended at `cid=15`,
zero rows. Verified read-only 2026-08-17, immediately after the 0018 apply closed
`4c6eada`'s declared §6.10 branch (b) deferral; that apply carries its own hazard
note at §6.10. `$.ops.demo_gate=1` on exactly ONE of the two ops rows —
**Operations writes are LIVE**, and the FT-exclusivity premise `requireOps`
rests on is now verified rather than asserted. NEITHER the advisor rows NOR the
staff rows carry a gate at all — **advisor and enterprise writes
403 in production today**. Re-verify with a read-only aggregate SELECT over
`person` (`json_extract(extensions,'$.<ns>.demo_gate')`), never a value dump.

**Value correction, from that same 2026-08-17 read: the advisor and enterprise
gates are NULL, never set, not `0`.** This section and
`docs/pilot-gate-criteria.md` both recorded `0` until now. **The behaviour is
UNCHANGED and this is not a defect:** all three gate checks are strict
(`gate.js:84`, `:118`, `:188` each test `gateRow.gate !== 1`), so a NULL and a
`0` fail identically and every advisor and enterprise write returns 403 either
way. What was wrong was only the claim that a value had been set. `0` asserts a
deliberate designation-to-off the database does not evidence; never-set is what
is true, and it is what §3(e) describes, since designation is a step not yet
taken rather than one taken and reversed.

**Manifest-drift note.** P-0 exists because CLAUDE.md disagreed with `git log`
and production D1 in three places at once (advisor writes "REMAINING" two weeks
after they shipped; Operations "dark" after both activation steps were done;
`me.js`'s own docblock contradicting `me.js:349`). This document is the
operating context for every session — when it drifts, its authority is what is
at risk. Treat state-of-record accuracy as load-bearing, not clerical.

**Second instance, 2026-08-17, recorded for its MECHANISM rather than as an
oversight.** §5 and §5.1 both carried the `CreateInviteModal` copy
contradiction and the ops-minting guard as REMAINING for hours after `5fa42c9`
and `537cc08` closed them, and §5 still quoted caution copy that no longer
existed anywhere in the tree. Neither was missed by a check that ran: the
`35fe17a` re-verification PREDATES both fixes, so it could not have caught
them. What let it persist is that `docs/pilot-gate-criteria.md` was re-verified
at `1a178df` while CLAUDE.md was not. **A doc corrected specifically to stop
drift does not propagate its corrections to the manifest that cites it.** The
re-score and the manifest read the same tree and disagreed, with the newer
reading sitting in the doc CLAUDE.md points at rather than in CLAUDE.md itself.

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
   **BULK-PRUNE HAZARD (recorded 2026-08-16).** Never delete an audit branch
   with a `git branch --merged` sweep. `--merged main` LISTS
   `qa-audit-enterprise`, because every one of its commits is reachable from
   `main` (tip `c74058a`, an ancestor, 0 commits ahead), so it appears in the
   same output as genuinely merged slice branches and a sweep would take it.
   `qa-audit-advisor` and `qa-audit-operations` report as unmerged and would
   survive that sweep BY ACCIDENT, not by protection. So a bulk prune deletes
   exactly one of the three audit branches and LOOKS like it worked: the two
   survivors read as evidence that audit branches were left alone. All three,
   including `qa-audit-advisor` (which postdates the sentence above), are
   deleted BY NAME ONLY, and in practice never.
10. **Migration discipline (local-then-remote rule).** Any commit that ships a
    `migrations/NNNN_*.sql` file must either (a) include the corresponding
    `wrangler d1 migrations apply --remote` step in the same ship operation,
    OR (b) explicitly carry forward a named "local-only, remote-apply DEFERRED
    to [specific gate]" note in CLAUDE.md so the deferral is a documented
    decision, never a silent gap. Discovered 2026-06-30 when migration 0003
    (`21d746a`, shipped 2026-06-25 local-only) was found unapplied on remote
    5 days later — latent risk only, never triggered (no remote sign-in had
    occurred in the gap window), but the same gap could have hard-failed
    real magic-link signup against a remote `auth_user` table missing the
    `name` column. See the AUTH sub-slice (a) bank's 0003-gap audit
    annotation in §5 (Individual row). **Second worked instance (0016 + 0017,
    P-2 Stage A, 2026-07-20) — the rule working as designed:** the commit took
    branch (b), carrying an explicit "`--remote` deferred to FT (P-2 L6)" note
    rather than a silent gap; FT applied both `--remote` before the bank, and
    a read-only parity verify (`migrations list --remote` + remote
    `sqlite_master` / `PRAGMA table_info` reads, no mutation) confirmed the
    deltas landed before the branch was merged. Deferral declared, deferral
    closed, closure verified — that is the whole rule. **"Local" means a NAMED
    store (added 2026-08-14).** A migration's local application means nothing
    until the store it was applied to is identified. See §10 for how: the
    wrangler startup banner, never a filename and never a sidecar probe driven
    by a different command than the one whose binding is in question. Where more
    than one `.sqlite` sits under
    `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`, a branch-(b) note must
    say which one received the migration. **Worked failure (2026-07-16 to
    2026-08-05):** migrations 0016 + 0017 satisfied this rule completely
    (deferral declared, applied `--remote` before the bank, parity verified
    read-only), and every `wrangler pages dev` smoke in that window still ran
    against a second local store that carried neither. The rule was honored and
    its LOCAL half was void. §6.10 protects against remote drift; nothing
    protected against local ambiguity until §10 was corrected.
    **NON-INTERACTIVE APPLY HAZARD (recorded 2026-08-17): an agent-run
    `--remote` apply SELF-CONFIRMS against production.** `wrangler d1 migrations
    apply --remote` prints the pending list and then asks for confirmation,
    warning that the database may be unavailable during the migration. In a shell
    with no stdin it takes its documented non-interactive path and auto-answers
    yes, printing `Using fallback value in non-interactive context: yes`. The
    warning is addressed to a human and gets answered without one.
    **What happened, precisely.** FT ran the 0018 apply interactively. The prompt
    went unanswered and the command exited having applied NOTHING, while having
    already printed the migration name, which read as success. Remote sat at 17
    migrations with `client` missing `consent_attested_at`, and that was
    discovered only because a later read-only pass queried the column and got
    `no such column`. The agent then ran the same command in its own shell, where
    it auto-confirmed and applied. **The agent also ran the closure check in that
    same shell. FT ran neither the successful apply nor the verification.** Both
    the write to production and the proof that it landed happened agent-side,
    with no human step between them. That is the part to weigh before reading
    this as a success story.
    **The verification rule.** A remote apply is verified by `wrangler d1
    migrations list --remote` reporting `No migrations to apply!`, NEVER by the
    apply output alone. The apply prints a migration name in BOTH the applied and
    the abandoned case, so its output cannot distinguish them. That list command
    is the closure evidence this rule requires, and it was exactly the step
    missing from the first attempt.
    **Why this one was safe, and why that does not generalize.** 0018 was a
    single additive `ALTER TABLE client ADD COLUMN` against a zero-row table, so
    the blast radius was nil, and the post-apply audit confirmed the only delta
    was the added column with no index, FK, CHECK, DEFAULT or trigger lost. A
    TABLE-REBUILD migration would auto-confirm IDENTICALLY, with no extra prompt
    and no difference in output shape. §10's 0016 rebuild hazard is the shape of
    what that would risk: four inbound child FKs, a `PRAGMA foreign_keys=OFF`
    that is a silent no-op inside a transaction, and child rows dropped with no
    error raised. The safety here came from the migration, not from the command.
    **FT RULING 2026-08-17: REMOTE MIGRATION APPLIES ARE FT-RUN-ONLY. The agent
    NEVER runs `wrangler d1 migrations apply --remote`.** A remote migration apply
    IS a remote D1 write, and `docs/enterprise-provisioning-runbook.md`:43-46
    already ruled that "every `--remote` write is **[FT-only]** per the
    account-tied remote-write protocol". That runbook and this section DISAGREED
    until now: §6.10 governed WHETHER a migration reached remote and said nothing
    about WHO ran it, so an agent-run apply broke no rule written here while
    breaking one written there. This paragraph closes that gap rather than
    creating a new constraint.
    **Procedure, matching the runbook's shape**, in which `[agent-ok]` and
    `[FT-only]` steps never share a shell. (1) `[agent-ok]` the agent prepares and
    banks the migration locally, and states plainly in its report that the remote
    apply is PENDING, which is the branch (b) deferral note above. (2) FT types
    `/exit`. (3) `[FT-only]` FT runs
    `PS> npx wrangler d1 migrations apply stewardhouse-pilot --remote` and answers
    the confirmation prompt. (4) `[FT-only]` FT runs
    `PS> npx wrangler d1 migrations list stewardhouse-pilot --remote` and confirms
    it reports `No migrations to apply!`. (5) FT relaunches with `claude`.
    (6) `[agent-ok]` the agent then performs a read-only verification pass.
    **Why the split matters, both halves of it.** The confirmation prompt is the
    human step the command was designed around, and an agent shell answers it
    without a human, per the hazard above. FT running the CLOSURE CHECK as well
    means the write and the proof of the write do not both happen in the same
    shell, which is precisely the property the 0018 episode lacked. The agent's
    read-only pass at step (6) is still expected and still useful; it simply is
    not the thing that establishes the write landed.
    **The 0018 apply on 2026-08-17 was agent-run and PREDATES this ruling. It is
    NOT a precedent.** The hazard paragraph above explains why it was safe, and
    that reason is entirely a property of the migration rather than of the
    process: one additive `ALTER TABLE ADD COLUMN` against a zero-row table.
11. **Authenticated-surface path audit (full-directory rule).** When
    wiring any existing public demo surface for reuse at an authenticated
    route (e.g. IndividualSurface at both `/individual/*` and
    `/app/individual/*`), the hardcoded-absolute-path audit must cover
    EVERY file inside that surface's directory (e.g. all of
    `src/surfaces/individual/*.jsx`), not just the top-level surface
    file. Discovered 2026-07-01 during the Individual-wiring slice: piece
    3's basePath refactor correctly fixed IndividualSurface.jsx's ~16
    hardcoded paths, but a follow-up full-directory audit found 8
    sub-screen files — Positioning, Letter, Privacy, Questions, GPSReveal
    (the 5 onboarding screens), plus Plan, GiveScreen, and Feedback —
    carrying 13 hardcoded `navigate('/individual/...')` call sites,
    unaudited in that pass. (Learn, History, Team, GivingModeler,
    Discover, and CohortView were confirmed clean.) The
    failure mode: a signed-in pilot user clicking a "back" or navigation
    action inside a sub-screen gets silently dropped into the PUBLIC demo
    route — which mounts a SEPARATE IntakeProvider instance seeded with
    Marcus's fixture data, so the authenticated user's own view is
    replaced by the demo profile. This is a data-identity leak, not just
    a broken link. Any future slice wiring Enterprise, Advisor, or
    Operations for authenticated reuse must run the full-directory grep
    (every file in that surface's directory, not just the entrypoint) as
    a required step before considering the wiring complete, and should
    extract a shared basePath-derivation helper once 2+ files need it
    (per the standard #47/#57 threshold) rather than duplicating the
    logic per file.
12. **Secrets discipline (agent-prompt-discipline rule).** Never
    read / `cat` / view secrets-file (`.dev.vars`, any credential
    store) CONTENTS into context; any transcript that surfaces secret
    material triggers immediate key rotation (`RESEND_API_KEY` rotated
    2026-07-07 after a context-compaction surfacing). **Constructive
    protocol** (added E-Slice 4a, 2026-07-08): structure checks use
    key-name extraction or boolean pattern matches only (e.g.
    `sed -n 's/^KEY=//p'` piped into a boolean, or a name-only grep).
    Values needed at runtime load OPAQUELY inside shell pipelines —
    variable assignment (`secret=$(sed -n 's/^BETTER_AUTH_SECRET=//p'
    .dev.vars)`), passed to the consuming step via env, NEVER echoed /
    printed / logged, and never the Grep tool (which would render the
    value). Report only `secret loaded: yes` and downstream verdicts;
    a derived signature/cookie must be produced and consumed inside the
    same pipeline (command substitution into the consumer) so it never
    prints. If a task genuinely requires SEEING a secret value, STOP and
    hand the step to FT. (First applied: E-Slice 4a staff-dispatch
    signed-cookie smoke — better-auth session cookie forged from the
    opaquely-loaded secret, `/api/me` returned `type:'staff'`, secret
    never surfaced.) **Rotation-completion (added E-Write-1,
    2026-07-08):** rotation is INCOMPLETE until a deploy follows — a
    rotated secret does not reach the running Worker until the next
    deploy re-reads env. A dashboard/CLI key rotation is only half the
    fix; the paired deploy is the other half. **Worked instance: §11
    (2026-07-20 auth outage)** — the Cloudflare Pages Production
    `RESEND_API_KEY` drifted from the active Resend key and took production
    sign-in down for ~5 days, silently. The rule's corollary is that the
    authoritative copy of a secret is the PRODUCTION env, never `.dev.vars`;
    a working local environment is not evidence about production.
13. **Bank rule (agent-prompt-discipline rule).** Agent prints `git diff`
    + exact proposed commit message and waits for FT "Option 1 yes"
    before any commit — diff + message, always.
14. **"Demo tree byte-identical" is a PER-SLICE ISOLATION PROOF (ruled
    2026-08-14), not an absolute prohibition on changing shared components.**
    What the claim demonstrates is that an authenticated-tree change did not
    LEAK identity or fixture behaviour across to the public demo. That is why
    it appears on every isolation slice. A deliberate change to a shared
    component that alters BOTH trees identically is a different thing and does
    not violate it: nothing leaked, and the demo did not diverge from the real
    surface. Such a slice simply cannot CLAIM byte-identical, and must say so
    plainly rather than let the streak break unexplained. First applied to the
    44px tap-target fix, which moves 11 demo-visible `size="lg"` buttons by 5px
    on both trees at once.

    **Standard of proof, and when each tier is enough (added 2026-08-15).** The
    claim is only worth what verifies it, and there are two tiers.

    **String comparison** extracts each demo string from HEAD and from the
    working tree and compares bytes. It proves the literal is unchanged. It does
    NOT prove the demo renders that literal, so it stops one step short and must
    say so.

    **Render verification** loads the demo route and reads the rendered text. It
    closes that step.

    **The test. Render is REQUIRED if ANY of these holds:**
    (a) the demo path is restructured rather than merely added beside;
    (b) a predicate governing WHICH branch renders is added or changed,
    including adding a branch where none existed;
    (c) the claim is load-bearing for an honesty finding (§7, or a §2.5 blocking
    defect in `docs/pilot-gate-criteria.md`).
    **String comparison suffices ONLY when none of those holds** and the change
    is provably additive with the demo branch untouched.

    **Check the render conditions FIRST; they override.** The banner slice was
    additive with an untouched demo branch, which reads like the string tier, but
    it added a ternary where no branch had existed, so (b) fires and render was
    required. Treating the two halves as parallel lists rather than as
    precedence is how a slice talks itself into the cheaper tier.

    **WHO PERFORMS THE RENDER (amended 2026-08-15, amended again 2026-08-17).**
    The three conditions above are UNCHANGED; this changes who decides, not what
    triggers. **The agent MAY perform the render itself, under §9's scoped
    browser rule.** This supersedes the 2026-08-15 form of this paragraph, which
    said the agent does not open a browser because §9 prohibited browser
    automation outright. §9 now PERMITS navigating directly to an explicit
    localhost preview port or to `steward-house.org` and reading only that page,
    so on a firing condition the agent renders the named route and reports what
    it saw. **The agent STOPS for FT only when the render would require
    something §9's scoped rule FORBIDS.** §9 carries the PERMITTED and FORBIDDEN
    lists and is the authority; do not restate them here, because they have
    already drifted twice between the two sections. In short: a localhost
    preview port or `steward-house.org`, that page only.
    In that case it states plainly that render verification is indicated, NAMES
    which of (a) / (b) / (c) fired, offers the structural proof actually
    available (single occurrence of the string in the built bundle, plus the
    element sitting outside every conditional, plus the shared route or
    component both trees mount through), and leaves the decision to FT.
    Shipping on the lesser tier stays FT's call, not the agent's.
    **The worked pattern predates the render being available.** `c23ecc7`
    (Endowment copy) and `61e5f96` (private-notes visibility line) both shipped
    with the AUTHENTICATED-tree half resting on structural proof, with the
    limitation stated plainly in the report rather than implied. Neither claimed
    more than it had. That remains the right posture wherever the scoped rule
    cannot reach the tree in question.

    **Worked instance.** The banner slice (`3d51cce`) shipped on the string tier,
    explicitly flagged in its own commit message as stopping short, and was then
    verified by render across all four sites with the em-dash intact. That commit
    message is now HALF-STALE and cannot be edited: it says the proof stops one
    step short of P-3c's, which is true of the PROOF THAT SHIPPED WITH IT and no
    longer true of the slice. This is where that correction lives.

    **Self-proving evidence, a pattern worth reaching for.** On
    `/app/enterprise/compliance` the corrected copy rendered with a REAL
    PERSISTED AUDIT ROW directly beneath it (2026-08-15 15:00, Diane, the seeded
    exclusion). When a fix corrects a claim ABOUT PERSISTENCE, the persisted
    record rendering beside the corrected copy is self-proving: the copy and the
    data agree in the same viewport, so no separate argument is needed to connect
    them. Reach for this whenever the corrected claim is about whether something
    is stored.
15. **PERMISSION MODE DOES NOT RELAX ANY PROTOCOL RULE (FT-ruled 2026-08-17).**
    Claude Code now defaults to auto mode, which executes tool calls the agent
    assesses as lower-risk without a permission prompt. **Auto mode is KEPT.**
    What changes is that the irreversible categories are stated here explicitly
    instead of being left to the permission layer, which never enforced them in
    the first place. The protocol has always lived in this document; that was
    implicit until now.

    **Four categories require explicit FT approval regardless of permission
    mode, and auto mode granting a tool call is NOT approval:**
    (1) **Any commit.** The bank rule (§6.13) stands: print the full diff and
    the exact proposed commit message, then STOP and wait for FT's explicit
    approval.
    (2) **Any push to origin.**
    (3) **Any remote command:** `wrangler --remote` in any form, and any command
    that writes to production. Remote migration applies are already FT-run-only
    per the ruling recorded in §6.10; this extends the same posture to every
    remote write.
    (4) **Any browser automation beyond what §9's scoped rule PERMITS.** §9
    allows navigating directly to a localhost preview port or to
    `steward-house.org` and reading only that page; everything it forbids needs
    FT, and auto mode overrides neither half.

    **The reasoning.** These four are irreversible or production-facing, and the
    cost of one wrong automatic execution exceeds the cumulative cost of asking.
    Auto mode is kept because read-only investigation benefits from it, and
    because the protocol gates were never permission prompts. They are
    instructions in this document, and this rule says so explicitly so a future
    session cannot infer that a granted tool call is a granted decision.

Stop background shells (dev server, watch loops) at bank time, and LAUNCH them
as tracked background tasks so `TaskStop` applies at all. `TaskStop` is the
first reach, never `kill`.

**`TaskStop` success is NOT evidence the port is free (corrected 2026-08-17).**
The sentence above assumed that stopping the tracked task stops what it spawned.
For `wrangler pages dev` it does not. In the ops-guard smoke `TaskStop` reported
`Successfully stopped task`, killed the tracked parent, and left the whole tree
running: `npx`, `wrangler.js`, the miniflare node process, and TWO `workerd`
children still holding port 8788. **A smoke must VERIFY teardown rather than
report it: zero listeners on the port and zero `workerd` processes, observed.**
Whatever survives is then stopped by PID, children first, after confirming by
command line that each one belongs to this repo. Processes you did not start are
left alone and named in the report instead.

**This is the §10 double-store incident arriving by a different route.** There
the hazard was a second D1 store nobody knew was bound; here it is a second
server nobody knew was listening. Both were invisible to the command that was
supposed to have handled it, both would have been caught by observing the
resource directly, and both hand the NEXT run a failure that has nothing to do
with the code under test.

**A diagnostic must count the DELTA it claims to count, scoped to its case, or
be labelled as an absolute.** A label that counts more than the case created is
a false report waiting to happen. **Reproduction:** the ops-guard smoke printed
`non-seed ops rows created by case 5: 1`. Case 5 created nothing. The query
counted every ops-typed row outside the seed prefix, and the 1 was a
pre-existing local row that predated the smoke. Reported as printed, it would
have read as the guard failing in exactly the way case 5 exists to rule out. The
adjacent check `case5 rows written: 0` was the accurate one and the PK diff
against the backup confirmed it, so the smoke was right and only its own label
was wrong. That is the dangerous shape: a correct run that reports a failure it
did not have.

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

### Tap targets and control sizing (LOCKED 2026-08-14)

**The tap-target standard is 44px, not WCAG 2.5.8's 24px.** This is a
phone-first product, and the highest-stakes control in it writes a consent
change with no confirm step. WCAG 2.2 AA would pass every button already;
that is not the bar. The deferred nav slice inherits this standard.

**`lg` is the TOUCH-PRIMARY size** and is the only one held to 44px, via an
explicit `minHeight` in `Button.jsx`. Measured on device it computes to 39px
(padding 20 + border 2 + a 17px UA line box), because browsers force
`line-height: normal` on form controls and inheritance of `--sh-line-normal`
never reaches them. `minHeight` rather than a corrected `lineHeight`: a height
that emerges from three numbers silently re-breaks when a font-size token moves.

**`sm` and `normal` stay non-compliant DELIBERATELY** (~27px / ~32px). They are
pointer-density controls for inline row actions. Padding a 27px control to 44px
makes it mostly empty space and it would dominate the rows it sits in. The gap
between the three sizes is intentional, not an oversight, and should not be
"fixed" by a later sweep.

**The filed defects and closed records that accreted under this sub-heading are
at `docs/filed-defects.md`.** Four open filings (the two raw persistence
predicates, the advisor stage-label rename blocked on the Q7 allowlist, the
`/individual/welcome` short-viewport CTA, the enterprise/program calendar line
breaks), the two §7 orderings from the 2026-08-18 platform-wide scan with the
scan's boundary and the enforcement asymmetry it exposed, and two CLOSED records.
**Read the TRIGGER TO WATCH note on "CLOSED 2026-08-17: the four Operations
directory rows are NOT a keyboard defect" before re-filing those four files**,
because a grep for `onClick` without `tabIndex` cannot see the lead-cell `Link`
or the `closest('a')` guard and will re-flag every one of them. The other closed
record, "CLOSED 2026-08-18: no modal opens through the BROWSER-AUTOMATION
HARNESS", is the same shape: read it before treating a harness click that changes
nothing as a product defect.

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

**GATE EVERY AFFORDANCE THE SAME CONDITION GOVERNS, IN THE SAME SLICE (added
2026-08-18, P-6 slice 1).** When one control is corrected and its twin is left
live behind the identical predicate, the result is worse than having fixed
neither: the surface now looks considered, so the remaining dead click reads as
deliberate. That is the fixture-only defang shape, where defanging the obvious
site implies the rest were checked. Slice 1 shipped the ops "Create invite" CTA
and the withdraw ROW ACTION together because both sit behind `requireGatedOps`;
gating only the CTA would have left an operator told creation is unavailable
while every unclaimed row still invited a click that 403s. The test before
shipping: list every affordance the predicate governs, not the one that
prompted the work.

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
narrative is org-authored or imported, NEVER written here.
Organizations are referenced entities, not platform users — the unclaimed
tier of the content-sourcing model; org records appear as discovery-catalog
entries, gift targets, and connection destinations, and the Operations
Organizations directory is the operator view of those records.

**Ruled import architecture (2026-08-14, superseding "Candid API integration
is future").** Three sources, ALL REQUIRED, none substituting for another:

1. **ProPublica Nonprofit Explorer API.** The structured 990 record, queried
   live by EIN. No key, public-domain data.
2. **IRS bulk data.** Authoritative status and monthly currency. Carries a
   HARD GATE: a revoked or non-deductible org may not be surfaced at all,
   checked before the record reaches any view.
3. **The org's own website.** Current mission and program language in the
   org's own voice, refreshed quarterly, carrying an inline disclaimer.

**Provenance is per FIELD, not per profile.** A profile mixes all three
sources, so a single profile-level attribution would be false for most of
what is on the page.

**Candid is DEFERRED ENTIRELY.** It is revisited only if pilot data proves a
need, and only with an attorney engaged first. The reason is licensing, not
data quality: Candid's terms require express written consent for any LLM use
of their data, which is what made source 3 unbuildable while Candid was the
plan. Dropping Candid unblocks it. Do NOT design toward Candid, and do not
introduce seal or tier grammar.

The 2026-08-14 Discover defang (`42851cd`) is the first instalment: five
authored fields (`ed`, `boardSize`, `budget`, `programs`, `topFunders`) were
removed from all 17 fixture orgs because authored officers and finances
attached to identifiable real organizations is the sharpest form of the
violation this rule exists to prevent.

**The SURFACE is specified separately, at `docs/discover-surface-spec.md`**
(FT-ruled 2026-08-17). The rulings above and the eight in
`docs/propublica-spike-findings.md` describe the RECORD; that doc describes what
a funder DOES on Discover: four combinable facets (geography prefilled from the
funder's GPS, total expenses band, recognition era, NTEE deferred), alphabetical
results with the count leading and the cut stated at the same visual weight, the
set-membership rule that separates a statable mechanical cut from a curated one,
and what it replaces in the current page. Read it before touching Discover: the
page NO LONGER scores or ranks, which `65f2a28` removed, and it renders an
explicit unavailable state instead, so the facet build lands INTO that state
rather than shipping alongside a removal.

**The BUILD between them is scoped at `docs/bmf-load-scoping.md`** (2026-08-18,
nothing built). The two docs above describe the record and the surface; that one
turns the rulings into a plan against the tree: migration 0019 as a new table
rather than the curated `org` one, the swap and the finding that
DROP-then-RENAME IS atomic when both ship in one `d1 execute --file` invocation,
the non-atomicity having been a property of issuing two statements as two
invocations, the script shape and its agent-ok / FT-only split, and six items
left explicitly open.

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
- `docs/arc-history-enterprise.md` — Enterprise surface arc history, relocated
  verbatim from CLAUDE.md §5 on 2026-07-08 (every Critical/High commit, Sweeps
  1–4, Cluster I–IX, the 4-pattern not-a-finding taxonomy). Current-state lives
  in the slim §5 Enterprise row.
- `docs/arc-history-advisor.md` — Advisor surface arc history, relocated
  verbatim from CLAUDE.md §5 on 2026-07-08 (12 fix bundles + tail triage + the
  full persistence arc: routing → path-fix → schema → seed → wire-surfaces →
  RequireType). Current-state lives in the slim §5 Advisor row.
- `docs/arc-history-individual.md` — Individual surface arc history, relocated
  verbatim from CLAUDE.md §5 on 2026-07-08 (rework tiers, 5.8 + persistence
  scoping, schema rulings A–F, the full auth + wiring + persistence-writes
  build). Current-state lives in the slim §5 Individual row.
- `docs/operations-current-state-2026-05-31.md` — Operations surface inventory
  (pre-redesign baseline).
- `docs/operations-overview-discovery-2026-06-01.md` — gap-map between
  candidate Overview signals and live-versus-needs-new-entity classification
  (the foundation for slices A–H).
- `docs/cross-surface-data-model-discovery-2026-05-31.md` — data-shape
  mapping across all four surfaces (foundation for the unified data layer).
- `docs/qa-triage-medium-low-2026-05-30.md` — disposition of the 115 Enterprise
  Medium + Low audit findings.
- `docs/5.8-giving-flow-scoping.md` — Individual 5.8 giving-flow design rulings
  (FT, this session) + current-state baseline of the three gift shapes
  (seed / session / unified) + Parker hard lines + carried debt + next-turn
  placeholder for the canonical Gift field set + scenario-versioning spec.
- `docs/persistence-scoping-pass.md` — persistence scoping pass output (this
  session, read-only). Three strands — Strand 1 (D1 + Workers + unified
  architecture; live store = NEW layer beside unified; three open rulings),
  Strand 2 (`better-auth` self-hosted in D1 + magic-link via CF Email
  Service with Resend fallback; hosted SaaS rejected on custody grounds),
  Strand 3 (4/30 data-protection frame across 4 layers; Derek advanced to
  critical-path). Folded-item resolutions + what the schema draft must
  carry.
- `docs/persistence-schema-draft.md` — ruled persistence schema (FT, this
  session). Rule artifact in scope → rule → build. FT rulings A-F:
  A REPLACE (live D1 = single source of truth), B person-is-identity,
  C `person.id`-opaque sufficient, D `org` → D1 table, **E RESOLVED** on
  research synthesis (own doc below), F Marcus = first real account.
  Tables: `auth_user` (better-auth) / `person` / `gift`
  (`exported_to_cpa` = only lifecycle-adjacent field) / `scenario`
  (no rank / score) / `org`. Index every "my X" FK from migration 1.
  **Fully finalized**; FT has authorized build. Two counsel-gated seams
  remain isolated (Clause 3 charitable-floor; Clause 6 subpoena posture)
  and do NOT block build.
- `docs/ruling-e-deletion-retention.md` — ruling E (deletion / retention),
  accepted by FT this session on research synthesis. NOT legal advice;
  counsel-confirm/correct backstop. Six clauses: two-phase soft-then-hard
  deletion at the `person` boundary (Parker no-`deleted_at`-as-status
  invariant intact); anonymize-not-orphan; minimal justified retention
  window; backup-restore re-applies pending deletions; deletion ledger by
  opaque marker; subpoena posture keeps identity separable + who-gave-to-
  whom view UNBUILT. **Two counsel-gated seams isolated** — Clause 3
  charitable-retention-floor confirmation, Clause 6 subpoena posture —
  isolated, do NOT block the build; reviewing counsel confirms in
  parallel.
- `docs/pilot-gate-criteria.md` — the pilot gate's acceptance criteria, ruled
  2026-08-14. Five rulings (isolate-vs-caveat by claim subject; caveated counts;
  honest-but-empty counts; publish both figures; weight by endpoints plus
  routes), the counting method that makes the denominator reproducible, and a
  re-score log. Deliberately NOT in CLAUDE.md: §7 sections are LOCKED
  guardrails, this carries per-item status that changes every slice. First
  scoring at `e13ea0c`: capability 68/83 = 82% (routes 35/50, endpoints 33/33),
  production-usable 44/83 = 53%. NOT comparable to the prior 57%, which used a
  different method; the move is rulings, not progress.
  One criterion (Enterprise "renders live institution data") is flagged NOT
  AUDITABLE with a proposed test.
- `docs/filed-defects.md` — the §7 defect queue, relocated 2026-08-19 from the
  tap-target sub-heading. Live: file there, not in §7.
- `src/data/unified/README.md` — unified data layer internal notes.

---

## 9. Browser screening runbook — lessons (2026-07-02)

Five hard-earned lessons from a night of failed browser screening attempts (2026-07-02), plus three findings added 2026-07-20 (two session-minting, from P-2 screening; one log-reading, from the §11 auth incident), plus five STANDING RULES added 2026-08-15, 2026-08-16 and 2026-08-17 (browser automation; build-output reading; JSX identifier resolution; bundler coverage of `functions/`; smokes never send real mail). Any future FT-facing browser screen of an auth-gated surface must respect these, and the five standing rules bind every slice, screening or not:

- **`localhost` vs `127.0.0.1` origin stranding.** `BETTER_AUTH_URL` in `.dev.vars` is `http://localhost:8788`. Better-auth's magic-link verify sets the session cookie on whichever origin served the verify request, then 302-redirects to `BETTER_AUTH_URL`. If FT clicked a link at `127.0.0.1:8788`, the cookie stuck to `127.0.0.1` but the redirect sent her to `localhost:8788` — different origin, no cookie carried, AppShell's `/api/me` returned null, bounce to `/signin`. **Always hand FT URLs on the SAME host as `BETTER_AUTH_URL`.** For local screening: use `localhost:8788` everywhere, never `127.0.0.1:8788`.
- **Resend test sender (`onboarding@resend.dev`) delivers only to the registered address.** Plus-alias variants of the account owner's email (e.g. `talabifaouzi+morgan@gmail.com`) are treated as different addresses and rejected — `POST /api/auth/sign-in/magic-link` returns 500 because the sender throws. **Production invites REQUIRE a verified domain sender** — Resend's test sender is not a viable path for onboarding real pilot users. Verified domain needs to land before the first real invite goes out. **UPDATE (superseded 2026-07-15, invite-email slice):** this caveat is now STALE for the running environments — the verified domain sender has landed. Local `.dev.vars` `FROM_EMAIL=signin@steward-house.org` (a verified `steward-house.org` sender, not `onboarding@resend.dev`), and FT empirically delivered plus-address links on production 2026-07-15, so production is a verified sender too. The exact **production** `FROM_EMAIL` is a Cloudflare Pages dashboard var (NOT in `wrangler.toml`, not repo-readable) — confirm it reads `signin@steward-house.org` there before the first real external invite. (`.dev.vars.example` still shows the old `onboarding@resend.dev` placeholder — a stale template, harmless.) **See §11 (2026-07-20 incident):** production sender config lives in the Cloudflare Pages dashboard, is NOT repo-readable, and **drifts silently** — `RESEND_API_KEY` there fell out of sync with the active Resend key and took production sign-in down for ~5 days with no signal. A green local `.dev.vars` proves nothing about production.
- **Hand-forged cookies fail in the browser even when curl accepts them.** Better-auth sets `HttpOnly` + `SameSite=Lax` + secure-when-https attributes. DevTools cookie paste bypasses those attributes; more commonly, DevTools re-encodes `%2F`/`%3D` in the pasted value (turning `%2F` into `%252F`), and the pasted-in domain (`localhost` vs `127.0.0.1`) rarely matches the origin FT actually browses. **Never hand FT raw cookie values. Use either the real magic-link flow (email) or code-path-minted verification-row URLs.** Cookie surgery is a curl-only tool.
- **STANDING RULE: browser automation is PERMITTED under a scoped rule.** Ruled 2026-08-17, SUPERSEDING the blanket prohibition added at `1f76708` (2026-08-15). That prohibition is RETIRED and is not restated anywhere; a reader finding language that forbids browser use outright is reading something stale. **What the incident actually was, recorded precisely because the old rule was written wider than its finding.** During the `88e07ea` work a tab-context call with `createIfEmpty` opened a fresh Chrome tab, and Chrome's new-tab page rendered FT's own most-visited tiles. Nothing was read from those tiles, and no page other than the localhost preview was navigated to. **The defect was the tab-creation call, not browser use.** **PERMITTED:** navigating directly to an explicit localhost preview port or to `steward-house.org`, and reading only that page, INCLUDING a tab-context call with `createIfEmpty: false` where that is required to obtain a `tabId`. **FORBIDDEN:** any tab-creation call beyond the one carve-out below, navigating to any other origin, and reading or extracting from any page other than the target. If a task appears to need any of those, SAY SO AND STOP. **THE ONE CARVE-OUT (added 2026-08-17, third pass).** `createIfEmpty: true` is PERMITTED **once per session**, only when `tabs_context_mcp{createIfEmpty: false}` has already returned no group, and only as the FIRST STEP toward navigating to a permitted url. Three conditions bind it and ALL must hold: the agent navigates to the permitted url IMMEDIATELY after, in the same sequence, with nothing in between; the agent NEVER reads, extracts from, screenshots, or reports on the created tab before that navigation; and the agent REPORTS in its findings that it created a tab group, so the call is visible rather than silent. Any further tab-creation call in the same session stays forbidden. **Why this is the containment and not a loosening:** the `88e07ea` incident was not that a tab was created, it was that a new-tab page RENDERED FT's browsing data and that was indistinguishable from the agent having navigated somewhere it should not. Navigating immediately and never reading the intermediate state removes the OBSERVATION, which is the part that mattered. **AMENDED 2026-08-17, on the rule's FIRST USE, and the amendment narrows the prohibition to THE FLAG rather than the tool.** As first written the FORBIDDEN list named "any tab-context or tab-creation call, `createIfEmpty` in any form", which forbade the only mechanism by which a PERMITTED url can be reached: `navigate` auto-calls `tabs_context_mcp{createIfEmpty:true}` when `tabId` is omitted, and needs a `tabId` from that same tool when it is not, while `get_page_text` needs one too. The rule therefore permitted a destination and blocked every route to it. **The agent stopped and reported the conflict rather than picking the reading that let it proceed**, which is the behaviour this rule wants and is why the gap surfaced as a question instead of as a violation. What actually caused the `88e07ea` incident was `createIfEmpty: true`, which created a fresh tab and rendered FT's most-visited tiles on Chrome's new-tab page; `createIfEmpty: false` creates nothing and surfaces no new-tab page, so the risk lives in the flag and the prohibition now sits there. **The limitation, stated plainly, because it is the reason this is a rule and not a boundary.** The extension operates inside FT's live logged-in Chrome session, so anything that session can reach, the tools can reach. Navigating straight to a URL avoids the new-tab page; it does not sandbox the session. FT considered a separate Chrome profile with the extension installed only there, which would be a real boundary, and accepted the protocol instead for its lower cost. **So this rule holds because the agent honors it, in the same way the bank rule holds.** **What it unblocks, so the cost of the old rule is visible:** §6.14 conditions (b) and (c) can now be satisfied by RENDER rather than by accepting structural proof each time. Claims currently resting on estimates, which a render can now settle: the four Operations directory `minWidth` values at `8aa8358`, which rest on an ASSUMED 0.50em Inter advance; the focus landing after a successful withdraw at `cd2f41b`; and the four onboarding screens whose fold behaviour is SPLIT BY VIEWPORT WIDTH, which a single phrasing would collapse: §7 records them MEASURED CLEAR at 640 wide (`e13ea0c`; letter 587, privacy 535, questions 401, reveal 517), while the later scoping pass ESTIMATED them below the fold at 320 wide on directional reasoning, since halving the width roughly doubles wrapped-text height while fixed chrome stays constant. A render settles the NARROW case; it does not contradict the recorded one, and §7 needs no change. Source-derived measurement (token values from `tokens.css`, container arithmetic from the layout chain, character counts from the string itself) remains correct and cheap, and stays the right first reach; what changed is that it is no longer the ONLY reach.
- **STANDING LIMIT ON THE SCOPED RULE: the harness can NAVIGATE and READ; it
  cannot reliably CLICK.** Added 2026-08-18. The rule above says what the agent
  is PERMITTED to do; this says what it can actually accomplish, which is a
  smaller set. Across a full session every navigation worked and **every
  interaction reported success and changed nothing**: clicks by element ref and
  by coordinate, on two surfaces, alike. The product was not at fault, and FT
  clicking the same control in Chrome opened the modal (§7, CLOSED 2026-08-18).
  **Candidate mechanism, offered as a LEAD and not a conclusion:** the tool
  reports a viewport of 2133x1120 while returning screenshots at 1530x803, a
  ratio of about 1.39, so a click resolved through screenshot space would land
  well off target and produce exactly this signature, success reported against
  empty space.
  **THE CONSEQUENCE, WHICH IS THE PART THAT BINDS.** Any slice whose change is
  reachable only THROUGH a click ships at build-plus-structural-proof, NOT at
  render, and must say so rather than let a §6.14 firing condition look
  satisfied. **Render verifies what a page SHOWS ON LOAD, not what it DOES when
  used.** That distinction was implicit in §6.14 and is now explicit, because
  the two are easy to conflate when a render technically ran. **P-7 slice 1
  (`a8191c1`) is the worked example** and recorded it in its own commit body:
  the gated attendance row is behind a modal, so its appearance is unverified,
  while what DID render on load (the roster Access column resolving all four
  states, and `RateDisclosure` naming one of five athletes as recordable) is
  reported as exactly that and no more.
  **What would distinguish the mechanism, if anyone wants to:** FT clicking the
  same control, which is now DONE for modals and is what closed it; a
  programmatic `element.click()` rather than a synthetic pointer event, which
  would separate event delivery from handler and state but sits OUTSIDE §9's
  permitted set; or the deployed build, which separates the dev server from the
  app but not the harness from either.
- **Single-type identity means FT's real email always lands as an individual.** Ruled 2026-07-02: one `auth_user` → one `person` → exactly one `type`. FT's real gmail (`talabifaouzi@gmail.com`) is bound to Marcus's `person` row with `type='individual'`. **[EXAMPLE STALE, RULE INTACT — corrected 2026-07-20.** The Marcus binding no longer holds on production: verified read-only against remote D1, Marcus's `person` row is **UNCLAIMED** (`auth_user_id` NULL, no `invite_email` — nobody can sign in as it) and FT holds **three** separate claimed `type='individual'` rows. §5's Individual row already recorded this ("Marcus un-reconciled to a standalone person row; FT row is a genuine clean slate") — the manifest contradicted itself for four days, and §5 was the correct half. The single-type identity RULE below is UNAFFECTED and still load-bearing; only the binding example was wrong. Operational cost: the stale line nearly sent the P-3a production screen hunting for a non-Marcus test identity that was never needed.]** She cannot sign in as advisor/enterprise on her real account — the (c) hook does not re-fire on sign-in, and RequireType would bounce her from `/app/advisor` regardless. **Test identities for other types MUST use distinct emails**, and for local dev those are plus-addressed variants of FT's real address that route to the same inbox. Every advisor/enterprise/ops test identity is a separate `auth_user` row bound to the correct-typed `person` row.
- **`person.display_name` must be set at invite/designation, not defaulted.** The Chrome header reads `identity.displayName`. On a fresh sign-in where the (c) hook fires the fresh-person branch, `display_name` defaults to the literal string `'New user'`. If a bespoke advisor is provisioned by inserting the `person` row without a real `display_name`, that string will render in the header for FT's screen, and every subsequent screenshot. **Every pre-seeded bespoke-type `person` row must carry a real `display_name` at insert time.** Never rely on the default.
- **Sign a forged session cookie with standard PADDED base64, then `encodeURIComponent`.** Added P-2 screening, 2026-07-20. A cookie signed with base64url-no-pad is rejected — `/api/me` returns null and the surface bounces to `/signin`, with no error distinguishing it from an expired session. Padded base64 + percent-encoding is the working form. This is a curl-only tool and does not change §9's standing rule that hand-forged cookies must never be handed to FT for a browser screen.
- **`storeToken:'hashed'` makes a DB-token magic-link fallback impossible.** Added P-2 screening, 2026-07-20. Better-auth stores a SHA-256 **hash**, not the plaintext token. Reading that row and rebuilding a `/verify?token=…` URL therefore cannot work — the plaintext exists only in the email that was sent. When a screen needs a real session and email is unavailable, mint the session directly (bullet above); do not budget time for token recovery from D1. **Column correction (2026-08-15):** the hash lives in `verification.identifier`, NOT `verification.value` as this bullet said from 2026-07-20 until now; `value` holds `JSON.stringify({email, name})`. The recovery-is-impossible conclusion was right and is unchanged; only the column was wrong.
- **RECOVERY is impossible, but FORWARD CONSTRUCTION works, and it is how a smoke exercises the claim hook.** Added 2026-08-15 (the `29ea526` smoke). The hash is one-way, so a token cannot be read back out of D1, but nothing stops writing the row from a token you already know. Better-auth computes `verification.identifier = base64url-nopad(SHA-256(token))` and `verification.value = JSON.stringify({ email, name })` (`node_modules/better-auth/dist/plugins/magic-link/index.mjs:32,58-66`; hasher at `dist/db/verification-token-storage.mjs:4-7`). So: pick a plaintext token, INSERT a `verification` row with that identifier plus a future `expires_at`, then `GET /api/auth/magic-link/verify?token={plaintext}&callbackURL=/`. Better-auth verifies it as genuine, and because `findUserByEmail` misses for a fresh address it calls `createUser`, which fires the `after` hook in `functions/_lib/auth.js`, meaning both the person claim AND `bindAthleteRows`. **This is the only way to exercise the claim hook without an email round-trip**, and it is precisely what a session mint cannot do: a minted session skips `createUser` entirely, so the hook never runs. Reach for the mint when a smoke needs an authenticated caller; reach for this when a smoke needs the CLAIM itself. Both are curl-only tools and neither is ever handed to FT for a browser screen.
- **In a deployment tail, `POST … - Ok` is NOT the success signal.** Added 2026-07-20. The top-level request line reads `Ok` even when the handler threw; the `(error)` lines beneath it carry the failure. **Absence of those lines is what success looks like.** Full diagnosis procedure — including how the thrown Resend status names the cause — is in **§11**.
- **STANDING RULE: never verify a build from a truncated tail.** Added 2026-08-15. During the `494aa4f` work a build check ran `npm run build 2>&1 | tail -2`, which cut off a real esbuild failure and printed only the trailing stack frames; the agent read that as fine and moved past a BROKEN build. **Build verification reads enough output to see a failure, and a passing claim requires the actual result rather than a truncated view.** `tail -2` and `tail -3` are too short: an esbuild error puts the message ABOVE a stack trace, so the tail shows frames while the diagnosis scrolls past. Filter the noise instead of trimming the output (`grep -v "^    at "`), or read enough lines to reach the verdict line. Same principle as the deployment-tail rule above: absence of error lines is what success looks like, and **you cannot observe an absence in output you did not read.**
- **STANDING RULE: a green build does not prove the module runs. Confirm every JSX identifier resolves.** Added 2026-08-15, immediately after the rule above because it is the failure that rule does NOT catch. **An undefined JSX identifier compiles.** `<Modal>` transforms to `jsx(Modal, …)`, and esbuild does not scope-check that `Modal` is bound, so a missing import produces a **clean build** and a **`ReferenceError` at first render of that branch**. Reproduction, this slice: the withdraw-invite confirm was written with `<Modal>` and **`Modal` was never imported**; `npm run build` reported 168 modules transformed and `✓ built in 3.79s`, and the failure would have surfaced only when an operator clicked a roster row. **Verification must therefore confirm that every JSX identifier in a changed file resolves to an import or a local definition**, which is a one-line check (collect `/<([A-Z][A-Za-z0-9]*)/`, collect the import bindings and `function [A-Z]…` declarations, diff the sets). This bites hardest on a branch the demo tree never renders, because nothing exercises it until the gated path is reached.
- **STANDING RULE: `npm run build` does not verify `functions/`. Run the bundler that actually covers the code you changed.** Added 2026-08-16. `npm run build` is `vite build`, which bundles `src/` only. **Every Pages Function, every `_lib` module, and every endpoint is INVISIBLE to it**, so a green `npm run build` says nothing about whether server code compiles or loads. **The check for `functions/` is the wrangler bundle: either `npx wrangler pages functions build --outdir <dir>`, or a real `npx wrangler pages dev` start reading `wrangler.toml`.** Both print `Compiled Worker successfully`, and that line, not vite's, is the one that covers server code. **This gap was live for several slices before it was noticed**, including the invite delete endpoint (`1c9d69d`) and the expiry predicate (`311773c`). Both shipped "build clean" against a bundler that never read them, and both are the sharpest possible case: each touched ONLY `functions/` files, so the green build was bundling an entirely unchanged `src/` and reporting success about work it had not seen. **This is the third rule in the same family**, after reading output in full and confirming identifiers resolve. All three are about a green signal that does not mean what it appears to mean: the first is a signal you did not read, the second a signal that cannot see the defect, and this one a signal computed over different files entirely. Ask what the tool actually consumed before treating its verdict as verification.
- **STANDING RULE: smokes NEVER send real mail.** Added 2026-08-17. Any smoke that can reach a send path must override `SENDER_PROVIDER` BEFORE the first request, so a send is suppressed rather than attempted. **Reproduction:** the ops-guard smoke omitted it. Case 2 posted a valid `type:'advisor'` invite, `POST /api/invites` returned `emailSent:true`, and **Resend ACCEPTED a send to `case2-advisor@opsguard-smoke.invalid` and returned a message id.** A live outbound call was dispatched to a nonexistent domain and will bounce. **The `.invalid` TLD is NOT a guarantee the sender refuses the request**, and that assumption is precisely what made the omission feel safe: the address looks self-evidently undeliverable, so nothing seems to be at stake. Deliverability is the recipient mail system's problem and is decided long after the API call; the call itself happens regardless, against the real account, counting against real quota. **How the override behaves TODAY, which must be read before relying on it, because it works by accident rather than by design.** There is NO noop provider: `sender.js:24-31` accepts `'resend'` and `'cf-email'` only and THROWS `Unknown SENDER_PROVIDER` on anything else. An unrecognised value therefore suppresses the send by throwing inside `createSender`, BEFORE any network call, which is the right outcome reached through an error path. That is safe on the two invite paths, which wrap the send: `invites.js:184-198` catches and returns `emailSent:false` with the row standing, and `athletes.js` sends at `:308-310` inside a wider try whose catch at `:322-325` sets `invite:'failed'` with the athlete row standing. **It BREAKS the magic-link path**, which is unwrapped: `auth.js:399` calls `createSender` inside `sendMagicLink` with no try/catch, so the throw escapes and sign-in returns 500, which is the §11 failure chain exactly. A smoke that exercises sign-in therefore cannot use this override, and building a real noop provider is the proper fix, a code change no slice has made. **Citation corrected in passing:** §11 cites `auth.js:275` for the unwrapped send; at `537cc08` the send is `auth.js:420` and the `createSender` call is `:399`.

---

## 10. Local D1 / migration runbook — lessons (2026-07-20, bullet 1 corrected 2026-08-14)

Three techniques from the P-2 Stage A migration work; bullet 1 corrected
2026-08-14. These concern the local D1 stores (which one a given invocation
binds) and destructive schema rebuilds, distinct from §9, which is about
browser screening of auth-gated surfaces.

- **Identify the bound local D1 store from wrangler's startup banner.** `env.DB (stewardhouse-pilot)` means the binding was config-resolved. `env.DB (local-DB=stewardhouse-pilot)` means a `--d1` flag is in play and a DIFFERENT store is in use. Read that line before trusting any local store, and never infer the binding from a filename. **Why that line is authoritative:** the `.sqlite` filename under `miniflare-D1DatabaseObject/` is the Durable-Object id for `idFromName()` of the id string the invocation hands miniflare, under the fixed unique key `miniflare-D1DatabaseObject` (`miniflare/dist/src/index.js:85770`; `workers/shared/object-entry.worker.js`), and nothing else. Config-resolved commands (bare `pages dev`, `d1 execute --local`, `d1 migrations apply --local`) all pass `database_id` and converge on one file. A `--d1 BINDING=NAME` flag on `pages dev` does not: `wrangler-dist/cli.js:302057` assigns `database_id: ref`, putting the database NAME into the id slot. Verified empirically 2026-08-11: `8600684c-…` maps to `e7ff1add…`, `stewardhouse-pilot` maps to `7202f096…`. If a sidecar-mtime probe is used at all, it MUST be driven by the command whose binding is in question; a probe run through `d1 execute --local` proves nothing about `pages dev`, because that command and `d1 migrations apply --local` share one code path and their agreement is a tautology. Applying a migration to the wrong file produces a silent no-op: the schema looks unapplied and the smoke fails for reasons that have nothing to do with the SQL.
- **Apply schema via `node:sqlite`, and run `PRAGMA foreign_keys=OFF` OUTSIDE a transaction.** The pragma is a no-op inside an open transaction and fails silently — SQLite neither errors nor warns. A table-rebuild that relies on it will then drop child rows. Set it first, **guard-assert that it actually took effect**, and only then begin the rebuild. (0016 did exactly this: four inbound child FKs, guard-asserted before DROP, child survival proven on a scratch copy, `foreign_key_check` empty afterward.)
- **`VACUUM INTO` before any destructive rebuild — never `cp`.** A filesystem copy of a live SQLite database silently loses WAL contents: the copy looks intact and is missing the most recent committed writes. `VACUUM INTO` produces a consistent point-in-time snapshot. Use it for the scratch copy that proves a rebuild is non-destructive before touching the real store.

### Filed — an invocation flag created a persistent second local D1 store (2026-07-16)

On **2026-07-16T18:55:18Z** a second store `7202f096….sqlite` came into
existence and received every write of the C-3b consent-enforcement milestone
screen: two `session` rows, a `verification` row, the invite `person`, the
roster-add `athlete`, a `workshop` and its attendance. Its newest write is
**2026-07-16T19:10:32.615Z**. It has been frozen since, while migrations 0016
and 0017 and every subsequent seed went to `e7ff`.

The cause was `--d1 DB=stewardhouse-pilot` on an agent-run `wrangler pages dev`:
`cli.js:302057` assigns `database_id: ref`, so `idFromName('stewardhouse-pilot')`
resolves to a different Durable Object than `idFromName('8600684c-…')`. **The
command itself survives nowhere:** not in `wrangler.toml`, not in
`package.json` scripts, not in FT's PowerShell history (agent-run background
commands never reach PSReadLine). Its only trace is a banner line inside a
`server.log` in an OS-temp scratchpad, which is not version-controlled and is
subject to cleanup at any time.

The flag came into use mid-day on 2026-07-16. `.staging-server.log` at the repo
root, last written `2026-07-16T19:18:47Z`, records `env.DB (stewardhouse-pilot)`:
the config-resolved form, no flag. `7202` was created at 18:55Z the same day.
Both invocation forms were used within hours of each other, and nothing at the
time distinguished them.

**What it cost.** The P-2 Stage A record ratified `e7ff` as "the bound store" on
a sidecar-mtime probe driven by `d1 execute --local`, a probe that measured a
different command than the one in question, and §10 carried that as a
wrangler-version property from 2026-07-20 until this correction. The 2026-08-05
P-3c smoke then failed for roughly an hour (seed backup 15:39Z, diagnosis script
16:39Z, cleanup 16:41Z) with seed on `e7ff` and server on `7202`, presenting as
repeated `GET /api/me 200` with a null body, indistinguishable from an expired
session. Separately, when "did Stage B's R6 assertions run against the
CHECK-less store?" was asked in August, it could only be answered by inference,
because `p2_smoke.mjs` had already been lost from the same class of temp
directory.

**Discipline that would have caught it, cheapest first:**

1. **Read the banner.** Wrangler prints the bound resource at every start.
   `local-DB=…` versus `stewardhouse-pilot` is a one-line, zero-cost
   discriminator that sat in `server.log` unread for the whole incident. This
   alone closes the failure mode.
2. **A probe must be driven by the command whose binding is in question.** §10's
   technique was sound; its subject was wrong.
3. **A seed must assert its target store is the store the server reads,** not
   hardcode a path and hope. Comparing against the banner, or failing loudly
   when more than one `.sqlite` exists under `miniflare-D1DatabaseObject/`,
   turns a silent mismatch into a startup error. `scripts/smoke-p3c-seed.mjs`
   now does the schema half of this.
4. **Non-default flags on a long-lived local service belong in a committed
   script.** A `pages dev` incantation that changes which database the app talks
   to is a configuration decision and should be as reviewable as
   `wrangler.toml`.
5. **An ignored file is invisible to a default repo sweep.** The Grep tool
   honors `.gitignore`, so `scripts/seed-screen-p2.mjs` (excluded by
   `.gitignore:19`) never appeared in any ripgrep-based search of the repo, and
   the false warrant it carried survived four weeks of audits that would
   otherwise have surfaced it. Any audit trusting the default tool will miss
   ignored files: search them explicitly, or do not let correction-bearing text
   live in an ignored path. This is why the file was renamed to
   `scripts/smoke-p2-screen.mjs`.

---

## 11. Production incident log

Incidents on the live environment, their root cause, and how they were
diagnosed. Distinct from §9 (browser screening) and §10 (local D1): this
section is about production behaving differently from every local signal.

### 2026-07-20 — production magic-link sign-in down ~5 days (silent)

**Symptom.** `steward-house.org/signin` returned "Sign-in is temporarily
unavailable. Please try again shortly." to every attempt. No user could sign
in to any surface.

**Root cause.** The `RESEND_API_KEY` in the **Cloudflare Pages Production**
environment had drifted from the active Resend key (rotated ~2026-07-15;
Cloudflare was never updated). Resend answered **401
`{"statusCode":401,"name":"validation_error","message":"API key is invalid"}`**.
The failure chain: `sender.js:50-52` throws on any non-ok Resend response →
`auth.js:275` calls `await sender.send()` with **no try/catch** → the throw
escapes `sendMagicLink` → better-auth returns 500 → `SignIn.jsx:99-102`
renders its catch-all string.

**The silent-failure property — the part that matters.** Magic-link sends
stamp **nothing** in D1 (unlike the invite path, which writes
`$.invite.sentAt` / `$.invite.messageId` on `person.extensions`). There is no
health check. So a total authentication outage produced **zero signal** and ran
invisibly for roughly five days: last successful send `2026-07-15T15:22:59Z`,
detected `2026-07-20` only because FT happened to attempt a sign-in. Nothing
in the repo, the build, or D1 would have surfaced it.

**Diagnosis method (read-only, reusable).**

1. `npx wrangler pages deployment tail <deployment-id> --project-name
   stewardhouse-app` — wrangler v4 **requires** the deployment id positionally
   in non-interactive mode; the bare `--project-name` form errors with
   "Missing deployment". Get the id from `wrangler pages deployment list`
   (newest Production entry). Note the Pages project is **`stewardhouse-app`**,
   while the D1 database and `wrangler.toml` `name` are `stewardhouse-pilot`.
2. Confirm the tail is capturing with one benign `GET /api/me` before asking
   anyone to attempt a sign-in.
3. Have FT make **one** sign-in attempt — not several. The magic-link path
   rate-limits at `{ window: 60, max: 5 }` (`auth.js:250`), and repeated tries
   start returning 429s that render a *different* message and mask the fault.
4. Read the thrown string. **`Resend send failed: {status}` names the cause:
   401 = API key · 403 = sender domain not verified · 422 = malformed `from`
   address · 429 = Resend's own quota · 5xx = Resend outage (transient).**

**Two discriminators worth keeping.** `GET /api/me` returning **200** proves
the Worker runtime and D1 binding are healthy, isolating the fault to the
sender rather than the deploy. And `SignIn.jsx` maps 429 / 400 / 403 to
*distinct* messages (`:74-97`), so the generic "temporarily unavailable" string
specifically means **5xx** — never a rate limit, never the invite gate.

**THE TRAP.** In the tail, the top-level request line reads
`POST … /api/auth/sign-in/magic-link - Ok` **even when the handler threw**. The
`(error)` lines beneath it carry the failure. **Absence of those lines is what
success looks like** — do not read `Ok` as a fix.

**The fix — both halves, in order (§6.12).** Set the good key in the
**Cloudflare Pages Production** environment — **not `.dev.vars`**, which is
local-only and is exactly what drifted out of sync here — and **then deploy**,
because the Worker only re-reads env on a new deployment. A dashboard edit
alone leaves sign-in broken. `739b51f` is the empty commit that carried the
redeploy.

**Filed open item — auth observability gap.** There is no health check on the
magic-link path and no failure stamp on a send, so the next outage is equally
silent. Queued as a **near-term small build, deliberately NOT a P-7 arc
slice**. Minimum viable shape: stamp send outcome the way the invite path
already does, so a failure is visible in D1 without a live attempt.

---

## When in doubt

Ask. Don't assume. Path B violations, brand-token deviations, and Co-Authored-By
footers are non-negotiable.
