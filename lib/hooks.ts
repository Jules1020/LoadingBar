"use client"

import { useEffect, useEffectEvent, useRef } from "react"

/**
 * Marks the element with `data-offscreen` while it's scrolled out of view, which pauses its
 * CSS animations (see globals.css). `onChange` lets JS animation loops stop and restart too.
 */
export function useOffscreenPause<T extends Element>(onChange?: (visible: boolean) => void) {
  const ref = useRef<T>(null)
  const notify = useEffectEvent((visible: boolean) => onChange?.(visible))
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      ([entry]) => {
        el.toggleAttribute("data-offscreen", !entry.isIntersecting)
        notify(entry.isIntersecting)
      },
      { rootMargin: "120px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

export function isEditable(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el?.closest?.("input, textarea, select, [contenteditable='true']")
}

export function isInteractive(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el?.closest?.("button, a, input, textarea, select, [role='radio']")
}
