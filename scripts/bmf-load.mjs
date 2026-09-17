#!/usr/bin/env node
// scripts/bmf-load.mjs
//
// SLICE 2, THE LOADER. R32 rules slice 2 to be the whole loader: create the
// aside (A), the pre-flight credential check (B), load the emitted file (C),
// mint the generation timestamp (D), open the stamp row (E), the five pre-swap
// checks (F), write the load_check rows (G), the swap (H), the post-swap
// assertion (I), completion written last (J), the pruning code (K), the undo
// file (L), and the read-only verification against D1 (M).
//
// WHAT THIS FILE IMPLEMENTS TODAY: DEFINITION-OF-DONE ITEMS 1, 2 AND 8, AND
// R32 ELEMENTS B, A AND C — the target map and the run banner (R36, R37, R38),
// the DDL constant (R13, R33), the pre-flight (R20), the creation of the aside
// from that constant with R16's two pre-swap assertions, and the load of slice
// 1's emitted artifact into that aside in ONE invocation. It resolves and
// validates its arguments, prints the banner, runs the pre-flight, creates
// `bmf_aside`, asserts the shape it just built, loads the artifact, asserts the
// loaded row count against slice 1's sidecar, and then REFUSES TO PROCEED.
// It mints no generation, opens no `load_stamp` row, swaps nothing, and neither
// reads nor writes the live `bmf` table. Elements D through M are UNBUILT, and
// this file says so at exit rather than implying succeeding.
//
// ITEM 2 ADDED DATA AND RENDERERS; ELEMENT A IS WHAT CALLS THEM. The DDL
// constant and the five functions that render it — columnSql, createTableSql,
// indexNameFor, createIndexSql, asideStatements — now have one consumer,
// element A below. Definition-of-done item 3, the R13a regeneration, is their
// other consumer and is NOT in this file; it ran as a scratch regenerator and
// A149 files that mechanism as debt.
//
// Usage:
//   node scripts/bmf-load.mjs --db=bmf-sandbox --local --persist-to=<dir>
//   node scripts/bmf-load.mjs --db=stewardhouse-pilot --remote
//
// --remote is FT-RUN ONLY. CLAUDE.md §6.15 category (3) covers every wrangler
// --remote command, and R34 extends that to bmf-sandbox explicitly, so there is
// no sandbox carve-out.
//
// R28's THREE EXEMPTIONS DO NOT REACH THIS FILE, and that is stated so the one
// absent item reads as deferred rather than omitted. R37 rules the exemptions
// out of slice 2, so all three of section 2's requirements bind: the --local /
// --remote pair is present below, the single DB_NAME constant has become the
// two-entry TARGETS map, and the spawnSync on `wrangler d1 execute` arrives
// with element A below, one element earlier than this file first expected.
//
// R38's THREE RUN-TIME OBLIGATIONS ARE NOW DISCHARGED, because element A spawns
// wrangler and item 1 spawned nothing: the check that the directory holds no
// more than one store file besides miniflare's own metadata file, the print of
// the full wrangler command, and the print of the directory size at exit. What
// a store file IS is defined at that check rather than assumed. R38's other two
// halves were already here, because they are argument resolution and are
// checkable without executing anything: the directory is a required argument,
// and one inside the repository is refused.

import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'));

// R37: the two-entry target map. Each entry binds a database to its config, and
// the binding is the whole point. CLAUDE.md section 6.10 relies on the two
// databases being addressed by OPPOSITE config paths, so bmf-sandbox always
// carries --config bmf-sandbox.toml and stewardhouse-pilot never does. A caller
// cannot pair one database's name with the other's config, because the config is
// read from this map alone and --config from a caller is refused outright.
const TARGETS = {
  'bmf-sandbox': { config: 'bmf-sandbox.toml' },
  'stewardhouse-pilot': { config: null },
};

// ---------------------------------------------------------------------------
// THE DDL CONSTANT (definition-of-done item 2; R13, R33, R31, R16a, R24).
//
// R13 makes THIS FILE authoritative for the DDL and makes
// migrations/0022_bmf_table.sql derive from it. R31 fixes what the derivation is
// compared over: all THREE tables (bmf, load_stamp, load_check) and all FIVE
// indexes, every construct compared AS ATTACHED TO ITS NAMED OBJECT. DDL below
// therefore carries all three, keyed by object name, with each object's indexes
// nested inside it rather than listed apart, so that "attached to its named
// object" is a property of the structure rather than of a convention.
//
// SHAPE 1 OF R31's THREE, TAKEN DELIBERATELY. R33 rules packaging the builder's
// call and leaves shapes 1 and 3 both available: one constant carrying all three
// objects, or two constants partitioned by role. This is shape 1, so R13's "a
// single named constant" holds literally and R33's second consequence — that a
// builder taking shape 3 amends R13's wording — does not fire. The role
// divergence R31 names is real and is carried as a FIELD on each object,
// builtByLoader, rather than as a second container.
//
// R16a, THE OPERATIONAL JOB: the loader builds the aside from its own constant.
// The aside is bmf_aside (R24), a bmf TWIN — one table and three indexes.
// load_stamp and load_check are created ONCE by the migration and are never
// built by the loader at all (R12e, R8c), which is what builtByLoader records.
// R31 names that divergence and leaves it unresolved; carrying the role on the
// object resolves it without narrowing the coverage R31 fixes.
//
// R10c: THE INDEX SET IS PROVISIONAL and revisable at ZERO migration cost. This
// is a replace-all design, so every load rebuilds the whole set and a change
// costs one edit here plus one load cycle, not a migration.
const ASIDE_TABLE = 'bmf_aside'; // R24: the aside and the emitted INSERTs agree on this name.

const DDL = {
  // (1) THE BMF TABLE. Shape: docs/bmf-load-scoping.md §1.
  // ein NOT NULL is LOAD-BEARING: in SQLite a non-INTEGER PRIMARY KEY does NOT
  // imply NOT NULL, so deleting it accepts a NULL EIN. TEXT is correct for
  // leading zeros and does NOT protect them — the loader must QUOTE every EIN
  // (§2 hard requirement; §4 mode 7).
  // D4: no CHECK on ruling, deliberately. Value validation belongs to the R8
  // checks; a CHECK here would be a second place to maintain one rule.
  bmf: {
    builtByLoader: true,
    columns: [
      { name: 'ein', type: 'TEXT', notNull: true, primaryKey: true },
      { name: 'name', type: 'TEXT', notNull: true },
      { name: 'city', type: 'TEXT', notNull: true },
      { name: 'state', type: 'TEXT', notNull: true },
      { name: 'revenue_amt', type: 'INTEGER' },
      { name: 'ruling', type: 'INTEGER', notNull: true },
      { name: 'ntee_cd', type: 'TEXT' },
    ],
    // R10a: UNIQUE(ein) is absent because it is not a choice — the PRIMARY KEY
    // already creates it (sqlite_autoindex_bmf_1, origin pk). Three, not four.
    // R10d, PATH B: idx_bmf_name is a SEARCH index. Indexing for RETRIEVAL is
    // inside the §7 boundary; ordering by anything EVALUATIVE is not.
    indexes: [
      { name: 'idx_bmf_state_city', columns: ['state', 'city'] },
      { name: 'idx_bmf_ruling', columns: ['ruling'] },
      { name: 'idx_bmf_name', columns: ['name'] },
    ],
  },

  // (2) THE LOAD STAMP. One row per load, per source (R12a).
  // No source column (R12e) and no status column (R12d): the timestamps ARE the
  // status, and a status column would drift against them. id is a SURROGATE key
  // sitting outside R12a's seven fields (D1), and exists because R12b needs
  // something for load_check to reference.
  load_stamp: {
    builtByLoader: false,
    columns: [
      { name: 'id', type: 'TEXT', notNull: true, primaryKey: true },
      { name: 'source_date', type: 'TEXT', notNull: true },
      { name: 'file_set', type: 'TEXT', notNull: true },
      { name: 'load_started_at', type: 'TEXT', notNull: true },
      { name: 'load_finished_at', type: 'TEXT' },
      { name: 'completed_at', type: 'TEXT' },
      { name: 'row_count', type: 'INTEGER' },
      { name: 'generation_table', type: 'TEXT' },
    ],
    indexes: [{ name: 'idx_load_stamp_source_date', columns: ['source_date'] }],
  },

  // (3) THE CHECK RESULTS (R12b). One row per check per load.
  // D2: the foreign key and its CASCADE stay, and nothing in this design ever
  // deletes a load_stamp row — R12e makes the stamp outlive generations and R8c
  // prunes generation TABLES. The cascade documents intent for whoever writes a
  // stamp-deleting path. Remote FK enforcement: CLAUDE.md §10.
  // R12c: these rows are written BEFORE load_stamp.completed_at, so completion
  // still means the record is WHOLE.
  load_check: {
    builtByLoader: false,
    columns: [
      { name: 'id', type: 'TEXT', notNull: true, primaryKey: true },
      {
        name: 'stamp_id',
        type: 'TEXT',
        notNull: true,
        references: { table: 'load_stamp', column: 'id', onDelete: 'CASCADE' },
      },
      { name: 'check_name', type: 'TEXT', notNull: true },
      { name: 'value', type: 'TEXT' },
      { name: 'passed', type: 'INTEGER', notNull: true, check: 'passed IN (0, 1)' },
    ],
    indexes: [{ name: 'idx_load_check_stamp_id', columns: ['stamp_id'] }],
  },
};

// Constraint order is fixed here and matches migrations/0022_bmf_table.sql:
// NOT NULL, PRIMARY KEY, REFERENCES with its referential action, CHECK.
function columnSql(column, nameWidth, typeWidth) {
  const constraints = [];
  if (column.notNull) constraints.push('NOT NULL');
  if (column.primaryKey) constraints.push('PRIMARY KEY');
  if (column.references) {
    const ref = column.references;
    const action = ref.onDelete ? ` ON DELETE ${ref.onDelete}` : '';
    constraints.push(`REFERENCES ${ref.table}(${ref.column})${action}`);
  }
  if (column.check) constraints.push(`CHECK (${column.check})`);
  const head = column.name.padEnd(nameWidth);
  if (constraints.length === 0) return `${head}${column.type}`;
  return `${head}${column.type.padEnd(typeWidth)}${constraints.join(' ')}`;
}

// THE COLUMN PADDING IS COMPUTED from the widest name and the widest type in the
// object, and that one rule reproduces all three of the migration's table bodies
// exactly. Index padding is NOT computed: the migration aligns the three bmf
// index names and does not align the other two, so no single rule reproduces
// both, and R31 puts alignment whitespace outside the comparison anyway.
function createTableSql(objectName, { as } = {}) {
  const object = DDL[objectName];
  if (!object) throw new Error(`no DDL entry for ${JSON.stringify(objectName)}`);
  const name = as === undefined ? objectName : as;
  const nameWidth = Math.max(...object.columns.map((c) => c.name.length)) + 2;
  const typeWidth = Math.max(...object.columns.map((c) => c.type.length)) + 1;
  const body = object.columns.map((c) => `  ${columnSql(c, nameWidth, typeWidth)}`).join(',\n');
  return `CREATE TABLE ${name} (\n${body}\n);`;
}

// An index name is derived from the table it is rendered onto, because index
// names are database-global in SQLite and the aside's three would otherwise
// collide with the live table's. idx_bmf_state_city on bmf_aside becomes
// idx_bmf_aside_state_city.
function indexNameFor(index, objectName, renderedName) {
  if (renderedName === objectName) return index.name;
  const prefix = `idx_${objectName}_`;
  if (!index.name.startsWith(prefix)) {
    throw new Error(`index ${index.name} does not carry the ${prefix} prefix; cannot rename it`);
  }
  return `idx_${renderedName}_${index.name.slice(prefix.length)}`;
}

function createIndexSql(objectName, index, { as } = {}) {
  const name = as === undefined ? objectName : as;
  return `CREATE INDEX ${indexNameFor(index, objectName, name)} ON ${name}(${index.columns.join(', ')});`;
}

// The statements element A will execute to create the aside, returned AS TEXT.
// This function creates nothing and is called by nothing.
//
// ELEMENT H OWES A RENAME THIS FUNCTION CANNOT DISCHARGE, recorded here because
// it is invisible from the swap's own step. SQLite's ALTER TABLE RENAME does not
// rename indexes, so after the aside is renamed into place its indexes still
// carry the idx_bmf_aside_ names, while R13b and element 12 (I) assert that
// index_list on the LIVE table carries idx_bmf_state_city, idx_bmf_ruling and
// idx_bmf_name. The swap must rename all three explicitly. NOT BUILT HERE.
function asideStatements() {
  const statements = [createTableSql('bmf', { as: ASIDE_TABLE })];
  for (const index of DDL.bmf.indexes) {
    statements.push(createIndexSql('bmf', index, { as: ASIDE_TABLE }));
  }
  return statements;
}

// WRITTEN AS A LITERAL, NOT INTERPOLATED, SO IT IS GREPPABLE, and the assertion
// below catches the drift a literal otherwise invites. Same shape as the guard
// at scripts/bmf-verify-slice1.mjs:115, taken from it rather than invented.
//
// IT EXISTS BECAUSE THE CENSUS CAME BACK INVERTED. Rendering the statement
// through a template left the literal form of the aside's CREATE absent from the
// artifact R13 makes AUTHORITATIVE, while the slice-1 scratch carried it four
// times — so an auditor grepping for that string reached the scratch table and
// not this file. That is exactly backwards. The hazard is the one CLAUDE.md §10
// files as literal-versus-interpolated, and the docblock at
// scripts/bmf-verify-slice1.mjs:100-104 records the same trap from the other
// side: there a template would have HIDDEN the scratch, here it hid the source.
const ASIDE_DDL_PREFIX = 'CREATE TABLE bmf_aside (';
if (!createTableSql('bmf', { as: ASIDE_TABLE }).startsWith(ASIDE_DDL_PREFIX)) {
  throw new Error(
    `the rendered aside DDL does not begin with ${ASIDE_DDL_PREFIX} — ASIDE_TABLE, ` +
      'createTableSql and this literal have drifted apart.'
  );
}
// ---------------------------------------------------------------------------

// Section 2's contract: fail(msg) exits 1. Kept exactly, so a refusal here has
// the same shape as one in seed-invites.mjs and provision-institution.mjs.
function fail(msg) {
  console.error(`[bmf-load] ERROR: ${msg}`);
  process.exit(1);
}

const USAGE =
  'usage: node scripts/bmf-load.mjs --db=<name> (--local --persist-to=<dir> | --remote)';

const argv = process.argv.slice(2);

// --key=value reader, following the idiom at d1-window-generate.mjs:25. It
// refuses a repeated flag and a bare flag given without a value, because both
// are a caller meaning something the loader would otherwise have to guess.
function valueOf(key) {
  const hits = argv.filter((a) => a === `--${key}` || a.startsWith(`--${key}=`));
  if (hits.length === 0) return null;
  if (hits.length > 1) fail(`--${key} was given ${hits.length} times. Give it once.`);
  if (!hits[0].startsWith(`--${key}=`)) fail(`--${key} needs a value, as --${key}=<value>.`);
  const value = hits[0].slice(key.length + 3);
  if (value === '') fail(`--${key} was given an empty value.`);
  return value;
}

// R37, CHECKED FIRST. "The loader never accepts --config from its caller." It is
// tested before any other argument is read, so a run that supplies one is
// refused on that ground rather than on whichever later ground happens to fire.
if (argv.some((a) => a === '--config' || a.startsWith('--config='))) {
  fail(
    '--config is not accepted from the caller (R37). The config is bound to the ' +
      'database by the target map, which is what keeps the two databases addressed ' +
      'by opposite config paths. Name the database with --db=<name>.'
  );
}

// R36: every run names its target database AND whether it is local or remote.
// There is no default, and a run missing either refuses to start.
const dbName = valueOf('db');
const wantsLocal = argv.includes('--local');
const wantsRemote = argv.includes('--remote');

if (dbName === null && !wantsLocal && !wantsRemote) {
  fail(`this run names neither its target database nor its venue (R36). ${USAGE}`);
}
if (dbName === null) {
  fail(`this run names no target database (R36: there is no default). ${USAGE}`);
}
if (!wantsLocal && !wantsRemote) {
  fail(`this run names no venue (R36: there is no default). ${USAGE}`);
}
if (wantsLocal && wantsRemote) {
  fail(`this run names both --local and --remote. Name exactly one. ${USAGE}`);
}

if (!Object.prototype.hasOwnProperty.call(TARGETS, dbName)) {
  fail(
    `unknown target database ${JSON.stringify(dbName)}. The map holds exactly two: ` +
      `${Object.keys(TARGETS).join(', ')}.`
  );
}

const target = TARGETS[dbName];
const venue = wantsRemote ? 'remote' : 'local';

// R38: the local venue is a --persist-to directory OUTSIDE the repository. The
// directory is required for a local run and refused for a remote one, because a
// remote run has no local store and accepting the flag there would assert one.
// R38's "required argument" is unqualified; scoping it to local is a reading of
// the ruling's own stated purpose, which is entirely about the local store.
const persistArg = valueOf('persist-to');
let persistDir = null;

if (venue === 'local') {
  if (persistArg === null) {
    fail(
      'a local run needs --persist-to=<dir> (R38). The local venue is a ' +
        '--persist-to directory outside the repository, taken as a required argument.'
    );
  }
  persistDir = resolve(persistArg);
  const rel = relative(ROOT, persistDir);
  const insideRepo = rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
  if (insideRepo) {
    fail(
      '--persist-to must name a directory OUTSIDE the repository (R38). ' +
        `${persistDir} is inside ${ROOT}.`
    );
  }
} else if (persistArg !== null) {
  fail(
    '--persist-to applies to a local run only (R38 names it the LOCAL venue). ' +
      'A remote run has no local store, so the flag is refused rather than ignored.'
  );
}

// THE RUN BANNER. Item 1's done requires this to print BEFORE any statement
// executes. Nothing in this file executes a statement at all, so the ordering
// holds trivially today and must be preserved by whichever element adds the
// first execution: the banner is printed here, at the top of the run, and no
// element may move a statement above it.
console.log('[bmf-load] ---------------- run banner ----------------');
console.log(`[bmf-load] target database : ${dbName}`);
console.log(`[bmf-load] venue           : ${venue}`);
console.log(
  `[bmf-load] config          : ${target.config === null ? '(none, by R37)' : target.config}`
);
if (venue === 'local') {
  console.log(`[bmf-load] store path      : ${persistDir}`);
}
console.log('[bmf-load] -------------------------------------------');

if (venue === 'remote') {
  console.log(
    '[bmf-load] WARNING: --remote is FT-RUN ONLY. CLAUDE.md section 6.15 category ' +
      '(3) covers every wrangler --remote command, and R34 extends it to bmf-sandbox.'
  );
}

// ---------------------------------------------------------------- R38 RUNTIME
// R38's three run-time obligations land here rather than with item 1, because
// each needs a run that actually spawns wrangler and item 1 spawned nothing.
//
// WHAT COUNTS AS A STORE FILE, DEFINED RATHER THAN ASSUMED. A healthy store
// directory holds a hashed .sqlite, metadata.sqlite, and a -shm and a -wal
// sidecar for each, so a naive file count returns six and a naive .sqlite count
// returns two. Neither is the thing R38 guards against, which is a SECOND
// DATABASE nobody knows is bound: CLAUDE.md section 10's double-store filing.
// So a store file is a .sqlite that is not miniflare's own metadata.sqlite, and
// the -shm and -wal sidecars are IGNORED. They belong to a store rather than
// being one, and their presence depends on whether a connection is open, which
// would make this check a function of TIMING rather than of content. Section
// 6.10's own wording is the precedent: it speaks of more than one .sqlite
// sitting under miniflare-D1DatabaseObject/.
const STORE_DIR_SEGMENTS = ['v3', 'd1', 'miniflare-D1DatabaseObject'];
const MINIFLARE_METADATA = 'metadata.sqlite';

function storeFilesIn(dir) {
  let entries;
  try {
    entries = readdirSync(join(dir, ...STORE_DIR_SEGMENTS));
  } catch {
    return [];
  }
  return entries.filter((n) => n.endsWith('.sqlite') && n !== MINIFLARE_METADATA);
}

function dirSizeBytes(dir) {
  let total = 0;
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else total += st.size;
    }
  };
  try {
    walk(dir);
  } catch {
    return null;
  }
  return total;
}

if (venue === 'local') {
  const stores = storeFilesIn(persistDir);
  console.log(`[bmf-load] store files     : ${stores.length === 0 ? '(none)' : stores.join(', ')}`);
  if (stores.length > 1) {
    fail(
      `${persistDir} holds ${stores.length} store files besides ${MINIFLARE_METADATA} ` +
        `(${stores.join(', ')}). R38 allows one. A second store is the hazard CLAUDE.md ` +
        'section 10 files: a database nobody knows is bound, whose emptiness reads ' +
        'exactly like a load that has not run yet.'
    );
  }
}

// ------------------------------------------------------- SHARED WRANGLER SEAM
// These two are defined ABOVE element B because B is the first element to spawn
// wrangler. They were introduced with element A and MOVED here when B took
// position 6; nothing about them changed.

// R38: the full wrangler command is PRINTED on every run, before it is spawned.
// The opts argument arrived with element C, which raises maxBuffer: the 1 MiB
// default is a property of spawnSync rather than of wrangler, and a truncated
// capture would make a successful run unreadable rather than failing it.
function wrangler(args, opts = {}) {
  const argv = ['node_modules/wrangler/wrangler-dist/cli.js', ...args];
  console.log(`[bmf-load] wrangler command: node ${argv.join(' ')}`);
  return spawnSync(process.execPath, argv, {
    cwd: ROOT,
    encoding: 'utf8',
    ...opts
  });
}

// R37: the config comes from the TARGETS map and never from the caller, so a run
// cannot pair one database's name with the other's config.
function targetArgs() {
  const args = ['d1', 'execute', dbName];
  if (target.config !== null) args.push('--config', target.config);
  args.push(venue === 'remote' ? '--remote' : '--local');
  if (venue === 'local') args.push('--persist-to', persistDir);
  return args;
}

function execArgsFor(command, json) {
  const args = targetArgs();
  if (json) args.push('--json');
  args.push('--command', command);
  return args;
}

// Element C: the same binding, carrying a FILE rather than a command. It takes
// no --json, because the artifact is 5,805 statements and the JSON form of that
// result set is not a thing this loader reads. C's proof is a read-back count.
function execFileArgsFor(filePath) {
  const args = targetArgs();
  args.push('--file', filePath);
  return args;
}

// ------------------------------------------------------------------ ELEMENT B
// R32 element B: THE PRE-FLIGHT. It runs BEFORE element A, by FT's ruling of
// 2026-09-16, on the ground the definition of done already records verbatim for
// D and E: CREATING THE ASIDE IS ALREADY AN ATTEMPT. R20b names second zero as
// the pre-flight's whole value, and element A spawns wrangler against the
// target, so a check placed after it is a check that cannot fail for the reason
// it exists - a stale token would have taken the aside's CREATE TABLE first.
//
// TWO BRANCHES, AND THE WORD "CREDENTIAL" BELONGS TO ONLY ONE OF THEM. A remote
// run has a credential to exercise, and R20 rules a cheap authenticated read. A
// LOCAL run has none: the store is a directory on this disk and no token is
// presented to anything. Reporting "credential ok" there would be a claim the
// run cannot support, which is the class of quiet falsehood this arc exists to
// remove, so the local branch reports REACHABILITY and says so in those words.
//
// R20a: IT REPORTS AND STOPS, and never re-authenticates. CLAUDE.md section 10
// records that a precautionary re-login was unnecessary and should not become a
// habit. The pre-flight reports; it does not fix.
//
// R20b, RESTATED HERE SO IT IS NOT OVERSOLD: this cannot prevent a token
// expiring DURING element C's multi-minute call. Section 4's "credential
// staleness mid-load is UNADDRESSED, recorded not solved" stands for the
// mid-call case. What this buys is the ALREADY-STALE case, at second zero.
//
// THE READ IS CHEAP AND ITS RESULT IS INSPECTED, not merely its exit code. A
// command that exits 0 while returning nothing parseable has not exercised the
// round trip, and an exit code alone would make this a check on the process
// rather than on the database.
const PREFLIGHT_SQL = 'SELECT 1 AS preflight;';
const preflight = wrangler(execArgsFor(PREFLIGHT_SQL, true));
const preflightKind = venue === 'remote' ? 'credential' : 'reachability';
if (preflight.status !== 0) {
  console.error(preflight.stdout || '');
  console.error(preflight.stderr || '');
  fail(
    `the pre-flight ${preflightKind} check FAILED (wrangler exit ${preflight.status}). ` +
      'R20a: this REPORTS AND STOPS. It does not re-authenticate and does not retry. ' +
      'Nothing was created, nothing was loaded and nothing was swapped: this ran ' +
      'before element A, so the run stops at second zero rather than mid-attempt.'
  );
}
let preflightRows = null;
try {
  preflightRows = JSON.parse(preflight.stdout)[0].results;
} catch {
  preflightRows = null;
}
if (preflightRows === null || preflightRows.length !== 1 || preflightRows[0].preflight !== 1) {
  fail(
    `the pre-flight ${preflightKind} check returned no usable result. wrangler exited 0, ` +
      'so the process ran, but the round trip produced nothing this loader can read. ' +
      'R20a: it REPORTS AND STOPS rather than retrying.'
  );
}
console.log(
  `[bmf-load] pre-flight      : ${venue === 'remote' ? 'credential ok' : 'local store reachable'}`
);

// ------------------------------------------------------------------ ELEMENT A
// R32 element A: CREATE THE ASIDE, from the constant, via asideStatements().
// Nothing downstream of this is built. B through M are absent, and so is any
// element that drops or prunes an aside, which is why a second run FAILS.
//
// THE ASSERTIONS ARE R16's AND THEY RUN HERE, not after a swap. R16b rules them
// PRE-SWAP and part of the gate: catching drift before the swap means the aside
// is discarded and live was never touched. R16c names them aside_schema_pk and
// aside_schema_notnull, and those names are used verbatim below so the
// load_check rows element G writes read the same as this output. G is unbuilt,
// so nothing is persisted; these run and REPORT, and a failure exits non-zero.
//
// R16's AMENDMENT IS LOAD-BEARING AND IS NOT SIMPLIFIED HERE: the notnull
// assertion covers FIVE columns INCLUDING ein, not the nationally-non-null four.
// A non-INTEGER PRIMARY KEY in SQLite does not imply NOT NULL, so ein's own NOT
// NULL would otherwise be asserted by nothing, which is the exact drift R16
// exists to catch.
const NOTNULL_COLUMNS = ['ein', 'name', 'city', 'state', 'ruling'];

const statements = asideStatements();
console.log(`[bmf-load] aside statements: ${statements.length}`);
for (const statement of statements) console.log(`[bmf-load]   ${statement}`);

const created = wrangler(execArgsFor(statements.join(' '), false));
if (created.status !== 0) {
  console.error(created.stdout || '');
  console.error(created.stderr || '');
  fail(
    `creating ${ASIDE_TABLE} failed (wrangler exit ${created.status}). Nothing was ` +
      'swapped and the live table is untouched. A PRE-EXISTING ASIDE is the likely ' +
      'cause and the refusal is deliberate: no element drops one yet, and CREATE ' +
      'TABLE IF NOT EXISTS would load into a table whose shape nobody re-verified.'
  );
}
console.log(`[bmf-load] ${ASIDE_TABLE} created.`);

// The assertions read the DATABASE back, never the constant. Comparing the
// constant to itself is the tautology shape R16 was converted away from.
function readBack(sql) {
  const out = wrangler(execArgsFor(sql, true));
  if (out.status !== 0) {
    console.error(out.stdout || '');
    console.error(out.stderr || '');
    fail(`reading back ${ASIDE_TABLE} failed (wrangler exit ${out.status}).`);
  }
  return JSON.parse(out.stdout)[0].results;
}

const tableInfo = readBack(`PRAGMA table_info(${ASIDE_TABLE});`);
const indexList = readBack(`PRAGMA index_list(${ASIDE_TABLE});`);
const problems = [];

// aside_schema_pk - the PRIMARY KEY is on ein, AND the PK's automatic index
// exists. Both halves, because either alone passes on a shape R16 rejects.
const pkColumns = tableInfo.filter((c) => c.pk > 0).map((c) => c.name);
if (pkColumns.length !== 1 || pkColumns[0] !== 'ein') {
  problems.push(`aside_schema_pk: PRIMARY KEY is on [${pkColumns.join(', ')}], expected [ein]`);
}
const autoIndex = indexList.filter((i) => i.origin === 'pk');
if (autoIndex.length !== 1) {
  problems.push(`aside_schema_pk: expected one index with origin pk, found ${autoIndex.length}`);
}

// aside_schema_notnull - five columns, ein included (R16's own amendment).
for (const name of NOTNULL_COLUMNS) {
  const column = tableInfo.find((c) => c.name === name);
  if (column === undefined) problems.push(`aside_schema_notnull: column ${name} is absent`);
  else if (column.notnull !== 1) {
    problems.push(`aside_schema_notnull: ${name} reports notnull=${column.notnull}`);
  }
}

// The aside's OWN index names, which are the constant's renamed by indexNameFor.
// R13b asserts the LIVE names AFTER the swap and element H owes that rename;
// this checks only that the aside carries what this file rendered.
const expectedIndexes = DDL.bmf.indexes.map((i) => indexNameFor(i, 'bmf', ASIDE_TABLE)).sort();
const actualIndexes = indexList.filter((i) => i.origin === 'c').map((i) => i.name).sort();
if (expectedIndexes.join(',') !== actualIndexes.join(',')) {
  problems.push(
    `aside index names: expected [${expectedIndexes.join(', ')}], found [${actualIndexes.join(', ')}]`
  );
}

const verdict = (prefix) => (problems.some((p) => p.startsWith(prefix)) ? 'FAIL' : 'pass');
console.log(`[bmf-load] aside_schema_pk      : ${verdict('aside_schema_pk')}`);
console.log(`[bmf-load] aside_schema_notnull : ${verdict('aside_schema_notnull')}`);
console.log(`[bmf-load] aside index names    : ${verdict('aside index')}`);

// R38: the directory's size at exit, on every path out of a local run. The label
// argument arrived with element C: the run now prints a size after A and again
// after the load, and two identical labels carrying different numbers would
// read as a contradiction rather than as a before and an after.
function reportSize(when) {
  if (venue !== 'local') return;
  const bytes = dirSizeBytes(persistDir);
  const shown = bytes === null ? '(unreadable)' : bytes + ' bytes';
  console.log(`[bmf-load] store dir size  : ${shown} (${when})`);
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`[bmf-load] ${problem}`);
  reportSize('after element A');
  fail(
    'the aside does not match the constant it was built from. R16b: this runs ' +
      'PRE-SWAP, so the aside is discarded and live was never touched.'
  );
}

reportSize('after element A');

// ------------------------------------------------------------------ ELEMENT C
// R32 element C: LOAD THE EMITTED FILE. Its done criterion is ONE thing, as FT
// NARROWED it on 2026-09-16: the aside row count equals the parsed count in
// slice 1's sidecar. Section 5's THREE TIERS ARE NOT RUN HERE. They moved to
// element F in that same ruling, on the ground that a load element which also
// grades itself reports a failure as "the load failed" whether the load or the
// grading is what went wrong. Nothing below may be read as grading the data.
//
// THE CAUTION FT CARRIED WITH THE NARROWING IS REPEATED AT THE SITE IT BINDS:
// this moved a proof from a built element to an UNBUILT one. Element F is not
// built and nothing schedules it. If F is ever descoped, the three tiers go
// with it and NOTHING RUNS THEM - not as a visible gap, but as a silence,
// because this element will pass on its row count and report success.
//
// ONE INVOCATION, AND THAT IS SECTION 1's BINDING CONSTRAINT RATHER THAN A
// PREFERENCE. One `d1 execute --file` is one `splitSqlQuery` and one
// `db.batch()`, which is one implicit transaction: it applies whole or rolls
// back whole. Splitting the artifact across invocations is FAILURE MODE 19,
// and the mode table records the loader CANNOT DETECT it - the split is
// invisible in the SQL itself, which is why that row reads "NO, which is why
// post-swap verification beats the return code". So the single spawn below is
// the safety property, and a later reader who chunks it for any reason
// reintroduces a window nothing in this file would report.
//
// WHAT A ROLLED-BACK C LEAVES: THE ASIDE PRESENT AND EMPTY, NOT ABSENT.
// Section 1's 2026-09-16 amendment is explicit about this, because element A
// created the aside in its OWN invocation. Recovery is a full rerun, and a
// rerun meets an existing empty aside that element A REFUSES to re-create.
// That refusal is ON the recovery path rather than off it, and this element
// does not soften it.
//
// THE ARTIFACT AND THE EXPECTED COUNT ARE BOTH TAKEN FROM THE RECORD, NEVER
// FROM THE CALLER. The two paths are constants, matching
// bmf-verify-slice1.mjs:92-93 verbatim, and the expected count is read from the
// sidecar. An argument for either would let a caller pair one sidecar with
// another artifact, or supply the very number the check compares against, which
// is the tautology shape R16 was converted away from. The sidecar names its own
// `sqlPath`, and that is asserted to resolve to the constant, so a sidecar
// describing a different artifact is REFUSED rather than ignored.
const SIDECAR_PATH = join(ROOT, 'scripts', 'bmf-aside.tmp.json');
const SQL_PATH = join(ROOT, 'scripts', 'bmf-aside.tmp.sql');

if (!existsSync(SIDECAR_PATH)) {
  fail(`slice 1's sidecar is absent at ${SIDECAR_PATH}. Run scripts/bmf-parse.mjs first.`);
}
let sidecar = null;
try {
  sidecar = JSON.parse(readFileSync(SIDECAR_PATH, 'utf8'));
} catch (err) {
  fail(`slice 1's sidecar at ${SIDECAR_PATH} is not readable JSON: ${err.message}`);
}
if (sidecar.targetTable !== ASIDE_TABLE) {
  fail(
    `the sidecar names target table ${JSON.stringify(sidecar.targetTable)} and this run ` +
      `created ${ASIDE_TABLE}. The emitted file would not load unmodified.`
  );
}
if (resolve(ROOT, sidecar.sqlPath) !== SQL_PATH) {
  fail(
    `the sidecar names ${sidecar.sqlPath}, which resolves elsewhere than ${SQL_PATH}. ` +
      `A sidecar and the artifact it describes are one pair or they are nothing.`
  );
}
if (!existsSync(SQL_PATH)) {
  fail(`the emitted artifact is absent at ${SQL_PATH}. Run scripts/bmf-parse.mjs first.`);
}

// artifact_bytes_match_sidecar. An EQUALITY against the recorded byte count,
// which is the shape R26 already uses on the fetch side rather than a floor. A
// regenerated or truncated artifact paired with a stale sidecar would otherwise
// be loaded and then compared against the wrong number, and the comparison's
// verdict would be about two unrelated files.
const artifactBytes = statSync(SQL_PATH).size;
if (artifactBytes !== sidecar.sqlBytes) {
  fail(
    `artifact_bytes_match_sidecar: ${SQL_PATH} is ${artifactBytes} bytes and the sidecar ` +
      `records ${sidecar.sqlBytes}. Nothing was loaded.`
  );
}
console.log(`[bmf-load] artifact        : ${SQL_PATH}`);
console.log(`[bmf-load] artifact bytes  : ${artifactBytes} (sidecar ${sidecar.sqlBytes})`);
console.log(`[bmf-load] statements      : ${sidecar.statements}`);
console.log(`[bmf-load] parsed rows     : ${sidecar.rows}`);

// THE PRE-LOAD COUNT, AND IT CANNOT FIRE TODAY. Stated as a check that cannot
// fail rather than presented as coverage, which is CLAUDE.md section 10's
// standing discipline turned on this file's own instruments. Nothing here
// truncates or drops an aside, and element A REFUSES a pre-existing table, so
// by the time control reaches this line the aside was created seconds ago and
// is necessarily empty. It exists for the day an element ahead of C is made to
// tolerate an existing aside: the emitted file is plain INSERTs, so a load into
// a populated table either collides on the EIN primary key or inflates the
// count past the sidecar, and the second outcome is the quiet one.
const rowsBefore = Number(readBack(`SELECT COUNT(*) AS n FROM ${ASIDE_TABLE};`)[0].n);
if (rowsBefore !== 0) {
  fail(
    `${ASIDE_TABLE} already holds ${rowsBefore} rows. Nothing in this loader truncates ` +
      `it, and the emitted file is plain INSERTs, so a load here would collide on the ` +
      `EIN primary key or inflate the count past the sidecar. Recovery is a full rerun ` +
      `from a dropped aside (section 1), never a second load into this one.`
  );
}
console.log(`[bmf-load] aside before    : ${rowsBefore} rows`);

// THE SINGLE INVOCATION.
const loadStartedMs = Date.now();
const loaded = wrangler(execFileArgsFor(SQL_PATH), { maxBuffer: 64 * 1024 * 1024 });
const loadSeconds = ((Date.now() - loadStartedMs) / 1000).toFixed(1);
console.log(`[bmf-load] load wall clock : ${loadSeconds} s`);

// WHAT WRANGLER SAID IS REPORTED BY SIZE AND NOT SUMMARIZED, and that is a
// MEASURED choice rather than a cautious one. A tail print was written here
// first, on the assumption that the summary line sits at the end. It does not:
// on the local venue `d1 execute --file` prints a JSON meta dump, and the last
// four lines of a 5,805-statement run are two closing braces and a bracket. The
// print read as though the loader had nothing to say.
//
// IT IS NOT PARSED EITHER WAY. R11 is why: the client prints its rollback
// guarantee BEFORE the import runs, so wrangler output is never where a verdict
// comes from. The verdict below is a read-back against the database.
const outBytes = Buffer.byteLength(String(loaded.stdout || ''), 'utf8');
const errBytes = Buffer.byteLength(String(loaded.stderr || ''), 'utf8');
console.log(
  `[bmf-load] wrangler output : ${outBytes} bytes stdout, ${errBytes} bytes stderr ` +
    `(printed by size; not parsed, and not a verdict)`
);

if (loaded.status !== 0) {
  console.error(loaded.stdout || '');
  console.error(loaded.stderr || '');
  reportSize('at exit');
  fail(
    `loading ${SQL_PATH} failed (wrangler exit ${loaded.status}). One d1 execute --file ` +
      `is one db.batch(), so NOTHING PARTIAL SURVIVES: the aside is PRESENT AND EMPTY ` +
      `rather than absent (section 1, amended 2026-09-16). Nothing was swapped and the ` +
      `live bmf table was neither read nor written. Recovery is a full rerun.`
  );
}

// aside_rows_equal_parsed. The ONE thing element C proves, and it is read from
// the DATABASE rather than from the return code, which is mode 19 and mode 11
// reasoning applied at the only point where it can still be applied cheaply.
// R16c names a check for what it checks, and this one is named for its two
// operands: the aside's rows, and the sidecar's parsed count.
const rowsAfter = Number(readBack(`SELECT COUNT(*) AS n FROM ${ASIDE_TABLE};`)[0].n);
const rowsMatch = rowsAfter === sidecar.rows;
console.log(`[bmf-load] aside after     : ${rowsAfter} rows (sidecar ${sidecar.rows})`);
console.log(`[bmf-load] aside_rows_equal_parsed : ${rowsMatch ? 'pass' : 'FAIL'}`);
reportSize('at exit');
if (!rowsMatch) {
  fail(
    `aside_rows_equal_parsed: ${ASIDE_TABLE} holds ${rowsAfter} rows and the sidecar ` +
      `records ${sidecar.rows} parsed. This is the ONE done criterion element C carries ` +
      `after the 2026-09-16 narrowing. It runs PRE-SWAP, so the aside is discarded and ` +
      `the live bmf table was never touched.`
  );
}

// EVERY ELEMENT AFTER C IS UNBUILT - D through M. The aside now EXISTS and is
// LOADED, and its row count has been read back and matched against slice 1s
// parsed count. Nothing swapped it, and no load_stamp row was opened, because
// element E is not built.
//
// THE ORDER MATTERS AND IS NOT YET RIGHT, recorded so it is not lost: item 6's
// own text puts element 5 (E) BEFORE A, so that an aside creation which fails
// leaves a stamp row with load_started_at set and completed_at NULL - an attempt
// that failed, rather than no row at all, which is byte-identical to a load that
// never began. Today A runs with no stamp behind it, so a failure here IS that
// void. The element that opens the stamp must land before this file is used for
// anything but exercising A.
//
// EXITING NON-ZERO IS DELIBERATE, AND 2 RATHER THAN 1 IS ALSO DELIBERATE. A zero
// would report a load that did not happen, which is the class of quiet falsehood
// this arc exists to remove. 1 is reserved for fail(), so a run refused by
// validation stays distinguishable from a run that validated, did element A, and
// then stopped because nothing downstream exists yet.
console.error('[bmf-load] STOP: elements B, A and C only. The pre-flight ran, the aside');
console.error('[bmf-load] was created with R16 asserted against it, and the emitted file');
console.error('[bmf-load] was loaded into it in ONE invocation.');
console.error('[bmf-load] No generation was minted, no stamp was opened, no pre-swap check');
console.error('[bmf-load] beyond C ran, nothing was swapped, and the live bmf table was');
console.error('[bmf-load] neither read nor written.');
process.exit(2);
