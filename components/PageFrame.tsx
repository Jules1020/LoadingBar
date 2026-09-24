import type { LucideIcon } from "lucide-react"

/** Full-height page layout: compact header, then a body that fills the rest of the window. */
export function PageFrame({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  className = "",
  bare = false,
}: {
  eyebrow?: string
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** Embedded in another page: no header or padding, just the actions row and the body. */
  bare?: boolean
}) {
  if (bare) {
    return (
      <div className="flex h-full flex-col gap-3">
        {actions && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
        <div className={`min-h-0 flex-1 ${className}`}>{children}</div>
      </div>
    )
  }
  return (
    <div
      className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 px-4 pt-4 md:px-6 md:pt-5"
      style={{ paddingBottom: "var(--player-space, 16px)" }}
    >
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="text-[11px] font-semibold tracking-[0.18em] text-accent uppercase">{eyebrow}</p>}
          <h1 className="display mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className={`min-h-0 flex-1 ${className}`}>{children}</div>
    </div>
  )
}

export function Chip({ icon: Icon, children, className = "" }: { icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-white/[0.04] px-2.5 text-sm font-medium tabular-nums ${className}`}
    >
      {Icon && <Icon aria-hidden className="size-4" />}
      {children}
    </span>
  )
}

export function Stat({ label, value, hint, className = "" }: { label: string; value: React.ReactNode; hint?: React.ReactNode; className?: string }) {
  return (
    <div className={`panel px-4 py-3 ${className}`}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
    </div>
  )
}
