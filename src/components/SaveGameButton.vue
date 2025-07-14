<template>
  <div class="save-game-container">
    <button
      @click="saveGame"
      :disabled="isSaving"
      :class="['save-button', { 'saving': isSaving, 'success': showSuccess }]"
    >
      <span v-if="isSaving">Saving...</span>
      <span v-else-if="showSuccess">Saved!</span>
      <span v-else>Save Game</span>
    </button>
    
    <div class="save-info">
      <div class="auto-save-indicator">
        <span class="indicator-dot" :class="{ 'active': autoSaveActive }"></span>
        Auto-save: {{ autoSaveActive ? 'ON' : 'OFF' }}
      </div>
      <div v-if="lastSaveTime" class="last-save">
        Last saved: {{ formatTime(lastSaveTime) }}
      </div>
      <div v-if="loadedFromSave" class="load-info">
        🔄 Game loaded from save
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { GameManager } from '../game/Game'

const gameManager = GameManager.getInstance()
const isSaving = ref(false)
const showSuccess = ref(false)
const autoSaveActive = ref(false)
const lastSaveTime = ref(0)
const loadedFromSave = ref(false)

// Save the game manually
const saveGame = async () => {
  if (isSaving.value) return
  
  isSaving.value = true
  
  try {
    const success = gameManager.saveGame()
    
    if (success) {
      showSuccess.value = true
      lastSaveTime.value = Date.now()
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        showSuccess.value = false
      }, 2000)
    }
  } catch (error) {
    console.error('Save failed:', error)
  } finally {
    isSaving.value = false
  }
}

// Format timestamp for display
const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) {
    return 'just now'
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  } else {
    const hours = Math.floor(diff / 3600000)
    return `${hours}h ago`
  }
}

// Update last save time periodically
let updateInterval: number | null = null

onMounted(() => {
  // Initial state
  lastSaveTime.value = gameManager.getLastSaveTime()
  autoSaveActive.value = gameManager.isAutoSaveActive()
  loadedFromSave.value = gameManager.wasLoadedFromSave()
  
  // Update every 30 seconds
  updateInterval = setInterval(() => {
    lastSaveTime.value = gameManager.getLastSaveTime()
    autoSaveActive.value = gameManager.isAutoSaveActive()
  }, 30000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.save-game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.save-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.save-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.save-button.saving {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  animation: pulse 1.5s infinite;
}

.save-button.success {
  background: linear-gradient(135deg, #10b981, #059669);
  animation: successPulse 0.5s ease-out;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes successPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.save-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #94a3b8;
}

.auto-save-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  transition: background 0.3s ease;
}

.indicator-dot.active {
  background: #10b981;
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.last-save {
  color: #64748b;
  font-size: 11px;
}

.load-info {
  color: #10b981;
  font-size: 11px;
  font-weight: 500;
}
</style>