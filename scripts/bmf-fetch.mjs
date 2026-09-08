#!/usr/bin/env node
// scripts/bmf-fetch.mjs
//
// SLICE 1, FILE 1 OF 3. Acquisition and freezing ONLY. This script owns the
// NETWORK and the CACHE. It does not parse, does not emit SQL, does not create
// any table, and never touches a database.
//
// Usage:
//   node scripts/bmf-fetch.mjs                 (five-file set, cache is a no-op if populated)
//   node scripts/bmf-fetch.mjs --set=four      (the four-file set)
//   node scripts/bmf-fetch.mjs --refresh       (ignore a populated cache and re-fetch)
//
// R28 EXEMPTIONS, STATED SO A READER DOES NOT READ THEM AS OMISSIONS. §2's
// script contract was written for a script that EXECUTES against D1. Slice 1
// makes no database contact by ruling (R21), so this script is exempt from
// exactly three things and carries none of them: the --local / --remote usage
// pair, the DB_NAME constant, and the spawnSync on `wrangler d1 execute`.
// Everything else in §2 still binds — scripts/ placement and fail(msg) exiting 1
// are both here.
//
// DEFINITION-OF-DONE ITEMS THIS FILE SATISFIES: 1, 2, 6, 7, 8.
//   item 6  the file-set check, and it runs FIRST, before any network call
//   item 1  the .bmf-cache/ download, cached rather than re-fetched
//   item 2  R19a's marker recording which extract the cache holds
//   item 7  byte counts frozen as a DATED record (R26)
//   item 8  the 28-column header asserted AND captured (R26, same treatment)
// Items 3, 4, 5 and 9 through 15 belong to the parser and the verifier.
//
// THREE THINGS MEASURED 2026-09-08 THAT THE PLAN DID NOT ANTICIPATE. Each is
// recorded where it changes behaviour, and all three are flagged in the slice
// report rather than absorbed silently.
//
//   (a) CONTENT-LENGTH IS NOT USABLE AS THE BYTE CHECK. §4 mode 2 says a partial
//       download is "detectable by byte count against Content-Length". Measured
//       against the live endpoint: a HEAD returns `content-encoding: gzip` with
//       `content-length: 20`, which is a compressed length for an empty HEAD
//       body; a GET returns content-length NULL because the response is chunked,
//       and fetch decompresses transparently. So Content-Length is absent when
//       we need it and wrong when present. This script therefore checks the
//       BYTES ACTUALLY WRITTEN against the dated record, and treats a zero-byte
//       or absurdly small file as a failed download in its own right.
//
//   (b) THE SERVER IGNORES `Range`. A ranged request returns 200 with the whole
//       file, not 206. There is no cheap partial fetch, which is part of why
//       R19's cache exists.
//
//   (c) PER-FILE Last-Modified TIMES DIFFER WITHIN ONE EXTRACT. Measured
//       2026-09-08: eo1 04:11:46, eo_pr 04:13:14, eo_xx 04:13:27, all on
//       2026-09-07. So the extract identity is the DATE, never the timestamp.
//       A same-timestamp check would refuse every real extract.

import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, renameSync, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createInterface } from 'node:readline';
import { createReadStream } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(ROOT, '.bmf-cache');
const MARKER_PATH = join(CACHE_DIR, 'extract.json');
const PROVENANCE_PATH = join(ROOT, 'scripts', 'bmf-extract-provenance.json');

const BASE_URL = 'https://www.irs.gov/pub/irs-soi/';

// ---------------------------------------------------------------------------
// THE FILE SET (item 6, and it is checked FIRST).
//
// The six published files are NOT six regions. `eo4` is EXACTLY `eo_xx` plus
// `eo_pr`: 2,391 + 2,515 = 4,906 EINs, zero unique to eo4 and none overlapping
// eo1/eo2/eo3 (measured 2026-08-18, docs/propublica-spike-findings.md §7). So
// taking all six DOUBLE-LOADS 4,906 organizations, and §3 rules this check runs
// first precisely because the symptom — a duplicate-key failure — surfaces far
// downstream from its cause.
//
// Both unions come to 1,957,340 rows. There is deliberately no way to express
// the six-file set through this script's arguments; the guard below exists to
// catch a later EDIT to these constants, which is the only remaining way to
// reach it.
const FILE_SETS = {
  five: ['eo1', 'eo2', 'eo3', 'eo_xx', 'eo_pr'],
  four: ['eo1', 'eo2', 'eo3', 'eo4'],
};
const RULED_SET_SIGNATURES = ['eo1,eo2,eo3,eo4', 'eo1,eo2,eo3,eo_pr,eo_xx'];

// ---------------------------------------------------------------------------
// THE FROZEN HEADER (item 8).
//
// PROVENANCE (R8d): measured 2026-09-08 from the 2026-09-07 extract, identical
// across eo1, eo_xx and eo_pr — 259 characters, 28 comma-separated columns.
// Before this it was cited at three sites in docs/bmf-load-scoping.md and
// written down NOWHERE, with only 7 of its 28 column names appearing anywhere
// in the repository.
//
// R26's ASYMMETRY GOVERNS WHAT A MISMATCH MEANS, and the two halves are
// opposite: the header is expected STABLE across extracts, so a header mismatch
// is a REFUSAL; the sizes are expected to MOVE, so a size mismatch against a NEW
// extract is an UPDATE.
const FROZEN_HEADER =
  'EIN,NAME,ICO,STREET,CITY,STATE,ZIP,GROUP,SUBSECTION,AFFILIATION,' +
  'CLASSIFICATION,RULING,DEDUCTIBILITY,FOUNDATION,ACTIVITY,ORGANIZATION,' +
  'STATUS,TAX_PERIOD,ASSET_CD,INCOME_CD,FILING_REQ_CD,PF_FILING_REQ_CD,' +
  'ACCT_PD,ASSET_AMT,INCOME_AMT,REVENUE_AMT,NTEE_CD,SORT_NAME';
const EXPECTED_COLUMN_COUNT = 28;

// The seven ruled columns (§1) must all be present in the header. Asserted
// rather than assumed, because the parser downstream addresses them BY NAME.
const REQUIRED_COLUMNS = ['EIN', 'NAME', 'CITY', 'STATE', 'REVENUE_AMT', 'RULING', 'NTEE_CD'];

// ---------------------------------------------------------------------------
// RECORDED BYTE COUNTS (item 7), keyed by extract date. A DATED RECORD, NOT A
// PERMANENT CONSTANT (R26 / R23): the IRS regenerates this file monthly, so a
// frozen size verifies the extract it was measured from and nothing else.
//
// PROVENANCE (R8d):
//   2026-08     eo1 only, 48,629,769 B, docs/bmf-load-scoping.md §3, matched
//               three times. The other four were never recorded.
//   2026-09-07  measured 2026-09-08 by this slice. eo2 and eo3 are NOT here
//               because they were not fetched; the first full run captures them.
//               eo1 moved +171,967 B against 2026-08, which is R26's expected
//               movement and R22b's roughly 0.2% per month.
const RECORDED_SIZES = {
  '2026-08': { eo1: 48629769 },
  '2026-09-07': { eo1: 48801736, eo_xx: 418534, eo_pr: 449348 },
};

// A file smaller than this cannot be a BMF region file. The smallest measured is
// eo_xx at 418,534 B. This is a FLOOR that catches a truncated or error-page
// response early; it is NOT a size check, and nothing downstream may read it as
// one. Same posture as MIN_EXCEL_BYTES in readRosterFile.js.
const MIN_PLAUSIBLE_BYTES = 100000;

function fail(msg) {
  console.error(`[bmf-fetch] ERROR: ${msg}`);
  process.exit(1);
}

function log(msg) {
  console.log(`[bmf-fetch] ${msg}`);
}

function readJsonOrNull(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    fail(`${path} exists but is not valid JSON: ${e.message}`);
  }
}

// The extract's identity is the DATE, never the timestamp — see finding (c).
function extractDateOf(lastModified) {
  if (!lastModified) return null;
  const d = new Date(lastModified);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// ITEM 6 — THE FILE-SET CHECK. Runs before any network call.
function resolveFileSet(args) {
  const flag = args.find((a) => a.startsWith('--set='));
  const name = flag ? flag.slice('--set='.length) : 'five';
  if (!Object.prototype.hasOwnProperty.call(FILE_SETS, name)) {
    fail(`unknown --set=${name}. The ruled sets are 'five' (eo1,eo2,eo3,eo_xx,eo_pr) and 'four' (eo1,eo2,eo3,eo4).`);
  }
  const files = FILE_SETS[name];

  if (files.length !== 4 && files.length !== 5) {
    fail(`file set '${name}' has ${files.length} files. §3 rules four or five, never six.`);
  }
  if (new Set(files).size !== files.length) {
    fail(`file set '${name}' contains a duplicate entry: ${files.join(',')}`);
  }
  // eo4 IS eo_xx + eo_pr. Holding eo4 alongside either is the 4,906-row
  // double-load, expressed directly rather than inferred from a count.
  const hasEo4 = files.includes('eo4');
  const hasSplit = files.includes('eo_xx') || files.includes('eo_pr');
  if (hasEo4 && hasSplit) {
    fail(`file set '${name}' holds eo4 together with eo_xx/eo_pr. eo4 IS those two files, so this double-loads 4,906 organizations.`);
  }
  // The guard that survives a later edit to FILE_SETS: the resolved set must be
  // one of the two ruled signatures exactly.
  const signature = [...files].sort().join(',');
  if (!RULED_SET_SIGNATURES.includes(signature)) {
    fail(`file set '${name}' resolves to {${signature}}, which is not one of the two ruled sets. Ruled: {${RULED_SET_SIGNATURES.join('} or {')}}.`);
  }
  return { name, files };
}

// ---------------------------------------------------------------------------
// Reads only the first line, without pulling the file into memory. eo1 is
// roughly 48 MB and there is no ranged fetch (finding (b)).
async function readFirstLine(path) {
  const stream = createReadStream(path, { encoding: 'utf8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    rl.close();
    stream.destroy();
    return line;
  }
  stream.destroy();
  return null;
}

async function downloadOne(name, destPath) {
  const url = `${BASE_URL}${name}.csv`;
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    fail(`${name}: network error fetching ${url} — ${e.message}`);
  }
  if (!res.ok) {
    fail(`${name}: ${url} returned HTTP ${res.status} ${res.statusText}`);
  }
  if (!res.body) {
    fail(`${name}: ${url} returned no body`);
  }

  const lastModified = res.headers.get('last-modified');
  const tmpPath = `${destPath}.partial`;
  try {
    await pipeline(Readable.fromWeb(res.body), createWriteStream(tmpPath));
  } catch (e) {
    if (existsSync(tmpPath)) rmSync(tmpPath);
    fail(`${name}: download failed mid-stream — ${e.message}. Nothing kept; rerun.`);
  }

  const bytes = statSync(tmpPath).size;
  // §4 mode 2 is "nothing written; rerun" — so a refusal here removes the
  // partial file rather than leaving it to be mistaken for a complete one.
  if (bytes < MIN_PLAUSIBLE_BYTES) {
    rmSync(tmpPath);
    fail(`${name}: received ${bytes} B, below the ${MIN_PLAUSIBLE_BYTES} B floor. This is a truncated response or an error page, not a BMF file. Nothing kept; rerun.`);
  }

  rmSync(destPath, { force: true });
  renameSync(tmpPath, destPath);
  return { bytes, lastModified, extractDate: extractDateOf(lastModified) };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('usage: node scripts/bmf-fetch.mjs [--set=five|four] [--refresh]');
    process.exit(0);
  }
  const refresh = args.includes('--refresh');

  // ---- ITEM 6, FIRST, before any network call ----------------------------
  const { name: setName, files } = resolveFileSet(args);
  log(`file-set check passed: '${setName}' = {${files.join(', ')}}, ${files.length} files.`);

  // ---- ITEM 1, the cache, and a populated marked cache is a NO-OP ---------
  const marker = readJsonOrNull(MARKER_PATH);
  if (marker && !refresh) {
    const sameSet = [...(marker.files || [])].sort().join(',') === [...files].sort().join(',');
    const allPresent = files.every((f) => existsSync(join(CACHE_DIR, `${f}.csv`)));
    if (sameSet && allPresent && marker.complete === true) {
      log(`cache is populated and marked for extract ${marker.extractDate}; nothing to do.`);
      log(`  downloaded ${marker.downloadedAt}, files {${(marker.files || []).join(', ')}}`);
      log('  a no-op cannot see a NEWER upstream extract. Pass --refresh, or delete .bmf-cache/ (R19b: the cache is not a backup).');
      return;
    }
    log('cache marker present but incomplete or for a different file set; re-fetching.');
  }

  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

  // ---- DOWNLOAD ----------------------------------------------------------
  const downloaded = {};
  for (const f of files) {
    const dest = join(CACHE_DIR, `${f}.csv`);
    log(`fetching ${f}.csv ...`);
    const r = await downloadOne(f, dest);
    downloaded[f] = r;
    log(`  ${f}.csv  ${r.bytes} B  last-modified ${r.lastModified || '(absent)'}`);
  }

  // ---- EXTRACT IDENTITY: one calendar date across the whole set -----------
  const dates = [...new Set(files.map((f) => downloaded[f].extractDate).filter(Boolean))];
  if (dates.length === 0) {
    fail('no file reported a Last-Modified header, so the extract cannot be dated. R19a requires the cache to record which extract it holds.');
  }
  if (dates.length > 1) {
    // R22 proved a set spanning months is "worse than a fresh download, not
    // better" — organizations doubled, absent or stale. That finding was about
    // Wayback archives; this applies it to the live fetch. JUDGMENT CALL, and
    // flagged as one: refusing costs a rerun, accepting costs a mixed extract.
    fail(`the fetched files span more than one extract date: ${dates.join(', ')}. R22's mixed-extract hazard. Nothing further done; rerun.`);
  }
  const extractDate = dates[0];
  log(`extract date ${extractDate} (one calendar date across all ${files.length} files).`);

  // ---- ITEM 8 — HEADER ASSERT, AND CAPTURE -------------------------------
  const headers = {};
  for (const f of files) {
    const line = await readFirstLine(join(CACHE_DIR, `${f}.csv`));
    if (line === null) fail(`${f}.csv is empty; no header line to assert.`);
    headers[f] = line;
  }

  for (const f of files) {
    const h = headers[f];
    const cols = h.split(',');
    if (cols.length !== EXPECTED_COLUMN_COUNT) {
      fail(`${f}.csv header has ${cols.length} columns, expected ${EXPECTED_COLUMN_COUNT}. A header mismatch is a REFUSAL (R26): the header is expected stable across extracts. Inspect the change before rerunning.`);
    }
    const missing = REQUIRED_COLUMNS.filter((c) => !cols.includes(c));
    if (missing.length) {
      fail(`${f}.csv header is missing ruled column(s): ${missing.join(', ')}. REFUSAL.`);
    }
    if (h !== FROZEN_HEADER) {
      fail(`${f}.csv header does not match the frozen 28-column string. A header mismatch is a REFUSAL (R26).\n  frozen:   ${FROZEN_HEADER}\n  received: ${h}`);
    }
  }
  const distinctHeaders = new Set(Object.values(headers));
  if (distinctHeaders.size !== 1) {
    fail(`the ${files.length} files do not share one header (${distinctHeaders.size} distinct). REFUSAL.`);
  }
  log(`header assert passed: ${files.length} of ${files.length} matched the frozen 28-column string exactly, 0 column-count anomalies.`);

  // ---- ITEM 7 — BYTE COUNTS, FROZEN AS A DATED RECORD --------------------
  // R26's asymmetry: sizes are expected to MOVE, so a mismatch against a NEW
  // extract is an UPDATE. A mismatch against the SAME extract date is not — that
  // is a partial or corrupted download, and it refuses.
  const knownForThisExtract = RECORDED_SIZES[extractDate] || {};
  const sizeUpdates = [];
  for (const f of files) {
    const got = downloaded[f].bytes;
    const known = knownForThisExtract[f];
    if (known === undefined) {
      sizeUpdates.push(`${f} ${got} B (newly recorded)`);
      continue;
    }
    if (got !== known) {
      fail(`${f}.csv is ${got} B but ${got > known ? 'exceeds' : 'falls short of'} the ${known} B recorded for extract ${extractDate}. Same extract, different size: this is a partial or corrupted download, not the expected movement between extracts. Nothing further done; rerun.`);
    }
  }
  for (const [date, sizes] of Object.entries(RECORDED_SIZES)) {
    if (date === extractDate) continue;
    for (const f of files) {
      if (sizes[f] === undefined) continue;
      const delta = downloaded[f].bytes - sizes[f];
      const pct = ((delta / sizes[f]) * 100).toFixed(2);
      log(`  size movement vs ${date}: ${f} ${delta >= 0 ? '+' : ''}${delta} B (${pct}%) — expected under R26.`);
    }
  }
  if (sizeUpdates.length) {
    log(`byte counts captured for extract ${extractDate}: ${sizeUpdates.join(', ')}`);
  }

  // ---- ITEM 2 — R19a's MARKER --------------------------------------------
  // Written LAST and only on success, so a marked cache means a whole cache.
  // Same reasoning as load_stamp.completed_at under R12c.
  const downloadedAt = new Date().toISOString();
  const markerOut = {
    extractDate,
    downloadedAt,
    fileSet: setName,
    files,
    bytes: Object.fromEntries(files.map((f) => [f, downloaded[f].bytes])),
    lastModified: Object.fromEntries(files.map((f) => [f, downloaded[f].lastModified])),
    headerChars: FROZEN_HEADER.length,
    complete: true,
  };
  writeFileSync(MARKER_PATH, JSON.stringify(markerOut, null, 2) + '\n', 'utf8');
  log(`marker written: ${MARKER_PATH}`);

  // ---- PROVENANCE, the DATED record that outlives the cache ---------------
  // R19b rules the cache is NOT a backup and is safe to delete at any time, so a
  // record frozen only inside it would not be frozen at all. This file is
  // TRACKED, and a new extract shows up as a reviewable diff rather than a
  // silent overwrite — which is what R26's "dated record, not permanent
  // constant" and R8d's "source and date sit next to the constant" require.
  const provenance = readJsonOrNull(PROVENANCE_PATH) || { extracts: {} };
  provenance.extracts[extractDate] = {
    capturedAt: downloadedAt,
    fileSet: setName,
    header: FROZEN_HEADER,
    headerColumns: EXPECTED_COLUMN_COUNT,
    bytes: markerOut.bytes,
    lastModified: markerOut.lastModified,
  };
  writeFileSync(PROVENANCE_PATH, JSON.stringify(provenance, null, 2) + '\n', 'utf8');
  log(`provenance updated: ${PROVENANCE_PATH} (extract ${extractDate})`);

  // ---- SUMMARY -----------------------------------------------------------
  const total = files.reduce((s, f) => s + downloaded[f].bytes, 0);
  log('');
  log(`DONE. extract ${extractDate}, set '${setName}', ${files.length} files, ${total} B total.`);
  log('Items satisfied: 6 (file set), 1 (cache), 2 (marker), 7 (byte counts), 8 (header).');
  log('Next: the parser reads ONLY from .bmf-cache/ and never re-fetches.');
}

main().catch((e) => fail(`unhandled: ${e && e.stack ? e.stack : e}`));
