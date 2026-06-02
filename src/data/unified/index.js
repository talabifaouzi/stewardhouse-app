// Public read API for the unified data layer.
//
// Imports the assembled store from ./assemble.js (which runs the three
// adapters + synthetic seed eagerly at module load and wires the deferred
// FKs) and exposes both direct entity-array access and a small set of
// query helpers.
//
// Consumers import this module as the single entry point:
//
//   import unified from '../../data/unified/index.js';
//   unified.persons                            → Array<Person>
//   unified.institutions                       → Array<Institution>
//   unified.advisorPractices                   → Array<AdvisorPractice>
//   unified.programParticipations              → Array<ProgramParticipation>
//   unified.gifts                              → Array<Gift>
//   unified.orgs                               → Array<Org>
//   unified.cohorts                            → Array<Cohort>
//   unified.connectionRequests                 → Array<ConnectionRequest>
//   unified.issues                             → Array<Issue>
//
//   unified.personsBy({type, sourceSurface})   → Array<Person> (both filters optional)
//   unified.participationsByContext(contextId) → Array<ProgramParticipation>
//   unified.giftsByGiver(personId)             → Array<Gift>
//   unified.countBy(entityName, predicate?)    → number
//   unified.byId(entityName, id)               → record | null
//
// AGGREGATE-DEFAULT — landing data for the Operations Overview:
//   unified.connectionFunnel()                 → {matched, viewed, connected, conversing, gave, ongoing}
//                                                CUMULATIVE-REACHED counts (non-increasing).
//   unified.connectionFunnelBy({sourceSurface})→ same shape, filtered by sourceSurface.
//   unified.pilotMetrics()                     → conversion + dollars-at-gave + median-days rollup.
//
//   unified.openIssueCount()                   → number  (status === 'open')
//   unified.openIssues()                       → Array<Issue>  sorted openedAt desc
//   unified.issueCountByStatus()               → {open, 'in-progress', resolved}
//   unified.issueCountByCategory()             → {support, 'data-integrity', onboarding,
//                                                'content-review', connection}
//
//   unified.recentActivity({limit})            → Array<ActivityItem>  sorted timestamp desc
//                                                Derived projection over existing records
//                                                (CR stage transitions + Issue events).
//                                                Default limit = 8.
//
// RECORD-LEVEL — separate explicit queries, NOT default landing data:
//   unified.connectionsByGiver(personId)       → Array<ConnectionRequest>
//   unified.connectionsByTarget(orgIdOrName)   → Array<ConnectionRequest>

import { assembledStore } from './assemble.js';

const {
  persons,
  institutions,
  advisorPractices,
  programParticipations,
  gifts,
  orgs,
  cohorts,
  connectionRequests,
  issues,
} = assembledStore;

const ENTITY_MAP = {
  persons,
  institutions,
  advisorPractices,
  programParticipations,
  gifts,
  orgs,
  cohorts,
  connectionRequests,
  issues,
};

// Stage order — descriptive lifecycle, no scoring or ranking.
const FUNNEL_STAGES = ['matched', 'viewed', 'connected', 'conversing', 'gave', 'ongoing'];

// Compute cumulative-reached funnel counts from an array of CRs. Each later
// stage is a subset of all earlier stages (a CR at 'connected' has reached
// 'matched' AND 'viewed' AND 'connected'). Counts are non-increasing
// across FUNNEL_STAGES.
function computeFunnel(crs) {
  const reached = { matched: 0, viewed: 0, connected: 0, conversing: 0, gave: 0, ongoing: 0 };
  for (const cr of crs) {
    for (const stage of FUNNEL_STAGES) {
      if (cr.stageTimestamps[`${stage}At`] !== null) reached[stage] += 1;
    }
  }
  return reached;
}

function divOrNull(num, denom) {
  return denom === 0 ? null : num / denom;
}

// ---------------------------------------------------------------------------
// Activity projection helpers (Slice E)
// ---------------------------------------------------------------------------

// CR stages signal-worthy for the recent-activity feed. matched/viewed are
// suppressed (too noisy — every funder matches and views continuously).
const CR_SIGNAL_STAGES = ['connected', 'conversing', 'gave', 'ongoing'];

// O(1) lookup indexes for the projection's name + amount resolution.
const _personsById = new Map(persons.map((p) => [p.id, p]));
const _giftsById   = new Map(gifts.map((g) => [g.id, g]));

// Map a Person.sourceSurface to the activity-feed surface label. Synthetic
// individuals map to 'Individual' (their conceptual surface).
function surfaceForPersonSource(src) {
  if (src === 'enterprise') return 'Enterprise';
  if (src === 'advisor')    return 'Advisor';
  return 'Individual'; // 'individual' | 'synthetic'
}

// Map an Issue's relatedEntity to the activity-feed surface label.
function surfaceForIssue(issue) {
  const t = issue.relatedEntityType;
  if (t === 'advisorPractice') return 'Advisor';
  if (t === 'institution')     return 'Enterprise';
  if (t === 'person') {
    const p = _personsById.get(issue.relatedEntityId);
    return p ? surfaceForPersonSource(p.sourceSurface) : 'Operations';
  }
  // 'org' or null → Operations (org work and platform-level both internal)
  return 'Operations';
}

// Build an ActivityItem for one CR stage transition. The 'gave' description
// looks up Gift.amount via cr.giftId (single-source dedup rule); unified.gifts
// is NEVER iterated for activity events. Every Gift in the current seed has
// a corresponding CR — a future Gift without a CR would be missed by this
// projection. That's the documented assumption.
function buildCrEvent(cr, stage) {
  const ts = cr.stageTimestamps[`${stage}At`];
  const giver = _personsById.get(cr.giverPersonId);
  // assemble.runChecks guarantees giver resolves; defensive fallback if not.
  const giverName  = giver ? giver.name : '(unknown person)';
  const targetName = cr.targetOrgName || '(unknown org)';
  let description;
  if (stage === 'connected') {
    description = `${giverName} opted to connect with ${targetName}`;
  } else if (stage === 'conversing') {
    description = `${giverName} is in correspondence with ${targetName}`;
  } else if (stage === 'gave') {
    const gift = _giftsById.get(cr.giftId);
    const amount = gift && typeof gift.amount === 'number' ? gift.amount : null;
    description = amount === null
      ? `${giverName} gave to ${targetName}`
      : `${giverName} gave $${amount.toLocaleString()} to ${targetName}`;
  } else { // 'ongoing'
    description = `${giverName}'s connection with ${targetName} is ongoing`;
  }
  return {
    timestamp: ts,
    surface: giver ? surfaceForPersonSource(giver.sourceSurface) : 'Operations',
    description,
    relatedEntityType: 'person',
    relatedEntityId: cr.giverPersonId,
    sourceEventType: `cr-${stage}`,
  };
}

function buildIssueEvent(issue, kind) {
  const ts = kind === 'opened' ? issue.openedAt : issue.resolvedAt;
  return {
    timestamp: ts,
    surface: surfaceForIssue(issue),
    description: kind === 'opened'
      ? `Issue opened: ${issue.summary}`
      : `Issue resolved: ${issue.summary}`,
    relatedEntityType: issue.relatedEntityType,
    relatedEntityId: issue.relatedEntityId,
    sourceEventType: `issue-${kind}`,
  };
}

const unified = {
  persons,
  institutions,
  advisorPractices,
  programParticipations,
  gifts,
  orgs,
  cohorts,
  connectionRequests,
  issues,

  personsBy({ type, sourceSurface } = {}) {
    return persons.filter(
      (p) =>
        (type === undefined || p.type === type) &&
        (sourceSurface === undefined || p.sourceSurface === sourceSurface),
    );
  },

  participationsByContext(contextId) {
    return programParticipations.filter((pp) => pp.contextId === contextId);
  },

  giftsByGiver(personId) {
    return gifts.filter((g) => g.giverPersonId === personId);
  },

  countBy(entityName, predicate) {
    const arr = ENTITY_MAP[entityName];
    if (!arr) throw new Error(`unknown entity: ${entityName}`);
    return predicate ? arr.filter(predicate).length : arr.length;
  },

  byId(entityName, id) {
    const arr = ENTITY_MAP[entityName];
    if (!arr) throw new Error(`unknown entity: ${entityName}`);
    return arr.find((r) => r.id === id) || null;
  },

  // -- AGGREGATE-DEFAULT — default landing data for the Operations Overview --

  /**
   * Cumulative-reached funnel counts. Each later stage is a subset of all
   * earlier stages; values are non-increasing across the FUNNEL_STAGES order.
   * reached.matched === connectionRequests.length (every CR has at least
   * reached the 'matched' stage).
   *
   * @returns {{matched: number, viewed: number, connected: number,
   *           conversing: number, gave: number, ongoing: number}}
   */
  connectionFunnel() {
    return computeFunnel(connectionRequests);
  },

  connectionFunnelBy({ sourceSurface } = {}) {
    const filtered = sourceSurface === undefined
      ? connectionRequests
      : connectionRequests.filter((cr) => cr.sourceSurface === sourceSurface);
    return computeFunnel(filtered);
  },

  /**
   * Pilot-metric rollups. Conversions are on the CUMULATIVE-REACHED basis:
   *   conversionMatchedToGave   = reachedGave   / reachedMatched
   *   conversionConnectedToGave = reachedGave   / reachedConnected
   * Returns null for any conversion where the denominator is 0.
   *
   * totalDollarsAtGave sums Gift.amount across the Gifts anchored by CRs at
   * stage 'gave' or 'ongoing' (skipping any null amount). medianDaysMatchedToGave
   * is computed from the stageTimestamps of CRs that have reached 'gave';
   * null when fewer than 5 such CRs exist.
   *
   * distinctOrgsAtGave is the count of unique recipient orgs across CRs at
   * 'gave'/'ongoing'. Key: targetOrgId when present, else `name:${targetOrgName}`.
   * Pure aggregate — no record list exposed (record-level access stays in
   * connectionsByTarget).
   */
  pilotMetrics() {
    const reached = computeFunnel(connectionRequests);
    const totalIndividuals = persons.filter((p) => p.type === 'individual').length;

    // Sum dollars at gave + collect distinct target orgs + dwell samples in one pass.
    const giftById = new Map(gifts.map((g) => [g.id, g]));
    let totalDollarsAtGave = 0;
    const matchedToGaveDwells = [];
    const orgKeysAtGave = new Set();
    for (const cr of connectionRequests) {
      if (cr.stage !== 'gave' && cr.stage !== 'ongoing') continue;
      if (cr.giftId !== null) {
        const g = giftById.get(cr.giftId);
        if (g && typeof g.amount === 'number') totalDollarsAtGave += g.amount;
      }
      const { matchedAt, gaveAt } = cr.stageTimestamps;
      if (matchedAt !== null && gaveAt !== null) {
        matchedToGaveDwells.push(daysBetween(matchedAt, gaveAt));
      }
      orgKeysAtGave.add(cr.targetOrgId || `name:${cr.targetOrgName}`);
    }

    return {
      totalIndividuals,
      matchedCount: reached.matched,
      viewedCount: reached.viewed,
      connectedCount: reached.connected,
      conversingCount: reached.conversing,
      gaveCount: reached.gave,
      ongoingCount: reached.ongoing,
      conversionMatchedToGave: divOrNull(reached.gave, reached.matched),
      conversionConnectedToGave: divOrNull(reached.gave, reached.connected),
      medianDaysMatchedToGave:
        matchedToGaveDwells.length < 5 ? null : median(matchedToGaveDwells),
      totalDollarsAtGave,
      distinctOrgsAtGave: orgKeysAtGave.size,
    };
  },

  // -- RECORD-LEVEL — explicit queries, never the default landing data --

  connectionsByGiver(personId) {
    return connectionRequests.filter((cr) => cr.giverPersonId === personId);
  },

  connectionsByTarget(orgIdOrName) {
    return connectionRequests.filter(
      (cr) => cr.targetOrgId === orgIdOrName || cr.targetOrgName === orgIdOrName,
    );
  },

  // -- Issue queries — operator access; list exposure is purposeful --

  openIssueCount() {
    return issues.filter((i) => i.status === 'open').length;
  },

  /**
   * Open issues sorted by openedAt descending (newest first). Operator
   * access — record-level exposure is intentional for the Open-issues
   * card in the next slice. Returned records are the assembled-store
   * objects directly; callers should treat them as read-only.
   */
  openIssues() {
    return issues
      .filter((i) => i.status === 'open')
      .slice()
      .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  },

  issueCountByStatus() {
    const counts = { open: 0, 'in-progress': 0, resolved: 0 };
    for (const i of issues) {
      if (i.status in counts) counts[i.status] += 1;
    }
    return counts;
  },

  issueCountByCategory() {
    const counts = {
      support: 0, 'data-integrity': 0, onboarding: 0, 'content-review': 0, connection: 0,
    };
    for (const i of issues) {
      if (i.category in counts) counts[i.category] += 1;
    }
    return counts;
  },

  // -- Activity projection (Slice E) — derived feed --

  /**
   * Recent platform-activity feed — a sorted-desc projection over existing
   * records' real timestamps. Pure: derives entirely from the assembled
   * store; emits NO new records, creates no profiles.
   *
   * Sources (per spec): CR stage transitions at connected/conversing/gave/
   * ongoing (skipping matched/viewed as noise), plus Issue opened/resolved
   * events. Gifts are deduped via the CR 'gave' transition (each anchored
   * Gift surfaces exactly once via its CR; unified.gifts is never iterated).
   *
   * Descriptions name participants/orgs from real records' .name fields
   * verbatim — never fabricated, never a new variant.
   *
   * Sort: timestamp DESC, then sourceEventType ASC, then underlying record
   * id ASC — fully deterministic across runs.
   *
   * @param {{ limit?: number }} [opts]  Default limit = 8.
   * @returns {Array<import('./types.js').ActivityItem>}
   */
  recentActivity({ limit = 8 } = {}) {
    const pairs = []; // [item, sourceRecordId] for stable tie-break

    // CR stage events.
    for (const cr of connectionRequests) {
      for (const stage of CR_SIGNAL_STAGES) {
        if (cr.stageTimestamps[`${stage}At`] === null) continue;
        pairs.push([buildCrEvent(cr, stage), cr.id]);
      }
    }

    // Issue events — opened always; resolved when applicable.
    for (const it of issues) {
      pairs.push([buildIssueEvent(it, 'opened'), it.id]);
      if (it.resolvedAt !== null) {
        pairs.push([buildIssueEvent(it, 'resolved'), it.id]);
      }
    }

    // Sort timestamp DESC; tie-break sourceEventType ASC then record id ASC.
    pairs.sort((a, b) => {
      const cmpTs = b[0].timestamp.localeCompare(a[0].timestamp);
      if (cmpTs !== 0) return cmpTs;
      const cmpType = a[0].sourceEventType.localeCompare(b[0].sourceEventType);
      if (cmpType !== 0) return cmpType;
      return a[1].localeCompare(b[1]);
    });

    return pairs.slice(0, limit).map(([item]) => item);
  },
};

// -----------------------------------------------------------------------------
// Local helpers (kept private to the read API)
// -----------------------------------------------------------------------------

// Days between two ISO YYYY-MM-DD dates, b minus a. Pure: uses Date.UTC for
// numeric arithmetic only (no string-parse timezone shifts).
function daysBetween(aIso, bIso) {
  const [ay, am, ad] = aIso.split('-').map(Number);
  const [by, bm, bd] = bIso.split('-').map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / 86_400_000);
}

function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export default unified;
