"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import Avatar from "@/frontend/components/Avatar"
import StatusPill, { type StatusTone } from "@/frontend/components/StatusPill"
import FacultyShell from "@/frontend/components/Faculty/FacultyShell"
import { useSessionUser, type Role } from "@/frontend/hooks/useSessionUser"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import {
  ClipboardIcon,
  GitHubIcon,
  UsersIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@/frontend/components/Icons"
import type { SubmissionWithSprints } from "@/backend/types"

const roleLabels: Record<Role, string> = {
  owner: "Org owner",
  animator: "Animator (all classes)",
  "subject-teacher": "Subject teacher",
  "elective-teacher": "Elective teacher",
  student: "Student",
  unrostered: "Not on roster",
}

const roleDescriptions: Record<Role, string> = {
  owner:
    "Full administrative control over the GitHub organization, student rosters, faculty roles, and project submissions.",
  animator:
    "Institute-wide faculty access to view, manage, and review project submissions across all classes and departments.",
  "subject-teacher":
    "Course teacher access scoped to assigned class sections, assignments, and student reviews.",
  "elective-teacher":
    "Elective course teacher access scoped to elective student batches and submissions.",
  student:
    "Project-based learning student. Projects live in your personal GitHub account and are submitted per sprint.",
  unrostered:
    "Your GitHub account is signed in, but has not yet been matched to a class roster or faculty team.",
}

function ExternalLinkIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function MailIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

export default function Profile() {
  const {
    username,
    role,
    isFaculty,
    isOrgOwner,
    loading: userLoading,
  } = useSessionUser()
  const { submissions: allSubmissions, loading: subsLoading } = useSubmissions()
  const { assignments, loading: assignmentsLoading } = useAssignments()

  // Deduplicate submissions by assignmentId defensively (prefer the one with most sprints / highest progress)
  const studentSubmissions = useMemo(() => {
    const map = new Map<string, SubmissionWithSprints>()
    for (const sub of allSubmissions) {
      const existing = map.get(sub.assignmentId)
      if (!existing) {
        map.set(sub.assignmentId, sub)
      } else {
        const existingSprints = existing.sprints?.length || 0
        const currentSprints = sub.sprints?.length || 0
        if (currentSprints > existingSprints) {
          map.set(sub.assignmentId, sub)
        } else if (currentSprints === existingSprints) {
          if (sub.status === "accepted" && existing.status !== "accepted") {
            map.set(sub.assignmentId, sub)
          }
        }
      }
    }
    return Array.from(map.values())
  }, [allSubmissions])

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
  const [allTeams, setAllTeams] = useState<string[]>([])

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

  // If faculty/animator/owner, load all teams so we can hyperlink all classes
  useEffect(() => {
    if (isFaculty) {
      fetch("/api/org/teams")
        .then((r) => (r.ok ? r.json() : { teams: [] }))
        .then((data) => {
          if (Array.isArray(data?.teams)) {
            setAllTeams(
              data.teams
                .map((t: { name?: string }) => t.name || "")
                .filter(Boolean)
            )
          }
        })
        .catch(() => {})
    }
  }, [isFaculty])

  if (loading || userLoading) {
    const skeleton = (
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-8 animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="size-16 rounded-full bg-border" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded bg-border" />
              <div className="h-4 w-32 rounded bg-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 rounded-xl bg-border" />
            <div className="h-16 rounded-xl bg-border" />
          </div>
        </div>
      </div>
    )

    if (isFaculty) {
      return <FacultyShell>{skeleton}</FacultyShell>
    }
    return <div className="max-w-4xl mx-auto px-4 py-8">{skeleton}</div>
  }

  if (error) {
    const errorBox = (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="rounded-2xl border border-danger bg-danger-soft p-8 text-danger-text">
          <p className="text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-danger shadow-xs hover:bg-canvas"
          >
            Retry
          </button>
        </div>
      </div>
    )

    if (isFaculty) {
      return <FacultyShell>{errorBox}</FacultyShell>
    }
    return <div className="max-w-4xl mx-auto px-4 py-8">{errorBox}</div>
  }

  // Profile Content
  const profileContent = (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="size-16 sm:size-20 shrink-0">
              <Avatar
                name={displayName}
                size="lg"
                image={me?.image ?? undefined}
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
                  {displayName}
                </h1>
                <span className="rounded-full bg-accent-soft px-3 py-0.5 text-xs font-semibold text-accent">
                  {roleLabels[role] || role}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                {username && (
                  <a
                    href={`https://github.com/${username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-accent hover:underline"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    <GitHubIcon className="size-4" />
                    <span>@{username}</span>
                    <ExternalLinkIcon className="size-3 text-ink-faint" />
                  </a>
                )}

                {me?.email && (
                  <a
                    href={`mailto:${me.email}`}
                    className="inline-flex items-center gap-1.5 text-ink-muted hover:text-accent hover:underline"
                  >
                    <MailIcon className="size-3.5" />
                    <span>{me.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {username && (
              <a
                href={`https://github.com/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-canvas px-3.5 text-xs font-medium text-ink transition-colors hover:bg-surface hover:text-accent"
              >
                <GitHubIcon className="size-4" />
                <span>View GitHub Profile</span>
                <ExternalLinkIcon className="size-3" />
              </a>
            )}
            <Link
              href={
                role === "student" || role === "unrostered"
                  ? "/dashboard"
                  : "/faculty"
              }
              className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Dashboard →
            </Link>
          </div>
        </div>

        <p className="mt-4 border-t border-border pt-4 text-xs sm:text-sm text-ink-muted leading-relaxed">
          {roleDescriptions[role]}
        </p>
      </div>

      {/* 2. Metadata Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* GitHub Account Card */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            GitHub Account
          </p>
          <div className="mt-2 flex items-center justify-between">
            {username ? (
              <a
                href={`https://github.com/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm font-semibold text-accent hover:underline flex items-center gap-1"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                @{username}
                <ExternalLinkIcon className="size-3" />
              </a>
            ) : (
              <span className="text-sm text-ink-muted">—</span>
            )}
            <span className="rounded bg-canvas p-1.5 text-ink-muted">
              <GitHubIcon className="size-4" />
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-faint">Verified OAuth Identity</p>
        </div>

        {/* College Email Card */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            College Email
          </p>
          <div className="mt-2 flex items-center justify-between">
            {me?.email ? (
              <a
                href={`mailto:${me.email}`}
                className="truncate text-sm font-semibold text-ink hover:text-accent hover:underline"
              >
                {me.email}
              </a>
            ) : (
              <span className="text-sm text-ink-muted">—</span>
            )}
            <span className="rounded bg-canvas p-1.5 text-ink-muted">
              <MailIcon className="size-4" />
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-faint">Contact & Notifications</p>
        </div>

        {/* Student-specific: Roll No / Class */}
        {role === "student" && (
          <>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                Roll Number
              </p>
              <div className="mt-2">
                <span
                  className="font-mono text-sm font-semibold text-ink"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {me?.rollNo || "—"}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">Institutional Roster ID</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                Class Team
              </p>
              <div className="mt-2">
                {me?.classTeam ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
                  >
                    <span>{me.classTeam}</span>
                    <ArrowRightIcon className="size-3" />
                  </Link>
                ) : (
                  <span className="text-sm text-ink-muted">—</span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-faint">Assigned Section</p>
            </div>
          </>
        )}

        {/* Faculty/Admin: Teaching Role & Scope */}
        {isFaculty && (
          <>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                Teaching Role
              </p>
              <div className="mt-2">
                <span className="text-sm font-semibold text-ink">
                  {roleLabels[role]}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                {role === "owner" ? "Institute Admin" : "Faculty Permissions"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                Teaching Scope
              </p>
              <div className="mt-2">
                {role === "owner" || role === "animator" ? (
                  <Link
                    href="/faculty#classes"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
                  >
                    <span>All Institute Classes</span>
                    <ArrowRightIcon className="size-3" />
                  </Link>
                ) : me?.teacherClasses?.length ? (
                  <span className="text-sm font-semibold text-ink">
                    {me.teacherClasses.length} Scoped Classes
                  </span>
                ) : (
                  <span className="text-sm text-ink-muted">General Access</span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-faint">Active Cohorts</p>
            </div>
          </>
        )}

        {/* Unrostered */}
        {role === "unrostered" && (
          <div className="rounded-2xl border border-caution bg-caution-soft p-5 sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-caution">
              Roster Status
            </p>
            <p className="mt-1 text-sm font-medium text-ink">
              Action Required: Account not onboarded
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Contact your faculty to be matched to your class roster.
            </p>
          </div>
        )}
      </div>

      {/* 3. Role-Specific Main Body */}

      {/* A. STUDENT: Submissions & Projects */}
      {role === "student" && (
        <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-border pb-4">
            <div>
              <h2 className="text-base font-semibold text-ink">
                My Project Submissions
              </h2>
              <p className="text-xs text-ink-muted">
                Sprint submissions, git snapshots, and faculty review notes
              </p>
            </div>
            <Link
              href="/assignments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              <span>View All Assignments</span>
              <ArrowRightIcon className="size-3" />
            </Link>
          </div>

          {subsLoading || assignmentsLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-border" />
              ))}
            </div>
          ) : studentSubmissions.length === 0 ? (
            <div className="rounded-xl border border-border bg-canvas p-8 text-center">
              <ClipboardIcon className="size-8 mx-auto text-ink-faint mb-2" />
              <p className="text-sm font-medium text-ink">No project submissions yet</p>
              <p className="mt-1 text-xs text-ink-muted">
                Create a repo in your GitHub account and submit Sprint 0 to get started.
              </p>
              <Link
                href="/assignments"
                className="mt-4 inline-flex items-center rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover"
              >
                Browse Assignments →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-surface">
              {studentSubmissions.map((submission) => {
                const assignment = assignments.find(
                  (a) => a.id === submission.assignmentId
                )
                const lastSprint =
                  submission.sprints[submission.sprints.length - 1]
                const maxSprints = assignment?.sprintCount ?? 4

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
                  <div
                    key={submission.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-canvas/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/assignments/timeline?assignmentId=${submission.assignmentId}`}
                          className="text-base font-semibold text-ink hover:text-accent hover:underline"
                        >
                          {assignment?.title || submission.assignmentId}
                        </Link>
                        <StatusPill tone={config.tone}>{config.label}</StatusPill>
                        {submission.sprints.some((s) => s.isPivot) && (
                          <StatusPill tone="caution">Pivoted</StatusPill>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                        <span className="font-medium text-ink">
                          {assignment?.subject || "PBL Project"}
                        </span>
                        <span>·</span>
                        <span>
                          {submission.sprints.length === 1 && lastSprint?.sprintNumber === 0
                            ? "Sprint 0 (Abstract) submitted"
                            : `${submission.sprints.length} of ${maxSprints} sprints submitted`}
                        </span>
                        {lastSprint && submission.sprints.length > 1 && (
                          <>
                            <span>·</span>
                            <span>
                              Latest: Sprint {lastSprint.sprintNumber}{" "}
                              {lastSprint.reviewedAt ? "(Reviewed)" : "(Pending review)"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {submission.repoUrl && (
                        <a
                          href={submission.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-canvas px-2.5 py-1.5 font-mono text-xs text-ink-muted hover:border-ink-faint hover:text-ink hover:bg-surface transition-colors"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          <GitHubIcon className="size-3.5" />
                          <span>Repo</span>
                          <ExternalLinkIcon className="size-3" />
                        </a>
                      )}

                      {submission.abstractDocUrl && (
                        <a
                          href={submission.abstractDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-xs text-ink-muted hover:border-ink-faint hover:text-ink hover:bg-surface transition-colors"
                        >
                          <ClipboardIcon className="size-3.5" />
                          <span>Abstract</span>
                          <ExternalLinkIcon className="size-3" />
                        </a>
                      )}

                      <Link
                        href={`/assignments/timeline?assignmentId=${submission.assignmentId}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
                      >
                        <span>Sprint Timeline</span>
                        <ArrowRightIcon className="size-3" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* B. TEACHER: Scoped Classes & Quick Actions */}
      {isFaculty && (role === "subject-teacher" || role === "elective-teacher") && (
        <>
          <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-border pb-4">
              <div>
                <h2 className="text-base font-semibold text-ink">
                  Assigned Classes
                </h2>
                <p className="text-xs text-ink-muted">
                  Sections you are authorized to teach, create assignments for, and review
                </p>
              </div>
              <Link
                href="/faculty#classes"
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <span>View Dashboard</span>
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>

            {me?.teacherClasses && me.teacherClasses.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {me.teacherClasses.map((className) => (
                  <Link
                    key={className}
                    href={`/faculty/class/${encodeURIComponent(className)}`}
                    className="group flex flex-col justify-between rounded-xl border border-border bg-canvas/60 p-4 transition-all hover:border-accent hover:bg-surface hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-lg bg-accent-soft p-2 text-accent">
                          <UsersIcon className="size-4" />
                        </span>
                        <span className="text-xs text-ink-faint group-hover:text-accent transition-colors">
                          Open ›
                        </span>
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                        {className}
                      </h3>
                      <p className="mt-1 text-xs text-ink-muted">
                        Class Dashboard & Assignments
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-ink-muted">
                      <span>Assignments & Reviews</span>
                      <span className="font-semibold text-accent">View →</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-canvas p-6 text-center text-sm text-ink-muted">
                No specific classes scoped to your account yet. Contact an org owner.
              </div>
            )}
          </section>

          {/* Teacher Quick Management Links */}
          <section className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/faculty/review"
              className="group rounded-2xl border border-border bg-surface p-5 transition-all hover:border-accent hover:shadow-xs"
            >
              <div className="size-8 rounded-lg bg-accent-soft flex items-center justify-center text-accent mb-3">
                <CheckCircleIcon className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-ink group-hover:text-accent">
                Review Queue →
              </h3>
              <p className="mt-1 text-xs text-ink-muted">
                Inspect latest student commits, diffs, and record feedback.
              </p>
            </Link>

            <Link
              href="/faculty/roster"
              className="group rounded-2xl border border-border bg-surface p-5 transition-all hover:border-accent hover:shadow-xs"
            >
              <div className="size-8 rounded-lg bg-accent-soft flex items-center justify-center text-accent mb-3">
                <UsersIcon className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-ink group-hover:text-accent">
                Student Roster →
              </h3>
              <p className="mt-1 text-xs text-ink-muted">
                View onboarded students, rolls, and GitHub links.
              </p>
            </Link>

            <Link
              href="/faculty/assignments/new"
              className="group rounded-2xl border border-border bg-surface p-5 transition-all hover:border-accent hover:shadow-xs"
            >
              <div className="size-8 rounded-lg bg-accent-soft flex items-center justify-center text-accent mb-3">
                <ClipboardIcon className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-ink group-hover:text-accent">
                Create Assignment →
              </h3>
              <p className="mt-1 text-xs text-ink-muted">
                Draft new project rubrics and sprint milestones.
              </p>
            </Link>
          </section>
        </>
      )}

      {/* C. ANIMATOR & ORG OWNER: Institute-wide classes & Admin shortcuts */}
      {isFaculty && (role === "owner" || role === "animator") && (
        <>
          <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-border pb-4">
              <div>
                <h2 className="text-base font-semibold text-ink">
                  Institute Classes ({allTeams.length})
                </h2>
                <p className="text-xs text-ink-muted">
                  Unrestricted access to every department cohort and class team
                </p>
              </div>
              <Link
                href="/faculty#classes"
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <span>View Dashboard</span>
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>

            {allTeams.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {allTeams.map((teamName) => (
                  <Link
                    key={teamName}
                    href={`/faculty/class/${encodeURIComponent(teamName)}`}
                    className="group flex flex-col justify-between rounded-xl border border-border bg-canvas/60 p-4 transition-all hover:border-accent hover:bg-surface hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-lg bg-accent-soft p-2 text-accent">
                          <UsersIcon className="size-4" />
                        </span>
                        <span className="text-xs text-ink-faint group-hover:text-accent transition-colors">
                          Open ›
                        </span>
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                        {teamName}
                      </h3>
                      <p className="mt-1 text-xs text-ink-muted">
                        Class Dashboard & Rollups
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-ink-muted">
                      <span>Assignments & Roster</span>
                      <span className="font-semibold text-accent">View →</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-canvas p-6 text-center text-sm text-ink-muted">
                No class teams registered in the organization yet.
              </div>
            )}
          </section>

          {/* Admin Management Hub */}
          <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-base font-semibold text-ink mb-1">
              {role === "owner" ? "Administration Hub" : "Faculty Quick Hub"}
            </h2>
            <p className="text-xs text-ink-muted mb-6">
              Institute-wide controls, role assignments, and review workflows
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {isOrgOwner && (
                <Link
                  href="/faculty/requests"
                  className="group rounded-xl border border-border bg-canvas/50 p-4 transition-all hover:border-accent hover:bg-surface hover:shadow-xs"
                >
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider">
                    Permissions
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-ink group-hover:text-accent">
                    Faculty Access & Roles →
                  </h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    Approve teachers, assign class teams, and manage institute animators.
                  </p>
                </Link>
              )}

              <Link
                href="/faculty/roster?view=onboard"
                className="group rounded-xl border border-border bg-canvas/50 p-4 transition-all hover:border-accent hover:bg-surface hover:shadow-xs"
              >
                <p className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Onboarding
                </p>
                <h3 className="mt-1 text-sm font-semibold text-ink group-hover:text-accent">
                  Onboard Students (CSV) →
                </h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Upload class rosters, auto-match GitHub accounts, and invite students.
                </p>
              </Link>

              <Link
                href="/faculty/review"
                className="group rounded-xl border border-border bg-canvas/50 p-4 transition-all hover:border-accent hover:bg-surface hover:shadow-xs"
              >
                <p className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Grading
                </p>
                <h3 className="mt-1 text-sm font-semibold text-ink group-hover:text-accent">
                  Global Review Queue →
                </h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Review all active and completed sprint submissions across all classes.
                </p>
              </Link>

              <Link
                href="/faculty/assignments/new"
                className="group rounded-xl border border-border bg-canvas/50 p-4 transition-all hover:border-accent hover:bg-surface hover:shadow-xs"
              >
                <p className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Curriculum
                </p>
                <h3 className="mt-1 text-sm font-semibold text-ink group-hover:text-accent">
                  Create Assignment →
                </h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Draft problem statements, sprint milestones, and target classes.
                </p>
              </Link>

              <Link
                href="/faculty/roster"
                className="group rounded-xl border border-border bg-canvas/50 p-4 transition-all hover:border-accent hover:bg-surface hover:shadow-xs"
              >
                <p className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Directory
                </p>
                <h3 className="mt-1 text-sm font-semibold text-ink group-hover:text-accent">
                  Student Roster →
                </h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Browse all active and invited students across every class cohort.
                </p>
              </Link>

              {isOrgOwner && (
                <a
                  href="https://github.com/kristu-jayanti-institute-of-technology"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border border-border bg-canvas/50 p-4 transition-all hover:border-accent hover:bg-surface hover:shadow-xs"
                >
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-1">
                    GitHub Org <ExternalLinkIcon className="size-3" />
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-ink group-hover:text-accent">
                    Organization Settings ↗
                  </h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    Open the institution&apos;s GitHub organization dashboard.
                  </p>
                </a>
              )}
            </div>
          </section>
        </>
      )}

      {/* D. UNROSTERED GUIDANCE */}
      {role === "unrostered" && (
        <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-base font-semibold text-ink mb-1">
            Getting Started on KJIT Classroom
          </h2>
          <p className="text-xs text-ink-muted mb-4">
            Follow these steps to link your account and access class assignments
          </p>

          <ol className="space-y-3 text-sm text-ink-muted">
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                1
              </span>
              <span>
                Share your GitHub username (
                <strong className="text-ink">@{username}</strong>) and your college roll number with your class faculty or lab animator.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                2
              </span>
              <span>
                Your teacher will upload the class roster and send you an invitation to the class GitHub team.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                3
              </span>
              <span>
                Accept the invitation on GitHub. Refresh this page to view your assignments and begin submitting Sprint 0!
              </span>
            </li>
          </ol>
        </section>
      )}

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href={
            role === "student" || role === "unrostered"
              ? "/dashboard"
              : "/faculty"
          }
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        >
          <span>← Back to {isFaculty ? "Faculty Dashboard" : "Dashboard"}</span>
        </Link>
      </div>
    </div>
  )

  if (isFaculty) {
    return <FacultyShell>{profileContent}</FacultyShell>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {profileContent}
    </div>
  )
}
