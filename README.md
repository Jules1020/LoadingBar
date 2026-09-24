# `<LoadingBar>` — marketing / demo site

A focus timer disguised as a game loading screen. This repo is the demo website, not the app.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Stack: Next.js 16 (App Router) · Tailwind CSS 4 · `motion/react` · `lucide-react` icons · Geist font. No image assets.

UI: a fixed-height app shell (top bar + one view). Pages are laid out to fit the window, so the page itself never
scrolls; the pet grid scrolls inside its own panel. Fullscreen (top-right button or `F`) uses the Fullscreen API on the
document root, and all navigation is client-side, so fullscreen survives page changes.

## Pages

| key | route | What's there |
|-----|-------|--------------|
| 1 | `/` | Home: ▲ start, today's sessions, length picker (presets + custom), wallet. **Enter** starts. |
| 2 | `/session` | Preview of your loading screen + setup. Start → full-window loading screen, app chrome hidden. |
| 3 | `/wheel` | Locked until a session is finished. 16 segments: 7 pet rarities, freezes, cosmetics. |
| 4 | `/pets` | Steal-a-Brainrot style base: vector pets on pedestals, `$/s` overhead, cash pads to collect. |
| – | `/shop` | Spend money: streak freezes, 2× next-session boost, cosmetics, pet upgrades (+20% $/s per level). |
| – | `/podium` | Leaderboards (top 10 signed-in players) for money, pets collected and streak, with profile looks. |
| – | `/profile` | Steam/Discord-style profile: name, status, bio, avatar (initial, pet or image), colors, level, badges, pet showcase. Animated backgrounds, avatar frames and name styles are bought with money. |
| 5 | `/streak` | Days/week target, freezes, flame multiplier, streak-only cosmetic rewards. |
| 6 | `/roadmap` | What's next. |
| 7 | `/stats` | Focus heatmap, totals, recent sessions, pulls by rarity, achievements. |
| 8 | `/settings` | Skins, themes, screens, daily goal, music files, backup/import, admin tools (admin only). |
| – | `/login` | Sign in / create account (optional; guests play locally). |
| 9 | `/join` | Waitlist form → `POST /api/waitlist`. |

### Session rules
- The bar follows a "real download" curve (`lib/progress.ts`): bursts and stalls, but always hits 100% at the end.
  The GB/s readout follows the bar's current speed. No time-left display.
- Pets **only earn while a session runs**. Payouts on the corner wheels are each pet's exact earnings; finishing puts
  them on the pets' pads, forfeiting (Ctrl+C, abort, or hiding the tab >1.5s) loses them.
- Session speed (Settings → Session): real time, ×10 or ×60 for testing.

### Customization
`lib/cosmetics.ts` lists every bar skin, theme and loading screen, with rarity and source (wheel drop or N-week
streak), plus shop prices (legendary $5M, mythic $25M, secret $150M).

- **Layout themes** change the font *and* where the tabs are: MS-DOS (VT323, F-key bar at the bottom), Editorial
  (Fraunces serif, left sidebar), Arcade (Press Start 2P headings, scanlines, left sidebar), Brutalist (light, Space
  Grotesk, hard shadows, right sidebar), Outrun (Orbitron chrome type, bottom dock). `THEME_LAYOUT` maps a theme to a
  tab position; the shell uses the `side:`, `side-l:`, `side-r:` and `dock:` Tailwind variants in `globals.css`, and the
  boot script applies `data-nav` before first paint.
- **Loading screens** (12): Classic, Minimal, Terminal, Orbit, CD Player, Matrix, Boss fight, Download (bandwidth
  graph), Cassette (reels wind as it loads), Handheld (pocket console), Turntable (tonearm tracks progress, cover as
  the label), Warp drive (starfield follows GB/s). New ones live in `components/screens/extra.tsx`.

### Profiles
`lib/profile.ts` has the profile items (12 backgrounds, 9 frames, 7 name styles) and their prices; their looks are
the `.pbg-*`, `.pframe-*` and `.pname-*` classes in `globals.css`, driven by the two profile colors. Uploaded avatars
are cropped to 160×160 JPEG so they fit in the save.

### Music
Bottom-center mini player. Four lo-fi stations are generated live with WebAudio (`lib/music.ts`); `+` adds your own
audio files. Spotify would need its own developer app + OAuth, so it's on the roadmap.

## Accounts & admin
- Optional accounts: `POST /api/auth/signup|login|logout`, `GET /api/auth/me`. Passwords are scrypt-hashed; the
  session is an HMAC-signed, http-only cookie (`lb_session`, 30 days). Logins are rate-limited.
- Signed-in users get a cloud save (`GET/PUT /api/save`). Storage is file-based in `.data/` (git-ignored); swap
  `lib/server/db.ts` for a real database before deploying.
- The admin account is configured in `.env.local` (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `AUTH_SECRET`). Signed in
  as admin you get the Admin tab in Settings (unlock-all, demo speeds, resources, calendar tools). Everyone else
  plays by the normal rules. Game state is client-side, so admin gating is a UI gate, not anti-cheat.

## Admin extras
Settings → Admin (admin only):
- God mode: unlock everything, free shopping, infinite spins; income multiplier ×10/×100/×1000; rig the wheel to
  always land on a chosen result; session speed up to ×3600 plus a **Finish now** button on the loading screen.
- Money: +$1M/+$1B, set the wallet to any amount, +50 spins, +10 freezes, 2× next session.
- Pets: every pet, max levels, spawn any pet at any level, fill every pad with 24 h of earnings, release all.
- Own every cosmetic and profile item for real; +4/+12 good weeks; log sessions on any date.
- **Announcement** banner shown to every player (`PUT /api/admin/announce`).
- **Accounts** table: send money or spins, reset progress, or delete. Gifts are queued server-side
  (`POST /api/admin/gift`, `.data/inbox/`) and applied the next time that player's app checks `GET /api/inbox`
  (on load and every minute), because each player's browser owns their save.

Other endpoints: `GET/DELETE /api/admin/users` (403 unless admin), public `GET /api/leaderboard` (emails masked,
display names and profile looks shown; uploaded avatars stay private).

## Music covers
The player's image button (or Settings → Audio & music) attaches cover art to any track; it's stored in
IndexedDB and spins on the CD, in the mini player and on the CD Player loading screen.

## Dates & streaks
Finished sessions are logged per local day (`history`). A week (Mon–Sun) is good when enough days have a finished
session or a freeze; consecutive good weeks = the streak (`lib/streak.ts`). The app re-checks the date every 30 s.

## Where to change things

- Theme tokens: `app/globals.css` (`@theme` + one `:root[data-theme=…]` block per theme)
- Pets (vector bodies, `Avatar` specs drawn by `components/PetAvatar.tsx`), odds, flame tiers, loading lines, boot lines: `lib/data.ts`
- Motion durations/easings/springs: `lib/motion-tokens.ts`
- Sounds (WebAudio, no files): `lib/audio.ts`

## TODO

- `app/api/waitlist/route.ts` validates the email and returns `200` but **does not store it yet**. Wire it to a
  real list provider before launch.
