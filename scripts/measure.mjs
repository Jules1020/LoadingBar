// Sums the gzipped JS and CSS each page loads from a running server.
// Usage: node scripts/measure.mjs [baseUrl]
import { gzipSync } from "node:zlib"

const base = process.argv[2] ?? "http://localhost:3100"
const routes = ["/", "/session", "/wheel", "/pets", "/shop", "/progress", "/settings", "/profile", "/login"]
const cache = new Map()
const size = async (url) => {
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => r.arrayBuffer()).then((b) => ({ raw: b.byteLength, gz: gzipSync(Buffer.from(b)).length })))
  return cache.get(url)
}
const kb = (n) => `${(n / 1024).toFixed(1)} kB`

console.log("route".padEnd(12), "html(gz)".padStart(10), "js(gz)".padStart(10), "css(gz)".padStart(10), "js files")
for (const r of routes) {
  const html = await (await fetch(base + r)).text()
  const js = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1])
  const css = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m) => m[1])
  const sum = async (list) => (await Promise.all(list.map((u) => size(new URL(u, base).href)))).reduce((n, s) => n + s.gz, 0)
  console.log(r.padEnd(12), kb(gzipSync(html).length).padStart(10), kb(await sum(js)).padStart(10), kb(await sum(css)).padStart(10), String(js.length).padStart(8))
}
