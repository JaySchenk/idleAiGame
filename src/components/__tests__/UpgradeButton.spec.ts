import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useGameStore } from '../../stores/gameStore'
import UpgradeButton from '../UpgradeButton.vue'
import { createStandardTestPinia } from '../../test-utils/pinia'
import type { UpgradeConfig } from '../../stores/gameStore'

describe('UpgradeButton', () => {
  let store: ReturnType<typeof useGameStore>
  let pinia: ReturnType<typeof createStandardTestPinia>
  let mockUpgrade: UpgradeConfig

  beforeEach(() => {
    vi.useFakeTimers()
    pinia = createStandardTestPinia()
    store = useGameStore(pinia)
    
    mockUpgrade = {
      id: 'testUpgrade',
      name: 'Test Upgrade',
      description: 'A test upgrade for testing purposes',
      category: 'production',
      costs: [{ resourceId: 'hcu', amount: 100 }],
      unlockConditions: [
        { type: 'generator', generatorId: 'basicAdBotFarm', minOwned: 5 }
      ],
      effects: [{ type: 'production_multiplier', targetId: 'basicAdBotFarm', value: 1.25 }],
      isPurchased: false
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createWrapper(upgrade = mockUpgrade) {
    return mount(UpgradeButton, { 
      global: { plugins: [pinia] },
      props: { upgrade }
    })
  }

  describe('Rendering', () => {
    it('renders upgrade with correct basic information', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.upgrade-title').text()).toBe('Test Upgrade')
      expect(wrapper.find('.upgrade-description').text()).toBe('A test upgrade for testing purposes')
      expect(wrapper.find('.upgrade-cost').exists()).toBe(true)
    })

    it('displays multiple costs correctly', () => {
      const upgradeWithMultipleCosts = {
        ...mockUpgrade,
        costs: [
          { resourceId: 'hcu', amount: 100 },
          { resourceId: 'hcu', amount: 50 }
        ]
      }
      const wrapper = createWrapper(upgradeWithMultipleCosts)

      const costs = wrapper.findAll('.upgrade-cost')
      expect(costs).toHaveLength(2)
    })

    it('shows requirements section when not met', () => {
      store.getGenerator('basicAdBotFarm')!.owned = 3
      const wrapper = createWrapper()

      expect(wrapper.find('.upgrade-requirements').exists()).toBe(true)
      expect(wrapper.find('.requirement-text').text()).toBe('Requires:')
    })

    it('hides requirements section when met', () => {
      store.getGenerator('basicAdBotFarm')!.owned = 5
      vi.spyOn(store, 'areUpgradeRequirementsMet').mockReturnValue(true)
      const wrapper = createWrapper()

      expect(wrapper.find('.upgrade-requirements').exists()).toBe(false)
    })
  })

  describe('Requirement Display', () => {
    it('displays generator requirements with progress', () => {
      store.getGenerator('basicAdBotFarm')!.owned = 3
      const wrapper = createWrapper()

      const requirementItem = wrapper.find('.requirement-item')
      expect(requirementItem.text()).toContain('5 Basic Ad-Bot Farm')
      expect(requirementItem.text()).toContain('(3/5)')
    })

    it('displays resource requirements', () => {
      const upgradeWithResourceReq = {
        ...mockUpgrade,
        unlockConditions: [
          { type: 'resource', resourceId: 'hcu', minAmount: 1000 }
        ]
      }
      const wrapper = createWrapper(upgradeWithResourceReq)

      expect(wrapper.find('.requirement-item').text()).toContain('1000 hcu')
    })

    it('handles unknown generator gracefully', () => {
      const upgradeWithUnknownGen = {
        ...mockUpgrade,
        unlockConditions: [
          { type: 'generator', generatorId: 'nonexistent', minOwned: 1 }
        ]
      }
      const wrapper = createWrapper(upgradeWithUnknownGen)

      expect(wrapper.find('.requirement-item').text()).toContain('Unknown Generator')
    })

    it('displays generic conditions for unknown types', () => {
      const upgradeWithUnknownCondition = {
        ...mockUpgrade,
        unlockConditions: [
          { type: 'unknown' as 'resource' } // Cast to valid type since this is testing fallback behavior
        ]
      }
      const wrapper = createWrapper(upgradeWithUnknownCondition)

      expect(wrapper.find('.requirement-item').text()).toContain('unknown condition')
    })
  })

  describe('Button States', () => {
    it('shows purchased state when upgrade is owned', () => {
      mockUpgrade.isPurchased = true
      const wrapper = createWrapper()

      const button = wrapper.find('.upgrade-button')
      expect(button.classes()).toContain('purchased')
      expect(button.text()).toBe('✓ Purchased')
      expect(button.attributes('disabled')).toBeDefined()
    })

    it('shows requirements not met when conditions not satisfied', () => {
      store.getGenerator('basicAdBotFarm')!.owned = 3
      const wrapper = createWrapper()

      const button = wrapper.find('.upgrade-button')
      expect(button.classes()).toContain('disabled')
      expect(button.text()).toBe('Requirements Not Met')
      expect(button.attributes('disabled')).toBeDefined()
    })

    it('shows insufficient resources when cannot afford', () => {
      store.getGenerator('basicAdBotFarm')!.owned = 5
      store.gameState.resources.hcu.current = 50
      vi.spyOn(store, 'areUpgradeRequirementsMet').mockReturnValue(true)
      vi.spyOn(store, 'canPurchaseUpgrade').mockReturnValue(false)
      const wrapper = createWrapper()

      const button = wrapper.find('.upgrade-button')
      expect(button.classes()).toContain('disabled')
      expect(button.text()).toBe('Insufficient Resources')
      expect(button.attributes('disabled')).toBeDefined()
    })

    it('shows purchase button when all conditions met', () => {
      store.getGenerator('basicAdBotFarm')!.owned = 5
      store.gameState.resources.hcu.current = 200
      vi.spyOn(store, 'areUpgradeRequirementsMet').mockReturnValue(true)
      vi.spyOn(store, 'canPurchaseUpgrade').mockReturnValue(true)
      const wrapper = createWrapper()

      const button = wrapper.find('.upgrade-button')
      expect(button.classes()).not.toContain('disabled')
      expect(button.text()).toBe('Purchase Upgrade')
      expect(button.attributes('disabled')).toBeUndefined()
    })

    it('shows purchasing state during purchase', async () => {
      store.getGenerator('basicAdBotFarm')!.owned = 5
      store.gameState.resources.hcu.current = 200
      vi.spyOn(store, 'areUpgradeRequirementsMet').mockReturnValue(true)
      vi.spyOn(store, 'canPurchaseUpgrade').mockReturnValue(true)
      vi.spyOn(store, 'purchaseUpgrade').mockReturnValue(true)
      const wrapper = createWrapper()

      const button = wrapper.find('.upgrade-button')
      await button.trigger('click')

      expect(wrapper.vm.isPurchasing).toBe(true)
      expect(button.text()).toBe('Purchasing...')
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  describe('Purchase Behavior', () => {
    it('calls store purchase method when clicked', async () => {
      store.getGenerator('basicAdBotFarm')!.owned = 5
      store.gameState.resources.hcu.current = 200
      vi.spyOn(store, 'areUpgradeRequirementsMet').mockReturnValue(true)
      vi.spyOn(store, 'canPurchaseUpgrade').mockReturnValue(true)
      const purchaseSpy = vi.spyOn(store, 'purchaseUpgrade').mockReturnValue(true)
      const wrapper = createWrapper()

      await wrapper.find('.upgrade-button').trigger('click')
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()

      expect(purchaseSpy).toHaveBeenCalledWith('testUpgrade')
    })

    it('shows purchase effect on successful purchase', async () => {
      store.getGenerator('basicAdBotFarm')!.owned = 5
      store.gameState.resources.hcu.current = 200
      vi.spyOn(store, 'areUpgradeRequirementsMet').mockReturnValue(true)
      vi.spyOn(store, 'canPurchaseUpgrade').mockReturnValue(true)
      vi.spyOn(store, 'purchaseUpgrade').mockReturnValue(true)
      const wrapper = createWrapper()

      const clickPromise = wrapper.find('.upgrade-button').trigger('click')
      vi.advanceTimersByTime(100) // Wait for purchase animation delay
      await clickPromise
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showPurchaseEffect).toBe(true)
      expect(wrapper.find('.purchase-effect').exists()).toBe(true)
      expect(wrapper.find('.effect-text').text()).toBe('Upgrade Purchased!')
      expect(wrapper.find('.effect-bonus').text()).toBe('+25% Basic Ad-Bot Farm production')
    })

    it('hides purchase effect after animation', async () => {
      store.getGenerator('basicAdBotFarm')!.owned = 5
      store.gameState.resources.hcu.current = 200
      vi.spyOn(store, 'areUpgradeRequirementsMet').mockReturnValue(true)
      vi.spyOn(store, 'canPurchaseUpgrade').mockReturnValue(true)
      vi.spyOn(store, 'purchaseUpgrade').mockReturnValue(true)
      const wrapper = createWrapper()

      const clickPromise = wrapper.find('.upgrade-button').trigger('click')
      vi.advanceTimersByTime(100) // Wait for purchase animation delay
      await clickPromise
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showPurchaseEffect).toBe(true)

      vi.advanceTimersByTime(2000) // Wait for effect duration
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showPurchaseEffect).toBe(false)
      expect(wrapper.find('.purchase-effect').exists()).toBe(false)
    })

    it('does not purchase when requirements not met', async () => {
      store.getGenerator('basicAdBotFarm')!.owned = 3
      const wrapper = createWrapper()

      const purchaseSpy = vi.spyOn(store, 'purchaseUpgrade')

      await wrapper.find('.upgrade-button').trigger('click')
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()

      expect(purchaseSpy).not.toHaveBeenCalled()
    })

    it('prevents multiple simultaneous purchases', async () => {
      store.getGenerator('basicAdBotFarm')!.owned = 5
      store.gameState.resources.hcu.current = 200
      vi.spyOn(store, 'areUpgradeRequirementsMet').mockReturnValue(true)
      vi.spyOn(store, 'canPurchaseUpgrade').mockReturnValue(true)
      const purchaseSpy = vi.spyOn(store, 'purchaseUpgrade').mockReturnValue(true)
      const wrapper = createWrapper()

      const button = wrapper.find('.upgrade-button')
      await button.trigger('click')
      await button.trigger('click')

      vi.advanceTimersByTime(1100)
      await wrapper.vm.$nextTick()

      expect(purchaseSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Helper Functions', () => {
    it('gets generator name correctly', () => {
      store.getGenerator('basicAdBotFarm')!.owned = 3
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('Basic Ad-Bot Farm')
    })

    it('gets generator owned count correctly', () => {
      store.getGenerator('basicAdBotFarm')!.owned = 3
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('(3/5)')
    })
  })

  describe('Edge Cases', () => {
    it('handles failed purchase gracefully', async () => {
      store.getGenerator('basicAdBotFarm')!.owned = 5
      store.gameState.resources.hcu.current = 200
      const wrapper = createWrapper()

      vi.spyOn(store, 'purchaseUpgrade').mockReturnValue(false)

      await wrapper.find('.upgrade-button').trigger('click')
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.purchase-effect').exists()).toBe(false)
    })
  })
})