"use client"

import { useEffect } from "react"
import { ACHIEVEMENTS } from "@/lib/achievements"
import { fetchMe, pullCloud, schedulePush } from "@/lib/account"
import { checkInbox } from "@/lib/inbox"
import { navOf } from "@/lib/cosmetics"
import { dayKey } from "@/lib/dates"
import { loadLocal, saveLocal } from "@/lib/persist"
import { effectiveEquipped, store, streakOf, useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { sfx } from "@/lib/audio"

const SAVE_DEBOUNCE_MS = 800

/**
 * Background work: loads saves (local, then cloud when signed in), keeps them
 * up to date, applies the theme, rolls the date over at midnight, and awards achievements.
 */
export function Engine() {
  const theme = useStore((s) => effectiveEquipped(s).theme)

  useEffect(() => {
    loadLocal()
    store.set({ ready: true, today: dayKey(new Date()) })

    let cancelled = false
    void fetchMe().then(async (user) => {
      if (cancelled) return
      if (!user) return void checkInbox()
      store.set({ user })
      await pullCloud()
      // Gifts apply on top of the cloud save, so check only once it's loaded.
      await checkInbox()
    })
    const inboxTimer = window.setInterval(() => void checkInbox(), 60_000)

    let timer = 0
    let lastAchCheck = ""
    const unsubscribe = store.subscribe(() => {
      schedulePush()
      if (!timer) {
        timer = window.setTimeout(() => {
          timer = 0
          saveLocal(store.get())
        }, SAVE_DEBOUNCE_MS)
      }
      // Achievements: cheap enough to check on change, but skip identical states.
      const s = store.get()
      const sig = `${s.sessions.length}|${s.pets.length}|${JSON.stringify(s.pulls)}|${Math.floor(s.balance / 1e5)}|${s.equipped.bar}${s.equipped.theme}${s.equipped.screen}|${s.targetDays}|${s.today}`
      if (sig === lastAchCheck || !s.ready) return
      lastAchCheck = sig
      const st = streakOf(s)
      const fresh = ACHIEVEMENTS.filter((a) => !s.achievements.includes(a.id) && a.check(s, st))
      if (!fresh.length) return
      store.set({ achievements: [...s.achievements, ...fresh.map((a) => a.id)] })
      sfx.levelUp()
      fresh.slice(0, 3).forEach((a) => toast({ title: `Achievement: ${a.name}`, body: a.desc, tone: "gold" }))
      if (fresh.length > 3) toast({ title: `+${fresh.length - 3} more achievements`, body: "See them all on the Stats page.", tone: "gold" })
    })

    // Check achievements once for the freshly loaded save.
    store.set({})

    // The date matters now: re-check every 30s so streaks roll over at midnight.
    const tick = window.setInterval(() => {
      const k = dayKey(new Date())
      if (k !== store.get().today) store.set({ today: k })
    }, 30_000)

    const flush = () => saveLocal(store.get())
    window.addEventListener("pagehide", flush)
    return () => {
      cancelled = true
      unsubscribe()
      window.clearTimeout(timer)
      window.clearInterval(tick)
      window.clearInterval(inboxTimer)
      window.removeEventListener("pagehide", flush)
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme.replace("theme-", "")
    document.documentElement.dataset.nav = navOf(theme)
  }, [theme])

  return null
}
