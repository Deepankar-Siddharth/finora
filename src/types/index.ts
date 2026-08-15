export type TransactionType = 'income' | 'expense'

export type PaymentMethod =
  | 'Cash'
  | 'UPI'
  | 'Credit Card'
  | 'Debit Card'
  | 'Bank Transfer'
  | 'Other'

export interface Transaction {
  id: string
  type: TransactionType
  /** Always a positive amount; the type carries the sign. */
  amount: number
  category: string
  /** ISO date string (yyyy-mm-dd). */
  date: string
  description: string
  paymentMethod: PaymentMethod
  notes?: string
  createdAt: string
}

export type BudgetStatus = 'ok' | 'almost' | 'exceeded'

export interface Budget {
  id: string
  category: string
  /** Monthly spending limit for the given month. */
  limit: number
  /** yyyy-mm */
  month: string
}

export interface SavingsGoal {
  id: string
  name: string
  target: number
  current: number
  /** ISO date string (yyyy-mm-dd). */
  targetDate?: string
  createdAt: string
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurringTransaction {
  id: string
  name: string
  amount: number
  type: TransactionType
  category: string
  frequency: RecurringFrequency
  /** ISO date string (yyyy-mm-dd) of the next expected occurrence. */
  nextDate: string
}

export type ThemePreference = 'light' | 'dark' | 'system'

export interface UserSettings {
  name: string
  /** ISO 4217 currency code, e.g. 'INR'. */
  currency: string
  monthlyIncomeTarget: number
  theme: ThemePreference
}

export interface FinanceData {
  transactions: Transaction[]
  budgets: Budget[]
  goals: SavingsGoal[]
  recurring: RecurringTransaction[]
  settings: UserSettings
}

/** Raw form payload for the transaction modal (amount kept as string for inputs). */
export interface TransactionFormValues {
  type: TransactionType
  amount: string
  category: string
  date: string
  description: string
  paymentMethod: PaymentMethod
  notes: string
}

export interface ImportError {
  row: number
  reason: string
}

export interface ImportResult {
  total: number
  imported: number
  failed: number
  errors: ImportError[]
}
