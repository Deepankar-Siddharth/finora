import type {
  FinanceData,
  SyncCreds,
  SyncEnvelope,
  SyncMeta,
  SyncRemoteData,
  SyncResult,
  SyncSliceName,
  SyncStatus,
  UserSettings,
} from '../types'
import { DEFAULT_SETTINGS } from '../constants/index.ts'
import { mergeRemoteData } from '../utils/syncMerge.ts'

const REPO = 'Deepankar-Siddharth/finora'
const FILE_PATH = '.data/finora.json'
const BRANCH = 'main'
const API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`
const COMMITTER = {
  name: 'Finora Sync',
  email: 'sync@users.noreply.github.com',
}
const TIMEOUT_MS = 15_000
const MAX_RETRIES = 3
const PBKDF2_ITERATIONS = 200_000

const CRED_KEY = 'finora_sync'
const META_KEY = 'finora_sync_meta'

export type SyncErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'rate_limit'
  | 'network'
  | 'timeout'
  | 'malformed'
  | 'decrypt_failed'
  | 'unsupported_version'
  | 'max_retries'
  | 'http'

/** App-level error with a machine-readable code. Never carries credentials. */
export class SyncError extends Error {
  readonly code: SyncErrorCode
  readonly status: number | undefined

  constructor(code: SyncErrorCode, message: string, status?: number) {
    super(message)
    this.name = 'SyncError'
    this.code = code
    this.status = status
  }
}

function makeError(code: SyncErrorCode, status?: number): SyncError {
  const message = ERROR_MESSAGES[code]
  return new SyncError(code, message, status)
}

const ERROR_MESSAGES: Record<SyncErrorCode, string> = {
  unauthorized: 'GitHub authentication or repository permission failed.',
  forbidden: 'GitHub authentication or repository permission failed.',
  not_found: 'Remote sync file does not exist yet.',
  conflict: 'The remote file changed while syncing.',
  validation: 'GitHub rejected the request. Please try again.',
  rate_limit: 'GitHub rate limit reached. Try again in a few minutes.',
  network: 'Could not reach GitHub. Your local data is safe.',
  timeout: 'GitHub took too long to respond. Your local data is safe.',
  malformed: 'The synced file is malformed. It was not overwritten.',
  decrypt_failed: 'Unable to decrypt synced data. Check your encryption passphrase.',
  unsupported_version: 'The synced file uses an unsupported version.',
  max_retries: 'Saving failed several times. Nothing was discarded — try syncing again.',
  http: 'GitHub request failed. Please try again.',
}

/** Map a thrown value to a safe status + message combination for the UI. */
export function describeSyncError(err: unknown): { status: SyncStatus; message: string } {
  if (err instanceof SyncError) {
    switch (err.code) {
      case 'unauthorized':
      case 'forbidden':
      case 'validation':
      case 'malformed':
      case 'decrypt_failed':
      case 'unsupported_version':
      case 'max_retries':
      case 'http':
        return { status: 'error', message: err.message }
      case 'rate_limit':
        return { status: 'error', message: err.message }
      case 'network':
      case 'timeout':
        return { status: 'offline', message: err.message }
      default:
        return { status: 'error', message: err.message }
    }
  }
  return { status: 'error', message: 'Something went wrong while syncing.' }
}

export function isSyncError(err: unknown, code: SyncErrorCode): boolean {
  return err instanceof SyncError && err.code === code
}

// ---- Local credential + metadata storage ----------------------------------

export function loadCreds(): SyncCreds | null {
  try {
    const raw = localStorage.getItem(CRED_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as SyncCreds).token === 'string' &&
      (parsed as SyncCreds).token.length > 0 &&
      typeof (parsed as SyncCreds).passphrase === 'string' &&
      (parsed as SyncCreds).passphrase.length > 0
    ) {
      return { token: (parsed as SyncCreds).token, passphrase: (parsed as SyncCreds).passphrase }
    }
    return null
  } catch {
    return null
  }
}

export function saveCreds(creds: SyncCreds): void {
  try {
    localStorage.setItem(CRED_KEY, JSON.stringify(creds))
  } catch {
    // Storage unavailable — sync will simply not persist credentials.
  }
}

export function clearCreds(): void {
  try {
    localStorage.removeItem(CRED_KEY)
  } catch {
    // Ignore storage errors.
  }
}

export function loadMeta(): SyncMeta {
  const valid: SyncSliceName[] = [
    'settings',
    'transactions',
    'budgets',
    'savingsGoals',
    'recurringTransactions',
  ]
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const out: SyncMeta = {}
    for (const key of valid) {
      const value = (parsed as Record<string, unknown>)[key]
      if (typeof value === 'string') out[key] = value
    }
    return out
  } catch {
    return {}
  }
}

export function saveMeta(meta: SyncMeta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta))
  } catch {
    // Ignore storage errors.
  }
}

export function bumpMeta(meta: SyncMeta, slices: SyncSliceName[]): SyncMeta {
  if (slices.length === 0) return meta
  const now = new Date().toISOString()
  const out = { ...meta }
  for (const slice of slices) out[slice] = now
  return out
}

export function sliceMetaOf(remote: SyncRemoteData): SyncMeta {
  return {
    settings: remote.slices.settings.updatedAt,
    transactions: remote.slices.transactions.updatedAt,
    budgets: remote.slices.budgets.updatedAt,
    savingsGoals: remote.slices.savingsGoals.updatedAt,
    recurringTransactions: remote.slices.recurringTransactions.updatedAt,
  }
}

// ---- Serialization: FinanceData <-> SyncRemoteData ------------------------

export function toRemoteData(state: FinanceData, meta: SyncMeta = {}): SyncRemoteData {
  return {
    version: 1,
    slices: {
      settings: { data: state.settings, updatedAt: meta.settings },
      transactions: { data: state.transactions, updatedAt: meta.transactions },
      budgets: { data: state.budgets, updatedAt: meta.budgets },
      savingsGoals: { data: state.goals, updatedAt: meta.savingsGoals },
      recurringTransactions: { data: state.recurring, updatedAt: meta.recurringTransactions },
    },
  }
}

export function fromRemoteData(remote: SyncRemoteData): FinanceData {
  const s = remote?.slices
  return {
    settings:
      s?.settings?.data && isSettingsShape(s.settings.data)
        ? s.settings.data
        : { ...DEFAULT_SETTINGS },
    transactions: Array.isArray(s?.transactions?.data) ? s.transactions.data : [],
    budgets: Array.isArray(s?.budgets?.data) ? s.budgets.data : [],
    goals: Array.isArray(s?.savingsGoals?.data) ? s.savingsGoals.data : [],
    recurring: Array.isArray(s?.recurringTransactions?.data) ? s.recurringTransactions.data : [],
  }
}

function isSettingsShape(value: UserSettings | undefined): value is UserSettings {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Partial<UserSettings>
  return (
    typeof v.name === 'string' &&
    typeof v.currency === 'string' &&
    typeof v.monthlyIncomeTarget === 'number'
  )
}

/** Structural equality check on the finance data (order-insensitive). */
export function financeDataEquals(a: FinanceData, b: FinanceData): boolean {
  const canonical = (data: FinanceData) =>
    JSON.stringify({
      transactions: [...data.transactions].sort((x, y) => x.id.localeCompare(y.id)),
      budgets: [...data.budgets].sort((x, y) => x.id.localeCompare(y.id)),
      goals: [...data.goals].sort((x, y) => x.id.localeCompare(y.id)),
      recurring: [...data.recurring].sort((x, y) => x.id.localeCompare(y.id)),
      settings: Object.fromEntries(Object.entries(data.settings).sort(([k1], [k2]) => k1.localeCompare(k2))),
    })
  return canonical(a) === canonical(b)
}

// ---- Base64 helpers -------------------------------------------------------

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

function utf8Encode(text: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(text)
}

function utf8Decode(bytes: Uint8Array<ArrayBuffer>): string {
  return new TextDecoder().decode(bytes)
}

// ---- Cryptography ---------------------------------------------------------

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    utf8Encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptData(passphrase: string, data: SyncRemoteData): Promise<SyncEnvelope> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    utf8Encode(JSON.stringify(data)),
  )
  return {
    format: 'finora-encrypted',
    version: 1,
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  }
}

export async function decryptData(passphrase: string, envelope: SyncEnvelope): Promise<SyncRemoteData> {
  if (!envelope || typeof envelope !== 'object') {
    throw makeError('malformed')
  }
  if (envelope.format !== 'finora-encrypted') {
    throw makeError('malformed')
  }
  if (envelope.version !== 1) {
    throw makeError('unsupported_version')
  }
  if (
    typeof envelope.iv !== 'string' ||
    typeof envelope.salt !== 'string' ||
    typeof envelope.ciphertext !== 'string' ||
    envelope.iv.length === 0 ||
    envelope.salt.length === 0 ||
    envelope.ciphertext.length === 0
  ) {
    throw makeError('malformed')
  }

  let salt: Uint8Array<ArrayBuffer>
  let iv: Uint8Array<ArrayBuffer>
  let ciphertext: Uint8Array<ArrayBuffer>
  try {
    salt = base64ToBytes(envelope.salt)
    iv = base64ToBytes(envelope.iv)
    ciphertext = base64ToBytes(envelope.ciphertext)
  } catch {
    throw makeError('malformed')
  }

  const key = await deriveKey(passphrase, salt)
  let plaintext: ArrayBuffer
  try {
    plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  } catch {
    throw makeError('decrypt_failed')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(utf8Decode(new Uint8Array(plaintext)))
  } catch {
    throw makeError('malformed')
  }
  if (typeof parsed !== 'object' || parsed === null) throw makeError('malformed')
  const candidate = parsed as SyncRemoteData
  if (candidate.version !== 1 || typeof candidate.slices !== 'object' || candidate.slices === null) {
    throw makeError('malformed')
  }
  return candidate
}

// ---- GitHub Contents API --------------------------------------------------

interface GithubFetchOptions {
  timeoutMs?: number
}

async function githubFetch(
  url: string,
  token: string,
  init: RequestInit = {},
  options: GithubFetchOptions = {},
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${token}`,
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    })
    return response
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw makeError('timeout')
    }
    throw makeError('network')
  } finally {
    clearTimeout(timeout)
  }
}

interface RemoteFile {
  sha: string | null
  envelope: SyncEnvelope | null
}

/** Fetch and decode the remote encrypted file. 404 becomes "not initialized". */
export async function getRemote(
  token: string,
  options: GithubFetchOptions = {},
): Promise<RemoteFile> {
  const response = await githubFetch(`${API_URL}?ref=${encodeURIComponent(BRANCH)}`, token, {}, options)
  const status = response.status
  if (status === 404) return { sha: null, envelope: null }
  if (status === 401) throw makeError('unauthorized', status)
  if (status === 403) throw makeError('forbidden', status)
  if (status === 429) throw makeError('rate_limit', status)
  if (!response.ok) throw makeError('http', status)

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw makeError('malformed')
  }
  const record = body as { content?: string; sha?: string | null }
  if (typeof record.content !== 'string' || record.content.length === 0) {
    throw makeError('malformed')
  }

  let decoded: string
  try {
    decoded = utf8Decode(base64ToBytes(record.content))
  } catch {
    throw makeError('malformed')
  }
  let envelope: unknown
  try {
    envelope = JSON.parse(decoded)
  } catch {
    throw makeError('malformed')
  }
  const candidate = envelope as SyncEnvelope
  if (
    typeof candidate !== 'object' ||
    candidate === null ||
    candidate.format !== 'finora-encrypted' ||
    typeof candidate.iv !== 'string' ||
    typeof candidate.salt !== 'string' ||
    typeof candidate.ciphertext !== 'string'
  ) {
    throw makeError('malformed')
  }

  return { sha: typeof record.sha === 'string' ? record.sha : null, envelope: candidate }
}

/** Write the encrypted envelope. Omit sha when creating a brand new file. */
export async function putRemote(
  token: string,
  envelope: SyncEnvelope,
  sha: string | null,
  options: GithubFetchOptions = {},
): Promise<void> {
  const payload = {
    message: 'sync: update encrypted Finora data',
    content: bytesToBase64(utf8Encode(JSON.stringify(envelope))),
    sha: sha ?? undefined,
    branch: BRANCH,
    author: COMMITTER,
    committer: COMMITTER,
  }

  const response = await githubFetch(
    API_URL,
    token,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    options,
  )

  const status = response.status
  if (status === 409) throw makeError('conflict', status)
  if (status === 422) throw makeError('validation', status)
  if (status === 401) throw makeError('unauthorized', status)
  if (status === 403) throw makeError('forbidden', status)
  if (status === 429) throw makeError('rate_limit', status)
  if (status === 404) throw makeError('not_found', status)
  if (!response.ok) throw makeError('http', status)
}

// ---- Orchestration --------------------------------------------------------

/**
 * Single sync pass: pull remote → merge → apply/write back.
 * Handles initial creation (404), 409 conflicts with up to 3 attempts and
 * always resolves conflicts by merging (never blindly overwrites).
 */
export async function syncWithRemote(options: {
  token: string
  passphrase: string
  localRemote: SyncRemoteData
  timeoutMs?: number
}): Promise<SyncResult> {
  const { token, passphrase, localRemote } = options
  const timeoutMs = options.timeoutMs

  const remote = await getRemote(token, { timeoutMs })

  // No remote file yet → this is the initial sync. Create it from local data.
  if (!remote.envelope) {
    const envelope = await encryptData(passphrase, localRemote)
    await putRemote(token, envelope, null, { timeoutMs })
    return { merged: localRemote, remoteWritten: true }
  }

  const remoteData = await decryptData(passphrase, remote.envelope)
  const merged = mergeRemoteData(remoteData, localRemote)

  if (isRemoteEqual(merged, remoteData)) {
    return { merged, remoteWritten: false }
  }

  const pushed = await pushMerged(token, passphrase, merged, remote.sha, timeoutMs)
  return { merged: pushed, remoteWritten: true }
}

async function pushMerged(
  token: string,
  passphrase: string,
  data: SyncRemoteData,
  sha: string | null,
  timeoutMs: number | undefined,
): Promise<SyncRemoteData> {
  let current = data
  let currentSha = sha
  let attempts = 0

  while (attempts < MAX_RETRIES) {
    attempts += 1
    try {
      const envelope = await encryptData(passphrase, current)
      await putRemote(token, envelope, currentSha, { timeoutMs })
      return current
    } catch (err) {
      if (!isSyncError(err, 'conflict')) throw err
      // Another device wrote to the file. Fetch the latest, merge, retry.
      const latest = await getRemote(token, { timeoutMs })
      if (!latest.envelope) throw err
      const latestData = await decryptData(passphrase, latest.envelope)
      current = mergeRemoteData(current, latestData)
      currentSha = latest.sha
    }
  }

  throw makeError('max_retries')
}

function isRemoteEqual(a: SyncRemoteData, b: SyncRemoteData): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}