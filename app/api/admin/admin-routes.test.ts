import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { createSessionToken, SESSION_COOKIE } from "@/lib/server/auth"
import { createUser, readAnnouncement, takeGifts } from "@/lib/server/db"

// Route handlers read the session cookie through next/headers; this stands in for the request's cookies.
const jar: Record<string, string> = {}
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => (jar[name] ? { value: jar[name] } : undefined) }) }))

const { POST: gift } = await import("./gift/route")
const { PUT: announce } = await import("./announce/route")
const { GET: inbox } = await import("../inbox/route")

const dir = mkdtempSync(path.join(tmpdir(), "lb-admin-"))
const as = (email: string | null) => {
  if (email) jar[SESSION_COOKIE] = createSessionToken(email)
  else delete jar[SESSION_COOKIE]
}
const send = (body: unknown) => gift(new Request("http://test", { method: "POST", body: JSON.stringify(body) }))
const setBanner = (body: unknown) => announce(new Request("http://test", { method: "PUT", body: JSON.stringify(body) }))

beforeAll(async () => {
  vi.stubEnv("LOADINGBAR_DATA_DIR", dir)
  vi.stubEnv("AUTH_SECRET", "test-secret")
  vi.stubEnv("ADMIN_EMAIL", "admin@example.com")
  await createUser("player@example.com", "h")
})
beforeEach(() => as("admin@example.com"))
afterAll(() => {
  vi.unstubAllEnvs()
  rmSync(dir, { recursive: true, force: true })
})

describe("POST /api/admin/gift", () => {
  it("is admin only", async () => {
    as("player@example.com")
    expect((await send({ email: "player@example.com", type: "money", amount: 5 })).status).toBe(403)
    as(null)
    expect((await send({ email: "player@example.com", type: "money", amount: 5 })).status).toBe(403)
  })

  it("queues money, spins and resets for a real account", async () => {
    expect((await send({ email: "Player@Example.com", type: "money", amount: 2500 })).status).toBe(200)
    expect((await send({ email: "player@example.com", type: "spins", amount: 3 })).status).toBe(200)
    expect((await send({ email: "player@example.com", type: "reset" })).status).toBe(200)
    expect((await takeGifts("player@example.com")).map((g) => [g.type, g.amount])).toEqual([
      ["money", 2500],
      ["spins", 3],
      ["reset", 0],
    ])
  })

  it("rejects unknown accounts, the admin, unknown types and bad amounts", async () => {
    for (const body of [
      { email: "ghost@example.com", type: "money", amount: 5 },
      { email: "admin@example.com", type: "money", amount: 5 },
      { email: "player@example.com", type: "pets", amount: 5 },
      { email: "player@example.com", type: "money", amount: 0 },
      { email: "player@example.com", type: "money", amount: -100 },
      { email: "player@example.com", type: "money", amount: 0.5 },
      { email: "player@example.com", type: "money", amount: "1000" },
      { email: "player@example.com", type: "spins", amount: 1e9 },
    ]) {
      expect((await send(body)).status, JSON.stringify(body)).toBe(400)
    }
    expect(await takeGifts("player@example.com")).toEqual([])
  })

  it("answers 400 for a body that isn't JSON", async () => {
    expect((await gift(new Request("http://test", { method: "POST", body: "{nope" }))).status).toBe(400)
  })
})

describe("PUT /api/admin/announce", () => {
  it("is admin only", async () => {
    as("player@example.com")
    expect((await setBanner({ text: "hi" })).status).toBe(403)
    expect(await readAnnouncement()).toBeNull()
  })

  it("trims and caps the text at 200 characters, and clears on empty", async () => {
    await setBanner({ text: `  ${"x".repeat(300)}  ` })
    expect((await readAnnouncement())?.text).toHaveLength(200)
    await setBanner({ text: "   " })
    expect(await readAnnouncement()).toBeNull()
  })
})

describe("GET /api/inbox", () => {
  it("shows guests the announcement without touching anyone's gifts", async () => {
    await setBanner({ text: "Maintenance at 6" })
    await send({ email: "player@example.com", type: "spins", amount: 1 })
    as(null)
    expect(await (await inbox()).json()).toMatchObject({ announcement: { text: "Maintenance at 6" }, gifts: [] })
    as("player@example.com")
    const mine = await (await inbox()).json()
    expect(mine.gifts).toHaveLength(1)
    expect((await (await inbox()).json()).gifts).toHaveLength(0)
  })
})
