// Intake data — fields used across the onboarding flow.
// Phase 1 scope: athletics-only (segment branching removed).

export const CAUSES = [
  { id: 'education', label: 'Education' },
  { id: 'health', label: 'Health' },
  { id: 'arts', label: 'Arts & Culture' },
  { id: 'environment', label: 'Environment' },
  { id: 'economic', label: 'Economic Mobility' },
  { id: 'housing', label: 'Housing' },
  { id: 'food', label: 'Food Security' },
  { id: 'sports', label: 'Sports' },
  { id: 'faith', label: 'Faith-Based' },
];

export const VIS = [
  { id: 'private', label: 'Fully Private', desc: 'Between me and the organizations I support' },
  { id: 'selective', label: 'Selective', desc: 'I share when it feels right' },
  { id: 'public', label: 'Actively Public', desc: 'I use my platform to inspire others' },
];

export const TRUST = [
  { id: 'full', label: 'Trust completely', desc: 'Use it however you need' },
  { id: 'some', label: 'Some input', desc: 'Flexibility with suggestions' },
  { id: 'directed', label: 'Be specific', desc: 'Intentional about where it goes' },
];

export const BUDGETS = [
  'Under $1,000',
  '$1K – $10K',
  '$10K – $50K',
  '$50K – $250K',
  '$250K+',
  'Not sure yet',
];

export const DEPTH = [
  { id: 'deep', label: 'Deep', desc: '2–3 orgs, lasting relationships' },
  { id: 'balanced', label: 'Balanced', desc: '5–8 orgs, moderate gifts' },
  { id: 'broad', label: 'Broad', desc: '10+ orgs, exploring widely' },
];

// Athletics-specific career stages (phase 1)
export const STAGES_ATHLETICS = [
  { id: 'collegiate', label: 'College / NIL', desc: 'Currently in school, earning through NIL' },
  { id: 'early', label: 'Early Career', desc: 'First contract, first few years as a pro' },
  { id: 'prime', label: 'Prime', desc: 'Peak earning years' },
  { id: 'transition', label: 'Transition / Retired', desc: 'Career is winding down or already transitioned' },
];

export const AUTHORITY = [
  { id: 'self', label: 'Just me', desc: 'I make my own financial decisions' },
  { id: 'family_input', label: 'Family has input', desc: 'I decide, but my family weighs in' },
  { id: 'guardian', label: 'Parent or guardian', desc: 'A parent or guardian manages my finances' },
  { id: 'team', label: 'I have a team', desc: 'Manager, agent, or business manager handles finances' },
];

export const GEO_OPTIONS = [
  { id: 'hometown', label: 'My Hometown' },
  { id: 'current', label: 'Where I Live Now' },
  { id: 'state', label: 'My State' },
  { id: 'national', label: 'National' },
  { id: 'international', label: 'International' },
];

// Derive a giving style label from the user's answers.
// Same logic as the prototype's getGivingStyle.
export function deriveGivingStyle(a) {
  const priv = a.visibility === 'private';
  const pub = a.visibility === 'public';
  const deep = a.depth === 'deep';
  const broad = a.depth === 'broad';
  const firstStep = a.existingOrgs?.includes('first step') || a.existingOrgs?.includes("haven't given");
  const hometown = a.geo?.includes('hometown');

  if (firstStep && hometown) return 'Hometown Starter';
  if (firstStep) return 'New Path';
  if (pub && broad) return 'Wide-Angle Giver';
  if (pub) return 'Spotlight Giver';
  if (priv && deep && hometown) return 'Community Anchor';
  if (priv && deep) return 'Quiet Builder';
  if (priv) return 'Silent Force';
  if (deep && hometown) return 'Rooted Giver';
  if (deep) return 'Deep Connector';
  if (broad) return 'Explorer';
  return 'Intentional Giver';
}

// Celebration line shown at the end of intake.
export function deriveCelebration(a) {
  const priv = a.visibility === 'private';
  const pub = a.visibility === 'public';
  const deep = a.depth === 'deep';
  const firstStep = a.existingOrgs?.includes('first step') || a.existingOrgs?.includes("haven't given");
  const hometown = a.geo?.includes('hometown');

  if (firstStep && hometown) return "You're starting something new — rooted in the place that made you. That's powerful.";
  if (firstStep) return "You just took the first step most people never take. Everything builds from here.";
  if (priv && deep) return "You give quietly and deeply. Lasting relationships with organizations you believe in. That's rare.";
  if (pub) return "You want your giving to inspire others. When you give publicly, you give others permission to do the same.";
  if (priv) return "You give quietly, on your own terms. Not for recognition — because it matters to you.";
  if (deep && hometown) return "You give close to home and go deep. The organizations you support know your name and you know their work.";
  return "You defined what your giving means — in your own words, on your own terms. Most people never do this.";
}
