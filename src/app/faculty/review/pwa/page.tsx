"use client"

import { useEffect, useState } from "react"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import PWAReview from "@/frontend/components/Faculty/PWAReview"
import type { Assignment } from "@/backend/types"

/**
 * Faculty PWA review page — mobile-first interface for calling teams up
 * in roll-number order, marking sprints done with optional comments.
 * Works offline: reviews are queued locally and sync when online.
 */
export default function PWAReviewPage() {
  const { isFaculty, loading: userLoading } = useSessionUser()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | "">("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userLoading && !isFaculty) {
      // Not faculty — shouldn't reach here due to proxy, but guard anyway
      return
    }
    fetch("/api/assignments")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load assignments")
        return res.json()
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setAssignments(list)
        if (list.length > 0 && !selectedAssignmentId) {
          setSelectedAssignmentId(list[0].id)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [userLoading, isFaculty, selectedAssignmentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] p-4">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 rounded bg-[var(--color-border)]" />
            <div className="h-64 w-full rounded-2xl bg-[var(--color-border)]" />
          </div>
        </div>
      </div>
    )
  }

  if (!selectedAssignmentId || assignments.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] p-4">
        <div className="max-w-md mx-auto text-center py-20">
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">
            No assignments
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            No assignments available to review.
          </p>
        </div>
      </div>
    )
  }

  const assignment = assignments.find((a) => a.id === selectedAssignmentId)

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <PWAReview
        assignment={assignment!}
        onAssignmentChange={setSelectedAssignmentId}
        assignments={assignments}
      />
    </div>
  )
}
