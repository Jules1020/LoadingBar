"use client"

import { useState } from "react"
import { BarChart3, Flame, Trophy } from "lucide-react"
import { PageFrame } from "../PageFrame"
import { Tabs, tabPanel } from "../Tabs"
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
        <Tabs
          id="progress"
          label="Progress sections"
          value={tab}
          onChange={(id) => {
            setTab(id)
            window.history.replaceState(null, "", `/progress?tab=${id}`)
          }}
          options={PROGRESS_TABS.map(({ id, label, icon: Icon }) => ({
            id,
            label: (
              <>
                <Icon aria-hidden className={`size-4 ${tab === id ? "text-accent" : ""}`} /> {label}
              </>
            ),
          }))}
        />
      }
    >
      <div {...tabPanel("progress", tab)} className="h-full">
        {tab === "streak" && <Streak bare />}
        {tab === "stats" && <Stats bare />}
        {tab === "podium" && <Podium bare />}
      </div>
    </PageFrame>
  )
}
