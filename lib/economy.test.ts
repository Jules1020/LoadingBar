import { beforeEach, describe, expect, it } from "vitest"
import {
  MAX_PET_LEVEL,
  boostPrice,
  buyBoost,
  creditSession,
  freezeDay,
  initialState,
  petRate,
  store,
  streakOf,
  totalRate,
  upgradeCost,
  upgradePet,
} from "./store"

// Thursday 24 September 2026; the week runs Mon 21 → Sun 27.
const TODAY = "2026-09-24"
beforeEach(() => store.set({ ...initialState, ready: true, today: TODAY, balance: 0 }))
const pet = () => store.get().pets[0]

describe("pet upgrades", () => {
  it("cost more at every level", () => {
    const costs = Array.from({ length: MAX_PET_LEVEL - 1 }, (_, i) => upgradeCost({ ...pet(), level: i + 1 }))
    for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeGreaterThan(costs[i - 1])
  })

  it("charge the cost, add a level and +20% base income", () => {
    const before = pet()
    const cost = upgradeCost(before)
    store.set({ balance: cost })
    expect(upgradePet(before.uid)).toBe(true)
    expect(store.get().balance).toBe(0)
    expect(pet().level).toBe(2)
    expect(petRate(pet())).toBeCloseTo(before.rate * 1.2)
  })

  it("refuse when broke, at max level, or for a pet you don't own", () => {
    expect(upgradePet(pet().uid)).toBe(false)
    store.set({ balance: 1e12, pets: store.get().pets.map((p, i) => (i === 0 ? { ...p, level: MAX_PET_LEVEL } : p)) })
    expect(upgradePet(pet().uid)).toBe(false)
    expect(pet().level).toBe(MAX_PET_LEVEL)
    expect(upgradePet("no-such-pet")).toBe(false)
    expect(store.get().balance).toBe(1e12)
  })
})

describe("2× boost", () => {
  it("is priced from your earning rate, with a floor", () => {
    const s = store.get()
    expect(boostPrice(s)).toBe(Math.max(10_000, Math.round(totalRate(s) * s.duration * 60 * 0.4)))
    expect(boostPrice({ ...s, pets: [] })).toBe(10_000)
  })

  it("can't be bought twice before it's used", () => {
    store.set({ balance: 1e9 })
    expect(buyBoost()).toBe(true)
    const after = store.get().balance
    expect(buyBoost()).toBe(false)
    expect(store.get().balance).toBe(after)
  })

  it("doubles exactly one finished session", () => {
    const normal = creditSession(25, "")
    store.set({ ...initialState, ready: true, today: TODAY, balance: 1e9 })
    buyBoost()
    expect(creditSession(25, "")).toBeCloseTo(normal * 2)
    expect(store.get().boostNext).toBe(false)
    expect(creditSession(25, "")).toBeCloseTo(normal)
  })
})

describe("streak freezes", () => {
  it("cover a missed day this week and count toward the week", () => {
    store.set({ freezeTokens: 1, targetDays: 1 })
    expect(freezeDay("2026-09-22")).toBe(true)
    expect(store.get().freezeTokens).toBe(0)
    expect(streakOf(store.get()).thisWeekGood).toBe(true)
  })

  it("need a token, and can't freeze the same day twice", () => {
    store.set({ freezeTokens: 0 })
    expect(freezeDay("2026-09-22")).toBe(false)
    store.set({ freezeTokens: 2 })
    expect(freezeDay("2026-09-22")).toBe(true)
    expect(freezeDay("2026-09-22")).toBe(false)
    expect(store.get().freezeTokens).toBe(1)
  })

  it("only cover missed days: not today, the future, days you played, or earlier weeks", () => {
    store.set({ freezeTokens: 5, history: { "2026-09-21": { sessions: 1, minutes: 25, earned: 0 } } })
    for (const key of [TODAY, "2026-09-26", "2026-09-21", "2026-09-17", "not-a-date"]) expect(freezeDay(key), key).toBe(false)
    expect(store.get().freezeTokens).toBe(5)
    expect(store.get().frozenDays).toEqual([])
  })
})
