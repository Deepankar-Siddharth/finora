import type {
  Budget,
  FinanceData,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
  UserSettings,
} from '../types'
import { DEFAULT_SETTINGS } from '../constants'

const STORAGE_KEYS = {
  transactions: 'finora_transactions',
  budgets: 'finora_budgets',
  goals: 'finora_goals',
  recurring: 'finora_recurring',
  settings: 'finora_settings',
} as const

const STORAGE_VERSION = 1

interface Envelope<T> {
  version: number
  data: T
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

function loadSlice<T>(key: string, validate: (value: unknown) => value is T): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isObject(parsed) || parsed.version !== STORAGE_VERSION) return null
    if (!validate(parsed.data)) return null
    return parsed.data
  } catch {
    // Corrupted JSON or unavailable storage — fall back to safe defaults.
    return null
  }
}

function saveSlice<T>(key: string, data: T): void {
  const envelope: Envelope<T> = { version: STORAGE_VERSION, data }
  try {
    localStorage.setItem(key, JSON.stringify(envelope))
  } catch {
    // Storage may be full or blocked (private mode). Nothing to fall back to,
    // but the app must keep working in-memory.
  }
}

// ---- Validators ---------------------------------------------------------

const isTransaction = (value: unknown): value is Transaction =>
  isObject(value) &&
  typeof value.id === 'string' &&
  (value.type === 'income' || value.type === 'expense') &&
  typeof value.amount === 'number' &&
  typeof value.category === 'string' &&
  typeof value.date === 'string' &&
  typeof value.description === 'string' &&
  typeof value.paymentMethod === 'string'

const isBudget = (value: unknown): value is Budget =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.category === 'string' &&
  typeof value.limit === 'number' &&
  typeof value.month === 'string'

const isGoal = (value: unknown): value is SavingsGoal =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.target === 'number' &&
  typeof value.current === 'number'

const isRecurring = (value: unknown): value is RecurringTransaction =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.amount === 'number' &&
  (value.type === 'income' || value.type === 'expense') &&
  typeof value.category === 'string' &&
  typeof value.frequency === 'string' &&
  typeof value.nextDate === 'string'

const isArrayOf =
  <T>(validator: (value: unknown) => value is T) =>
  (value: unknown): value is T[] =>
    Array.isArray(value) && value.every(validator)

const isSettings = (value: unknown): value is UserSettings =>
  isObject(value) &&
  typeof value.name === 'string' &&
  typeof value.currency === 'string' &&
  typeof value.monthlyIncomeTarget === 'number' &&
  (value.theme === 'light' || value.theme === 'dark' || value.theme === 'system')

// ---- Public API ---------------------------------------------------------

export const storageService = {
  /**
   * Load all slices. Missing, corrupt, or invalid data falls back to safe
   * defaults. The app starts empty — real transactions are entered by the
   * user (or imported from CSV).
   */
  load(): FinanceData {
    const transactions = loadSlice(STORAGE_KEYS.transactions, isArrayOf(isTransaction))
    const budgets = loadSlice(STORAGE_KEYS.budgets, isArrayOf(isBudget))
    const goals = loadSlice(STORAGE_KEYS.goals, isArrayOf(isGoal))
    const recurring = loadSlice(STORAGE_KEYS.recurring, isArrayOf(isRecurring))
    const settings = loadSlice(STORAGE_KEYS.settings, isSettings)

    return {
      transactions: transactions ?? [],
      budgets: budgets ?? [],
      goals: goals ?? [],
      recurring: recurring ?? [],
      settings: settings ?? { ...DEFAULT_SETTINGS },
    }
  },

  save(data: FinanceData): void {
    saveSlice(STORAGE_KEYS.transactions, data.transactions)
    saveSlice(STORAGE_KEYS.budgets, data.budgets)
    saveSlice(STORAGE_KEYS.goals, data.goals)
    saveSlice(STORAGE_KEYS.recurring, data.recurring)
    saveSlice(STORAGE_KEYS.settings, data.settings)
  },

  /** Remove every stored slice (used by "Reset all data"). */
  clear(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
    } catch {
      // Ignore storage errors during reset.
    }
  },
}
