<script setup lang="ts">
import { onMounted } from 'vue'
// import ResourceDisplay from '../components/ResourceDisplay.vue'
import GeneratorPurchaseButton from '../components/GeneratorPurchaseButton.vue'
import ManualClickerButton from '../components/ManualClickerButton.vue'
import ProgressBar from '../components/ProgressBar.vue'
import UpgradeButton from '../components/UpgradeButton.vue'
import PrestigeButton from '../components/PrestigeButton.vue'
import NarrativeDisplay from '../components/NarrativeDisplay.vue'
import { useGameStore } from '../stores/gameStore'

const gameStore = useGameStore()

onMounted(() => {
  // Start the game loop
  gameStore.startGameLoop()
})
</script>

<template>
  <div class="game-container">
    <!-- Game UI Layer -->
    <div class="ui-layer">
      <div class="ui-main">
        <div class="ui-left">
          <div class="section">
            <h2 class="section-title">Manual Generation</h2>
            <ManualClickerButton />
          </div>

          <div class="section">
            <h2 class="section-title">Automation</h2>
            <GeneratorPurchaseButton
              v-for="generator in gameStore.generators"
              :key="generator.id"
              :generator="generator"
            />
          </div>

          <div class="section">
            <h2 class="section-title">Upgrades</h2>
            <UpgradeButton
              v-for="upgrade in gameStore.upgrades"
              :key="upgrade.id"
              :upgrade="upgrade"
            />
          </div>
        </div>

        <div class="ui-right">
          <div class="section">
            <h2 class="section-title">Task Progress</h2>
            <ProgressBar />
          </div>

          <div class="section">
            <h2 class="section-title">Prestige</h2>
            <PrestigeButton />
          </div>

          <div class="section">
            <h2 class="section-title">System Chronicle</h2>
            <NarrativeDisplay />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-container {
  width: 100%;
  padding: 2rem;
  box-sizing: border-box;
}

.ui-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

.ui-left,
.ui-right {
  display: grid;
  gap: 2rem;
}

.section {
  display: grid;
  gap: 1rem;
}

.section-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

/* Responsive design */
@media (max-width: 1024px) {
  .ui-main {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .game-container {
    padding: 1rem;
  }

  .section-title {
    font-size: 1.1rem;
  }
}
</style>
