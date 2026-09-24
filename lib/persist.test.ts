import { beforeEach, describe, expect, it } from "vitest"
import { applySave, serialize } from "./persist"
import { initialState, store } from "./store"
import { DEFAULT_EQUIPPED } from "./cosmetics"

beforeEach(() => store.set({ ...initialState, ready: true }))

describe("applySave", () => {
  it("rejects things that aren't saves", () => {
    expect(applySave(null)).toBe(false)
    expect(applySave("save")).toBe(false)
  })

  it("round-trips its own output", () => {
    store.set({ balance: 1234, duration: 45, spinsEarned: 3 })
    const saved = serialize(store.get())
    store.set({ ...initialState })
    expect(applySave(JSON.parse(JSON.stringify(saved)))).toBe(true)
    expect(store.get()).toMatchObject({ balance: 1234, duration: 45, spinsEarned: 3 })
  })

  it("repairs out-of-range or unknown values instead of trusting them", () => {
    applySave({
      balance: -50,
      duration: 9999,
      pets: [
        { name: "Cursor Cat", uid: "a", level: 99 },
        { name: "Made Up Pet", uid: "b" },
      ],
      equipped: { bar: "bar-nope", theme: "screen-cd", screen: "screen-vinyl" },
      sessionSpeed: 7,
      rig: "jackpot",
      incomeBoost: 5,
      ownedCosmetics: ["bar-gold", "not-real"],
      history: { "not-a-date": { sessions: 1 }, "2026-09-21": { sessions: 2, minutes: 50, earned: 10 } },
    })
    const s = store.get()
    expect(s.balance).toBe(0)
    expect(s.duration).toBe(180)
    expect(s.pets.map((p) => [p.name, p.level])).toEqual([["Cursor Cat", 10]])
    expect(s.equipped).toEqual({ bar: DEFAULT_EQUIPPED.bar, theme: DEFAULT_EQUIPPED.theme, screen: "screen-vinyl" })
    expect(s.sessionSpeed).toBe(1)
    expect(s.rig).toBeNull()
    expect(s.incomeBoost).toBe(1)
    expect(s.ownedCosmetics).toEqual(["bar-gold"])
    expect(Object.keys(s.history)).toEqual(["2026-09-21"])
  })
})
