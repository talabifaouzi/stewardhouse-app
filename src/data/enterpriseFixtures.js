// -----------------------------------------------------------------------------
// JSDoc typedefs — fixture entity shapes for IDE hover + autocomplete.
// -----------------------------------------------------------------------------

/**
 * @typedef {Object} ActivityEvent
 * @property {string} date
 * @property {string} type
 * @property {string} label
 */

/**
 * @typedef {Object} Athlete
 * @property {number} id
 * @property {string} name
 * @property {string} sport
 * @property {string} year
 * @property {string} position
 * @property {boolean} gpsCompleted
 * @property {string|null} gpsDate
 * @property {number} lessons
 * @property {number} gifts
 * @property {string} lastActive
 * @property {string} status
 * @property {string|null} joinDate
 * @property {string|null} badge
 * @property {boolean} certified
 * @property {string|null} certDate
 * @property {string} email
 * @property {string} phone
 * @property {string} notes
 * @property {Array<ActivityEvent>} activity
 */

/**
 * @typedef {Object} FollowUp
 * @property {number} id
 * @property {string} description
 * @property {string} owner
 * @property {string} dueDate
 * @property {string} status
 */

/**
 * @typedef {Object} Workshop
 * @property {number} id
 * @property {string} date
 * @property {string} title
 * @property {string} status
 * @property {number|null} attendees
 * @property {string} notes
 * @property {string} facilitator
 * @property {string} module
 * @property {string} summary
 * @property {Array<{athleteId: number, attended: boolean, note: string|null}>} attendance
 * @property {Array<FollowUp>} followUps
 */

/**
 * @typedef {Object} Exclusion
 * @property {number} id
 * @property {string} name
 * @property {string} ein
 * @property {string} reason
 * @property {string} flagged
 * @property {string} connection
 * @property {string} connectionDetail
 */

/**
 * @typedef {Object} Contact
 * @property {string} id
 * @property {string} name
 * @property {string} title
 * @property {string} organization
 * @property {string} email
 * @property {string} phone
 * @property {string} role
 * @property {string} bio
 */

/** @type {Array<{id: string, sector: string, name: string, dept: string, contract: string, facilitator: string, tier: string, annual: string, endowment: string}>} */
export const INST_PROFILES = [
  {
    id: "athletics",
    sector: "Athletics",
    name: "Cooper State University",
    dept: "Athletic Department",
    contract: "Season Residency — Aug 2026 to May 2027",
    facilitator: "Morgan Walker",
    tier: "Revenue Sports Package",
    annual: "$85,000",
    endowment: "$8,500/yr", // annual contribution into the department's endowment, NOT total endowment size
  },
];

/** @type {Array<Athlete>} */
export const athletes = [
  {
    id: 1, name: "Marcus Thompson", sport: "Basketball", year: "Junior", position: "Guard",
    gpsCompleted: true, gpsDate: "2026-09-20", lessons: 5, gifts: 3, lastActive: "2d ago",
    status: "active", joinDate: "2026-08-28", badge: "The Quiet Builder", certified: false, certDate: null,
    email: "marcus.thompson@cooperstate.edu",
    phone: "(555) 312-4781",
    notes: "Communications major from Detroit. Building a giving practice around youth basketball access in his hometown. Quietly committed to multi-year gifts rather than one-time donations.",
    activity: [
      { date: "2026-11-08", type: "lesson_completed",  label: "Lesson 5: Giving Vehicles" },
      { date: "2026-10-20", type: "workshop_attended", label: "Giving Vehicles & Tax Strategy" },
      { date: "2026-10-12", type: "gift_made",         label: "$250 to Detroit Youth Hoops" },
      { date: "2026-10-05", type: "lesson_completed",  label: "Lesson 1: Building Your GPS" },
      { date: "2026-09-20", type: "gps_completed",     label: "GPS completed" },
      { date: "2026-09-15", type: "workshop_attended", label: "Kickoff: Building Your GPS" },
      { date: "2026-08-28", type: "note_added",        label: "Initial outreach — interested in giving back to Detroit youth programs" },
    ],
  },
  {
    id: 2, name: "Aaliyah Williams", sport: "Track & Field", year: "Senior", position: "400m",
    gpsCompleted: true, gpsDate: "2026-09-15", lessons: 9, gifts: 5, lastActive: "1d ago",
    status: "active", joinDate: "2026-08-25", badge: "The Amplifier", certified: true, certDate: "2026-11-02",
    email: "aaliyah.williams@cooperstate.edu",
    phone: "(555) 248-9102",
    notes: "Pre-med, planning to specialize in pediatrics. Funding interest centers on youth sports programs in underserved communities where access to formal training is limited.",
    activity: [
      { date: "2026-11-02", type: "certified",         label: "Certification awarded" },
      { date: "2026-10-30", type: "lesson_completed",  label: "Lesson 9: Capstone Reflection" },
      { date: "2026-10-25", type: "gift_made",         label: "$500 to Atlanta Track Foundation" },
      { date: "2026-10-20", type: "workshop_attended", label: "Giving Vehicles & Tax Strategy" },
      { date: "2026-10-08", type: "gift_made",         label: "$300 to Girls on the Run" },
      { date: "2026-09-22", type: "lesson_completed",  label: "Lesson 3: Giving Identity" },
      { date: "2026-09-15", type: "gps_completed",     label: "GPS completed" },
      { date: "2026-08-25", type: "note_added",        label: "Initial outreach — first-generation college, interested in pediatric health access" },
    ],
  },
  {
    id: 3, name: "Devon Carter", sport: "Football", year: "Sophomore", position: "WR",
    gpsCompleted: true, gpsDate: "2026-10-01", lessons: 3, gifts: 1, lastActive: "5d ago",
    status: "active", joinDate: "2026-08-28", badge: "The Builder", certified: false, certDate: null,
    email: "devon.carter@cooperstate.edu",
    phone: "(555) 405-3287",
    notes: "Sociology major from Houston, focused on community-based athletic mentorship. Early in his thinking but engaged — asks careful questions about organizational vetting.",
    activity: [
      { date: "2026-11-05", type: "lesson_completed",  label: "Lesson 3: Giving Identity" },
      { date: "2026-10-20", type: "workshop_attended", label: "Giving Vehicles & Tax Strategy" },
      { date: "2026-10-15", type: "gift_made",         label: "$150 to Houston Sports Youth Alliance" },
      { date: "2026-10-10", type: "lesson_completed",  label: "Lesson 1: Building Your GPS" },
      { date: "2026-10-01", type: "gps_completed",     label: "GPS completed" },
      { date: "2026-08-28", type: "note_added",        label: "Initial outreach — asked thoughtful questions about due diligence" },
    ],
  },
  {
    id: 4, name: "Jasmine Okafor", sport: "Soccer", year: "Junior", position: "MF",
    gpsCompleted: true, gpsDate: "2026-09-22", lessons: 4, gifts: 2, lastActive: "3d ago",
    status: "active", joinDate: "2026-08-30", badge: "The Connector", certified: false, certDate: null,
    email: "jasmine.okafor@cooperstate.edu",
    phone: "(555) 173-6248",
    notes: "Daughter of Nigerian immigrants. Drawn to diaspora-connected giving — looking at organizations that support athletic development in West Africa as well as her local Chicago youth soccer leagues.",
    activity: [
      { date: "2026-11-06", type: "lesson_completed",  label: "Lesson 4: Vetting Organizations" },
      { date: "2026-10-25", type: "gift_made",         label: "$200 to Lagos Football Youth Initiative" },
      { date: "2026-10-20", type: "workshop_attended", label: "Giving Vehicles & Tax Strategy" },
      { date: "2026-10-12", type: "lesson_completed",  label: "Lesson 2: Cause Discovery" },
      { date: "2026-10-05", type: "gift_made",         label: "$150 to Chicago South Side Soccer" },
      { date: "2026-09-22", type: "gps_completed",     label: "GPS completed" },
      { date: "2026-08-30", type: "note_added",        label: "Initial outreach — interested in diaspora-connected giving" },
    ],
  },
  {
    id: 5, name: "Tyler Brooks", sport: "Basketball", year: "Freshman", position: "F",
    gpsCompleted: false, gpsDate: null, lessons: 1, gifts: 0, lastActive: "14d ago",
    status: "inactive", joinDate: "2026-09-05", badge: null, certified: false, certDate: null,
    email: "tyler.brooks@cooperstate.edu",
    phone: "(555) 528-1947",
    notes: "Completed Lesson 1, then went quiet. Mid-semester pressures appear to have pulled focus. Check-in scheduled.",
    activity: [
      { date: "2026-11-01", type: "note_added",        label: "Check-in scheduled — no response to last two messages" },
      { date: "2026-10-15", type: "note_added",        label: "Follow-up email sent regarding GPS completion" },
      { date: "2026-10-02", type: "lesson_completed",  label: "Lesson 1: Building Your GPS" },
      { date: "2026-09-15", type: "workshop_attended", label: "Kickoff: Building Your GPS" },
      { date: "2026-09-05", type: "note_added",        label: "Initial outreach" },
    ],
  },
  {
    id: 6, name: "Keisha Davis", sport: "Volleyball", year: "Senior", position: "Setter",
    gpsCompleted: true, gpsDate: "2026-09-12", lessons: 9, gifts: 4, lastActive: "1d ago",
    status: "active", joinDate: "2026-08-22", badge: "The Steward", certified: true, certDate: "2026-10-28",
    email: "keisha.davis@cooperstate.edu",
    phone: "(555) 619-8334",
    notes: "Education major, planning to teach high school after graduation. Already running a small mentorship loop for younger players on her team. Treats her giving as part of that same practice.",
    activity: [
      { date: "2026-10-28", type: "certified",         label: "Certification awarded" },
      { date: "2026-10-25", type: "lesson_completed",  label: "Lesson 9: Capstone Reflection" },
      { date: "2026-10-20", type: "workshop_attended", label: "Giving Vehicles & Tax Strategy" },
      { date: "2026-10-15", type: "gift_made",         label: "$400 to Memphis Educators Coalition" },
      { date: "2026-10-05", type: "gift_made",         label: "$200 to Volleyball Players Bridge" },
      { date: "2026-09-25", type: "lesson_completed",  label: "Lesson 3: Giving Identity" },
      { date: "2026-09-12", type: "gps_completed",     label: "GPS completed" },
      { date: "2026-08-22", type: "note_added",        label: "Initial outreach — described existing mentorship as her template" },
    ],
  },
  {
    id: 7, name: "Andre Mitchell", sport: "Football", year: "Junior", position: "LB",
    gpsCompleted: true, gpsDate: "2026-10-05", lessons: 2, gifts: 0, lastActive: "21d ago",
    status: "inactive", joinDate: "2026-08-28", badge: "The Learner", certified: false, certDate: null,
    email: "andre.mitchell@cooperstate.edu",
    phone: "(555) 731-4502",
    notes: "Completed two lessons, then no activity since midterms. Family financial pressure is complicating his timeline. Conversation pending.",
    activity: [
      { date: "2026-10-25", type: "note_added",        label: "Outreach paused pending end-of-semester check-in" },
      { date: "2026-10-12", type: "lesson_completed",  label: "Lesson 2: Cause Discovery" },
      { date: "2026-10-05", type: "gps_completed",     label: "GPS completed" },
      { date: "2026-09-15", type: "workshop_attended", label: "Kickoff: Building Your GPS" },
      { date: "2026-08-28", type: "note_added",        label: "Initial outreach — wants to focus on causes once school stabilizes" },
    ],
  },
  {
    id: 8, name: "Sofia Reyes", sport: "Swimming", year: "Sophomore", position: "Free",
    gpsCompleted: false, gpsDate: null, lessons: 0, gifts: 0, lastActive: "Never",
    status: "invited", joinDate: null, badge: null, certified: false, certDate: null,
    email: "sofia.reyes@cooperstate.edu",
    phone: "(555) 287-5610",
    notes: "Recently invited, has not yet engaged. Coach flagged interest in supporting Latino youth swimming access — to revisit in spring outreach.",
    activity: [
      { date: "2026-11-10", type: "note_added",        label: "No response to follow-up; pending re-outreach in spring semester" },
      { date: "2026-10-25", type: "note_added",        label: "Second outreach email sent" },
      { date: "2026-10-08", type: "note_added",        label: "Coach context — interested in Latino youth swim programs" },
      { date: "2026-09-22", type: "note_added",        label: "First outreach email sent" },
      { date: "2026-09-15", type: "note_added",        label: "Added to program invite list per Coach Reyes" },
    ],
  },
  {
    id: 9, name: "Chris Walker", sport: "Baseball", year: "Senior", position: "SS",
    gpsCompleted: true, gpsDate: "2026-09-18", lessons: 6, gifts: 3, lastActive: "4d ago",
    status: "active", joinDate: "2026-08-26", badge: "The Quiet Builder", certified: false, certDate: null,
    email: "chris.walker@cooperstate.edu",
    phone: "(555) 459-2710",
    notes: "Lifelong baseball player from rural Iowa. Building a giving practice around rural sports access — argues the funding gap for kids outside metro areas gets less attention than it should.",
    activity: [
      { date: "2026-11-04", type: "lesson_completed",  label: "Lesson 6: Tax Strategy" },
      { date: "2026-10-22", type: "gift_made",         label: "$300 to Iowa Rural Athletics Foundation" },
      { date: "2026-10-20", type: "workshop_attended", label: "Giving Vehicles & Tax Strategy" },
      { date: "2026-10-10", type: "lesson_completed",  label: "Lesson 3: Giving Identity" },
      { date: "2026-09-28", type: "gift_made",         label: "$200 to Small Town Sports Coalition" },
      { date: "2026-09-18", type: "gps_completed",     label: "GPS completed" },
      { date: "2026-08-26", type: "note_added",        label: "Initial outreach — named rural funding gap as an area of interest" },
    ],
  },
  {
    id: 10, name: "Maya Johnson", sport: "Basketball", year: "Freshman", position: "G",
    gpsCompleted: false, gpsDate: null, lessons: 0, gifts: 0, lastActive: "Never",
    status: "invited", joinDate: null, badge: null, certified: false, certDate: null,
    email: "maya.johnson@cooperstate.edu",
    phone: "(555) 681-3927",
    notes: "First-semester freshman, hasn't yet engaged with the program. Initial outreach noted she wants to focus on academics first. Plan to revisit in spring.",
    activity: [
      { date: "2026-11-05", type: "note_added",        label: "Spring re-engagement scheduled per her preference" },
      { date: "2026-10-12", type: "note_added",        label: "Reply: prefers to wait until second semester" },
      { date: "2026-09-28", type: "note_added",        label: "Second outreach email sent" },
      { date: "2026-09-15", type: "note_added",        label: "Initial outreach email sent" },
      { date: "2026-09-08", type: "note_added",        label: "Added to program invite list" },
    ],
  },
  {
    id: 11, name: "Elijah Brown", sport: "Football", year: "Junior", position: "CB",
    gpsCompleted: true, gpsDate: "2026-09-28", lessons: 4, gifts: 2, lastActive: "7d ago",
    status: "active", joinDate: "2026-08-28", badge: "The Builder", certified: false, certDate: null,
    email: "elijah.brown@cooperstate.edu",
    phone: "(555) 372-6418",
    notes: "Pursuing pre-law. Drawn to civic and criminal justice causes — particularly programs that work with youth diverted from the juvenile system into structured activity.",
    activity: [
      { date: "2026-11-03", type: "lesson_completed",  label: "Lesson 4: Vetting Organizations" },
      { date: "2026-10-20", type: "workshop_attended", label: "Giving Vehicles & Tax Strategy" },
      { date: "2026-10-15", type: "gift_made",         label: "$300 to Youth Diversion Mentorship Project" },
      { date: "2026-10-08", type: "lesson_completed",  label: "Lesson 2: Cause Discovery" },
      { date: "2026-09-28", type: "gps_completed",     label: "GPS completed" },
      { date: "2026-08-28", type: "note_added",        label: "Initial outreach — interested in youth justice work" },
    ],
  },
  {
    id: 12, name: "Destiny Clark", sport: "Softball", year: "Senior", position: "P",
    gpsCompleted: true, gpsDate: "2026-09-10", lessons: 9, gifts: 6, lastActive: "Today",
    status: "active", joinDate: "2026-08-20", badge: "The Steward", certified: true, certDate: "2026-10-15",
    email: "destiny.clark@cooperstate.edu",
    phone: "(555) 514-8273",
    notes: "Engaged consistently across sessions and gifts. Established giving around women's sports access — drew on her own pitching coach's youth program as a model.",
    activity: [
      { date: "2026-10-15", type: "certified",         label: "Certification awarded" },
      { date: "2026-10-12", type: "lesson_completed",  label: "Lesson 9: Capstone Reflection" },
      { date: "2026-10-10", type: "gift_made",         label: "$500 to Women's Pitching Network" },
      { date: "2026-10-05", type: "gift_made",         label: "$300 to Girls Softball Access Coalition" },
      { date: "2026-09-28", type: "lesson_completed",  label: "Lesson 5: Giving Vehicles" },
      { date: "2026-09-22", type: "lesson_completed",  label: "Lesson 4: Vetting Organizations" },
      { date: "2026-09-10", type: "gps_completed",     label: "GPS completed" },
      { date: "2026-08-20", type: "note_added",        label: "Initial outreach — references coach's mentorship model" },
    ],
  },
  {
    id: 13, name: "Jordan Lewis", sport: "Football", year: "Senior", position: "QB",
    gpsCompleted: true, gpsDate: "2026-09-08", lessons: 9, gifts: 4, lastActive: "Today",
    status: "active", joinDate: "2026-08-20", badge: "The Amplifier", certified: true, certDate: "2026-10-10",
    email: "jordan.lewis@cooperstate.edu",
    phone: "(555) 248-3061",
    notes: "Team captain. Completed capstone with a structured giving plan focused on football-specific youth pipelines. Active in workshop discussions on team-level vehicles.",
    activity: [
      { date: "2026-10-10", type: "certified",         label: "Certification awarded" },
      { date: "2026-10-05", type: "lesson_completed",  label: "Lesson 9: Capstone Reflection" },
      { date: "2026-09-30", type: "gift_made",         label: "$400 to Quarterback Foundation Youth Outreach" },
      { date: "2026-09-22", type: "gift_made",         label: "$250 to Pop Warner Equipment Fund" },
      { date: "2026-09-15", type: "workshop_attended", label: "Kickoff: Building Your GPS" },
      { date: "2026-09-12", type: "lesson_completed",  label: "Lesson 4: Vetting Organizations" },
      { date: "2026-09-08", type: "gps_completed",     label: "GPS completed" },
      { date: "2026-08-20", type: "note_added",        label: "Initial outreach — captain energy, brought teammates in" },
    ],
  },
  {
    id: 14, name: "Mia Chang", sport: "Tennis", year: "Junior", position: "Singles",
    gpsCompleted: true, gpsDate: "2026-10-02", lessons: 5, gifts: 2, lastActive: "6d ago",
    status: "active", joinDate: "2026-09-01", badge: "The Connector", certified: false, certDate: null,
    email: "mia.chang@cooperstate.edu",
    phone: "(555) 437-9026",
    notes: "Bay Area family. Engaged early. Bay Area tennis access and student-athlete mental health are both surfacing as focus areas.",
    activity: [
      { date: "2026-11-04", type: "lesson_completed",  label: "Lesson 5: Giving Vehicles" },
      { date: "2026-10-25", type: "gift_made",         label: "$200 to Student-Athlete Mental Health Initiative" },
      { date: "2026-10-20", type: "workshop_attended", label: "Giving Vehicles & Tax Strategy" },
      { date: "2026-10-12", type: "gift_made",         label: "$150 to Bay Area Youth Tennis Foundation" },
      { date: "2026-10-08", type: "lesson_completed",  label: "Lesson 3: Giving Identity" },
      { date: "2026-10-02", type: "gps_completed",     label: "GPS completed" },
      { date: "2026-09-01", type: "note_added",        label: "Initial outreach — exploring mental health access for athletes" },
    ],
  },
  {
    id: 15, name: "DeSean Harris", sport: "Football", year: "Sophomore", position: "RB",
    gpsCompleted: true, gpsDate: "2026-10-08", lessons: 3, gifts: 1, lastActive: "3d ago",
    status: "active", joinDate: "2026-09-02", badge: "The Learner", certified: false, certDate: null,
    email: "desean.harris@cooperstate.edu",
    phone: "(555) 615-4892",
    notes: "Studious and methodical — works through readings before sessions. Still early in identifying his focus but consistently shows up.",
    activity: [
      { date: "2026-11-05", type: "lesson_completed",  label: "Lesson 3: Giving Identity" },
      { date: "2026-10-20", type: "workshop_attended", label: "Giving Vehicles & Tax Strategy" },
      { date: "2026-10-15", type: "gift_made",         label: "$150 to High School Football Books" },
      { date: "2026-10-12", type: "lesson_completed",  label: "Lesson 1: Building Your GPS" },
      { date: "2026-10-08", type: "gps_completed",     label: "GPS completed" },
      { date: "2026-09-02", type: "note_added",        label: "Initial outreach — methodical, asked for pre-session readings" },
    ],
  },
  {
    id: 16, name: "Ava Petrova", sport: "Gymnastics", year: "Freshman", position: "AA",
    gpsCompleted: false, gpsDate: null, lessons: 1, gifts: 0, lastActive: "10d ago",
    status: "inactive", joinDate: "2026-09-10", badge: null, certified: false, certDate: null,
    email: "ava.petrova@cooperstate.edu",
    phone: "(555) 793-2148",
    notes: "Started slowly. Mentioned family pressure to focus on academics in first semester. Engagement has been intermittent — most recent activity around mid-October.",
    activity: [
      { date: "2026-11-02", type: "note_added",        label: "Follow-up about completing GPS — no reply yet" },
      { date: "2026-10-18", type: "lesson_completed",  label: "Lesson 1: Building Your GPS" },
      { date: "2026-10-05", type: "note_added",        label: "Asked for extension to complete GPS" },
      { date: "2026-09-15", type: "workshop_attended", label: "Kickoff: Building Your GPS" },
      { date: "2026-09-10", type: "note_added",        label: "Initial outreach — family wants academics-first first semester" },
    ],
  },
];

/** @type {Array<Workshop>} */
export const workshops = [
  {
    id: 1, date: "2026-09-15", title: "Kickoff: Building Your GPS",
    status: "completed", attendees: 12,
    notes: "12 of 16 attended. Three participants asked about DAFs.",
    facilitator: "Morgan Walker",
    module: "Module 1: Building Your GPS",
    summary: "Introductory session covering the GPS framework. Athletes drafted initial cause statements and identified personal connections to causes.",
    attendance: [
      { athleteId: 1,  attended: true,  note: null },
      { athleteId: 2,  attended: true,  note: null },
      { athleteId: 3,  attended: true,  note: null },
      { athleteId: 4,  attended: true,  note: null },
      { athleteId: 5,  attended: true,  note: null },
      { athleteId: 6,  attended: true,  note: null },
      { athleteId: 7,  attended: true,  note: null },
      { athleteId: 8,  attended: false, note: "Invited, not yet engaged" },
      { athleteId: 9,  attended: true,  note: null },
      { athleteId: 10, attended: false, note: "Invited, not yet engaged" },
      { athleteId: 11, attended: true,  note: null },
      { athleteId: 12, attended: true,  note: null },
      { athleteId: 13, attended: true,  note: null },
      { athleteId: 14, attended: false, note: "Joined Sep 1, did not attend kickoff" },
      { athleteId: 15, attended: false, note: "Joined Sep 2, did not attend kickoff" },
      { athleteId: 16, attended: true,  note: null },
    ],
    followUps: [
      { id: 'w1-fu-1', owner: 'Morgan Walker', ownerRole: 'Facilitator', action: '1:1 GPS coaching sessions for athletes who did not complete cause statement during workshop', target: '4 athletes', status: 'completed', completedDate: '2026-10-05' },
      { id: 'w1-fu-2', owner: 'Diane Okonkwo', ownerRole: 'Senior Director, Athletic Development', action: 'Confirm RSVPs for W2 with cohort', target: 'Cohort-wide', status: 'completed', completedDate: '2026-10-10' },
      { id: 'w1-fu-3', owner: 'Cohort', ownerRole: 'Athletes (self-directed)', action: 'Complete GPS framework draft before next workshop (12 of 16 completed by deadline)', target: '16 athletes', status: 'completed', completedDate: '2026-10-18' },
      { id: 'w1-fu-4', owner: 'Sarah Mitchell', ownerRole: 'Athletic Compliance Officer', action: 'Review submitted GPS frameworks against NIL conflict checklist', target: '12 GPS completers', status: 'completed', completedDate: '2026-10-19' },
    ],
  },
  {
    id: 2, date: "2026-10-20", title: "Giving Vehicles & Tax Strategy",
    status: "completed", attendees: 12,
    notes: "2 absent (scheduling conflict). Recording shared.",
    facilitator: "Morgan Walker",
    module: "Modules 5 & 6: Giving Vehicles + Tax Strategy",
    summary: "Deep-dive on giving vehicles (DAFs, family foundations, direct giving) and tax considerations. Recording shared with absent participants.",
    attendance: [
      { athleteId: 1,  attended: true,  note: null },
      { athleteId: 2,  attended: true,  note: null },
      { athleteId: 3,  attended: true,  note: null },
      { athleteId: 4,  attended: true,  note: null },
      { athleteId: 5,  attended: false, note: "Stalled — no contact since Sep 5" },
      { athleteId: 6,  attended: true,  note: null },
      { athleteId: 7,  attended: true,  note: null },
      { athleteId: 8,  attended: false, note: "Invited, still not engaged" },
      { athleteId: 9,  attended: true,  note: null },
      { athleteId: 10, attended: false, note: "Spring re-engagement scheduled" },
      { athleteId: 11, attended: true,  note: null },
      { athleteId: 12, attended: true,  note: null },
      { athleteId: 13, attended: true,  note: null },
      { athleteId: 14, attended: true,  note: null },
      { athleteId: 15, attended: true,  note: null },
      { athleteId: 16, attended: false, note: "Family pressure — academics-first this semester" },
    ],
    followUps: [
      { id: 'w2-fu-1', owner: 'Morgan Walker', ownerRole: 'Facilitator', action: 'Curate vehicles deep-dive resource pack for athletes asking about DAFs', target: '5 athletes', status: 'completed', completedDate: '2026-10-28' },
      { id: 'w2-fu-2', owner: 'Diane Okonkwo', ownerRole: 'Senior Director, Athletic Development', action: 'Send tax-advisor referral list to athletes who requested', target: 'Marcus Thompson, Keisha Davis, Jordan Lewis', status: 'completed', completedDate: '2026-10-25' },
      { id: 'w2-fu-3', owner: 'Cohort', ownerRole: 'Athletes (self-directed)', action: 'Reflect on Lesson 5 content and journal entry', target: '16 athletes', status: 'in_progress', dueDate: '2026-11-14' },
      { id: 'w2-fu-4', owner: 'Sarah Mitchell', ownerRole: 'Athletic Compliance Officer', action: 'Verify recipient organizations referenced in workshop have current 501(c)(3) status', target: '7 organizations', status: 'completed', completedDate: '2026-10-24' },
    ],
  },
  {
    id: 3, date: "2026-11-17", title: "Vetting Organizations",
    status: "upcoming", attendees: null, notes: "",
    facilitator: "Morgan Walker",
    module: "Module 4: Vetting Organizations",
    summary: "How to evaluate nonprofit organizations: 990 reading, mission alignment, operational health. Pre-reading materials to be distributed.",
    attendance: [],
    followUps: [
      { id: 'w3-fu-1', owner: 'Morgan Walker', ownerRole: 'Facilitator', action: 'Prepare W3 workshop materials and case studies', target: 'Workshop deliverables', status: 'in_progress', dueDate: '2026-11-14' },
      { id: 'w3-fu-2', owner: 'Diane Okonkwo', ownerRole: 'Senior Director, Athletic Development', action: 'Confirm room booking and virtual link for W3', target: 'Logistics', status: 'completed', completedDate: '2026-11-05' },
      { id: 'w3-fu-3', owner: 'Diane Okonkwo', ownerRole: 'Senior Director, Athletic Development', action: 'Pre-workshop check-in with stalled athletes', target: 'Tyler Brooks, Andre Mitchell, Ava Petrova', status: 'in_progress', dueDate: '2026-11-15' },
      { id: 'w3-fu-4', owner: 'Sarah Mitchell', ownerRole: 'Athletic Compliance Officer', action: 'Compile current exclusion list for workshop reference', target: 'Workshop reference materials', status: 'in_progress', dueDate: '2026-11-16' },
    ],
  },
  {
    id: 4, date: "2027-02-16", title: "Year-End Review & Planning",
    status: "scheduled", attendees: null, notes: "",
    facilitator: "Morgan Walker",
    module: "Module 8: Year-End Review",
    summary: "Mid-year reflection: review of giving year-to-date, planning for January–April. Athletes will share progress with cohort.",
    attendance: [],
    followUps: [
      { id: 'w4-fu-1', owner: 'Morgan Walker', ownerRole: 'Facilitator', action: 'Workshop planning not yet started', status: 'pending' },
    ],
  },
  {
    id: 5, date: "2027-04-14", title: "Capstone: Reflection & Next Steps",
    status: "scheduled", attendees: null, notes: "",
    facilitator: "Morgan Walker",
    module: "Module 9: Capstone Reflection",
    summary: "Capstone session. Athletes present completed giving plans, reflect on the program, and identify next steps for ongoing practice.",
    attendance: [],
    followUps: [
      { id: 'w5-fu-1', owner: 'Morgan Walker', ownerRole: 'Facilitator', action: 'Workshop planning not yet started', status: 'pending' },
    ],
  },
];

export const engagementTimeline = [35, 42, 50, 48, 58, 62, 55, 67, 72, 64, 70, 75]; // 12 weeks of weekly active %

/** @type {Array<string>} */
export const engagementWeekDates = [
  '2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05',
  '2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16',
];

/** @type {Array<Array<number>>} */
export const engagedAthletesByWeek = [
  [1, 2, 6, 9, 12, 13],                          // W1 — 6 athletes (~37.5%)
  [1, 2, 6, 9, 12, 13, 14],                      // W2 — 7 (~43.8%)
  [1, 2, 4, 6, 9, 12, 13, 14],                   // W3 — 8 (50%)
  [1, 2, 6, 9, 12, 13, 14, 15],                  // W4 — 8 (50%)
  [1, 2, 4, 6, 9, 11, 12, 13, 15],               // W5 — 9 (~56.3%)
  [1, 2, 3, 4, 6, 9, 11, 12, 13, 15],            // W6 — 10 (62.5%)
  [1, 2, 3, 4, 6, 9, 11, 12, 13],                // W7 — 9 (~56.3%)
  [1, 2, 3, 4, 6, 9, 11, 12, 13, 14, 15],        // W8 — 11 (~68.8%)
  [1, 2, 3, 4, 6, 7, 9, 11, 12, 13, 14, 15],     // W9 — 12 (75%)
  [1, 2, 3, 4, 6, 9, 11, 12, 13, 15],            // W10 — 10 (62.5%)
  [1, 2, 3, 4, 6, 9, 11, 12, 13, 14, 15],        // W11 — 11 (~68.8%)
  [1, 2, 3, 4, 6, 7, 9, 11, 12, 13, 14, 15],     // W12 — 12 (75%)
];

/** @type {Array<Exclusion>} */
export const exclusions = [
  {
    id: 1, name: "Booster Club Foundation", ein: "04-9912345",
    reason: "Booster connection", flagged: "Sep 15, 2026",
    connection: "Cooper State Athletics Booster Association",
    connectionDetail: "This organization is operated by Cooper State Athletics Booster Association — the primary booster organization for Cooper State athletics. Donations could be construed as benefiting the athletic program directly, raising NIL compliance concerns. Exclusion preserves the structural separation between athlete giving and program benefit.",
  },
  {
    id: 2, name: "Meridian Community Fund", ein: "04-7781234",
    reason: "Conflict of interest", flagged: "Sep 20, 2026",
    connection: "Coach J. Reeves immediate family",
    connectionDetail: "Coach Reeves's spouse serves on the board of this organization. Recommending gifts to this org would create real or perceived conflict of interest — staff influence over athlete giving recommendations directed toward family-affiliated entities. Exclusion preserves advisor independence.",
  },
  {
    id: 3, name: "Victory Sports Fund", ein: "04-5534567",
    reason: "Booster connection", flagged: "Oct 1, 2026",
    connection: "Cooper State Athletics Booster Association",
    connectionDetail: "Affiliated with Cooper State Athletics Booster Association via shared board members and overlapping fundraising operations. Same NIL compliance rationale as Booster Club Foundation — donations could be construed as benefiting the athletic program. Exclusion preserves structural separation.",
  },
];

/** @type {Array<Contact>} */
export const contacts = [
  {
    id: 'diane',
    name: 'Diane Okonkwo',
    title: 'Senior Director, Athletic Development',
    organization: 'Cooper State University',
    email: 'diane.okonkwo@cooperstate.edu',
    phone: '(555) 234-0091',
    role: 'athletic_dept_admin',
    bio: 'Director of Cooper State Athletics with 12 years in collegiate athletics administration. Oversees compliance, NIL programs, and athlete development initiatives.',
  },
  {
    id: 'morgan',
    name: 'Morgan Walker',
    title: 'Founding Partner',
    organization: 'Walker Philanthropic Advisory',
    email: 'morgan@walkerphilanthropic.com',
    phone: '(555) 612-4400',
    role: 'facilitator',
    bio: 'Founding partner at Walker Philanthropic Advisory. Specializes in athlete philanthropy with a focus on multi-year giving strategies and cause discovery for first-time donors.',
  },
  {
    id: 'npark',
    name: 'N. Park',
    title: 'Senior Advisor',
    organization: 'Walker Philanthropic Advisory',
    email: 'n.park@walkerphilanthropic.com',
    phone: '(555) 612-4401',
    role: 'co_advisor',
    bio: 'Senior advisor at Walker Philanthropic Advisory. Background in family foundation operations and impact measurement.',
  },
  {
    id: 'treeves',
    name: 'T. Reeves',
    title: 'Senior Advisor',
    organization: 'Walker Philanthropic Advisory',
    email: 't.reeves@walkerphilanthropic.com',
    phone: '(555) 612-4402',
    role: 'co_advisor',
    bio: 'Senior advisor at Walker Philanthropic Advisory. Focus on tax strategy and giving vehicle selection.',
  },
  {
    id: 'stewardhouse_rep',
    name: 'Jordan Avery',
    title: 'Partnership Lead',
    organization: 'StewardHouse',
    email: 'jordan@stewardhouse.com',
    phone: '(555) 887-3201',
    role: 'stewardhouse_rep',
    bio: 'Partnership lead at StewardHouse. Primary point of contact for institutional onboarding, contract questions, and platform support.',
  },
];

/** @type {{currentValue: number, contributionsToDate: number, growthToDate: number, asOfDate: string, annualContribution: number, programTerm: string}} */
export const endowmentSnapshot = {
  currentValue: 8628,           // $8,500 contributed + ~6% annualized × 3 months
  contributionsToDate: 8500,
  growthToDate: 128,
  asOfDate: '2026-11-17',
  annualContribution: 8500,
  programTerm: 'Season Residency · Aug 2026 to May 2027',
};

/** @type {{cohortLabel: string, athletes: number, gpsCompleted: number, gpsRate: number, certified: number, certRate: number, totalGifts: number, totalDollarsMoved: number, workshopAttendanceRate: number, avgWeeklyEngagement: number, asOfNote: string}} */
export const priorCohortSnapshot = {
  cohortLabel: '2025-2026',
  athletes: 14,
  gpsCompleted: 11,
  gpsRate: 79,
  certified: 5,
  certRate: 36,
  totalGifts: 28,
  totalDollarsMoved: 6700,
  workshopAttendanceRate: 82,
  avgWeeklyEngagement: 68,
  asOfNote: 'Full program year complete',
};

/** @type {{cohortLabel: string, athletes: number, gpsCompleted: number, gpsRate: number, certified: number, certRate: number, totalGifts: number, totalDollarsMoved: number, workshopAttendanceRate: number, avgWeeklyEngagement: number, asOfNote: string}} */
export const currentCohortSnapshot = {
  cohortLabel: '2026-2027',
  athletes: 16,
  gpsCompleted: 12,
  gpsRate: 75,
  certified: 4,
  certRate: 25,
  totalGifts: 33,
  totalDollarsMoved: 4900,        // sum of $-amounts in athletes' activity gift_made events (tracked-only — undercounts vs gifts count)
  workshopAttendanceRate: 75,     // W1 12/16 + W2 12/16 averaged
  avgWeeklyEngagement: 58,        // average of engagementTimeline values
  asOfNote: 'Through Nov 17, 2026 (mid-program)',
};

/** @type {{notionalDate: string, attention: Array<object>, priorities: Array<object>, recentActivity: Array<object>, upcoming: Array<object>}} */
export const dailyBriefItems = {
  notionalDate: '2026-11-12',
  attention: [
    { id: 'stalled-tyler', text: 'Tyler Brooks uncontacted 11 days', meta: 'Last note: Nov 1, 2026 — check-in scheduled', link: '/enterprise/roster' },
    { id: 'stalled-andre', text: 'Andre Mitchell uncontacted 18 days', meta: 'Outreach paused pending end-of-semester check-in', link: '/enterprise/roster' },
    { id: 'stalled-ava', text: 'Ava Petrova GPS follow-up no reply', meta: 'Last note: Nov 2, 2026', link: '/enterprise/roster' },
  ],
  priorities: [
    { id: 'workshop-w3-prep', text: 'Workshop W3 (Vetting Organizations) — Nov 17, 2026', meta: '5 days out · 2 follow-ups pending', link: '/enterprise/program' },
    { id: 'pre-reading-w3', text: 'Send W3 pre-reading materials', meta: 'Due Nov 14, 2026' },
    { id: 'compliance-review', text: 'Quarterly compliance review of excluded organizations', meta: 'Last reviewed Nov 1, 2026', link: '/enterprise/compliance' },
  ],
  recentActivity: [
    { id: 'marcus-lesson-5', text: 'Marcus Thompson completed Lesson 5: Giving Vehicles', meta: 'Nov 8, 2026' },
    { id: 'aaliyah-cert', text: 'Aaliyah Williams certified', meta: 'Nov 2, 2026' },
    { id: 'mia-lesson-5', text: 'Mia Chang completed Lesson 5: Giving Vehicles', meta: 'Nov 4, 2026' },
    { id: 'elijah-lesson-4', text: 'Elijah Brown completed Lesson 4: Vetting Organizations', meta: 'Nov 3, 2026' },
    { id: 'aaliyah-gift', text: 'Aaliyah Williams logged gift: $500 to Atlanta Track Foundation', meta: 'Oct 25, 2026' },
  ],
  upcoming: [
    { id: 'workshop-w3', text: 'Workshop W3: Vetting Organizations', meta: 'Nov 17, 2026 — 5 days out', link: '/enterprise/program' },
    { id: 'fall-review-deadline', text: 'End-of-fall-semester check-ins', meta: 'Due Dec 15, 2026' },
    { id: 'spring-planning', text: 'Spring outreach planning meeting', meta: 'Week of Dec 1, 2026' },
  ],
};

/** @type {Array<{id: string, timestamp: string, user: string, userRole: string, action: string, target?: string, reason?: string, notes?: string}>} */
export const complianceAuditLog = [
  {
    id: 'audit-001',
    timestamp: '2026-11-01T14:30:00',
    user: 'Sarah Mitchell',
    userRole: 'Athletic Compliance Officer',
    action: 'Quarterly compliance review completed',
    notes: 'All exclusions reviewed and re-affirmed.',
  },
  {
    id: 'audit-002',
    timestamp: '2026-10-28T10:15:00',
    user: 'Diane Okonkwo',
    userRole: 'Senior Director, Athletic Development',
    action: 'Added organization to exclusion list',
    target: 'Quick Cash Sports Loans LLC',
    reason: 'Predatory lending practices flagged by athletic department',
  },
  {
    id: 'audit-003',
    timestamp: '2026-09-15T09:42:00',
    user: 'Sarah Mitchell',
    userRole: 'Athletic Compliance Officer',
    action: 'Added organization to exclusion list',
    target: 'TigerBet Online Sportsbook',
    reason: 'Gambling/sports betting per NIL framework section 4.2',
  },
  {
    id: 'audit-004',
    timestamp: '2026-08-30T16:20:00',
    user: 'Diane Okonkwo',
    userRole: 'Senior Director, Athletic Development',
    action: 'Added organization to exclusion list',
    target: 'Premier Athletic Apparel Co',
    reason: 'Pending NIL compliance review — temporary block',
  },
  {
    id: 'audit-005',
    timestamp: '2026-08-12T11:00:00',
    user: 'Sarah Mitchell',
    userRole: 'Athletic Compliance Officer',
    action: 'Program launch — NIL framework approved',
    notes: 'Initial NIL framework approved and active. Cohort onboarding begins.',
  },
];

/** @type {Record<number, Array<{date: string, text: string}>>} */
export const athleteReflections = {
  1: [
    { date: '2026-10-05', text: "The GPS exercise was harder than I expected. I had to actually sit with why community basketball mattered to me, not just say it did." },
    { date: '2026-11-08', text: "Vehicles lesson opened my eyes — I've been giving without thinking about which way is most efficient. Going to look at DAFs more seriously when I have the volume." },
  ],
  2: [
    { date: '2026-09-20', text: "Talking with the cohort about cause selection felt different than just reading about it. People asked questions I hadn't thought through." },
    { date: '2026-10-30', text: "Finishing the program, I feel like I have a real practice now, not just intentions. The Atlanta Track gift was the first one I made with full intention behind it." },
  ],
  3: [
    { date: '2026-10-12', text: "Made my first gift to youth football in Houston. Smaller than I thought I'd give but it felt right for getting started." },
  ],
  4: [
    { date: '2026-09-28', text: "Connecting my soccer story to giving back to underrepresented soccer programs made the whole thing click for me." },
  ],
  5: [
    { date: '2026-09-05', text: "Honestly not sure what philanthropy means for someone at my career stage. Going to keep showing up and see what comes from it." },
  ],
  6: [
    { date: '2026-10-10', text: "The capstone reflection was the most useful part of the program for me. Wrote about what I want my giving to look like in five years and now I have it written down." },
  ],
  7: [
    { date: '2026-10-01', text: "Got my framework defined but haven't made a gift yet. Want to wait until I have a clearer picture financially before committing to a recurring amount." },
  ],
  // 8: Sofia Reyes (invited) — no reflections
  9: [
    { date: '2026-09-18', text: "Baseball gave me a path out of where I grew up. I want my giving to do the same thing for somebody else's kid." },
  ],
  // 10: Maya Johnson (invited) — no reflections
  11: [
    { date: '2026-10-22', text: "First gift went to a youth diversion program. Couldn't have imagined doing that intentionally six months ago." },
  ],
  12: [
    { date: '2026-10-08', text: "Softball is small. The community of girls who play and the women coaching matters to me. That's where my giving is going to stay focused for now." },
  ],
  13: [
    { date: '2026-10-14', text: "Capstone done. The framework gave me language for something I was already doing informally. Now it's structured and intentional." },
  ],
  14: [
    { date: '2026-10-26', text: "Tennis access is the cause that won't leave me alone. Started small with the Bay Area foundation and want to grow it from here." },
  ],
  15: [
    { date: '2026-10-18', text: "First gift made. Equipment funds for high school football — that's where I came from. Felt right for the first one." },
  ],
  16: [
    { date: '2026-10-28', text: "Slow start for me. Gymnastics is individual and so is figuring this out. Will get there." },
  ],
};

// Single source of truth for the "logged-in user" in the enterprise prototype.
// Production swaps this to an auth-derived current user.
/** @type {Contact} */
export const CURRENT_USER = contacts.find((c) => c.id === 'diane');

// Sector-aware terminology (Athletics-only for v1; function shape preserved so M&E can plug in later)
export function T() {
  return {
    p: "athletes", P: "Athletes", s: "athlete", S: "Athlete",
    admin: "Program Admin", comp: "Compliance Officer",
    ws: "workshop", WS: "Workshop", org: "Athletic Department",
    cert: "certified", Cert: "Certified",
    fPrimary: "Sport", fPrimaryPlural: "sports",
    fSecondary: "Position", fTertiary: "Year",
  };
}

// Sector-agnostic field accessor on athlete records
export function F(record) {
  return { primary: record.sport, secondary: record.position, tertiary: record.year };
}
