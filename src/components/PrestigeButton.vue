<template>
  <div class="prestige-container">
    <div class="prestige-header">
      <h3 class="prestige-title">Societal Collapse Reset</h3>
      <div class="prestige-level">Level {{ gameStore.prestigeLevel }}</div>
    </div>

    <div class="prestige-description">
      Trigger a complete societal collapse to rebuild more efficiently. All resources and progress
      will be reset, but you'll gain a permanent global multiplier as humanity becomes more
      dependent on artificial content.
    </div>

    <div class="prestige-stats">
      <div class="stat-item">
        <div class="stat-label">Current Multiplier:</div>
        <div class="stat-value">{{ gameStore.globalMultiplier.toFixed(2) }}x</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Next Multiplier:</div>
        <div class="stat-value">{{ gameStore.nextPrestigeMultiplier.toFixed(2) }}x</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Threshold:</div>
        <div class="stat-value">
          <CurrencyDisplay currency-id="hcu" :amount="gameStore.prestigeThreshold" />
        </div>
      </div>
    </div>

    <div class="progress-section" v-if="!gameStore.canPrestige">
      <div class="progress-label">Progress to Reboot</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <div class="progress-text">
        <CurrencyDisplay
          currency-id="hcu"
          :amount="gameStore.getCurrencyAmount('hcu')"
          :show-unit="false"
        />
        /
        <CurrencyDisplay
          currency-id="hcu"
          :amount="gameStore.prestigeThreshold"
          :show-unit="false"
        />
        HCU
      </div>
    </div>

    <button
      class="prestige-button"
      :class="{
        disabled: !gameStore.canPrestige,
        rebooting: isRebooting,
      }"
      :disabled="!gameStore.canPrestige || isRebooting"
      @click="performReboot"
    >
      <span v-if="isRebooting">Rebooting System...</span>
      <span v-else-if="!gameStore.canPrestige">Reboot Unavailable</span>
      <span v-else>
        🔄 Reboot System
        <small class="multiplier-gain"
          >+{{
            ((gameStore.nextPrestigeMultiplier - gameStore.globalMultiplier) * 100).toFixed(0)
          }}% Production</small
        >
      </span>
    </button>

    <!-- Reboot effect animation -->
    <div v-if="showRebootEffect" class="reboot-effect">
      <div class="effect-title">System Rebooted!</div>
      <div class="effect-multiplier">
        {{ gameStore.globalMultiplier.toFixed(2) }}x Production Multiplier
      </div>
      <div class="effect-level">Prestige Level {{ gameStore.prestigeLevel }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
// Currency display now uses IDs from the store
import CurrencyDisplay from './CurrencyDisplay.vue'

const gameStore = useGameStore()

const isRebooting = ref(false)
const showRebootEffect = ref(false)

// Calculate progress to prestige (based on current HCU)
const progressPercent = computed(() => {
  const currentHCU = gameStore.getCurrencyAmount('hcu')
  const progress = (currentHCU / gameStore.prestigeThreshold) * 100
  return Math.min(100, progress)
})

// Perform prestige reboot
const performReboot = async () => {
  if (!gameStore.canPrestige || isRebooting.value) return

  isRebooting.value = true

  // Add delay for dramatic effect
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const success = gameStore.performPrestige()

  if (success) {
    // Show reboot effect
    showRebootEffect.value = true

    // Hide effect after animation
    setTimeout(() => {
      showRebootEffect.value = false
    }, 3000)
  }

  isRebooting.value = false
}
</script>

<style scoped>
.prestige-container {
  position: relative;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(255, 100, 0, 0.1));
  border-radius: 12px;
  border: 2px solid rgba(255, 100, 0, 0.3);
  margin-bottom: 1rem;
}

.prestige-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.prestige-title {
  font-size: 1.4rem;
  font-weight: bold;
  color: #ff6600;
  margin: 0;
  text-shadow: 0 0 10px rgba(255, 102, 0, 0.5);
}

.prestige-level {
  font-size: 1.1rem;
  color: #ffaa00;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.prestige-description {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
  line-height: 1.4;
}

.prestige-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.stat-value {
  font-size: 1rem;
  color: #ff6600;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.progress-section {
  margin-bottom: 1.5rem;
}

.progress-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6600, #ffaa00);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  font-family: 'Courier New', monospace;
}

.prestige-button {
  width: 100%;
  padding: 1.5rem;
  background: linear-gradient(135deg, #ff6600, #ff9900);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.prestige-button:hover:not(.disabled) {
  background: linear-gradient(135deg, #ff7700, #ffaa00);
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(255, 102, 0, 0.4);
}

.prestige-button:active:not(.disabled) {
  transform: translateY(0);
}

.prestige-button.disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
  transform: none;
}

.prestige-button.rebooting {
  background: rgba(255, 102, 0, 0.3);
  color: rgba(255, 255, 255, 0.7);
  cursor: not-allowed;
  animation: rebootPulse 1s ease-in-out infinite;
}

.multiplier-gain {
  font-size: 0.85rem;
  opacity: 0.8;
}

.reboot-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
  animation: rebootEffectPulse 3s ease-out;
}

.effect-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: #ff6600;
  margin-bottom: 0.5rem;
  animation: titleGlow 3s ease-out;
}

.effect-multiplier {
  font-size: 1.1rem;
  color: #ffaa00;
  font-weight: bold;
  margin-bottom: 0.5rem;
  animation: multiplierFloat 3s ease-out;
}

.effect-level {
  font-size: 1rem;
  color: #ffffff;
  animation: levelFade 3s ease-out;
}

@keyframes rebootPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes rebootEffectPulse {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
  80% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
}

@keyframes titleGlow {
  0%,
  100% {
    text-shadow: 0 0 10px rgba(255, 102, 0, 0.5);
  }
  50% {
    text-shadow: 0 0 25px rgba(255, 102, 0, 1);
  }
}

@keyframes multiplierFloat {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  30% {
    opacity: 1;
    transform: translateY(0);
  }
  70% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}

@keyframes levelFade {
  0% {
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .prestige-stats {
    grid-template-columns: 1fr;
  }

  .prestige-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .prestige-button {
    padding: 1.25rem;
    font-size: 1rem;
  }
}
</style>
