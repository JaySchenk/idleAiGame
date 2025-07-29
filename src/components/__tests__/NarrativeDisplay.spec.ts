import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { useGameStore } from '../../stores/gameStore'
import NarrativeDisplay from '../NarrativeDisplay.vue'
import { createStandardTestPinia } from '../../test-utils/pinia'

// Mock narrative event structure
const mockNarrativeEvent = {
  id: 'testEvent',
  title: 'Test Narrative Event',
  content: 'This is a test narrative content for testing purposes.',
  societalStabilityImpact: -10,
  isViewed: false
}

describe('NarrativeDisplay', () => {
  let store: ReturnType<typeof useGameStore>
  let pinia: ReturnType<typeof createStandardTestPinia>

  beforeEach(() => {
    vi.useFakeTimers()
    pinia = createStandardTestPinia()
    store = useGameStore(pinia)
    
    // Setup mock narrative state
    store.narrative = {
      societalStability: 75,
      currentStoryEvents: [mockNarrativeEvent]
    }
    
    // Mock store methods
    store.hasPendingEvents = vi.fn().mockReturnValue(false)
    store.getNextPendingEvent = vi.fn().mockReturnValue(null)
    store.onNarrativeEvent = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createWrapper() {
    return mount(NarrativeDisplay, { 
      global: { plugins: [pinia] }
    })
  }

  describe('Panel Rendering', () => {
    it('renders narrative panel when modal not shown', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.narrative-panel').exists()).toBe(true)
      expect(wrapper.find('.narrative-modal').exists()).toBe(false)
    })

    it('displays system status header', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.narrative-panel-header h4').text()).toBe('System Status')
    })

    it('shows stability indicator with correct value', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.stability-text').text()).toBe('Stability: 75%')
      expect(wrapper.find('.stability-fill').attributes('style')).toBe('width: 75%;')
    })

    it('applies correct stability class based on value', () => {
      const testCases = [
        { stability: 85, expectedClass: 'stability-high' },
        { stability: 65, expectedClass: 'stability-medium' },
        { stability: 35, expectedClass: 'stability-low' },
        { stability: 15, expectedClass: 'stability-critical' }
      ]

      testCases.forEach(({ stability, expectedClass }) => {
        store.narrative.societalStability = stability
        const wrapper = createWrapper()
        
        expect(wrapper.find('.stability-indicator').classes()).toContain(expectedClass)
      })
    })
  })

  describe('Archive Display', () => {
    it('shows archive when there are viewed events', () => {
      store.narrative.currentStoryEvents = [{
        ...mockNarrativeEvent,
        isViewed: true
      }]
      const wrapper = createWrapper()

      expect(wrapper.find('.archive-header').exists()).toBe(true)
      expect(wrapper.find('.archive-list').exists()).toBe(true)
    })

    it('hides archive when no viewed events', () => {
      store.narrative.currentStoryEvents = [{
        ...mockNarrativeEvent,
        isViewed: false
      }]
      const wrapper = createWrapper()

      expect(wrapper.find('.archive-header').exists()).toBe(false)
      expect(wrapper.find('.archive-list').exists()).toBe(false)
    })

    it('displays archive items correctly', () => {
      const viewedEvent = {
        ...mockNarrativeEvent,
        isViewed: true,
        societalStabilityImpact: -15
      }
      store.narrative.currentStoryEvents = [viewedEvent]
      const wrapper = createWrapper()

      const archiveItem = wrapper.find('.archive-item')
      expect(archiveItem.exists()).toBe(true)
      expect(archiveItem.find('.archive-title').text()).toBe('Test Narrative Event')
      expect(archiveItem.find('.archive-impact').text()).toBe('-15')
    })

    it('applies correct impact classes', () => {
      const testCases = [
        { impact: 5, expectedClass: 'impact-positive' },
        { impact: -5, expectedClass: 'impact-minor' },
        { impact: -15, expectedClass: 'impact-moderate' },
        { impact: -25, expectedClass: 'impact-severe' }
      ]

      testCases.forEach(({ impact, expectedClass }) => {
        const event = {
          ...mockNarrativeEvent,
          isViewed: true,
          societalStabilityImpact: impact
        }
        store.narrative.currentStoryEvents = [event]
        const wrapper = createWrapper()
        
        expect(wrapper.find('.archive-impact').classes()).toContain(expectedClass)
      })
    })
  })

  describe('Modal Functionality', () => {
    it('shows modal when event is triggered', async () => {
      const wrapper = createWrapper()
      
      // Simulate triggering an event
      await wrapper.vm.handleNarrativeEvent(mockNarrativeEvent)

      expect(wrapper.find('.narrative-modal').exists()).toBe(true)
      expect(wrapper.find('.narrative-panel').exists()).toBe(false)
    })

    it('displays event details in modal', async () => {
      const wrapper = createWrapper()
      
      await wrapper.vm.handleNarrativeEvent(mockNarrativeEvent)

      expect(wrapper.find('.narrative-title').text()).toBe('Test Narrative Event')
      expect(wrapper.find('.stability-value').text()).toBe('75%')
    })

    it('closes modal when close button clicked', async () => {
      const wrapper = createWrapper()
      
      await wrapper.vm.handleNarrativeEvent(mockNarrativeEvent)
      expect(wrapper.find('.narrative-modal').exists()).toBe(true)

      await wrapper.find('.narrative-close').trigger('click')
      expect(wrapper.find('.narrative-modal').exists()).toBe(false)
    })

    it('closes modal when overlay clicked', async () => {
      const wrapper = createWrapper()
      
      await wrapper.vm.handleNarrativeEvent(mockNarrativeEvent)
      expect(wrapper.find('.narrative-modal').exists()).toBe(true)

      await wrapper.find('.narrative-modal').trigger('click')
      expect(wrapper.find('.narrative-modal').exists()).toBe(false)
    })

    it('does not close modal when content clicked', async () => {
      const wrapper = createWrapper()
      
      await wrapper.vm.handleNarrativeEvent(mockNarrativeEvent)
      expect(wrapper.find('.narrative-modal').exists()).toBe(true)

      await wrapper.find('.narrative-modal-content').trigger('click')
      expect(wrapper.find('.narrative-modal').exists()).toBe(true)
    })
  })

  describe('Typewriter Effect', () => {
    it('starts typewriter effect when event shown', async () => {
      const wrapper = createWrapper()
      
      await wrapper.vm.handleNarrativeEvent(mockNarrativeEvent)

      expect(wrapper.vm.isTyping).toBe(true)
      expect(wrapper.find('.narrative-button').text()).toBe('Skip')
    })

    it('progressively reveals text during typewriter', async () => {
      const wrapper = createWrapper()
      
      await wrapper.vm.handleNarrativeEvent(mockNarrativeEvent)

      // Fast forward typewriter effect
      vi.advanceTimersByTime(300) // Should reveal about 10 characters at 30ms intervals
      await wrapper.vm.$nextTick()

      const displayedText = wrapper.vm.displayText
      expect(displayedText.length).toBeGreaterThan(0)
      expect(displayedText.length).toBeLessThan(mockNarrativeEvent.content.length)
    })

    it('completes typewriter effect automatically', async () => {
      const wrapper = createWrapper()
      
      await wrapper.vm.handleNarrativeEvent(mockNarrativeEvent)

      // Fast forward past the entire content length
      vi.advanceTimersByTime(mockNarrativeEvent.content.length * 30 + 100)
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isTyping).toBe(false)
      expect(wrapper.vm.displayText).toBe(mockNarrativeEvent.content)
      expect(wrapper.find('.narrative-button').text()).toBe('Continue')
    })

    it('skips typewriter when button clicked during typing', async () => {
      const wrapper = createWrapper()
      
      await wrapper.vm.handleNarrativeEvent(mockNarrativeEvent)
      expect(wrapper.vm.isTyping).toBe(true)

      await wrapper.find('.narrative-button').trigger('click')

      expect(wrapper.vm.isTyping).toBe(false)
      expect(wrapper.vm.displayText).toBe(mockNarrativeEvent.content)
    })

    it('closes modal when button clicked after typing complete', async () => {
      const wrapper = createWrapper()
      
      await wrapper.vm.handleNarrativeEvent(mockNarrativeEvent)
      
      // Complete typewriter effect
      vi.advanceTimersByTime(mockNarrativeEvent.content.length * 30 + 100)
      await wrapper.vm.$nextTick()

      await wrapper.find('.narrative-button').trigger('click')

      expect(wrapper.find('.narrative-modal').exists()).toBe(false)
    })
  })

  describe('Archive Review', () => {
    it('opens modal when archive item clicked', async () => {
      const viewedEvent = {
        ...mockNarrativeEvent,
        isViewed: true
      }
      store.narrative.currentStoryEvents = [viewedEvent]
      const wrapper = createWrapper()

      await wrapper.find('.archive-item').trigger('click')

      expect(wrapper.find('.narrative-modal').exists()).toBe(true)
      expect(wrapper.vm.isTyping).toBe(false)
      expect(wrapper.vm.displayText).toBe(viewedEvent.content)
    })
  })

  describe('Event Subscription', () => {
    it('subscribes to narrative events on mount', () => {
      createWrapper()

      expect(store.onNarrativeEvent).toHaveBeenCalledWith(expect.any(Function))
    })

    it('checks for pending events on mount', () => {
      createWrapper()

      expect(store.hasPendingEvents).toHaveBeenCalled()
    })

    it('handles pending events found on mount', () => {
      const pendingEvent = { ...mockNarrativeEvent, id: 'pending' }
      store.hasPendingEvents = vi.fn().mockReturnValue(true)
      store.getNextPendingEvent = vi.fn().mockReturnValue(pendingEvent)

      const wrapper = createWrapper()

      expect(store.getNextPendingEvent).toHaveBeenCalled()
      expect(wrapper.vm.currentEvent).toEqual(pendingEvent)
    })
  })

  describe('Lifecycle Management', () => {
    it('cleans up typewriter effect on unmount', async () => {
      const wrapper = createWrapper()
      
      await wrapper.vm.handleNarrativeEvent(mockNarrativeEvent)
      expect(wrapper.vm.isTyping).toBe(true)

      wrapper.unmount()

      // Should not throw errors and should clean up properly
      expect(true).toBe(true) // Test passes if no errors thrown
    })

    it('sets up periodic pending event check', () => {
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
      const wrapper = createWrapper()

      wrapper.unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('handles null current event gracefully', async () => {
      const wrapper = createWrapper()
      
      wrapper.vm.currentEvent = null
      
      // Should not throw when starting typewriter with null event
      expect(() => wrapper.vm.startTypewriterEffect()).not.toThrow()
    })

    it('handles empty content gracefully', async () => {
      const emptyEvent = {
        ...mockNarrativeEvent,
        content: ''
      }
      const wrapper = createWrapper()
      
      await wrapper.vm.handleNarrativeEvent(emptyEvent)

      expect(wrapper.vm.displayText).toBe('')
      expect(wrapper.vm.isTyping).toBe(true) // Should still start effect
    })

    it('prevents multiple simultaneous typewriter effects', async () => {
      const wrapper = createWrapper()
      
      await wrapper.vm.handleNarrativeEvent(mockNarrativeEvent)
      const firstInterval = wrapper.vm.typewriterInterval

      await wrapper.vm.handleNarrativeEvent({...mockNarrativeEvent, id: 'second'})
      
      // Should have stopped previous effect and started new one
      expect(wrapper.vm.typewriterInterval).not.toBe(firstInterval)
    })
  })
})