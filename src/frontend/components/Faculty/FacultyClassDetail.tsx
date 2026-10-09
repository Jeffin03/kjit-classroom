"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import type { Assignment, SubmissionWithSprints } from "@/backend/types"
import Breadcrumbs from "@/frontend/components/Breadcrumbs"
import KpiCard from "@/frontend/components/KpiCard"
import { AssignmentCard } from "@/frontend/components/AssignmentCard"
import { UsersIcon, ClipboardIcon, CheckCircleIcon } from "@/frontend/components/Icons"
import FacultyPageHeader from "./FacultyPageHeader"

interface RosterEntry {
  githubUsername?: string
  rollNo: string
  classTeam: string
}

export default function FacultyClassDetail({ team }: { team: string }) {
  const router = useRouter()
  const { user, isFaculty, capabilities, loading: userLoading } = useSessionUser()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<SubmissionWithSprints[]>([])
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userLoading) {
      if (!user) router.push("/")
      else if (!isFaculty) router.push("/dashboard")
    }
  }, [user, isFaculty, userLoading, router])

  useEffect(() => {
    Promise.all([
      fetch("/api/assignments").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/submissions").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/roster").then((r) => (r.ok ? r.json() : { roster: [] })),
    ])
      .then(([assignData, subsData, rosterData]) => {
        if (Array.isArray(assignData)) setAssignments(assignData)
        if (Array.isArray(subsData)) setSubmissions(subsData)
        if (Array.isArray(rosterData.roster)) setRoster(rosterData.roster)
      })
      .finally(() => setLoading(false))
  }, [])

  const classAssignments = useMemo(
    () => assignments.filter((a) => a.assignedTeams.includes(team)),
    [assignments, team]
  )
  const classRoster = useMemo(
    () => roster.filter((r) => r.classTeam === team),
    [roster, team]
  )
  const classAssignmentIds = useMemo(
    () => new Set(classAssignments.map((a) => a.id)),
    [classAssignments]
  )
  const classSubmissions = useMemo(
    () => submissions.filter((s) => classAssignmentIds.has(s.assignmentId)),
    [submissions, classAssignmentIds]
  )

  const stats = {
    students: classRoster.length,
    assignments: classAssignments.length,
    inProgress: classSubmissions.filter((s) => s.status !== "accepted").length,
    toReview: classSubmissions.filter(
      (s) => s.status !== "accepted" && s.sprints.some((sp) => !sp.reviewedAt)
    ).length,
  }

  const subjects = [
    ...new Set(classAssignments.map((a) => a.subject)),
  ].sort()

  const grouped = classAssignments.reduce<Record<string, Assignment[]>>(
    (acc, item) => {
      ;(acc[item.subject] ||= []).push(item)
      return acc
    },
    {}
  )

  const canWrite = capabilities.includes("roster.write")
  const canCreate = capabilities.includes("assignment.create")

  if (loading || userLoading) {
    return (
      <div className="max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-64 rounded bg-border" />
          <div className="h-8 w-72 rounded bg-border" />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-border" />
            ))}
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-border" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <Breadcrumbs
        items={[{ label: "Dashboard", href: "/faculty" }, { label: team }]}
      />

      <div className="mt-4">
        <FacultyPageHeader
          title={team}
          subtitle={`${subjects.length} subject${subjects.length === 1 ? "" : "s"} · ${stats.students} students · ${stats.assignments} assignments`}
          action={
            <>
              {canCreate && (
                <Link
                  href="/faculty/assignments/new"
                  className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  New assignment
                </Link>
              )}
              <Link
                href="/faculty/roster"
                className="inline-flex min-h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-canvas"
              >
                {canWrite ? "Manage roster" : "View roster"}
              </Link>
            </>
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Students"
          value={stats.students}
          hint="on this roster"
          icon={<UsersIcon className="size-4" />}
          to={`/faculty/roster?class=${encodeURIComponent(team)}`}
        />
        <KpiCard
          label="Assignments"
          value={stats.assignments}
          hint={`in ${subjects.length} subjects`}
          icon={<ClipboardIcon className="size-4" />}
        />
        <KpiCard
          label="In progress"
          value={stats.inProgress}
          hint="open submissions"
          tone="accent"
          icon={<ClipboardIcon className="size-4" />}
        />
        <KpiCard
          label="To review"
          value={stats.toReview}
          hint="unreviewed sprints"
          tone="caution"
          icon={<CheckCircleIcon className="size-4" />}
          to={`/faculty/review?class=${encodeURIComponent(team)}`}
        />
      </div>

      <div className="mt-8 space-y-10">
        {Object.entries(grouped).map(([subject, items]) => (
          <section key={subject}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                {subject}
              </h2>
              <span className="h-px flex-1 bg-border" />
              <span className="rounded-full bg-surface px-2 py-1 text-xs text-ink-subtle">
                {items.length} assignments
              </span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {items.map((assignment) => {
                const subs = submissions.filter(
                  (s) => s.assignmentId === assignment.id
                )
                const deadline = new Date(assignment.deadline)
                return (
                  <AssignmentCard
                    key={assignment.id}
                    subject={assignment.subject}
                    title={assignment.title}
                    description={assignment.description}
                    deadlineDate={deadline.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    isPastDeadline={deadline < new Date()}
                    submittedCount={subs.length}
                    totalStudents={classRoster.length}
                    href={`/faculty/assignments/${assignment.id}`}
                    primaryAction="Open review →"
                  />
                )
              })}
            </div>
          </section>
        ))}

        {classAssignments.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center">
            <p className="text-sm text-ink-muted">
              No assignments for {team} yet.
            </p>
            {canCreate && (
              <Link
                href="/faculty/assignments/new"
                className="mt-4 inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-medium text-accent transition-colors hover:bg-accent-soft"
              >
                Create your first assignment →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
