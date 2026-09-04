"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Assignment {
  id: string
  title: string
  description: string
  templateOwner: string
  templateRepo: string
  deadline: string
  subject: string
  createdBy: string
  createdAt: string
}

export default function FacultyAssignments() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch("/api/assignments")
        .then((res) => res.json())
        .then((data) => {
          setAssignments(Array.isArray(data) ? data : [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [session])

  if (loading || status === "loading") {
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
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-2">
            Create and manage assignment templates
          </p>
        </div>
        <a
          href="/faculty/assignments/new"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Assignment
        </a>
      </div>

      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500 mb-4">No assignments yet</p>
            <a
              href="/faculty/assignments/new"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create your first assignment
            </a>
          </div>
        ) : (
          assignments.map((assignment) => {
            const deadlineDate = new Date(assignment.deadline)
            const isPastDeadline = deadlineDate < new Date()
            const repoUrl = `https://github.com/${assignment.templateOwner}/${assignment.templateRepo}`

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                        {assignment.subject}
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
                      <span>{assignment.templateRepo}</span>
                      <span>Created by @{assignment.createdBy}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View Repo
                    </a>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
