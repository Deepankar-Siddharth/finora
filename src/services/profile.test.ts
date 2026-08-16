import { beforeEach, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  changePin,
  createProfile,
  deleteAllLocalData,
  deleteProfile,
  hasExistingData,
  isValidPin,
  loadProfile,
  updateProfileName,
  verifyPin,
} from '../services/profile.ts'
import { storageService } from '../services/storage.ts'
import { DEFAULT_SETTINGS } from '../constants/index.ts'

class MemoryStorage {
  private map = new Map<string, string>()

  get length(): number {
    return this.map.size
  }

  clear(): void {
    this.map.clear()
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.map.delete(key)
  }

  setItem(key: string, value: string): void {
    this.map.set(key, String(value))
  }
}

;(globalThis as { localStorage: unknown }).localStorage = new MemoryStorage()

function seedFinanceData(): void {
  storageService.save({
    transactions: [],
    budgets: [],
    goals: [],
    recurring: [],
    settings: { ...DEFAULT_SETTINGS },
  })
}

beforeEach(() => {
  ;(globalThis.localStorage as MemoryStorage).clear()
})

describe('isValidPin', () => {
  test('accepts 4–6 digit PINs', () => {
    assert.equal(isValidPin('1234'), true)
    assert.equal(isValidPin('123456'), true)
    assert.equal(isValidPin('000000'), true)
  })

  test('rejects anything else', () => {
    assert.equal(isValidPin(''), false)
    assert.equal(isValidPin('123'), false)
    assert.equal(isValidPin('1234567'), false)
    assert.equal(isValidPin('12a4'), false)
    assert.equal(isValidPin('12 34'), false)
  })
})

describe('createProfile', () => {
  test('never stores the PIN in plain text', async () => {
    await createProfile('Nayra', '4321')
    const raw = localStorage.getItem('finora_profile')
    assert.ok(raw)
    assert.ok(!raw.includes('4321'))
    assert.ok(raw.includes('PBKDF2-SHA256'))
    assert.ok(raw.includes('"hash"'))
    assert.ok(raw.includes('"salt"'))
  })

  test('loadProfile returns the profile', async () => {
    await createProfile('Nayra', '1234')
    assert.equal(loadProfile()?.name, 'Nayra')
  })

  test('verifyPin accepts the right PIN and rejects the wrong one', async () => {
    await createProfile('Nayra', '1234')
    assert.equal(await verifyPin('1234'), true)
    assert.equal(await verifyPin('0000'), false)
    assert.equal(await verifyPin(''), false)
  })

  test('verification fails when no profile exists', async () => {
    assert.equal(await verifyPin('1234'), false)
  })
})

describe('changePin', () => {
  test('rejects when the current PIN is wrong', async () => {
    await createProfile('Nayra', '1234')
    assert.equal(await changePin('9999', '5678'), 'wrong-current')
    assert.equal(await verifyPin('1234'), true)
    assert.equal(await verifyPin('5678'), false)
  })

  test('rejects an invalid next PIN', async () => {
    await createProfile('Nayra', '1234')
    assert.equal(await changePin('1234', '12'), 'invalid')
    assert.equal(await verifyPin('1234'), true)
  })

  test('succeeds and the new PIN replaces the old one', async () => {
    await createProfile('Nayra', '1234')
    assert.equal(await changePin('1234', '9999'), 'ok')
    assert.equal(await verifyPin('9999'), true)
    assert.equal(await verifyPin('1234'), false)
  })
})

describe('updateProfileName', () => {
  test('persists the new name', async () => {
    await createProfile('Nayra', '1234')
    const updated = updateProfileName('Ari')
    assert.equal(updated?.name, 'Ari')
    assert.equal(loadProfile()?.name, 'Ari')
  })
})

describe('deleteProfile', () => {
  test('removes the profile and blocks verification', async () => {
    await createProfile('Nayra', '1234')
    deleteProfile()
    assert.equal(loadProfile(), null)
    assert.equal(await verifyPin('1234'), false)
  })
})

describe('hasExistingData', () => {
  test('is true when finance data exists without a profile', () => {
    seedFinanceData()
    assert.equal(hasExistingData(), true)
  })

  test('is false on a clean device', () => {
    assert.equal(hasExistingData(), false)
  })

  test('is false once a profile exists', async () => {
    seedFinanceData()
    await createProfile('Nayra', '1234')
    assert.equal(hasExistingData(), false)
  })
})

describe('deleteAllLocalData', () => {
  test('removes finance data, profile and sync credentials', async () => {
    seedFinanceData()
    await createProfile('Nayra', '1234')
    localStorage.setItem('finora_sync', 'creds')
    localStorage.setItem('finora_sync_meta', 'meta')

    deleteAllLocalData()

    assert.equal(storageService.hasData(), false)
    assert.equal(loadProfile(), null)
    assert.equal(localStorage.getItem('finora_sync'), null)
    assert.equal(localStorage.getItem('finora_sync_meta'), null)
    assert.equal(hasExistingData(), false)
  })
})
