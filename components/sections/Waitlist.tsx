"use client"

import { useState } from "react"
import { CheckCircle2, Disc3, Flame, Mail, PawPrint, Timer } from "lucide-react"
import { sfx } from "@/lib/audio"
import { fx } from "@/lib/fx"
import { Button } from "../Button"
import { PageFrame } from "../PageFrame"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const FEATURES = [
  { icon: Timer, title: "A loading bar, not a clock", body: "Any length you want. Watch it fill instead of watching time." },
  { icon: Disc3, title: "Earn every spin", body: "Finish the bar, spin the wheel, pull a pet." },
  { icon: PawPrint, title: "Pets that pay", body: "Pets earn $/s while you study. Collect it from their pads." },
  { icon: Flame, title: "A streak on your terms", body: "You set the days per week. The flame multiplies income." },
]

export function Waitlist() {
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy || done) return
    const value = email.trim()
    if (!EMAIL.test(value)) {
      sfx.error()
      setError("That doesn't look like an email address.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: value }),
      })
      if (res.ok) {
        setDone(true)
        sfx.complete()
        fx.emit({ kind: "burst", palette: "phosphor", power: 80 })
      } else {
        setError("Something went wrong. Check the address and try again.")
      }
    } catch {
      setError("Network error. Try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageFrame eyebrow="Early access" title="Get LoadingBar first" subtitle="One email when the beta opens. No spam.">
      <div className="grid h-full content-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
        <ul className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="panel p-4">
              <Icon aria-hidden className="size-5 text-accent" />
              <p className="mt-3 font-semibold">{title}</p>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ul>

        <div className="panel relative overflow-hidden p-6 md:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_100%_0%,color-mix(in_srgb,var(--color-accent-2)_18%,transparent),transparent_60%)]"
          />
          {done ? (
            <div className="relative flex flex-col items-start" role="status">
              <CheckCircle2 aria-hidden className="size-10 text-go-2" />
              <p className="mt-4 text-2xl font-semibold tracking-tight">You’re on the list</p>
              <p className="mt-1 text-muted">We’ll email {email.trim()} when the bar hits 100%.</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="relative">
              <p className="text-2xl font-semibold tracking-tight">Join the waitlist</p>
              <p className="mt-1 text-sm text-muted">Free during beta. Unsubscribe anytime.</p>
              <label htmlFor="email" className="mt-6 block text-xs font-medium text-muted">
                Email
              </label>
              <div className="relative mt-2">
                <Mail aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  placeholder="you@example.com"
                  aria-invalid={!!error}
                  aria-describedby={error ? "email-error" : undefined}
                  className="h-12 w-full rounded-md border border-line-2 bg-black/30 pr-3 pl-10 text-fg transition-colors outline-none placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </div>
              {error && (
                <p id="email-error" className="mt-2 text-sm text-danger">
                  {error}
                </p>
              )}
              <Button type="submit" variant="primary" size="lg" disabled={busy} className="mt-5 w-full">
                {busy ? "Joining…" : "Get early access"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </PageFrame>
  )
}
