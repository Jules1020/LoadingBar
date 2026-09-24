"use client"

import { applySave, serialize } from "./persist"
import { store, type User } from "./store"
import { toast } from "./toast"

// Client side of accounts: sign in/up/out and cloud-save sync.

export async function fetchMe(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" })
    const data = (await res.json()) as { user: User | null }
    return data.user
  } catch {
    return null
  }
}

export async function authenticate(mode: "login" | "signup", email: string, password: string) {
  try {
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = (await res.json()) as { user?: User; error?: string }
    if (!res.ok || !data.user) return { ok: false as const, error: data.error ?? "Something went wrong." }
    store.set({ user: data.user })
    await pullCloud()
    toast({
      title: data.user.admin ? "Signed in · admin" : mode === "signup" ? "Account created" : "Signed in",
      body: data.user.admin ? "Prototype tools are unlocked in Settings." : "Your progress now syncs to your account.",
      tone: data.user.admin ? "gold" : "ok",
    })
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: "Network error. Try again." }
  }
}

export async function signOut() {
  await pushCloud()
  try {
    await fetch("/api/auth/logout", { method: "POST" })
  } catch {
    // cookie clears on next successful request anyway
  }
  store.set({ user: null })
  toast({ title: "Signed out", body: "You're playing as a guest on this device.", tone: "info" })
}

/** Loads the account's cloud save; if it has none yet, uploads this device's progress. */
export async function pullCloud() {
  try {
    const res = await fetch("/api/save", { cache: "no-store" })
    if (!res.ok) return
    const { save } = (await res.json()) as { save: unknown }
    if (save) applySave(save)
    else await pushCloud()
  } catch {
    // offline: keep playing locally
  }
}

export async function pushCloud() {
  if (!store.get().user) return
  try {
    await fetch("/api/save", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(serialize(store.get())),
      keepalive: true,
    })
  } catch {
    // retried on the next change
  }
}

let timer = 0
export function schedulePush() {
  if (!store.get().user || timer) return
  timer = window.setTimeout(() => {
    timer = 0
    void pushCloud()
  }, 2500)
}
