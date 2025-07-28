import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestPinia } from '../../test-utils'
import { ComponentTestHelpers } from '../../test-utils'
import ManualClickerButton from '../ManualClickerButton.vue'
import { useGameStore } from '../../stores/gameStore'
import { HCU } from '../../config/currencies'

// Mock the CurrencyDisplay component
vi.mock('../CurrencyDisplay.vue', () => ({
  default: {
    name: 'CurrencyDisplay',
    props: ['currencyId', 'amount', 'showUnit'],
    template: '<span>{{ amount }} {{ showUnit !== false ? "HCU" : "" }}</span>',
  },
}))

describe('ManualClickerButton', () => {
  beforeEach(() => {
    createTestPinia()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Component Rendering', () => {
    it('should render correctly with default state', () => {
      const wrapper = mount(ManualClickerButton)

      expect(wrapper.find('.clicker-title').text()).toBe('Desperate Human Touch')
      expect(wrapper.find('.click-text').text()).toBe('CLICK')
      expect(wrapper.find('.click-icon').text()).toBe('⚡')
      expect(wrapper.find('.clicker-button').exists()).toBe(true)
    })

    it('should display current click value in description and button', async () => {
      const wrapper = mount(ManualClickerButton)
      const gameStore = useGameStore()

      // Mock click value
      gameStore.gameState.prestigeLevel = 1 // This should make click value 1.25
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.clicker-description').text()).toContain('1.25')
      expect(wrapper.find('.click-reward').text()).toContain('1.25')
    })

    it('should have proper CSS classes applied', () => {
      const wrapper = mount(ManualClickerButton)

      expect(wrapper.find('.clicker-container').exists()).toBe(true)
      expect(wrapper.find('.clicker-button').exists()).toBe(true)
      expect(wrapper.find('.clicker-info').exists()).toBe(true)
    })
  })

  describe('Click Interaction', () => {
    it('should call gameStore.clickForContent when clicked', async () => {
      const wrapper = mount(ManualClickerButton)
      const gameStore = useGameStore()

      const clickSpy = vi.spyOn(gameStore, 'clickForContent')

      await wrapper.find('.clicker-button').trigger('click')

      expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('should add content units when clicked', async () => {
      const wrapper = mount(ManualClickerButton)
      const gameStore = useGameStore()

      const initialUnits = gameStore.getCurrencyAmount('hcu')

      await wrapper.find('.clicker-button').trigger('click')

      expect(gameStore.getCurrencyAmount('hcu')).toBeGreaterThan(initialUnits)
    })

    it('should show visual feedback during click', async () => {
      const wrapper = mount(ManualClickerButton)

      const button = wrapper.find('.clicker-button')
      expect(button.classes()).not.toContain('clicking')

      await button.trigger('click')

      // Should show clicking state immediately
      expect(button.classes()).toContain('clicking')

      // Should remove clicking state after timeout
      vi.advanceTimersByTime(200)
      await wrapper.vm.$nextTick()

      expect(button.classes()).not.toContain('clicking')
    })

    it('should handle mousedown and mouseup events', async () => {
      const wrapper = mount(ManualClickerButton)
      const button = wrapper.find('.clicker-button')

      // Initial state
      expect(button.classes()).not.toContain('clicking')

      // Mouse down
      await button.trigger('mousedown')
      expect(button.classes()).toContain('clicking')

      // Mouse up
      await button.trigger('mouseup')
      expect(button.classes()).not.toContain('clicking')
    })

    it('should handle mouseleave event', async () => {
      const wrapper = mount(ManualClickerButton)
      const button = wrapper.find('.clicker-button')

      // Mouse down then leave
      await button.trigger('mousedown')
      expect(button.classes()).toContain('clicking')

      await button.trigger('mouseleave')
      expect(button.classes()).not.toContain('clicking')
    })
  })

  describe('Click Animations', () => {
    it('should create click animation on click', async () => {
      const wrapper = mount(ManualClickerButton)

      // Initially no animations
      expect(wrapper.findAll('.click-animation')).toHaveLength(0)

      // Simple click to trigger animation
      await wrapper.find('.clicker-button').trigger('click')

      // Should have one animation
      expect(wrapper.findAll('.click-animation')).toHaveLength(1)

      const animation = wrapper.find('.click-animation')
      expect(animation.text()).toContain('1') // Default click value
    })

    it('should remove animation after timeout', async () => {
      const wrapper = mount(ManualClickerButton)

      await wrapper.find('.clicker-button').trigger('click')

      // Should have animation
      expect(wrapper.findAll('.click-animation')).toHaveLength(1)

      // Fast forward past animation timeout
      vi.advanceTimersByTime(1100)
      await wrapper.vm.$nextTick()

      // Animation should be removed
      expect(wrapper.findAll('.click-animation')).toHaveLength(0)
    })

    it('should handle multiple rapid clicks', async () => {
      const wrapper = mount(ManualClickerButton)

      // Click multiple times rapidly
      await wrapper.find('.clicker-button').trigger('click')
      await wrapper.find('.clicker-button').trigger('click')
      await wrapper.find('.clicker-button').trigger('click')

      // Should have multiple animations
      expect(wrapper.findAll('.click-animation')).toHaveLength(3)
    })

    it('should display correct click value in animation', async () => {
      const wrapper = mount(ManualClickerButton)
      const gameStore = useGameStore()

      // Set higher click value
      gameStore.gameState.prestigeLevel = 2 // Should be 1.5625
      await wrapper.vm.$nextTick()

      await wrapper.find('.clicker-button').trigger('click')

      const animation = wrapper.find('.click-animation')
      expect(animation.text()).toContain('1.5625')
    })
  })

  describe('Game State Integration', () => {
    it('should reflect changes in click value', async () => {
      const wrapper = mount(ManualClickerButton)
      const gameStore = useGameStore()

      // Initially prestige 0, click value = 1
      expect(wrapper.find('.click-reward').text()).toContain('1')

      // Increase prestige level
      gameStore.gameState.prestigeLevel = 1
      await wrapper.vm.$nextTick()

      // Should reflect new click value
      expect(wrapper.find('.click-reward').text()).toContain('1.25')
    })

    it('should work with basic click value', async () => {
      const wrapper = mount(ManualClickerButton)
      const gameStore = useGameStore()

      // Basic click value should be 1
      expect(wrapper.find('.click-reward').text()).toContain('1')

      await wrapper.find('.clicker-button').trigger('click')

      // Should create animation with click value
      expect(wrapper.findAll('.click-animation')).toHaveLength(1)
      expect(wrapper.find('.click-animation').text()).toContain('1')
    })

    it('should handle prestige click values', async () => {
      const wrapper = mount(ManualClickerButton)
      const gameStore = useGameStore()

      // Set prestige for higher click value
      gameStore.gameState.prestigeLevel = 1 // 1.25x
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.click-reward').text()).toContain('1.25')

      await wrapper.find('.clicker-button').trigger('click')

      expect(wrapper.find('.click-animation').text()).toContain('1.25')
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should have proper button semantics', () => {
      const wrapper = mount(ManualClickerButton)

      const button = wrapper.find('.clicker-button')
      expect(button.element.tagName).toBe('BUTTON')
      // Note: Vue doesn't add type='button' by default, it uses the button element semantics
    })

    it('should not be disabled', () => {
      const wrapper = mount(ManualClickerButton)

      const button = wrapper.find('.clicker-button')
      expect(button.attributes('disabled')).toBeUndefined()
      expect(ComponentTestHelpers.isDisabled(wrapper, '.clicker-button')).toBe(false)
    })

    it('should provide visual feedback for all interaction states', async () => {
      const wrapper = mount(ManualClickerButton)
      const button = wrapper.find('.clicker-button')

      // Default state
      expect(button.classes()).not.toContain('clicking')

      // Active state
      await button.trigger('mousedown')
      expect(button.classes()).toContain('clicking')

      // Return to default
      await button.trigger('mouseup')
      expect(button.classes()).not.toContain('clicking')
    })

    it('should handle keyboard navigation (implicit button behavior)', () => {
      const wrapper = mount(ManualClickerButton)
      const button = wrapper.find('.clicker-button')

      // Button should be focusable by default
      expect(button.element.tabIndex).not.toBe(-1)
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle rapid clicking without breaking', async () => {
      const wrapper = mount(ManualClickerButton)
      const gameStore = useGameStore()

      const initialUnits = gameStore.getCurrencyAmount('hcu')

      // Rapid clicks
      for (let i = 0; i < 5; i++) {
        await wrapper.find('.clicker-button').trigger('click')
      }

      // Should have processed all clicks
      expect(gameStore.getCurrencyAmount('hcu')).toBe(initialUnits + 5)

      // Should have all animations (before cleanup)
      expect(wrapper.findAll('.click-animation')).toHaveLength(5)
    })

    it('should clean up animations properly', async () => {
      const wrapper = mount(ManualClickerButton)

      // Create several animations
      await wrapper.find('.clicker-button').trigger('click')
      await wrapper.find('.clicker-button').trigger('click')

      expect(wrapper.findAll('.click-animation')).toHaveLength(2)

      // Fast forward past all timeouts
      vi.advanceTimersByTime(2000)
      await wrapper.vm.$nextTick()

      // All animations should be cleaned up
      expect(wrapper.findAll('.click-animation')).toHaveLength(0)
    })

    it('should handle component unmounting gracefully', async () => {
      const wrapper = mount(ManualClickerButton)

      // Create animations with pending timeouts
      await wrapper.find('.clicker-button').trigger('click')

      // Should not throw when unmounting with pending timers
      expect(() => wrapper.unmount()).not.toThrow()
    })

    it('should handle basic clicking without errors', async () => {
      const wrapper = mount(ManualClickerButton)

      // Should not throw
      await expect(wrapper.find('.clicker-button').trigger('click')).resolves.not.toThrow()
    })
  })
})
