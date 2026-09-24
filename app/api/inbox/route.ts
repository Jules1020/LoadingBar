import { NextResponse } from "next/server"
import { currentUser } from "@/lib/server/auth"
import { readAnnouncement, takeGifts } from "@/lib/server/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** The current announcement for everyone, plus (signed in) any gifts an admin sent. Gifts are claimed on read. */
export async function GET() {
  const [user, announcement] = await Promise.all([currentUser(), readAnnouncement()])
  const gifts = user ? await takeGifts(user.email) : []
  return NextResponse.json({ announcement, gifts })
}
