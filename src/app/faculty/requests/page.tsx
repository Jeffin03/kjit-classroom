"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface TeacherRequest {
  id: string
  githubUsername: string
  email: string
  classes: string[]
  requestedAt: string
}

export default function FacultyRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [requests, setRequests] = useState<TeacherRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    if (!session) return

    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch("/api/requests")
        const data = await res.json()
        if (!cancelled && res.ok) {
          setRequests(data.requests || [])
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [session])

  const handleAction = async (githubUsername: string, action: "approve" | "deny") => {
    setProcessing(githubUsername)
    try {
      const res = await fetch("/api/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUsername, action }),
      })
      if (res.ok) {
        setRequests((prev) =>
          prev.filter((r) => r.githubUsername !== githubUsername)
        )
      }
    } catch {
      // ignore
    } finally {
      setProcessing(null)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="space-y-3 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Faculty Requests
        </h1>
        <p className="text-gray-600 mt-2">
          Review and approve teacher requests to become class animators
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
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
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">
            No pending requests
          </h2>
          <p className="text-gray-500">
            All teacher requests have been reviewed
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.githubUsername}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-lg">
                    {request.githubUsername[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      @{request.githubUsername}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.email}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Requested {new Date(request.requestedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleAction(request.githubUsername, "approve")
                    }
                    disabled={processing === request.githubUsername}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {processing === request.githubUsername
                      ? "..."
                      : "Approve"}
                  </button>
                  <button
                    onClick={() =>
                      handleAction(request.githubUsername, "deny")
                    }
                    disabled={processing === request.githubUsername}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Deny
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-gray-500 mb-2">
                  Requested classes:
                </div>
                <div className="flex flex-wrap gap-2">
                  {request.classes.map((className) => (
                    <span
                      key={className}
                      className="px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full"
                    >
                      {className}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
