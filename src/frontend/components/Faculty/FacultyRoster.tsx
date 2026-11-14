"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import Avatar from "@/frontend/components/Avatar"
import Badge, { type BadgeStatus } from "@/frontend/components/Badge"
import KpiCard from "@/frontend/components/KpiCard"
import ConfirmModal from "@/frontend/components/ConfirmModal"
import Toast, { type ToastMessage } from "@/frontend/components/Toast"
import FacultyPageHeader from "./FacultyPageHeader"
import FacultyOnboard from "./FacultyOnboard"
import {
  UsersIcon,
  CheckCircleIcon,
  InboxIcon,
  SearchIcon,
  ChevronRightIcon,
  ClipboardIcon,
  ArrowRightIcon,
  SettingsIcon,
  XMarkIcon,
} from "@/frontend/components/Icons"
import type { Assignment } from "@/backend/types"
import {
  type BatchConfig,
  compareRollNumbers,
  getStudentBatch,
  loadBatchConfig,
  saveBatchConfig,
} from "@/frontend/lib/batches"

interface RosterEntry {
  rollNo: string
  collegeEmail: string
  githubUsername?: string
  githubUserId?: number
  displayName?: string
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

const PAGE_SIZE = 30

export default function FacultyRoster({
  classParam,
  searchParam,
  initialView = "roster",
}: {
  classParam?: string
  searchParam?: string
  initialView?: "roster" | "onboard"
}) {
  const { data: session, status } = useSession()
  const { capabilities, classes: scopedClasses } = useSessionUser()
  const router = useRouter()
  const canWrite = capabilities.includes("roster.write")

  const [view, setView] = useState<"roster" | "onboard">(initialView)
  const [onboardTargetTeam, setOnboardTargetTeam] = useState<string | null>(
    classParam || null
  )

  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  // Selected class: null = show Classes Hub; string = focused Class Roster
  const [selectedClass, setSelectedClass] = useState<string | null>(
    classParam && classParam !== "all" ? classParam : null
  )

  // Hub view mode: "classes" (default) or "directory" (global search across all students)
  const [hubMode, setHubMode] = useState<"classes" | "directory">("classes")

  // In-class filters
  const [classSearch, setClassSearch] = useState(searchParam || "")
  const [classFilterStatus, setClassFilterStatus] = useState<string>("all")
  const [selectedBatch, setSelectedBatch] = useState<"all" | 1 | 2>("all")

  // Batch split modal / config
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [activeBatchConfig, setActiveBatchConfig] = useState<BatchConfig>(() =>
    loadBatchConfig(classParam && classParam !== "all" ? classParam : "")
  )

  const handleSelectClass = (cls: string | null) => {
    setSelectedClass(cls)
    if (cls) {
      setActiveBatchConfig(loadBatchConfig(cls))
      setSelectedBatch("all")
      setClassSearch("")
      setClassFilterStatus("all")
    }
  }

  // Global directory filters
  const [dirSearch, setDirSearch] = useState("")
  const [dirClass, setDirClass] = useState("all")
  const [dirStatus, setDirStatus] = useState("all")
  const [dirPage, setDirPage] = useState(0)

  // Actions
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<RosterEntry | null>(null)
  const [removing, setRemoving] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [createClassModalOpen, setCreateClassModalOpen] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [newClassDesc, setNewClassDesc] = useState("")
  const [creatingClass, setCreatingClass] = useState(false)
  const lastRemoved = useRef<RosterEntry | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  const load = () => {
    Promise.all([
      fetch("/api/roster").then((r) => (r.ok ? r.json() : { roster: [] })),
      fetch("/api/assignments").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([rosterData, assignData]) => {
        setRoster(rosterData.roster || [])
        setAssignments(Array.isArray(assignData) ? assignData : [])
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    if (session) load()
  }, [session])

  // Close menus on outside click / escape
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

  // All distinct class teams from roster and assignments
  const distinctTeams = useMemo(() => {
    const set = new Set<string>()
    roster.forEach((r) => r.classTeam && set.add(r.classTeam))
    assignments.forEach((a) => a.assignedTeams.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [roster, assignments])

  // Split into "My Classes" (if scoped) vs "Other Classes"
  const { myClasses, otherClasses } = useMemo(() => {
    if (!scopedClasses || scopedClasses.length === 0) {
      return { myClasses: distinctTeams, otherClasses: [] }
    }
    const my = distinctTeams.filter((t) => scopedClasses.includes(t))
    const other = distinctTeams.filter((t) => !scopedClasses.includes(t))
    return { myClasses: my, otherClasses: other }
  }, [distinctTeams, scopedClasses])

  // Stats across all loaded students
  const globalStats = {
    total: roster.length,
    active: roster.filter((r) => r.status === "active").length,
    invited: roster.filter((r) => r.status === "invited").length,
    noAccount: roster.filter((r) => r.status === "no-account").length,
    classesCount: distinctTeams.length,
  }

  // Students in currently selected class sorted naturally by roll number
  const classStudentsSorted = useMemo(() => {
    if (!selectedClass) return []
    return roster
      .filter((r) => r.classTeam === selectedClass)
      .sort((a, b) => compareRollNumbers(a.rollNo, b.rollNo))
  }, [roster, selectedClass])

  // Filtered class students (by batch, search, status)
  const classStudentsFiltered = useMemo(() => {
    if (!selectedClass) return []
    const total = classStudentsSorted.length
    return classStudentsSorted.filter((entry, idx) => {
      // 1. Batch filter
      if (selectedBatch !== "all") {
        const batch = getStudentBatch(
          entry.rollNo,
          idx,
          total,
          activeBatchConfig
        )
        if (batch !== selectedBatch) return false
      }
      // 2. Status filter
      if (classFilterStatus !== "all" && entry.status !== classFilterStatus) {
        return false
      }
      // 3. Search
      if (classSearch.trim()) {
        const q = classSearch.toLowerCase()
        const matches =
          entry.rollNo.toLowerCase().includes(q) ||
          entry.collegeEmail.toLowerCase().includes(q) ||
          entry.displayName?.toLowerCase().includes(q) ||
          entry.githubUsername?.toLowerCase().includes(q)
        if (!matches) return false
      }
      return true
    })
  }, [
    classStudentsSorted,
    selectedClass,
    selectedBatch,
    classFilterStatus,
    classSearch,
    activeBatchConfig,
  ])

  // Batch counts for current class
  const { batch1Count, batch2Count } = useMemo(() => {
    const total = classStudentsSorted.length
    let b1 = 0
    let b2 = 0
    classStudentsSorted.forEach((s, idx) => {
      const b = getStudentBatch(s.rollNo, idx, total, activeBatchConfig)
      if (b === 1) b1++
      else b2++
    })
    return { batch1Count: b1, batch2Count: b2 }
  }, [classStudentsSorted, activeBatchConfig])

  // Global directory filtered
  const dirFiltered = useMemo(() => {
    return roster.filter((r) => {
      if (dirClass !== "all" && r.classTeam !== dirClass) return false
      if (dirStatus !== "all" && r.status !== dirStatus) return false
      if (dirSearch.trim()) {
        const q = dirSearch.toLowerCase()
        return (
          r.rollNo.toLowerCase().includes(q) ||
          r.collegeEmail.toLowerCase().includes(q) ||
          r.displayName?.toLowerCase().includes(q) ||
          r.githubUsername?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [roster, dirClass, dirStatus, dirSearch])

  const dirPaged = useMemo(() => {
    const start = dirPage * PAGE_SIZE
    return dirFiltered.slice(start, start + PAGE_SIZE)
  }, [dirFiltered, dirPage])

  const dirPageCount = Math.max(1, Math.ceil(dirFiltered.length / PAGE_SIZE))

  // Remove student
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
      if (!res.ok) throw new Error("Couldn't restore student")
      const data = await res.json()
      setRoster((current) => [...current, data.restored as RosterEntry])
      setToast({
        id: Date.now(),
        text: `${entry.rollNo} restored to ${entry.classTeam}`,
      })
    } catch (err) {
      setToast({
        id: Date.now(),
        text: err instanceof Error ? err.message : "Couldn't undo removal",
      })
    }
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClassName.trim()) return
    setCreatingClass(true)
    try {
      const res = await fetch("/api/org/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClassName.trim(),
          description: newClassDesc.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setToast({
          id: Date.now(),
          text: data.error || "Failed to create class cohort",
        })
        return
      }
      setToast({
        id: Date.now(),
        text: `Created class cohort "${newClassName.trim()}"`,
      })
      setCreateClassModalOpen(false)
      setNewClassName("")
      setNewClassDesc("")
      load()
    } catch {
      setToast({
        id: Date.now(),
        text: "Network error creating class cohort",
      })
    } finally {
      setCreatingClass(false)
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-border" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-6xl">
        {/* Onboarding View Embedded */}
        {view === "onboard" && canWrite ? (
          <FacultyOnboard
            embedded
            initialTeamName={onboardTargetTeam || selectedClass || undefined}
            onDone={() => {
              setView("roster")
              load()
            }}
          />
        ) : (
          <>
            {/* 1. TOP HEADER & BREADCRUMBS */}
            {selectedClass ? (
              /* Inside a specific class */
              <div className="mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectClass(null)
                        window.history.pushState(null, "", "/faculty/roster")
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline mb-2 cursor-pointer"
                    >
                      <span>← Back to all classes</span>
                    </button>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-2xl font-bold tracking-tight text-ink">
                        {selectedClass}
                      </h1>
                      <span className="rounded-full bg-accent-soft px-3 py-0.5 text-xs font-semibold text-accent">
                        Class Roster
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {classStudentsSorted.length} enrolled students ·{" "}
                      {
                        classStudentsSorted.filter((s) => s.status === "active")
                          .length
                      }{" "}
                      active on GitHub ·{" "}
                      {
                        classStudentsSorted.filter(
                          (s) => s.status === "invited"
                        ).length
                      }{" "}
                      invites pending
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/faculty/class/${encodeURIComponent(selectedClass)}`}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 text-xs font-medium text-ink transition-colors hover:bg-canvas hover:text-accent shadow-xs"
                    >
                      <ClipboardIcon className="size-4" />
                      <span>Class Dashboard</span>
                      <ArrowRightIcon className="size-3" />
                    </Link>
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => {
                          setOnboardTargetTeam(selectedClass)
                          setView("onboard")
                        }}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-accent px-4 text-xs font-medium text-white transition-colors hover:bg-accent-hover shadow-xs"
                      >
                        <span>+ Onboard Students</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. BATCH TABS & FILTER BAR FOR THIS CLASS */}
                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Batch Tabs */}
                  <div className="inline-flex flex-wrap items-center rounded-xl border border-border bg-canvas p-1 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setSelectedBatch("all")}
                      className={`min-h-8 rounded-lg px-3 transition-colors ${
                        selectedBatch === "all"
                          ? "bg-surface font-semibold text-ink shadow-xs"
                          : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      All Students ({classStudentsSorted.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBatch(1)}
                      className={`min-h-8 rounded-lg px-3 transition-colors ${
                        selectedBatch === 1
                          ? "bg-surface font-semibold text-accent shadow-xs"
                          : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      {activeBatchConfig.batch1Label || "Batch 1"} ({batch1Count}
                      )
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBatch(2)}
                      className={`min-h-8 rounded-lg px-3 transition-colors ${
                        selectedBatch === 2
                          ? "bg-surface font-semibold text-accent shadow-xs"
                          : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      {activeBatchConfig.batch2Label || "Batch 2"} ({batch2Count}
                      )
                    </button>
                  </div>

                  {/* Actions & Split Config button */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBatchModalOpen(true)}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-ink-muted hover:border-accent hover:text-accent transition-colors"
                    >
                      <SettingsIcon className="size-3.5" />
                      <span>Configure Lab Split</span>
                    </button>
                  </div>
                </div>

                {/* Search & Status Filter */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint pointer-events-none" />
                    <input
                      type="text"
                      placeholder={`Search ${selectedClass} by roll number, name, or GitHub...`}
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft"
                    />
                  </div>

                  <select
                    value={classFilterStatus}
                    onChange={(e) => setClassFilterStatus(e.target.value)}
                    aria-label="Filter by status"
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent-soft"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active (GitHub Synced)</option>
                    <option value="invited">Invited (Pending)</option>
                    <option value="no-account">No GitHub Account</option>
                  </select>
                </div>

                {/* CLASS STUDENTS TABLE */}
                <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
                  {classStudentsFiltered.length === 0 ? (
                    <div className="p-12 text-center text-sm text-ink-muted">
                      No students match this search or filter in {selectedClass}.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border bg-canvas/70 text-xs font-medium uppercase tracking-wider text-ink-muted">
                        <tr>
                          <th className="px-5 py-3.5">Roll No</th>
                          <th className="px-5 py-3.5">Student</th>
                          <th className="px-5 py-3.5">GitHub Account</th>
                          <th className="px-5 py-3.5">College Email</th>
                          <th className="px-5 py-3.5">Lab Batch</th>
                          <th className="px-5 py-3.5">Status</th>
                          {canWrite && (
                            <th className="px-5 py-3.5 text-right">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {classStudentsFiltered.map((entry) => {
                          const key = `${entry.rollNo}-${entry.classTeam}`
                          const menuOpen = openMenu === key
                          const overallIndex = classStudentsSorted.findIndex(
                            (s) => s.rollNo === entry.rollNo
                          )
                          const batch = getStudentBatch(
                            entry.rollNo,
                            overallIndex >= 0 ? overallIndex : 0,
                            classStudentsSorted.length,
                            activeBatchConfig
                          )

                          return (
                            <tr
                              key={key}
                              className="hover:bg-canvas/50 transition-colors"
                            >
                              <td className="px-5 py-3.5 font-mono text-xs font-semibold text-ink">
                                {entry.rollNo}
                              </td>

                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    name={entry.displayName || entry.rollNo}
                                    size="sm"
                                  />
                                  <div>
                                    {entry.githubUsername ? (
                                      <Link
                                        href={`/profile?username=${encodeURIComponent(
                                          entry.githubUsername
                                        )}`}
                                        className="font-medium text-ink hover:text-accent hover:underline block"
                                      >
                                        {entry.displayName || entry.rollNo}
                                      </Link>
                                    ) : (
                                      <span className="font-medium text-ink block">
                                        {entry.displayName || entry.rollNo}
                                      </span>
                                    )}
                                    {entry.displayName && (
                                      <span className="text-[11px] text-ink-faint">
                                        Roll #{entry.rollNo}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-3.5">
                                {entry.githubUsername ? (
                                  <div className="flex items-center gap-1.5 font-mono text-xs">
                                    <Link
                                      href={`/profile?username=${encodeURIComponent(
                                        entry.githubUsername
                                      )}`}
                                      className="text-accent hover:underline"
                                      style={{
                                        fontFamily: "var(--font-mono)",
                                      }}
                                    >
                                      @{entry.githubUsername}
                                    </Link>
                                    <a
                                      href={`https://github.com/${entry.githubUsername}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Open GitHub profile"
                                      className="text-ink-faint hover:text-ink text-[10px]"
                                    >
                                      ↗
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-xs text-ink-faint">
                                    —
                                  </span>
                                )}
                              </td>

                              <td className="px-5 py-3.5 text-xs text-ink-muted">
                                {entry.collegeEmail ? (
                                  <a
                                    href={`mailto:${entry.collegeEmail}`}
                                    className="hover:text-accent hover:underline"
                                  >
                                    {entry.collegeEmail}
                                  </a>
                                ) : (
                                  "—"
                                )}
                              </td>

                              <td className="px-5 py-3.5">
                                <span
                                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                                    batch === 1
                                      ? "bg-accent-soft text-accent"
                                      : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                  }`}
                                >
                                  {batch === 1
                                    ? activeBatchConfig.batch1Label || "Batch 1"
                                    : activeBatchConfig.batch2Label ||
                                      "Batch 2"}
                                </span>
                              </td>

                              <td className="px-5 py-3.5">
                                <Badge status={badgeFor[entry.status]} />
                              </td>

                              {canWrite && (
                                <td className="relative px-5 py-3.5 text-right">
                                  <button
                                    type="button"
                                    aria-haspopup="menu"
                                    aria-expanded={menuOpen}
                                    onClick={() =>
                                      setOpenMenu(menuOpen ? null : key)
                                    }
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-canvas hover:text-ink transition-colors"
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
                                        <>
                                          <Link
                                            role="menuitem"
                                            href={`/profile?username=${encodeURIComponent(
                                              entry.githubUsername
                                            )}`}
                                            className="block rounded-lg px-3 py-2 text-xs font-medium text-accent hover:bg-canvas"
                                          >
                                            View student profile
                                          </Link>
                                          <a
                                            role="menuitem"
                                            href={`https://github.com/${entry.githubUsername}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block rounded-lg px-3 py-2 text-xs text-ink-muted hover:bg-canvas hover:text-ink"
                                          >
                                            Open GitHub profile
                                          </a>
                                        </>
                                      )}
                                      <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() => {
                                          setOpenMenu(null)
                                          setPendingRemove(entry)
                                        }}
                                        className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-danger-text hover:bg-danger-soft"
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
                  )}
                </div>
              </div>
            ) : (
              /* TOP-LEVEL CLASSES HUB */
              <>
                <FacultyPageHeader
                  title="Student Roster"
                  subtitle="Manage student enrollment, GitHub synchronization, and class cohorts"
                  action={
                    canWrite ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCreateClassModalOpen(true)}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 text-xs font-medium text-ink hover:bg-canvas transition-colors shadow-xs"
                        >
                          <span>+ Create Class</span>
                        </button>
                        <Link
                          href="/faculty/assignments/new"
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 text-xs font-medium text-ink hover:bg-canvas transition-colors shadow-xs"
                        >
                          <span>+ Create Subject</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setOnboardTargetTeam(null)
                            setView("onboard")
                          }}
                          className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-xs font-medium text-white transition-colors hover:bg-accent-hover shadow-xs"
                        >
                          + Onboard students
                        </button>
                      </div>
                    ) : undefined
                  }
                />

                {/* View Mode Toggle */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div
                    role="tablist"
                    aria-label="Roster views"
                    className="inline-flex rounded-xl border border-border bg-canvas p-1 text-xs font-medium"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={hubMode === "classes"}
                      onClick={() => setHubMode("classes")}
                      className={`min-h-9 rounded-lg px-4 transition-colors ${
                        hubMode === "classes"
                          ? "bg-surface font-semibold text-ink shadow-xs"
                          : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      Class Cohorts ({distinctTeams.length})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={hubMode === "directory"}
                      onClick={() => setHubMode("directory")}
                      className={`min-h-9 rounded-lg px-4 transition-colors ${
                        hubMode === "directory"
                          ? "bg-surface font-semibold text-ink shadow-xs"
                          : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      All Students Directory ({globalStats.total})
                    </button>
                  </div>
                </div>

                {/* KPI Overview */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
                  <KpiCard
                    label="Total Students"
                    value={globalStats.total}
                    hint="across all classes"
                    icon={<UsersIcon className="size-4" />}
                  />
                  <KpiCard
                    label="Class Cohorts"
                    value={globalStats.classesCount}
                    hint="academic sections"
                    tone="accent"
                    icon={<ClipboardIcon className="size-4" />}
                  />
                  <KpiCard
                    label="Active on GitHub"
                    value={globalStats.active}
                    hint="verified members"
                    tone="success"
                    icon={<CheckCircleIcon className="size-4" />}
                  />
                  <KpiCard
                    label="Pending Invites"
                    value={globalStats.invited + globalStats.noAccount}
                    hint="awaiting setup"
                    tone={
                      globalStats.invited + globalStats.noAccount > 0
                        ? "caution"
                        : "neutral"
                    }
                    icon={<InboxIcon className="size-4" />}
                  />
                </div>

                {hubMode === "classes" ? (
                  /* CLASS CARDS GRID */
                  <div className="space-y-8">
                    {/* My Classes (if scoped) */}
                    {myClasses.length > 0 && (
                      <section>
                        {scopedClasses && scopedClasses.length > 0 && (
                          <div className="mb-4 flex items-center gap-2">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink">
                              My Assigned Classes
                            </h2>
                            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                              {myClasses.length}
                            </span>
                          </div>
                        )}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {myClasses.map((teamName) => {
                            const teamStudents = roster.filter(
                              (r) => r.classTeam === teamName
                            )
                            const activeCount = teamStudents.filter(
                              (r) => r.status === "active"
                            ).length
                            const pendingCount = teamStudents.filter(
                              (r) => r.status !== "active"
                            ).length
                            const teamAssigns = assignments.filter((a) =>
                              a.assignedTeams.includes(teamName)
                            )
                            const teamSubjects = [
                              ...new Set(teamAssigns.map((a) => a.subject)),
                            ]

                            return (
                              <div
                                key={teamName}
                                className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 hover:border-accent hover:shadow-sm transition-all"
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                                      <UsersIcon className="size-5" />
                                    </span>
                                    <span className="rounded-full bg-canvas px-2.5 py-0.5 text-xs font-medium text-ink-muted">
                                      {teamStudents.length} Students
                                    </span>
                                  </div>

                                  <h3 className="mt-4 text-base font-semibold text-ink group-hover:text-accent transition-colors">
                                    {teamName}
                                  </h3>

                                  <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                                    <span className="text-success font-medium">
                                      {activeCount} Active
                                    </span>
                                    <span>·</span>
                                    <span>{pendingCount} Pending</span>
                                  </div>

                                  {teamSubjects.length > 0 ? (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                      {teamSubjects.map((sub) => (
                                        <span
                                          key={sub}
                                          className="rounded-md bg-canvas px-2 py-0.5 text-[11px] text-ink-muted"
                                        >
                                          {sub}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="mt-3 text-xs text-ink-faint">
                                      No active PBL assignments yet
                                    </p>
                                  )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleSelectClass(teamName)
                                      window.history.pushState(
                                        null,
                                        "",
                                        `/faculty/roster?class=${encodeURIComponent(
                                          teamName
                                        )}`
                                      )
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
                                  >
                                    <span>Open Roster</span>
                                    <ChevronRightIcon className="size-3.5" />
                                  </button>

                                  <div className="flex items-center gap-2">
                                    <Link
                                      href={`/faculty/class/${encodeURIComponent(
                                        teamName
                                      )}`}
                                      className="rounded px-2 py-1 text-xs text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
                                      title="Class Dashboard"
                                    >
                                      Dashboard
                                    </Link>
                                    <Link
                                      href={`/faculty/assignments/new?class=${encodeURIComponent(
                                        teamName
                                      )}`}
                                      className="rounded px-2 py-1 text-xs text-accent hover:bg-accent-soft transition-colors"
                                      title="Create Subject for this class"
                                    >
                                      + Subject
                                    </Link>
                                    {canWrite && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOnboardTargetTeam(teamName)
                                          setView("onboard")
                                        }}
                                        className="rounded px-2 py-1 text-xs text-accent hover:bg-accent-soft transition-colors"
                                        title="Onboard students directly to this class"
                                      >
                                        + Onboard
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </section>
                    )}

                    {/* Other Classes (if scoped) */}
                    {otherClasses.length > 0 && (
                      <section className="pt-4 border-t border-border">
                        <div className="mb-4 flex items-center gap-2">
                          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
                            Other Cohorts
                          </h2>
                          <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-ink-muted">
                            {otherClasses.length}
                          </span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {otherClasses.map((teamName) => {
                            const teamStudents = roster.filter(
                              (r) => r.classTeam === teamName
                            )
                            return (
                              <div
                                key={teamName}
                                className="flex flex-col justify-between rounded-2xl border border-border bg-surface/70 p-5 hover:border-border-strong transition-all"
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-ink-muted">
                                      {teamStudents.length} Students
                                    </span>
                                  </div>
                                  <h3 className="mt-2 text-base font-semibold text-ink">
                                    {teamName}
                                  </h3>
                                </div>

                                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectClass(teamName)}
                                    className="text-xs font-medium text-ink-muted hover:text-accent hover:underline"
                                  >
                                    View Roster →
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </section>
                    )}
                  </div>
                ) : (
                  /* GLOBAL DIRECTORY TABLE */
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative flex-1 min-w-[240px]">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search all students by roll number, name, email, or GitHub..."
                          value={dirSearch}
                          onChange={(e) => {
                            setDirSearch(e.target.value)
                            setDirPage(0)
                          }}
                          className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft"
                        />
                      </div>

                      <select
                        value={dirClass}
                        onChange={(e) => {
                          setDirClass(e.target.value)
                          setDirPage(0)
                        }}
                        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
                      >
                        <option value="all">All Classes</option>
                        {distinctTeams.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>

                      <select
                        value={dirStatus}
                        onChange={(e) => {
                          setDirStatus(e.target.value)
                          setDirPage(0)
                        }}
                        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="invited">Invited</option>
                        <option value="no-account">No GitHub</option>
                      </select>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
                      {dirPaged.length === 0 ? (
                        <div className="p-12 text-center text-sm text-ink-muted">
                          No students found matching your filters.
                        </div>
                      ) : (
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-border bg-canvas/70 text-xs font-medium uppercase tracking-wider text-ink-muted">
                            <tr>
                              <th className="px-5 py-3.5">Roll No</th>
                              <th className="px-5 py-3.5">Student</th>
                              <th className="px-5 py-3.5">Class Cohort</th>
                              <th className="px-5 py-3.5">GitHub Account</th>
                              <th className="px-5 py-3.5">College Email</th>
                              <th className="px-5 py-3.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {dirPaged.map((entry) => (
                              <tr
                                key={`${entry.rollNo}-${entry.classTeam}`}
                                className="hover:bg-canvas/50 transition-colors"
                              >
                                <td className="px-5 py-3.5 font-mono text-xs font-semibold text-ink">
                                  {entry.rollNo}
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <Avatar
                                      name={entry.displayName || entry.rollNo}
                                      size="sm"
                                    />
                                    {entry.githubUsername ? (
                                      <Link
                                        href={`/profile?username=${encodeURIComponent(
                                          entry.githubUsername
                                        )}`}
                                        className="font-medium text-ink hover:text-accent hover:underline"
                                      >
                                        {entry.displayName || entry.rollNo}
                                      </Link>
                                    ) : (
                                      <span className="font-medium text-ink">
                                        {entry.displayName || entry.rollNo}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSelectClass(entry.classTeam)
                                    }
                                    className="font-medium text-xs text-accent hover:underline"
                                  >
                                    {entry.classTeam}
                                  </button>
                                </td>
                                <td className="px-5 py-3.5 font-mono text-xs">
                                  {entry.githubUsername ? (
                                    <Link
                                      href={`/profile?username=${encodeURIComponent(
                                        entry.githubUsername
                                      )}`}
                                      className="text-accent hover:underline"
                                    >
                                      @{entry.githubUsername}
                                    </Link>
                                  ) : (
                                    <span className="text-ink-faint">—</span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5 text-xs text-ink-muted">
                                  {entry.collegeEmail || "—"}
                                </td>
                                <td className="px-5 py-3.5">
                                  <Badge status={badgeFor[entry.status]} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Pagination for directory */}
                      {dirPageCount > 1 && (
                        <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-canvas/30 text-xs text-ink-muted">
                          <span>
                            Showing {dirPage * PAGE_SIZE + 1} to{" "}
                            {Math.min(
                              (dirPage + 1) * PAGE_SIZE,
                              dirFiltered.length
                            )}{" "}
                            of {dirFiltered.length} students
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={dirPage === 0}
                              onClick={() => setDirPage((p) => p - 1)}
                              className="rounded px-2.5 py-1 font-medium hover:bg-surface disabled:opacity-40"
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              disabled={dirPage >= dirPageCount - 1}
                              onClick={() => setDirPage((p) => p + 1)}
                              className="rounded px-2.5 py-1 font-medium hover:bg-surface disabled:opacity-40"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* 3. CONFIGURE LAB SPLIT MODAL */}
        {batchModalOpen && selectedClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-semibold text-ink">
                  Configure Lab Batches: {selectedClass}
                </h3>
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="rounded-lg p-1 text-ink-muted hover:bg-canvas hover:text-ink transition-colors"
                  aria-label="Close dialog"
                >
                  <XMarkIcon className="size-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                    Split Strategy
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 rounded-xl border border-border p-3 hover:bg-canvas cursor-pointer">
                      <input
                        type="radio"
                        name="splitType"
                        value="sequential"
                        checked={activeBatchConfig.splitType === "sequential"}
                        onChange={() =>
                          setActiveBatchConfig((prev) => ({
                            ...prev,
                            splitType: "sequential",
                          }))
                        }
                        className="text-accent focus:ring-accent"
                      />
                      <div>
                        <div className="font-semibold text-xs text-ink">
                          Sequential 50–50 Split
                        </div>
                        <div className="text-xs text-ink-muted">
                          First half (Rolls 1–30) to Batch 1, Second half (Rolls
                          31–60) to Batch 2
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 rounded-xl border border-border p-3 hover:bg-canvas cursor-pointer">
                      <input
                        type="radio"
                        name="splitType"
                        value="oddeven"
                        checked={activeBatchConfig.splitType === "oddeven"}
                        onChange={() =>
                          setActiveBatchConfig((prev) => ({
                            ...prev,
                            splitType: "oddeven",
                          }))
                        }
                        className="text-accent focus:ring-accent"
                      />
                      <div>
                        <div className="font-semibold text-xs text-ink">
                          Odd / Even Roll Numbers
                        </div>
                        <div className="text-xs text-ink-muted">
                          Odd rolls to Batch 1, Even rolls to Batch 2
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 rounded-xl border border-border p-3 hover:bg-canvas cursor-pointer">
                      <input
                        type="radio"
                        name="splitType"
                        value="custom"
                        checked={activeBatchConfig.splitType === "custom"}
                        onChange={() =>
                          setActiveBatchConfig((prev) => ({
                            ...prev,
                            splitType: "custom",
                          }))
                        }
                        className="text-accent focus:ring-accent"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-xs text-ink">
                          Custom Roll Number Cutoff
                        </div>
                        <div className="text-xs text-ink-muted">
                          Students with roll number up to this cutoff go to Batch 1
                        </div>
                      </div>
                    </label>
                  </div>

                  {activeBatchConfig.splitType === "custom" && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-ink mb-1">
                        Cutoff Roll Number (inclusive for Batch 1)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 30"
                        value={activeBatchConfig.customCutoff ?? ""}
                        onChange={(e) =>
                          setActiveBatchConfig((prev) => ({
                            ...prev,
                            customCutoff: e.target.value
                              ? parseInt(e.target.value, 10)
                              : undefined,
                          }))
                        }
                        className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">
                      Batch 1 Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Batch 1 (Prof. A)"
                      value={activeBatchConfig.batch1Label ?? ""}
                      onChange={(e) =>
                        setActiveBatchConfig((prev) => ({
                          ...prev,
                          batch1Label: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">
                      Batch 2 Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Batch 2 (Prof. B)"
                      value={activeBatchConfig.batch2Label ?? ""}
                      onChange={(e) =>
                        setActiveBatchConfig((prev) => ({
                          ...prev,
                          batch2Label: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-ink"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-canvas"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveBatchConfig(selectedClass, activeBatchConfig)
                    setBatchModalOpen(false)
                    setToast({
                      id: Date.now(),
                      text: `Saved batch configuration for ${selectedClass}`,
                    })
                  }}
                  className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover shadow-xs"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE CLASS MODAL */}
        {createClassModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-ink">Create Class Cohort</h3>
              <p className="text-xs text-ink-muted mt-1">
                Creates a new closed GitHub team for the cohort and registers it across KJIT Classroom.
              </p>

              <form onSubmit={handleCreateClass} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Class Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MCA C 25-26, BTech CS 2026"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2025–2026 MCA Section C"
                    value={newClassDesc}
                    onChange={(e) => setNewClassDesc(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft"
                  />
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setCreateClassModalOpen(false)}
                    className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-ink-muted hover:bg-canvas"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingClass}
                    className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover transition-colors shadow-xs disabled:opacity-50"
                  >
                    {creatingClass ? "Creating..." : "Create Class Cohort"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. MODALS & TOASTS */}
        <ConfirmModal
          open={!!pendingRemove}
          title={`Remove ${pendingRemove?.rollNo}?`}
          body={`This removes @${
            pendingRemove?.githubUsername || pendingRemove?.rollNo
          } from ${pendingRemove?.classTeam}. They can be re-onboarded later.`}
          confirmLabel="Remove student"
          busy={removing}
          onConfirm={confirmRemove}
          onCancel={() => {
            if (!removing) setPendingRemove(null)
          }}
        />

        {toast && (
          <Toast
            toast={toast}
            onDismiss={() => setToast(null)}
            onAction={() => { void undoRemove() }}
          />
        )}
      </div>
    </>
  )
}
