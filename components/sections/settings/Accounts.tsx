"use client"

import { useEffect, useState } from "react"
import { Coins, Ticket, Users, RotateCcw, Trash2 } from "lucide-react"
import { fmtMoney } from "@/lib/format"
import { toast } from "@/lib/toast"
import { Field } from "./fields"

type AccountRow = { email: string; createdAt: number; savedAt: number | null; balance: number; pets: number; minutes: number }

/** Admin: every registered account with a summary of its cloud save, and tools to gift or reset. */
export function Accounts() {
  const [rows, setRows] = useState<AccountRow[] | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    fetch("/api/admin/users", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { users?: AccountRow[] }) => alive && setRows(d.users ?? []))
      .catch(() => alive && setRows([]))
    return () => {
      alive = false
    }
  }, [tick])

  const remove = async (email: string) => {
    if (!window.confirm(`Delete ${email} and their cloud save? This can't be undone.`)) return
    const res = await fetch(`/api/admin/users?email=${encodeURIComponent(email)}`, { method: "DELETE" })
    toast(res.ok ? { title: `Deleted ${email}`, tone: "info" } : { title: "Couldn't delete that account", tone: "err" })
    setTick((t) => t + 1)
  }

  const gift = async (email: string, type: "money" | "spins" | "reset") => {
    let amount = 0
    if (type === "reset") {
      if (!window.confirm(`Reset all of ${email}'s progress? It happens the next time they open the app.`)) return
    } else {
      const raw = window.prompt(type === "money" ? `How much money for ${email}?` : `How many spins for ${email}?`, type === "money" ? "1000000" : "5")
      amount = Number((raw ?? "").replace(/[^0-9]/g, ""))
      if (!amount) return
    }
    const res = await fetch("/api/admin/gift", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, type, amount }) })
    toast(
      res.ok
        ? {
            title: type === "reset" ? `Reset queued for ${email}` : `Sent ${type === "money" ? fmtMoney(amount) : `${amount} spins`} to ${email}`,
            body: "Delivered the next time they're online.",
            tone: "gold",
          }
        : { title: "Couldn't send that", tone: "err" },
    )
  }

  const act = "grid size-7 cursor-pointer place-items-center rounded-md text-muted"
  return (
    <Field title="Accounts" hint="Everyone who signed up. Gifts and resets are delivered the next time that player is online. The admin account lives in .env.local and isn't listed.">
      {rows === null ? (
        <p className="text-sm text-faint">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-faint">
          <Users aria-hidden className="size-4" /> No accounts yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Joined</th>
                <th className="px-3 py-2 font-medium">Last sync</th>
                <th className="px-3 py-2 text-right font-medium">Wallet</th>
                <th className="px-3 py-2 text-right font-medium">Pets</th>
                <th className="px-3 py-2 text-right font-medium">Focus</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.email}>
                  <td className="max-w-[14rem] truncate px-3 py-2 font-medium">{r.email}</td>
                  <td className="px-3 py-2 text-muted">{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td className="px-3 py-2 text-muted">{r.savedAt ? new Date(r.savedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "never"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(r.balance)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.pets}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{Math.round(r.minutes / 6) / 10}h</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-0.5">
                      <button type="button" onClick={() => void gift(r.email, "money")} aria-label={`Send money to ${r.email}`} title="Send money" className={`${act} hover:bg-gold/15 hover:text-gold`}>
                        <Coins className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => void gift(r.email, "spins")} aria-label={`Send spins to ${r.email}`} title="Send spins" className={`${act} hover:bg-accent/15 hover:text-accent`}>
                        <Ticket className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => void gift(r.email, "reset")} aria-label={`Reset ${r.email}'s progress`} title="Reset progress" className={`${act} hover:bg-danger/15 hover:text-danger`}>
                        <RotateCcw className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => void remove(r.email)} aria-label={`Delete ${r.email}`} title="Delete account" className={`${act} hover:bg-danger/15 hover:text-danger`}>
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Field>
  )
}
