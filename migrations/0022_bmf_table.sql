-- 0022_bmf_table.sql
--
-- HAND-WRITTEN AND PROVISIONAL (R13a). THE LOADER IS AUTHORITATIVE FOR THIS DDL
-- (R13, docs/bmf-load-scoping.md section 15): authority sits with the artifact
-- that runs on EVERY load, not the one that ran once. The loader (A113) will
-- carry the full table definition as a single named constant, and THIS FILE IS
-- REGENERATED FROM THAT CONSTANT once it exists. Byte-identical output proves
-- the derivation retroactively; any difference is drift found on day one rather
-- than on load twelve.
--
-- The body below is the reviewed DDL, extracted VERBATIM from the A117 entry in
-- docs/outstanding.md as committed at a5be8d9. DO NOT EDIT IT HERE. Edit the
-- proposal, or once A113 exists, edit the loader constant and regenerate.
--
-- D6, the precondition on authoring: this DDL was applied 2026-09-07 to a
-- VACUUM INTO copy of the local 21-migration store. Clean: +11 objects, 0
-- removed, 0 altered, integrity_check ok, foreign_key_check empty. APPLYING
-- THIS FILE to any store, local or remote, is a separate FT-run step and is not
-- part of authoring it.

-- R13, AUTHORITY: THE LOADER IS AUTHORITATIVE FOR THIS DDL AND THIS FILE DERIVES
-- FROM IT. Authority sits with the artifact that runs on EVERY load, not the one
-- that ran once. The loader (A113) carries the full table definition as a single
-- named constant, which extends R10c from the index list to the whole shape.
-- R13a: this text is HAND-WRITTEN and PROVISIONAL until A113 lands, then
-- REGENERATED from that constant. Byte-identical proves the derivation
-- retroactively; any difference is drift found on day one, not on load twelve.

-- (1) THE BMF TABLE. Shape: docs/bmf-load-scoping.md §1.
--
-- THE `ein` COLUMN CARRIES TWO THINGS A TIDY-UP WOULD UNDO. Both are here rather
-- than inline because both are invisible in the syntax.
--   (a) NOT NULL IS LOAD-BEARING, NOT NOISE. In SQLite a non-INTEGER PRIMARY KEY
--       does NOT imply NOT NULL. Delete it and a NULL EIN is accepted.
--   (b) TEXT IS CORRECT FOR LEADING ZEROS AND DOES NOT PROTECT THEM. TEXT
--       affinity converts an unquoted numeric literal, so VALUES (042103594, ...)
--       stores '42103594' with NO error, and row count, distinct count, NOT NULL
--       and the PRIMARY KEY all still pass, because truncated values stay unique.
--       THE LOADER MUST QUOTE EVERY EIN. Hard requirement:
--       docs/bmf-load-scoping.md §2. Failure mode: §4, mode 7.
--
-- D4: NO CHECK ON `ruling`, and its absence is a DECISION rather than an
-- omission. Value validation belongs to the loader's R8 checks; a CHECK here
-- would be a second place to maintain one rule.
--
-- PROVENANCE (R8d): the nullability below derives from ONE extract measured
-- 2026-08 across the ruled four-or-five file set, 1,957,340 rows. REVENUE_AMT
-- null on 569,235 (29.08%), NTEE_CD null on 574,447 (29.35%), the other four
-- null on 0. A later extract may differ.
--
-- R10b: the PRIMARY KEY is declared HERE, at CREATE. A duplicate EIN therefore
-- fails at INSERT, not at index creation.
-- R11f: this table is the SWAP'S FIRST GENERATION. On load one there is nothing
-- to rename away unless it exists, which is why creating it empty is correct.
CREATE TABLE bmf (
  ein          TEXT    NOT NULL PRIMARY KEY,
  name         TEXT    NOT NULL,
  city         TEXT    NOT NULL,
  state        TEXT    NOT NULL,
  revenue_amt  INTEGER,                                -- absent stays distinct from zero
  ruling       INTEGER NOT NULL,
  ntee_cd      TEXT
);

-- THE INDEX SET IS PROVISIONAL (R10c), revisable at ZERO migration cost: this is
-- a replace-all design, so every load rebuilds the whole set and a change costs
-- one DDL edit plus one load cycle, not a migration.
-- R10a: UNIQUE(ein) is absent because it is not a choice — the PRIMARY KEY above
-- already creates it (verified: sqlite_autoindex_bmf_1, origin pk). Three, not four.
-- R10d, PATH B: idx_bmf_name is a SEARCH index. Indexing for RETRIEVAL is inside
-- the §7 boundary; ordering by anything EVALUATIVE is not. Nothing here guards it.
-- THIS SET MUST MATCH the aside DDL the loader (A113) builds on EVERY run.
-- R13b: the post-swap assertion (R8b) reads index_list on the LIVE table and
-- asserts these three names are present. Generation prevents drift at authoring
-- time; that check catches it at RUN time and is the cheaper half.
CREATE INDEX idx_bmf_state_city ON bmf (state, city);
CREATE INDEX idx_bmf_ruling     ON bmf (ruling);
CREATE INDEX idx_bmf_name       ON bmf (name);

-- (2) THE LOAD STAMP. One row per load, per source (R12a).
--
-- NO source COLUMN, and that is deliberate: R12e cut source_id as redundant with
-- source_date and file_set together, and file_set is what distinguishes a BMF
-- load from any other source's.
-- NO status COLUMN (R12d): the timestamps ARE the status, and one would drift
-- against them — the defect FORK 2 ruled against for enrollment_status.
-- R12f, THE STAMP RECORDS THE LOAD, NOT THE DATA. Nothing evaluative or
-- categorical about the organizations may be added here: no counts by NTEE code,
-- no distributions by state, nothing that reads as StewardHouse's account of the
-- sector. row_count is the LOAD'S OWN SIZE, not a characterization.
-- R12e, THE TEST FOR ADDING A FIELD: the stamp is the only thing that outlives a
-- generation, so a field belongs here if and only if you would want it after the
-- table is pruned.
-- R12g: with source_date and completed_at both present this row is the EVIDENCE
-- for any public currency claim. Do not trim fields here for looking internal.
--
-- D1: `id` IS A SURROGATE KEY AND SITS OUTSIDE R12a's SEVEN FIELDS, so this table
-- has EIGHT columns against a ruled seven. R12a is deliberately NOT amended:
-- saying eight would make that ruling about column mechanics rather than about
-- what the stamp RECORDS. The id exists because R12b needs something for
-- load_check to reference.
--
-- R12c RESTATED HERE, WHERE THE COLUMN IT GOVERNS IS READ: completed_at is
-- written LAST and AFTER every load_check row for this load, so completion means
-- the record is WHOLE. The full statement sits above table (3); a reader who
-- never reaches it must still meet the ordering, because the design's safety
-- rests on it.
--
-- R14, THE NAME STORED IN generation_table: bmf_gen_YYYYMMDDTHHMMSSZ, e.g.
-- bmf_gen_20260907T164748Z. The bmf_gen_ prefix is a NAMESPACE and must NEVER be
-- bmf_, because a pruner matching bmf_% would catch the in-flight bmf_aside and
-- could delete it mid-load. UTC with the Z always; ISO 8601 BASIC, so no name
-- ever needs quoting; lexical order equals chronological, so the pruner is
-- ORDER BY name and parses no dates. The timestamp is the load's START and equals
-- load_started_at, so a stamp row and its table are joinable by inspection.
-- Full ruling: docs/bmf-load-scoping.md §15, R14.
CREATE TABLE load_stamp (
  id                TEXT    NOT NULL PRIMARY KEY,     -- opaque UUID. SURROGATE, outside R12a's seven
  source_date       TEXT    NOT NULL,                 -- the EXTRACT's own date; Discover renders this
  file_set          TEXT    NOT NULL,                 -- which files were taken, e.g. 'eo1,eo2,eo3,eo4'
  load_started_at   TEXT    NOT NULL,                 -- ISO 8601. R14: the generation name carries it
  load_finished_at  TEXT,                             -- when it STOPPED, success or failure
  completed_at      TEXT,                             -- LAST, and AFTER the load_check rows. NULL = not complete
  row_count         INTEGER,                          -- the load's size (R12f)
  generation_table  TEXT                              -- the dated table this load produced (R7); name per R14
);
CREATE INDEX idx_load_stamp_source_date ON load_stamp(source_date);

-- (3) THE CHECK RESULTS (R12b). One row per check per load.
--
-- A CHILD TABLE RATHER THAN A JSON COLUMN. JSON was proposed and then argued
-- down by the seat that proposed it: nothing validates it, it is not queryable
-- across rows, and a provisional check set means JSON silently changes shape
-- where columns would not. ADDING A CHECK ADDS ROWS, so the check set can move
-- without a migration.
--
-- R12c, THE ORDERING CONSTRAINT, AND IT IS THE WHOLE REASON THIS TABLE IS SAFE:
-- these rows are written BEFORE load_stamp.completed_at. Completion therefore
-- still means the record is WHOLE. One stamp row per load, inserted at start,
-- updated once at the end, never in between.
--
-- D2, THE FOREIGN KEY STAYS AND SO DOES THE CASCADE, but read what it is worth.
-- NOTHING IN THIS DESIGN EVER DELETES A load_stamp ROW: R12e makes the stamp the
-- thing that outlives generations, and R8c prunes generation TABLES, not stamps.
-- So the CASCADE is declared for a deletion that does not happen, which costs
-- nothing and documents intent for whoever writes a stamp-deleting path.
-- D1 REMOTE FK ENFORCEMENT IS UNVERIFIED (CLAUDE.md §10); local is verified.
-- AND A LOCAL TEST CAN PASS FOR A REASON THAT DOES NOT TRANSFER: node:sqlite
-- defaults foreign_keys ON, plain SQLite defaults it OFF. Measured 2026-09-07:
-- with the pragma OFF an orphan child row INSERTs clean and no error is raised.
CREATE TABLE load_check (
  id          TEXT    NOT NULL PRIMARY KEY,           -- opaque UUID
  stamp_id    TEXT    NOT NULL REFERENCES load_stamp(id) ON DELETE CASCADE,
  check_name  TEXT    NOT NULL,                       -- e.g. 'row_count_in_band'
  value       TEXT,                                   -- the observed figure as recorded
  passed      INTEGER NOT NULL CHECK (passed IN (0, 1))
);
CREATE INDEX idx_load_check_stamp_id ON load_check(stamp_id);
