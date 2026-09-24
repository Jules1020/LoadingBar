<div align="center">

# `<LoadingBar>`

**A focus timer disguised as a game loading screen.**

Every work session is a loading bar. Your pets only earn while it fills.
Finish it to spin the wheel, keep your streak alive, and spend what you earned.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)

</div>

---

## The idea

Timers are boring, and loading screens are hypnotic. `<LoadingBar>` turns a 25, 35 or 45-minute focus session
into a download: the bar bursts, stalls and speeds up like a real installer, shows a live **GB/s**, and always
lands on 100% exactly when your time is up.

Leave early (switch tabs, abort, `Ctrl+C`) and the session is forfeited, along with everything your pets earned.

## How it plays

| | |
|---|---|
| ⏳ **Load** | Pick a length and start. The whole screen becomes the loading screen, no tabs, no distractions. |
| 🐾 **Earn** | Your pets pay out on spinning wheels in the corners, but **only while the bar is running**. |
| 🎰 **Spin** | A finished bar earns one spin: pets from Common to Secret, streak freezes, or cosmetics. |
| 🔥 **Streak** | Hit your days-per-week target to grow a flame that multiplies all income (up to ×3). It follows the real calendar. |
| 🛒 **Spend** | Upgrade pets, buy freezes and 2× boosts, or save up for Legendary cosmetics ($5M and up). |
| 🏆 **Compete** | Sign in to appear on the podium for money, pets collected and streak. |

## Features

**12 loading screens**, each a different way to watch the bar fill:
Classic · Minimal · Terminal boot log · Orbit · Boss fight (drain Procrastination's HP) · CD Player · Matrix rain ·
Download page with a live bandwidth graph · Cassette (tape winds reel to reel) · Handheld console ·
Turntable (the tonearm tracks progress) · Warp drive (the stars stretch with the GB/s).

**17 themes**, including five that change the whole layout: MS-DOS (pixel font, F-key bar at the bottom),
Editorial (serif, left sidebar), Arcade (pixel headings and scanlines), Brutalist (light paper, tabs on the right)
and Outrun (chrome type, floating dock).

**12 loading bar skins**, from plain to Barber stripes, 8-bit steps, 24K gold, Glitch and Prism.

**30 pets** across 7 rarities, drawn as vector characters, each with its own earning rate and 10 upgrade levels.

**Profiles** like Steam and Discord: display name, status, bio, avatar (initial, pet or your own image), level,
badges and a pet showcase, plus animated backgrounds, avatar frames and name styles bought with in-game money.

**Music** in a mini player: four lo-fi stations generated live in the browser, or drop in your own audio files
and cover art (the cover spins under a see-through CD).

**Progress**: streak calendar with freezes, a focus heatmap, session history, 21 achievements and leaderboards.

**Accounts** are optional. Guests play in their browser; signed-in players get a cloud save.

## Run it

Requires Node.js 20+.

```bash
git clone https://github.com/Jules1020/LoadingBar.git
cd LoadingBar
npm install
npm run dev
```

Open http://localhost:3000. That's it: everything works as a guest with no configuration.

### Optional: accounts and the admin

Accounts (cloud saves, the podium) need a signing secret in `.env.local`; without one, sign-up and sign-in are
switched off and everyone plays as a guest. One account can also be the admin, with prototype tools in
**Settings → Admin** (session speed-up, unlock everything, money, rigging the wheel, sending gifts to players, a
site-wide announcement and more).

```bash
cp .env.example .env.local
npm run hash-password -- "choose a password"   # paste the output into ADMIN_PASSWORD_HASH
openssl rand -hex 32                           # paste into AUTH_SECRET
```

Set `ADMIN_EMAIL`, restart the dev server, and sign in with that email and password. `AUTH_SECRET` alone is enough
for regular accounts.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` / `npm start` | Production build and server |
| `npm run check` | Typecheck, lint, unit tests and the contrast check, all at once |
| `npm test` | Tests (Vitest): game logic, and the API routes against a temporary data folder |
| `npm run contrast` | Checks every theme's text colours against WCAG AA |
| `npm run measure` | Gzipped JS/CSS per page from a running server (default `localhost:3100`) |

CI runs the same checks plus a production build on every push. The latest audit (performance, accessibility, SEO,
code quality) is in [`docs/audit.md`](docs/audit.md).

## Keyboard

| Key | Action |
|---|---|
| `Enter` | Start a session |
| `Ctrl` + `C` | Abort the running session |
| `1`–`9` | Jump between pages |
| `F` | Fullscreen (stays on across pages) |
| `P` | Play or pause music |
| `M` | Mute sound effects |
| `?` | Show all shortcuts |

## Under the hood

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript 7** · **Tailwind CSS 4** · **Motion** · **Lucide** icons.
- Accessible by default: every theme passes WCAG AA contrast, tabs and dialogs follow the WAI-ARIA patterns, and all
  motion respects `prefers-reduced-motion`.
- No images or audio files ship with it: pets are SVG built from parts, sounds and music are synthesized with the
  Web Audio API, and every animation is CSS or `requestAnimationFrame`.
- The loading screens update the DOM directly at 60 fps from a small event emitter instead of re-rendering React.
- Game state lives in a tiny external store (`useSyncExternalStore`), saved to `localStorage`, and synced to the
  account's cloud save when signed in. User audio and covers are kept in IndexedDB.
- Auth is built in: scrypt password hashes, HMAC-signed http-only cookies, and login throttling that counts only
  failed attempts, per IP and per account.

```
app/                 pages and API routes (auth, save, leaderboard, admin, inbox)
components/          app shell, player, pets, wheel dial…
components/sections/ one component per page (settings/ has one file per tab)
components/screens/  the loading screens
lib/                 game data, store, cosmetics, profiles, music, streak and wheel math (+ *.test.ts)
lib/server/          auth and file-based storage (server only)
```

## Status

This is a playable prototype of the site. A few things to know before deploying it anywhere:

- Accounts and cloud saves are stored as JSON files in `.data/`. Swap `lib/server/db.ts` for a real database on
  any host with an ephemeral filesystem.
- Game logic runs in the browser, so the admin tools are a UI gate, not anti-cheat.
- The early-access form validates emails but doesn't store them yet (`app/api/waitlist/route.ts`).
