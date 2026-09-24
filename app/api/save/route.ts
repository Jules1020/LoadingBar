import { NextResponse } from "next/server"
import { currentUser } from "@/lib/server/auth"
import { readSaveJson, writeSave } from "@/lib/server/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BYTES = 512 * 1024

/** The signed-in account's cloud save (the same JSON the browser keeps locally). */
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  return NextResponse.json({ save: await readSaveJson(user.email) })
}

export async function PUT(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  const text = await req.text()
  if (Buffer.byteLength(text, "utf8") > MAX_BYTES) return NextResponse.json({ error: "Save too large." }, { status: 413 })
  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bad shape")
  } catch {
    return NextResponse.json({ error: "Invalid save." }, { status: 400 })
  }
  await writeSave(user.email, text)
  return NextResponse.json({ ok: true })
}
