import { NextResponse } from "next/server"
import {
  authConfigured,
  clearFailures,
  createSessionToken,
  isAdmin,
  normalizeEmail,
  recordFailure,
  sessionCookie,
  tooManyFailures,
  verifyPassword,
} from "@/lib/server/auth"
import { findUser } from "@/lib/server/db"

export const runtime = "nodejs"

export async function POST(req: Request) {
  if (!authConfigured()) return NextResponse.json({ error: "Accounts aren't set up on this server." }, { status: 503 })
  let body: { email?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }
  const email = normalizeEmail(body.email)
  const password = typeof body.password === "string" ? body.password : ""
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
  // Throttle both the IP and the account, so guessing one password from many IPs still gets stopped.
  const keys = [`login:${ip}`, `login:${email}`]
  if (keys.some(tooManyFailures)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 })
  }

  // The admin account lives in env (hashed), everyone else in the user store.
  const stored = isAdmin(email) ? process.env.ADMIN_PASSWORD_HASH : (await findUser(email))?.passHash
  if (!email || !password || !verifyPassword(password, stored)) {
    keys.forEach(recordFailure)
    return NextResponse.json({ error: "Wrong email or password." }, { status: 401 })
  }
  clearFailures(`login:${email}`)

  const res = NextResponse.json({ user: { email, admin: isAdmin(email) } })
  res.cookies.set(sessionCookie(createSessionToken(email)))
  return res
}
