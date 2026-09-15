"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import type { Assignment, SubmissionWithSprints } from "@/backend/types"
import FacultyTabBar from "./FacultyTabBar"

export default function FacultyDashboard() {
  const router = useRouter()
  const { user, isFaculty, loading: userLoading } = useSessionUser()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { submissions, loading: submissionsLoading } = useSubmissions()
  const [selectedAssignment, setSelectedAssignment] = useState<string>("all")
  const [roster, setRoster] = useState<
    { githubUsername?: string; rollNo: string }[]
  >([])

  useEffect(() => {
    if (!userLoading) {
      if (!user) router.push("/")
      else if (!isFaculty) router.push("/dashboard")
    }
  }, [user, isFaculty, userLoading, router])

  useEffect(() => {
    fetch("/api/roster")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.roster)) setRoster(data.roster)
      })
      .catch(() => {})
  }, [])

  const getAssignment = (id: string) =>
    assignments.find((a) => a.id === id)

  const filteredSubmissions: SubmissionWithSprints[] =
    selectedAssignment === "all"
      ? submissions
      : submissions.filter((s) => s.assignmentId === selectedAssignment)

  const stats = {
    total: submissions.length,
    active: submissions.filter((s) => s.status === "active").length,
    completed: submissions.filter((s) => s.status === "completed").length,
    accepted: submissions.filter((s) => s.status === "accepted").length,
  }

  const loading = userLoading || assignmentsLoading || submissionsLoading

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-4 gap-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
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
    <>
      <FacultyTabBar />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Faculty Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor sprint submissions across all assignments
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Logged in as</div>
            <div className="font-medium text-gray-900">@{user?.name}</div>
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
            <div className="text-sm text-gray-600">Total Submissions</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.active}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.completed}
            </div>
            <div className="text-sm text-gray-600">Awaiting Acceptance</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.accepted}
            </div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Sprint Submissions</h2>
            <a
              href="/faculty/review"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Open Review →
            </a>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No submissions yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredSubmissions.map((submission) => {
                const assignment: Assignment | undefined = getAssignment(
                  submission.assignmentId
                )
                const rosterEntry = roster.find(
                  (r) => r.githubUsername === submission.studentUsername
                )
                const lastSprint =
                  submission.sprints[submission.sprints.length - 1]
                const statusColor = {
                  active: "bg-yellow-100 text-yellow-700",
                  completed: "bg-blue-100 text-blue-700",
                  accepted: "bg-green-100 text-green-700",
                }[submission.status]

                return (
                  <div
                    key={submission.id}
                    className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                        {(rosterEntry?.rollNo?.[0] ||
                          submission.studentUsername[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {rosterEntry?.rollNo || "@" + submission.studentUsername}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment?.title || submission.assignmentId}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-500 flex items-center gap-1.5">
                        <span className="font-medium text-gray-700">
                          {submission.sprints.length}/{assignment?.sprintCount || 4}
                        </span>
                        sprints
                      </div>
                      {lastSprint && (
                        <span className="text-xs text-gray-400 font-mono">
                          {lastSprint.commitSha.slice(0, 7)}
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
                      >
                        {submission.status}
                      </span>
                      <a
                        href={`/faculty/assignments/${submission.assignmentId}`}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        View →
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}