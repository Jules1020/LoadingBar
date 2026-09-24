"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronLeft, ImagePlus, Pause, Play, Plus, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { music, restoreMusic, useMusic } from "@/lib/music"
import { effectiveEquipped, useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { springs } from "@/lib/motion-tokens"

/**
 * The player restyles itself for the loading screen that's on (terminal/matrix go
 * green-mono, boss goes red, minimal tucks away to just the disc) and hides during
 * the CD Player screen, which has its own giant player. Colors follow the theme.
 */
const VARIANT: Record<string, { panel: string; text: string; faint: string; play: string }> = {
  default: { panel: "panel", text: "", faint: "text-muted", play: "btn-play" },
  mono: {
    panel: "border border-[#39ff14]/30 bg-black/85 rounded-sm font-mono",
    text: "text-[#39ff14]",
    faint: "text-[#1fbf0a]",
    play: "bg-[#39ff14] text-black",
  },
  boss: {
    panel: "border border-[#ff4d6d]/40 bg-[#1a0610]/85 rounded-md",
    text: "text-[#ffd1db]",
    faint: "text-[#ff8fab]",
    play: "bg-[#ff4d6d] text-white",
  },
}

export function MiniPlayer() {
  const visible = useStore((s) => s.musicVisible)
  const running = useStore((s) => s.sessionRunning)
  const screen = useStore((s) => effectiveEquipped(s).screen)
  const { tracks, index, playing, volume, covers } = useMusic()
  const [open, setOpen] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const track = tracks[index] ?? tracks[0]

  useEffect(() => {
    void restoreMusic()
  }, [])

  // Pages reserve room at the bottom so the player never covers content.
  useEffect(() => {
    document.documentElement.style.setProperty("--player-space", visible ? "76px" : "16px")
  }, [visible])

  // Music screens have their own player built in.
  const hidden = !visible || (running && (screen === "screen-cd" || screen === "screen-vinyl" || screen === "screen-cassette"))
  const v =
    running && (screen === "screen-terminal" || screen === "screen-matrix") ? VARIANT.mono : running && screen === "screen-boss" ? VARIANT.boss : VARIANT.default
  const expanded = open && !(running && screen === "screen-minimal")

  const addFiles = async (files: FileList) => {
    const n = await music.addFiles(files)
    toast(n ? { title: `Added ${n} track${n > 1 ? "s" : ""}`, body: "Saved in this browser.", tone: "ok" } : { title: "No audio files found", tone: "err" })
  }
  const addCover = async (file: File) => {
    const ok = await music.setCover(track.id, file)
    toast(ok ? { title: "Cover added", body: `Spinning on the CD for "${track.title}".`, tone: "ok" } : { title: "Use an image under 10 MB", tone: "err" })
  }

  const [over, setOver] = useState(false)
  // Drop anything on the player: an image becomes this track's cover, audio files join the playlist.
  const dropFiles = async (files: FileList) => {
    const list = Array.from(files)
    const img = list.find((f) => f.type.startsWith("image/"))
    const audio = list.filter((f) => f.type.startsWith("audio/"))
    if (img) await addCover(img)
    if (audio.length) {
      const n = await music.addFiles(audio)
      toast({ title: `Added ${n} track${n > 1 ? "s" : ""}`, tone: "ok" })
    }
    if (!img && !audio.length) toast({ title: "Drop an image or audio files", tone: "err" })
  }

  const btn = `grid size-8 shrink-0 cursor-pointer place-items-center rounded-md transition-colors hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-accent ${v.faint} hover:text-fg`

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="player"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={springs.gentle}
          // Sits above a bottom tab bar, except during a session when the bar is covered.
          style={{ bottom: running ? 12 : "calc(var(--nav-bottom) + 12px)" }}
          className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-3"
        >
          <motion.div
            layout
            transition={springs.gentle}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setOver(false)
              void dropFiles(e.dataTransfer.files)
            }}
            title="Drop an image for cover art, or audio files to add them"
            className={`pointer-events-auto flex h-14 items-center gap-1.5 px-2 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.8)] backdrop-blur-xl transition-shadow duration-200 ${v.panel} ${v.text} ${
              over ? "ring-2 ring-accent" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label={expanded ? "Collapse music player" : "Expand music player"}
              className="relative grid size-11 shrink-0 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-accent"
            >
              <SpinningCD hue={track.hue} playing={playing} image={covers[track.id]} />
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="body"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={springs.gentle}
                  className="flex items-center gap-1.5 overflow-hidden"
                >
                  <div className="w-28 min-w-0 px-1 sm:w-36 xl:w-44">
                    <p className="truncate text-sm font-semibold">{track.title}</p>
                    <p className={`truncate text-xs ${v.faint}`}>
                      {track.artist} · {index + 1}/{tracks.length}
                    </p>
                  </div>
                  <button type="button" onClick={music.prev} aria-label="Previous track" className={btn}>
                    <SkipBack className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={music.toggle}
                    aria-label={playing ? "Pause music (P)" : "Play music (P)"}
                    className={`grid size-9 shrink-0 cursor-pointer place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${v.play}`}
                  >
                    {playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
                  </button>
                  <button type="button" onClick={music.next} aria-label="Next track" className={btn}>
                    <SkipForward className="size-4" />
                  </button>
                  <div className="hidden items-center gap-1.5 pl-1 xl:flex">
                    <button type="button" onClick={() => music.setVolume(volume > 0 ? 0 : 0.6)} aria-label={volume > 0 ? "Mute music" : "Unmute music"} className={btn}>
                      {volume > 0 ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => music.setVolume(Number(e.target.value))}
                      aria-label="Music volume"
                      className="h-1 w-20 cursor-pointer accent-[var(--color-accent)]"
                    />
                  </div>
                  <button type="button" onClick={() => coverRef.current?.click()} aria-label="Set cover art for this track" title="Cover art (spins on the CD)" className={btn}>
                    <ImagePlus className="size-4" />
                  </button>
                  <button type="button" onClick={() => fileRef.current?.click()} aria-label="Add your own audio files" title="Add audio files" className={btn}>
                    <Plus className="size-4" />
                  </button>
                  <button type="button" onClick={() => setOpen(false)} aria-label="Collapse music player" className={btn}>
                    <ChevronLeft className="size-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) void addFiles(e.target.files)
                e.target.value = ""
              }}
            />
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void addCover(f)
                e.target.value = ""
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * A shiny CD that spins up when music plays and coasts to a stop when paused.
 * With cover art, the image stays still as the background and a see-through
 * CD spins on top of it. Driven by rAF so starting/stopping eases instead of snapping.
 */
export function SpinningCD({
  hue,
  playing,
  image,
  size = 44,
  topSpeed = 200,
}: {
  hue: string
  playing: boolean
  image?: string
  size?: number | string
  topSpeed?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const playingRef = useRef(playing)
  playingRef.current = playing

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    let angle = 0
    let speed = 0 // deg/s
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const want = playingRef.current && !reduce ? topSpeed : 0
      speed += (want - speed) * Math.min(1, dt * (want ? 1.6 : 1.1))
      angle = (angle + speed * dt) % 360
      if (ref.current) ref.current.style.transform = `rotate(${angle}deg)`
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [topSpeed])

  return (
    <div aria-hidden className="relative shrink-0 rounded-full shadow-[0_2px_10px_rgb(0_0_0/0.5)]" style={{ width: size, height: size }}>
      {/* Cover art: the still background under the disc. */}
      {image && <img src={image} alt="" draggable={false} className="absolute inset-0 h-full w-full rounded-full object-cover" />}
      {/* The disc itself spins; with a cover it's see-through. */}
      <div
        ref={ref}
        className="absolute inset-0 rounded-full"
        style={{
          background: image
            ? "conic-gradient(from 20deg, rgb(201 210 224 / 0.28), rgb(244 247 255 / 0.55) 12%, rgb(185 199 230 / 0.2) 22%, rgb(233 217 255 / 0.45) 34%, rgb(191 233 242 / 0.2) 46%, rgb(248 243 216 / 0.5) 58%, rgb(201 210 224 / 0.2) 70%, rgb(238 243 255 / 0.45) 84%, rgb(201 210 224 / 0.28))"
            : "conic-gradient(from 20deg, #c9d2e0, #f4f7ff 12%, #b9c7e6 22%, #e9d9ff 34%, #bfe9f2 46%, #f8f3d8 58%, #c9d2e0 70%, #eef3ff 84%, #c9d2e0)",
          boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.55)",
        }}
      >
        <div className="absolute inset-[3px] rounded-full bg-[repeating-radial-gradient(circle,rgb(255_255_255/0)_0_2px,rgb(255_255_255/0.07)_2px_3px)]" />
        {!image && <div className="absolute inset-[30%] rounded-full" style={{ background: hue, boxShadow: "inset 0 0 0 1.5px rgb(255 255 255 / 0.5)" }} />}
        {image && <div className="absolute inset-[34%] rounded-full ring-1 ring-white/50" />}
        <div className="absolute top-[14%] left-[46%] h-[16%] w-[7%] rounded-full bg-white/70 blur-[1px]" />
      </div>
      <div className={`absolute inset-[44%] rounded-full ring-1 ring-white/50 ${image ? "bg-black/30 backdrop-blur-sm" : "bg-bg"}`} />
    </div>
  )
}
