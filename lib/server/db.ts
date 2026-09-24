// File-backed storage for the prototype: accounts in .data/users.json and one
// cloud save per account in .data/saves/<sha256(email)>.json. Swap for a real
// database before deploying anywhere with an ephemeral filesystem.

import { promises as fs } from "node:fs"
import path from "node:path"
import { createHash } from "node:crypto"

const DIR = path.join(process.cwd(), ".data")
const USERS = path.join(DIR, "users.json")
const SAVES = path.join(DIR, "saves")

type UserRecord = { passHash: string; createdAt: number }
type Users = Record<string, UserRecord>

async function writeAtomic(file: string, data: string) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(tmp, data, { mode: 0o600 })
  await fs.rename(tmp, file)
}

async function readUsers(): Promise<Users> {
  try {
    return JSON.parse(await fs.readFile(USERS, "utf8")) as Users
  } catch {
    return {}
  }
}

export async function findUser(email: string) {
  return (await readUsers())[email] ?? null
}

export async function createUser(email: string, passHash: string) {
  const users = await readUsers()
  if (users[email]) return false
  users[email] = { passHash, createdAt: Date.now() }
  await writeAtomic(USERS, JSON.stringify(users, null, 2))
  return true
}

const saveFile = (email: string) => path.join(SAVES, `${createHash("sha256").update(email).digest("hex")}.json`)

export async function readSave(email: string): Promise<string | null> {
  try {
    return await fs.readFile(saveFile(email), "utf8")
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
  const users = await readUsers()
  if (!users[email]) return false
  delete users[email]
  await writeAtomic(USERS, JSON.stringify(users, null, 2))
  await fs.rm(saveFile(email), { force: true })
  await fs.rm(inboxFile(email), { force: true })
  return true
}

// ---------- admin gifts and announcements ----------
// A player's browser owns their save, so admin changes are queued as gifts that the
// client claims (and applies) the next time it checks its inbox.

const INBOX = path.join(DIR, "inbox")
const ANNOUNCE = path.join(DIR, "announce.json")

export type Gift = { id: string; type: "money" | "spins" | "reset"; amount: number; at: number }
export type Announcement = { text: string; at: number }

const inboxFile = (email: string) => path.join(INBOX, `${createHash("sha256").update(email).digest("hex")}.json`)

async function readGifts(email: string): Promise<Gift[]> {
  try {
    const list = JSON.parse(await fs.readFile(inboxFile(email), "utf8"))
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function pushGift(email: string, gift: Omit<Gift, "id" | "at">) {
  const list = await readGifts(email)
  list.push({ ...gift, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, at: Date.now() })
  await writeAtomic(inboxFile(email), JSON.stringify(list.slice(-50)))
}

/** Returns and clears the account's pending gifts. */
export async function takeGifts(email: string) {
  const list = await readGifts(email)
  if (list.length) await fs.rm(inboxFile(email), { force: true })
  return list
}

export async function readAnnouncement(): Promise<Announcement | null> {
  try {
    const a = JSON.parse(await fs.readFile(ANNOUNCE, "utf8")) as Announcement
    return a && typeof a.text === "string" && a.text ? a : null
  } catch {
    return null
  }
}

export async function writeAnnouncement(text: string) {
  if (!text) await fs.rm(ANNOUNCE, { force: true })
  else await writeAtomic(ANNOUNCE, JSON.stringify({ text, at: Date.now() }))
}
