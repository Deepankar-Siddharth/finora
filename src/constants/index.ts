import type { LucideIcon } from 'lucide-react'
import { Wallet, PlusCircle, PiggyBank, BarChart3, Repeat, Settings } from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: Wallet },
  { path: '/transactions', label: 'Transactions', icon: PlusCircle },
  { path: '/budgets', label: 'Budgets', icon: PiggyBank },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/recurring', label: 'Recurring', icon: Repeat },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export const APP_NAME = 'Finora'

export const DEFAULT_SETTINGS = {
  name: 'Nayra',
  currency: 'INR',
  monthlyIncomeTarget: 75000,
  theme: 'system' as const,
}

/** Currencies Finora supports. INR is the default; others are ready to adopt. */
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
] as const
