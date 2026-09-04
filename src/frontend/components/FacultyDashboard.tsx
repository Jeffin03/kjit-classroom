"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Submission {
  studentUsername: string
  assignmentId: string
  forkUrl: string
  prUrl?: string
  prNumber?: number
  status: "forked" | "submitted" | "reviewed" | "merged"
  submittedAt?: string
}

interface Assignment {
  id: string
  title: string
  templateRepo: string
  subject: string
}

export default function FacultyDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<string>("all")
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

  const filteredSubmissions =
    selectedAssignment === "all"
      ? submissions
      : submissions.filter((s) => s.assignmentId === selectedAssignment)

  const statusConfig = {
    forked: { color: "bg-yellow-100 text-yellow-700", label: "Forked" },
    submitted: { color: "bg-blue-100 text-blue-700", label: "Submitted" },
    reviewed: { color: "bg-purple-100 text-purple-700", label: "Reviewed" },
    merged: { color: "bg-green-100 text-green-700", label: "Merged" },
  }

  const getStats = () => {
    const filtered =
      selectedAssignment === "all"
        ? submissions
        : submissions.filter((s) => s.assignmentId === selectedAssignment)

    return {
      total: filtered.length,
      forked: filtered.filter((s) => s.status === "forked").length,
      submitted: filtered.filter((s) => s.status === "submitted").length,
      merged: filtered.filter((s) => s.status === "merged").length,
    }
  }

  const stats = getStats()

  if (loading || status === "loading") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor student submissions across all assignments
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/faculty/assignments"
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Assignments
          </a>
          <a
            href="/faculty/review"
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Review Submissions
          </a>
          <a
            href="/faculty/onboard"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Onboard Students
          </a>
          <a
            href="/faculty/roster"
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            View Roster
          </a>
          <div className="text-right">
            <div className="text-sm text-gray-500">Logged in as</div>
            <div className="font-medium text-gray-900">{session?.user?.name}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm font-medium text-gray-700">
          Filter by assignment:
        </label>
        <select
          value={selectedAssignment}
          onChange={(e) => setSelectedAssignment(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Assignments</option>
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.forked}</div>
          <div className="text-sm text-gray-600">Forked Only</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          <div className="text-sm text-gray-600">PR Submitted</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.merged}</div>
          <div className="text-sm text-gray-600">Merged</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Student Submissions</h2>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No submissions found
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredSubmissions.map((submission) => {
              const assignment = getAssignment(submission.assignmentId)
              const config = statusConfig[submission.status]

              return (
                <div
                  key={`${submission.studentUsername}-${submission.assignmentId}`}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                      {submission.studentUsername[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {submission.studentUsername}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assignment?.title || submission.assignmentId}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <a
                      href={submission.forkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Fork
                    </a>
                    {submission.prUrl && (
                      <a
                        href={submission.prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        PR #{submission.prNumber}
                      </a>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
