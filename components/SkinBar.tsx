"use client"

import { useEffect, useRef } from "react"
import { BAR_STYLES } from "@/lib/cosmetics"
import { useFrame } from "@/lib/session"

/**
 * The loading bar itself: a plain rectangle painted with the equipped skin.
 * Live bars follow the session runtime; `preview` pins a static value.
 */
export function SkinBar({
  skin,
  preview,
  invert = false,
  className = "h-10",
}: {
  skin: string
  preview?: number
  invert?: boolean
  className?: string
}) {
  const style = BAR_STYLES[skin] ?? BAR_STYLES["bar-classic"]
  const fillRef = useRef<HTMLDivElement>(null)
  const edgeRef = useRef<HTMLDivElement>(null)

  const apply = (p: number) => {
    let v = invert ? 1 - p : p
    if (style.quantize && v < 1) v = Math.floor(v / style.quantize) * style.quantize
    if (fillRef.current) fillRef.current.style.clipPath = `inset(0 ${(1 - v) * 100}% 0 0)`
    if (edgeRef.current) edgeRef.current.style.transform = `translateX(${v * 100}%)`
  }

  useFrame((f) => apply(f.p), preview === undefined)
  useEffect(() => {
    if (preview !== undefined) apply(preview)
  })

  return (
    <div className={`relative overflow-hidden border border-line-2 bg-[color-mix(in_srgb,var(--color-fg)_5%,transparent)] ${className}`}>
      <div
        ref={fillRef}
        className={`absolute inset-0 ${style.anim ?? ""}`}
        style={{ background: style.fill, backgroundSize: style.size, clipPath: "inset(0 100% 0 0)" }}
      />
      {/* soft top highlight + a bright leading edge */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 to-transparent to-60%" />
      <div ref={edgeRef} aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-full" style={{ transform: "translateX(0%)" }}>
        <div className="absolute inset-y-0 -left-px w-0.5 bg-white/70 shadow-[0_0_12px_rgb(255_255_255/0.8)]" />
      </div>
    </div>
  )
}
