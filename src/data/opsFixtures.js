// Operations operator persona — separate file because the Operations operator
// is a distinct persona from the Enterprise athletic-department admin that
// lives in enterpriseFixtures.js. Reusing the Enterprise CURRENT_USER would
// cross-wire two surfaces' personas.

export const CURRENT_OPS_USER = {
  name: 'Faouzi Talabi',
  role: 'Founder',
};
