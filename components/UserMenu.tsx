"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence } from "motion/react"
import * as m from "motion/react-m"
import { BarChart3, LogIn, LogOut, Map as MapIcon, Settings, ShieldCheck, UserRound } from "lucide-react"
import { signOut } from "@/lib/account"
import { effectiveProfile, useStore } from "@/lib/store"
import { ProfileAvatar } from "./ProfileAvatar"
import { springs } from "@/lib/motion-tokens"

/** Sign-in button for guests; avatar + dropdown for signed-in users. */
export function UserMenu() {
  const user = useStore((s) => s.user)
  const profile = useStore(effectiveProfile)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("mousedown", close)
    window.addEventListener("keydown", esc)
    return () => {
      window.removeEventListener("mousedown", close)
      window.removeEventListener("keydown", esc)
    }
  }, [open])

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex h-8 items-center gap-1.5 rounded-md border border-line-2 px-2.5 text-xs font-semibold text-muted transition-colors duration-200 hover:border-accent/60 hover:text-fg"
      >
        <LogIn aria-hidden className="size-3.5" /> <span className="hidden sm:inline">Sign in</span>
      </Link>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${user.email}`}
        className="relative grid size-8 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ProfileAvatar profile={profile} fallback={profile.name || user.email} size={30} />
        {user.admin && <ShieldCheck aria-hidden className="absolute -right-1 -bottom-1 size-3.5 rounded-full bg-bg p-px text-gold" />}
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={springs.snappy}
            className="panel absolute top-10 right-0 z-40 w-64 p-1.5 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.8)] side:top-auto side:bottom-10 side-l:right-auto side-l:left-0 dock:top-auto dock:bottom-10"
          >
            <div className="px-2.5 py-2">
              <p className="truncate text-sm font-semibold">{profile.name || user.email}</p>
              {profile.name && <p className="truncate text-xs text-faint">{user.email}</p>}
              <p className={`mt-0.5 flex items-center gap-1 text-xs ${user.admin ? "text-gold" : "text-muted"}`}>
                {user.admin && <ShieldCheck aria-hidden className="size-3.5" />}
                {user.admin ? "Admin · prototype tools on" : "Progress syncs to your account"}
              </p>
            </div>
            <div className="my-1 h-px bg-line" />
            <MenuLink href="/profile" icon={UserRound} label="Your profile" onClick={() => setOpen(false)} />
            <MenuLink href="/progress?tab=stats" icon={BarChart3} label="Stats & achievements" onClick={() => setOpen(false)} />
            <MenuLink href="/settings" icon={Settings} label="Settings" onClick={() => setOpen(false)} />
            <MenuLink href="/roadmap" icon={MapIcon} label="Roadmap" onClick={() => setOpen(false)} />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                void signOut()
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-muted hover:bg-white/[0.06] hover:text-fg"
            >
              <LogOut aria-hidden className="size-4" /> Sign out
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuLink({ href, icon: Icon, label, onClick }: { href: string; icon: typeof LogIn; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted hover:bg-white/[0.06] hover:text-fg"
    >
      <Icon aria-hidden className="size-4" /> {label}
    </Link>
  )
}
