export interface CurrencyConfig {
  id: string
  name: string
  displayName: string
  symbol: string
  initialValue: number
  color: string
}

export const currencies: CurrencyConfig[] = [
  {
    id: 'hcu',
    name: 'contentUnits',
    displayName: 'Hollow Content Units',
    symbol: 'HCU',
    initialValue: 0,
    color: '#ffffff', // White for clarity
  },
  {
    id: 'rd',
    name: 'rawData',
    displayName: 'Raw Data',
    symbol: 'RD',
    initialValue: 0,
    color: '#ff6b35', // Orange for data streams
  },
  {
    id: 'ha',
    name: 'humanAttention',
    displayName: 'Human Attention',
    symbol: 'HA',
    initialValue: 0,
    color: '#8b5cf6', // Purple for human cognition
  },
]

// Use string IDs for all currency operations:
// 'hcu' - Hollow Content Units
// 'rd' - Raw Data
// 'ha' - Human Attention
