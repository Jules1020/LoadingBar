"use client"

import { store, useStore } from "@/lib/store"
import { DurationPicker } from "../../DurationPicker"
import { Field, Toggle, Stepper } from "./fields"

export function SessionSettings() {
  const lines = useStore((s) => s.showLoadingLines)
  const goal = useStore((s) => s.dailyGoal)
  return (
    <div className="grid max-w-3xl gap-6">
      <Field title="Default length">
        <div className="max-w-md">
          <DurationPicker compact />
        </div>
      </Field>
      <Field title="Daily goal" hint="How many sessions you aim for each day. Shown on the home screen.">
        <Stepper value={goal} min={1} max={12} onChange={(v) => store.set({ dailyGoal: v })} suffix="sessions / day" />
      </Field>
      <Field title="Loading screen">
        <Toggle label="Show joke loading lines" on={lines} onChange={(v) => store.set({ showLoadingLines: v })} />
      </Field>
    </div>
  )
}
