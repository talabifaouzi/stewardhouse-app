// D1 IMPORT-WINDOW EXPERIMENT - READ PROBE
//
// Part of the experiment recorded in section 12 of `docs/bmf-load-scoping.md`.
// Samples a database while an import runs, so the window can be bounded and its
// mode classified.
//
// PHASES 3-5 (baseline, import, tail).
// RUN: [FT-only]. `--mode=cli` spawns `wrangler d1 execute --remote`, and
// `--mode=http` reads a remotely-bound Worker. Both are remote reads and fall
// under the account-tied remote protocol in CLAUDE.md §6.15.
//
// Target the THROWAWAY database only. No step of this experiment names
// `stewardhouse-pilot`.

// Phase 0 PROBE — fixed-schedule, FIRE-AND-FORGET reader.
//
// NOT a serial loop, deliberately. If reads QUEUE, a serial loop blocks on the first
// queued read exactly when the window opens, stops sampling, and cannot time recovery.
// Here setInterval dispatches on schedule regardless of what is still in flight, so
// overlapping calls are expected and recovery is observable.
//
// Query is SELECT count(*) FROM bmf, something that CHANGES (0 -> 1957340). A constant
// query such as SELECT 1 cannot detect a stale-bookmark read, which is a third possible
// outcome alongside queue and fail.
//
//   node scripts/d1-window-probe.mjs --mode=http --url=https://... --out=probe.jsonl [--interval=1000] [--duration=0]
//   node scripts/d1-window-probe.mjs --mode=cli  --db=bmf-window-probe --out=probe.jsonl
import { createWriteStream } from 'node:fs';
import { spawn } from 'node:child_process';

const arg = (k, d) => { const m = process.argv.find((a) => a.startsWith(`--${k}=`)); return m ? m.slice(k.length + 3) : d; };
const MODE = arg('mode', 'http'), URL_ = arg('url'), DB = arg('db');
const OUT = arg('out'), INTERVAL = Number(arg('interval', '1000')), DURATION = Number(arg('duration', '0'));
const SQL = 'SELECT count(*) AS n FROM bmf';
if (!OUT) { console.error('--out required'); process.exit(1); }
if (MODE === 'http' && !URL_) { console.error('--url required for http mode'); process.exit(1); }
if (MODE === 'cli' && !DB) { console.error('--db required for cli mode'); process.exit(1); }

const log = createWriteStream(OUT, { flags: 'a' });
let seq = 0, inFlight = 0, done = 0;

function record(o) { log.write(JSON.stringify(o) + '\n'); }

async function viaHttp() {
  const res = await fetch(URL_, { headers: { accept: 'application/json' } });
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  let j; try { j = JSON.parse(body); } catch { throw new Error(`unparseable: ${body.slice(0, 200)}`); }
  const n = j.count ?? j.n ?? j?.result?.[0]?.results?.[0]?.n;
  if (n === undefined) throw new Error(`no count in: ${body.slice(0, 200)}`);
  return Number(n);
}

function viaCli() {
  return new Promise((resolve, reject) => {
    const p = spawn('npx', ['wrangler', 'd1', 'execute', DB, '--remote', '--command', SQL, '--json'],
      { shell: true, windowsHide: true });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => {
      if (code !== 0) return reject(new Error(`exit ${code}: ${(err || out).slice(0, 200)}`));
      try {
        const j = JSON.parse(out.slice(out.indexOf('[')));
        resolve(Number(j[0].results[0].n));
      } catch (e) { reject(new Error(`unparseable: ${out.slice(0, 200)}`)); }
    });
  });
}

function dispatch() {
  const s = ++seq, dispatchTs = Date.now();
  inFlight++;
  (MODE === 'http' ? viaHttp() : viaCli())
    .then((count) => {
      const returnTs = Date.now();
      record({ seq: s, dispatchTs, returnTs, latencyMs: returnTs - dispatchTs, outcome: 'ok', count, error: null });
    })
    .catch((e) => {
      const returnTs = Date.now();
      record({ seq: s, dispatchTs, returnTs, latencyMs: returnTs - dispatchTs, outcome: 'error', count: null, error: String(e.message || e) });
    })
    .finally(() => { inFlight--; done++; });
}

const timer = setInterval(dispatch, INTERVAL);
dispatch();
const stop = () => {
  clearInterval(timer);
  const wait = setInterval(() => {
    if (inFlight === 0) { clearInterval(wait); log.end(() => { console.error(`probe stopped: ${done} samples -> ${OUT}`); process.exit(0); }); }
  }, 100);
};
process.on('SIGINT', stop);
if (DURATION > 0) setTimeout(stop, DURATION);
