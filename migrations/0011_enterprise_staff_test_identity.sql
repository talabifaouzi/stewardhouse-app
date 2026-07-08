-- Migration 0011 — Enterprise staff TEST IDENTITY (E-Slice 5b, option a).
--
-- FT ruling (5-scoping, defer-to-team): provision a SEPARATE plus-addressed
-- staff person for FT's real-email sign-in test, keeping Diane (0010) as the
-- pristine demonstrative persona. Mirrors the advisor arc (Morgan = demo
-- persona; a distinct plus-addressed identity carried FT's live advisor test).
--
-- Deliverability: talabifaouzi+staff@gmail.com IS deliverable — the verified
-- steward-house.org Resend sender handles plus-addressed variants (the
-- onboarding@resend.dev test-sender restriction noted in runbook §9 no longer
-- applies now that the domain sender is live). Plus-addressing routes to FT's
-- inbox; the (c) claim hook binds this row on first magic-link verify
-- (invite_email match), yielding type='staff' -> /app/enterprise.
--
-- E1 invariant PRESERVED: is_default_operator=0 on the new contact row.
-- Diane (institution_contact ...100) stays the SOLE default operator for
-- Cooper State. Operator distribution after this migration: Diane 1,
-- Faouzi 0, Jordan 0, Morgan 0.
--
-- Determinism (matches 0002/0008/0010): pre-computed literal UUIDs in the
-- 04000000-... enterprise-seed namespace (person ...002 — next after Diane's
-- ...001; institution_contact ...103 — next after 0010's ...100/101/102).
-- created_at literal '2026-07-08T00:00:00.000Z'.
--
-- SQL-escape surface (audited): zero apostrophes, zero double quotes in any
-- literal value ('Faouzi Talabi', 'Program Director', email, UUIDs).
-- extensions is NULL. Total: 0 escape sites.
--
-- E11 gate: no extensions.enterprise.demo_gate set — this identity can READ
-- /app/enterprise (RequireType('staff') passes) but write endpoints stay
-- gated until FT designates the gate, same discipline as Diane (0010).

-- =============================================================================
-- (a) New staff person (plus-addressed, claimable on real sign-in).
-- display_name set at insert (runbook §9: never rely on the 'New user'
-- default for a pre-seeded bespoke-type person row — it renders in Chrome).
-- =============================================================================

INSERT INTO person (id, auth_user_id, display_name, initials, type, source_surface, extensions, invite_email, soft_deleted_at, deletion_state) VALUES
  ('04000000-0000-4000-8000-000000000002', NULL, 'Faouzi Talabi', 'FT', 'staff', 'enterprise',
   NULL, 'talabifaouzi+staff@gmail.com', NULL, NULL);

-- =============================================================================
-- (b) New institution_contact linking Faouzi to Cooper State as a NON-default
-- operator (E1: Diane remains sole default operator).
--   institution: 04000000-...010 (Cooper State, from 0010)
--   person:      04000000-...002 (Faouzi, this migration)
-- =============================================================================

INSERT INTO institution_contact (id, institution_id, person_id, role_title, is_default_operator, created_at) VALUES
  ('04000000-0000-4000-8000-000000000103',
   '04000000-0000-4000-8000-000000000010',
   '04000000-0000-4000-8000-000000000002',
   'Program Director',
   0,
   '2026-07-08T00:00:00.000Z');
