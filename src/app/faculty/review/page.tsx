"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Submission {
  id: string
  studentUsername: string
  assignmentId: string
  forkUrl: string
  prUrl?: string
  prNumber?: number
  status: "forked" | "submitted" | "reviewed" | "accepted" | "merged"
  submittedAt?: string
  reviewedBy?: string
  reviewedAt?: string
}

interface Assignment {
  id: string
  title: string
  subject: string
  templateRepo: string
}

export default function ReviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterAssignment, setFilterAssignment] = useState<string>("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      Promise.all([
        fetch("/api/submissions").then((r) => r.json()),
        fetch("/api/assignments").then((r) => r.json()),
      ]).then(([subs, assigns]) => {
        setSubmissions(Array.isArray(subs) ? subs : [])
        setAssignments(Array.isArray(assigns) ? assigns : [])
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [session])

  const getAssignment = (id: string) =>
    assignments.find((a) => a.id === id || a.templateRepo === id)

  const filtered = submissions.filter((s) => {
    const matchesStatus = filterStatus === "all" || s.status === filterStatus
    const matchesAssignment =
      filterAssignment === "all" || s.assignmentId === filterAssignment
    return matchesStatus && matchesAssignment
  })

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: newStatus as Submission["status"],
                  reviewedBy: session?.user?.name || "unknown",
                  reviewedAt: new Date().toISOString(),
                }
              : s
          )
        )
      }
    } catch {
      // ignore
    } finally {
      setUpdatingId(null)
    }
  }

  const statusConfig = {
    forked: {
      color: "bg-gray-100 text-gray-600",
      label: "Forked",
      next: "submitted",
      nextLabel: "Mark Submitted",
    },
    submitted: {
      color: "bg-yellow-100 text-yellow-700",
      label: "Submitted",
      next: "accepted",
      nextLabel: "Accept",
    },
    reviewed: {
      color: "bg-blue-100 text-blue-700",
      label: "Reviewed",
      next: "accepted",
      nextLabel: "Accept",
    },
    accepted: {
      color: "bg-green-100 text-green-700",
      label: "Accepted",
      next: null,
      nextLabel: null,
    },
    merged: {
      color: "bg-purple-100 text-purple-700",
      label: "Merged",
      next: null,
      nextLabel: null,
    },
  }

  const stats = {
    total: submissions.length,
    submitted: submissions.filter(
      (s) => s.status === "submitted" || s.status === "reviewed"
    ).length,
    accepted: submissions.filter((s) => s.status === "accepted").length,
    pending: submissions.filter((s) => s.status === "forked").length,
  }

  if (loading || status === "loading") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Code Review
        </h1>
        <p className="text-gray-600 mt-2">
          Review student submissions and accept their work
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Submissions</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.submitted}
          </div>
          <div className="text-sm text-gray-600">Awaiting Review</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-green-600">
            {stats.accepted}
          </div>
          <div className="text-sm text-gray-600">Accepted</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-gray-400">
            {stats.pending}
          </div>
          <div className="text-sm text-gray-600">Just Forked</div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="forked">Forked</option>
          <option value="submitted">Submitted</option>
          <option value="reviewed">Reviewed</option>
          <option value="accepted">Accepted</option>
        </select>
        <select
          value={filterAssignment}
          onChange={(e) => setFilterAssignment(e.target.value)}
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

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            No submissions found
          </div>
        ) : (
          filtered.map((submission) => {
            const assignment = getAssignment(submission.assignmentId)
            const config = statusConfig[submission.status]
            const isUpdating = updatingId === submission.id

            return (
              <div
                key={submission.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                      {submission.studentUsername[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {submission.studentUsername}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assignment?.title || submission.assignmentId}
                        {assignment?.subject && (
                          <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            {assignment.subject}
                          </span>
                        )}
                      </div>
                      {submission.submittedAt && (
                        <div className="text-xs text-gray-400 mt-1">
                          Submitted{" "}
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <a
                    href={submission.forkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
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
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
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
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                      PR #{submission.prNumber || "?"}
                    </a>
                  )}

                  <div className="flex-1" />

                  {config.next && (
                    <button
                      onClick={() =>
                        handleStatusUpdate(submission.id, config.next!)
                      }
                      disabled={isUpdating}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        config.next === "accepted"
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      {isUpdating ? "..." : config.nextLabel}
                    </button>
                  )}
                </div>

                {submission.reviewedBy && (
                  <div className="mt-3 text-xs text-gray-400">
                    Reviewed by @{submission.reviewedBy} on{" "}
                    {submission.reviewedAt
                      ? new Date(submission.reviewedAt).toLocaleDateString()
                      : "-"}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
