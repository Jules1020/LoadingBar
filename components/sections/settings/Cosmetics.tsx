"use client"

import { Check, Flame, Lock, Sparkles } from "lucide-react"
import { COSMETICS, THEME_FONT, THEME_SWATCH, isUnlocked, navOf, sourceLabel, type Cosmetic, type CosmeticKind } from "@/lib/cosmetics"
import { LOADING_LINES, RARITY } from "@/lib/data"
import { effectiveEquipped, equip, unlockCtx, useStore } from "@/lib/store"
import { sfx } from "@/lib/audio"
import { useOffscreenPause } from "@/lib/hooks"
import { SkinBar } from "../../SkinBar"
import { ScaledPreview } from "../../ScaledPreview"
import { LoadingScreen } from "../../screens"

export function CosmeticGrid({ kind }: { kind: CosmeticKind }) {
  const ctx = useStore(unlockCtx)
  const active = useStore((s) => effectiveEquipped(s)[kind])
  const items = COSMETICS.filter((c) => c.kind === kind)
  const owned = items.filter((c) => isUnlocked(c, ctx)).length
  return (
    <>
      <p className="mb-3 text-xs text-muted">
        {owned} / {items.length} unlocked{ctx.unlockAll && " · admin unlock-all is on"}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((c) => (
          <CosmeticCard key={c.id} c={c} unlocked={isUnlocked(c, ctx)} equipped={active === c.id} bestStreak={ctx.bestStreak} />
        ))}
      </ul>
    </>
  )
}

function CosmeticCard({ c, unlocked, equipped, bestStreak }: { c: Cosmetic; unlocked: boolean; equipped: boolean; bestStreak: number }) {
  const ref = useOffscreenPause<HTMLLIElement>()
  const r = RARITY[c.rarity]
  const lockHint = c.source.type === "streak" ? `Reach a ${c.source.weeks}-week streak (best: ${bestStreak})` : "Win it on the wheel"
  return (
    <li ref={ref}>
      <button
        type="button"
        disabled={!unlocked}
        onClick={() => {
          equip(c.kind, c.id)
          sfx.blip()
        }}
        aria-pressed={equipped}
        className={`group flex w-full cursor-pointer flex-col overflow-hidden rounded-lg border text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed ${
          equipped ? "border-accent/70 bg-accent/[0.08]" : "border-line bg-white/[0.02] hover:border-line-2"
        }`}
      >
        <div className={`relative ${unlocked ? "" : "opacity-40 grayscale"}`}>
          <Preview c={c} />
          {equipped && (
            <span className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-bg">
              <Check aria-hidden className="size-3" /> EQUIPPED
            </span>
          )}
        </div>
        <div className="flex items-start justify-between gap-2 p-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{c.name}</p>
            <p className="mt-0.5 text-xs text-muted">{c.desc}</p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={`text-[11px] font-bold tracking-wide uppercase ${c.rarity === "secret" ? "text-secret" : ""}`}
              style={c.rarity === "secret" ? undefined : { color: r.hex }}
            >
              {r.label}
            </p>
            <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-faint">
              {c.source.type === "streak" && <Flame aria-hidden className="size-3" />}
              {c.source.type === "wheel" && <Sparkles aria-hidden className="size-3" />}
              {sourceLabel(c.source)}
            </p>
          </div>
        </div>
        {!unlocked && (
          <p className="flex items-center gap-1.5 border-t border-line px-3 py-2 text-xs text-muted">
            <Lock aria-hidden className="size-3.5" /> {lockHint}
          </p>
        )}
      </button>
    </li>
  )
}

function Preview({ c }: { c: Cosmetic }) {
  if (c.kind === "bar") {
    return (
      <div className="flex h-20 items-center bg-black/25 px-4">
        <SkinBar skin={c.id} preview={0.64} className="h-6 w-full" />
      </div>
    )
  }
  if (c.kind === "theme") {
    const [bg, panel, accent, play] = THEME_SWATCH[c.id]
    // A tiny mock of the layout: where the tabs go, and the theme's font.
    const nav = navOf(c.id)
    const dir = { top: "flex-col", bottom: "flex-col-reverse", left: "flex-row", right: "flex-row-reverse" }[nav]
    return (
      <div className={`flex h-20 gap-1.5 p-2 ${dir}`} style={{ background: bg }}>
        <div className={`shrink-0 rounded-[2px] opacity-70 ${nav === "left" || nav === "right" ? "w-3" : "h-1.5"}`} style={{ background: accent }} />
        <div className="flex min-h-0 min-w-0 flex-1 gap-1.5">
          <div className="min-w-0 flex-1 rounded-[2px] px-2 py-1.5" style={{ background: panel }}>
            <p className="truncate text-[15px] leading-none font-semibold" style={{ color: accent, fontFamily: THEME_FONT[c.id] ?? "var(--font-geist)" }}>
              Aa Loading
            </p>
            <div className="mt-2 h-3.5 w-12 rounded-[2px]" style={{ background: play }} />
          </div>
          <div className="w-1/4 rounded-[2px]" style={{ background: panel }} />
        </div>
      </div>
    )
  }
  return (
    <ScaledPreview className="app-bg relative aspect-video w-full">
      <div className="app-bg h-full w-full">
        <LoadingScreen id={c.id} skin="bar-classic" line={LOADING_LINES[2]} preview={{ p: 0.46, gbps: 13.6, earned: 4280 }} />
      </div>
    </ScaledPreview>
  )
}
