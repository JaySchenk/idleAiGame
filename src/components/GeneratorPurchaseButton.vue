<template>
  <div class="generator-purchase">
    <div class="generator-info">
      <div class="generator-name">{{ generatorName }}</div>
      <div class="generator-stats">
        <span class="owned-count">Owned: {{ ownedCount }}</span>
        <span class="production-rate">+<HCUDisplay :amount="actualProductionRate" :show-unit="false" />/sec</span>
      </div>
    </div>
    <button
      class="purchase-button"
      :class="{ disabled: !canAfford, purchasing: isPurchasing }"
      :disabled="!canAfford || isPurchasing"
      @click="handlePurchase"
    >
      <HCUDisplay :amount="cost" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { GameManager } from '../game/Game'
import HCUDisplay from './HCUDisplay.vue'

const gameManager = GameManager.getInstance()
const generatorId = 'basicAdBotFarm'
const generatorName = 'Mindless Ad-Bot Farm'

const isPurchasing = ref(false)

// Reactive computed properties directly from game state
const ownedCount = computed(() => {
  const generator = gameManager.state.generators.find(g => g.id === generatorId)
  return generator ? generator.owned : 0
})

const cost = computed(() => {
  const generator = gameManager.state.generators.find(g => g.id === generatorId)
  if (!generator) return 0
  return generator.baseCost * Math.pow(generator.growthRate, generator.owned)
})

const canAfford = computed(() => {
  return gameManager.state.contentUnits >= cost.value
})

const actualProductionRate = computed(() => {
  const generator = gameManager.state.generators.find(g => g.id === generatorId)
  if (!generator) return 0
  return generator.baseProduction * generator.owned * gameManager.state.globalMultiplier
})

// Handle purchase with visual feedback
const handlePurchase = async () => {
  if (!canAfford.value || isPurchasing.value) return

  isPurchasing.value = true

  // Visual feedback delay
  setTimeout(() => {
    const success = gameManager.purchaseGenerator(generatorId)
    isPurchasing.value = false
  }, 100)
}
</script>

<style scoped>
.generator-purchase {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.generator-purchase:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.generator-info {
  flex: 1;
}

.generator-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.generator-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.owned-count {
  color: #00ff88;
}

.production-rate {
  color: #0088ff;
}

.purchase-button {
  display: flex;
  flex-direction: column;
  align-items: center;
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

.cost {
  font-size: 1.1rem;
  line-height: 1;
}

.currency {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 2px;
}
</style>
