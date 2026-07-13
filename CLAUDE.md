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
| **Operations Overview** | **Complete and QA'd.** Overview ships 8 redesign slices (A–H, 2026-06); QA audit on branch `qa-audit-operations` (53 findings + 3 amendments = 56 total, doc at `docs/qa-audit-operations-2026-06-09.md`; **branch unmerged** by design). Fix bundles 1 (a11y highs QA-015–018), 2 (copy + structure QA-001/002/024/054 + lows 025–029), 3 (`801123a` — decision-free fixes QA-003/007/008/020/022/031/037–039/042/043/052, incl. deletion of the dead `UserList` stub), and 4 (`20354cc` — code quality QA-032/033/034/044/046/048/050/053, the `ExpandableRow` extraction, two QA-048 resolvers, three new tokens, and the Mission→Progression internal renames) banked. **Route-pages arc complete** (5 slices, 2026-06): slice 1 deleted the `health` tab + route stub, added Organizations to the nav, wired composition tiles as drills; slices 2–5 shipped live directory pages at `/operations/{individuals,institutions,advisors,organizations}` (77 / 4 / 7 / 17 records, all fixture-faithful with live-derived count headers). **Detail-routes arc complete** (6 slices + Candid interleave, 2026-06): per-record detail routes at `/operations/{dir}/:id` for all four entities — slice 1 (`2d1cf1c` — Institution detail, routing skeleton), 2 (`d327080` — AdvisorPractice detail), 3 (`abe5141` — Organization detail), 4 (`760af13` — Individual detail, type-aware: full view for `type='individual'`, light view for staff/advisor), Candid interleave (`3b7da48` — Organization detail restructured to the GuideStar/Candid profile flow: `foundedYear` literals added to `orgsData.js`, cause label "Economic" → "Economic Mobility" in `intakeData.js`, Person.causes normalized to a string-ID array in `adapters/individual.js`), 5 (`dacde68` — URL-filter state on all four directories: `q` debounced / `source` / `cat` / `causes` / `ids`-override, URL as source of truth, `replace` writes), and 6 (`743de6a` — drill wiring: rows clickable with filter persistence via `location.state.fromQuery`, shared `<AboutLine>` on Issue/Activity expand panels, pre-plan-clients drill behind a build-time derivation gate, ALL FOUR pilot tiles documented-unlinked by founder ruling with per-tile unlock conditions in code) banked. Chrome pattern across detail pages: `<BackLink>` with explicit `to` + `location.state.fromQuery` preservation, shared `<NotFoundCard>` for invalid IDs, dotted-bronze cross-links. **Fix bundle 5** (`e1e3600`) — founder visual cluster: QA-004 (Operations persona wired to `CURRENT_OPS_USER` in new `data/opsFixtures.js`); QA-014 reading A (activity-row chip drops border + adds `cursor:default`, surface accent moves from border to chip text color); QA-021 (muted text inside the Open issues tint card swapped to `--sh-text-secondary` — both the IssueRow meta line and the "Per-issue detail view coming soon." footnote — contrast moves from ~3.46:1 to ~8:1 against `--sh-bg-tint`); QA-030 ruling b1 (`SURFACE_COLORS.Operations` swapped from `--sh-bronze` to `--sh-text-secondary` — Operations now reads quiet internal, distinct from Advisor's bronze). Wontfix per founder ruling: QA-011 (no new funnel footnote, consistent with the pilot-tile decision), QA-013 (SuiteRow copy-to-clipboard defer until attention-state fires), QA-040 (asymmetric `<main>` padding by design), QA-045 (date-helper overlap acceptable per audit), QA-051 (no React.memo at current scale), QA-035 (bronze progression bars on tint track — editorial restraint, 3:1 non-text contrast met), QA-036 (expand-panel prominence asymmetry — intentional: Open issues is the higher-priority attention signal). **Audit posture: 55 of 56 findings resolved**; remaining 1 — QA-023 blocked on a future CR-level filtered view. **Operations roster arc OPENED (Ruling 1.1 confirmed, scoping at `docs/operations-roster-scoping.md`).** **O-1 authenticated routing SHIPPED** (`slice-ops-routing`): `AppDispatcher` `type==='ops'` branch → `/app/operations`; `/app/operations` route mounts the FULL Operations surface behind `RequireType type="ops"` (Q5 — read gated by type alone; ops accounts are FT-exclusive); Chrome identity swap (real `displayName` on the auth tree, `CURRENT_OPS_USER` fixture only on demo; `userRole` null on auth until an ops `/api/me` block exists). **Routing only** — mirrors the advisor `ce6d8be` precedent. **Interim state (deliberate, enterprise-4a precedent):** the authenticated ops user sees FIXTURE data everywhere (Overview + directories) until O-2/O-3 land — §7 requires the ROSTER view to be honest when it lands, not this slice to isolate everything. **§6.11 path audit: 45 hardcoded `/operations/` sites across 9 files (advisor-scale) — DEFERRED to an O-1 follow-up path-fix slice** (shared `useBasePath('/operations','/app/operations')`), exactly as advisor's path-fix followed its routing slice; until it lands, nav/drill links on `/app/operations` misroute to the public `/operations` demo tree. **NEXT:** O-1 path-fix → O-2 (roster READ, demonstrative mode, all four types per Q2) → O-3 (`GET /api/roster` live-gated read, Q4) → invite-creation form (future, `$.ops.demo_gate` write-gate per Q5). |
| **Enterprise** | **Built and audited; depth arc COMPLETE.** All 6 sections live (Overview, Roster, Program, Compliance, Reports + 5 sub-pages, Setup wizard). 157-finding QA audit (9 Critical + 33 High + 60 Medium + 55 Low) on unmerged `qa-audit-enterprise` branch (`docs/qa-audit-enterprise-2026-05-30.md`). Audit posture: **156 of 157 dispositioned** — 9 Critical + 32 High shipped; all Mediums/Lows resolved across Sweeps 1–4 + Clusters I–IX + the 4-pattern not-a-finding taxonomy. **Only open item: #12** (Tag `warning` palette — deferred High, paused-Individual-gated; closes when Individual unpauses). Fixture dates uniformly shifted −192d (`7998c7d`). Enterprise does NOT use Advisor's numbered-bundle model. **Authenticated build LIVE**: `/app/enterprise` routing + staff-type dispatch (4a/4b), `/api/me` staff block + endowment (5a/6b), Chrome identity swap + staff test identity 0011 (5b), full fixture isolation on the auth tree (6a/6b — computeStats/AthletesProvider + empty states + CohortComparison gate). **Write arc OPEN**: E-Write-1 roster-add shipped — `requireGatedEnterprise` (E11 twin), `POST /api/athletes` (institution-scoped, E6 consent-required + `consent_acknowledged_at` migration 0012, E8 notes caution, E10 badge), `/api/me` roster emission + `AthletesProvider.add()` write-through, Roster CTA + `AddAthleteModal` (+ FT-screen fix `f8a235b`: gate error surfaced in-form via `writeError`, Position field dropped). **E-Write-2 anonymize-to-stub shipped** — `DELETE /api/athletes/:id` (E3 override): explicit delete of the 4 athlete-child tables + stub UPDATE (`name='redacted'`, class+sport retained, all else NULL/0/`Sunset`, `person_id` + `consent_acknowledged_at` NULL) as ONE `env.DB.batch()` implicit transaction; `/api/me` roster excludes `Sunset` stubs (E9-snapshot residue only); `AthletesProvider.remove()` + `AthleteProfile` "Remove from roster" → nested confirm modal; idempotent re-DELETE, id+institution scope with identical 404. Gate stays DARK on production (local-smoke-only; Faouzi `04…0002` the designated test identity) until E3/E6/E8 counsel clears. **E-Write-3a workshop-create shipped** — `POST /api/workshops` (create-only; institution-scoped from session, `facilitator_person_id` NULL per Q2 E4-deferred, `status` staff-set from enum with server default `scheduled`, `title`+`date` required, `date` validated YYYY-MM-DD for the NOT-NULL column + calendar parse); shared `WORKSHOP_ELEMENT_COLUMNS`/`toWorkshopElement` (element always carries `attendance:[]` + `followUps:[]` so `WorkshopDetail` never reads undefined; `facilitator:null` in 3a); `/api/me` staff block emits `enterprise.workshops` ORDER BY date with nested `attendance[]` (Q7 documented debt: revisit to per-workshop fetch when a real institution's payload is measurable); new `WorkshopsContext` (fold-in + `add()` write-through, date-sorted splice) mounted beside `AthletesProvider`; `EnterpriseProgram` rewired off the fixture import to `useWorkshops()` (demo tree byte-identical via the provider's fixture default) + "Schedule workshop" affordance → `ScheduleWorkshopModal` (AddAthleteModal idiom, no consent line — workshops are institution records). No workshop delete/edit (Q6); `workshop_followup` out of scope (Q5); zero E9/snapshot obligations. **E-Write-3b workshop-attendance upsert shipped** — `PUT /api/workshops/:id/attendance` (first two-level nested route `workshops/[id]/attendance.js`; first `ON CONFLICT DO UPDATE` upsert in the repo, composite PK `(workshop_id, athlete_id)`): full-roster batch `{ records:[{athleteId, attended, note?}] }` (Q3, one record per active athlete, attended default false), dual-transitive scope (workshop institution-scoped 404 + single IN query validating every athleteId is on the institution roster AND `enrollment_status != 'Sunset'` per Q4, **reject-whole-batch** — one atomic multi-row statement, no partial write), Q5 no note caution, Q6 returns full updated element; `WorkshopsProvider.updateAttendance` wholesale-replace write-through; `WorkshopDetail` read-render re-keyed on `attendance.length` (Q2, no implicit status flip — demo-parity-safe via fixture `completed⟺rows` equivalence) + auth-only edit mode (per-athlete toggle+note, empty-roster guard, `writeError` in-form). **E-Write-4 compliance writes shipped** — `POST /api/exclusions` (create; institution-scoped, `flagged_at` server-set; `connection_detail` free text with NO server validation per E8/Q4, field-adjacent caution copy in `AddExclusionModal`) + `DELETE /api/exclusions/:id` (Q1 hard-delete, no edit); **Q2 auto-log** — each exclusion add/remove writes its `compliance_audit` row inside the SAME `env.DB.batch()` (atomic; action + target frozen, `user_role` denormalized from `institution_contact.role_title` at write time via shared `functions/_lib/audit.js`); `POST /api/compliance-audit` for MANUAL entries (Q3 append-only — exports ONLY `onRequestPost`, CF auto-405s PUT/DELETE, E7 docblock; no edit/delete/updated_at); `/api/me` emits `enterprise.exclusions` + `enterprise.complianceAudit` (staff-only — `connection_detail` never-emit elsewhere per E8; audit newest-first, author display resolved via person leftJoin, `user_role` NOT re-derived); new `ComplianceProvider` (one context, both arrays, add/remove/addAudit write-through splicing the auto-logged audit row without refetch); `EnterpriseCompliance` rewired off withheld-fixtures to the provider (demo tree byte-identical incl. its session-edit overlay) + auth-only "Add exclusion" / "Record entry" affordances and `ExclusionDetail` remove-confirm (E-Write-2 idiom). **E-Write-5 cohort snapshot shipped** — migration **0013** (`dollars_moved` + `avg_weekly_engagement` → NULLABLE via the SQLite table-rebuild; local-applied, **remote rides the bank**); `POST /api/snapshots` (Q5 — derives the six sourced aggregates server-side from live D1 at snapshot time: athletes_count non-Sunset, gps/cert counts+rates, attendance_rate through workshop join, gifts_count = SUM(athlete.gifts_count) soft counter; the two unsourced write **NULL** = "not tracked", never 0/staff-entered; zero-athlete guard → rate 0 on NOT-NULL rate columns; integer-percent representation matches the fixture) + `DELETE /api/snapshots/:id` (Q7 delete-and-re-snapshot); `/api/me` emits `enterprise.snapshots` (newest-first); `SnapshotsProvider` fold-in (fixture default `[current, prior]`); **`CohortComparison` rewired off fixtures onto `useSnapshots()` + `useAthletes()`** (Q8 — 0 → gate panel, 1 → single-cohort view, ≥2 → year-over-year of the two most recent; NULL → "Not tracked"; demo byte-identical) + auth-only "Record period snapshot" / per-snapshot delete-confirm. **E3 survival proven in smoke: anonymizing an athlete leaves already-taken snapshots byte-identical** (frozen aggregates, the arc's capstone invariant). **ENTERPRISE WRITE ARC COMPLETE** — roster-add · anonymize · workshop-create · attendance · compliance (exclusions+audit) · cohort-snapshot, all gated dark on production pending E3/E6/E8 counsel. **NEXT** (post-arc queue): enterprise routing follow-ups / invite runbook (per the standing list); production activation waits on counsel-clear + a designated gated identity. Scoping: `docs/enterprise-persistence-scoping.md` + `docs/enterprise-persistence-schema-draft.md`. **Full arc history** (every Critical/High commit, Sweeps 1–4, Cluster I–IX detail, the not-a-finding taxonomy): `docs/arc-history-enterprise.md`. |
| **Advisor** | **Built and audited; QA arc COMPLETE** (audit + 12 fix bundles + tail triage). 8-section IA; all 9 clients seeded. 41-finding audit on unmerged `qa-audit-advisor` branch (`docs/qa-audit-advisor-2026-06-13.md`); 33 of 42 dispositioned. **Advisor persistence arc CLOSED** (`9736096` — FT acceptance walk, real email flow both environments, prod open-signup finding, 2026-07-07): routing ✓, path-fix ✓ (§6.11, 48 sites / 13 files), scoping ✓ (12 rulings), schema ✓ (migration 0007), slim seed ✓ (0008), authenticated reads ✓ (slice 1 `7ca21e9`), fixture isolation ✓ (slice 2 `8c3e4f7`), `RequireType` type-guard ✓ (`e8683f3`). **Single-type identity RULED PERMANENT** (FT 2026-07-02). **REMAINING**: write endpoints (gated per §6 role gate; Q7 processor-vs-joint-controller counsel-gated) + provider write-through to reach Individual's read+write parity. **RESOLVED — production signup invite-gated** (slice `slice-invite-gate`, this session): pre-send allowlist (b2) in `functions/api/auth/[[route]].js` intercepts `POST /api/auth/sign-in/magic-link` before better-auth engages — unknown email (no `auth_user` AND no matching `person.invite_email`) → 403 `{code:'new_user_signup_disabled'}`, NO link sent / verification row / `auth_user` created; existing account OR invited (pre-seeded `invite_email`) → passes through unchanged. `person.invite_email` is the single source of truth (same key the claim hook reads). `SignIn.jsx` renders the existing "Sign-up is not currently open for this address." copy on the 403. `seed-invites.mjs` now accepts `type='individual'` (CLI is the interim invite path per Ruling 1.1). Fresh-person branch in `auth.js` left OPEN by design (reachable only via allowlisted sends). No migration — gate activates on the auto-deploy after bank. Local smoke green (unknown→403 no-rows / seeded staff+individual→pass / existing bound→pass / demo routes 200); baseline restored. Deferred: ADV-044 radiogroup micro-slice; Stage Rename sibling slice. **Full arc history**: `docs/arc-history-advisor.md`. |
| **Individual** | **The reference surface — rework underway + persistence build LIVE.** 15 surface files. Tier 1 ✓; Tier 3 contained-structural ✓ (3 paused folds #12 / #63 / #116 closed; CohortView unified-data rewire done — first Individual file reading `src/data/unified/`). Persistence schema RULED A–F; ruling E (deletion / retention) RESOLVED (`4b9d1b5`); **FT AUTHORIZED build**. **Live on remote D1** (`stewardhouse-pilot`, id `8600684c-...`): migrations 0001–0006 applied `--remote`; auth arc (`better-auth` magic-link, email-only, Resend sender) **PROVEN LIVE ON PRODUCTION** end-to-end. **Individual-wiring arc COMPLETE**: `/app` type-dispatcher + `functions/api/me.js` + AppShell / `AppIdentityContext`; `/app/individual` authenticated surface with per-user data isolation (two-instance IntakeProvider), real identity display, gated onboarding, `useBasePath` path isolation (drove the §6.11 full-directory rule). **Persistence writes live**: `POST/GET /api/gifts` (`8bcc00c`; 5-option taxonomy + migration 0006 `192d640`), `/api/intake` (`json_set`), `POST/GET/DELETE /api/scenarios` (snapshot-not-history; `4e17a95` / `4cdf278`). Sign-out live across authenticated surfaces (`c020556`). Marcus un-reconciled to a standalone person row; FT row is a genuine clean slate. **NEXT**: Operations roster UI (demo + live-gated per Ruling 1.1) → invite-creation form on top. **Counsel-gated seams (isolated, non-blocking)**: Clause 3 charitable-retention-floor; Clause 6 subpoena posture — who-gave-to-whom view stays UNBUILT until posture set. **Parked**: account-settings page; geo-selection weighting; AI-drafted org descriptions; Discover design pass. **Full arc history**: `docs/arc-history-individual.md`. |
| **Landing** | Single file; public entry. |

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
    annotation in §5 (Individual row).
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
    fix; the paired deploy is the other half.
13. **Bank rule (agent-prompt-discipline rule).** Agent prints `git diff`
    + exact proposed commit message and waits for FT "Option 1 yes"
    before any commit — diff + message, always.

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
narrative is org-authored or imported (Candid API integration is future).
Organizations are referenced entities, not platform users — the unclaimed
tier of the content-sourcing model; org records appear as discovery-catalog
entries, gift targets, and connection destinations, and the Operations
Organizations directory is the operator view of those records.

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
- `src/data/unified/README.md` — unified data layer internal notes.

---

## 9. Browser screening runbook — lessons (2026-07-02)

Five hard-earned lessons from a night of failed browser screening attempts. Any future FT-facing browser screen of an auth-gated surface must respect these:

- **`localhost` vs `127.0.0.1` origin stranding.** `BETTER_AUTH_URL` in `.dev.vars` is `http://localhost:8788`. Better-auth's magic-link verify sets the session cookie on whichever origin served the verify request, then 302-redirects to `BETTER_AUTH_URL`. If FT clicked a link at `127.0.0.1:8788`, the cookie stuck to `127.0.0.1` but the redirect sent her to `localhost:8788` — different origin, no cookie carried, AppShell's `/api/me` returned null, bounce to `/signin`. **Always hand FT URLs on the SAME host as `BETTER_AUTH_URL`.** For local screening: use `localhost:8788` everywhere, never `127.0.0.1:8788`.
- **Resend test sender (`onboarding@resend.dev`) delivers only to the registered address.** Plus-alias variants of the account owner's email (e.g. `talabifaouzi+morgan@gmail.com`) are treated as different addresses and rejected — `POST /api/auth/sign-in/magic-link` returns 500 because the sender throws. **Production invites REQUIRE a verified domain sender** — Resend's test sender is not a viable path for onboarding real pilot users. Verified domain needs to land before the first real invite goes out.
- **Hand-forged cookies fail in the browser even when curl accepts them.** Better-auth sets `HttpOnly` + `SameSite=Lax` + secure-when-https attributes. DevTools cookie paste bypasses those attributes; more commonly, DevTools re-encodes `%2F`/`%3D` in the pasted value (turning `%2F` into `%252F`), and the pasted-in domain (`localhost` vs `127.0.0.1`) rarely matches the origin FT actually browses. **Never hand FT raw cookie values. Use either the real magic-link flow (email) or code-path-minted verification-row URLs.** Cookie surgery is a curl-only tool.
- **Single-type identity means FT's real email always lands as an individual.** Ruled 2026-07-02: one `auth_user` → one `person` → exactly one `type`. FT's real gmail (`talabifaouzi@gmail.com`) is bound to Marcus's `person` row with `type='individual'`. She cannot sign in as advisor/enterprise on her real account — the (c) hook does not re-fire on sign-in, and RequireType would bounce her from `/app/advisor` regardless. **Test identities for other types MUST use distinct emails**, and for local dev those are plus-addressed variants of FT's real address that route to the same inbox. Every advisor/enterprise/ops test identity is a separate `auth_user` row bound to the correct-typed `person` row.
- **`person.display_name` must be set at invite/designation, not defaulted.** The Chrome header reads `identity.displayName`. On a fresh sign-in where the (c) hook fires the fresh-person branch, `display_name` defaults to the literal string `'New user'`. If a bespoke advisor is provisioned by inserting the `person` row without a real `display_name`, that string will render in the header for FT's screen, and every subsequent screenshot. **Every pre-seeded bespoke-type `person` row must carry a real `display_name` at insert time.** Never rely on the default.

---

## When in doubt

Ask. Don't assume. Path B violations, brand-token deviations, and Co-Authored-By
footers are non-negotiable.
