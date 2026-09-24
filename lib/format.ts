const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
const rate = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 0 })

export const fmtMoney = (n: number) => `$${money.format(Math.floor(n))}`
export const fmtRate = (n: number) => `$${rate.format(n)}/s`
export const fmtNum = (n: number) => money.format(Math.round(n))
export const pad = (n: number, width = 2) => String(n).padStart(width, "0")
export const mmss = (secs: number) => `${pad(Math.floor(secs / 60))}:${pad(Math.floor(secs % 60))}`

const UNITS: [number, string][] = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
]

/** Steal-a-Brainrot style: 950 → "950", 1234 → "1.2K", 3_400_000 → "3.4M". */
export function fmtShort(n: number) {
  for (const [v, unit] of UNITS) {
    if (Math.abs(n) >= v) {
      const x = n / v
      return `${x >= 100 ? Math.floor(x) : x.toFixed(1).replace(/\.0$/, "")}${unit}`
    }
  }
  return n < 10 && n % 1 ? n.toFixed(1) : String(Math.floor(n))
}
