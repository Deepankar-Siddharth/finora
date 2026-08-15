import { createContext, useContext } from 'react'
import type {
  Budget,
  FinanceData,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
  UserSettings,
} from '../types'

export type Action =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: { id: string } }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: { id: string } }
  | { type: 'ADD_GOAL'; payload: SavingsGoal }
  | { type: 'UPDATE_GOAL'; payload: SavingsGoal }
  | { type: 'DELETE_GOAL'; payload: { id: string } }
  | { type: 'ADD_RECURRING'; payload: RecurringTransaction }
  | { type: 'UPDATE_RECURRING'; payload: RecurringTransaction }
  | { type: 'DELETE_RECURRING'; payload: { id: string } }
  | { type: 'GENERATE_RECURRING'; payload: { id: string } }
  | { type: 'IMPORT_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'RESET_ALL' }
  | { type: 'REPLACE_STATE'; payload: FinanceData }

export interface FinanceContextValue {
  state: FinanceData
  transactions: Transaction[]
  budgets: Budget[]
  goals: SavingsGoal[]
  recurring: RecurringTransaction[]
  settings: UserSettings
  addTransaction: (t: Transaction) => void
  updateTransaction: (t: Transaction) => void
  deleteTransaction: (id: string) => void
  addBudget: (b: Budget) => void
  updateBudget: (b: Budget) => void
  deleteBudget: (id: string) => void
  addGoal: (g: SavingsGoal) => void
  updateGoal: (g: SavingsGoal) => void
  deleteGoal: (id: string) => void
  addRecurring: (r: RecurringTransaction) => void
  updateRecurring: (r: RecurringTransaction) => void
  deleteRecurring: (id: string) => void
  generateOccurrence: (id: string) => void
  importTransactions: (txs: Transaction[]) => void
  updateSettings: (patch: Partial<UserSettings>) => void
  resetAll: () => void
}

export const FinanceContext = createContext<FinanceContextValue | null>(null)

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext)
  if (!ctx) {
    throw new Error('useFinance must be used within a FinanceProvider')
  }
  return ctx
}
