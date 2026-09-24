import { NextResponse } from "next/server"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: Request) {
  let email = ""
  try {
    const body: unknown = await req.json()
    if (body && typeof body === "object" && "email" in body && typeof body.email === "string") {
      email = body.email.trim()
    }
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 })
  }

  if (email.length > 254 || !EMAIL.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid email" }, { status: 422 })
  }

  // TODO: persist to a real list provider (Resend, Loops, Supabase...).
  // Until then this stub validates and accepts without storing anything.
  return NextResponse.json({ ok: true })
}
