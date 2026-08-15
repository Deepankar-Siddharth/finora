import type {
  Budget,
  FinanceData,
  PaymentMethod,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
} from '../types'
import { addMonths, currentMonthKey, shiftMonth, todayISO, toISODate } from '../utils/dates'
import { createId } from '../utils/id'
import { DEFAULT_SETTINGS } from '../constants'

/** Deterministic PRNG so demo data is stable across visits. */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

interface ExpenseTemplate {
  category: string
  count: [number, number]
  amountRange: [number, number]
  dayRange: [number, number]
  methods: PaymentMethod[]
  descriptions: string[]
}

const EXPENSE_TEMPLATES: ExpenseTemplate[] = [
  {
    category: 'Rent',
    count: [1, 1],
    amountRange: [15000, 15000],
    dayRange: [1, 1],
    methods: ['Bank Transfer'],
    descriptions: ['Monthly rent'],
  },
  {
    category: 'Bills',
    count: [1, 2],
    amountRange: [900, 2600],
    dayRange: [4, 9],
    methods: ['UPI', 'Debit Card'],
    descriptions: ['Electricity bill', 'Internet bill', 'Water bill'],
  },
  {
    category: 'Groceries',
    count: [3, 4],
    amountRange: [700, 2200],
    dayRange: [3, 28],
    methods: ['UPI', 'Debit Card'],
    descriptions: ['Weekly grocery run', 'Grocery shopping', 'Vegetables & staples', 'Kirana store'],
  },
  {
    category: 'Food',
    count: [4, 6],
    amountRange: [180, 950],
    dayRange: [2, 30],
    methods: ['UPI', 'Credit Card', 'Cash'],
    descriptions: ['Dinner with friends', 'Lunch with team', 'Coffee and snacks', 'Zomato order', 'Weekend brunch'],
  },
  {
    category: 'Transportation',
    count: [3, 5],
    amountRange: [90, 750],
    dayRange: [2, 28],
    methods: ['UPI', 'Cash'],
    descriptions: ['Metro card top-up', 'Cab ride', 'Fuel refill', 'Auto fare', 'Parking'],
  },
  {
    category: 'Shopping',
    count: [1, 2],
    amountRange: [800, 6500],
    dayRange: [7, 26],
    methods: ['Credit Card', 'Debit Card', 'UPI'],
    descriptions: ['Online shopping', 'New sneakers', 'Home decor', 'Clothes', 'Gadget upgrade'],
  },
  {
    category: 'Entertainment',
    count: [1, 2],
    amountRange: [299, 1600],
    dayRange: [8, 28],
    methods: ['Credit Card', 'UPI'],
    descriptions: ['Movie tickets', 'Concert tickets', 'Netflix subscription', 'Gaming', 'Binge box'],
  },
  {
    category: 'Health',
    count: [0, 1],
    amountRange: [350, 2400],
    dayRange: [5, 27],
    methods: ['UPI', 'Credit Card'],
    descriptions: ['Pharmacy run', 'Doctor consultation', 'Vitamins', 'Dental check-up'],
  },
  {
    category: 'Education',
    count: [0, 1],
    amountRange: [499, 1999],
    dayRange: [6, 24],
    methods: ['UPI', 'Credit Card'],
    descriptions: ['Online course', 'Workshop fee', 'Books'],
  },
  {
    category: 'Personal',
    count: [0, 1],
    amountRange: [300, 1500],
    dayRange: [5, 26],
    methods: ['Cash', 'UPI'],
    descriptions: ['Haircut', 'Grooming kit', 'Self-care'],
  },
  {
    category: 'Travel',
    count: [0, 1],
    amountRange: [3500, 14000],
    dayRange: [12, 27],
    methods: ['Credit Card', 'Bank Transfer'],
    descriptions: ['Weekend getaway', 'Flight tickets', 'Hotel booking', 'Road trip'],
  },
]

interface IncomeTemplate {
  category: string
  amountRange: [number, number]
  dayRange: [number, number]
  methods: PaymentMethod[]
  descriptions: string[]
  probability: number
}

const INCOME_TEMPLATES: IncomeTemplate[] = [
  {
    category: 'Salary',
    amountRange: [75000, 75000],
    dayRange: [1, 1],
    methods: ['Bank Transfer'],
    descriptions: ['Monthly salary'],
    probability: 1,
  },
  {
    category: 'Freelance',
    amountRange: [6500, 13500],
    dayRange: [11, 19],
    methods: ['Bank Transfer', 'UPI'],
    descriptions: ['Freelance project payment', 'Client invoice settlement', 'Design consultancy'],
    probability: 0.65,
  },
  {
    category: 'Investment',
    amountRange: [800, 4200],
    dayRange: [15, 22],
    methods: ['Bank Transfer'],
    descriptions: ['Dividend payout', 'Mutual fund redemption'],
    probability: 0.35,
  },
]

/** Build a month's demo transactions, clamped so nothing lands in the future. */
function buildMonthTransactions(monthKey: string, rng: () => number, today: string): Transaction[] {
  const transactions: Transaction[] = []
  const [year, month] = monthKey.split('-').map(Number)

  const dateInMonth = (day: number): string | null => {
    const iso = toISODate(new Date(year, month - 1, day))
    return iso <= today ? iso : null
  }

  for (const template of INCOME_TEMPLATES) {
    if (rng() > template.probability) continue
    const day = randomInt(rng, template.dayRange[0], template.dayRange[1])
    const iso = dateInMonth(day)
    if (!iso) continue
    transactions.push({
      id: createId(),
      type: 'income',
      amount: randomInt(rng, template.amountRange[0], template.amountRange[1]),
      category: template.category,
      date: iso,
      description: pick(rng, template.descriptions),
      paymentMethod: pick(rng, template.methods),
      createdAt: iso,
    })
  }

  for (const template of EXPENSE_TEMPLATES) {
    const count = randomInt(rng, template.count[0], template.count[1])
    for (let i = 0; i < count; i++) {
      const day = randomInt(rng, template.dayRange[0], template.dayRange[1])
      const iso = dateInMonth(day)
      if (!iso) continue
      transactions.push({
        id: createId(),
        type: 'expense',
        amount: randomInt(rng, template.amountRange[0], template.amountRange[1]),
        category: template.category,
        date: iso,
        description: pick(rng, template.descriptions),
        paymentMethod: pick(rng, template.methods),
        createdAt: iso,
      })
    }
  }

  return transactions
}

function buildBudgets(currentMonth: string): Budget[] {
  const lastMonth = shiftMonth(currentMonth, -1)
  const create = (month: string, category: string, limit: number): Budget => ({
    id: createId(),
    month,
    category,
    limit,
  })
  return [
    create(currentMonth, 'Food', 6000),
    create(currentMonth, 'Groceries', 5000),
    create(currentMonth, 'Transportation', 3000),
    create(currentMonth, 'Shopping', 5000),
    create(currentMonth, 'Entertainment', 2500),
    create(currentMonth, 'Bills', 12000),
    create(lastMonth, 'Food', 6000),
    create(lastMonth, 'Groceries', 5000),
    create(lastMonth, 'Shopping', 5000),
  ]
}

function buildGoals(today: string): SavingsGoal[] {
  return [
    {
      id: createId(),
      name: 'Emergency Fund',
      target: 50000,
      current: 32000,
      targetDate: addMonths(today, 8),
      createdAt: today,
    },
    {
      id: createId(),
      name: 'Goa Getaway',
      target: 60000,
      current: 24000,
      targetDate: addMonths(today, 5),
      createdAt: today,
    },
  ]
}

function buildRecurring(currentMonth: string): RecurringTransaction[] {
  const nextMonthKey = shiftMonth(currentMonth, 1)
  const nextMonthFirst = `${nextMonthKey}-01`
  return [
    {
      id: createId(),
      name: 'Monthly Salary',
      amount: 75000,
      type: 'income',
      category: 'Salary',
      frequency: 'monthly',
      nextDate: nextMonthFirst,
    },
    {
      id: createId(),
      name: 'Rent',
      amount: 15000,
      type: 'expense',
      category: 'Bills',
      frequency: 'monthly',
      nextDate: nextMonthFirst,
    },
    {
      id: createId(),
      name: 'Netflix',
      amount: 649,
      type: 'expense',
      category: 'Entertainment',
      frequency: 'monthly',
      nextDate: `${currentMonth}-20`,
    },
    {
      id: createId(),
      name: 'Spotify',
      amount: 119,
      type: 'expense',
      category: 'Entertainment',
      frequency: 'monthly',
      nextDate: `${currentMonth}-14`,
    },
    {
      id: createId(),
      name: 'Gym Membership',
      amount: 1200,
      type: 'expense',
      category: 'Health',
      frequency: 'monthly',
      nextDate: `${currentMonth}-05`,
    },
  ]
}

/**
 * Generate ~8 months of realistic fictional demo data anchored on the
 * current month so the dashboard always looks alive on first launch.
 */
export function createDemoData(): FinanceData {
  const currentMonth = currentMonthKey()
  const today = todayISO()
  const rng = mulberry32(20260815)

  const transactions: Transaction[] = []
  for (let offset = 7; offset >= 0; offset--) {
    const monthKey = shiftMonth(currentMonth, -offset)
    transactions.push(...buildMonthTransactions(monthKey, rng, today))
  }

  return {
    transactions,
    budgets: buildBudgets(currentMonth),
    goals: buildGoals(today),
    recurring: buildRecurring(currentMonth),
    settings: { ...DEFAULT_SETTINGS },
  }
}
