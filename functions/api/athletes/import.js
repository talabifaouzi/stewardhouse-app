// POST /api/athletes/import — bulk roster import (roster-import arc).
//
// THE SERVER HALF ONLY. The client parses the pasted roster and maps its
// columns; this endpoint receives ALREADY-MAPPED data and NEVER guesses. It
// re-validates everything rather than trusting the client's shape, because a
// mapping UI is an affordance and this is the authority.
//
// INPUT SHAPE (ruled): pasted text, not file upload, so the roster arrives as
// JSON through request.json() like every other write in this tree. The envelope
// is { athletes: [...] }, an OBJECT rather than a bare array: athletes.js:147
// already rejects a bare array, rejectRankKeys expects an object, and
// attendance.js established the one-key-holding-an-array idiom
// ({ records: [...] }).
//
// A ROW COMES IN ONE OF TWO SHAPES, and carries the keys of exactly one:
// { name, email } or { firstName, lastName, email }. The operator declares
// which in the mapping UI; that declaration is NEVER transmitted, and this
// endpoint keys its allowlist on the keys a row actually carries, so a row
// mixing the two is rejected as unpermitted fields rather than special-cased.
// NO SPLITTER EXISTS at this or any other layer: a single Name cell is stored
// as written, two halves are joined with one space, and neither direction
// guesses anything the file does not encode.
//
// WHAT IT WRITES (C-1 DISCARD, ruled): name and email ONLY. A roster file will
// carry sport, year, position, phone and more; they are dropped. This matches
// POST /api/athletes, which explicitly NULLs exactly those columns pre-claim.
// Anything else would be a second enrollment path with different rules.
//
// WHAT IT DELIBERATELY OMITS FROM THE INSERT, and why omission is correct
// rather than lazy: every athlete column outside the seven written below is
// NULLABLE WITH NO DEFAULT, so omitting it stores NULL, which is exactly the
// ruled landing state. person_id, management_mode and consent_acknowledged_at
// are the three that matter and all three must be NULL. The counters
// (lessons_count, gifts_count, certified) are NOT NULL DEFAULT 0 and the schema
// fills them. Omission also buys the parameter budget the D1 cap demands: see
// INSERT_CHUNK_ROWS.
//
// CONSENT (ruled): 'Pending' IS the deferral. An imported athlete has
// acknowledged nothing, and the offline conversation before invitation is where
// acknowledgment happens. So NO consentAcknowledged field is accepted and
// consent_acknowledged_at is NOT stamped. This differs DELIBERATELY from
// POST /api/athletes, which requires consentAcknowledged === true per E6 and
// stamps the column.
//
// PARTIAL FAILURE (ruled): REJECT THE WHOLE BATCH. Validation collects EVERY
// bad row before returning, never the first, and the 400 names each one by its
// index in the submitted array with the reason. A partial roster with no record
// of what did not land is the worse outcome; the operator fixes the paste and
// resubmits.
//
// DUPLICATES (ruled): NO dedup, NO unique index, report without blocking. See
// findMatches for what "likely match" is allowed to mean here.
//
// D1 BOUND-PARAMETER LIMIT: 100 per query, NOT SQLite's 32,766 (CLAUDE.md §10).
// A local probe cannot see this cap and miniflare does not enforce it, so the
// arithmetic below is derived from the published limit rather than measured.

import {
  makeDb, requireGatedEnterprise, rejectRankKeys, jsonError, jsonOk,
} from '../../_lib/gate.js';
import { ATHLETE_ELEMENT_COLUMNS, toAthleteElement, EMAIL_REGEX } from '../athletes.js';

// The seven columns each row supplies. Everything else is omitted (NULL) or
// schema-defaulted; see the header.
const INSERT_COLUMNS = 7;

// D1 allows 100 bound parameters per query. 7 x 14 = 98 fits; 7 x 15 = 105 does
// not. Verified against a real Kysely compile rather than assumed.
const INSERT_CHUNK_ROWS = Math.floor(100 / INSERT_COLUMNS);   // 14

// Re-SELECT chunk: ids only, plus one parameter for the institution scope.
// 90 + 1 leaves headroom under the same 100-parameter cap.
const SELECT_CHUNK_IDS = 90;

// MAXIMUM ROWS PER IMPORT. Nothing rules this; the reasoning is recorded so a
// later change is a decision rather than a drift.
//
// It is NOT bound by D1's per-query parameter cap, which chunking already
// handles, and 500 rows is only 36 statements against a 1000-queries-per-
// invocation budget on Workers Paid. What bounds it is the shape of the act:
//   - A full NCAA Division I athletic department carries roughly 500 to 700
//     student-athletes across all sports, and most sit under 500. One paste
//     should cover an ordinary department; a larger one pastes by sport, which
//     is how rosters are actually maintained.
//   - Whole-batch rejection means a large paste that fails wastes the whole
//     attempt, so the cap is also a limit on how much work one typo can cost.
//   - The rejection response names EVERY bad row, so the cap bounds the
//     worst-case response at 500 entries.
//   - 500 rows of pasted text is roughly 30KB, which is a reasonable paste and
//     well under the 100,000-byte statement cap once chunked.
// The 30-second query-duration cap is not close to binding at 36 small INSERTs.
const MAX_IMPORT_ROWS = 500;

// PER-SHAPE ALLOWLISTS, keyed on which keys the row actually carries. There is
// deliberately NO permissive four-key allowlist: a row carrying `name` is
// validated against the single-name list, in which `firstName` and `lastName`
// are simply not members, so a row mixing the two shapes is rejected by the
// ordinary extra-keys check rather than by a special case written to catch it.
// The mixed row is UNEXPRESSIBLE rather than forbidden.
//
// THE SHAPE IS NEVER TRANSMITTED. The client declares a shape in its own UI to
// decide which dropdowns to render; the endpoint does not learn what was
// displayed, accepts no shape field, and reads only the row in front of it.
const ROW_KEYS_SINGLE = ['name', 'email'];
const ROW_KEYS_SPLIT = ['firstName', 'lastName', 'email'];

// Name comparison key: case-folded, whitespace-collapsed. Used ONLY to surface
// matches, never to block or to merge.
function nameKey(s) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Validate one submitted row. Returns { fields } or { reason }. Never throws,
// never mutates, and never infers a missing value from another field.
function validateRow(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return { reason: 'row must be an object' };
  }
  const forbidden = rejectRankKeys(row);
  if (forbidden) return { reason: `field "${forbidden}" is not permitted` };

  // Which shape this row is IN, from its own keys. `name` present means the
  // single-name shape; anything else is read as the first/last shape, which is
  // also the right default for a row carrying neither, since it then fails on
  // "firstName is required" rather than on a key the operator never mapped.
  const isSingle = Object.prototype.hasOwnProperty.call(row, 'name');
  const allowed = isSingle ? ROW_KEYS_SINGLE : ROW_KEYS_SPLIT;

  const extra = Object.keys(row).filter((k) => !allowed.includes(k));
  if (extra.length > 0) {
    return { reason: `field(s) not permitted: ${extra.join(', ')}` };
  }

  const rawEmail = typeof row.email === 'string' ? row.email.trim() : '';

  // SINGLE-NAME SHAPE. The cell is stored exactly as written, with whitespace
  // collapsed the same way a joined name is. It is NEVER SPLIT: what a single
  // Name cell holds is a fact about the person that the file does not encode,
  // so any split would be the endpoint inventing a record.
  if (isSingle) {
    const whole = typeof row.name === 'string' ? row.name.trim().replace(/\s+/g, ' ') : '';
    if (whole.length === 0) return { reason: 'name is required' };
    if (rawEmail.length === 0) return { reason: 'email is required' };
    if (!EMAIL_REGEX.test(rawEmail)) return { reason: 'email is not a valid address' };
    return { fields: { name: whole, email: rawEmail.toLowerCase() } };
  }

  // FIRST/LAST SHAPE. Both halves are required. A roster row missing either is
  // a mapping error the operator can see and fix; guessing which half is
  // present, or storing a one-word name, would be the endpoint inventing a
  // record just as surely as a split would.
  const first = typeof row.firstName === 'string' ? row.firstName.trim() : '';
  if (first.length === 0) return { reason: 'firstName is required' };
  const last = typeof row.lastName === 'string' ? row.lastName.trim() : '';
  if (last.length === 0) return { reason: 'lastName is required' };

  if (rawEmail.length === 0) return { reason: 'email is required' };
  if (!EMAIL_REGEX.test(rawEmail)) return { reason: 'email is not a valid address' };

  return {
    fields: {
      // "First Last", joined with a single space (ruled).
      name: `${first} ${last}`,
      // Normalized the way the auth-gate seam, the claim hook and the invite
      // mint all normalize, so athlete.email and a later person.invite_email
      // never diverge. §5.2 FILED OBSERVATION asks import to do exactly this.
      email: rawEmail.toLowerCase(),
    },
  };
}

// LIKELY MATCH, and why it is defined this narrowly.
//
// The schema gives an athlete NO natural key: `athlete` carries exactly one
// unique constraint, its PRIMARY KEY, and two athletes may legally share an
// institution, a name and an email. So a match here can only ever be a
// RESEMBLANCE, never an identity, and the ruling is exposure not judgment.
//
// Therefore: EXACT equality only, on normalized values, reported with the field
// that matched. No fuzzy distance, no nickname expansion, no confidence value,
// no ordering by strength. Any of those would rank one candidate above another,
// which is a judgment about a person and is what §7 forbids. An operator
// reading "these two rows share an email" can decide; an operator reading "87%
// match" has been told what to think.
//
// Sunset stubs are EXCLUDED. An anonymized athlete carries name='redacted' and
// email NULL, so it cannot match on either field, and surfacing one would
// expose a record E3 exists to retire.
function findMatches(rows, existing) {
  const byEmail = new Map();
  const byName = new Map();
  for (const e of existing) {
    if (e.email) {
      const k = e.email.trim().toLowerCase();
      if (!byEmail.has(k)) byEmail.set(k, []);
      byEmail.get(k).push(e);
    }
    if (e.name) {
      const k = nameKey(e.name);
      if (!byName.has(k)) byName.set(k, []);
      byName.get(k).push(e);
    }
  }

  const onRoster = [];
  rows.forEach((r, index) => {
    for (const hit of byEmail.get(r.email) || []) {
      onRoster.push({ index, matchedOn: 'email', athleteId: hit.id, athleteName: hit.name });
    }
    for (const hit of byName.get(nameKey(r.name)) || []) {
      // Do not report the same existing athlete twice for one submitted row.
      if (onRoster.some((m) => m.index === index && m.athleteId === hit.id)) continue;
      onRoster.push({ index, matchedOn: 'name', athleteId: hit.id, athleteName: hit.name });
    }
  });

  // Rows that resemble each other WITHIN the submission. A paste that lists the
  // same athlete twice is the commonest roster error and the operator cannot
  // see it from the roster, so it is reported separately rather than folded in.
  const withinPaste = [];
  for (const field of ['email', 'name']) {
    const seen = new Map();
    rows.forEach((r, index) => {
      const k = field === 'email' ? r.email : nameKey(r.name);
      if (!seen.has(k)) seen.set(k, []);
      seen.get(k).push(index);
    });
    for (const indexes of seen.values()) {
      if (indexes.length > 1) withinPaste.push({ matchedOn: field, indexes });
    }
  }

  return { onRoster, withinPaste };
}

export async function onRequestPost(context) {
  const db = makeDb(context);

  // Layer 1: gated staff only.
  const { person, error, status } = await requireGatedEnterprise(db, context);
  if (error) return jsonError(error, status);

  // Layer 2: body parses.
  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }

  // Layer 3: §7 no-ranking allowlist, on the envelope.
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  // Layer 4: envelope shape.
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Body must be an object', 400);
  }
  const extraKeys = Object.keys(body).filter((k) => k !== 'athletes');
  if (extraKeys.length > 0) {
    return jsonError(`Field(s) not permitted: ${extraKeys.join(', ')}`, 400);
  }
  const submitted = body.athletes;
  if (!Array.isArray(submitted)) {
    return jsonError('athletes must be an array', 400);
  }
  if (submitted.length === 0) {
    return jsonError('athletes must contain at least one row', 400);
  }
  if (submitted.length > MAX_IMPORT_ROWS) {
    return jsonError(
      `An import is limited to ${MAX_IMPORT_ROWS} rows; ${submitted.length} were submitted. Split the roster and import in parts.`,
      400,
    );
  }

  // Layer 5: owner scope from institution_contact, NEVER the body.
  const contact = await db
    .selectFrom('institution_contact')
    .select(['institution_id', 'is_default_operator'])
    .where('person_id', '=', person.id)
    .orderBy('is_default_operator', 'desc')
    .executeTakeFirst();
  if (!contact) {
    return jsonError('No institution is associated with this operator', 403);
  }

  // Layer 6: validate EVERY row and collect EVERY rejection. Not the first:
  // returning one at a time would make a 200-row paste a 200-round-trip repair.
  const valid = [];
  const rejected = [];
  submitted.forEach((row, index) => {
    const result = validateRow(row);
    if (result.reason) rejected.push({ index, reason: result.reason });
    else valid.push(result.fields);
  });
  if (rejected.length > 0) {
    // `error` carries the summary so the existing client helper (which reads
    // body.error) surfaces something useful unchanged; `rejected` carries the
    // per-row detail. NOTHING has been written at this point.
    return jsonOk({
      error: `${rejected.length} of ${submitted.length} row(s) could not be imported. No athletes were added.`,
      rejected,
    }, 400);
  }

  // Likely-match report. Read the institution's roster ONCE and compare in
  // memory: an IN (...) over 500 emails would blow the 100-parameter cap, and
  // /api/me already reads a whole institution roster in one query (me.js:128).
  const existing = await db
    .selectFrom('athlete')
    .select(['id', 'name', 'email'])
    .where('institution_id', '=', contact.institution_id)
    .where('enrollment_status', '!=', 'Sunset')
    .execute();
  const matches = findMatches(valid, existing);

  const nowIso = new Date().toISOString();
  const rows = valid.map((f) => ({
    id: crypto.randomUUID(),
    institution_id: contact.institution_id,
    name: f.name,
    email: f.email,
    // Ruled landing state. person_id, management_mode and
    // consent_acknowledged_at are omitted and therefore NULL; see the header.
    enrollment_status: 'Pending',
    created_at: nowIso,
    updated_at: nowIso,
  }));

  // CHUNK BEFORE ASSEMBLING THE BATCH, then hand every chunk to ONE
  // env.DB.batch(). D1's batch is a single implicit transaction, so chunking
  // preserves all-or-nothing ACROSS chunks: one bad chunk rolls back every
  // other. Chunking as separate calls would destroy exactly that property.
  const compiled = [];
  for (let i = 0; i < rows.length; i += INSERT_CHUNK_ROWS) {
    compiled.push(db.insertInto('athlete').values(rows.slice(i, i + INSERT_CHUNK_ROWS)).compile());
  }

  try {
    await context.env.DB.batch(
      compiled.map((c) => context.env.DB.prepare(c.sql).bind(...c.parameters)),
    );
  } catch (err) {
    return jsonError('Failed to import athletes', 500);
  }

  // Read the created rows back through the shared mapper so the element shape
  // stays in one place. Chunked by id for the same parameter cap; scoped to the
  // institution as defence in depth, though the ids were minted here.
  const ids = rows.map((r) => r.id);
  const created = [];
  for (let i = 0; i < ids.length; i += SELECT_CHUNK_IDS) {
    const page = await db
      .selectFrom('athlete')
      .select(ATHLETE_ELEMENT_COLUMNS)
      .where('id', 'in', ids.slice(i, i + SELECT_CHUNK_IDS))
      .where('institution_id', '=', contact.institution_id)
      .execute();
    created.push(...page);
  }

  return jsonOk({
    imported: created.length,
    athletes: created.map(toAthleteElement),
    matches,
  }, 201);
}
