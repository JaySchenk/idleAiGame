import type { CurrencyConfig } from '../config/currencies'

/**
 * Format currency amounts with appropriate unit scaling and symbols
 * @param currencyConfig - The currency configuration object
 * @param amount - The amount to format
 * @param showUnit - Whether to show the currency symbol (default: true)
 * @returns Formatted currency string
 */
export function formatCurrency(
  currencyConfig: CurrencyConfig | undefined,
  amount: number,
  showUnit: boolean = true,
): string {
  if (!currencyConfig) return amount.toString()

  const unit = showUnit ? ` ${currencyConfig.symbol}` : ''

  // Handle scientific notation for very large numbers
  if (amount >= 1e18) {
    return amount.toExponential(2) + unit
  }

  // Handle quadrillions
  if (amount >= 1e15) {
    return (amount / 1e15).toFixed(2) + 'Q' + unit
  }

  // Handle trillions
  if (amount >= 1e12) {
    return (amount / 1e12).toFixed(2) + 'T' + unit
  }

  // Handle billions
  if (amount >= 1e9) {
    return (amount / 1e9).toFixed(2) + 'B' + unit
  }

  // Handle millions
  if (amount >= 1e6) {
    return (amount / 1e6).toFixed(2) + 'M' + unit
  }

  // Handle thousands
  if (amount >= 1e3) {
    return (amount / 1e3).toFixed(2) + 'K' + unit
  }

  // Handle smaller numbers with 2 decimals
  return amount.toFixed(2) + unit
}
