// Local-calendar date helpers. Days are keyed "YYYY-MM-DD" in the user's timezone;
// weeks run Monday → Sunday.

const pad = (n: number) => String(n).padStart(2, "0")

export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function fromKey(key: string) {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() + n)
  return x
}

/** Monday of the week containing `d`, at local midnight. */
export function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export const fmtDate = (d: Date, opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }) =>
  d.toLocaleDateString("en-US", opts)

export function greeting(d: Date) {
  const h = d.getHours()
  if (h < 5) return "Burning the midnight oil"
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

export const isDayKey = (k: string) => /^\d{4}-\d{2}-\d{2}$/.test(k)
