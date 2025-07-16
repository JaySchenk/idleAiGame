<template>
  <span class="hcu-display">{{ formattedAmount }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  amount: number
  showUnit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showUnit: true,
})

const formattedAmount = computed(() => {
  const { amount, showUnit } = props
  const unit = showUnit ? ' HCU' : ''

  // Handle scientific notation for very large numbers
  if (amount >= 1e18) {
    return amount.toExponential(2) + unit
  }

  // Handle quadrillions
  if (amount >= 1e15) {
    return (amount / 1e15).toFixed(2) + 'Q' + unit
  }

  // Handle trillions
  if (amount >= 1e12) {
    return (amount / 1e12).toFixed(2) + 'T' + unit
  }

  // Handle billions
  if (amount >= 1e9) {
    return (amount / 1e9).toFixed(2) + 'B' + unit
  }

  // Handle millions
  if (amount >= 1e6) {
    return (amount / 1e6).toFixed(2) + 'M' + unit
  }

  // Handle thousands
  if (amount >= 1e3) {
    return (amount / 1e3).toFixed(2) + 'K' + unit
  }

  // Handle smaller numbers with 2 decimals
  return amount.toFixed(2) + unit
})
</script>

<style scoped>
.hcu-display {
  font-family: 'Courier New', monospace;
  font-weight: bold;
}
</style>
