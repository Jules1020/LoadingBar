"use client"

// Minimal IndexedDB wrapper for the user's music files (Blobs are too big for localStorage).

const DB = "loadingbar"
const STORE = "tracks"
const COVERS = "covers"

export type StoredTrack = { id: string; name: string; type: string; blob: Blob; addedAt: number }

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 2)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" })
      if (!req.result.objectStoreNames.contains(COVERS)) req.result.createObjectStore(COVERS, { keyPath: "id" })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>, store = STORE): Promise<T> {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const req = fn(tx.objectStore(store))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export async function allTracks(): Promise<StoredTrack[]> {
  try {
    const rows = await run<StoredTrack[]>("readonly", (s) => s.getAll() as IDBRequest<StoredTrack[]>)
    return rows.sort((a, b) => a.addedAt - b.addedAt)
  } catch {
    return []
  }
}

export async function putTrack(t: StoredTrack) {
  try {
    await run("readwrite", (s) => s.put(t))
    return true
  } catch {
    return false
  }
}

export async function deleteTrack(id: string) {
  try {
    await run("readwrite", (s) => s.delete(id))
  } catch {
    // ignore
  }
}

// ---------- cover art (one image per track id, built-in stations included) ----------
export type StoredCover = { id: string; blob: Blob }

export async function allCovers(): Promise<StoredCover[]> {
  try {
    return await run<StoredCover[]>("readonly", (s) => s.getAll() as IDBRequest<StoredCover[]>, COVERS)
  } catch {
    return []
  }
}

export async function putCover(c: StoredCover) {
  try {
    await run("readwrite", (s) => s.put(c), COVERS)
    return true
  } catch {
    return false
  }
}

export async function deleteCover(id: string) {
  try {
    await run("readwrite", (s) => s.delete(id), COVERS)
  } catch {
    // ignore
  }
}
