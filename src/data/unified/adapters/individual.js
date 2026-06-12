// -----------------------------------------------------------------------------
// Unified data layer — individual adapter
//
// Pure function: reads individualProfile.js + orgsData.js, returns unified-
// shape records conforming to ../types.js. Tags every record sourceSurface:
// 'individual'. Emits in source order. Does not mutate source fixtures.
//
// Entity-boundary placement (per slice 4 decision A):
// - Person.extensions.individual holds BOTH identifying fields (sport, level,
//   geoDetail) AND giving-identity fields (causes, visibility, budget,
//   givingStyle, givingPlanStatement, worldLabel). Individual surface has no
//   ProgramParticipation context — Marcus self-reports during intake, so the
//   data belongs on Person. This is intentional per-source divergence from
//   the advisor adapter (which puts givingPlan on ProgramParticipation
//   because advisor data is a relationship artifact, not self-report).
//   Different concepts, different placements.
// - The Person.extensions doc comment in types.js currently says "identifying
//   fields only" — this is now contradicted by individual's richer bag.
//   Follow-up doc-comment update is needed; flagged in the review.
//
// Gift dates (per slice 4 adjustment 1):
// - Source gift.date is free-form 'Month D, YYYY'. We normalize to ISO
//   'YYYY-MM-DD' at the adapter boundary. Format unification is part of
//   shape-normalization (date value preserved, only the format unified) so
//   Gift.date is ISO uniformly across all sources.
// - Direct string assembly from year/month/day components — NO Date object,
//   NO toISOString() — avoids the UTC day-shift the enterprise slice hit
//   with WorkshopCalendar.
//
// Org IDs (per slice 4 adjustment 2):
// - Unscoped `org-{nativeId}` (e.g. org-1). Orgs are a shared catalog
//   cross-referenced by enterprise exclusions at assemble (slice 6),
//   unlike Persons which are deliberately not deduplicated.
//
// FK wiring across entities is DEFERRED to assemble.js (slice 6):
// - Org.isExcludedByInstitutionIds stays [] here. Name-match resolution
//   against enterprise exclusions happens at assemble.
// - Gift.recipientOrgId stays null here. Name-match resolution to Org
//   records (if/when wanted) happens at assemble; source carries org as a
//   name string with no FK.
// -----------------------------------------------------------------------------

import { individualProfile, gifts, givingPlanStatement } from '../../individualProfile.js';
import { ORGS } from '../../orgsData.js';
import { SOURCE_SURFACE } from '../sources.js';

const SOURCE = SOURCE_SURFACE.INDIVIDUAL;

const MONTH_NAMES = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};

function deriveInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/**
 * Parse an individual gift date. Pure function.
 *
 * Recognized shape: 'Month D, YYYY' or 'Month DD, YYYY' (full English month
 * name, day with or without leading zero, 4-digit year).
 *
 * Assembles 'YYYY-MM-DD' directly from components — NO Date object, NO
 * toISOString — to avoid the UTC day-shift the enterprise slice hit when
 * `new Date('2026-09-15').getDate()` returned 14 in US Eastern.
 *
 * @param {string} str
 * @returns {{iso: string|null, parsed: boolean}}
 */
function parseGiftDate(str) {
  if (typeof str !== 'string') return { iso: null, parsed: false };
  const match = str.match(/^([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match) return { iso: null, parsed: false };
  const monthNum = MONTH_NAMES[match[1]];
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (!monthNum || day < 1 || day > 31 || year < 1900) {
    return { iso: null, parsed: false };
  }
  const mm = String(monthNum).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return { iso: `${year}-${mm}-${dd}`, parsed: true };
}

/**
 * Run the individual adapter. Pure: does not mutate source fixtures, returns
 * a fresh bundle each call.
 *
 * @returns {{
 *   persons: Array<Object>,
 *   gifts: Array<Object>,
 *   orgs: Array<Object>,
 *   unparsedGiftDateCount: number,
 * }}
 */
export function adaptIndividual() {
  // Persons (1) — Marcus singleton
  const persons = [
    {
      id: `p-individual-${individualProfile.id}`,
      name: individualProfile.name,
      initials: individualProfile.initials || deriveInitials(individualProfile.name),
      type: 'individual',
      // Individual surface fixture carries no email/phone on profile.
      contact: { email: null, phone: null },
      sourceSurface: SOURCE,
      extensions: {
        individual: {
          // Identifying
          sport: individualProfile.sport,
          level: individualProfile.level,
          geoDetail: individualProfile.geoDetail,
          worldLabel: individualProfile.worldLabel,
          // Giving identity (decision A: lives on Person because individual
          // has no ProgramParticipation context).
          //
          // Causes normalize to a string-ID array here (not the source
          // {id, label} objects) so consumers resolve labels from the CAUSES
          // taxonomy at render time — relabels in intakeData.js propagate
          // without re-shipping the fixture. This also aligns the shape with
          // Org.causes (string IDs) and with IntakeContext, which already
          // maps to IDs for the same reason.
          causes: individualProfile.causes.map((c) => c.id),
          visibility: individualProfile.visibility,
          budget: individualProfile.budget,
          givingStyle: individualProfile.givingStyle,
          givingPlanStatement,
        },
      },
    },
  ];

  // Gifts (3) — from source gifts array, dates normalized to ISO
  let unparsedGiftDateCount = 0;
  const adaptedGifts = gifts.map((g) => {
    const dateResult = parseGiftDate(g.date);
    if (!dateResult.parsed) unparsedGiftDateCount += 1;
    return {
      id: `gift-individual-${g.id}`,
      giverPersonId: `p-individual-${individualProfile.id}`,
      recipientOrgId: null, // source carries org as name string; FK deferred to assemble
      recipientOrgName: g.org,
      amount: g.amount,
      date: dateResult.iso, // ISO via component assembly; null if unparsed
      type: g.type,
      vehicle: g.vehicle,
      recurring: g.recurring,
      sourceSurface: SOURCE,
    };
  });

  // Orgs (17) — unscoped IDs per slice 4 adjustment 2
  const orgs = ORGS.map((o) => ({
    id: `org-${o.id}`,
    name: o.name,
    ein: null, // source has no EIN
    mission: o.mission,
    causes: o.causes,
    geo: o.geo,
    cat: o.cat,
    isExcludedByInstitutionIds: [], // cross-reference happens at assemble
    sourceSurface: SOURCE,
    extensions: {
      individual: {
        years: o.years,
        // foundedYear added for the Candid-aligned Organization detail page
        // ("Founded {YYYY}" line). `years` stays untouched for the existing
        // individual-surface Discover view consumer; the two should be kept
        // in lockstep until Discover migrates onto foundedYear.
        foundedYear: o.foundedYear,
        led: o.led,
        badge: o.badge,
        ed: o.ed,
        boardSize: o.boardSize,
        budget: o.budget,
        programs: o.programs,
        topFunders: o.topFunders,
        demo: o.demo,
      },
    },
  }));

  return {
    persons,
    gifts: adaptedGifts,
    orgs,
    unparsedGiftDateCount,
  };
}

/**
 * Sanity assertions over an adapter bundle (or a fresh adapter run).
 * Returns {pass, errors[], expected{}, actual{}}.
 *
 * Hard checks (failure = adapter bug):
 * - persons, gifts, orgs counts.
 * - every gift.giverPersonId resolves to a Person in this bundle (orphan check).
 * - every gift.date is valid ISO YYYY-MM-DD.
 * - parseGiftDate self-test exercises a known input.
 */
export function runChecks(adapted) {
  const bundle = adapted || adaptIndividual();

  const expected = {
    persons: 1,
    gifts: 3,
    orgs: 17,
    unparsedGiftDateCount: 0,
  };
  const actual = {
    persons: bundle.persons.length,
    gifts: bundle.gifts.length,
    orgs: bundle.orgs.length,
    unparsedGiftDateCount: bundle.unparsedGiftDateCount,
  };

  const errors = [];
  for (const key of Object.keys(expected)) {
    if (actual[key] !== expected[key]) {
      errors.push(`${key}: expected ${expected[key]}, got ${actual[key]}`);
    }
  }

  // Gift orphan check: every gift.giverPersonId must resolve to a Person.
  const personIds = new Set(bundle.persons.map((p) => p.id));
  const giftOrphans = [];
  for (const g of bundle.gifts) {
    if (!personIds.has(g.giverPersonId)) {
      giftOrphans.push({ giftId: g.id, giverPersonId: g.giverPersonId });
    }
  }
  if (giftOrphans.length > 0) {
    errors.push(`gift giver orphans: ${JSON.stringify(giftOrphans)}`);
  }

  // Hard check: all gift.date values are valid ISO YYYY-MM-DD.
  const isoRe = /^\d{4}-\d{2}-\d{2}$/;
  const badDates = [];
  for (const g of bundle.gifts) {
    if (!g.date || !isoRe.test(g.date)) {
      badDates.push({ giftId: g.id, date: g.date });
    }
  }
  if (badDates.length > 0) {
    errors.push(`gift dates not valid ISO: ${JSON.stringify(badDates)}`);
  }

  // parseGiftDate self-test: exercises the standard input shape.
  // Hard fail.
  const pdExpected = { iso: '2026-03-12', parsed: true };
  const pdActual = parseGiftDate('March 12, 2026');
  if (pdActual.iso !== pdExpected.iso || pdActual.parsed !== pdExpected.parsed) {
    errors.push(
      `parseGiftDate self-test failed: got ${JSON.stringify(pdActual)}, ` +
      `expected ${JSON.stringify(pdExpected)}`,
    );
  }

  return { pass: errors.length === 0, errors, expected, actual };
}

export default adaptIndividual;
