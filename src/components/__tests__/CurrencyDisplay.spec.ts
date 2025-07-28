import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CurrencyDisplay from '../CurrencyDisplay.vue'
import { createTestPinia } from '../../test-utils'
import { mathTestCases } from '../../test-utils/fixtures'

describe('CurrencyDisplay', () => {
  beforeEach(() => {
    createTestPinia()
  })

  describe('Basic Rendering', () => {
    it('should render amount with default unit', () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 100,
        },
      })

      expect(wrapper.text()).toBe('100.00 HCU')
      expect(wrapper.find('.resource-display').exists()).toBe(true)
    })

    it('should render amount without unit when showUnit is false', () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 100,
          showUnit: false,
        },
      })

      expect(wrapper.text()).toBe('100.00')
      expect(wrapper.text()).not.toContain('HCU')
    })

    it('should have proper CSS class applied', () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 100,
        },
      })

      expect(wrapper.find('.resource-display').exists()).toBe(true)
      expect(wrapper.element.tagName).toBe('SPAN')
    })

    it('should apply currency color styling', () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 100,
        },
      })

      const element = wrapper.find('.resource-display')
      expect(element.attributes('style')).toMatch(/color:\s*(#ffffff|rgb\(255,\s*255,\s*255\))/)
    })
  })

  describe('Multiple Currency Support', () => {
    it('should display different currency symbols', () => {
      const hcuWrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 100,
        },
      })

      const rdWrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'rd',
          amount: 100,
        },
      })

      expect(hcuWrapper.text()).toBe('100.00 HCU')
      expect(rdWrapper.text()).toBe('100.00 RD')
    })

    it('should apply different currency colors', () => {
      const hcuWrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 100,
        },
      })

      const rdWrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'rd',
          amount: 100,
        },
      })

      expect(hcuWrapper.find('.resource-display').attributes('style')).toMatch(
        /color:\s*(#ffffff|rgb\(255,\s*255,\s*255\))/,
      )
      expect(rdWrapper.find('.resource-display').attributes('style')).toMatch(
        /color:\s*(#ff6b35|rgb\(255,\s*107,\s*53\))/,
      )
    })
  })

  describe('Number Formatting', () => {
    it('should format all currency ranges correctly', () => {
      mathTestCases.resourceFormatting.forEach(({ input, expected }) => {
        const wrapper = mount(CurrencyDisplay, {
          props: {
            resourceId: 'hcu',
            amount: input,
          },
        })

        expect(wrapper.text()).toBe(expected)
      })
    })

    it('should handle zero correctly', () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 0,
        },
      })

      expect(wrapper.text()).toBe('0.00 HCU')
    })

    it('should handle negative numbers', () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: -50,
        },
      })

      expect(wrapper.text()).toBe('-50.00 HCU')
    })

    it('should handle decimal numbers correctly', () => {
      const testCases = [
        { input: 1.5, expected: '1.50 HCU' },
        { input: 0.1, expected: '0.10 HCU' },
        { input: 0.01, expected: '0.01 HCU' },
        { input: 999.99, expected: '999.99 HCU' },
        { input: 1234.56, expected: '1.23K HCU' },
      ]

      testCases.forEach(({ input, expected }) => {
        const wrapper = mount(CurrencyDisplay, {
          props: {
            resourceId: 'hcu',
            amount: input,
          },
        })

        expect(wrapper.text()).toBe(expected)
      })
    })
  })

  describe('Large Number Formatting', () => {
    it('should format thousands correctly', () => {
      const testCases = [
        { input: 1000, expected: '1.00K HCU' },
        { input: 1500, expected: '1.50K HCU' },
        { input: 999000, expected: '999.00K HCU' },
      ]

      testCases.forEach(({ input, expected }) => {
        const wrapper = mount(CurrencyDisplay, {
          props: {
            resourceId: 'hcu',
            amount: input,
          },
        })

        expect(wrapper.text()).toBe(expected)
      })
    })

    it('should format millions correctly', () => {
      const testCases = [
        { input: 1000000, expected: '1.00M HCU' },
        { input: 2500000, expected: '2.50M HCU' },
        { input: 999000000, expected: '999.00M HCU' },
      ]

      testCases.forEach(({ input, expected }) => {
        const wrapper = mount(CurrencyDisplay, {
          props: {
            resourceId: 'hcu',
            amount: input,
          },
        })

        expect(wrapper.text()).toBe(expected)
      })
    })

    it('should format billions correctly', () => {
      const testCases = [
        { input: 1000000000, expected: '1.00B HCU' },
        { input: 3750000000, expected: '3.75B HCU' },
        { input: 999000000000, expected: '999.00B HCU' },
      ]

      testCases.forEach(({ input, expected }) => {
        const wrapper = mount(CurrencyDisplay, {
          props: {
            resourceId: 'hcu',
            amount: input,
          },
        })

        expect(wrapper.text()).toBe(expected)
      })
    })

    it('should format trillions correctly', () => {
      const testCases = [
        { input: 1000000000000, expected: '1.00T HCU' },
        { input: 5250000000000, expected: '5.25T HCU' },
        { input: 999000000000000, expected: '999.00T HCU' },
      ]

      testCases.forEach(({ input, expected }) => {
        const wrapper = mount(CurrencyDisplay, {
          props: {
            resourceId: 'hcu',
            amount: input,
          },
        })

        expect(wrapper.text()).toBe(expected)
      })
    })

    it('should format quadrillions correctly', () => {
      const testCases = [
        { input: 1000000000000000, expected: '1.00Q HCU' },
        { input: 7800000000000000, expected: '7.80Q HCU' },
        { input: 999000000000000000, expected: '999.00Q HCU' },
      ]

      testCases.forEach(({ input, expected }) => {
        const wrapper = mount(CurrencyDisplay, {
          props: {
            resourceId: 'hcu',
            amount: input,
          },
        })

        expect(wrapper.text()).toBe(expected)
      })
    })

    it('should use scientific notation for extremely large numbers', () => {
      const testCases = [
        { input: 1e18, expected: '1.00e+18 HCU' },
        { input: 1.5e20, expected: '1.50e+20 HCU' },
        { input: 9.99e25, expected: '9.99e+25 HCU' },
      ]

      testCases.forEach(({ input, expected }) => {
        const wrapper = mount(CurrencyDisplay, {
          props: {
            resourceId: 'hcu',
            amount: input,
          },
        })

        expect(wrapper.text()).toBe(expected)
      })
    })
  })

  describe('Unit Display Control', () => {
    it('should show unit by default', () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 1000,
        },
      })

      expect(wrapper.text()).toContain('HCU')
    })

    it('should hide unit when showUnit is false for all formats', () => {
      const testCases = [
        100, // Basic
        1000, // K
        1000000, // M
        1000000000, // B
        1000000000000, // T
        1000000000000000, // Q
        1e18, // Scientific
      ]

      testCases.forEach((amount) => {
        const wrapper = mount(CurrencyDisplay, {
          props: {
            resourceId: 'hcu',
            amount,
            showUnit: false,
          },
        })

        expect(wrapper.text()).not.toContain('HCU')
        expect(wrapper.text()).not.toContain(' ')
      })
    })

    it('should show unit when showUnit is explicitly true', () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 1000,
          showUnit: true,
        },
      })

      expect(wrapper.text()).toBe('1.00K HCU')
    })
  })

  describe('Reactivity', () => {
    it('should update when amount prop changes', async () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 100,
        },
      })

      expect(wrapper.text()).toBe('100.00 HCU')

      await wrapper.setProps({ amount: 1000 })

      expect(wrapper.text()).toBe('1.00K HCU')
    })

    it('should update when showUnit prop changes', async () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 100,
          showUnit: true,
        },
      })

      expect(wrapper.text()).toBe('100.00 HCU')

      await wrapper.setProps({ showUnit: false })

      expect(wrapper.text()).toBe('100.00')
    })

    it('should update when currencyConfig changes', async () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 100,
        },
      })

      expect(wrapper.text()).toBe('100.00 HCU')

      await wrapper.setProps({ resourceId: 'rd' })

      expect(wrapper.text()).toBe('100.00 RD')
    })

    it('should handle rapid prop changes', async () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 100,
        },
      })

      // Rapidly change amounts
      const amounts = [1000, 1000000, 1000000000, 1e18, 50]

      for (const amount of amounts) {
        await wrapper.setProps({ amount })
        expect(wrapper.text()).toMatch(/[\d.,]+/)
      }

      expect(wrapper.text()).toBe('50.00 HCU')
    })
  })

  describe('Edge Cases', () => {
    it('should handle Infinity', () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: Infinity,
        },
      })

      expect(wrapper.text()).toContain('Infinity')
    })

    it('should handle NaN', () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: NaN,
        },
      })

      expect(wrapper.text()).toContain('NaN')
    })

    it('should handle very small positive numbers', () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 0.001,
        },
      })

      expect(wrapper.text()).toBe('0.00 HCU')
    })

    it('should handle very small negative numbers', () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: -0.001,
        },
      })

      expect(wrapper.text()).toBe('-0.00 HCU')
    })

    it('should handle maximum safe integer', () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: Number.MAX_SAFE_INTEGER,
        },
      })

      // MAX_SAFE_INTEGER is about 9e15, so it should format as quadrillions
      expect(wrapper.text()).toMatch(/\d+\.\d{2}Q HCU/)
    })

    it('should handle minimum safe integer', () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: Number.MIN_SAFE_INTEGER,
        },
      })

      // MIN_SAFE_INTEGER is about -9e15, formatted as large negative number with decimals
      expect(wrapper.text()).toMatch(/-\d+\.\d{2} HCU/)
    })

    it('should handle floating point precision issues', () => {
      // Test common floating point precision issues
      const testCases = [
        0.1 + 0.2, // Should be 0.3 but might be 0.30000000000000004
        1.1 + 1.2, // Should be 2.3
        10.1 - 10, // Should be 0.1
      ]

      testCases.forEach((amount) => {
        const wrapper = mount(CurrencyDisplay, {
          props: {
            resourceId: 'hcu',
            amount,
          },
        })

        // Should format to 2 decimal places, handling precision issues
        expect(wrapper.text()).toMatch(/\d+\.\d{2} HCU/)
      })
    })
  })

  describe('Performance', () => {
    it('should handle multiple instances efficiently', () => {
      const testCases = [
        { amount: 100, expected: '100.00 HCU' },
        { amount: 1000, expected: '1.00K HCU' },
        { amount: 1000000, expected: '1.00M HCU' },
        { amount: 1000000000, expected: '1.00B HCU' },
      ]

      const wrappers = testCases.map(({ amount }) =>
        mount(CurrencyDisplay, {
          props: {
            resourceId: 'hcu',
            amount,
          },
        }),
      )

      wrappers.forEach((wrapper, index) => {
        expect(wrapper.text()).toBe(testCases[index].expected)
      })

      // Clean up
      wrappers.forEach((wrapper) => wrapper.unmount())
    })

    it('should not cause memory leaks with computed properties', async () => {
      const wrapper = mount(CurrencyDisplay, {
        props: {
          resourceId: 'hcu',
          amount: 100,
        },
      })

      // Change props many times to test computed property cleanup
      for (let i = 0; i < 100; i++) {
        await wrapper.setProps({ amount: Math.random() * 1000000 })
      }

      // Should not throw or cause issues
      expect(() => wrapper.unmount()).not.toThrow()
    })
  })

  describe('Integration with Game Values', () => {
    it('should handle typical game progression values', () => {
      // Test values that would typically appear in the game
      const gameValues = [
        { amount: 0, stage: 'start' },
        { amount: 10, stage: 'first purchase' },
        { amount: 100, stage: 'early game' },
        { amount: 1500, stage: 'mid game' },
        { amount: 50000, stage: 'late game' },
        { amount: 1000000, stage: 'prestige ready' },
        { amount: 1e15, stage: 'high prestige' },
      ]

      gameValues.forEach(({ amount }) => {
        const wrapper = mount(CurrencyDisplay, {
          props: {
            resourceId: 'hcu',
            amount,
          },
        })

        const text = wrapper.text()
        expect(text).toMatch(/[\d.,KMBTQe+-]+\s*HCU$/)
        expect(text.length).toBeGreaterThan(0)
        expect(text.length).toBeLessThan(20) // Reasonable length for UI
      })
    })

    it('should format fractional values from game calculations', () => {
      // Test fractional values that might come from game calculations
      const fractionalValues = [
        1.25, // Click value with prestige
        2.375, // Production rate with upgrades
        0.05, // Very small production
        156.789, // Complex calculation result
      ]

      fractionalValues.forEach((amount) => {
        const wrapper = mount(CurrencyDisplay, {
          props: {
            resourceId: 'hcu',
            amount,
          },
        })

        const text = wrapper.text()
        expect(text).toMatch(/\d+\.\d{2} HCU/)
      })
    })
  })
})
