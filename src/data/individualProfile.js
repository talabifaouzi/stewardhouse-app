// Demo profile for the Individual surface — Marcus Thompson (athletics).
// All organizations, amounts, and dates are fictional.

export const individualProfile = {
  id: 'c-001',
  name: 'Marcus Thompson',
  initials: 'MT',
  sport: 'Basketball',
  level: 'Junior college',

  // Geo context (drives "place-based" causes)
  geoDetail: 'Cleveland, Ohio area',

  // Causes selected during onboarding — uses canonical intake CAUSES taxonomy
  // (matches intakeData.js so Discover, Funding Spotlight, and cause-tag
  // display all resolve correctly).
  causes: [
    { id: 'education', label: 'Education' },
    { id: 'sports', label: 'Sports' },
    { id: 'economic', label: 'Economic' },
  ],

  // Visibility preference: 'public' | 'selective' | 'private'
  visibility: 'private',

  // Budget tier set during intake
  budget: '$1K–$10K',

  // Giving style derived from intake answers
  givingStyle: 'Quiet builder',

  // World label for athletics segment
  worldLabel: 'Athletics',
};

export const gifts = [
  {
    id: 'g-001',
    org: 'Cleveland Youth Hoops Foundation',
    amount: 5000,
    date: 'March 12, 2026',
    type: 'unrestricted',
    vehicle: 'personal',
    recurring: false,
  },
  {
    id: 'g-002',
    org: 'Northeast Ohio Sports Access Coalition',
    amount: 2500,
    date: 'January 28, 2026',
    type: 'unrestricted',
    vehicle: 'personal',
    recurring: true,
  },
  {
    id: 'g-003',
    org: 'Cleveland Public Schools Athletics Fund',
    amount: 1000,
    date: 'December 15, 2025',
    type: 'unrestricted',
    vehicle: 'daf',
    recurring: false,
  },
];

// Marcus's GPS — the giving plan statement
export const givingPlanStatement = `Direct support to youth basketball programs in the Cleveland area where I grew up. Multi-year, unrestricted where possible. Quiet about it — no public attribution unless the organization specifically asks.`;

// Funding equity spotlight — cause-aware. Picks a variant based on the
// user's primary cause area, falls back to a general statement.
//
// Each variant has its own sourced citation. We do not generate or invent
// statistics — every variant points to a published report from a named
// research source.
const FUNDING_SPOTLIGHT_VARIANTS = {
  education: {
    text: `Research from the National Committee for Responsive Philanthropy shows that organizations serving communities of color receive disproportionately less philanthropic funding relative to the populations they serve. Your intentional giving in education helps shift that pattern.`,
    source: 'NCRP, "Responsive Philanthropy" reports',
    sourceUrl: 'https://www.ncrp.org/publications',
  },
  arts: {
    text: `According to the DeVos Institute of Arts Management, arts organizations led by people of color operate on significantly smaller budgets than their peers — despite serving diverse audiences. Consistent support from individual donors is often their most reliable funding.`,
    source: 'DeVos Institute of Arts Management research',
    sourceUrl: 'https://www.devosinstitute.umd.edu/',
  },
  health: {
    text: `The Robert Wood Johnson Foundation has documented that community health organizations in underserved neighborhoods are disproportionately affected by funding cuts during economic downturns. Unrestricted support helps them stay open when other funding disappears.`,
    source: 'Robert Wood Johnson Foundation reports',
    sourceUrl: 'https://www.rwjf.org/en/insights.html',
  },
  general: {
    text: `Research consistently shows that organizations led by and for the communities they serve receive less philanthropic funding than their peers. Your intentional giving — guided by your GPS — helps shift that pattern. Not by obligation, but by awareness.`,
    source: 'Echoing Green & Bridgespan, "Overcoming the Racial Bias in Philanthropic Funding"',
    sourceUrl: 'https://www.bridgespan.org/insights/overcoming-the-racial-bias-in-philanthropic-funding',
  },
};

export function getFundingSpotlight(causes = []) {
  if (causes.includes('education')) return FUNDING_SPOTLIGHT_VARIANTS.education;
  if (causes.includes('arts')) return FUNDING_SPOTLIGHT_VARIANTS.arts;
  if (causes.includes('health')) return FUNDING_SPOTLIGHT_VARIANTS.health;
  return FUNDING_SPOTLIGHT_VARIANTS.general;
}

// Back-compat export (Marcus's default — used in places that haven't yet
// migrated to the getter)
export const fundingSpotlight = FUNDING_SPOTLIGHT_VARIANTS.education;

// Micro-learning ("Worth knowing") — gift-status-aware.
// Athletics-only phase 1, so segment is locked. A first-time giver sees
// onboarding-flavored copy; an experienced giver sees deeper context.
export function getMicroLearning(hasGifts) {
  return hasGifts
    ? `Trust-based giving means letting organizations use your money where they know it's needed. The Ford Foundation has committed $2 billion to this approach through its BUILD initiative. You're in good company.`
    : `The average professional sports career is 3 to 5 years. But a giving practice built during those years can shape communities for decades. The athletes remembered aren't just the ones who performed — they're the ones who showed up.`;
}

// Back-compat export — preserves the previous static string
export const microLearning = `Trust-based giving means letting organizations use your money where they know it's needed. The Ford Foundation has committed $2 billion to this approach through its BUILD initiative. You're in good company.`;

// Visibility-aware insight
export const visibilityInsights = {
  public: {
    title: 'Your platform amplifies giving',
    text: 'When you share your giving publicly, you inspire others to give too. Share the cause — why it matters to you, who the organization serves, and what drew you to them. That story does more than a dollar amount ever could.',
  },
  selective: {
    title: 'Sharing on your terms',
    text: 'You choose when and how to share your giving. When you do share, focus on the cause, not the check. Tell people why you care — the personal connection, the mission, the community. You control the narrative.',
  },
  private: {
    title: 'Your giving stays yours',
    text: 'Private giving is powerful. Most DAF providers let you give anonymously — the organization receives the gift without knowing your name. For personal gifts under $250, no public record exists. Your privacy is protected by default.',
  },
};
