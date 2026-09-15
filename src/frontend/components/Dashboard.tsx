"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
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
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="space-y-4 mt-8">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
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
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-2">Track your project submissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-3xl font-bold text-indigo-600">
            {submissions.length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Submissions</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-3xl font-bold text-green-600">{completed}</div>
          <div className="text-sm text-gray-600 mt-1">Completed</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-3xl font-bold text-yellow-600">{inProgress}</div>
          <div className="text-sm text-gray-600 mt-1">In Progress</div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Submissions</h2>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-4"
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
            <p className="text-gray-600 mb-4">No submissions yet</p>
            <a
              href="/assignments"
              className="text-indigo-600 font-medium hover:text-indigo-700"
            >
              Browse assignments &rarr;
            </a>
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