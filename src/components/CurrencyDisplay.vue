<template>
  <span class="currency-display" :style="{ color: currencyConfig?.color }">{{
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
</script>

<style scoped>
.currency-display {
  font-family: 'Courier New', monospace;
  font-weight: bold;
}
</style>
