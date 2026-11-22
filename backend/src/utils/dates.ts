const KEY = /^\d{4}-\d{2}-\d{2}$/

// The browser sends its own local date (?today=YYYY-MM-DD) so "today" is right in any timezone
export function todayFrom(value: unknown): string {
  return typeof value === 'string' && KEY.test(value) ? value : new Date().toISOString().slice(0, 10)
}

export function shiftDay(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
