import type { WheelKind } from "./data"

export type FxEvent =
  | { kind: "burst"; palette: WheelKind | "phosphor"; power: number }
  | { kind: "flash"; color: string; strength: number; ms: number }

type Listener = (e: FxEvent) => void
const listeners = new Set<Listener>()

export const fx = {
  emit(e: FxEvent) {
    listeners.forEach((l) => l(e))
  },
  on(l: Listener) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}
