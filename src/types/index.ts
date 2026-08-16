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
  /** ISO timestamp of the last mutation. Optional for backwards compatibility. */
  updatedAt?: string
}

export type BudgetStatus = 'ok' | 'almost' | 'exceeded'

export interface Budget {
  id: string
  category: string
  /** Monthly spending limit for the given month. */
  limit: number
  /** yyyy-mm */
  month: string
  /** ISO timestamp of the last mutation. Optional for backwards compatibility. */
  updatedAt?: string
}

export interface SavingsGoal {
  id: string
  name: string
  target: number
  current: number
  /** ISO date string (yyyy-mm-dd). */
  targetDate?: string
  createdAt: string
  /** ISO timestamp of the last mutation. Optional for backwards compatibility. */
  updatedAt?: string
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
  /** ISO timestamp of the last mutation. Optional for backwards compatibility. */
  updatedAt?: string
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

// ---- Synchronization ------------------------------------------------------

export type SyncStatus =
  | 'disabled'
  | 'idle'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'error'

export interface SyncCreds {
  /** GitHub personal access token (kept only in this browser). */
  token: string
  /** Encryption passphrase used to derive the AES key (never stored remotely). */
  passphrase: string
}

export type SyncSliceName =
  | 'settings'
  | 'transactions'
  | 'budgets'
  | 'savingsGoals'
  | 'recurringTransactions'

/** Per-slice locally tracked "last changed" timestamp (ISO string). */
export type SyncMeta = Partial<Record<SyncSliceName, string>>

/**
 * Public envelope written to `.data/finora.json`. Contains ciphertext only —
 * plaintext financial slices never appear here.
 */
export interface SyncEnvelope {
  format: 'finora-encrypted'
  version: 1
  iv: string
  salt: string
  ciphertext: string
}

/** One decrypted slice: data plus the instant it was last written. */
export interface SyncSlice<T> {
  data: T
  updatedAt?: string
}

/** Decrypted payload. Only value ever encrypted inside the envelope. */
export interface SyncRemoteData {
  version: 1
  slices: {
    settings: SyncSlice<UserSettings>
    transactions: SyncSlice<Transaction[]>
    budgets: SyncSlice<Budget[]>
    savingsGoals: SyncSlice<SavingsGoal[]>
    recurringTransactions: SyncSlice<RecurringTransaction[]>
  }
}

export interface SyncResult {
  merged: SyncRemoteData
  /** Whether this run wrote to the remote file (create or update). */
  remoteWritten: boolean
}
