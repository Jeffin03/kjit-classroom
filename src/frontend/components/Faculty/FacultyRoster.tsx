"use client"

import FacultyPageHeader from "./FacultyPageHeader"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import Avatar from "@/frontend/components/Avatar"
import Badge, { type BadgeStatus } from "@/frontend/components/Badge"
import KpiCard from "@/frontend/components/KpiCard"
import ConfirmModal from "@/frontend/components/ConfirmModal"
import Toast, { type ToastMessage } from "@/frontend/components/Toast"
import {
  UsersIcon,
  CheckCircleIcon,
  InboxIcon,
} from "@/frontend/components/Icons"

interface RosterEntry {
  rollNo: string
  collegeEmail: string
  githubUsername?: string
  githubUserId?: number
  classTeam: string
  status: "invited" | "active" | "no-account"
  onboardedBy: string
  onboardedAt: string
}

const badgeFor: Record<RosterEntry["status"], BadgeStatus> = {
  active: "active",
  invited: "invited",
  "no-account": "no-account",
}

export default function FacultyRoster({ classParam }: { classParam?: string }) {
  const { data: session, status } = useSession()
  const { capabilities } = useSessionUser()
  const router = useRouter()
  const canWrite = capabilities.includes("roster.write")

  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [filterTeam, setFilterTeam] = useState<string>(classParam || "all")
  const [search, setSearch] = useState("")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<RosterEntry | null>(null)
  const [removing, setRemoving] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const lastRemoved = useRef<RosterEntry | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  const load = () => {
    fetch("/api/roster")
      .then((res) => {
        if (!res.ok) throw new Error("roster request failed")
        return res.json()
      })
      .then((data) => {
        setRoster(data.roster || [])
        setLoading(false)
      })
      .catch(() => {
        setLoadError(true)
        setLoading(false)
      })
  }

  useEffect(() => {
    if (session) load()
  }, [session])

  useEffect(() => {
    if (!openMenu) return
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [openMenu])

  const classTeams = [...new Set(roster.map((r) => r.classTeam))].sort()

  /** A `?class=` deep link can name a class that has no roster rows yet. */
  const classOptions =
    filterTeam !== "all" && !classTeams.includes(filterTeam)
      ? [...classTeams, filterTeam].sort()
      : classTeams

  const filtered = roster.filter((r) => {
    const matchesTeam = filterTeam === "all" || r.classTeam === filterTeam
    const matchesSearch =
      !search ||
      r.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      r.collegeEmail.toLowerCase().includes(search.toLowerCase()) ||
      r.githubUsername?.toLowerCase().includes(search.toLowerCase())
    return matchesTeam && matchesSearch
  })

  const stats = {
    total: roster.length,
    active: roster.filter((r) => r.status === "active").length,
    invited: roster.filter((r) => r.status === "invited").length,
    noAccount: roster.filter((r) => r.status === "no-account").length,
  }

  const confirmRemove = async () => {
    if (!pendingRemove) return
    setRemoving(true)
    try {
      const res = await fetch("/api/roster", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNo: pendingRemove.rollNo,
          classTeam: pendingRemove.classTeam,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to remove student")

      lastRemoved.current = pendingRemove
      setRoster((current) =>
        current.filter(
          (entry) =>
            !(
              entry.rollNo === pendingRemove.rollNo &&
              entry.classTeam === pendingRemove.classTeam
            )
        )
      )
      setToast({
        id: Date.now(),
        text: `${pendingRemove.rollNo} removed from ${pendingRemove.classTeam}`,
        actionLabel: canWrite ? "Undo" : undefined,
      })
      setPendingRemove(null)
    } catch (err) {
      setToast({
        id: Date.now(),
        text: err instanceof Error ? err.message : "Failed to remove student",
      })
    } finally {
      setRemoving(false)
    }
  }

  const undoRemove = async () => {
    const entry = lastRemoved.current
    if (!entry) return
    lastRemoved.current = null
    try {
      const res = await fetch("/api/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      })
      if (!res.ok) throw new Error("Couldn't put the student back")
      const data = await res.json()
      setRoster((current) => [...current, data.restored as RosterEntry])
      setToast({
        id: Date.now(),
        text: `${entry.rollNo} restored to ${entry.classTeam}`,
      })
    } catch (err) {
      setToast({
        id: Date.now(),
        text: err instanceof Error ? err.message : "Couldn't undo the removal",
      })
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-border" />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-border" />
            ))}
          </div>
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded bg-border" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-6xl">
        <FacultyPageHeader
          title="Student Roster"
          subtitle="View all onboarded students across your classes"
          action={
            canWrite ? (
              <Link
                href="/faculty/onboard"
                className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Onboard students
              </Link>
            ) : undefined
          }
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard
            label="Total students"
            value={stats.total}
            hint="across your classes"
            icon={<UsersIcon className="size-4" />}
          />
          <KpiCard
            label="Active"
            value={stats.active}
            hint="with GitHub access"
            tone="success"
            icon={<CheckCircleIcon className="size-4" />}
          />
          <KpiCard
            label="Invited"
            value={stats.invited}
            hint="invite pending"
            tone="caution"
            icon={<InboxIcon className="size-4" />}
          />
          <KpiCard
            label="No GitHub"
            value={stats.noAccount}
            hint="needs an account"
            tone={stats.noAccount ? "danger" : "neutral"}
            icon={<InboxIcon className="size-4" />}
          />
        </div>

        <div className="mt-6 mb-6 flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by roll no, email, or GitHub username..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent-soft focus:outline-none"
            />
          </div>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            aria-label="Filter by class"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent-soft focus:outline-none"
          >
            <option value="all">All Classes</option>
            {classOptions.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          {filtered.length === 0 ? (
            <div
              className={`p-8 text-center ${
                loadError ? "text-danger-text" : "text-ink-muted"
              }`}
            >
              {loadError
                ? "Couldn't load the roster. Refresh the page to try again."
                : "No students found"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-canvas">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase">
                      Roll No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase">
                      College Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase">
                      GitHub
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase">
                      Onboarded By
                    </th>
                    {canWrite && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-ink-muted uppercase">
                        <span className="sr-only">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((entry) => {
                    const key = `${entry.rollNo}-${entry.classTeam}`
                    const menuOpen = openMenu === key
                    return (
                      <tr
                        key={key}
                        className="hover:bg-canvas transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-3">
                            <Avatar name={entry.rollNo} size="sm" />
                            <span className="text-sm font-medium">
                              {entry.rollNo}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-muted">
                          {entry.collegeEmail}
                        </td>
                        <td className="px-6 py-4">
                          {entry.githubUsername ? (
                            <a
                              href={`https://github.com/${entry.githubUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-accent hover:underline"
                              style={{ fontFamily: "var(--font-mono)" }}
                            >
                              @{entry.githubUsername}
                            </a>
                          ) : (
                            <span className="text-sm text-ink-faint">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-muted">
                          {entry.classTeam}
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={badgeFor[entry.status]} />
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-muted">
                          {entry.onboardedBy}
                        </td>
                        {canWrite && (
                          <td className="relative px-6 py-4 text-right">
                            <button
                              type="button"
                              aria-haspopup="menu"
                              aria-expanded={menuOpen}
                              aria-label={`Actions for ${entry.rollNo}`}
                              onClick={() =>
                                setOpenMenu(menuOpen ? null : key)
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
                            >
                              ⋯
                            </button>
                            {menuOpen && (
                              <div
                                ref={menuRef}
                                role="menu"
                                className="absolute right-6 top-full z-30 mt-1 w-52 rounded-xl border border-border bg-surface p-1.5 text-left shadow-lg"
                              >
                                {entry.githubUsername && (
                                  <a
                                    role="menuitem"
                                    href={`https://github.com/${entry.githubUsername}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-canvas hover:text-ink"
                                  >
                                    Open GitHub profile
                                  </a>
                                )}
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenMenu(null)
                                    setPendingRemove(entry)
                                  }}
                                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger-text hover:bg-danger-soft"
                                >
                                  Remove from class
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!pendingRemove}
        title={
          pendingRemove
            ? `Remove ${pendingRemove.rollNo} from ${pendingRemove.classTeam}?`
            : ""
        }
        body="They lose access to this class's assignments. Past submissions stay on record. You can undo this right after."
        confirmLabel="Remove"
        busy={removing}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />

      <Toast
        toast={toast}
        onAction={undoRemove}
        onDismiss={() => setToast(null)}
      />
    </>
  )
}
