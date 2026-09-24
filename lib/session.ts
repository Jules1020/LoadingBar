"use client"

import { useEffect, useRef } from "react"
import type { Rarity } from "./data"

// Per-frame session data, broadcast outside React so loading screens can update
// the DOM directly at 60fps without re-rendering.

export type Frame = {
  /** Visual progress 0..1 (non-linear, like a real download). */
  p: number
  /** Live throughput in GB/s, smoothed. */
  gbps: number
  /** Money earned by pets so far this session. */
  earned: number
}

export type Payout = { id: number; name: string; amount: number; rarity: Rarity }

type FrameListener = (f: Frame) => void
type PayoutListener = (p: Payout) => void

const frameListeners = new Set<FrameListener>()
const payoutListeners = new Set<PayoutListener>()
let last: Frame = { p: 0, gbps: 0, earned: 0 }

export const runtime = {
  get frame() {
    return last
  },
  emitFrame(f: Frame) {
    last = f
    frameListeners.forEach((l) => l(f))
  },
  emitPayout(p: Payout) {
    payoutListeners.forEach((l) => l(p))
  },
  onFrame(l: FrameListener) {
    frameListeners.add(l)
    return () => {
      frameListeners.delete(l)
    }
  },
  onPayout(l: PayoutListener) {
    payoutListeners.add(l)
    return () => {
      payoutListeners.delete(l)
    }
  },
}

/** Subscribe to frames; the callback always sees the latest closure. */
export function useFrame(cb: FrameListener, enabled = true) {
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => {
    if (!enabled) return
    ref.current(runtime.frame)
    return runtime.onFrame((f) => ref.current(f))
  }, [enabled])
}

export function usePayouts(cb: PayoutListener, enabled = true) {
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => {
    if (!enabled) return
    return runtime.onPayout((p) => ref.current(p))
  }, [enabled])
}

export const fmtPct = (p: number) => {
  const v = Math.floor(p * 1000) / 10
  return { whole: Math.floor(v).toString(), dec: (v % 1).toFixed(1).slice(1) }
}
