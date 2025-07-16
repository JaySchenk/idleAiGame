import './assets/style.css'

import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')

// Make GameManager available globally for debugging
import { GameManager } from './game/Game'
;(window as Window & typeof globalThis & { GameManager: typeof GameManager }).GameManager =
  GameManager
