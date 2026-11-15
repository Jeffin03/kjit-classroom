"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import type {
  AssignmentWithStats,
  SprintSubmission,
  SubmissionWithSprints,
} from "@/backend/types"
import Breadcrumbs from "@/frontend/components/Breadcrumbs"
import KpiCard from "@/frontend/components/KpiCard"
import StudentCard, { type StudentCardRow } from "@/frontend/components/StudentCard"
import SprintPill, { type SprintState } from "@/frontend/components/SprintPill"
import StatusPill from "@/frontend/components/StatusPill"
import ChecklistProgress from "@/frontend/components/ChecklistProgress"
import type { BadgeStatus } from "@/frontend/components/Badge"
import FacultyPageHeader from "./FacultyPageHeader"

interface RosterEntry {
  githubUsername?: string
  rollNo: string
  collegeEmail: string
  classTeam: string
  displayName?: string
}

interface StudentRow {
  studentUsername: string
  rollNo: string
  displayName?: string
  collegeEmail: string
  latestCommit?: string
  submission?: SubmissionWithSprints
}

const submissionStatusMeta = {
  active: { label: "In progress", tone: "accent" },
  completed: { label: "Awaiting acceptance", tone: "caution" },
  accepted: { label: "Accepted", tone: "success" },
} as const

function sprintState(sprint: SprintSubmission | undefined): SprintState {
  if (!sprint) return "pending"
  if (sprint.isPivot) return "pivot"
  return sprint.reviewedAt ? "reviewed" : "submitted"
}

function badgeStatus(submission?: SubmissionWithSprints): BadgeStatus {
  if (!submission) return "not-started"
  if (submission.status === "accepted") return "accepted"
  if (submission.status === "completed") return "awaiting"
  return "in-progress"
}

export default function FacultyAssignmentDetail({
  assignmentId,
}: {
  assignmentId: string
}) {
  const router = useRouter()
  const { user, isFaculty, capabilities, loading: userLoading } = useSessionUser()
  const canManage = capabilities.includes("assignment.create")
  const [assignment, setAssignment] = useState<AssignmentWithStats | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionWithSprints[]>([])
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [view, setView] = useState<"grid" | "table">("grid")
  const [reviewingStudent, setReviewingStudent] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const load = async () => {
    try {
      const [detailRes, subsRes, rosterRes] = await Promise.all([
        fetch(`/api/assignments/${assignmentId}`),
        fetch(`/api/submissions?assignmentId=${assignmentId}`),
        fetch("/api/roster"),
      ])

      const detail = detailRes.ok ? await detailRes.json() : null
      setLoadError(
        detailRes.ok
          ? null
          : detailRes.status === 404
            ? "Assignment not found."
            : detailRes.status === 403
              ? "This assignment is outside your classes."
              : "Couldn't load this assignment. Refresh the page to try again."
      )
      const subs = subsRes.ok ? await subsRes.json() : []
      const rosterData = rosterRes.ok ? await rosterRes.json() : { roster: [] }

      setAssignment(detail)
      setSubmissions(Array.isArray(subs) ? subs : [])
      setRoster(Array.isArray(rosterData.roster) ? rosterData.roster : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId])

  useEffect(() => {
    if (!userLoading) {
      if (!user) router.push("/")
      else if (!isFaculty) router.push("/dashboard")
    }
  }, [user, isFaculty, userLoading, router])

  const handleAccept = async (submissionId: string) => {
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
    }
  }

  const handleMarkDone = async (submissionId: string, sprintSubmissionId: string) => {
    setReviewingId(sprintSubmissionId)
    setActionError(null)
    try {
      const res = await fetch(`/api/submissions/${submissionId}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintSubmissionId, notes: reviewNotes.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to mark done")
      }
      setReviewingStudent(null)
      setReviewNotes("")
      setReviewingId(null)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to mark done")
      setReviewingId(null)
    }
  }

  const handleDelete = async () => {
    if (!assignment) return
    if (!window.confirm(`Delete "${assignment.title}"? This cannot be undone.`)) {
      return
    }

    setActionError(null)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Couldn't delete the assignment")
      }
      router.push("/faculty")
      router.refresh()
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Couldn't delete the assignment"
      )
    }
  }

  const assignedRoster = useMemo(
    () =>
      assignment
        ? roster.filter((r) => assignment.assignedTeams.includes(r.classTeam))
        : [],
    [assignment, roster]
  )

  const rows = useMemo<StudentRow[]>(() => {
    if (!assignment) return []

    const submissionByUsername = new Map<string, SubmissionWithSprints>()
    submissions.forEach((s) => submissionByUsername.set(s.studentUsername, s))

    const commitByUsername = new Map<string, string>()
    assignment.submissions?.forEach((row) => {
      if (row.latestCommit) commitByUsername.set(row.studentUsername, row.latestCommit)
    })

    const fromRoster = assignedRoster.map<StudentRow>((entry) => ({
      studentUsername: entry.githubUsername ?? "",
      rollNo: entry.rollNo,
      displayName: entry.displayName,
      collegeEmail: entry.collegeEmail,
      latestCommit: entry.githubUsername
        ? commitByUsername.get(entry.githubUsername)
        : undefined,
      submission: entry.githubUsername
        ? submissionByUsername.get(entry.githubUsername)
        : undefined,
    }))

    const seen = new Set(fromRoster.map((row) => row.studentUsername))
    const extras = submissions
      .filter((s) => !seen.has(s.studentUsername))
      .map<StudentRow>((s) => {
        const entry = roster.find((r) => r.githubUsername?.toLowerCase() === s.studentUsername.toLowerCase())
        return {
          studentUsername: s.studentUsername,
          rollNo: entry?.rollNo || `@${s.studentUsername}`,
          displayName: entry?.displayName,
          collegeEmail: entry?.collegeEmail || "—",
          latestCommit: commitByUsername.get(s.studentUsername),
          submission: s,
        }
      })

    const all = [...fromRoster, ...extras]
    if (all.length > 0) return all

    return submissions.map<StudentRow>((s) => ({
      studentUsername: s.studentUsername,
      rollNo: `@${s.studentUsername}`,
      collegeEmail: "—",
      latestCommit: commitByUsername.get(s.studentUsername),
      submission: s,
    }))
  }, [assignment, assignedRoster, roster, submissions])

  const stats = useMemo(() => {
    const withSubmission = rows.filter((row) => row.submission)
    const accepted = withSubmission.filter(
      (row) => row.submission?.status === "accepted"
    ).length
    const inFlight = withSubmission.filter(
      (row) =>
        row.submission?.status === "active" ||
        row.submission?.status === "completed"
    ).length
    return {
      total: rows.length,
      accepted,
      inFlight,
      noSubmission: rows.length - withSubmission.length,
    }
  }, [rows])

  const cardRows = useMemo<StudentCardRow[]>(() => {
    if (!assignment) return []
    return rows.map((row) => ({
      key: row.studentUsername || row.rollNo,
      rollNo: row.rollNo,
      studentUsername: row.studentUsername,
      displayName: row.displayName,
      collegeEmail: row.collegeEmail,
      latestCommit: row.latestCommit,
      status: badgeStatus(row.submission),
      sprintStates: Array.from({ length: assignment.sprintCount }, (_, index) =>
        sprintState(
          row.submission?.sprints.find(
            (sprint) => sprint.sprintNumber === index
          )
        )
      ),
      sprintCount: assignment.sprintCount,
      pivoted: row.submission?.sprints.some((sprint) => sprint.isPivot) ?? false,
      accepted: row.submission?.status === "accepted",
    }))
  }, [assignment, rows])

  const visibleCards = cardRows.filter((row) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      row.rollNo.toLowerCase().includes(query) ||
      (row.displayName ?? "").toLowerCase().includes(query) ||
      row.studentUsername.toLowerCase().includes(query) ||
      row.collegeEmail.toLowerCase().includes(query)
    const matchesStatus = statusFilter === "all" || row.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading || userLoading) {
    return (
      <div className="max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-64 rounded bg-border" />
          <div className="h-8 w-72 rounded bg-border" />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-border" />
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-border" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="max-w-6xl">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/faculty" }]} />
        <p className="mt-6 text-sm text-ink-muted">
          {loadError ?? "Assignment not found."}
        </p>
      </div>
    )
  }

  const sprintNumbers = Array.from(
    { length: assignment.sprintCount },
    (_, index) => index
  )
  const homeTeam = assignment.assignedTeams[0]

  return (
    <div className="max-w-6xl">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/faculty" },
          ...(homeTeam
            ? [
                {
                  label: homeTeam,
                  href: `/faculty/class/${encodeURIComponent(homeTeam)}`,
                },
              ]
            : []),
          { label: assignment.title },
        ]}
      />

      <div className="mt-4">
        <FacultyPageHeader
          title={assignment.title}
          subtitle={assignment.description}
          action={
            <>
              {canManage && (
                <>
                  <Link
                    href={`/faculty/assignments/new?edit=${assignmentId}`}
                    className="inline-flex min-h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex min-h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
                  >
                    Delete
                  </button>
                </>
              )}
              <Link
                href="/faculty"
                className="inline-flex min-h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
              >
                Classes
              </Link>

            </>
          }
        />
      </div>

      {actionError && (
        <div className="mb-6 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger-text">
          {actionError}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
        <StatusPill tone="accent">{assignment.subject}</StatusPill>
        <StatusPill>{assignment.assignedTeams.join(", ")}</StatusPill>
        <span>Due {new Date(assignment.deadline).toLocaleDateString()}</span>
        <span aria-hidden>·</span>
        <span>{assignment.sprintCount} sprints</span>
        {assignment.allowLateSubmissions && (
          <>
            <span aria-hidden>·</span>
            <span>Late submissions allowed</span>
          </>
        )}
        <span aria-hidden>·</span>
        <span>
          Created by{" "}
          <span className="font-mono text-[13px]">@{assignment.createdBy}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Students"
          value={stats.total}
          hint="on this assignment"
          onClick={() => {
            setStatusFilter("all")
            setSearch("")
          }}
        />
        <KpiCard
          label="In progress"
          value={stats.inFlight}
          tone="accent"
          hint="active or awaiting"
        />
        <KpiCard
          label="Accepted"
          value={stats.accepted}
          tone="success"
          hint="signed off"
          onClick={() => setStatusFilter("accepted")}
        />
        <KpiCard
          label="Not started"
          value={stats.noSubmission}
          tone={stats.noSubmission ? "caution" : "neutral"}
          hint="nothing submitted"
          onClick={() => setStatusFilter("not-started")}
        />
      </div>

      {/* Inline review cards for teams needing review */}
      {reviewingStudent && assignment && (
        <div className="mb-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">Review — {assignment.title}</h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                Mark sprints as reviewed with optional notes
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReviewingStudent(null)}
              className="inline-flex min-h-9 items-center rounded-lg border border-border bg-surface px-4 text-sm text-ink-muted hover:bg-canvas hover:text-ink"
            >
              Close
            </button>
          </div>

          {submissions.map((sub) => {
            if (sub.studentUsername.toLowerCase() !== reviewingStudent.toLowerCase()) return null
            const sprints = sub.sprints || []
            const unreviewed = sprints.filter((s) => !s.reviewedAt)
            const currentSprint = unreviewed[0] || sprints[sprints.length - 1]

            if (!currentSprint) return null

            return (
              <div
                key={`review-${sub.id}-${currentSprint.sprintNumber}`}
                className="rounded-xl border border-[var(--color-border)] bg-white p-5 mb-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-ink truncate">
                      {sub.abstractDocUrl ? "Project" : "Sprint 0"}
                    </h3>
                    <p className="mt-0.5 text-xs text-ink-muted flex items-center gap-1">
                      {sub.studentUsername}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    Sprint {currentSprint.sprintNumber}
                  </span>
                </div>

                {currentSprint.documentationUrl && (
                  <p className="text-xs text-[var(--color-ink-muted)] truncate max-w-[60%] mb-3">
                    <span className="font-mono">{currentSprint.documentationUrl}</span>
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  {currentSprint.summary && (
                    <div className="text-xs text-[var(--color-ink-muted)]">
                      {currentSprint.summary.completed?.length > 0 && (
                        <p className="text-[var(--color-ink)]">
                          <span className="font-semibold">Done:</span>{" "}
                          {currentSprint.summary.completed.join(", ")}
                        </p>
                      )}
                      {currentSprint.summary.changed && (
                        <p className="text-[var(--color-ink-muted)]">
                          <span className="font-semibold">Changed:</span>{" "}
                          {currentSprint.summary.changed}
                        </p>
                      )}
                      {currentSprint.summary.blockers && (
                        <p className="text-[var(--color-caution-text)]">
                          <span className="font-semibold">Blockers:</span>{" "}
                          {currentSprint.summary.blockers}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault()
                  handleMarkDone(sub.id, currentSprint.id)
                }} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1.5">
                      Review notes (optional)
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add guidance or feedback for the student…"
                      rows={3}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-[var(--color-ink-muted)]">
                      Mark sprint {currentSprint.sprintNumber} as reviewed
                    </span>
                    <button
                      type="submit"
                      disabled={reviewingId === currentSprint.id}
                      className="inline-flex min-h-9 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors disabled:opacity-60"
                    >
                      {reviewingId === currentSprint.id ? "Saving…" : "Mark Done"}
                    </button>
                  </div>
                </form>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student…"
            aria-label="Search students"
            className="h-10 w-full max-w-xs rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          >
            <option value="all">All statuses</option>
            <option value="not-started">Not started</option>
            <option value="in-progress">In progress</option>
            <option value="awaiting">Awaiting acceptance</option>
            <option value="accepted">Accepted</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-subtle">View</span>
          <div className="flex rounded-lg border border-border bg-surface p-0.5">
            {(["grid", "table"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                aria-pressed={view === mode}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  view === mode
                    ? "bg-accent-soft text-accent"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "grid" ? (
        visibleCards.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-border bg-surface px-5 py-10 text-center text-sm text-ink-muted">
            {rows.length === 0
              ? `No students are rostered for ${assignment.assignedTeams.join(", ")} yet. Onboard students to see their submissions here.`
              : "No students match this filter"}
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleCards.map((row) => (
              <StudentCard
                key={row.key}
                row={row}
                actions={
                  <>
                    <button
                      type="button"
                      onClick={() => setReviewingStudent(row.studentUsername)}
                      className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium text-accent transition-colors hover:bg-accent-soft"
                    >
                      Review
                    </button>
                    {row.status !== "accepted" &&
                      submissions.find(
                        (s) =>
                          s.studentUsername.toLowerCase() === row.studentUsername.toLowerCase()
                      ) && (
                        <button
                          type="button"
                          onClick={() =>
                            handleAccept(
                              submissions.find(
                                (s) =>
                                  s.studentUsername.toLowerCase() === row.studentUsername.toLowerCase()
                              )!.id
                            )
                          }
                          className="inline-flex min-h-9 items-center rounded-lg bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                        >
                          Accept
                        </button>
                      )}
                  </>
                }
              />
            ))}
          </div>
        )
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[60rem]">
            <thead>
              <tr className="bg-canvas text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                <th scope="col" className="px-5 py-3">
                  Student
                </th>
                {sprintNumbers.map((sprintNumber) => (
                  <th
                    key={sprintNumber}
                    scope="col"
                    className="whitespace-nowrap px-3 py-3"
                  >
                    Sprint {sprintNumber}
                  </th>
                ))}
                <th scope="col" className="px-5 py-3">
                  Progress
                </th>
                <th scope="col" className="px-5 py-3">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const submission = row.submission
                const status = submission
                  ? submissionStatusMeta[submission.status]
                  : null

                return (
                  <tr
                    key={row.studentUsername || row.rollNo}
                    className="transition-colors hover:bg-canvas"
                  >
                    <td className="px-5 py-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {row.rollNo}
                        </div>
                        <div className="truncate text-sm text-ink-muted">
                          {row.studentUsername ? (
                            <span className="font-mono text-[13px] flex items-center gap-1">
                              @{row.studentUsername}
                              {row.displayName && (
                                <span className="text-[12px]">
                                  ({row.displayName})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span>No GitHub account</span>
                          )}
                        </div>
                        <div className="truncate text-xs text-ink-muted">
                          {row.collegeEmail}
                        </div>
                      </div>
                    </td>

                    {sprintNumbers.map((sprintNumber) => (
                      <td key={sprintNumber} className="px-3 py-4">
                        <SprintPill
                          number={sprintNumber}
                          state={sprintState(
                            submission?.sprints.find(
                              (sprint) => sprint.sprintNumber === sprintNumber
                            )
                          )}
                        />
                      </td>
                    ))}

                    <td className="w-40 px-5 py-4">
                      <ChecklistProgress
                        current={submission?.sprints.length ?? 0}
                        total={assignment.sprintCount}
                        compact
                      />
                      {row.latestCommit ? (
                        <span className="mt-1.5 block font-mono text-xs text-ink-muted">
                          {row.latestCommit.slice(0, 7)}
                        </span>
                      ) : null}
                    </td>

                    <td className="px-5 py-4">
                      {status ? (
                        <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      ) : (
                        <StatusPill>Not started</StatusPill>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {submission ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setReviewingStudent(submission.studentUsername)}
                              className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-accent transition-colors hover:bg-accent-soft"
                            >
                              Review
                            </button>
                            {submission.status === "accepted" ? null : (
                              <button
                                type="button"
                                onClick={() => handleAccept(submission.id)}
                                className="inline-flex min-h-10 items-center rounded-lg bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                              >
                                Accept
                              </button>
                            )}
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
