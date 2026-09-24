"use client"

import { useEffect, useRef, useState } from "react"

/** Renders children at a fixed virtual size (a 1280×720 "screen") scaled to fit its box. */
export function ScaledPreview({
  width = 1280,
  height = 720,
  className = "",
  children,
}: {
  width?: number
  height?: number
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setScale(Math.min(r.width / width, r.height / height))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [width, height])

  return (
    <div ref={ref} className={`overflow-hidden ${className || "relative"}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2"
        style={{ width, height, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {scale > 0 && children}
      </div>
    </div>
  )
}
