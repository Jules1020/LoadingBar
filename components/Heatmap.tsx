"use client"

import { addDays, dayKey, DAY_NAMES, fmtDate, fromKey, startOfWeek } from "@/lib/dates"
import { useStore } from "@/lib/store"

/** GitHub-style focus calendar: one column per week, one cell per day, shaded by minutes. */
export function Heatmap({ weeks = 20 }: { weeks?: number }) {
  const history = useStore((s) => s.history)
  const frozen = useStore((s) => s.frozenDays)
  const today = useStore((s) => s.today)
  if (!today) return <div className="h-[132px]" />

  const start = addDays(startOfWeek(fromKey(today)), -7 * (weeks - 1))
  const shade = (min: number) => (min >= 120 ? 1 : min >= 75 ? 0.75 : min >= 40 ? 0.5 : min > 0 ? 0.3 : 0)

  return (
    <div className="flex gap-2">
      <div className="grid grid-rows-7 gap-[3px] text-[10px] leading-none text-faint">
        {DAY_NAMES.map((d, i) => (
          <span key={d} className="flex h-[14px] items-center">
            {i % 2 === 0 ? d : ""}
          </span>
        ))}
      </div>
      <div className="grid flex-1 grid-flow-col grid-rows-7 gap-[3px]">
        {Array.from({ length: weeks * 7 }, (_, i) => {
          const d = addDays(start, Math.floor(i / 7) * 7 + (i % 7))
          const k = dayKey(d)
          const log = history[k]
          const future = k > today
          const isFrozen = frozen.includes(k)
          const a = shade(log?.minutes ?? 0)
          return (
            <span
              key={k}
              title={`${fmtDate(d, { weekday: "short", month: "short", day: "numeric" })}: ${
                log ? `${log.sessions} session${log.sessions > 1 ? "s" : ""}, ${log.minutes} min` : isFrozen ? "frozen" : "no sessions"
              }`}
              className={`h-[14px] min-w-[10px] rounded-[2px] ${k === today ? "ring-1 ring-fg/70" : ""} ${future ? "opacity-0" : ""}`}
              style={{
                background: isFrozen
                  ? "color-mix(in srgb, var(--color-freeze) 55%, transparent)"
                  : a
                    ? `color-mix(in srgb, var(--color-go-2) ${Math.round(a * 100)}%, transparent)`
                    : "color-mix(in srgb, var(--color-fg) 7%, transparent)",
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
