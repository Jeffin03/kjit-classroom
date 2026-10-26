"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import type { Assignment, RosterEntry, SubmissionWithSprints } from "@/backend/types"
import KpiCard from "@/frontend/components/KpiCard"
import ConfirmModal from "@/frontend/components/ConfirmModal"
import FacultyPageHeader from "./FacultyPageHeader"

interface ReviewDraft {
  [sprintSubmissionId: string]: string
}

/** GitHub's own permalink for a commit — no API round trip needed. */
function commitUrl(repoUrl: string, sha: string): string {
  const base = repoUrl.trim().replace(/\.git\/?$/, "").replace(/\/+$/, "")
  return `${/^https?:\/\//i.test(base) ? base : `https://${base}`}/commit/${sha}`
}

/** Values the status <select> understands, so a `?status=` link can't inject junk. */
const STATUS_FILTERS = ["all", "active", "completed", "accepted"]

export default function FacultyReview({
  assignmentParam,
  classParam,
  statusParam,
}: {
  assignmentParam?: string
  classParam?: string
  statusParam?: string
}) {
  const router = useRouter()
  const { user, isFaculty, loading: userLoading } = useSessionUser()
  const [submissions, setSubmissions] = useState<SubmissionWithSprints[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterClass, setFilterClass] = useState<string>(classParam || "all")
  const [filterStatus, setFilterStatus] = useState<string>(
    statusParam && STATUS_FILTERS.includes(statusParam) ? statusParam : "active"
  )
  const [filterAssignment, setFilterAssignment] = useState<string>(
    assignmentParam || "all"
  )
  const [drafts, setDrafts] = useState<ReviewDraft>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [acceptAllOpen, setAcceptAllOpen] = useState(false)
  const [acceptingAll, setAcceptingAll] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = async () => {
    try {
      const [subsRes, assignsRes, rosterRes] = await Promise.all([
        fetch("/api/submissions"),
        fetch("/api/assignments"),
        fetch("/api/roster"),
      ])
      const subs = subsRes.ok ? await subsRes.json() : []
      const assigns = assignsRes.ok ? await assignsRes.json() : []
      const rosterData = rosterRes.ok ? await rosterRes.json() : {}
      setSubmissions(Array.isArray(subs) ? subs : [])
      setAssignments(Array.isArray(assigns) ? assigns : [])
      setRoster(Array.isArray(rosterData?.roster) ? rosterData.roster : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!userLoading) {
      if (!user) router.push("/")
      else if (!isFaculty) router.push("/dashboard")
    }
  }, [user, isFaculty, userLoading, router])

  /**
   * `submissions` always holds every submission the server will show this
   * caller (class-scoped), and `filtered` narrows it by the filters below —
   * so switching filters never needs a refetch and cannot go stale.
   */

  const getAssignment = (id: string) => assignments.find((a) => a.id === id)

  /** student login → class team, from the class-scoped roster. */
  const classByStudent = useMemo(() => {
    const map = new Map<string, string>()
    roster.forEach((entry) => {
      if (entry.githubUsername) {
        map.set(entry.githubUsername.toLowerCase(), entry.classTeam)
      }
    })
    return map
  }, [roster])

  const classOf = (s: SubmissionWithSprints): string | null => {
    const fromRoster = classByStudent.get(s.studentUsername.toLowerCase())
    if (fromRoster) return fromRoster
    // Not rostered: fall back to the assignment only when it names one class.
    const teams = getAssignment(s.assignmentId)?.assignedTeams || []
    return teams.length === 1 ? teams[0] : null
  }

  const classNames = useMemo(() => {
    const set = new Set<string>()
    roster.forEach((entry) => set.add(entry.classTeam))
    assignments.forEach((a) => a.assignedTeams.forEach((team) => set.add(team)))
    return [...set].sort()
  }, [roster, assignments])

  /** A `?class=` deep link can name a class with no roster or assignment rows. */
  const classOptions =
    filterClass !== "all" && !classNames.includes(filterClass)
      ? [...classNames, filterClass].sort()
      : classNames

  /** Cascading: class narrows the assignment picker, then status. */
  const classAssignments =
    filterClass === "all"
      ? assignments
      : assignments.filter((a) => a.assignedTeams.includes(filterClass))

  const filtered = submissions.filter((s) => {
    const matchesStatus = filterStatus === "all" || s.status === filterStatus
    const matchesAssignment =
      filterAssignment === "all" || s.assignmentId === filterAssignment
    const matchesClass = filterClass === "all" || classOf(s) === filterClass
    return matchesStatus && matchesAssignment && matchesClass
  })

  const handleClassChange = (value: string) => {
    setFilterClass(value)
    setFilterAssignment((current) => {
      if (current === "all") return current
      const assignment = getAssignment(current)
      if (!assignment) return "all"
      return value === "all" || assignment.assignedTeams.includes(value)
        ? current
        : "all"
    })
  }

  const resetFilters = () => {
    setFilterClass("all")
    setFilterStatus("all")
    setFilterAssignment("all")
  }

  /** Plain-language description of the current filter stack, for the modal. */
  const filterScope = [
    filterClass !== "all" ? filterClass : null,
    filterAssignment !== "all" ? getAssignment(filterAssignment)?.title : null,
    filterStatus !== "all" ? filterStatus : null,
  ]
    .filter(Boolean)
    .join(" · ")

  const handleReview = async (submissionId: string) => {
    setSavingId(submissionId)
    setActionError(null)
    try {
      for (const sprint of submissions.find((s) => s.id === submissionId)
        ?.sprints || []) {
        const notes = drafts[sprint.id]
        if (notes !== undefined && notes.trim() !== "") {
          const res = await fetch(`/api/submissions/${submissionId}/review`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sprintSubmissionId: sprint.id, notes }),
          })
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error || "Failed to save review notes")
          }
        }
      }
      await load()
    } catch (err) {
      // Keep the drafts in place so the reviewer can retry.
      setActionError(
        err instanceof Error ? err.message : "Failed to save review notes"
      )
    } finally {
      setSavingId(null)
    }
  }

  const handleAccept = async (submissionId: string) => {
    setSavingId(submissionId)
    setActionError(null)
    try {
      const res = await fetch(`/api/submissions/${submissionId}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept: true }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to accept submission")
      }
      await load()
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to accept submission"
      )
    } finally {
      setSavingId(null)
    }
  }

  /** Everything currently on screen that is not signed off yet. */
  const acceptAllTargets = filtered.filter((s) => s.status !== "accepted")

  const handleAcceptAll = async () => {
    setAcceptingAll(true)
    setActionError(null)
    let failed: string | null = null
    for (const submission of acceptAllTargets) {
      try {
        const res = await fetch(`/api/submissions/${submission.id}/review`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accept: true }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(
            data.error || `Failed to accept @${submission.studentUsername}`
          )
        }
      } catch (err) {
        failed =
          err instanceof Error
            ? err.message
            : `Failed to accept @${submission.studentUsername}`
        break
      }
    }
    setAcceptAllOpen(false)
    if (failed) setActionError(`${failed}. Remaining submissions were kept.`)
    await load()
    setAcceptingAll(false)
  }

  const stats = {
    total: submissions.length,
    reviewed: submissions.filter((s) =>
      s.sprints.some((sp) => sp.reviewedAt)
    ).length,
    pending: submissions.filter((s) =>
      s.sprints.some((sp) => !sp.reviewedAt) && s.status !== "accepted"
    ).length,
    accepted: submissions.filter((s) => s.status === "accepted").length,
  }

  if (loading || userLoading) {
    return (
      <div className="max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-6xl">
        {actionError && (
          <div className="mb-6 rounded-md border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
            {actionError}
          </div>
        )}

        <FacultyPageHeader
          title="Sprint Review"
          subtitle="Review sprint work and accept submissions"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Total submissions"
            value={stats.total}
            hint="in your classes"
            onClick={resetFilters}
          />
          <KpiCard
            label="Awaiting review"
            value={stats.pending}
            hint="have unreviewed sprints"
            tone="caution"
          />
          <KpiCard
            label="Partially reviewed"
            value={stats.reviewed}
            hint="some sprints reviewed"
            tone="accent"
          />
          <KpiCard
            label="Accepted"
            value={stats.accepted}
            hint="signed off"
            tone="success"
            onClick={() => setFilterStatus("accepted")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <select
            value={filterClass}
            onChange={(e) => handleClassChange(e.target.value)}
            aria-label="Filter by class"
            className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
          >
            <option value="all">All Classes</option>
            {classOptions.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
          <select
            value={filterAssignment}
            onChange={(e) => setFilterAssignment(e.target.value)}
            aria-label="Filter by assignment"
            className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
          >
            <option value="all">All Assignments</option>
            {classAssignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
            className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="accepted">Accepted</option>
          </select>

          <button
            type="button"
            onClick={() => setAcceptAllOpen(true)}
            disabled={acceptAllTargets.length === 0 || savingId !== null}
            className="ml-auto px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Accept all ({acceptAllTargets.length})
          </button>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-ink-muted)]">
              {submissions.length === 0
                ? "No submissions yet. Students show up here as soon as they submit Sprint 0."
                : "No submissions match these filters. Try clearing the class, assignment, or status filter."}
            </div>
          ) : (
            filtered.map((submission) => {
              const assignment = getAssignment(submission.assignmentId)
              const isSaving = savingId === submission.id
              const statusConfig = {
                active: { dot: "status-dot--active", label: "In Progress" },
                completed: { dot: "status-dot--review", label: "Awaiting Acceptance" },
                accepted: { dot: "status-dot--done", label: "Accepted" },
              }[submission.status]

              return (
                <div
                  key={submission.id}
                  className="rounded-lg border border-[var(--color-border)] bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-[var(--color-border)] rounded-full flex items-center justify-center text-[var(--color-ink-muted)] font-medium">
                        {submission.studentUsername[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--color-ink)]">
                          @{submission.studentUsername}
                        </div>
                        <div className="text-sm text-[var(--color-ink-muted)]">
                          {assignment?.title || submission.assignmentId}
                          {(assignment?.assignedTeams || []).length > 0 && (
                            <span className="ml-2 text-xs rounded-md bg-[var(--color-accent-soft)] text-[var(--color-accent)] px-2 py-0.5">
                              {assignment?.assignedTeams.join(", ")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-ink-faint)]">
                          <a
                            href={submission.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-accent)] font-medium hover:underline"
                          >
                            View Repo
                          </a>
                          {submission.abstractDocUrl && (
                            <a
                              href={submission.abstractDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--color-accent)] font-medium hover:underline"
                            >
                              Abstract
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center text-[13px] font-medium text-[var(--color-ink-muted)]">
                        <span className={`status-dot ${statusConfig.dot}`} />
                        {statusConfig.label}
                      </span>
                      {submission.sprints.some((s) => s.isPivot) && (
                        <span className="inline-flex items-center text-xs font-medium text-[var(--color-caution)]">
                          <span className="status-dot status-dot--pivot" />
                          Pivoted
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {Array.from({ length: assignment?.sprintCount || 4 }).map(
                      (_, idx) => {
                        const sprint = submission.sprints.find(
                          (s) => s.sprintNumber === idx
                        )
                        if (!sprint) {
                          return (
                            <div
                              key={idx}
                              className="text-sm text-[var(--color-ink-faint)] flex items-center gap-2"
                            >
                              <span className="w-20 text-[var(--color-ink-muted)]">
                                Sprint {idx}
                              </span>
                              Not submitted
                            </div>
                          )
                        }

                        const diff = sprint.diffMetrics
                        const reviewed =
                          typeof sprint.reviewedAt === "string" &&
                          sprint.reviewedAt.length > 0

                        return (
                          <div
                            key={idx}
                            className={`border rounded-lg p-3 ${reviewed ? "border-[var(--color-success)] bg-[var(--color-success-soft)]/50" : "border-[var(--color-border)]"}`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="text-sm font-medium text-[var(--color-ink)]">
                                Sprint {idx}
                                {sprint.isPivot && (
                                  <span className="ml-2 text-xs font-medium text-[var(--color-caution)]">
                                    <span className="status-dot status-dot--pivot" />
                                    Pivot
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {sprint.commitSha ? (
                                  <a
                                    href={commitUrl(
                                      submission.repoUrl,
                                      sprint.commitSha
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[var(--color-accent)] hover:underline font-mono"
                                    style={{ fontFamily: "var(--font-mono)" }}
                                  >
                                    {sprint.commitSha.slice(0, 7)}
                                  </a>
                                ) : (
                                  <span className="text-xs text-[var(--color-ink-faint)]">
                                    No commit captured
                                  </span>
                                )}
                                {diff ? (
                                  <span className="text-xs text-[var(--color-ink-muted)]">
                                    +{diff.additions} -{diff.deletions} ·{" "}
                                    {diff.filesChanged} files ·{" "}
                                    {diff.totalCommits} commits
                                  </span>
                                ) : (
                                  <span className="text-xs text-[var(--color-ink-faint)]">
                                    No diff recorded
                                  </span>
                                )}
                                {reviewed && (
                                  <span className="inline-flex items-center text-xs font-medium text-[var(--color-success)]">
                                    <span className="status-dot status-dot--done" />
                                    Reviewed
                                  </span>
                                )}
                              </div>
                            </div>
                            <input
                              type="text"
                              placeholder={
                                reviewed
                                  ? sprint.reviewNotes || "Review notes saved"
                                  : "Add review notes…"
                              }
                              defaultValue={sprint.reviewNotes || ""}
                              value={drafts[sprint.id] ?? sprint.reviewNotes ?? ""}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [sprint.id]: e.target.value,
                                }))
                              }
                              className="w-full border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
                            />
                          </div>
                        )
                      }
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-3 justify-end">
                    {submission.status !== "accepted" && (
                      <>
                        <button
                          onClick={() => handleReview(submission.id)}
                          disabled={isSaving}
                          className="px-4 py-1.5 rounded-md text-sm font-medium text-[var(--color-accent)] bg-[var(--color-accent-soft)] hover:bg-[#DDD6FE]/60 transition-colors disabled:opacity-50"
                        >
                          {isSaving ? "Saving…" : "Save Notes"}
                        </button>
                        <button
                          onClick={() => handleAccept(submission.id)}
                          disabled={isSaving}
                          className="px-4 py-1.5 rounded-md text-sm font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
                        >
                          {isSaving ? "Saving…" : "Accept"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <ConfirmModal
          open={acceptAllOpen}
          title={`Accept all ${acceptAllTargets.length} submissions?`}
          body={`This signs off every submission currently shown${
            filterScope ? ` (${filterScope})` : ""
          }, marks their unreviewed sprints as reviewed, and removes them from the review queue.`}
          confirmLabel="Accept all"
          busy={acceptingAll}
          onConfirm={handleAcceptAll}
          onCancel={() => {
            if (!acceptingAll) setAcceptAllOpen(false)
          }}
        />
      </div>
    </>
  )
}