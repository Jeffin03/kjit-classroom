"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Assignment {
  id: string
  title: string
  templateOwner: string
  templateRepo: string
  subject: string
}

interface Submission {
  assignmentId: string
  forkUrl: string
  prUrl?: string
  status: "forked" | "submitted" | "reviewed" | "merged"
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      Promise.all([
        fetch("/api/submissions").then((res) => res.json()),
        fetch("/api/assignments").then((res) => res.json()),
      ]).then(([submissionsData, assignmentsData]) => {
        setSubmissions(submissionsData)
        setAssignments(assignmentsData)
        setLoading(false)
      })
    }
  }, [session])

  const getAssignment = (id: string) =>
    assignments.find((a) => a.id === id)

  const statusConfig = {
    forked: {
      color: "bg-yellow-100 text-yellow-700",
      label: "Forked",
      icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
    },
    submitted: {
      color: "bg-blue-100 text-blue-700",
      label: "PR Open",
      icon: "M12 4v16m8-8H4",
    },
    reviewed: {
      color: "bg-purple-100 text-purple-700",
      label: "Reviewed",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    merged: {
      color: "bg-green-100 text-green-700",
      label: "Merged",
      icon: "M5 13l4 4L19 7",
    },
  }

  if (loading || status === "loading") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="space-y-4 mt-8">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Track your project submissions and portfolio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-3xl font-bold text-indigo-600">
            {submissions.length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Submissions</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-3xl font-bold text-green-600">
            {submissions.filter((s) => s.status === "merged").length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Merged Projects</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-3xl font-bold text-yellow-600">
            {submissions.filter((s) => s.status === "forked").length}
          </div>
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
          submissions.map((submission) => {
            const assignment = getAssignment(submission.assignmentId)
            const config = statusConfig[submission.status]

            return (
              <div
                key={`${submission.assignmentId}-${submission.forkUrl}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {assignment?.title || submission.assignmentId}
                    </h3>
                    {assignment && (
                      <p className="text-sm text-gray-500 mt-1">
                        {assignment.subject}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <a
                        href={submission.forkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        View Fork
                      </a>
                      {submission.prUrl && (
                        <a
                          href={submission.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          View PR
                        </a>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={config.icon}
                      />
                    </svg>
                    {config.label}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
