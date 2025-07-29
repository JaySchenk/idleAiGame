<template>
  <div class="clicker-container">
    <div class="clicker-info">
      <div class="clicker-title">Desperate Human Touch</div>
      <div class="clicker-description">
        <div
          v-for="reward in gameStore.clickRewards"
          :key="reward.resourceId"
          class="click-reward-description"
        >
          Click to generate +<CurrencyDisplay
            :resource-id="reward.resourceId"
            :amount="reward.amount"
            :show-unit="false"
          />
          {{ getResourceDisplayName(reward.resourceId) }}
        </div>
      </div>
    </div>
    <button
      class="clicker-button"
      :class="{ clicking: isClicking }"
      @click="handleClick"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <div class="click-icon">⚡</div>
      <div class="click-text">CLICK</div>
      <div class="click-reward">
        <div v-for="reward in gameStore.clickRewards" :key="reward.resourceId" class="reward-line">
          +<CurrencyDisplay :resource-id="reward.resourceId" :amount="reward.amount" />
        </div>
      </div>
    </button>

    <!-- Floating animation for click feedback -->
    <div
      v-for="animation in clickAnimations"
      :key="animation.id"
      class="click-animation"
      :style="{
        left: animation.x + 'px',
        top: animation.y + 'px',
        animationDelay: animation.delay + 'ms',
      }"
    >
      <div
        v-for="reward in gameStore.clickRewards"
        :key="reward.resourceId"
        class="animation-reward"
      >
        +{{ reward.amount.toFixed(2) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useGameStore } from '../stores/gameStore'
// Currency display now uses IDs from the store
import CurrencyDisplay from './CurrencyDisplay.vue'

const gameStore = useGameStore()
const isClicking = ref(false)
const clickAnimations = ref<Array<{ id: number; x: number; y: number; delay: number }>>([])

let animationId = 0

// Get resource display name
const getResourceDisplayName = (resourceId: string): string => {
  const resource = gameStore.getResourceConfig(resourceId)
  return resource ? resource.symbol : resourceId.toUpperCase()
}

// Handle click with visual feedback
const handleClick = async (event: MouseEvent) => {
  // Trigger manual resource generation
  gameStore.clickForResources()

  // Add click animation
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const animation = {
    id: animationId++,
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    delay: 0,
  }

  clickAnimations.value.push(animation)

  // Remove animation after completion
  setTimeout(() => {
    clickAnimations.value = clickAnimations.value.filter((a) => a.id !== animation.id)
  }, 1000)

  // Visual feedback
  isClicking.value = true
  await nextTick()
  setTimeout(() => {
    isClicking.value = false
  }, 150)
}

const handleMouseDown = () => {
  isClicking.value = true
}

const handleMouseUp = () => {
  isClicking.value = false
}
</script>

<style scoped>
.clicker-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.clicker-info {
  text-align: center;
}

.clicker-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.clicker-description {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.click-reward-description {
  margin-bottom: 0.25rem;
}

.clicker-button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #ff6b35, #ff4500);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.1s ease;
  min-height: 120px;
  overflow: hidden;
  user-select: none;
}

.clicker-button:hover {
  background: linear-gradient(135deg, #ff4500, #dd3a00);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
}

.clicker-button:active,
.clicker-button.clicking {
  transform: translateY(0) scale(0.95);
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.6);
}

.click-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  animation: pulse 2s infinite;
}

.click-text {
  font-size: 1.2rem;
  font-weight: bold;
  letter-spacing: 1px;
}

.click-reward {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.reward-line {
  line-height: 1.2;
}

.click-animation {
  position: absolute;
  color: #00ff88;
  font-weight: bold;
  font-size: 1.2rem;
  pointer-events: none;
  animation: floatUp 1s ease-out forwards;
  z-index: 10;
}

.animation-reward {
  line-height: 1.2;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-50px);
  }
}

/* Ripple effect for clicks */
.clicker-button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition:
    width 0.3s ease,
    height 0.3s ease;
}

.clicker-button:active::after {
  width: 200px;
  height: 200px;
}
</style>
