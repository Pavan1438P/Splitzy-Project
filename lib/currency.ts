/**
 * Format amount as Indian Rupee style with 2 decimals.
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)} Rs`
}

/**
 * Suggest integer split values that sum to a rounded total.
 * Example: 100 / 3 => [40, 30, 30]
 */
export function suggestEqualSplits(amount: number, numSplits: number): number[] {
  if (numSplits <= 0) return []

  const roundedAmount = Math.round(amount)
  const baseAmount = Math.floor(roundedAmount / numSplits / 10) * 10

  const splits = Array(numSplits).fill(baseAmount)
  let remaining = roundedAmount - baseAmount * numSplits

  let index = 0
  while (remaining >= 10) {
    splits[index % numSplits] += 10
    remaining -= 10
    index += 1
  }

  for (let i = 0; i < remaining; i += 1) {
    splits[i % numSplits] += 1
  }

  return splits
}

/**
 * True when value has a non-zero decimal part.
 */
export function hasDecimal(value: number): boolean {
  return Math.abs(value - Math.round(value)) > 0.0001
}
