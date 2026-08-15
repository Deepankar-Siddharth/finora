import type { ImportError, ImportResult, PaymentMethod, Transaction } from '../types'
import { PAYMENT_METHODS } from '../constants/categories'
import { createId } from './id'
import { toISODate } from './dates'

const EXPORT_HEADERS = ['Date', 'Type', 'Amount', 'Category', 'Description', 'Payment Method', 'Notes']

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Generate a downloadable CSV document from transactions. */
export function generateCSV(transactions: Transaction[]): string {
  const lines = [EXPORT_HEADERS.map(escapeCsvField).join(',')]
  for (const t of transactions) {
    lines.push(
      [
        t.date,
        t.type,
        String(t.amount),
        t.category,
        t.description,
        t.paymentMethod,
        t.notes ?? '',
      ]
        .map(escapeCsvField)
        .join(','),
    )
  }
  return `${lines.join('\n')}\n`
}

/** Parse CSV text into rows of raw string fields (handles quoted fields). */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((cell) => cell.trim() !== '')) rows.push(row)
      row = []
    } else {
      field += char
    }
  }
  // Last row may not end with a newline.
  row.push(field)
  if (row.some((cell) => cell.trim() !== '')) rows.push(row)
  return rows
}

function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

function matchPaymentMethod(value: string): PaymentMethod | null {
  const normalized = value.trim().toLowerCase()
  const match = PAYMENT_METHODS.find((m) => m.toLowerCase() === normalized)
  return match ?? null
}

/**
 * Validate raw CSV rows into transactions.
 * Returns successfully parsed transactions plus a per-row error report.
 * Duplicate rows (matching an existing transaction) are reported as errors.
 */
export function parseCSVToTransactions(
  text: string,
  validCategories: Set<string>,
  existing: Transaction[] = [],
): { transactions: Transaction[]; errors: ImportError[] } {
  const rows = parseCSV(text)
  if (rows.length === 0) {
    return { transactions: [], errors: [{ row: 1, reason: 'The file is empty.' }] }
  }

  const transactions: Transaction[] = []
  const errors: ImportError[] = []
  const seen = new Set(existing.map((t) => duplicateKey(t)))

  function duplicateKey(t: Pick<Transaction, 'type' | 'amount' | 'category' | 'date' | 'description' | 'paymentMethod'>): string {
    return [
      t.type,
      String(t.amount),
      t.category,
      t.date,
      t.description.toLowerCase().trim(),
      t.paymentMethod,
    ].join('|')
  }

  rows.forEach((cells, index) => {
    const rowNumber = index + 1
    // Skip a header row when it matches the expected export headers.
    const normalized = cells.map((c) => c.trim().toLowerCase())
    const isHeader =
      normalized.length >= 2 &&
      normalized[0] === 'date' &&
      normalized.includes('type') &&
      normalized.includes('amount')

    const fail = (reason: string) => {
      errors.push({ row: rowNumber, reason })
    }

    if (isHeader) return

    if (cells.length < 5) {
      fail('Missing required columns. Expected Date, Type, Amount, Category, Description, Payment Method, Notes.')
      return
    }

    const [rawDate, rawType, rawAmount, rawCategory, rawDescription, rawPayment, rawNotes] = cells

    const date = rawDate.trim()
    if (!date) return fail('Missing date.')
    if (!isISODate(date)) return fail(`Invalid date "${date}". Use yyyy-mm-dd format.`)

    const type = rawType.trim().toLowerCase()
    if (type !== 'income' && type !== 'expense') {
      return fail(`Invalid type "${rawType}". Expected "income" or "expense".`)
    }

    const amount = Number(rawAmount.trim().replace(/[₹,$]/g, ''))
    if (!Number.isFinite(amount) || amount <= 0) {
      return fail(`Invalid amount "${rawAmount}". Must be a positive number.`)
    }

    const category = rawCategory.trim()
    if (!category) return fail('Missing category.')
    if (!validCategories.has(category)) {
      return fail(`Unknown category "${category}".`)
    }

    const description = rawDescription.trim()
    if (!description) return fail('Missing description.')

    const paymentMethod = matchPaymentMethod(rawPayment?.trim() ?? '')
    if (!paymentMethod) {
      return fail(`Invalid payment method "${rawPayment}".`)
    }

    const notes = rawNotes?.trim() || undefined

    const key = duplicateKey({
      type,
      amount,
      category,
      date,
      description,
      paymentMethod,
    })
    if (seen.has(key)) {
      return fail('Duplicate transaction — this row already exists in your records.')
    }
    seen.add(key)

    transactions.push({
      id: createId(),
      type,
      amount,
      category,
      date,
      description,
      paymentMethod,
      notes,
      createdAt: toISODate(new Date()),
    })
  })

  return { transactions, errors }
}

export function summarizeImport(
  total: number,
  transactions: Transaction[],
  errors: ImportError[],
): ImportResult {
  return {
    total,
    imported: transactions.length,
    failed: errors.length,
    errors,
  }
}
