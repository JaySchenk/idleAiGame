import { describe, it, expect } from 'vitest'
import { useFormatters } from '../useFormatters'
import type { ResourceConfig } from '../../config/resources'

const { formatResource } = useFormatters()

describe('useFormatters', () => {
  const mockResource: ResourceConfig = {
    id: 'test',
    name: 'Test Resource',
    displayName: 'Test Resource',
    symbol: 'TR',
    initialValue: 0,
    isDepletable: false,
    healthyWhenHigh: true,
    visualIndicators: {
      healthy: '#00ff00',
      warning: '#ffff00',
      critical: '#ff0000',
    },
  }

  describe('formatResource', () => {
    it('should handle undefined resource config', () => {
      expect(formatResource(undefined, 100)).toBe('100')
    })

    it('should format small numbers with 2 decimals', () => {
      expect(formatResource(mockResource, 0)).toBe('0.00 TR')
      expect(formatResource(mockResource, 1.5)).toBe('1.50 TR')
      expect(formatResource(mockResource, 999.99)).toBe('999.99 TR')
    })

    it('should format thousands', () => {
      expect(formatResource(mockResource, 1000)).toBe('1.00K TR')
      expect(formatResource(mockResource, 1500)).toBe('1.50K TR')
      expect(formatResource(mockResource, 999999)).toBe('1000.00K TR')
    })

    it('should format millions', () => {
      expect(formatResource(mockResource, 1000000)).toBe('1.00M TR')
      expect(formatResource(mockResource, 1500000)).toBe('1.50M TR')
    })

    it('should format billions', () => {
      expect(formatResource(mockResource, 1000000000)).toBe('1.00B TR')
      expect(formatResource(mockResource, 1500000000)).toBe('1.50B TR')
    })

    it('should format trillions', () => {
      expect(formatResource(mockResource, 1000000000000)).toBe('1.00T TR')
      expect(formatResource(mockResource, 1500000000000)).toBe('1.50T TR')
    })

    it('should format quadrillions', () => {
      expect(formatResource(mockResource, 1000000000000000)).toBe('1.00Q TR')
      expect(formatResource(mockResource, 1500000000000000)).toBe('1.50Q TR')
    })

    it('should use scientific notation for very large numbers', () => {
      expect(formatResource(mockResource, 1e18)).toBe('1.00e+18 TR')
      expect(formatResource(mockResource, 1.5e20)).toBe('1.50e+20 TR')
    })

    it('should handle showUnit parameter', () => {
      expect(formatResource(mockResource, 1000, false)).toBe('1.00K')
      expect(formatResource(mockResource, 1000, true)).toBe('1.00K TR')
    })

    it('should handle negative numbers', () => {
      expect(formatResource(mockResource, -42.5)).toBe('-42.50 TR')
    })

    it('should handle null resource config', () => {
      expect(formatResource(null as unknown as ResourceConfig, 42)).toBe('42')
    })
  })
})
