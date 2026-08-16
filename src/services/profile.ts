import { storageService } from './storage.ts'

/**
 * Local profile + PIN authentication.
 *
 * The PIN is never stored. Only a PBKDF2-SHA-256 verifier (random 16-byte
 * salt, 200k iterations, 256-bit digest) is kept in the browser, so an entered
 * PIN can be checked without ever persisting it. Nothing here touches GitHub.
 */

const PROFILE_KEY = 'finora_profile'
const CRED_KEY = 'finora_sync'
const META_KEY = 'finora_sync_meta'

const STORAGE_VERSION = 1
const ITERATIONS = 200_000
const KEY_BITS = 256
const SALT_BYTES = 16

export interface PinVerifier {
  algorithm: 'PBKDF2-SHA256'
  iterations: number
  /** base64 */
  salt: string
  /** base64 of the derived key */
  hash: string
}

export interface ProfileData {
  name: string
  verifier: PinVerifier
  createdAt: string
}

interface ProfileEnvelope {
  version: number
  data: ProfileData
}

function bytesToBase64(bytes: Uint8Array<ArrayBuffer>): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Constant-time-ish compare used for PIN verification. */
function safeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

async function derive(pin: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array<ArrayBuffer>> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    KEY_BITS,
  )
  return new Uint8Array(bits)
}

export function loadProfile(): ProfileData | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const envelope = parsed as ProfileEnvelope
    if (envelope.version !== STORAGE_VERSION) return null
    const data = envelope.data
    if (
      typeof data !== 'object' ||
      data === null ||
      typeof data.name !== 'string' ||
      typeof data.verifier !== 'object' ||
      data.verifier === null ||
      typeof data.verifier.salt !== 'string' ||
      typeof data.verifier.hash !== 'string' ||
      typeof data.verifier.iterations !== 'number'
    ) {
      return null
    }
    return data
  } catch {
    return null
  }
}

export function hasProfile(): boolean {
  return loadProfile() !== null
}

function saveProfile(data: ProfileData): void {
  const envelope: ProfileEnvelope = { version: STORAGE_VERSION, data }
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(envelope))
  } catch {
    // Storage unavailable — the session continues in-memory without persistence.
  }
}

/** Create a profile and persist a PBKDF2 verifier for the chosen PIN. */
export async function createProfile(name: string, pin: string): Promise<ProfileData> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const derived = await derive(pin, salt, ITERATIONS)
  const verifier: PinVerifier = {
    algorithm: 'PBKDF2-SHA256',
    iterations: ITERATIONS,
    salt: bytesToBase64(salt),
    hash: bytesToBase64(derived),
  }
  const data: ProfileData = { name: name.trim(), verifier, createdAt: new Date().toISOString() }
  saveProfile(data)
  return data
}

export function updateProfileName(name: string): ProfileData | null {
  const current = loadProfile()
  if (!current) return null
  const next: ProfileData = { ...current, name: name.trim() }
  saveProfile(next)
  return next
}

/** True when the entered PIN matches the stored verifier. */
export async function verifyPin(pin: string): Promise<boolean> {
  const profile = loadProfile()
  if (!profile) return false
  try {
    const salt = base64ToBytes(profile.verifier.salt)
    const derived = await derive(pin, salt, profile.verifier.iterations)
    const expected = base64ToBytes(profile.verifier.hash)
    return safeEqual(derived, expected)
  } catch {
    return false
  }
}

export type PinChangeResult = 'ok' | 'wrong-current' | 'invalid'

/** Change the PIN after confirming the current one. */
export async function changePin(current: string, next: string): Promise<PinChangeResult> {
  if (!isValidPin(next)) return 'invalid'
  const currentOk = await verifyPin(current)
  if (!currentOk) return 'wrong-current'
  await createProfile(loadProfile()?.name ?? '', next)
  return 'ok'
}

export function deleteProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY)
  } catch {
    // Ignore storage errors.
  }
}

/** Remove the profile plus every financial and sync slice (definitive wipe). */
export function deleteAllLocalData(): void {
  storageService.clear()
  try {
    localStorage.removeItem(PROFILE_KEY)
    localStorage.removeItem(CRED_KEY)
    localStorage.removeItem(META_KEY)
  } catch {
    // Ignore storage errors.
  }
}

/** True when legacy local data exists without a profile (migration case). */
export function hasExistingData(): boolean {
  if (hasProfile()) return false
  try {
    return (
      storageService.hasData() ||
      localStorage.getItem(CRED_KEY) !== null ||
      localStorage.getItem(META_KEY) !== null
    )
  } catch {
    return false
  }
}

/** A PIN must be 4–6 digits. */
export function isValidPin(value: string): boolean {
  return /^\d{4,6}$/.test(value)
}