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
// WHAT THIS FILE IMPLEMENTS TODAY: DEFINITION-OF-DONE ITEM 1 ONLY, the target
// map and the run banner (R36, R37, R38). It resolves and validates its
// arguments, prints the banner, and then REFUSES TO PROCEED. It creates no
// table, contacts no database, spawns no wrangler process, reads no file and
// executes no statement. Every element listed above is UNBUILT, and this file
// says so at exit rather than implying otherwise by succeeding.
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
// two-entry TARGETS map, and the spawnSync on `wrangler d1 execute` is owed by
// element C, which loads the emitted file, rather than by this item.
//
// WHAT ITEM 1 DELIBERATELY DOES NOT CARRY. R38 places three further obligations
// on the loader, and each needs a run that actually executes: the check that the
// directory holds no more than one store file besides miniflare's own metadata
// file, the print of the full wrangler command, and the print of the directory
// size at exit. All three belong with the element that spawns wrangler. R38's
// other two halves are here, because they are argument resolution and are
// checkable without executing anything: the directory is a required argument,
// and one inside the repository is refused.

import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
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

// EVERY ELEMENT BELOW THIS POINT IS UNBUILT. Definition-of-done items 2 and 3,
// the DDL constant and the R13a regeneration, are not in this file, and neither
// is any of R32's elements A through M.
//
// EXITING NON-ZERO IS DELIBERATE, AND 2 RATHER THAN 1 IS ALSO DELIBERATE. A zero
// would report a load that did not happen, which is the class of quiet falsehood
// this arc exists to remove. 1 is reserved for fail(), so that a run refused by
// validation stays distinguishable from a run that validated and then stopped
// because nothing downstream exists yet.
console.error('[bmf-load] STOP: item 1 only. The target map and the run banner are built.');
console.error('[bmf-load] Nothing below them is. No table was created, no database was');
console.error('[bmf-load] contacted, no wrangler process was spawned, and no statement ran.');
process.exit(2);
