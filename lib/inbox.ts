"use client"

import { useSyncExternalStore } from "react"
import { resetProgress, store } from "./store"
import { toast } from "./toast"
import { fmtMoney } from "./format"
import { sfx } from "./audio"

// Admin broadcasts and gifts. The banner text lives here (not in the save);
// gifts are applied to this browser's progress as soon as they arrive.

export type Announcement = { text: string; at: number }
type Gift = { id: string; type: "money" | "spins" | "reset"; amount: number }

let current: Announcement | null = null
const listeners = new Set<() => void>()

export function useAnnouncement() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => void listeners.delete(l)
    },
    () => current,
    () => null,
  )
}

export function setAnnouncement(a: Announcement | null) {
  current = a
  listeners.forEach((l) => l())
}

function apply(g: Gift) {
  if (g.type === "money") {
    store.set((s) => ({ balance: s.balance + g.amount }))
    toast({ title: `An admin sent you ${fmtMoney(g.amount)}`, body: "It's in your wallet.", tone: "gold" })
  } else if (g.type === "spins") {
    store.set((s) => ({ spinsEarned: s.spinsEarned + g.amount }))
    toast({ title: `An admin sent you ${g.amount} spin${g.amount > 1 ? "s" : ""}`, body: "Head to the wheel.", tone: "gold" })
  } else if (g.type === "reset") {
    resetProgress()
    toast({ title: "Your progress was reset by an admin", tone: "info" })
  }
}

export async function checkInbox() {
  // Gifts are claimed on read, so don't read mid-session: a reset would pull the rug out.
  if (store.get().sessionRunning) return
  try {
    const res = await fetch("/api/inbox", { cache: "no-store" })
    if (!res.ok) return
    const data = (await res.json()) as { announcement: Announcement | null; gifts: Gift[] }
    setAnnouncement(data.announcement)
    if (data.gifts?.length) {
      data.gifts.forEach(apply)
      sfx.coin()
    }
  } catch {
    // offline: try again later
  }
}
