"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import type { Assignment, SubmissionWithSprints } from "@/backend/types"
import ChecklistProgress from "@/frontend/components/ChecklistProgress"
import StatCard from "@/frontend/components/StatCard"
import StatusPill, { type StatusTone } from "@/frontend/components/StatusPill"
import FacultyPageHeader from "./FacultyPageHeader"

const statusMeta: Record<
  SubmissionWithSprints["status"],
  { label: string; tone: StatusTone }
> = {
  active: { label: "In progress", tone: "accent" },
  completed: { label: "Awaiting acceptance", tone: "caution" },
  accepted: { label: "Accepted", tone: "success" },
}

export default function FacultyDashboard() {
  const router = useRouter()
  const { user, isFaculty, loading: userLoading } = useSessionUser()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { submissions, loading: submissionsLoading } = useSubmissions()
  const [selectedAssignment, setSelectedAssignment] = useState<string>("all")
  const [roster, setRoster] = useState<
    { githubUsername?: string; rollNo: string }[]
  >([])

  useEffect(() => {
    if (!userLoading) {
      if (!user) router.push("/")
      else if (!isFaculty) router.push("/dashboard")
    }
  }, [user, isFaculty, userLoading, router])

  useEffect(() => {
    fetch("/api/roster")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.roster)) setRoster(data.roster)
      })
      .catch(() => {})
  }, [])

  const assignmentById = useMemo(() => {
    const map = new Map<string, Assignment>()
    assignments.forEach((a) => map.set(a.id, a))
    return map
  }, [assignments])

  const filteredSubmissions = useMemo(
    () =>
      selectedAssignment === "all"
        ? submissions
        : submissions.filter((s) => s.assignmentId === selectedAssignment),
    [submissions, selectedAssignment]
  )

  const stats = useMemo(() => {
    const active = filteredSubmissions.filter((s) => s.status === "active")
    const completed = filteredSubmissions.filter(
      (s) => s.status === "completed"
    )
    const accepted = filteredSubmissions.filter((s) => s.status === "accepted")
    const pendingReview = filteredSubmissions.filter(
      (s) =>
        s.status !== "accepted" &&
        s.sprints.some((sprint) => !sprint.reviewedAt)
    )
    return { active, completed, accepted, pendingReview }
  }, [filteredSubmissions])

  const rosterByUsername = useMemo(() => {
    const map = new Map<string, string>()
    roster.forEach((entry) => {
      if (entry.githubUsername) map.set(entry.githubUsername, entry.rollNo)
    })
    return map
  }, [roster])

  const loading = userLoading || assignmentsLoading || submissionsLoading

  if (loading) {
    return (
      <div className="max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-2xl bg-[var(--color-border)]" />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-[var(--color-border)]" />
            ))}
          </div>
          <div className="mt-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-[var(--color-border)]" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <FacultyPageHeader
        title="Faculty Dashboard"
        subtitle="Track submissions and pending reviews for the selected assignment"
        action={
          <Link
            href="/faculty/review"
            className="inline-flex min-h-10 items-center rounded-lg bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Open Review
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Active"
          value={stats.active.length}
          tone="accent"
          hint="Submissions in progress"
        />
        <StatCard
          label="Completed"
          value={stats.completed.length}
          tone="caution"
          hint="All sprints submitted"
        />
        <StatCard
          label="Accepted"
          value={stats.accepted.length}
          tone="success"
          hint="Reviewed and accepted"
        />
        <StatCard
          label="Pending review"
          value={stats.pendingReview.length}
          tone="neutral"
          hint="Have unreviewed sprints"
          to="/faculty/review"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
            Sprint submissions
          </h2>
          <label className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
            <span>Assignment</span>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="min-h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:outline-none"
            >
              <option value="all">All assignments</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filteredSubmissions.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">
            No submissions yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem]">
              <thead>
                <tr className="bg-[var(--color-canvas)] text-left text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
                  <th scope="col" className="px-5 py-3">
                    Student
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Sprints
                  </th>
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
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredSubmissions.map((submission) => {
                  const assignment = assignmentById.get(submission.assignmentId)
                  const rollNo = rosterByUsername.get(submission.studentUsername)
                  const sprintCount = assignment?.sprintCount || 4
                  const status = statusMeta[submission.status]
                  const hasPivot = submission.sprints.some((s) => s.isPivot)

                  return (
                    <tr
                      key={submission.id}
                      className="transition-colors hover:bg-[var(--color-canvas)]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-canvas)] text-sm font-medium text-[var(--color-ink-muted)] ring-1 ring-[var(--color-border)]"
                          >
                            {(rollNo || submission.studentUsername)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-[var(--color-ink)]">
                              {rollNo || `@${submission.studentUsername}`}
                            </div>
                            <div className="truncate text-sm text-[var(--color-ink-muted)]">
                              {assignment?.title || submission.assignmentId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-[var(--color-ink-muted)]">
                          <span className="font-medium text-[var(--color-ink)]">
                            {submission.sprints.length}
                          </span>
                          /{sprintCount} submitted
                        </div>
                        {hasPivot ? (
                          <StatusPill tone="caution" className="mt-1.5">
                            Pivoted
                          </StatusPill>
                        ) : null}
                      </td>
                      <td className="w-40 px-5 py-4">
                        <ChecklistProgress
                          current={submission.sprints.length}
                          total={sprintCount}
                          compact
                        />
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/faculty/assignments/${submission.assignmentId}`}
                          className="inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-soft)]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
