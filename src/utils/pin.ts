const encoder = new TextEncoder()

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Generate a random hex salt used when hashing the PIN. */
export function generateSalt(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return toHex(bytes.buffer)
}

/** SHA-256 hash of `salt:pin`, hex-encoded. Never stores the PIN itself. */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = encoder.encode(`${salt}:${pin}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toHex(digest)
}

/** Web Crypto is only available in secure contexts (HTTPS / localhost). */
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
}

/** A PIN must be 4–6 digits. */
export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin)
}
