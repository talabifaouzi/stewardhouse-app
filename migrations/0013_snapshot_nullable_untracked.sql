-- Migration 0013 — cohort_period_snapshot: make dollars_moved +
-- avg_weekly_engagement NULLABLE (E-Write-5, Q5 ruling).
--
-- FT ruling (Q5, defer-to-team): the snapshot derives its six SOURCED
-- aggregates server-side from live D1 at snapshot time (athletes_count, gps_*,
-- cert_*, attendance_rate, gifts_count). Two aggregates have NO live D1 source:
--   - dollars_moved       — no enterprise gift-dollar table (the individual-side
--                           `gift` table is giver-scoped, not athlete-roster-
--                           linked; athlete_activity has no amount column).
--   - avg_weekly_engagement — no engagement-tracking table exists.
-- These are written NULL and RENDER as "Not tracked" — NEVER zero (which would
-- read as a real 0% / $0 measurement) and NEVER staff-entered (a snapshot is a
-- derived frozen record, not a data-entry form). 0009 declared both NOT NULL;
-- this migration relaxes exactly those two to nullable so NULL = "not tracked."
--
-- SQLite has no ALTER COLUMN / DROP NOT NULL, so this uses the canonical
-- table-rebuild pattern: create the new-shape table, copy rows, drop the old,
-- rename, recreate the index. cohort_period_snapshot is a LEAF (nothing
-- references it) and carries ZERO rows at pilot (out of the slim seed; the
-- E-Write-5 write path is the first writer), so the copy is a no-op today but
-- keeps the migration correct if rows ever pre-exist.
--
-- The E3 + E9 HARD INVARIANTS carry forward VERBATIM from 0009 — restated in
-- the new DDL below so the constraint-by-absence is never lost in a rebuild:
--   E3 + E9: Snapshots store AGGREGATES ONLY. NO per-athlete identifiable
--     column (no athlete_id, no name, no email) may EVER be added. History must
--     survive athlete deletion (E3 retention inversion) WITHOUT retaining PII.
--   E9/Q9: NO rank / score / priority column may EVER be added. Snapshot
--     comparison never renders as ranking (#77 precedent).
--   Parker no-lifecycle: NO status column. A snapshot is a snapshot; if a
--     correction is needed, delete the row and re-snapshot.
--
-- Local apply this slice; remote apply (0013) rides the bank per the standing
-- local-then-remote sequence (CLAUDE.md §6.10).

CREATE TABLE cohort_period_snapshot_new (
  id                        TEXT NOT NULL PRIMARY KEY,
  institution_id            TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  cohort_label              TEXT NOT NULL,
  as_of_note                TEXT,
  snapshot_at               TEXT NOT NULL,

  -- AGGREGATES ONLY. Zero per-athlete identifiable columns, ever.
  athletes_count            INTEGER NOT NULL,
  gps_completed_count       INTEGER NOT NULL,
  gps_rate                  INTEGER NOT NULL,                       -- 0-100 percent
  certified_count           INTEGER NOT NULL,
  cert_rate                 INTEGER NOT NULL,                       -- 0-100 percent
  gifts_count               INTEGER NOT NULL,                       -- SUM(athlete.gifts_count) soft counter
  dollars_moved             INTEGER,                                -- NULLABLE (Q5): NULL = not tracked, never 0
  attendance_rate           INTEGER NOT NULL,                       -- 0-100 percent
  avg_weekly_engagement     INTEGER,                                -- NULLABLE (Q5): NULL = not tracked, never 0

  created_at                TEXT NOT NULL
);

INSERT INTO cohort_period_snapshot_new (
  id, institution_id, cohort_label, as_of_note, snapshot_at,
  athletes_count, gps_completed_count, gps_rate, certified_count, cert_rate,
  gifts_count, dollars_moved, attendance_rate, avg_weekly_engagement, created_at
)
SELECT
  id, institution_id, cohort_label, as_of_note, snapshot_at,
  athletes_count, gps_completed_count, gps_rate, certified_count, cert_rate,
  gifts_count, dollars_moved, attendance_rate, avg_weekly_engagement, created_at
FROM cohort_period_snapshot;

DROP TABLE cohort_period_snapshot;

ALTER TABLE cohort_period_snapshot_new RENAME TO cohort_period_snapshot;

CREATE INDEX idx_cohort_period_snapshot_institution_id ON cohort_period_snapshot(institution_id);
