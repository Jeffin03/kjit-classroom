"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import SprintSubmitForm, {
  type SprintSubmitPayload,
} from "@/frontend/components/SprintSubmitForm"

export default function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = use(searchParams)
  const assignmentId =
    typeof params.assignmentId === "string" ? params.assignmentId : null
  const sprintParam = typeof params.sprint === "string" ? params.sprint : null
  const sprintNumber = sprintParam ? parseInt(sprintParam, 10) : 0
  const router = useRouter()
  const { user, loading: userLoading } = useSessionUser()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { submissions, loading: submissionsLoading, refetch } = useSubmissions()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/")
    }
  }, [user, userLoading, router])

  if (userLoading || assignmentsLoading || submissionsLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="space-y-6 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!assignmentId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">
        No assignment specified.
      </div>
    )
  }

  const assignment = assignments.find((a) => a.id === assignmentId)
  const submission = submissions.find((s) => s.assignmentId === assignmentId)

  if (!assignment) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">
        Assignment not found.
      </div>
    )
  }

  if (sprintNumber === 0 && submission) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">
        You already started this assignment.{" "}
        <a
          href={`/assignments/timeline?assignmentId=${assignment.id}`}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View timeline →
        </a>
      </div>
    )
  }

  if (
    sprintNumber > 0 &&
    (!submission || submission.sprints.length !== sprintNumber)
  ) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">
        Sprint {sprintNumber} is not ready to submit yet.{" "}
        <a
          href={
            submission
              ? `/assignments/timeline?assignmentId=${assignment.id}`
              : `/assignments/submit?assignmentId=${assignment.id}&sprint=0`
          }
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          {submission ? "View timeline →" : "Start Sprint 0 →"}
        </a>
      </div>
    )
  }

  const handleSubmit = async (payload: SprintSubmitPayload) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      if ("abstractDocUrl" in payload) {
        const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data.error || "Failed to create submission")
        }
        await refetch()
        router.push(`/assignments/timeline?assignmentId=${payload.assignmentId}`)
        return
      }

      if (!submission) {
        throw new Error("No submission to attach this sprint to")
      }

      const res = await fetch(`/api/submissions/${submission.id}/sprints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprintNumber,
          repoUrl: payload.repoUrl,
          documentationUrl: payload.documentationUrl,
          summary: payload.summary,
          isPivot: payload.isPivot,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit sprint")
      }
      await refetch()
      router.push(`/assignments/timeline?assignmentId=${assignment.id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SprintSubmitForm
      assignment={assignment}
      submission={submission}
      sprintNumber={sprintNumber}
      onSubmit={handleSubmit}
      loading={submitting}
      error={submitError}
    />
  )
}