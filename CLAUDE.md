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
| **Operations Overview** | **Complete and QA'd.** Overview ships 8 redesign slices (A–H, 2026-06); QA audit on branch `qa-audit-operations` (53 findings + 3 amendments = 56 total, doc at `docs/qa-audit-operations-2026-06-09.md`; **branch unmerged** by design). Fix bundles 1 (a11y highs QA-015–018), 2 (copy + structure QA-001/002/024/054 + lows 025–029), 3 (`801123a` — decision-free fixes QA-003/007/008/020/022/031/037–039/042/043/052, incl. deletion of the dead `UserList` stub), and 4 (`20354cc` — code quality QA-032/033/034/044/046/048/050/053, the `ExpandableRow` extraction, two QA-048 resolvers, three new tokens, and the Mission→Progression internal renames) banked. **Route-pages arc complete** (5 slices, 2026-06): slice 1 deleted the `health` tab + route stub, added Organizations to the nav, wired composition tiles as drills; slices 2–5 shipped live directory pages at `/operations/{individuals,institutions,advisors,organizations}` (77 / 4 / 7 / 17 records, all fixture-faithful with live-derived count headers). **Detail-routes arc complete** (6 slices + Candid interleave, 2026-06): per-record detail routes at `/operations/{dir}/:id` for all four entities — slice 1 (`2d1cf1c` — Institution detail, routing skeleton), 2 (`d327080` — AdvisorPractice detail), 3 (`abe5141` — Organization detail), 4 (`760af13` — Individual detail, type-aware: full view for `type='individual'`, light view for staff/advisor), Candid interleave (`3b7da48` — Organization detail restructured to the GuideStar/Candid profile flow: `foundedYear` literals added to `orgsData.js`, cause label "Economic" → "Economic Mobility" in `intakeData.js`, Person.causes normalized to a string-ID array in `adapters/individual.js`), 5 (`dacde68` — URL-filter state on all four directories: `q` debounced / `source` / `cat` / `causes` / `ids`-override, URL as source of truth, `replace` writes), and 6 (`743de6a` — drill wiring: rows clickable with filter persistence via `location.state.fromQuery`, shared `<AboutLine>` on Issue/Activity expand panels, pre-plan-clients drill behind a build-time derivation gate, ALL FOUR pilot tiles documented-unlinked by founder ruling with per-tile unlock conditions in code) banked. Chrome pattern across detail pages: `<BackLink>` with explicit `to` + `location.state.fromQuery` preservation, shared `<NotFoundCard>` for invalid IDs, dotted-bronze cross-links. **Fix bundle 5** (`e1e3600`) — founder visual cluster: QA-004 (Operations persona wired to `CURRENT_OPS_USER` in new `data/opsFixtures.js`); QA-014 reading A (activity-row chip drops border + adds `cursor:default`, surface accent moves from border to chip text color); QA-021 (muted text inside the Open issues tint card swapped to `--sh-text-secondary` — both the IssueRow meta line and the "Per-issue detail view coming soon." footnote — contrast moves from ~3.46:1 to ~8:1 against `--sh-bg-tint`); QA-030 ruling b1 (`SURFACE_COLORS.Operations` swapped from `--sh-bronze` to `--sh-text-secondary` — Operations now reads quiet internal, distinct from Advisor's bronze). Wontfix per founder ruling: QA-011 (no new funnel footnote, consistent with the pilot-tile decision), QA-013 (SuiteRow copy-to-clipboard defer until attention-state fires), QA-040 (asymmetric `<main>` padding by design), QA-045 (date-helper overlap acceptable per audit), QA-051 (no React.memo at current scale), QA-035 (bronze progression bars on tint track — editorial restraint, 3:1 non-text contrast met), QA-036 (expand-panel prominence asymmetry — intentional: Open issues is the higher-priority attention signal). **Audit posture: 55 of 56 findings resolved**; remaining 1 — QA-023 blocked on a future CR-level filtered view. **Operations roster arc OPENED (Ruling 1.1 confirmed, scoping at `docs/operations-roster-scoping.md`).** **O-1 authenticated routing SHIPPED** (`slice-ops-routing`): `AppDispatcher` `type==='ops'` branch → `/app/operations`; `/app/operations` route mounts the FULL Operations surface behind `RequireType type="ops"` (Q5 — read gated by type alone; ops accounts are FT-exclusive); Chrome identity swap (real `displayName` on the auth tree, `CURRENT_OPS_USER` fixture only on demo; `userRole` null on auth until an ops `/api/me` block exists). **Routing only** — mirrors the advisor `ce6d8be` precedent. **Interim state (deliberate, enterprise-4a precedent):** the authenticated ops user sees FIXTURE data everywhere (Overview + directories) until O-2/O-3 land — §7 requires the ROSTER view to be honest when it lands, not this slice to isolate everything. **O-1 path-fix SHIPPED** (`slice-ops-pathfix`): the §6.11 audit's 45 hardcoded `/operations/` nav sites across 9 files rewired through a shared `useBasePath('/operations','/app/operations')` (13 hook calls, one per navigating component; module-level `DIR_PATH` constants → in-component `dirPath` derived from basePath; `NAV_ITEMS` → `getNavItems(basePath)`; fallback `Navigate` → `to={basePath}`). Demo tree byte-identical (basePath resolves to `/operations` off `/app/operations`); on the auth tree nav/drill links now resolve to `/app/operations/…`. Zero hardcoded nav literals remain (grep-verified); build clean; both mounts serve 200. **O-2 roster READ (demonstrative mode) SHIPPED** (`slice-ops-roster-demo`): new `OperationsRoster.jsx` view + `Roster` nav item + `roster` route (all four types per Q2, distinct from the per-type directories); **two modes per Ruling 1.1** — demo tree renders the `DEMO_ROSTER` fixture (five local seed identities, Q7; cleaned demonstrative set with `example.org` emails + a claimed/invited mix) under a §7 demonstrative caveat, authenticated tree renders an HONEST interim state ("The live roster is not yet connected…"), NEVER the fixture (the one view Ruling 1.1 requires honest from birth; switched on `useOptionalAppIdentity`). DataTable idiom (6 cols: type · name · invite email · status · source · added) in an `overflow-x:auto` wrapper (mobile scroll — a forward-improvement over the directories); rows NON-interactive with a "detail arrives with the live roster" footnote (aggregate-default guardrail, no dead click); "Create invite" CTA home reserved in the header flex (no placeholder). Both branches + fixture verified present in the built bundle. **O-3 live-gated roster READ SHIPPED** (`slice-ops-roster-live`): new `requireOps(db, context)` in `functions/_lib/gate.js` (session → person → `type==='ops'`, TYPE-ONLY, no `demo_gate` per Q5; write-twin `$.ops.demo_gate` deferred) + new `functions/api/roster.js` (`onRequestGet` only, gifts.js pattern) SELECTing `id/display_name/type/source_surface/invite_email/(auth_user_id IS NULL) AS pending` from `person` WHERE `soft_deleted_at IS NULL AND (invite_email IS NULL OR NOT LIKE '%.invalid')` ORDER BY `type, display_name COLLATE NOCASE` (no pagination, revisit ~200; `.invalid` seeds excluded per §7 LIVE-honesty); `OperationsRoster.jsx` auth branch swapped from the interim card to a live `fetch('/api/roster')` `LiveRoster` (loading/error-no-retry/empty/rows into the shared `RosterTable`); "Added" column dropped from both branches (`person` has no `created_at` — arrives with the invite-form slice). Smoke: unauth→401, non-ops→403, ops→200 rows matching local D1 after filters. **Naming ruled 2026-07-13** (`slice-ops-naming`, display-layer only): on the Operations surface, type label `ops`→**Admin** (roster Type cell via `TYPE_LABELS`), view **Roster→Accounts** (nav + h1 + aria-label + captions), surface name **Operations→Admin** at display sites (Landing card, Chrome header, activity-chip via `SURFACE_DISPLAY_LABELS` — color lookup still keys on raw `Operations`). Route paths (`/operations`, `/…/roster`, `GET /api/roster`), nav keys, and the DB `type` enum stay LEGACY by design (docblocked at each site). Enterprise "Roster" (athletes) untouched. **Invite-creation form SHIPPED** (`slice-ops-invite-form`): migration **0014** (`person.created_at` nullable TEXT/ISO — LOCAL-applied, `--remote` a post-bank step per §6.10; 5 pre-0014 rows NULL → "—"); new `requireGatedOps` write-twin in `functions/_lib/gate.js` (`type==='ops'` AND `$.ops.demo_gate===1`, beside the type-only READ `requireOps`, per Q5); `POST /api/invites` (`onRequestPost` only — `requireGatedOps` → `{email,type,displayName}`, email normalized VERBATIM-identical to the auth-gate seam + claim key, `source_surface` derived server-side, INSERT the `seed-invites.mjs` 10-column shape + `created_at`, UNIQUE→409, re-SELECT→201 roster-element+`createdAt`); `GET /api/roster` emits `createdAt`; `OperationsRoster.jsx` auth-tree-only "Create invite" CTA + `CreateInviteModal` (four-type select, `ops→"Admin"` label but `'ops'` value, gate/409 via `writeError`, splice-sorted on success) + **Added column restored to both branches** (live `createdAt`, NULL→"—"; demo synthetic dates under the §7 caveat). Smoke: unauth→401, ops-without-gate→403, gated ops→201, duplicate→409, demo Added from fixture. **Invite-email SHIPPED** (`slice-invite-email`, FT ruling 2026-07-15): creating an invite now sends the invitee a NOTIFICATION email (not a magic link) via `functions/_lib/inviteEmail.js` → `createSender` → Resend, pointing to `steward-house.org/signin`; **create-succeeds-with-warning** — the send runs in its own try/catch after the INSERT (non-transactional; the row stands either way), success stamps `$.invite.sentAt`/`$.invite.messageId` on `extensions` (json_set, no migration) + `emailSent:true`, failure leaves no stamp + `emailSent:false` (201 both), surfaced in `CreateInviteModal` as a quiet warning-on-success; CLI `seed-invites.mjs` stays silent by ruling; §9 test-sender caveat corrected (verified `signin@steward-house.org` sender is live). **LIVE ON PRODUCTION** (corrected P-0, verified against remote D1 2026-07-16): both former activation steps are DONE — `wrangler d1 migrations list --remote` reports "No migrations to apply!" (all 15 applied, incl. 0014), and `$.ops.demo_gate=1` on one remote ops row. The prior "**Dark on production** until (a) … (b) … **NEXT:** those two activation steps" text was STALE and is retired. Operations is the ONLY surface whose writes are live in production: `GET /api/roster` (`requireOps`, type-only) and `POST /api/invites` (`requireGatedOps`) both function end-to-end for FT today. **Known defects (P-6 filed):** `CreateInviteModal.jsx:101-105` caution copy still reads "No email is sent now" — contradicted by `invites.js:143` (which sends) and by the same component's own success notice at `:63`; stale copy from `46b2efe`. `seed-invites.mjs:124` never writes `created_at`, so every CLI-seeded pilot row renders "—" in the Added column permanently (form-created invites get a date via `invites.js:103`). No resend / edit / revoke path — a failed send is unrecoverable from the UI (`invites.js:9-10`). The four directories + detail routes render unlabeled synthetic `unified` data on the auth tree with ZERO demonstrative caveat (Organizations worst — 17 orgs, no source chip by design per `OrganizationsDirectory.jsx:22-26`); the Overview caveat (`OperationsSurface.jsx:301-312`) DOES render on both trees and is honest. No `ops` block in `/api/me` → `userRole` hardcoded null (`OperationsSurface.jsx:219`). A gated ops user can mint another ops account (`CreateInviteModal.jsx:22`), which would silently violate the FT-exclusivity precondition `requireOps` rests on (`gate.js:135-138`) — no guard. |
| **Enterprise** | **Built and audited; depth arc COMPLETE.** All 6 sections live (Overview, Roster, Program, Compliance, Reports + 5 sub-pages, Setup wizard). 157-finding QA audit (9 Critical + 33 High + 60 Medium + 55 Low) on unmerged `qa-audit-enterprise` branch (`docs/qa-audit-enterprise-2026-05-30.md`). Audit posture: **156 of 157 dispositioned** — 9 Critical + 32 High shipped; all Mediums/Lows resolved across Sweeps 1–4 + Clusters I–IX + the 4-pattern not-a-finding taxonomy. **Only open item: #12** (Tag `warning` palette — deferred High, paused-Individual-gated; closes when Individual unpauses). Fixture dates uniformly shifted −192d (`7998c7d`). Enterprise does NOT use Advisor's numbered-bundle model. **Authenticated build LIVE**: `/app/enterprise` routing + staff-type dispatch (4a/4b), `/api/me` staff block + endowment (5a/6b), Chrome identity swap + staff test identity 0011 (5b), full fixture isolation on the auth tree (6a/6b — computeStats/AthletesProvider + empty states + CohortComparison gate). **Write arc OPEN**: E-Write-1 roster-add shipped — `requireGatedEnterprise` (E11 twin), `POST /api/athletes` (institution-scoped, E6 consent-required + `consent_acknowledged_at` migration 0012, E8 notes caution, E10 badge), `/api/me` roster emission + `AthletesProvider.add()` write-through, Roster CTA + `AddAthleteModal` (+ FT-screen fix `f8a235b`: gate error surfaced in-form via `writeError`, Position field dropped). **E-Write-2 anonymize-to-stub shipped** — `DELETE /api/athletes/:id` (E3 override): explicit delete of the 4 athlete-child tables + stub UPDATE (`name='redacted'`, class+sport retained, all else NULL/0/`Sunset`, `person_id` + `consent_acknowledged_at` NULL) as ONE `env.DB.batch()` implicit transaction; `/api/me` roster excludes `Sunset` stubs (E9-snapshot residue only); `AthletesProvider.remove()` + `AthleteProfile` "Remove from roster" → nested confirm modal; idempotent re-DELETE, id+institution scope with identical 404. Gate stays DARK on production (local-smoke-only; Faouzi `04…0002` the designated test identity) until E3/E6/E8 counsel clears. **E-Write-3a workshop-create shipped** — `POST /api/workshops` (create-only; institution-scoped from session, `facilitator_person_id` NULL per Q2 E4-deferred, `status` staff-set from enum with server default `scheduled`, `title`+`date` required, `date` validated YYYY-MM-DD for the NOT-NULL column + calendar parse); shared `WORKSHOP_ELEMENT_COLUMNS`/`toWorkshopElement` (element always carries `attendance:[]` + `followUps:[]` so `WorkshopDetail` never reads undefined; `facilitator:null` in 3a); `/api/me` staff block emits `enterprise.workshops` ORDER BY date with nested `attendance[]` (Q7 documented debt: revisit to per-workshop fetch when a real institution's payload is measurable); new `WorkshopsContext` (fold-in + `add()` write-through, date-sorted splice) mounted beside `AthletesProvider`; `EnterpriseProgram` rewired off the fixture import to `useWorkshops()` (demo tree byte-identical via the provider's fixture default) + "Schedule workshop" affordance → `ScheduleWorkshopModal` (AddAthleteModal idiom, no consent line — workshops are institution records). No workshop delete/edit (Q6); `workshop_followup` out of scope (Q5); zero E9/snapshot obligations. **E-Write-3b workshop-attendance upsert shipped** — `PUT /api/workshops/:id/attendance` (first two-level nested route `workshops/[id]/attendance.js`; first `ON CONFLICT DO UPDATE` upsert in the repo, composite PK `(workshop_id, athlete_id)`): full-roster batch `{ records:[{athleteId, attended, note?}] }` (Q3, one record per active athlete, attended default false), dual-transitive scope (workshop institution-scoped 404 + single IN query validating every athleteId is on the institution roster AND `enrollment_status != 'Sunset'` per Q4, **reject-whole-batch** — one atomic multi-row statement, no partial write), Q5 no note caution, Q6 returns full updated element; `WorkshopsProvider.updateAttendance` wholesale-replace write-through; `WorkshopDetail` read-render re-keyed on `attendance.length` (Q2, no implicit status flip — demo-parity-safe via fixture `completed⟺rows` equivalence) + auth-only edit mode (per-athlete toggle+note, empty-roster guard, `writeError` in-form). **E-Write-4 compliance writes shipped** — `POST /api/exclusions` (create; institution-scoped, `flagged_at` server-set; `connection_detail` free text with NO server validation per E8/Q4, field-adjacent caution copy in `AddExclusionModal`) + `DELETE /api/exclusions/:id` (Q1 hard-delete, no edit); **Q2 auto-log** — each exclusion add/remove writes its `compliance_audit` row inside the SAME `env.DB.batch()` (atomic; action + target frozen, `user_role` denormalized from `institution_contact.role_title` at write time via shared `functions/_lib/audit.js`); `POST /api/compliance-audit` for MANUAL entries (Q3 append-only — exports ONLY `onRequestPost`, CF auto-405s PUT/DELETE, E7 docblock; no edit/delete/updated_at); `/api/me` emits `enterprise.exclusions` + `enterprise.complianceAudit` (staff-only — `connection_detail` never-emit elsewhere per E8; audit newest-first, author display resolved via person leftJoin, `user_role` NOT re-derived); new `ComplianceProvider` (one context, both arrays, add/remove/addAudit write-through splicing the auto-logged audit row without refetch); `EnterpriseCompliance` rewired off withheld-fixtures to the provider (demo tree byte-identical incl. its session-edit overlay) + auth-only "Add exclusion" / "Record entry" affordances and `ExclusionDetail` remove-confirm (E-Write-2 idiom). **E-Write-5 cohort snapshot shipped** — migration **0013** (`dollars_moved` + `avg_weekly_engagement` → NULLABLE via the SQLite table-rebuild; local-applied, **remote rides the bank**); `POST /api/snapshots` (Q5 — derives the six sourced aggregates server-side from live D1 at snapshot time: athletes_count non-Sunset, gps/cert counts+rates, attendance_rate through workshop join, gifts_count = SUM(athlete.gifts_count) soft counter; the two unsourced write **NULL** = "not tracked", never 0/staff-entered; the `gifts_count = SUM(…)` clause above is **STALE and retired by P-2 FORK 3** (`5af1340`): `snapshots.js:122,164` no longer sums it, it writes **NULL**, so the unsourced-NULL columns are **three** as of migration 0017 (`dollars_moved`, `avg_weekly_engagement`, `gifts_count`), not the two that were true at E-Write-5 time; zero-athlete guard → rate 0 on NOT-NULL rate columns; integer-percent representation matches the fixture) + `DELETE /api/snapshots/:id` (Q7 delete-and-re-snapshot); `/api/me` emits `enterprise.snapshots` (newest-first); `SnapshotsProvider` fold-in (fixture default `[current, prior]`); **`CohortComparison` rewired off fixtures onto `useSnapshots()` + `useAthletes()`** (Q8 — 0 → gate panel, 1 → single-cohort view, ≥2 → year-over-year of the two most recent; NULL → "Not tracked"; demo byte-identical) + auth-only "Record period snapshot" / per-snapshot delete-confirm. **E3 survival proven in smoke: anonymizing an athlete leaves already-taken snapshots byte-identical** (frozen aggregates, the arc's capstone invariant). **ENTERPRISE WRITE ARC COMPLETE** — roster-add · anonymize · workshop-create · attendance · compliance (exclusions+audit) · cohort-snapshot, all gated dark on production pending E3/E6/E8 counsel. **A SEVENTH endpoint was added later by P-2** — progression (`PUT /api/athletes/:id`, `6f1b501`); the six-endpoint list above is the arc as it closed, not the current endpoint count. **Consent-enforcement arc OPEN** (E6 ruling, athlete-owns-and-data-leaves-with-them): **C-1 shipped** (`ee12991`) — migration **0015** (`athlete.management_mode`, deny-by-default) + `POST /api/athletes` name+email lockdown (extra keys → 400) + attendance claim-state gate (`management_mode='delegated'` EXACTLY, whole-batch 403) + anonymize nulls `management_mode` + `AddAthleteModal` trimmed to Name+Email. **C-2 shipped** (`afea99d`) — roster-add auto-invite: `POST /api/athletes` requires email (normalized `trim().toLowerCase()`, stored on `athlete.email` + minted `person.invite_email`), mints a claimable `person` (invites.js 10-col shape) + sends the notification email after the athlete row commits; athlete NEVER rolled back, always 2xx, outcome rides `invite ∈ 'sent'|'skipped'(UNIQUE)|'failed'`; `athlete.person_id` stays NULL (bind deferred to C-3). **C-3a shipped** (`e041a49`) — claim-hook athlete bind in `functions/_lib/auth.js` (shared `bindAthleteRows`: `UPDATE athlete SET person_id WHERE email = user.email lowercased AND person_id IS NULL`, ALL linked rows, best-effort in the hook try/catch, both `claimed===1` re-SELECT + fresh-person paths) + bind-at-enroll in `athletes.js` UNIQUE-skip branch (A1: existing person already claimed → bind the just-created row; `management_mode` stays NULL, invite stays `'skipped'`) + new `POST /api/athlete-consent` (`getPersonForSession`, `mode ∈ 'self'|'delegated'` else 400, UPDATE all rows WHERE `person_id`=session person, 0 rows → 403, athlete-only + changeable + deny-by-default) + `/api/me` emissions (individual `person.athlete {managementMode uniform-or-null, institutionName}` conditional-spread; `managementMode` on staff roster via shared `ATHLETE_ELEMENT_COLUMNS/toAthleteElement`). No migration (`management_mode` exists), no UI. **C-3b shipped** (`b51ea14`) — the consent UI: one-time account-ownership interstitial ("Your account, your choice", self/delegated → `POST /api/athlete-consent`, "Decide later" never writes) gating IndividualSurface for a linked athlete with `managementMode===null` (condition-gated, before onboarding + dashboard; ordinary individuals + demo tree never reach it; AppShell `athlete` emit + `updateAthleteConsent` write-through) + roster **Access column** (four states Unclaimed/Pending choice/Self-managed/Delegated via shared `accessLabel`, AUTHENTICATED-ONLY — demo tree byte-identical, FT-ratified — + the quiet AthleteProfile line) + server `claimed:!!row.person_id` boolean emit (raw `person_id` never shipped). **CONSENT-ENFORCEMENT ARC COMPLETE** (C-1 `ee12991` · C-2 `afea99d` · C-3a `e041a49` · C-3b `b51ea14`) — the **FT milestone screen PASSED 2026-07-16**, all eight steps clean on FT's own account (roster-add → invite email → claim → choice card → delegated → staff attendance write). With the arc banked + deployed, the runbook §3(e) `$.enterprise.demo_gate` designation precondition is now **SATISFIABLE**; the designation itself remains FT's deliberate per-institution step, never run for test rows. **P-2 PROGRESSION WRITES SHIPPED** (`d9ee100` · `6f1b501` · `90de25e` · `5af1340`, 2026-07-20) — the frozen-columns finding at §5.1 is closed. Stage A: migrations **0016** (`athlete.enrollment_status` CHECK, TitleCase enum `'Invited','Active','Stalled','Sunset','Certified'` — FORK 2, applied via table-rebuild with four inbound child FKs, `PRAGMA foreign_keys=OFF` outside a transaction, child survival proven on a scratch copy) + **0017** (`cohort_period_snapshot.gifts_count` → NULLABLE, FORK 3). **Both applied local AND `--remote`; parity-verified read-only 2026-07-20** — `wrangler d1 migrations list --remote` reports "No migrations to apply!", the CHECK is present in remote `sqlite_master` (`CREATE TABLE "athlete"`, the table-rebuild signature), and remote `PRAGMA table_info(cohort_period_snapshot)` shows `gifts_count notnull=0`; §6.10 satisfied with no carried deferral. Stage B: `PUT /api/athletes/:id` (`functions/api/athletes/[id].js:185`) records milestones (lessons 0..9 / gpsCompleted / certified) behind the FULL staff-write gate (`requireGatedEnterprise` + institution scope + non-Sunset + `management_mode='delegated'` EXACTLY + `person_id IS NOT NULL`); `certified`+`cert_at` authoritative, `enrollment_status` the act-derived mirror (R2: Invited→Active only on a positive milestone, never backward, never Stalled/Sunset); gifts excluded per FORK 3; attendance.js D7 rejects delegated-but-`person_id`-NULL orphans. Stage C: `enterpriseStats.computeStats` D2 (`onTrack` a direct set count, fixing a mis-counted certified-without-GPS athlete) + **FORK 1** — progression rates divide by institution-writable athletes ONLY (`claimed && managementMode==='delegated'`, the same predicate as the PUT gate), `consentAware`-gated to the auth tree so the demo fixture stays byte-identical, `rateBaseTotal===0` → rates null → "Not tracked", never 0%; drops the `?? 'active'` status laundering in `athletes.js` (safe because 0016 CHECK-constrains the column). Stage D+E: AthleteProfile milestone editor (auth-only), shared `RateDisclosure` naming both populations, and **FORK 3 widened** — `gifts_count` is written by NO path, so every live gift-counter site now reads "Not tracked" / "—" rather than a structural 0 (EnterpriseOverview, ProgramSummary, ProgramOutputs, EnterpriseRoster, CohortComparison, AthleteProfile); render-layer only, `enterpriseStats.js` untouched, demo tree byte-identical at every site. **Gift tracking itself remains unbuilt — an accepted Phase-1 boundary, not a defect (see §5.1).** **NEXT** (post-arc queue): enterprise routing follow-ups / invite runbook (per the standing list); production activation waits on the consent-enforcement arc (C-3) banked + deployed and FT's deliberate `$.enterprise.demo_gate` designation per runbook §3(e) — the operating premise (2026-07-15) is internal review, no external counsel. Scoping: `docs/enterprise-persistence-scoping.md` + `docs/enterprise-persistence-schema-draft.md`. **Full arc history** (every Critical/High commit, Sweeps 1–4, Cluster I–IX detail, the not-a-finding taxonomy): `docs/arc-history-enterprise.md`. |
| **Advisor** | **Built and audited; QA arc COMPLETE** (audit + 12 fix bundles + tail triage). 8-section IA; all 9 clients seeded. 41-finding audit on unmerged `qa-audit-advisor` branch (`docs/qa-audit-advisor-2026-06-13.md`); 33 of 42 dispositioned. **Advisor persistence arc CLOSED** (`9736096` — FT acceptance walk, real email flow both environments, prod open-signup finding, 2026-07-07): routing ✓, path-fix ✓ (§6.11, 48 sites / 13 files), scoping ✓ (12 rulings), schema ✓ (migration 0007), slim seed ✓ (0008), authenticated reads ✓ (slice 1 `7ca21e9`), fixture isolation ✓ (slice 2 `8c3e4f7`), `RequireType` type-guard ✓ (`e8683f3`). **Single-type identity RULED PERMANENT** (FT 2026-07-02). **WRITE ENDPOINTS SHIPPED — the prior "REMAINING: write endpoints + provider write-through" text was STALE and is retired** (corrected P-0, 2026-07-16). **THIRTEEN advisor write endpoints shipped 2026-07-02 → 2026-07-07** and are wired to UI through FOUR contexts: `POST /api/clients` + `PUT /api/clients/:id` (`ClientsContext.jsx:72,94`), `POST /api/client-sessions` (`:127`), `POST /api/client-notes` (`:157`), `POST /api/cohorts` + `PUT /api/cohorts/:id` (`CohortsContext.jsx:41,63`), `POST`/`DELETE /api/cohort-members` (`:89,119`), `POST /api/docs` (`DocumentationContext.jsx:101`), `POST /api/doc-categories` (`:161`), `POST /api/practice-content` + `PUT /api/practice-content/:id` (`PracticeContentContext.jsx:56,80`), `PUT /api/practice-profile` (direct fetch, `PracticeSettings.jsx:93`). Reads and writes are gated DIFFERENTLY and deliberately: **reads are UNGATED** (`me.js:133` keys on `person.type==='advisor'` alone — an ungated advisor sees their own empty practice), **writes are ALL behind `requireGatedAdvisor`** (`gate.js:64-88`: type `advisor` AND `json_extract(extensions,'$.advisor.demo_gate')===1`, strict integer 1; verified all 13 endpoints, no ungated advisor write exists). **$.advisor.demo_gate = 0 on ALL production advisor rows** (verified against remote D1 2026-07-16) — so every advisor write returns 403 in production today. Designation is FT's deliberate step, NOT a slice (see §5.1). **Known defects (P-4 filed):** lesson-authoring is BROKEN on the auth tree — `LessonEditor.jsx:94` calls `add({id:'pl-001',…})` WITHOUT `await` and then `afterSave(newId)` navigates to the client-minted id, but `practice-content.js:136` does `crypto.randomUUID()` and ignores it; `PracticeContentContext.jsx:64` correctly RETURNS the server id and the caller discards it, so `LessonDetail.jsx:37-41` can't resolve the lesson and `<Navigate replace/>` bounces the advisor to the library (same defect in `author` mode, `:119-133`). `writeError` is never surfaced in `LessonEditor.jsx:36` / `LessonDetail.jsx:21`, so with the gate at 0 every curriculum write fails SILENTLY. `LessonDetail.jsx:76-80` navigates away on "Discard" though `PracticeContentContext.jsx:96-104` returns false (no DELETE endpoint exists). `docs/[id].js` PUT has NO caller — docs are write-once. `Pipeline.jsx:36-38` renders Morgan's fixture counts to any advisor with ≥1 client and `handleSave` persists nothing (no `/api/pipeline` exists). `PracticeSettings.jsx:222` "Rename" has no `onClick`; `:230-232` renders literal "45 minutes"/"America/New_York" as if they were the advisor's settings. **RESOLVED — production signup invite-gated** (slice `slice-invite-gate`, this session): pre-send allowlist (b2) in `functions/api/auth/[[route]].js` intercepts `POST /api/auth/sign-in/magic-link` before better-auth engages — unknown email (no `auth_user` AND no matching `person.invite_email`) → 403 `{code:'new_user_signup_disabled'}`, NO link sent / verification row / `auth_user` created; existing account OR invited (pre-seeded `invite_email`) → passes through unchanged. `person.invite_email` is the single source of truth (same key the claim hook reads). `SignIn.jsx` renders the existing "Sign-up is not currently open for this address." copy on the 403. `seed-invites.mjs` now accepts `type='individual'` (CLI is the interim invite path per Ruling 1.1). Fresh-person branch in `auth.js` left OPEN by design (reachable only via allowlisted sends). No migration — gate activates on the auto-deploy after bank. Local smoke green (unknown→403 no-rows / seeded staff+individual→pass / existing bound→pass / demo routes 200); baseline restored. Deferred: ADV-044 radiogroup micro-slice; Stage Rename sibling slice. **Full arc history**: `docs/arc-history-advisor.md`. |
| **Individual** | **The reference surface — rework underway + persistence build LIVE.** 15 surface files. Tier 1 ✓; Tier 3 contained-structural ✓ (3 paused folds #12 / #63 / #116 closed; CohortView unified-data rewire done — first Individual file reading `src/data/unified/`). Persistence schema RULED A–F; ruling E (deletion / retention) RESOLVED (`4b9d1b5`); **FT AUTHORIZED build**. **Live on remote D1** (`stewardhouse-pilot`, id `8600684c-...`): migrations 0001–0006 applied `--remote`; auth arc (`better-auth` magic-link, email-only, Resend sender) **PROVEN LIVE ON PRODUCTION** end-to-end. **Individual-wiring arc COMPLETE**: `/app` type-dispatcher + `functions/api/me.js` + AppShell / `AppIdentityContext`; `/app/individual` authenticated surface with per-user data isolation (two-instance IntakeProvider), real identity display, gated onboarding, `useBasePath` path isolation (drove the §6.11 full-directory rule). **Persistence writes live**: `POST/GET /api/gifts` (`8bcc00c`; 5-option taxonomy + migration 0006 `192d640`), `/api/intake` (`json_set`), `POST/GET/DELETE /api/scenarios` (snapshot-not-history; `4e17a95` / `4cdf278`). Sign-out live across authenticated surfaces (`c020556`). Marcus un-reconciled to a standalone person row; FT row is a genuine clean slate. **NEXT**: see the **Pilot Honesty Arc (§5.1)** — **P-3c (the consent-reversibility control) is the ONLY remaining Individual item**, and it opens with a scoping pass — four of its five rulings are settled, R3 (active in-app staff notification on a consent change) is FT-directed but feasibility-pending (§5.1). The prior "**P-3** carries the Individual-surface work (`CohortView.jsx:42` Marcus identity bug, `Team.jsx`, `Learn.jsx` advisor block, + the consent-reversibility control)" text was accurate when written and is now **SUPERSEDED**: all three fixture-isolation items SHIPPED 2026-07-20 — `a8d51a9` (CohortView + Home callout, verified live under a real login), `fa836ad` (`useFixtureIsolated()` extraction + Learn advisor block), `bce9044` (Team — every panel gated, authored absent state, nav item hidden). **INDIVIDUAL FIXTURE ISOLATION IS COMPLETE**: a signed-in individual no longer sees another person's cohort, another person's assignments, or another person's grant portfolio and delegates presented as their own. The prior "NEXT: Operations roster UI (demo + live-gated per Ruling 1.1) → invite-creation form on top" text was STALE and is retired (corrected P-0, 2026-07-16): both shipped — O-2 (`a1d13b2`) / O-3 (`2fe0aad`) and `slice-ops-invite-form` (`e3804bd`). **Counsel-gated seams (isolated, non-blocking)**: Clause 3 charitable-retention-floor; Clause 6 subpoena posture — who-gave-to-whom view stays UNBUILT until posture set. **Parked**: account-settings page — **EXCEPT consent reversibility, which is NO LONGER PARKED**: the UI for the existing `POST /api/athlete-consent` mode flip moved into **P-3** (§5.1), because an irreversible one-time choice contradicts the E6 athlete-owns ruling (`athlete-consent.js:45` supports the change; no client calls it after the C-3b interstitial). The REST of the settings pass stays parked. Also parked: geo-selection weighting; AI-drafted org descriptions; Discover design pass. **Full arc history**: `docs/arc-history-individual.md`. |
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
  re-litigated.
- **P-2 BANKED** `d9ee100` (Stage A, migrations 0016+0017) · `6f1b501`
  (Stage B, `PUT /api/athletes/:id` + attendance D7) · `90de25e` (Stage C,
  `enterpriseStats` D2 + FORK 1 denominators) · `5af1340` (Stage D+E, milestone
  editor + FORK 1 disclosure + FORK 3 gift honesty), 2026-07-20. Migrations
  0016 + 0017 applied local **and** `--remote`, parity-verified 2026-07-20
  (see §5 Enterprise row for the verification method).
- **P-3 — INDIVIDUAL FIXTURE ISOLATION COMPLETE; P-3c remains.** Three of the
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
  **P-3c (consent-reversibility control) is the sole P-3 remainder.** Four of
  the five rulings are settled; one is directed but feasibility-pending, so
  P-3c opens with a scoping pass rather than straight to build:
  - **R1 FT-RULED** — the athlete may flip delegated↔self **freely, no staff
    approval** (the E6 athlete-owns ruling; approval-gating would contradict
    ownership).
  - **R2 FT-RULED** — already-recorded delegated milestones **RETAIN FROZEN**
    on a mode flip (consistent with the E3 anonymize-survival invariant).
  - **R4 FT-RULED** — a **standalone consent card**, not an unparked settings
    route.
  - **R5 FT-RULED** — the FORK 1 rate shift on revoke is **ACCEPTED**: the
    athlete leaves the institution-writable denominator
    (`enterpriseStats.js:37`), so live progression rates move without staff
    action. A `RateDisclosure` line must name this.
  - **R3 FT-DIRECTED, FEASIBILITY PENDING** — FT wants an **active in-platform
    (in-app) notification to staff** when an athlete changes record-keeping
    mode: NOT merely the roster Access-column signal, and NOT email unless
    in-app proves impossible. **Whether an in-app notification surface exists
    is UNKNOWN** and must be determined at P-3c scoping; if none exists, the
    build-vs-email-fallback choice is a fresh FT ruling at that point. This is
    a direction, not yet a buildable spec — P-3c starts by scoping it.
- **P-4 / P-5 / P-6** — not started.

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

**Production gate state (migrations re-verified against remote D1 2026-07-20;
gate values verified 2026-07-16 and UNCHANGED — P-2 touched no gate).** All
**17** migrations applied `--remote` (count re-derived from `migrations/`,
`0001`–`0017` contiguous — the prior "All 15" was correct at the time and is
superseded by 0016 + 0017, not corrected). `$.ops.demo_gate=1` on one ops row —
**Operations writes are LIVE**. `$.advisor.demo_gate=0` on all advisor rows and
`$.enterprise.demo_gate=0` on all staff rows — **advisor and enterprise writes
403 in production today**. Re-verify with a read-only aggregate SELECT over
`person` (`json_extract(extensions,'$.<ns>.demo_gate')`), never a value dump.

**Manifest-drift note.** P-0 exists because CLAUDE.md disagreed with `git log`
and production D1 in three places at once (advisor writes "REMAINING" two weeks
after they shipped; Operations "dark" after both activation steps were done;
`me.js`'s own docblock contradicting `me.js:349`). This document is the
operating context for every session — when it drifts, its authority is what is
at risk. Treat state-of-record accuracy as load-bearing, not clerical.

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

Stop background shells (dev server, watch loops) at bank time. Use `TaskStop`,
not `kill`.

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

**Filed: advisor stage-label renaming, blocked on the Q7 allowlist.** P-4 removed
the dead Rename control from `PracticeSettings.jsx` along with the paragraph
above it that instructed the advisor to use it. The stage labels still display;
only the ability to change them is gone, and it was never present. Making it
work is BLOCKED, not merely unbuilt: `practice-profile.js:33` allowlists exactly
`practiceName`, `advisorTitle` and `practiceFocus`, `:14` warns against casual
additions, and `:20-22` defers expansion to the Q7-resolution allowlist upgrade.
Stage renaming therefore depends on that upgrade landing first and cannot be
picked up as an isolated slice. CLAUDE.md §5 already carries a "Stage Rename
sibling slice" as deferred; this names its blocker.

**Filed: `/individual/welcome` CTA falls below the fold on a short viewport.**
Found during the 2026-08-14 device pass, **PRE-EXISTING and not caused by the
tap-target slice**: measured with `minHeight` forced to 0 it reads the same 746
either way. At a 640x642 viewport the CTA bottom sits at 746, i.e. 104px below
the fold, so the first onboarding screen requires a scroll to find its only
action. The other four onboarding screens are clear at the same height (letter
587, privacy 535, questions 401, reveal 517). Short-viewport layout defect on
`Positioning.jsx`; its own slice.

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
- `src/data/unified/README.md` — unified data layer internal notes.

---

## 9. Browser screening runbook — lessons (2026-07-02)

Five hard-earned lessons from a night of failed browser screening attempts (2026-07-02), plus three findings added 2026-07-20 (two session-minting, from P-2 screening; one log-reading, from the §11 auth incident). Any future FT-facing browser screen of an auth-gated surface must respect these:

- **`localhost` vs `127.0.0.1` origin stranding.** `BETTER_AUTH_URL` in `.dev.vars` is `http://localhost:8788`. Better-auth's magic-link verify sets the session cookie on whichever origin served the verify request, then 302-redirects to `BETTER_AUTH_URL`. If FT clicked a link at `127.0.0.1:8788`, the cookie stuck to `127.0.0.1` but the redirect sent her to `localhost:8788` — different origin, no cookie carried, AppShell's `/api/me` returned null, bounce to `/signin`. **Always hand FT URLs on the SAME host as `BETTER_AUTH_URL`.** For local screening: use `localhost:8788` everywhere, never `127.0.0.1:8788`.
- **Resend test sender (`onboarding@resend.dev`) delivers only to the registered address.** Plus-alias variants of the account owner's email (e.g. `talabifaouzi+morgan@gmail.com`) are treated as different addresses and rejected — `POST /api/auth/sign-in/magic-link` returns 500 because the sender throws. **Production invites REQUIRE a verified domain sender** — Resend's test sender is not a viable path for onboarding real pilot users. Verified domain needs to land before the first real invite goes out. **UPDATE (superseded 2026-07-15, invite-email slice):** this caveat is now STALE for the running environments — the verified domain sender has landed. Local `.dev.vars` `FROM_EMAIL=signin@steward-house.org` (a verified `steward-house.org` sender, not `onboarding@resend.dev`), and FT empirically delivered plus-address links on production 2026-07-15, so production is a verified sender too. The exact **production** `FROM_EMAIL` is a Cloudflare Pages dashboard var (NOT in `wrangler.toml`, not repo-readable) — confirm it reads `signin@steward-house.org` there before the first real external invite. (`.dev.vars.example` still shows the old `onboarding@resend.dev` placeholder — a stale template, harmless.) **See §11 (2026-07-20 incident):** production sender config lives in the Cloudflare Pages dashboard, is NOT repo-readable, and **drifts silently** — `RESEND_API_KEY` there fell out of sync with the active Resend key and took production sign-in down for ~5 days with no signal. A green local `.dev.vars` proves nothing about production.
- **Hand-forged cookies fail in the browser even when curl accepts them.** Better-auth sets `HttpOnly` + `SameSite=Lax` + secure-when-https attributes. DevTools cookie paste bypasses those attributes; more commonly, DevTools re-encodes `%2F`/`%3D` in the pasted value (turning `%2F` into `%252F`), and the pasted-in domain (`localhost` vs `127.0.0.1`) rarely matches the origin FT actually browses. **Never hand FT raw cookie values. Use either the real magic-link flow (email) or code-path-minted verification-row URLs.** Cookie surgery is a curl-only tool.
- **Single-type identity means FT's real email always lands as an individual.** Ruled 2026-07-02: one `auth_user` → one `person` → exactly one `type`. FT's real gmail (`talabifaouzi@gmail.com`) is bound to Marcus's `person` row with `type='individual'`. **[EXAMPLE STALE, RULE INTACT — corrected 2026-07-20.** The Marcus binding no longer holds on production: verified read-only against remote D1, Marcus's `person` row is **UNCLAIMED** (`auth_user_id` NULL, no `invite_email` — nobody can sign in as it) and FT holds **three** separate claimed `type='individual'` rows. §5's Individual row already recorded this ("Marcus un-reconciled to a standalone person row; FT row is a genuine clean slate") — the manifest contradicted itself for four days, and §5 was the correct half. The single-type identity RULE below is UNAFFECTED and still load-bearing; only the binding example was wrong. Operational cost: the stale line nearly sent the P-3a production screen hunting for a non-Marcus test identity that was never needed.]** She cannot sign in as advisor/enterprise on her real account — the (c) hook does not re-fire on sign-in, and RequireType would bounce her from `/app/advisor` regardless. **Test identities for other types MUST use distinct emails**, and for local dev those are plus-addressed variants of FT's real address that route to the same inbox. Every advisor/enterprise/ops test identity is a separate `auth_user` row bound to the correct-typed `person` row.
- **`person.display_name` must be set at invite/designation, not defaulted.** The Chrome header reads `identity.displayName`. On a fresh sign-in where the (c) hook fires the fresh-person branch, `display_name` defaults to the literal string `'New user'`. If a bespoke advisor is provisioned by inserting the `person` row without a real `display_name`, that string will render in the header for FT's screen, and every subsequent screenshot. **Every pre-seeded bespoke-type `person` row must carry a real `display_name` at insert time.** Never rely on the default.
- **Sign a forged session cookie with standard PADDED base64, then `encodeURIComponent`.** Added P-2 screening, 2026-07-20. A cookie signed with base64url-no-pad is rejected — `/api/me` returns null and the surface bounces to `/signin`, with no error distinguishing it from an expired session. Padded base64 + percent-encoding is the working form. This is a curl-only tool and does not change §9's standing rule that hand-forged cookies must never be handed to FT for a browser screen.
- **`storeToken:'hashed'` makes a DB-token magic-link fallback impossible.** Added P-2 screening, 2026-07-20. Better-auth stores a SHA-256 **hash** in `verification.value`, not the plaintext token. Reading that row and rebuilding a `/verify?token=…` URL therefore cannot work — the plaintext exists only in the email that was sent. When a screen needs a real session and email is unavailable, mint the session directly (bullet above); do not budget time for token recovery from D1.
- **In a deployment tail, `POST … - Ok` is NOT the success signal.** Added 2026-07-20. The top-level request line reads `Ok` even when the handler threw; the `(error)` lines beneath it carry the failure. **Absence of those lines is what success looks like.** Full diagnosis procedure — including how the thrown Resend status names the cause — is in **§11**.

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
