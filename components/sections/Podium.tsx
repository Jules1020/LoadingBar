"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useReducedMotion } from "motion/react"
import * as m from "motion/react-m"
import { Coins, Crown, Flame, PawPrint, RefreshCw } from "lucide-react"
import { fmtShort } from "@/lib/format"
import { motionTokens, springs } from "@/lib/motion-tokens"
import { useStore } from "@/lib/store"
import { PET_POOL } from "@/lib/data"
import { Button } from "../Button"
import { PageFrame } from "../PageFrame"
import type { Profile } from "@/lib/profile"
import { ProfileAvatar } from "../ProfileAvatar"

type Row = { id: string; name: string; value: number; look?: Look }
type Look = Pick<Profile, "avatar" | "colors" | "frame" | "nameStyle">
type Board = { balance: Row[]; pets: Row[]; streak: Row[]; players: number }

const CATEGORIES = [
  { id: "balance" as const, label: "Richest", icon: Coins, fmt: (v: number) => `$${fmtShort(v)}`, color: "#e4ae39" },
  { id: "pets" as const, label: "Collectors", icon: PawPrint, fmt: (v: number) => `${v}/${PET_POOL.length}`, color: "#a4d007" },
  { id: "streak" as const, label: "Longest streak", icon: Flame, fmt: (v: number) => `${v}w`, color: "#f97316" },
]

const mask = (email: string) => {
  const [l, d] = email.split("@")
  return `${l[0]}***@${d}`
}

export function Podium({ bare = false }: { bare?: boolean }) {
  const user = useStore((s) => s.user)
  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    fetch("/api/leaderboard", { cache: "no-store" })
      .then((r) => r.json())
      .then((b: Board) => alive && setBoard(b))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [tick])

  const me = user ? mask(user.email) : null

  return (
    <PageFrame bare={bare}
      eyebrow="Podium"
      title="Leaderboards"
      subtitle="Every signed-in player, ranked by money, pets collected and current streak. Emails are masked."
      actions={
        <Button size="sm" onClick={() => {
            setError(false)
            setTick((t) => t + 1)
          }}>
          <RefreshCw aria-hidden className="size-3.5" /> Refresh
        </Button>
      }
    >
      {!user && (
        <p className="mb-3 text-sm text-muted">
          You’re playing as a guest.{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>{" "}
          to appear on the podium (your progress syncs automatically).
        </p>
      )}
      {error && <p className="text-sm text-danger">Couldn’t load the leaderboard.</p>}
      <div className="grid gap-4 lg:h-full lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Category key={c.id} title={c.label} icon={c.icon} color={c.color} rows={board?.[c.id] ?? null} fmt={c.fmt} me={me} />
        ))}
      </div>
    </PageFrame>
  )
}

function Category({
  title,
  icon: Icon,
  color,
  rows,
  fmt,
  me,
}: {
  title: string
  icon: typeof Coins
  color: string
  rows: Row[] | null
  fmt: (v: number) => string
  me: string | null
}) {
  const reduce = useReducedMotion()
  const top = rows?.slice(0, 3) ?? []
  // Podium order: 2nd, 1st, 3rd.
  const order = [top[1], top[0], top[2]]
  const heights = ["h-20", "h-28", "h-14"]
  const places = [2, 1, 3]

  return (
    <section className="panel flex flex-col p-4 lg:min-h-0">
      <p className="flex items-center gap-2 font-semibold">
        <Icon aria-hidden className="size-4" style={{ color }} /> {title}
      </p>
      {rows === null ? (
        <p className="mt-6 text-sm text-faint">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-faint">No signed-in players yet.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 items-end gap-2">
            {order.map((r, i) => (
              <div key={i} className="flex min-w-0 flex-col items-center">
                {r && (
                  <>
                    {places[i] === 1 && <Crown aria-hidden className="mb-1 size-5 text-gold" />}
                    {r.look && <ProfileAvatar profile={r.look} fallback={r.name} size={places[i] === 1 ? 44 : 36} className="mb-1.5" />}
                    <p className={`w-full truncate text-center text-xs font-semibold ${r.id === me ? "text-accent" : ""}`}>
                      <Name row={r} />
                    </p>
                    <p className="text-sm font-bold tabular-nums" style={{ color }}>
                      {fmt(r.value)}
                    </p>
                  </>
                )}
                <m.div
                  initial={{ scaleY: reduce ? 1 : 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ ...springs.gentle, delay: reduce ? 0 : places[i] * 0.08 }}
                  style={{ transformOrigin: "bottom", background: `color-mix(in srgb, ${color} ${places[i] === 1 ? 45 : 25}%, transparent)` }}
                  className={`mt-1.5 grid w-full place-items-center rounded-t-md ${heights[i]}`}
                >
                  <span className="text-2xl font-bold text-fg/80">{places[i]}</span>
                </m.div>
              </div>
            ))}
          </div>
          <ol className="scroll-thin mt-3 min-h-0 flex-1 divide-y divide-line overflow-y-auto text-sm">
            {rows.slice(3).map((r, i) => (
              <m.li
                key={r.name + i}
                initial={{ opacity: 0, x: reduce ? 0 : -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: motionTokens.duration.normal, delay: reduce ? 0 : 0.3 + i * 0.03 }}
                className={`flex items-center justify-between py-2 ${r.id === me ? "text-accent" : ""}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="w-5 text-faint tabular-nums">{i + 4}</span>
                  {r.look && <ProfileAvatar profile={r.look} fallback={r.name} size={24} />}
                  <span className="truncate">
                    <Name row={r} />
                  </span>
                </span>
                <span className="font-semibold tabular-nums">{fmt(r.value)}</span>
              </m.li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}

/** A player's name in the style they bought. */
function Name({ row }: { row: Row }) {
  if (!row.look) return <>{row.name}</>
  return (
    <span className={row.look.nameStyle} style={{ "--c1": row.look.colors[0], "--c2": row.look.colors[1] } as React.CSSProperties}>
      {row.name}
    </span>
  )
}
