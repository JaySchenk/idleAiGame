import { ResourceManager } from './Resources'
import { GeneratorManager } from './Generators'

export interface UpgradeConfig {
  id: string
  name: string
  description: string
  cost: number
  targetGenerator: string
  effectType: 'production_multiplier' | 'global_multiplier'
  effectValue: number
  requirements: {
    generatorId: string
    minOwned: number
  }[]
  isPurchased: boolean
}

export class UpgradeManager {
  private static instance: UpgradeManager
  private upgrades: Map<string, UpgradeConfig> = new Map()
  private resourceManager: ResourceManager
  private generatorManager: GeneratorManager
  
  private constructor() {
    this.resourceManager = ResourceManager.getInstance()
    this.generatorManager = GeneratorManager.getInstance()
    this.initializeUpgrades()
  }
  
  public static getInstance(): UpgradeManager {
    if (!UpgradeManager.instance) {
      UpgradeManager.instance = new UpgradeManager()
    }
    return UpgradeManager.instance
  }
  
  private initializeUpgrades() {
    // "Automated Content Script" upgrade for Basic Ad-Bot Farm
    this.upgrades.set('automatedContentScript', {
      id: 'automatedContentScript',
      name: 'Soul-Crushing Automation',
      description: 'Increases Mindless Ad-Bot Farm production by 25%',
      cost: 50,
      targetGenerator: 'basicAdBotFarm',
      effectType: 'production_multiplier',
      effectValue: 1.25,
      requirements: [
        {
          generatorId: 'basicAdBotFarm',
          minOwned: 5
        }
      ],
      isPurchased: false
    })
  }
  
  // Get upgrade by ID
  public getUpgrade(id: string): UpgradeConfig | undefined {
    return this.upgrades.get(id)
  }
  
  // Get all upgrades
  public getAllUpgrades(): UpgradeConfig[] {
    return Array.from(this.upgrades.values())
  }
  
  // Check if upgrade requirements are met
  public areRequirementsMet(upgradeId: string): boolean {
    const upgrade = this.upgrades.get(upgradeId)
    if (!upgrade) return false
    
    for (const requirement of upgrade.requirements) {
      const generator = this.generatorManager.getGenerator(requirement.generatorId)
      if (!generator || generator.owned < requirement.minOwned) {
        return false
      }
    }
    
    return true
  }
  
  // Check if upgrade can be purchased
  public canPurchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.get(upgradeId)
    if (!upgrade) return false
    
    return (
      !upgrade.isPurchased &&
      this.resourceManager.canAfford(upgrade.cost) &&
      this.areRequirementsMet(upgradeId)
    )
  }
  
  // Purchase upgrade
  public purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.get(upgradeId)
    if (!upgrade) return false
    
    if (!this.canPurchaseUpgrade(upgradeId)) {
      return false
    }
    
    if (this.resourceManager.spendContentUnits(upgrade.cost)) {
      upgrade.isPurchased = true
      return true
    }
    
    return false
  }
  
  // Get production multiplier for a specific generator
  public getGeneratorMultiplier(generatorId: string): number {
    let multiplier = 1
    
    for (const upgrade of this.upgrades.values()) {
      if (
        upgrade.isPurchased &&
        upgrade.targetGenerator === generatorId &&
        upgrade.effectType === 'production_multiplier'
      ) {
        multiplier *= upgrade.effectValue
      }
    }
    
    return multiplier
  }
  
  // Get global multiplier for all production
  public getGlobalMultiplier(): number {
    let multiplier = 1
    
    for (const upgrade of this.upgrades.values()) {
      if (
        upgrade.isPurchased &&
        upgrade.effectType === 'global_multiplier'
      ) {
        multiplier *= upgrade.effectValue
      }
    }
    
    return multiplier
  }
  
  // Get available upgrades (not purchased and requirements met)
  public getAvailableUpgrades(): UpgradeConfig[] {
    return Array.from(this.upgrades.values()).filter(upgrade => 
      !upgrade.isPurchased && this.areRequirementsMet(upgrade.id)
    )
  }
  
  // Get purchased upgrades
  public getPurchasedUpgrades(): UpgradeConfig[] {
    return Array.from(this.upgrades.values()).filter(upgrade => upgrade.isPurchased)
  }
}