"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import type { Assignment, SubmissionWithSprints } from "@/backend/types"
import FacultyPageHeader from "./FacultyPageHeader"

interface ReviewDraft {
  [sprintSubmissionId: string]: string
}

/** GitHub's own permalink for a commit — no API round trip needed. */
function commitUrl(repoUrl: string, sha: string): string {
  const base = repoUrl.trim().replace(/\.git\/?$/, "").replace(/\/+$/, "")
  return `${/^https?:\/\//i.test(base) ? base : `https://${base}`}/commit/${sha}`
}

export default function FacultyReview({
  assignmentParam,
}: {
  assignmentParam?: string
}) {
  const router = useRouter()
  const { user, isFaculty, loading: userLoading } = useSessionUser()
  const [submissions, setSubmissions] = useState<SubmissionWithSprints[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("active")
  const [filterAssignment, setFilterAssignment] = useState<string>(
    assignmentParam || "all"
  )
  const [drafts, setDrafts] = useState<ReviewDraft>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = async () => {
    try {
      const [subsRes, assignsRes] = await Promise.all([
        fetch("/api/submissions"),
        fetch("/api/assignments"),
      ])
      const subs = subsRes.ok ? await subsRes.json() : []
      const assigns = assignsRes.ok ? await assignsRes.json() : []
      setSubmissions(Array.isArray(subs) ? subs : [])
      setAssignments(Array.isArray(assigns) ? assigns : [])
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

  const filtered = submissions.filter((s) => {
    const matchesStatus = filterStatus === "all" || s.status === filterStatus
    const matchesAssignment =
      filterAssignment === "all" || s.assignmentId === filterAssignment
    return matchesStatus && matchesAssignment
  })

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
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
            <div className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              {stats.total}
            </div>
            <div className="flex items-center text-sm text-[var(--color-ink-muted)] mt-1">
              <span className="status-dot status-dot--review" />
              Total Submissions
            </div>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
            <div className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              {stats.pending}
            </div>
            <div className="flex items-center text-sm text-[var(--color-ink-muted)] mt-1">
              <span className="status-dot status-dot--active" />
              Awaiting Review
            </div>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
            <div className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              {stats.reviewed}
            </div>
            <div className="flex items-center text-sm text-[var(--color-ink-muted)] mt-1">
              <span className="status-dot status-dot--review" />
              Partially Reviewed
            </div>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
            <div className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              {stats.accepted}
            </div>
            <div className="flex items-center text-sm text-[var(--color-ink-muted)] mt-1">
              <span className="status-dot status-dot--done" />
              Accepted
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="accepted">Accepted</option>
          </select>
          <select
            value={filterAssignment}
            onChange={(e) => setFilterAssignment(e.target.value)}
            className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
          >
            <option value="all">All Assignments</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-ink-muted)]">
              No submissions found
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
      </div>
    </>
  )
}