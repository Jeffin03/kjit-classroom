"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import FacultyTabBar from "./FacultyTabBar"

export default function FacultyAssignments() {
  const router = useRouter()
  const { user, isFaculty, loading: userLoading } = useSessionUser()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { submissions } = useSubmissions()

  useEffect(() => {
    if (!userLoading) {
      if (!user) router.push("/")
      else if (!isFaculty) router.push("/dashboard")
    }
  }, [user, isFaculty, userLoading, router])

  const loading = userLoading || assignmentsLoading

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3].map((i) => (
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
            <p className="text-gray-600 mt-2">Create and manage assignments</p>
          </div>
          <Link
            href="/faculty/assignments/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            New Assignment
          </Link>
        </div>

        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-500 mb-4">No assignments yet</p>
              <Link
                href="/faculty/assignments/new"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Create your first assignment
              </Link>
            </div>
          ) : (
            assignments.map((assignment) => {
              const deadlineDate = new Date(assignment.deadline)
              const isPastDeadline = deadlineDate < new Date()
              const submissionCount = submissions.filter(
                (s) => s.assignmentId === assignment.id
              ).length

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
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          {assignment.assignedTeams.join(", ")}
                        </span>
                        {isPastDeadline && (
                          <span className="px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                            Deadline passed
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {assignment.title}
                      </h2>
                      <p className="text-gray-600 text-sm mb-3">
                        {assignment.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Due {deadlineDate.toLocaleDateString()}</span>
                        <span>
                          {submissionCount} submission{submissionCount === 1 ? "" : "s"}
                        </span>
                        <span>Created by @{assignment.createdBy}</span>
                      </div>
                    </div>

                    <a
                      href={`/faculty/assignments/${assignment.id}`}
                      className="flex-shrink-0 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                    >
                      View Details →
                    </a>
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