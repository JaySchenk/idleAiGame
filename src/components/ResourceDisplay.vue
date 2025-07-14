<template>
  <div class="resource-display">
    <div class="resource-item primary">
      <div class="resource-label">Hollow Content Units</div>
      <div class="resource-value">{{ formattedContentUnits }}</div>
    </div>
    <div class="resource-item secondary">
      <div class="resource-label">Hollow Content per Second</div>
      <div class="resource-value">{{ formattedCPS }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { GameManager } from '../game/Game'

const gameManager = GameManager.getInstance()
const formattedContentUnits = ref('0')
const formattedCPS = ref('0')

let updateInterval: number | null = null

// Update display values from game state
const updateDisplay = () => {
  const gameState = gameManager.getGameState()
  formattedContentUnits.value = gameState.formattedContentUnits
  formattedCPS.value = gameState.productionRate.toFixed(1)
}

onMounted(() => {
  updateDisplay()
  // Update display every 100ms for smooth real-time updates
  updateInterval = setInterval(updateDisplay, 100)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
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