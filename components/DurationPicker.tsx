"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { DURATION_PRESETS, MAX_DURATION, MIN_DURATION } from "@/lib/data"
import { store, useStore } from "@/lib/store"

/** Session length: three presets plus a custom length (1–180 min). */
export function DurationPicker({ compact = false }: { compact?: boolean }) {
  const value = useStore((s) => s.duration)
  const isPreset = (DURATION_PRESETS as readonly number[]).includes(value)
  const [custom, setCustom] = useState(isPreset ? "" : String(value))
  const [customOn, setCustomOn] = useState(!isPreset)

  const choose = (d: number) => {
    setCustomOn(false)
    store.set({ duration: d })
  }
  const commitCustom = (raw: string) => {
    setCustom(raw)
    const n = Math.round(Number(raw))
    if (Number.isFinite(n) && n >= MIN_DURATION) store.set({ duration: Math.min(MAX_DURATION, n) })
  }

  const row = compact ? "h-10" : "h-11"
  const selected = "border-accent/60 bg-accent/15 text-fg"
  const idle = "border-line bg-white/[0.03] text-muted hover:border-line-2 hover:text-fg"

  return (
    <div role="radiogroup" aria-label="Session length" className={`grid gap-2 ${compact ? "grid-cols-4" : "grid-cols-1"}`}>
      {DURATION_PRESETS.map((d) => {
        const on = !customOn && d === value
        return (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => choose(d)}
            className={`flex ${row} cursor-pointer items-center justify-between rounded-md border px-3.5 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${on ? selected : idle}`}
          >
            <span className="font-semibold tabular-nums">
              {d} <span className="text-sm font-medium text-muted">min</span>
            </span>
            {on && !compact && <Check aria-hidden className="size-4 text-accent" />}
          </button>
        )
      })}
      <label
        className={`flex ${row} cursor-text items-center gap-2 rounded-md border px-3.5 transition-colors duration-200 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${customOn ? selected : idle}`}
      >
        <input
          type="radio"
          name="duration-custom"
          checked={customOn}
          onChange={() => {
            setCustomOn(true)
            if (custom) commitCustom(custom)
          }}
          className="sr-only"
          aria-label="Custom length"
        />
        {!compact && <span className="text-sm text-muted">Custom</span>}
        <input
          type="number"
          inputMode="numeric"
          min={MIN_DURATION}
          max={MAX_DURATION}
          placeholder={compact ? "Custom" : "e.g. 50"}
          value={custom}
          onFocus={() => setCustomOn(true)}
          onChange={(e) => {
            setCustomOn(true)
            commitCustom(e.target.value)
          }}
          aria-label="Custom length in minutes"
          className="w-full min-w-0 bg-transparent text-right font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-faint [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-sm text-muted">min</span>
      </label>
    </div>
  )
}
