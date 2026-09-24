import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  clearFailures,
  createSessionToken,
  hashPassword,
  isAdmin,
  normalizeEmail,
  readSessionToken,
  recordFailure,
  tooManyFailures,
  validEmail,
  verifyPassword,
} from "./auth"

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test-secret")
  vi.stubEnv("ADMIN_EMAIL", " Admin@Example.com ")
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe("passwords", () => {
  it("verifies the right password and rejects the wrong one", () => {
    const hash = hashPassword("correct horse")
    expect(verifyPassword("correct horse", hash)).toBe(true)
    expect(verifyPassword("correct hors", hash)).toBe(false)
  })

  it("salts every hash", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"))
  })

  it("rejects missing or malformed stored hashes instead of throwing", () => {
    for (const stored of [undefined, "", "nocolon", ":", "abcd:", "zz:zz", `${"ab".repeat(16)}:`]) {
      expect(verifyPassword("anything", stored)).toBe(false)
    }
  })
})

describe("session tokens", () => {
  it("round-trips the email", () => {
    expect(readSessionToken(createSessionToken("a@b.co"))).toEqual({ email: "a@b.co" })
  })

  it("rejects a tampered payload or signature", () => {
    const [payload, sig] = createSessionToken("a@b.co").split(".")
    const forged = Buffer.from(JSON.stringify({ email: "admin@example.com", exp: Date.now() + 1e9 })).toString("base64url")
    expect(readSessionToken(`${forged}.${sig}`)).toBeNull()
    expect(readSessionToken(`${payload}.${sig.slice(0, -2)}xx`)).toBeNull()
    expect(readSessionToken(`${payload}.`)).toBeNull()
    expect(readSessionToken("garbage")).toBeNull()
    expect(readSessionToken(undefined)).toBeNull()
  })

  it("rejects a token signed with another secret", () => {
    const token = createSessionToken("a@b.co")
    vi.stubEnv("AUTH_SECRET", "rotated")
    expect(readSessionToken(token)).toBeNull()
  })

  it("expires after 30 days", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-24T12:00:00Z"))
    const token = createSessionToken("a@b.co")
    vi.setSystemTime(new Date("2026-10-23T12:00:00Z"))
    expect(readSessionToken(token)).not.toBeNull()
    vi.setSystemTime(new Date("2026-10-25T12:00:00Z"))
    expect(readSessionToken(token)).toBeNull()
  })

  it("fails closed without AUTH_SECRET: an old cookie means signed out, not a crash", () => {
    const token = createSessionToken("a@b.co")
    vi.stubEnv("AUTH_SECRET", "")
    expect(readSessionToken(token)).toBeNull()
    expect(() => createSessionToken("a@b.co")).toThrow(/AUTH_SECRET/)
  })
})

describe("admin and emails", () => {
  it("matches the admin email however it's typed in the env", () => {
    expect(isAdmin("admin@example.com")).toBe(true)
    expect(isAdmin("someone@example.com")).toBe(false)
  })

  it("has no admin when ADMIN_EMAIL is unset, even for an empty email", () => {
    vi.stubEnv("ADMIN_EMAIL", "")
    expect(isAdmin("")).toBe(false)
    expect(isAdmin("admin@example.com")).toBe(false)
  })

  it("normalizes and validates emails", () => {
    expect(normalizeEmail("  Jo@Example.COM ")).toBe("jo@example.com")
    expect(normalizeEmail(42)).toBe("")
    expect(validEmail("jo@example.com")).toBe(true)
    for (const bad of ["", "jo", "jo@", "jo@example", "j o@example.com", `${"a".repeat(250)}@x.co`]) expect(validEmail(bad)).toBe(false)
  })
})

describe("login throttling", () => {
  it("allows 8 failures, then blocks the key for 10 minutes", () => {
    vi.useFakeTimers()
    const key = `t:${Math.random()}`
    for (let i = 0; i < 8; i++) {
      expect(tooManyFailures(key)).toBe(false)
      recordFailure(key)
    }
    expect(tooManyFailures(key)).toBe(true)
    vi.advanceTimersByTime(10 * 60_000 + 1)
    expect(tooManyFailures(key)).toBe(false)
  })

  it("clears the count after a success, and keys don't affect each other", () => {
    const a = `a:${Math.random()}`
    const b = `b:${Math.random()}`
    for (let i = 0; i < 8; i++) recordFailure(a)
    expect(tooManyFailures(b)).toBe(false)
    clearFailures(a)
    expect(tooManyFailures(a)).toBe(false)
  })
})
