/** Format a local Date as yyyy-mm-dd. */
export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Parse a yyyy-mm-dd string into a local Date. */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function todayISO(): string {
  return toISODate(new Date())
}

/** e.g. 15 Aug 2026 */
export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}): string {
  const date = parseISODate(iso)
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  }).format(date)
}

/** e.g. 15 Aug */
export function formatShortDate(iso: string): string {
  return formatDate(iso, { day: 'numeric', month: 'short' })
}

/** Return a yyyy-mm key for the given Date or ISO string. */
export function monthKeyOf(input: Date | string): string {
  const date = typeof input === 'string' ? parseISODate(input) : input
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function currentMonthKey(): string {
  return monthKeyOf(new Date())
}

/** e.g. 'August 2026' */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, (month ?? 1) - 1, 1)
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date)
}

/** e.g. 'Aug 2026' */
export function formatMonthShortLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, (month ?? 1) - 1, 1)
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' }).format(date)
}

/** Inclusive [start, end) ISO date range for a month key. */
export function monthRange(monthKey: string): { start: string; end: string } {
  const [year, month] = monthKey.split('-').map(Number)
  const start = new Date(year, (month ?? 1) - 1, 1)
  const end = new Date(year, month ?? 1, 1)
  return { start: toISODate(start), end: toISODate(end) }
}

/** Shift a month key forward (positive) or backward (negative). */
export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, (month ?? 1) - 1 + delta, 1)
  return monthKeyOf(date)
}

/** Return month keys from `from` to `to` inclusive, ascending. */
export function monthKeysBetween(from: string, to: string): string[] {
  const keys: string[] = []
  let cursor = from
  // Guard against pathological input.
  for (let i = 0; i < 1200 && cursor <= to; i++) {
    keys.push(cursor)
    cursor = shiftMonth(cursor, 1)
  }
  return keys
}

/** Date arithmetic used by recurring transactions. */
export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function addWeeks(iso: string, weeks: number): string {
  return addDays(iso, weeks * 7)
}

export function addMonths(iso: string, months: number): string {
  const date = parseISODate(iso)
  const day = date.getDate()
  date.setMonth(date.getMonth() + months)
  // Clamp to the last valid day of the target month (e.g. Jan 31 -> Feb 28).
  if (date.getDate() < day) {
    date.setDate(0)
  }
  return toISODate(date)
}

export function addYears(iso: string, years: number): string {
  const date = parseISODate(iso)
  const month = date.getMonth()
  date.setFullYear(date.getFullYear() + years)
  if (date.getMonth() !== month) {
    date.setDate(0)
  }
  return toISODate(date)
}
