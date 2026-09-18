"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import { AssignmentCard } from "./AssignmentCard"

export default function Assignments() {
  const router = useRouter()
  const { user, loading: userLoading } = useSessionUser()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { submissions } = useSubmissions()

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/")
    }
  }, [user, userLoading, router])

  const loading = userLoading || assignmentsLoading

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-48" />
          <div className="h-4 bg-[var(--color-border)] rounded w-96" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[var(--color-border)] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          Assignments
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-2">
          Read the problem statement, build in your own repo, and submit across
          sprints
        </p>
      </div>

      <div className="space-y-4">
        {assignments.map((assignment) => {
          const deadlineDate = new Date(assignment.deadline)
          const isPastDeadline = deadlineDate < new Date()
          const submission = submissions.find(
            (s) => s.assignmentId === assignment.id
          )

          const fmtDeadline = deadlineDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })

          return (
            <AssignmentCard
              key={assignment.id}
              subject={assignment.subject}
              title={assignment.title}
              description={assignment.description}
              deadlineDate={fmtDeadline}
              isPastDeadline={isPastDeadline}
              href={
                submission
                  ? `/assignments/timeline?assignmentId=${assignment.id}`
                  : `/assignments/submit?assignmentId=${assignment.id}&sprint=0`
              }
              primaryAction={
                submission ? "View Timeline →" : "Start Sprint 0 →"
              }
            />
          )
        })}

        {assignments.length === 0 && (
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-center">
            <svg
              className="w-12 h-12 text-[var(--color-ink-faint)] mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-sm text-[var(--color-ink-muted)]">
              No assignments available yet
            </p>
          </div>
        )}
      </div>
    </div>
  )
}