// D1 IMPORT-WINDOW EXPERIMENT - PROBE LOG ANALYSIS
//
// Part of the experiment recorded in section 12 of `docs/bmf-load-scoping.md`.
// Reduces a probe log to baseline latency, t_degrade, t_recover, window
// duration, and mode (fail / queue / stale-read / none).
//
// PHASE 6 (analysis).
// RUN: [agent-ok]. Reads a local log file. No database, no network.
//
// TWO DEFECTS FOUND IN PHASE 0, both fixed here, recorded because each would
// have produced a confidently wrong answer:
//
// 1. A SINGLE BASELINE STRAGGLER SILENTLY DISABLED QUEUE DETECTION. The
//    threshold was `p95 * factor` over the baseline samples. One slow call
//    landing in the baseline window pushed p95 to 4,009 ms and the threshold to
//    20 s, past any latency a real queue would produce, so `queue` was reported
//    as `none`. In the real run the import start is only approximate, so a
//    straggler in the baseline is likely, and the failure mode is a false "no
//    problem" result. The threshold is now MEDIAN-based with an absolute floor,
//    and the pre-import count is the MODAL baseline value rather than the last.
//
// 2. THE STALE-READ DEFINITION WAS WRONG. Reads returning the pre-import count
//    DURING an import are CORRECT ISOLATION if the import is atomic, not
//    staleness; flagging them produced a false positive on an undisrupted run.
//    True staleness is the old count returned AFTER the import completes, which
//    is what this now detects. The consequence is worth carrying into the
//    ruling: during the window, a healthy atomic import and a stale bookmark are
//    INDISTINGUISHABLE by count alone. Separating them needs open item 2
//    (transaction vs compensating replay), so one run answers both.

// Phase 0 ANALYSIS — reduces a probe log to the experiment's deliverables.
//
//   node scripts/d1-window-analyze.mjs <probe.jsonl> --expect-final=1957340 [--import-start=<ms>] [--import-end=<ms>]
//
// STALE-READ DETECTION REQUIRES --import-start/--import-end. Before the import the
// pre-import count IS the correct answer, so a stale read is indistinguishable from a
// healthy one without knowing when the import was in flight. fail and queue are
// detectable without them.
import { readFileSync } from 'node:fs';

const arg = (k, d) => { const m = process.argv.find((a) => a.startsWith(`--${k}=`)); return m ? m.slice(k.length + 3) : d; };
const FILE = process.argv[2];
const EXPECT = Number(arg('expect-final', 'NaN'));
const IMP_S = arg('import-start') ? Number(arg('import-start')) : null;
const IMP_E = arg('import-end') ? Number(arg('import-end')) : null;
const SLOW_FACTOR = Number(arg("slow-factor", "10"));
const SLOW_FLOOR_MS = Number(arg("slow-floor-ms", "1000"));
if (!FILE) { console.error('usage: node scripts/d1-window-analyze.mjs <probe.jsonl> --expect-final=N'); process.exit(1); }

const s = readFileSync(FILE, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
s.sort((a, b) => a.dispatchTs - b.dispatchTs);
const pct = (a, p) => { if (!a.length) return null; const v = [...a].sort((x, y) => x - y); return v[Math.min(v.length - 1, Math.floor(p * v.length))]; };

// The window edges are each uncertain by up to one sampling gap, so the bound is
// the LARGEST observed gap, not a constant. This field used to emit a hardcoded
// 1000, which understated a 200 ms run by 5x in output that gets pasted into docs.
// Observed rather than the configured --interval: the probe achieved 197-218 ms
// against a 200 ms setting, so the configured value is a claim and this is a
// measurement.
const gaps = [];
for (let i = 1; i < s.length; i++) gaps.push(s[i].dispatchTs - s[i - 1].dispatchTs);
const gapP50 = gaps.length ? pct(gaps, 0.5) : null;
const gapMax = gaps.length ? Math.max(...gaps) : null;

// Baseline: successful samples strictly BEFORE the import began. If the window is not
// supplied, fall back to samples before the first anomaly of any kind.
const preIdx = IMP_S !== null ? s.filter((r) => r.dispatchTs < IMP_S) : s.slice(0, Math.max(1, Math.floor(s.length * 0.2)));
const baseOk = preIdx.filter((r) => r.outcome === 'ok');
const baseLat = baseOk.map((r) => r.latencyMs);
const baseline = { samples: baseOk.length, p50: pct(baseLat, 0.5), p95: pct(baseLat, 0.95), max: baseLat.length ? Math.max(...baseLat) : null };
// MODAL, not last: one straggler in the baseline must not set the pre-import count.
const tally = new Map();
for (const r of baseOk) tally.set(r.count, (tally.get(r.count) || 0) + 1);
const preCount = baseOk.length ? [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;
// MEDIAN-based with an absolute floor. p95 over a small baseline is destroyed by a
// single slow straggler, which would silently disable queue detection.
const slowThreshold = baseline.p50 != null ? Math.max(baseline.p50 * SLOW_FACTOR, SLOW_FLOOR_MS) : Infinity;

const inWindow = (r) => (IMP_S === null || r.dispatchTs >= IMP_S) && (IMP_E === null || r.dispatchTs <= IMP_E);
const anomalies = [];
for (const r of s) {
  if (r.dispatchTs < (IMP_S ?? -Infinity)) continue;
  if (r.outcome === 'error') { anomalies.push({ ...r, kind: 'fail' }); continue; }
  if (r.latencyMs > slowThreshold) { anomalies.push({ ...r, kind: 'queue' }); continue; }
  // STALE-READ is the pre-import count returned AFTER the import completed. During the
  // import, returning the old count is CORRECT if the import is atomic, so it is not an
  // anomaly. Disambiguating those two requires open item 2 (transaction vs replay).
  if (IMP_E !== null && r.dispatchTs > IMP_E && preCount !== null && r.count === preCount && EXPECT !== preCount) {
    anomalies.push({ ...r, kind: "stale-read" });
  }
}
const modes = [...new Set(anomalies.map((a) => a.kind))];
const tDegrade = anomalies.length ? anomalies[0].dispatchTs : null;
let tRecover = null;
if (tDegrade !== null) {
  for (const r of s) {
    if (r.dispatchTs <= tDegrade) continue;
    if (r.outcome === 'ok' && r.latencyMs <= slowThreshold && (Number.isNaN(EXPECT) || r.count === EXPECT)) { tRecover = r.dispatchTs; break; }
  }
}
const iso = (t) => (t === null ? null : new Date(t).toISOString());
console.log(JSON.stringify({
  samples: s.length,
  outcomes: s.reduce((a, r) => ((a[r.outcome] = (a[r.outcome] || 0) + 1), a), {}),
  baselineLatencyMs: baseline,
  slowThresholdMs: slowThreshold === Infinity ? null : slowThreshold,
  preImportCount: preCount, expectedFinalCount: Number.isNaN(EXPECT) ? null : EXPECT,
  modesDetected: modes.length ? modes : ['none'],
  anomalyCount: anomalies.length,
  firstAnomaly: anomalies.length ? { kind: anomalies[0].kind, at: iso(anomalies[0].dispatchTs), error: anomalies[0].error, latencyMs: anomalies[0].latencyMs, count: anomalies[0].count } : null,
  tDegrade: iso(tDegrade), tRecover: iso(tRecover),
  windowMs: tDegrade !== null && tRecover !== null ? tRecover - tDegrade : null,
  observedSampleIntervalMs: { p50: gapP50, max: gapMax },
  windowBoundedBySampleIntervalMs: gapMax,
  staleDetectionEnabled: IMP_S !== null && IMP_E !== null,
}, null, 2));
