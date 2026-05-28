// Documentation hub — practice-ops materials private to the advisor's
// practice. These are the advisor's own working notes and templates, NOT
// platform-prescriptive advice. Voice is the practice's voice, held to the
// editorial register defined in `practice-voice-tone`.

export const docCategories = [
  {
    label: 'Onboarding',
    hint: 'Scripts, checklists, and templates you reach for when bringing on a new client.',
    docs: [
      {
        id: 'onboarding-script',
        title: 'Onboarding script template',
        updated: 'April 12, 2026',
        notes: 'Six-question values intake',
        body: [
          'These are the six questions I open with. Not a script to read verbatim — a frame for the first hour together. The order matters: I start where the person is most willing to talk, which is usually their own history, not their plan.',
          'Question one: what is the earliest gift you remember giving, and what made you give it? This puts giving in their own biography before we touch dollars.',
          'Question two: what is a cause you have drifted in and out of caring about, and why? Drift is honest; consistency is rare.',
          'Question three: who in your life shaped how you think about money — for better or worse? Names, not generalities.',
          'Question four: if your giving were visible to one person you respect, who would it be? This surfaces an audience that is already shaping behavior, whether or not they know it.',
          'Questions five and six I hold in reserve. They are situational: a question about ambition for some, a question about anonymity for others. I write them in only after the first four have opened something up.',
        ],
      },
      {
        id: 'first-session-checklist',
        title: 'First-session checklist',
        updated: 'February 28, 2026',
        notes: 'Logistics + working agreement',
        body: [
          'First-session logistics live or die on small things. I send the calendar invite myself, not through an assistant. I confirm the day before in a single sentence: looking forward to tomorrow at two. Nothing more.',
          'Phones face-down on the table, not pocketed. I model it first. If the client gets a call they need to take, the session pauses; we do not half-listen.',
          'The working agreement covers four things: what I do, what I do not do, what they should expect to feel, and how either of us ends the engagement. I read mine aloud and ask theirs in return.',
          'The "what I do not do" list is the longest. I do not custody money. I do not pick organizations for them. I do not grade their giving. Saying this clearly at the start prevents misunderstandings later.',
          'Notes: I take them by hand, not on a screen. I tell the client that. The notes are mine; my summary back to them after the session is theirs.',
          'Closing: I do not schedule the next session in the room. I send a one-line proposal within twenty-four hours. The space between sessions is part of the work.',
        ],
      },
    ],
  },
  {
    label: 'Working notes',
    hint: 'Your own reference material — reading guides, sector notes, marked-up documents. Personal to how you work.',
    docs: [
      {
        id: '990-reading-guide',
        title: 'Reference: 990 reading guide',
        updated: 'March 9, 2026',
        notes: 'Marked up with my own notes',
        body: [
          'I read 990s in a specific order, and I make myself notes in the margins. The point is not to score the organization — it is to understand how the organization sees itself.',
          'First page: mission statement. Compare it to the website. Discrepancies are interesting, not damning. The 990 is a legal document; the website is a marketing one. Both are true.',
          'Schedule O is where the actual narrative lives. Most readers skip it. I read it twice — once for content, once for tone.',
          'Compensation tables I read for ratio and consistency over time, not for absolute numbers. A long-tenured executive earning steadily is one story; a sudden jump is another.',
          'Functional expenses: I look at how program, G&A, and fundraising are split, then I read the program description to see what "program" actually means for this organization. The ratio without the description is meaningless.',
          'I do not use the 990 to rank organizations. It tells me what to ask in the next conversation. Anything more than that is overreach.',
        ],
      },
      {
        id: 'youth-athletics-landscape',
        title: 'Sector landscape: youth athletics',
        updated: 'February 14, 2026',
        notes: 'Personal reading log',
        body: [
          'Notes from the last eighteen months of reading on youth and school athletics access. Not a comprehensive map — what I have actually read.',
          'The defining structural fact: pay-to-play has become the norm in most public school athletic programs over the last twenty years. The cost falls hardest on families in the bottom income quintile and shows up as participation gaps.',
          'Two organizational forms recur: school-attached booster groups (often 501(c)(3) themselves) and community-based programs that operate outside the school system. They have very different cost structures and very different evidence bases.',
          'Coaching quality is the variable nobody can quantify and everybody talks about. The literature on coach training in youth sports is thinner than I expected.',
          'Reinvestment patterns: organizations that survive a decade tend to be the ones that put excess revenue back into facilities and coaching rather than expansion. Worth asking about explicitly when an organization pitches growth.',
          'Open questions I am still chasing: how Title IX intersects with private youth programs; what success means when the program\'s outputs are measured in years, not seasons; how to think about regional concentration of programs versus their funder base.',
        ],
      },
    ],
  },
];

export function findDocById(id) {
  for (const cat of docCategories) {
    for (const doc of cat.docs) {
      if (doc.id === id) return { doc, categoryLabel: cat.label };
    }
  }
  return null;
}
