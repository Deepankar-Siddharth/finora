import type { SyncRemoteData, SyncSlice, UserSettings } from '../types'

/**
 * Deterministic merge for synced data.
 *
 * Collections with stable ids (transactions, budgets, savings goals, recurring
 * transactions) are merged as unions: items only on either side are preserved
 * and items sharing an id resolve to the newer `updatedAt` (falling back to
 * `createdAt`, then preferring the first argument). Nothing is deleted merely
 * because it is absent from one side.
 *
 * Settings have no ids, so they are merged field-by-field using the slice
 * timestamp: an unchanged field is preserved even if the other device changed
 * a different field.
 */

type Order = 'a' | 'b' | 'tie'

function pickNewer(a: string | undefined, b: string | undefined): Order {
  if (a && b) {
    if (a === b) return 'tie'
    return a > b ? 'a' : 'b'
  }
  if (a) return 'a'
  if (b) return 'b'
  return 'tie'
}

function maxTs(a: string | undefined, b: string | undefined): string | undefined {
  const order = pickNewer(a, b)
  if (order === 'a') return a
  if (order === 'b') return b
  return a ?? b
}

function recordTimestamp(item: Record<string, unknown>): string | undefined {
  const updated = item.updatedAt
  const created = item.createdAt
  if (typeof updated === 'string' && updated.length > 0) return updated
  if (typeof created === 'string' && created.length > 0) return created
  return undefined
}

function newerItem<T extends { id: string }>(a: T, b: T): T {
  const tsA = recordTimestamp(a as unknown as Record<string, unknown>)
  const tsB = recordTimestamp(b as unknown as Record<string, unknown>)
  return pickNewer(tsA, tsB) === 'b' ? b : a
}

function mergeArraySlice<T extends { id: string }>(
  a: SyncSlice<T[]> | undefined,
  b: SyncSlice<T[]> | undefined,
): SyncSlice<T[]> {
  const map = new Map<string, T>()
  for (const item of a?.data ?? []) map.set(item.id, item)
  for (const item of b?.data ?? []) {
    const existing = map.get(item.id)
    map.set(item.id, existing ? newerItem(existing, item) : item)
  }
  return { data: [...map.values()], updatedAt: maxTs(a?.updatedAt, b?.updatedAt) }
}

function mergeSettingsSlice(
  a: SyncSlice<UserSettings> | undefined,
  b: SyncSlice<UserSettings> | undefined,
): SyncSlice<UserSettings> {
  const dataA = (a?.data ?? {}) as Record<string, unknown>
  const dataB = (b?.data ?? {}) as Record<string, unknown>
  const order = pickNewer(a?.updatedAt, b?.updatedAt)

  const keys = new Set([...Object.keys(dataA), ...Object.keys(dataB)])
  const out: Record<string, unknown> = {}
  for (const key of keys) {
    const valueA = dataA[key]
    const valueB = dataB[key]
    if (valueA === undefined) out[key] = valueB
    else if (valueB === undefined) out[key] = valueA
    else out[key] = order === 'b' ? valueB : valueA
  }

  return { data: out as unknown as UserSettings, updatedAt: maxTs(a?.updatedAt, b?.updatedAt) }
}

/**
 * Merge two remote payloads into one deterministic result.
 * The first argument wins on ties (used as the "anchor" side by callers).
 */
export function mergeRemoteData(a: SyncRemoteData, b: SyncRemoteData): SyncRemoteData {
  return {
    version: 1,
    slices: {
      settings: mergeSettingsSlice(a.slices.settings, b.slices.settings),
      transactions: mergeArraySlice(a.slices.transactions, b.slices.transactions),
      budgets: mergeArraySlice(a.slices.budgets, b.slices.budgets),
      savingsGoals: mergeArraySlice(a.slices.savingsGoals, b.slices.savingsGoals),
      recurringTransactions: mergeArraySlice(
        a.slices.recurringTransactions,
        b.slices.recurringTransactions,
      ),
    },
  }
}