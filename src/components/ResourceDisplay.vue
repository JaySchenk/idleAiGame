<template>
  <div class="resource-display">
    <div class="resource-item primary">
      <div class="resource-label">Hollow Content Units</div>
      <div class="resource-value">
        <HCUDisplay :amount="contentUnits" />
      </div>
    </div>
    <div class="resource-item secondary">
      <div class="resource-label">Hollow Content per Second</div>
      <div class="resource-value"><HCUDisplay :amount="productionRate" :show-unit="false" />/s</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GameManager } from '../game/Game'
import HCUDisplay from './HCUDisplay.vue'

const gameManager = GameManager.getInstance()

// Reactive computed properties directly from game state
const contentUnits = computed(() => gameManager.state.contentUnits)
const productionRate = computed(() => gameManager.state.productionRate)
</script>

<style scoped>
.resource-display {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.resource-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.resource-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.resource-item.primary {
  border-left: 3px solid #00ff88;
}

.resource-item.secondary {
  border-left: 3px solid #0088ff;
}

.resource-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.resource-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffffff;
  font-family: 'Courier New', monospace;
}

.resource-item.primary .resource-value {
  color: #00ff88;
}

.resource-item.secondary .resource-value {
  color: #0088ff;
}
</style>
