"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import AnnouncementModule from "@/frontend/components/AnnouncementModule"
import KpiCard from "@/frontend/components/KpiCard"
import ClassCard from "@/frontend/components/ClassCard"
import Avatar from "@/frontend/components/Avatar"
import {
  CheckCircleIcon,
  ClipboardIcon,
  UsersIcon,
} from "@/frontend/components/Icons"
import FacultyPageHeader from "./FacultyPageHeader"

interface RosterEntry {
  githubUsername?: string
  rollNo: string
  classTeam: string
}

const DAY = 24 * 60 * 60 * 1000

export default function FacultyDashboard() {
  const router = useRouter()
  const {
    user,
    isFaculty,
    isOrgOwner,
    capabilities,
    loading: userLoading,
  } = useSessionUser()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { submissions, loading: submissionsLoading } = useSubmissions()
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [teams, setTeams] = useState<{ name: string }[]>([])
  const [pendingCount, setPendingCount] = useState(0)

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

    fetch("/api/org/teams")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.teams)) setTeams(data.teams)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!capabilities.includes("teacher.approve")) return
    fetch("/api/requests")
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((data) => {
        if (Array.isArray(data.requests)) setPendingCount(data.requests.length)
      })
      .catch(() => {})
  }, [capabilities])

  const classNames = useMemo(() => {
    const set = new Set<string>(teams.map((t) => t.name))
    roster.forEach((entry) => set.add(entry.classTeam))
    assignments.forEach((a) => a.assignedTeams.forEach((team) => set.add(team)))
    return [...set].sort()
  }, [teams, roster, assignments])

  const assignmentById = useMemo(() => {
    const map = new Map<string, (typeof assignments)[number]>()
    assignments.forEach((a) => map.set(a.id, a))
    return map
  }, [assignments])

  const rollupFor = (team: string) => {
    const teamRoster = roster.filter((r) => r.classTeam === team)
    const teamAssignments = assignments.filter((a) =>
      a.assignedTeams.includes(team)
    )
    const ids = new Set(teamAssignments.map((a) => a.id))
    const teamSubs = submissions.filter((s) => ids.has(s.assignmentId))
    return {
      students: teamRoster.length,
      assignments: teamAssignments.length,
      inProgress: teamSubs.filter((s) => s.status !== "accepted").length,
      toReview: teamSubs.filter(
        (s) =>
          s.status !== "accepted" && s.sprints.some((sp) => !sp.reviewedAt)
      ).length,
      subjects: [...new Set(teamAssignments.map((a) => a.subject))].sort(),
    }
  }

  const recent = useMemo(() => {
    const now = new Date().getTime()
    return submissions
      .flatMap((submission) =>
        submission.sprints.map((sprint) => ({ submission, sprint }))
      )
      .filter(({ sprint }) => now - new Date(sprint.submittedAt).getTime() < 7 * DAY)
      .sort(
        (a, b) =>
          new Date(b.sprint.submittedAt).getTime() -
          new Date(a.sprint.submittedAt).getTime()
      )
      .slice(0, 8)
  }, [submissions])

  const rosterByUsername = useMemo(() => {
    const map = new Map<string, RosterEntry>()
    roster.forEach((entry) => {
      if (entry.githubUsername) map.set(entry.githubUsername, entry)
    })
    return map
  }, [roster])

  const stats = useMemo(() => {
    const now = new Date().getTime()
    const pendingReview = submissions.filter(
      (s) => s.status !== "accepted" && s.sprints.some((sp) => !sp.reviewedAt)
    ).length
    const acceptedThisWeek = submissions.filter(
      (s) =>
        s.status === "accepted" &&
        s.sprints.some(
          (sp) =>
            sp.reviewedAt &&
            now - new Date(sp.reviewedAt).getTime() < 7 * DAY
        )
    ).length
    return {
      students: roster.length,
      live: assignments.length,
      pendingReview,
      acceptedThisWeek,
      noGithub: roster.filter((r) => !r.githubUsername).length,
      subjects: new Set(assignments.map((a) => a.subject)).size,
    }
  }, [roster, assignments, submissions])

  const loading = userLoading || assignmentsLoading || submissionsLoading
  const canCreate = capabilities.includes("assignment.create")

  if (loading) {
    return (
      <div className="max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-border" />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-border" />
            ))}
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 rounded-2xl bg-border" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <FacultyPageHeader
        title={isOrgOwner ? "Admin Dashboard" : "Faculty Dashboard"}
        subtitle="Your classes at a glance"
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
              href="/faculty/review"
              className="inline-flex min-h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-canvas"
            >
              Open review queue
            </Link>
          </>
        }
      />

      {isOrgOwner && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Pending requests"
            value={pendingCount}
            hint="role changes"
            tone={pendingCount ? "caution" : "neutral"}
            to="/faculty/requests"
          />
          <KpiCard
            label="Org students"
            value={stats.students}
            hint={`${classNames.length} classes`}
            to="/faculty/roster"
            icon={<UsersIcon className="size-4" />}
          />
          <KpiCard
            label="Classes"
            value={classNames.length}
            hint="in your org"
            icon={<UsersIcon className="size-4" />}
            to="/faculty/onboard"
          />
          <KpiCard
            label="Roster health"
            value={stats.noGithub}
            hint="without GitHub account"
            tone={stats.noGithub ? "danger" : "success"}
            to="/faculty/roster"
          />
        </div>
      )}

      <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${isOrgOwner ? "mt-4" : ""}`}>
        <KpiCard
          label="Students"
          value={stats.students}
          hint="across your classes"
          icon={<UsersIcon className="size-4" />}
          to="/faculty/roster"
        />
        <KpiCard
          label="Live assignments"
          value={stats.live}
          hint={`in ${stats.subjects} subjects`}
          tone="accent"
          icon={<ClipboardIcon className="size-4" />}
          to="/faculty#classes"
        />
        <KpiCard
          label="To review"
          value={stats.pendingReview}
          hint="sprint submissions"
          tone="caution"
          icon={<ClipboardIcon className="size-4" />}
          to="/faculty/review"
        />
        <KpiCard
          label="Accepted this week"
          value={stats.acceptedThisWeek}
          hint="faculty sign-offs"
          tone="success"
          icon={<CheckCircleIcon className="size-4" />}
          to="/faculty/review?status=accepted"
        />
      </div>

      <div className="mt-6">
        <AnnouncementModule />
      </div>

      <section id="classes" className="mt-10">
        <h2 className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
          Your classes
        </h2>
        {classNames.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-ink-muted">
              You haven&apos;t been assigned a class yet. An org owner assigns
              classes from GitHub teams.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {classNames.map((team) => (
              <ClassCard key={team} team={team} {...rollupFor(team)} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
            Recent submissions
          </h2>
          <span className="text-xs text-ink-subtle">last 7 days</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-muted">
              No submissions in the last 7 days
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map(({ submission, sprint }) => {
                const assignment = assignmentById.get(submission.assignmentId)
                const entry = rosterByUsername.get(submission.studentUsername)
                const when = new Date(sprint.submittedAt)
                return (
                  <li
                    key={`${submission.id}-${sprint.sprintNumber}`}
                    className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-canvas"
                  >
                    <Avatar
                      name={entry?.rollNo || submission.studentUsername}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {entry?.rollNo || `@${submission.studentUsername}`}
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {entry?.classTeam ? `${entry.classTeam} · ` : ""}
                        {assignment?.title || submission.assignmentId} · Sprint{" "}
                        {sprint.sprintNumber}
                      </p>
                    </div>
                    <span className="text-xs text-ink-subtle">
                      {when.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {when.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <Link
                      href={`/faculty/review?assignmentId=${submission.assignmentId}`}
                      className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium text-accent transition-colors hover:bg-accent-soft"
                    >
                      Review
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
