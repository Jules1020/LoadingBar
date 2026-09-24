"use client"

import { useEffect, useState } from "react"
import { Megaphone, X } from "lucide-react"
import { useAnnouncement } from "@/lib/inbox"

const DISMISSED_KEY = "lb-announce-dismissed"

/** Banner for the admin's broadcast. Dismissing hides that message only; a new one shows again. */
export function Announcement() {
  const a = useAnnouncement()
  const [dismissed, setDismissed] = useState<number | null>(null)
  useEffect(() => {
    try {
      setDismissed(Number(localStorage.getItem(DISMISSED_KEY)) || 0)
    } catch {
      setDismissed(0)
    }
  }, [])
  if (!a || dismissed === null || dismissed === a.at) return null
  return (
    <div role="status" className="flex shrink-0 items-center gap-3 border-b border-gold/30 bg-gold/10 px-4 py-2 text-sm">
      <Megaphone aria-hidden className="size-4 shrink-0 text-gold" />
      <p className="min-w-0 flex-1">
        <span className="font-semibold text-gold">Announcement · </span>
        {a.text}
      </p>
      <button
        type="button"
        onClick={() => {
          setDismissed(a.at)
          try {
            localStorage.setItem(DISMISSED_KEY, String(a.at))
          } catch {
            // fine: it just shows again next visit
          }
        }}
        aria-label="Dismiss announcement"
        className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted hover:bg-white/[0.07] hover:text-fg"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
