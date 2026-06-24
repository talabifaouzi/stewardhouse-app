# Persistence scoping pass — 5.8 giving flow + pilot arc

## 1. Purpose & status

Persistence scoping pass for the 5.8 giving flow + pilot arc. Read-only
throughout; no source changed. Inherits `docs/5.8-giving-flow-scoping.md`
section 5 (canonical Gift, Scenario, entity sketch) as its opening input.

HEAD at pass open: `98c36be`. Three strands designed together:
(1) D1 + Workers + unified architecture, (2) hosted-auth diligence,
(3) live 4/30 data-protection frame.

Output is THIS doc. NEXT deliverable = a schema draft for FT to rule before
any build. Nothing built yet.

---

## 2. Strand 1 — Architecture (from the read-only survey)

**Green-field finding.** `src/data/unified/` is a PURE BUILD-TIME PROJECTION
over fixtures — no setter, no write path, no observer; recomputed at module
load. `unified.gifts` has ZERO surface readers. No `wrangler` config; no
`functions/` or `workers/` directory; no auth/DB dependencies in
`package.json`. The app is a pure static SPA on Cloudflare Pages. Every
line of D1 + Workers + auth is a NEW layer, not an extension.

**Central architectural implication.** "unified as build-time projection"
and "unified as live account-backed store" are two different things sharing
a name. The live store is a NEW layer BESIDE unified, not an edit to it.

**Open rulings this surfaces** (for the schema draft, FT to rule):

- (a) live-store REPLACES projection vs. COEXISTS for user-authored entities.
- (b) seed-data migration story — do Marcus's 3 build-time seed gifts become
  real rows in the live store, or does the store layer over the projection.
- (c) `sourceSurface: 'individual'` partition semantics once runtime writes
  and build-time seed records share the tag.

**Recipient-FK reality** (refines 5.8): a stable org directory exists ONLY
for the 17 individual-catalog orgs (durable ids); enterprise gifts produce
ZERO Org records (names live in activity-label prose). The canonical Gift's
nullable `recipientOrgId` + denormalized `recipientOrgName` accommodates
this — but "FK to Org" is NOT the common case; write-ins and
enterprise-sourced gifts fall through to name-string only.

**No identity layer exists.** "Current user" is a hardcoded Marcus fixture
import, not an authenticated session. `giverPersonId` assumes a stable
per-donor id that does not exist yet — strand 2 must precede any
persistence beyond local state.

---

## 3. Strand 2 — Auth (diligence; current as of this pass)

**RECOMMENDATION.** `better-auth`, self-hosted in the project's own D1,
magic-link EMAIL-ONLY flow (no SMS), with Cloudflare Email Service as the
send pipe and Resend as the named swappable fallback.

**Rationale.** `better-auth` has first-class D1 support as of its 1.5
release (pass D1 binding directly; uses D1 `batch()` for atomicity since D1
has no interactive transactions). Self-hosting keeps identity records in
the project's own D1 alongside Person / Gift / Scenario — NO third-party
identity custodian (rejected hosted SaaS providers Clerk / Auth0 / Stytch
on custody grounds, not cost; all are free at pilot scale but hold user
identity on their infra, colliding with the data-protection frame and the
no-third-party-custody posture).

**Email-delivery finding.** Cloudflare Email Service (public beta since
2026-04-16) sends transactional email from a Worker binding, auto-configures
SPF / DKIM / DMARC for CF-DNS domains — so the magic-link email sends from
inside the project's own Worker, no third-party email vendor in the
identity path. Pricing: 3,000/mo included on Workers Paid, then ~$0.35/1k.

**Caveats** (carry into build):

- (a) CF Email Service is BETA, not GA — magic-link delivery is
  mission-critical, so abstract the sender behind a swappable interface;
  Resend (GA, 3k/mo free) is the named fallback.
- (b) `better-auth` + D1 + Workers sharp edges: must create ONE
  auth / D1 instance per request at top of middleware (singleton pattern
  silently breaks — D1 binding changes per invocation); session-refresh bug
  (#4203, reopened Jan 2026) — disable `cookieCache`, trade a D1 read per
  session check for correctness.
- (c) 10ms free-tier Worker CPU limit is tight; session-check D1 read needs
  an index from day one (consistent with the schema-first / rows-read
  discipline).

**Rejected alternative.** Roll-your-own `jose` + D1 + KV JWT auth — viable
and maximally lock-in-free, but trades a bounded dependency for an
unbounded security-correctness burden; build-your-own break-even is ~100k
MAU. "Quality over speed" points TO the vetted library here.

**Resolves.** `giverPersonId` becomes an FK from the auth-user table to
Person, both in the project's own D1.

---

## 4. Strand 3 — Data-protection (4/30 frame, now live against the concrete architecture)

**Why not academic.** A gift record (`giverPersonId` → `recipientOrgId` +
amount + cause) for an athlete / creator / public figure can reveal
political / religious / cause alignment + net-worth signal. Whose giving is
stored changes the stakes. Frame question: if a hostile actor (journalist,
subpoena, breach, politically-motivated request) reaches this data, what is
exposed.

**Layer 1 — data architecture.** Two properties already locked: no
third-party identity custodian (self-hosted auth), and no
transaction / settlement / money-movement data (Parker's no-lifecycle-field
rule means the schema CANNOT leak settlement data). Frame ADDS three
schema constraints:

- (i) giver identity SEPARABLE from giving data — gifts keyed by opaque
  person-id resolvable only via the auth-table join, making that join the
  guarded chokepoint;
- (ii) recipient + cause linkage is the SENSITIVE payload (not amount) —
  tightest handling;
- (iii) email now lives in two systems (`better-auth` user table + CF Email
  send logs) — name it.

**Layer 2 — legal (DEREK IS NOW CRITICAL-PATH).** Three questions live the
moment real user data is stored:

- (a) PBC + captive 501(c)(3): who is the data controller when the
  for-profit stores donor data and the foundation arm is separate;
- (b) regime scope — giving data touching cause / religion / politics is
  "special category" under GDPR + post-2024 US state acts; which bind at
  pilot;
- (c) subpoena / legal-process posture — what can be compelled, what the
  privacy policy commits to telling the user, decided BEFORE storing data
  because it can change a Layer 1 architecture decision.

NOTE: scoping-for-Derek, not legal advice; these are questions to scope,
not answers.

**Layer 3 — operations.** Magic-link removes the password-breach +
credential-stuffing surface (a strand-2 win) but makes the email inbox the
account-takeover single point — conscious acceptance. `better-auth` sharp
edges are also security items (session bug = security event). D1 production
access logged + minimal from day one. D1 Time Travel (30-day restore) is a
privacy surface — deleted user data persists in restore points; deletion
commitment must account for it.

**Layer 4 — governance.** The 10%-gross commitment + no-third-party-ad
posture already answer the biggest governance question (no data
monetization, in the operating agreement). Frame adds: a
retention / deletion policy must exist BEFORE pilot — soft vs hard delete,
what "delete my account" does to gift rows, kept compatible with Parker's
no-status-field rule (a deletable Gift must not reintroduce a lifecycle
field by the back door). Individual-pushes-consent extends to data: user
can see + control everything stored about them.

---

## 5. Folded-item resolutions (the gated items, resolved by the pass)

- **`intake-gifts-join`:** YES (5.8 ruling) — GiveScreen writes feed the
  live store.
- **`individualProfile`-raw-vs-unified:** resolves toward
  UNIFIED-AS-LIVE-STORE. The account-backed Person record IS the user
  identity; `individualProfile` becomes demo-user seed data, not a parallel
  truth.
- **CohortMemberContext / 5.7:** still gated on the live-store ruling
  (strand 1 ruling (a)); revisit once that lands.
- **ID-namespacing in IntakeContext writes:** folds into strand 1 ruling
  (c) `sourceSurface` partition semantics.

---

## 6. What the schema draft must carry (next deliverable, FT rules before any build)

- **Identity ↔ gift separation** (Layer 1): gifts keyed through an opaque
  person-id; auth-table join as guarded chokepoint; recipient / cause as
  tightest-handled payload.
- **Deletion / retention model** (Layer 4): soft vs hard delete;
  account-delete effect on gift rows; D1 Time-Travel interaction;
  compatible with Parker's no-lifecycle-field rule.
- **Seed-migration seam** (strand 1 (b) + the no-identity-layer finding in strand 1): Marcus-the-fixture
  becomes Marcus-the-FIRST-real-account — designed THROUGH the privacy
  architecture, not as a demo bypass.
- The **three strand-1 open rulings** (live-store replace-vs-coexist, seed
  migration, `sourceSurface` partition).
- **Auth-user ↔ Person FK shape** (strand 2).

---

## 7. Critical-path flag (for FT, not the schema)

Derek advanced from parked to CRITICAL-PATH. The Layer-2 questions
(controller identity, regime scope, subpoena posture) should be in front of
him BEFORE the persistence BUILD starts — scoping can continue in parallel,
but a legal answer on subpoena posture could change a Layer-1 architecture
decision. FT's own note said "possibly advance in parallel"; the pass
finding is: do.
