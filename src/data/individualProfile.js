// Demo profile for the Individual surface — Marcus Thompson (athletics).
// All organizations, amounts, and dates are fictional.

export const individualProfile = {
  name: 'Marcus Thompson',
  initials: 'MT',
  sport: 'Basketball',
  level: 'Junior college',

  // Geo context (drives "place-based" causes)
  geoDetail: 'Cleveland, Ohio area',

  // Causes selected during onboarding
  causes: [
    { id: 'youth-sports', label: 'Youth sports access' },
    { id: 'place-based', label: 'Place-based community' },
    { id: 'k12-education', label: 'K–12 education' },
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

// Funding equity spotlight — surfaces with a sourced citation
export const fundingSpotlight = {
  text: `Research consistently shows that organizations led by and for the communities they serve receive less philanthropic funding than their peers. Your intentional giving — guided by your GPS — helps shift that pattern. Not by obligation, but by awareness.`,
  source: 'Echoing Green & Bridgespan, "Overcoming the Racial Bias in Philanthropic Funding"',
  sourceUrl: 'https://www.bridgespan.org/insights/overcoming-the-racial-bias-in-philanthropic-funding',
};

// Athletics-specific micro-learning shown in "Worth knowing"
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
