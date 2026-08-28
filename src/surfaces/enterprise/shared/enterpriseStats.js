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

  // ENUMERATION (ruled 2026-08-28): the disclosure names individual exclusion
  // reasons with counts rather than one generic clause, so the excluded
  // population is counted per reason here.
  //
  // Buckets are computed over SAVED rows ONLY. A staged import row carries
  // `uncommitted: true` (AthletesContext.jsx stageImport) and has never been
  // written to D1, so counting it would report a database population that does
  // not exist — and the count would move as the operator drops rows during
  // review. `staged` is emitted beside the buckets so a consumer that needs to
  // say so can, without re-deriving it. It is independent of consentAware and
  // is always a number.
  //
  // GATED ON consentAware, emitting NULL rather than 0. When consentAware is
  // false no element carries `claimed` at all, so `a.claimed !== true` is true
  // of every athlete and ALL of them fall into invitedUnclaimed — a statement
  // that is false about every one of them. The counts are not a measurement of
  // zero, they are the ABSENCE of a measurement, so they emit null on exactly
  // the reasoning R4 applies to a zero-denominator rate (:94-98) and FORK 3
  // applies to the unsourced gift counter. A consumer that renders a bucket
  // must handle null; RateDisclosure's gate below refuses null explicitly
  // rather than leaning on `null <= 0` coercing true.
  //
  // The four are pairwise disjoint: the claimed/unclaimed split is exhaustive,
  // unclaimed splits on `status`, and claimed-not-delegated splits on
  // managementMode null vs 'self'.
  //
  // RESIDUAL, stated rather than guarded: management_mode carries NO CHECK
  // constraint (migration 0015 is a bare ADD COLUMN, and 0015:14 says so — the
  // gate is deny-by-default against any unknown value). A claimed athlete
  // holding some third value would be non-writable and would land in no bucket,
  // making excludedTotal UNDER-count, never over-count. It is unreachable
  // through any endpoint: the three writers are athlete-consent.js:67 (behind
  // the ALLOWED_MODES check at :61), athletes.js:204 and athletes/[id].js:135,
  // and the latter two write null. Only a direct DB write could produce it.
  const staged = athletes.filter((a) => a.uncommitted === true).length;
  const saved = athletes.filter((a) => a.uncommitted !== true);
  const bucket = (pred) => (consentAware ? saved.filter(pred).length : null);
  const notInvited = bucket((a) => a.status === 'pending' && a.claimed !== true);
  const invitedUnclaimed = bucket((a) => a.status !== 'pending' && a.claimed !== true);
  const claimedNoMode = bucket((a) => a.claimed === true && a.managementMode == null);
  const selfManaged = bucket((a) => a.claimed === true && a.managementMode === 'self');
  const excludedTotal = consentAware
    ? notInvited + invitedUnclaimed + claimedNoMode + selfManaged
    : null;

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
    // ENUMERATION additions — per-reason exclusion counts over SAVED rows.
    // The four buckets and excludedTotal are NULL when !consentAware; `staged`
    // is always a number.
    staged, notInvited, invitedUnclaimed, claimedNoMode, selfManaged, excludedTotal,
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
