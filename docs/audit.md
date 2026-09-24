# Audit: performance, accessibility, SEO, code quality

Date: 2026-09-24 · Next.js 16.3.6 (Turbopack) production build.

## How it was measured

- **Page weight:** `npm run measure` against `next start` (the production build): the gzipped JS and CSS each
  page loads upfront.
- **Accessibility:** an in-browser check on every page (unnamed buttons and links, unlabelled inputs, missing alt
  text, broken ARIA references, duplicate ids, one `h1`), keyboard-only walkthroughs, and `npm run contrast`, which
  checks every theme's text colours against WCAG AA.
- **Lighthouse was not run.** No Chrome is installed on the machine this audit ran on. Run it with Chrome DevTools
  → Lighthouse against `npm run build && npm start` to get scores.

## Results

### Performance

| Page | JS before (gz) | JS after (gz) | Change |
|---|---:|---:|---:|
| `/` | 253.9 kB | 228.2 kB | −25.7 kB |
| `/session` | 268.0 kB | 242.7 kB | −25.3 kB |
| `/wheel` | 258.5 kB | 233.0 kB | −25.5 kB |
| `/pets` | 254.7 kB | 229.5 kB | −25.2 kB |
| `/shop` | 266.2 kB | 240.9 kB | −25.3 kB |
| `/progress` | 259.2 kB | 233.9 kB | −25.3 kB |
| `/settings` | 276.8 kB | 251.6 kB | −25.2 kB |
| `/profile` | 256.8 kB | 231.2 kB | −25.6 kB |

About 175 kB of what remains is React and Next.js itself.

- **Motion loads lazily.** Components use the small `m` components inside `LazyMotion`; the animation features
  (`domMax`) download after the page is up. `strict` mode makes any regression throw.
- **No idle animation loops.** The music player's disc loop ran at 60 fps on every page even when paused; it now
  stops once the disc coasts to rest. Loading-screen previews stop their dial loops when scrolled off screen, and
  CSS animations in off-screen previews pause (`useOffscreenPause`).
- **Narrow store subscriptions.** Three pages re-rendered on any change to the game state; they now subscribe to
  just the fields they show (`useStoreShallow`).
- **Fonts:** only the two default fonts are preloaded; theme fonts download only when a theme uses them
  (already the case, confirmed).
- **Loading screens** are already split out of the shared bundle (≈11 kB, only on pages that show them).

### Accessibility

| Check | Before | After |
|---|---|---|
| Themes passing AA contrast | 0 of 17 | 17 of 17 |
| Tab switchers with arrow keys, one tab stop, linked panels | 0 of 4 | 3 of 3 (the fourth, sign-in/sign-up, is now a toggle group) |
| Session screen | a plain overlay | a modal dialog: rest of the app inert, focus moves in and back, progress announced every 10% |
| Automated page check (unnamed controls, labels, alt, ARIA refs, duplicate ids) | clean except duplicate SVG ids in previews | clean on every page |

- `text-faint` was ~3.3–4.4:1 on panels in every theme; each theme's value was nudged toward its text colour until
  it reached 4.6:1. Brutalist's orange accent was darkened for text (2.8 → 4.6:1).
- Result cards focus their main button, so keyboard users land on "Spin now" or "Back".

### SEO

- `metadataBase` (from `NEXT_PUBLIC_SITE_URL`), Open Graph and Twitter card defaults, keywords.
- Every page has a title, description and canonical URL; Settings and Sign in are `noindex`.
- `robots.txt` (API disallowed), `sitemap.xml`, and a generated 1200×630 share image (`app/opengraph-image.tsx`).
- `WebApplication` structured data on the home page.
- `/streak`, `/stats` and `/podium` now redirect permanently (308) to `/progress`.

### Code quality

| Check | Before | After |
|---|---|---|
| ESLint (Next.js core-web-vitals + TypeScript rules) | not set up | 0 errors, 0 warnings |
| Unit tests | none | 33 (Vitest): progress curve, streak rules, save validation, shop, profiles, wheel odds |
| TypeScript | strict | strict + no unused locals/parameters |
| CI | none | GitHub Actions: typecheck, lint, tests, contrast, build |
| Largest component | `Settings.tsx`, 934 lines | 85 lines; one file per tab in `components/sections/settings/` |

Bugs fixed along the way:

- `effectiveProfile` built a new object on every read when a worn profile item was no longer owned (e.g. after an
  admin signs out), which makes `useSyncExternalStore` re-render forever. Now cached; covered by a regression test.
- React 19 lint findings: "latest callback" refs written during render now use `useEffectEvent`; state set
  synchronously inside effects now uses `useSyncExternalStore` or lazy initial state; two unused hooks removed.
- The wheel's odds, landing and cosmetic rolls moved out of the component into `lib/wheel.ts`, with tests proving the
  pointer always stops inside a segment of the rolled result and the odds match what the wheel page shows.

TypeScript 7 has no JS API yet, so tools that need one (typescript-eslint, Next's type check) get the TypeScript 6
API through `typescript` → `@typescript/typescript6`, while `tsc` is TypeScript 7 (`@typescript/native`). That is the
side-by-side setup from the TypeScript 7 release notes.

## Not done

- Lighthouse scores (see above).
- The early-access form still doesn't store emails, and accounts still use JSON files (see the README).
