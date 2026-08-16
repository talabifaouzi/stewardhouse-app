// DELETE /api/invites/:id withdraws an UNCLAIMED invite, hard-deleting the
// person row so its address is released from idx_person_invite_email and can be
// invited again. Sibling of POST /api/invites (the create); that file's
// docblock line "There is no invite edit/delete path in this slice" describes
// the slice it shipped in, not the current tree.
//
// GATED WRITE, requireGatedOps, matching the create exactly: session → person →
// type==='ops' AND $.ops.demo_gate===1. Production ops rows carry the gate only
// by FT's deliberate designation, so this stays dark until then.
//
// Export is onRequestDelete ONLY. CF Pages auto-405s GET/POST/PUT.
//
// ─────────────────────────────────────────────────────────────────────────
// FIRST DELETION AT THE PERSON BOUNDARY IN THIS CODEBASE.
//
// Nothing has ever deleted a `person` row from application code. The only
// DELETE FROM person statements in the repo are the two smoke scripts cleaning
// up their own seeded rows. That makes this precedent-setting, and the reasoning
// belongs here rather than in a commit message that nobody greps.
//
// RULING E CLAUSE 1 DOES NOT GOVERN. Clause 1 is scoped to "on account-deletion
// request": a person exercising a right over their own data, answered with
// immediate suppression of the person plus their gifts and scenarios, then a
// mandatory background hard-purge. None of its preconditions hold here. An
// unclaimed invite has NO account (auth_user_id IS NULL), NO session, NOBODY who
// could make the request, and NO business data to suppress. The actor is an
// operator withdrawing an offer that was never accepted, which is a different
// act from deleting a person. Clause 1's two-phase machinery is the right
// instrument for the other case and the wrong one for this.
//
// HARD DELETE IS CORRECT PER CLAUSE 2, which states the default outright:
// "Default is full deletion; anonymize-retain is the documented EXCEPTION."
// Anonymize is invoked when a referential-integrity or aggregate need requires a
// record to persist. Compare the athlete precedent (athletes/[id].js), which
// anonymizes to a stub because E3 requires already-taken cohort snapshots to
// stay byte-identical: there is a real aggregate with a real consumer. An
// unclaimed invite has no aggregate consumer at all. Nothing counts it, nothing
// derives from it, nothing breaks when it is gone.
//
// ALL THIRTEEN INBOUND FKs TO person ARE EMPTY BY CONSTRUCTION on an unclaimed
// row. gift, scenario, client, practice_lesson, doc_category, cohort and
// institution_contact are ON DELETE CASCADE; athlete.person_id is SET NULL;
// athlete_note.author_person_id, workshop.facilitator_person_id,
// workshop_followup.owner_person_id and compliance_audit.user_person_id carry no
// ON DELETE clause and therefore reject. An unclaimed person has never signed
// in, so it cannot have given a gift, built a scenario, owned clients, been made
// an institution contact, authored a note or taken an audited action. The delete
// takes nothing with it. That is exactly why the predicate below is the whole
// safety story: the SAME statement against a CLAIMED row would cascade across
// seven tables and destroy real business data.
//
// soft_deleted_at IS DELIBERATELY NOT USED. The column exists from migration
// 0001 and roster.js already filters on it, so a soft delete would vanish the row
// from the Accounts view with no read change anywhere, which is tempting. It is
// wrong here for a decisive reason: idx_person_invite_email is a PLAIN UNIQUE
// index with no partial predicate, so a soft-deleted row STILL OCCUPIES ITS
// ADDRESS. The operator would withdraw an invite, watch it disappear, try to
// re-invite, and get the create's 409 about an address they can no longer see.
// That is worse than doing nothing. Clause 1's second phase would eventually
// free it, but the mandatory background hard-purge does not exist: there is no
// cron, no scheduled worker and no [triggers] block anywhere in this project.
// Writing soft_deleted_at without a purge leaves rows in a state nothing will
// ever advance, which is Clause 1's own "suppression alone is NOT deletion."
//
// FK ENFORCEMENT IS VERIFIED BUT NOT RELIED ON. Probed 2026-08-15 against a
// VACUUM INTO scratch copy: PRAGMA foreign_keys reads 1 through the D1 runtime
// (wrangler d1 execute --local), and under that setting CASCADE cascaded,
// SET NULL nulled, and a NO ACTION parent delete was REJECTED with "FOREIGN KEY
// constraint failed". So enforcement is real locally. It is still not the
// control here, for three reasons: (1) it blocks ORPHANING, not DESTRUCTION, so
// it would happily let a claimed person be deleted and cascade seven tables
// away, which is the failure that actually matters; (2) a rejection surfaces as
// an opaque constraint error, not a response shape; (3) PRODUCTION D1
// enforcement is UNVERIFIED, since checking it needs a remote write. The
// predicate below behaves identically regardless.
// ─────────────────────────────────────────────────────────────────────────
//
// Response shapes:
//   No session:               401, { error: 'Not signed in' }
//   Session, no person:       403, { error: 'No account found for session' }
//   Session, non-ops/no gate: 403, { error: 'Not authorized' }
//   Invalid id:               400, { error: 'Invalid invite id' }
//   Own row:                  409, { error: 'You cannot delete your own account.' }
//   Claimed row:              409, { error: 'This account has been claimed and cannot be deleted.' }
//   No such row:              404, { error: 'Invite not found' }
//   Success:                  200, { id, deleted: true }   (snapshots/[id].js shape)
//
// WHY 409 FOR SELF RATHER THAN 403. The session person necessarily HAS a session,
// so auth_user_id is non-null, so self-delete is a SUBSET of the claimed case and
// would already return the claimed 409 if it were not special-cased. Answering a
// subset with a different status family would be incoherent. 403 is also already
// carrying two orthogonal meanings in gate.js (wrong type, and type-right but
// ungated), which P-6 filed as a defect; adding "right person, wrong target"
// would make that worse. The self branch exists only to replace a correct but
// unhelpful message with a specific one, so it keeps the status and changes the
// words. It runs BEFORE the claimed branch for that reason.
//
// WHY 409 FOR CLAIMED RATHER THAN THE 404 USED BY THE SIBLING DELETES.
// exclusions/[id].js and snapshots/[id].js return an identical 404 for "no such
// row" and "not yours" so a caller cannot probe which ids exist. That reasoning
// does not transfer: this caller is authenticated AND gated AND already reads
// every row's claimed flag from GET /api/roster, so there is nothing left to
// enumerate. A 404 here would tell an operator that a row visible in their own
// Accounts view does not exist.

import { makeDb, requireGatedOps, jsonError, jsonOk } from '../../_lib/gate.js';

export async function onRequestDelete(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedOps(db, context);
  if (error) return jsonError(error, status);

  const inviteId = context.params.id;
  if (!inviteId || typeof inviteId !== 'string') {
    return jsonError('Invalid invite id', 400);
  }

  // Self-delete guard, BEFORE the delete runs. Deleting your own row revokes
  // your own access mid-session and cascades your own data; the operator almost
  // certainly meant a different row.
  if (inviteId === person.id) {
    return jsonError('You cannot delete your own account.', 409);
  }

  // Lookup for the RESPONSE ONLY, never as the delete's guard. It exists solely
  // to tell 404 from 409; the delete below carries the full predicate itself, so
  // a row claimed between this read and that write is still refused by the
  // statement rather than by this check. No read-then-write window.
  const existing = await db
    .selectFrom('person')
    .select((eb) => [eb.ref('auth_user_id').as('auth_user_id')])
    .where('id', '=', inviteId)
    .executeTakeFirst();
  if (!existing) {
    return jsonError('Invite not found', 404);
  }
  if (existing.auth_user_id !== null) {
    return jsonError('This account has been claimed and cannot be deleted.', 409);
  }

  // THE PREDICATE IS THE CONTROL. `auth_user_id IS NULL` lives in the DELETE
  // itself, not in the lookup above. A claimed row cannot be removed by this
  // statement under any interleaving.
  let removed = 0;
  try {
    const res = await db
      .deleteFrom('person')
      .where('id', '=', inviteId)
      .where('auth_user_id', 'is', null)
      .executeTakeFirst();
    removed = Number(res?.numDeletedRows ?? 0n);
  } catch (err) {
    return jsonError('Failed to remove invite', 500);
  }

  // Zero rows here means the row was claimed between the lookup and the delete.
  // The predicate held; report it as the claimed case rather than a false 200.
  if (removed === 0) {
    return jsonError('This account has been claimed and cannot be deleted.', 409);
  }

  return jsonOk({ id: inviteId, deleted: true });
}
