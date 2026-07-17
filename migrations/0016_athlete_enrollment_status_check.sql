-- Migration 0016 — athlete: CHECK on enrollment_status (P-2, FORK 2).
--
-- FORK 2 mandate: enrollment_status must be constrained to its enum at the DB
-- level, so removing the `?? 'active'` laundering in toAthleteElement is safe
-- (no code path can persist an off-enum value that the reader would then have
-- to mask). SQLite has no ALTER TABLE ADD CONSTRAINT, so this is the canonical
-- table-rebuild. Enum case is TitleCase — verified aligned across stored data,
-- both writers (athletes.js enroll 'Invited', [id].js anonymize 'Sunset'), and
-- STATUS_MAP keys (P-2 R1 audit).
--
-- FK HANDLING (exact): athlete has FOUR inbound child FKs — athlete_activity,
-- athlete_note, athlete_reflection, workshop_attendance, all
-- REFERENCES athlete(id) ON DELETE CASCADE. Dropping athlete with foreign keys
-- ENABLED performs an implicit row-DELETE that would CASCADE those children
-- away. foreign_keys is therefore disabled for the rebuild; children reference
-- `athlete` by NAME and re-resolve to the rebuilt table after the rename (ids
-- are preserved by the INSERT…SELECT). Remote athlete is EMPTY (out-of-seed) so
-- the remote cascade risk is nil regardless; the local dev D1 is applied via
-- node:sqlite OUTSIDE a transaction (so PRAGMA foreign_keys=OFF takes effect —
-- it is a no-op inside a transaction), with the rebuild aborted unless
-- `PRAGMA foreign_keys` reads 0 immediately before the DROP.
--
-- Restated invariants (carried VERBATIM from 0009 so constraint-by-absence
-- survives the rebuild — the 0013 precedent):
--   E9/Q9: NO rank / score / priority / progression / rating / grade column may
--     EVER be added. enrollment_status is relationship state, not a rank.
--   Parker no-lifecycle: NO settlement / processed / cleared column. The
--     enrollment_status enum (Invited/Active/Stalled/Sunset/Certified) is
--     relationship state; 'Sunset' is the E3 anonymize marker.
--   E10: badge is staff-authored descriptive label ONLY; never a rank.
--   §4.2 Option B: person_id is ON DELETE SET NULL (anonymize-to-stub at the
--     endpoint layer); children are ON DELETE CASCADE from athlete.
--
-- Local apply this arc; --remote is a SEPARATE FT step (P-2 L6), does NOT ride
-- the bank.

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

  -- P-2 FORK 2: enum constrained at the DB level (TitleCase per R1 audit).
  enrollment_status        TEXT NOT NULL
                             CHECK (enrollment_status IN
                               ('Invited','Active','Stalled','Sunset','Certified')),
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
