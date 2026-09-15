"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import type { Assignment, SubmissionWithSprints } from "@/backend/types"
import FacultyTabBar from "./FacultyTabBar"

interface ReviewDraft {
  [sprintSubmissionId: string]: string
}

export default function FacultyReview({
  assignmentParam,
}: {
  assignmentParam?: string
}) {
  const router = useRouter()
  const { user, isFaculty, loading: userLoading } = useSessionUser()
  const [submissions, setSubmissions] = useState<SubmissionWithSprints[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("active")
  const [filterAssignment, setFilterAssignment] = useState<string>(
    assignmentParam || "all"
  )
  const [drafts, setDrafts] = useState<ReviewDraft>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = async () => {
    try {
      const [subsRes, assignsRes] = await Promise.all([
        fetch("/api/submissions"),
        fetch("/api/assignments"),
      ])
      const subs = subsRes.ok ? await subsRes.json() : []
      const assigns = assignsRes.ok ? await assignsRes.json() : []
      setSubmissions(Array.isArray(subs) ? subs : [])
      setAssignments(Array.isArray(assigns) ? assigns : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!userLoading) {
      if (!user) router.push("/")
      else if (!isFaculty) router.push("/dashboard")
    }
  }, [user, isFaculty, userLoading, router])

  useEffect(() => {
    if (filterAssignment !== "all") {
      fetch(`/api/submissions?assignmentId=${filterAssignment}`)
        .then((r) => r.json())
        .then((subs) => setSubmissions(Array.isArray(subs) ? subs : []))
        .catch(() => {})
    }
  }, [filterAssignment])

  const getAssignment = (id: string) => assignments.find((a) => a.id === id)

  const filtered = submissions.filter((s) => {
    const matchesStatus = filterStatus === "all" || s.status === filterStatus
    const matchesAssignment =
      filterAssignment === "all" || s.assignmentId === filterAssignment
    return matchesStatus && matchesAssignment
  })

  const handleReview = async (submissionId: string) => {
    setSavingId(submissionId)
    try {
      for (const sprint of submissions.find((s) => s.id === submissionId)
        ?.sprints || []) {
        const notes = drafts[sprint.id]
        if (notes !== undefined && notes.trim() !== "") {
          await fetch(`/api/submissions/${submissionId}/review`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sprintSubmissionId: sprint.id, notes }),
          })
        }
      }
      await load()
    } finally {
      setSavingId(null)
    }
  }

  const handleAccept = async (submissionId: string) => {
    setSavingId(submissionId)
    try {
      await fetch(`/api/submissions/${submissionId}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept: true }),
      })
      await load()
    } finally {
      setSavingId(null)
    }
  }

  const stats = {
    total: submissions.length,
    reviewed: submissions.filter((s) =>
      s.sprints.some((sp) => sp.reviewedAt)
    ).length,
    pending: submissions.filter((s) =>
      s.sprints.some((sp) => !sp.reviewedAt) && s.status !== "accepted"
    ).length,
    accepted: submissions.filter((s) => s.status === "accepted").length,
  }

  if (loading || userLoading) {
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
    <>
      <FacultyTabBar />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sprint Review</h1>
          <p className="text-gray-600 mt-2">
            Review sprint work and accept submissions
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Submissions</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600">Awaiting Review</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.reviewed}
            </div>
            <div className="text-sm text-gray-600">Partially Reviewed</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.accepted}
            </div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
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
              const isSaving = savingId === submission.id
              const statusConfig = {
                active: "bg-yellow-100 text-yellow-700",
                completed: "bg-blue-100 text-blue-700",
                accepted: "bg-green-100 text-green-700",
              }[submission.status]

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
                          @{submission.studentUsername}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment?.title || submission.assignmentId}
                          {(assignment?.assignedTeams || []).length > 0 && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {assignment?.assignedTeams.join(", ")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <a
                            href={submission.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            View Repo
                          </a>
                          {submission.abstractDocUrl && (
                            <a
                              href={submission.abstractDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                              Abstract
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig}`}
                      >
                        {submission.status}
                      </span>
                      {submission.sprints.some((s) => s.isPivot) && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          Pivoted
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {Array.from({ length: assignment?.sprintCount || 4 }).map(
                      (_, idx) => {
                        const sprint = submission.sprints.find(
                          (s) => s.sprintNumber === idx
                        )
                        if (!sprint) {
                          return (
                            <div
                              key={idx}
                              className="text-sm text-gray-400 flex items-center gap-2"
                            >
                              <span className="w-20 text-gray-500">
                                Sprint {idx}
                              </span>
                              Not submitted
                            </div>
                          )
                        }

                        const diff = sprint.diffMetrics
                        const reviewed =
                          typeof sprint.reviewedAt === "string" &&
                          sprint.reviewedAt.length > 0

                        return (
                          <div
                            key={idx}
                            className={`border rounded-lg p-3 ${reviewed ? "border-green-200 bg-green-50/50" : "border-gray-200"}`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="text-sm font-medium text-gray-900">
                                Sprint {idx}
                                {sprint.isPivot && (
                                  <span className="ml-2 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                                    Pivot
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={`/api/github/commit?repoUrl=${encodeURIComponent(submission.repoUrl)}&sha=${sprint.commitSha}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-600 hover:text-indigo-700 font-mono"
                                >
                                  {sprint.commitSha.slice(0, 7)}
                                </a>
                                {diff ? (
                                  <span className="text-xs text-gray-500">
                                    +{diff.additions} -{diff.deletions} ·{" "}
                                    {diff.filesChanged} files ·{" "}
                                    {diff.totalCommits} commits
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    No diff recorded
                                  </span>
                                )}
                                {reviewed && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    Reviewed
                                  </span>
                                )}
                              </div>
                            </div>
                            <input
                              type="text"
                              placeholder={
                                reviewed
                                  ? sprint.reviewNotes || "Review notes saved"
                                  : "Add review notes…"
                              }
                              defaultValue={sprint.reviewNotes || ""}
                              value={drafts[sprint.id] ?? sprint.reviewNotes ?? ""}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [sprint.id]: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        )
                      }
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-3 justify-end">
                    {submission.status !== "accepted" && (
                      <>
                        <button
                          onClick={() => handleReview(submission.id)}
                          disabled={isSaving}
                          className="px-4 py-1.5 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                        >
                          {isSaving ? "Saving…" : "Save Notes"}
                        </button>
                        <button
                          onClick={() => handleAccept(submission.id)}
                          disabled={isSaving}
                          className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {isSaving ? "Saving…" : "Accept"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}