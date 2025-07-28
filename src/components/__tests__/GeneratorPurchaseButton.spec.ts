import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestPinia } from '../../test-utils'
import { ComponentTestHelpers } from '../../test-utils'
import GeneratorPurchaseButton from '../GeneratorPurchaseButton.vue'
import { useGameStore } from '../../stores/gameStore'
// Use string IDs directly instead of importing config objects

// Mock the CurrencyDisplay component
vi.mock('../CurrencyDisplay.vue', () => ({
  default: {
    name: 'CurrencyDisplay',
    props: ['currencyId', 'amount', 'showUnit'],
    template: '<span>{{ amount }} {{ showUnit !== false ? "HCU" : "" }}</span>',
  },
}))

describe('GeneratorPurchaseButton', () => {

  beforeEach(() => {
    createTestPinia()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Component Rendering', () => {
    it('should render with correct generator information', () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })

      expect(wrapper.find('.generator-name').text()).toBe('Basic Ad-Bot Farm')
      expect(wrapper.find('.owned-count').text()).toContain('Owned: 0')
      expect(wrapper.find('.production-rate').text()).toContain('/sec')
      expect(wrapper.find('.purchase-button').exists()).toBe(true)
    })

    it('should display current generator stats', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })
      const gameStore = useGameStore()
      // Purchase a generator to test owned count display
      gameStore.addCurrency('hcu', 100)
      gameStore.purchaseGenerator('basicAdBotFarm')

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.owned-count').text()).toContain('Owned: 1')
    })

    it('should display correct cost', () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })

      // Should show base cost initially
      expect(wrapper.find('.purchase-button').text()).toContain('10')
    })

    it('should display production rate with global multiplier', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })
      const gameStore = useGameStore()
      // Purchase generator and set prestige for global multiplier
      gameStore.addCurrency('hcu', 100)
      gameStore.purchaseGenerator('basicAdBotFarm')
      gameStore.prestigeLevel = 1 // 1.25x multiplier

      await wrapper.vm.$nextTick()

      // Should show production rate with global multiplier applied
      expect(wrapper.find('.production-rate').text()).toContain('1.25')
    })
  })

  describe('Purchase Functionality', () => {
    it('should allow purchase when player can afford', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })
      const gameStore = useGameStore()
      // Give player enough money
      gameStore.addCurrency('hcu', 50)
      await wrapper.vm.$nextTick()

      const button = wrapper.find('.purchase-button')
      expect(button.classes()).not.toContain('disabled')
      expect(ComponentTestHelpers.isDisabled(wrapper, '.purchase-button')).toBe(false)
    })

    it('should prevent purchase when player cannot afford', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })
      const gameStore = useGameStore()

      // Player has no money
      expect(gameStore.getCurrencyAmount('hcu')).toBe(0)
      await wrapper.vm.$nextTick()

      const button = wrapper.find('.purchase-button')
      expect(button.classes()).toContain('disabled')
      expect(ComponentTestHelpers.isDisabled(wrapper, '.purchase-button')).toBe(true)
    })

    it('should execute purchase when clicked and affordable', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })
      const gameStore = useGameStore()
      // Give player money
      gameStore.addCurrency('hcu', 50)
      await wrapper.vm.$nextTick() // Make sure reactivity updates
      const initialUnits = gameStore.getCurrencyAmount('hcu')

      await wrapper.find('.purchase-button').trigger('click')

      // Should trigger purchase after delay
      vi.advanceTimersByTime(150)
      await wrapper.vm.$nextTick() // Allow reactivity updates

      expect(gameStore.getCurrencyAmount('hcu')).toBe(initialUnits - 10) // Cost of basicAdBotFarm

      const generator = gameStore.getGenerator('basicAdBotFarm')
      expect(generator?.owned).toBe(1)
    })

    it('should not execute purchase when clicked but unaffordable', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })
      const gameStore = useGameStore()

      const initialUnits = gameStore.getCurrencyAmount('hcu') // Should be 0

      await wrapper.find('.purchase-button').trigger('click')
      vi.advanceTimersByTime(150)

      expect(gameStore.getCurrencyAmount('hcu')).toBe(initialUnits)

      const generator = gameStore.getGenerator('basicAdBotFarm')
      expect(generator?.owned).toBe(0)
    })

    it('should show purchasing state during purchase', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })
      const gameStore = useGameStore()
      gameStore.addCurrency('hcu', 50)
      await wrapper.vm.$nextTick()

      const button = wrapper.find('.purchase-button')

      // Initially not purchasing
      expect(button.classes()).not.toContain('purchasing')

      // Click to start purchase (this triggers the async purchase process)
      await wrapper.find('.purchase-button').trigger('click')
      await wrapper.vm.$nextTick() // Wait for reactive updates

      // Should show purchasing state immediately after click
      expect(button.classes()).toContain('purchasing')

      // Should clear purchasing state after delay
      vi.advanceTimersByTime(150)
      await wrapper.vm.$nextTick()

      expect(button.classes()).not.toContain('purchasing')
    })

    it('should prevent multiple rapid purchases', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })
      const gameStore = useGameStore()
      gameStore.addCurrency('hcu', 100) // Enough for multiple purchases

      // Click rapidly multiple times
      await wrapper.find('.purchase-button').trigger('click')
      await wrapper.find('.purchase-button').trigger('click')
      await wrapper.find('.purchase-button').trigger('click')

      // Should only process first click
      vi.advanceTimersByTime(150)

      const generator = gameStore.getGenerator('basicAdBotFarm')
      expect(generator?.owned).toBe(1) // Only one purchase should go through
    })
  })

  describe('Dynamic Updates', () => {
    it('should update cost when generator count changes', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })
      const gameStore = useGameStore()

      // Initial cost
      expect(wrapper.find('.purchase-button').text()).toContain('10')
      
      // Purchase one to increase cost
      gameStore.addCurrency('hcu', 100)
      gameStore.purchaseGenerator('basicAdBotFarm')
      await wrapper.vm.$nextTick()

      // Cost should have increased (10 * 1.15^1 = 11)
      expect(wrapper.find('.purchase-button').text()).toContain('11')
    })

    it('should update affordability when player money changes', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })
      const gameStore = useGameStore()

      // Initially cannot afford
      expect(wrapper.find('.purchase-button').classes()).toContain('disabled')
      
      // Give money
      gameStore.addCurrency('hcu', 50)
      await wrapper.vm.$nextTick()

      // Should now be affordable
      expect(wrapper.find('.purchase-button').classes()).not.toContain('disabled')

      // Spend money
      gameStore.spendCurrency('hcu', 50)
      await wrapper.vm.$nextTick()

      // Should be unaffordable again
      expect(wrapper.find('.purchase-button').classes()).toContain('disabled')
    })

    it('should update production rate when upgrades are purchased', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })
      const gameStore = useGameStore()
      // Purchase generators to enable upgrade
      gameStore.addCurrency('hcu', 200)
      for (let i = 0; i < 5; i++) {
        gameStore.purchaseGenerator('basicAdBotFarm')
      }

      // Initial production rate (5 * 1 = 5)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.production-rate').text()).toContain('5')

      // Purchase upgrade that affects this generator
      gameStore.purchaseUpgrade('automatedContentScript')
      await wrapper.vm.$nextTick()

      // Production rate should increase (5 * 1.25 = 6.25)
      expect(wrapper.find('.production-rate').text()).toContain('6.25')
    })

    it('should update production rate when prestige level changes', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })
      const gameStore = useGameStore()
      // Purchase a generator
      gameStore.addCurrency('hcu', 50)
      gameStore.purchaseGenerator('basicAdBotFarm')
      await wrapper.vm.$nextTick()

      // Initial production rate (1 * 1 = 1)
      expect(wrapper.find('.production-rate').text()).toContain('1')

      // Increase prestige level
      gameStore.prestigeLevel = 1 // 1.25x multiplier
      await wrapper.vm.$nextTick()

      // Production rate should include global multiplier (1 * 1.25 = 1.25)
      expect(wrapper.find('.production-rate').text()).toContain('1.25')
    })
  })

  describe('Different Generator Types', () => {
    it('should work with different generator configurations', () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'clickbaitEngine',
        },
      })

      expect(wrapper.find('.generator-name').text()).toBe('Clickbait Engine')
      // Should show cost for clickbaitEngine (100)
      expect(wrapper.find('.purchase-button').text()).toContain('100')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle extremely high costs', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })
      const gameStore = useGameStore()
      // Purchase many generators to get very high cost
      gameStore.addCurrency('hcu', 1000000)
      const generator = gameStore.getGenerator('basicAdBotFarm')!
      generator.owned = 50 // This should create a very high cost

      await wrapper.vm.$nextTick()

      // Should display the high cost without breaking
      const costText = wrapper.find('.purchase-button').text()
      expect(costText).toMatch(/\d+/)
      expect(costText.length).toBeGreaterThan(2) // Should be a large number
    })

    it('should handle zero production generators', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })

      // Generator with 0 owned should show 0 production
      expect(wrapper.find('.production-rate').text()).toContain('0')
      expect(wrapper.find('.owned-count').text()).toContain('Owned: 0')
    })

    it('should handle component unmounting during purchase', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })
      const gameStore = useGameStore()
      gameStore.addCurrency('hcu', 50)

      // Start purchase
      await wrapper.find('.purchase-button').trigger('click')

      // Unmount while purchase is pending
      expect(() => wrapper.unmount()).not.toThrow()

      // Timer should still complete without error
      vi.advanceTimersByTime(150)
    })

    it('should handle rapid prop changes', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })

      // Change props rapidly
      await wrapper.setProps({
        generatorId: 'clickbaitEngine',
      })

      expect(wrapper.find('.generator-name').text()).toBe('Clickbait Engine')
      expect(wrapper.find('.purchase-button').text()).toContain('100')

      // Should not throw during rapid changes
      await wrapper.setProps({
        generatorId: 'basicAdBotFarm',
      })

      expect(wrapper.find('.generator-name').text()).toBe('Basic Ad-Bot Farm')
      expect(wrapper.find('.purchase-button').text()).toContain('10')
    })
  })

  describe('Accessibility and Usability', () => {
    it('should have proper button semantics', () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })

      const button = wrapper.find('.purchase-button')
      expect(button.element.tagName).toBe('BUTTON')
      // Vue uses button element semantics by default
    })

    it('should provide clear visual feedback for disabled state', async () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })

      const button = wrapper.find('.purchase-button')

      // Should be disabled when unaffordable
      expect(button.classes()).toContain('disabled')
      expect(button.attributes('disabled')).toBeDefined()
    })

    it('should show clear information hierarchy', () => {
      const wrapper = mount(GeneratorPurchaseButton, {
        props: {
          generatorId: 'basicAdBotFarm',
        },
      })

      // Information should be clearly separated
      expect(wrapper.find('.generator-info').exists()).toBe(true)
      expect(wrapper.find('.generator-name').exists()).toBe(true)
      expect(wrapper.find('.generator-stats').exists()).toBe(true)
      expect(wrapper.find('.purchase-button').exists()).toBe(true)
    })
  })
})
