"use client"

import Link from "next/link"
import { CalendarDays, Check, FastForward, Flame as FlameIcon, Gift, Lock, Snowflake } from "lucide-react"
import { FLAME_TIERS, RARITY, flameTier } from "@/lib/data"
import { COSMETICS } from "@/lib/cosmetics"
import { DAY_NAMES, fmtDate, fromKey } from "@/lib/dates"
import { freezeDay, isAdmin, simulateGoodWeeks, store, streakOf, useStore } from "@/lib/store"
import { sfx } from "@/lib/audio"
import { fx } from "@/lib/fx"
import { toast } from "@/lib/toast"
import { Button } from "../Button"
import { Chip, PageFrame } from "../PageFrame"
import { Flame } from "../Flame"

const REWARDS = COSMETICS.filter((c) => c.source.type === "streak").sort(
  (a, b) => (a.source.type === "streak" ? a.source.weeks : 0) - (b.source.type === "streak" ? b.source.weeks : 0),
)
const weeksOf = (c: (typeof REWARDS)[number]) => (c.source.type === "streak" ? c.source.weeks : 0)

export function Streak({ bare = false }: { bare?: boolean }) {
  const streak = useStore(streakOf)
  const target = useStore((s) => s.targetDays)
  const freezes = useStore((s) => s.freezeTokens)
  const admin = useStore(isAdmin)
  const today = useStore((s) => s.today)
  const tier = flameTier(streak.current)
  const T = FLAME_TIERS[tier]
  const next = FLAME_TIERS[tier + 1]
  const toNext = next ? Math.min(1, (streak.current - T.weeks) / (next.weeks - T.weeks)) : 1

  const remainingDays = streak.days.filter((d) => d.status === "today" || d.status === "future").length
  const need = Math.max(0, target - streak.thisWeekActive)

  const freezeOn = (key: string) => {
    if (freezes <= 0) {
      sfx.error()
      toast({ title: "No freezes left", body: "Win streak freezes on the wheel.", tone: "err" })
      return
    }
    if (freezeDay(key)) {
      sfx.chime("freeze")
      fx.emit({ kind: "flash", color: "#5ec8e5", strength: 0.18, ms: 500 })
      toast({ title: "Day frozen", body: `${fmtDate(fromKey(key), { weekday: "long", month: "short", day: "numeric" })} now counts toward your week.`, tone: "info" })
    }
  }

  let status: { text: string; tone: "ok" | "warn" | "dim" }
  if (streak.thisWeekGood) status = { text: "This week is secured. The streak holds.", tone: "ok" }
  else if (need > remainingDays)
    status = { text: `${need} more day${need > 1 ? "s" : ""} needed but only ${remainingDays} left. Freeze a missed day to save the streak.`, tone: "warn" }
  else status = { text: `${need} more day${need > 1 ? "s" : ""} with a finished session by Sunday to keep the streak.`, tone: "dim" }

  return (
    <PageFrame bare={bare}
      eyebrow="Streak"
      title="Streak & flame"
      subtitle="Counted from the real calendar. A week (Mon–Sun) is good when you finish at least one session on enough days. Good weeks in a row grow the flame."
      actions={
        <>
          <Chip icon={FlameIcon}>x{T.mult.toFixed(2)}</Chip>
          <Chip icon={Snowflake}>{freezes} freezes</Chip>
        </>
      }
    >
      <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
        <div className="panel flex min-h-[340px] flex-col overflow-hidden p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted">Flame · tier {tier}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">{T.name}</p>
            </div>
            <p className="text-right">
              <span className="block text-3xl font-bold tracking-tight text-go-2 tabular-nums">x{T.mult.toFixed(2)}</span>
              <span className="text-xs text-muted">income multiplier</span>
            </p>
          </div>
          <div className="min-h-0 flex-1 py-3">
            <Flame tier={tier} />
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted">
              <span className="tabular-nums">
                {streak.current} week streak · best {streak.best}
              </span>
              <span>{next ? `${next.weeks - streak.current} more to ${next.name}` : "Max tier"}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden bg-white/[0.07]">
              <div className="h-full bg-gradient-to-r from-[#f97316] to-[#fde047] transition-[width] duration-700 ease-out" style={{ width: `${toNext * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:min-h-0">
          <div className="grid gap-4 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
            <div className="panel p-4">
              <p id="target-label" className="text-xs font-medium text-muted">
                Days per week
              </p>
              <div role="radiogroup" aria-labelledby="target-label" className="mt-3 grid grid-cols-7 gap-1">
                {DAY_NAMES.map((_, i) => {
                  const n = i + 1
                  const on = n === target
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => store.set({ targetDays: n })}
                      className={`h-9 cursor-pointer rounded-md text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                        on ? "bg-accent text-bg" : "bg-white/[0.05] text-muted hover:bg-white/[0.09] hover:text-fg"
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-[11px] text-faint">Your pace, not a 7/7 grind.</p>
            </div>

            <div className="panel p-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                  <CalendarDays aria-hidden className="size-3.5" />
                  This week {streak.weekStart && `· from ${fmtDate(fromKey(streak.weekStart), { month: "short", day: "numeric" })}`}
                </p>
                <p className={`text-xs font-semibold tabular-nums ${streak.thisWeekGood ? "text-go-2" : "text-muted"}`}>
                  {streak.thisWeekActive} / {target} days
                </p>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1.5">
                {streak.days.map((d, i) => {
                  const date = fromKey(d.key).getDate()
                  const canFreeze = d.status === "missed"
                  const label = `${DAY_NAMES[i]} ${date}: ${
                    d.status === "done" ? `${d.sessions} session${d.sessions > 1 ? "s" : ""}` : d.status === "frozen" ? "frozen" : d.status === "missed" ? "missed, click to use a freeze" : d.status === "today" ? "today" : "upcoming"
                  }`
                  return (
                    <button
                      key={d.key}
                      type="button"
                      disabled={!canFreeze}
                      onClick={() => freezeOn(d.key)}
                      aria-label={label}
                      title={label}
                      className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-md border text-[11px] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                        d.status === "done"
                          ? "border-go/60 bg-go/20 text-fg"
                          : d.status === "frozen"
                            ? "border-freeze/60 bg-freeze/15 text-freeze"
                            : d.status === "today"
                              ? "border-accent/70 text-fg"
                              : d.status === "missed"
                                ? "cursor-pointer border-line bg-white/[0.03] text-faint hover:border-freeze/60 hover:text-freeze"
                                : "border-line/50 text-faint/60"
                      }`}
                    >
                      <span>{DAY_NAMES[i]}</span>
                      <span className="text-sm font-semibold tabular-nums">{date}</span>
                      {d.status === "done" ? (
                        <span className="flex items-center gap-0.5 text-go-2">
                          <Check aria-hidden className="size-3" />
                          {d.sessions > 1 && d.sessions}
                        </span>
                      ) : d.status === "frozen" ? (
                        <Snowflake aria-hidden className="size-3" />
                      ) : (
                        <span aria-hidden className={`size-1 rounded-full ${d.status === "today" ? "bg-accent" : "bg-faint/50"}`} />
                      )}
                    </button>
                  )
                })}
              </div>
              <p className={`mt-3 text-sm ${status.tone === "ok" ? "text-go-2" : status.tone === "warn" ? "text-gold" : "text-muted"}`} role="status">
                {status.text}
              </p>
            </div>
          </div>

          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">Last 8 weeks</p>
              <div className="flex items-center gap-2">
                {admin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      simulateGoodWeeks(4)
                      sfx.levelUp()
                    }}
                  >
                    <FastForward aria-hidden className="size-3.5" /> Admin: +4 good weeks
                  </Button>
                )}
                <Link href="/session" className="text-xs font-medium text-accent hover:underline">
                  Start a session →
                </Link>
              </div>
            </div>
            <ul className="mt-3 grid grid-cols-8 gap-1.5">
              {streak.recentWeeks.map((w) => (
                <li key={w.start} title={`Week of ${fmtDate(fromKey(w.start), { month: "short", day: "numeric" })}: ${w.active}/${target} days`}>
                  <div className="flex h-10 items-end gap-px overflow-hidden rounded-sm bg-white/[0.04] px-1 pb-1">
                    {Array.from({ length: 7 }, (_, i) => (
                      <span key={i} className={`flex-1 rounded-[1px] ${i < w.active ? (w.good ? "bg-go-2" : "bg-muted/50") : "bg-transparent"}`} style={{ height: `${30 + i * 10}%` }} />
                    ))}
                  </div>
                  <p className={`mt-1 text-center text-[10px] tabular-nums ${w.good ? "text-go-2" : "text-faint"}`}>
                    {fmtDate(fromKey(w.start), { month: "numeric", day: "numeric" })}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel overflow-hidden p-4 lg:min-h-0 lg:flex-1">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Gift aria-hidden className="size-3.5" /> Streak rewards
              </p>
              <Link href="/settings" className="text-xs font-medium text-accent hover:underline">
                Equip in Settings →
              </Link>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {REWARDS.map((c) => {
                const w = weeksOf(c)
                const got = streak.best >= w
                return (
                  <li key={c.id} className={`rounded-md border p-2.5 transition-colors duration-300 ${got ? "border-go/50 bg-go/10" : "border-line bg-white/[0.02]"}`}>
                    <p className="flex items-center justify-between text-[11px] font-semibold text-muted tabular-nums">
                      {w} weeks {got ? <Check aria-hidden className="size-3.5 text-go-2" /> : <Lock aria-hidden className="size-3" />}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold">{c.name}</p>
                    <p className="text-[11px] font-bold tracking-wide uppercase" style={{ color: RARITY[c.rarity].hex }}>
                      {c.kind === "bar" ? "Bar skin" : c.kind === "screen" ? "Screen" : "Theme"}
                    </p>
                    <div className="mt-2 h-1 overflow-hidden bg-white/[0.07]">
                      <div className="h-full bg-go-2 transition-[width] duration-700" style={{ width: `${Math.min(1, streak.best / w) * 100}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
          {!today && <span className="sr-only">Loading calendar</span>}
        </div>
      </div>
    </PageFrame>
  )
}
