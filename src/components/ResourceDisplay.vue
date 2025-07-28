<template>
  <div class="resource-display">
    <div
      v-for="currency in currencies"
      :key="currency.id"
      class="resource-item"
      :style="{ borderLeftColor: getBorderColor(currency.id) }"
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

// Get border color based on currency health status
function getBorderColor(currencyId: string): string {
  const config = gameStore.getCurrencyConfig(currencyId)
  const amount = gameStore.getCurrencyAmount(currencyId)
  
  if (!config) return '#ffffff'

  // For currencies with maxValue, use percentage-based health indicators
  if (config.maxValue !== undefined) {
    const percentage = (amount / config.maxValue) * 100
    
    if (config.healthyWhenHigh) {
      // For resources where high values are healthy (most resources)
      if (percentage <= 25) return config.visualIndicators.critical
      if (percentage <= 50) return config.visualIndicators.warning
      return config.visualIndicators.healthy
    } else {
      // For resources where low values are healthy (e.g., AI Autonomy)
      if (percentage >= 75) return config.visualIndicators.critical
      if (percentage >= 50) return config.visualIndicators.warning
      return config.visualIndicators.healthy
    }
  }

  // For currencies without maxValue, use healthy color as default
  return config.visualIndicators.healthy
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
