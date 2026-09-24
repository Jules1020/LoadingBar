import { NextResponse } from "next/server"
import { computeStreak, type DayLog } from "@/lib/streak"
import { dayKey } from "@/lib/dates"
import { listUsers, readSaveJson } from "@/lib/server/db"
import { validProfile, type Profile } from "@/lib/profile"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SaveLike = { balance?: number; pets?: { name?: string }[]; history?: Record<string, DayLog>; frozenDays?: string[]; targetDays?: number; profile?: unknown }
/** What the podium shows of a profile. Uploaded images stay private (and would bloat the response). */
export type Look = Pick<Profile, "avatar" | "colors" | "frame" | "nameStyle">
export type Row = { id: string; name: string; value: number; look: Look }

/** Public: top 10 accounts by wallet, pets collected and streak. Emails are masked. */
export async function GET() {
  const users = await listUsers()
  const today = dayKey(new Date())
  const rows = await Promise.all(
    users.map(async (u) => {
      const s: SaveLike = (await readSaveJson(u.email)) ?? {}
      const [local, domain] = u.email.split("@")
      const id = `${local[0]}***@${domain}`
      const p = validProfile(s.profile)
      const name = p.name.trim() || id
      const look: Look = { avatar: p.avatar.startsWith("pet:") ? p.avatar : "", colors: p.colors, frame: p.frame, nameStyle: p.nameStyle }
      const pets = Array.isArray(s.pets) ? new Set(s.pets.map((p) => p?.name)).size : 0
      const streak = computeStreak(s.history ?? {}, s.frozenDays ?? [], s.targetDays ?? 4, today).current
      return { id, name, look, balance: s.balance ?? 0, pets, streak }
    }),
  )
  const top = (key: "balance" | "pets" | "streak"): Row[] =>
    [...rows]
      .sort((a, b) => b[key] - a[key])
      .slice(0, 10)
      .map((r) => ({ id: r.id, name: r.name, look: r.look, value: r[key] }))
  return NextResponse.json({ balance: top("balance"), pets: top("pets"), streak: top("streak"), players: rows.length })
}
