// Orgs data — fictional nonprofits, placeholder until live nonprofit data is
// connected. Phase 1 athletics-only, but the org data covers all 9 cause areas
// because users may give beyond their primary causes.
//
// DEFANGED 2026-08-14. Five authored fields were removed from every record:
// `ed`, `boardSize`, `budget`, `programs`, `topFunders`. They were the
// fact-shaped attributes — a named executive director, a board count, an annual
// budget figure, trademarked-looking program names, and funder lists — and
// several records track real organizations closely enough to be identifiable by
// mission language alone. Fabricated officers and finances attached to an
// identifiable referent is a different and worse thing than invented content,
// and it violated the §7 rule that StewardHouse never authors org-level content.
//
// The names themselves are invented (no record names a real org, no EIN, no
// address, no URL) and STAY, along with mission, causes, geo, cat, years,
// foundedYear, led, badge and demo — those are what the pilot needs to test.
// Records were NOT rewritten: this dataset is slated for replacement by a
// three-source aggregation (ProPublica 990 API + IRS bulk status + the org's
// own site, provenance per field), so rewriting records we are about to delete
// would be throwaway work.

export const ORGS = [
  // EDUCATION
  { id: 1, name: 'CodePath Forward', mission: 'Training young people of color for careers in technology through intensive bootcamps and career placement.', causes: ['education', 'economic'], geo: 'Boston, MA', cat: 'community', years: 8, foundedYear: 2018, led: 'Community-led', badge: 'Tech workforce for underserved communities', demo: 'Young adults of color, ages 18-30, Greater Boston' },
  { id: 2, name: 'STEM Sisters Initiative', mission: 'Building STEM confidence and competence in girls from underrepresented communities through mentoring and hands-on programs.', causes: ['education'], geo: 'Cambridge, MA', cat: 'community', years: 11, foundedYear: 2015, led: 'Community-led', badge: 'STEM equity for girls', demo: 'Girls ages 5-18, primarily Black and Latina, Cambridge/Boston' },
  { id: 3, name: 'Launchpad Careers', mission: 'Closing the opportunity divide by providing young adults with professional training, internships, and long-term support.', causes: ['education', 'economic'], geo: 'National', cat: 'established', years: 20, foundedYear: 2006, led: 'Nationally staffed', badge: 'Career pathways for young adults', demo: 'Young adults 18-29, low-income, urban communities, national' },
  // ARTS
  { id: 4, name: 'SoundBridge LA', mission: 'Providing music education to youth in underserved Los Angeles communities to promote healthy development and creative expression.', causes: ['arts', 'education'], geo: 'Los Angeles, CA', cat: 'established', years: 18, foundedYear: 2008, led: 'Community-led', badge: 'Music as youth development', demo: 'Youth ages 6-18, low-income families, LA County' },
  { id: 5, name: 'Every Child an Artist NYC', mission: 'Partnering with under-resourced schools to provide music and arts education to every student.', causes: ['arts', 'education'], geo: 'New York, NY', cat: 'community', years: 25, foundedYear: 2001, led: 'Community-led', badge: 'Arts in every school', demo: 'K-8 students in Title I schools, NYC' },
  // SPORTS
  { id: 6, name: 'NextGen Coaches', mission: 'Using sports as a tool for youth development by training and placing coaches in underserved communities.', causes: ['sports', 'education'], geo: 'National', cat: 'established', years: 14, foundedYear: 2012, led: 'Nationally staffed', badge: 'Sports-based youth development', demo: 'Youth in underserved communities, national, via coach pipeline' },
  { id: 7, name: 'Level Playing Field', mission: 'Giving every child access to trained coaches and quality sports programming regardless of zip code.', causes: ['sports'], geo: 'Oakland, CA', cat: 'community', years: 10, foundedYear: 2016, led: 'Community-led', badge: 'Trained coaches for every kid', demo: 'Youth ages 5-18, Bay Area and expanding' },
  // FOOD
  { id: 8, name: 'Nourish Schools', mission: 'Connecting children to healthy food in school through hands-on nutrition education and garden programs.', causes: ['food', 'education'], geo: 'National', cat: 'established', years: 12, foundedYear: 2014, led: 'Nationally staffed', badge: 'Healthy food in schools', demo: 'K-8 students in high-need school districts, 18 states' },
  { id: 9, name: 'Green Cart Market', mission: 'Mobile market bringing affordable fresh produce to neighborhoods with limited grocery access.', causes: ['food'], geo: 'Boston, MA', cat: 'emerging', years: 3, foundedYear: 2023, led: 'Community-led', badge: 'Mobile food access', demo: 'Food-insecure neighborhoods, Dorchester/Roxbury/Mattapan' },
  // ECONOMIC
  { id: 10, name: 'Wealth Roots', mission: 'Financial literacy and economic empowerment for underserved communities through coaching and homeownership programs.', causes: ['economic'], geo: 'National', cat: 'established', years: 28, foundedYear: 1998, led: 'Community-led', badge: 'Financial empowerment', demo: 'Low-to-moderate income adults and youth, national' },
  { id: 11, name: 'Future Ready Youth', mission: 'Preparing young people for economic success through hands-on business and financial literacy programs.', causes: ['economic', 'education'], geo: 'Boston, MA', cat: 'established', years: 40, foundedYear: 1986, led: 'Nationally staffed', badge: 'Youth economic literacy', demo: 'K-12 students, Greater Boston, 40,000+ students annually' },
  // HEALTH
  { id: 12, name: 'Global Health Partners', mission: "Delivering healthcare to the world's most vulnerable communities through community health worker networks.", causes: ['health'], geo: 'International', cat: 'established', years: 30, foundedYear: 1996, led: 'Nationally staffed', badge: 'Healthcare for the most vulnerable', demo: '10+ countries, focus on sub-Saharan Africa and Caribbean' },
  { id: 13, name: 'Neighborhood Table', mission: 'Meeting the immediate needs of food-insecure families through community meals and wraparound support.', causes: ['health', 'food'], geo: 'Malden, MA', cat: 'community', years: 7, foundedYear: 2019, led: 'Community-led', badge: 'Local hunger + health', demo: 'Malden/Medford/Everett residents experiencing food insecurity' },
  // HOUSING
  { id: 14, name: 'Home Ground Alliance', mission: 'Building strength, stability, and self-reliance through affordable homebuilding and neighborhood revitalization.', causes: ['housing'], geo: 'National', cat: 'established', years: 35, foundedYear: 1991, led: 'Nationally staffed', badge: 'Home building + ownership', demo: 'Low-income families, national, 50+ metro areas' },
  { id: 15, name: 'Rooted Atlanta', mission: 'Resident-led affordable housing and community land trust development in South Atlanta neighborhoods.', causes: ['housing', 'economic'], geo: 'Atlanta, GA', cat: 'emerging', years: 4, foundedYear: 2022, led: 'Community-led', badge: 'Resident-led housing', demo: 'South Atlanta neighborhoods, primarily Black homebuyers' },
  // ENVIRONMENT
  { id: 16, name: 'Green Roots Collective', mission: 'Youth-led environmental justice and community greening in neighborhoods most affected by pollution and climate change.', causes: ['environment'], geo: 'National', cat: 'community', years: 12, foundedYear: 2014, led: 'Community-led', badge: 'Youth-led environmental justice', demo: 'Youth and communities in environmental justice zones, 20+ cities' },
  // FAITH
  { id: 17, name: 'Common Ground Interfaith', mission: 'Building bridges across religious and cultural divides through campus-based dialogue and service programs.', causes: ['faith', 'education'], geo: 'National', cat: 'established', years: 18, foundedYear: 2008, led: 'Nationally staffed', badge: 'Interfaith bridge-building', demo: 'College students and faculty, 500+ campuses' },
];
