"use client"

import { useEffect, useState } from "react"
import { AnimatePresence } from "motion/react"
import * as m from "motion/react-m"
import { CheckCircle2, Info, Trophy, TriangleAlert, X } from "lucide-react"
import { onToast, type Toast } from "@/lib/toast"
import { springs } from "@/lib/motion-tokens"

const ICON = { ok: CheckCircle2, err: TriangleAlert, info: Info, gold: Trophy }
const TONE = { ok: "text-go-2", err: "text-danger", info: "text-accent", gold: "text-gold" }
const LIFETIME_MS = 5000

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([])

  useEffect(
    () =>
      onToast((t) => {
        setItems((list) => [...list.slice(-3), t])
        window.setTimeout(() => setItems((list) => list.filter((x) => x.id !== t.id)), LIFETIME_MS)
      }),
    [],
  )

  return (
    <div aria-live="polite" className="pointer-events-none fixed top-16 right-3 z-[65] side:top-3 dock:top-3 side-r:right-60 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col gap-2">
      <AnimatePresence initial={false}>
        {items.map((t) => {
          const tone = t.tone ?? "info"
          const Icon = ICON[tone]
          return (
            <m.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={springs.gentle}
              className="panel pointer-events-auto flex items-start gap-3 p-3 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.8)] backdrop-blur-xl"
            >
              <Icon aria-hidden className={`mt-0.5 size-5 shrink-0 ${TONE[tone]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.body && <p className="mt-0.5 text-xs text-muted">{t.body}</p>}
              </div>
              <button
                type="button"
                onClick={() => setItems((list) => list.filter((x) => x.id !== t.id))}
                aria-label="Dismiss"
                className="grid size-6 shrink-0 cursor-pointer place-items-center rounded text-faint hover:text-fg"
              >
                <X className="size-3.5" />
              </button>
            </m.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
