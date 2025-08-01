import { describe, it, expect } from 'vitest'
import CurrencyDisplay from '../CurrencyDisplay.vue'
import { useGameStore } from '../../stores/gameStore'
import { mountWithPinia } from '../../test-utils/component'

describe('CurrencyDisplay', () => {
  function createWrapper(props = {}) {
    const wrapper = mountWithPinia(CurrencyDisplay, {
      props: {
        resourceId: 'hcu',
        amount: 100,
        ...props,
      },
    })

    // Ensure store is properly initialized
    const store = useGameStore()

    return { wrapper, store }
  }

  describe('Basic Rendering', () => {
    it('renders amount with unit by default', () => {
      const { wrapper } = createWrapper()

      expect(wrapper.text()).toBe('100.00 HCU')
      expect(wrapper.find('.resource-display').exists()).toBe(true)
    })

    it('renders amount without unit when showUnit is false', () => {
      const { wrapper } = createWrapper({ showUnit: false })

      expect(wrapper.text()).toBe('100.00')
      expect(wrapper.text()).not.toContain('HCU')
    })

    it('applies proper CSS classes', () => {
      const { wrapper } = createWrapper()

      expect(wrapper.find('.resource-display').exists()).toBe(true)
      expect(wrapper.element.tagName).toBe('SPAN')
    })
  })

  describe('Currency Types', () => {
    it('displays HCU currency correctly', () => {
      const { wrapper } = createWrapper({
        resourceId: 'hcu',
        amount: 100,
      })

      expect(wrapper.text()).toBe('100.00 HCU')
    })

    it('displays RD currency correctly', () => {
      const { wrapper } = createWrapper({
        resourceId: 'rd',
        amount: 100,
      })

      expect(wrapper.text()).toBe('100.00 RD')
    })

    it('applies currency-specific styling', () => {
      const { wrapper } = createWrapper({
        resourceId: 'hcu',
        amount: 100,
      })

      const element = wrapper.find('.resource-display')
      expect(element.attributes('style')).toMatch(/color/)
    })
  })

  describe('Number Formatting', () => {
    it('formats basic numbers correctly', () => {
      const testCases = [
        { amount: 0, expected: '0.00 HCU' },
        { amount: 1, expected: '1.00 HCU' },
        { amount: 999.99, expected: '999.99 HCU' },
      ]

      testCases.forEach(({ amount, expected }) => {
        const { wrapper } = createWrapper({ amount })
        expect(wrapper.text()).toBe(expected)
      })
    })

    it('formats thousands with K suffix', () => {
      const testCases = [
        { amount: 1000, expected: '1.00K HCU' },
        { amount: 1500, expected: '1.50K HCU' },
        { amount: 999000, expected: '999.00K HCU' },
      ]

      testCases.forEach(({ amount, expected }) => {
        const { wrapper } = createWrapper({ amount })
        expect(wrapper.text()).toBe(expected)
      })
    })

    it('formats millions with M suffix', () => {
      const testCases = [
        { amount: 1000000, expected: '1.00M HCU' },
        { amount: 2500000, expected: '2.50M HCU' },
      ]

      testCases.forEach(({ amount, expected }) => {
        const { wrapper } = createWrapper({ amount })
        expect(wrapper.text()).toBe(expected)
      })
    })

    it('formats billions with B suffix', () => {
      const { wrapper } = createWrapper({ amount: 1000000000 })
      expect(wrapper.text()).toBe('1.00B HCU')
    })

    it('formats trillions with T suffix', () => {
      const { wrapper } = createWrapper({ amount: 1000000000000 })
      expect(wrapper.text()).toBe('1.00T HCU')
    })

    it('formats quadrillions with Q suffix', () => {
      const { wrapper } = createWrapper({ amount: 1000000000000000 })
      expect(wrapper.text()).toBe('1.00Q HCU')
    })

    it('uses scientific notation for extremely large numbers', () => {
      const { wrapper } = createWrapper({ amount: 1e18 })
      expect(wrapper.text()).toBe('1.00e+18 HCU')
    })
  })

  describe('Reactivity', () => {
    it('updates when amount changes', async () => {
      const { wrapper } = createWrapper({ amount: 100 })

      expect(wrapper.text()).toBe('100.00 HCU')

      await wrapper.setProps({ amount: 1000 })
      expect(wrapper.text()).toBe('1.00K HCU')
    })

    it('updates when showUnit changes', async () => {
      const { wrapper } = createWrapper({
        amount: 100,
        showUnit: true,
      })

      expect(wrapper.text()).toBe('100.00 HCU')

      await wrapper.setProps({ showUnit: false })
      expect(wrapper.text()).toBe('100.00')
    })

    it('updates when resourceId changes', async () => {
      const { wrapper } = createWrapper({
        resourceId: 'hcu',
        amount: 100,
      })

      expect(wrapper.text()).toBe('100.00 HCU')

      await wrapper.setProps({ resourceId: 'rd' })
      expect(wrapper.text()).toBe('100.00 RD')
    })
  })

  describe('Edge Cases', () => {
    it('handles negative numbers', () => {
      const { wrapper } = createWrapper({ amount: -50 })
      expect(wrapper.text()).toBe('-50.00 HCU')
    })

    it('handles zero correctly', () => {
      const { wrapper } = createWrapper({ amount: 0 })
      expect(wrapper.text()).toBe('0.00 HCU')
    })

    it('handles missing resource config gracefully', () => {
      const { wrapper } = createWrapper({
        resourceId: 'nonexistent',
        amount: 100,
      })

      // Should fallback to basic number display when resource config missing
      expect(wrapper.text()).toBe('100')
    })
  })

  describe('Unit Control', () => {
    it('shows unit by default', () => {
      const { wrapper } = createWrapper({ amount: 1000 })
      expect(wrapper.text()).toContain('HCU')
    })
  })
})
