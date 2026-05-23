// All names, organizations, and figures in this file are fictional.
// Used for demo purposes only.
//
// Phase 1 scope: athletes only. Music, entertainment, and creator
// segments are deferred to phase 2.

export const advisorPracticeProfile = {
  practiceName: "Walker Philanthropic Advisory",
  advisorName: "Morgan Walker",
  advisorTitle: "Principal Advisor",
  practiceFocus: "Athletes in early career",
  yearsActive: 7,
  clientCount: 9,
};

export const clients = [
  {
    id: 'c-001',
    name: 'Marcus Thompson',
    initials: 'MT',
    sport: 'Basketball',
    level: 'Junior college',
    stage: 'Active',
    relationshipStartedYear: 2024,
    summary: 'Junior college basketball; first NIL contract in fall 2024. Family-rooted giving interest, particularly youth sports access in northeast Ohio.',
    nextSession: 'May 14, 2026',
    activeContent: 3,
    givingPlan: {
      statement: `Direct support to youth basketball programs in the Cleveland area where I grew up. Multi-year, unrestricted where possible. Quiet about it — no public attribution unless the organization specifically asks.`,
      lastRevised: '2026-04-16',
      causes: ['youth basketball', 'k-12 access', 'place-based giving'],
      geography: 'northeast Ohio, particularly Cleveland and surrounding districts',
      preferredStructure: 'unrestricted',
      visibility: 'private',
      annualPace: 'Building toward $20–25K annually as the first NIL cycle settles',
    },
    sessions: [
      {
        id: 's-c001-5',
        date: '2026-04-16',
        title: 'Restricted vs. unrestricted — working session',
        summary: `Walked through three example grant agreements. Marcus drafted preferences for his own giving plan and tested how the unrestricted clause held up against each agreement's reporting requirements.`,
        decisions: [
          'Drafted a personal preference: unrestricted where the agreement permits, multi-year where the organization will accept it',
          'Held off on naming a first organization until the regional landscape is mapped further',
        ],
        actionItems: [
          'Bring drafted preferences back to next session for refinement',
          'Pull two more example grant agreements from the curriculum library',
        ],
      },
      {
        id: 's-c001-4',
        date: '2026-03-28',
        title: 'Sector landscape: youth sports access in Ohio',
        summary: `Reviewed three regional organizations. Pulled audit reports for two; flagged questions to bring back. Set aside one organization that did not match the place-based criterion.`,
        decisions: [
          'Narrowed regional focus to three counties around Cleveland',
          'Set aside one of the three regional organizations as out of scope',
        ],
        actionItems: [
          'Marcus reading the flagged audit notes before next session',
        ],
      },
      {
        id: 's-c001-3',
        date: '2026-03-07',
        title: 'Onboarding follow-up — values conversation',
        summary: `Identified the giving anchor: place-based, sport-specific, K–12 access. Marcus drafted his giving identity in plain language and read it aloud to test how it sat with him.`,
        decisions: [
          'Anchor identified: place-based, sport-specific, K–12 access',
        ],
        actionItems: [
          'Marcus to draft a one-paragraph statement in his own words for the next session',
        ],
      },
      {
        id: 's-c001-2',
        date: '2025-09-12',
        title: 'Intake — first formal session',
        summary: `First formal session after the intake form. Walked through how the relationship runs and what the platform does and does not do. Marcus asked careful questions about privacy and attribution.`,
        decisions: [
          'Agreed to private visibility from the outset',
          'Set a monthly cadence with flex for the basketball season',
        ],
        actionItems: [
          'Send the curriculum lesson on giving structures before the next meeting',
        ],
      },
      {
        id: 's-c001-1',
        date: '2024-10-08',
        title: 'Initial introduction',
        summary: `Brief intro call before formally onboarding. Marcus's agent attended the first ten minutes. Discussed scope and the platform's boundaries plainly: structural support, no advice on amount or destination.`,
        decisions: [
          'Decided to move forward with onboarding after the basketball season',
        ],
        actionItems: [],
      },
    ],
    privateNotes: [
      {
        id: 'n-c001-3',
        date: '2026-04-21',
        content: `Marcus's mother is the unnamed third party in every conversation about giving. Worth surfacing — when ready — that her steadiness is what's actually being honored. Don't push.`,
        tags: ['relational'],
      },
      {
        id: 'n-c001-2',
        date: '2026-03-15',
        content: `Marcus's mother passed in March 2025. He hasn't mentioned it directly, but the dates in his initial summary cluster around the anniversary. Be sensitive in the next session if it falls near then.`,
        tags: ['relational', 'context'],
      },
      {
        id: 'n-c001-1',
        date: '2025-09-20',
        content: `Agent involvement is light — Marcus is making the calls here. Note for the file in case that changes.`,
        tags: ['operational'],
      },
    ],
    nextSessionAgenda: {
      topics: [
        'Drafting the first formal grant inquiry letter',
        'Reviewing the three regional candidates Marcus flagged on March 28',
        'Working through how to phrase the multi-year commitment ask',
      ],
      openThreads: [
        'Audit-report questions Marcus brought from March 28',
        'Personal preference language: tightening the unrestricted clause',
      ],
      curriculumLinks: [
        { lessonId: 'cur-014', title: 'Writing a first grant inquiry — structure and tone' },
        { lessonId: 'cur-007', title: 'Multi-year grant agreements: what to ask for' },
      ],
    },
    pipeline: [
      { type: 'digest',       state: 'Active', source: 'default'  },
      { type: 'notification', state: 'Active', source: 'default'  },
      { type: 'spotlight',    state: 'Mute',   source: 'override' },
      { type: 'reflection',   state: 'Active', source: 'default'  },
      { type: 'cohort',       state: 'Mute',   source: 'override' },
    ],
  },
  {
    id: 'c-002',
    name: 'Jasmine Rivera',
    initials: 'JR',
    sport: 'Soccer',
    level: 'D1 college',
    stage: 'New',
    relationshipStartedYear: 2026,
    summary: 'D1 women\'s soccer; signed first endorsement deal three weeks ago. Onboarding in progress.',
    nextSession: 'May 9, 2026',
    activeContent: 0,
    givingPlan: null,
    sessions: [
      {
        id: 's-c002-1',
        date: '2026-04-30',
        title: 'Intake — what brought you here',
        summary: `First formal session after the intake form. Jasmine described why she wanted to begin this work before the endorsement money settled rather than after. We mapped what the next few months could look like.`,
        decisions: [
          'Decided to begin the values conversation before naming any specific cause direction',
        ],
        actionItems: [
          'Review the introductory lesson on Giving Identity before next session',
          'Talk with parents about whether they want to be part of these conversations',
        ],
      },
    ],
    privateNotes: [
      {
        id: 'n-c002-1',
        date: '2026-05-02',
        content: `Jasmine's parents emigrated from Colombia in 2003. She's mentioned them in passing both times we've spoken. Family is going to be central here — wait for her to tell us how.`,
        tags: ['relational', 'context'],
      },
    ],
    nextSessionAgenda: {
      topics: [
        'Studio onboarding: walking through the Giving Identity prompts',
        'How much family voice she wants in the room',
      ],
      openThreads: [
        'Parent involvement in the values conversation',
      ],
      curriculumLinks: [
        { lessonId: 'cur-001', title: 'Giving Identity: what it is and what it is not' },
        { lessonId: 'cur-002', title: 'Place in your story: family, geography, formative experiences' },
      ],
    },
    pipeline: [
      { type: 'digest',       state: 'Mute', source: 'default' },
      { type: 'notification', state: 'Mute', source: 'default' },
      { type: 'spotlight',    state: 'Mute', source: 'default' },
      { type: 'reflection',   state: 'Mute', source: 'default' },
      { type: 'cohort',       state: 'Mute', source: 'default' },
    ],
  },
  {
    id: 'c-003',
    name: 'Reuben Asare',
    initials: 'RA',
    sport: 'Track and field',
    level: 'Professional',
    stage: 'Active',
    relationshipStartedYear: 2023,
    summary: 'Professional track athlete; recent sponsorship growth post-World Championships. Interested in pan-African educational nonprofits.',
    nextSession: 'May 15, 2026',
    activeContent: 3,
    givingPlan: {
      statement: `My work has always pulled me between two countries. I want my giving to live in that same space — secondary school programs in Ghana, with smaller anchors at U.S. organizations that send athletes back across the Atlantic on educational exchange. I'd rather fund one or two well than spread across many.`,
      lastRevised: '2026-03-30',
      causes: ['secondary education', 'pan-african education', 'diaspora exchange'],
      geography: 'Ghana, with secondary anchors in U.S. cities with large West African diaspora communities',
      preferredStructure: 'mixed',
      visibility: 'selective',
      annualPace: '$60–90K range annually, scaling with the sponsorship cycle',
    },
    sessions: [
      {
        id: 's-c003-4',
        date: '2026-04-22',
        title: 'Refining the secondary-school criterion',
        summary: `Pulled three program briefs from the curriculum library on long-term funding to in-country secondary schools. Reuben pressed on what 'unrestricted' actually means at the country level when overhead structures differ.`,
        decisions: [
          'Set a floor: any school he funds must publish operating budget annually',
        ],
        actionItems: [
          'Bring three candidate programs back next session',
        ],
      },
      {
        id: 's-c003-3',
        date: '2026-03-30',
        title: 'Updated giving plan — second revision',
        summary: `Revised the plan statement to clarify the U.S./Ghana split. Reuben wanted to soften some of the more prescriptive language from the first draft so it read less like a policy and more like a person.`,
        decisions: [
          'Adopted the revised plan as v2',
        ],
        actionItems: [],
      },
      {
        id: 's-c003-2',
        date: '2026-02-15',
        title: 'Sponsorship cycle and giving pace',
        summary: `Mapped the expected sponsorship cycle through 2027. Talked through how to pace gifts when income arrives in clusters rather than steadily.`,
        decisions: [
          'Decided to make commitments annually in March rather than quarterly',
        ],
        actionItems: [],
      },
      {
        id: 's-c003-1',
        date: '2025-10-04',
        title: 'Post-Championships reset',
        summary: `First session after the World Championships push. Reuben described the shift in what felt possible at this new income level and how the original plan written in 2023 no longer fit who was making it now.`,
        decisions: [
          'Decided to revisit the original plan from the ground up',
        ],
        actionItems: [
          'Reuben to draft a revised statement before next session',
        ],
      },
    ],
    privateNotes: [
      {
        id: 'n-c003-2',
        date: '2026-04-25',
        content: `Reuben's brother runs a school in Kumasi. Reuben has not directly proposed funding it — worth watching. If he raises it, the platform should not be the place that adjudicates the family-proximity question.`,
        tags: ['relational', 'context'],
      },
      {
        id: 'n-c003-1',
        date: '2026-02-20',
        content: `Coach is intermittently in conversations. Less of a co-decisionmaker than a sounding board. Reuben drives.`,
        tags: ['operational'],
      },
    ],
    nextSessionAgenda: {
      topics: [
        'Reviewing the three candidate Ghana programs',
        'How to phrase the operating-budget-transparency requirement in a grant inquiry',
      ],
      openThreads: [
        'Family/school proximity question (private)',
        'Pacing language in the revised plan',
      ],
      curriculumLinks: [
        { lessonId: 'cur-022', title: 'Cross-border giving: structures and constraints' },
        { lessonId: 'cur-018', title: 'Funder transparency criteria — how to phrase them' },
      ],
    },
    pipeline: [
      { type: 'digest',       state: 'Active', source: 'default'  },
      { type: 'notification', state: 'Active', source: 'default'  },
      { type: 'spotlight',    state: 'Active', source: 'default'  },
      { type: 'reflection',   state: 'Mute',   source: 'override' },
      { type: 'cohort',       state: 'Mute',   source: 'override' },
    ],
  },
  {
    id: 'c-004',
    name: 'Ezekiel Banner',
    initials: 'EB',
    sport: 'Football',
    level: 'Retired professional',
    stage: 'Mature',
    relationshipStartedYear: 2021,
    summary: 'Retired NFL defensive back; transitioning to long-term endowment planning. Multiple existing relationships with grantees in his hometown.',
    nextSession: 'June 3, 2026',
    activeContent: 1,
    givingPlan: {
      statement: `Five years in, I've stopped chasing new directions. The three organizations I've been working with — a mentorship program for boys outside Savannah, an after-school literacy effort, and a community legal services group I came to through my own family's experience — these are the relationships I want to deepen, not replace. The work now is building an endowment so this continues past me.`,
      lastRevised: '2026-02-08',
      causes: ['mentorship', 'literacy', 'community legal services', 'hometown giving'],
      geography: 'coastal Georgia, primarily the Savannah area',
      preferredStructure: 'mixed',
      visibility: 'selective',
      annualPace: '$120–150K, with the endowment vehicle taking the larger share from 2027 forward',
    },
    sessions: [
      {
        id: 's-c004-7',
        date: '2026-04-29',
        title: 'Endowment vehicle: structure review',
        summary: `Reviewed three potential endowment structures pulled from the curriculum library. Zeke compared how each handled successor governance and how each constrained the unrestricted-grantmaking style he prefers.`,
        decisions: [
          'Tabled the donor-advised fund option in favor of two private-foundation pathways',
        ],
        actionItems: [
          'Pull example governance documents for both foundation pathways before next session',
        ],
      },
      {
        id: 's-c004-6',
        date: '2026-03-12',
        title: 'Annual review — fifth-year mark',
        summary: `Walked the full giving record from our first session in 2021 forward. Zeke wanted to see where the texture had changed and where it had settled. He noted that two grantees had moved from project to unrestricted support over the years — by his choice, not theirs.`,
        decisions: [
          'Renewed all three core relationships through 2028',
        ],
        actionItems: [],
      },
      {
        id: 's-c004-5',
        date: '2026-02-08',
        title: 'Plan revision — light touch',
        summary: `Plan reviewed and confirmed largely unchanged. One sentence adjusted to make the endowment-future language clearer.`,
        decisions: [
          'Confirmed plan v3 with a minor language edit',
        ],
        actionItems: [],
      },
      {
        id: 's-c004-4',
        date: '2025-10-19',
        title: 'Successor governance — first conversation',
        summary: `First real conversation about who carries the work after he stops. Zeke named two family members. We talked about what readiness looks like before any formal seat is offered.`,
        decisions: [
          'Decided to revisit the successor question annually rather than press it',
        ],
        actionItems: [],
      },
      {
        id: 's-c004-3',
        date: '2025-06-03',
        title: 'Grantee site visits — debrief',
        summary: `Talked through visits to two of the three grantees. Zeke noticed the mentorship program had grown its staffing without telling him directly. He took it as a sign they trusted the support to be there.`,
        decisions: [
          'Increased mentorship-program commitment for 2026',
        ],
        actionItems: [],
      },
      {
        id: 's-c004-2',
        date: '2024-09-22',
        title: 'Mid-relationship recalibration',
        summary: `Three years in. Zeke wanted to step back and ask whether the giving was still doing what he had hoped. We mapped indicators that matter to him — qualitative, no measurement framework.`,
        decisions: [
          'Stopped quarterly grantee check-ins; moved to twice-yearly conversations',
        ],
        actionItems: [],
      },
      {
        id: 's-c004-1',
        date: '2023-04-11',
        title: 'Adding the community legal services anchor',
        summary: `Two years into the relationship. Family experience with a wrongful-eviction case in 2022 led Zeke to add a third anchor. We worked through what naming the connection felt like to him.`,
        decisions: [
          'Added community legal services as the third cause anchor',
        ],
        actionItems: [],
      },
    ],
    privateNotes: [
      {
        id: 'n-c004-4',
        date: '2026-04-30',
        content: `The endowment conversation has Zeke moving slowly — that's the right pace. Don't accelerate.`,
        tags: ['relational'],
      },
      {
        id: 'n-c004-3',
        date: '2026-03-15',
        content: `Daughter has begun appearing in his references to the future of the work. She hasn't been formally introduced into our conversations yet, but the shift is real.`,
        tags: ['relational', 'context'],
      },
      {
        id: 'n-c004-2',
        date: '2025-11-04',
        content: `Zeke does not like email follow-up between sessions. Phone or in person. Confirmed verbally last month.`,
        tags: ['operational'],
      },
      {
        id: 'n-c004-1',
        date: '2025-06-10',
        content: `The 2022 eviction case is still raw. Don't reference it unless he does first.`,
        tags: ['relational', 'context'],
      },
    ],
    nextSessionAgenda: {
      topics: [
        'Endowment governance: comparing the two foundation pathways',
        'Light annual review of grantee health (not a site visit)',
      ],
      openThreads: [
        'Successor governance, when he is ready to revisit',
        'Endowment-future language in the plan statement',
      ],
      curriculumLinks: [
        { lessonId: 'cur-031', title: 'Private foundation vs. donor-advised fund: governance trade-offs' },
        { lessonId: 'cur-029', title: 'Successor planning: what readiness looks like' },
      ],
    },
    pipeline: [
      { type: 'digest',       state: 'Mute',   source: 'override' },
      { type: 'notification', state: 'Mute',   source: 'override' },
      { type: 'spotlight',    state: 'Mute',   source: 'override' },
      { type: 'reflection',   state: 'Active', source: 'default'  },
      { type: 'cohort',       state: 'Mute',   source: 'override' },
    ],
  },
  {
    id: 'c-005',
    name: 'Isaiah Coleman',
    initials: 'IC',
    sport: 'Football',
    level: 'D1 college',
    stage: 'Active',
    relationshipStartedYear: 2024,
    summary: 'D1 college quarterback; significant NIL collective income. Considering structured giving toward HBCU athletics programs.',
    nextSession: 'May 12, 2026',
    activeContent: 2,
    givingPlan: {
      statement: `I came up in a school system where the football program was the loudest, best-funded thing in the building. The schools I want to give to had it the other way. The plan, for now, is HBCU athletic programs — equipment, travel, the unglamorous infrastructure. I'm okay being public about it. It's part of why I want to do it.`,
      lastRevised: '2026-04-05',
      causes: ['hbcu athletics', 'athletic program infrastructure', 'access'],
      geography: 'the southeast, primarily Alabama, Mississippi, and Louisiana',
      preferredStructure: 'mixed',
      visibility: 'public',
      annualPace: '$15–30K depending on the NIL cycle',
    },
    sessions: [
      {
        id: 's-c005-4',
        date: '2026-04-25',
        title: 'HBCU landscape — narrowing the field',
        summary: `Worked through public financial reports from the major HBCU athletic conferences. Isaiah is pulling toward a specific program but holding the decision until next month.`,
        decisions: [
          'Narrowed to four candidate athletic departments',
        ],
        actionItems: [
          'Read each program\'s most recent public financial filing',
        ],
      },
      {
        id: 's-c005-3',
        date: '2026-04-05',
        title: 'First plan statement — final draft',
        summary: `Reviewed Isaiah's third draft of the statement. He sharpened the second sentence and kept the public-visibility commitment in.`,
        decisions: [
          'Adopted the statement as written',
        ],
        actionItems: [],
      },
      {
        id: 's-c005-2',
        date: '2026-03-18',
        title: 'Public visibility — thinking it through',
        summary: `Talked about what going public actually means for a college player still in season. Reviewed disclosure obligations and the optics question as separate concerns rather than one bundled one.`,
        decisions: [
          'Decided to stay public, with limits on which platforms he posts on',
        ],
        actionItems: [],
      },
      {
        id: 's-c005-1',
        date: '2026-01-22',
        title: 'Onboarding intake',
        summary: `First working session after intake. Isaiah came in already clear that he wanted to give and roughly where. The work here is shape and structure, not direction.`,
        decisions: [
          'Decided to move at a faster cadence — biweekly through spring',
        ],
        actionItems: [],
      },
    ],
    privateNotes: [
      {
        id: 'n-c005-2',
        date: '2026-04-27',
        content: `Isaiah's father coached at an HBCU before moving to high school coaching. That history is the engine here. Isaiah hasn't said it directly yet — let him surface it.`,
        tags: ['relational', 'context'],
      },
      {
        id: 'n-c005-1',
        date: '2026-03-20',
        content: `Agent has asked twice about messaging strategy around the giving. Isaiah has declined drafted talking points. Hold the line — that's not what this is.`,
        tags: ['operational'],
      },
    ],
    nextSessionAgenda: {
      topics: [
        'Reviewing the four candidate athletic departments',
        'Sizing the first commitment in plain terms',
      ],
      openThreads: [
        'How to make the first inquiry without it reading as a press release',
      ],
      curriculumLinks: [
        { lessonId: 'cur-014', title: 'Writing a first grant inquiry — structure and tone' },
        { lessonId: 'cur-011', title: 'Public giving: when and how to talk about it' },
      ],
    },
    pipeline: [
      { type: 'digest',       state: 'Active', source: 'default'  },
      { type: 'notification', state: 'Mute',   source: 'override' },
      { type: 'spotlight',    state: 'Active', source: 'default'  },
      { type: 'reflection',   state: 'Mute',   source: 'override' },
      { type: 'cohort',       state: 'Mute',   source: 'override' },
    ],
  },
  {
    id: 'c-006',
    name: 'Tariq Williams',
    initials: 'TW',
    sport: 'Football',
    level: 'High school',
    stage: 'New',
    relationshipStartedYear: 2026,
    summary: 'Top-ranked high school recruit in Georgia; NIL income via collective. Just beginning to think about giving structure with family.',
    nextSession: 'May 11, 2026',
    activeContent: 0,
    givingPlan: null,
    sessions: [
      {
        id: 's-c006-1',
        date: '2026-05-04',
        title: 'Intake — first conversation, with family present',
        summary: `First working session. Tariq's parents joined for the full hour. Most of the talking came from his mother. Tariq spoke when asked directly and asked one question of his own about timing.`,
        decisions: [
          'Decided to keep both parents in the room for the next three sessions, then revisit',
        ],
        actionItems: [
          'Family to read the Giving Identity primer together before next session',
        ],
      },
    ],
    privateNotes: [
      {
        id: 'n-c006-1',
        date: '2026-05-05',
        content: `Mother is driving here. Tariq is comfortable with that for now. Watch for the moment it shifts — it will, and the platform should be ready to give him his own room when it does.`,
        tags: ['relational', 'context'],
      },
    ],
    nextSessionAgenda: {
      topics: [
        'Studio onboarding: family-style values conversation',
        'Setting expectations for what advisor-private notes mean',
      ],
      openThreads: [
        'When and how Tariq\'s voice steps forward in his own sessions',
      ],
      curriculumLinks: [
        { lessonId: 'cur-001', title: 'Giving Identity: what it is and what it is not' },
        { lessonId: 'cur-005', title: 'Family-anchored giving: when the family is in the room' },
      ],
    },
    pipeline: [
      { type: 'digest',       state: 'Mute', source: 'default' },
      { type: 'notification', state: 'Mute', source: 'default' },
      { type: 'spotlight',    state: 'Mute', source: 'default' },
      { type: 'reflection',   state: 'Mute', source: 'default' },
      { type: 'cohort',       state: 'Mute', source: 'default' },
    ],
  },
  {
    id: 'c-007',
    name: 'Bree Caldwell',
    initials: 'BC',
    sport: 'Basketball',
    level: 'D1 college',
    stage: 'New',
    relationshipStartedYear: 2026,
    summary: 'D1 women\'s basketball; NIL deals from athletic apparel brand. Onboarding sessions in progress.',
    nextSession: 'May 16, 2026',
    activeContent: 1,
    givingPlan: null,
    sessions: [
      {
        id: 's-c007-1',
        date: '2026-04-18',
        title: 'Onboarding — intro and Studio walkthrough',
        summary: `First session. Bree had read the platform overview before arriving and came in with specific questions about privacy. We spent most of the session on what is confidential and what is not.`,
        decisions: [
          'Decided to begin under selective visibility while she thinks the question through',
        ],
        actionItems: [
          'Bree to draft three to five sentences on what giving has meant in her life so far',
        ],
      },
    ],
    privateNotes: [
      {
        id: 'n-c007-1',
        date: '2026-04-19',
        content: `Bree is careful — she asked good questions about who sees what. That's a feature, not a flag. Let her set the pace.`,
        tags: ['relational', 'operational'],
      },
    ],
    nextSessionAgenda: {
      topics: [
        'Reviewing Bree\'s first written reflection',
        'Beginning the Giving Identity prompts',
      ],
      openThreads: [
        'Privacy choice — selective vs. private going forward',
      ],
      curriculumLinks: [
        { lessonId: 'cur-001', title: 'Giving Identity: what it is and what it is not' },
        { lessonId: 'cur-008', title: 'Visibility choices: public, selective, private' },
      ],
    },
    pipeline: [
      { type: 'digest',       state: 'Mute',   source: 'default'  },
      { type: 'notification', state: 'Mute',   source: 'default'  },
      { type: 'spotlight',    state: 'Mute',   source: 'default'  },
      { type: 'reflection',   state: 'Active', source: 'override' },
      { type: 'cohort',       state: 'Mute',   source: 'default'  },
    ],
  },
  {
    id: 'c-008',
    name: 'Naomi Pierce',
    initials: 'NP',
    sport: 'Track and field',
    level: 'D1 college',
    stage: 'Active',
    relationshipStartedYear: 2024,
    summary: 'Olympic prospect in 400m hurdles; multiple sponsorship streams. Focused on access programs for youth track in underfunded districts.',
    nextSession: 'May 19, 2026',
    activeContent: 2,
    givingPlan: {
      statement: `I ran on county tracks that were measured wrong. Programs in districts that lost their meet on a Monday because the bus didn't come. The plan is youth track in places where the conditions are stacked. Mostly project funding — I want to know exactly what each gift moves — with one unrestricted anchor in a program I trust to use the room well.`,
      lastRevised: '2026-04-09',
      causes: ['youth track and field', 'school athletics access', 'district equity'],
      geography: 'the Mississippi Delta and central Alabama',
      preferredStructure: 'project',
      visibility: 'selective',
      annualPace: '$35–50K annually, growing into 2028',
    },
    sessions: [
      {
        id: 's-c008-4',
        date: '2026-04-30',
        title: 'Anchor program — first deepening',
        summary: `Worked through the unrestricted anchor decision. Naomi's preferred program runs the youth meets she ran on as a kid. She wanted to slow the decision down because she was aware she was leading with sentiment.`,
        decisions: [
          'Decided to wait one more session and read the program\'s last three audits before committing',
        ],
        actionItems: [
          'Pull audit reports for the anchor program',
        ],
      },
      {
        id: 's-c008-3',
        date: '2026-04-09',
        title: 'Plan revision — focusing the language',
        summary: `Tightened the plan statement. Naomi cut a sentence she felt was too general and added the line about the bus.`,
        decisions: [
          'Adopted plan v2',
        ],
        actionItems: [],
      },
      {
        id: 's-c008-2',
        date: '2026-02-26',
        title: 'Project funding mechanics',
        summary: `Walked through what project funding actually looks like — designated lines, reporting structures, what restrictions cost the grantee in overhead.`,
        decisions: [
          'Decided to keep project funding as the primary structure, with one unrestricted anchor',
        ],
        actionItems: [],
      },
      {
        id: 's-c008-1',
        date: '2025-08-14',
        title: 'Onboarding — first session after the season',
        summary: `First working session, after track season ended. Naomi described why she wanted to begin before the Olympic year rather than during it.`,
        decisions: [
          'Decided to use the off-season for the planning work',
        ],
        actionItems: [
          'Naomi to write a first draft of the giving plan statement',
        ],
      },
    ],
    privateNotes: [
      {
        id: 'n-c008-2',
        date: '2026-05-02',
        content: `Naomi flagged her own sentiment in the room — that's rare and it matters. Don't make her wrong for it. Let her use the audit reports as the second voice she's asking for.`,
        tags: ['relational'],
      },
      {
        id: 'n-c008-1',
        date: '2026-02-28',
        content: `Naomi's training schedule means the next ten months will run lighter. Plan around it.`,
        tags: ['operational'],
      },
    ],
    nextSessionAgenda: {
      topics: [
        'Audit-report review for the anchor program',
        'Project funding language for two candidate grants',
      ],
      openThreads: [
        'Anchor commitment decision',
        'Cadence through the Olympic year',
      ],
      curriculumLinks: [
        { lessonId: 'cur-019', title: 'Reading nonprofit audit reports — what to look for' },
        { lessonId: 'cur-016', title: 'Project funding: agreement language and reporting' },
      ],
    },
    pipeline: [
      { type: 'digest',       state: 'Active', source: 'default'  },
      { type: 'notification', state: 'Active', source: 'default'  },
      { type: 'spotlight',    state: 'Mute',   source: 'override' },
      { type: 'reflection',   state: 'Mute',   source: 'override' },
      { type: 'cohort',       state: 'Mute',   source: 'override' },
    ],
  },
  {
    id: 'c-009',
    name: 'Jordan Estes',
    initials: 'JE',
    sport: 'Football',
    level: 'Retired professional',
    stage: 'Sunset',
    relationshipStartedYear: 2019,
    summary: 'Retired NFL veteran; established giving practice. Transitioning to direct foundation governance.',
    nextSession: 'July 7, 2026',
    activeContent: 0,
    givingPlan: {
      statement: `My foundation has been running on its own legs for seven years now. The advisory work was always meant to be a bridge to direct governance, and the bridge has done its work. What stays steady is the three cause anchors: veterans' housing in the Pacific Northwest, college access programs at two universities I owe my career to, and a small civics program for kids in my old district. The foundation board will carry it from here.`,
      lastRevised: '2026-01-28',
      causes: ['veterans housing', 'college access', 'civic education'],
      geography: 'Pacific Northwest, with secondary anchors in the upper Midwest',
      preferredStructure: 'mixed',
      visibility: 'selective',
      annualPace: 'The foundation handles annual pace from 2027 forward; this advisory relationship closes by year-end',
    },
    sessions: [
      {
        id: 's-c009-3',
        date: '2026-04-12',
        title: 'Handoff sequencing',
        summary: `Walked the practical handoff: which curriculum lessons stay open to the foundation team, which documentation transfers, which advisor materials sunset with the relationship.`,
        decisions: [
          'Decided to close the advisory engagement at year-end with a single review session in November',
        ],
        actionItems: [
          'Prepare the documentation package for the foundation board',
        ],
      },
      {
        id: 's-c009-2',
        date: '2026-01-28',
        title: 'Plan review — wind-down voice',
        summary: `Updated the plan statement to reflect the closing of the advisory relationship. The three cause anchors stay; the language about pace shifted to the foundation.`,
        decisions: [
          'Adopted the wind-down plan version',
        ],
        actionItems: [],
      },
      {
        id: 's-c009-1',
        date: '2025-09-09',
        title: 'Decision to transition to direct governance',
        summary: `Jordan named the decision he had been weighing for a year — that the foundation board is now mature enough to operate without external advisory support. We talked through what the closing year should look like.`,
        decisions: [
          'Decided to begin transitioning in early 2026 and close formally at year-end',
        ],
        actionItems: [],
      },
    ],
    privateNotes: [
      {
        id: 'n-c009-2',
        date: '2026-04-15',
        content: `Jordan has named November as the close. Mark that calendar and do not let the relationship drift past it — clean ends matter to him.`,
        tags: ['operational'],
      },
      {
        id: 'n-c009-1',
        date: '2025-09-12',
        content: `The decision to transition out was years in coming. Honor that this isn't a loss — it's the work succeeding.`,
        tags: ['relational'],
      },
    ],
    nextSessionAgenda: {
      topics: [
        'Documentation package contents review',
        'What the November closing session covers',
      ],
      openThreads: [
        'Which curriculum access the foundation team retains after the relationship closes',
      ],
      curriculumLinks: [
        { lessonId: 'cur-040', title: 'Transitioning to direct foundation governance' },
        { lessonId: 'cur-041', title: 'Closing an advisory engagement: documentation handoff' },
      ],
    },
    pipeline: [
      { type: 'digest',       state: 'Mute', source: 'default' },
      { type: 'notification', state: 'Mute', source: 'default' },
      { type: 'spotlight',    state: 'Mute', source: 'default' },
      { type: 'reflection',   state: 'Mute', source: 'default' },
      { type: 'cohort',       state: 'Mute', source: 'default' },
    ],
  },
];

export const stages = ['New', 'Active', 'Mature', 'Sunset'];

// Phase 1 scope: athletics is the only sector. The roster includes a single
// non-categorized "Other" bucket for non-standard cases (e.g., athletes
// with cross-discipline situations).
export const sectors = ['Athletics', 'Other'];

export function clientsByStage(stage) {
  return clients.filter(c => c.stage === stage);
}
