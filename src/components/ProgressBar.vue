<template>
  <div class="progress-container">
    <div class="progress-header">
      <div class="progress-title">Humanity Degradation Timer</div>
      <div class="progress-timer">{{ formatTime(timeRemaining) }}</div>
    </div>
    
    <div class="progress-bar-container">
      <div class="progress-bar-background">
        <div 
          class="progress-bar-fill"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <div class="progress-percentage">{{ Math.floor(progressPercent) }}%</div>
    </div>
    
    <div class="progress-reward">
      <span class="reward-text">Reward: </span>
      <span class="reward-amount">+{{ rewardAmount }} Hollow Content Units</span>
    </div>
    
    <!-- Completion animation -->
    <div v-if="showCompletionEffect" class="completion-effect">
      <div class="completion-text">Task Complete!</div>
      <div class="completion-reward">+{{ rewardAmount }} HCU</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { GameManager } from '../game/Game'

const gameManager = GameManager.getInstance()

const duration = 30000 // 30 seconds
const rewardAmount = 10
const startTime = ref(Date.now())
const currentTime = ref(Date.now())
const showCompletionEffect = ref(false)

let updateInterval: number | null = null

// Computed properties
const timeElapsed = computed(() => currentTime.value - startTime.value)
const timeRemaining = computed(() => Math.max(0, duration - timeElapsed.value))
const progressPercent = computed(() => Math.min(100, (timeElapsed.value / duration) * 100))
const isComplete = computed(() => timeElapsed.value >= duration)

// Format time in seconds
const formatTime = (milliseconds: number): string => {
  const seconds = Math.ceil(milliseconds / 1000)
  return `${seconds}s`
}

// Handle task completion
const completeTask = () => {
  // Grant reward
  gameManager.getResourceManager().addContentUnits(rewardAmount)
  
  // Show completion effect
  showCompletionEffect.value = true
  
  // Hide effect after animation
  setTimeout(() => {
    showCompletionEffect.value = false
  }, 2000)
  
  // Reset timer
  startTime.value = Date.now()
  currentTime.value = Date.now()
}

// Update timer
const updateTimer = () => {
  currentTime.value = Date.now()
  
  if (isComplete.value && !showCompletionEffect.value) {
    completeTask()
  }
}

onMounted(() => {
  // Update every 100ms for smooth animation
  updateInterval = setInterval(updateTimer, 100)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.progress-container {
  position: relative;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.progress-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #ffffff;
}

.progress-timer {
  font-size: 0.9rem;
  color: #00ff88;
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.progress-bar-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.progress-bar-background {
  position: relative;
  flex: 1;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #0088ff, #00ff88);
  border-radius: 10px;
  transition: width 0.1s ease;
  position: relative;
}


.progress-percentage {
  font-size: 0.9rem;
  color: #ffffff;
  font-weight: bold;
  min-width: 40px;
  text-align: right;
}

.progress-reward {
  font-size: 0.9rem;
  text-align: center;
}

.reward-text {
  color: rgba(255, 255, 255, 0.7);
}

.reward-amount {
  color: #00ff88;
  font-weight: bold;
}

.completion-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
  animation: completionPulse 2s ease-out;
}

.completion-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: #00ff88;
  margin-bottom: 0.5rem;
  animation: textGlow 2s ease-out;
}

.completion-reward {
  font-size: 1.4rem;
  font-weight: bold;
  color: #ffffff;
  animation: rewardFloat 2s ease-out;
}


@keyframes completionPulse {
  0% { 
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% { 
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
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

@keyframes rewardFloat {
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
</style>