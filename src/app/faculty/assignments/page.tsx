"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import { PlusIcon, ArrowRightIcon } from "@/frontend/components/Icons"

/** Faculty assignments listing: shows all assignments for the caller's classes,
 * with stats per assignment so faculty can see at a glance how many teams have
 * submitted, are in review, or are accepted. */
export default function FacultyAssignmentsPage() {
  const { isFaculty, loading: userLoading } = useSessionUser()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  interface Assignment {
    id: string
    title: string
    subject: string
    description: string
    deadline: string
    assignedTeams: string[]
    sprintCount: number
    allowLateSubmissions?: boolean
    createdAt: string
    updatedAt: string
  }

  useEffect(() => {
    if (!userLoading && !isFaculty) {
      // Shouldn't happen due to proxy guard, but be safe
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
        setLoading(false)
      })
      .catch(() => {
        setError("Couldn't load assignments. Try again.")
        setLoading(false)
      })
  }, [isFaculty, userLoading])

  if (loading) {
    return (
      <div className="max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-border" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-border" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl">
        <div className="mt-8 rounded-2xl border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--color-danger-text)]">
            Couldn&rsquo;t load assignments
          </h2>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            {error}
          </p>
        </div>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="max-w-6xl">
        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] mb-4">
            <PlusIcon className="size-8" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">
            No assignments yet
          </h2>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            Create your first assignment to get started.
          </p>
          <Link
            href="/faculty/assignments/new"
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            <PlusIcon className="size-4 mr-2" /> New Assignment
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">
          Assignments
        </h1>
        <Link
          href="/faculty/assignments/new"
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          <PlusIcon className="size-4 mr-2" /> New assignment
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assignments.map((a) => (
          <div
            key={a.id}
            className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm hover:border-[var(--color-accent)]/50 transition-colors"
          >
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                {a.title}
              </h3>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                {a.subject}
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                <span className="font-mono">{a.deadline}</span>
                <span className="w-px bg-[var(--color-border)]" />
                <span>{a.assignedTeams.join(", ")}</span>
              </div>
              <div className="text-xs text-[var(--color-ink-muted)]">
                {a.sprintCount} sprints
              </div>
              <div className="text-xs text-[var(--color-ink-muted)]">
                Created{" "}
                <span className="font-mono text-[12px]">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <Link
              href={`/faculty/assignments/${a.id}`}
              className="w-full inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] px-4 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/30"
            >
              Open assignment <ArrowRightIcon className="ml-1 size-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
