import type { LucideIcon } from 'lucide-react'
import {
  Utensils,
  ShoppingBag,
  Car,
  Receipt,
  Clapperboard,
  HeartPulse,
  GraduationCap,
  Plane,
  ShoppingCart,
  User,
  Shirt,
  Wallet,
  Briefcase,
  TrendingUp,
  Gift,
  Landmark,
} from 'lucide-react'

export interface CategoryMeta {
  name: string
  icon: LucideIcon
  color: string
}

/** Deterministic chart palette shared by every category. */
const CHART_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#84cc16',
  '#64748b',
]

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { name: 'Food', icon: Utensils, color: CHART_COLORS[0] },
  { name: 'Shopping', icon: ShoppingBag, color: CHART_COLORS[1] },
  { name: 'Transportation', icon: Car, color: CHART_COLORS[2] },
  { name: 'Bills', icon: Receipt, color: CHART_COLORS[3] },
  { name: 'Entertainment', icon: Clapperboard, color: CHART_COLORS[4] },
  { name: 'Health', icon: HeartPulse, color: CHART_COLORS[5] },
  { name: 'Education', icon: GraduationCap, color: CHART_COLORS[6] },
  { name: 'Travel', icon: Plane, color: CHART_COLORS[7] },
  { name: 'Groceries', icon: ShoppingCart, color: CHART_COLORS[8] },
  { name: 'Personal', icon: User, color: CHART_COLORS[9] },
  { name: 'Other', icon: Shirt, color: CHART_COLORS[10] },
]

export const INCOME_CATEGORIES: CategoryMeta[] = [
  { name: 'Salary', icon: Wallet, color: '#10b981' },
  { name: 'Freelance', icon: Briefcase, color: '#6366f1' },
  { name: 'Business', icon: Landmark, color: '#f59e0b' },
  { name: 'Investment', icon: TrendingUp, color: '#3b82f6' },
  { name: 'Gift', icon: Gift, color: '#ec4899' },
  { name: 'Other', icon: Shirt, color: '#64748b' },
]

export const ALL_CATEGORIES: CategoryMeta[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

const CATEGORY_BY_NAME = new Map<string, CategoryMeta>(
  ALL_CATEGORIES.map((c) => [c.name, c]),
)

export function getCategoryMeta(name: string): CategoryMeta {
  return (
    CATEGORY_BY_NAME.get(name) ?? {
      name,
      icon: Shirt,
      color: '#64748b',
    }
  )
}

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Other',
] as const

export const RECURRING_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const

export const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}
