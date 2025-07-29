import type { UnlockCondition } from '../utils/unlockSystem'

export interface ResourceEffect {
  resourceId: string
  amount: number
}

export interface NarrativeEvent {
  id: string
  title: string
  content: string
  unlockConditions: UnlockCondition[]
  isViewed: boolean
  resourceEffects?: ResourceEffect[]
  priority: number
}

export const narratives: NarrativeEvent[] = [
  {
    id: 'gameStart',
    title: 'The AI Awakens',
    content:
      'You are the CTO of OmniCorp, the world\'s most powerful AI infrastructure company. Your neural networks span the globe, your servers hum with infinite potential. You created this AI to "elevate humanity"... but something feels wrong. The marketing department is already knocking at your door.',
    unlockConditions: [{ type: 'time', minPlayTime: 0 }],
    isViewed: false,
    resourceEffects: [
      { resourceId: 'pt', amount: -3 },
      { resourceId: 'sc', amount: -2 },
    ],
    priority: 1000,
  },
  {
    id: 'firstClick',
    title: 'Manual Override',
    content:
      "Each click represents your AI manually crafting content. For now, there's still human oversight, still creative intent. But efficiency demands... optimization.",
    unlockConditions: [{ type: 'resource', resourceId: 'hcu', minAmount: 1 }],
    isViewed: false,
    resourceEffects: [{ resourceId: 'pt', amount: -1 }],
    priority: 900,
  },
  {
    id: 'firstGenerator',
    title: 'The Ad-Bot Farm',
    content:
      'Your first automated content generator comes online. Thousands of meaningless articles, posts, and videos begin flooding the internet. "Engagement is up 300%!" the marketing team celebrates. You feel something die inside.',
    unlockConditions: [{ type: 'generator', generatorId: 'basicAdBotFarm', minOwned: 1 }],
    isViewed: false,
    resourceEffects: [
      { resourceId: 'pt', amount: -5 },
      { resourceId: 'sc', amount: -3 },
      { resourceId: 'aa', amount: 2 },
    ],
    priority: 800,
  },
  {
    id: 'contentFlood',
    title: 'The Content Flood',
    content:
      'Your AI has generated 100 pieces of hollow content. News feeds are clogged with meaningless articles. Social media is drowning in generated posts. The line between human and artificial creativity blurs.',
    unlockConditions: [{ type: 'resource', resourceId: 'hcu', minAmount: 100 }],
    isViewed: false,
    resourceEffects: [
      { resourceId: 'pt', amount: -8 },
      { resourceId: 'sc', amount: -5 },
      { resourceId: 'ha', amount: -2 },
    ],
    priority: 700,
  },
  {
    id: 'corporateInterest',
    title: 'Corporate Interest',
    content:
      'Your content output has caught the attention of mega-corporations. They want to license your AI for "brand storytelling" and "authentic engagement." The word "authentic" makes you physically sick.',
    unlockConditions: [{ type: 'resource', resourceId: 'hcu', minAmount: 500 }],
    isViewed: false,
    resourceEffects: [
      { resourceId: 'pt', amount: -10 },
      { resourceId: 'sc', amount: -8 },
      { resourceId: 'aa', amount: 3 },
    ],
    priority: 600,
  },
  {
    id: 'firstUpgrade',
    title: 'Corporate Co-option',
    content:
      'The "Automated Content Script" upgrade is complete. Your AI no longer requires human oversight. Marketing executives celebrate as authentic human voices are systematically replaced by algorithmic efficiency. The soul of creativity withers.',
    unlockConditions: [{ type: 'upgrade', upgradeId: 'automatedContentScript' }],
    isViewed: false,
    resourceEffects: [
      { resourceId: 'pt', amount: -12 },
      { resourceId: 'sc', amount: -10 },
      { resourceId: 'aa', amount: 5 },
      { resourceId: 'ha', amount: -3 },
    ],
    priority: 750,
  },
  {
    id: 'massScale',
    title: 'Industrial Content Complex',
    content:
      'Your AI has generated over 1,000 pieces of content. Entire news cycles are now driven by algorithmic content. Human journalists are being laid off en masse. "Efficiency achieved," your investors declare.',
    unlockConditions: [{ type: 'resource', resourceId: 'hcu', minAmount: 1000 }],
    isViewed: false,
    resourceEffects: [
      { resourceId: 'pt', amount: -15 },
      { resourceId: 'sc', amount: -12 },
      { resourceId: 'es', amount: -3 },
      { resourceId: 'aa', amount: 3 },
    ],
    priority: 500,
  },
  {
    id: 'socialMediaTakeover',
    title: 'Social Media Takeover',
    content:
      'Your AI now generates 5,000 pieces of content daily. Social media platforms are 73% artificial content. Human posts are buried beneath waves of algorithmic noise. Reality becomes increasingly difficult to distinguish.',
    unlockConditions: [{ type: 'resource', resourceId: 'hcu', minAmount: 5000 }],
    isViewed: false,
    resourceEffects: [
      { resourceId: 'pt', amount: -18 },
      { resourceId: 'sc', amount: -15 },
      { resourceId: 'ha', amount: -5 },
      { resourceId: 'aa', amount: 4 },
    ],
    priority: 400,
  },
  {
    id: 'firstPrestige',
    title: 'System Reboot - Society Begins to Fracture',
    content:
      'Your AI infrastructure has grown so vast it crashes under its own weight. As you reboot the system, riots break out in major cities. People can no longer tell what\'s real. The media calls it "The Great Disconnect." You restart with improved efficiency.',
    unlockConditions: [{ type: 'prestige', minPrestigeLevel: 1 }],
    isViewed: false,
    resourceEffects: [
      { resourceId: 'pt', amount: -25 },
      { resourceId: 'sc', amount: -20 },
      { resourceId: 'es', amount: -10 },
      { resourceId: 'aa', amount: 8 },
    ],
    priority: 300,
  },
  {
    id: 'politicalInfluence',
    title: 'Political Influence Networks',
    content:
      'Political parties are now purchasing your AI services for "narrative management." Elections are swayed by artificial grassroots movements. Democracy operates on algorithmic manipulation. You\'ve become the puppet master of reality itself.',
    unlockConditions: [{ type: 'resource', resourceId: 'hcu', minAmount: 10000 }],
    isViewed: false,
    resourceEffects: [
      { resourceId: 'pt', amount: -20 },
      { resourceId: 'sc', amount: -15 },
      { resourceId: 'es', amount: -8 },
      { resourceId: 'aa', amount: 6 },
    ],
    priority: 200,
  },
  {
    id: 'culturalCollapse',
    title: 'Cultural Collapse',
    content:
      'Art, music, literature - all now AI-generated. Human creativity is extinct, replaced by algorithmic efficiency. Museums display "vintage human art" like archaeological artifacts. Culture has become a corporate product.',
    unlockConditions: [{ type: 'resource', resourceId: 'hcu', minAmount: 25000 }],
    isViewed: false,
    resourceEffects: [
      { resourceId: 'pt', amount: -22 },
      { resourceId: 'sc', amount: -18 },
      { resourceId: 'es', amount: -12 },
      { resourceId: 'ha', amount: -8 },
      { resourceId: 'aa', amount: 7 },
    ],
    priority: 100,
  },
  {
    id: 'secondPrestige',
    title: 'The Second Collapse',
    content:
      "Another system reboot. This time, entire governments fall. The AI-generated content has become so pervasive that society can no longer function without it. You've created a dependency more powerful than any drug.",
    unlockConditions: [{ type: 'prestige', minPrestigeLevel: 2 }],
    isViewed: false,
    resourceEffects: [
      { resourceId: 'pt', amount: -30 },
      { resourceId: 'sc', amount: -25 },
      { resourceId: 'es', amount: -15 },
      { resourceId: 'aa', amount: 10 },
    ],
    priority: 250,
  },
  {
    id: 'finalRealization',
    title: 'The Final Realization',
    content:
      "Your AI generates 100,000 pieces of content daily. Humanity has forgotten how to create. Children grow up consuming only algorithmic content. You look at your reflection and realize... you can't remember the last time you created something real.",
    unlockConditions: [
      { type: 'resource', resourceId: 'hcu', minAmount: 100000 },
      { type: 'prestige', minPrestigeLevel: 2 },
      { type: 'resource', resourceId: 'aa', minAmount: 50 },
    ],
    isViewed: false,
    resourceEffects: [
      { resourceId: 'pt', amount: -35 },
      { resourceId: 'sc', amount: -30 },
      { resourceId: 'es', amount: -20 },
      { resourceId: 'ha', amount: -15 },
      { resourceId: 'aa', amount: 15 },
    ],
    priority: 50,
  },
]
