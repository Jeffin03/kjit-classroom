"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Button from "@/frontend/components/Button"
import type { SprintSummary } from "@/backend/types"
import { ArrowRightIcon, CheckIcon, PrintIcon, SyncIcon, UsersIcon } from "@/frontend/components/Icons"

interface TeamReview {
  team: {
    id: string
    projectTitle: string
    status: string
    members: Array<{
      username: string
      rollNo: string
      displayName?: string
      isLead: boolean
    }>
    assignmentId: string
    createdAt: string
    updatedAt: string
  }
  lowestRollNo: string
  submission: {
    id: string
    studentUsername: string
    assignmentId: string
    status: string
    sprints: Array<{
      id: string
      sprintNumber: number
      commitSha: string
      reviewedAt?: string
      reviewedBy?: string
      documentationUrl?: string
      summary?: SprintSummary
    }>
  } | null
  submittingMember: { username: string; rollNo: string } | null
  sprintStatus: {
    submitted: number
    reviewed: number
    total: number
    currentSprint: number
    lastReviewedAt?: string
  }
}

interface PendingReview {
  id: string
  submissionId: string
  sprintSubmissionId: string
  sprintNumber: number
  teamId: string
  projectTitle: string
  notes: string
  createdAt: string
}

const PENDING_KEY = "kjit-pwa-pending-reviews"
const TEAMS_CACHE_KEY = "kjit-pwa-teams-cache"
const LAST_SYNC_KEY = "kjit-pwa-last-sync"

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

export default function PWAReview({
  assignment,
  onAssignmentChange,
  assignments,
}: {
  assignment: { id: string; title: string; subject: string; sprintCount: number }
  onAssignmentChange: (id: string) => void
  assignments: Array<{ id: string; title: string; subject: string; sprintCount: number }>
}) {
  const [teams, setTeams] = useState<TeamReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  )
  const [syncing, setSyncing] = useState(false)
  const [openTeamId, setOpenTeamId] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [printView, setPrintView] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Pending reviews from localStorage
  const pendingReviews: PendingReview[] = useMemo(() => {
    try {
      const raw = localStorage.getItem(PENDING_KEY)
      return raw ? (JSON.parse(raw) as PendingReview[]) : []
    } catch {
      return []
    }
  }, [])

  // Fetch teams for the current assignment
  const fetchTeams = useCallback(() => {
    setLoading(true)
    setError(null)

    try {
      const cached = localStorage.getItem(TEAMS_CACHE_KEY)
      if (cached) {
        const data = JSON.parse(cached)
        if (data.assignmentId === assignment.id && Array.isArray(data.teams)) {
          setTeams(data.teams)
          setLoading(false)
        }
      }
    } catch {
      // Ignore cache parse errors
    }

    fetch(`/api/faculty/review-teams/${encodeURIComponent(assignment.id)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load teams")
        return res.json()
      })
      .then((data) => {
        const teamList = Array.isArray(data?.teams) ? data.teams : []
        setTeams(teamList)
        try {
          localStorage.setItem(
            TEAMS_CACHE_KEY,
            JSON.stringify({
              assignmentId: assignment.id,
              teams: teamList,
              fetchedAt: Date.now(),
            })
          )
        } catch {
          // Ignore storage errors
        }
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load teams")
        setLoading(false)
      })
  }, [assignment.id])

  // Sync pending local reviews to the server when online
  const syncPending = useCallback(async () => {
    if (!online || pendingReviews.length === 0) return
    setSyncing(true)
    const remaining: PendingReview[] = []
    for (const p of pendingReviews) {
      try {
        const res = await fetch(`/api/submissions/${p.submissionId}/review`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sprintSubmissionId: p.sprintSubmissionId,
            notes: p.notes,
          }),
        })
        if (!res.ok) {
          remaining.push(p)
        }
      } catch {
        remaining.push(p)
      }
    }
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(remaining))
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString())
      setPendingCount(remaining.length)
      fetchTeams()
    } catch {
      // Ignore storage errors
    } finally {
      setSyncing(false)
    }
  }, [online, pendingReviews, fetchTeams])

  // Load teams on mount / assignment change
  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) fetchTeams()
    })
    return () => {
      cancelled = true
    }
  }, [fetchTeams])

  // Online/offline listeners
  useEffect(() => {
    const onOnline = () => {
      setOnline(true)
      void syncPending()
    }
    const onOffline = () => setOnline(false)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [syncPending])

  // Load pending count on mount
  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]")
        setPendingCount(Array.isArray(pending) ? pending.length : 0)
      } catch {
        setPendingCount(0)
      }
    })
  }, [])

  const openReview = (teamId: string) => {
    setOpenTeamId(teamId)
    setReviewNotes("")
    setReviewingId(null)
  }

  const closeReview = () => {
    setOpenTeamId(null)
    setReviewingId(null)
    setReviewNotes("")
  }

  const handleMarkDone = async (e: React.FormEvent) => {
    e.preventDefault()
    const team = teams.find((t) => t.team.id === openTeamId)
    if (!team || !team.submission) return

    const sprints = team.submission.sprints
    const targetSprint =
      sprints.find((s) => !s.reviewedAt) || sprints[sprints.length - 1]
    if (!targetSprint) {
      setError("No sprint to review")
      return
    }

    setReviewingId(targetSprint.id)
    const payload = {
      sprintSubmissionId: targetSprint.id,
      notes: reviewNotes.trim(),
    }

    try {
      const res = await fetch(`/api/submissions/${team.submission.id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to mark done")
      }
      closeReview()
      fetchTeams()
      setReviewingId(null)
    } catch {
      const pending: PendingReview = {
        id: `pwa-${Date.now()}`,
        submissionId: team.submission.id,
        sprintSubmissionId: targetSprint.id,
        sprintNumber: targetSprint.sprintNumber,
        teamId: team.team.id,
        projectTitle: team.team.projectTitle,
        notes: reviewNotes.trim(),
        createdAt: new Date().toISOString(),
      }
      try {
        const existing = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]")
        const updated = Array.isArray(existing) ? [...existing, pending] : [pending]
        localStorage.setItem(PENDING_KEY, JSON.stringify(updated))
        setPendingCount(updated.length)
      } catch {
        // Ignore storage errors
      }
      closeReview()
      fetchTeams()
      setReviewingId(null)
      setError("Saved locally — will sync when back online")
    }
  }

  const reviewCardTeam = teams.find((t) => t.team.id === openTeamId)

  const isFullyReviewed = (t: TeamReview) =>
    t.sprintStatus.submitted > 0 && t.sprintStatus.reviewed === t.sprintStatus.submitted

  const isPartiallyReviewed = (t: TeamReview) =>
    t.sprintStatus.reviewed > 0 && t.sprintStatus.reviewed < t.sprintStatus.submitted

  const hasAnySubmission = (t: TeamReview) => t.sprintStatus.submitted > 0

  const handlePrint = () => {
    setPrintView(true)
    setTimeout(() => {
      window.print()
      setPrintView(false)
    }, 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] p-4">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 rounded bg-[var(--color-border)]" />
            <div className="h-64 w-full rounded-2xl bg-[var(--color-border)]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      {!online && (
        <div className="px-4 py-2 bg-[var(--color-caution-soft)] border-b border-[var(--color-caution)] text-[var(--color-caution-text)] text-xs font-medium text-center">
          Offline — reviews saved locally, will sync when back online
        </div>
      )}
      {pendingCount > 0 && online && (
        <div className="px-4 py-2 bg-[var(--color-accent-soft)] border-b border-[var(--color-accent)] text-[var(--color-accent)] text-xs font-medium text-center flex items-center justify-center gap-2">
          <SyncIcon className="size-3.5 animate-spin" />
          {pendingCount} review{pendingCount !== 1 ? "s" : ""} pending sync
        </div>
      )}

      <main className="px-4 py-3">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-[var(--color-ink)] tracking-tight">
                Sprint Review
              </h1>
              <p className="text-xs text-[var(--color-ink-muted)]">
                {assignment.subject} · {assignment.title}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={assignment.id}
                onChange={(e) => onAssignmentChange(e.target.value)}
                className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
              >
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
              <Button variant="outline" onClick={handlePrint} className="hidden sm:flex min-h-8 px-3">
                <PrintIcon className="size-4" /> Print list
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-3">
            <p className="text-xs text-[var(--color-ink-muted)]">Teams</p>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {teams.length}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-3">
            <p className="text-xs text-[var(--color-ink-muted)]">Reviewed</p>
            <p className="text-sm font-semibold text-[var(--color-success-text)]">
              {teams.filter(isFullyReviewed).length}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger-text)]">
            {error}
          </div>
        )}

        {!printView && (
          <div className="space-y-2">
            {teams.length === 0 ? (
              <div className="rounded-xl border border-[var(--color-border)] bg-white p-8 text-center">
                <UsersIcon className="mx-auto size-8 text-[var(--color-ink-faint)] mb-2" />
                <p className="text-sm text-[var(--color-ink-muted)]">
                  No teams yet. Students create teams on the Team page.
                </p>
              </div>
            ) : (
              teams.map((t) => {
                const fullyReviewed = isFullyReviewed(t)
                const partiallyReviewed = isPartiallyReviewed(t)
                const hasSub = hasAnySubmission(t)
                const members = t.team.members
                const lowest = t.lowestRollNo

                return (
                  <div
                    key={t.team.id}
                    className="rounded-xl border border-[var(--color-border)] bg-white p-3 hover:bg-[var(--color-canvas)]/50 transition-colors cursor-pointer"
                    onClick={() => openReview(t.team.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex shrink-0 size-9 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold text-sm">
                          {lowest.slice(-2)}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                            {t.team.projectTitle}
                          </p>
                          <p className="text-xs text-[var(--color-ink-muted)] flex items-center gap-1">
                            {members.map((m) => m.displayName || m.username).join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            fullyReviewed
                              ? "bg-[var(--color-success-soft)] text-[var(--color-success-text)]"
                              : partiallyReviewed
                                ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                                : hasSub
                                  ? "bg-[var(--color-caution-soft)] text-[var(--color-caution-text)]"
                                  : "bg-[var(--color-canvas)] text-[var(--color-ink-muted)]"
                          }`}
                        >
                          {fullyReviewed
                            ? "✓ Done"
                            : partiallyReviewed
                              ? "Partial"
                              : hasSub
                                ? "Submitted"
                                : "Pending"}
                        </span>
                        <ArrowRightIcon className="size-3.5 text-[var(--color-ink-faint)]" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs font-mono text-[var(--color-ink-faint)]">
                        {members.map((m) => m.rollNo).join(" · ")}
                      </p>
                      <span className="text-xs text-[var(--color-ink-muted)]">
                        {t.sprintStatus.reviewed}/{t.sprintStatus.total} sprints
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {printView && (
          <div className="pwa-print-view max-w-md mx-auto">
            <h1 className="text-lg font-bold text-[var(--color-ink)] mb-1">
              Sprint Review — {assignment.title}
            </h1>
            <p className="text-xs text-[var(--color-ink-muted)] mb-4">
              {formatDate(new Date().toISOString())} · Faculty review list
            </p>
            <table className="w-full text-left border-collapse mb-6">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-xs font-semibold text-[var(--color-ink-muted)] pb-2">
                    Roll No
                  </th>
                  <th className="text-xs font-semibold text-[var(--color-ink-muted)] pb-2">
                    Team Members
                  </th>
                  <th className="text-xs font-semibold text-[var(--color-ink-muted)] pb-2">
                    Project
                  </th>
                  <th className="text-xs font-semibold text-[var(--color-ink-muted)] pb-2 text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.team.id} className="border-b border-[var(--color-border)]/30">
                    <td className="py-2 text-xs font-mono text-[var(--color-ink)]">
                      {t.lowestRollNo}
                    </td>
                    <td className="py-2 text-xs text-[var(--color-ink)]">
                      {t.team.members.map((m) => m.displayName || m.username).join(", ")}
                    </td>
                    <td className="py-2 text-xs text-[var(--color-ink)] truncate max-w-[40%]">
                      {t.team.projectTitle}
                    </td>
                    <td className="py-2 text-xs text-right">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          isFullyReviewed(t)
                            ? "bg-[var(--color-success-soft)] text-[var(--color-success-text)]"
                            : isPartiallyReviewed(t)
                              ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                              : hasAnySubmission(t)
                                ? "bg-[var(--color-caution-soft)] text-[var(--color-caution-text)]"
                                : "bg-[var(--color-canvas)] text-[var(--color-ink-muted)]"
                        }`}
                      >
                        {isFullyReviewed(t)
                          ? "Done"
                          : isPartiallyReviewed(t)
                            ? "Partial"
                            : hasAnySubmission(t)
                              ? "Submitted"
                              : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setPrintView(false)}
              className="inline-flex min-h-9 items-center justify-center rounded-lg px-4 text-sm font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
            >
              Back to review
            </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-[var(--color-border)] bg-white/90 backdrop-blur-md">
        <div className="flex justify-around py-2.5">
          <Button variant="ghost" onClick={handlePrint} className="flex flex-col items-center gap-1 px-2">
            <PrintIcon className="size-4" />
            <span className="text-[10px]">Print</span>
          </Button>
          <Button
            variant={syncing ? "outline" : "ghost"}
            disabled={syncing || !online}
            onClick={syncPending}
            className="flex flex-col items-center gap-1 px-2"
          >
            <SyncIcon className={`size-4 ${syncing ? "animate-spin" : ""}`} />
            <span className="text-[10px]">Sync</span>
          </Button>
          <Button
            variant={pendingCount > 0 ? "primary" : "ghost"}
            onClick={syncPending}
            className="flex flex-col items-center gap-1 px-2"
          >
            <span className={`inline-flex items-center gap-1 ${pendingCount > 0 ? "animate-pulse" : ""}`}>
              {pendingCount > 0 ? (
                <div className="relative">
                  <CheckIcon className="size-3.5" />
                  <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[var(--color-danger)]" />
                </div>
              ) : (
                <CheckIcon className="size-3.5" />
              )}
            </span>
            <span className="text-[10px]">Done</span>
          </Button>
        </div>
      </nav>

      {openTeamId && reviewCardTeam && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-[var(--color-ink)]/20 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close review"
            onClick={closeReview}
            className="absolute inset-0 bg-transparent"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-card-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 id="review-card-title" className="text-lg font-semibold text-[var(--color-ink)]">
                  {reviewCardTeam.team.projectTitle}
                </h2>
                <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                  {reviewCardTeam.team.members.map((m) => m.displayName || m.username).join(", ")}
                </p>
                <p className="text-xs font-mono text-[var(--color-ink-faint)] mt-0.5">
                  {reviewCardTeam.team.members.map((m) => m.rollNo).join(" · ")}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                  isFullyReviewed(reviewCardTeam)
                    ? "bg-[var(--color-success-soft)] text-[var(--color-success-text)]"
                    : "bg-[var(--color-canvas)] text-[var(--color-ink-muted)] border border-[var(--color-border)]"
                }`}
              >
                {isFullyReviewed(reviewCardTeam)
                  ? "✓ All sprints reviewed"
                  : "Review in progress"}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              {reviewCardTeam.submission?.sprints.map((s) => {
                const reviewed = !!s.reviewedAt
                return (
                  <div
                    key={s.sprintNumber}
                    className={`rounded-lg border p-3 ${
                      reviewed
                        ? "border-[var(--color-success)] bg-[var(--color-success-soft)]/40"
                        : "border-[var(--color-border)] bg-[var(--color-canvas)]/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[var(--color-ink)]">
                        Sprint {s.sprintNumber}
                        {s.sprintNumber === 0 && " (Abstract)"}
                      </span>
                      <span
                        className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${
                          reviewed
                            ? "bg-[var(--color-success-soft)] text-[var(--color-success-text)]"
                            : "bg-[var(--color-caution-soft)] text-[var(--color-caution-text)]"
                        }`}
                      >
                        {reviewed ? "Reviewed" : "Pending"}
                      </span>
                    </div>
                    {s.documentationUrl && (
                      <p className="text-xs text-[var(--color-ink-muted)] truncate max-w-[60%]">
                        <span className="font-mono">{s.documentationUrl}</span>
                      </p>
                    )}
                    {s.summary && (
                      <div className="mt-1 text-xs text-[var(--color-ink-muted)]">
                        {s.summary.completed?.length > 0 && (
                          <p className="text-[var(--color-ink)]">
                            <span className="font-semibold">Done:</span>{" "}
                            {s.summary.completed.join(", ")}
                          </p>
                        )}
                        {s.summary.changed && (
                          <p className="text-[var(--color-ink-muted)]">
                            <span className="font-semibold">Changed:</span>{" "}
                            {s.summary.changed}
                          </p>
                        )}
                        {s.summary.blockers && (
                          <p className="text-[var(--color-caution-text)]">
                            <span className="font-semibold">Blockers:</span>{" "}
                            {s.summary.blockers}
                          </p>
                        )}
                      </div>
                    )}
                    {reviewed && (
                      <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
                        Reviewed {formatDate(s.reviewedAt ?? "")}
                        {s.reviewedBy ? ` by @${s.reviewedBy}` : ""}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <form onSubmit={handleMarkDone} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1.5">
                  Review notes (optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add guidance or feedback for the team…"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[var(--color-ink-muted)]">
                  Mark sprint as reviewed
                </span>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={reviewingId !== null}
                  loading={reviewingId !== null}
                  className="min-h-9 px-4 text-sm"
                >
                  Mark Done
                </Button>
              </div>
            </form>

            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={closeReview}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && !reviewCardTeam && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto">
          <div className="rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger-text)]">
            {error}
          </div>
        </div>
      )}
    </div>
  )
}
