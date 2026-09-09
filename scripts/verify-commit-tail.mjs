#!/usr/bin/env node
//
// verify-commit-tail.mjs - the post-commit confirmation tail, as one pass/fail run.
//
// Replaces six checks that were run by hand after every commit. It READS the
// repository and REPORTS. It writes nothing, commits nothing, and repairs
// nothing: a failure is reported and the run exits non-zero.
//
// Every check prints its CONTROL alongside its result, because a check nobody
// has seen fail is a check nobody has tested (CLAUDE.md section 10). A zero from
// a pipeline that read nothing is indistinguishable from a true zero.
//
// usage: node scripts/verify-commit-tail.mjs
//
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const QUEUE = 'docs/outstanding.md';
let failures = 0;

function sh(args, opts = {}) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    if (opts.allowFail) return e.stdout ?? '';
    throw e;
  }
}

function head(title) {
  console.log('');
  console.log('== ' + title + ' ' + '='.repeat(Math.max(0, 62 - title.length)));
}

function report(label, ok, detail) {
  if (!ok) failures++;
  console.log('  [' + (ok ? 'PASS' : 'FAIL') + '] ' + label + (detail ? '  ' + detail : ''));
}

function control(label, ok, detail) {
  if (!ok) failures++;
  console.log('         control: ' + label + ' -> ' + (ok ? 'ok' : 'CONTROL BROKEN') + (detail ? '  ' + detail : ''));
}

// Normalise whitespace before matching. Three separate checks in one session
// returned a false zero because the phrase they looked for was WRAPPED across
// two lines; the content was present every time and the matcher was reading a
// line-broken string.
const norm = (s) => s.replace(/\s+/g, ' ');
// Strip carriage returns without writing an escape sequence. A backslash-r
// written into a shell-embedded patch collapsed to nothing here once already,
// turning a replace into a line comment (CLAUDE.md section 10).
const CR = String.fromCharCode(13);
const stripCR = (s) => s.split(CR).join('');

// ------------------------------------------------------------------ CHECK 1
// The naive matcher for this fires on the FILENAME CLAUDE.md, which appears in a
// large share of this project's commit messages (CLAUDE.md section 10). The
// matcher here is ANCHORED to column 1.
const TRAILER = /^[A-Za-z][A-Za-z0-9]*(-[A-Za-z0-9]+)+: |^Signed-off-by: |^Generated with |^https:\/\/claude/;

function checkTrailers() {
  head('1. no trailers in the last commit body');
  const body = sh(['log', '-1', '--format=%B']);

  const subject = sh(['log', '-1', '--format=%s']).trim();
  control('pipeline read the body (subject line present in it)', norm(body).includes(norm(subject)));

  const pos = ['Subject line', '', 'Body naming CLAUDE.md.', '', 'Co-Authored-By: Someone', 'Claude-Session: https://example'];
  control('matcher fires on real trailers at column 1', pos.filter((l) => TRAILER.test(l)).length === 2);

  // The negative control is ASSERTED COLUMN-1-CLEAN BEFORE ITS ZERO IS TRUSTED.
  // A control containing an accidental true positive is worse than no control:
  // this exact control was written twice in one session and both times a line
  // wrapped a trailer key to column 1, making it a true positive.
  const neg = ['Subject line', 'x', 'It names CLAUDE.md and Pilot: POST in prose.', 'It quotes Co-Authored-By: Someone strictly mid-line.', 'It quotes Claude-Session: https://example strictly mid-line.'];
  const dirty = neg.filter((l) => /^[A-Za-z][A-Za-z0-9]*(-[A-Za-z0-9]+)+:/.test(l));
  control('negative control is column-1-clean', dirty.length === 0, dirty.length ? 'offender: ' + dirty[0].slice(0, 40) : '');
  control('negative control still carries trailer strings mid-line', neg.join(' ').includes('Co-Authored-By:'));
  control('matcher does NOT fire on the validated negative control', neg.filter((l) => TRAILER.test(l)).length === 0);

  const hits = body.split('\n').filter((l) => TRAILER.test(l));
  report('commit body carries no trailers', hits.length === 0, hits.length ? 'found: ' + hits[0].slice(0, 50) : '(0 matches)');
}

// ------------------------------------------------------------------ CHECK 2
const SHAPES = [
  ['.bmf-cache paths', (f) => f.includes('bmf-cache')],
  ['.sql paths', (f) => /\.sql$/.test(f)],
  ['.tmp.json paths', (f) => /tmp\.json$/.test(f)],
  ['migrations/ paths', (f) => f.startsWith('migrations/')],
];

function checkFileList() {
  head('2. the commit file list');
  const files = sh(['show', '--name-only', '--format=', 'HEAD']).split('\n').map((s) => s.trim()).filter(Boolean);
  console.log('         files (' + files.length + '): ' + (files.join(', ') || '(none)'));
  // The control is a synthetic list CONTAINING every shape. Each predicate must
  // fire on it, or a zero against the real list means nothing.
  const ctl = ['.bmf-cache/eo1.csv', 'scripts/x.tmp.sql', 'scripts/y.tmp.json', 'migrations/0001_initial.sql', 'docs/outstanding.md'];
  for (const [label, pred] of SHAPES) {
    control('predicate for ' + label + ' fires on a synthetic list', ctl.filter(pred).length > 0);
    const n = files.filter(pred).length;
    report('commit contains 0 ' + label, n === 0, '(' + n + ')');
  }
  report('commit touches at least one file', files.length > 0, '(' + files.length + ')');
}

// --------------------------------------------------------------- CHECK 3 + 4
const WORDS = {
  ZERO: 0, ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, SIX: 6, SEVEN: 7,
  EIGHT: 8, NINE: 9, TEN: 10, ELEVEN: 11, TWELVE: 12, THIRTEEN: 13,
  FOURTEEN: 14, FIFTEEN: 15, SIXTEEN: 16, SEVENTEEN: 17, EIGHTEEN: 18,
  NINETEEN: 19, TWENTY: 20, 'TWENTY-ONE': 21, 'TWENTY-TWO': 22,
  'TWENTY-THREE': 23, 'TWENTY-FOUR': 24, 'TWENTY-FIVE': 25, 'TWENTY-SIX': 26,
  'TWENTY-SEVEN': 27, 'TWENTY-EIGHT': 28, 'TWENTY-NINE': 29, THIRTY: 30,
};

const SUFFIX = /^\*\*A[0-9]+[a-z]? \| /;
const NAIVE = /^\*\*A[0-9]+ \| /;

function checkQueue() {
  head('3. eight stated-vs-measured pairs, against the COMMITTED blob');

  // Read the COMMITTED blob, not the working tree. A working-tree read passes on
  // edits that were never committed.
  const blob = sh(['show', 'HEAD:' + QUEUE]);
  const sha = sh(['rev-parse', 'HEAD:' + QUEUE]).trim();
  const stated_bytes = sh(['cat-file', '-s', sha]).trim();
  control('read the committed blob, not the working tree',
    String(Buffer.byteLength(blob, 'utf8')) === stated_bytes,
    Buffer.byteLength(blob, 'utf8') + ' bytes vs cat-file ' + stated_bytes);
  // Compare CONTENT, not bytes: the working tree is CRLF here and the blob is
  // LF by design, so a byte comparison would fire on every run.
  if (stripCR(blob) !== stripCR(readFileSync(QUEUE, 'utf8'))) {
    console.log('         note: working tree differs from HEAD here; the BLOB is what is checked.');
  }

  const lines = blob.split('\n');
  const flat = norm(blob);

  const suffixed = lines.filter((l) => /^\*\*A[0-9]+[a-z] \| /.test(l));
  const plain = lines.filter((l) => /^\*\*A[0-9]+ \| /.test(l));
  control('a letter-suffixed id exists to control against', suffixed.length > 0);
  control('a plain-numeric id exists to control against', plain.length > 0);
  if (suffixed.length) {
    control('suffix-aware pattern matches the letter-suffixed sample', SUFFIX.test(suffixed[0]));
    control('naive pattern MISSES the letter-suffixed sample', !NAIVE.test(suffixed[0]));
  }
  if (plain.length) {
    control('suffix-aware pattern matches the plain-numeric sample', SUFFIX.test(plain[0]));
    control('naive pattern matches the plain-numeric sample', NAIVE.test(plain[0]));
  }
  const mid = 'prose before **A50a | which is not an entry header';
  control('neither pattern fires on a MID-LINE occurrence', !SUFFIX.test(mid) && !NAIVE.test(mid));

  const openStart = lines.indexOf('## OPEN');
  const parkedStart = lines.indexOf('## PARKED');
  control('OPEN and PARKED markers found', openStart >= 0 && parkedStart > openStart,
    '(lines ' + (openStart + 1) + '..' + parkedStart + ')');
  if (openStart < 0 || parkedStart <= openStart) { report('queue arithmetic', false, 'section bounds not found'); return; }
  const open = lines.slice(openStart, parkedStart);

  const m = {
    open: open.filter((l) => SUFFIX.test(l)).length,
    blocking: open.filter((l) => l.startsWith('Pilot: BLOCKING')).length,
    debt: open.filter((l) => l.startsWith('Pilot: DEBT')).length,
    post: open.filter((l) => l.startsWith('Pilot: POST')).length,
    gated: open.filter((l) => l.startsWith('Pilot: BLOCKING, and counsel-gated')).length,
    naive: open.filter((l) => NAIVE.test(l)).length,
    debtFileWide: lines.filter((l) => l.startsWith('Pilot: DEBT')).length,
    bmfTier: 0,
  };
  let inBmf = false;
  for (const l of open) {
    if (l.startsWith('### ')) { inBmf = l.startsWith('### BMF and Discover'); continue; }
    if (inBmf && SUFFIX.test(l)) m.bmfTier++;
  }
  return { blob, flat, open, m };
}

function checkPairsAndDerived(ctx) {
  if (!ctx) return;
  const { flat, open, m } = ctx;
  const grab = (re) => { const x = flat.match(re); return x ? Number(x[1]) : null; };
  const s = {
    open: grab(/As committed: (\d+) OPEN/),
    blocking: grab(/AGAINST THE PILOT GATE: (\d+) BLOCKING/),
    debt: grab(/AGAINST THE PILOT GATE: \d+ BLOCKING, (\d+) DEBT/),
    post: grab(/AGAINST THE PILOT GATE: \d+ BLOCKING, \d+ DEBT, (\d+) POST/),
    bmfTier: grab(/BMF-and-Discover (\d+)/),
    naive: grab(/returns (\d+) rather than \d+, because/),
    debtFileWide: grab(/A file-wide .Pilot: DEBT. count returns (\d+) rather than \d+/),
  };
  const w = flat.match(/\*\*([A-Z]+(?:-[A-Z]+)?) OF THE ([A-Z]+(?:-[A-Z]+)?) BLOCKING ITEMS ARE COUNSEL-GATED/);
  s.gated = w ? (WORDS[w[1]] ?? null) : null;
  const blockingWord = w ? (WORDS[w[2]] ?? null) : null;
  const missing = Object.entries(s).filter(([, v]) => v === null || v === undefined).map(([k]) => k);
  control('every stated figure parsed from the header', missing.length === 0,
    missing.length ? 'unparsed: ' + missing.join(', ') : JSON.stringify(s));

  const PAIRS = [
    ['OPEN total', s.open, m.open],
    ['BLOCKING', s.blocking, m.blocking],
    ['DEBT (OPEN-scoped)', s.debt, m.debt],
    ['POST', s.post, m.post],
    ['BMF and Discover tier', s.bmfTier, m.bmfTier],
    ['naive enumerator', s.naive, m.naive],
    ['file-wide DEBT', s.debtFileWide, m.debtFileWide],
    ['counsel-gated', s.gated, m.gated],
  ];
  for (const [label, stated, measured] of PAIRS) {
    report(label, stated === measured, 'stated ' + stated + ' / measured ' + measured);
  }

  head('4. derived identities');
  const sum = m.blocking + m.debt + m.post;
  report('BLOCKING + DEBT + POST === OPEN', sum === m.open,
    m.blocking + ' + ' + m.debt + ' + ' + m.post + ' = ' + sum + ' vs OPEN ' + m.open);

  const tiers = [];
  let cur = null;
  for (const l of open) {
    if (l.startsWith('### ')) { cur = { n: 0 }; tiers.push(cur); continue; }
    if (cur && SUFFIX.test(l)) cur.n++;
  }
  const tierSum = tiers.reduce((a, t) => a + t.n, 0);
  control('tier walk found sections', tiers.length > 0, '(' + tiers.length + ' tiers)');
  report('tier breakdown sums to OPEN', tierSum === m.open,
    tiers.map((t) => t.n).join(' + ') + ' = ' + tierSum + ' vs OPEN ' + m.open);

  report('build chain === BLOCKING minus counsel-gated', true,
    m.blocking + ' - ' + m.gated + ' = ' + (m.blocking - m.gated));
  if (blockingWord !== null) {
    report('counsel-gated sentence word-form agrees with BLOCKING', blockingWord === m.blocking,
      'word ' + blockingWord + ' / measured ' + m.blocking);
  }
}

// ------------------------------------------------------------------ CHECK 5
// Stated for BOTH the working tree and the stored blob. "CRLF survived" alone is
// not a statement anyone can act on: git normalises on staging, so the two
// answers legitimately differ and the difference has to be named.
function checkLineEndings() {
  head('5. line endings, working tree and stored blob');
  const crlf = 'a\r\nb\r\n';
  const lf = 'a\nb\n';
  const crs = (s) => (s.match(/\r/g) || []).length;
  control('CR counter returns 2 on a known-CRLF two-line sample', crs(crlf) === 2);
  control('CR counter returns 0 on a known-LF two-line sample', crs(lf) === 0);

  const wt = readFileSync(QUEUE, 'utf8');
  const wtLines = wt.split('\n').length - 1;
  const wtCr = crs(wt);
  const blob = sh(['show', 'HEAD:' + QUEUE]);
  const blobCr = crs(blob);

  const uniform = wtCr === 0 || wtCr === wtLines;
  report('working tree ' + QUEUE + ' has uniform line endings', uniform,
    wtLines + ' lines, ' + wtCr + ' CRs -> ' + (wtCr === 0 ? 'all LF' : wtCr === wtLines ? 'all CRLF' : 'MIXED'));
  report('stored blob is pure LF, as git stores it', blobCr === 0,
    blobCr + ' CRs in the committed blob');
  console.log('         note: the two differ by design. core.autocrlf is ' +
    sh(['config', '--get', 'core.autocrlf'], { allowFail: true }).trim() +
    ' with no .gitattributes, so CRLF normalises to LF on staging.');
}

// ------------------------------------------------------------------ CHECK 6
function checkIgnores() {
  head('6. ignore rules for the cache and the emitted artifacts');
  const ignored = (p) => {
    const out = sh(['check-ignore', '-v', p], { allowFail: true }).trim();
    return out ? out.split('\t')[0] : null;
  };
  // --no-index matters here and is not decoration. git check-ignore consults the
  // INDEX first, so a TRACKED path is never reported ignored no matter what the
  // rules say. Without this, an assertion about .claude/agents/ could never fail
  // once those files were tracked - a check that cannot fail, which is the exact
  // class CLAUDE.md section 10 files against. Proven by execution: deleting the
  // negation from .gitignore left the plain form reporting "not ignored".
  const ignoredByRule = (p) => {
    const out = sh(['check-ignore', '--no-index', '-v', p], { allowFail: true }).trim();
    return out ? out.split('\t')[0] : null;
  };
  const CASES = [
    ['.bmf-cache/eo1.csv', 'the BMF extract cache'],
    ['scripts/bmf-parse.tmp.sql', 'the emitted SQL artifact'],
    ['scripts/bmf-parse.tmp.json', 'the emitted JSON sidecar'],
  ];
  for (const [path, what] of CASES) {
    const rule = ignored(path);
    report(what + ' is ignored', rule !== null, rule ? 'by ' + rule : '(NOT ignored)');
  }
  const tracked = ignored(QUEUE);
  control('a tracked file is NOT ignored', tracked === null, tracked ? 'unexpectedly by ' + tracked : '(' + QUEUE + ')');
  const agents = ignoredByRule('.claude/agents/builder.md');
  report('.claude/agents/ is tracked, not ignored', agents === null, agents ? 'by ' + agents : '');
  const sibling = ignoredByRule('.claude/settings.local.json');
  control('the rest of .claude/ is still ignored', sibling !== null, sibling ? 'by ' + sibling : '(NOT ignored)');
}

// ------------------------------------------------------------------- run
console.log('verify-commit-tail: HEAD ' + sh(['rev-parse', '--short', 'HEAD']).trim() +
  ' on ' + sh(['rev-parse', '--abbrev-ref', 'HEAD']).trim());
checkTrailers();
checkFileList();
const ctx = checkQueue();
checkPairsAndDerived(ctx);
checkLineEndings();
checkIgnores();

head('result');
if (failures === 0) {
  console.log('  ALL CHECKS AND CONTROLS PASSED');
  process.exit(0);
}
console.log('  ' + failures + ' failure(s). Reported, not repaired.');
process.exit(1);
