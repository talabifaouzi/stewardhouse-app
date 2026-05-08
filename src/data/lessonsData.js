// Lessons data — first-pass migration of educational content.
// In the full prototype these expand to 5-7 cards each; this version
// shows headline + body, with future room for card-based depth.

export const UNIVERSAL_LESSONS = [
  {
    id: 'restricted-vs-unrestricted',
    title: 'Restricted vs. unrestricted — what does it mean?',
    minutes: 3,
    content: [
      {
        heading: 'Two ways your gift can be used',
        body: "When you give, you can either let the organization decide where the money goes (unrestricted), or earmark it for a specific program or purpose (restricted). Both are valid. They mean different things to the org receiving the gift."
      },
      {
        heading: 'Unrestricted = flexibility',
        body: 'Unrestricted gifts let the leadership of the org allocate funds where they\'re needed most — often to the parts of the work that are hardest to fund through grants: rent, salaries, technology, the unsexy infrastructure that holds programs together.'
      },
      {
        heading: 'Restricted = direction',
        body: "Restricted gifts ensure your money goes to a specific program or initiative. You'll usually get a report back showing how it was used. If you care deeply about a particular outcome, restricted giving creates accountability."
      },
      {
        heading: 'What experts say',
        body: "Trust-based philanthropy emphasizes unrestricted, multi-year giving as the most respectful, effective form of support. Why? Because the people doing the work know best where the money is needed. But restricted giving has its place — especially when starting a new relationship or supporting a specific outcome."
      },
    ],
  },
  {
    id: 'first-gift-strategy',
    title: 'How to make your first meaningful gift',
    minutes: 4,
    content: [
      {
        heading: "Start where you've lived",
        body: "Your hometown. The neighborhood that shaped you. The school that educated you. Your first gift carries weight when it goes somewhere your story already lives."
      },
      {
        heading: 'Pick one organization, not five',
        body: "Spreading $1,000 across five orgs gives each one $200 — barely enough to feel. The same $1,000 to one org you believe in builds a relationship. Start small. Go deep."
      },
      {
        heading: 'Make it unrestricted if you can',
        body: "Unless there's a specific program you're passionate about, give unrestricted. The leadership knows where the money is most needed. Trust them."
      },
      {
        heading: "Don't expect a tax receipt to be the goal",
        body: "Yes, you can deduct it. But tax savings shouldn't be why you give. The reason matters. The receipt is just paperwork."
      },
    ],
  },
  {
    id: 'daf-explained',
    title: 'What is a DAF — and do I need one?',
    minutes: 3,
    content: [
      {
        heading: 'Donor-Advised Fund — the basics',
        body: "A DAF is a charitable savings account. You contribute money or assets, get an immediate tax deduction, and then recommend grants to nonprofits over time. The money grows tax-free while you decide where it goes."
      },
      {
        heading: "When a DAF makes sense",
        body: "If your income is uneven (good year vs. bad year), a DAF lets you take the deduction in a high-income year and give over time. It's especially useful for athletes with bonus income, signing payments, or one-time NIL windfalls."
      },
      {
        heading: "When you don't need one",
        body: "If you give a few thousand a year directly to one or two orgs, a DAF adds complexity without much benefit. Direct giving is simpler and the org gets the money sooner."
      },
      {
        heading: 'Where to open one',
        body: "Major providers: Fidelity Charitable, Schwab Charitable, Vanguard Charitable. Local: your community foundation. Community foundations cost a little more in fees but offer human guidance and local expertise."
      },
    ],
  },
];

export const VISIBILITY_LESSONS = {
  private: {
    id: 'private-giving',
    title: 'The case for giving privately',
    minutes: 3,
    content: [
      {
        heading: "Quiet giving is its own discipline",
        body: "When you give privately, the act becomes purely about the cause and the people it serves. There's no audience. No applause. Just you and the work."
      },
      {
        heading: 'Why some athletes prefer it',
        body: "Public giving invites scrutiny — about amount, frequency, who you helped, who you didn't. Private giving lets you support causes that matter to you without managing perception."
      },
      {
        heading: 'How to keep it private',
        body: "Give through a DAF or community foundation. They can grant to nonprofits without revealing your name. Many providers have an 'anonymous gift' option built in."
      },
      {
        heading: 'A word of caution',
        body: "Fully anonymous giving means no recognition — but also no relationship with the org. If you want a real partnership over time, sharing your name privately (not publicly) lets the org know who you are while keeping your giving out of the news."
      },
    ],
  },
  selective: {
    id: 'selective-giving',
    title: 'Sharing your giving on your terms',
    minutes: 3,
    content: [
      {
        heading: 'Selective ≠ secret',
        body: "Selective visibility means you share when sharing serves the cause. You're not hiding what you give — you're choosing when it amplifies impact and when it doesn't."
      },
      {
        heading: 'When to share',
        body: "Share when it helps the org recruit other funders. Share when your endorsement opens doors. Share when your story authenticates the cause."
      },
      {
        heading: 'When not to',
        body: "Don't share when it makes the gift about you. Don't share when the org didn't ask. Don't share when sharing would shift focus from the work to your platform."
      },
      {
        heading: 'A test',
        body: "Ask the org: 'Would announcing this help you?' If yes, do it. If no, keep it quiet. Let them lead."
      },
    ],
  },
  public: {
    id: 'public-giving',
    title: 'Using your platform for impact',
    minutes: 3,
    content: [
      {
        heading: 'Visibility as a multiplier',
        body: "When you give publicly, you give others permission to give too. Your audience watches what you do. A thoughtful, public gift can move more money than the gift itself by inspiring others to act."
      },
      {
        heading: 'How to do it well',
        body: "Lead with the cause, not the amount. Talk about why this org matters, not just that you supported them. Make it about the people doing the work — not about you."
      },
      {
        heading: "Avoid the savior trap",
        body: "Public giving can slip into 'look at me' fast. Stay grounded by spending more time on what the org does than on what you did. Quote the people on the ground. Center their voices."
      },
      {
        heading: 'Recurring is more powerful than one-time',
        body: "A single $50K splash gets attention. $4K monthly for a year becomes a story your audience watches unfold — and that consistency proves the commitment isn't a moment, it's a practice."
      },
    ],
  },
};

export const ATHLETICS_LESSONS = [
  {
    id: 'nil-and-philanthropy',
    title: 'NIL income and giving — what to know',
    minutes: 4,
    content: [
      {
        heading: 'NIL is taxable income',
        body: "Unlike scholarships, NIL income is taxable. It's earned income — meaning federal, state, FICA, and self-employment taxes can apply. This also means charitable giving from NIL income may be tax-deductible if you itemize."
      },
      {
        heading: "School and conference rules",
        body: "Some schools and conferences have specific guidelines about how athletes can engage with charitable activities — particularly anything that could look like booster activity. Check with your compliance office before structuring large or visible giving."
      },
      {
        heading: 'Why this stage matters',
        body: "Most pro athletes wait until contract years to think about giving. NIL gives college athletes a chance to start earlier — to build the practice while the income is still small, so by the time it's big the framework is already in place."
      },
      {
        heading: 'Talk to a CPA',
        body: "If your NIL income is meaningful, working with a CPA who understands athlete income is essential. They can help structure giving for tax efficiency without crossing compliance lines."
      },
    ],
  },
  {
    id: 'after-the-career',
    title: 'Giving after your playing days',
    minutes: 3,
    content: [
      {
        heading: "Most athletes don't plan for it",
        body: "Income drops sharply after a playing career. So does visibility. Athletes who give intentionally during their career often face hard choices when the income changes — what to keep funding, what to phase out."
      },
      {
        heading: "Building durable practices",
        body: "If you set up multi-year commitments, recurring gifts, or DAF allocations during your high-earning years, the giving can continue at scale even when active income changes. Planning for this transition is part of building a sustainable giving practice."
      },
      {
        heading: 'Endowment as legacy',
        body: "Some athletes choose to direct a portion of career earnings into an endowment — a fund where the principal stays invested and the earnings fund grants forever. This creates giving that outlasts the career, the contracts, and even you."
      },
    ],
  },
];
