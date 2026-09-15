"use client"

import { useCallback, useEffect, useState } from "react"
import type { Assignment } from "@/backend/types"

export interface UseAssignmentsResult {
  assignments: Assignment[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useAssignments(): UseAssignmentsResult {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/assignments")
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to load assignments")
      }
      const data = await res.json()
      setAssignments(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assignments")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch("/api/assignments")
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error("Failed to load assignments"))
      )
      .then((data) => {
        if (!cancelled) {
          setAssignments(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load assignments")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { assignments, loading, error, refetch }
}