"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import FacultyPageHeader from "./FacultyPageHeader"
import { AssignmentCard } from "../AssignmentCard"

interface RosterEntry {
  githubUsername?: string
  classTeam: string
}

export default function FacultyAssignments() {
  const router = useRouter()
  const { user, isFaculty, capabilities, loading: userLoading } =
    useSessionUser()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { submissions, loading: submissionsLoading } = useSubmissions()
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const canCreate = capabilities.includes("assignment.create")

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

  const loading = userLoading || assignmentsLoading || submissionsLoading

  if (loading) {
    return (
      <div className="max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-48" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[var(--color-border)] rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-6xl">
        <FacultyPageHeader
          title="Assignments"
          subtitle="Create and manage assignments"
          action={
            canCreate ? (
              <Link
                href="/faculty/assignments/new"
                className="inline-flex min-h-10 items-center rounded-lg bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                New Assignment
              </Link>
            ) : undefined
          }
        />

        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-center">
              <p className="text-sm text-[var(--color-ink-muted)] mb-4">
                No assignments yet
              </p>
              {canCreate && (
                <Link
                  href="/faculty/assignments/new"
                  className="text-sm font-medium text-[var(--color-accent)] hover:underline"
                >
                  Create your first assignment
                </Link>
              )}
            </div>
          ) : (
            assignments.map((assignment) => {
              const deadlineDate = new Date(assignment.deadline)
              const isPastDeadline = deadlineDate < new Date()
              const submissionCount = submissions.filter(
                (s) => s.assignmentId === assignment.id
              ).length
              const totalStudents = roster.filter((r) =>
                assignment.assignedTeams.includes(r.classTeam)
              ).length

              const fmtDeadline = deadlineDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })

              return (
                <AssignmentCard
                  key={assignment.id}
                  subject={assignment.subject}
                  title={assignment.title}
                  description={assignment.description}
                  deadlineDate={fmtDeadline}
                  submittedCount={submissionCount}
                  totalStudents={totalStudents}
                  isPastDeadline={isPastDeadline}
                  href={`/faculty/assignments/${assignment.id}`}
                  primaryAction="View Details →"
                />
              )
            })
          )}
        </div>
      </div>
    </>
  )
}