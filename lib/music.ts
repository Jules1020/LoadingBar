"use client"

import { useSyncExternalStore } from "react"
import { allCovers, allTracks, deleteCover, deleteTrack, putCover, putTrack } from "./idb"

// Mini-player engine. Built-in "stations" are lo-fi generated live with WebAudio
// (chords, bass, soft drums, vinyl crackle). Users can also add their own audio files.

type GenTrack = { id: string; kind: "gen"; title: string; artist: string; hue: string; bpm: number; chords: number[][] }
type FileTrack = { id: string; kind: "file"; title: string; artist: string; hue: string; url: string }
export type Track = GenTrack | FileTrack

const STATIONS: GenTrack[] = [
  { id: "g1", kind: "gen", title: "Loading Screen Lullaby", artist: "LoadingBar FM", hue: "#66c0f4", bpm: 72, chords: [[50, 57, 60, 65], [48, 55, 59, 64], [45, 52, 55, 60], [46, 53, 57, 62]] },
  { id: "g2", kind: "gen", title: "Defrag Dreams", artist: "LoadingBar FM", hue: "#a970ff", bpm: 80, chords: [[52, 59, 62, 67], [48, 55, 59, 64], [50, 57, 60, 65], [47, 54, 57, 62]] },
  { id: "g3", kind: "gen", title: "Buffering Hearts", artist: "LoadingBar FM", hue: "#f7a1c4", bpm: 66, chords: [[45, 52, 55, 59], [53, 57, 60, 64], [48, 55, 59, 62], [43, 50, 55, 59]] },
  { id: "g4", kind: "gen", title: "Patch Notes at 2 AM", artist: "LoadingBar FM", hue: "#e4ae39", bpm: 86, chords: [[41, 48, 52, 57], [43, 50, 53, 58], [45, 52, 55, 60], [40, 47, 50, 55]] },
]

/** covers: object URLs of user-chosen cover art, keyed by track id. */
type MusicState = { tracks: Track[]; index: number; playing: boolean; volume: number; covers: Record<string, string> }
let state: MusicState = { tracks: STATIONS, index: 0, playing: false, volume: 0.6, covers: {} }
const listeners = new Set<() => void>()
const set = (patch: Partial<MusicState>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function useMusic() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    () => state,
    () => state,
  )
}

// ---------- audio graph ----------
let ctx: AudioContext | null = null
let master: GainNode | null = null
let bus: BiquadFilterNode | null = null
let noise: AudioBuffer | null = null
let crackle: AudioBufferSourceNode | null = null
let timer = 0
let nextTime = 0
let step = 0
let audioEl: HTMLAudioElement | null = null

const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12)

function ensure() {
  if (ctx) return ctx
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  master = ctx.createGain()
  master.gain.value = state.volume * 0.8
  master.connect(ctx.destination)
  bus = ctx.createBiquadFilter()
  bus.type = "lowpass"
  bus.frequency.value = 2400
  bus.Q.value = 0.4
  bus.connect(master)
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return ctx
}

function env(g: GainNode, t: number, peak: number, attack: number, dur: number) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * 0.35), t + attack + dur * 0.4)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
}

function tone(freq: number, t: number, dur: number, peak: number, type: OscillatorType, dest: AudioNode, detune = 0) {
  const c = ctx!
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  o.detune.value = detune
  env(g, t, peak, 0.012, dur)
  o.connect(g).connect(dest)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function noiseHit(t: number, dur: number, peak: number, filter: BiquadFilterType, freq: number) {
  const c = ctx!
  const src = c.createBufferSource()
  src.buffer = noise
  const f = c.createBiquadFilter()
  f.type = filter
  f.frequency.value = freq
  const g = c.createGain()
  g.gain.setValueAtTime(peak, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(master!)
  src.start(t, Math.random())
  src.stop(t + dur + 0.02)
}

function kick(t: number) {
  const c = ctx!
  const o = c.createOscillator()
  const g = c.createGain()
  o.frequency.setValueAtTime(115, t)
  o.frequency.exponentialRampToValueAtTime(42, t + 0.14)
  g.gain.setValueAtTime(0.42, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
  o.connect(g).connect(master!)
  o.start(t)
  o.stop(t + 0.32)
}

function playStep(track: GenTrack, s: number, t: number, s16: number) {
  const bar = Math.floor(s / 16) % track.chords.length
  const pos = s % 16
  const chord = track.chords[bar]
  if (pos === 0) {
    chord.slice(1).forEach((n) => {
      tone(mtof(n + 12), t, s16 * 15, 0.03, "triangle", bus!)
      tone(mtof(n + 12), t, s16 * 15, 0.018, "sine", bus!, 6)
    })
    tone(mtof(chord[0] - 12), t, s16 * 6, 0.13, "sine", bus!)
  }
  if (pos === 8 && Math.random() < 0.45) chord.slice(1).forEach((n) => tone(mtof(n + 12), t, s16 * 7, 0.014, "triangle", bus!))
  if (pos === 10) tone(mtof(chord[0] - 12 + (Math.random() < 0.5 ? 7 : 12)), t, s16 * 4, 0.1, "sine", bus!)
  if (pos === 0 || pos === 10 || (pos === 7 && Math.random() < 0.35)) kick(t)
  if (pos === 4 || pos === 12) {
    noiseHit(t, 0.18, 0.09, "bandpass", 1900)
    tone(190, t, 0.08, 0.04, "triangle", master!)
  }
  if (pos % 2 === 0 || Math.random() < 0.15) noiseHit(t, 0.045, pos % 4 === 0 ? 0.035 : 0.02, "highpass", 7500)
  if (pos % 4 === 2 && Math.random() < 0.3) {
    const pent = [0, 3, 5, 7, 10]
    const n = chord[0] + 24 + pent[Math.floor(Math.random() * pent.length)]
    tone(mtof(n), t, s16 * 3, 0.022, "sine", bus!)
  }
}

function schedule() {
  const track = state.tracks[state.index]
  if (!ctx || track.kind !== "gen") return
  const s16 = 60 / track.bpm / 4
  while (nextTime < ctx.currentTime + 0.15) {
    const swing = step % 2 ? s16 * 0.16 : 0
    playStep(track, step, nextTime + swing, s16)
    nextTime += s16
    step++
  }
}

function startGen() {
  const c = ensure()
  if (!c) return
  void c.resume()
  step = 0
  nextTime = c.currentTime + 0.06
  window.clearInterval(timer)
  timer = window.setInterval(schedule, 25)
  crackle?.stop()
  crackle = c.createBufferSource()
  crackle.buffer = noise
  crackle.loop = true
  const f = c.createBiquadFilter()
  f.type = "bandpass"
  f.frequency.value = 3200
  const g = c.createGain()
  g.gain.value = 0.012
  crackle.connect(f).connect(g).connect(master!)
  crackle.start()
}

function stopAll() {
  window.clearInterval(timer)
  timer = 0
  crackle?.stop()
  crackle = null
  audioEl?.pause()
}

function startCurrent() {
  const track = state.tracks[state.index]
  if (track.kind === "gen") {
    startGen()
  } else {
    if (!audioEl) {
      audioEl = new Audio()
      audioEl.addEventListener("ended", () => music.next())
    }
    audioEl.src = track.url
    audioEl.volume = state.volume
    void audioEl.play().catch(() => set({ playing: false }))
  }
}

export const music = {
  play() {
    startCurrent()
    set({ playing: true })
  },
  pause() {
    stopAll()
    set({ playing: false })
  },
  toggle() {
    if (state.playing) music.pause()
    else music.play()
  },
  go(delta: number) {
    const wasPlaying = state.playing
    stopAll()
    set({ index: (state.index + delta + state.tracks.length) % state.tracks.length })
    if (wasPlaying) startCurrent()
  },
  next: () => music.go(1),
  prev: () => music.go(-1),
  setVolume(v: number) {
    set({ volume: v })
    if (master && ctx) master.gain.setTargetAtTime(v * 0.8, ctx.currentTime, 0.05)
    if (audioEl) audioEl.volume = v
  },
  playIndex(i: number) {
    if (i < 0 || i >= state.tracks.length) return
    stopAll()
    set({ index: i })
    music.play()
  },
  /** Adds audio files to the playlist and saves them in this browser. Returns how many were added. */
  async addFiles(files: FileList | File[], autoplay = true) {
    const audio = Array.from(files).filter((f) => f.type.startsWith("audio/") && f.size <= MAX_FILE_BYTES)
    if (!audio.length) return 0
    const added: FileTrack[] = []
    for (const [i, f] of audio.entries()) {
      const id = `f-${Date.now().toString(36)}-${i}`
      await putTrack({ id, name: f.name.replace(/\.[^.]+$/, ""), type: f.type, blob: f, addedAt: Date.now() + i })
      added.push({ id, kind: "file", title: f.name.replace(/\.[^.]+$/, ""), artist: "Your files", hue: FILE_HUES[i % FILE_HUES.length], url: URL.createObjectURL(f) })
    }
    const first = state.tracks.length
    set({ tracks: [...state.tracks, ...added] })
    if (autoplay) music.playIndex(first)
    return added.length
  },
  /** Attaches an image as the track's cover art; it spins on the CD. */
  async setCover(id: string, file: File) {
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) return false
    await putCover({ id, blob: file })
    const old = state.covers[id]
    if (old) URL.revokeObjectURL(old)
    set({ covers: { ...state.covers, [id]: URL.createObjectURL(file) } })
    return true
  },
  async clearCover(id: string) {
    await deleteCover(id)
    const old = state.covers[id]
    if (old) URL.revokeObjectURL(old)
    const covers = { ...state.covers }
    delete covers[id]
    set({ covers })
  },
  async remove(id: string) {
    const i = state.tracks.findIndex((t) => t.id === id)
    const t = state.tracks[i]
    if (!t || t.kind !== "file") return
    await deleteTrack(id)
    await music.clearCover(id)
    URL.revokeObjectURL(t.url)
    const wasCurrent = i === state.index
    if (wasCurrent) stopAll()
    const tracks = state.tracks.filter((x) => x.id !== id)
    set({ tracks, index: wasCurrent ? 0 : state.index > i ? state.index - 1 : state.index, playing: wasCurrent ? false : state.playing })
  },
}

const MAX_FILE_BYTES = 80 * 1024 * 1024
const FILE_HUES = ["#3ddbd9", "#ff8a5b", "#6cc04a", "#f7a1c4", "#8b7bff"]

let restored = false
/** Restores the user's saved music files (IndexedDB) into the playlist once per page load. */
export async function restoreMusic() {
  if (restored) return
  restored = true
  const coverRows = await allCovers()
  if (coverRows.length) set({ covers: Object.fromEntries(coverRows.map((c) => [c.id, URL.createObjectURL(c.blob)])) })
  const rows = await allTracks()
  if (!rows.length) return
  const files: FileTrack[] = rows.map((r, i) => ({
    id: r.id,
    kind: "file",
    title: r.name,
    artist: "Your files",
    hue: FILE_HUES[i % FILE_HUES.length],
    url: URL.createObjectURL(r.blob),
  }))
  set({ tracks: [...STATIONS, ...files] })
}
