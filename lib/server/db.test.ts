import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { createUser, deleteUser, findUser, listUsers, pushGift, readAnnouncement, readSave, takeGifts, writeAnnouncement, writeSave } from "./db"

const dir = mkdtempSync(path.join(tmpdir(), "lb-db-"))
beforeAll(() => vi.stubEnv("LOADINGBAR_DATA_DIR", dir))
afterAll(() => {
  vi.unstubAllEnvs()
  rmSync(dir, { recursive: true, force: true })
})

describe("accounts", () => {
  it("creates, finds, lists and deletes (with their save and inbox)", async () => {
    expect(await createUser("a@example.com", "hash")).toBe(true)
    expect(await createUser("a@example.com", "other")).toBe(false)
    expect((await findUser("a@example.com"))?.passHash).toBe("hash")
    await writeSave("a@example.com", "{}")
    await pushGift("a@example.com", { type: "money", amount: 5 })
    expect(await deleteUser("a@example.com")).toBe(true)
    expect(await findUser("a@example.com")).toBeNull()
    expect(await readSave("a@example.com")).toBeNull()
    expect(await takeGifts("a@example.com")).toEqual([])
  })

  it("keeps every account when many sign up at the same moment", async () => {
    await Promise.all(Array.from({ length: 20 }, (_, i) => createUser(`burst${i}@example.com`, "h")))
    const emails = (await listUsers()).map((u) => u.email)
    for (let i = 0; i < 20; i++) expect(emails).toContain(`burst${i}@example.com`)
  })
})

describe("gifts", () => {
  it("are delivered exactly once, to the right account", async () => {
    await pushGift("p1@example.com", { type: "money", amount: 1000 })
    await pushGift("p1@example.com", { type: "spins", amount: 3 })
    await pushGift("p2@example.com", { type: "reset", amount: 0 })
    const first = await takeGifts("p1@example.com")
    expect(first.map((g) => [g.type, g.amount])).toEqual([
      ["money", 1000],
      ["spins", 3],
    ])
    expect(first[0].id).not.toBe(first[1].id)
    expect(await takeGifts("p1@example.com")).toEqual([])
    expect((await takeGifts("p2@example.com")).map((g) => g.type)).toEqual(["reset"])
  })

  it("doesn't drop gifts sent at the same time (e.g. a double-click)", async () => {
    await Promise.all(Array.from({ length: 15 }, () => pushGift("burst@example.com", { type: "money", amount: 1 })))
    expect(await takeGifts("burst@example.com")).toHaveLength(15)
  })

  it("keeps only the latest 50 pending gifts", async () => {
    for (let i = 0; i < 55; i++) await pushGift("many@example.com", { type: "money", amount: i + 1 })
    const gifts = await takeGifts("many@example.com")
    expect(gifts).toHaveLength(50)
    expect(gifts[0].amount).toBe(6)
  })
})

describe("announcement", () => {
  it("is empty by default, can be set, and clears with empty text", async () => {
    expect(await readAnnouncement()).toBeNull()
    await writeAnnouncement("Double pay weekend")
    expect((await readAnnouncement())?.text).toBe("Double pay weekend")
    await writeAnnouncement("")
    expect(await readAnnouncement()).toBeNull()
  })
})
