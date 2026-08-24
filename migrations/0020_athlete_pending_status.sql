-- Migration 0020: athlete.enrollment_status CHECK gains 'Pending'.
--
-- ############################################################################
-- ## DO NOT APPLY THIS FILE VIA `wrangler d1 migrations apply`.             ##
-- ############################################################################
--
-- PROVEN EMPIRICALLY, NOT ASSUMED. A probe seeded one athlete plus one child
-- row in EACH of the four cascade tables on a VACUUM INTO scratch copy, then
-- ran this exact rebuild shape through `wrangler d1 migrations apply --local`.
-- All four child tables went from 1 row to 0. The runner reported success
-- ("9 commands executed successfully") and PRAGMA foreign_key_check came back
-- EMPTY, because a completed cascade leaves no orphan to find. Only the row
-- counts detect it.
--
-- FILE THIS AS "PRAGMA foreign_keys=OFF IS INEFFECTIVE THROUGH THE RUNNER",
-- NOT as a proven fact about transactions. A wrapping transaction (in which
-- the pragma is a documented no-op) and a runtime that simply does not honor
-- the pragma are OBSERVATIONALLY IDENTICAL from outside. The probe cannot
-- separate them and does not need to: the operative conclusion is the same.
--
-- HOW TO APPLY IT INSTEAD (0016's method, and the reason 0016 used it):
--   1. VACUUM INTO a scratch copy first, NEVER cp. A filesystem copy of a live
--      SQLite database silently loses WAL contents.
--   2. Apply through node:sqlite, OUTSIDE any open transaction, so that
--      PRAGMA foreign_keys=OFF actually takes effect.
--   3. GUARD-ASSERT: abort the rebuild unless `PRAGMA foreign_keys` reads 0
--      immediately before the DROP. The pragma fails SILENTLY when it fails;
--      SQLite neither errors nor warns, so the assert is the only detection.
--   4. Confirm PRAGMA foreign_key_check is empty afterward, and confirm the
--      four child-table row counts are UNCHANGED. The counts are the real
--      check; foreign_key_check alone cannot distinguish success from a clean
--      cascade, as the probe above demonstrates.
--
-- THE FOUR INBOUND CASCADE CHILDREN, all REFERENCES athlete(id) ON DELETE
-- CASCADE, all of which the DROP would take with it:
--   athlete_activity, athlete_note, athlete_reflection, workshop_attendance
--
-- NO ROLLBACK FALLBACK VALUE EXISTS (RI-3, ruled). There is no value to map
-- 'Pending' back onto, deliberately. A CHECK constraint is enforced on INSERT,
-- and a reverse rebuild is an INSERT..SELECT into a five-value table, so the
-- reverse rebuild FAILS OUTRIGHT if any single row holds 'Pending'. It does not
-- silently drop or coerce those rows; it raises and stops. The exposure window
-- is the import-to-send lag (R2): rows land 'Pending' at import and leave it at
-- send, so the set of affected rows is non-empty for exactly as long as that
-- lag runs. REVERSING THIS MIGRATION AFTER AN IMPORT HAS RUN REQUIRES A FRESH
-- FT RULING, because it requires deciding what those rows become.
--
-- THIS MIGRATION FALSIFIES A STATED INVARIANT IN THE TREE, and does not fix it.
-- functions/api/athletes.js:101-105 documents that enrollment_status "is
-- CHECK-constrained to the 5-value enum (migration 0016) and STATUS_MAP covers
-- all five, so this lookup is always defined", which is why the prior
-- `?? 'active'` laundering was removed there. After this migration the CHECK
-- admits six values while STATUS_MAP (athletes.js:69-72) still covers five, so
-- toAthleteElement maps a 'Pending' row to `status: undefined` with no throw
-- and no log. THAT IS STEP 3 OF THIS ARC, not this file. Shipping 0020 without
-- step 3 leaves the falsehood standing in a comment.
--
-- 'Pending' IS APPENDED LAST to the enum list. The list is not sorted and its
-- order carries no meaning (E9/Q9: enrollment_status is relationship state,
-- never a rank); appending keeps the diff against 0016 to a single term.
--
-- Restated invariants (carried VERBATIM from 0016, which carried them from
-- 0009, so constraint-by-absence survives another rebuild):
--   E9/Q9: NO rank / score / priority / progression / rating / grade column may
--     EVER be added. enrollment_status is relationship state, not a rank.
--   Parker no-lifecycle: NO settlement / processed / cleared column. The
--     enrollment_status enum is relationship state; 'Sunset' is the E3
--     anonymize marker.
--   E10: badge is staff-authored descriptive label ONLY; never a rank.
--   §4.2 Option B: person_id is ON DELETE SET NULL (anonymize-to-stub at the
--     endpoint layer); children are ON DELETE CASCADE from athlete.
--
-- Column shape is UNCHANGED since 0016 and is lifted from it verbatim: 0017
-- rebuilt cohort_period_snapshot and 0018 added a column to client, so neither
-- touched athlete. The CHECK list is the only edit below.
--
-- LOCAL APPLY ONLY with this slice. The --remote apply is a SEPARATE FT-RUN
-- step per CLAUDE.md §6.10 branch (b), and the same node:sqlite caution applies
-- there: a --remote run of this file through the migrations runner would carry
-- the identical cascade risk against production.

PRAGMA foreign_keys=OFF;

CREATE TABLE athlete_new (
  id                       TEXT NOT NULL PRIMARY KEY,
  institution_id           TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  person_id                TEXT REFERENCES person(id) ON DELETE SET NULL,

  -- STUB COLUMNS (survive E3 anonymize-to-stub as name='redacted', year, sport).
  name                     TEXT NOT NULL,
  year                     TEXT,
  sport                    TEXT,

  -- CASCADE-AWAY COLUMNS (nulled/emptied at endpoint anonymize step).
  position                 TEXT,
  email                    TEXT,
  phone                    TEXT,
  notes                    TEXT,

  gps_completed_at         TEXT,
  lessons_count            INTEGER NOT NULL DEFAULT 0,
  gifts_count              INTEGER NOT NULL DEFAULT 0,
  last_active_at           TEXT,

  badge                    TEXT,   -- E10: staff-authored label ONLY; never a rank

  -- Enum constrained at the DB level (P-2 FORK 2, migration 0016; TitleCase per
  -- R1 audit). 0020 appends 'Pending' as the sixth value.
  enrollment_status        TEXT NOT NULL
                             CHECK (enrollment_status IN
                               ('Invited','Active','Stalled','Sunset','Certified','Pending')),
  certified                INTEGER NOT NULL DEFAULT 0,
  cert_at                  TEXT,

  join_date                TEXT,
  consent_acknowledged_at  TEXT,   -- 0012: ISO 8601; NULL = not acknowledged
  management_mode          TEXT,   -- 0015: NULL | 'self' | 'delegated'

  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL
);

INSERT INTO athlete_new (
  id, institution_id, person_id, name, year, sport, position, email, phone,
  notes, gps_completed_at, lessons_count, gifts_count, last_active_at, badge,
  enrollment_status, certified, cert_at, join_date, consent_acknowledged_at,
  management_mode, created_at, updated_at
)
SELECT
  id, institution_id, person_id, name, year, sport, position, email, phone,
  notes, gps_completed_at, lessons_count, gifts_count, last_active_at, badge,
  enrollment_status, certified, cert_at, join_date, consent_acknowledged_at,
  management_mode, created_at, updated_at
FROM athlete;

DROP TABLE athlete;

ALTER TABLE athlete_new RENAME TO athlete;

CREATE INDEX idx_athlete_institution_id ON athlete(institution_id);
CREATE INDEX idx_athlete_person_id      ON athlete(person_id);

PRAGMA foreign_keys=ON;
