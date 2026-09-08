#!/usr/bin/env node
// scripts/bmf-verify-slice1.mjs
//
// SLICE 1, FILE 3 OF 3. Reads the sidecar and the emitted .sql, loads them into
// an IN-MEMORY scratch table, and asserts. It does not fetch, does not parse the
// CSVs for emission, authors no DDL constant, and never touches D1 — no
// wrangler, no --local, no --remote.
//
// Usage:
//   node scripts/bmf-verify-slice1.mjs
//
// ---------------------------------------------------------------------------
// THE SCRATCH TABLE IS NOT THE ASIDE. Read this before copying its shape.
//
// A125 RULED (Option B): slice 1's verifier creates a MINIMAL IN-MEMORY SCRATCH
// TABLE, not the real aside DDL. It exists inside R27's permitted in-memory
// node:sqlite check, for the duration of that check, and is explicitly NOT the
// aside.
//
// CONSEQUENCE: SLICE 1 AUTHORS NO DDL CONSTANT, so R13a's regeneration
// obligation — and its byte-identity comparison against
// migrations/0022_bmf_table.sql — DO NOT FIRE HERE. Authorship of the real aside
// DDL stays open and moves to whichever slice creates it.
//
// FOUR PROPERTIES ARE DELIBERATELY ABSENT, and what each leaves unobserved
// defers to that slice:
//   no PRIMARY KEY   -> R10b's INSERT-time duplicate-`ein` rejection is not
//                       exercised. A duplicate would be ACCEPTED silently here.
//   no NOT NULL      -> R16's `aside_schema_notnull` has nothing to assert on.
//   no indexes       -> R13b's post-swap index-name check is not exercised.
//   no CHECK         -> nothing here validates a value range.
// R16's `aside_schema_pk` is likewise unobservable: there is no primary key and
// therefore no PK autoindex to find.
//
// THE AUTHORITATIVE SHAPE lives at migrations/0022_bmf_table.sql TODAY, and
// moves to a loader constant under R13 when a later slice authors one. D5 rules
// that the ruled shape must AGREE across its sites, and this file is the FOURTH
// site in the tree that creates a bmf-shaped table. Measured 2026-09-08, they
// are:
//   migrations/0022_bmf_table.sql:55        CREATE TABLE bmf     AUTHORITATIVE
//   scripts/d1-window-generate.mjs:85       CREATE TABLE bmf_aside  banked
//                                           experiment residue, no key, no index
//   scripts/d1-window-verify-import.mjs:26  CREATE TABLE bmf     banked
//                                           experiment residue, D5 item (3)
//   THIS FILE                               CREATE TABLE bmf_aside  SCRATCH
// A reader grepping for that string must be able to see in one screen that THIS
// ONE IS NOT A CANDIDATE, which is why the DDL below is written as a literal
// rather than interpolated — a template would hide this file from the very
// search D5 anticipates.
//
// R27's BOUNDARY, quoted verbatim so it is not paraphrased away:
//   "THE DISTINCTION IS RECORDED AS THE REASONING, NOT JUST THE PERMISSION, so a
//   later reader does not extend it to a LOCAL D1 STORE — which IS persistent, IS
//   bound to the tools, and is exactly what §10's double-store filing is about."
//   In-memory and ephemeral is the test; "not remote" is not.
//
// ---------------------------------------------------------------------------
// WHY THE TYPES ARE WHAT THEY ARE.
//
// `ein TEXT` is A123's floor, measured rather than assumed: all three
// TEXT-affinity forms (TEXT NOT NULL PRIMARY KEY, TEXT NOT NULL, bare TEXT)
// store 8 characters for an unquoted literal and 9 for a quoted one, while
// INTEGER and NUMERIC destroy the leading zero EVEN WHEN THE SQL IS CORRECTLY
// QUOTED. So TEXT is the property that matters and the constraints are not.
//
// `revenue_amt INTEGER` must carry REAL INTEGER AFFINITY. An INTEGER column
// accepts the text 'null' under type affinity, and that is precisely the silent
// failure R29 describes; a column declared TEXT here would store it without
// complaint and the check below could not see it.
//
// The table is named `bmf_aside` per R24 so the emitted file loads UNMODIFIED.
// Rewriting the statements under test would mean the thing verified is not the
// thing shipped.
//
// ---------------------------------------------------------------------------
// WHAT ITEM 14 MAY NOT ASSERT ON.
//
// A123 excludes `typeof` because it varies across otherwise-permitted variants.
// Measured, it is worse than that: on `ein TEXT`, typeof returns 'text' for BOTH
// the correct quoted emission and the defective unquoted one, so an assertion on
// it would be a check that CANNOT FAIL — the R16 tautology shape. Item 14
// asserts VALUE and LENGTH only. selfTest() below proves both arms before any
// real assertion is trusted.

import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(ROOT, '.bmf-cache');
const SIDECAR_PATH = join(ROOT, 'scripts', 'bmf-aside.tmp.json');
const SQL_PATH = join(ROOT, 'scripts', 'bmf-aside.tmp.sql');

const TABLE = 'bmf_aside';
const DQUOTE = String.fromCharCode(34);

// The scratch shape. TYPES ONLY — see the docblock for what is absent and why.
//
// WRITTEN AS A LITERAL, NOT INTERPOLATED, SO IT IS GREPPABLE. A reader auditing
// the sites D5 governs will search for `CREATE TABLE bmf_aside`; a template
// would hide this file from that search, which is the opposite of what the
// docblock above is for. The assertion below catches the drift the literal
// otherwise invites.
const SCRATCH_DDL =
  'CREATE TABLE bmf_aside (' +
  'ein TEXT, ' +
  'name TEXT, ' +
  'city TEXT, ' +
  'state TEXT, ' +
  'revenue_amt INTEGER, ' +
  'ruling INTEGER, ' +
  'ntee_cd TEXT' +
  ')';
if (!SCRATCH_DDL.startsWith(`CREATE TABLE ${TABLE} (`)) {
  throw new Error(`SCRATCH_DDL creates a different table than TABLE (${TABLE}); the emitted file would not load unmodified.`);
}

function fail(msg) {
  console.error(`[bmf-verify] ERROR: ${msg}`);
  process.exit(1);
}

function log(msg) {
  console.log(`[bmf-verify] ${msg}`);
}

// ---------------------------------------------------------------------------
// Encodes a value back into a CSV field the way the source file would carry it.
// Pure, and used by item 15's parser-independent arm.
function csvEncode(value) {
  if (value.includes(',') || value.includes(DQUOTE) || value.includes('\n')) {
    return DQUOTE + value.split(DQUOTE).join(DQUOTE + DQUOTE) + DQUOTE;
  }
  return value;
}

// The encoded field must appear DELIMITED in the source line, not merely as a
// substring of it. The bare substring test is not enough, and the self-test
// below proves why: a name TRUNCATED at its comma re-encodes without quotes and
// is still a substring of the quoted original, so an unanchored check would pass
// on exactly the quoting bug item 15 exists to catch.
//
// NAME is field index 1 of 28, so it is comma-delimited on both sides in every
// row. A first or last field would need different anchors; this asserts the
// position rather than assuming it.
function fieldAppearsDelimited(sourceLine, encodedField, fieldIndex, fieldCount) {
  if (fieldIndex === 0) return sourceLine.startsWith(encodedField + ',');
  if (fieldIndex === fieldCount - 1) return sourceLine.endsWith(',' + encodedField);
  return sourceLine.includes(',' + encodedField + ',');
}

// Quote-aware split, used only by item 15's SECOND arm. Its limitation is stated
// where it is used: it shares an algorithm SHAPE with the parser, so what it
// makes independent is the READ of the source bytes, not the parsing idea.
function splitCsvLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === DQUOTE) {
        if (line[i + 1] === DQUOTE) { cur += DQUOTE; i++; } else { inQuotes = false; }
      } else {
        cur += ch;
      }
    } else if (ch === DQUOTE) {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

// ---------------------------------------------------------------------------
// SELF-TEST. Every assertion this file makes is unverified until it is shown to
// FIRE on a correct input and FAIL on a defective one. This runs FIRST, on
// throwaway in-memory databases, and refuses the whole run if any instrument
// cannot discriminate. An assertion that cannot fail is worse than no assertion,
// because it reports success either way.
function selfTest() {
  const results = [];
  const check = (label, got, want) => {
    const ok = got === want;
    results.push({ label, ok, got });
    return ok;
  };

  // --- item 14's assertion, both arms, on the SHIPPED scratch shape ---------
  for (const [arm, literal, expectPass] of [
    ['correct  (quoted)  ', "'000019818'", true],
    ['defective (unquoted)', '000019818', false],
  ]) {
    const db = new DatabaseSync(':memory:');
    db.exec(SCRATCH_DDL);
    db.exec(`INSERT INTO ${TABLE} (ein) VALUES (${literal})`);
    const row = db.prepare(`SELECT ein, length(ein) AS len, typeof(ein) AS ty FROM ${TABLE}`).get();
    const passes = row.ein === '000019818' && row.len === 9;
    check(`item 14 assertion on ${arm} -> ${expectPass ? 'PASS' : 'FAIL'}`, passes, expectPass);
    // And the reason typeof is excluded, demonstrated rather than asserted:
    check(`  typeof on ${arm} is 'text' either way`, row.ty, 'text');
    db.close();
  }

  // --- item 15's parser-independent arm ------------------------------------
  const NAME = 'NORTH COUNTRY HOSPITAL & HEALTH CENTER,INC';
  const sourceLine = `030185556,${DQUOTE}${NAME}${DQUOTE},X`;
  const delimited = (v) => fieldAppearsDelimited(sourceLine, csvEncode(v), 1, 3);
  check('item 15 delimited re-encode found in the source line', delimited(NAME), true);
  // The case that caught an unanchored check: a name truncated at its comma
  // re-encodes WITHOUT quotes and is a bare substring of the quoted original.
  check('item 15 rejects a name truncated at its comma', delimited('NORTH COUNTRY HOSPITAL & HEALTH CENTER'), false);
  check('item 15 rejects a name with one character changed', delimited('NORTH COUNTRY HOSPITAL & HEALTH CENTRE,INC'), false);
  check('item 15 rejects a name with the quotes stripped', sourceLine.includes(',' + NAME + ','), false);
  // and the unanchored test is recorded as INSUFFICIENT rather than removed
  check('  (an UNANCHORED substring test would have passed the truncation)', sourceLine.includes(csvEncode('NORTH COUNTRY HOSPITAL & HEALTH CENTER')), true);

  // --- the R29 silent-failure detector -------------------------------------
  {
    const db = new DatabaseSync(':memory:');
    db.exec(SCRATCH_DDL);
    db.exec(`INSERT INTO ${TABLE} (ein, revenue_amt) VALUES ('a', NULL)`);
    db.exec(`INSERT INTO ${TABLE} (ein, revenue_amt) VALUES ('b', 'null')`);
    db.exec(`INSERT INTO ${TABLE} (ein, revenue_amt) VALUES ('c', 5)`);
    const textCount = db.prepare(`SELECT COUNT(*) AS c FROM ${TABLE} WHERE typeof(revenue_amt) = 'text'`).get().c;
    check("R29 detector sees the text 'null' stored in an INTEGER column", textCount, 1);
    const nullCount = db.prepare(`SELECT COUNT(*) AS c FROM ${TABLE} WHERE revenue_amt IS NULL`).get().c;
    check('R29 detector does not confuse a real NULL with it', nullCount, 1);
    db.close();
  }

  // --- the absent-versus-zero detector -------------------------------------
  {
    const db = new DatabaseSync(':memory:');
    db.exec(SCRATCH_DDL);
    db.exec(`INSERT INTO ${TABLE} (ein, revenue_amt) VALUES ('a', NULL)`);
    db.exec(`INSERT INTO ${TABLE} (ein, revenue_amt) VALUES ('b', 0)`);
    const nulls = db.prepare(`SELECT COUNT(*) AS c FROM ${TABLE} WHERE revenue_amt IS NULL`).get().c;
    const zeros = db.prepare(`SELECT COUNT(*) AS c FROM ${TABLE} WHERE revenue_amt = 0`).get().c;
    check('absent and zero are counted apart', `${nulls}/${zeros}`, '1/1');
    db.close();
  }

  const failedInstruments = results.filter((r) => !r.ok);
  for (const r of results) {
    log(`  selftest ${r.ok ? 'ok  ' : 'BAD '} ${r.label}${r.ok ? '' : `  got ${JSON.stringify(r.got)}`}`);
  }
  if (failedInstruments.length) {
    fail(`${failedInstruments.length} instrument(s) could not discriminate. Nothing was verified; the checks below would report success regardless.`);
  }
  log(`  selftest: ${results.length} instrument checks passed, including item 14 failing on an unquoted EIN.`);
}

// ---------------------------------------------------------------------------
// Streams the emitted .sql and executes it statement by statement. The file is
// roughly 174 MB, so it is never read into memory whole.
async function loadEmittedSql(db) {
  const stream = createReadStream(SQL_PATH, { encoding: 'utf8', highWaterMark: 1 << 20 });
  let tail = '';
  let executed = 0;
  db.exec('BEGIN');
  for await (const chunk of stream) {
    tail += chunk;
    let at;
    while ((at = tail.indexOf(';\n')) !== -1) {
      const statement = tail.slice(0, at + 1);
      tail = tail.slice(at + 2);
      const trimmed = statement.trim();
      if (trimmed === '') continue;
      try {
        db.exec(trimmed);
      } catch (e) {
        db.exec('ROLLBACK');
        fail(`statement ${executed + 1} failed to load: ${e.message}\n  starts: ${trimmed.slice(0, 120)}`);
      }
      executed++;
    }
  }
  if (tail.trim() !== '') {
    db.exec('ROLLBACK');
    fail(`the emitted file ends with an unterminated statement: ${tail.slice(0, 120)}`);
  }
  db.exec('COMMIT');
  return executed;
}

function readJsonOrFail(path, what) {
  if (!existsSync(path)) fail(`${what} not found at ${path}. Run scripts/bmf-parse.mjs first.`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    fail(`${what} at ${path} is not valid JSON: ${e.message}`);
  }
}

// Finds one record in a source CSV by its EIN prefix, returning the RAW LINE.
// This is an INDEPENDENT RE-READ of the source bytes, per §5's "re-read the
// source CSVs, compare byte for byte" — never the parser's in-memory state.
async function findSourceLine(file, ein) {
  const path = join(CACHE_DIR, `${file}.csv`);
  if (!existsSync(path)) fail(`${file}.csv is missing from the cache; item 15 cannot re-read the source.`);
  const stream = createReadStream(path, { encoding: 'utf8', highWaterMark: 1 << 20 });
  const prefix = `${ein},`;
  let tail = '';
  for await (const chunk of stream) {
    tail += chunk;
    let at;
    while ((at = tail.indexOf('\n')) !== -1) {
      const line = tail.slice(0, at).replace(/\r$/, '');
      tail = tail.slice(at + 1);
      if (line.startsWith(prefix)) { stream.destroy(); return line; }
    }
    // keep only what could still begin a line
    if (tail.length > 1 << 20) tail = tail.slice(-(1 << 16));
  }
  const last = tail.replace(/\r$/, '');
  if (last.startsWith(prefix)) return last;
  return null;
}

async function main() {
  log('SELF-TEST — proving each instrument can fire and can fail, before trusting any of them.');
  selfTest();
  log('');

  const sidecar = readJsonOrFail(SIDECAR_PATH, 'sidecar');
  if (!existsSync(SQL_PATH)) fail(`emitted SQL not found at ${SQL_PATH}. Run scripts/bmf-parse.mjs first.`);
  if (sidecar.targetTable !== TABLE) {
    fail(`the sidecar names target table '${sidecar.targetTable}', but this verifier creates '${TABLE}'. The emitted file would not load unmodified.`);
  }
  log(`sidecar: extract ${sidecar.extractDate}, set '${sidecar.fileSet}', ${sidecar.rows} rows emitted in ${sidecar.statements} statements`);

  const db = new DatabaseSync(':memory:');
  db.exec(SCRATCH_DDL);
  log(`scratch table created IN MEMORY: ${TABLE}, seven columns, types only.`);

  const t0 = Date.now();
  const executed = await loadEmittedSql(db);
  const loadMs = Date.now() - t0;
  log(`loaded ${executed} statements in ${loadMs} ms`);

  const q = (sql) => db.prepare(sql).get();
  const loadedRows = q(`SELECT COUNT(*) AS c FROM ${TABLE}`).c;
  const distinct = q(`SELECT COUNT(DISTINCT ein) AS c FROM ${TABLE}`).c;
  const nullRuling = q(`SELECT COUNT(*) AS c FROM ${TABLE} WHERE ruling IS NULL`).c;
  const nullRevenue = q(`SELECT COUNT(*) AS c FROM ${TABLE} WHERE revenue_amt IS NULL`).c;
  const nullNtee = q(`SELECT COUNT(*) AS c FROM ${TABLE} WHERE ntee_cd IS NULL`).c;
  const revenueSum = q(`SELECT CAST(TOTAL(revenue_amt) AS INTEGER) AS s FROM ${TABLE}`).s;
  const revenueRows = q(`SELECT COUNT(*) AS c FROM ${TABLE} WHERE revenue_amt IS NOT NULL`).c;
  const textRevenue = q(`SELECT COUNT(*) AS c FROM ${TABLE} WHERE typeof(revenue_amt) = 'text'`).c;
  const textRuling = q(`SELECT COUNT(*) AS c FROM ${TABLE} WHERE typeof(ruling) = 'text'`).c;
  const zeroRevenue = q(`SELECT COUNT(*) AS c FROM ${TABLE} WHERE revenue_amt = 0`).c;
  const shortEins = q(`SELECT COUNT(*) AS c FROM ${TABLE} WHERE length(ein) <> 9`).c;

  const checks = [];
  const assert = (item, name, passed, detail) => checks.push({ item, name, passed, detail });

  // ---- items 9-13, RE-ASSERTED against the loaded table -------------------
  // Item 9's subject is the PARSE, which produced no rows for a malformed
  // record, so it cannot be re-derived from the table. What the table CAN
  // establish is that nothing was lost between emission and storage.
  assert(9, 'statements_all_loaded', executed === sidecar.statements, `${executed} executed / ${sidecar.statements} emitted`);
  assert(9, 'rows_loaded_equal_rows_emitted', loadedRows === sidecar.rows, `${loadedRows} loaded / ${sidecar.rows} emitted`);
  assert(9, 'sidecar_reported_zero_malformed', sidecar.malformed === 0, `${sidecar.malformed}`);
  assert(10, 'rows_equal_distinct_ein', loadedRows === distinct, `${loadedRows} rows / ${distinct} distinct`);
  assert(11, 'per_file_sum_equals_loaded', sidecar.perFileSum === loadedRows, `${sidecar.perFileSum} / ${loadedRows}`);
  assert(12, 'zero_null_ruling', nullRuling === 0, `${nullRuling}`);
  assert(13, 'revenue_sum_matches_sidecar', String(revenueSum) === String(sidecar.revenueAmtSum), `${revenueSum} / ${sidecar.revenueAmtSum}`);
  assert(13, 'revenue_rows_match_sidecar', revenueRows === sidecar.revenueAmtRows, `${revenueRows} / ${sidecar.revenueAmtRows}`);

  // ---- the two emission constraints, observed as STORED --------------------
  assert(13, 'no_text_in_revenue_amt', textRevenue === 0, `${textRevenue} rows store text in an INTEGER column (R29's silent failure)`);
  assert(12, 'no_text_in_ruling', textRuling === 0, `${textRuling}`);
  assert(13, 'null_revenue_matches_sidecar', nullRevenue === sidecar.nullRevenueAmt, `${nullRevenue} / ${sidecar.nullRevenueAmt}`);
  assert(13, 'null_ntee_matches_sidecar', nullNtee === sidecar.nullNteeCd, `${nullNtee} / ${sidecar.nullNteeCd}`);
  assert(14, 'all_eins_nine_characters', shortEins === 0, `${shortEins} rows whose stored ein is not nine characters`);

  // ---- ITEM 14: the captured leading-zero EIN -----------------------------
  const cap14 = sidecar.firstLeadingZeroEin;
  if (!cap14 || !cap14.ein) fail('the sidecar carries no firstLeadingZeroEin capture; item 14 cannot run.');
  const row14 = db.prepare(`SELECT ein, length(ein) AS len FROM ${TABLE} WHERE ein = ?`).get(cap14.ein);
  if (!row14) {
    assert(14, 'leading_zero_ein_present', false, `no row with ein = ${cap14.ein}`);
  } else {
    // VALUE and LENGTH only. Nothing on typeof — see the docblock.
    assert(14, 'leading_zero_ein_value', row14.ein === cap14.ein, `stored ${JSON.stringify(row14.ein)} / captured ${JSON.stringify(cap14.ein)}`);
    assert(14, 'leading_zero_ein_length_9', row14.len === 9, `${row14.len}`);
  }

  // ---- ITEM 15: the comma-bearing name, against an INDEPENDENT RE-READ ----
  const cap15 = sidecar.firstCommaName;
  if (!cap15 || !cap15.ein) fail('the sidecar carries no firstCommaName capture; item 15 cannot run.');
  const row15 = db.prepare(`SELECT name FROM ${TABLE} WHERE ein = ?`).get(cap15.ein);
  const sourceLine = await findSourceLine(cap15.file, cap15.ein);
  if (!row15) {
    assert(15, 'comma_name_row_present', false, `no row with ein = ${cap15.ein}`);
  } else if (sourceLine === null) {
    assert(15, 'comma_name_source_line_found', false, `no line in ${cap15.file}.csv begins with ${cap15.ein},`);
  } else {
    // ARM ONE, PARSER-INDEPENDENT: re-encode the STORED value as a CSV field
    // and require it to appear DELIMITED in the raw source bytes. This performs
    // no parsing at all, so it cannot inherit a parsing mistake. Delimited
    // rather than merely contained — see fieldAppearsDelimited and the
    // self-test case that forced it.
    const encoded = csvEncode(row15.name);
    assert(15, 'stored_name_reencodes_into_source_bytes', fieldAppearsDelimited(sourceLine, encoded, 1, 28), `encoded ${JSON.stringify(encoded.slice(0, 60))}`);
    // ARM TWO: exact string equality against the field extracted from that same
    // re-read line. Stated with its limit — this arm SHARES AN ALGORITHM SHAPE
    // with the parser, so what it makes independent is the READ of the source
    // bytes, not the parsing idea. Arm one is the one that owes nothing to it.
    const headerLine = readFileSync(join(CACHE_DIR, `${cap15.file}.csv`), 'utf8').slice(0, 400).split('\n')[0].replace(/\r$/, '');
    const nameIndex = splitCsvLine(headerLine).indexOf('NAME');
    const sourceName = nameIndex === -1 ? null : splitCsvLine(sourceLine)[nameIndex];
    assert(15, 'stored_name_equals_source_name', row15.name === sourceName, `stored ${JSON.stringify(row15.name)} / source ${JSON.stringify(sourceName)}`);
    // Byte-for-byte is exact string equality in the host language, NOT a
    // length() comparison: length() counts CHARACTERS and octet_length() counts
    // BYTES, and the two diverge on non-ASCII.
    assert(15, 'comma_survived_in_stored_value', row15.name.includes(','), JSON.stringify(row15.name));
  }

  db.close();

  // ---- REPORT -------------------------------------------------------------
  log('');
  log(`loaded rows ${loadedRows}   distinct EINs ${distinct}`);
  log(`null RULING ${nullRuling}   null REVENUE_AMT ${nullRevenue}   null NTEE_CD ${nullNtee}`);
  log(`REVENUE_AMT sum ${revenueSum} over ${revenueRows} rows   revenue_amt = 0 on ${zeroRevenue} rows`);
  log(`text stored in INTEGER columns: revenue_amt ${textRevenue}, ruling ${textRuling}`);
  log(`item 14 EIN ${cap14.ein} (${cap14.file})`);
  log(`item 15 EIN ${cap15.ein} (${cap15.file}) name ${JSON.stringify(cap15.name)}`);
  log('');
  for (const c of checks) {
    log(`  item ${String(c.item).padEnd(2)} ${c.name.padEnd(38)} ${c.passed ? 'PASS' : 'FAIL'}  ${c.detail}`);
  }
  log('');
  log('NOT OBSERVED HERE, and deferred to the slice that creates the real aside:');
  log('  R10b duplicate-ein rejection at INSERT   (no PRIMARY KEY on the scratch table)');
  log('  R16  aside_schema_pk                     (no primary key, no PK autoindex)');
  log('  R16  aside_schema_notnull                (no NOT NULL on any column)');
  log('  R13b post-swap index names               (no indexes)');

  const failedChecks = checks.filter((c) => !c.passed);
  if (failedChecks.length) {
    fail(`${failedChecks.length} check(s) failed: ${failedChecks.map((c) => c.name).join(', ')}`);
  }
  log('');
  log(`DONE. ${checks.length} checks passed. Items satisfied: 9, 10, 11, 12, 13, 14, 15.`);
  log('Slice 1 is a file on disk and a set of numbers matching (R21a).');
}

main().catch((e) => fail(`unhandled: ${e && e.stack ? e.stack : e}`));
