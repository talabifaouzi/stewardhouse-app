# Enterprise provisioning runbook

Operating procedure for onboarding an institution and its staff onto the
authenticated Enterprise surface (`/app/enterprise`). Companion to the invite
path (`scripts/seed-invites.mjs`, the Operations invite form) and the enterprise
write arc (see `docs/arc-history-enterprise.md`).

---

## 1. Purpose & premise

Institutions are **bespoke-provisioned**: unlike an individual account (which a
person self-claims from an invite), an institution is a structural entity FT
creates, and its **staff are institution-provisioned** — a staff account is only
useful once it is linked to an institution it operates. That linkage
(`institution` + `institution_contact` rows) has no self-service path and no
runtime write endpoint; it is created deliberately, through this runbook.

The Operations invite form's **Staff** option (`CreateInviteModal.jsx`
`TYPE_OPTIONS`) mints a bare staff `person` row with no institution — that path
is **bootstrap/testing only**. Canonical staff provisioning is this document.

**Operating premise (2026-07-15):** the enterprise write seams (E3 / E6 / E8)
have been reviewed **internally**, with **no external counsel**. The risk
postures below are accepted on that basis and remain documented for a possible
later counsel pass (§5).

---

## 2. Staff-provisioning ruling

> Staff accounts are provisioned by the institution via this runbook. There is
> no staff self-signup. The Operations invite form's Staff path exists for
> bootstrap/testing only.

**AD-facing rationale (one line):** institution-provisioned staff is a
governance feature — the institution controls who represents it.

---

## 3. Procedure

Steps FT runs are shown on `PS>` prompt lines (PowerShell). Steps an agent may
perform (read-only investigation, file prep, local dry-runs) are marked
**[agent-ok]**; every `--remote` write is **[FT-only]** per the account-tied
remote-write protocol.

### (a) Create staff invites — [agent-ok for local prep; FT for --remote]

Invite each staff member as a `type='staff'` person row, via the existing CLI
(`scripts/seed-invites.mjs`, reading `scripts/pilot-invites.json`) or the
Operations invite form. Each writes a claimable `person` row carrying the staff
member's `invite_email`. The invite form additionally sends the notification
email; `seed-invites.mjs` stays silent by ruling.

```
PS> node scripts/seed-invites.mjs --remote      # [FT-only] writes staff person rows to prod
```

### (b) Invitees claim via the live invite email — [external, no command]

Each staff member signs in at `steward-house.org/signin` with their invited
address; the magic-link claim binds their `auth_user` to the pre-seeded staff
`person` row (`auth_user_id` set). The account is now claimable-and-claimed but
still institution-less (empty `/app/enterprise`) until step (c).

### (c) Provision the institution + contacts — [FT-only for --remote]

Fill `scripts/provision-institution.json` (gitignored; copy the committed
`scripts/provision-institution.example.json` template) with the institution
fields and a `contacts` array of the invited staff emails, exactly one with
`is_default_operator: 1`. Then:

```
PS> node scripts/provision-institution.mjs --local     # [agent-ok] dry-run against local D1
PS> node scripts/provision-institution.mjs --remote    # [FT-only] provision on prod
```

The script resolves each contact email to an existing `type='staff'` person row
via `invite_email` (failing loudly if any email has no staff row), then INSERTs
one `institution` row and one `institution_contact` per contact, linking them.
It does **not** touch the designation flag (step e).

### (d) Verify — [agent-ok, read-only]

Confirm the institution and its contacts landed and link to the right people:

```
PS> npx wrangler d1 execute stewardhouse-pilot --remote --command "SELECT i.name, ic.role_title, ic.is_default_operator, p.display_name, p.invite_email FROM institution_contact ic JOIN institution i ON i.id = ic.institution_id JOIN person p ON p.id = ic.person_id WHERE i.name = '<institution name>' ORDER BY ic.is_default_operator DESC"
```

Expect one row per contact, exactly one `is_default_operator = 1`, each
`invite_email` matching an invited staff member.

### (e) Designation — DEFINED, run only for a real institution — [FT-only]

The enterprise write endpoints are gated by `requireGatedEnterprise`
(`type='staff'` AND `extensions.$.enterprise.demo_gate === 1`). Production staff
rows carry **no** gate, so writes 403 until FT designates the operator. This
step mirrors the ops-gate designation shape (`$.ops.demo_gate`); for enterprise
it writes the **distinct** `$.enterprise.demo_gate` namespace:

**PRECONDITION:** do not run designation until the consent-enforcement slice
(roster-add auto-invite, claim/delegation state, pre-claim field lockdown,
claim-checked attendance, AddAthleteModal ruled copy) is banked and deployed.

```
PS> npx wrangler d1 execute stewardhouse-pilot --remote --command "UPDATE person SET extensions = json_set(coalesce(extensions, '{}'), '$.enterprise.demo_gate', json('true')) WHERE invite_email = '<default-operator email>'"
```

**Run only when onboarding a real institution** whose seams (§4) are accepted.
Do not run it for bootstrap/test staff. Designation is per-`person`; designate
each staff operator who should be allowed to write.

---

## 4. Internal seam review

Each seam is quoted from `docs/enterprise-persistence-schema-draft.md:769–790`,
followed by the accepted posture. All three are accepted on **internal review,
no external counsel**.

### E3 — unclaimed-row PII posture

> **E3 unclaimed-row PII posture** — the E11 gate on `athlete` / `athlete_note`
> / `athlete_activity` / `athlete_reflection` write endpoints holds real-athlete
> writes DARK on production until counsel clears whether an unclaimed athlete
> row (real name + email of a non-signing party) is "personal data" under the
> applicable regimes.

**Posture — accepted with mitigations.** (1) The gate is designation-only:
athlete writes stay 403 until FT sets `$.enterprise.demo_gate` on the specific
operator (§3e), so nothing goes live by default. (2) Anonymize-to-stub is proven
(`DELETE /api/athletes/:id`, E-Write-2): departing-athlete PII is removed while
class/sport cohort tallies survive. (3) Athlete data leaves with the athlete —
`athlete_reflection` and children `ON DELETE CASCADE` from `athlete`.
*Accepted by FT ruling, internal review, no external counsel — 2026-07-15.*

### E6 — pre-claim reflection consent

> **E6 pre-claim reflection consent** — the endpoint-layer program-level consent
> language ships as caution copy at seed / roster-add time. Counsel confirms the
> exact language before real athletes are onboarded.

**Posture — consent model RULED (FT, 2026-07-15).** Consent model: adding an
athlete triggers an immediate invitation email; the staff member is responsible
for telling the athlete it is coming and why. Until the athlete accepts, their
record holds name and email only — no other information can be added by anyone.
At claim, the athlete chooses to manage their account themselves or to delegate
management to institution staff. Athlete data belongs to the athlete and leaves
with them.

Roster-add copy (exact, FT-ruled):

> Adding an athlete sends them an invitation right away — give them a heads-up
> that it's coming and why. Until they accept, their record holds only name and
> email; nothing else can be added. When they claim their account they choose:
> manage it themselves, or authorize you to manage it for them. Either way it's
> theirs, and it leaves with them.

**Enforcement status — NOT YET IMPLEMENTED.** As of this commit the build does
NOT yet implement this model: roster-add sends no email; `POST /api/athletes`
accepts fields beyond name + email pre-claim; attendance writes lack a
claim-state check; and no delegation state exists in the schema. A
consent-enforcement slice is filed and **REQUIRED before activation**.

*Accepted by FT ruling, internal review, no external counsel — 2026-07-15.*

### E8 — connection_detail legal inclusion limits

> **E8 connection_detail legal inclusion limits** — the content convention (name
> + role from public record only) ships in docblock and seed-copy screening;
> counsel confirms whether naming any third party inside institutional exclusion
> records raises disclosure obligations independent of the emit allowlist.

**Posture — accepted.** The content convention stands: `connection_detail` names
third parties by **public-record name and role only**, enforced by docblock
(`functions/api/exclusions.js`) and the field-adjacent caution copy in
`AddExclusionModal`, and never emitted outside the staff-only `/api/me` block
(E8 emit allowlist). *Accepted by FT ruling, internal review, no external
counsel — 2026-07-15.*

---

## 5. Future-review note

These seams remain fully documented (definitions in
`docs/enterprise-persistence-schema-draft.md:769–790`; postures above). Nothing
in this runbook forecloses a later external-counsel pass — a counsel review can
confirm or correct any posture, and the E6 exact language is explicitly held
`[PENDING FT RULING]`. The gate mechanism (`requireGatedEnterprise`) is
unchanged by this runbook; only the operating procedure and risk-acceptance are
recorded here.
