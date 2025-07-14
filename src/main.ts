import './assets/main.css'
import './assets/style.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Phaser from 'phaser'

import App from './App.vue'
import router from './router'
import { MainScene } from './game/MainScene'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: window.innerWidth,
  height: window.innerHeight,
  canvas: document.getElementById('gameCanvas') as HTMLCanvasElement,
  backgroundColor: '#1a1a1a',
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false
    }
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  }
}

// Initialize Phaser game
new Phaser.Game(config)

// Make GameManager available globally for debugging
import { GameManager } from './game/Game'
;(window as Window & typeof globalThis & { GameManager: typeof GameManager }).GameManager = GameManager
