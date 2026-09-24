import { NextResponse } from "next/server"
import {
  authConfigured,
  createSessionToken,
  hashPassword,
  isAdmin,
  normalizeEmail,
  recordFailure,
  sessionCookie,
  tooManyFailures,
  validEmail,
} from "@/lib/server/auth"
import { createUser } from "@/lib/server/db"

export const runtime = "nodejs"

export async function POST(req: Request) {
  // Checked first: an account nobody can sign in to is worse than no account.
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
  // Every sign-up attempt counts, to slow down mass account creation.
  if (tooManyFailures(`signup:${ip}`)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 })
  }
  recordFailure(`signup:${ip}`)
  if (!validEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 422 })
  if (password.length < 8 || password.length > 200) {
    return NextResponse.json({ error: "Use a password of at least 8 characters." }, { status: 422 })
  }
  // The admin address is reserved; it can only sign in with the configured password.
  if (isAdmin(email) || !(await createUser(email, hashPassword(password)))) {
    return NextResponse.json({ error: "An account with this email already exists. Sign in instead." }, { status: 409 })
  }

  const res = NextResponse.json({ user: { email, admin: false } })
  res.cookies.set(sessionCookie(createSessionToken(email)))
  return res
}
