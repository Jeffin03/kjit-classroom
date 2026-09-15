"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"

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
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-96" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
        <p className="text-gray-600 mt-2">
          Read the problem statement, build in your own repo, and submit across sprints
        </p>
      </div>

      <div className="space-y-4">
        {assignments.map((assignment) => {
          const deadlineDate = new Date(assignment.deadline)
          const isPastDeadline = deadlineDate < new Date()
          const submission = submissions.find(
            (s) => s.assignmentId === assignment.id
          )

          return (
            <div
              key={assignment.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                      {assignment.subject}
                    </span>
                    {isPastDeadline && (
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                        Past deadline
                      </span>
                    )}
                    {submission && (
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Submitted
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {assignment.title}
                  </h2>
                  <p className="text-gray-600 text-sm mb-3">
                    {assignment.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                    <span>Due {deadlineDate.toLocaleDateString()}</span>
                    <span>
                      Sprint 0 · Sprint 1 · Sprint 2 · Sprint 3
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {submission ? (
                    <a
                      href={`/assignments/timeline?assignmentId=${assignment.id}`}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                    >
                      View Timeline →
                    </a>
                  ) : (
                    <a
                      href={`/assignments/submit?assignmentId=${assignment.id}&sprint=0`}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                    >
                      Start Sprint 0
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {assignments.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-gray-600">No assignments available yet</p>
          </div>
        )}
      </div>
    </div>
  )
}