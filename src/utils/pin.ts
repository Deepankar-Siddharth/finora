/** A secret must be 4–6 digits. */
export function isValidSecret(value: string): boolean {
  return /^\d{4,6}$/.test(value)
}