// File-backed storage for the prototype: accounts in .data/users.json and one
// cloud save per account in .data/saves/<sha256(email)>.json. Swap for a real
// database before deploying anywhere with an ephemeral filesystem.

import { promises as fs } from "node:fs"
import path from "node:path"
import { createHash, randomBytes } from "node:crypto"

/** Where everything is stored. LOADINGBAR_DATA_DIR overrides it (tests use a temp folder). */
const dir = () => process.env.LOADINGBAR_DATA_DIR || path.join(process.cwd(), ".data")
const usersFile = () => path.join(dir(), "users.json")

type UserRecord = { passHash: string; createdAt: number }
type Users = Record<string, UserRecord>

async function writeAtomic(file: string, data: string) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  // Random suffix: two writes in the same millisecond must not share a temp file.
  const tmp = `${file}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`
  await fs.writeFile(tmp, data, { mode: 0o600 })
  await fs.rename(tmp, file)
}

const queues = new Map<string, Promise<unknown>>()
/**
 * Runs `fn` after every earlier update to the same file has finished, so read-modify-write
 * cycles (sign-ups, gifts) can't overwrite each other. Enough for a single server process.
 */
function serialized<T>(file: string, fn: () => Promise<T>): Promise<T> {
  const run = (queues.get(file) ?? Promise.resolve()).then(fn, fn)
  const tail = run.catch(() => undefined)
  queues.set(file, tail)
  void tail.then(() => queues.get(file) === tail && queues.delete(file))
  return run
}

async function readUsers(): Promise<Users> {
  try {
    return JSON.parse(await fs.readFile(usersFile(), "utf8")) as Users
  } catch {
    return {}
  }
}

export async function findUser(email: string) {
  return (await readUsers())[email] ?? null
}

export function createUser(email: string, passHash: string) {
  return serialized(usersFile(), async () => {
    const users = await readUsers()
    if (users[email]) return false
    users[email] = { passHash, createdAt: Date.now() }
    await writeAtomic(usersFile(), JSON.stringify(users, null, 2))
    return true
  })
}

const hashed = (email: string) => `${createHash("sha256").update(email).digest("hex")}.json`
const saveFile = (email: string) => path.join(dir(), "saves", hashed(email))

export async function readSave(email: string): Promise<string | null> {
  try {
    return await fs.readFile(saveFile(email), "utf8")
  } catch {
    return null
  }
}

/** The parsed save, or null if there is none or the file is unreadable (one bad file mustn't break other pages). */
export async function readSaveJson(email: string): Promise<Record<string, unknown> | null> {
  const raw = await readSave(email)
  if (!raw) return null
  try {
    const data: unknown = JSON.parse(raw)
    return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export async function writeSave(email: string, json: string) {
  await writeAtomic(saveFile(email), json)
}

export async function listUsers() {
  const users = await readUsers()
  return Object.entries(users).map(([email, u]) => ({ email, createdAt: u.createdAt }))
}

export async function deleteUser(email: string) {
  const removed = await serialized(usersFile(), async () => {
    const users = await readUsers()
    if (!users[email]) return false
    delete users[email]
    await writeAtomic(usersFile(), JSON.stringify(users, null, 2))
    return true
  })
  if (!removed) return false
  await fs.rm(saveFile(email), { force: true })
  await fs.rm(inboxFile(email), { force: true })
  return true
}

// ---------- admin gifts and announcements ----------
// A player's browser owns their save, so admin changes are queued as gifts that the
// client claims (and applies) the next time it checks its inbox.


export type Gift = { id: string; type: "money" | "spins" | "reset"; amount: number; at: number }
export type Announcement = { text: string; at: number }

const inboxFile = (email: string) => path.join(dir(), "inbox", hashed(email))
const announceFile = () => path.join(dir(), "announce.json")

async function readGifts(email: string): Promise<Gift[]> {
  try {
    const list = JSON.parse(await fs.readFile(inboxFile(email), "utf8"))
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function pushGift(email: string, gift: Omit<Gift, "id" | "at">) {
  return serialized(inboxFile(email), async () => {
    const list = await readGifts(email)
    list.push({ ...gift, id: randomBytes(8).toString("hex"), at: Date.now() })
    await writeAtomic(inboxFile(email), JSON.stringify(list.slice(-50)))
  })
}

/** Returns and clears the account's pending gifts. Queued with pushGift, so a gift can't slip in between. */
export function takeGifts(email: string) {
  return serialized(inboxFile(email), async () => {
    const list = await readGifts(email)
    if (list.length) await fs.rm(inboxFile(email), { force: true })
    return list
  })
}

export async function readAnnouncement(): Promise<Announcement | null> {
  try {
    const a = JSON.parse(await fs.readFile(announceFile(), "utf8")) as Announcement
    return a && typeof a.text === "string" && a.text ? a : null
  } catch {
    return null
  }
}

export async function writeAnnouncement(text: string) {
  if (!text) await fs.rm(announceFile(), { force: true })
  else await writeAtomic(announceFile(), JSON.stringify({ text, at: Date.now() }))
}
