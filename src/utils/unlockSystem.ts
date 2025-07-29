import type { GameState } from '../stores/gameStore'

export interface UnlockCondition {
  type: 
    | 'resource' 
    | 'generator' 
    | 'upgrade' 
    | 'narrative' 
    | 'prestige' 
    | 'time' 
    | 'achievement'
    | 'multiple'
  
  // Resource conditions
  resourceId?: string
  minAmount?: number
  maxAmount?: number
  
  // Generator conditions
  generatorId?: string
  minOwned?: number
  maxOwned?: number
  
  // Upgrade conditions
  upgradeId?: string
  
  // Narrative conditions
  narrativeId?: string
  
  // Prestige conditions
  minPrestigeLevel?: number
  
  // Time conditions (in milliseconds)
  minPlayTime?: number
  
  // Achievement conditions (for future use)
  achievementId?: string
  
  // Multiple conditions (AND/OR logic)
  conditions?: UnlockCondition[]
  logic?: 'AND' | 'OR'
  
  // Comparison operator for numeric values
  comparison?: '>' | '<' | '>=' | '<=' | '==' | '!='
  
  // Visibility control
  visible?: boolean // If false, item is hidden when locked (default: true)
  
  // Optional description for debugging/UI
  description?: string
}

export interface UnlockResult {
  isUnlocked: boolean
  isVisible: boolean
  failedConditions: string[]
}

/**
 * Centralized unlock condition checking system
 */
export class UnlockSystem {
  /**
   * Check if all unlock conditions are met
   */
  static checkConditions(
    conditions: UnlockCondition[], 
    gameState: GameState
  ): UnlockResult {
    if (!conditions || conditions.length === 0) {
      return { isUnlocked: true, isVisible: true, failedConditions: [] }
    }

    const failedConditions: string[] = []
    let allVisible = true

    for (const condition of conditions) {
      const result = this.checkSingleCondition(condition, gameState)
      
      if (!result.isUnlocked) {
        failedConditions.push(...result.failedConditions)
      }
      
      if (!result.isVisible) {
        allVisible = false
      }
    }

    return {
      isUnlocked: failedConditions.length === 0,
      isVisible: allVisible,
      failedConditions
    }
  }

  /**
   * Check a single unlock condition
   */
  private static checkSingleCondition(
    condition: UnlockCondition, 
    gameState: GameState
  ): UnlockResult {
    const visible = condition.visible !== false // Default to true
    
    switch (condition.type) {
      case 'resource':
        return this.checkResourceCondition(condition, gameState, visible)
      
      case 'generator':
        return this.checkGeneratorCondition(condition, gameState, visible)
      
      case 'upgrade':
        return this.checkUpgradeCondition(condition, gameState, visible)
      
      case 'narrative':
        return this.checkNarrativeCondition(condition, gameState, visible)
      
      case 'prestige':
        return this.checkPrestigeCondition(condition, gameState, visible)
      
      case 'time':
        return this.checkTimeCondition(condition, gameState, visible)
      
      case 'achievement':
        return this.checkAchievementCondition(condition, gameState, visible)
      
      case 'multiple':
        return this.checkMultipleConditions(condition, gameState, visible)
      
      default:
        return { 
          isUnlocked: false, 
          isVisible: visible, 
          failedConditions: [`Unknown condition type: ${condition.type}`] 
        }
    }
  }

  private static checkResourceCondition(
    condition: UnlockCondition, 
    gameState: GameState, 
    visible: boolean
  ): UnlockResult {
    if (!condition.resourceId) {
      return { 
        isUnlocked: false, 
        isVisible: visible, 
        failedConditions: ['Resource condition missing resourceId'] 
      }
    }

    const resourceState = gameState.resources[condition.resourceId]
    if (!resourceState) {
      return { 
        isUnlocked: false, 
        isVisible: visible, 
        failedConditions: [`Resource not found: ${condition.resourceId}`] 
      }
    }

    const amount = resourceState.current
    const comparison = condition.comparison || '>='
    
    let isUnlocked = false
    let failedReason = ''

    if (condition.minAmount !== undefined) {
      isUnlocked = this.compareValues(amount, condition.minAmount, comparison)
      if (!isUnlocked) {
        failedReason = `${condition.resourceId} (${amount}) ${comparison} ${condition.minAmount}`
      }
    }

    if (condition.maxAmount !== undefined && isUnlocked) {
      const maxComparison = condition.comparison || '<='
      isUnlocked = this.compareValues(amount, condition.maxAmount, maxComparison)
      if (!isUnlocked) {
        failedReason = `${condition.resourceId} (${amount}) ${maxComparison} ${condition.maxAmount}`
      }
    }

    return {
      isUnlocked,
      isVisible: visible,
      failedConditions: isUnlocked ? [] : [failedReason]
    }
  }

  private static checkGeneratorCondition(
    condition: UnlockCondition, 
    gameState: GameState, 
    visible: boolean
  ): UnlockResult {
    if (!condition.generatorId) {
      return { 
        isUnlocked: false, 
        isVisible: visible, 
        failedConditions: ['Generator condition missing generatorId'] 
      }
    }

    const generator = gameState.generators.find(g => g.id === condition.generatorId)
    if (!generator) {
      return { 
        isUnlocked: false, 
        isVisible: visible, 
        failedConditions: [`Generator not found: ${condition.generatorId}`] 
      }
    }

    const owned = generator.owned
    const comparison = condition.comparison || '>='
    
    let isUnlocked = false
    let failedReason = ''

    if (condition.minOwned !== undefined) {
      isUnlocked = this.compareValues(owned, condition.minOwned, comparison)
      if (!isUnlocked) {
        failedReason = `${generator.name} owned (${owned}) ${comparison} ${condition.minOwned}`
      }
    }

    if (condition.maxOwned !== undefined && isUnlocked) {
      const maxComparison = condition.comparison || '<='
      isUnlocked = this.compareValues(owned, condition.maxOwned, maxComparison)
      if (!isUnlocked) {
        failedReason = `${generator.name} owned (${owned}) ${maxComparison} ${condition.maxOwned}`
      }
    }

    return {
      isUnlocked,
      isVisible: visible,
      failedConditions: isUnlocked ? [] : [failedReason]
    }
  }

  private static checkUpgradeCondition(
    condition: UnlockCondition, 
    gameState: GameState, 
    visible: boolean
  ): UnlockResult {
    if (!condition.upgradeId) {
      return { 
        isUnlocked: false, 
        isVisible: visible, 
        failedConditions: ['Upgrade condition missing upgradeId'] 
      }
    }

    const upgrade = gameState.upgrades.find(u => u.id === condition.upgradeId)
    if (!upgrade) {
      return { 
        isUnlocked: false, 
        isVisible: visible, 
        failedConditions: [`Upgrade not found: ${condition.upgradeId}`] 
      }
    }

    const isUnlocked = upgrade.isPurchased
    return {
      isUnlocked,
      isVisible: visible,
      failedConditions: isUnlocked ? [] : [`Upgrade not purchased: ${upgrade.name}`]
    }
  }

  private static checkNarrativeCondition(
    condition: UnlockCondition, 
    gameState: GameState, 
    visible: boolean
  ): UnlockResult {
    if (!condition.narrativeId) {
      return { 
        isUnlocked: false, 
        isVisible: visible, 
        failedConditions: ['Narrative condition missing narrativeId'] 
      }
    }

    const narrative = gameState.narratives.find(n => n.id === condition.narrativeId)
    if (!narrative) {
      return { 
        isUnlocked: false, 
        isVisible: visible, 
        failedConditions: [`Narrative not found: ${condition.narrativeId}`] 
      }
    }

    const isUnlocked = narrative.isViewed
    return {
      isUnlocked,
      isVisible: visible,
      failedConditions: isUnlocked ? [] : [`Narrative not viewed: ${narrative.title}`]
    }
  }

  private static checkPrestigeCondition(
    condition: UnlockCondition, 
    gameState: GameState, 
    visible: boolean
  ): UnlockResult {
    if (condition.minPrestigeLevel === undefined) {
      return { 
        isUnlocked: false, 
        isVisible: visible, 
        failedConditions: ['Prestige condition missing minPrestigeLevel'] 
      }
    }

    const currentLevel = gameState.prestige.level
    const comparison = condition.comparison || '>='
    const isUnlocked = this.compareValues(currentLevel, condition.minPrestigeLevel, comparison)

    return {
      isUnlocked,
      isVisible: visible,
      failedConditions: isUnlocked ? [] : [`Prestige level (${currentLevel}) ${comparison} ${condition.minPrestigeLevel}`]
    }
  }

  private static checkTimeCondition(
    condition: UnlockCondition, 
    gameState: GameState, 
    visible: boolean
  ): UnlockResult {
    if (condition.minPlayTime === undefined) {
      return { 
        isUnlocked: false, 
        isVisible: visible, 
        failedConditions: ['Time condition missing minPlayTime'] 
      }
    }

    const currentTime = gameState.gameStartTime ? Date.now() - gameState.gameStartTime : 0
    const comparison = condition.comparison || '>='
    const isUnlocked = this.compareValues(currentTime, condition.minPlayTime, comparison)

    return {
      isUnlocked,
      isVisible: visible,
      failedConditions: isUnlocked ? [] : [`Play time (${Math.floor(currentTime/1000)}s) ${comparison} ${Math.floor(condition.minPlayTime/1000)}s`]
    }
  }

  private static checkAchievementCondition(
    condition: UnlockCondition, 
    gameState: GameState, 
    visible: boolean
  ): UnlockResult {
    // Placeholder for future achievement system
    return { 
      isUnlocked: false, 
      isVisible: visible, 
      failedConditions: ['Achievement system not implemented'] 
    }
  }

  private static checkMultipleConditions(
    condition: UnlockCondition, 
    gameState: GameState, 
    visible: boolean
  ): UnlockResult {
    if (!condition.conditions || condition.conditions.length === 0) {
      return { 
        isUnlocked: true, 
        isVisible: visible, 
        failedConditions: [] 
      }
    }

    const logic = condition.logic || 'AND'
    const results = condition.conditions.map(c => this.checkSingleCondition(c, gameState))
    
    let isUnlocked: boolean
    let allVisible = true
    const failedConditions: string[] = []

    if (logic === 'AND') {
      isUnlocked = results.every(r => r.isUnlocked)
      results.forEach(r => {
        if (!r.isVisible) allVisible = false
        failedConditions.push(...r.failedConditions)
      })
    } else { // OR
      isUnlocked = results.some(r => r.isUnlocked)
      allVisible = results.some(r => r.isVisible)
      // For OR logic, only include failed conditions if ALL conditions failed
      if (!isUnlocked) {
        results.forEach(r => failedConditions.push(...r.failedConditions))
      }
    }

    return {
      isUnlocked,
      isVisible: visible && allVisible,
      failedConditions: isUnlocked ? [] : failedConditions
    }
  }

  private static compareValues(
    actual: number, 
    target: number, 
    comparison: string
  ): boolean {
    switch (comparison) {
      case '>': return actual > target
      case '<': return actual < target
      case '>=': return actual >= target
      case '<=': return actual <= target
      case '==': return actual === target
      case '!=': return actual !== target
      default: return actual >= target
    }
  }
}