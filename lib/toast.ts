export type Toast = {
  id: number
  title: string
  body?: string
  tone?: "ok" | "err" | "info" | "gold"
}

type Listener = (t: Toast) => void
const listeners = new Set<Listener>()
let seq = 0

export function toast(t: Omit<Toast, "id">) {
  const full = { ...t, id: ++seq }
  listeners.forEach((l) => l(full))
}

export function onToast(l: Listener) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
