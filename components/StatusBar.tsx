"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Coins,
  Disc3,
  House,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  PawPrint,
  Settings,
  ShoppingBag,
  Sparkles,
  Trophy,
  Ticket,
  UserRound,
  Timer,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react"
import { ROUTES } from "@/lib/data"
import { fmtShort } from "@/lib/format"
import { isEditable, isInteractive } from "@/lib/hooks"
import { store, useStore } from "@/lib/store"
import { music } from "@/lib/music"
import { UserMenu } from "./UserMenu"

const ICONS: Record<string, LucideIcon> = {
  "/": House,
  "/session": Timer,
  "/wheel": Disc3,
  "/pets": PawPrint,
  "/shop": ShoppingBag,
  "/progress": Trophy,
  "/roadmap": MapIcon,
  "/settings": Settings,
  "/profile": UserRound,
  "/join": Sparkles,
}

type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitFullscreenEnabled?: boolean; webkitExitFullscreen?: () => Promise<void> }
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }

/**
 * Fullscreen on the document root. Navigation is client-side (next/link, router.push),
 * so the document never unloads and fullscreen survives page changes.
 */
function useFullscreen() {
  const [active, setActive] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const d = document as FsDocument
    setSupported(!!(document.fullscreenEnabled || d.webkitFullscreenEnabled))
    const sync = () => setActive(!!(document.fullscreenElement || d.webkitFullscreenElement))
    sync()
    document.addEventListener("fullscreenchange", sync)
    document.addEventListener("webkitfullscreenchange", sync)
    return () => {
      document.removeEventListener("fullscreenchange", sync)
      document.removeEventListener("webkitfullscreenchange", sync)
    }
  }, [])

  const toggle = useCallback(async () => {
    const d = document as FsDocument
    const el = document.documentElement as FsElement
    try {
      if (document.fullscreenElement || d.webkitFullscreenElement) {
        await (document.exitFullscreen ? document.exitFullscreen() : d.webkitExitFullscreen?.())
      } else {
        await (el.requestFullscreen ? el.requestFullscreen({ navigationUI: "hide" }) : el.webkitRequestFullscreen?.())
      }
    } catch {
      // Denied (e.g. not triggered by a user gesture): nothing to do.
    }
  }, [])

  return { active, supported, toggle }
}

const iconBtn =
  "grid size-9 cursor-pointer place-items-center rounded-md text-muted transition-colors duration-200 hover:bg-white/[0.07] hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"

export function StatusBar() {
  const pathname = usePathname()
  const router = useRouter()
  const balance = useStore((s) => s.balance)
  const spins = useStore((s) => s.spinsEarned)
  const soundOn = useStore((s) => s.soundOn)
  const fs = useFullscreen()
  const toggleFullscreen = fs.toggle

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isEditable(e.target)) return
      if (e.key === "f" && !isInteractive(e.target)) void toggleFullscreen()
      if (e.key === "p" && !isInteractive(e.target)) music.toggle()
      // No page switching or muting shortcuts while a session owns the screen.
      if (store.get().sessionRunning) return
      const n = Number(e.key)
      if (n >= 1 && n <= ROUTES.length) router.push(ROUTES[n - 1].href)
      if (e.key === "m" && !isInteractive(e.target)) store.set((s) => ({ soundOn: !s.soundOn }))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [router, toggleFullscreen])

  return (
    <header className="appbar relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-bg/80 px-3 backdrop-blur-md md:gap-5 md:px-5 side:h-full side:w-56 side:flex-col side:items-stretch side:gap-3 side:border-b-0 side:px-3 side:py-4 side-l:border-r side-r:border-l dock:border-t dock:border-b-0">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-accent side:px-2"
        aria-label="<LoadingBar> home"
      >
        <span className="grid size-8 place-items-center rounded-md bg-gradient-to-br from-accent to-accent-2">
          <span className="block h-1.5 w-4 overflow-hidden bg-white/30">
            <span className="block h-full w-2/3 bg-white" />
          </span>
        </span>
        <span className="display hidden text-[15px] font-semibold tracking-tight sm:inline">
          <span className="text-faint">&lt;</span>Loading<span className="text-accent">Bar</span>
          <span className="text-faint">&gt;</span>
        </span>
      </Link>

      <nav aria-label="Pages" className="no-scrollbar min-w-0 flex-1 overflow-x-auto side:min-h-0 side:overflow-x-visible side:overflow-y-auto">
        <ul className="flex items-stretch side:flex-col side:gap-0.5">
          {ROUTES.filter((r) => r.href !== "/join").map((r) => {
            const Icon = ICONS[r.href]
            const on = pathname === r.href
            return (
              <li key={r.href}>
                <Link
                  href={r.href}
                  aria-current={on ? "page" : undefined}
                  title={r.label}
                  className={`relative flex h-14 items-center gap-2 px-2.5 text-[12px] font-semibold tracking-[0.1em] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent xl:px-3 side:h-10 side:rounded-md side:px-3 side:text-[13px] side:tracking-[0.06em] ${
                    on ? "text-fg side:bg-accent/10" : "text-muted hover:text-fg side:hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon aria-hidden className={`size-[18px] ${on ? "text-accent" : ""}`} />
                  <span className="hidden xl:inline side:inline">{r.label}</span>
                  {on && (
                    <span
                      aria-hidden
                      className="absolute inset-x-2 bottom-0 h-0.5 bg-accent side:inset-x-auto side:inset-y-2 side:w-0.5 side:h-auto side-l:left-0 side-r:right-0 dock:top-0 dock:bottom-auto"
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="flex shrink-0 items-center gap-1 md:gap-1.5 side:flex-wrap side:border-t side:border-line side:pt-3">
        <Link
          href="/pets"
          title="Wallet"
          className="flex h-8 items-center gap-1.5 rounded-md bg-white/[0.05] px-2.5 text-sm font-semibold tabular-nums hover:bg-white/[0.09]"
        >
          <Coins aria-hidden className="size-4 text-gold" />${fmtShort(balance)}
        </Link>
        <Link
          href="/wheel"
          title="Wheel spins earned"
          className="hidden h-8 items-center gap-1.5 rounded-md bg-white/[0.05] px-2.5 text-sm font-semibold tabular-nums hover:bg-white/[0.09] sm:flex"
        >
          <Ticket aria-hidden className="size-4 text-accent" />
          {spins}
        </Link>
        <Link href="/join" className="btn-primary ml-1 hidden h-8 items-center rounded-md px-3 text-xs font-semibold md:flex">
          Early access
        </Link>
        <button
          type="button"
          onClick={() => store.set((s) => ({ soundOn: !s.soundOn }))}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Mute sound effects (M)" : "Unmute sound effects (M)"}
          title={soundOn ? "Mute (M)" : "Unmute (M)"}
          className={`${iconBtn} hidden sm:grid`}
        >
          {soundOn ? <Volume2 className="size-[18px]" /> : <VolumeX className="size-[18px]" />}
        </button>
        <UserMenu />
        {fs.supported && (
          <button
            type="button"
            onClick={() => void fs.toggle()}
            aria-pressed={fs.active}
            aria-label={fs.active ? "Exit fullscreen (F)" : "Enter fullscreen (F)"}
            title={fs.active ? "Exit fullscreen (F)" : "Fullscreen (F)"}
            className={`${iconBtn} ${fs.active ? "text-accent" : ""}`}
          >
            {fs.active ? <Minimize2 className="size-[18px]" /> : <Maximize2 className="size-[18px]" />}
          </button>
        )}
      </div>
    </header>
  )
}
