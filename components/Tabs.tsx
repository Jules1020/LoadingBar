"use client"

/**
 * Pill-style tabs with the WAI-ARIA tabs pattern: one tab stop, arrow keys / Home / End
 * move between tabs, and the selected tab points at its panel (spread `tabPanel(id, value)`).
 */
export function Tabs<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  id: string
  label: string
  value: T
  options: { id: T; label: React.ReactNode }[]
  onChange: (v: T) => void
  className?: string
}) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const i = options.findIndex((o) => o.id === value)
    const n = options.length
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1
    if (next < 0) return
    e.preventDefault()
    onChange(options[next].id)
    e.currentTarget.querySelector<HTMLElement>(`#${id}-tab-${options[next].id}`)?.focus()
  }
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={`flex rounded-md bg-black/25 p-1 ${className}`}>
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            id={`${id}-tab-${o.id}`}
            type="button"
            role="tab"
            aria-selected={on}
            // Only the selected tab's panel exists, so only it gets aria-controls.
            aria-controls={on ? `${id}-panel` : undefined}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.id)}
            className={`flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent ${
              on ? "bg-panel-3 text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Props for the element that shows the selected tab's content. */
export const tabPanel = (id: string, value: string) => ({
  role: "tabpanel" as const,
  id: `${id}-panel`,
  "aria-labelledby": `${id}-tab-${value}`,
})
