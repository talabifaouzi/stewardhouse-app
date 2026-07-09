// Shared compliance-audit write machinery (E-Slice E-Write-4, E7).
//
// prepareAuditInsert resolves the operator's role + display name from their
// institution_contact AT WRITE TIME (E7 denormalization: "user_role is
// intentionally DENORMALIZED from the live institution_contact.role_title at
// audit-write time — historical accuracy demands that a role change today does
// NOT rewrite past audit-log rows"), stamps an ISO timestamp, and returns a
// COMPOSABLE Kysely insert (so the exclusion write can .compile() it into the
// same env.DB.batch() as the exclusion row — one atomic transaction) plus the
// row + resolved display name for building the response element.
//
// The role/display resolution is a single innerJoin (institution_contact ⋈
// person); the default-operator row wins the tie-break. If the operator somehow
// has no contact row for the institution, user_role falls back to 'Staff' and
// the display name to null — the caller has already institution-scoped the
// write, so this is a defensive floor, not a control path.

export async function prepareAuditInsert(db, { institutionId, userPersonId, action, target = null, reason = null, notes = null }) {
  const who = await db
    .selectFrom('institution_contact as ic')
    .innerJoin('person as p', 'p.id', 'ic.person_id')
    .select(['ic.role_title as role_title', 'p.display_name as display_name'])
    .where('ic.person_id', '=', userPersonId)
    .where('ic.institution_id', '=', institutionId)
    .orderBy('ic.is_default_operator', 'desc')
    .executeTakeFirst();

  const row = {
    id: crypto.randomUUID(),
    institution_id: institutionId,
    timestamp: new Date().toISOString(),
    user_person_id: userPersonId,
    user_role: who?.role_title ?? 'Staff',   // E7: frozen at write time
    action,
    target,
    reason,
    notes,
  };

  return {
    insert: db.insertInto('compliance_audit').values(row),
    row,
    userDisplay: who?.display_name ?? null,
  };
}

// Maps a compliance_audit row (+ resolved author display name) to the
// fixture-shaped element the Compliance audit list consumes. Same shape as the
// enterpriseFixtures complianceAuditLog entries: user is the display name,
// userRole the denormalized role_title.
export function toAuditElement(row, userDisplay) {
  return {
    id: row.id,
    timestamp: row.timestamp,
    user: userDisplay ?? null,
    userRole: row.user_role,
    action: row.action,
    target: row.target,
    reason: row.reason,
    notes: row.notes,
  };
}
