"use client"

import { useRef, useState } from "react"
import { ImagePlus, Pause, Play, Trash2, Upload } from "lucide-react"
import { music, useMusic } from "@/lib/music"
import { store, useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { SpinningCD } from "../../MiniPlayer"
import { Field, Toggle } from "./fields"

export function AudioSettings() {
  const sound = useStore((s) => s.soundOn)
  const visible = useStore((s) => s.musicVisible)
  const { tracks, index, playing, covers } = useMusic()
  const [dropRow, setDropRow] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const add = async (files: FileList | File[]) => {
    const img = Array.from(files).find((f) => f.type.startsWith("image/"))
    if (img) {
      const t = tracks[index]
      toast((await music.setCover(t.id, img)) ? { title: `Cover set for "${t.title}"`, body: "Drop onto a specific track to choose which one.", tone: "ok" } : { title: "Use an image under 10 MB", tone: "err" })
      if (!Array.from(files).some((f) => f.type.startsWith("audio/"))) return
    }
    const n = await music.addFiles(files, false)
    toast(n ? { title: `Added ${n} track${n > 1 ? "s" : ""}`, body: "Saved in this browser's storage.", tone: "ok" } : { title: "No audio files found", body: "Drop mp3, m4a, wav, ogg or flac files (max 80 MB each).", tone: "err" })
  }

  return (
    <div className="grid max-w-3xl gap-6">
      <Field title="Sound effects" hint="Wheel ticks, chimes and UI sounds.">
        <Toggle label="Sound effects" on={sound} onChange={(v) => store.set({ soundOn: v })} />
      </Field>
      <Field title="Music player" hint="Shown bottom-center, including during sessions. P plays/pauses from anywhere.">
        <Toggle label="Show the mini player" on={visible} onChange={(v) => store.set({ musicVisible: v })} />
      </Field>
      <Field title="Your music" hint="Drop several audio files at once, or drop an image onto a track for its cover art. Everything is stored in this browser.">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            void add(e.dataTransfer.files)
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent ${
            over ? "border-accent bg-accent/10" : "border-line-2 hover:border-accent/60"
          }`}
        >
          <Upload aria-hidden className={`size-6 ${over ? "text-accent" : "text-muted"}`} />
          <p className="mt-2 font-semibold">{over ? "Drop to add" : "Drop audio files or a cover image here"}</p>
          <p className="text-xs text-muted">or click to choose several files</p>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) void add(e.target.files)
              e.target.value = ""
            }}
          />
        </div>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
          {tracks.map((t, i) => {
            const current = i === index
            return (
              <li
                key={t.id}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDropRow(t.id)
                }}
                onDragLeave={() => setDropRow((r) => (r === t.id ? null : r))}
                onDrop={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDropRow(null)
                  const img = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"))
                  if (!img) return toast({ title: "Drop an image to use as cover art", tone: "err" })
                  toast((await music.setCover(t.id, img)) ? { title: `Cover set for "${t.title}"`, tone: "ok" } : { title: "Use an image under 10 MB", tone: "err" })
                }}
                className={`flex items-center gap-3 px-3 py-2 transition-colors duration-150 ${
                  dropRow === t.id ? "bg-accent/15 outline-2 -outline-offset-2 outline-accent outline-dashed" : current ? "bg-accent/[0.06]" : ""
                }`}
              >
                <SpinningCD hue={t.hue} playing={current && playing} size={28} image={covers[t.id]} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-faint">
                    {t.kind === "gen" ? "Built-in station" : "Your file"}
                    {dropRow === t.id ? " · drop to set cover" : covers[t.id] ? " · has cover" : " · drop an image here for cover art"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => (current ? music.toggle() : music.playIndex(i))}
                  aria-label={current && playing ? `Pause ${t.title}` : `Play ${t.title}`}
                  className="grid size-8 cursor-pointer place-items-center rounded-md text-muted hover:bg-white/[0.07] hover:text-fg"
                >
                  {current && playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                </button>
                <label
                  title="Cover art"
                  className="grid size-8 cursor-pointer place-items-center rounded-md text-muted hover:bg-white/[0.07] hover:text-fg"
                >
                  <ImagePlus className="size-4" aria-label={`Cover art for ${t.title}`} />
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0]
                      e.target.value = ""
                      if (f) toast((await music.setCover(t.id, f)) ? { title: "Cover added", tone: "ok" } : { title: "Use an image under 10 MB", tone: "err" })
                    }}
                  />
                </label>
                {t.kind === "file" && (
                  <button
                    type="button"
                    onClick={() => void music.remove(t.id)}
                    aria-label={`Remove ${t.title}`}
                    className="grid size-8 cursor-pointer place-items-center rounded-md text-muted hover:bg-danger/15 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-xs text-faint">Spotify needs its own developer app and login, so it’s on the roadmap.</p>
      </Field>
    </div>
  )
}
