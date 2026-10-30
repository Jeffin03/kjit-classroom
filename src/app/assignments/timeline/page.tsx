"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import SprintTimeline from "@/frontend/components/Student/SprintTimeline"

export default function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = use(searchParams)
  const assignmentId = typeof params.assignmentId === "string" ? params.assignmentId : null
  const router = useRouter()
  const { user, isFaculty, loading: userLoading } = useSessionUser()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { submissions, loading: submissionsLoading } = useSubmissions()

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/")
    } else if (!userLoading && user && isFaculty) {
      router.push("/faculty")
    }
  }, [user, isFaculty, userLoading, router])

  if (userLoading || assignmentsLoading || submissionsLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-64" />
          <div className="h-4 bg-[var(--color-border)] rounded w-96" />
          <div className="space-y-6 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[var(--color-border)] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!assignmentId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-sm text-[var(--color-ink-muted)]">
        No assignment specified.
      </div>
    )
  }

  const assignment = assignments.find((a) => a.id === assignmentId)
  const submission = submissions.find((s) => s.assignmentId === assignmentId)

  if (!assignment) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-sm text-[var(--color-ink-muted)]">
        Assignment not found.
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-sm text-[var(--color-ink-muted)]">
        You haven&apos;t started this assignment yet.{" "}
        <Link
          href={`/assignments/submit?assignmentId=${assignment.id}&sprint=0`}
          className="font-medium text-[var(--color-accent)] hover:underline"
        >
          Start Sprint 0 →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          {assignment.title}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          {assignment.subject} · Due{" "}
          {new Date(assignment.deadline).toLocaleDateString()}
        </p>
      </div>

      <div className="mt-8">
        <SprintTimeline
          sprints={submission.sprints}
          sprintCount={assignment.sprintCount}
          repoUrl={submission.repoUrl}
          submissionId={submission.id}
          assignmentId={assignment.id}
        />
      </div>
    </div>
  )
}