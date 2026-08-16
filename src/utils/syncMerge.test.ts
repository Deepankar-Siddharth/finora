import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import type { SyncRemoteData, Transaction } from '../types/index.ts'
import { mergeRemoteData } from '../utils/syncMerge.ts'

const baseSettings = {
  name: 'Nayra',
  currency: 'INR',
  monthlyIncomeTarget: 75000,
  theme: 'system' as const,
}

function tx(id: string, updatedAt?: string, createdAt?: string): Transaction {
  return {
    id,
    type: 'expense',
    amount: 100,
    category: 'Food',
    date: '2026-08-01',
    description: 'Transaction ' + id,
    paymentMethod: 'UPI',
    createdAt: createdAt ?? '2026-08-01T00:00:00.000Z',
    updatedAt,
  }
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

function idsOf(result: SyncRemoteData): string[] {
  return result.slices.transactions.data.map((t) => t.id).sort()
}

describe('mergeRemoteData — collections', () => {
  test('keeps items that exist on only one side', () => {
    const a = remote({ transactions: { data: [tx('a', '2026-08-01T10:00:00.000Z')] } })
    const b = remote({ transactions: { data: [tx('b', '2026-08-01T11:00:00.000Z')] } })
    const merged = mergeRemoteData(a, b)
    assert.deepEqual(idsOf(merged), ['a', 'b'])
  })

  test('same id resolves to the side with the newer updatedAt', () => {
    const a = remote({ transactions: { data: [{ ...tx('x'), amount: 100, updatedAt: '2026-08-01T10:00:00.000Z' }] } })
    const b = remote({ transactions: { data: [{ ...tx('x'), amount: 999, updatedAt: '2026-08-01T11:00:00.000Z' }] } })
    const merged = mergeRemoteData(a, b)
    assert.equal(merged.slices.transactions.data[0].amount, 999)
  })

  test('same id + identical timestamps prefers the first argument (anchor)', () => {
    const a = remote({ transactions: { data: [{ ...tx('x'), amount: 100, updatedAt: '2026-08-01T10:00:00.000Z' }] } })
    const b = remote({ transactions: { data: [{ ...tx('x'), amount: 999, updatedAt: '2026-08-01T10:00:00.000Z' }] } })
    const merged = mergeRemoteData(a, b)
    assert.equal(merged.slices.transactions.data[0].amount, 100)
  })

  test('falls back to createdAt when updatedAt is missing', () => {
    const a = remote({ transactions: { data: [tx('x', undefined, '2026-08-01T09:00:00.000Z')] } })
    const b = remote({
      transactions: { data: [{ ...tx('x', undefined, '2026-08-01T12:00:00.000Z'), amount: 42 }] },
    })
    const merged = mergeRemoteData(a, b)
    assert.equal(merged.slices.transactions.data[0].amount, 42)
  })

  test('with no timestamps at all, the first argument wins', () => {
    const a = remote({ transactions: { data: [{ ...tx('x', undefined, undefined), amount: 5 }] } })
    const b = remote({ transactions: { data: [{ ...tx('x', undefined, undefined), amount: 7 }] } })
    const merged = mergeRemoteData(a, b)
    assert.equal(merged.slices.transactions.data[0].amount, 5)
  })

  test('does not delete a transaction removed on one side', () => {
    const a = remote({ transactions: { data: [tx('keep', '2026-08-01T10:00:00.000Z')] } })
    const b = remote({ transactions: { data: [] } })
    const merged = mergeRemoteData(a, b)
    assert.deepEqual(idsOf(merged), ['keep'])
  })

  test('merged slice timestamp is the latest of the two', () => {
    const later = '2026-08-02T00:00:00.000Z'
    const earlier = '2026-08-01T00:00:00.000Z'
    const a = remote({ transactions: { data: [], updatedAt: earlier } })
    const b = remote({ transactions: { data: [], updatedAt: later } })
    const merged = mergeRemoteData(a, b)
    assert.equal(merged.slices.transactions.updatedAt, later)
  })

  test('merging is deterministic', () => {
    const a = remote({ transactions: { data: [tx('a', '2026-08-01T10:00:00.000Z')] } })
    const b = remote({ transactions: { data: [tx('b', '2026-08-01T11:00:00.000Z'), tx('c')] } })
    assert.deepEqual(mergeRemoteData(a, b), mergeRemoteData(a, b))
  })
})

describe('mergeRemoteData — settings', () => {
  test('preserves a field missing on the other side even when that slice is newer', () => {
    const a = remote({
      settings: {
        data: { ...baseSettings, theme: 'dark' },
        updatedAt: '2026-08-01T10:00:00.000Z',
      },
    })
    const b = remote({
      settings: {
        data: {
          name: baseSettings.name,
          currency: baseSettings.currency,
          monthlyIncomeTarget: baseSettings.monthlyIncomeTarget,
        } as unknown as typeof baseSettings,
        updatedAt: '2026-08-01T11:00:00.000Z',
      },
    })
    const merged = mergeRemoteData(a, b)
    assert.equal(merged.slices.settings.data.theme, 'dark')
    assert.equal(merged.slices.settings.data.currency, 'INR')
  })

  test('for a field changed on both sides, the newer slice timestamp wins', () => {
    const a = remote({
      settings: { data: { ...baseSettings, name: 'From A' }, updatedAt: '2026-08-01T10:00:00.000Z' },
    })
    const b = remote({
      settings: { data: { ...baseSettings, name: 'From B' }, updatedAt: '2026-08-01T11:00:00.000Z' },
    })
    const merged = mergeRemoteData(a, b)
    assert.equal(merged.slices.settings.data.name, 'From B')
  })

  test('missing slice timestamps fall back to the first argument', () => {
    const a = remote({ settings: { data: { ...baseSettings, name: 'From A' } } })
    const b = remote({ settings: { data: { ...baseSettings, name: 'From B' } } })
    const merged = mergeRemoteData(a, b)
    assert.equal(merged.slices.settings.data.name, 'From A')
  })
})