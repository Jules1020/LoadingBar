import { NextResponse } from "next/server"
import { currentUser, isAdmin, normalizeEmail } from "@/lib/server/auth"
import { findUser, pushGift, type Gift } from "@/lib/server/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TYPES: Gift["type"][] = ["money", "spins", "reset"]
const MAX = { money: 1e15, spins: 10_000, reset: 0 }

/** Admin only: queue money, spins or a progress reset for another account. */
export async function POST(req: Request) {
  const me = await currentUser()
  if (!me?.admin) return NextResponse.json({ error: "Admins only." }, { status: 403 })
  const body = (await req.json().catch(() => null)) as { email?: unknown; type?: unknown; amount?: unknown } | null
  const email = normalizeEmail(body?.email)
  const type = TYPES.find((t) => t === body?.type)
  const amount = typeof body?.amount === "number" && Number.isFinite(body.amount) ? Math.floor(body.amount) : 0
  if (!type || !email || isAdmin(email) || !(await findUser(email))) return NextResponse.json({ error: "Unknown account." }, { status: 400 })
  if (type !== "reset" && (amount <= 0 || amount > MAX[type])) return NextResponse.json({ error: "Bad amount." }, { status: 400 })
  await pushGift(email, { type, amount })
  return NextResponse.json({ ok: true })
}
