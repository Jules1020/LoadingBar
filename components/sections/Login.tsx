"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { Cloud, KeyRound, LogOut, Mail, ShieldCheck, Trophy } from "lucide-react"
import { authenticate, signOut } from "@/lib/account"
import { useStore } from "@/lib/store"
import { motionTokens } from "@/lib/motion-tokens"
import { Button } from "../Button"
import { PageFrame } from "../PageFrame"

const PERKS = [
  { icon: Cloud, title: "Cloud save", body: "Pets, money, streak and unlocks follow you to any device." },
  { icon: Trophy, title: "Keep your history", body: "Your focus calendar and achievements are tied to your account." },
  { icon: KeyRound, title: "Guest mode still works", body: "No account? Everything runs locally in this browser." },
]

export function Login() {
  const router = useRouter()
  const user = useStore((s) => s.user)
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    const res = await authenticate(mode, email.trim(), password)
    setBusy(false)
    if (res.ok) {
      setPassword("")
      router.push("/")
    } else setError(res.error)
  }

  return (
    <PageFrame eyebrow="Account" title={user ? "Your account" : mode === "login" ? "Sign in" : "Create an account"}>
      <div className="grid h-full content-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
        <ul className="grid gap-3">
          {PERKS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="panel flex gap-4 p-4">
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-0.5 text-sm text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="panel relative overflow-hidden p-6 md:p-8">
          {user ? (
            <div className="flex flex-col items-start">
              <span
                className={`grid size-14 place-items-center rounded-lg text-2xl font-bold uppercase text-bg ${
                  user.admin ? "bg-gradient-to-br from-gold to-[#b8860b]" : "bg-gradient-to-br from-accent to-accent-2"
                }`}
              >
                {user.email[0]}
              </span>
              <p className="mt-4 text-xl font-semibold">{user.email}</p>
              <p className={`mt-1 flex items-center gap-1.5 text-sm ${user.admin ? "text-gold" : "text-muted"}`}>
                {user.admin && <ShieldCheck aria-hidden className="size-4" />}
                {user.admin ? "Admin: prototype tools, demo speeds and unlock-all are available in Settings." : "Signed in. Progress syncs automatically."}
              </p>
              <div className="mt-6 flex gap-2">
                <Button variant="primary" onClick={() => router.push("/")}>
                  Back to the game
                </Button>
                <Button onClick={() => void signOut()}>
                  <LogOut aria-hidden className="size-4" /> Sign out
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div role="tablist" aria-label="Account" className="mb-6 grid grid-cols-2 gap-1 rounded-md bg-black/25 p-1">
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => {
                      setMode(m)
                      setError(null)
                    }}
                    className={`h-9 cursor-pointer rounded text-sm font-semibold transition-colors duration-200 ${mode === m ? "bg-panel-3 text-fg" : "text-muted hover:text-fg"}`}
                  >
                    {m === "login" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>
              <label htmlFor="email" className="block text-xs font-medium text-muted">
                Email
              </label>
              <div className="relative mt-2">
                <Mail aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-md border border-line-2 bg-black/30 pr-3 pl-10 outline-none placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <label htmlFor="password" className="mt-4 block text-xs font-medium text-muted">
                Password
              </label>
              <div className="relative mt-2">
                <KeyRound aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
                <input
                  id="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                  className="h-11 w-full rounded-md border border-line-2 bg-black/30 pr-3 pl-10 outline-none placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: motionTokens.duration.fast }}
                    role="alert"
                    className="mt-3 text-sm text-danger"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
              <Button type="submit" variant="primary" size="lg" disabled={busy || !email || !password} className="mt-6 w-full">
                {busy ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}
              </Button>
              <p className="mt-4 text-center text-xs text-faint">
                Or <Link href="/" className="text-accent hover:underline">keep playing as a guest</Link>.
              </p>
            </form>
          )}
        </div>
      </div>
    </PageFrame>
  )
}
