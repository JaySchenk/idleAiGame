/**
 * Global component mocks for testing
 */

/**
 * Common component mocks used across tests
 */
export const getAllComponentMocks = () => ({
  CurrencyDisplay: {
    name: 'CurrencyDisplay',
    props: ['resourceId', 'amount', 'showUnit'],
    template:
      '<span class="currency-display">{{ amount }}{{ showUnit !== false ? ` ${resourceId.toUpperCase()}` : "" }}</span>',
  },
  ResourceDisplay: {
    name: 'ResourceDisplay',
    props: ['resourceId', 'title'],
    template: '<div class="resource-display">{{ title || resourceId }}</div>',
  },
  ManualClickerButton: {
    name: 'ManualClickerButton',
    template: '<button class="manual-clicker" @click="$emit(\'click\')">Click</button>',
    emits: ['click'],
  },
  GeneratorPurchaseButton: {
    name: 'GeneratorPurchaseButton',
    props: ['generatorId', 'generatorName'],
    template:
      '<button class="generator-purchase" @click="$emit(\'purchase\')">Purchase {{ generatorName || generatorId }}</button>',
    emits: ['purchase'],
  },
  UpgradeButton: {
    name: 'UpgradeButton',
    props: ['upgradeId', 'upgradeName'],
    template:
      '<button class="upgrade-button" @click="$emit(\'purchase\')">{{ upgradeName || "Upgrade" }}</button>',
    emits: ['purchase'],
  },
  PrestigeButton: {
    name: 'PrestigeButton',
    template: '<button class="prestige-button" @click="$emit(\'prestige\')">Prestige</button>',
    emits: ['prestige'],
  },
  NarrativeDisplay: {
    name: 'NarrativeDisplay',
    props: ['narrative'],
    template: '<div class="narrative-display">{{ narrative?.text || "Narrative" }}</div>',
  },
  ProgressBar: {
    name: 'ProgressBar',
    props: ['current', 'max', 'label'],
    template: '<div class="progress-bar">{{ label }}: {{ current }}/{{ max }}</div>',
  },
})
