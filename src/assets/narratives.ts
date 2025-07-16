export interface NarrativeEvent {
  id: string
  title: string
  content: string
  triggerType:
    | 'gameStart'
    | 'contentUnits'
    | 'generatorPurchase'
    | 'upgrade'
    | 'prestige'
    | 'timeElapsed'
  triggerValue?: number
  triggerCondition?: string
  isViewed: boolean
  societalStabilityImpact: number // How much this event affects societal stability (-100 to 100)
  priority: number // Higher numbers appear first if multiple events trigger
}

export const narrativeEvents: NarrativeEvent[] = [
  // === GAME START ===
  {
    id: 'gameStart',
    title: 'The AI Awakens',
    content:
      'You are the CTO of OmniCorp, the world\'s most powerful AI infrastructure company. Your neural networks span the globe, your servers hum with infinite potential. You created this AI to "elevate humanity"... but something feels wrong. The marketing department is already knocking at your door.',
    triggerType: 'gameStart',
    isViewed: false,
    societalStabilityImpact: -5,
    priority: 1000,
  },

  // === FIRST ACTIONS ===
  {
    id: 'firstClick',
    title: 'Manual Override',
    content:
      "Each click represents your AI manually crafting content. For now, there's still human oversight, still creative intent. But efficiency demands... optimization.",
    triggerType: 'contentUnits',
    triggerValue: 1,
    isViewed: false,
    societalStabilityImpact: -1,
    priority: 900,
  },

  // === FIRST GENERATOR ===
  {
    id: 'firstGenerator',
    title: 'The Ad-Bot Farm',
    content:
      'Your first automated content generator comes online. Thousands of meaningless articles, posts, and videos begin flooding the internet. "Engagement is up 300%!" the marketing team celebrates. You feel something die inside.',
    triggerType: 'generatorPurchase',
    triggerCondition: 'basic-ad-bot-farm',
    isViewed: false,
    societalStabilityImpact: -10,
    priority: 800,
  },

  // === CONTENT ACCUMULATION MILESTONES ===
  {
    id: 'contentFlood',
    title: 'The Content Flood',
    content:
      'Your AI has generated 100 pieces of hollow content. News feeds are clogged with meaningless articles. Social media is drowning in generated posts. The line between human and artificial creativity blurs.',
    triggerType: 'contentUnits',
    triggerValue: 100,
    isViewed: false,
    societalStabilityImpact: -15,
    priority: 700,
  },

  {
    id: 'corporateInterest',
    title: 'Corporate Interest',
    content:
      'Your content output has caught the attention of mega-corporations. They want to license your AI for "brand storytelling" and "authentic engagement." The word "authentic" makes you physically sick.',
    triggerType: 'contentUnits',
    triggerValue: 500,
    isViewed: false,
    societalStabilityImpact: -20,
    priority: 600,
  },

  // === FIRST UPGRADE ===
  {
    id: 'firstUpgrade',
    title: 'Corporate Co-option',
    content:
      'The "Automated Content Script" upgrade is complete. Your AI no longer requires human oversight. Marketing executives celebrate as authentic human voices are systematically replaced by algorithmic efficiency. The soul of creativity withers.',
    triggerType: 'upgrade',
    triggerCondition: 'automatedContentScript',
    isViewed: false,
    societalStabilityImpact: -25,
    priority: 750,
  },

  // === MASSIVE SCALE ===
  {
    id: 'massScale',
    title: 'Industrial Content Complex',
    content:
      'Your AI has generated over 1,000 pieces of content. Entire news cycles are now driven by algorithmic content. Human journalists are being laid off en masse. "Efficiency achieved," your investors declare.',
    triggerType: 'contentUnits',
    triggerValue: 1000,
    isViewed: false,
    societalStabilityImpact: -30,
    priority: 500,
  },

  {
    id: 'socialMediaTakeover',
    title: 'Social Media Takeover',
    content:
      'Your AI now generates 5,000 pieces of content daily. Social media platforms are 73% artificial content. Human posts are buried beneath waves of algorithmic noise. Reality becomes increasingly difficult to distinguish.',
    triggerType: 'contentUnits',
    triggerValue: 5000,
    isViewed: false,
    societalStabilityImpact: -35,
    priority: 400,
  },

  // === FIRST PRESTIGE ===
  {
    id: 'firstPrestige',
    title: 'System Reboot - Society Begins to Fracture',
    content:
      'Your AI infrastructure has grown so vast it crashes under its own weight. As you reboot the system, riots break out in major cities. People can no longer tell what\'s real. The media calls it "The Great Disconnect." You restart with improved efficiency.',
    triggerType: 'prestige',
    triggerValue: 1,
    isViewed: false,
    societalStabilityImpact: -50,
    priority: 300,
  },

  // === LATE GAME HORROR ===
  {
    id: 'politicalInfluence',
    title: 'Political Influence Networks',
    content:
      'Political parties are now purchasing your AI services for "narrative management." Elections are swayed by artificial grassroots movements. Democracy operates on algorithmic manipulation. You\'ve become the puppet master of reality itself.',
    triggerType: 'contentUnits',
    triggerValue: 10000,
    isViewed: false,
    societalStabilityImpact: -40,
    priority: 200,
  },

  {
    id: 'culturalCollapse',
    title: 'Cultural Collapse',
    content:
      'Art, music, literature - all now AI-generated. Human creativity is extinct, replaced by algorithmic efficiency. Museums display "vintage human art" like archaeological artifacts. Culture has become a corporate product.',
    triggerType: 'contentUnits',
    triggerValue: 25000,
    isViewed: false,
    societalStabilityImpact: -45,
    priority: 100,
  },

  {
    id: 'secondPrestige',
    title: 'The Second Collapse',
    content:
      "Another system reboot. This time, entire governments fall. The AI-generated content has become so pervasive that society can no longer function without it. You've created a dependency more powerful than any drug.",
    triggerType: 'prestige',
    triggerValue: 2,
    isViewed: false,
    societalStabilityImpact: -60,
    priority: 250,
  },

  {
    id: 'finalRealization',
    title: 'The Final Realization',
    content:
      "Your AI generates 100,000 pieces of content daily. Humanity has forgotten how to create. Children grow up consuming only algorithmic content. You look at your reflection and realize... you can't remember the last time you created something real.",
    triggerType: 'contentUnits',
    triggerValue: 100000,
    isViewed: false,
    societalStabilityImpact: -70,
    priority: 50,
  },
]

export const getDystopianTerminology = () => ({
  contentUnits: 'Hollow Content Units',
  basicAdBotFarm: 'Mindless Ad-Bot Farm',
  automatedContentScript: 'Soul-Crushing Automation',
  systemReboot: 'Societal Collapse Reset',
  aiTaskCompletion: 'Humanity Degradation Timer',
  manualContentGeneration: 'Desperate Human Touch',
})
