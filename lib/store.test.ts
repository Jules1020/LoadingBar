import { beforeEach, describe, expect, it } from "vitest"
import {
  FREEZE_PRICE,
  buyFreeze,
  buyProfileItem,
  creditSession,
  effectiveProfile,
  initialState,
  multiplier,
  petRate,
  store,
  unlockCtx,
} from "./store"
import { PROFILE_PRICE } from "./profile"

const admin = { email: "admin@example.com", admin: true }
const player = { email: "player@example.com", admin: false }

beforeEach(() => store.set({ ...initialState, ready: true, today: "2026-09-24" }))

describe("shop", () => {
  it("refuses a purchase you can't afford and changes nothing", () => {
    store.set({ balance: FREEZE_PRICE - 1 })
    expect(buyFreeze()).toBe(false)
    expect(store.get().balance).toBe(FREEZE_PRICE - 1)
    expect(store.get().freezeTokens).toBe(initialState.freezeTokens)
  })

  it("charges the price and tracks spending", () => {
    store.set({ balance: FREEZE_PRICE * 2 })
    expect(buyFreeze()).toBe(true)
    expect(store.get().balance).toBe(FREEZE_PRICE)
    expect(store.get().spent).toBe(FREEZE_PRICE)
    expect(store.get().freezeTokens).toBe(initialState.freezeTokens + 1)
  })

  it("only lets the admin shop for free", () => {
    store.set({ balance: 0, freeShopping: true, user: player })
    expect(buyFreeze()).toBe(false)
    store.set({ user: admin })
    expect(buyFreeze()).toBe(true)
    expect(store.get().balance).toBe(0)
  })

  it("buys a profile item, charges its rarity price and puts it on", () => {
    store.set({ balance: 10_000_000 })
    expect(buyProfileItem("pbg-aurora")).toBe(true)
    expect(store.get().balance).toBe(10_000_000 - PROFILE_PRICE.epic)
    expect(store.get().profile.background).toBe("pbg-aurora")
    expect(buyProfileItem("pbg-aurora")).toBe(false) // already owned
    expect(buyProfileItem("pbg-plain")).toBe(false) // free item
  })
})

describe("derived values", () => {
  it("returns the same effective profile object while nothing changes (regression)", () => {
    // Wearing an item you no longer own used to build a new object on every read,
    // which made useSyncExternalStore re-render forever.
    store.set({ profile: { ...initialState.profile, background: "pbg-galaxy" } })
    const a = effectiveProfile(store.get())
    const b = effectiveProfile(store.get())
    expect(a.background).toBe("pbg-plain")
    expect(a).toBe(b)
  })

  it("returns a stable unlock context", () => {
    expect(unlockCtx(store.get())).toBe(unlockCtx(store.get()))
  })

  it("applies the admin income boost to the admin only", () => {
    store.set({ incomeBoost: 100, user: player })
    expect(multiplier(store.get())).toBe(1)
    store.set({ user: admin })
    expect(multiplier(store.get())).toBe(100)
  })
})

describe("creditSession", () => {
  it("pays every pet for the full session, grants a spin and logs the day", () => {
    const s = store.get()
    const expected = s.pets.reduce((n, p) => n + petRate(p) * 25 * 60, 0)
    const total = creditSession(25, "Chapter 4")
    const after = store.get()
    expect(total).toBeCloseTo(expected)
    expect(after.pets.reduce((n, p) => n + p.stash, 0)).toBeCloseTo(expected)
    expect(after.spinsEarned).toBe(1)
    expect(after.sessions.at(-1)?.task).toBe("Chapter 4")
    expect(Object.values(after.history)[0]).toMatchObject({ sessions: 1, minutes: 25 })
  })
})
