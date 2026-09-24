"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { CheckCircle2, Disc3, FastForward, Play, Settings2, Ticket, TriangleAlert, X } from "lucide-react"
import { byId } from "@/lib/cosmetics"
import { LOADING_LINES } from "@/lib/data"
import { fmtMoney, fmtShort } from "@/lib/format"
import { makeCurve, BASE_GBPS } from "@/lib/progress"
import { runtime } from "@/lib/session"
import { creditSession, effectiveEquipped, effectiveSpeed, isAdmin, multiplier, petRate, store, totalRate, useStore, type SessionSpeed } from "@/lib/store"
import { motionTokens, springs } from "@/lib/motion-tokens"
import { sfx } from "@/lib/audio"
import { fx } from "@/lib/fx"
import { isEditable } from "@/lib/hooks"
import { Button } from "../Button"
import { Chip, PageFrame } from "../PageFrame"
import { DurationPicker } from "../DurationPicker"
import { ScaledPreview } from "../ScaledPreview"
import { LoadingScreen } from "../screens"

type Phase = "idle" | "running" | "done" | "forfeit"

const LINE_MS = 9_000
const PAYOUT_MS = 1_100
const LEAVE_GRACE_MS = 1_500
const CUT_TO_WHEEL_S = 4
export const SPEED_LABEL: Record<SessionSpeed, string> = { 1: "Real time", 10: "Demo ×10", 60: "Demo ×60", 600: "Admin ×600", 3600: "Admin ×3600" }

export function Session() {
  const router = useRouter()
  const duration = useStore((s) => s.duration)
  const speed = useStore(effectiveSpeed)
  const equipped = useStore(effectiveEquipped)
  const [task, setTask] = useState("")
  const pendingStart = useStore((s) => s.pendingStart)
  const showLines = useStore((s) => s.showLoadingLines)
  const spins = useStore((s) => s.spinsEarned)
  const rate = useStore(totalRate)

  const [phase, setPhase] = useState<Phase>("idle")
  const [line, setLine] = useState(LOADING_LINES[0])
  const [earned, setEarned] = useState(0)
  const [reason, setReason] = useState("")
  const [countdown, setCountdown] = useState<number | null>(null)
  const [armAbort, setArmAbort] = useState(false)
  const [last, setLast] = useState<{ ok: boolean; text: string } | null>(null)
  // The look is locked in when the session starts.
  const [look, setLook] = useState(equipped)

  const phaseRef = useRef<Phase>("idle")
  const rafRef = useRef(0)
  /** Admin: jumps the running bar to the end. */
  const skipRef = useRef<(() => void) | null>(null)
  const admin = useStore(isAdmin)

  const setP = (p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }

  const close = useCallback(
    (to?: string) => {
      cancelAnimationFrame(rafRef.current)
      runtime.emitFrame({ p: 0, gbps: 0, earned: 0 })
      store.set({ sessionRunning: false })
      setP("idle")
      setCountdown(null)
      if (to) router.push(to)
    },
    [router],
  )

  const complete = useCallback((minutes: number, label: string) => {
    const total = creditSession(minutes, label)
    document.title = "100% · <LoadingBar>"
    setEarned(total)
    setP("done")
    setLast({ ok: true, text: `Completed ${minutes} min · pets earned ${fmtMoney(total)} · +1 spin` })
    sfx.complete()
    fx.emit({ kind: "flash", color: "var(--color-go-2)", strength: 0.25, ms: 700 })
    fx.emit({ kind: "burst", palette: "phosphor", power: 90 })
    setCountdown(CUT_TO_WHEEL_S)
  }, [])

  const start = useCallback(() => {
    if (phaseRef.current !== "idle") return
    const s = store.get()
    const minutes = s.duration
    const realMs = (minutes * 60_000) / effectiveSpeed(s)
    const label = task.trim().slice(0, 80)
    const baseTitle = document.title
    let lastTitlePct = -1
    const curve = makeCurve(minutes)
    const mult = multiplier(s) * (s.boostNext ? 2 : 1)
    const perSec = totalRate(s) * (s.boostNext ? 2 : 1)
    const pets = s.pets
    const lastPaid = pets.map(() => 0)

    setLook(effectiveEquipped(s))
    setLine(LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)])
    setArmAbort(false)
    store.set({ sessionRunning: true })
    setP("running")
    sfx.blip()

    let gbps = BASE_GBPS * curve.speed(0)
    let petIdx = 0
    let payoutId = 0
    let nextPayout = PAYOUT_MS
    let t0 = performance.now()
    let prev = t0
    skipRef.current = () => {
      t0 = performance.now() - realMs
    }

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - prev) / 1000)
      prev = now
      const elapsed = now - t0
      const t = Math.min(1, elapsed / realMs)
      const virtSec = t * minutes * 60
      gbps += (BASE_GBPS * curve.speed(t) - gbps) * Math.min(1, dt * 3)
      const p = curve.at(t)
      runtime.emitFrame({ p, gbps, earned: perSec * virtSec })
      // Progress in the tab title, like a real download.
      const pct = Math.floor(p * 100)
      if (pct !== lastTitlePct) {
        lastTitlePct = pct
        document.title = `${pct}% · <LoadingBar>`
      }

      // Round-robin: each payout is exactly what that pet earned since it last paid.
      if (elapsed >= nextPayout && pets.length) {
        nextPayout += PAYOUT_MS
        const i = petIdx
        petIdx = (petIdx + 1) % pets.length
        const amount = petRate(pets[i]) * mult * (virtSec - lastPaid[i])
        lastPaid[i] = virtSec
        if (amount > 0) runtime.emitPayout({ id: payoutId++, name: pets[i].name, amount, rarity: pets[i].rarity })
      }

      if (t >= 1) {
        complete(minutes, label)
        window.setTimeout(() => (document.title = baseTitle), 4000)
      } else rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
  }, [complete, task])

  const forfeit = useCallback((why: string) => {
    if (phaseRef.current !== "running") return
    cancelAnimationFrame(rafRef.current)
    document.title = "Forfeited · <LoadingBar>"
    window.setTimeout(() => {
      if (location.pathname === "/session") document.title = "Session · <LoadingBar>"
    }, 3000)
    setReason(why)
    setP("forfeit")
    setLast({ ok: false, text: `${why} Session forfeited. Pets' earnings were lost.` })
    sfx.error()
  }, [])

  // Leaving mid-session (unmount) cancels it. Resetting the phase matters: React's dev
  // StrictMode unmounts and remounts once, and a stale "running" phase would block the restart.
  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current)
      if (phaseRef.current !== "idle") store.set({ sessionRunning: false })
      phaseRef.current = "idle"
    },
    [],
  )

  // Start requested from Home. Deferred a tick so a StrictMode remount (or the page
  // transition) can't cancel the frame loop right after it starts.
  useEffect(() => {
    if (!pendingStart) return
    const id = window.setTimeout(() => {
      if (!store.get().pendingStart) return
      store.set({ pendingStart: false })
      start()
    }, 0)
    return () => window.clearTimeout(id)
  }, [pendingStart, start])

  // Keyboard: Enter starts, Ctrl+C aborts. Switching tabs for more than a moment forfeits.
  useEffect(() => {
    let hidden = 0
    const onVis = () => {
      window.clearTimeout(hidden)
      if (document.hidden) hidden = window.setTimeout(() => document.hidden && forfeit("You switched tabs."), LEAVE_GRACE_MS)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "c" && phaseRef.current === "running") {
        e.preventDefault()
        forfeit("Aborted.")
        return
      }
      const inTask = (e.target as HTMLElement | null)?.id === "task"
      if (e.key === "Enter" && phaseRef.current === "idle" && (inTask || (!isEditable(e.target) && !(e.target as HTMLElement | null)?.closest?.("button, a")))) {
        e.preventDefault()
        start()
      }
    }
    document.addEventListener("visibilitychange", onVis)
    window.addEventListener("keydown", onKey)
    return () => {
      window.clearTimeout(hidden)
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener("keydown", onKey)
    }
  }, [forfeit, start])

  // Slow, calm rotation of the joke lines.
  useEffect(() => {
    if (phase !== "running") return
    const id = window.setInterval(() => setLine((l) => LOADING_LINES[(LOADING_LINES.indexOf(l) + 1) % LOADING_LINES.length]), LINE_MS)
    return () => window.clearInterval(id)
  }, [phase])

  // Abort needs a second click within 2.5s.
  useEffect(() => {
    if (!armAbort) return
    const t = window.setTimeout(() => setArmAbort(false), 2500)
    return () => window.clearTimeout(t)
  }, [armAbort])

  // "When the bar hits 100% it cuts to a spin."
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      store.set({ pendingSpin: true })
      close("/wheel")
      return
    }
    const t = window.setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000)
    return () => window.clearTimeout(t)
  }, [countdown, close])

  const screen = byId(equipped.screen)
  const skin = byId(equipped.bar)
  const boost = useStore((st) => st.boostNext)
  const sessionValue = rate * duration * 60 * (boost ? 2 : 1)

  return (
    <>
      <PageFrame
        eyebrow="Session"
        title="Start a session"
        subtitle="Pets only earn while the bar is loading. Finish it to bank their earnings and earn a spin. Leave early and it's all lost."
        actions={
          <>
            <Chip icon={Ticket}>{spins} spins</Chip>
          </>
        }
      >
        <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
          <div className="panel relative min-h-[240px] overflow-hidden">
            <ScaledPreview className="absolute inset-0">
              <div className="app-bg h-full w-full">
                <LoadingScreen
                  id={equipped.screen}
                  skin={equipped.bar}
                  line={showLines ? LOADING_LINES[1] : null}
                  preview={{ p: 0.374, gbps: 14.2, earned: rate * 560 }}
                />
              </div>
            </ScaledPreview>
            <div className="absolute inset-x-3 top-3 flex items-center justify-between">
              <span className="rounded-md border border-line bg-bg/70 px-2.5 py-1 text-xs font-medium backdrop-blur">
                Preview · {screen?.name} screen · {skin?.name} bar
              </span>
              <Link
                href="/settings"
                className="flex items-center gap-1.5 rounded-md border border-line bg-bg/70 px-2.5 py-1 text-xs font-medium backdrop-blur hover:text-accent"
              >
                <Settings2 aria-hidden className="size-3.5" /> Customize
              </Link>
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-4">
            <div className="panel p-4">
              <label htmlFor="task" className="text-xs font-medium text-muted">
                What are you working on?
              </label>
              <input
                id="task"
                value={task}
                maxLength={80}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g. Chapter 4 notes (optional)"
                className="mt-2 h-10 w-full rounded-md border border-line-2 bg-black/25 px-3 text-sm outline-none placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              <p className="mt-4 mb-3 text-xs font-medium text-muted">Length</p>
              <DurationPicker compact />
            </div>
            <div className="panel divide-y divide-line px-4 text-sm">
              <Row label="Speed" value={<Link href="/settings" className="hover:text-accent">{SPEED_LABEL[speed]}</Link>} />
              <Row label="Pets earn" value={<span className="text-go-2">${fmtShort(rate)}/s</span>} />
              <Row
                label={boost ? "Session payoff · 2× boost" : "Session payoff"}
                value={<span className="font-semibold text-go-2">{fmtMoney(sessionValue)}</span>}
              />
            </div>
            <div className="mt-auto space-y-3">
              {last && (
                <p className={`flex items-start gap-2 text-sm ${last.ok ? "text-go-2" : "text-danger"}`}>
                  {last.ok ? <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" /> : <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />}
                  {last.text}
                </p>
              )}
              <Button variant="play" size="lg" onClick={start} className="w-full">
                <Play aria-hidden className="size-4 fill-current" /> Start {duration} min session
              </Button>
              <p className="text-center text-xs text-faint">
                or press <kbd className="rounded border border-line-2 px-1 font-sans">Enter</kbd> · the screen goes full-window
              </p>
            </div>
          </div>
        </div>
      </PageFrame>

      {phase !== "idle" && (
        <div className="overlay-in app-bg fixed inset-0 z-50">
          <LoadingScreen id={look.screen} skin={look.bar} task={task.trim()} line={showLines && phase === "running" ? line : null} />

          {phase === "running" && (
            <div className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
              {admin && (
                <button
                  type="button"
                  onClick={() => skipRef.current?.()}
                  title="Admin: finish this session now (pets are paid in full)"
                  className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-gold/50 bg-gold/15 px-3 text-xs font-semibold text-gold backdrop-blur transition-colors duration-200 hover:bg-gold/25 focus-visible:outline-2 focus-visible:outline-gold"
                >
                  <FastForward aria-hidden className="size-3.5" /> Finish now
                </button>
              )}
              <button
                type="button"
                onClick={() => (armAbort ? forfeit("Aborted.") : setArmAbort(true))}
                className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-xs font-semibold backdrop-blur transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent ${
                  armAbort ? "border-danger/50 bg-danger/20 text-danger" : "border-line bg-bg/60 text-muted hover:text-fg"
                }`}
              >
                <X aria-hidden className="size-3.5" /> {armAbort ? "Click again to forfeit" : "Abort"}
              </button>
            </div>
          )}

          <AnimatePresence>
            {phase === "done" && (
              <ResultCard key="done">
                <CheckCircle2 aria-hidden className="size-10 text-go-2" />
                <p className="mt-3 text-2xl font-semibold tracking-tight">Load complete</p>
                <p className="mt-1 text-muted">
                  Your pets earned <span className="font-semibold text-go-2">{fmtMoney(earned)}</span>. It's waiting on their pads.
                </p>
                <p className="mt-1 text-sm text-muted">+1 wheel spin · opening the wheel in {countdown ?? 0}…</p>
                <div className="mt-5 flex gap-2">
                  <Button variant="play" onClick={() => { store.set({ pendingSpin: true }); close("/wheel") }}>
                    <Disc3 aria-hidden className="size-4" /> Spin now
                  </Button>
                  <Button onClick={() => close()}>Stay here</Button>
                </div>
              </ResultCard>
            )}
            {phase === "forfeit" && (
              <ResultCard key="forfeit">
                <TriangleAlert aria-hidden className="size-10 text-danger" />
                <p className="mt-3 text-2xl font-semibold tracking-tight">Session forfeited</p>
                <p className="mt-1 text-muted">{reason} Your pets' earnings from this session were lost.</p>
                <div className="mt-5">
                  <Button onClick={() => close()}>Back</Button>
                </div>
              </ResultCard>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-muted">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

function ResultCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: motionTokens.duration.normal }}
      className="absolute inset-0 grid place-items-center bg-bg/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springs.gentle}
        className="panel flex max-w-md flex-col items-center p-8 text-center"
        role="status"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
