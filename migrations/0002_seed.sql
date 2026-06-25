-- Migration 0002 — seed individual-side data into stewardhouse-pilot D1.
--
-- Spec: docs/persistence-schema-draft.md §3 + the seed-investigation plan
-- approved by FT (option B locked: person.auth_user_id NULL at seed; no
-- auth_user rows; Marcus binds to a real auth_user on first magic-link
-- sign-in via the auth slice).
--
-- Scope (rulings A + F + individual-only):
--   - 17 orgs from src/data/orgsData.js ORGS, ids 'org-1'..'org-17'.
--   - 1 person row for Marcus (fresh opaque UUID id; legacy 'c-001'
--     rides in extensions.legacy_individual_id).
--   - 3 gift rows for Marcus's seed gifts. recipient_org_id NULL on all
--     3 (none match the 17-catalog). recipient_org_name carries the
--     display fallback per ruling D.
--   - NO auth_user rows. NO scenario rows.
--   - advisor / enterprise / synthetic stay build-time projections; out
--     of scope for this migration.
--
-- Normalizations applied:
--   - Gift dates → ISO 'YYYY-MM-DD'.
--   - Marcus's budget → spaced form '$1K – $10K' (was '$1K–$10K' in
--     fixture — dead-lookup carried debt from 5.8).
--   - Org ids → namespaced strings 'org-N' (matches Discover's read).
--   - Marcus's causes → string-ID array (was [{id,label},...]) per
--     CLAUDE.md §4 Candid-interleave shape.
--
-- Determinism: all UUIDs are pre-computed literals baked into the file,
-- NOT randomblob()-generated, so re-applying the migration produces
-- identical state.
--
-- SQL-escape surface (audited): exactly ONE site — org-12 mission
-- contains "world's"; written here as 'world''s' (doubled apostrophe).
-- All other 16 orgs + Marcus's row + 3 gift rows + all JSON content
-- contain zero apostrophes, zero internal quotes, zero backslashes.
-- UTF-8 em-dash/en-dash characters pass through D1 natively.

-- =============================================================================
-- ORG (17 rows, FK-independent — inserted first)
-- =============================================================================

INSERT INTO org (id, name, ein, mission, causes, geo, cat, is_excluded_by_institution_ids, source_surface, extensions) VALUES
  ('org-1', 'CodePath Forward', NULL,
   'Training young people of color for careers in technology through intensive bootcamps and career placement.',
   '["education","economic"]', 'Boston, MA', 'community', '[]', 'individual',
   '{"individual":{"years":8,"foundedYear":2018,"led":"Community-led","badge":"Tech workforce for underserved communities","ed":"Marcus Rivera","boardSize":9,"budget":"$2-5M","programs":["Web Development Bootcamp","Career Placement Pipeline","Alumni Network"],"topFunders":["Local community foundation","Corporate tech sponsors","State workforce grants"],"demo":"Young adults of color, ages 18-30, Greater Boston"}}'),

  ('org-2', 'STEM Sisters Initiative', NULL,
   'Building STEM confidence and competence in girls from underrepresented communities through mentoring and hands-on programs.',
   '["education"]', 'Cambridge, MA', 'community', '[]', 'individual',
   '{"individual":{"years":11,"foundedYear":2015,"led":"Community-led","badge":"STEM equity for girls","ed":"Dr. Priya Okafor","boardSize":10,"budget":"$1-2M","programs":["Junior Lab","STEM Mentoring Circles","Summer Research Academy"],"topFunders":["National Science Foundation","Regional corporate foundations","University partnerships"],"demo":"Girls ages 5-18, primarily Black and Latina, Cambridge/Boston"}}'),

  ('org-3', 'Launchpad Careers', NULL,
   'Closing the opportunity divide by providing young adults with professional training, internships, and long-term support.',
   '["education","economic"]', 'National', 'established', '[]', 'individual',
   '{"individual":{"years":20,"foundedYear":2006,"led":"Nationally staffed","badge":"Career pathways for young adults","ed":"David Morales","boardSize":18,"budget":"$150M+","programs":["Professional Training Corps","Corporate Internship Network","Alumni Success Program"],"topFunders":["Major financial institutions","National corporate partners","Federal workforce grants"],"demo":"Young adults 18-29, low-income, urban communities, national"}}'),

  ('org-4', 'SoundBridge LA', NULL,
   'Providing music education to youth in underserved Los Angeles communities to promote healthy development and creative expression.',
   '["arts","education"]', 'Los Angeles, CA', 'established', '[]', 'individual',
   '{"individual":{"years":18,"foundedYear":2008,"led":"Community-led","badge":"Music as youth development","ed":"Angela Torres","boardSize":12,"budget":"$5-10M","programs":["After-School Music","Summer Intensive","College Prep Through Arts"],"topFunders":["LA arts commissions","National music foundations","Individual donors"],"demo":"Youth ages 6-18, low-income families, LA County"}}'),

  ('org-5', 'Every Child an Artist NYC', NULL,
   'Partnering with under-resourced schools to provide music and arts education to every student.',
   '["arts","education"]', 'New York, NY', 'community', '[]', 'individual',
   '{"individual":{"years":25,"foundedYear":2001,"led":"Community-led","badge":"Arts in every school","ed":"Tanya Washington","boardSize":14,"budget":"$5-10M","programs":["In-School Music","Teaching Artist Residency","Instrument Lending Library"],"topFunders":["NYC Dept of Education","Regional arts foundations","National endowments"],"demo":"K-8 students in Title I schools, NYC"}}'),

  ('org-6', 'NextGen Coaches', NULL,
   'Using sports as a tool for youth development by training and placing coaches in underserved communities.',
   '["sports","education"]', 'National', 'established', '[]', 'individual',
   '{"individual":{"years":14,"foundedYear":2012,"led":"Nationally staffed","badge":"Sports-based youth development","ed":"James Obi","boardSize":15,"budget":"$10-20M","programs":["Coach Corps","Youth Development Through Sports","Training & Certification"],"topFunders":["Federal service programs","National athletic brands","Health foundations"],"demo":"Youth in underserved communities, national, via coach pipeline"}}'),

  ('org-7', 'Level Playing Field', NULL,
   'Giving every child access to trained coaches and quality sports programming regardless of zip code.',
   '["sports"]', 'Oakland, CA', 'community', '[]', 'individual',
   '{"individual":{"years":10,"foundedYear":2016,"led":"Community-led","badge":"Trained coaches for every kid","ed":"Samantha Reyes","boardSize":8,"budget":"$1-2M","programs":["Volunteer Coach Training","Youth League Partnerships","Coach Mentorship"],"topFunders":["Regional health systems","National family foundations","Pro sports team foundations"],"demo":"Youth ages 5-18, Bay Area and expanding"}}'),

  ('org-8', 'Nourish Schools', NULL,
   'Connecting children to healthy food in school through hands-on nutrition education and garden programs.',
   '["food","education"]', 'National', 'established', '[]', 'individual',
   '{"individual":{"years":12,"foundedYear":2014,"led":"Nationally staffed","badge":"Healthy food in schools","ed":"Maria Santos","boardSize":11,"budget":"$15-20M","programs":["School Garden Corps","Nutrition Curriculum","Farm to Cafeteria"],"topFunders":["USDA","National health foundations","Agricultural endowments"],"demo":"K-8 students in high-need school districts, 18 states"}}'),

  ('org-9', 'Green Cart Market', NULL,
   'Mobile market bringing affordable fresh produce to neighborhoods with limited grocery access.',
   '["food"]', 'Boston, MA', 'emerging', '[]', 'individual',
   '{"individual":{"years":3,"foundedYear":2023,"led":"Community-led","badge":"Mobile food access","ed":"Terrence Mitchell","boardSize":5,"budget":"Under $500K","programs":["Mobile Market","SNAP Match Program","Community Pop-ups"],"topFunders":["Regional bank foundations","National grocery chains","Municipal health departments"],"demo":"Food-insecure neighborhoods, Dorchester/Roxbury/Mattapan"}}'),

  ('org-10', 'Wealth Roots', NULL,
   'Financial literacy and economic empowerment for underserved communities through coaching and homeownership programs.',
   '["economic"]', 'National', 'established', '[]', 'individual',
   '{"individual":{"years":28,"foundedYear":1998,"led":"Community-led","badge":"Financial empowerment","ed":"Christina Blake","boardSize":16,"budget":"$25M+","programs":["Financial Coaching","Homeownership Pipeline","Small Business Accelerator"],"topFunders":["National banks","Federal treasury programs","Corporate sponsors"],"demo":"Low-to-moderate income adults and youth, national"}}'),

  ('org-11', 'Future Ready Youth', NULL,
   'Preparing young people for economic success through hands-on business and financial literacy programs.',
   '["economic","education"]', 'Boston, MA', 'established', '[]', 'individual',
   '{"individual":{"years":40,"foundedYear":1986,"led":"Nationally staffed","badge":"Youth economic literacy","ed":"Patricia Owens","boardSize":22,"budget":"$5-10M","programs":["BizTown Simulations","Finance Academy","Entrepreneurship Program"],"topFunders":["Financial services firms","Insurance companies","Local corporate sponsors"],"demo":"K-12 students, Greater Boston, 40,000+ students annually"}}'),

  -- org-12: mission contains "world's" — apostrophe escaped as ''
  ('org-12', 'Global Health Partners', NULL,
   'Delivering healthcare to the world''s most vulnerable communities through community health worker networks.',
   '["health"]', 'International', 'established', '[]', 'individual',
   '{"individual":{"years":30,"foundedYear":1996,"led":"Nationally staffed","badge":"Healthcare for the most vulnerable","ed":"Dr. Amara Osei","boardSize":14,"budget":"$300M+","programs":["Community Health Workers","Rural Hospital Support","Medical Training"],"topFunders":["USAID","Global health funds","Major philanthropic foundations"],"demo":"10+ countries, focus on sub-Saharan Africa and Caribbean"}}'),

  ('org-13', 'Neighborhood Table', NULL,
   'Meeting the immediate needs of food-insecure families through community meals and wraparound support.',
   '["health","food"]', 'Malden, MA', 'community', '[]', 'individual',
   '{"individual":{"years":7,"foundedYear":2019,"led":"Community-led","badge":"Local hunger + health","ed":"Rosa Hernandez","boardSize":6,"budget":"Under $500K","programs":["Community Meals","Food Pantry","Family Resource Connections"],"topFunders":["Regional food banks","Municipal funding","Local faith communities"],"demo":"Malden/Medford/Everett residents experiencing food insecurity"}}'),

  ('org-14', 'Home Ground Alliance', NULL,
   'Building strength, stability, and self-reliance through affordable homebuilding and neighborhood revitalization.',
   '["housing"]', 'National', 'established', '[]', 'individual',
   '{"individual":{"years":35,"foundedYear":1991,"led":"Nationally staffed","badge":"Home building + ownership","ed":"Robert Kim","boardSize":20,"budget":"$500M+","programs":["Home Construction","Home Repair","Neighborhood Revitalization"],"topFunders":["National home improvement retailers","Appliance manufacturers","Federal housing programs"],"demo":"Low-income families, national, 50+ metro areas"}}'),

  ('org-15', 'Rooted Atlanta', NULL,
   'Resident-led affordable housing and community land trust development in South Atlanta neighborhoods.',
   '["housing","economic"]', 'Atlanta, GA', 'emerging', '[]', 'individual',
   '{"individual":{"years":4,"foundedYear":2022,"led":"Community-led","badge":"Resident-led housing","ed":"DeShawn Williams","boardSize":5,"budget":"Under $1M","programs":["Resident Councils","Homeownership Pipeline","Community Land Trust"],"topFunders":["City housing authority","National community development foundations","Regional enterprise funds"],"demo":"South Atlanta neighborhoods, primarily Black homebuyers"}}'),

  ('org-16', 'Green Roots Collective', NULL,
   'Youth-led environmental justice and community greening in neighborhoods most affected by pollution and climate change.',
   '["environment"]', 'National', 'community', '[]', 'individual',
   '{"individual":{"years":12,"foundedYear":2014,"led":"Community-led","badge":"Youth-led environmental justice","ed":"Jordan Whitehorse","boardSize":10,"budget":"$5-10M","programs":["Green Team Youth Corps","Brownfields Restoration","Climate Resilience Planning"],"topFunders":["EPA","USDA","National conservation agencies"],"demo":"Youth and communities in environmental justice zones, 20+ cities"}}'),

  ('org-17', 'Common Ground Interfaith', NULL,
   'Building bridges across religious and cultural divides through campus-based dialogue and service programs.',
   '["faith","education"]', 'National', 'established', '[]', 'individual',
   '{"individual":{"years":18,"foundedYear":2008,"led":"Nationally staffed","badge":"Interfaith bridge-building","ed":"Dr. Fatima Al-Rashid","boardSize":14,"budget":"$10-15M","programs":["Campus Dialogue Initiative","Interfaith Leadership Fellows","Community Service Corps"],"topFunders":["Religious endowments","Higher education foundations","National service organizations"],"demo":"College students and faculty, 500+ campuses"}}');

-- =============================================================================
-- PERSON (1 row — Marcus)
--
-- person.id is a fresh pre-computed UUID-shaped literal (NOT 'c-001').
-- The legacy individual fixture id 'c-001' rides in
-- extensions.legacy_individual_id per the locked ruling — top-level in
-- extensions (not nested under .individual) so it reads as a generic
-- legacy-bridge marker for the deferred same-person dedup gap.
--
-- auth_user_id = NULL per FT-approved option B (seed leaves it NULL;
-- the auth slice claims this row on Marcus's first real magic-link
-- sign-in by looking up legacy_individual_id = 'c-001' and updating
-- auth_user_id to the new auth_user.id).
-- =============================================================================

INSERT INTO person (id, auth_user_id, display_name, initials, type, source_surface, extensions, soft_deleted_at, deletion_state) VALUES
  ('01000000-0000-4000-8000-000000000001', NULL, 'Marcus Thompson', 'MT', 'individual', 'individual',
   '{"legacy_individual_id":"c-001","individual":{"sport":"Basketball","level":"Junior college","geoDetail":"Cleveland, Ohio area","causes":["education","sports","economic"],"visibility":"private","budget":"$1K – $10K","givingStyle":"Quiet builder","worldLabel":"Athletics","givingPlanStatement":"Direct support to youth basketball programs in the Cleveland area where I grew up. Multi-year, unrestricted where possible. Quiet about it — no public attribution unless the organization specifically asks."}}',
   NULL, NULL);

-- =============================================================================
-- GIFT (3 rows — Marcus's seed gifts)
--
-- Gift ids are fresh pre-computed UUID-shaped literals. Legacy 'g-001'..
-- 'g-003' are dropped — the gift table has no extensions column to stash
-- them and they have zero downstream consumers outside Marcus's fixture.
--
-- recipient_org_id = NULL on all 3 by-design (none of the three org names
-- match the 17-catalog). recipient_org_name carries the display fallback
-- per ruling D. exported_to_cpa = 0 (Parker's only lifecycle-adjacent
-- column; default state).
-- =============================================================================

INSERT INTO gift (id, giver_person_id, recipient_org_id, recipient_org_name, amount, date, type, vehicle, recurring, notes, source_surface, exported_to_cpa) VALUES
  ('01000000-0000-4000-8000-000000000101', '01000000-0000-4000-8000-000000000001', NULL,
   'Cleveland Youth Hoops Foundation', 5000, '2026-03-12',
   'unrestricted', 'personal', 0, NULL, 'individual', 0),

  ('01000000-0000-4000-8000-000000000102', '01000000-0000-4000-8000-000000000001', NULL,
   'Northeast Ohio Sports Access Coalition', 2500, '2026-01-28',
   'unrestricted', 'personal', 1, NULL, 'individual', 0),

  ('01000000-0000-4000-8000-000000000103', '01000000-0000-4000-8000-000000000001', NULL,
   'Cleveland Public Schools Athletics Fund', 1000, '2025-12-15',
   'unrestricted', 'daf', 0, NULL, 'individual', 0);
