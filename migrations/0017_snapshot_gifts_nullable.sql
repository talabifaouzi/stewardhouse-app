-- Migration 0017 — cohort_period_snapshot: make gifts_count NULLABLE (P-2,
-- FORK 3).
--
-- FORK 3: P-2 adds NO enterprise gift-dollar/count source. gifts_count was
-- derived SUM(athlete.gifts_count) — a soft counter never written by any P-2
-- path, so it froze at 0. A hard 0 reads as a real "$0 / zero gifts"
-- measurement; the honest value is NULL = "not tracked" (the 0013 posture for
-- dollars_moved + avg_weekly_engagement). This relaxes gifts_count to nullable;
-- snapshots.js writes NULL.
--
-- cohort_period_snapshot is a LEAF (nothing references it) and is empty at
-- pilot, so no foreign_keys handling is needed — the 0013 pattern exactly.
--
-- Invariants carried VERBATIM from 0009/0013:
--   E3 + E9: AGGREGATES ONLY. NO per-athlete identifiable column (no athlete_id,
--     name, email) may EVER be added. History survives athlete deletion without
--     retaining PII.
--   E9/Q9: NO rank / score / priority column. Comparison never renders as
--     ranking (#77 precedent).
--   Parker no-lifecycle: NO status column. Correction = delete + re-snapshot.
--
-- Local apply this arc; --remote is a SEPARATE FT step (P-2 L6), does NOT ride
-- the bank.

CREATE TABLE cohort_period_snapshot_new (
  id                        TEXT NOT NULL PRIMARY KEY,
  institution_id            TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  cohort_label              TEXT NOT NULL,
  as_of_note                TEXT,
  snapshot_at               TEXT NOT NULL,

  -- AGGREGATES ONLY. Zero per-athlete identifiable columns, ever.
  athletes_count            INTEGER NOT NULL,
  gps_completed_count       INTEGER NOT NULL,
  gps_rate                  INTEGER NOT NULL,   -- 0-100 percent
  certified_count           INTEGER NOT NULL,
  cert_rate                 INTEGER NOT NULL,   -- 0-100 percent
  gifts_count               INTEGER,            -- NULLABLE (FORK 3): NULL = not tracked, never 0
  dollars_moved             INTEGER,            -- NULLABLE (0013): NULL = not tracked
  attendance_rate           INTEGER NOT NULL,   -- 0-100 percent
  avg_weekly_engagement     INTEGER,            -- NULLABLE (0013): NULL = not tracked

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
