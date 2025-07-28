<template>
  <span class="currency-display" :style="{ color: displayColor }">{{
    formattedAmount
  }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { formatCurrency } from '../utils/formatters'

interface Props {
  currencyId: string
  amount: number
  showUnit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showUnit: true,
})

const gameStore = useGameStore()
const currencyConfig = computed(() => gameStore.getCurrencyConfig(props.currencyId))

const formattedAmount = computed(() => {
  return formatCurrency(currencyConfig.value, props.amount, props.showUnit)
})

const displayColor = computed(() => {
  const config = currencyConfig.value
  if (!config) return '#ffffff'

  // For currencies with maxValue, use percentage-based health indicators
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

  // For currencies without maxValue, use healthy color as default
  return config.visualIndicators.healthy
})
</script>

<style scoped>
.currency-display {
  font-family: 'Courier New', monospace;
  font-weight: bold;
}
</style>
