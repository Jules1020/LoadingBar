"use client"

import { store } from "./store"
import type { WheelKind } from "./data"

// Soft UI tones via WebAudio. No audio files.

let ctx: AudioContext | null = null

function audio() {
  if (typeof window === "undefined" || !store.get().soundOn) return null
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.05, delay = 0) {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime + delay
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

const CHIMES: Record<WheelKind, number[]> = {
  common: [660, 880],
  uncommon: [660, 880, 1047],
  cosmetic: [784, 988, 1175],
  freeze: [988, 1319, 1760],
  rare: [523, 659, 784, 1047],
  epic: [523, 659, 784, 1047, 1319],
  legendary: [523, 659, 784, 1047, 1319, 1568, 2093],
  mythic: [440, 554, 659, 880, 1109, 1319, 1760, 2217],
  secret: [523, 659, 784, 988, 1175, 1568, 1976, 2349, 2637],
}

export const sfx = {
  tick: () => tone(1800, 0.03, "triangle", 0.03),
  blip: () => tone(740, 0.08, "sine", 0.05),
  coin: () => {
    tone(1319, 0.08, "sine", 0.05)
    tone(1976, 0.14, "sine", 0.04, 0.06)
  },
  error: () => {
    tone(330, 0.16, "sine", 0.06)
    tone(247, 0.24, "sine", 0.06, 0.14)
  },
  complete: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "sine", 0.05, i * 0.08)),
  levelUp: () => [392, 523, 784].forEach((f, i) => tone(f, 0.18, "triangle", 0.05, i * 0.07)),
  chime: (kind: WheelKind) => {
    const notes = CHIMES[kind]
    const big = kind === "legendary" || kind === "mythic" || kind === "secret"
    const step = big ? 0.09 : 0.07
    notes.forEach((f, i) => tone(f, 0.22, "triangle", 0.05, i * step))
    if (big || kind === "epic") {
      // Sustained chord on top of the arpeggio = jackpot.
      const at = notes.length * step
      notes.slice(-3).forEach((f) => tone(f, 1.1, "sine", 0.035, at))
    }
  },
}
