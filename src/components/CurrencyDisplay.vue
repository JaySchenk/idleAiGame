<template>
  <span class="resource-display" :style="{ color: displayColor }">{{ formattedAmount }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { formatResource } from '../utils/formatters'

interface Props {
  resourceId: string
  amount: number
  showUnit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showUnit: true,
})

const gameStore = useGameStore()
const resourceConfig = computed(() => gameStore.getResourceConfig(props.resourceId))

const formattedAmount = computed(() => {
  return formatResource(resourceConfig.value, props.amount, props.showUnit)
})

const displayColor = computed(() => {
  const config = resourceConfig.value
  if (!config) return '#ffffff'

  // For resources with maxValue, use percentage-based health indicators
  if (config.maxValue !== undefined) {
    const percentage = (props.amount / config.maxValue) * 100

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
})
</script>

<style scoped>
.resource-display {
  font-family: 'Courier New', monospace;
  font-weight: bold;
}
</style>
