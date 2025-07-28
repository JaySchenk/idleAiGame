export interface GeneratorConfig {
  id: string
  name: string
  baseCost: number
  growthRate: number
  baseProduction: number
  owned: number
}

export const BASIC_AD_BOT_FARM: GeneratorConfig = {
  id: 'basicAdBotFarm',
  name: 'Basic Ad-Bot Farm',
  baseCost: 10,
  growthRate: 1.15,
  baseProduction: 1,
  owned: 0,
}

export const CLICKBAIT_ENGINE: GeneratorConfig = {
  id: 'clickbaitEngine',
  name: 'Clickbait Engine',
  baseCost: 100,
  growthRate: 1.2,
  baseProduction: 10,
  owned: 0,
}

export const generators: GeneratorConfig[] = [BASIC_AD_BOT_FARM, CLICKBAIT_ENGINE]
