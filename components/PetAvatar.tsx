import { useId } from "react"
import type { Avatar } from "@/lib/data"

// Flat vector pets built from parts, so every pet shares one clean style.
// viewBox is 120×120; the pet stands on y≈100.

type Geo = { d: string; top: number; eyeY: number; bellyY: number }

const GEO: Record<Avatar["body"], Geo> = {
  round: { d: "M26 68a34 34 0 1 0 68 0a34 34 0 1 0 -68 0Z", top: 36, eyeY: 62, bellyY: 80 },
  blob: { d: "M22 94C16 64 30 38 60 38C90 38 104 64 98 94C96 101 24 101 22 94Z", top: 40, eyeY: 64, bellyY: 84 },
  tall: { d: "M34 52a26 26 0 0 1 52 0v36a10 10 0 0 1-10 10H44a10 10 0 0 1-10-10Z", top: 28, eyeY: 52, bellyY: 78 },
  square: { d: "M28 50a12 12 0 0 1 12-12h40a12 12 0 0 1 12 12v36a12 12 0 0 1-12 12H40a12 12 0 0 1-12-12Z", top: 38, eyeY: 62, bellyY: 84 },
  bean: { d: "M20 72a40 28 0 1 0 80 0a40 28 0 1 0 -80 0Z", top: 46, eyeY: 68, bellyY: 84 },
  ghost: {
    d: "M30 98V62C30 42 44 30 60 30S90 42 90 62V98L82 92L74 98L67 92L60 98L53 92L46 98L38 92Z",
    top: 32,
    eyeY: 58,
    bellyY: 80,
  },
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt))
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

export function PetAvatar({ avatar, size = 96, className = "" }: { avatar: Avatar; size?: number; className?: string }) {
  const id = `pa${useId().replace(/:/g, "")}`
  const g = GEO[avatar.body]
  const c = avatar.color
  const dark = shade(c, -0.6)
  const ink = "#16202c"
  const { top, eyeY } = g
  const cute = avatar.body !== "square" && avatar.eyes !== "visor"

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden shapeRendering="geometricPrecision">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(c, 0.22)} />
          <stop offset="0.55" stopColor={c} />
          <stop offset="1" stopColor={shade(c, -0.18)} />
        </linearGradient>
      </defs>

      <ellipse cx="60" cy="104" rx="30" ry="5" fill="#000" opacity="0.28" />

      {/* behind the body */}
      {avatar.extra === "wings" && (
        <g fill={shade(c, -0.12)}>
          <ellipse cx="28" cy={eyeY + 12} rx="17" ry="10" transform={`rotate(-28 28 ${eyeY + 12})`} />
          <ellipse cx="92" cy={eyeY + 12} rx="17" ry="10" transform={`rotate(28 92 ${eyeY + 12})`} />
        </g>
      )}
      {avatar.extra === "tail" && (
        <path d="M86 90C104 90 110 72 102 60" fill="none" stroke={shade(c, -0.15)} strokeWidth="9" strokeLinecap="round" />
      )}
      {avatar.extra === "cape" && <path d="M34 56L22 100H98L86 56Z" fill={shade(c, -0.45)} />}
      {avatar.top === "bunny" && (
        <g fill={c}>
          <ellipse cx="48" cy={top - 12} rx="7" ry="18" />
          <ellipse cx="72" cy={top - 12} rx="7" ry="18" />
          <ellipse cx="48" cy={top - 12} rx="3" ry="12" fill="#f5b5c8" />
          <ellipse cx="72" cy={top - 12} rx="3" ry="12" fill="#f5b5c8" />
        </g>
      )}
      {avatar.top === "cat" && (
        <g>
          <path d={`M38 ${top + 10}L42 ${top - 12}L56 ${top + 2}Z`} fill={c} />
          <path d={`M82 ${top + 10}L78 ${top - 12}L64 ${top + 2}Z`} fill={c} />
          <path d={`M42 ${top + 5}L44 ${top - 5}L50 ${top + 2}Z`} fill="#f5b5c8" />
          <path d={`M78 ${top + 5}L76 ${top - 5}L70 ${top + 2}Z`} fill="#f5b5c8" />
        </g>
      )}

      {/* body */}
      <path d={g.d} fill={`url(#${id}b)`} />
      {avatar.belly && <ellipse cx="60" cy={g.bellyY} rx="21" ry="13" fill={avatar.belly} opacity="0.95" />}
      {avatar.pattern === "spots" && (
        <g fill={shade(c, 0.35)} opacity="0.7">
          <circle cx="40" cy={eyeY + 20} r="5" />
          <circle cx="78" cy={eyeY + 16} r="4" />
          <circle cx="70" cy={eyeY + 30} r="3" />
        </g>
      )}
      {avatar.pattern === "stripes" && (
        <g fill="none" stroke={shade(c, -0.25)} strokeWidth="4" strokeLinecap="round" opacity="0.7">
          <path d={`M36 ${eyeY + 14}Q60 ${eyeY + 22} 84 ${eyeY + 14}`} />
          <path d={`M40 ${eyeY + 24}Q60 ${eyeY + 31} 80 ${eyeY + 24}`} />
        </g>
      )}

      {/* on top of the head */}
      {avatar.top === "horns" && (
        <g fill="#f3e2c0">
          <path d={`M42 ${top + 6}Q34 ${top - 10} 46 ${top - 14}Q43 ${top - 4} 50 ${top + 2}Z`} />
          <path d={`M78 ${top + 6}Q86 ${top - 10} 74 ${top - 14}Q77 ${top - 4} 70 ${top + 2}Z`} />
        </g>
      )}
      {avatar.top === "antenna" && (
        <g>
          <path d={`M54 ${top + 2}Q50 ${top - 10} 46 ${top - 14}`} fill="none" stroke={dark} strokeWidth="2.5" strokeLinecap="round" />
          <path d={`M66 ${top + 2}Q70 ${top - 10} 74 ${top - 14}`} fill="none" stroke={dark} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="46" cy={top - 15} r="4" fill="#7df9ff" />
          <circle cx="74" cy={top - 15} r="4" fill="#7df9ff" />
        </g>
      )}
      {avatar.top === "leaf" && (
        <path d={`M60 ${top + 2}C58 ${top - 14} 72 ${top - 18} 78 ${top - 16}C76 ${top - 6} 68 ${top} 60 ${top + 2}Z`} fill="#8bd35a" />
      )}
      {avatar.top === "crown" && (
        <path
          d={`M44 ${top + 2}V${top - 12}L52 ${top - 4}L60 ${top - 16}L68 ${top - 4}L76 ${top - 12}V${top + 2}Z`}
          fill="#ffd54a"
          stroke="#b8860b"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      )}
      {avatar.top === "halo" && (
        <ellipse cx="60" cy={top - 10} rx="17" ry="5" fill="none" stroke="#ffe27a" strokeWidth="3.5" opacity="0.95" />
      )}
      {avatar.top === "flame" && (
        <path d={`M60 ${top + 4}C48 ${top - 2} 52 ${top - 14} 58 ${top - 22}C60 ${top - 12} 70 ${top - 12} 66 ${top - 2}C70 ${top - 6} 72 ${top - 2} 60 ${top + 4}Z`} fill="#ffd166" />
      )}
      {avatar.top === "spikes" && (
        <g fill={shade(c, -0.3)}>
          <path d={`M40 ${top + 2}L46 ${top - 12}L52 ${top + 2}Z`} />
          <path d={`M54 ${top + 2}L60 ${top - 16}L66 ${top + 2}Z`} />
          <path d={`M68 ${top + 2}L74 ${top - 12}L80 ${top + 2}Z`} />
        </g>
      )}

      {/* face */}
      {cute && (
        <g fill="#ff8fab" opacity="0.4">
          <ellipse cx="43" cy={eyeY + 9} rx="5" ry="3" />
          <ellipse cx="77" cy={eyeY + 9} rx="5" ry="3" />
        </g>
      )}
      <Eyes kind={avatar.eyes} y={eyeY} ink={ink} />
      {avatar.eyes !== "visor" && avatar.eyes !== "cyclops" && (
        <path d={`M55 ${eyeY + 10}Q60 ${eyeY + 14} 65 ${eyeY + 10}`} fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
      )}
      {avatar.extra === "glasses" && (
        <g fill="none" stroke={ink} strokeWidth="2">
          <circle cx="47" cy={eyeY} r="8.5" />
          <circle cx="73" cy={eyeY} r="8.5" />
          <path d={`M55.5 ${eyeY}H64.5`} />
        </g>
      )}
    </svg>
  )
}

function Eyes({ kind, y, ink }: { kind: Avatar["eyes"]; y: number; ink: string }) {
  const L = 47
  const R = 73
  switch (kind) {
    case "dot":
      return (
        <g>
          {[L, R].map((x) => (
            <g key={x}>
              <circle cx={x} cy={y} r="4.5" fill={ink} />
              <circle cx={x + 1.5} cy={y - 1.5} r="1.4" fill="#fff" />
            </g>
          ))}
        </g>
      )
    case "happy":
      return (
        <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round">
          <path d={`M${L - 5} ${y + 2}Q${L} ${y - 5} ${L + 5} ${y + 2}`} />
          <path d={`M${R - 5} ${y + 2}Q${R} ${y - 5} ${R + 5} ${y + 2}`} />
        </g>
      )
    case "sleepy":
      return (
        <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round">
          <path d={`M${L - 5} ${y}Q${L} ${y + 3} ${L + 5} ${y}`} />
          <path d={`M${R - 5} ${y}Q${R} ${y + 3} ${R + 5} ${y}`} />
        </g>
      )
    case "big":
      return (
        <g>
          {[L, R].map((x) => (
            <g key={x}>
              <circle cx={x} cy={y} r="8" fill="#fff" />
              <circle cx={x + 1} cy={y + 1} r="4.6" fill={ink} />
              <circle cx={x + 2.6} cy={y - 1.2} r="1.8" fill="#fff" />
            </g>
          ))}
        </g>
      )
    case "visor":
      return (
        <g>
          <rect x="35" y={y - 7} width="50" height="14" rx="7" fill="#0b1220" />
          <rect x="39" y={y - 2.5} width="42" height="5" rx="2.5" fill="#5ff2ff" opacity="0.9" />
          <circle cx="47" cy={y} r="2.2" fill="#fff" />
          <circle cx="73" cy={y} r="2.2" fill="#fff" />
        </g>
      )
    case "cyclops":
      return (
        <g>
          <circle cx="60" cy={y} r="12" fill="#fff" />
          <circle cx="61" cy={y + 1} r="6.5" fill={ink} />
          <circle cx="63.5" cy={y - 2} r="2.4" fill="#fff" />
        </g>
      )
    case "star":
      return (
        <g fill="#fff7c2" stroke="#e4ae39" strokeWidth="1" strokeLinejoin="round">
          {[L, R].map((x) => (
            <path
              key={x}
              d={`M${x} ${y - 7}L${x + 2} ${y - 2}L${x + 7} ${y - 2}L${x + 3} ${y + 1.5}L${x + 4.5} ${y + 7}L${x} ${y + 4}L${x - 4.5} ${y + 7}L${x - 3} ${y + 1.5}L${x - 7} ${y - 2}L${x - 2} ${y - 2}Z`}
            />
          ))}
        </g>
      )
  }
}
