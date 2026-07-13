# Operations Roster — scoping & rulings

Home for the Operations roster arc (Ruling 1.1 + the FT-confirmed scoping
rulings). Created 2026-07-13 during slice O-1 so that **Ruling 1.1 stops being
referenced-but-undefined** — prior to this it was cross-referenced in
`docs/arc-history-individual.md` ("(7) NEXT — Operations roster UI (both demo
and live-gated modes per Ruling 1.1)") and in `CLAUDE.md`, but never stated.

---

## Ruling 1.1 (FT-confirmed 2026-07-13, reconstructed from cross-references)

> **The Operations roster renders in two modes:**
> - **demonstrative** — fixture / synthetic data, demo-labeled per the §7
>   "Demonstrative vs LIVE honesty boundary"; and
> - **live-gated** — real D1 `person` rows, shown to an authenticated
>   Operations user only.
>
> Synthetic-derived rows carry the demonstrative caveat; only genuinely live
> rows carry LIVE framing.

The "1.1" numbering came from a ruling set captured only by cross-reference;
this is the definition FT confirmed when the roster scoping was reviewed.

---

## Roster scoping rulings (FT-confirmed 2026-07-13)

- **Q1 — Ruling 1.1 = two-mode** (demonstrative + live-gated), as above.
- **Q2 — Roster is a NEW view spanning all four types** (`individual` /
  `advisor` / `staff` / `ops`) — a unified account/invite list, NOT a reframe
  of the existing Individuals directory.
- **Q3 — The authenticated tree mounts the FULL Operations surface**
  (Overview + 4 directories + the roster when it lands), not a roster-only page.
- **Q4 — Live read via a dedicated `GET /api/roster`** (built in O-3, not O-1);
  not an `/api/me` block.
- **Q5 — Read gated by `RequireType type="ops"` alone** (ops accounts are
  inherently FT-exclusive: the auth claim hook only mints `individual`, and
  `seed-invites.mjs` is the only path that mints `ops`). The FUTURE invite
  **WRITE** goes behind a `$.ops.demo_gate` twin (advisor/enterprise pattern).
- **Q6 — Full-fidelity operator view, no redaction** (real names, emails,
  invite/bound status). **Condition (docblock this): valid only while `ops`
  is FT exclusively.** If ops accounts are ever provisioned beyond FT, the
  redaction posture must be revisited before that provisioning lands.
- **Q7 — Demo-mode roster = the local seed identities** (the `person` rows the
  migrations seed: Marcus, Jordan, Morgan, Reese, Diane, Faouzi-staff).

---

## Slice split

- **O-1 — Authenticated Operations tree (routing only).** `AppDispatcher`
  `type==='ops'` branch → `/app/operations`; `/app/operations` route mounts the
  full Operations surface behind `RequireType type="ops"`; Chrome identity swap
  (real display name on the auth tree, `CURRENT_OPS_USER` fixture only on demo).
  **No roster view, no endpoint, no data change.** Mirrors the advisor
  routing-only precedent (`ce6d8be`). Interim state (deliberate, per the
  enterprise-4a precedent): the authenticated ops user sees FIXTURE data
  everywhere until O-2/O-3 land — §7 requires the ROSTER view to be honest
  when it lands, not this slice to isolate everything.
- **O-1 follow-up — `/operations/` path-fix.** The §6.11 full-directory audit
  found **45 hardcoded `/operations/` sites across 9 files** (advisor-scale).
  Deferred to its own slice via a shared `useBasePath('/operations',
  '/app/operations')`, exactly as the advisor path-fix followed its routing
  slice. Until it lands, nav/drill links on `/app/operations` misroute to the
  public `/operations` demo tree.
- **O-2 — Roster READ, demonstrative mode.** The new roster view (all four
  types), demo data, §7 demo-labeled.
- **O-3 — Roster READ, live-gated mode.** `GET /api/roster` (Q4), gated to
  `type='ops'` (Q5); the authenticated roster reads real D1 `person` rows,
  LIVE-framed.
- **(Future, separate arc) — Invite-creation form.** Gated `POST` writing the
  `seed-invites.mjs` `person` row shape + `$.ops.demo_gate` write-gate; the
  roster's "Create invite" affordance. Sequenced after O-3 per FT.
