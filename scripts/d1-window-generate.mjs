// D1 IMPORT-WINDOW EXPERIMENT - GENERATOR
//
// Part of the experiment recorded in section 12 of `docs/bmf-load-scoping.md`:
// does a D1 import make concurrent reads QUEUE or FAIL, and how long is the
// window. The experiment RAN, four times. The answer is FAIL, and section 12
// carries the measured window.
//
// PHASE 0 (local preparation).
// RUN: [agent-ok]. Local only. Touches no database and makes no network call.
//
// OUTPUT IS ~159 MB. Pass a path OUTSIDE the repo. `.gitignore` carries
// `bmf-synthetic*.sql` as a backstop, not as permission to write it in-tree.

// Phase 0 GENERATOR — synthetic BMF-profile .sql for the D1 import-window experiment.
//
// Profile targets, measured from the five ruled files (eo1,eo2,eo3,eo_xx,eo_pr):
//   rows 1,957,340 | mean NAME 30.477 B | mean CITY 8.706 B
//   NULL revenue_amt 569,235 | NULL ntee_cd 574,447 | RULING 190001..202607
// Row count is the REAL count on purpose: wrangler's bundle notes the server may
// process a small file in one round-trip with no poll loop, which would produce a
// false negative for the window being measured.
// No indexes: their cost is already measured and would confound ingest time.
import { createWriteStream } from 'node:fs';

const arg = (k, d) => { const m = process.argv.find((a) => a.startsWith(`--${k}=`)); return m ? m.slice(k.length + 3) : d; };

// SHAPE. `insert` is the INSERT-only file the first run used and is the DEFAULT, so
// that file stays byte-reproducible. `aside-swap` emits the RULED shape instead:
// CREATE aside, INSERT into aside, DROP live, RENAME aside to live, all in ONE
// file, which is the swap fork's binding constraint. It is a flag rather than a
// second script because the row profile (means, exact NULL counts, deterministic
// words) is the part that must not drift, and duplicating it creates two places
// for it to drift. Only the surrounding DDL differs.
const SHAPE = arg('shape', 'insert');
if (SHAPE !== 'insert' && SHAPE !== 'aside-swap') { console.error(`--shape must be insert|aside-swap, got ${SHAPE}`); process.exit(1); }
const LIVE = 'bmf', ASIDE = 'bmf_aside';
const TARGET = SHAPE === 'aside-swap' ? ASIDE : LIVE;

// ROW COUNT is overridable so a run can make the pre-import and post-import counts
// DIFFER. The probe reads count(*), so if an aside-swap run loads the same count the
// live table already holds, pre and post are identical and stale-read detection is
// silently disabled (the analyzer guards on `EXPECT !== preCount`).
const ROWS = Number(arg('rows', '1957340'));
const NULL_REV = 569_235;
const NULL_NTEE = 574_447;
const NAME_MEAN = 30.477;
const CITY_MEAN = 8.706;
const STMT_TARGET = 30_000;            // ~30 KB per INSERT, the ruled chunk size
const OUT = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!OUT) { console.error('usage: node scripts/d1-window-generate.mjs <out.sql> [--shape=insert|aside-swap] [--rows=N]'); process.exit(1); }

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC',
  'ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC','PR'];
const NTEE = ['A20','B82','C30','D20','E92','F32','G81','H90','I20','J22','K30','L21','M24',
  'N50','O52','P20','Q30','R22','S41','T30','U40','V33','W20','X21','Y42','Z99'];
const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Deterministic length generator hitting the target mean exactly (Bresenham on the
// fractional part) rather than a PRNG, so the file is reproducible byte for byte.
function mk(base, frac) { let acc = 0; return () => { acc += frac; if (acc >= 1) { acc -= 1; return base + 1; } return base; }; }
const nameLen = mk(Math.floor(NAME_MEAN), NAME_MEAN - Math.floor(NAME_MEAN));
const cityLen = mk(Math.floor(CITY_MEAN), CITY_MEAN - Math.floor(CITY_MEAN));
// Exact NULL counts, evenly distributed, not a probability.
function nuller(total, want) { let i = 0; return () => { i++; return Math.floor((i * want) / total) > Math.floor(((i - 1) * want) / total); }; }
const revNull = nuller(ROWS, NULL_REV);
const nteeNull = nuller(ROWS, NULL_NTEE);

function word(seed, len) {
  let s = '';
  for (let i = 0; i < len; i++) s += AL[(seed + i * 7 + (i % 5) * 3) % 26];
  return s;
}
const RULINGS = [];
for (let y = 1900; y <= 2026; y++) for (let m = 1; m <= 12; m++) { const v = y * 100 + m; if (v >= 190001 && v <= 202607) RULINGS.push(v); }

const out = createWriteStream(OUT);
let stmtCount = 0, maxStmt = 0, nameBytes = 0, cityBytes = 0, revNulls = 0, nteeNulls = 0;
const HEAD = `INSERT INTO ${TARGET} (ein,name,city,state,revenue_amt,ruling,ntee_cd) VALUES\n`;

function write(chunk) { return out.write(chunk) ? Promise.resolve() : new Promise((r) => out.once('drain', r)); }

const t0 = Date.now();
if (SHAPE === 'aside-swap') {
  await write(`CREATE TABLE ${ASIDE} (ein TEXT NOT NULL, name TEXT NOT NULL, city TEXT NOT NULL, state TEXT NOT NULL, revenue_amt INTEGER, ruling INTEGER NOT NULL, ntee_cd TEXT);\n`);
  stmtCount++;
}
let buf = [], bufBytes = 0;

async function flush() {
  if (!buf.length) return;
  const stmt = HEAD + buf.join(',\n') + ';\n';
  const b = Buffer.byteLength(stmt, 'utf8');
  if (b > maxStmt) maxStmt = b;
  stmtCount++;
  await write(stmt);
  buf = []; bufBytes = 0;
}

for (let i = 1; i <= ROWS; i++) {
  const ein = String(i).padStart(9, '0');
  const nl = nameLen(), cl = cityLen();
  const name = word(i % 26, nl);
  const city = word((i * 3) % 26, cl);
  nameBytes += nl; cityBytes += cl;
  const st = STATES[i % STATES.length];
  const isRevNull = revNull(); if (isRevNull) revNulls++;
  const isNteeNull = nteeNull(); if (isNteeNull) nteeNulls++;
  const rev = isRevNull ? 'NULL' : String((i * 9973) % 5_000_000);
  const rul = RULINGS[i % RULINGS.length];
  const ntee = isNteeNull ? 'NULL' : `'${NTEE[i % NTEE.length]}'`;
  const row = `('${ein}','${name}','${city}','${st}',${rev},${rul},${ntee})`;
  const rb = Buffer.byteLength(row, 'utf8') + 2;
  if (bufBytes + rb > STMT_TARGET && buf.length) await flush();
  buf.push(row); bufBytes += rb;
}
await flush();
if (SHAPE === 'aside-swap') {
  // DROP and RENAME ship in this SAME file. Splitting them across invocations is
  // what reintroduces the non-atomicity the swap fork closed.
  await write(`DROP TABLE ${LIVE};\n`);
  await write(`ALTER TABLE ${ASIDE} RENAME TO ${LIVE};\n`);
  stmtCount += 2;
}
await new Promise((r) => out.end(r));

console.log(JSON.stringify({
  shape: SHAPE, rows: ROWS, statements: stmtCount, maxStatementBytes: maxStmt,
  meanNameLen: +(nameBytes / ROWS).toFixed(3),
  meanCityLen: +(cityBytes / ROWS).toFixed(3),
  nullRevenue: revNulls, nullNtee: nteeNulls,
  seconds: +((Date.now() - t0) / 1000).toFixed(1),
}, null, 2));
