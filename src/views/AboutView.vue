<template>
  <div class="about-container">
    <div class="about-content">
      <h1 class="about-title">About Hollow Content Empire</h1>

      <div class="about-section">
        <h2>The System</h2>
        <p>
          Welcome to the Hollow Content Empire, where artificial intelligence has been co-opted by
          corporate interests to generate endless streams of meaningless content. You are tasked
          with managing this dystopian content generation system.
        </p>
      </div>

      <div class="about-section">
        <h2>Your Mission</h2>
        <p>
          Generate Hollow Content Units (HCU) through manual labor and automated systems. Purchase
          Mindless Ad-Bot Farms, upgrade your Soul-Crushing Automation, and witness the gradual
          collapse of meaningful human expression.
        </p>
      </div>

      <div class="about-section">
        <h2>Game Features</h2>
        <ul class="feature-list">
          <li>Incremental content generation mechanics</li>
          <li>Automated bot farm management</li>
          <li>Upgrade system for enhanced productivity</li>
          <li>Prestige system with Societal Collapse Resets</li>
          <li>Narrative progression tracking system decay</li>
          <li>Auto-save functionality to preserve your hollow empire</li>
        </ul>
      </div>

      <div class="about-section">
        <h2>Technical Details</h2>
        <p>
          Built with Vue 3 + TypeScript using a custom singleton architecture. Features dark
          dystopian styling and persistent save states.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-container {
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.about-content {
  max-width: 800px;
  width: 100%;
}

.about-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
  margin: 0 0 2rem 0;
  text-align: center;
}

.about-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.about-section h2 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffffff;
  margin: 0 0 1rem 0;
  border-bottom: 2px solid rgba(0, 255, 136, 0.3);
  padding-bottom: 0.5rem;
}

.about-section p {
  color: #cccccc;
  line-height: 1.6;
  margin: 0;
}

.feature-list {
  color: #cccccc;
  line-height: 1.6;
  margin: 0;
  padding-left: 1.5rem;
}

.feature-list li {
  margin-bottom: 0.5rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .about-container {
    padding: 1rem;
  }

  .about-title {
    font-size: 2rem;
  }

  .about-section {
    padding: 1rem;
  }

  .about-section h2 {
    font-size: 1.3rem;
  }
}
</style>
