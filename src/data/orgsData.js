// Orgs data — fictional nonprofits used until Candid API integration
// Phase 1 athletics-only, but the org data covers all 9 cause areas
// because users may give beyond their primary causes.

export const ORGS = [
  // EDUCATION
  { id: 1, name: 'CodePath Forward', mission: 'Training young people of color for careers in technology through intensive bootcamps and career placement.', causes: ['education', 'economic'], geo: 'Boston, MA', cat: 'community', years: 8, foundedYear: 2018, led: 'Community-led', badge: 'Tech workforce for underserved communities', ed: 'Marcus Rivera', boardSize: 9, budget: '$2-5M', programs: ['Web Development Bootcamp', 'Career Placement Pipeline', 'Alumni Network'], topFunders: ['Local community foundation', 'Corporate tech sponsors', 'State workforce grants'], demo: 'Young adults of color, ages 18-30, Greater Boston' },
  { id: 2, name: 'STEM Sisters Initiative', mission: 'Building STEM confidence and competence in girls from underrepresented communities through mentoring and hands-on programs.', causes: ['education'], geo: 'Cambridge, MA', cat: 'community', years: 11, foundedYear: 2015, led: 'Community-led', badge: 'STEM equity for girls', ed: 'Dr. Priya Okafor', boardSize: 10, budget: '$1-2M', programs: ['Junior Lab', 'STEM Mentoring Circles', 'Summer Research Academy'], topFunders: ['National Science Foundation', 'Regional corporate foundations', 'University partnerships'], demo: 'Girls ages 5-18, primarily Black and Latina, Cambridge/Boston' },
  { id: 3, name: 'Launchpad Careers', mission: 'Closing the opportunity divide by providing young adults with professional training, internships, and long-term support.', causes: ['education', 'economic'], geo: 'National', cat: 'established', years: 20, foundedYear: 2006, led: 'Nationally staffed', badge: 'Career pathways for young adults', ed: 'David Morales', boardSize: 18, budget: '$150M+', programs: ['Professional Training Corps', 'Corporate Internship Network', 'Alumni Success Program'], topFunders: ['Major financial institutions', 'National corporate partners', 'Federal workforce grants'], demo: 'Young adults 18-29, low-income, urban communities, national' },
  // ARTS
  { id: 4, name: 'SoundBridge LA', mission: 'Providing music education to youth in underserved Los Angeles communities to promote healthy development and creative expression.', causes: ['arts', 'education'], geo: 'Los Angeles, CA', cat: 'established', years: 18, foundedYear: 2008, led: 'Community-led', badge: 'Music as youth development', ed: 'Angela Torres', boardSize: 12, budget: '$5-10M', programs: ['After-School Music', 'Summer Intensive', 'College Prep Through Arts'], topFunders: ['LA arts commissions', 'National music foundations', 'Individual donors'], demo: 'Youth ages 6-18, low-income families, LA County' },
  { id: 5, name: 'Every Child an Artist NYC', mission: 'Partnering with under-resourced schools to provide music and arts education to every student.', causes: ['arts', 'education'], geo: 'New York, NY', cat: 'community', years: 25, foundedYear: 2001, led: 'Community-led', badge: 'Arts in every school', ed: 'Tanya Washington', boardSize: 14, budget: '$5-10M', programs: ['In-School Music', 'Teaching Artist Residency', 'Instrument Lending Library'], topFunders: ['NYC Dept of Education', 'Regional arts foundations', 'National endowments'], demo: 'K-8 students in Title I schools, NYC' },
  // SPORTS
  { id: 6, name: 'NextGen Coaches', mission: 'Using sports as a tool for youth development by training and placing coaches in underserved communities.', causes: ['sports', 'education'], geo: 'National', cat: 'established', years: 14, foundedYear: 2012, led: 'Nationally staffed', badge: 'Sports-based youth development', ed: 'James Obi', boardSize: 15, budget: '$10-20M', programs: ['Coach Corps', 'Youth Development Through Sports', 'Training & Certification'], topFunders: ['Federal service programs', 'National athletic brands', 'Health foundations'], demo: 'Youth in underserved communities, national, via coach pipeline' },
  { id: 7, name: 'Level Playing Field', mission: 'Giving every child access to trained coaches and quality sports programming regardless of zip code.', causes: ['sports'], geo: 'Oakland, CA', cat: 'community', years: 10, foundedYear: 2016, led: 'Community-led', badge: 'Trained coaches for every kid', ed: 'Samantha Reyes', boardSize: 8, budget: '$1-2M', programs: ['Volunteer Coach Training', 'Youth League Partnerships', 'Coach Mentorship'], topFunders: ['Regional health systems', 'National family foundations', 'Pro sports team foundations'], demo: 'Youth ages 5-18, Bay Area and expanding' },
  // FOOD
  { id: 8, name: 'Nourish Schools', mission: 'Connecting children to healthy food in school through hands-on nutrition education and garden programs.', causes: ['food', 'education'], geo: 'National', cat: 'established', years: 12, foundedYear: 2014, led: 'Nationally staffed', badge: 'Healthy food in schools', ed: 'Maria Santos', boardSize: 11, budget: '$15-20M', programs: ['School Garden Corps', 'Nutrition Curriculum', 'Farm to Cafeteria'], topFunders: ['USDA', 'National health foundations', 'Agricultural endowments'], demo: 'K-8 students in high-need school districts, 18 states' },
  { id: 9, name: 'Green Cart Market', mission: 'Mobile market bringing affordable fresh produce to neighborhoods with limited grocery access.', causes: ['food'], geo: 'Boston, MA', cat: 'emerging', years: 3, foundedYear: 2023, led: 'Community-led', badge: 'Mobile food access', ed: 'Terrence Mitchell', boardSize: 5, budget: 'Under $500K', programs: ['Mobile Market', 'SNAP Match Program', 'Community Pop-ups'], topFunders: ['Regional bank foundations', 'National grocery chains', 'Municipal health departments'], demo: 'Food-insecure neighborhoods, Dorchester/Roxbury/Mattapan' },
  // ECONOMIC
  { id: 10, name: 'Wealth Roots', mission: 'Financial literacy and economic empowerment for underserved communities through coaching and homeownership programs.', causes: ['economic'], geo: 'National', cat: 'established', years: 28, foundedYear: 1998, led: 'Community-led', badge: 'Financial empowerment', ed: 'Christina Blake', boardSize: 16, budget: '$25M+', programs: ['Financial Coaching', 'Homeownership Pipeline', 'Small Business Accelerator'], topFunders: ['National banks', 'Federal treasury programs', 'Corporate sponsors'], demo: 'Low-to-moderate income adults and youth, national' },
  { id: 11, name: 'Future Ready Youth', mission: 'Preparing young people for economic success through hands-on business and financial literacy programs.', causes: ['economic', 'education'], geo: 'Boston, MA', cat: 'established', years: 40, foundedYear: 1986, led: 'Nationally staffed', badge: 'Youth economic literacy', ed: 'Patricia Owens', boardSize: 22, budget: '$5-10M', programs: ['BizTown Simulations', 'Finance Academy', 'Entrepreneurship Program'], topFunders: ['Financial services firms', 'Insurance companies', 'Local corporate sponsors'], demo: 'K-12 students, Greater Boston, 40,000+ students annually' },
  // HEALTH
  { id: 12, name: 'Global Health Partners', mission: "Delivering healthcare to the world's most vulnerable communities through community health worker networks.", causes: ['health'], geo: 'International', cat: 'established', years: 30, foundedYear: 1996, led: 'Nationally staffed', badge: 'Healthcare for the most vulnerable', ed: 'Dr. Amara Osei', boardSize: 14, budget: '$300M+', programs: ['Community Health Workers', 'Rural Hospital Support', 'Medical Training'], topFunders: ['USAID', 'Global health funds', 'Major philanthropic foundations'], demo: '10+ countries, focus on sub-Saharan Africa and Caribbean' },
  { id: 13, name: 'Neighborhood Table', mission: 'Meeting the immediate needs of food-insecure families through community meals and wraparound support.', causes: ['health', 'food'], geo: 'Malden, MA', cat: 'community', years: 7, foundedYear: 2019, led: 'Community-led', badge: 'Local hunger + health', ed: 'Rosa Hernandez', boardSize: 6, budget: 'Under $500K', programs: ['Community Meals', 'Food Pantry', 'Family Resource Connections'], topFunders: ['Regional food banks', 'Municipal funding', 'Local faith communities'], demo: 'Malden/Medford/Everett residents experiencing food insecurity' },
  // HOUSING
  { id: 14, name: 'Home Ground Alliance', mission: 'Building strength, stability, and self-reliance through affordable homebuilding and neighborhood revitalization.', causes: ['housing'], geo: 'National', cat: 'established', years: 35, foundedYear: 1991, led: 'Nationally staffed', badge: 'Home building + ownership', ed: 'Robert Kim', boardSize: 20, budget: '$500M+', programs: ['Home Construction', 'Home Repair', 'Neighborhood Revitalization'], topFunders: ['National home improvement retailers', 'Appliance manufacturers', 'Federal housing programs'], demo: 'Low-income families, national, 50+ metro areas' },
  { id: 15, name: 'Rooted Atlanta', mission: 'Resident-led affordable housing and community land trust development in South Atlanta neighborhoods.', causes: ['housing', 'economic'], geo: 'Atlanta, GA', cat: 'emerging', years: 4, foundedYear: 2022, led: 'Community-led', badge: 'Resident-led housing', ed: 'DeShawn Williams', boardSize: 5, budget: 'Under $1M', programs: ['Resident Councils', 'Homeownership Pipeline', 'Community Land Trust'], topFunders: ['City housing authority', 'National community development foundations', 'Regional enterprise funds'], demo: 'South Atlanta neighborhoods, primarily Black homebuyers' },
  // ENVIRONMENT
  { id: 16, name: 'Green Roots Collective', mission: 'Youth-led environmental justice and community greening in neighborhoods most affected by pollution and climate change.', causes: ['environment'], geo: 'National', cat: 'community', years: 12, foundedYear: 2014, led: 'Community-led', badge: 'Youth-led environmental justice', ed: 'Jordan Whitehorse', boardSize: 10, budget: '$5-10M', programs: ['Green Team Youth Corps', 'Brownfields Restoration', 'Climate Resilience Planning'], topFunders: ['EPA', 'USDA', 'National conservation agencies'], demo: 'Youth and communities in environmental justice zones, 20+ cities' },
  // FAITH
  { id: 17, name: 'Common Ground Interfaith', mission: 'Building bridges across religious and cultural divides through campus-based dialogue and service programs.', causes: ['faith', 'education'], geo: 'National', cat: 'established', years: 18, foundedYear: 2008, led: 'Nationally staffed', badge: 'Interfaith bridge-building', ed: 'Dr. Fatima Al-Rashid', boardSize: 14, budget: '$10-15M', programs: ['Campus Dialogue Initiative', 'Interfaith Leadership Fellows', 'Community Service Corps'], topFunders: ['Religious endowments', 'Higher education foundations', 'National service organizations'], demo: 'College students and faculty, 500+ campuses' },
];

export const CAT_META = {
  established: {
    label: 'Established',
    desc: "Deep track records. They've been doing this work longer than most.",
  },
  community: {
    label: 'Community-Rooted',
    desc: "Led by the community, for the community. Trust you can't buy.",
  },
  emerging: {
    label: 'Emerging',
    desc: 'New organizations doing bold work. Your support helps them grow.',
  },
};

// Score an org against a user's GPS. Higher = better match.
export function scoreOrg(org, userCauses, userGeo) {
  let score = 0;
  // Cause overlap is the heaviest signal
  for (const cause of userCauses) {
    if (org.causes.includes(cause)) score += 3;
  }
  // Geographic alignment — exact match
  if (userGeo && org.geo === userGeo) score += 2;
  // National orgs work for anyone
  if (org.geo === 'National') score += 1;
  return score;
}
