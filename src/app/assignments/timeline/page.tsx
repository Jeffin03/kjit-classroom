"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import SprintTimeline from "@/frontend/components/SprintTimeline"

export default function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = use(searchParams)
  const assignmentId = typeof params.assignmentId === "string" ? params.assignmentId : null
  const router = useRouter()
  const { user, loading: userLoading } = useSessionUser()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { submissions, loading: submissionsLoading } = useSubmissions()

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/")
    }
  }, [user, userLoading, router])

  if (userLoading || assignmentsLoading || submissionsLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-4 bg-gray-200 rounded w-96" />
          <div className="space-y-6 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!assignmentId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        No assignment specified.
      </div>
    )
  }

  const assignment = assignments.find((a) => a.id === assignmentId)
  const submission = submissions.find((s) => s.assignmentId === assignmentId)

  if (!assignment) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        Assignment not found.
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        You haven&apos;t started this assignment yet.{" "}
        <a
          href={`/assignments/submit?assignmentId=${assignment.id}&sprint=0`}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Start Sprint 0 →
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
        <p className="mt-2 text-base text-gray-600">
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
        />
      </div>
    </div>
  )
}