// Server-only auth helpers: scrypt password hashes, HMAC-signed session cookies,
// and a small in-memory rate limiter. Never import this from client components.

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export const SESSION_COOKIE = "lb_session"
const SESSION_DAYS = 30

function secret() {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error("AUTH_SECRET is not set (see .env.local)")
  return s
}

export function hashPassword(password: string) {
  const salt = randomBytes(16)
  return `${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`
}

export function verifyPassword(password: string, stored: string | undefined) {
  if (!stored) return false
  const [saltHex, hashHex] = stored.split(":")
  if (!saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, "hex")
  if (!expected.length) return false
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length)
  return timingSafeEqual(expected, actual)
}

const b64 = (s: string) => Buffer.from(s).toString("base64url")
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url")

export function createSessionToken(email: string) {
  const payload = b64(JSON.stringify({ email, exp: Date.now() + SESSION_DAYS * 86_400_000 }))
  return `${payload}.${sign(payload)}`
}

export function readSessionToken(token: string | undefined): { email: string } | null {
  if (!token) return null
  const [payload, sig] = token.split(".")
  if (!payload || !sig) return null
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { email?: unknown; exp?: unknown }
    if (typeof data.email !== "string" || typeof data.exp !== "number" || data.exp < Date.now()) return null
    return { email: data.email }
  } catch {
    return null
  }
}

export const sessionCookie = (token: string) => ({
  name: SESSION_COOKIE,
  value: token,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 86_400,
})

export const adminEmail = () => (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase()
export const isAdmin = (email: string) => !!adminEmail() && email === adminEmail()

export async function currentUser() {
  const jar = await cookies()
  const session = readSessionToken(jar.get(SESSION_COOKIE)?.value)
  return session ? { email: session.email, admin: isAdmin(session.email) } : null
}

export const normalizeEmail = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "")
export const validEmail = (e: string) => e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)

// 8 attempts per key per 10 minutes. In-memory: resets on server restart, fine for a prototype.
const attempts = new Map<string, { n: number; reset: number }>()
export function rateLimited(key: string) {
  const now = Date.now()
  const a = attempts.get(key)
  if (!a || a.reset < now) {
    attempts.set(key, { n: 1, reset: now + 10 * 60_000 })
    return false
  }
  a.n += 1
  return a.n > 8
}
