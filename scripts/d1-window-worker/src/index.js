// D1 IMPORT-WINDOW EXPERIMENT - PROBE WORKER
//
// Option B of the experiment recorded in section 12 of
// `docs/bmf-load-scoping.md`. Reads through the `env.DB` BINDING rather than the
// public `/query` REST path, because the binding is what section 1's blast radius
// is about: every Pages Function in this project reaches D1 the same way.
//
// PHASE 2 (deploy) and PHASES 3-5 (the run).
// RUN: [FT-only] to deploy. Local `wrangler dev` against this config is
// [agent-ok] and touches no remote resource.
//
// TORN DOWN. This Worker and the `bmf-window-probe` database were both DELETED
// on 2026-08-19. Section 11 of that doc records the teardown as DISCHARGED.
//
// NO AUTH, NO GATE, deliberately. It reads synthetic rows in a throwaway store
// and holds nothing worth gating. It must never be bound to `stewardhouse-pilot`.
//
// RETURNS 200 WITH `{ok:false}` ON A D1 FAILURE, NOT A 5xx. The probe cannot
// distinguish a 5xx from network trouble, and separating "the database refused"
// from "the request never arrived" is the whole point of the measurement. This
// would be the wrong choice for a product endpoint; it is right for an
// instrument.

const SQL = 'SELECT count(*) AS n FROM bmf';

function json(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export default {
  async fetch(request, env) {
    const serverTs = new Date().toISOString();
    const serverTsMs = Date.now();
    const t0 = Date.now();
    try {
      const res = await env.DB.prepare(SQL).all();
      const n = res?.results?.[0]?.n;
      return json({
        ok: true,
        count: n === undefined || n === null ? null : Number(n),
        serverTs,
        serverTsMs,
        workerMs: Date.now() - t0,
        d1: res?.meta ? { duration: res.meta.duration ?? null, rowsRead: res.meta.rows_read ?? null } : null,
        error: null,
      });
    } catch (e) {
      return json({
        ok: false,
        count: null,
        serverTs,
        serverTsMs,
        workerMs: Date.now() - t0,
        d1: null,
        error: String((e && e.message) || e),
      });
    }
  },
};
