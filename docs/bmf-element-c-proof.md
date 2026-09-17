# Element C's proof, and the evidence that no longer has a home

Element C of the BMF loader (R32, definition-of-done item 8) carries ONE
done criterion after FT's 2026-09-16 narrowing: the aside row count equals
slice 1's sidecar parsed count. This note is the RECORD of that criterion
having been exercised in both directions on 2026-09-16, against
`bmf-sandbox` on the local venue.

It is a record, NOT a runnable rig. The harness quoted below is not
committed and is not expected to run again. It is quoted because what it
proved cost a 400-second load and exists nowhere else.

## Why a passing run alone does not establish the criterion

A comparison that has only ever returned `pass` has not been shown to be a
comparison. It is indistinguishable from a constant. Element C's own
docblock forbids taking the expected count as an argument, precisely so the
compared number cannot be supplied by the caller; that discipline protects
the operand, and says nothing about whether the branch that reports FAIL is
reachable.

Element C's failure path is `rowsMatch === false` at the read-back, which
calls `fail()` and exits 1, PRE-SWAP, leaving the aside in place and the
live `bmf` table untouched. Reaching it requires the aside and the sidecar
to disagree, and on a correct run they do not.

## The harness

`mutate.mjs`, fourteen lines, quoted in full. Its two long path literals are
rendered as `<SCRATCHPAD>` and `<REPO>` placeholders; that substitution is
the ONLY deviation from verbatim, and line 12 exceeds this file's width cap
because it is quoted source rather than prose.

```js
import { readFileSync, writeFileSync } from 'node:fs';
const SRC = '<SCRATCHPAD>/sidecar.orig.json';
const DST = '<REPO>/scripts/bmf-aside.tmp.json';
const [field, value] = process.argv.slice(2);
if (field === 'restore') {
  writeFileSync(DST, readFileSync(SRC));
  console.log('restored');
} else {
  const j = JSON.parse(readFileSync(SRC, 'utf8'));
  const old = j[field];
  j[field] = field === 'sqlBytes' || field === 'rows' ? Number(value) : value;
  console.log('mutated ' + field + ': ' + JSON.stringify(old) + ' -> ' + JSON.stringify(j[field]));
  writeFileSync(DST, JSON.stringify(j, null, 2));
}
```

It always sources from a PRESERVED COPY and never from the live sidecar, so
successive invocations cannot compound, and `restore` copies the preserved
original back.

## The two runs

Both captures sat in a per-session temp scratchpad, at
`…/Temp/claude/C--Users-talab-Desktop-Steward-House-stewardhouse-app/`
`0cf7a21b-48f7-45a3-9aca-69c44e77153d/scratchpad/`. The raw files are
deliberately NOT copied into this repository; the lines that matter are
quoted with their line numbers.

FAIL, `t4.txt`, mtime 2026-09-16 16:23:51:

```
44:[bmf-load] aside before    : 0 rows
46:[bmf-load] load wall clock : 400.4 s
52:[bmf-load] aside after     : 1964958 rows (sidecar 1964957)
53:[bmf-load] aside_rows_equal_parsed : FAIL
```

Line 55 carries the `fail()` message, which names the criterion, records
that it runs PRE-SWAP, and states that the live `bmf` table was never
touched.

pass, `t5.txt`, mtime 2026-09-16 16:32:14:

```
44:[bmf-load] aside before    : 0 rows
46:[bmf-load] load wall clock : 469.9 s
49:[bmf-load] aside after     : 1964958 rows (sidecar 1964958)
50:[bmf-load] aside_rows_equal_parsed : pass
```

The aside was loaded, not rolled back, by the FAILING run: `fail()` runs
after the load commits. Both runs report `aside before : 0 rows`, so the
aside was dropped between them, which is what `drop.sh` in that same
directory is for.

## The preservation sequence

`sidecar.orig.json` was written at 16:15:33. `mutate.mjs` was written at
16:16:35. **The preserved copy predates the tool that reads it by one
minute**, so the original cannot have been derived from a mutated state.

The sidecar at `scripts/bmf-aside.tmp.json` today is byte-identical to that
preserved copy, asserted three ways that can disagree: identical sha256
`6a0334e8b110268acab548d6b73e696712b4043ec98fefd362db539fb118e343`, `cmp`
exit 0, and a walk over all 33 keys returning zero differing fields.

## Independent corroboration of the count

Three sources that could disagree do not, and none of them is the sidecar.

The emitted artifact holds 1,964,958 value rows and 5,805 INSERT headers,
which sum exactly to its 1,970,763 total lines. The aside holds 1,964,958
rows. The aside holds 1,964,958 distinct EINs. The aside holds zero NULL
EINs.

## What is NOT established

The passing run's EXIT CODE was never captured. The code says a completed C
exits 2; that is inference from the source, not an observation, and the
wrapper's `EXITCODE=` line does not appear in `t5.txt`.

Whether the 16:24 sidecar write was a `restore` invocation or a
coincidentally identical write is NOT established. The harness prints its
action and no capture of that print survives, and an mtime does not name
which branch ran.

Whether uncaptured mutation runs happened between 16:16 and 16:23 is
unknown.

## Why this note exists

All of the above originated in a per-session temp scratchpad belonging to a
window that closed mid-element. That location does not survive: it is
subject to OS cleanup, it is outside the repository, and nothing references
it.

The precedent is CLAUDE.md §10's double-store filing, which records that
`p2_smoke.mjs` was lost from exactly this class of directory, so a question
asked weeks later could only be answered by inference. The same filing notes
that the offending invocation's only trace was a banner line inside a
`server.log` in an OS-temp scratchpad, "which is not version-controlled and
is subject to cleanup at any time".

A proof that lives only in a temp directory is a proof with an expiry date.
