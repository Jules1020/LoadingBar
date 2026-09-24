import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { checkInbox, setAnnouncement } from "./inbox"
import { initialState, store } from "./store"

const reply = (body: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => body }))

beforeEach(() => {
  store.set({ ...initialState, ready: true, balance: 100, spinsEarned: 1, duration: 45 })
  setAnnouncement(null)
})
afterEach(() => vi.unstubAllGlobals())

describe("checkInbox", () => {
  it("applies money and spins gifts", async () => {
    vi.stubGlobal("fetch", reply({ announcement: null, gifts: [{ id: "1", type: "money", amount: 5000 }, { id: "2", type: "spins", amount: 3 }] }))
    await checkInbox()
    expect(store.get().balance).toBe(5100)
    expect(store.get().spinsEarned).toBe(4)
  })

  it("resets progress but keeps settings", async () => {
    vi.stubGlobal("fetch", reply({ announcement: null, gifts: [{ id: "1", type: "reset", amount: 0 }] }))
    await checkInbox()
    expect(store.get().balance).toBe(0)
    expect(store.get().spinsEarned).toBe(0)
    expect(store.get().duration).toBe(45)
  })

  it("ignores gift types it doesn't know", async () => {
    vi.stubGlobal("fetch", reply({ announcement: null, gifts: [{ id: "1", type: "pets", amount: 9 }] }))
    await checkInbox()
    expect(store.get().balance).toBe(100)
  })

  it("doesn't even ask during a session, so a reset can't land mid-session", async () => {
    const fetch = reply({ announcement: null, gifts: [{ id: "1", type: "reset", amount: 0 }] })
    vi.stubGlobal("fetch", fetch)
    store.set({ sessionRunning: true })
    await checkInbox()
    expect(fetch).not.toHaveBeenCalled()
    expect(store.get().balance).toBe(100)
  })

  it("keeps playing when offline or the server errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))))
    await expect(checkInbox()).resolves.toBeUndefined()
    vi.stubGlobal("fetch", reply({}, false))
    await expect(checkInbox()).resolves.toBeUndefined()
    expect(store.get().balance).toBe(100)
  })
})
