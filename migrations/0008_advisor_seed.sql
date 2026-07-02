-- Migration 0008 — Advisor seed (SLIM SCOPE).
--
-- FT ruling on scope: Morgan Walker's practice profile + her authored
-- practice content ONLY. NO client rows, NO client_session, NO
-- client_note, NO cohort_member rows.
--
-- Rationale:
--   - Clients enter D1 EXCLUSIVELY through the gated write endpoints
--     when the wire-surfaces slice lands (real-path testing exercises
--     the Q4/Q7 role gate as designed).
--   - The fixture roster (src/data/clients.js) continues to power the
--     public /advisor/* demo mount unchanged — no duplication into D1,
--     no fixture-to-D1 drift surface.
--   - Cohorts seed WITHOUT membership: the cohort rows land now, but
--     their cohort_member rows are transitively gated by Q7 (cohort_member
--     FKs to client, which requires client writes to be enabled). See
--     the cohort-member note before the cohort INSERTs below.
--
-- Content scope:
--   (a) UPDATE Morgan's 0005 person row: json_set on extensions setting
--       extensions.advisor per the schema-draft §3.9 spec
--       ({practiceName, advisorTitle, practiceFocus, yearsActive}).
--       0005 seeded a partial/inconsistent shape (title/organization);
--       this migration OVERWRITES the .advisor sub-blob with the ruled
--       shape. display_name and invite_email untouched.
--   (b) 5 practice_lesson rows from src/data/practiceContent.js.
--       pl-001..pl-005 preserved (fixture ids kept for demo continuity).
--       All dates ISO. materials arrays as JSON TEXT for pl-001 and
--       pl-004; pl-002 / pl-003 / pl-005 have no materials in fixture.
--   (c) 2 doc_category + 4 doc rows from src/data/documentation.js.
--       doc.id as PRE-COMPUTED UUID LITERALS per FIX 2 (fixture slug ids
--       would collide as a global PK across practices). Slug retained
--       ONLY as seed-data provenance in the docblock above each doc.
--       doc.updated ISO per FIX 3 (fixture display strings like
--       'April 12, 2026' → '2026-04-12').
--   (d) 2 cohort rows from src/data/cohorts.js. cohort.started
--       normalized to first-of-month ISO per FIX 3 (fixture
--       'February 2026' → '2026-02-01'). cohort.next_session_date was
--       already ISO in fixture, no change. external_members carries the
--       fixture count. memberIds NOT seeded (no client rows exist);
--       cohort_member population happens through the write path.
--
-- Determinism (matches 0002 convention):
--   - All UUIDs are pre-computed literals (03000000-... namespace for
--     advisor-seed rows to avoid collision with 0002's 01000000-...
--     and 0005's 02000000-...). No randomblob().
--   - Fixture dates preserved as-is (already ISO). Migration-timestamp
--     for created_at where no fixture value: '2026-07-02T00:00:00.000Z'.
--   - Re-apply produces identical state.
--
-- SQL-escape surface (audited, exhaustive):
--   - pl-003 summary: "client's" (1 apostrophe) → 'client''s'.
--   - doc 4 body paragraph 6: "program's" (1 apostrophe) → 'program''s'.
--   - coh-002 name: "State University women's basketball" (1 apostrophe)
--     → 'State University women''s basketball'.
--   - coh-002 summary: "A Division I women's basketball program..."
--     (1 apostrophe) → 'women''s'.
--   Total: 4 apostrophe-escape sites.
--
--   - doc 2 body paragraph 4 contains double quotes around "what I do not
--     do" and doc 3 body paragraph 5 contains double quotes around
--     "program". Both use json_array() so the double quotes get auto-
--     escaped by SQLite's JSON1 into valid \" inside the stored JSON.
--   - No backslashes anywhere in fixture content.
--   - UTF-8 em-dash / en-dash characters pass through D1 natively.

-- =============================================================================
-- (a) UPDATE Morgan Walker's practice profile on her 0005 person row.
--
-- json_set overwrites the extensions.advisor sub-blob wholesale. The
-- json() wrapper on the value is the disciplined pattern from the
-- intake-persistence slice (functions/api/intake.js:24-131) — without
-- it, the JSON string would land as an escaped literal string instead
-- of a real JSON object.
--
-- coalesce(extensions, '{}') handles the paranoid null case; 0005
-- already set extensions to a valid JSON object so this is defensive.
-- =============================================================================

UPDATE person
SET extensions = json_set(
  coalesce(extensions, '{}'),
  '$.advisor',
  json('{"practiceName":"Walker Philanthropic Advisory","advisorTitle":"Principal Advisor","practiceFocus":"Athletes in early career","yearsActive":7}')
)
WHERE id = '02000000-0000-4000-8000-000000000002';

-- =============================================================================
-- (b) PRACTICE_LESSON (5 rows — Morgan's authored curriculum).
--
-- Fixture ids (pl-001..pl-005) preserved for demo continuity. owner is
-- Morgan's person.id (02000000-...002). Fixture createdAt/updatedAt
-- carry as practice_lesson.created_at/updated_at (already ISO 'YYYY-MM-DD').
-- =============================================================================

INSERT INTO practice_lesson (id, owner_advisor_person_id, kind, base_id, status, title, minutes, scope, category, summary, materials, created_at, updated_at) VALUES
  ('pl-001', '02000000-0000-4000-8000-000000000002', 'fork', 'l-22', 'published',
   'Writing a first grant inquiry — Walker Advisory variant',
   11, 'all', 'workflow',
   'A tailored version of the base lesson, tuned for athlete clients writing their first formal inquiry. Adds three sample paragraphs drawn from past Walker Advisory engagements (names removed) and a short list of phrasings the practice has learned to avoid.',
   '[{"id":"mat-001","type":"reading","title":"Sample first-inquiry paragraphs (athlete clients)","fileName":"first-inquiry-samples-athletes.pdf"},{"id":"mat-002","type":"task","title":"Draft a one-paragraph inquiry to a candidate organization","fileName":null}]',
   '2026-03-08', '2026-04-19'),

  ('pl-002', '02000000-0000-4000-8000-000000000002', 'fork', 'l-25', 'published',
   'Funder transparency criteria — Walker Advisory phrasings',
   9, 'all', 'workflow',
   'A tailored version with the specific transparency phrasings the practice has refined over its first seven years. Same structure as the base lesson; different example language.',
   NULL,
   '2026-02-14', '2026-02-14'),

  -- pl-003 summary contains "client's" — apostrophe doubled below.
  ('pl-003', '02000000-0000-4000-8000-000000000002', 'fork', 'l-31', 'published',
   'Closing an advisory engagement — Walker Advisory handoff',
   10, 'all', 'workflow',
   'A tailored version adapted for the specific shape of Walker Advisory engagements — what transfers to the client''s foundation team, what stays with the practice file, and what gets re-read aloud in the closing session.',
   NULL,
   '2025-11-20', '2026-01-09'),

  ('pl-004', '02000000-0000-4000-8000-000000000002', 'authored', NULL, 'published',
   'Pacing the first six months — Walker Advisory practice notes',
   8, 'all', 'primer',
   'A practice-authored primer on how Walker Advisory paces the first six months of a new client engagement — when to ask which question, what to leave for later, and how to read the early signals.',
   '[{"id":"mat-003","type":"reading","title":"Six-month cadence map for new athlete clients","fileName":"six-month-cadence-map.pdf"}]',
   '2026-01-15', '2026-04-02'),

  ('pl-005', '02000000-0000-4000-8000-000000000002', 'fork', 'l-23', 'draft',
   'Multi-year grant agreements: what to ask for (working draft)',
   12, 'all', 'workflow',
   'An in-progress tailored version adding renewal-trigger language specific to athlete-funder relationships. Still finding the right level of detail for the exit-provisions section.',
   NULL,
   '2026-04-25', '2026-05-10');

-- =============================================================================
-- (c) DOC_CATEGORY (2 rows) + DOC (4 rows) — Morgan's documentation hub.
--
-- doc_category ids: 03000000-...101 (Onboarding), 03000000-...102 (Working notes).
-- doc ids: 03000000-...001..004 (fresh UUIDs per FIX 2). Fixture slug ids
-- retained ONLY as seed-data provenance in the SQL comment above each doc row.
-- doc.updated ISO per FIX 3.
-- =============================================================================

INSERT INTO doc_category (id, owner_advisor_person_id, label, hint, created_at) VALUES
  ('03000000-0000-4000-8000-000000000101', '02000000-0000-4000-8000-000000000002',
   'Onboarding',
   'Scripts, checklists, and templates you reach for when bringing on a new client.',
   '2026-07-02T00:00:00.000Z'),

  ('03000000-0000-4000-8000-000000000102', '02000000-0000-4000-8000-000000000002',
   'Working notes',
   'Your own reference material — reading guides, sector notes, marked-up documents. Personal to how you work.',
   '2026-07-02T00:00:00.000Z');

-- Doc 1 — fixture slug: 'onboarding-script'. Body uses json_array() so
-- SQLite auto-escapes any embedded JSON syntax; no bare double-quote
-- concerns in these paragraphs.
INSERT INTO doc (id, category_id, title, updated, notes, body, created_at) VALUES
  ('03000000-0000-4000-8000-000000000001',
   '03000000-0000-4000-8000-000000000101',
   'Onboarding script template',
   '2026-04-12',
   'Six-question values intake',
   json_array(
     'These are the six questions I open with. Not a script to read verbatim — a frame for the first hour together. The order matters: I start where the person is most willing to talk, which is usually their own history, not their plan.',
     'Question one: what is the earliest gift you remember giving, and what made you give it? This puts giving in their own biography before we touch dollars.',
     'Question two: what is a cause you have drifted in and out of caring about, and why? Drift is honest; consistency is rare.',
     'Question three: who in your life shaped how you think about money — for better or worse? Names, not generalities.',
     'Question four: if your giving were visible to one person you respect, who would it be? This surfaces an audience that is already shaping behavior, whether or not they know it.',
     'Questions five and six I hold in reserve. They are situational: a question about ambition for some, a question about anonymity for others. I write them in only after the first four have opened something up.'
   ),
   '2026-07-02T00:00:00.000Z');

-- Doc 2 — fixture slug: 'first-session-checklist'. Body paragraph 4
-- contains "what I do not do" in double quotes — json_array() auto-
-- escapes those into \" inside the stored JSON.
INSERT INTO doc (id, category_id, title, updated, notes, body, created_at) VALUES
  ('03000000-0000-4000-8000-000000000002',
   '03000000-0000-4000-8000-000000000101',
   'First-session checklist',
   '2026-02-28',
   'Logistics + working agreement',
   json_array(
     'First-session logistics live or die on small things. I send the calendar invite myself, not through an assistant. I confirm the day before in a single sentence: looking forward to tomorrow at two. Nothing more.',
     'Phones face-down on the table, not pocketed. I model it first. If the client gets a call they need to take, the session pauses; we do not half-listen.',
     'The working agreement covers four things: what I do, what I do not do, what they should expect to feel, and how either of us ends the engagement. I read mine aloud and ask theirs in return.',
     'The "what I do not do" list is the longest. I do not custody money. I do not pick organizations for them. I do not grade their giving. Saying this clearly at the start prevents misunderstandings later.',
     'Notes: I take them by hand, not on a screen. I tell the client that. The notes are mine; my summary back to them after the session is theirs.',
     'Closing: I do not schedule the next session in the room. I send a one-line proposal within twenty-four hours. The space between sessions is part of the work.'
   ),
   '2026-07-02T00:00:00.000Z');

-- Doc 3 — fixture slug: '990-reading-guide'. Body paragraph 5 contains
-- "program" in double quotes — json_array() auto-escapes.
INSERT INTO doc (id, category_id, title, updated, notes, body, created_at) VALUES
  ('03000000-0000-4000-8000-000000000003',
   '03000000-0000-4000-8000-000000000102',
   'Reference: 990 reading guide',
   '2026-03-09',
   'Marked up with my own notes',
   json_array(
     'I read 990s in a specific order, and I make myself notes in the margins. The point is not to score the organization — it is to understand how the organization sees itself.',
     'First page: mission statement. Compare it to the website. Discrepancies are interesting, not damning. The 990 is a legal document; the website is a marketing one. Both are true.',
     'Schedule O is where the actual narrative lives. Most readers skip it. I read it twice — once for content, once for tone.',
     'Compensation tables I read for ratio and consistency over time, not for absolute numbers. A long-tenured executive earning steadily is one story; a sudden jump is another.',
     'Functional expenses: I look at how program, G&A, and fundraising are split, then I read the program description to see what "program" actually means for this organization. The ratio without the description is meaningless.',
     'I do not use the 990 to rank organizations. It tells me what to ask in the next conversation. Anything more than that is overreach.'
   ),
   '2026-07-02T00:00:00.000Z');

-- Doc 4 — fixture slug: 'youth-athletics-landscape'. Body paragraph 6
-- contains "program's" — apostrophe doubled below within the string
-- literal passed to json_array().
INSERT INTO doc (id, category_id, title, updated, notes, body, created_at) VALUES
  ('03000000-0000-4000-8000-000000000004',
   '03000000-0000-4000-8000-000000000102',
   'Sector landscape: youth athletics',
   '2026-02-14',
   'Personal reading log',
   json_array(
     'Notes from the last eighteen months of reading on youth and school athletics access. Not a comprehensive map — what I have actually read.',
     'The defining structural fact: pay-to-play has become the norm in most public school athletic programs over the last twenty years. The cost falls hardest on families in the bottom income quintile and shows up as participation gaps.',
     'Two organizational forms recur: school-attached booster groups (often 501(c)(3) themselves) and community-based programs that operate outside the school system. They have very different cost structures and very different evidence bases.',
     'Coaching quality is the variable nobody can quantify and everybody talks about. The literature on coach training in youth sports is thinner than I expected.',
     'Reinvestment patterns: organizations that survive a decade tend to be the ones that put excess revenue back into facilities and coaching rather than expansion. Worth asking about explicitly when an organization pitches growth.',
     'Open questions I am still chasing: how Title IX intersects with private youth programs; what success means when the program''s outputs are measured in years, not seasons; how to think about regional concentration of programs versus their funder base.'
   ),
   '2026-07-02T00:00:00.000Z');

-- =============================================================================
-- (d) COHORT (2 rows). NO COHORT_MEMBER rows.
--
-- Fixture ids preserved (coh-001, coh-002). cohort.started normalized to
-- first-of-month ISO per FIX 3 ('February 2026' → '2026-02-01';
-- 'April 2026' → '2026-04-01'). cohort.next_session_date was already ISO
-- in fixture. external_members carries the fixture count. Empty JSON
-- arrays for assigned_lessons / updates / sessions per fixture.
--
-- COHORT_MEMBER NOTE (Q4/Q7 gate carrier):
-- cohort_member rows are DELIBERATELY NOT seeded here. Fixture memberIds
-- (coh-001: c-001/c-005/c-008; coh-002: c-007) reference clients that
-- do not exist in D1 (client writes gated on Q7 role-gate ruling —
-- schema draft §6). Cohort_member population happens through the write
-- path when wire-surfaces lands and real clients enter D1 via the
-- gated endpoints. Until then, display-count consumers (cohort
-- "Members" line) will read cohort_member = 0 + external_members from
-- the row; that's the honest state until real writes populate.
-- =============================================================================

INSERT INTO cohort (id, owner_advisor_person_id, name, focus, started, next_session_date, summary, external_members, assigned_lessons, updates, sessions, created_at, updated_at) VALUES
  ('coh-001', '02000000-0000-4000-8000-000000000002',
   'Youth and school athletics access',
   'Issue-area cohort',
   '2026-02-01',
   '2026-05-18',
   'Three athletes — across basketball, football, and track — who came together around a shared commitment to expanding access to youth and school sports. They work through the curriculum as a group, comparing how each turns that conviction into a giving practice, from youth basketball and K-12 access to athletic program infrastructure and district equity.',
   0,
   '[]', '[]', '[]',
   '2026-07-02T00:00:00.000Z', '2026-07-02T00:00:00.000Z'),

  -- coh-002 name AND summary both contain "women's" — apostrophes doubled.
  ('coh-002', '02000000-0000-4000-8000-000000000002',
   'State University women''s basketball',
   'Team cohort',
   '2026-04-01',
   '2026-05-27',
   'A Division I women''s basketball program working through the curriculum as a full team. Bree Caldwell is the client on your roster; her teammates joined as a group so the squad builds its giving practice together from the start. Early days — the cohort is still mapping what each player cares about.',
   11,
   '[]', '[]', '[]',
   '2026-07-02T00:00:00.000Z', '2026-07-02T00:00:00.000Z');
