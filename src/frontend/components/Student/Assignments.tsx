"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import Button from "@/frontend/components/Button"
import { AssignmentCard } from "../AssignmentCard"
import type { BadgeStatus } from "@/frontend/components/Badge"
import type { SubmissionWithSprints } from "@/backend/types"

function assignmentStatus(
  submission: SubmissionWithSprints | undefined
): { status: BadgeStatus; progress: number } {
  if (!submission) return { status: "not-started", progress: 0 }

  const progress = submission.sprints.length
  if (submission.status === "accepted") return { status: "accepted", progress }

  const latest = submission.sprints.at(-1)
  if (latest?.reviewedAt) return { status: "reviewed", progress }
  if (latest) return { status: "submitted", progress }
  return { status: "in-progress", progress }
}

export default function Assignments() {
  const router = useRouter()
  const { user, role, loading: userLoading } = useSessionUser()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { submissions, loading: submissionsLoading } = useSubmissions()
  const [filter, setFilter] = useState("All")

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/")
    }
  }, [user, userLoading, router])

  const loading = userLoading || assignmentsLoading || submissionsLoading

  const submissionFor = useMemo(() => {
    const map = new Map<string, SubmissionWithSprints>()
    submissions.forEach((submission) => map.set(submission.assignmentId, submission))
    return map
  }, [submissions])

  const subjects = useMemo(
    () => ["All", ...new Set(assignments.map((item) => item.subject))],
    [assignments]
  )

  const visible = assignments.filter(
    (item) => filter === "All" || item.subject === filter
  )

  const grouped = visible.reduce<Record<string, typeof visible>>(
    (acc, item) => {
      ;(acc[item.subject] ||= []).push(item)
      return acc
    },
    {}
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-5 sm:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-border" />
          <div className="h-4 w-96 rounded bg-border" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-border" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Assignments</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Every project is submitted sprint by sprint from your own repo.
        </p>
      </header>

      {subjects.length > 1 && (
        <div className="sticky top-16 z-20 -mx-5 mt-6 flex gap-2 overflow-x-auto border-y border-border bg-canvas/95 px-5 py-3">
          {subjects.map((subject) => (
            <Button
              key={subject}
              variant={filter === subject ? "primary" : "outline"}
              onClick={() => setFilter(subject)}
            >
              {subject}
            </Button>
          ))}
        </div>
      )}

      <div className="mt-8 space-y-10">
        {Object.entries(grouped).map(([subject, items]) => (
          <section key={subject}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                {subject}
              </h2>
              <span className="h-px flex-1 bg-border" />
              <span className="rounded-full bg-surface px-2 py-1 text-xs text-ink-subtle">
                {items.length} assignments
              </span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {items.map((assignment) => {
                const submission = submissionFor.get(assignment.id)
                const { status, progress } = assignmentStatus(submission)
                const deadline = new Date(assignment.deadline)
                return (
                  <AssignmentCard
                    key={assignment.id}
                    subject={assignment.subject}
                    title={assignment.title}
                    description={assignment.description}
                    deadlineDate={deadline.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    isPastDeadline={deadline < new Date()}
                    status={status}
                    progress={progress}
                    href={
                      submission
                        ? `/assignments/timeline?assignmentId=${assignment.id}`
                        : `/assignments/submit?assignmentId=${assignment.id}&sprint=0`
                    }
                    primaryAction={
                      submission ? "View timeline →" : "Start Sprint 0 →"
                    }
                  />
                )
              })}
            </div>
          </section>
        ))}

        {visible.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-ink-muted">
              {role === "unrostered"
                ? "Assignments will appear once your class teacher adds you to the roster"
                : "No assignments available yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
