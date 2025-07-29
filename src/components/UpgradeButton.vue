<template>
  <div class="upgrade-container">
    <div class="upgrade-header">
      <h3 class="upgrade-title">{{ upgrade.name }}</h3>
      <div class="upgrade-costs">
        <div v-for="cost in upgrade.costs" :key="cost.resourceId" class="upgrade-cost">
          <CurrencyDisplay :resource-id="cost.resourceId" :amount="cost.amount" />
        </div>
      </div>
    </div>

    <div class="upgrade-description">
      {{ upgrade.description }}
    </div>

    <div class="upgrade-effects">
      <div
        v-for="effect in upgrade.effects"
        :key="effect.type + effect.targetId"
        class="upgrade-effect"
      >
        <span
          class="effect-description"
          :class="{ positive: isPositiveEffect(effect), negative: !isPositiveEffect(effect) }"
        >
          {{ formatEffectDescription(effect) }}
        </span>
      </div>
    </div>

    <div class="upgrade-requirements" v-if="!requirementsMet">
      <div class="requirement-text">Requires:</div>
      <div
        v-for="condition in upgrade.unlockConditions"
        :key="condition.generatorId || condition.resourceId"
        class="requirement-item"
      >
        <span v-if="condition.type === 'generator' && condition.generatorId">
          {{ condition.minOwned }} {{ getGeneratorName(condition.generatorId) }}
          <span class="requirement-progress">
            ({{ getGeneratorOwned(condition.generatorId) }}/{{ condition.minOwned }})
          </span>
        </span>
        <span v-else-if="condition.type === 'resource' && condition.resourceId">
          {{ condition.minAmount }} {{ condition.resourceId }}
        </span>
        <span v-else> {{ condition.type }} condition </span>
      </div>
    </div>

    <button
      class="upgrade-button"
      :class="{
        disabled: !canPurchase,
        purchasing: isPurchasing,
        purchased: upgrade.isPurchased,
      }"
      :disabled="!canPurchase || isPurchasing || upgrade.isPurchased"
      @click="purchaseUpgrade"
    >
      <span v-if="upgrade.isPurchased">✓ Purchased</span>
      <span v-else-if="isPurchasing">Purchasing...</span>
      <span v-else-if="!requirementsMet">Requirements Not Met</span>
      <span v-else-if="!canAfford">Insufficient Resources</span>
      <span v-else>Purchase Upgrade</span>
    </button>

    <!-- Purchase effect animation -->
    <div v-if="showPurchaseEffect" class="purchase-effect">
      <div class="effect-text">Upgrade Purchased!</div>
      <div class="effect-bonus">{{ formatPurchaseEffects() }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore, type UpgradeConfig } from '../stores/gameStore'
import { usePurchaseAnimation } from '../composables/usePurchaseAnimation'
import type { UpgradeEffect } from '../config/upgrades'
// Currency display now uses IDs from the store
import CurrencyDisplay from './CurrencyDisplay.vue'

interface Props {
  upgrade: UpgradeConfig
}

const props = defineProps<Props>()
const gameStore = useGameStore()

const { isPurchasing, showPurchaseEffect, executePurchase } = usePurchaseAnimation()

// Reactive computed properties from Pinia store
const upgrade = computed(() => {
  return props.upgrade
})

// Check requirements
const requirementsMet = computed(() => {
  return gameStore.areUpgradeRequirementsMet(props.upgrade.id)
})

// Check if can afford all costs
const canAfford = computed(() => {
  return upgrade.value.costs.every((cost) =>
    gameStore.canAffordResource(cost.resourceId, cost.amount),
  )
})

// Check if can purchase
const canPurchase = computed(() => {
  return gameStore.canPurchaseUpgrade(props.upgrade.id)
})

// Get generator name by ID
const getGeneratorName = (generatorId: string): string => {
  const generator = gameStore.gameState.generators.find((g) => g.id === generatorId)
  return generator ? generator.name : 'Unknown Generator'
}

// Get generator owned count
const getGeneratorOwned = (generatorId: string): number => {
  const generator = gameStore.gameState.generators.find((g) => g.id === generatorId)
  return generator ? generator.owned : 0
}

// Purchase upgrade
const purchaseUpgrade = async () => {
  if (!canPurchase.value) return

  await executePurchase(() => gameStore.purchaseUpgrade(props.upgrade.id))
}

// Determine if an effect is positive
const isPositiveEffect = (effect: UpgradeEffect): boolean => {
  switch (effect.type) {
    case 'production_multiplier':
    case 'click_multiplier':
    case 'global_resource_multiplier':
      return effect.value > 1
    case 'resource_capacity':
      return effect.value > 0
    case 'decay_reduction':
      return effect.value < 1
    default:
      return true
  }
}

// Format effect description
const formatEffectDescription = (effect: UpgradeEffect): string => {
  const targetName = effect.targetId ? getTargetName(effect.targetId, effect.type) : ''

  switch (effect.type) {
    case 'production_multiplier':
      const prodPercent = Math.round((effect.value - 1) * 100)
      const prodSign = prodPercent >= 0 ? '+' : ''
      return `${prodSign}${prodPercent}% ${targetName} production`

    case 'click_multiplier':
      const clickPercent = Math.round((effect.value - 1) * 100)
      const clickSign = clickPercent >= 0 ? '+' : ''
      return `${clickSign}${clickPercent}% click rewards`

    case 'global_resource_multiplier':
      const globalPercent = Math.round((effect.value - 1) * 100)
      const globalSign = globalPercent >= 0 ? '+' : ''
      return `${globalSign}${globalPercent}% all ${targetName} generation`

    case 'resource_capacity':
      const capacitySign = effect.value >= 0 ? '+' : ''
      return `${capacitySign}${effect.value} max ${targetName}`

    case 'decay_reduction':
      const decayPercent = Math.round((1 - effect.value) * 100)
      const decaySign = decayPercent >= 0 ? '-' : '+'
      return `${decaySign}${Math.abs(decayPercent)}% ${targetName} decay`

    default:
      return `${effect.type}: ${effect.value}`
  }
}

// Get target name for effect
const getTargetName = (targetId: string, effectType: string): string => {
  if (effectType === 'production_multiplier') {
    return getGeneratorName(targetId)
  }

  // For resource-based effects, get resource display name
  const resource = gameStore.getResourceConfig(targetId)
  return resource ? resource.displayName : targetId
}

// Format purchase effects for animation
const formatPurchaseEffects = (): string => {
  if (!upgrade.value.effects.length) return 'Effects Applied!'

  const mainEffect = upgrade.value.effects[0]
  return formatEffectDescription(mainEffect)
}
</script>

<style scoped>
.upgrade-container {
  position: relative;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
}

.upgrade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.upgrade-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
}

.upgrade-costs {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.upgrade-cost {
  font-size: 1.1rem;
  color: #00ff88;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.upgrade-description {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.upgrade-effects {
  margin-bottom: 1rem;
}

.upgrade-effect {
  margin-bottom: 0.25rem;
}

.effect-description {
  font-size: 0.9rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.effect-description.positive {
  color: #00ff88;
}

.effect-description.negative {
  color: #ff4444;
}

.upgrade-requirements {
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.requirement-text {
  font-size: 0.9rem;
  color: #ffaa00;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.requirement-item {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.25rem;
}

.requirement-progress {
  color: #00ff88;
  font-weight: bold;
}

.upgrade-button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #0088ff, #00ff88);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.upgrade-button:hover:not(.disabled):not(.purchased) {
  background: linear-gradient(135deg, #0099ff, #00ff99);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 136, 255, 0.3);
}

.upgrade-button:active:not(.disabled):not(.purchased) {
  transform: translateY(0);
}

.upgrade-button.disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
  transform: none;
}

.upgrade-button.purchasing {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  cursor: not-allowed;
}

.upgrade-button.purchased {
  background: rgba(0, 255, 136, 0.2);
  color: #00ff88;
  cursor: not-allowed;
}

.purchase-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
  animation: purchasePulse 2s ease-out;
}

.effect-text {
  font-size: 1.1rem;
  font-weight: bold;
  color: #00ff88;
  margin-bottom: 0.5rem;
  animation: textGlow 2s ease-out;
}

.effect-bonus {
  font-size: 1.3rem;
  font-weight: bold;
  color: #ffffff;
  animation: bonusFloat 2s ease-out;
}

@keyframes purchasePulse {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes textGlow {
  0%,
  100% {
    text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
  }
  50% {
    text-shadow: 0 0 20px rgba(0, 255, 136, 1);
  }
}

@keyframes bonusFloat {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  50% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .upgrade-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .upgrade-cost {
    font-size: 1rem;
  }
}
</style>
