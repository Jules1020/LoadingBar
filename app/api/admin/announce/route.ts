import { NextResponse } from "next/server"
import { currentUser } from "@/lib/server/auth"
import { writeAnnouncement } from "@/lib/server/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Admin only: set the banner every player sees (empty text clears it). */
export async function PUT(req: Request) {
  const me = await currentUser()
  if (!me?.admin) return NextResponse.json({ error: "Admins only." }, { status: 403 })
  const body = (await req.json().catch(() => null)) as { text?: unknown } | null
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 200) : ""
  await writeAnnouncement(text)
  return NextResponse.json({ ok: true })
}
