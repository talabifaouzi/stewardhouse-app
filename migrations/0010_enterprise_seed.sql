-- Migration 0010 — Enterprise seed (SLIM SCOPE, Option C).
--
-- FT ruling on scope (schema-draft §7 SIGNED OFF at 4672899):
-- ONBOARDING (slim). Zero athlete rows in seed. Real athletes enter D1
-- exclusively through the gated roster-add write path when wire-surfaces
-- lands, exercising the E11 gate + E8 content convention + E6 consent
-- copy as designed. Fixture athletes stay in fixture files
-- (src/data/enterpriseFixtures.js) powering the public /enterprise/*
-- demo mount unchanged. Highest-PII-tier content never enters D1 as
-- fictional filler (advisor slim-seed precedent).
--
-- FT ruling on persona reconciliation (schema-draft §7 SIGNED OFF):
-- Option C. Diane Okonkwo added fresh as the enterprise operator with
-- is_default_operator=1; Jordan Avery stays as a residual 0005 staff
-- person referenced by a second institution_contact row; Morgan Walker
-- (existing 0005 advisor person) referenced by a third
-- institution_contact row per E4 (cross-role identity; that reference
-- grants ZERO enterprise capability — enforced by
-- RequireType('staff') at the /app/enterprise route + E11 gate on
-- write endpoints).
--
-- Content scope:
--   (a) INSERT Diane Okonkwo person row (fresh, type='staff'). invite_email
--       uses the 0005 RFC 2606 .invalid TLD pattern so this row can never
--       be accidentally claimed by a real sign-in until Diane's real
--       invite is issued through the wire-surfaces slice.
--   (b) INSERT 1 institution row (Cooper State University Athletic
--       Department). Values from src/data/enterpriseFixtures.js
--       INST_PROFILES[0] + endowmentSnapshot.
--   (c) INSERT 3 institution_contact rows (Diane operator, Jordan
--       Program Admin residual, Morgan Facilitator per E4). role_title
--       values follow the schema-draft §7 Option-C sketch.
--
-- Content NOT in scope (per §7 slim ruling):
--   - Zero athlete rows.
--   - Zero athlete_activity / athlete_note / athlete_reflection rows.
--   - Zero workshop rows (fixture 'facilitator' name-string
--     resolution + workshop_attendance seed would require real athlete
--     rows to attach — deferred to write path).
--   - Zero workshop_followup rows.
--   - Zero exclusion rows (§7 called for a seed-copy screen at seed
--     time to enforce E8 content convention; deferred to when
--     exclusion write path lands, exercising the copy screen as
--     designed).
--   - Zero compliance_audit rows (append-only per E7; entries land
--     through the endpoint when real actions occur).
--   - Zero cohort_period_snapshot rows (aggregates-only per E9; land
--     when the first program period is snapshotted).
--
-- Determinism (matches 0002 / 0008 convention):
--   - All UUIDs are pre-computed literals (04000000-... namespace for
--     enterprise-seed rows to avoid collision with 0002's 01000000-...,
--     0005's 02000000-..., and 0008's 03000000-...). No randomblob().
--   - Migration-timestamp for created_at / updated_at:
--     '2026-07-07T00:00:00.000Z'.
--   - Re-apply produces identical state.
--
-- SQL-escape surface (audited, exhaustive):
--   - Zero apostrophes in any inserted string value. Verified against
--     every literal below (Diane Okonkwo, Cooper State University,
--     Athletic Department, Season Residency, Revenue Sports Package,
--     Senior Director Athletic Development, Program Admin,
--     Facilitator, extension JSON contents).
--   - Zero double quotes inside SQL string literals (JSON extensions
--     use double quotes but wrapped as SQLite string literal — no
--     escape needed for double quotes inside single-quoted SQL string).
--   - UTF-8 em-dash (—) appears in contract_label / program_term:
--     'Season Residency — Aug 2025 to May 2026'. Passes through D1
--     natively per 0002 + 0008 precedent.
--   Total: 0 apostrophe-escape sites, 0 quote-escape sites.

-- =============================================================================
-- (a) INSERT Diane Okonkwo person row (fresh, type='staff').
--
-- extensions.enterprise carries title + organization for future Chrome
-- identity display (advisor precedent: 0008 seeded Morgan's
-- extensions.advisor with practiceName / advisorTitle / practiceFocus /
-- yearsActive; enterprise mirrors the shape at surface level).
--
-- E11 gate marker (extensions.enterprise.demo_gate) is NOT set in this
-- seed. FT will set it explicitly when Diane's account is designated
-- for demo/staff writes — same discipline as advisor demo_gate
-- assignment. Until then, requireGatedEnterprise will reject writes
-- from Diane's session even after her invite is claimed.
-- =============================================================================

INSERT INTO person (id, auth_user_id, display_name, initials, type, source_surface, extensions, invite_email, soft_deleted_at, deletion_state) VALUES
  ('04000000-0000-4000-8000-000000000001', NULL, 'Diane Okonkwo', 'DO', 'staff', 'enterprise',
   '{"enterprise":{"title":"Senior Director, Athletic Development","organization":"Cooper State University","role":"athletic_dept_admin"}}',
   'demo-diane@example.invalid', NULL, NULL);

-- =============================================================================
-- (b) INSERT 1 institution row (Cooper State University Athletic Department).
--
-- Values from src/data/enterpriseFixtures.js INST_PROFILES[0] +
-- endowmentSnapshot:
--   name             'Cooper State University'
--   sector           'Athletics'
--   dept             'Athletic Department'
--   contract_label   'Season Residency — Aug 2025 to May 2026'  (from contract)
--   tier             'Revenue Sports Package'
--   annual_amount    85000                                       (from annual '$85,000')
--   endowment_annual 8500                                        (from endowment '$8,500/yr')
--   endowment_current 8628                                       (from endowmentSnapshot.currentValue)
--   program_term     'Season Residency — Aug 2025 to May 2026'   (from endowmentSnapshot.programTerm; matches contract)
-- =============================================================================

INSERT INTO institution (id, name, sector, dept, contract_label, tier, annual_amount, endowment_annual, endowment_current, program_term, created_at, updated_at) VALUES
  ('04000000-0000-4000-8000-000000000010',
   'Cooper State University',
   'Athletics',
   'Athletic Department',
   'Season Residency — Aug 2025 to May 2026',
   'Revenue Sports Package',
   85000,
   8500,
   8628,
   'Season Residency — Aug 2025 to May 2026',
   '2026-07-07T00:00:00.000Z',
   '2026-07-07T00:00:00.000Z');

-- =============================================================================
-- (c) INSERT 3 institution_contact rows per Option C sketch.
--
-- E1 tie-breaker: exactly one is_default_operator=1 across the three
-- rows (Diane). Endpoint-layer invariant on write; verified at seed
-- time as the migration author's discipline.
--
-- E4 cross-role identity: Morgan Walker's 0005 advisor person row is
-- referenced by institution_contact.person_id. That reference grants
-- ZERO enterprise capability. RequireType('staff') at the
-- /app/enterprise route rejects Morgan's session (her person.type is
-- 'advisor', not 'staff'); the join records who facilitates at
-- Cooper State, it does NOT authorize.
--
-- Row 1: Diane → Senior Director, Athletic Development, operator.
--   institution: 04000000-...010 (Cooper State)
--   person:      04000000-...001 (Diane, this migration)
-- Row 2: Jordan → Program Admin, residual (§7 sketch reassigned role
--   from 0005's Partnership Lead / StewardHouse to Cooper State's
--   Program Admin for enterprise-seed purposes; demonstrates
--   multi-role identity via distinct institution_contact rows).
--   institution: 04000000-...010
--   person:      02000000-...001 (Jordan, from 0005)
-- Row 3: Morgan → Facilitator per E4.
--   institution: 04000000-...010
--   person:      02000000-...002 (Morgan, from 0005)
-- =============================================================================

INSERT INTO institution_contact (id, institution_id, person_id, role_title, is_default_operator, created_at) VALUES
  ('04000000-0000-4000-8000-000000000100',
   '04000000-0000-4000-8000-000000000010',
   '04000000-0000-4000-8000-000000000001',
   'Senior Director, Athletic Development',
   1,
   '2026-07-07T00:00:00.000Z'),

  ('04000000-0000-4000-8000-000000000101',
   '04000000-0000-4000-8000-000000000010',
   '02000000-0000-4000-8000-000000000001',
   'Program Admin',
   0,
   '2026-07-07T00:00:00.000Z'),

  ('04000000-0000-4000-8000-000000000102',
   '04000000-0000-4000-8000-000000000010',
   '02000000-0000-4000-8000-000000000002',
   'Facilitator',
   0,
   '2026-07-07T00:00:00.000Z');
