<template>
  <div class="resource-display">
    <div
      v-for="currency in currencies"
      :key="currency.id"
      class="resource-item"
      :style="{ borderLeftColor: currency.color }"
    >
      <div class="resource-info">
        <div class="resource-label">{{ currency.displayName }}</div>
        <div class="resource-rates">
          <div class="current-amount">
            <CurrencyDisplay :currency-id="currency.id" :amount="gameStore.getCurrencyAmount(currency.id)" />
          </div>
          <div class="production-rate">
            <CurrencyDisplay
              :currency-id="currency.id"
              :amount="getProductionRate(currency.id)"
              :show-unit="false"
            />/s
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/gameStore'
import { currencies } from '../config/currencies'
import CurrencyDisplay from './CurrencyDisplay.vue'

const gameStore = useGameStore()

// Get production rate for a specific currency
// For now, only HCU has production, others return 0
function getProductionRate(currencyId: string): number {
  if (currencyId === 'hcu') {
    return gameStore.productionRate
  }
  // TODO: Add production rates for other currencies when implemented
  return 0
}
</script>

<style scoped>
.resource-display {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 1rem;
  width: fit-content;
}

.resource-item {
  flex: 0 0 auto;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.resource-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.resource-item {
  border-left: 3px solid;
}

.resource-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.resource-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.resource-rates {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: nowrap;
}

.current-amount {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
}

.production-rate {
  font-size: 1rem;
  font-weight: bold;
  color: #0088ff;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
}
</style>
