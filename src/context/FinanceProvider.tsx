import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import type {
  Budget,
  FinanceData,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
  UserSettings,
} from '../types'
import { FinanceContext, type Action } from './FinanceContext'
import { storageService } from '../services/storage'
import { addDays, addMonths, addWeeks, addYears, todayISO } from '../utils/dates'

function reducer(state: FinanceData, action: Action): FinanceData {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] }
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t,
        ),
      }
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload.id),
      }
    case 'ADD_BUDGET':
      return { ...state, budgets: [...state.budgets, action.payload] }
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === action.payload.id ? action.payload : b,
        ),
      }
    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter((b) => b.id !== action.payload.id),
      }
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] }
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? action.payload : g,
        ),
      }
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.payload.id) }
    case 'ADD_RECURRING':
      return { ...state, recurring: [...state.recurring, action.payload] }
    case 'UPDATE_RECURRING':
      return {
        ...state,
        recurring: state.recurring.map((r) =>
          r.id === action.payload.id ? action.payload : r,
        ),
      }
    case 'DELETE_RECURRING':
      return {
        ...state,
        recurring: state.recurring.filter((r) => r.id !== action.payload.id),
      }
    case 'GENERATE_RECURRING': {
      const item = state.recurring.find((r) => r.id === action.payload.id)
      if (!item) return state

      const transaction: Transaction = {
        id: crypto.randomUUID(),
        type: item.type,
        amount: item.amount,
        category: item.category,
        date: item.nextDate,
        description: item.name,
        paymentMethod: 'Other',
        createdAt: todayISO(),
      }

      const advanceDate = (iso: string): string => {
        switch (item.frequency) {
          case 'daily':
            return addDays(iso, 1)
          case 'weekly':
            return addWeeks(iso, 1)
          case 'yearly':
            return addYears(iso, 1)
          default:
            return addMonths(iso, 1)
        }
      }

      return {
        ...state,
        transactions: [transaction, ...state.transactions],
        recurring: state.recurring.map((r) =>
          r.id === item.id ? { ...r, nextDate: advanceDate(item.nextDate) } : r,
        ),
      }
    }
    case 'IMPORT_TRANSACTIONS':
      return { ...state, transactions: [...action.payload, ...state.transactions] }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }
    case 'RESET_ALL':
      return {
        transactions: [],
        budgets: [],
        goals: [],
        recurring: [],
        settings: state.settings,
      }
    case 'REPLACE_STATE':
      return action.payload
    default:
      return state
  }
}

function applyTheme(theme: UserSettings['theme']): void {
  const root = document.documentElement
  const apply = (resolved: 'light' | 'dark') => {
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
  }

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const resolveSystem = (): 'light' | 'dark' => (media.matches ? 'dark' : 'light')

  if (theme === 'system') {
    apply(resolveSystem())
  } else {
    apply(theme)
  }
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => storageService.load())
  const [hasHydrated, setHasHydrated] = useState(false)

  // Persist after every mutation.
  useEffect(() => {
    if (!hasHydrated) {
      setHasHydrated(true)
      return
    }
    storageService.save(state)
  }, [state, hasHydrated])

  // Apply the theme preference and follow system changes.
  useEffect(() => {
    applyTheme(state.settings.theme)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(state.settings.theme)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [state.settings.theme])

  // Keep other tabs in sync when localStorage changes externally.
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key && event.key.startsWith('finora_')) {
        setHasHydrated(false)
        dispatch({ type: 'REPLACE_STATE', payload: storageService.load() })
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const value = useMemo(() => {
    const { transactions, budgets, goals, recurring, settings } = state
    return {
      state,
      transactions,
      budgets,
      goals,
      recurring,
      settings,
      addTransaction: (t: Transaction) => dispatch({ type: 'ADD_TRANSACTION', payload: t }),
      updateTransaction: (t: Transaction) => dispatch({ type: 'UPDATE_TRANSACTION', payload: t }),
      deleteTransaction: (id: string) => dispatch({ type: 'DELETE_TRANSACTION', payload: { id } }),
      addBudget: (b: Budget) => dispatch({ type: 'ADD_BUDGET', payload: b }),
      updateBudget: (b: Budget) => dispatch({ type: 'UPDATE_BUDGET', payload: b }),
      deleteBudget: (id: string) => dispatch({ type: 'DELETE_BUDGET', payload: { id } }),
      addGoal: (g: SavingsGoal) => dispatch({ type: 'ADD_GOAL', payload: g }),
      updateGoal: (g: SavingsGoal) => dispatch({ type: 'UPDATE_GOAL', payload: g }),
      deleteGoal: (id: string) => dispatch({ type: 'DELETE_GOAL', payload: { id } }),
      addRecurring: (r: RecurringTransaction) => dispatch({ type: 'ADD_RECURRING', payload: r }),
      updateRecurring: (r: RecurringTransaction) => dispatch({ type: 'UPDATE_RECURRING', payload: r }),
      deleteRecurring: (id: string) => dispatch({ type: 'DELETE_RECURRING', payload: { id } }),
      generateOccurrence: (id: string) => dispatch({ type: 'GENERATE_RECURRING', payload: { id } }),
      importTransactions: (txs: Transaction[]) =>
        dispatch({ type: 'IMPORT_TRANSACTIONS', payload: txs }),
      updateSettings: (patch: Partial<UserSettings>) =>
        dispatch({ type: 'UPDATE_SETTINGS', payload: patch }),
      resetAll: () => {
        storageService.clear()
        dispatch({ type: 'RESET_ALL' })
        storageService.save({
          transactions: [],
          budgets: [],
          goals: [],
          recurring: [],
          settings: state.settings,
        })
      },
    }
  }, [state])

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}
