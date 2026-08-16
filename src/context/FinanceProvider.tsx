import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import type {
  Budget,
  FinanceData,
  RecurringTransaction,
  SavingsGoal,
  SyncCreds,
  SyncMeta,
  SyncSliceName,
  SyncStatus,
  Transaction,
  UserSettings,
} from '../types'
import { FinanceContext, type Action } from './FinanceContext'
import { storageService } from '../services/storage'
import { addDays, addMonths, addWeeks, addYears, todayISO } from '../utils/dates'
import {
  bumpMeta,
  clearCreds,
  decryptData,
  describeSyncError,
  financeDataEquals,
  fromRemoteData,
  getRemote,
  loadCreds,
  loadMeta,
  saveCreds,
  saveMeta,
  sliceMetaOf,
  SyncError,
  syncWithRemote,
  toRemoteData,
} from '../services/sync'

const tstamp = () => new Date().toISOString()

const SLICES_FOR: Record<Action['type'], SyncSliceName[]> = {
  ADD_TRANSACTION: ['transactions'],
  UPDATE_TRANSACTION: ['transactions'],
  DELETE_TRANSACTION: ['transactions'],
  IMPORT_TRANSACTIONS: ['transactions'],
  GENERATE_RECURRING: ['transactions'],
  ADD_BUDGET: ['budgets'],
  UPDATE_BUDGET: ['budgets'],
  DELETE_BUDGET: ['budgets'],
  ADD_GOAL: ['savingsGoals'],
  UPDATE_GOAL: ['savingsGoals'],
  DELETE_GOAL: ['savingsGoals'],
  ADD_RECURRING: ['recurringTransactions'],
  UPDATE_RECURRING: ['recurringTransactions'],
  DELETE_RECURRING: ['recurringTransactions'],
  UPDATE_SETTINGS: ['settings'],
  RESET_ALL: ['transactions', 'budgets', 'savingsGoals', 'recurringTransactions', 'settings'],
  REPLACE_STATE: [],
}

function withStamp<T extends object>(item: T, now: string): T {
  return { ...item, updatedAt: now }
}

function reducer(state: FinanceData, action: Action): FinanceData {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [withStamp(action.payload, tstamp()), ...state.transactions] }
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? withStamp(action.payload, tstamp()) : t,
        ),
      }
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.payload.id) }
    case 'ADD_BUDGET':
      return { ...state, budgets: [...state.budgets, withStamp(action.payload, tstamp())] }
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map((b) =>
          b.id === action.payload.id ? withStamp(action.payload, tstamp()) : b,
        ),
      }
    case 'DELETE_BUDGET':
      return { ...state, budgets: state.budgets.filter((b) => b.id !== action.payload.id) }
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, withStamp(action.payload, tstamp())] }
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? withStamp(action.payload, tstamp()) : g,
        ),
      }
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.payload.id) }
    case 'ADD_RECURRING':
      return { ...state, recurring: [...state.recurring, withStamp(action.payload, tstamp())] }
    case 'UPDATE_RECURRING':
      return {
        ...state,
        recurring: state.recurring.map((r) =>
          r.id === action.payload.id ? withStamp(action.payload, tstamp()) : r,
        ),
      }
    case 'DELETE_RECURRING':
      return { ...state, recurring: state.recurring.filter((r) => r.id !== action.payload.id) }
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
        updatedAt: tstamp(),
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
          r.id === item.id ? { ...r, nextDate: advanceDate(item.nextDate), updatedAt: tstamp() } : r,
        ),
      }
    }
    case 'IMPORT_TRANSACTIONS':
      return {
        ...state,
        transactions: [...action.payload.map((t) => withStamp(t, tstamp())), ...state.transactions],
      }
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

const PULL_THROTTLE_MS = 10_000
const PUSH_DEBOUNCE_MS = 1_500

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatchRaw] = useReducer(reducer, undefined, () => storageService.load())
  const [hasHydrated, setHasHydrated] = useState(false)

  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const credsRef = useRef<SyncCreds | null>(loadCreds())
  const metaRef = useRef<SyncMeta>(loadMeta())
  const generationRef = useRef(0)
  const inFlightRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPullRef = useRef(0)

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    credsRef.current ? 'idle' : 'disabled',
  )
  const [lastSyncedAt, setLastSyncedAt] = useState<string>()
  const [syncError, setSyncError] = useState<string>()

  const runSyncCycleRef = useRef<(() => Promise<void>) | null>(null)

  const schedulePush = useCallback((delay: number = PUSH_DEBOUNCE_MS) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      void runSyncCycleRef.current?.()
    }, delay)
  }, [])

  /** One synchronized pass: pull remote → merge → apply locally → write back. */
  const runSyncCycle = useCallback(async () => {
    const creds = credsRef.current
    if (!creds) return
    if (inFlightRef.current) return
    inFlightRef.current = true
    const generationAtStart = generationRef.current
    lastPullRef.current = Date.now()
    setSyncStatus('syncing')

    try {
      const localRemote = toRemoteData(stateRef.current, metaRef.current)
      const result = await syncWithRemote({
        token: creds.token,
        passphrase: creds.passphrase,
        localRemote,
      })

      const mergedFinance = fromRemoteData(result.merged)
      metaRef.current = sliceMetaOf(result.merged)
      saveMeta(metaRef.current)

      const current = stateRef.current
      if (!financeDataEquals(mergedFinance, current)) {
        dispatchRaw({ type: 'REPLACE_STATE', payload: mergedFinance })
      }

      setSyncStatus('synced')
      setLastSyncedAt(new Date().toISOString())
      setSyncError(undefined)
    } catch (err) {
      const mapped = describeSyncError(err)
      setSyncStatus(mapped.status)
      setSyncError(mapped.message)
    } finally {
      inFlightRef.current = false
      if (generationRef.current !== generationAtStart) {
        schedulePush(PUSH_DEBOUNCE_MS)
      }
    }
  }, [schedulePush])

  useEffect(() => {
    runSyncCycleRef.current = runSyncCycle
  }, [runSyncCycle])

  /** Dispatch wrapper: stamps per-slice metadata and schedules a sync push. */
  const dispatch = useCallback(
    (action: Action) => {
      dispatchRaw(action)
      const slices = SLICES_FOR[action.type]
      if (slices.length > 0) {
        metaRef.current = bumpMeta(metaRef.current, slices)
        saveMeta(metaRef.current)
        generationRef.current += 1
        if (credsRef.current) schedulePush()
      }
    },
    [schedulePush],
  )

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
        dispatchRaw({ type: 'REPLACE_STATE', payload: storageService.load() })
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // Synchronization lifecycle: initial pull, tab focus, online/offline.
  useEffect(() => {
    if (!credsRef.current) return
    runSyncCycle()

    const onFocus = () => {
      const now = Date.now()
      if (now - lastPullRef.current < PULL_THROTTLE_MS) return
      lastPullRef.current = now
      if (!inFlightRef.current) runSyncCycle()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onFocus()
    }
    const onOnline = () => {
      setSyncStatus((status) => (status === 'offline' ? 'idle' : status))
      if (!inFlightRef.current) runSyncCycle()
    }
    const onOffline = () => {
      setSyncStatus('offline')
      setSyncError('You are offline. Changes will sync when you reconnect.')
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [runSyncCycle])

  const connectSync = useCallback(
    async (token: string, passphrase: string) => {
      if (!token.trim() || !passphrase.trim()) {
        throw new SyncError('http', 'Enter both your GitHub token and encryption passphrase.')
      }
      try {
        const remote = await getRemote(token.trim())
        if (remote.envelope) {
          await decryptData(passphrase, remote.envelope)
        }
      } catch (err) {
        if (err instanceof SyncError) throw err
        throw new SyncError('http', 'Could not verify your GitHub connection.')
      }
      saveCreds({ token: token.trim(), passphrase })
      credsRef.current = { token: token.trim(), passphrase }
      setSyncStatus('idle')
      setSyncError(undefined)
      setLastSyncedAt(undefined)
      generationRef.current += 1
      schedulePush(0)
    },
    [schedulePush],
  )

  const disconnectSync = useCallback(() => {
    clearCreds()
    credsRef.current = null
    generationRef.current += 1
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    setSyncStatus('disabled')
    setSyncError(undefined)
    setLastSyncedAt(undefined)
  }, [])

  const syncNow = useCallback(() => {
    if (!credsRef.current) return
    if (inFlightRef.current) {
      schedulePush(0)
      return
    }
    runSyncCycle()
  }, [runSyncCycle, schedulePush])

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
      syncStatus,
      lastSyncedAt,
      syncError,
      connectSync,
      disconnectSync,
      syncNow,
    }
  }, [state, dispatch, syncStatus, lastSyncedAt, syncError, connectSync, disconnectSync, syncNow])

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}