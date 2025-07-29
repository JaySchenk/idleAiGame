import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useGameStore } from '../../stores/gameStore'
import ManualClickerButton from '../ManualClickerButton.vue'
import { createStandardTestPinia } from '../../test-utils/pinia'

describe('ManualClickerButton', () => {
  let store: ReturnType<typeof useGameStore>
  let pinia: ReturnType<typeof createStandardTestPinia>

  beforeEach(() => {
    pinia = createStandardTestPinia()
    store = useGameStore(pinia)
  })

  function createWrapper() {
    return mount(ManualClickerButton, { 
      global: { plugins: [pinia] }
    })
  }

  describe('Rendering', () => {
    it('renders the clicker button with correct elements', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.clicker-title').text()).toBe('Desperate Human Touch')
      expect(wrapper.find('.click-text').text()).toBe('CLICK')
      expect(wrapper.find('.click-icon').text()).toBe('⚡')
      expect(wrapper.find('.clicker-button').exists()).toBe(true)
    })

    it('displays click rewards from store', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.clicker-description').exists()).toBe(true)
      expect(wrapper.find('.click-reward').exists()).toBe(true)
    })

    it('applies proper CSS classes', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.clicker-container').exists()).toBe(true)
      expect(wrapper.find('.clicker-button').exists()).toBe(true)
      expect(wrapper.find('.clicker-info').exists()).toBe(true)
    })
  })

  describe('Click Functionality', () => {
    it('calls clickForResources when clicked', async () => {
      const wrapper = createWrapper()

      const clickSpy = vi.spyOn(store, 'clickForResources')

      await wrapper.find('.clicker-button').trigger('click')

      expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('adds resources when clicked', async () => {
      const wrapper = createWrapper()

      const initialUnits = store.getResourceAmount('hcu')

      await wrapper.find('.clicker-button').trigger('click')

      expect(store.getResourceAmount('hcu')).toBe(initialUnits + 1)
      expect(store.gameState.resources.hcu.lifetime).toBe(1)
    })

    it('applies prestige multiplier to clicks', async () => {
      const wrapper = createWrapper()

      store.gameState.prestige.level = 1 // 1.25x multiplier

      await wrapper.find('.clicker-button').trigger('click')

      expect(store.getResourceAmount('hcu')).toBe(1.25)
      expect(store.gameState.resources.hcu.lifetime).toBe(1.25)
    })

    it('handles multiple clicks', async () => {
      const wrapper = createWrapper()

      const button = wrapper.find('.clicker-button')
      
      for (let i = 0; i < 5; i++) {
        await button.trigger('click')
      }

      expect(store.getResourceAmount('hcu')).toBe(5)
    })
  })

  describe('Visual Feedback', () => {
    it('shows clicking state during interaction', async () => {
      const wrapper = createWrapper()

      const button = wrapper.find('.clicker-button')
      expect(button.classes()).not.toContain('clicking')

      await button.trigger('click')
      expect(button.classes()).toContain('clicking')

      vi.advanceTimersByTime(200)
      await wrapper.vm.$nextTick()

      expect(button.classes()).not.toContain('clicking')
    })

    it('handles mouse events for visual feedback', async () => {
      const wrapper = createWrapper()

      const button = wrapper.find('.clicker-button')

      await button.trigger('mousedown')
      expect(button.classes()).toContain('clicking')

      await button.trigger('mouseup')
      expect(button.classes()).not.toContain('clicking')
    })

    it('handles mouse leave events', async () => {
      const wrapper = createWrapper()

      const button = wrapper.find('.clicker-button')

      await button.trigger('mousedown')
      expect(button.classes()).toContain('clicking')

      await button.trigger('mouseleave')
      expect(button.classes()).not.toContain('clicking')
    })
  })

  describe('Click Animations', () => {
    it('creates click animation on click', async () => {
      const wrapper = createWrapper()

      expect(wrapper.findAll('.click-animation')).toHaveLength(0)

      await wrapper.find('.clicker-button').trigger('click')

      expect(wrapper.findAll('.click-animation')).toHaveLength(1)
    })

    it('removes animations after timeout', async () => {
      const wrapper = createWrapper()

      await wrapper.find('.clicker-button').trigger('click')
      expect(wrapper.findAll('.click-animation')).toHaveLength(1)

      vi.advanceTimersByTime(1100)
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('.click-animation')).toHaveLength(0)
    })

    it('handles multiple rapid click animations', async () => {
      const wrapper = createWrapper()

      const button = wrapper.find('.clicker-button')
      
      await button.trigger('click')
      await button.trigger('click')
      await button.trigger('click')

      expect(wrapper.findAll('.click-animation')).toHaveLength(3)
    })
  })


  describe('Edge Cases', () => {
    it('handles click events correctly', async () => {
      const wrapper = createWrapper()

      const initialAmount = store.getResourceAmount('hcu')

      await wrapper.find('.clicker-button').trigger('click')

      expect(store.getResourceAmount('hcu')).toBeGreaterThan(initialAmount)
    })

  })

  describe('Accessibility', () => {
    it('uses proper button semantics', () => {
      const wrapper = createWrapper()

      const button = wrapper.find('.clicker-button')
      expect(button.element.tagName).toBe('BUTTON')
    })

    it('is always enabled for interaction', () => {
      const wrapper = createWrapper()

      const button = wrapper.find('.clicker-button')
      expect(button.attributes('disabled')).toBeUndefined()
    })

  })

  describe('Component Lifecycle', () => {

    it('maintains component state correctly', async () => {
      const wrapper = createWrapper()

      await wrapper.find('.clicker-button').trigger('click')
      expect(store.getResourceAmount('hcu')).toBe(1)

      // Component should remain functional
      expect(wrapper.find('.clicker-button').exists()).toBe(true)
    })
  })
})