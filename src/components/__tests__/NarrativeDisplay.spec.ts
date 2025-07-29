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
  unlockConditions: [],
  resourceEffects: [
    { resourceId: 'pt', amount: -5 },
    { resourceId: 'sc', amount: -3 },
  ],
  priority: 100,
  isViewed: false,
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
      currentStoryEvents: [mockNarrativeEvent],
      viewedEvents: [],
      pendingEvents: [],
      isNarrativeActive: false,
      gameStartTime: Date.now(),
    }

    // Mock store methods
    store.hasPendingEvents = vi.fn().mockReturnValue(false)
    store.getNextPendingEvent = vi.fn().mockReturnValue(null)
    store.onNarrativeEvent = vi.fn()

    // Mock getResourceConfig
    store.getResourceConfig = vi.fn().mockImplementation((resourceId) => {
      const configs = {
        pt: { symbol: 'PT', displayName: 'Public Trust' },
        sc: { symbol: 'SC', displayName: 'Social Cohesion' },
        hcu: { symbol: 'HCU', displayName: 'Hollow Content Units' },
      }
      return configs[resourceId]
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createWrapper() {
    return mount(NarrativeDisplay, {
      global: { plugins: [pinia] },
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

      expect(wrapper.find('.narrative-panel-header h4').text()).toBe('System Chronicle')
    })
  })

  describe('Archive Display', () => {
    it('shows archive when there are viewed events', () => {
      store.narrative.currentStoryEvents = [
        {
          ...mockNarrativeEvent,
          isViewed: true,
        },
      ]
      const wrapper = createWrapper()

      expect(wrapper.find('.archive-header').exists()).toBe(true)
      expect(wrapper.find('.archive-list').exists()).toBe(true)
    })

    it('hides archive when no viewed events', () => {
      store.narrative.currentStoryEvents = [
        {
          ...mockNarrativeEvent,
          isViewed: false,
        },
      ]
      const wrapper = createWrapper()

      expect(wrapper.find('.archive-header').exists()).toBe(false)
      expect(wrapper.find('.archive-list').exists()).toBe(false)
    })

    it('displays archive items correctly', () => {
      const viewedEvent = {
        ...mockNarrativeEvent,
        isViewed: true,
        resourceEffects: [{ resourceId: 'pt', amount: -10 }],
      }
      store.narrative.currentStoryEvents = [viewedEvent]
      const wrapper = createWrapper()

      const archiveItem = wrapper.find('.archive-item')
      expect(archiveItem.exists()).toBe(true)
      expect(archiveItem.find('.archive-title').text()).toBe('Test Narrative Event')
      expect(archiveItem.find('.archive-effects').text()).toBe('Public Trust -10')
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
      expect(wrapper.find('.effects-label').text()).toBe('Resource Effects:')
      expect(wrapper.findAll('.effect-item')).toHaveLength(2)
    })

    it('shows resource effects correctly in modal', async () => {
      const wrapper = createWrapper()

      await wrapper.vm.handleNarrativeEvent(mockNarrativeEvent)

      const effectItems = wrapper.findAll('.effect-item')
      expect(effectItems[0].find('.effect-resource').text()).toBe('Public Trust')
      expect(effectItems[0].find('.effect-value').text()).toBe('-5')
      expect(effectItems[1].find('.effect-resource').text()).toBe('Social Cohesion')
      expect(effectItems[1].find('.effect-value').text()).toBe('-3')
    })

    it('hides resource effects section when event has no effects', async () => {
      const eventWithoutEffects = {
        ...mockNarrativeEvent,
        resourceEffects: undefined,
      }
      const wrapper = createWrapper()

      await wrapper.vm.handleNarrativeEvent(eventWithoutEffects)

      expect(wrapper.find('.narrative-effects').exists()).toBe(false)
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

  describe('Archive Review', () => {
    it('opens modal when archive item clicked', async () => {
      const viewedEvent = {
        ...mockNarrativeEvent,
        isViewed: true,
      }
      store.narrative.currentStoryEvents = [viewedEvent]
      const wrapper = createWrapper()

      await wrapper.find('.archive-item').trigger('click')

      expect(wrapper.find('.narrative-modal').exists()).toBe(true)
      expect(wrapper.find('.narrative-title').text()).toBe('Test Narrative Event')
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
    it('sets up periodic pending event check', () => {
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
      const wrapper = createWrapper()

      wrapper.unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('handles events with empty resource effects', async () => {
      const eventWithoutEffects = {
        ...mockNarrativeEvent,
        resourceEffects: undefined,
      }
      const wrapper = createWrapper()

      await wrapper.vm.handleNarrativeEvent(eventWithoutEffects)

      expect(wrapper.find('.narrative-modal').exists()).toBe(true)
      expect(wrapper.find('.narrative-effects').exists()).toBe(false)
    })
  })
})
