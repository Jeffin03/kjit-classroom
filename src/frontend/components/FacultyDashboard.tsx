"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import type { Assignment, SubmissionWithSprints } from "@/backend/types"
import FacultyTabBar from "./FacultyTabBar"

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

  const getAssignment = (id: string) =>
    assignments.find((a) => a.id === id)

  const filteredSubmissions: SubmissionWithSprints[] =
    selectedAssignment === "all"
      ? submissions
      : submissions.filter((s) => s.assignmentId === selectedAssignment)

  const stats = {
    total: submissions.length,
    active: submissions.filter((s) => s.status === "active").length,
    completed: submissions.filter((s) => s.status === "completed").length,
    accepted: submissions.filter((s) => s.status === "accepted").length,
  }

  const loading = userLoading || assignmentsLoading || submissionsLoading

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-4 gap-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <FacultyTabBar />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              Faculty Dashboard
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)] mt-2">
              Monitor sprint submissions across all assignments
            </p>
          </div>
          <div className="text-right">
            <div className="text-[13px] text-[var(--color-ink-faint)]">
              Logged in as
            </div>
            <div className="text-sm font-medium text-[var(--color-ink)]">
              @{user?.name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm font-medium text-[var(--color-ink-muted)]">
            Filter by assignment:
          </label>
          <select
            value={selectedAssignment}
            onChange={(e) => setSelectedAssignment(e.target.value)}
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
              {stats.active}
            </div>
            <div className="flex items-center text-sm text-[var(--color-ink-muted)] mt-1">
              <span className="status-dot status-dot--active" />
              In Progress
            </div>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
            <div className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              {stats.completed}
            </div>
            <div className="flex items-center text-sm text-[var(--color-ink-muted)] mt-1">
              <span className="status-dot status-dot--review" />
              Awaiting Acceptance
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

        <div className="rounded-lg border border-[var(--color-border)] bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="font-semibold tracking-tight text-[var(--color-ink)]">
              Sprint Submissions
            </h2>
            <a
              href="/faculty/review"
              className="text-sm text-[var(--color-accent)] hover:underline font-medium"
            >
              Open Review →
            </a>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-ink-muted)]">
              No submissions yet
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {filteredSubmissions.map((submission) => {
                const assignment: Assignment | undefined = getAssignment(
                  submission.assignmentId
                )
                const rosterEntry = roster.find(
                  (r) => r.githubUsername === submission.studentUsername
                )
                const lastSprint =
                  submission.sprints[submission.sprints.length - 1]
                const statusConfig = {
                  active: {
                    dot: "status-dot--active",
                    label: "In Progress",
                  },
                  completed: {
                    dot: "status-dot--review",
                    label: "Awaiting Acceptance",
                  },
                  accepted: {
                    dot: "status-dot--done",
                    label: "Accepted",
                  },
                }[submission.status]

                return (
                  <div
                    key={submission.id}
                    className="px-6 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[var(--color-border)] rounded-full flex items-center justify-center text-[var(--color-ink-muted)] font-medium">
                        {(rosterEntry?.rollNo?.[0] ||
                          submission.studentUsername[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--color-ink)]">
                          {rosterEntry?.rollNo || "@" + submission.studentUsername}
                        </div>
                        <div className="text-sm text-[var(--color-ink-muted)]">
                          {assignment?.title || submission.assignmentId}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-sm text-[var(--color-ink-muted)] flex items-center gap-1.5">
                        <span className="font-medium text-[var(--color-ink)]">
                          {submission.sprints.length}/{assignment?.sprintCount || 4}
                        </span>
                        sprints
                      </div>
                      {lastSprint && (
                        <span
                          className="text-xs text-[var(--color-ink-faint)] font-mono"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {lastSprint.commitSha.slice(0, 7)}
                        </span>
                      )}
                      <span className="inline-flex items-center text-[13px] font-medium text-[var(--color-ink-muted)]">
                        <span className={`status-dot ${statusConfig.dot}`} />
                        {statusConfig.label}
                      </span>
                      <a
                        href={`/faculty/assignments/${submission.assignmentId}`}
                        className="text-sm text-[var(--color-accent)] hover:underline"
                      >
                        View →
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}