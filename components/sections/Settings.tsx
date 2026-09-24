"use client"

import { useState } from "react"
import { AnimatePresence } from "motion/react"
import * as m from "motion/react-m"
import { Database, Gauge, Music2, Palette, Rows3, ShieldCheck, SwatchBook } from "lucide-react"
import { motionTokens } from "@/lib/motion-tokens"
import { isAdmin, useStore } from "@/lib/store"
import { PageFrame } from "../PageFrame"
import { CosmeticGrid } from "./settings/Cosmetics"
import { SessionSettings } from "./settings/SessionTab"
import { AudioSettings } from "./settings/AudioTab"
import { DataSettings } from "./settings/DataTab"
import { AdminSettings } from "./settings/AdminTab"

const TABS = [
  { id: "bar", label: "Loading bar", icon: Rows3 },
  { id: "theme", label: "Theme", icon: Palette },
  { id: "screen", label: "Loading screen", icon: SwatchBook },
  { id: "session", label: "Session", icon: Gauge },
  { id: "audio", label: "Audio & music", icon: Music2 },
  { id: "data", label: "Data", icon: Database },
  { id: "admin", label: "Admin", icon: ShieldCheck, admin: true },
] as const
type Tab = (typeof TABS)[number]["id"]

export function Settings() {
  const [tab, setTab] = useState<Tab>("bar")
  const admin = useStore(isAdmin)
  const tabs = TABS.filter((t) => !("admin" in t) || admin)
  const current = tab === "admin" && !admin ? "bar" : tab

  return (
    <PageFrame
      eyebrow="Settings"
      title="Customize"
      subtitle="Skins, themes and loading screens drop from the wheel; some unlock with streaks. Pick what you've earned."
      actions={
        admin ? (
          <span className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1.5 text-xs font-semibold text-gold">
            <ShieldCheck aria-hidden className="size-3.5" /> Admin
          </span>
        ) : undefined
      }
    >
      <div className="grid h-full gap-4 lg:grid-cols-[210px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={current === id ? "page" : undefined}
              className={`flex h-10 shrink-0 cursor-pointer items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent ${
                current === id ? "bg-accent/15 text-fg" : "text-muted hover:bg-white/[0.05] hover:text-fg"
              } ${id === "admin" ? "text-gold" : ""}`}
            >
              <Icon aria-hidden className={`size-4 ${current === id ? "text-accent" : ""}`} />
              {label}
            </button>
          ))}
        </nav>

        <div className="panel scroll-thin min-h-0 overflow-y-auto p-4">
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={current}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: motionTokens.duration.fast, ease: motionTokens.easing.smooth }}
            >
              {(current === "bar" || current === "theme" || current === "screen") && <CosmeticGrid kind={current} />}
              {current === "session" && <SessionSettings />}
              {current === "audio" && <AudioSettings />}
              {current === "data" && <DataSettings />}
              {current === "admin" && admin && <AdminSettings />}
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </PageFrame>
  )
}
