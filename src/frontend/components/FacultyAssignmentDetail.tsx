"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import type { AssignmentWithStats, SubmissionWithSprints } from "@/backend/types"
import FacultyTabBar from "./FacultyTabBar"
import ChecklistProgress from "./ChecklistProgress"

interface RosterEntry {
  githubUsername?: string
  rollNo: string
  collegeEmail: string
  classTeam: string
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
  const [acceptedIds, setAcceptedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [detailRes, subsRes, rosterRes] = await Promise.all([
        fetch(`/api/assignments/${assignmentId}`),
        fetch(`/api/submissions?assignmentId=${assignmentId}`),
        fetch("/api/roster"),
      ])

      const detail = detailRes.ok ? await detailRes.json() : null
      const subs = subsRes.ok ? await subsRes.json() : []
      const rosterData = rosterRes.ok ? await rosterRes.json() : { roster: [] }

      setAssignment(detail)
      setSubmissions(Array.isArray(subs) ? subs : [])
      setRoster(Array.isArray(rosterData.roster) ? rosterData.roster : [])
      setAcceptedIds(
        Array.isArray(subs)
          ? subs.filter((s) => s.status === "accepted").map((s) => s.id)
          : []
      )
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

  if (loading || userLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-4 gap-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="space-y-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <>
        <FacultyTabBar />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center text-gray-500">
          Assignment not found.
        </div>
      </>
    )
  }

  const rosterByUsername = new Map(
    roster.map((r) => [r.githubUsername, r])
  )

  const studentRows = (assignment.submissions || []).map((row) => ({
    ...row,
    submission: submissions.find((s) => s.studentUsername === row.studentUsername),
  }))

  const assignedRoster = roster.filter((r) =>
    assignment.assignedTeams.includes(r.classTeam)
  )

  const totalStudents = assignedRoster.length > 0
    ? assignedRoster.length
    : assignment.submissions?.length ?? 0
  const acceptedCount = assignment.submissions?.filter(
    (s) => s.status === "accepted"
  ).length
  const activeCount = assignment.submissions?.filter(
    (s) => s.status === "active" || s.status === "completed"
  ).length
  const noSubmission = Math.max(0, totalStudents - (assignment.submissions?.length ?? 0))

  const handleAccept = async (submissionId: string) => {
    try {
      const res = await fetch(`/api/submissions/${submissionId}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept: true }),
      })
      if (res.ok) {
        await load()
      }
    } catch {
      // ignore
    }
  }

  return (
    <>
      <FacultyTabBar />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center rounded-md bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-accent)]">
                {assignment.subject}
              </span>
              <span className="inline-flex items-center rounded-md bg-[var(--color-border)] px-2 py-0.5 text-xs font-medium text-[var(--color-ink-muted)]">
                {assignment.assignedTeams.join(", ")}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)] mb-2">
              {assignment.title}
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)] mb-3">
              {assignment.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-[var(--color-ink-muted)]">
              <span>Due {new Date(assignment.deadline).toLocaleDateString()}</span>
              <span>{assignment.sprintCount} sprints</span>
              <span>
                Created by{" "}
                <span
                  className="font-mono text-[13px] text-[var(--color-ink-muted)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  @{assignment.createdBy}
                </span>
              </span>
            </div>
          </div>
          <Link
            href="/faculty/assignments"
            className="flex-shrink-0 border border-[var(--color-border)] bg-white text-[var(--color-ink-muted)] text-sm font-medium px-4 py-2 rounded-md hover:bg-[var(--color-canvas)] transition-colors"
          >
            ← Back
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
            <div className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              {totalStudents}
            </div>
            <div className="flex items-center text-sm text-[var(--color-ink-muted)] mt-1">
              <span className="status-dot status-dot--review" />
              Total Students
            </div>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
            <div className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              {acceptedIds.length || acceptedCount}
            </div>
            <div className="flex items-center text-sm text-[var(--color-ink-muted)] mt-1">
              <span className="status-dot status-dot--done" />
              Accepted
            </div>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
            <div className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              {activeCount}
            </div>
            <div className="flex items-center text-sm text-[var(--color-ink-muted)] mt-1">
              <span className="status-dot status-dot--active" />
              Active Submissions
            </div>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
            <div className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              {noSubmission}
            </div>
            <div className="flex items-center text-sm text-[var(--color-ink-muted)] mt-1">
              <span className="status-dot status-dot--pending" />
              No Submissions
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
              Student Submissions ({totalStudents})
            </h2>
          </div>

          {studentRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-ink-muted)]">
              No submissions yet
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {studentRows.map((row) => {
                const rosterEntry = rosterByUsername.get(row.studentUsername)
                const sub = row.submission

                return (
                  <div key={row.studentUsername} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-[var(--color-border)] rounded-full flex items-center justify-center text-sm font-medium text-[var(--color-ink-muted)]">
                          {(rosterEntry?.rollNo?.[0] || row.studentUsername[0]).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--color-ink)]">
                            {rosterEntry?.rollNo || "@" + row.studentUsername}
                          </div>
                          <div className="text-sm text-[var(--color-ink-muted)]">
                            <span
                              className="font-mono text-[13px]"
                              style={{ fontFamily: "var(--font-mono)" }}
                            >
                              @{row.studentUsername}
                            </span>{" "}
                            · {rosterEntry?.collegeEmail || "—"}
                          </div>
                          {row.pivot && (
                            <div className="text-xs font-medium text-[var(--color-caution)] mt-1">
                              <span className="status-dot status-dot--pivot" />
                              Pivoted at some sprint
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-3">
                        {sub && (
                          <a
                            href={`/faculty/review?assignmentId=${assignmentId}`}
                            className="text-sm text-[var(--color-accent)] hover:underline"
                          >
                            Open Review →
                          </a>
                        )}
                        {acceptedIds.includes(sub?.id || "") ? (
                          <span className="inline-flex items-center text-[13px] font-medium text-[var(--color-success)]">
                            <span className="status-dot status-dot--done" />
                            Accepted
                          </span>
                        ) : (
                          sub && (
                            <button
                              onClick={() => handleAccept(sub.id)}
                              className="bg-[var(--color-accent)] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#372FA8] transition-colors"
                            >
                              Accept
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {sub ? (
                      <div className="mt-3">
                        <div className="flex gap-4 items-center">
                          {Array.from({ length: assignment.sprintCount }).map(
                            (_, idx) => {
                              const sprint = sub.sprints.find(
                                (s) => s.sprintNumber === idx
                              )
                              return (
                                <span
                                  key={idx}
                                  className="inline-flex items-center text-[13px] font-medium"
                                >
                                  <span
                                    className={`status-dot ${
                                      sprint
                                        ? sprint.isPivot
                                          ? "status-dot--pivot"
                                          : "status-dot--done"
                                        : "status-dot--pending"
                                    }`}
                                  />
                                  <span
                                    className={
                                      sprint
                                        ? "text-[var(--color-ink)]"
                                        : "text-[var(--color-ink-faint)]"
                                    }
                                  >
                                    Sprint {idx}
                                  </span>
                                </span>
                              )
                            }
                          )}
                        </div>
                        <div className="mt-2 max-w-md">
                          <ChecklistProgress
                            current={sub.sprints.length}
                            total={assignment.sprintCount}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-[var(--color-ink-faint)] mt-2">
                        No submission after Sprint 0
                      </div>
                    )}
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