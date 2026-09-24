"use client"

import * as m from "motion/react-m"
import { springs } from "@/lib/motion-tokens"

export function Field({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold">{title}</h2>
      {hint ? <p className="mt-0.5 mb-3 text-sm text-muted">{hint}</p> : <div className="mb-3" />}
      {children}
    </section>
  )
}

export function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex cursor-pointer items-center gap-3 rounded-md text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-accent" : "bg-white/15"}`}>
        <m.span layout transition={springs.snappy} className={`absolute top-0.5 size-5 rounded-full bg-white shadow ${on ? "right-0.5" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  )
}

export function Stepper({ value, min, max, onChange, suffix }: { value: number; min: number; max: number; onChange: (v: number) => void; suffix: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center overflow-hidden rounded-md border border-line-2">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Decrease" className="h-10 w-10 cursor-pointer text-lg hover:bg-white/[0.07]">
          −
        </button>
        <span className="w-10 text-center font-semibold tabular-nums">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label="Increase" className="h-10 w-10 cursor-pointer text-lg hover:bg-white/[0.07]">
          +
        </button>
      </div>
      <span className="text-sm text-muted">{suffix}</span>
    </div>
  )
}
