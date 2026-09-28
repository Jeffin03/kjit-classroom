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
import ChecklistProgress from "@/frontend/components/ChecklistProgress"
import StatCard from "@/frontend/components/StatCard"
import StatusPill from "@/frontend/components/StatusPill"
import SprintPill, { type SprintState } from "@/frontend/components/SprintPill"
import FacultyPageHeader from "./FacultyPageHeader"

interface RosterEntry {
  githubUsername?: string
  rollNo: string
  collegeEmail: string
  classTeam: string
}

interface StudentRow {
  studentUsername: string
  rollNo: string
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

export default function FacultyAssignmentDetail({
  assignmentId,
}: {
  assignmentId: string
}) {
  const router = useRouter()
  const { user, isFaculty, loading: userLoading } = useSessionUser()
  const [assignment, setAssignment] = useState<AssignmentWithStats | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionWithSprints[]>([])
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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
        const entry = roster.find((r) => r.githubUsername === s.studentUsername)
        return {
          studentUsername: s.studentUsername,
          rollNo: entry?.rollNo || `@${s.studentUsername}`,
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

  if (loading || userLoading) {
    return (
      <div className="max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded-2xl bg-[var(--color-border)]" />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-[var(--color-border)]" />
            ))}
          </div>
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-[var(--color-border)]" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="max-w-6xl">
        <FacultyPageHeader title="Assignment" />
        <p className="text-sm text-[var(--color-ink-muted)]">
          {loadError ?? "Assignment not found."}
        </p>
      </div>
    )
  }

  const sprintNumbers = Array.from(
    { length: assignment.sprintCount },
    (_, index) => index
  )

  return (
    <div className="max-w-6xl">
      <FacultyPageHeader
        title={assignment.title}
        subtitle={assignment.description}
        action={
          <>
            <Link
              href="/faculty/assignments"
              className="inline-flex min-h-10 items-center rounded-lg border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
            >
              Assignments
            </Link>
            <Link
              href={`/faculty/review?assignmentId=${assignmentId}`}
              className="inline-flex min-h-10 items-center rounded-lg bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Open Review
            </Link>
          </>
        }
      />

      {actionError && (
        <div className="mb-6 rounded-md border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {actionError}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--color-ink-muted)]">
        <StatusPill tone="accent">{assignment.subject}</StatusPill>
        <StatusPill>{assignment.assignedTeams.join(", ")}</StatusPill>
        <span>Due {new Date(assignment.deadline).toLocaleDateString()}</span>
        <span aria-hidden>·</span>
        <span>
          {assignment.sprintCount} sprints
        </span>
        <span aria-hidden>·</span>
        <span>
          Created by{" "}
          <span
            className="font-mono text-[13px]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            @{assignment.createdBy}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Students" value={stats.total} tone="neutral" />
        <StatCard
          label="In progress"
          value={stats.inFlight}
          tone="accent"
          hint="Active or awaiting acceptance"
        />
        <StatCard
          label="Accepted"
          value={stats.accepted}
          tone="success"
          hint="Reviewed and accepted"
        />
        <StatCard
          label="No submission"
          value={stats.noSubmission}
          tone="caution"
          hint="Nothing submitted yet"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
            Student submissions ({stats.total})
          </h2>
          <span className="text-sm text-[var(--color-ink-muted)]">
            {sprintNumbers.length} sprints
          </span>
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">
            No students assigned to this assignment yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem]">
              <thead>
                <tr className="bg-[var(--color-canvas)] text-left text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
                  <th scope="col" className="px-5 py-3">
                    Student
                  </th>
                  {sprintNumbers.map((sprintNumber) => (
                    <th
                      key={sprintNumber}
                      scope="col"
                      className="px-3 py-3 whitespace-nowrap"
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
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((row) => {
                  const submission = row.submission
                  const status = submission
                    ? submissionStatusMeta[submission.status]
                    : null

                  return (
                    <tr
                      key={row.studentUsername || row.rollNo}
                      className="transition-colors hover:bg-[var(--color-canvas)]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-canvas)] text-sm font-medium text-[var(--color-ink-muted)] ring-1 ring-[var(--color-border)]"
                          >
                            {row.rollNo.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-[var(--color-ink)]">
                              {row.rollNo}
                            </div>
                            <div className="truncate text-sm text-[var(--color-ink-muted)]">
                              {row.studentUsername ? (
                                <span
                                  className="font-mono text-[13px]"
                                  style={{ fontFamily: "var(--font-mono)" }}
                                >
                                  @{row.studentUsername}
                                </span>
                              ) : (
                                <span>No GitHub account</span>
                              )}
                            </div>
                            <div className="truncate text-xs text-[var(--color-ink-muted)]">
                              {row.collegeEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {sprintNumbers.map((sprintNumber) => (
                        <td key={sprintNumber} className="px-3 py-4">
                          <SprintPill
                            number={sprintNumber}
                            state={sprintState(
                              submission?.sprints.find(
                                (sprint) =>
                                  sprint.sprintNumber === sprintNumber
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
                          <span
                            className="mt-1.5 block font-mono text-xs text-[var(--color-ink-muted)]"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
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
                              <Link
                                href={`/faculty/review?assignmentId=${assignmentId}`}
                                className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-soft)]"
                              >
                                Review
                              </Link>
                              {submission.status === "accepted" ? null : (
                                <button
                                  type="button"
                                  onClick={() => handleAccept(submission.id)}
                                  className="inline-flex min-h-10 items-center rounded-lg bg-[var(--color-accent)] px-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
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
    </div>
  )
}
