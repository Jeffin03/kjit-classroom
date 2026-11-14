"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import Avatar from "@/frontend/components/Avatar"
import Badge from "@/frontend/components/Badge"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import StatusPill, { type StatusTone } from "@/frontend/components/StatusPill"
import type { SubmissionWithSprints } from "@/backend/types"

export default function Profile() {
  const { username, role, isOrgOwner } = useSessionUser()
  const { submissions: allSubmissions, loading: subsLoading } =
    useSubmissions()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const [me, setMe] = useState<{
    name: string | null
    image: string | null
    email: string | null
    rollNo: string | null
    displayName: string | null
    classTeam: string | null
    rosterStatus: string | null
    teacherRole: string | null
    teacherClasses: string[] | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const displayName = me?.displayName || me?.name || username

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/me")
        if (!res.ok) throw new Error("Failed to load profile")
        const data = await res.json()
        if (!cancelled) {
          setMe(data)
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Couldn't load your profile.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 animate-pulse">
          <div className="h-12 w-12 rounded-full bg-[var(--color-border)] mb-3" />
          <div className="h-6 w-48 rounded bg-[var(--color-border)] mb-4" />
          <div className="h-16 w-32 rounded bg-[var(--color-border)]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 sm:p-12">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="h-16 w-16 rounded-full flex items-center justify-center font-semibold text-[var(--color-accent)] bg-[var(--color-accent-soft)]">
            <Avatar name={displayName} size="md" image={me?.image ?? undefined} />
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-ink)]">
            {displayName}
          </h1>
          <p className="text-sm text-[var(--color-ink-muted)]">
            {role === "owner" ? "Org owner" : roleLabels[role]}
          </p>
        </div>

        <dl className="space-y-3">
          <dt className="text-xs font-medium text-[var(--color-ink-muted)] uppercase">
            GitHub account
          </dt>
          <dd className="flex items-center gap-2 text-sm">
            {username ? (
              <span className="font-mono text-[var(--color-ink)]">
                @{username}
              </span>
            ) : (
              <span className="text-[var(--color-ink-muted)]">—</span>
            )}
          </dd>

          {me?.displayName && (
            <>
              <dt className="text-xs font-medium text-[var(--color-ink-muted)] uppercase">
                Display name
              </dt>
              <dd className="text-sm text-[var(--color-ink)]">{me.displayName}</dd>
            </>
          )}

          {me?.rollNo && (
            <>
              <dt className="text-xs font-medium text-[var(--color-ink-muted)] uppercase">
                Roll number
              </dt>
              <dd className="text-sm text-[var(--color-ink)]">{me.rollNo}</dd>
            </>
          )}

          {me?.email && (
            <>
              <dt className="text-xs font-medium text-[var(--color-ink-muted)] uppercase">
                Email
              </dt>
              <dd className="text-sm text-[var(--color-ink)]">
                {me.email}
              </dd>
            </>
          )}

          {me?.classTeam && (
            <>
              <dt className="text-xs font-medium text-[var(--color-ink-muted)] uppercase">
                Class team
              </dt>
              <dd className="text-sm text-[var(--color-ink)]">{me.classTeam}</dd>
            </>
          )}

          {me?.rosterStatus && (
            <>
              <dt className="text-xs font-medium text-[var(--color-ink-muted)] uppercase">
                Roster status
              </dt>
              <dd className="text-sm text-[var(--color-ink)]">
                <Badge status={me.rosterStatus as BadgeStatus} />
              </dd>
            </>
          )}

          {me?.teacherRole && (
            <>
              <dt className="text-xs font-medium text-[var(--color-ink-muted)] uppercase">
                Teaching role
              </dt>
              <dd className="text-sm text-[var(--color-ink)]">
                {roleLabels[me.teacherRole as keyof typeof roleLabels] ||
                  me.teacherRole}
              </dd>
            </>
          )}

          {me?.teacherClasses?.length && (
            <>
              <dt className="text-xs font-medium text-[var(--color-ink-muted)] uppercase">
                Classes
              </dt>
              <dd className="flex flex-wrap gap-1.5 text-sm">
                {me.teacherClasses.map((c) => (
                  <span
                    key={c}
                    className="rounded bg-[var(--color-canvas)] px-2 py-0.5 text-xs text-[var(--color-ink-muted)]"
                  >
                    {c}
                  </span>
                ))}
              </dd>
            </>
          )}

          {isOrgOwner && (
            <>
              <dt className="text-xs font-medium text-[var(--color-ink-muted)] uppercase">
                Organisation
              </dt>
              <dd className="text-sm text-[var(--color-ink)]">
                Org owner — institute-wide access
              </dd>
            </>
          )}
        </dl>

        {role === "student" && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-subtle mb-4">
              Your submissions
            </h2>
            {subsLoading || assignmentsLoading ? (
              <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 animate-pulse">
                <div className="h-4 w-3/4 rounded bg-[var(--color-border)] mb-3" />
                <div className="h-4 w-1/2 rounded bg-[var(--color-border)]" />
              </div>
            ) : allSubmissions.length === 0 ? (
              <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 text-center">
                <p className="text-sm text-ink-muted">
                  No submissions yet. Submit your first sprint from
                  Dashboard → Assignments.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-[var(--color-border)] bg-white">
                {allSubmissions.map((submission) => {
                  const assignment = assignments.find(
                    (a) => a.id === submission.assignmentId
                  )
                  const lastSprint =
                    submission.sprints[submission.sprints.length - 1]
                  const statusConfig: Record<
                    SubmissionWithSprints["status"],
                    { label: string; tone: StatusTone }
                  > = {
                    active: { label: "In progress", tone: "accent" },
                    completed: { label: "Awaiting acceptance", tone: "caution" },
                    accepted: { label: "Accepted", tone: "success" },
                  }
                  const config = statusConfig[submission.status]
                  return (
                    <li
                      key={submission.id}
                      className="px-5 py-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                          {assignment?.title || submission.assignmentId}
                        </p>
                        <p className="truncate text-xs text-ink-muted">
                          {assignment?.subject ||
                            submission.assignmentId} · Sprint {submission.sprints.length}
                          {lastSprint ? ` · ${lastSprint.sprintNumber}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill tone={config.tone}>{config.label}</StatusPill>
                        {submission.repoUrl && (
                          <a
                            href={submission.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:underline font-mono"
                          >
                            Repo
                          </a>
                        )}
                        {submission.abstractDocUrl && (
                          <a
                            href={submission.abstractDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:underline font-mono"
                          >
                            Abstract
                          </a>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}

        <div className="mt-8 flex items-center gap-3">
          <Link
            href={role === "student" || role === "unrostered" ? "/dashboard" : "/faculty"}
            className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-canvas)]"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

type BadgeStatus =
  | "active"
  | "invited"
  | "no-account"
  | "not-started"
  | "submitted"
  | "reviewed"
  | "awaiting"
  | "accepted"

const roleLabels: Record<string, string> = {
  owner: "Org owner",
  animator: "Animator (all classes)",
  "subject-teacher": "Subject teacher",
  "elective-teacher": "Elective teacher",
  student: "Student",
  unrostered: "Not on roster",
}
