"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect } from "react"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import StatCard from "@/frontend/components/StatCard"
import SubmissionCard from "./SubmissionCard"

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: userLoading } = useSessionUser()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { submissions, loading: submissionsLoading } = useSubmissions()

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/")
    }
  }, [user, userLoading, router])

  const loading = userLoading || assignmentsLoading || submissionsLoading

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-48" />
          <div className="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-[var(--color-border)] rounded-2xl" />
            ))}
          </div>
          <div className="space-y-4 mt-8">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-[var(--color-border)] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getAssignment = (id: string) => assignments.find((a) => a.id === id)

  const completed = submissions.filter(
    (s) => s.status === "completed" || s.status === "accepted"
  ).length
  const inProgress = submissions.filter((s) => s.status === "active").length

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          My Dashboard
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-2">
          Track your project submissions
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total submissions"
          value={submissions.length}
          tone="neutral"
        />
        <StatCard
          label="In progress"
          value={inProgress}
          tone="accent"
          hint="Sprints still open"
        />
        <StatCard
          label="Completed"
          value={completed}
          tone="success"
          hint="Submitted and accepted"
        />
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
          Submissions
        </h2>

        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-[var(--color-ink-faint)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="mb-4 text-sm text-[var(--color-ink-muted)]">
              No submissions yet
            </p>
            <Link
              href="/assignments"
              className="inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-soft)]"
            >
              Browse assignments &rarr;
            </Link>
          </div>
        ) : (
          submissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              assignment={getAssignment(submission.assignmentId)}
              href={`/assignments/timeline?assignmentId=${submission.assignmentId}`}
            />
          ))
        )}
      </div>
    </div>
  )
}