// Enterprise metric derivations — PURE FUNCTIONS over an injected athlete
// array (E-Slice 6a). No module-level fixture import: callers pass their own
// roster (demo tree → fixture athletes via AthletesProvider; authenticated
// tree → [] until the roster-add write path lands). Every rate guards
// division-by-zero (empty roster → 0, never NaN); engagement bounds guard the
// empty spread (never Infinity / -Infinity from Math.min()/Math.max()).
//
// Before 6a these were module-level consts computed once over the fixture. The
// values for the fixture roster are unchanged — computeStats(fixtureAthletes)
// reproduces the pre-refactor numbers exactly (verified byte-identical).

export function computeStats(athletes) {
  const tot = athletes.length;
  const gpsD = athletes.filter((a) => a.gpsCompleted).length;
  const certD = athletes.filter((a) => a.certified).length;
  // Internal: in-progress (started, not yet certified). Not returned — only
  // feeds onTrack, mirroring the pre-refactor private `inProg`.
  const inProg = athletes.filter((a) => a.lessons > 0 && !a.certified).length;
  const stalled = athletes.filter((a) => a.lessons > 0 && !a.gpsCompleted).length;
  const onTrack = inProg - stalled;
  const notStarted = athletes.filter((a) => a.lessons === 0).length;
  const tGi = athletes.reduce((s, a) => s + a.gifts, 0);
  const athletesWithGifts = athletes.filter((a) => a.gifts > 0).length;
  const gpsRate = tot ? Math.round((gpsD / tot) * 100) : 0;
  const activelyProgressingPct = tot ? Math.round(((certD + onTrack) / tot) * 100) : 0;
  const certRate = tot ? Math.round((certD / tot) * 100) : 0;
  return {
    tot, gpsD, certD, stalled, onTrack, notStarted,
    tGi, athletesWithGifts, gpsRate, activelyProgressingPct, certRate,
  };
}

// Guarded min/max for the engagement BarChart aria bounds. Empty timeline →
// { min: 0, max: 0 } (Math.min()/Math.max() over an empty spread would return
// Infinity / -Infinity and poison the aria label).
export function engagementBounds(timeline) {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return { min: 0, max: 0 };
  }
  return { min: Math.min(...timeline), max: Math.max(...timeline) };
}
