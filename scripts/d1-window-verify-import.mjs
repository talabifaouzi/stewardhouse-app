// D1 IMPORT-WINDOW EXPERIMENT - PHASE 0 IMPORT VERIFIER
//
// Part of the experiment recorded in section 12 of `docs/bmf-load-scoping.md`.
// Proves the generated file is loadable and profile-faithful before anyone
// considers spending a remote import on it.
//
// PHASE 0 (local preparation).
// RUN: [agent-ok]. Local only.
//
// Writes a STANDALONE SQLite file, deliberately not `wrangler d1 execute
// --local`, which resolves to the config-resolved pilot mirror (CLAUDE.md §10).
// This experiment must never touch `stewardhouse-pilot`.

// Phase 0 VERIFY — import the synthetic file into a STANDALONE scratch SQLite file.
// Deliberately NOT `wrangler d1 execute --local`: that resolves to the config-resolved
// pilot mirror (§10), which this experiment must not touch. node:sqlite against a file
// in the scratchpad has no wrangler state at all.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, rmSync, existsSync, statSync } from 'node:fs';

const SQL = process.argv[2], DB = process.argv[3];
if (!SQL || !DB) { console.error('usage: node scripts/d1-window-verify-import.mjs <in.sql> <scratch.sqlite>'); process.exit(1); }
for (const suf of ['', '-wal', '-shm']) if (existsSync(DB + suf)) rmSync(DB + suf);

const db = new DatabaseSync(DB);
db.exec(`CREATE TABLE bmf (ein TEXT NOT NULL, name TEXT NOT NULL, city TEXT NOT NULL,
  state TEXT NOT NULL, revenue_amt INTEGER, ruling INTEGER NOT NULL, ntee_cd TEXT)`);

const text = readFileSync(SQL, 'utf8');
const stmts = text.split(';\n').filter((s) => s.trim());
const t0 = Date.now();
db.exec('BEGIN');
let maxBytes = 0;
for (const s of stmts) {
  const b = Buffer.byteLength(s, 'utf8') + 2;
  if (b > maxBytes) maxBytes = b;
  db.exec(s + ';');
}
db.exec('COMMIT');
const loadMs = Date.now() - t0;

const q = (sql) => db.prepare(sql).get();
const rows = q('SELECT COUNT(*) c FROM bmf').c;
const distinct = q('SELECT COUNT(DISTINCT ein) c FROM bmf').c;
const nullRev = q('SELECT COUNT(*) c FROM bmf WHERE revenue_amt IS NULL').c;
const nullNtee = q('SELECT COUNT(*) c FROM bmf WHERE ntee_cd IS NULL').c;
const nullRul = q('SELECT COUNT(*) c FROM bmf WHERE ruling IS NULL').c;
const means = q('SELECT AVG(LENGTH(name)) n, AVG(LENGTH(city)) c FROM bmf');
const rulRange = q('SELECT MIN(ruling) lo, MAX(ruling) hi FROM bmf');
const integrity = q('PRAGMA integrity_check').integrity_check;
const pc = q('PRAGMA page_count').page_count, ps = q('PRAGMA page_size').page_size;

console.log(JSON.stringify({
  statementsExecuted: stmts.length,
  maxStatementBytes: maxBytes,
  loadSeconds: +(loadMs / 1000).toFixed(2),
  rows, distinctEin: distinct,
  nullRevenue: nullRev, nullRevenuePct: +(100 * nullRev / rows).toFixed(4),
  nullNtee: nullNtee, nullNteePct: +(100 * nullNtee / rows).toFixed(4),
  nullRuling: nullRul,
  meanNameLen: +means.n.toFixed(3), meanCityLen: +means.c.toFixed(3),
  rulingMin: rulRange.lo, rulingMax: rulRange.hi,
  integrityCheck: integrity,
  storeMiB: +(pc * ps / 1048576).toFixed(2),
  sqlFileBytes: statSync(SQL).size,
}, null, 2));
db.close();
