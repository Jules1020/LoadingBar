// A "real" loading bar: it bursts, stalls and speeds up like a download, yet always
// lands on 100% exactly when the session time is up. Progress is the integral of a
// smoothly varying random speed curve, normalized so the total is 1.

const SAMPLES = 2400

export type ProgressCurve = {
  /** Progress 0..1 at time fraction t (0..1). */
  at: (t: number) => number
  /** Instantaneous speed at t, relative to the average (1 = average). */
  speed: (t: number) => number
}

export function makeCurve(durationMin: number): ProgressCurve {
  // Roughly one "mood change" every 20–40s of real session time, at least 18.
  const chunks = Math.max(18, Math.min(260, Math.round(durationMin * 2.2)))
  const speeds = Array.from({ length: chunks }, (_, i) => {
    if (i === 0) return 1.8 // installers always start fast
    const r = Math.random()
    if (r < 0.12) return 0.04 + Math.random() * 0.14 // stall
    if (r < 0.26) return 1.7 + Math.random() * 1.6 // burst
    return 0.55 + Math.random() * 0.9
  })

  const sp = new Float32Array(SAMPLES)
  const cum = new Float32Array(SAMPLES + 1)
  let acc = 0
  for (let i = 0; i < SAMPLES; i++) {
    const x = ((i + 0.5) / SAMPLES) * chunks
    const k = Math.min(chunks - 1, Math.floor(x))
    const f = x - k
    const a = speeds[k]
    const b = speeds[Math.min(chunks - 1, k + 1)]
    // Ease into the next chunk's speed over the last 40% of each chunk: no jerks.
    const blend = f < 0.6 ? 0 : (1 - Math.cos(((f - 0.6) / 0.4) * Math.PI)) / 2
    const s = a + (b - a) * blend
    sp[i] = s
    acc += s
    cum[i + 1] = acc
  }
  const avg = acc / SAMPLES

  return {
    at(t) {
      if (t <= 0) return 0
      if (t >= 1) return 1
      const x = t * SAMPLES
      const i = Math.floor(x)
      const f = x - i
      return (cum[i] + (cum[i + 1] - cum[i]) * f) / acc
    },
    speed(t) {
      const i = Math.min(SAMPLES - 1, Math.max(0, Math.floor(t * SAMPLES)))
      return sp[i] / avg
    },
  }
}

/** Average throughput shown as GB/s; the live value follows the curve's speed. */
export const BASE_GBPS = 12.8
