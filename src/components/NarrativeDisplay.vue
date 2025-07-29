<template>
  <div class="narrative-container">
    <!-- Modal overlay for story events -->
    <div v-if="showModal" class="narrative-modal" @click="closeModal">
      <div class="narrative-modal-content" @click.stop>
        <div class="narrative-header">
          <h3 class="narrative-title">{{ currentEvent?.title }}</h3>
          <button class="narrative-close" @click="closeModal">×</button>
        </div>
        <div class="narrative-content">
          <p class="narrative-text">{{ currentEvent?.content }}</p>
          <div v-if="currentEvent?.resourceEffects" class="narrative-effects">
            <span class="effects-label">Resource Effects:</span>
            <div class="effects-list">
              <div
                v-for="effect in currentEvent.resourceEffects"
                :key="effect.resourceId"
                class="effect-item"
                :class="getEffectClass(effect.amount)"
              >
                <span class="effect-resource">{{ getResourceDisplayName(effect.resourceId) }}</span>
                <span class="effect-value"
                  >{{ effect.amount > 0 ? '+' : '' }}{{ effect.amount }}</span
                >
              </div>
            </div>
          </div>
        </div>
        <div class="narrative-actions">
          <button class="narrative-button" @click="closeModal">Continue</button>
        </div>
      </div>
    </div>

    <!-- Persistent narrative panel -->
    <div v-if="!showModal" class="narrative-panel">
      <div class="narrative-panel-header">
        <h4>System Chronicle</h4>
      </div>

      <div class="narrative-archive">
        <div v-if="hasViewedEvents" class="archive-header"></div>

        <div v-if="hasViewedEvents" class="archive-list">
          <div
            v-for="event in viewedEvents"
            :key="event.id"
            class="archive-item"
            @click="reviewEvent(event)"
          >
            <span class="archive-title">{{ event.title }}</span>
            <span class="archive-effects">
              {{ getEventEffectsSummary(event) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import type { NarrativeEvent } from '../config/narratives'

const gameStore = useGameStore()

// Component state
const currentEvent = ref<NarrativeEvent | null>(null)

// Computed modal state
const showModal = computed(() => currentEvent.value !== null)

// Archive state using reactive state
const viewedEvents = computed(() =>
  gameStore.narrative.currentStoryEvents.filter((event) => event.isViewed),
)
const hasViewedEvents = computed(() => viewedEvents.value.length > 0)

// Event handling
const showEvent = (event: NarrativeEvent) => {
  currentEvent.value = event
}

const closeModal = () => {
  currentEvent.value = null
}

const handleNarrativeEvent = showEvent
const reviewEvent = showEvent

// Styling helpers
const getEffectClass = (amount: number) => {
  if (amount > 0) return 'effect-positive'
  if (amount < -15) return 'effect-severe'
  if (amount < -5) return 'effect-moderate'
  return 'effect-minor'
}

const getResourceDisplayName = (resourceId: string) => {
  const resourceConfig = gameStore.resourceSystem.getResourceConfig(resourceId)
  return resourceConfig ? resourceConfig.displayName : resourceId.toUpperCase()
}

const getEventEffectsSummary = (event: NarrativeEvent) => {
  if (!event.resourceEffects || event.resourceEffects.length === 0) return 'No effects'
  return event.resourceEffects
    .map(
      (effect) =>
        `${getResourceDisplayName(effect.resourceId)} ${effect.amount > 0 ? '+' : ''}${effect.amount}`,
    )
    .join(', ')
}

// Check for pending events periodically
const checkForPendingEvents = () => {
  if (gameStore.hasPendingEvents()) {
    const event = gameStore.getNextPendingEvent()
    if (event) {
      handleNarrativeEvent(event)
    }
  }
}

// Lifecycle
onMounted(() => {
  // Subscribe to narrative events
  gameStore.onNarrativeEvent(handleNarrativeEvent)

  // Check for any pending events on mount
  checkForPendingEvents()

  // Set up periodic check for pending events (as backup)
  const pendingEventInterval = setInterval(checkForPendingEvents, 1000)

  // Clean up interval on unmount
  onUnmounted(() => {
    clearInterval(pendingEventInterval)
  })
})
</script>

<style scoped>
.narrative-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.narrative-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;
}

.narrative-modal-content {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border: 2px solid #00ff88;
  border-radius: 10px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 0 50px rgba(0, 255, 136, 0.3);
  animation: slideIn 0.4s ease-out;
}

.narrative-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 1rem;
}

.narrative-title {
  font-size: 1.5rem;
  color: #00ff88;
  margin: 0;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.narrative-close {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.narrative-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ff4444;
}

.narrative-content {
  margin-bottom: 2rem;
}

.narrative-text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #ffffff;
  margin: 0 0 1.5rem 0;
  font-family: 'Courier New', monospace;
}

.narrative-effects {
  margin-top: 1rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
}

.effects-label {
  color: #cccccc;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  display: block;
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.effect-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  font-size: 0.8rem;
}

.effect-resource {
  color: #cccccc;
}

.effect-value {
  font-weight: bold;
}

.effect-positive {
  border-left: 3px solid #00ff88;
}
.effect-positive .effect-value {
  color: #00ff88;
}
.effect-minor {
  border-left: 3px solid #ffaa00;
}
.effect-minor .effect-value {
  color: #ffaa00;
}
.effect-moderate {
  border-left: 3px solid #ff6600;
}
.effect-moderate .effect-value {
  color: #ff6600;
}
.effect-severe {
  border-left: 3px solid #ff0000;
}
.effect-severe .effect-value {
  color: #ff0000;
}

.narrative-actions {
  display: flex;
  justify-content: flex-end;
}

.narrative-button {
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  color: #000000;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.narrative-button:hover {
  background: linear-gradient(135deg, #00cc6a 0%, #00aa55 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 255, 136, 0.4);
}

.narrative-panel {
  background: rgba(26, 26, 26, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.narrative-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.narrative-panel-header h4 {
  margin: 0;
  color: #ffffff;
  font-size: 1.1rem;
}

.archive-header {
  margin-bottom: 0.5rem;
}

.archive-title {
  margin: 0;
  color: #00ff88;
  font-size: 1rem;
  font-weight: bold;
}

.archive-list {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.archive-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.archive-item:hover {
  background: rgba(0, 0, 0, 0.4);
}

.archive-title {
  color: #ffffff;
  font-size: 0.9rem;
}

.archive-effects {
  font-size: 0.8rem;
  color: #cccccc;
  font-style: italic;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .narrative-modal-content {
    padding: 1rem;
    max-width: 95%;
  }

  .narrative-title {
    font-size: 1.2rem;
  }

  .narrative-text {
    font-size: 1rem;
  }
}
</style>
