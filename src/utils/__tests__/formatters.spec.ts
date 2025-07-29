import { describe, it, expect } from 'vitest'
import { formatResource } from '../formatters'
import type { ResourceConfig } from '../../config/resources'

describe('formatResource', () => {
  const mockResourceConfig: ResourceConfig = {
    id: 'hcu',
    name: 'Hollow Content Units',
    symbol: 'HCU',
    baseValue: 1,
    description: 'Primary currency of the hollow content empire',
  }

  describe('Basic Formatting', () => {
    it('formats whole numbers with unit', () => {
      expect(formatResource(mockResourceConfig, 42)).toBe('42.00 HCU')
    })

    it('formats decimal numbers with unit', () => {
      expect(formatResource(mockResourceConfig, 42.567)).toBe('42.57 HCU')
    })

    it('formats zero correctly', () => {
      expect(formatResource(mockResourceConfig, 0)).toBe('0.00 HCU')
    })

    it('formats negative numbers', () => {
      expect(formatResource(mockResourceConfig, -42.5)).toBe('-42.50 HCU')
    })
  })

  describe('Unit Display Control', () => {
    it('shows unit when showUnit is true', () => {
      expect(formatResource(mockResourceConfig, 100, true)).toBe('100.00 HCU')
    })

    it('hides unit when showUnit is false', () => {
      expect(formatResource(mockResourceConfig, 100, false)).toBe('100.00')
    })

    it('defaults to showing unit when showUnit not specified', () => {
      expect(formatResource(mockResourceConfig, 100)).toBe('100.00 HCU')
    })
  })

  describe('Thousands (K)', () => {
    it('formats thousands correctly', () => {
      expect(formatResource(mockResourceConfig, 1000)).toBe('1.00K HCU')
      expect(formatResource(mockResourceConfig, 1500)).toBe('1.50K HCU')
      expect(formatResource(mockResourceConfig, 999)).toBe('999.00 HCU')
    })

    it('formats large thousands', () => {
      expect(formatResource(mockResourceConfig, 999999)).toBe('1000.00K HCU')
    })
  })

  describe('Millions (M)', () => {
    it('formats millions correctly', () => {
      expect(formatResource(mockResourceConfig, 1000000)).toBe('1.00M HCU')
      expect(formatResource(mockResourceConfig, 2500000)).toBe('2.50M HCU')
      expect(formatResource(mockResourceConfig, 999000)).toBe('999.00K HCU')
    })

    it('formats large millions', () => {
      expect(formatResource(mockResourceConfig, 999999999)).toBe('1000.00M HCU')
    })
  })

  describe('Billions (B)', () => {
    it('formats billions correctly', () => {
      expect(formatResource(mockResourceConfig, 1000000000)).toBe('1.00B HCU')
      expect(formatResource(mockResourceConfig, 3750000000)).toBe('3.75B HCU')
    })
  })

  describe('Trillions (T)', () => {
    it('formats trillions correctly', () => {
      expect(formatResource(mockResourceConfig, 1000000000000)).toBe('1.00T HCU')
      expect(formatResource(mockResourceConfig, 5250000000000)).toBe('5.25T HCU')
    })
  })

  describe('Quadrillions (Q)', () => {
    it('formats quadrillions correctly', () => {
      expect(formatResource(mockResourceConfig, 1000000000000000)).toBe('1.00Q HCU')
      expect(formatResource(mockResourceConfig, 7890000000000000)).toBe('7.89Q HCU')
    })
  })

  describe('Scientific Notation', () => {
    it('uses scientific notation for very large numbers', () => {
      const result = formatResource(mockResourceConfig, 1e18)
      expect(result).toBe('1.00e+18 HCU')
    })

    it('uses scientific notation for extremely large numbers', () => {
      const result = formatResource(mockResourceConfig, 1.23e25)
      expect(result).toBe('1.23e+25 HCU')
    })

    it('handles scientific notation without unit', () => {
      const result = formatResource(mockResourceConfig, 1e18, false)
      expect(result).toBe('1.00e+18')
    })
  })

  describe('Precision and Rounding', () => {
    it('rounds to 2 decimal places consistently', () => {
      expect(formatResource(mockResourceConfig, 1234.567)).toBe('1.23K HCU')
      expect(formatResource(mockResourceConfig, 1234567.89)).toBe('1.23M HCU')
      expect(formatResource(mockResourceConfig, 1234567890123)).toBe('1.23T HCU')
    })

    it('handles edge cases in rounding', () => {
      expect(formatResource(mockResourceConfig, 1999.99)).toBe('2.00K HCU')
      expect(formatResource(mockResourceConfig, 999.994)).toBe('999.99 HCU')
      expect(formatResource(mockResourceConfig, 999.996)).toBe('1000.00 HCU')
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined resource config', () => {
      expect(formatResource(undefined, 42)).toBe('42')
    })

    it('handles null resource config', () => {
      expect(formatResource(null as unknown as ResourceConfig, 42)).toBe('42')
    })

    it('handles NaN input', () => {
      expect(formatResource(mockResourceConfig, NaN)).toBe('NaN HCU')
    })

    it('handles Infinity', () => {
      expect(formatResource(mockResourceConfig, Infinity)).toBe('Infinity HCU')
    })

    it('handles very small decimal numbers', () => {
      expect(formatResource(mockResourceConfig, 0.001)).toBe('0.00 HCU')
      expect(formatResource(mockResourceConfig, 0.009)).toBe('0.01 HCU')
    })
  })

  describe('Resource Config Variations', () => {
    it('works with different symbols', () => {
      const customResource = {
        ...mockResourceConfig,
        symbol: '$',
      }
      expect(formatResource(customResource, 1000)).toBe('1.00K $')
    })

    it('works with empty symbol', () => {
      const customResource = {
        ...mockResourceConfig,
        symbol: '',
      }
      expect(formatResource(customResource, 1000)).toBe('1.00K ')
    })

    it('works with long symbol', () => {
      const customResource = {
        ...mockResourceConfig,
        symbol: 'POINTS',
      }
      expect(formatResource(customResource, 1000)).toBe('1.00K POINTS')
    })
  })

  describe('Boundary Testing', () => {
    it('tests exact scale boundaries', () => {
      expect(formatResource(mockResourceConfig, 999.99)).toBe('999.99 HCU')
      expect(formatResource(mockResourceConfig, 1000)).toBe('1.00K HCU')

      expect(formatResource(mockResourceConfig, 999999.99)).toBe('1000.00K HCU')
      expect(formatResource(mockResourceConfig, 1000000)).toBe('1.00M HCU')

      expect(formatResource(mockResourceConfig, 999999999.99)).toBe('1000.00M HCU')
      expect(formatResource(mockResourceConfig, 1000000000)).toBe('1.00B HCU')
    })
  })
})
