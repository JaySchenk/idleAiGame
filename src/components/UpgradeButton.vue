<template>
  <div class="upgrade-container">
    <div class="upgrade-header">
      <h3 class="upgrade-title">{{ upgrade.name }}</h3>
      <div class="upgrade-cost">{{ formatCost(upgrade.cost) }} HCU</div>
    </div>
    
    <div class="upgrade-description">
      {{ upgrade.description }}
    </div>
    
    <div class="upgrade-requirements" v-if="!requirementsMet">
      <div class="requirement-text">Requires:</div>
      <div 
        v-for="req in upgrade.requirements" 
        :key="req.generatorId"
        class="requirement-item"
      >
        {{ req.minOwned }} {{ getGeneratorName(req.generatorId) }}
        <span class="requirement-progress">
          ({{ getGeneratorOwned(req.generatorId) }}/{{ req.minOwned }})
        </span>
      </div>
    </div>
    
    <button 
      class="upgrade-button"
      :class="{ 
        'disabled': !canPurchase, 
        'purchasing': isPurchasing,
        'purchased': upgrade.isPurchased
      }"
      :disabled="!canPurchase || isPurchasing || upgrade.isPurchased"
      @click="purchaseUpgrade"
    >
      <span v-if="upgrade.isPurchased">✓ Purchased</span>
      <span v-else-if="isPurchasing">Purchasing...</span>
      <span v-else-if="!requirementsMet">Requirements Not Met</span>
      <span v-else-if="!canAfford">Not Enough HCU</span>
      <span v-else>Purchase Upgrade</span>
    </button>
    
    <!-- Purchase effect animation -->
    <div v-if="showPurchaseEffect" class="purchase-effect">
      <div class="effect-text">Upgrade Purchased!</div>
      <div class="effect-bonus">+25% Production</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { GameManager } from '../game/Game'

interface Props {
  upgradeId: string
}

const props = defineProps<Props>()
const gameManager = GameManager.getInstance()
const upgradeManager = gameManager.getUpgradeManager()
const generatorManager = gameManager.getGeneratorManager()

const isPurchasing = ref(false)
const showPurchaseEffect = ref(false)
const gameState = ref(gameManager.getGameState())

let updateInterval: number | null = null

// Get upgrade data
const upgrade = computed(() => {
  const upgradeData = upgradeManager.getUpgrade(props.upgradeId)
  return upgradeData || {
    id: '',
    name: 'Unknown',
    description: '',
    cost: 0,
    targetGenerator: '',
    effectType: 'production_multiplier' as const,
    effectValue: 1,
    requirements: [],
    isPurchased: false
  }
})

// Check requirements
const requirementsMet = computed(() => {
  return upgradeManager.areRequirementsMet(props.upgradeId)
})

// Check if can afford
const canAfford = computed(() => {
  return gameState.value.contentUnits >= upgrade.value.cost
})

// Check if can purchase
const canPurchase = computed(() => {
  return upgradeManager.canPurchaseUpgrade(props.upgradeId)
})

// Format cost display
const formatCost = (cost: number): string => {
  if (cost >= 1000000) {
    return (cost / 1000000).toFixed(1) + 'M'
  } else if (cost >= 1000) {
    return (cost / 1000).toFixed(1) + 'K'
  }
  return cost.toString()
}

// Get generator name by ID
const getGeneratorName = (generatorId: string): string => {
  const generator = generatorManager.getGenerator(generatorId)
  return generator ? generator.name : 'Unknown Generator'
}

// Get generator owned count
const getGeneratorOwned = (generatorId: string): number => {
  const generator = generatorManager.getGenerator(generatorId)
  return generator ? generator.owned : 0
}

// Purchase upgrade
const purchaseUpgrade = async () => {
  if (!canPurchase.value || isPurchasing.value) return
  
  isPurchasing.value = true
  
  // Add slight delay for visual feedback
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const success = gameManager.purchaseUpgrade(props.upgradeId)
  
  if (success) {
    // Show purchase effect
    showPurchaseEffect.value = true
    
    // Hide effect after animation
    setTimeout(() => {
      showPurchaseEffect.value = false
    }, 2000)
  }
  
  isPurchasing.value = false
}

// Update game state
const updateGameState = () => {
  gameState.value = gameManager.getGameState()
}

onMounted(() => {
  updateInterval = setInterval(updateGameState, 100)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.upgrade-container {
  position: relative;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
}

.upgrade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.upgrade-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
}

.upgrade-cost {
  font-size: 1.1rem;
  color: #00ff88;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.upgrade-description {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1rem;
  line-height: 1.4;
}

.upgrade-requirements {
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.requirement-text {
  font-size: 0.9rem;
  color: #ffaa00;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.requirement-item {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.25rem;
}

.requirement-progress {
  color: #00ff88;
  font-weight: bold;
}

.upgrade-button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #0088ff, #00ff88);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.upgrade-button:hover:not(.disabled):not(.purchased) {
  background: linear-gradient(135deg, #0099ff, #00ff99);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 136, 255, 0.3);
}

.upgrade-button:active:not(.disabled):not(.purchased) {
  transform: translateY(0);
}

.upgrade-button.disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
  transform: none;
}

.upgrade-button.purchasing {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  cursor: not-allowed;
}

.upgrade-button.purchased {
  background: rgba(0, 255, 136, 0.2);
  color: #00ff88;
  cursor: not-allowed;
}

.purchase-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
  animation: purchasePulse 2s ease-out;
}

.effect-text {
  font-size: 1.1rem;
  font-weight: bold;
  color: #00ff88;
  margin-bottom: 0.5rem;
  animation: textGlow 2s ease-out;
}

.effect-bonus {
  font-size: 1.3rem;
  font-weight: bold;
  color: #ffffff;
  animation: bonusFloat 2s ease-out;
}

@keyframes purchasePulse {
  0% { 
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% { 
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% { 
    opacity: 0;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes textGlow {
  0%, 100% { text-shadow: 0 0 10px rgba(0, 255, 136, 0.5); }
  50% { text-shadow: 0 0 20px rgba(0, 255, 136, 1); }
}

@keyframes bonusFloat {
  0% { 
    opacity: 0;
    transform: translateY(20px);
  }
  50% { 
    opacity: 1;
    transform: translateY(0);
  }
  100% { 
    opacity: 0;
    transform: translateY(-20px);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .upgrade-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .upgrade-cost {
    font-size: 1rem;
  }
}
</style>