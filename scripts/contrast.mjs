// Checks WCAG contrast of each theme's text tokens against its backgrounds.
// Usage: node scripts/contrast.mjs   (exits 1 if anything is under AA)
import { readFileSync } from "node:fs"

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")
const vars = (block) => Object.fromEntries([...block.matchAll(/--(color-[\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]))
const base = vars(css.match(/@theme \{([\s\S]*?)\n\}/)[1])
const themes = { steam: base }
for (const m of css.matchAll(/:root\[data-theme="(\w+)"\] \{([\s\S]*?)\n\}/g)) themes[m[1]] = { ...base, ...vars(m[2]) }

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// Body text needs 4.5:1. Accent and muted are used for small text too, so they're held to the same bar.
const TEXT = ["color-fg", "color-muted", "color-faint", "color-accent"]
const BGS = ["color-bg", "color-panel-2"]
let failures = 0
for (const [name, t] of Object.entries(themes)) {
  const bad = []
  for (const fg of TEXT) for (const bg of BGS) {
    const r = ratio(t[fg], t[bg])
    if (r < 4.5) bad.push(`${fg.slice(6)} on ${bg.slice(6)} ${r.toFixed(2)}`)
  }
  failures += bad.length
  console.log(`${name.padEnd(10)} ${bad.length ? "FAIL  " + bad.join(" · ") : "ok"}`)
}
process.exit(failures ? 1 : 0)
