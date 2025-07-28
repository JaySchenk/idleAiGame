export interface GeneratorConfig {
  id: string
  name: string
  baseCost: number
  growthRate: number
  baseProduction: number
  owned: number
}

export const generators: GeneratorConfig[] = [
  {
    id: 'basicAdBotFarm',
    name: 'Basic Ad-Bot Farm',
    baseCost: 10,
    growthRate: 1.15,
    baseProduction: 1,
    owned: 0,
  },
  {
    id: 'clickbaitEngine',
    name: 'Clickbait Engine',
    baseCost: 100,
    growthRate: 1.2,
    baseProduction: 10,
    owned: 0,
  },
]

// Generator access by ID:
// 'basicAdBotFarm' - Basic Ad-Bot Farm
// 'clickbaitEngine' - Clickbait Engine
