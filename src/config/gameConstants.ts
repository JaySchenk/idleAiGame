/**
 * Centralized game constants and configuration values
 */

export const GAME_CONSTANTS = {
  // Game Loop Settings
  TICK_RATE: 100, // 100ms tick rate for smooth animations

  // Task System
  TASK_DURATION: 30000, // 30 seconds
  TASK_REWARD: 10,

  // Prestige System
  PRESTIGE_BASE_MULTIPLIER: 1.25,
  PRESTIGE_THRESHOLD_BASE: 1000,
  PRESTIGE_THRESHOLD_GROWTH: 10, // Multiplier for each prestige level

  // Purchase Animation
  PURCHASE_ANIMATION_DELAY: 100, // ms
  PURCHASE_EFFECT_DURATION: 2000, // ms

  // Generator Growth
  DEFAULT_GENERATOR_GROWTH_RATE: 1.15,

  // UI Constants
  SCIENTIFIC_NOTATION_THRESHOLD: 1e18,

  // Animation Timings
  BUTTON_HOVER_DURATION: 200, // ms
  MODAL_ANIMATION_DURATION: 300, // ms
} as const

export type GameConstants = typeof GAME_CONSTANTS
