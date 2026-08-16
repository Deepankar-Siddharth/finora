import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import type { SyncEnvelope, SyncMeta, SyncRemoteData, SyncSlice } from '../types/index.ts'
import {
  decryptData,
  describeSyncError,
  encryptData,
  financeDataEquals,
  fromRemoteData,
  getRemote,
  isSyncError,
  putRemote,
  sliceMetaOf,
  SyncError,
  syncWithRemote,
  toRemoteData,
} from '../services/sync.ts'
import { mergeRemoteData } from '../utils/syncMerge.ts'

const TOKEN = 'github_pat_TEST_TOKEN_SECRET'
const PASS = 'correct-horse-battery-staple'
const BAD_PASS = 'wrong-passphrase'
const TIMEOUT_MS = 250

const baseSettings = {
  name: 'Nayra',
  currency: 'INR',
  monthlyIncomeTarget: 75000,
  theme: 'system' as const,
}

function remote(slices: Partial<SyncRemoteData['slices']>): SyncRemoteData {
  return {
    version: 1,
    slices: {
      settings: { data: baseSettings },
      transactions: { data: [] },
      budgets: { data: [] },
      savingsGoals: { data: [] },
      recurringTransactions: { data: [] },
      ...slices,
    },
  }
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function contentOf(envelope: unknown): string {
  return Buffer.from(JSON.stringify(envelope)).toString('base64')
}

type FetchImpl = (url: string, init?: RequestInit) => Promise<Response>

const originalFetch = globalThis.fetch

function setFetch(impl: FetchImpl): void {
  ;(globalThis as { fetch: unknown }).fetch = impl
}

function resetFetch(): void {
  ;(globalThis as { fetch: unknown }).fetch = originalFetch
}

interface CallRecord {
  url: string
  init?: RequestInit
}

function recordCalls(impl: (url: string, init?: RequestInit, calls?: CallRecord[]) => Promise<Response>) {
  const calls: CallRecord[] = []
  setFetch((url, init) => {
    calls.push({ url, init })
    return impl(url, init, calls)
  })
  return calls
}

function lastPutBody(calls: CallRecord[]): Record<string, unknown> {
  const put = calls.filter((c) => c.init?.method === 'PUT').at(-1)
  assert.ok(put, 'expected at least one PUT request')
  return JSON.parse(String(put.init?.body)) as Record<string, unknown>
}

before(() => {})
after(() => resetFetch())

describe('encryptData / decryptData', () => {
  test('round-trips arbitrary payloads', async () => {
    const data = remote({
      transactions: {
        data: [
          {
            id: 't1',
            type: 'expense',
            amount: 500,
            category: 'Groceries',
            date: '2026-08-15',
            description: 'Weekly groceries',
            paymentMethod: 'UPI',
            createdAt: '2026-08-15T08:00:00.000Z',
          },
        ],
      },
    })
    const envelope = await encryptData(PASS, data)
    const decrypted = await decryptData(PASS, envelope)
    assert.deepEqual(decrypted, data)
  })

  test('a wrong passphrase fails decryption', async () => {
    const envelope = await encryptData(PASS, remote({}))
    await assert.rejects(decryptData(BAD_PASS, envelope), (err) => isSyncError(err, 'decrypt_failed'))
  })

  test('the same payload produces a different envelope every time', async () => {
    const data = remote({})
    const first = await encryptData(PASS, data)
    const second = await encryptData(PASS, data)
    assert.notDeepEqual(first, second)
    assert.notEqual(first.iv, second.iv)
    assert.notEqual(first.salt, second.salt)
  })

  test('the envelope contains no plaintext from the payload', async () => {
    const secret = 'SUPER-SECRET-VENDOR-PAYMENT-2026'
    const data = remote({
      settings: { data: { ...baseSettings, name: secret } },
      transactions: { data: [{ id: 't1', type: 'expense', amount: 1, category: secret, date: '2026-08-15', description: secret, paymentMethod: 'Other', createdAt: '2026-08-15T08:00:00.000Z' }] },
    })
    const envelope = await encryptData(PASS, data)
    const serialized = JSON.stringify(envelope)
    assert.ok(!serialized.includes(secret))
    assert.ok(serialized.includes('finora-encrypted'))
  })

  test('rejects envelopes with an unsupported version', async () => {
    const envelope = await encryptData(PASS, remote({}))
    await assert.rejects(
      decryptData(PASS, { ...envelope, version: 2 } as unknown as SyncEnvelope),
      (err) => isSyncError(err, 'unsupported_version'),
    )
  })

  test('rejects malformed envelopes', async () => {
    await assert.rejects(decryptData(PASS, null as unknown as SyncEnvelope), (err) =>
      isSyncError(err, 'malformed'),
    )
    await assert.rejects(
      decryptData(PASS, { format: 'finora-encrypted', version: 1, iv: '', salt: '', ciphertext: '' }),
      (err) => isSyncError(err, 'malformed'),
    )
  })
})

describe('getRemote', () => {
  test('404 means the file does not exist yet', async () => {
    const calls = recordCalls(async () => jsonResponse(404, { message: 'Not Found' }))
    const result = await getRemote(TOKEN, { timeoutMs: TIMEOUT_MS })
    assert.deepEqual(result, { sha: null, envelope: null })
    assert.ok(calls[0].url.includes('ref=main'))
    assert.equal(
      (calls[0].init?.headers as Record<string, string> | undefined)?.['Authorization'],
      `Bearer ${TOKEN}`,
    )
  })

  test('returns sha + parsed envelope on success', async () => {
    const envelope = await encryptData(PASS, remote({}))
    recordCalls(async () => jsonResponse(200, { sha: 'sha-abc', content: contentOf(envelope) }))
    const result = await getRemote(TOKEN, { timeoutMs: TIMEOUT_MS })
    assert.equal(result.sha, 'sha-abc')
    assert.deepEqual(result.envelope, envelope)
  })

  test('maps auth, permission, rate limit and http statuses', async () => {
    for (const [status, code] of [
      [401, 'unauthorized'],
      [403, 'forbidden'],
      [429, 'rate_limit'],
      [500, 'http'],
    ] as const) {
      setFetch(async () => jsonResponse(status, { message: 'nope' }))
      await assert.rejects(getRemote(TOKEN, { timeoutMs: TIMEOUT_MS }), (err) =>
        err instanceof SyncError && err.code === code && err.status === status,
      )
    }
  })

  test('malformed remote content maps to malformed', async () => {
    setFetch(async () => jsonResponse(200, { sha: 'sha', content: contentOf({ hello: 'world' }) }))
    await assert.rejects(getRemote(TOKEN, { timeoutMs: TIMEOUT_MS }), (err) =>
      isSyncError(err, 'malformed'),
    )
  })

  test('missing content field maps to malformed', async () => {
    setFetch(async () => jsonResponse(200, { sha: 'sha' }))
    await assert.rejects(getRemote(TOKEN, { timeoutMs: TIMEOUT_MS }), (err) =>
      isSyncError(err, 'malformed'),
    )
  })

  test('a network failure is surfaced as network (never the raw error)', async () => {
    setFetch(async () => {
      throw new TypeError('fetch failed')
    })
    await assert.rejects(getRemote(TOKEN, { timeoutMs: TIMEOUT_MS }), (err) =>
      isSyncError(err, 'network'),
    )
  })

  test('an aborted request is surfaced as timeout', async () => {
    setFetch(async () => {
      throw new DOMException('The operation was aborted.', 'AbortError')
    })
    await assert.rejects(getRemote(TOKEN, { timeoutMs: TIMEOUT_MS }), (err) =>
      isSyncError(err, 'timeout'),
    )
  })
})

describe('putRemote', () => {
  test('writes a valid create payload with no sha on first push', async () => {
    const envelope = await encryptData(PASS, remote({}))
    const calls = recordCalls(async () => jsonResponse(201, { content: { sha: 'sha-1' } }))
    await putRemote(TOKEN, envelope, null, { timeoutMs: TIMEOUT_MS })
    const body = lastPutBody(calls)
    assert.equal(body.branch, 'main')
    assert.equal(body.sha, undefined)
    assert.ok(String(body.message).includes('sync'))
    const decoded = Buffer.from(String(body.content), 'base64').toString('utf8')
    assert.deepEqual(JSON.parse(decoded), envelope)
  })

  test('includes the sha for updates', async () => {
    const envelope = await encryptData(PASS, remote({}))
    const calls = recordCalls(async () => jsonResponse(200, {}))
    await putRemote(TOKEN, envelope, 'sha-42', { timeoutMs: TIMEOUT_MS })
    assert.equal(lastPutBody(calls).sha, 'sha-42')
  })

  test('maps failure statuses to codes', async () => {
    for (const [status, code] of [
      [409, 'conflict'],
      [422, 'validation'],
      [401, 'unauthorized'],
      [403, 'forbidden'],
      [429, 'rate_limit'],
      [404, 'not_found'],
      [500, 'http'],
    ] as const) {
      const envelope = await encryptData(PASS, remote({}))
      setFetch(async () => jsonResponse(status, { message: 'nope' }))
      await assert.rejects(putRemote(TOKEN, envelope, null, { timeoutMs: TIMEOUT_MS }), (err) =>
        err instanceof SyncError && err.code === code && err.status === status,
      )
    }
  })
})

describe('syncWithRemote', () => {
  test('creates the remote file on the very first sync (404 → PUT without sha)', async () => {
    const local = remote({ transactions: { data: [{ id: 't1', type: 'expense', amount: 10, category: 'Food', date: '2026-08-15', description: 'Lunch', paymentMethod: 'UPI', createdAt: '2026-08-15T08:00:00.000Z' }] } })
    const calls = recordCalls(async (_url, init) =>
      init?.method === 'PUT' ? jsonResponse(201, { content: { sha: 'sha-1' } }) : jsonResponse(404, {}),
    )
    const result = await syncWithRemote({ token: TOKEN, passphrase: PASS, localRemote: local, timeoutMs: TIMEOUT_MS })
    assert.equal(result.remoteWritten, true)
    assert.deepEqual(result.merged, local)
    assert.equal(calls.filter((c) => c.init?.method === 'PUT').length, 1)
    assert.equal(lastPutBody(calls).sha, undefined)
  })

  test('does nothing when local and remote are identical', async () => {
    const shared = remote({ transactions: { data: [{ id: 't1', type: 'expense', amount: 10, category: 'Food', date: '2026-08-15', description: 'Lunch', paymentMethod: 'UPI', createdAt: '2026-08-15T08:00:00.000Z' }] } })
    const envelope = await encryptData(PASS, shared)
    const calls = recordCalls(async (_url, init) =>
      init?.method === 'PUT'
        ? jsonResponse(200, {})
        : jsonResponse(200, { sha: 'sha-1', content: contentOf(envelope) }),
    )
    const result = await syncWithRemote({ token: TOKEN, passphrase: PASS, localRemote: shared, timeoutMs: TIMEOUT_MS })
    assert.equal(result.remoteWritten, false)
    assert.equal(calls.filter((c) => c.init?.method === 'PUT').length, 0)
  })

  test('resolves a 409 conflict by merging and retrying', async () => {
    const remoteA = remote({ transactions: { data: [{ id: 'a', type: 'expense', amount: 1, category: 'Food', date: '2026-08-15', description: 'A', paymentMethod: 'UPI', createdAt: '2026-08-15T08:00:00.000Z', updatedAt: '2026-08-15T08:00:00.000Z' }] } })
    const remoteB = remote({ transactions: { data: [{ id: 'b', type: 'expense', amount: 2, category: 'Food', date: '2026-08-15', description: 'B', paymentMethod: 'UPI', createdAt: '2026-08-15T08:00:00.000Z', updatedAt: '2026-08-15T08:30:00.000Z' }] } })
    const envA = await encryptData(PASS, remoteA)
    const envB = await encryptData(PASS, remoteB)

    let putCount = 0
    let getCount = 0
    const calls = recordCalls(async (_url, init) => {
      if (init?.method === 'PUT') {
        putCount += 1
        return putCount === 1 ? jsonResponse(409, { message: 'Conflict' }) : jsonResponse(200, {})
      }
      getCount += 1
      if (getCount === 1) return jsonResponse(200, { sha: 'sha-a', content: contentOf(envA) })
      return jsonResponse(200, { sha: 'sha-b', content: contentOf(envB) })
    })

    const local = remote({ transactions: { data: [{ id: 'local', type: 'expense', amount: 3, category: 'Food', date: '2026-08-15', description: 'Local', paymentMethod: 'UPI', createdAt: '2026-08-15T09:00:00.000Z', updatedAt: '2026-08-15T09:00:00.000Z' }] } })
    const result = await syncWithRemote({ token: TOKEN, passphrase: PASS, localRemote: local, timeoutMs: TIMEOUT_MS })

    assert.equal(result.remoteWritten, true)
    const mergedIds = result.merged.slices.transactions.data.map((t) => t.id).sort()
    assert.deepEqual(mergedIds, ['a', 'b', 'local'])
    assert.equal(putCount, 2)
    assert.equal(getCount, 2)
    assert.equal(lastPutBody(calls).sha, 'sha-b')
  })

  test('gives up after repeated conflicts', async () => {
    const remoteOnly = remote({ transactions: { data: [] } })
    const envelope = await encryptData(PASS, remoteOnly)
    const calls = recordCalls(async (_url, init) =>
      init?.method === 'PUT'
        ? jsonResponse(409, { message: 'Conflict' })
        : jsonResponse(200, { sha: 'sha-x', content: contentOf(envelope) }),
    )
    const local = remote({ transactions: { data: [{ id: 'z', type: 'expense', amount: 1, category: 'Food', date: '2026-08-15', description: 'Z', paymentMethod: 'UPI', createdAt: '2026-08-15T09:00:00.000Z', updatedAt: '2026-08-15T09:00:00.000Z' }] } })
    await assert.rejects(
      syncWithRemote({ token: TOKEN, passphrase: PASS, localRemote: local, timeoutMs: TIMEOUT_MS }),
      (err) => isSyncError(err, 'max_retries'),
    )
    assert.equal(calls.filter((c) => c.init?.method === 'PUT').length, 3)
  })

  test('a wrong passphrase for the remote file fails without writing', async () => {
    const envelope = await encryptData(PASS, remote({}))
    const calls = recordCalls(async (_url, init) =>
      init?.method === 'PUT'
        ? jsonResponse(200, {})
        : jsonResponse(200, { sha: 'sha-1', content: contentOf(envelope) }),
    )
    const local = remote({})
    await assert.rejects(
      syncWithRemote({ token: TOKEN, passphrase: BAD_PASS, localRemote: local, timeoutMs: TIMEOUT_MS }),
      (err) => isSyncError(err, 'decrypt_failed'),
    )
    assert.equal(calls.filter((c) => c.init?.method === 'PUT').length, 0)
  })
})

describe('serialization', () => {
  test('toRemoteData / fromRemoteData round-trip a finance shape', () => {
    const meta: SyncMeta = { settings: 's', transactions: 't', budgets: 'b', savingsGoals: 'g', recurringTransactions: 'r' }
    const data = {
      settings: baseSettings,
      transactions: [] as SyncSlice<never>['data'],
      budgets: [] as SyncSlice<never>['data'],
      goals: [] as SyncSlice<never>['data'],
      recurring: [] as SyncSlice<never>['data'],
    }
    const remoteData = toRemoteData(data, meta)
    assert.equal(remoteData.slices.settings.updatedAt, 's')
    const back = fromRemoteData(remoteData)
    assert.equal(back.settings.name, 'Nayra')
    assert.deepEqual(back.transactions, [])
  })

  test('financeDataEquals ignores ordering and matches content', () => {
    const a = {
      settings: baseSettings,
      transactions: [
        { id: 'a', type: 'expense' as const, amount: 1, category: 'X', date: '2026-08-15', description: 'x', paymentMethod: 'UPI' as const, createdAt: '2026-08-15T00:00:00.000Z' },
        { id: 'b', type: 'expense' as const, amount: 2, category: 'Y', date: '2026-08-15', description: 'y', paymentMethod: 'UPI' as const, createdAt: '2026-08-15T00:00:00.000Z' },
      ],
      budgets: [],
      goals: [],
      recurring: [],
    }
    const b = {
      ...a,
      transactions: [...a.transactions].reverse(),
    }
    assert.equal(financeDataEquals(a, b), true)
    assert.equal(financeDataEquals(a, { ...a, transactions: a.transactions.slice(1) }), false)
  })

  test('sliceMetaOf reads the five slice timestamps', () => {
    const data = remote({
      settings: { data: baseSettings, updatedAt: 's1' },
      transactions: { data: [], updatedAt: 't1' },
    })
    assert.deepEqual(sliceMetaOf(data), {
      settings: 's1',
      transactions: 't1',
      budgets: undefined,
      savingsGoals: undefined,
      recurringTransactions: undefined,
    })
  })
})

describe('describeSyncError', () => {
  test('classifies offline-ish codes and never leaks the token', () => {
    const safe = new SyncError('network', 'network boom')
    assert.equal(describeSyncError(safe).status, 'offline')
    assert.equal(describeSyncError(new SyncError('timeout', 'slow')).status, 'offline')
    assert.equal(describeSyncError(new SyncError('conflict', 'conflict')).status, 'error')
    for (const err of [safe, new SyncError('unauthorized', 'nope'), new Error('boom')]) {
      assert.ok(!describeSyncError(err).message.includes(TOKEN))
      assert.ok(!describeSyncError(err).message.includes('Bearer'))
    }
  })

  test('mergeRemoteData and sync helpers stay consistent', async () => {
    const a = remote({ transactions: { data: [{ id: 'x', type: 'expense', amount: 1, category: 'F', date: '2026-08-15', description: 'x', paymentMethod: 'UPI', createdAt: '2026-08-15T00:00:00.000Z', updatedAt: '2026-08-15T10:00:00.000Z' }] } })
    const b = remote({ transactions: { data: [{ id: 'y', type: 'expense', amount: 2, category: 'F', date: '2026-08-15', description: 'y', paymentMethod: 'UPI', createdAt: '2026-08-15T00:00:00.000Z', updatedAt: '2026-08-15T11:00:00.000Z' }] } })
    const merged = mergeRemoteData(a, b)
    assert.deepEqual(merged.slices.transactions.data.map((t) => t.id).sort(), ['x', 'y'])
  })
})