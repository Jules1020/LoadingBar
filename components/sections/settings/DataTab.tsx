"use client"

import { useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Download, RotateCcw, Upload } from "lucide-react"
import { dayKey } from "@/lib/dates"
import { applySave, serialize } from "@/lib/persist"
import { resetProgress, store, useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { Button } from "../../Button"
import { Field } from "./fields"

export function DataSettings() {
  const router = useRouter()
  const user = useStore((s) => s.user)
  const importRef = useRef<HTMLInputElement>(null)

  const exportSave = () => {
    const blob = new Blob([JSON.stringify(serialize(store.get()), null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `loadingbar-save-${dayKey(new Date())}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSave = async (file: File) => {
    try {
      const data = JSON.parse(await file.text())
      if (!window.confirm("Replace your current progress with this save?")) return
      if (applySave(data)) toast({ title: "Save imported", tone: "ok" })
      else toast({ title: "That file isn't a LoadingBar save", tone: "err" })
    } catch {
      toast({ title: "Couldn't read that file", tone: "err" })
    }
  }

  return (
    <div className="grid max-w-3xl gap-6">
      <Field title="Account" hint={user ? "Your progress syncs to your account automatically." : "Playing as a guest: progress is saved in this browser only."}>
        {user ? (
          <p className="text-sm">
            Signed in as <span className="font-semibold">{user.email}</span>
          </p>
        ) : (
          <Link href="/login" className="btn-primary inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold">
            Sign in or create an account
          </Link>
        )}
      </Field>
      <Field title="Backup" hint="Download your progress as a file, or restore it from one.">
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportSave}>
            <Download aria-hidden className="size-4" /> Export save
          </Button>
          <Button onClick={() => importRef.current?.click()}>
            <Upload aria-hidden className="size-4" /> Import save
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importSave(f)
              e.target.value = ""
            }}
          />
        </div>
      </Field>
      <Field title="Reset" hint="Wipes pets, money, spins, history and unlocks. Settings are kept.">
        <Button
          variant="danger"
          onClick={() => {
            if (!window.confirm("Reset your progress? This can't be undone.")) return
            resetProgress()
            toast({ title: "Progress reset", tone: "info" })
            router.push("/")
          }}
        >
          <RotateCcw aria-hidden className="size-4" /> Reset progress
        </Button>
      </Field>
    </div>
  )
}
