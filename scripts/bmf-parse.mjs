#!/usr/bin/env node
// scripts/bmf-parse.mjs
//
// SLICE 1, FILE 2 OF 3. Parse and emit ONLY. This script reads the cache that
// scripts/bmf-fetch.mjs populated, parses it, and writes SQL to a gitignored
// file. It does NOT fetch, does not touch the network, does not create any
// table, does not contact a database, and does not verify — verification is
// file 3 and reads the sidecar this writes.
//
// Usage:
//   node scripts/bmf-parse.mjs
//
// R28 EXEMPTIONS, stated so they do not read as omissions. §2's script contract
// assumes a script that EXECUTES against D1; slice 1 makes no database contact
// by ruling (R21). Exempt from exactly three things, none of which appear here:
// the --local / --remote usage pair, the DB_NAME constant, and the spawnSync on
// `wrangler d1 execute`. Everything else in §2 binds — scripts/ placement,
// fail(msg) exiting 1, and the gitignored temp file are all present.
//
// DEFINITION-OF-DONE ITEMS THIS FILE SATISFIES: 3, 4, 5, 9, 10, 11, 12, 13.
//   item 3   one emitted .sql file, gitignored via .gitignore:18 scripts/*.tmp.sql
//   item 4   the JSON sidecar beside it, which slice 3's verifier reads (R25)
//   item 5   the stdout summary a human reads when the run finishes (R25)
//   item 9   zero malformed rows
//   item 10  row count equals distinct EIN count, RE-DERIVED per load (§1)
//   item 11  per-file contributions sum to the total
//   item 12  zero null RULING
//   item 13  the REVENUE_AMT sum over non-null rows, PRODUCED here because §5
//            records it as never measured and forbids asserting it from the plan
// It also captures the two values R21b's assertions need, which do not exist
// until this run: the first EIN beginning with 0 and the first NAME containing
// a comma, each with its source file. §5 warns comma density is 6 in 278,014,
// so both are captured DURING the parse and never searched for at assert time.
//
// THE TWO EMISSION CONSTRAINTS, both recorded in docs/bmf-load-scoping.md and
// both implemented here STRUCTURALLY rather than by a runtime test.
//
//   §2: "SO `ein` MUST NEVER REACH A `typeof v === 'number'` TEST. Whatever
//   emits it must treat it as text unconditionally, and any numeric conversion
//   applied to the seven columns must exclude it by name rather than by
//   inspecting its runtime type."
//
//   §1: "the empty-string branch must precede CONVERSION, not merely precede
//   escaping." Number('') is 0, not NaN, so a conversion running first turns an
//   absent revenue into a filed zero — which §1 forbids, and which no
//   constraint downstream can catch.
//
// HOW THIS FILE SATISFIES BOTH, and the mechanism is worth stating because it is
// stronger than the rule requires. EMISSION PERFORMS NO NUMERIC CONVERSION AT
// ALL. Every column has one emitter bound to it BY NAME in the EMIT table below,
// chosen at authoring time; nothing dispatches on a runtime type, so there is no
// `typeof` test for `ein` to reach. Integer columns are validated as integer
// LITERALS and emitted VERBATIM, never through Number(). The only numeric
// conversion in this file is the item 13 revenue sum, which is applied to one
// named column, AFTER its emptiness branch, on the accounting path rather than
// the emission path.

import { createReadStream, createWriteStream, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(ROOT, '.bmf-cache');
const MARKER_PATH = join(CACHE_DIR, 'extract.json');
const PROVENANCE_PATH = join(ROOT, 'scripts', 'bmf-extract-provenance.json');

// item 3: .gitignore:18 is `scripts/*.tmp.sql`, so this inherits the existing
// hygiene §2 points at. The sidecar sits BESIDE it per R25.
const OUT_SQL_PATH = join(ROOT, 'scripts', 'bmf-aside.tmp.sql');
const OUT_SIDECAR_PATH = join(ROOT, 'scripts', 'bmf-aside.tmp.json');

// R24: the emitted INSERTs target the ASIDE, never the live table. "Naming
// `bmf` would emit statements that could load straight onto the LIVE table if
// the file were ever executed by hand — a foot-gun for zero benefit."
const TARGET_TABLE = 'bmf_aside';

// The seven ruled columns (§1), in the order the migration declares them, each
// mapped to its SOURCE header name. Header-name parsing is ruled, so indices are
// resolved from the header at run time and never hardcoded.
const COLUMNS = [
  { col: 'ein', src: 'EIN' },
  { col: 'name', src: 'NAME' },
  { col: 'city', src: 'CITY' },
  { col: 'state', src: 'STATE' },
  { col: 'revenue_amt', src: 'REVENUE_AMT' },
  { col: 'ruling', src: 'RULING' },
  { col: 'ntee_cd', src: 'NTEE_CD' },
];

// ~30KB chunks sized by bytes (preamble); the HARD ceiling is 100,000 bytes,
// bisected, failing as SQLITE_TOOBIG (§3, §8). The ceiling is asserted per
// statement rather than assumed to follow from the target.
const CHUNK_TARGET_BYTES = 30000;
const STATEMENT_CEILING_BYTES = 100000;

const INTEGER_LITERAL = /^-?[0-9]+$/;
const EIN_SHAPE = /^[0-9]{9}$/;
const DQUOTE = String.fromCharCode(34);

function fail(msg) {
  console.error(`[bmf-parse] ERROR: ${msg}`);
  process.exit(1);
}

function log(msg) {
  console.log(`[bmf-parse] ${msg}`);
}

// ---------------------------------------------------------------------------
// EMISSION. One emitter per column, bound BY NAME below. No emitter inspects a
// runtime type, and none calls Number().

function sqlText(raw) {
  return `'${raw.split("'").join("''")}'`;
}

// Validated as an integer LITERAL and emitted verbatim. Deliberately not
// Number(raw): a round trip through a float is a conversion this path does not
// need and must not perform.
function sqlIntegerLiteral(raw) {
  return raw;
}

const EMIT = {
  // §2: text UNCONDITIONALLY. There is no branch here for a numeric value to
  // take, which is what keeps `ein` off a numeric path structurally.
  ein: sqlText,
  name: sqlText,
  city: sqlText,
  state: sqlText,
  // §1/R29: the emptiness branch comes FIRST — before conversion and before
  // escaping — and emits the bare keyword NULL. Never '', never 'null'.
  ntee_cd: (raw) => (raw === '' ? 'NULL' : sqlText(raw)),
  revenue_amt: (raw) => (raw === '' ? 'NULL' : sqlIntegerLiteral(raw)),
  // RULING is NOT NULL nationally (§1, null on 0 rows). An empty value is a
  // malformed row, counted and refused rather than emitted as anything.
  ruling: sqlIntegerLiteral,
};

// ---------------------------------------------------------------------------
// QUOTE-AWARE CSV. The tree has no precedent for this: readRosterFile.js is
// browser-only and carries no quote handling at all, which §4 mode 6 records as
// the reason a column-shift bug would otherwise hide.
//
// Returns { fields, unterminated }. `unterminated` true means the record
// continues on the next physical line, which is legal CSV even though the
// 2026-09-07 extract contains none.
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
  return { fields, unterminated: inQuotes };
}

function readJsonOrFail(path, what) {
  if (!existsSync(path)) fail(`${what} not found at ${path}. Run scripts/bmf-fetch.mjs first.`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    fail(`${what} at ${path} is not valid JSON: ${e.message}`);
  }
}

function writeChunk(stream, text) {
  if (stream.write(text)) return Promise.resolve();
  return new Promise((resolve) => stream.once('drain', resolve));
}

async function main() {
  // ---- INPUTS: the cache only. Nothing here fetches. --------------------
  const marker = readJsonOrFail(MARKER_PATH, 'cache marker');
  if (marker.complete !== true) {
    fail('the cache marker is not marked complete. Re-run scripts/bmf-fetch.mjs.');
  }
  const provenance = readJsonOrFail(PROVENANCE_PATH, 'extract provenance');
  const record = provenance.extracts && provenance.extracts[marker.extractDate];
  if (!record) fail(`provenance holds no record for extract ${marker.extractDate}.`);
  const expectedHeader = record.header;
  if (!expectedHeader) fail(`provenance record for ${marker.extractDate} carries no header.`);

  const files = marker.files;
  log(`extract ${marker.extractDate}, set '${marker.fileSet}', ${files.length} files, reading from ${CACHE_DIR}`);

  // ---- OUTPUT ------------------------------------------------------------
  const out = createWriteStream(OUT_SQL_PATH, { encoding: 'utf8' });
  const insertPrefix = `INSERT INTO ${TARGET_TABLE} (${COLUMNS.map((c) => c.col).join(', ')}) VALUES\n`;
  const prefixBytes = Buffer.byteLength(insertPrefix, 'utf8');

  // recordsRead counts every complete CSV record; rows counts those that passed
  // validation and were EMITTED. They are separate because item 10 compares row
  // count to distinct EIN count, and a malformed row is skipped before it ever
  // reaches the EIN set — so counting it as a row would make item 10 fail as a
  // side effect of item 9 rather than on a genuine duplicate, which is exactly
  // the signal item 10 exists to give.
  const totals = {
    recordsRead: 0,
    rows: 0,
    malformed: 0,
    nullRuling: 0,
    nullRevenue: 0,
    nullNtee: 0,
    emptyState: 0,
    emptyCity: 0,
    emptyName: 0,
    quotedRecords: 0,
    multiLineRecords: 0,
    statements: 0,
    maxStatementBytes: 0,
    sqlBytes: 0,
  };
  const perFile = {};
  const seenEins = new Set();
  let duplicateEins = 0;
  let revenueSum = 0n;           // item 13. BigInt so a 1.9M-row sum cannot lose precision.
  let revenueRows = 0;
  const malformedSamples = [];
  let firstLeadingZeroEin = null;   // R21b
  let firstCommaName = null;        // R21b

  let buffer = [];
  let bufferBytes = 0;

  async function flush() {
    if (buffer.length === 0) return;
    const statement = insertPrefix + buffer.join(',\n') + ';\n';
    const bytes = Buffer.byteLength(statement, 'utf8');
    if (bytes > STATEMENT_CEILING_BYTES) {
      fail(`generated a statement of ${bytes} B, over the ${STATEMENT_CEILING_BYTES} B ceiling. §3: the hard limit fails as SQLITE_TOOBIG.`);
    }
    if (bytes > totals.maxStatementBytes) totals.maxStatementBytes = bytes;
    totals.statements++;
    totals.sqlBytes += bytes;
    await writeChunk(out, statement);
    buffer = [];
    bufferBytes = 0;
  }

  for (const f of files) {
    const path = join(CACHE_DIR, `${f}.csv`);
    if (!existsSync(path)) fail(`${f}.csv is missing from the cache. Re-run scripts/bmf-fetch.mjs.`);
    perFile[f] = 0;

    const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
    let header = null;
    let index = null;
    let pending = null;      // a record whose quoted field continues on the next line

    for await (const line of rl) {
      if (header === null) {
        if (line !== expectedHeader) {
          fail(`${f}.csv header does not match the header frozen for extract ${marker.extractDate}. A header mismatch is a REFUSAL (R26). Re-run scripts/bmf-fetch.mjs.`);
        }
        header = splitCsvLine(line).fields;
        index = {};
        for (const { col, src } of COLUMNS) {
          const at = header.indexOf(src);
          if (at === -1) fail(`${f}.csv header has no column named ${src}.`);
          index[col] = at;
        }
        continue;
      }
      if (line === '') continue;

      let record;
      if (pending !== null) {
        // A quoted field spanned a physical line break. Rejoin with the newline
        // the CSV intended, and keep counting.
        pending += '\n' + line;
        record = pending;
      } else {
        record = line;
      }
      const parsed = splitCsvLine(record);
      if (parsed.unterminated) {
        pending = record;
        continue;
      }
      if (pending !== null) { totals.multiLineRecords++; pending = null; }

      totals.recordsRead++;
      if (record.includes(DQUOTE)) totals.quotedRecords++;

      // ---- MALFORMED (item 9) --------------------------------------------
      if (parsed.fields.length !== header.length) {
        totals.malformed++;
        if (malformedSamples.length < 5) malformedSamples.push({ file: f, reason: `field count ${parsed.fields.length}, expected ${header.length}`, prefix: record.slice(0, 90) });
        continue;
      }
      const raw = {};
      for (const { col } of COLUMNS) raw[col] = parsed.fields[index[col]];

      if (!EIN_SHAPE.test(raw.ein)) {
        totals.malformed++;
        if (malformedSamples.length < 5) malformedSamples.push({ file: f, reason: `EIN is not nine digits: ${JSON.stringify(raw.ein).slice(0, 30)}`, prefix: record.slice(0, 90) });
        continue;
      }
      // item 12: RULING is NOT NULL nationally. Empty is counted AND malformed.
      if (raw.ruling === '') {
        totals.nullRuling++;
        totals.malformed++;
        if (malformedSamples.length < 5) malformedSamples.push({ file: f, reason: 'RULING is empty', prefix: record.slice(0, 90) });
        continue;
      }
      if (!INTEGER_LITERAL.test(raw.ruling)) {
        totals.malformed++;
        if (malformedSamples.length < 5) malformedSamples.push({ file: f, reason: `RULING is not an integer literal: ${JSON.stringify(raw.ruling).slice(0, 30)}`, prefix: record.slice(0, 90) });
        continue;
      }
      // The emptiness branch precedes any look at the value as a number (§1).
      if (raw.revenue_amt !== '' && !INTEGER_LITERAL.test(raw.revenue_amt)) {
        totals.malformed++;
        if (malformedSamples.length < 5) malformedSamples.push({ file: f, reason: `REVENUE_AMT is neither empty nor an integer literal: ${JSON.stringify(raw.revenue_amt).slice(0, 30)}`, prefix: record.slice(0, 90) });
        continue;
      }

      // ---- COUNTS ---------------------------------------------------------
      // Reached only by a row that passed every validation above, so `rows` is
      // the EMITTED count and item 10 compares like with like.
      totals.rows++;
      perFile[f]++;
      if (seenEins.has(raw.ein)) duplicateEins++; else seenEins.add(raw.ein);
      if (raw.revenue_amt === '') {
        totals.nullRevenue++;
      } else {
        // item 13, the ONLY numeric conversion in this file. One named column,
        // AFTER its emptiness branch, on the accounting path — never on the
        // emission path, which converts nothing.
        revenueSum += BigInt(raw.revenue_amt);
        revenueRows++;
      }
      if (raw.ntee_cd === '') totals.nullNtee++;
      if (raw.state === '') totals.emptyState++;
      if (raw.city === '') totals.emptyCity++;
      if (raw.name === '') totals.emptyName++;

      // ---- R21b CAPTURES, taken during the parse --------------------------
      if (firstLeadingZeroEin === null && raw.ein[0] === '0') {
        firstLeadingZeroEin = { ein: raw.ein, file: f, name: raw.name };
      }
      if (firstCommaName === null && raw.name.includes(',')) {
        firstCommaName = { ein: raw.ein, file: f, name: raw.name };
      }

      // ---- EMIT -----------------------------------------------------------
      const tuple = `(${COLUMNS.map(({ col }) => EMIT[col](raw[col])).join(', ')})`;
      const tupleBytes = Buffer.byteLength(tuple, 'utf8') + 2;
      if (buffer.length > 0 && prefixBytes + bufferBytes + tupleBytes + 2 > CHUNK_TARGET_BYTES) {
        await flush();
      }
      buffer.push(tuple);
      bufferBytes += tupleBytes;
    }

    if (pending !== null) {
      fail(`${f}.csv ends with an unterminated quoted field. The file is truncated or malformed.`);
    }
    if (header === null) fail(`${f}.csv is empty; no header line.`);
    log(`  ${f}.csv  ${perFile[f]} rows emitted`);
  }

  await flush();
  await new Promise((resolve, reject) => { out.end(resolve); out.on('error', reject); });

  // ---- CHECKS (items 9-12), each reported with its verdict ---------------
  const perFileSum = Object.values(perFile).reduce((a, b) => a + b, 0);
  const checks = [
    { name: 'zero_malformed_rows', item: 9, value: totals.malformed, expected: 0, passed: totals.malformed === 0 },
    { name: 'rows_equal_distinct_ein', item: 10, value: `${totals.rows} rows / ${seenEins.size} distinct`, expected: 'equal', passed: totals.rows === seenEins.size },
    { name: 'per_file_sum_equals_total', item: 11, value: `${perFileSum} / ${totals.rows}`, expected: 'equal', passed: perFileSum === totals.rows },
    { name: 'zero_null_ruling', item: 12, value: totals.nullRuling, expected: 0, passed: totals.nullRuling === 0 },
  ];

  const sidecar = {
    generatedAt: new Date().toISOString(),
    generator: 'scripts/bmf-parse.mjs',
    extractDate: marker.extractDate,
    fileSet: marker.fileSet,
    files,
    targetTable: TARGET_TABLE,
    columns: COLUMNS.map((c) => c.col),
    sqlPath: 'scripts/bmf-aside.tmp.sql',
    sqlBytes: totals.sqlBytes,
    statements: totals.statements,
    maxStatementBytes: totals.maxStatementBytes,
    statementCeilingBytes: STATEMENT_CEILING_BYTES,
    recordsRead: totals.recordsRead,
    rows: totals.rows,
    distinctEins: seenEins.size,
    duplicateEins,
    perFile,
    perFileSum,
    malformed: totals.malformed,
    malformedSamples,
    nullRuling: totals.nullRuling,
    nullRevenueAmt: totals.nullRevenue,
    nullNteeCd: totals.nullNtee,
    emptyState: totals.emptyState,
    emptyCity: totals.emptyCity,
    emptyName: totals.emptyName,
    quotedRecords: totals.quotedRecords,
    multiLineRecords: totals.multiLineRecords,
    // item 13: PRODUCED here, never asserted from the plan (§5).
    revenueAmtSum: revenueSum.toString(),
    revenueAmtRows: revenueRows,
    // R21b: captured during the parse, not searched for at assert time.
    firstLeadingZeroEin,
    firstCommaName,
    checks,
  };
  writeFileSync(OUT_SIDECAR_PATH, JSON.stringify(sidecar, null, 2) + '\n', 'utf8');

  // ---- ITEM 5, the stdout summary ---------------------------------------
  const failed = checks.filter((c) => !c.passed);
  log('');
  log(`extract ${marker.extractDate}  set '${marker.fileSet}'  ${files.length} files`);
  log(`records read ${totals.recordsRead}   rows emitted ${totals.rows}   distinct EINs ${seenEins.size}   duplicates ${duplicateEins}`);
  log(`per-file: ${files.map((f) => `${f} ${perFile[f]}`).join(', ')}  (sum ${perFileSum})`);
  log(`malformed ${totals.malformed}   null RULING ${totals.nullRuling}`);
  log(`null REVENUE_AMT ${totals.nullRevenue}   null NTEE_CD ${totals.nullNtee}`);
  log(`empty STATE ${totals.emptyState}   empty CITY ${totals.emptyCity}   empty NAME ${totals.emptyName}`);
  log(`quoted records ${totals.quotedRecords}   multi-line records ${totals.multiLineRecords}`);
  log(`REVENUE_AMT sum over ${revenueRows} non-null rows: ${revenueSum.toString()}`);
  log(`R21b leading-zero EIN: ${firstLeadingZeroEin ? `${firstLeadingZeroEin.ein} (${firstLeadingZeroEin.file})` : 'NONE FOUND'}`);
  log(`R21b comma-bearing NAME: ${firstCommaName ? `${JSON.stringify(firstCommaName.name)} EIN ${firstCommaName.ein} (${firstCommaName.file})` : 'NONE FOUND'}`);
  log(`SQL ${totals.sqlBytes} B in ${totals.statements} statements, largest ${totals.maxStatementBytes} B (ceiling ${STATEMENT_CEILING_BYTES})`);
  log('');
  for (const c of checks) {
    log(`  item ${c.item}  ${c.name.padEnd(26)} ${c.passed ? 'PASS' : 'FAIL'}  ${c.value}`);
  }
  log('');
  log(`emitted: ${OUT_SQL_PATH}`);
  log(`sidecar: ${OUT_SIDECAR_PATH}`);

  if (failed.length) {
    fail(`${failed.length} check(s) failed: ${failed.map((c) => c.name).join(', ')}. The emitted file and sidecar are left in place for inspection.`);
  }
  log('DONE. Items satisfied: 3, 4, 5, 9, 10, 11, 12, 13.');
  log('Next: the verifier reads the sidecar and loads the emitted file into an in-memory scratch table.');
}

main().catch((e) => fail(`unhandled: ${e && e.stack ? e.stack : e}`));
