"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Keyboard, X } from "lucide-react"
import { isEditable } from "@/lib/hooks"
import { springs } from "@/lib/motion-tokens"

const KEYS: [string, string][] = [
  ["Enter", "Start a session (Home and Session pages)"],
  ["1 – 9", "Switch pages"],
  ["F", "Toggle fullscreen"],
  ["M", "Mute sound effects"],
  ["P", "Play / pause music"],
  ["Ctrl + C", "Abort a running session"],
  ["?", "Show this list"],
]

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return
      if (e.key === "?") setOpen((o) => !o)
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] grid place-items-center bg-bg/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={springs.gentle}
            onClick={(e) => e.stopPropagation()}
            className="panel w-full max-w-md p-5"
          >
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-semibold">
                <Keyboard aria-hidden className="size-4 text-accent" /> Keyboard shortcuts
              </p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid size-8 cursor-pointer place-items-center rounded-md text-muted hover:text-fg">
                <X className="size-4" />
              </button>
            </div>
            <ul className="mt-4 divide-y divide-line text-sm">
              {KEYS.map(([k, d]) => (
                <li key={k} className="flex items-center justify-between gap-4 py-2">
                  <span className="text-muted">{d}</span>
                  <kbd className="rounded border border-line-2 bg-white/5 px-2 py-0.5 font-sans text-xs whitespace-nowrap">{k}</kbd>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
