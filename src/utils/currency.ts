const DEFAULT_CURRENCY = 'INR'

/**
 * Format a number as currency using Indian digit grouping by default.
 * Examples: ₹1,25,000, ₹4,250.
 */
export function formatCurrency(
  value: number,
  currencyCode: string = DEFAULT_CURRENCY,
  opts: { compact?: boolean; sign?: boolean } = {},
): string {
  const { compact = false, sign = false } = opts

  let formatted: string
  try {
    formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      notation: compact ? 'compact' : 'standard',
      minimumFractionDigits: 0,
      maximumFractionDigits: compact ? 1 : 2,
    }).format(Math.abs(value))
  } catch {
    // Fall back gracefully if an unsupported currency code is provided.
    formatted = `₹${Math.abs(value).toLocaleString('en-IN')}`
  }

  if (sign) {
    if (value > 0) return `+${formatted}`
    if (value < 0) return `-${formatted}`
  }
  return formatted
}

/** Parse a user-typed amount into a positive number. Returns null when invalid. */
export function parseAmount(input: string): number | null {
  if (typeof input !== 'string') return null
  const cleaned = input.replace(/[₹$,]/g, '').trim()
  if (cleaned === '') return null
  const number = Number(cleaned)
  if (!Number.isFinite(number) || number <= 0) return null
  return number
}
