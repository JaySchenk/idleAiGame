import { ResourceManager } from './Resources'
import { UpgradeManager } from './Upgrades'

export interface GeneratorConfig {
  id: string
  name: string
  baseCost: number
  growthRate: number
  baseProduction: number
  owned: number
}

export class GeneratorManager {
  private static instance: GeneratorManager
  private generators: Map<string, GeneratorConfig> = new Map()
  private resourceManager: ResourceManager
  private upgradeManager: UpgradeManager | null = null

  private constructor() {
    this.resourceManager = ResourceManager.getInstance()
    this.initializeGenerators()
  }

  public static getInstance(): GeneratorManager {
    if (!GeneratorManager.instance) {
      GeneratorManager.instance = new GeneratorManager()
    }
    return GeneratorManager.instance
  }

  // Initialize upgrade manager (called by GameManager)
  public initializeUpgradeManager(): void {
    this.upgradeManager = UpgradeManager.getInstance()
  }

  private initializeGenerators() {
    // Initialize Basic Ad-Bot Farm generator
    this.generators.set('basicAdBotFarm', {
      id: 'basicAdBotFarm',
      name: 'Basic Ad-Bot Farm',
      baseCost: 10,
      growthRate: 1.15,
      baseProduction: 1,
      owned: 0,
    })
  }

  // Get generator by ID
  public getGenerator(id: string): GeneratorConfig | undefined {
    return this.generators.get(id)
  }

  // Calculate current cost for next purchase
  public getGeneratorCost(id: string): number {
    const generator = this.generators.get(id)
    if (!generator) return 0

    // cost_next = cost_base × (rate_growth)^owned
    return Math.floor(generator.baseCost * Math.pow(generator.growthRate, generator.owned))
  }

  // Purchase generator
  public purchaseGenerator(id: string): boolean {
    const generator = this.generators.get(id)
    if (!generator) return false

    const cost = this.getGeneratorCost(id)

    if (this.resourceManager.canAfford(cost)) {
      if (this.resourceManager.spendContentUnits(cost)) {
        generator.owned++
        return true
      }
    }

    return false
  }

  // Get total production rate (CPS) from all generators
  public getTotalProductionRate(): number {
    let totalRate = 0

    for (const generator of this.generators.values()) {
      let generatorRate = generator.baseProduction * generator.owned

      // Apply upgrade multipliers
      if (this.upgradeManager) {
        generatorRate *= this.upgradeManager.getGeneratorMultiplier(generator.id)
      }

      totalRate += generatorRate
    }

    // Apply global multiplier from upgrades only (not prestige)
    if (this.upgradeManager) {
      totalRate *= this.upgradeManager.getGlobalMultiplier()
    }

    return totalRate
  }

  // Get specific generator production rate
  public getGeneratorProductionRate(id: string): number {
    const generator = this.generators.get(id)
    if (!generator) return 0

    let rate = generator.baseProduction * generator.owned

    // Apply upgrade multipliers
    if (this.upgradeManager) {
      rate *= this.upgradeManager.getGeneratorMultiplier(generator.id)
    }

    return rate
  }

  // Get all generators for UI display
  public getAllGenerators(): GeneratorConfig[] {
    return Array.from(this.generators.values())
  }

  // Check if generator can be purchased
  public canPurchaseGenerator(id: string): boolean {
    const cost = this.getGeneratorCost(id)
    return this.resourceManager.canAfford(cost)
  }
}
