-- =============================================================================
-- 0021 — AUTH_SEND_LOG: one row per ATTEMPTED magic-link send.
--
-- WHAT THIS IS FOR. The magic-link send stamps NOTHING today. A total
-- authentication outage therefore produces zero durable signal, which is
-- exactly what happened on 2026-07-20: production sign-in was down for roughly
-- five days and was detected only because FT happened to attempt a sign-in.
-- CLAUDE.md §11 records that incident and files the observability gap.
--
-- WHAT RULED IT. FT ruled: catch the send failure and stamp the outcome so it
-- is findable, in a DEDICATED RECORD rather than on person.extensions.
-- Migration accepted. Alerting is PARKED and nothing reads this table in code.
--
-- Two standing constraints ride the endpoint change, recorded here because a
-- reader of this table needs to know what the rows cost:
--   1. Client-observable behaviour is UNCHANGED. The send failure is caught,
--      stamped, and RETHROWN unchanged, so better-auth still returns its 500
--      and SignIn.jsx renders the same string. Swallowing the error would make
--      better-auth return {status:true} (its magic-link endpoint returns
--      unconditionally after awaiting the callback), which would tell a user
--      their email was sent when it was not.
--   2. The stamp NEVER destroys the error it records. The stamp write carries
--      its own try/catch and swallows; the original error always propagates.
--
-- -----------------------------------------------------------------------------
-- THE BLIND SPOT. READ THIS BEFORE TRUSTING A GAP IN THIS TABLE.
--
-- A row exists only where the Worker ran far enough to reach the catch block
-- AND D1 was writable. That is a narrower set than "sends attempted".
--
-- A GAP MEANS "QUIET OR BROKEN" AND CANNOT DISTINGUISH THEM. No rows for a day
-- is what a quiet pilot looks like, and it is also what a broken deploy looks
-- like. This table cannot tell you which. A SUCCESS ROW IS THE ONLY POSITIVE
-- SIGNAL, and the table carries NO EXPECTED-RATE BASELINE: "last success was
-- five days ago" is alarming only to a reader who independently knows sign-ins
-- were expected in that window, and at pilot volume that is genuinely
-- ambiguous.
--
-- THE CORRELATION IS ADVERSE, which is the part that matters. The conditions
-- most likely to break sending are the same conditions most likely to break
-- stamping: a bad deploy, a Worker fault, an unavailable D1 binding, a CPU or
-- wall-clock limit. A failure that takes out the Worker takes out its own
-- record. Absence of rows is therefore NOT evidence of absence of failure.
--
-- WHAT IT WOULD HAVE CAUGHT: the July 2026 incident precisely. There the
-- Worker was healthy, D1 was writable, and only the external Resend call
-- failed (401, drifted API key). Every attempt in those five days would have
-- written a failure row naming the status. That is the case this table is for,
-- and it is a narrower case than "any outage".
--
-- -----------------------------------------------------------------------------
-- RETENTION IS UNBOUNDED AND UNRESOLVED. Stated plainly rather than deferred.
--
-- This table is append-only and NOTHING PRUNES IT. There is no cron, no
-- scheduled worker and no [triggers] block anywhere in this project, so no
-- purge can run on any schedule. It grows with every attempted send, forever.
--
-- Ruling E Clause 3 asks for the shortest defensible window (working proposal
-- ~30 days) followed by a hard purge, and is COUNSEL-GATED and UNANSWERED. No
-- window is set here, because setting one would be inventing the standard the
-- clause defers.
--
-- It joins FOUR existing unpruned tables (compliance_audit, athlete_activity,
-- athlete_note, client_note), so this is not a new class of debt. What is new:
-- those four grow with deliberate operator actions, and this one grows with
-- input from anyone who can reach the sign-in form.
--
-- -----------------------------------------------------------------------------
-- THE ALLOWLIST REFUSAL IS DELIBERATELY NOT STAMPED.
--
-- functions/api/auth/[[route]].js:122-130 refuses an address that is neither a
-- known auth_user nor an unexpired invite, and returns 403 BEFORE better-auth
-- is invoked. sendMagicLink never runs, so NO SEND IS ATTEMPTED and there is no
-- outcome to record.
--
-- Stamping it would also be a different thing entirely: it would collect the
-- addresses of people with NO RELATIONSHIP TO STEWARDHOUSE, typed by anyone who
-- can reach the form. This table logs a subsystem's behaviour. A refusal log
-- would be a log of strangers. Only attempted sends get rows.
--
-- -----------------------------------------------------------------------------
-- EMAIL IS STORED AND IS NEVER EMITTED (E8 discipline). No endpoint returns
-- rows from this table; nothing in functions/ reads it. It is reachable only
-- by a direct d1 execute, which is FT-only for --remote per §6.10.
--
-- CONVENTIONS. TEXT UUID primary key generated application-side by
-- crypto.randomUUID() (the house pattern, 21 call sites in functions/); TEXT
-- ISO 8601 timestamp, matching every StewardHouse-authored table rather than
-- the INTEGER epoch-ms the better-auth-owned tables use. No created_at beyond
-- attempted_at: the row IS the event, and a second clock would imply the two
-- could differ.
-- =============================================================================

CREATE TABLE auth_send_log (
  id             TEXT NOT NULL PRIMARY KEY,                 -- opaque UUID, crypto.randomUUID()
  email          TEXT NOT NULL,                             -- NEVER emitted to any client (E8)
  outcome        TEXT NOT NULL
                   CHECK (outcome IN ('success', 'failure')),
  error_text     TEXT,                                      -- NULL on success; the thrown message on failure
  attempted_at   TEXT NOT NULL                              -- ISO 8601 with time
);

-- The only query shape anyone has: "what happened recently", newest first.
CREATE INDEX idx_auth_send_log_attempted_at ON auth_send_log(attempted_at);
