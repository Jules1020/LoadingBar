"use client"

import { useState } from "react"
import { BarChart3, Flame, Trophy } from "lucide-react"
import { PageFrame } from "../PageFrame"
import { Podium } from "./Podium"
import { Stats } from "./Stats"
import { Streak } from "./Streak"

export const PROGRESS_TABS = [
  { id: "streak", label: "Streak", icon: Flame },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "podium", label: "Podium", icon: Trophy },
] as const
export type ProgressTab = (typeof PROGRESS_TABS)[number]["id"]

/** Streak, stats and leaderboards in one page, switched in place. */
export function Progress({ initial = "streak" }: { initial?: ProgressTab }) {
  const [tab, setTab] = useState<ProgressTab>(initial)
  return (
    <PageFrame
      eyebrow="Progress"
      title="Streak, stats & podium"
      actions={
        <div role="tablist" aria-label="Progress sections" className="flex rounded-md bg-black/25 p-1">
          {PROGRESS_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => {
                setTab(id)
                window.history.replaceState(null, "", `/progress?tab=${id}`)
              }}
              className={`flex h-8 cursor-pointer items-center gap-1.5 rounded px-3 text-sm font-semibold transition-colors duration-200 ${
                tab === id ? "bg-panel-3 text-fg" : "text-muted hover:text-fg"
              }`}
            >
              <Icon aria-hidden className={`size-4 ${tab === id ? "text-accent" : ""}`} /> {label}
            </button>
          ))}
        </div>
      }
    >
      {tab === "streak" && <Streak bare />}
      {tab === "stats" && <Stats bare />}
      {tab === "podium" && <Podium bare />}
    </PageFrame>
  )
}
