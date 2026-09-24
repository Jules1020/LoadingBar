import { describe, expect, it } from "vitest"
import { computeStreak, type DayLog } from "./streak"

// Thursday 24 September 2026; its week runs Mon 21 → Sun 27.
const TODAY = "2026-09-24"
const log = (...days: string[]): Record<string, DayLog> => Object.fromEntries(days.map((d) => [d, { sessions: 1, minutes: 25, earned: 0 }]))

describe("computeStreak", () => {
  it("is empty with no history", () => {
    const s = computeStreak({}, [], 2, TODAY)
    expect(s.current).toBe(0)
    expect(s.best).toBe(0)
    expect(s.weekStart).toBe("2026-09-21")
  })

  it("counts this week once it reaches the target", () => {
    const s = computeStreak(log("2026-09-21", "2026-09-22"), [], 2, TODAY)
    expect(s.thisWeekGood).toBe(true)
    expect(s.current).toBe(1)
  })

  it("keeps the streak alive while the current week is still in progress", () => {
    const history = log("2026-09-07", "2026-09-08", "2026-09-14", "2026-09-15", "2026-09-21")
    const s = computeStreak(history, [], 2, TODAY)
    expect(s.thisWeekGood).toBe(false)
    expect(s.current).toBe(2)
  })

  it("breaks on a missed week", () => {
    const history = log("2026-09-07", "2026-09-08", "2026-09-21", "2026-09-22")
    expect(computeStreak(history, [], 2, TODAY).current).toBe(1)
  })

  it("counts freezes as active days", () => {
    const s = computeStreak(log("2026-09-14"), ["2026-09-15"], 2, TODAY)
    expect(s.current).toBe(1)
  })

  it("remembers the best run after it ends", () => {
    const history = log("2026-08-03", "2026-08-04", "2026-08-10", "2026-08-11", "2026-08-17", "2026-08-18", "2026-09-21")
    const s = computeStreak(history, [], 2, TODAY)
    expect(s.best).toBe(3)
    expect(s.current).toBe(0)
  })

  it("labels this week's days", () => {
    const s = computeStreak(log("2026-09-21"), ["2026-09-22"], 2, TODAY)
    expect(s.days.map((d) => d.status)).toEqual(["done", "frozen", "missed", "today", "future", "future", "future"])
  })

  it("returns the same object for the same inputs (safe for useSyncExternalStore)", () => {
    const history = log("2026-09-21")
    const frozen: string[] = []
    expect(computeStreak(history, frozen, 2, TODAY)).toBe(computeStreak(history, frozen, 2, TODAY))
  })
})
