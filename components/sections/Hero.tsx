"use client"

import { useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useReducedMotion } from "motion/react"
import * as m from "motion/react-m"
import { ArrowRight, Flame, PawPrint, Ticket } from "lucide-react"
import { fmtMoney, fmtShort } from "@/lib/format"
import { isEditable } from "@/lib/hooks"
import { motionTokens, springs } from "@/lib/motion-tokens"
import { multiplier, sessionsToday, store, streakOf, totalRate, useStore, waitingOnPads } from "@/lib/store"
import { fmtDate, fromKey, greeting } from "@/lib/dates"
import { sfx } from "@/lib/audio"
import { Chip } from "../PageFrame"
import { DurationPicker } from "../DurationPicker"

export function Hero() {
  const reduce = useReducedMotion()
  const router = useRouter()
  const duration = useStore((s) => s.duration)
  const today = useStore((s) => s.today)
  const doneToday = useStore(sessionsToday)
  const goal = useStore((s) => s.dailyGoal)
  const streak = useStore((s) => streakOf(s).current)
  const spins = useStore((s) => s.spinsEarned)
  const petCount = useStore((s) => s.pets.length)
  const mult = useStore(multiplier)

  const start = useCallback(() => {
    sfx.blip()
    store.set({ pendingStart: true })
    router.push("/session")
  }, [router])

  // ENTER starts a session from anywhere on this screen, including while a
  // duration option has focus. Other buttons/links keep their own ENTER behavior.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (isEditable(target) && (target as HTMLInputElement).type !== "number") return
      const control = target?.closest?.("button, a")
      if (control && control.getAttribute("role") !== "radio") return
      e.preventDefault()
      start()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [start])

  return (
    <div
      className="mx-auto grid h-full w-full max-w-7xl content-center items-center gap-8 px-4 pt-6 md:px-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 lg:gap-14"
      style={{ paddingBottom: "var(--player-space, 16px)" }}
    >
      {/* Start: the big triangle from the mockup, as a play button */}
      <m.button
        type="button"
        onClick={start}
        aria-label={`Start a ${duration} minute session`}
        whileHover={reduce ? undefined : { scale: motionTokens.scale.pop }}
        whileTap={{ scale: motionTokens.scale.press }}
        transition={springs.gentle}
        className="panel group relative order-2 mx-auto flex aspect-square w-full max-w-[min(400px,48vh)] cursor-pointer flex-col items-center justify-center overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:order-1"
      >
        <span
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_58%,color-mix(in_srgb,var(--play-a)_24%,transparent),transparent_62%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100"
        />
        <svg viewBox="0 0 100 90" aria-hidden className="relative w-[56%] transition-transform duration-500 ease-out group-hover:-translate-y-1">
          <defs>
            <linearGradient id="hero-tri" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--play-a)" />
              <stop offset="100%" stopColor="var(--play-b)" />
            </linearGradient>
          </defs>
          <path d="M50 6 Q53 6 55 9.5 L93 78 Q95 84 89 84 L11 84 Q5 84 7 78 L45 9.5 Q47 6 50 6 Z" fill="url(#hero-tri)" />
          <path d="M50 16 L24 64 L31 64 L50 29 Z" fill="white" opacity="0.14" />
        </svg>
        <span className="relative mt-5 text-lg font-semibold">Start session</span>
        <span className="relative mt-1 text-sm text-muted">
          {duration} min · press{" "}
          <kbd className="rounded border border-line-2 bg-white/5 px-1.5 py-0.5 font-sans text-xs text-fg">Enter</kbd>
        </span>
      </m.button>

      <div className="order-1 min-w-0 md:order-2">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase" suppressHydrationWarning>
          {today ? `${greeting(new Date())} · ${fmtDate(fromKey(today))}` : "Focus timer · idle game"}
        </p>
        <h1 className="display mt-2 text-5xl font-semibold tracking-tight md:text-6xl xl:text-7xl">
          <span className="text-faint">&lt;</span>Loading<span className="text-accent">Bar</span>
          <span className="text-faint">&gt;</span>
        </h1>
        <p className="mt-3 max-w-lg text-muted md:text-lg">
          Every work session is a loading bar. Your pets only earn while it fills. Finish it to spin the wheel.
        </p>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Today</span>
            <span className="tabular-nums">
              {doneToday} / {goal} sessions{doneToday >= goal && <span className="text-go-2"> · goal hit</span>}
            </span>
          </div>
          <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${goal}, minmax(0, 1fr))` }} aria-hidden>
            {Array.from({ length: goal }, (_, i) => (
              <div
                key={i}
                className={`h-3 transition-colors duration-500 ${i < doneToday ? "bg-gradient-to-r from-[var(--play-b)] to-[var(--play-a)]" : "bg-white/[0.07]"}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <DurationPicker />
          <MoneyCard />
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-muted">
          <Chip icon={PawPrint}>{petCount} pets</Chip>
          <Chip icon={Ticket}>{spins} spins</Chip>
          <Chip icon={Flame}>
            {streak}w streak · x{mult.toFixed(2)}
          </Chip>
        </div>
      </div>
    </div>
  )
}

function MoneyCard() {
  const balance = useStore((s) => s.balance)
  const waiting = useStore(waitingOnPads)
  const rate = useStore(totalRate)
  return (
    <Link
      href="/pets"
      className="panel group flex flex-col justify-between p-4 transition-colors duration-200 hover:border-line-2 focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div>
        <p className="text-xs font-medium text-muted">Wallet</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{fmtMoney(balance)}</p>
        <p className="mt-1 text-sm text-go-2 tabular-nums">${fmtShort(waiting)} waiting on pads</p>
        <p className="mt-0.5 text-xs text-faint tabular-nums">Pets earn ${fmtShort(rate)}/s during sessions</p>
      </div>
      <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-accent">
        View money <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </p>
    </Link>
  )
}
