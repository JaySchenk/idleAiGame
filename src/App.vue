<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import ResourceDisplay from './components/ResourceDisplay.vue'
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-top">
        <div class="title-nav-section">
          <h1 class="app-title">Hollow Content Empire</h1>
          <nav class="nav-menu">
            <RouterLink to="/" class="nav-link">Game</RouterLink>
            <RouterLink to="/about" class="nav-link">About</RouterLink>
          </nav>
        </div>
        <ResourceDisplay />
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  color: #ffffff;
}

.app-header {
  padding: 1rem 2rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.header-top {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  align-items: start;
}

.title-nav-section {
  display: grid;
  gap: 0.5rem;
}

.app-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
  margin: 0;
}

.nav-menu {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: #ffffff;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.nav-link:hover {
  background: rgba(0, 255, 136, 0.1);
  border-color: rgba(0, 255, 136, 0.3);
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.nav-link.router-link-active {
  background: rgba(0, 255, 136, 0.2);
  border-color: rgba(0, 255, 136, 0.5);
  text-shadow: 0 0 15px rgba(0, 255, 136, 0.7);
}

.app-main {
  overflow: auto;
}

/* Responsive design */
@media (max-width: 768px) {
  .header-top {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .title-nav-section {
    text-align: center;
  }

  .app-title {
    font-size: 1.5rem;
  }

  .nav-menu {
    justify-content: center;
  }
}
</style>
