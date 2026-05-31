// -----------------------------------------------------------------------------
// Unified data layer — enterprise adapter
//
// Pure function: reads enterpriseFixtures.js, returns unified-shape records
// conforming to ../types.js. Tags every record sourceSurface: 'enterprise'.
// Emits in source order. Does not mutate source fixtures.
//
// FK wiring across entities is DEFERRED to assemble.js (slice 6):
// - Institution.partnerAdvisorPracticeId stays null here.
// - Institution.staffPersonIds stays [] here.
// Both will be populated by assemble using the cross-source FK rules.
// -----------------------------------------------------------------------------

import { athletes, contacts, INST_PROFILES } from '../../enterpriseFixtures.js';
import { SOURCE_SURFACE } from '../sources.js';

const SOURCE = SOURCE_SURFACE.ENTERPRISE;

// Match enterprise gift labels: "$<amount> to <recipient name>".
// Amount captures digits + commas (e.g., $1,250). Recipient captures everything
// after "to ".
const GIFT_LABEL_RE = /^\$([\d,]+) to (.+)$/;

/**
 * Parse an enterprise gift activity label. Pure function.
 *
 * Recognized shape: "$<amount> to <recipient name>". Amount may contain commas.
 * On match, returns parsed:true with numeric amount and recipient name. On
 * miss, returns parsed:false with amount=null and the raw label as the
 * recipient name (caller decides how to handle).
 *
 * @param {string} label
 * @returns {{amount: number|null, recipientOrgName: string, parsed: boolean}}
 */
function parseGiftLabel(label) {
  const match = label.match(GIFT_LABEL_RE);
  if (match) {
    return {
      amount: Number(match[1].replace(/,/g, '')),
      recipientOrgName: match[2],
      parsed: true,
    };
  }
  return { amount: null, recipientOrgName: label, parsed: false };
}

function deriveInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// Map enterprise contact roles to unified Person.type. Returns null for
// unmapped roles so the caller can flag them via the unmappedRoles list.
function mapContactRoleToType(role) {
  switch (role) {
    case 'facilitator':
    case 'co_advisor':
      return 'advisor';
    case 'athletic_dept_admin':
    case 'stewardhouse_rep':
      return 'staff';
    default:
      return null;
  }
}

/**
 * Run the enterprise adapter. Pure: does not mutate source fixtures, returns
 * a fresh bundle each call.
 *
 * @returns {{
 *   persons: Array<Object>,
 *   institutions: Array<Object>,
 *   programParticipations: Array<Object>,
 *   gifts: Array<Object>,
 *   unparsedGiftCount: number,
 *   unmappedRoles: Array<{id: string, role: string}>,
 * }}
 */
export function adaptEnterprise() {
  const persons = [];

  // Athletes → Person + ProgramParticipation (16 each)
  for (const a of athletes) {
    persons.push({
      id: `p-enterprise-${a.id}`,
      name: a.name,
      initials: deriveInitials(a.name),
      type: 'individual',
      contact: { email: a.email, phone: a.phone },
      sourceSurface: SOURCE,
      extensions: {
        enterprise: {
          year: a.year,
          position: a.position,
          badge: a.badge,
          notes: a.notes,
        },
      },
    });
  }

  // Contacts → Person (5)
  const unmappedRoles = [];
  for (const c of contacts) {
    const type = mapContactRoleToType(c.role);
    if (type === null) {
      unmappedRoles.push({ id: c.id, role: c.role });
    }
    persons.push({
      id: `p-enterprise-${c.id}`,
      name: c.name,
      initials: deriveInitials(c.name),
      // Fallback to 'staff' for unmapped roles so the record stays usable;
      // unmappedRoles list surfaces the gap to runChecks.
      type: type || 'staff',
      contact: { email: c.email, phone: c.phone },
      sourceSurface: SOURCE,
      extensions: {
        enterprise: {
          title: c.title,
          organization: c.organization,
          role: c.role,
          bio: c.bio,
        },
      },
    });
  }

  // Institutions (1)
  const inst = INST_PROFILES[0];
  const institutions = [
    {
      id: 'inst-cooperstate',
      name: inst.name,
      sector: inst.sector,
      dept: inst.dept,
      contract: {
        contractTerm: inst.contract,
        tier: inst.tier,
        annual: inst.annual,
        startDate: null,
        endDate: null,
      },
      // FK wiring deferred to assemble (slice 6).
      partnerAdvisorPracticeId: null,
      staffPersonIds: [],
      sourceSurface: SOURCE,
      extensions: {
        enterprise: {
          endowment: inst.endowment,
          // Preserved as a name string per ER-pointer decision: cross-source
          // FK resolution happens in assemble, not here.
          facilitatorName: inst.facilitator,
        },
      },
    },
  ];

  // ProgramParticipations (16) — one per athlete
  const programParticipations = [];
  for (const a of athletes) {
    programParticipations.push({
      id: `pp-enterprise-${a.id}`,
      personId: `p-enterprise-${a.id}`,
      contextType: 'institution',
      contextId: 'inst-cooperstate',
      stage: a.status, // pass-through, no normalization
      joinDate: a.joinDate,
      lastActive: a.lastActive,
      sourceSurface: SOURCE,
      extensions: {
        enterprise: {
          lessons: a.lessons,
          gifts: a.gifts,
          gpsCompleted: a.gpsCompleted,
          gpsDate: a.gpsDate,
          certified: a.certified,
          certDate: a.certDate,
          activity: a.activity,
        },
      },
    });
  }

  // Gifts — extracted from athlete activity entries where type === 'gift_made'
  const gifts = [];
  let unparsedGiftCount = 0;
  let giftSeq = 0;
  for (const a of athletes) {
    for (const e of a.activity) {
      if (e.type !== 'gift_made') continue;
      giftSeq += 1;
      const result = parseGiftLabel(e.label);
      if (!result.parsed) unparsedGiftCount += 1;
      gifts.push({
        id: `gift-enterprise-${giftSeq}`,
        giverPersonId: `p-enterprise-${a.id}`,
        recipientOrgId: null,
        recipientOrgName: result.recipientOrgName,
        amount: result.amount,
        date: e.date,
        type: null,
        vehicle: null,
        recurring: null,
        sourceSurface: SOURCE,
      });
    }
  }

  return {
    persons,
    institutions,
    programParticipations,
    gifts,
    unparsedGiftCount,
    unmappedRoles,
  };
}

/**
 * Sanity assertions over an adapter bundle (or a fresh adapter run).
 * Returns {pass, errors[], expected{}, actual{}, info{}} so callers can
 * render hard failures and informational divergences separately.
 *
 * Hard checks (failure = adapter bug): persons, institutions,
 * programParticipations, unparsedGiftCount, unmappedRoles.
 *
 * Informational only (does NOT fail the run): the gift-count divergence
 * between Gift records (logged gift_made events) and the sum of the
 * athlete.gifts field. The activity log undercounts the field — this is
 * a known source-data shape, NOT an adapter bug. Source-side comment at
 * currentCohortSnapshot.totalDollarsMoved confirms: "tracked-only —
 * undercounts vs gifts count". Both numbers are preserved correctly:
 *   - bundle.gifts.length                                = logged events
 *   - participation.extensions.enterprise.gifts          = field count
 */
export function runChecks(adapted) {
  const bundle = adapted || adaptEnterprise();

  const expected = {
    persons: 21,
    institutions: 1,
    programParticipations: 16,
    unparsedGiftCount: 0,
    unmappedRoles: 0,
  };
  const actual = {
    persons: bundle.persons.length,
    institutions: bundle.institutions.length,
    programParticipations: bundle.programParticipations.length,
    unparsedGiftCount: bundle.unparsedGiftCount,
    unmappedRoles: bundle.unmappedRoles.length,
  };

  const errors = [];
  for (const key of Object.keys(expected)) {
    if (actual[key] !== expected[key]) {
      errors.push(`${key}: expected ${expected[key]}, got ${actual[key]}`);
    }
  }
  if (bundle.unmappedRoles.length > 0) {
    errors.push(`unmapped contact roles: ${JSON.stringify(bundle.unmappedRoles)}`);
  }

  // parseGiftLabel self-test: exercises the comma path the current fixture
  // doesn't reach (all live amounts are < $1,000). Hard fail.
  const ptExpected = { amount: 1250, recipientOrgName: 'Test Org', parsed: true };
  const ptActual = parseGiftLabel('$1,250 to Test Org');
  if (
    ptActual.amount !== ptExpected.amount ||
    ptActual.recipientOrgName !== ptExpected.recipientOrgName ||
    ptActual.parsed !== ptExpected.parsed
  ) {
    errors.push(
      `parseGiftLabel self-test failed: got ${JSON.stringify(ptActual)}, ` +
      `expected ${JSON.stringify(ptExpected)}`,
    );
  }

  // Informational: known divergence, not a failure.
  const giftEvents = bundle.gifts.length;
  const giftFieldSum = athletes.reduce((sum, a) => sum + a.gifts, 0);
  const info = {
    giftEvents,
    giftFieldSum,
    divergence: giftFieldSum - giftEvents,
    note:
      'KNOWN divergence — Gift records reflect logged gift_made activity ' +
      'events; the athlete.gifts field is a separate count. Source-side ' +
      'comment at currentCohortSnapshot.totalDollarsMoved confirms the ' +
      'activity log is tracked-only and undercounts. Adapter preserves ' +
      'both numbers; not an adapter bug.',
  };

  return { pass: errors.length === 0, errors, expected, actual, info };
}

export default adaptEnterprise;
