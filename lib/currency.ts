/**
 * Format amount as Indian Rupee style with 2 decimals.
 */
export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount * 100) / 100
  const formatted = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2)
  return `₹${formatted} Rs`
}

/**
 * Suggest integer split values that sum to a rounded total.
 * Example: 100 / 3 => [34, 33, 33]
 */
export function suggestEqualSplits(amount: number, numSplits: number): number[] {
  if (numSplits <= 0) return []

  const roundedAmount = Math.round(amount)
  const baseAmount = Math.floor(roundedAmount / numSplits)
  const remainder = roundedAmount % numSplits

  const splits: number[] = []
  for (let i = 0; i < numSplits; i++) {
    splits.push(i < remainder ? baseAmount + 1 : baseAmount)
  }

  return splits
}

/**
 * True when value has a non-zero decimal part.
 */
export function hasDecimal(value: number): boolean {
  return Math.abs(value - Math.round(value)) > 0.0001
}
