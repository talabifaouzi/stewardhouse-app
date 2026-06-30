-- 0004_invite_email.sql
ALTER TABLE person ADD COLUMN invite_email TEXT;
CREATE UNIQUE INDEX idx_person_invite_email ON person(invite_email);
