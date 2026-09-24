"use client"

import { useId } from "react"

// [outer, middle, core] per tier: ember → blaze → supernova (blue = hottest).
const PALETTES = [
  ["#7c2d12", "#c2410c", "#fdba74"],
  ["#c2410c", "#f97316", "#fde68a"],
  ["#dc2626", "#fb923c", "#fef3c7"],
  ["#b91c1c", "#f59e0b", "#fef9c3"],
  ["#9f1239", "#f43f5e", "#fed7aa"],
  ["#3730a3", "#60a5fa", "#e0f2fe"],
]

// Wide, rounded flame (viewBox 140×140, base centered at x=70).
const PATH =
  "M70 4 C84.5 28 122 44 122 82 C122 114 96 136 70 136 C44 136 18 114 18 82 C18 60 38 46 50 26 C53 42 61 50 70 54 C76 38 73 20 70 4 Z"

/** Vector flame that grows and changes color with the streak tier. */
export function Flame({ tier }: { tier: number }) {
  const id = useId().replace(/:/g, "")
  const [outer, mid, core] = PALETTES[tier]
  const scale = 0.45 + tier * 0.11

  return (
    <div className="relative flex h-full w-full items-end justify-center">
      <div
        aria-hidden
        className="absolute bottom-[4%] h-[45%] w-[85%] rounded-full blur-3xl transition-colors duration-700"
        style={{ background: mid, opacity: 0.16 + tier * 0.05 }}
      />
      <svg
        viewBox="0 0 140 140"
        aria-hidden
        className="relative h-full max-w-full"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "50% 100%",
          transition: "transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 700ms",
          filter: `drop-shadow(0 0 ${8 + tier * 5}px ${mid})`,
        }}
      >
        <defs>
          <linearGradient id={`${id}-o`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={mid} />
            <stop offset="100%" stopColor={outer} />
          </linearGradient>
          <linearGradient id={`${id}-c`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor={core} />
          </linearGradient>
        </defs>
        <path d={PATH} fill={`url(#${id}-o)`} className="flicker" />
        <g transform="translate(70 136) scale(0.7) translate(-70 -136)">
          <path d={PATH} fill={mid} opacity={0.9} className="flicker" style={{ animationDuration: "1.1s" }} />
        </g>
        <g transform="translate(70 136) scale(0.42) translate(-70 -136)">
          <path d={PATH} fill={`url(#${id}-c)`} className="flicker" style={{ animationDuration: "0.9s" }} />
        </g>
        {tier >= 2 &&
          Array.from({ length: tier * 2 }, (_, i) => (
            <circle
              key={i}
              cx={42 + ((i * 37) % 56)}
              cy={70 - (i % 3) * 8}
              r={1.4}
              fill={core}
              className="spark"
              style={{ animationDelay: `${(i * 0.27) % 1.8}s` }}
            />
          ))}
      </svg>
    </div>
  )
}
