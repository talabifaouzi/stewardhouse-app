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
  // D2 (P-2): onTrack as a DIRECT set count — |lessons>0 ∧ gpsCompleted ∧
  // ¬certified|. Replaces a prior subtraction of two overlapping counts, which
  // over/under-counted whenever a certified athlete lacked GPS. No certified⟹gps
  // enforcement — this is a pure set count. `stalled` is retained (it feeds the
  // "Not yet active" tile).
  const onTrack = athletes.filter((a) => a.lessons > 0 && a.gpsCompleted && !a.certified).length;
  const stalled = athletes.filter((a) => a.lessons > 0 && !a.gpsCompleted).length;
  const notStarted = athletes.filter((a) => a.lessons === 0).length;
  const tGi = athletes.reduce((s, a) => s + a.gifts, 0);
  const athletesWithGifts = athletes.filter((a) => a.gifts > 0).length;

  // FORK 1 (P-2): progression RATES cover only institution-writable athletes —
  // those who claimed AND delegated record-keeping to staff (exactly the
  // predicate the PUT /api/athletes/:id gate enforces). A non-writable athlete's
  // zeros are "not staff-writable", not "0% achieved", so counting them in the
  // denominator dilutes the rate falsely. `consentAware` is TRUE only on the
  // authenticated tree (roster elements carry a boolean `claimed`); the demo
  // tree (fixtures omit `claimed`) collapses rateBase to the full roster, so
  // every EXISTING field's value is byte-identical to the pre-FORK-1 behavior.
  // Full-roster COUNTS above are unchanged — they feed the tiles; only the rates
  // switch denominator.
  const isWritable = (a) => a.claimed === true && a.managementMode === 'delegated';
  const consentAware = athletes.some((a) => typeof a.claimed === 'boolean');
  const rateBase = consentAware ? athletes.filter(isWritable) : athletes;
  const rateBaseTotal = rateBase.length;
  const writable = athletes.filter(isWritable).length;

  // Rate-scoped numerators over rateBase (Stage D renders "{rateGps} of
  // {rateBaseTotal}"). rateActive = certified ∪ onTrack-predicate (disjoint).
  const rateGps = rateBase.filter((a) => a.gpsCompleted).length;
  const rateCert = rateBase.filter((a) => a.certified).length;
  const rateActive = rateBase.filter((a) => a.certified || (a.lessons > 0 && a.gpsCompleted && !a.certified)).length;

  // R4: rateBaseTotal === 0 → rates are NULL ("Not tracked" in Stage D), NEVER
  // 0% (which would read as a real "nobody progressed" measurement).
  const gpsRate = rateBaseTotal ? Math.round((rateGps / rateBaseTotal) * 100) : null;
  const certRate = rateBaseTotal ? Math.round((rateCert / rateBaseTotal) * 100) : null;
  const activelyProgressingPct = rateBaseTotal ? Math.round((rateActive / rateBaseTotal) * 100) : null;

  return {
    tot, gpsD, certD, stalled, onTrack, notStarted,
    tGi, athletesWithGifts, gpsRate, activelyProgressingPct, certRate,
    // FORK 1 additions — consumed by the Stage D disclosure (auth tree only).
    writable, consentAware, rateBaseTotal, rateGps, rateCert, rateActive,
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
