"use client"

import { Check, Clock, Coins, Flame, Lock, Sparkles, Timer } from "lucide-react"
import { ACHIEVEMENTS, stats } from "@/lib/achievements"
import { RARITY, type WheelKind } from "@/lib/data"
import { fmtDate } from "@/lib/dates"
import { fmtMoney, fmtShort } from "@/lib/format"
import { streakOf, useStore } from "@/lib/store"
import { PageFrame } from "../PageFrame"
import { Heatmap } from "../Heatmap"

const ORDER: WheelKind[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "secret", "freeze", "cosmetic"]

const fmtMinutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`)

export function Stats({ bare = false }: { bare?: boolean }) {
  const s = useStore((st) => st)
  const streak = streakOf(s)
  const sessions = stats.totalSessions(s)
  const minutes = stats.totalMinutes(s)
  const pulls = s.pulls
  const maxPull = Math.max(1, ...ORDER.map((k) => pulls[k] ?? 0))
  const recent = [...s.sessions].reverse().slice(0, 30)
  const unlocked = ACHIEVEMENTS.filter((a) => s.achievements.includes(a.id)).length

  return (
    <PageFrame bare={bare} eyebrow="Stats" title="Your focus" subtitle="Everything here comes from sessions you actually finished.">
      <div className="flex flex-col gap-4 lg:h-full">
        <div className="grid shrink-0 grid-cols-2 gap-3 md:grid-cols-5">
          <Tile icon={<Clock className="size-3.5 text-accent" />} label="Focus time" value={fmtMinutes(minutes)} />
          <Tile icon={<Timer className="size-3.5 text-accent" />} label="Sessions" value={String(sessions)} />
          <Tile icon={<Flame className="size-3.5 text-[#f97316]" />} label="Streak" value={`${streak.current}w`} hint={`best ${streak.best}w`} />
          <Tile icon={<Coins className="size-3.5 text-gold" />} label="Pets earned" value={`$${fmtShort(s.lifetimeEarned)}`} />
          <Tile
            icon={<Sparkles className="size-3.5 text-[#a970ff]" />}
            label="Wheel pulls"
            value={String(Object.values(pulls).reduce((a, b) => a + (b ?? 0), 0))}
          />
        </div>

        <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,4fr)]">
          <div className="flex flex-col gap-4 lg:min-h-0">
            <div className="panel p-4">
              <p className="mb-3 text-xs font-medium text-muted">Last 20 weeks</p>
              <Heatmap weeks={20} />
              <p className="mt-3 flex items-center gap-3 text-[11px] text-faint">
                less
                {[0.07, 0.3, 0.5, 0.75, 1].map((a, i) => (
                  <span
                    key={a}
                    className="size-3 rounded-[2px]"
                    style={{ background: i === 0 ? "color-mix(in srgb, var(--color-fg) 7%, transparent)" : `color-mix(in srgb, var(--color-go-2) ${a * 100}%, transparent)` }}
                  />
                ))}
                more
              </p>
            </div>
            <div className="panel p-4 lg:min-h-0 lg:flex-1">
              <p className="mb-3 text-xs font-medium text-muted">Wheel pulls by rarity</p>
              <ul className="space-y-1.5 text-[13px]">
                {ORDER.map((k) => (
                  <li key={k} className="grid grid-cols-[6rem_1fr_2rem] items-center gap-2">
                    <span className={k === "secret" ? "text-secret" : ""} style={k === "secret" ? undefined : { color: RARITY[k].hex }}>
                      {k === "freeze" ? "Freeze" : k === "cosmetic" ? "Cosmetic" : RARITY[k].label}
                    </span>
                    <span className="h-1.5 bg-white/[0.06]">
                      <span className="block h-full" style={{ width: `${((pulls[k] ?? 0) / maxPull) * 100}%`, background: RARITY[k].gradient ?? RARITY[k].hex }} />
                    </span>
                    <span className="text-right text-muted tabular-nums">{pulls[k] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="panel flex max-h-[420px] min-h-[260px] flex-col p-4 lg:max-h-none">
            <p className="mb-3 text-xs font-medium text-muted">Recent sessions</p>
            {recent.length === 0 ? (
              <p className="text-sm text-faint">No finished sessions yet. They'll show up here.</p>
            ) : (
              <ul className="scroll-thin -mr-2 min-h-0 flex-1 divide-y divide-line overflow-y-auto pr-2 text-sm">
                {recent.map((e) => (
                  <li key={e.at} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.task || "Focus session"}</p>
                      <p className="text-xs text-faint">
                        {fmtDate(new Date(e.at), { weekday: "short", month: "short", day: "numeric" })} ·{" "}
                        {new Date(e.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular-nums">{e.minutes} min</p>
                      <p className="text-xs text-go-2 tabular-nums">{fmtMoney(e.earned)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel flex max-h-[420px] min-h-[260px] flex-col p-4 lg:max-h-none">
            <p className="mb-3 flex items-center justify-between text-xs font-medium text-muted">
              Achievements
              <span className="tabular-nums">
                {unlocked} / {ACHIEVEMENTS.length}
              </span>
            </p>
            <ul className="scroll-thin -mr-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-2">
              {ACHIEVEMENTS.map((a) => {
                const got = s.achievements.includes(a.id)
                return (
                  <li key={a.id} className={`flex items-start gap-2.5 rounded-md border p-2 ${got ? "border-gold/40 bg-gold/10" : "border-line opacity-60"}`}>
                    <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded ${got ? "bg-gold text-bg" : "bg-white/[0.06] text-faint"}`}>
                      {got ? <Check aria-hidden className="size-3.5" /> : <Lock aria-hidden className="size-3" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{a.name}</p>
                      <p className="text-xs text-muted">{a.desc}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </PageFrame>
  )
}

function Tile({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="panel px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
        {icon} {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  )
}
