-- 0005_demo_roster.sql
-- Fictional pre-seeded invitee rows so the demo-mode Operations roster is
-- representative of the live roster shape. All pending (auth_user_id NULL).
-- Names reused from existing enterprise/advisor fixtures for continuity with
-- the rest of the demo (enterpriseFixtures.contacts[], clients.advisorPracticeProfile).
-- invite_email uses RFC 2606 .invalid TLD: syntactically valid, never
-- deliverable, so these rows can never be accidentally claimed by a real sign-in.
--
-- DEDUP NOTE (per CLAUDE.md §4 deferred-same-person-dedup pattern): "Morgan
-- Walker" appears in BOTH enterpriseFixtures.contacts.morgan (enterprise
-- surface, role facilitator) AND clients.advisorPracticeProfile (advisor
-- surface, practice lead). One person, two fixture surfaces — same shape as
-- Marcus's multi-surface presence. This migration seeds ONE row (the advisor-
-- surface version, the richer/canonical record) rather than two, consistent
-- with dedup staying deferred rather than silently duplicated.

INSERT INTO person (id, auth_user_id, display_name, initials, type, source_surface, extensions, invite_email, soft_deleted_at, deletion_state) VALUES
  ('02000000-0000-4000-8000-000000000001', NULL, 'Jordan Avery', 'JA', 'staff', 'enterprise',
   '{"enterprise":{"title":"Partnership Lead","organization":"StewardHouse","role":"stewardhouse_rep"}}',
   'demo-jordan@example.invalid', NULL, NULL),
  ('02000000-0000-4000-8000-000000000002', NULL, 'Morgan Walker', 'MW', 'advisor', 'advisor',
   '{"advisor":{"title":"Principal Advisor","organization":"Walker Philanthropic Advisory","practiceFocus":"Athletes in early career","yearsActive":7}}',
   'demo-morgan@example.invalid', NULL, NULL),
  ('02000000-0000-4000-8000-000000000003', NULL, 'Reese Donovan', 'RD', 'ops', 'operations',
   '{"operations":{"role":"Sub-user"}}',
   'demo-reese@example.invalid', NULL, NULL);
