"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useMemo } from "react"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import AnnouncementModule from "@/frontend/components/AnnouncementModule"
import Button from "@/frontend/components/Button"
import KpiCard from "@/frontend/components/KpiCard"
import { AssignmentCard } from "@/frontend/components/AssignmentCard"
import type { BadgeStatus } from "@/frontend/components/Badge"
import {
  CheckCircleIcon,
  ClipboardIcon,
  EyeIcon,
  UsersIcon,
} from "@/frontend/components/Icons"
import type { Assignment, SubmissionWithSprints } from "@/backend/types"

const DAY = 24 * 60 * 60 * 1000

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function assignmentStatus(
  submission: SubmissionWithSprints | undefined
): { status: BadgeStatus; progress: number } {
  if (!submission) return { status: "not-started", progress: 0 }

  const progress = submission.sprints.length
  if (submission.status === "accepted") return { status: "accepted", progress }

  const latest = submission.sprints.at(-1)
  if (latest?.reviewedAt) return { status: "reviewed", progress }
  if (latest) return { status: "submitted", progress }
  return { status: "in-progress", progress }
}

function formatDue(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function Dashboard() {
  const router = useRouter()
  const { user, username, role, team, loading: userLoading } = useSessionUser()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { submissions, loading: submissionsLoading } = useSubmissions()

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/")
    }
  }, [user, userLoading, router])

  const loading = userLoading || assignmentsLoading || submissionsLoading

  const submissionFor = useMemo(() => {
    const map = new Map<string, SubmissionWithSprints>()
    submissions.forEach((submission) => map.set(submission.assignmentId, submission))
    return map
  }, [submissions])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-5 sm:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-border" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-border" />
            ))}
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-border" />
              ))}
            </div>
            <div className="h-72 rounded-2xl bg-border" />
          </div>
        </div>
      </div>
    )
  }

  if (role === "unrostered") {
    return (
      <div className="mx-auto max-w-2xl p-5 sm:p-8">
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-canvas text-ink-faint">
            <UsersIcon className="size-6" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold">
            You are not on the class roster yet.
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            Ask your class teacher to onboard you — assignments and submissions
            show up here as soon as you are added.
          </p>
          {username && (
            <p className="mt-3 text-xs text-ink-faint">Signed in as {username}</p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Check again
            </Button>
            <Button variant="ghost" onClick={() => router.push("/")}>
              Back to home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const active = submissions.filter((s) => s.status === "active")
  const accepted = submissions.filter((s) => s.status === "accepted")
  const feedbackCount = submissions.reduce(
    (total, s) => total + s.sprints.filter((sprint) => sprint.reviewNotes).length,
    0
  )
  const activeSubjects = new Set(
    active
      .map((s) => assignments.find((a) => a.id === s.assignmentId)?.subject)
      .filter(Boolean)
  ).size

  const now = new Date().getTime()
  const upcoming = assignments
    .filter(
      (a) =>
        new Date(a.deadline).getTime() >= now &&
        submissionFor.get(a.id)?.status !== "accepted"
    )
    .sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    )
  const dueSoon = upcoming.filter(
    (a) => new Date(a.deadline).getTime() - now <= 7 * DAY
  )

  const grouped = assignments.reduce<Record<string, Assignment[]>>((acc, item) => {
    ;(acc[item.subject] ||= []).push(item)
    return acc
  }, {})

  const firstName = (user?.name || username || "").split(" ")[0]

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{team ?? "Your class"}</p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active projects"
          value={active.length}
          hint={active.length ? `in ${activeSubjects} subjects` : "nothing open yet"}
          tone="accent"
          icon={<ClipboardIcon className="size-4" />}
          onClick={() => router.push("/assignments")}
        />
        <KpiCard
          label="Due soon"
          value={dueSoon.length}
          hint={dueSoon[0]?.title ?? "next 7 days"}
          tone={dueSoon.length ? "caution" : "neutral"}
          icon={<ClipboardIcon className="size-4" />}
          onClick={() => router.push("/assignments")}
        />
        <KpiCard
          label="Review feedback"
          value={feedbackCount}
          hint="notes from faculty"
          tone="accent"
          icon={<EyeIcon className="size-4" />}
          to="/assignments"
        />
        <KpiCard
          label="Accepted projects"
          value={accepted.length}
          hint="done and signed off"
          tone="success"
          icon={<CheckCircleIcon className="size-4" />}
          to="/assignments"
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-9 lg:col-span-2">
          {Object.entries(grouped).map(([subject, items]) => (
            <section key={subject}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                  {subject}
                </h2>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-4">
                {items.map((assignment) => {
                  const submission = submissionFor.get(assignment.id)
                  const { status, progress } = assignmentStatus(submission)
                  const deadline = new Date(assignment.deadline)
                  return (
                    <AssignmentCard
                      key={assignment.id}
                      subject={assignment.subject}
                      title={assignment.title}
                      description={assignment.description}
                      deadlineDate={formatDue(deadline)}
                      isPastDeadline={
                        deadline < new Date() &&
                        !assignment.allowLateSubmissions
                      }
                      status={status}
                      progress={progress}
                      href={
                        submission
                          ? `/assignments/timeline?assignmentId=${assignment.id}`
                          : `/assignments/submit?assignmentId=${assignment.id}&sprint=0`
                      }
                      primaryAction={
                        submission ? "View timeline →" : "Start Sprint 0 →"
                      }
                    />
                  )
                })}
              </div>
            </section>
          ))}

          {assignments.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <p className="text-sm text-ink-muted">No assignments available yet</p>
            </div>
          )}
        </div>

        <aside className="order-first space-y-4 lg:order-none">
          <AnnouncementModule />
          {upcoming[0] && (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                Up next
              </p>
              <p className="mt-4 font-mono text-xs text-caution">
                {new Date(upcoming[0].deadline)
                  .toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                  .toUpperCase()}
              </p>
              <h3 className="mt-2 font-semibold">{upcoming[0].title}</h3>
              <p className="mt-1 text-sm text-ink-muted">
                {submissionFor.get(upcoming[0].id)
                  ? "Your next sprint is waiting."
                  : "Start Sprint 0 while the deadline is open."}
              </p>
              <Link
                href={
                  submissionFor.get(upcoming[0].id)
                    ? `/assignments/timeline?assignmentId=${upcoming[0].id}`
                    : `/assignments/submit?assignmentId=${upcoming[0].id}&sprint=0`
                }
                className="mt-5 flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Open assignment
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
