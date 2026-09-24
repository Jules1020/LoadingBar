import { NextResponse } from "next/server"
import { currentUser, isAdmin, normalizeEmail } from "@/lib/server/auth"
import { deleteUser, listUsers, readSave } from "@/lib/server/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SaveLike = { savedAt?: number; balance?: number; pets?: unknown[]; history?: Record<string, { minutes?: number }> }

/** Admin only: every account with a summary of its cloud save. */
export async function GET() {
  const me = await currentUser()
  if (!me?.admin) return NextResponse.json({ error: "Admins only." }, { status: 403 })
  const users = await listUsers()
  const rows = await Promise.all(
    users.map(async (u) => {
      const raw = await readSave(u.email)
      const s: SaveLike = raw ? JSON.parse(raw) : {}
      return {
        email: u.email,
        createdAt: u.createdAt,
        savedAt: s.savedAt ?? null,
        balance: s.balance ?? 0,
        pets: Array.isArray(s.pets) ? s.pets.length : 0,
        minutes: Object.values(s.history ?? {}).reduce((n, d) => n + (d.minutes ?? 0), 0),
      }
    }),
  )
  return NextResponse.json({ users: rows.sort((a, b) => b.createdAt - a.createdAt) })
}

export async function DELETE(req: Request) {
  const me = await currentUser()
  if (!me?.admin) return NextResponse.json({ error: "Admins only." }, { status: 403 })
  const email = normalizeEmail(new URL(req.url).searchParams.get("email"))
  if (!email || isAdmin(email)) return NextResponse.json({ error: "Can't delete that account." }, { status: 400 })
  return NextResponse.json({ ok: await deleteUser(email) })
}
