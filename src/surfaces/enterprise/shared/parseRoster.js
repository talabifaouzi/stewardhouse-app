// Roster paste parser (roster-import arc, client half).
//
// PASTED TEXT, not file upload (ruled). There is no file input, no FormData and
// no FileReader anywhere in this path: the operator copies a range out of a
// spreadsheet and pastes it, which is why DELIMITER SNIFFING is what makes
// Excel work with no dependency. Copying a range out of Excel yields TAB
// separated text; a saved-then-opened .csv yields commas. Sniffing covers both
// without asking the operator which they have.
//
// NO DEPENDENCY. package.json carries six runtime deps and none of them parses
// delimited text. This module is that parser, and it is deliberately a plain
// module with no React import so it can be executed directly against
// constructed inputs.
//
// IT NEVER GUESSES A MAPPING. suggestMapping proposes a DEFAULT the operator
// confirms or changes; nothing here decides which column is which.

// The endpoint's own cap (functions/api/athletes/import.js MAX_IMPORT_ROWS).
// Mirrored so the operator learns before submitting rather than after a round
// trip. The endpoint remains the authority.
export const MAX_IMPORT_ROWS = 500;

const TAB = '\t';
const COMMA = ',';

// Scan the FIRST RECORD counting tabs against commas OUTSIDE quoted fields, and
// take the winner. Quote tracking does not depend on knowing the delimiter, so
// this can run before the parse it configures.
//
// A tie, or neither present, resolves to comma. That case is a single-column
// paste, where the choice cannot change the result: one field either way.
export function sniffDelimiter(text) {
  let tabs = 0;
  let commas = 0;
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { i += 1; continue; }   // escaped quote
        inQuotes = false;
      }
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === '\n' || ch === '\r') break;                // end of the first record
    if (ch === TAB) tabs += 1;
    else if (ch === COMMA) commas += 1;
  }
  return { delimiter: tabs > commas ? TAB : COMMA, tabs, commas };
}

// Character scanner rather than a line split, so a quoted field containing a
// NEWLINE does not silently become two garbage rows. Each record remembers the
// physical line it started on, which is what the operator sees in their paste
// and what rejected rows are reported against.
function scanRecords(text, delimiter) {
  const records = [];
  let fields = [];
  let value = '';
  let wasQuoted = false;
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;

  const endField = () => {
    // Unquoted fields are trimmed; quoted content is preserved verbatim, which
    // is the RFC 4180 reading. The server trims again for its own purposes, so
    // this only decides what a deliberately quoted "  x  " means here.
    fields.push(wasQuoted ? value : value.trim());
    value = '';
    wasQuoted = false;
  };
  const endRecord = () => {
    endField();
    records.push({ line: recordLine, fields });
    fields = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { value += '"'; i += 1; continue; }   // "" -> literal "
        inQuotes = false;
        continue;
      }
      if (ch === '\n') line += 1;                      // newline inside a quoted field
      value += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; wasQuoted = true; continue; }
    if (ch === delimiter) { endField(); continue; }
    if (ch === '\r') {
      // CRLF and lone CR both end a record; the LF of a CRLF is swallowed here.
      if (text[i + 1] === '\n') i += 1;
      endRecord();
      line += 1;
      recordLine = line;
      continue;
    }
    if (ch === '\n') {
      endRecord();
      line += 1;
      recordLine = line;
      continue;
    }
    value += ch;
  }
  // A trailing record with no closing newline still counts.
  if (value !== '' || fields.length > 0 || wasQuoted) endRecord();
  return records;
}

/**
 * Parse a pasted roster.
 *
 * @param {string} text     raw paste
 * @param {{hasHeader?: boolean}} [options]
 * @returns {{
 *   delimiter: string, delimiterName: string, tabs: number, commas: number,
 *   header: string[], hasHeader: boolean,
 *   rows: Array<{line: number, fields: string[], ragged: boolean}>,
 *   blankLines: number,
 *   ragged: Array<{line: number, got: number, expected: number}>,
 * }}
 */
export function parseRoster(text, options) {
  const hasHeader = !(options && options.hasHeader === false);
  // A UTF-8 BOM survives a copy out of some spreadsheets and would otherwise
  // become part of the first header cell, breaking an otherwise exact match.
  const clean = String(text == null ? '' : text).replace(/^﻿/, '');

  const { delimiter, tabs, commas } = sniffDelimiter(clean);
  const all = scanRecords(clean, delimiter);

  // Blank lines are dropped, not treated as rows: a record whose every field is
  // empty carries no athlete, whether it came from a truly empty line or from a
  // line of bare delimiters that a spreadsheet emitted for an empty row.
  const nonBlank = [];
  let blankLines = 0;
  for (const r of all) {
    if (r.fields.every((f) => f.trim() === '')) blankLines += 1;
    else nonBlank.push(r);
  }

  let header;
  let dataRecords;
  if (hasHeader && nonBlank.length > 0) {
    header = nonBlank[0].fields;
    dataRecords = nonBlank.slice(1);
  } else {
    // No header: synthesize labels so the mapping selects still read sensibly,
    // and treat EVERY record as data. Without this an operator who pasted
    // headerless rows would silently lose their first athlete to the header.
    const width = nonBlank.reduce((m, r) => Math.max(m, r.fields.length), 0);
    header = Array.from({ length: width }, (_, i) => `Column ${i + 1}`);
    dataRecords = nonBlank;
  }

  const expected = header.length;
  const ragged = [];
  const rows = dataRecords.map((r) => {
    const isRagged = r.fields.length !== expected;
    if (isRagged) ragged.push({ line: r.line, got: r.fields.length, expected });
    // Short rows are PADDED rather than dropped, and long rows keep their extra
    // fields. Either way the row survives into the mapping step carrying a
    // ragged flag, because dropping a row silently is how an athlete goes
    // missing without anyone being told.
    const fields = r.fields.length < expected
      ? r.fields.concat(Array(expected - r.fields.length).fill(''))
      : r.fields;
    return { line: r.line, fields, ragged: isRagged };
  });

  return {
    delimiter,
    delimiterName: delimiter === TAB ? 'tab' : 'comma',
    tabs,
    commas,
    header,
    hasHeader,
    rows,
    blankLines,
    ragged,
  };
}

// Header-label candidates, most specific first. Matched against a header cell
// reduced to lowercase letters and digits, so "First Name", "first_name" and
// "FIRSTNAME" all land on the same key.
const CANDIDATES = {
  firstName: ['firstname', 'first', 'fname', 'givenname', 'given', 'forename'],
  lastName: ['lastname', 'last', 'lname', 'surname', 'familyname', 'family'],
  email: ['email', 'emailaddress', 'e mail', 'mail'],
  // Single-name vocabulary, added with the shape toggle. Most specific FIRST,
  // because the exact pass walks this list in order: 'fullname' must be tried
  // before the bare 'name', which would otherwise containment-match a
  // 'firstname' or 'lastname' column sitting earlier in the row.
  name: ['fullname', 'athletename', 'studentname', 'playername', 'legalname', 'name'],
};

// The two declared shapes. The OPERATOR chooses; nothing here infers one from
// the header, and no code path derives a shape from which fields happen to be
// mapped. SHAPE_SPLIT is the default because most real rosters carry two name
// columns.
export const SHAPE_SPLIT = 'split';
export const SHAPE_SINGLE = 'single';

// Target keys per shape, in render order. This is the single source the modal's
// FIELDS, the reset sites, allMapped and toPayloadRows all follow.
export const SHAPE_KEYS = {
  [SHAPE_SPLIT]: ['firstName', 'lastName', 'email'],
  [SHAPE_SINGLE]: ['name', 'email'],
};

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Propose a DEFAULT mapping the operator confirms or changes. This is not a
 * guess the import acts on: the mapping step renders these as pre-selected
 * dropdowns with a live example from the first data row, and nothing is
 * submitted until the operator has seen every target for the declared shape.
 *
 * A column is never proposed for two fields at once. Returns null for any field
 * with no confident label, which leaves the operator to choose.
 *
 * SHAPE-DEPENDENT. The operator has already declared whether their file carries
 * one name column or two, so this proposes targets for THAT shape only and the
 * returned object carries exactly that shape's keys. It does not look at the
 * header to decide the shape, and it never proposes a single-name column as a
 * name half or the reverse.
 */
export function suggestMapping(header, shape = SHAPE_SPLIT) {
  const cells = (header || []).map(norm);
  const taken = new Set();
  const pick = (keys) => {
    for (const k of keys) {
      const i = cells.indexOf(k);
      if (i >= 0 && !taken.has(i)) { taken.add(i); return i; }
    }
    // Fall back to a containment match (e.g. "workemail", "athletelastname")
    // only after every exact label has been tried, so an exact "email" always
    // beats a "secondaryemail" sitting earlier in the row.
    for (const k of keys) {
      const i = cells.findIndex((c, idx) => !taken.has(idx) && c.includes(k));
      if (i >= 0) { taken.add(i); return i; }
    }
    return null;
  };
  // Order matters: 'email' is matched first because its labels are the most
  // distinctive, then the name target(s) for the declared shape.
  const email = pick(CANDIDATES.email);
  if (shape === SHAPE_SINGLE) {
    const name = pick(CANDIDATES.name);
    return { name, email };
  }
  const firstName = pick(CANDIDATES.firstName);
  const lastName = pick(CANDIDATES.lastName);
  return { firstName, lastName, email };
}

/**
 * Build the POST payload rows from parsed rows plus a confirmed mapping.
 * Shape is exactly the endpoint's per-shape allowlist for the DECLARED shape and
 * nothing else: { name, email } under SHAPE_SINGLE, { firstName, lastName,
 * email } under SHAPE_SPLIT.
 *
 * A row NEVER carries keys from both shapes. The endpoint keys its allowlist on
 * which keys are present, so a mixed row is rejected there rather than
 * special-cased; emitting one here would be the bug that check exists to catch.
 *
 * Under SHAPE_SPLIT the NAME JOIN happens server-side, so the two halves travel
 * separately. Under SHAPE_SINGLE there is nothing to join: the cell travels
 * whole and is stored as given. No splitter exists at this layer or any other.
 */
export function toPayloadRows(rows, mapping, shape = SHAPE_SPLIT) {
  const at = (fields, idx) => (idx == null ? '' : (fields[idx] == null ? '' : fields[idx]));
  if (shape === SHAPE_SINGLE) {
    return rows.map((r) => ({
      name: at(r.fields, mapping.name).trim(),
      email: at(r.fields, mapping.email).trim(),
    }));
  }
  return rows.map((r) => ({
    firstName: at(r.fields, mapping.firstName).trim(),
    lastName: at(r.fields, mapping.lastName).trim(),
    email: at(r.fields, mapping.email).trim(),
  }));
}
