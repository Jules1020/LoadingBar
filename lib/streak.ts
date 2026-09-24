import { addDays, dayKey, fromKey, startOfWeek } from "./dates"

// Streaks come from the real calendar: a week (Mon–Sun) is "good" when the number
// of days with at least one finished session (or a freeze) reaches your target.
// The current week counts once it's good; until then the streak is still alive.

export type DayLog = { sessions: number; minutes: number; earned: number }
export type DayStatus = "done" | "frozen" | "missed" | "today" | "future"

export type StreakInfo = {
  current: number
  best: number
  thisWeekActive: number
  thisWeekGood: boolean
  weekStart: string
  days: { key: string; status: DayStatus; sessions: number; minutes: number }[]
  recentWeeks: { start: string; active: number; good: boolean }[]
}

const EMPTY: StreakInfo = { current: 0, best: 0, thisWeekActive: 0, thisWeekGood: false, weekStart: "", days: [], recentWeeks: [] }

let cache: { history: unknown; frozen: unknown; target: number; today: string; value: StreakInfo } | null = null

export function computeStreak(history: Record<string, DayLog>, frozen: string[], target: number, today: string): StreakInfo {
  if (!today) return EMPTY
  if (cache && cache.history === history && cache.frozen === frozen && cache.target === target && cache.today === today) {
    return cache.value
  }

  const fz = new Set(frozen)
  const active = (k: string) => (history[k]?.sessions ?? 0) > 0 || fz.has(k)
  const weekActive = (start: Date) => {
    let n = 0
    for (let i = 0; i < 7; i++) if (active(dayKey(addDays(start, i)))) n++
    return n
  }

  const ws = startOfWeek(fromKey(today))
  const thisWeekActive = weekActive(ws)
  const thisWeekGood = thisWeekActive >= target

  let current = thisWeekGood ? 1 : 0
  for (let w = addDays(ws, -7), i = 0; i < 520 && weekActive(w) >= target; i++, w = addDays(w, -7)) current++

  let best = current
  const keys = [...Object.keys(history).filter((k) => history[k].sessions > 0), ...frozen].sort()
  if (keys.length) {
    let run = 0
    for (let w = startOfWeek(fromKey(keys[0])); w.getTime() <= ws.getTime(); w = addDays(w, 7)) {
      const good = weekActive(w) >= target
      run = good ? run + 1 : w.getTime() === ws.getTime() ? run : 0
      best = Math.max(best, run)
    }
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const key = dayKey(addDays(ws, i))
    const log = history[key]
    const status: DayStatus =
      (log?.sessions ?? 0) > 0 ? "done" : fz.has(key) ? "frozen" : key === today ? "today" : key > today ? "future" : "missed"
    return { key, status, sessions: log?.sessions ?? 0, minutes: log?.minutes ?? 0 }
  })

  const recentWeeks = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(ws, -7 * (7 - i))
    const a = weekActive(start)
    return { start: dayKey(start), active: a, good: a >= target }
  })

  const value = { current, best, thisWeekActive, thisWeekGood, weekStart: dayKey(ws), days, recentWeeks }
  cache = { history, frozen, target, today, value }
  return value
}
