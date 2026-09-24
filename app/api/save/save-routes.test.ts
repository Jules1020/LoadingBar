import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { createSessionToken, SESSION_COOKIE } from "@/lib/server/auth"
import { createUser, writeSave } from "@/lib/server/db"

const jar: Record<string, string> = {}
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => (jar[name] ? { value: jar[name] } : undefined) }) }))

const { GET: getSave, PUT: putSave } = await import("./route")
const { GET: leaderboard } = await import("../leaderboard/route")
const { GET: adminUsers } = await import("../admin/users/route")

const dir = mkdtempSync(path.join(tmpdir(), "lb-save-"))
const as = (email: string | null) => {
  if (email) jar[SESSION_COOKIE] = createSessionToken(email)
  else delete jar[SESSION_COOKIE]
}
const put = (body: string) => putSave(new Request("http://test", { method: "PUT", body }))

beforeAll(async () => {
  vi.stubEnv("LOADINGBAR_DATA_DIR", dir)
  vi.stubEnv("AUTH_SECRET", "test-secret")
  vi.stubEnv("ADMIN_EMAIL", "admin@example.com")
  for (const e of ["ann@example.com", "bob@example.com", "broken@example.com"]) await createUser(e, "h")
})
afterAll(() => {
  vi.unstubAllEnvs()
  rmSync(dir, { recursive: true, force: true })
})

describe("/api/save", () => {
  it("needs you to be signed in", async () => {
    as(null)
    expect((await getSave()).status).toBe(401)
    expect((await put("{}")).status).toBe(401)
  })

  it("starts empty, stores your save, and only ever returns your own", async () => {
    as("ann@example.com")
    expect(await (await getSave()).json()).toEqual({ save: null })
    expect((await put(JSON.stringify({ balance: 42 }))).status).toBe(200)
    expect(await (await getSave()).json()).toEqual({ save: { balance: 42 } })
    as("bob@example.com")
    expect(await (await getSave()).json()).toEqual({ save: null })
  })

  it("rejects anything that isn't a JSON object", async () => {
    as("ann@example.com")
    for (const body of ["", "not json", "[]", "null", "42", '"text"']) expect((await put(body)).status, body).toBe(400)
    expect(await (await getSave()).json()).toEqual({ save: { balance: 42 } })
  })

  it("caps saves at 512 KB of actual bytes, not characters", async () => {
    as("ann@example.com")
    expect((await put(JSON.stringify({ pad: "x".repeat(600_000) }))).status).toBe(413)
    // 300k two-byte characters: under the limit in characters, ~600 KB in bytes.
    expect((await put(JSON.stringify({ pad: "é".repeat(300_000) }))).status).toBe(413)
    expect((await put(JSON.stringify({ pad: "x".repeat(400_000) }))).status).toBe(200)
  })
})

describe("readers of other players' saves", () => {
  it("skip a corrupt save file instead of failing for everyone", async () => {
    as("bob@example.com")
    await put(JSON.stringify({ balance: 900, pets: [{ name: "Cursor Cat" }] }))
    await writeSave("broken@example.com", "{this is not json")

    const board = await leaderboard()
    expect(board.status).toBe(200)
    const data = await board.json()
    expect(data.balance.map((r: { value: number }) => r.value)).toContain(900)

    as("admin@example.com")
    const users = await adminUsers()
    expect(users.status).toBe(200)
    expect((await users.json()).users).toHaveLength(3)
  })
})
