<template>
  <div class="resource-display">
    <div
      v-for="resource in resources"
      :key="resource.id"
      class="resource-item"
      :style="{ borderLeftColor: getBorderColor(resource.id) }"
    >
      <div class="resource-info">
        <div class="resource-label">{{ resource.displayName }}</div>
        <div class="resource-rates">
          <div class="current-amount">
            <CurrencyDisplay :resource-id="resource.id" :amount="gameStore.getResourceAmount(resource.id)" />
          </div>
          <div class="production-rate">
            <CurrencyDisplay
              :resource-id="resource.id"
              :amount="getProductionRate(resource.id)"
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
import { resources } from '../config/resources'
import CurrencyDisplay from './CurrencyDisplay.vue'

const gameStore = useGameStore()

// Get production rate for a specific resource
// For now, only HCU has production, others return 0
function getProductionRate(resourceId: string): number {
  if (resourceId === 'hcu') {
    return gameStore.productionRate
  }
  // TODO: Add production rates for other resources when implemented
  return 0
}

// Get border color based on resource health status
function getBorderColor(resourceId: string): string {
  const config = gameStore.getResourceConfig(resourceId)
  const amount = gameStore.getResourceAmount(resourceId)
  
  if (!config) return '#ffffff'

  // For resources with maxValue, use percentage-based health indicators
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

  // For resources without maxValue, use healthy color as default
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
