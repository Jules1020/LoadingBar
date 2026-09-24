import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { hashPassword, SESSION_COOKIE } from "@/lib/server/auth"
import { findUser } from "@/lib/server/db"
import { POST as login } from "./login/route"
import { POST as signup } from "./signup/route"

const dir = mkdtempSync(path.join(tmpdir(), "lb-auth-"))
let ip = 0
/** Each call comes from a fresh IP so throttling from one test doesn't leak into the next. */
const post = (handler: (r: Request) => Promise<Response>, body: unknown, from = `10.0.0.${++ip}`) =>
  handler(new Request("http://test/api", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": from }, body: JSON.stringify(body) }))

beforeAll(() => vi.stubEnv("LOADINGBAR_DATA_DIR", dir))
beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test-secret")
  vi.stubEnv("ADMIN_EMAIL", "admin@example.com")
  vi.stubEnv("ADMIN_PASSWORD_HASH", hashPassword("admin-pass-123"))
})
afterAll(() => {
  vi.unstubAllEnvs()
  rmSync(dir, { recursive: true, force: true })
})

describe("POST /api/auth/signup", () => {
  it("creates the account in the data dir and signs you in", async () => {
    const res = await post(signup, { email: "New@Example.com", password: "long enough" })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ user: { email: "new@example.com", admin: false } })
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=`)
    expect(await findUser("new@example.com")).not.toBeNull()
  })

  it("rejects short passwords, bad emails, duplicates and the admin address", async () => {
    expect((await post(signup, { email: "x@example.com", password: "short" })).status).toBe(422)
    expect((await post(signup, { email: "nope", password: "long enough" })).status).toBe(422)
    await post(signup, { email: "dupe@example.com", password: "long enough" })
    expect((await post(signup, { email: "dupe@example.com", password: "long enough" })).status).toBe(409)
    expect((await post(signup, { email: "admin@example.com", password: "long enough" })).status).toBe(409)
  })

  it("refuses cleanly without AUTH_SECRET, before creating an account it couldn't sign in to", async () => {
    vi.stubEnv("AUTH_SECRET", "")
    const res = await post(signup, { email: "nosecret@example.com", password: "long enough" })
    expect(res.status).toBe(503)
    expect(await findUser("nosecret@example.com")).toBeNull()
  })
})

describe("POST /api/auth/login", () => {
  it("signs in a user and the admin, and rejects wrong passwords", async () => {
    await post(signup, { email: "player@example.com", password: "player-pass" })
    expect((await post(login, { email: "player@example.com", password: "player-pass" })).status).toBe(200)
    expect((await post(login, { email: "player@example.com", password: "wrong-pass" })).status).toBe(401)
    const admin = await post(login, { email: "Admin@Example.com", password: "admin-pass-123" })
    expect(await admin.json()).toEqual({ user: { email: "admin@example.com", admin: true } })
  })

  it("doesn't lock you out for signing in successfully many times", async () => {
    await post(signup, { email: "frequent@example.com", password: "frequent-pass" })
    for (let i = 0; i < 12; i++) {
      expect((await post(login, { email: "frequent@example.com", password: "frequent-pass" }, "10.9.9.9")).status).toBe(200)
    }
  })

  it("locks an account after 8 wrong passwords, even from different IPs", async () => {
    await post(signup, { email: "target@example.com", password: "target-pass" })
    for (let i = 0; i < 8; i++) expect((await post(login, { email: "target@example.com", password: "guess" })).status).toBe(401)
    expect((await post(login, { email: "target@example.com", password: "target-pass" })).status).toBe(429)
  })

  it("refuses cleanly without AUTH_SECRET", async () => {
    vi.stubEnv("AUTH_SECRET", "")
    expect((await post(login, { email: "player@example.com", password: "player-pass" })).status).toBe(503)
  })
})
