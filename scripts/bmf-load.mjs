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
// WHAT THIS FILE IMPLEMENTS TODAY: DEFINITION-OF-DONE ITEMS 1 AND 2, AND R32
// ELEMENT A — the target map and the run banner (R36, R37, R38), the DDL
// constant (R13, R33), and the creation of the aside from that constant with
// R16's two pre-swap assertions. It resolves and validates its arguments, prints
// the banner, creates `bmf_aside`, asserts the shape it just built, and then
// REFUSES TO PROCEED. It loads no row, opens no `load_stamp` row, swaps nothing,
// and neither reads nor writes the live `bmf` table. Elements B through M are
// UNBUILT, and this file says so at exit rather than implying otherwise by
// succeeding.
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
import { readdirSync, statSync } from 'node:fs';
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

// R38: the full wrangler command is PRINTED on every run, before it is spawned.
function wrangler(args) {
  const argv = ['node_modules/wrangler/wrangler-dist/cli.js', ...args];
  console.log(`[bmf-load] wrangler command: node ${argv.join(' ')}`);
  return spawnSync(process.execPath, argv, { cwd: ROOT, encoding: 'utf8' });
}

// R37: the config comes from the TARGETS map and never from the caller, so a run
// cannot pair one database's name with the other's config.
function execArgsFor(command, json) {
  const args = ['d1', 'execute', dbName];
  if (target.config !== null) args.push('--config', target.config);
  args.push(venue === 'remote' ? '--remote' : '--local');
  if (venue === 'local') args.push('--persist-to', persistDir);
  if (json) args.push('--json');
  args.push('--command', command);
  return args;
}

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

// R38: the directory's size at exit, on every path out of a local run.
function reportSize() {
  if (venue !== 'local') return;
  const bytes = dirSizeBytes(persistDir);
  console.log(`[bmf-load] store dir size  : ${bytes === null ? '(unreadable)' : bytes + ' bytes'}`);
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`[bmf-load] ${problem}`);
  reportSize();
  fail(
    'the aside does not match the constant it was built from. R16b: this runs ' +
      'PRE-SWAP, so the aside is discarded and live was never touched.'
  );
}

reportSize();

// EVERY ELEMENT AFTER A IS UNBUILT - B through M, and definition-of-done item 4
// onward. The aside now EXISTS and is EMPTY. Nothing loaded it, nothing swapped
// it, and no load_stamp row was opened, because element E is not built.
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
console.error('[bmf-load] STOP: element A only. The aside is created and R16 asserted.');
console.error('[bmf-load] No row was loaded, no stamp was opened, nothing was swapped, and');
console.error('[bmf-load] the live bmf table was not read or written.');
process.exit(2);
