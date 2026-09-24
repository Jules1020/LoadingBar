"use client"

import { useEffect, useState } from "react"

/** Wall-clock ms, refreshed every `ms`. 0 on the server and first client render. */
export function useNow(ms: number) {
  const [now, setNow] = useState(0)
  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(id)
  }, [ms])
  return now
}

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatch(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [query])
  return match
}

export function isEditable(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el?.closest?.("input, textarea, select, [contenteditable='true']")
}

export function isInteractive(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el?.closest?.("button, a, input, textarea, select, [role='radio']")
}
