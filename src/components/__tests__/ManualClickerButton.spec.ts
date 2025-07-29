import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useGameStore } from '../../stores/gameStore'
import ManualClickerButton from '../ManualClickerButton.vue'

// Mock CurrencyDisplay component
vi.mock('../CurrencyDisplay.vue', () => ({
  default: {
    name: 'CurrencyDisplay',
    props: ['resourceId', 'amount', 'showUnit'],
    template: '<span>{{ amount }} {{ showUnit !== false ? resourceId.toUpperCase() : "" }}</span>',
  },
}))

describe('ManualClickerButton', () => {
  let store: ReturnType<typeof useGameStore>
  let pinia: any

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })
    store = useGameStore(pinia)
  })

  describe('Rendering', () => {
    it('renders the clicker button with correct elements', () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      expect(wrapper.find('.clicker-title').text()).toBe('Desperate Human Touch')
      expect(wrapper.find('.click-text').text()).toBe('CLICK')
      expect(wrapper.find('.click-icon').text()).toBe('⚡')
      expect(wrapper.find('.clicker-button').exists()).toBe(true)
    })

    it('displays click rewards from store', () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      expect(wrapper.find('.clicker-description').exists()).toBe(true)
      expect(wrapper.find('.click-reward').exists()).toBe(true)
    })

    it('applies proper CSS classes', () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      expect(wrapper.find('.clicker-container').exists()).toBe(true)
      expect(wrapper.find('.clicker-button').exists()).toBe(true)
      expect(wrapper.find('.clicker-info').exists()).toBe(true)
    })
  })

  describe('Click Functionality', () => {
    it('calls clickForResources when clicked', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      const clickSpy = vi.spyOn(store, 'clickForResources')

      await wrapper.find('.clicker-button').trigger('click')

      expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('adds resources when clicked', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      const initialUnits = store.getResourceAmount('hcu')

      await wrapper.find('.clicker-button').trigger('click')

      expect(store.getResourceAmount('hcu')).toBe(initialUnits + 1)
      expect(store.gameState.resources.hcu.lifetime).toBe(1)
    })

    it('applies prestige multiplier to clicks', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      store.gameState.prestige.level = 1 // 1.25x multiplier

      await wrapper.find('.clicker-button').trigger('click')

      expect(store.getResourceAmount('hcu')).toBe(1.25)
      expect(store.gameState.resources.hcu.lifetime).toBe(1.25)
    })

    it('handles multiple clicks', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      const button = wrapper.find('.clicker-button')
      
      for (let i = 0; i < 5; i++) {
        await button.trigger('click')
      }

      expect(store.getResourceAmount('hcu')).toBe(5)
    })
  })

  describe('Visual Feedback', () => {
    it('shows clicking state during interaction', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      const button = wrapper.find('.clicker-button')
      expect(button.classes()).not.toContain('clicking')

      await button.trigger('click')
      expect(button.classes()).toContain('clicking')

      vi.advanceTimersByTime(200)
      await wrapper.vm.$nextTick()

      expect(button.classes()).not.toContain('clicking')
    })

    it('handles mouse events for visual feedback', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      const button = wrapper.find('.clicker-button')

      await button.trigger('mousedown')
      expect(button.classes()).toContain('clicking')

      await button.trigger('mouseup')
      expect(button.classes()).not.toContain('clicking')
    })

    it('handles mouse leave events', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      const button = wrapper.find('.clicker-button')

      await button.trigger('mousedown')
      expect(button.classes()).toContain('clicking')

      await button.trigger('mouseleave')
      expect(button.classes()).not.toContain('clicking')
    })
  })

  describe('Click Animations', () => {
    it('creates click animation on click', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      expect(wrapper.findAll('.click-animation')).toHaveLength(0)

      await wrapper.find('.clicker-button').trigger('click')

      expect(wrapper.findAll('.click-animation')).toHaveLength(1)
    })

    it('removes animations after timeout', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      await wrapper.find('.clicker-button').trigger('click')
      expect(wrapper.findAll('.click-animation')).toHaveLength(1)

      vi.advanceTimersByTime(1100)
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('.click-animation')).toHaveLength(0)
    })

    it('handles multiple rapid click animations', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      const button = wrapper.find('.clicker-button')
      
      await button.trigger('click')
      await button.trigger('click')
      await button.trigger('click')

      expect(wrapper.findAll('.click-animation')).toHaveLength(3)
    })
  })

  describe('Performance', () => {
    it('handles many clicks efficiently', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      const button = wrapper.find('.clicker-button')
      const startTime = performance.now()
      
      for (let i = 0; i < 20; i++) {
        await button.trigger('click')
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(2000)
      expect(store.getResourceAmount('hcu')).toBe(20)
    })

    it('cleans up animations properly', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      await wrapper.find('.clicker-button').trigger('click')
      await wrapper.find('.clicker-button').trigger('click')

      expect(wrapper.findAll('.click-animation')).toHaveLength(2)

      vi.advanceTimersByTime(1200)
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('.click-animation')).toHaveLength(0)
    })
  })

  describe('Edge Cases', () => {
    it('handles click events correctly', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      const initialAmount = store.getResourceAmount('hcu')

      await wrapper.find('.clicker-button').trigger('click')

      expect(store.getResourceAmount('hcu')).toBeGreaterThan(initialAmount)
    })

    it('maintains functionality after multiple interactions', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      const button = wrapper.find('.clicker-button')
      
      // Mix of different interactions
      await button.trigger('mousedown')
      await button.trigger('mouseup')
      await button.trigger('click')
      await button.trigger('mouseleave')
      await button.trigger('click')

      expect(store.getResourceAmount('hcu')).toBe(2)
    })
  })

  describe('Accessibility', () => {
    it('uses proper button semantics', () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      const button = wrapper.find('.clicker-button')
      expect(button.element.tagName).toBe('BUTTON')
    })

    it('is always enabled for interaction', () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      const button = wrapper.find('.clicker-button')
      expect(button.attributes('disabled')).toBeUndefined()
    })

    it('supports keyboard navigation', () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      const button = wrapper.find('.clicker-button')
      expect(button.element.tabIndex).not.toBe(-1)
    })
  })

  describe('Component Lifecycle', () => {
    it('unmounts cleanly without errors', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      await wrapper.find('.clicker-button').trigger('click')

      expect(() => wrapper.unmount()).not.toThrow()
    })

    it('maintains component state correctly', async () => {
      const wrapper = mount(ManualClickerButton, {
        global: { plugins: [pinia] },
      })

      await wrapper.find('.clicker-button').trigger('click')
      expect(store.getResourceAmount('hcu')).toBe(1)

      // Component should remain functional
      expect(wrapper.find('.clicker-button').exists()).toBe(true)
    })
  })
})