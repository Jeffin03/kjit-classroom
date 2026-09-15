"use client"

import { useCallback, useEffect, useState } from "react"
import type { SubmissionWithSprints } from "@/backend/types"

export interface UseSubmissionsResult {
  submissions: SubmissionWithSprints[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useSubmissions(assignmentId?: string): UseSubmissionsResult {
  const [submissions, setSubmissions] = useState<SubmissionWithSprints[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const query = assignmentId
    ? `?assignmentId=${encodeURIComponent(assignmentId)}`
    : ""

  const refetch = useCallback(async () => {
    const currentQuery = assignmentId
      ? `?assignmentId=${encodeURIComponent(assignmentId)}`
      : ""
    try {
      const res = await fetch(`/api/submissions${currentQuery}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to load submissions")
      }
      const data = await res.json()
      setSubmissions(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/submissions${query}`)
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error("Failed to load submissions"))
      )
      .then((data) => {
        if (!cancelled) {
          setSubmissions(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load submissions")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [query])

  return { submissions, loading, error, refetch }
}