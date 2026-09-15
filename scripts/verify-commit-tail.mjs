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

// The tens, so a word form can be COMPOSED rather than listed. WORDS itself is
// left exactly as it was: it stops at THIRTY, and every entry it already had
// still resolves through it directly.
const TENS = {
  TWENTY: 20, THIRTY: 30, FORTY: 40, FIFTY: 50,
  SIXTY: 60, SEVENTY: 70, EIGHTY: 80, NINETY: 90,
};

// WHICH FORMS PARSE, WHAT THE CEILING IS, AND WHAT HAPPENS ABOVE IT.
//
// COVERED: a decimal numeral of any length, handled by the caller before this
// runs; and an English word form from ZERO to NINETY-NINE, case-insensitive,
// either a bare word in WORDS or TENS-HYPHEN-UNIT composed here.
//
// THE UPPER BOUND ON THE WORD FORM IS 99. "ONE HUNDRED" and anything above it
// return NULL, and so does any malformed hyphenation - FORTY-TEN, ONE-HUNDRED,
// a three-part word.
//
// WHY THE NULL MATTERS MORE THAN THE FAILURE IT CAUSES, said explicitly because
// it is the trap this function was written to close. A null does not merely fail
// its own pair. It puts that key into `missing`, which turns the control "every
// stated figure parsed from the region" to CONTROL BROKEN - the instrument
// declaring ITSELF faulty when what is actually wrong is a word the map cannot
// read. So a pair count above ninety-nine will not report "the doc says the
// wrong number". It will report that the verifier is broken, which is a worse
// message for a true fact. If PAIRS ever passes 99, extend this rather than the
// doc.
const wordToNumber = (raw) => {
  const w = raw.toUpperCase();
  if (WORDS[w] !== undefined) return WORDS[w];
  const parts = w.split('-');
  if (parts.length > 2) return null;
  const tens = TENS[parts[0]];
  if (tens === undefined) return null;
  if (parts.length === 1) return tens;
  const unit = WORDS[parts[1]];
  if (unit === undefined || unit < 1 || unit > 9) return null;
  return tens + unit;
};

const SUFFIX = /^\*\*A[0-9]+[a-z]? \| /;
const NAIVE = /^\*\*A[0-9]+ \| /;

// ---------------------------------------------------------- the figure region
// WHAT DEFINES THE BOUNDARY. The region runs from the file's H1 to the line
// BEFORE the pre-pilot-critical-path lead, and both ends are LITERAL MARKER TEXT
// rather than line numbers, so an insertion anywhere above cannot silently move
// the window. If either marker is absent the region control FAILS and check 3
// reports rather than measuring a wrong span.
//
// WHY THAT END MARKER AND NOT ANOTHER. There is no heading of any level between
// the H1 and '## OPEN', so every internal cut is a chosen line rather than a
// structural one. This one is the file's own signposted change of subject: above
// it the header accounts for the queue - how many are open, how they classify,
// which are counsel-gated - and below it the file turns to sequencing, opening
// "Read this first if the question is what comes next". The counsel-gated roster
// discussion that check 3 scrapes from ends immediately above it.
//
// THE ALTERNATIVE WAS WEIGHED AND NOT TAKEN, recorded so a later reader finds it
// considered rather than missed: ending at '## OPEN' is the only STRUCTURAL cut
// available and would make the guard maximal. It was refused because it drags
// ~150 further lines of pre-pilot narrative into an inventory that must name a
// reason for every numeral in it, and none of those lines can carry a queue
// total. If a stated total is ever written below the end marker, this region
// will not see it - that is the accepted cost, and it is stated rather than
// hidden.
const REGION_START = '# Outstanding';
const REGION_END = '**THE PRE-PILOT CRITICAL PATH, AS IT STANDS AFTER THE 2026-09-04 RULINGS. Read';
// The counsel-gated sentence check 3 has scraped since it was written. The
// region is required to contain it, because a region that excluded it would
// leave an existing pair reading a value from outside its own window.
const REGION_HOLDS = '**FOUR OF THE TWENTY-FOUR BLOCKING ITEMS ARE COUNSEL-GATED AND CANNOT BE CLOSED';

// A numeral occurrence is a maximal run of digits, or a comma-grouped run such
// as 341,097,144 taken whole. Dates, SHAs, section references and entry ids all
// decompose into several occurrences under this rule, which is deliberate: the
// guard's job is to leave nothing unaccounted for, and a narrower tokeniser
// would quietly excuse the very lines nobody thinks to classify.
const NUMERAL = /\d{1,3}(?:,\d{3})+|\d+/g;
const numeralsOf = (s) => [...s.matchAll(NUMERAL)].map((m) => m[0]);

// FROZEN - the dated-record inventory, keyed by EXACT LINE TEXT.
//
// Every numeral occurrence in the figure region is either claimed by an
// assertion below or sits on a line listed here. An entry here says: the
// numerals on this line record a past act, name a thing, or cite a place, and
// none of them is a live count of anything in this file.
//
// KEYED BY TEXT AND NOT BY LINE NUMBER, because a line number is invalidated by
// any insertion above it and would make this inventory rot silently. The cost of
// the text key is that REWORDING a listed line breaks its entry and the run
// FAILS. That is the intended behaviour: a reworded line is a line whose
// classification nobody has re-made.
const FROZEN = [
  ["What is open, in what order, and where the detail lives. Produced on 2026-09-01",
   "the date this file was produced; an event"],
  ["**Last swept: 2026-09-01.** Next sweep due 2026-10-01. That date is read at the",
   "the last-swept date and the due date derived from it; both events"],
  ["start of every agent session and, once 30 days have passed, it BLOCKS BUILD",
   "the sweep interval in days; a rule constant, not a count of anything here"],
  ["blocked. The rule, what a sweep is for, and why the interval is 30 days are in",
   "the sweep interval restated; a rule constant"],
  ["CLAUDE.md \u00a76, the 30-day sweep.",
   "a CLAUDE.md section reference, and the interval inside the rule name"],
  ["**REFRESH ON STATE CHANGE (ruled 2026-09-01, FJ-6).** This file is updated when",
   "the FJ-6 ruling date and the entry id it cites"],
  ["**STANDING STATE A FRESH SESSION NEEDS, recorded 2026-09-08. NOT AN ENTRY, and",
   "the date this standing-state note was recorded"],
  ["CLAUDE.md \u00a76.10 gives for keeping its branch (c) obligation out of this file.",
   "a CLAUDE.md section reference"],
  ["thing holding four commits.** Branch `qa-audit-enterprise` at `c74058a` and tag",
   "the qa-audit-enterprise tip SHA; a git fact, measured outside this file"],
  ["`pre-rebase-slice1` at `a130bf9`, **neither pushed**. The tag is the ONLY",
   "the pre-rebase tag name and its SHA; git facts"],
  ["reference from which the four PRE-REBASE slice-1 commits \u2014 `cb4bf24`, `140b0c9`,",
   "the slice-1 label and two of the four pre-rebase commit SHAs; git facts"],
  ["`a130bf9`, `bdb9918` \u2014 are reachable; they exist on this clone and nowhere else,",
   "two more pre-rebase commit SHAs; git facts"],
  ["and `git for-each-ref --contains a130bf9` returns exactly one ref. **Deleting",
   "the SHA inside a quoted git command; a git fact"],
  ["kept for its NAME rather than for retention: CLAUDE.md \u00a76, the slice protocol,",
   "a CLAUDE.md section reference"],
  ["rule 9 and its 2026-08-21 correction records that it is an ancestor of `main`",
   "the slice-protocol rule number and the date of its correction"],
  ["**THREE SLICE LABELS WERE DELETED 2026-09-11**, by name, each asserted 0 commits",
   "the date three slice labels were deleted, and the ahead-count asserted first"],
  ["ahead of `main` first: `slice-1-bmf-parser` at `aaf2c46`,",
   "a deleted label name and its tip SHA; git facts"],
  ["`slice-a18-ratebase-guard` at `0497cb6` and `slice-a20-workshops-copy` at",
   "two deleted label names and a tip SHA; git facts"],
  ["`11fad0b`. Every one of those tips is reachable from `main`, so the labels held",
   "a deleted label tip SHA; a git fact"],
  ["why \u00a76.20 requires staging by explicit path. `.bmf-cache/` holds the **2026-09-07",
   "a CLAUDE.md section reference and the extract date"],
  ["extract**, five CSVs totalling **341,097,144 bytes** plus `extract.json`, ignored",
   "the extract byte total; measured on disk on the extract date, not from this file"],
  ["artifact at **173,873,096 bytes in 5,805 statements**, and",
   "the emitted artifact byte and statement totals; measured on disk, not from this file"],
  ["**THREE SUBAGENT DEFINITIONS AND A VERIFICATION SCRIPT LANDED 2026-09-08.**",
   "the date the three agent definitions and the verifier landed"],
  ["enforces it. CLAUDE.md \u00a78 carries the same pointer for a reader who starts there.",
   "a CLAUDE.md section reference"],
  ["**THAT FIRST SENTENCE IS RETIRED 2026-09-09, quoted rather than deleted so the",
   "the date the preceding sentence was retired"],
  ["read-only pass on 2026-09-09 that left three files under",
   "the date of the adversary read-only pass"],
  ["`.gitignore:11`'s `.claude/*` rather than by any ignore rule naming it, so",
   "a .gitignore line-number citation"],
  ["CLAUDE.md \u00a76.20's stage-by-explicit-path rule is what keeps it out of a commit.",
   "a CLAUDE.md section reference"],
  ["\"Writes nothing\" and it writes; CLAUDE.md \u00a78 carries the correction.",
   "a CLAUDE.md section reference"],
  ["**Moving one without the other is not hypothetical. It is what `30b1eeb` did**,",
   "the SHA of the commit that moved one figure without the other"],
  ["118 against measured 120 on the naive enumerator, and stated 67 against measured",
   "what the verifier reported against 30b1eeb; a dated observation of a past run"],
  ["69 on the file-wide `Pilot: DEBT` count.",
   "the second half of that same dated observation"],
  ["The FJ-7 paragraph says the three gate totals \"sum to\" a number, and the verifier",
   "a reference to the FJ-7 entry by id"],
  ["enumerator paragraph; the three-totals sum in the FJ-7 paragraph; and the build",
   "a reference to the FJ-7 entry by id"],
  ["\u00a75.1's event-versus-state rule is what separates the two, and the test is whether",
   "a CLAUDE.md section reference"],
  ["check 3, and this note is where an editor meets the gap.",
   "the ordinal of the check this note asks a later slice to widen"],
  ["**ARITHMETIC OF THE LAST CHANGE, 2026-09-14 (twelfth): TWO ENTRIES OPENED AND",
   "the date of the twelfth change"],
  ["NONE CLOSED.** OPEN moves 120 to 122 and **DEBT 66 to 68**; BLOCKING stays 24",
   "the from-endpoints of two moves; the state each figure left, an event"],
  ["moves **32 to 34** and the breakdown reads 7 + 16 + 7 + 17 + 34 + 38 + 3 = 122.",
   "the from-endpoint of the tier move; the state that tier left, an event"],
  ["**THE FILE-WIDE `Pilot: DEBT` DIAGNOSTIC MOVES 67 TO 69**, two for two, because",
   "the from-endpoint of the file-wide move; an event"],
  ["naive enumerator moves with OPEN, **120 against 122**, the gap still exactly A50a",
   "the A50a entry id named in the gap clause"],
  ["and A50b, and the extra on the file-wide count is still FJ-7's own line inside",
   "the A50b entry id and a reference to FJ-7"],
  ["which this change dissolves: A143 is source work touching shipped behaviour and",
   "the A143 entry id"],
  ["A144 is an FT-run remote act, and neither was ever a docs correction. Filing them",
   "the A144 entry id"],
  ["recorded OPEN 121 to 120, DEBT 67 to 66, cheap-and-mechanical 33 to 32, and the",
   "the superseded eleventh change figures, quoted; a past state"],
  ["breakdown summing to 120.",
   "the superseded eleventh change breakdown sum, quoted; a past state"],
  ["CHANGES, 68 to 67, AND IT IS WORTH SAYING WHY.** The last four changes each left",
   "the eleventh change file-wide move, both endpoints; an event"],
  ["commits could reasonably start treating it as inert. **It moved now because A139",
   "the A139 entry id"],
  ["enumerator moves with OPEN, 118 against 120, the gap still exactly A50a and",
   "the eleventh change naive-enumerator pair and the A50a id; an event"],
  ["A50b, and the extra on the file-wide count is still FJ-7's own line inside the",
   "the A50b entry id and a reference to FJ-7, inside the eleventh change record"],
  ["one, since A142 is unchanged and remains counsel-blocked outside the roster.",
   "the A142 entry id"],
  ["IT.** A13 closed on a screening result, A75 on a false premise, A114 and A117 on",
   "four entry ids closed across the day record"],
  ["FT-run acts. **A139 closed because code shipped**, which is why DEBT moves and",
   "the A139 entry id"],
  ["this file states that it \"tracks the BLOCKING count and nothing else\". **A142 is",
   "the A142 entry id"],
  ["and A142 does not. **Twenty is the figure the definition yields; nineteen is the",
   "the A142 entry id"],
  ["**ONE ENTRY CLOSED: A139**, the send-log attribution gap, **because it was",
   "the A139 entry id"],
  ["A138, the entry that preceded it, per the convention A75 and A13 both used, and",
   "three entry ids naming the closure-note convention"],
  ["`slice-a139-type-column`, fast-forwarded to `main`: the join and the emit, five",
   "the A139 slice branch name"],
  ["docblocks, and the view's fifth column with the A119 filing. **Route (a) was",
   "the A119 entry id"],
  ["them as discharged with it: the **ops-exclusivity condition** is A92's and is",
   "the A92 entry id"],
  ["docblocked at the endpoint; the **label inconsistency** is A119's and was banked",
   "the A119 entry id"],
  ["with the build; and **A92 is open and governs the address**, which A139 never",
   "the A92 and A139 entry ids"],
  ["`docs/session-log.md`, whose 2026-09-14 (second) entry said this session",
   "the date of the session-log entry this change falsified"],
  ["with OPEN staying at 118 while BLOCKING fell 24 to 23 and DEBT rose 66 to 67,",
   "the superseded tenth change figures, quoted; a past state"],
  ["**CONTROLS USED FOR THIS CHANGE**, per CLAUDE.md \u00a710: **every figure this block",
   "a CLAUDE.md section reference"],
  ["passed and every figure came back identical. **Every citation written into A139",
   "the A139 entry id"],
  ["was re-resolved by printing its numbered line at `ffa27d2` before it was",
   "the SHA the citations were re-resolved at"],
  ["quoted** \u2014 `SignIn.jsx:100`, `App.jsx:29`, `auth.js:403`, `auth.js:449`,",
   "four source-file line citations"],
  ["`[[route]].js:138`, `0001_initial.sql:127` and the four `AppDispatcher`",
   "a source-file line citation and a migration number"],
  ["`CHECK (type` in `0001_initial.sql` against two CHECKs in 0016, zero",
   "two migration numbers"],
  ["returns 0 on exact match and 1 on `LOWER()`-normalized match, which is what",
   "what the case-normalization probe returned; a dated measurement"],
  ["against the store NAMED `e7ff1add\u2026` per \u00a710, two stores being present. Every",
   "the local D1 store name and a CLAUDE.md section reference"],
  ["**ONE \u00a710 HAZARD FIRED AND ITS OWN CONTROL CAUGHT IT**: a verification chain",
   "a CLAUDE.md section reference"],
  ["**RETAINED FROM THE SUPERSEDED BLOCK because it is still the record of how A135",
   "the A135 entry id"],
  ["and A136 were derived: the \"VISIBLE HONESTY\" absence was measured twice, once",
   "the A136 entry id"],
  ["literally at `e2d5a25` and once through the false-zero filing's part (1)",
   "the SHA the absence was measured at, and the filing part number"],
  ["returning 4 for a phrase known present; every source citation written into",
   "what that control returned; a dated measurement"],
  ["them \u2014 the attendance-gate citation off the comment at `:155` onto the predicate",
   "a source-file line citation"],
  ["at `:174`, and the enterprise-gate citation onto `:129-130`; every insertion",
   "two source-file line citations"],
  ["this pass had itself introduced into a file carrying 365 straight ones and none;",
   "the straight-quote count measured in that pass; a dated measurement"],
  ["enumerator BEFORE the edit, reproducing 114 / 112 / 24 / 64 / 26 / 65 exactly,",
   "the six figures that pass re-derived; a dated measurement"],
  ["dangerous kind. Matching `^\\*\\*A[0-9]+ \\| ` returns 123 rather than 125, because",
   "digits inside the quoted naive regex literal"],
  ["A50a and A50b carry letter suffixes. The pattern that reproduces the stated",
   "the A50a and A50b entry ids"],
  ["count is `^\\*\\*A[0-9]+[a-z]? \\| `, scoped to the OPEN section, since PARKED and",
   "digits inside the quoted suffix-aware regex literal"],
  ["rather than 71, for the FJ-7 reason recorded below. Recorded per CLAUDE.md \u00a710,",
   "a reference to FJ-7 and a CLAUDE.md section reference"],
  ["**TWO founder-judgment items are NOT RULED and both say so explicitly**, FJ-5",
   "the FJ-5 entry id"],
  ["and FJ-7, with the evidence and the reason for withholding recorded on each",
   "the FJ-7 entry id"],
  ["2026-09-02 and the totals re-derived 2026-09-14,",
   "the classification date and the re-derivation date; both events"],
  ["here previously read \"nothing else does\", which FJ-7 made false.",
   "a reference to the FJ-7 entry by id"],
  ["**RESOLVED 2026-09-07: THE FIGURES ABOVE WERE A STALE COUNT, NOT A DATED RECORD,",
   "the date the stale-count finding was resolved"],
  ["AND ARE NOW RE-DERIVED.** They read \"(classified 2026-09-02): 20 BLOCKING, 59",
   "the superseded classification date and two of its totals, quoted; a past state"],
  ["DEBT, 24 POST\", which summed to 103 against a live 109.",
   "the rest of that quoted past state and the live count it was measured against"],
  ["`593b9bf`, the commit that introduced the line, the live figures WERE exactly",
   "the SHA of the commit that introduced the superseded line"],
  ["20 / 59 / 24, and this header's own \"As committed\" said 103 OPEN. **They were",
   "the superseded totals restated, quoted; a past state"],
  ["103 \u2192 109, and the delta is six entries ADDED since 2026-09-04: A113, A115, A116,",
   "a superseded delta and the six entry ids added in that window"],
  ["A118, A119 and A120. **Nothing was removed.** A114 and A117 were both filed and",
   "five entry ids"],
  ["from those six plus A117's closure from BLOCKING.",
   "the A117 entry id"],
  ["dated figure here describes an EVENT \u2014 \"A117 was CLOSED 2026-09-07\", \"ARITHMETIC",
   "the A117 entry id and its closure date"],
  ["2026-09-02; the TOTALS were never fixed, and pairing the two made a live count",
   "the classification date"],
  ["**A142 IS COUNSEL-BLOCKED AND IS DELIBERATELY NOT IN THIS ROSTER, added",
   "the A142 entry id"],
  ["2026-09-14.** This roster's meaning is which BLOCKING items clear on the two",
   "the date the A142 rider was added"],
  ["conversations `docs/ruling-e-deletion-retention.md` \u00a76 names. **A142 waits on a",
   "a ruling-document section reference and the A142 entry id"],
  ["**CORRECTED 2026-09-08. THIS PARAGRAPH SAID THREE PLACES AND MAPPED ONE OF THEM",
   "the date this paragraph was corrected"],
  ["`docs/ruling-e-deletion-retention.md` names a reviewing attorney for Clauses 3",
   "a ruling-document clause number"],
  ["and 6, which is A47 and A84.\" Quoted rather than edited away, because the",
   "a clause number and two entry ids, inside the quoted wrong sentence"],
  ["`docs/ruling-e-deletion-retention.md` \u00a76 sends exactly TWO clauses to a reviewing",
   "a ruling-document section reference"],
  ["attorney, 3 and 6, and the entries whose subject is those clauses are **A47 and",
   "two clause numbers and an entry id"],
  ["A46**, one per clause. **A46 is `Pilot: POST` and is NOT among the counsel-gated",
   "the A46 entry id, twice"],
  ["**A84's counsel gate comes from A47, not from this document.** Its blocker line",
   "two entry ids"],
  ["reads `Blocker: A47, COUNSEL`, and the FT grouping ruling below says the same:",
   "an entry id inside a quoted blocker line"],
  ["A47 is the narrow predicate its policy waits on. What A84's OWN Detail document",
   "two entry ids"],
  ["`docs/persistence-scoping-pass.md`, Strand 3, Layer 4, governance: \"a",
   "a scoping-document strand and layer reference"],
  ["CLAUDE.md \u00a75, the Enterprise row, records the operating premise for E3, E6 and",
   "a CLAUDE.md section reference and two enterprise ruling ids"],
  ["E8, dated 2026-07-15, as internal review with no external counsel, which is A68.",
   "an enterprise ruling id, the premise date, and the A68 entry id"],
  ["**A110 is NEW on 2026-09-03**, and its gate is stated in the schema itself:",
   "the A110 entry id and the date it was filed"],
  ["`migrations/0009_enterprise_schema.sql:298-306` marks the `athlete_reflection`",
   "a migration file name and its cited line range"],
  ["language. It was THREE until the A96 ruling made that table something the",
   "the A96 entry id"],
  ["**WHAT WAS MEASURED, so the correction is checkable rather than asserted.** A84",
   "the A84 entry id"],
  ["carries ZERO occurrences of `subpoena`, against a control returning 2 for",
   "what a control returned; a dated measurement"],
  ["`delete` in the same entry. Its Detail cites Layer 4, governance, while subpoena",
   "a scoping-document layer reference"],
  ["posture is Layer 2, item (c) \u2014 a different layer of the same document, whose",
   "a scoping-document layer reference"],
  ["five counsel mentions all sit in Layer 2 or in \u00a77, which is about the Layer-2",
   "two layer references and a section reference"],
  ["questions. **A47 and A46 are a matched pair**: the only two entries titled",
   "two entry ids"],
  ["to parked **P-F**, Clause 4. **And this header was the ONLY clause-to-entry",
   "a ruling-document clause number"],
  ["`docs/filed-defects.md` and `migrations/0001_initial.sql` all map a clause to a",
   "a migration file name"],
  ["SUBJECT and never to an ID, and every one of them agrees with A46 and A47.",
   "two entry ids"],
  ["**THE BOLD LEAD'S ROSTER OF FOUR IS UNCHANGED: A47, A84, A68 and A110.** A46",
   "the roster restated with A46 named outside it; entry ids"],
  ["**FT RULED 2026-09-08: THE FOUR COUNSEL-GATED ITEMS RESOLVE TO TWO",
   "the date of the FT grouping ruling"],
  ["- **A47 and A84 are ONE SUBJECT AT TWO ALTITUDES.** A84's blocker line names A47",
   "entry ids, twice each"],
  ["  directly. A47 is the narrow factual predicate \u2014 does any charitable-records",
   "an entry id"],
  ["  floor bind \u2014 and A84 is the policy that cannot be written until it is answered.",
   "an entry id"],
  ["- **A68 is a DISTINCT QUESTION**: controller identity under FERPA and NIL, at",
   "an entry id"],
  ["  institutional scale. It overlaps A47 only through Clause 3's \"ties to",
   "an entry id and a clause number"],
  ["- **A110 STANDS ALONE**, and nothing depends on it until A96 ships. Its column",
   "two entry ids"],
  ["**ARITHMETIC OF THE LAST CHANGE, 2026-09-15 (thirteenth): THREE ENTRIES OPENED",
   "the date of the thirteenth change"],
  ["AND NONE CLOSED.** OPEN moves 122 to 125 and **DEBT 68 to 71**; BLOCKING stays 24",
   "the from-endpoints of the OPEN and DEBT moves; the state each figure left"],
  ["and POST stays 30. A145 is large; A146 and A147 are cheap-and-mechanical, so that",
   "the three entry ids this change opens"],
  ["tier alone moves **34 to 36**, large moves **38 to 39**, and the breakdown reads",
   "the from-endpoints of the two tier moves"],
  ["**THE FILE-WIDE `Pilot: DEBT` DIAGNOSTIC MOVES 69 TO 72**, three for three,",
   "the from-endpoint of the file-wide move"],
  ["still exactly A50a and A50b, and the extra on the file-wide count is still FJ-7's",
   "the A50a and A50b entry ids and a reference to FJ-7"],
  ["recorded because the mechanism is this file's own.** It was issued as OPEN 124",
   "the OPEN figure the issued target stated; a quoted wrong value"],
  ["with cheap 35 and large 39, which is internally consistent and which counts TWO",
   "the tier figures that target stated; quoted wrong values"],
  ["**THE SLICE LABEL `slice-verify-widen-check3` WAS DELETED 2026-09-15**, by name,",
   "the deleted slice label name and the date it was deleted"],
  ["after asserting 0 commits ahead of `main` and printing `git branch --contains`",
   "the ahead-count asserted before the deletion; a git fact"],
  ["for `7493793`, the same two assertions the three labels deleted 2026-09-11 got.",
   "the tip SHA printed before the deletion, and the 2026-09-11 precedent date"],
  ["It was local-only and outside all four \u00a76.15 categories, so an agent could",
   "a CLAUDE.md section reference"],
  ["discharge it, which is what separates it from A144 and why it is recorded here",
   "the A144 entry id"],
  ["**THE BUILD CHAIN IS UNCHANGED AT 20**, because its definition subtracts the",
   "the twelfth change build-chain restatement, orphaned when its claim moved to the thirteenth"],
  ["and POST stays 30. Both new entries are cheap-and-mechanical, so that tier alone",
   "the twelfth change POST restatement, orphaned when the claim moved to the thirteenth"],
];

// The build chain is asserted in check 4 rather than as a pair, because the doc
// counts it as derived and not as one of its stated-versus-measured pairs. Its
// claim is registered here so the completeness guard still sees the numeral it
// consumes.
const DERIVED_CLAIMS = [['THE BUILD CHAIN HOLDS AT', '20']];

function checkQueue() {
  head('3. stated-vs-measured pairs, against the COMMITTED blob');

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

  // ---- the figure region, located by marker --------------------------------
  const rStart = lines.indexOf(REGION_START);
  const rEnd = lines.indexOf(REGION_END);
  const regionOk = rStart >= 0 && rEnd > rStart;
  control('figure-region markers found', regionOk,
    regionOk ? '(lines ' + (rStart + 1) + '..' + rEnd + ')' : 'start ' + rStart + ', end ' + rEnd);
  if (!regionOk) { report('figure region', false, 'region markers not found'); return null; }
  const region = lines.slice(rStart, rEnd);
  control('region holds the counsel-gated sentence check 3 scrapes', region.includes(REGION_HOLDS));
  const regionFlat = norm(region.join('\n'));

  // ---- section bounds ------------------------------------------------------
  const find = (marker) => lines.findIndex((l) => l.startsWith(marker));
  const sOpen = find('## OPEN');
  const sParked = find('## PARKED');
  const sFj = find('## FOUNDER JUDGMENT');
  const sFt = find('## ANSWERABLE ONLY BY FT');
  const sOut = find('## RULED OUT');
  const ordered = sOpen >= 0 && sParked > sOpen && sFj > sParked && sFt > sFj && sOut > sFt;
  control('the five section markers are found and in order', ordered,
    '(' + [sOpen, sParked, sFj, sFt, sOut].map((n) => n + 1).join(', ') + ')');
  if (!ordered) { report('queue arithmetic', false, 'section bounds not found'); return null; }

  const open = lines.slice(sOpen, sParked);
  const parked = lines.slice(sParked, sFj);
  const fjSeg = lines.slice(sFj, sFt);
  const ftSeg = lines.slice(sFt, sOut);
  const outSeg = lines.slice(sOut);

  // Entry-header form is NOT uniform across sections: OPEN uses A-ids with an
  // optional letter suffix, PARKED uses P-A..P-J, FOUNDER JUDGMENT uses FJ-n,
  // ANSWERABLE uses F1..F3 and RULED OUT uses C1..C10. One pattern cannot count
  // all five, so each section is counted with its own and each is controlled.
  const P_PARKED = /^\*\*P-[A-Z] \| /;
  const P_FJ = /^\*\*FJ-[0-9]+ \| /;
  const P_FT = /^\*\*F[0-9]+ \| /;
  const P_OUT = /^\*\*C[0-9]+ \| /;
  const ANY_HEADER = /^\*\*([A-Za-z]+-?[A-Za-z0-9]*) \| /;

  const ownersIn = (seg, pred) => {
    const ids = [];
    let cur = null;
    for (const l of seg) {
      const h = ANY_HEADER.exec(l);
      if (h) { cur = h[1]; continue; }
      if (pred(l)) ids.push(cur);
    }
    return ids;
  };

  const m = {
    open: open.filter((l) => SUFFIX.test(l)).length,
    blocking: open.filter((l) => l.startsWith('Pilot: BLOCKING')).length,
    debt: open.filter((l) => l.startsWith('Pilot: DEBT')).length,
    post: open.filter((l) => l.startsWith('Pilot: POST')).length,
    gated: open.filter((l) => l.startsWith('Pilot: BLOCKING, and counsel-gated')).length,
    naive: open.filter((l) => NAIVE.test(l)).length,
    debtFileWide: lines.filter((l) => l.startsWith('Pilot: DEBT')).length,
    parked: parked.filter((l) => P_PARKED.test(l)).length,
    fj: fjSeg.filter((l) => P_FJ.test(l)).length,
    fjNotRuled: fjSeg.filter((l) => l.startsWith('**NOT RULED')).length,
    answerable: ftSeg.filter((l) => P_FT.test(l)).length,
    ruledOut: outSeg.filter((l) => P_OUT.test(l)).length,
    postUndetermined: open.filter((l) => /^Pilot: POST \S/.test(l)).length,
    debtProposed: open.filter((l) => /^Pilot: DEBT \S/.test(l)).length,
  };
  m.fjRuled = m.fj - m.fjNotRuled;
  m.gatedIds = ownersIn(open, (l) => l.startsWith('Pilot: BLOCKING, and counsel-gated'));
  m.debtProposedIds = ownersIn(open, (l) => /^Pilot: DEBT \S/.test(l));

  // The out-of-OPEN Pilot lines, with the entries that own them. Walked over the
  // WHOLE file with the OPEN span excluded by index, because the claim the doc
  // makes is about the file and not about one section.
  const outsideIdx = [];
  for (let i = 0; i < lines.length; i++) {
    if (i >= sOpen && i < sParked) continue;
    if (lines[i].startsWith('Pilot:')) outsideIdx.push(i);
  }
  m.outOfOpenPilot = outsideIdx.length;
  m.outOfOpenOwners = outsideIdx.map((i) => {
    for (let j = i; j >= 0; j--) { const h = ANY_HEADER.exec(lines[j]); if (h) return h[1]; }
    return null;
  });

  control('each section entry pattern matches something',
    m.parked > 0 && m.fj > 0 && m.answerable > 0 && m.ruledOut > 0,
    'parked ' + m.parked + ', fj ' + m.fj + ', answerable ' + m.answerable + ', ruled-out ' + m.ruledOut);
  control('the NOT RULED marker matches something', m.fjNotRuled > 0, '(' + m.fjNotRuled + ')');
  control('the suffixed Pilot forms match something',
    m.postUndetermined > 0 && m.debtProposed > 0,
    'POST-with-suffix ' + m.postUndetermined + ', DEBT-with-suffix ' + m.debtProposed);

  // ---- tiers ---------------------------------------------------------------
  const tiers = [];
  let cur = null;
  for (const l of open) {
    if (l.startsWith('### ')) { cur = { name: l, n: 0 }; tiers.push(cur); continue; }
    if (cur && SUFFIX.test(l)) cur.n++;
  }
  const tierOne = (prefix) => {
    const hit = tiers.filter((t) => t.name.startsWith(prefix));
    control('tier prefix ' + JSON.stringify(prefix) + ' names exactly one tier',
      hit.length === 1, '(' + hit.length + ')');
    return hit.length === 1 ? hit[0].n : null;
  };
  const ruledTiers = tiers.filter((t) => t.name.startsWith('### Tier '));
  control('the ruled-tier prefix matches something', ruledTiers.length > 0, '(' + ruledTiers.length + ')');
  m.tiers = tiers;
  m.tierRuledCount = ruledTiers.length;
  m.tierRuled = ruledTiers.reduce((a, t) => a + t.n, 0);
  m.tierGatesOther = tierOne('### Gates other work');
  m.tierGatesCommitment = tierOne('### Gates a stated commitment');
  m.tierBmf = tierOne('### BMF and Discover');
  m.tierCheap = tierOne('### Cheap and mechanical');
  m.tierLarge = tierOne('### Large');
  m.tierUndetermined = tierOne('### Blocker undetermined');
  m.bmfTier = m.tierBmf;
  m.breakdownParts = [m.tierRuled, m.tierGatesOther, m.tierGatesCommitment,
    m.tierBmf, m.tierCheap, m.tierLarge, m.tierUndetermined].join(' + ');

  // ---- derived -------------------------------------------------------------
  m.buildChain = m.blocking - m.gated;
  // An item the doc declares counsel-blocked AND deliberately outside the
  // counsel-gated roster is exactly what makes the build chain overstate. The
  // declaration is countable, so the overstatement is MEASURED rather than
  // asserted from memory.
  m.outOfRoster = (regionFlat.match(/\*\*A[0-9]+ IS COUNSEL-BLOCKED AND IS DELIBERATELY NOT IN THIS ROSTER/g) || []).length;
  m.buildChainMovable = m.buildChain - m.outOfRoster;

  return { blob, lines, region, regionStart: rStart + 1, regionFlat, open, m };
}

function checkPairsAndDerived(ctx) {
  if (!ctx) return;
  const { region, regionStart, regionFlat, m } = ctx;
  const grabRaw = (re, i) => { const x = regionFlat.match(re); return x ? x[i === undefined ? 1 : i] : null; };
  const grab = (re, i) => { const v = grabRaw(re, i); return v === null ? null : Number(v); };
  // A NUMERAL AND A WORD FORM BOTH PARSE. The numeral branch is first and is
  // unconditional, so a figure written in digits never reaches the word map.
  const grabWord = (re, i) => {
    const raw = grabRaw(re, i);
    if (raw === null) return null;
    if (/^\d+$/.test(raw)) return Number(raw);
    return wordToNumber(raw);
  };

  // ---- stated side ---------------------------------------------------------
  // Scraped from the REGION, never from the whole blob, so the region definition
  // is load-bearing rather than decorative.
  const AS_COMMITTED = /As committed: (\d+) OPEN, (\d+) PARKED, (\d+) founder-judgment of which (\d+) are now ruled, (\d+) answerable only by FT, (\d+) ruled out\./;
  const GATE_LINE = /AGAINST THE PILOT GATE: (\d+) BLOCKING, (\d+) DEBT, (\d+) POST/;
  const s = {
    open: grab(AS_COMMITTED, 1),
    parked: grab(AS_COMMITTED, 2),
    fj: grab(AS_COMMITTED, 3),
    fjRuled: grab(AS_COMMITTED, 4),
    answerable: grab(AS_COMMITTED, 5),
    ruledOut: grab(AS_COMMITTED, 6),

    // HYPHEN-SWEPT, every word-form scrape below, and the FAILURE MODE IS STATED
    // AS MEASURED RATHER THAN AS FEARED. The worry was TRUNCATION: `[a-z]+`
    // against "Twenty-one" captures "Twenty", resolves to 20, and if the measured
    // figure is also 20 the pair reports PASS over a doc stating 21 - a stale
    // figure reported green, the exact mechanism this check exists to remove.
    // THAT IS NOT WHAT THESE REGEXES DID. Every hyphen-blind capture here is
    // followed immediately by a LITERAL anchor, so a hyphenated word makes the
    // whole match fail rather than truncate. Tested on all ten scrapes with a
    // hyphenated substitution: eight returned null, zero truncated. A null is
    // loud - it joins `missing` and breaks the parsed-figures control - but it
    // reports "stated null", which names no number the doc contains.
    // THE SWEEP IS STILL RIGHT, for the reason the measurement gives rather than
    // the one it refutes: it turns a null into a correct parse and an honest
    // comparison, and it removes the latent surface, because truncation becomes
    // reachable the moment any of these captures stops being anchored by a
    // following literal. A rewording is all that would take.
    tierRuledCount: grabWord(/breaks down as ([a-z-]+|\d+) ruled tiers holding/),
    tierRuled: grab(/ruled tiers holding (\d+)/),
    tierGatesOther: grab(/gates-other-work (\d+)/),
    tierGatesCommitment: grab(/gates-a-stated-commitment (\d+)/),
    bmfTier: grab(/BMF-and-Discover (\d+)/),
    tierCheap: grab(/cheap-and-mechanical (\d+)/),
    tierLarge: grab(/, large (\d+), and/),
    tierUndetermined: grab(/blocker-undetermined (\d+)\./),

    breakdownParts: grabRaw(/the breakdown reads ((?:\d+ \+ )+\d+) = \d+\./),
    breakdownSum: grab(/the breakdown reads (?:\d+ \+ )+\d+ = (\d+)\./),

    blockOpen: grab(/OPEN moves \d+ to (\d+) and \*\*DEBT/),
    blockDebt: grab(/and \*\*DEBT \d+ to (\d+)\*\*/),
    blockBlocking: grab(/BLOCKING stays (\d+) and POST stays/),
    blockPost: grab(/BLOCKING stays \d+ and POST stays (\d+)\./),
    blockCheap: grab(/that tier alone moves \*\*\d+ to (\d+)\*\*/),
    blockLarge: grab(/large moves \*\*\d+ to (\d+)\*\*/),
    blockDebtFileWide: grab(/DIAGNOSTIC MOVES \d+ TO (\d+)\*\*/),
    blockNaive: grab(/naive enumerator moves with OPEN, \*\*(\d+) against \d+\*\*/),
    blockNaiveOpen: grab(/naive enumerator moves with OPEN, \*\*\d+ against (\d+)\*\*/),

    blocking: grab(GATE_LINE, 1),
    debt: grab(GATE_LINE, 2),
    post: grab(GATE_LINE, 3),

    naive: grab(/returns (\d+) rather than \d+, because/),
    naiveOpen: grab(/returns \d+ rather than (\d+), because/),
    debtFileWide: grab(/A file-wide .Pilot: DEBT. count returns (\d+) rather than \d+/),
    debtFileWideContrast: grab(/A file-wide .Pilot: DEBT. count returns \d+ rather than (\d+)/),

    buildChain: grab(/THE BUILD CHAIN (?:HOLDS AT|IS UNCHANGED AT) (\d+)\*\*/),
    gatedSentenceGated: grabWord(/counsel-gated sentence stays ([a-z-]+|\d+) of the [a-z-]+\./),
    gatedSentenceBlocking: grabWord(/counsel-gated sentence stays [a-z-]+ of the ([a-z-]+|\d+)\./),
    buildChainWord: grabWord(/\*\*([A-Za-z-]+|\d+) is the figure the definition yields;/),
    buildChainMovableWord: grabWord(/is the figure the definition yields; ([a-z-]+|\d+) is the/),
    overstatement: grabWord(/OVERSTATEMENT RECORDED BY THE NINTH CHANGE STILL STANDS\*\* at ([a-z-]+|\d+),/),

    fjNotRuled: grabWord(/\*\*([A-Z-]+|\d+) founder-judgment items are NOT RULED/),
    postUndetermined: grab(/of which (\d+) POST carry/),
    debtProposed: grabWord(/and of which \*\*([a-z-]+|\d+) DEBT, A\d+, is PROPOSED/),
    debtProposedId: grabRaw(/and of which \*\*[a-z]+ DEBT, (A\d+), is PROPOSED/),
    fj7Sum: grab(/which remain a count of OPEN entries and sum to (\d+)\./),
    soleException: grabWord(/\*\*([A-Z-]+|\d+) ENTRY OUTSIDE OPEN CARRIES [A-Z-]+ TOO/),
    soleExceptionOwner: grabRaw(/AND IT IS THE ONLY EXCEPTION:\*\* (FJ-\d+),/),
    // HYPHEN INCLUDED, AND DIGITS ACCEPTED. The old `([a-z]+)` stopped dead at
    // the hyphen, so "forty-five" captured "forty" and "45" captured nothing.
    // THE DOCS COMMIT WILL WRITE THE WORD FORM, "forty-five", and the reason is
    // check 3b rather than taste: a numeral on that line would be a new numeral
    // occurrence in the figure region, which 3b requires to be claimed or
    // frozen, and its claim would then have to be maintained against PAIRS
    // .length. A word form is invisible to 3b, so the docs commit stays a
    // one-line sentence edit needing no matching change here. The numeral form
    // parses anyway, so an editor who writes digits gets an honest pair failure
    // from 3b rather than a null.
    pairsClaimed: grabWord(/the verifier checks ([a-z-]+|\d+) stated-versus-measured pairs/),
  };
  // This pair was ALREADY hyphen-capable in its capture and still had the same
  // defect one layer down: it looked the word up in WORDS directly, which stops
  // at THIRTY and cannot compose, so a correct capture of FORTY-FIVE returned
  // null. Both halves route through wordToNumber now, like every other word-form
  // scrape. The captures are simplified to [A-Z-]+ for uniformity; the literal
  // " OF THE " and " BLOCKING ITEMS " anchor them, so nothing widens in practice.
  const gatedWord = regionFlat.match(/\*\*([A-Z-]+) OF THE ([A-Z-]+) BLOCKING ITEMS ARE COUNSEL-GATED/);
  s.gated = gatedWord ? wordToNumber(gatedWord[1]) : null;
  const blockingWord = gatedWord ? wordToNumber(gatedWord[2]) : null;
  const rosterRaw = grabRaw(/BLOCKING ITEMS ARE COUNSEL-GATED AND CANNOT BE CLOSED BY BUILDING: ([^*]+)\.\*\*/);
  s.gatedIds = rosterRaw === null ? null : (rosterRaw.match(/A\d+/g) || []).join(',');

  const missing = Object.entries(s).filter(([, v]) => v === null || v === undefined).map(([k]) => k);
  control('every stated figure parsed from the region', missing.length === 0,
    missing.length ? 'unparsed: ' + missing.join(', ') : Object.keys(s).length + ' figures parsed');

  // ---- the pairs -----------------------------------------------------------
  // Each pair carries the OCCURRENCES it consumes, as [locator, numeral]. The
  // locator is a substring that must resolve to exactly one line of the region;
  // the numeral is the digit run that line states. The completeness guard below
  // subtracts these, so a figure asserted here is a figure accounted for there.
  const sortIds = (v) => (v === null ? null : v.split(',').slice().sort().join(','));
  const PAIRS = [
    ['OPEN total', s.open, m.open, [['As committed:', '125']]],
    ['BLOCKING', s.blocking, m.blocking, [['AGAINST THE PILOT GATE:', '24']]],
    ['DEBT (OPEN-scoped)', s.debt, m.debt, [['AGAINST THE PILOT GATE:', '71']]],
    ['POST', s.post, m.post, [['AGAINST THE PILOT GATE:', '30']]],
    ['BMF and Discover tier', s.bmfTier, m.bmfTier, [['7, BMF-and-Discover 17', '17']]],
    ['naive enumerator', s.naive, m.naive, [['dangerous kind. Matching', '123']]],
    ['file-wide DEBT', s.debtFileWide, m.debtFileWide, [['A file-wide `Pilot: DEBT` count returns', '72']]],
    ['counsel-gated', s.gated, m.gated, []],

    ['PARKED total', s.parked, m.parked, [['As committed:', '10']]],
    ['founder-judgment total', s.fj, m.fj, [['As committed:', '7']]],
    ['founder-judgment ruled', s.fjRuled, m.fjRuled, [['As committed:', '5']]],
    ['answerable only by FT', s.answerable, m.answerable, [['ruled, 3 answerable only by FT', '3']]],
    ['ruled out', s.ruledOut, m.ruledOut, [['ruled, 3 answerable only by FT', '10']]],

    ['ruled-tier count', s.tierRuledCount, m.tierRuledCount, []],
    ['ruled tiers holding', s.tierRuled, m.tierRuled, [['six ruled tiers holding', '7']]],
    ['gates-other-work tier', s.tierGatesOther, m.tierGatesOther, [['six ruled tiers holding', '16']]],
    ['gates-a-stated-commitment tier', s.tierGatesCommitment, m.tierGatesCommitment, [['7, BMF-and-Discover 17', '7']]],
    ['cheap-and-mechanical tier', s.tierCheap, m.tierCheap, [['7, BMF-and-Discover 17', '36']]],
    ['large tier', s.tierLarge, m.tierLarge, [['7, BMF-and-Discover 17', '39']]],
    ['blocker-undetermined tier', s.tierUndetermined, m.tierUndetermined, [['blocker-undetermined 3.', '3']]],

    ['tier breakdown string', s.breakdownParts, m.breakdownParts,
      [['+ 36 + 39 + 3 = 125.', '7'], ['+ 36 + 39 + 3 = 125.', '16'], ['+ 36 + 39 + 3 = 125.', '17'],
       ['+ 36 + 39 + 3 = 125.', '36'], ['+ 36 + 39 + 3 = 125.', '39'], ['+ 36 + 39 + 3 = 125.', '3']]],
    ['tier breakdown stated sum', s.breakdownSum, m.open, [['+ 36 + 39 + 3 = 125.', '125']]],

    ['arithmetic block: OPEN to-endpoint', s.blockOpen, m.open, [['OPEN moves 122 to 125', '125']]],
    ['arithmetic block: DEBT to-endpoint', s.blockDebt, m.debt, [['OPEN moves 122 to 125', '71']]],
    ['arithmetic block: BLOCKING stays', s.blockBlocking, m.blocking, [['OPEN moves 122 to 125', '24']]],
    ['arithmetic block: POST stays', s.blockPost, m.post, [['and POST stays 30. A145', '30']]],
    ['arithmetic block: cheap tier to-endpoint', s.blockCheap, m.tierCheap, [['tier alone moves **34 to 36**', '36']]],
    ['arithmetic block: file-wide DEBT to-endpoint', s.blockDebtFileWide, m.debtFileWide, [['DIAGNOSTIC MOVES 69 TO 72', '72']]],
    ['arithmetic block: naive restatement', s.blockNaive, m.naive, [['naive enumerator moves with OPEN, **123 against 125**', '123']]],
    ['arithmetic block: naive restatement, OPEN half', s.blockNaiveOpen, m.open, [['naive enumerator moves with OPEN, **123 against 125**', '125']]],

    ['arithmetic block: large tier to-endpoint', s.blockLarge, m.tierLarge, [['large moves **38 to 39**', '39']]],

    ['naive enumerator contrast (OPEN total)', s.naiveOpen, m.open, [['dangerous kind. Matching', '125']]],
    ['file-wide DEBT contrast (OPEN-scoped)', s.debtFileWideContrast, m.debt, [['rather than 71, for the FJ-7 reason', '71']]],

    ['counsel-gated sentence: gated word form', s.gatedSentenceGated, m.gated, []],
    ['counsel-gated sentence: BLOCKING word form', s.gatedSentenceBlocking, m.blocking, []],
    ['build chain word form (Twenty)', s.buildChainWord, m.buildChain, []],
    ['build chain movable (nineteen)', s.buildChainMovableWord, m.buildChainMovable, []],
    ['build-chain overstatement', s.overstatement, m.outOfRoster, []],

    ['founder-judgment NOT RULED', s.fjNotRuled, m.fjNotRuled, []],
    ['POST carrying (undetermined)', s.postUndetermined, m.postUndetermined, [['of which 6 POST carry', '6']]],
    ['DEBT carrying PROPOSED', s.debtProposed, m.debtProposed, []],
    ['DEBT carrying PROPOSED, id', s.debtProposedId, m.debtProposedIds.join(','), [['one DEBT, A105, is PROPOSED', '105']]],
    ['FJ-7 three-totals sum', s.fj7Sum, m.blocking + m.debt + m.post,
      [['which remain a count of OPEN entries and sum to', '125']]],
    ['sole out-of-OPEN Pilot line', s.soleException, m.outOfOpenPilot, []],
    ['sole out-of-OPEN Pilot line, owner', s.soleExceptionOwner, m.outOfOpenOwners.join(','),
      [['AND IT IS THE ONLY EXCEPTION:', '7']]],
    ['counsel-gated roster ids', sortIds(s.gatedIds), sortIds(m.gatedIds.join(',')),
      [['BY BUILDING: A47', '47'], ['BY BUILDING: A47', '84'],
       ['BY BUILDING: A47', '68'], ['BY BUILDING: A47', '110']]],
  ];

  for (const [label, stated, measured] of PAIRS) {
    report(label, stated === measured, 'stated ' + stated + ' / measured ' + measured);
  }

  // The doc states how many pairs this check makes. Reported LAST, so the number
  // it is compared against is the number the reader has just watched go by.
  report('stated pair count in the doc', s.pairsClaimed === PAIRS.length,
    'stated ' + s.pairsClaimed + ' / measured ' + PAIRS.length);

  checkCompleteness(ctx, PAIRS);

  head('4. derived identities');
  const sum = m.blocking + m.debt + m.post;
  report('BLOCKING + DEBT + POST === OPEN', sum === m.open,
    m.blocking + ' + ' + m.debt + ' + ' + m.post + ' = ' + sum + ' vs OPEN ' + m.open);

  const tierSum = m.tiers.reduce((a, t) => a + t.n, 0);
  control('tier walk found sections', m.tiers.length > 0, '(' + m.tiers.length + ' tiers)');
  report('tier breakdown sums to OPEN', tierSum === m.open,
    m.tiers.map((t) => t.n).join(' + ') + ' = ' + tierSum + ' vs OPEN ' + m.open);

  // The literal `true` that used to sit here made this line unfailable: it
  // printed the subtraction and asserted nothing, so a header stating any other
  // figure would still have shown PASS. It compares the STATED figure now.
  report('build chain === BLOCKING minus counsel-gated', s.buildChain === (m.blocking - m.gated),
    'stated ' + s.buildChain + ' / measured ' + (m.blocking - m.gated) +
    ' (' + m.blocking + ' - ' + m.gated + ')');
  if (blockingWord !== null) {
    report('counsel-gated sentence word-form agrees with BLOCKING', blockingWord === m.blocking,
      'word ' + blockingWord + ' / measured ' + m.blocking);
  }
}

// ---------------------------------------------------------------- CHECK 3b
// Consumes every numeral occurrence in the figure region, subtracts the ones an
// assertion claims and the ones FROZEN lists, and fails on the remainder. This
// is what makes the inventory above a CLOSED set: a figure written into the
// header that nobody asserts and nobody classifies has nowhere to hide.
function remainderOf(region, claims, frozenKeys) {
  const byText = new Map();
  region.forEach((l, i) => {
    if (!byText.has(l)) byText.set(l, []);
    byText.get(l).push(i);
  });
  const claimed = new Map();
  const problems = [];
  const resolve = (locator, what) => {
    const hits = [];
    region.forEach((l, i) => { if (l.includes(locator)) hits.push(i); });
    if (hits.length !== 1) problems.push(what + ' ' + JSON.stringify(locator) + ' resolves to ' + hits.length + ' lines');
    return hits.length === 1 ? hits[0] : -1;
  };
  for (const [locator, numeral] of claims) {
    const i = resolve(locator, 'claim locator');
    if (i < 0) continue;
    if (!claimed.has(i)) claimed.set(i, new Set());
    claimed.get(i).add(numeral);
  }
  const frozenIdx = new Set();
  const seen = new Set();
  for (const key of frozenKeys) {
    if (seen.has(key)) { problems.push('duplicate FROZEN key ' + JSON.stringify(key.slice(0, 40))); continue; }
    seen.add(key);
    const hits = byText.get(key) || [];
    if (hits.length !== 1) { problems.push('FROZEN key resolves to ' + hits.length + ' lines: ' + JSON.stringify(key.slice(0, 60))); continue; }
    frozenIdx.add(hits[0]);
  }
  const remainder = [];
  const frozenUseful = new Set();
  region.forEach((l, i) => {
    for (const n of numeralsOf(l)) {
      if (claimed.has(i) && claimed.get(i).has(n)) continue;
      if (frozenIdx.has(i)) { frozenUseful.add(i); continue; }
      remainder.push([i, n, l]);
    }
  });
  return { remainder, problems, frozenIdx, frozenUseful };
}

function checkCompleteness(ctx, PAIRS) {
  head('3b. every numeral in the figure region is claimed or frozen');
  const { region, regionStart } = ctx;
  const claims = PAIRS.flatMap((p) => p[3]).concat(DERIVED_CLAIMS);
  const frozenKeys = FROZEN.map((f) => f[0]);
  const total = region.reduce((a, l) => a + numeralsOf(l).length, 0);

  // The guard must be capable of failing. A synthetic region carrying a line
  // nobody classified is run through the SAME function, and its remainder must
  // be non-empty, before the real remainder's emptiness is read as meaning
  // anything (CLAUDE.md section 10, the scanner filing).
  const probe = remainderOf(['a stray line stating 4242 and nothing else'], [], []);
  control('the guard reports a remainder on an unclassified synthetic line',
    probe.remainder.length === 1 && probe.remainder[0][1] === '4242');
  const probe2 = remainderOf(['a stray line stating 4242 and nothing else'], [['stray line', '4242']], []);
  control('the guard reports NO remainder once that line is claimed', probe2.remainder.length === 0);

  const { remainder, problems, frozenIdx, frozenUseful } = remainderOf(region, claims, frozenKeys);
  control('every claim locator and FROZEN key resolves to exactly one line',
    problems.length === 0, problems.length ? problems[0] : '(' + claims.length + ' claims, ' + frozenKeys.length + ' frozen)');
  control('no FROZEN entry is dead inventory', frozenUseful.size === frozenIdx.size,
    frozenUseful.size + ' of ' + frozenIdx.size + ' frozen lines claim something');

  console.log('         region lines ' + regionStart + '..' + (regionStart + region.length - 1) +
    ', ' + total + ' numeral occurrences');
  report('no unaccounted numeral in the figure region', remainder.length === 0,
    remainder.length === 0 ? '(0 of ' + total + ' unaccounted)' : remainder.length + ' unaccounted');
  for (const [i, n, l] of remainder.slice(0, 20)) {
    console.log('         UNACCOUNTED line ' + (regionStart + i) + ' numeral ' + n + ': ' + l);
  }
  if (remainder.length > 20) console.log('         ... and ' + (remainder.length - 20) + ' more');
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
