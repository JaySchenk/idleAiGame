<script setup lang="ts">
import { onMounted } from 'vue'
import ResourceDisplay from './components/ResourceDisplay.vue'
import GeneratorPurchaseButton from './components/GeneratorPurchaseButton.vue'
import ManualClickerButton from './components/ManualClickerButton.vue'
import ProgressBar from './components/ProgressBar.vue'
import UpgradeButton from './components/UpgradeButton.vue'
import PrestigeButton from './components/PrestigeButton.vue'
import SaveGameButton from './components/SaveGameButton.vue'
import NarrativeDisplay from './components/NarrativeDisplay.vue'

onMounted(() => {
  // Ensure Phaser game is initialized when Vue mounts
  // The Phaser game is already initialized in main.ts
})
</script>

<template>
  <div class="game-container">
    <!-- Game UI Layer -->
    <div class="ui-layer">
      <div class="ui-header">
        <h1 class="game-title">Hollow Content Empire</h1>
        <ResourceDisplay />
      </div>
      
      <div class="ui-main">
        <div class="ui-left">
          <div class="section">
            <h2 class="section-title">Manual Generation</h2>
            <ManualClickerButton />
          </div>
          
          <div class="section">
            <h2 class="section-title">Automation</h2>
            <GeneratorPurchaseButton />
          </div>
          
          <div class="section">
            <h2 class="section-title">Upgrades</h2>
            <UpgradeButton upgrade-id="automatedContentScript" />
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
            <h2 class="section-title">Save Game</h2>
            <SaveGameButton />
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
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.ui-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
  padding: 2rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.ui-layer * {
  pointer-events: auto;
}

.ui-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.game-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
  margin: 0;
  flex-shrink: 0;
}

.ui-main {
  display: flex;
  flex: 1;
  gap: 2rem;
  align-items: flex-start;
}

.ui-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.ui-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  display: flex;
  flex-direction: column;
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
    flex-direction: column;
  }
  
  .ui-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .game-title {
    font-size: 2rem;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .ui-layer {
    padding: 1rem;
  }
  
  .game-title {
    font-size: 1.5rem;
  }
  
  .section-title {
    font-size: 1.1rem;
  }
}
</style>
