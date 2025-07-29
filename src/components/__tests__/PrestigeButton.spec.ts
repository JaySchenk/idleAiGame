import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useGameStore } from '../../stores/gameStore'
import PrestigeButton from '../PrestigeButton.vue'
import { createStandardTestPinia } from '../../test-utils/pinia'

describe('PrestigeButton', () => {
  let store: ReturnType<typeof useGameStore>
  let pinia: ReturnType<typeof createStandardTestPinia>

  beforeEach(() => {
    vi.useFakeTimers()
    pinia = createStandardTestPinia()
    store = useGameStore(pinia)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createWrapper() {
    return mount(PrestigeButton, {
      global: { plugins: [pinia] },
    })
  }

  describe('Rendering', () => {
    it('renders prestige button with correct elements', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.prestige-title').text()).toBe('Societal Collapse Reset')
      expect(wrapper.find('.prestige-level').text()).toBe('Level 0')
      expect(wrapper.find('.prestige-description').exists()).toBe(true)
      expect(wrapper.find('.prestige-stats').exists()).toBe(true)
    })

    it('displays current multiplier and next multiplier', () => {
      store.gameState.prestige.level = 1
      const wrapper = createWrapper()

      expect(wrapper.find('.prestige-level').text()).toBe('Level 1')
      expect(wrapper.text()).toContain('1.25x')
      expect(wrapper.text()).toContain('1.56x')
    })

    it('shows progress section when prestige unavailable', () => {
      store.gameState.resources.hcu.current = 500
      const wrapper = createWrapper()

      expect(wrapper.find('.progress-section').exists()).toBe(true)
      expect(wrapper.find('.progress-bar').exists()).toBe(true)
      expect(wrapper.find('.progress-text').exists()).toBe(true)
    })

    it('hides progress section when prestige available', () => {
      store.gameState.resources.hcu.current = 1000
      const wrapper = createWrapper()

      expect(wrapper.find('.progress-section').exists()).toBe(false)
    })
  })

  describe('Progress Calculation', () => {
    it('calculates progress percentage correctly', () => {
      store.gameState.resources.hcu.current = 500
      const wrapper = createWrapper()

      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toBe('width: 50%;')
    })

    it('caps progress at 100%', () => {
      store.gameState.resources.hcu.current = 1200
      const wrapper = createWrapper()

      const progressSection = wrapper.find('.progress-section')
      // Progress section is hidden when prestige is available (>=100%)
      expect(progressSection.exists()).toBe(false)
    })

    it('handles zero progress', () => {
      store.gameState.resources.hcu.current = 0
      const wrapper = createWrapper()

      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toBe('width: 0%;')
    })
  })

  describe('Button States', () => {
    it('disables button when prestige unavailable', () => {
      store.gameState.resources.hcu.current = 500
      const wrapper = createWrapper()

      const button = wrapper.find('.prestige-button')
      expect(button.classes()).toContain('disabled')
      expect(button.attributes('disabled')).toBeDefined()
      expect(button.text()).toContain('Reboot Unavailable')
    })

    it('enables button when prestige available', () => {
      store.gameState.resources.hcu.current = 1000
      const wrapper = createWrapper()

      const button = wrapper.find('.prestige-button')
      expect(button.classes()).not.toContain('disabled')
      expect(button.attributes('disabled')).toBeUndefined()
      expect(button.text()).toContain('🔄 Reboot System')
    })

    it('shows multiplier gain when prestige available', () => {
      store.gameState.resources.hcu.current = 1000
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('+25% Production')
    })
  })

  describe('Prestige Execution', () => {
    it('performs prestige when button clicked', async () => {
      store.gameState.resources.hcu.current = 1000
      const wrapper = createWrapper()

      const performPrestigeSpy = vi.spyOn(store, 'performPrestige').mockReturnValue(true)

      await wrapper.find('.prestige-button').trigger('click')

      // Fast-forward through the 1000ms delay
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()

      expect(performPrestigeSpy).toHaveBeenCalled()
    })

    it('shows rebooting state during prestige', async () => {
      store.gameState.resources.hcu.current = 1000
      const wrapper = createWrapper()

      vi.spyOn(store, 'performPrestige').mockReturnValue(true)

      const button = wrapper.find('.prestige-button')
      await button.trigger('click')

      expect(button.classes()).toContain('rebooting')
      expect(button.text()).toContain('Rebooting System...')
      expect(button.attributes('disabled')).toBeDefined()
    })

    it('shows reboot effect after successful prestige', async () => {
      store.gameState.resources.hcu.current = 1000
      const wrapper = createWrapper()

      vi.spyOn(store, 'performPrestige').mockReturnValue(true)

      const clickPromise = wrapper.find('.prestige-button').trigger('click')
      vi.advanceTimersByTime(1000) // Wait for async delay
      await clickPromise
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showRebootEffect).toBe(true)
      expect(wrapper.find('.reboot-effect').exists()).toBe(true)
      expect(wrapper.find('.effect-title').text()).toBe('System Rebooted!')
    })

    it('hides reboot effect after animation', async () => {
      store.gameState.resources.hcu.current = 1000
      const wrapper = createWrapper()

      vi.spyOn(store, 'performPrestige').mockReturnValue(true)

      await wrapper.find('.prestige-button').trigger('click')
      vi.advanceTimersByTime(1100) // Wait for async delay
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showRebootEffect).toBe(true)

      vi.advanceTimersByTime(3000) // Wait for effect timeout
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showRebootEffect).toBe(false)
      expect(wrapper.find('.reboot-effect').exists()).toBe(false)
    })

    it('prevents multiple simultaneous prestiges', async () => {
      store.gameState.resources.hcu.current = 1000
      const wrapper = createWrapper()

      const performPrestigeSpy = vi.spyOn(store, 'performPrestige').mockReturnValue(true)

      const button = wrapper.find('.prestige-button')
      await button.trigger('click')
      await button.trigger('click')

      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()

      expect(performPrestigeSpy).toHaveBeenCalledTimes(1)
    })

    it('does not perform prestige when unavailable', async () => {
      store.gameState.resources.hcu.current = 500
      const wrapper = createWrapper()

      const performPrestigeSpy = vi.spyOn(store, 'performPrestige')

      await wrapper.find('.prestige-button').trigger('click')
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()

      expect(performPrestigeSpy).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('handles failed prestige gracefully', async () => {
      store.gameState.resources.hcu.current = 1000
      const wrapper = createWrapper()

      vi.spyOn(store, 'performPrestige').mockReturnValue(false)

      await wrapper.find('.prestige-button').trigger('click')
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.reboot-effect').exists()).toBe(false)
    })
  })
})
