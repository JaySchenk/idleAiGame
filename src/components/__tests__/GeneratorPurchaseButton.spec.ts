import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useGameStore } from '../../stores/gameStore'
import GeneratorPurchaseButton from '../GeneratorPurchaseButton.vue'
import { createStandardTestPinia } from '../../test-utils/pinia'

describe('GeneratorPurchaseButton', () => {
  let store: ReturnType<typeof useGameStore>
  let pinia: ReturnType<typeof createStandardTestPinia>

  beforeEach(() => {
    pinia = createStandardTestPinia()
    store = useGameStore(pinia)
  })

  function createWrapper(props = { generatorId: 'basicAdBotFarm' }) {
    return mount(GeneratorPurchaseButton, {
      props,
      global: { plugins: [pinia] },
    })
  }

  describe('Rendering', () => {
    it('displays generator information correctly', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.generator-name').text()).toBe('Basic Ad-Bot Farm')
      expect(wrapper.find('.owned-count').text()).toContain('Owned: 0')
      expect(wrapper.find('.production-info').text()).toContain('/sec')
      expect(wrapper.find('.purchase-button').exists()).toBe(true)
    })

    it('shows correct base cost', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.cost-display').text()).toContain('10')
    })

    it('updates cost when generator count changes', async () => {
      const wrapper = createWrapper()

      // Purchase one generator to increase cost
      store.addResource('hcu', 100)
      store.purchaseGenerator('basicAdBotFarm')
      await wrapper.vm.$nextTick()

      // Cost should increase (10 * 1.15^1 = 11)
      expect(wrapper.find('.cost-display').text()).toContain('11')
    })
  })

  describe('Purchase Functionality', () => {
    it('enables purchase button when affordable', async () => {
      const wrapper = createWrapper()

      store.addResource('hcu', 50)
      await wrapper.vm.$nextTick()

      const button = wrapper.find('.purchase-button')
      expect(button.classes()).not.toContain('disabled')
    })

    it('disables purchase button when unaffordable', async () => {
      const wrapper = createWrapper()

      // Default state - no money
      const button = wrapper.find('.purchase-button')
      expect(button.classes()).toContain('disabled')
    })

    it('executes purchase when clicked and affordable', async () => {
      const wrapper = createWrapper()

      store.addResource('hcu', 50)
      await wrapper.vm.$nextTick()

      await wrapper.find('.purchase-button').trigger('click')
      vi.runAllTimers() // Complete purchase delay
      await wrapper.vm.$nextTick()

      expect(store.getResourceAmount('hcu')).toBe(40)
      expect(store.getGenerator('basicAdBotFarm')?.owned).toBe(1)
    })

    it('shows purchasing state during purchase', async () => {
      const wrapper = createWrapper()

      store.addResource('hcu', 50)
      await wrapper.vm.$nextTick()

      const button = wrapper.find('.purchase-button')
      expect(button.classes()).not.toContain('purchasing')

      await wrapper.find('.purchase-button').trigger('click')
      await wrapper.vm.$nextTick()

      expect(button.classes()).toContain('purchasing')
    })

    it('prevents multiple rapid purchases', async () => {
      const wrapper = createWrapper()

      store.addResource('hcu', 100)

      // Click multiple times rapidly
      const button = wrapper.find('.purchase-button')
      await button.trigger('click')
      await button.trigger('click')
      await button.trigger('click')

      vi.runAllTimers()
      await wrapper.vm.$nextTick()

      // Only one purchase should complete
      expect(store.getGenerator('basicAdBotFarm')?.owned).toBe(1)
    })
  })

  describe('Production Display', () => {
    it('shows zero production when no generators owned', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.production-info').text()).toContain('0')
    })

    it('shows correct production rate', async () => {
      const wrapper = createWrapper()

      store.getGenerator('basicAdBotFarm')!.owned = 5
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.production-info').text()).toContain('5')
    })

    it('applies upgrade multipliers to production display', async () => {
      const wrapper = createWrapper()

      store.getGenerator('basicAdBotFarm')!.owned = 4
      store.getUpgrade('automatedContentScript')!.isPurchased = true
      await wrapper.vm.$nextTick()

      // 4 * 1 * 1.25 = 5
      expect(wrapper.find('.production-info').text()).toContain('5')
    })

    it('applies prestige multipliers to production display', async () => {
      const wrapper = createWrapper()

      store.getGenerator('basicAdBotFarm')!.owned = 1
      store.gameState.prestige.level = 1 // 1.25x multiplier
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.production-info').text()).toContain('1.25')
    })
  })

  describe('Different Generator Types', () => {
    it('works with different generator configurations', async () => {
      const wrapper = createWrapper({ generatorId: 'clickbaitEngine' })

      // Unlock clickbaitEngine by meeting requirements
      store.addResource('hcu', 1000)
      for (let i = 0; i < 5; i++) {
        store.purchaseGenerator('basicAdBotFarm')
      }
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.generator-name').text()).toBe('Clickbait Engine')
      expect(wrapper.find('.cost-display').text()).toContain('100')
    })
  })

  describe('Reactivity', () => {
    it('updates affordability when player money changes', async () => {
      const wrapper = createWrapper()

      // Initially unaffordable
      expect(wrapper.find('.purchase-button').classes()).toContain('disabled')

      // Add money
      store.addResource('hcu', 50)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.purchase-button').classes()).not.toContain('disabled')

      // Spend money
      store.spendResource('hcu', 50)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.purchase-button').classes()).toContain('disabled')
    })

    it('updates owned count display', async () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.owned-count').text()).toContain('Owned: 0')

      store.addResource('hcu', 100)
      store.purchaseGenerator('basicAdBotFarm')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.owned-count').text()).toContain('Owned: 1')
    })
  })

  describe('Accessibility', () => {
    it('uses proper button semantics', () => {
      const wrapper = createWrapper()

      const button = wrapper.find('.purchase-button')
      expect(button.element.tagName).toBe('BUTTON')
    })
  })
})
