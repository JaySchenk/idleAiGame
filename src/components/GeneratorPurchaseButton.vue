<template>
  <div class="generator-purchase" :class="{ locked: !isUnlocked }">
    <div class="generator-info">
      <div class="generator-name">{{ generator?.name }}</div>
      <div class="generator-category">{{ generator?.category }}</div>
      <div class="generator-stats">
        <span class="owned-count">Owned: {{ ownedCount }}</span>
        <div class="production-info">
          <div v-if="generator?.inputs?.length" class="inputs">
            Consumes:
            <span v-for="(input, index) in generator.inputs" :key="input.resourceId">
              <CurrencyDisplay
                :resource-id="input.resourceId"
                :amount="input.amount * actualMultiplier"
                :show-unit="true"
              /><span v-if="index < generator.inputs.length - 1">, </span>
            </span>
            /sec
          </div>
          <div v-if="generator?.outputs?.length" class="outputs">
            Produces:
            <span v-for="(output, index) in generator.outputs" :key="output.resourceId">
              <CurrencyDisplay
                :resource-id="output.resourceId"
                :amount="output.amount * actualMultiplier"
                :show-unit="true"
              /><span v-if="index < generator.outputs.length - 1">, </span>
            </span>
            /sec
          </div>
        </div>
      </div>
      <div v-if="!isUnlocked" class="unlock-requirements">
        <div class="locked-text">🔒 Locked</div>
        <div class="requirements">
          <div
            v-for="condition in generator?.unlockConditions || []"
            :key="condition.type + condition.resourceId + condition.generatorId"
            class="requirement"
          >
            {{ getConditionText(condition) }}
          </div>
        </div>
      </div>
    </div>
    <div class="purchase-section">
      <div v-if="isUnlocked" class="cost-display">
        <div v-if="costs.length === 1" class="single-cost">
          <CurrencyDisplay :resource-id="costs[0].resourceId" :amount="costs[0].amount" />
        </div>
        <div v-else class="multi-cost">
          <div v-for="costItem in costs" :key="costItem.resourceId" class="cost-item">
            <CurrencyDisplay :resource-id="costItem.resourceId" :amount="costItem.amount" />
          </div>
        </div>
      </div>
      <button
        v-if="isUnlocked"
        class="purchase-button"
        :class="{ disabled: !canAffordAll, purchasing: isPurchasing }"
        :disabled="!canAffordAll || isPurchasing"
        @click="handlePurchase"
      >
        Purchase
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore, type UnlockCondition } from '../stores/gameStore'
import { usePurchaseAnimation } from '../composables/usePurchaseAnimation'
import CurrencyDisplay from './CurrencyDisplay.vue'

const props = defineProps<{
  generatorId: string
}>()

const gameStore = useGameStore()
const { isPurchasing, executePurchaseSimple } = usePurchaseAnimation()

// Get generator from store
const generator = computed(() => gameStore.getGenerator(props.generatorId))

// Component-specific computed values
const ownedCount = computed(() => {
  return generator.value?.owned ?? 0
})

const costs = computed(() => {
  return gameStore.getGeneratorCost(props.generatorId)
})

const isUnlocked = computed(() => {
  return gameStore.checkUnlockConditions(props.generatorId)
})

const canAffordAll = computed(() => {
  return gameStore.canPurchaseGenerator(props.generatorId)
})

const actualMultiplier = computed(() => {
  const generatorMultiplier = gameStore.getGeneratorMultiplier(props.generatorId)
  return ownedCount.value * generatorMultiplier * gameStore.globalMultiplier
})

// Helper function to format unlock condition text
const getConditionText = (condition: UnlockCondition): string => {
  switch (condition.type) {
    case 'resource':
      if (condition.resourceId && condition.minAmount) {
        const currentAmount = gameStore.getResourceAmount(condition.resourceId)
        return `Need ${condition.minAmount} ${condition.resourceId.toUpperCase()} (${Math.floor(currentAmount)}/${condition.minAmount})`
      }
      break
    case 'generator':
      if (condition.generatorId && condition.minOwned) {
        const targetGenerator = gameStore.getGenerator(condition.generatorId)
        const currentOwned = targetGenerator?.owned || 0
        return `Need ${condition.minOwned} ${targetGenerator?.name || condition.generatorId} (${currentOwned}/${condition.minOwned})`
      }
      break
    case 'upgrade':
      if (condition.upgradeId) {
        const upgrade = gameStore.getUpgrade(condition.upgradeId)
        return `Need upgrade: ${upgrade?.name || condition.upgradeId}`
      }
      break
    case 'narrative':
      return `Story milestone required`
  }
  return 'Unknown requirement'
}

// Handle purchase with visual feedback
const handlePurchase = async () => {
  if (!canAffordAll.value) return

  await executePurchaseSimple(() => gameStore.purchaseGenerator(props.generatorId))
}
</script>

<style scoped>
.generator-purchase {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  gap: 1rem;
}

.generator-purchase:hover:not(.locked) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.generator-purchase.locked {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.05);
  opacity: 0.6;
}

.generator-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.generator-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #ffffff;
}

.generator-category {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  font-weight: 500;
}

.generator-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.owned-count {
  color: #00ff88;
  font-weight: 500;
}

.production-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.inputs {
  color: #ff6b6b;
}

.outputs {
  color: #0088ff;
}

.unlock-requirements {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  border-left: 3px solid #ffaa00;
}

.locked-text {
  font-weight: bold;
  color: #ffaa00;
  margin-bottom: 0.25rem;
}

.requirements {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.requirement {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.purchase-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  min-width: 120px;
}

.cost-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.single-cost {
  font-size: 1.1rem;
}

.multi-cost {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  align-items: flex-end;
}

.cost-item {
  font-size: 0.9rem;
}

.purchase-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #00ff88, #00cc6a);
  color: #000000;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.purchase-button:hover:not(.disabled) {
  background: linear-gradient(135deg, #00cc6a, #00aa55);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
}

.purchase-button:active:not(.disabled) {
  transform: translateY(0);
}

.purchase-button.disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
  transform: none;
}

.purchase-button.purchasing {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(0.95);
}
</style>
