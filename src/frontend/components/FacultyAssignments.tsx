"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import FacultyTabBar from "./FacultyTabBar"
import { AssignmentCard } from "./AssignmentCard"

interface RosterEntry {
  githubUsername?: string
  classTeam: string
}

export default function FacultyAssignments() {
  const router = useRouter()
  const { user, isFaculty, loading: userLoading } = useSessionUser()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { submissions } = useSubmissions()
  const [roster, setRoster] = useState<RosterEntry[]>([])

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

  const loading = userLoading || assignmentsLoading

  if (loading) {
    return (
      <>
        <FacultyTabBar />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--color-border)] rounded w-48" />
            <div className="space-y-4 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-[var(--color-border)] rounded" />
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <FacultyTabBar />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              Assignments
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)] mt-2">
              Create and manage assignments
            </p>
          </div>
          <Link
            href="/faculty/assignments/new"
            className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#372FA8] transition-colors flex items-center gap-2"
          >
            New Assignment
          </Link>
        </div>

        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-center">
              <p className="text-sm text-[var(--color-ink-muted)] mb-4">
                No assignments yet
              </p>
              <Link
                href="/faculty/assignments/new"
                className="text-sm font-medium text-[var(--color-accent)] hover:underline"
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