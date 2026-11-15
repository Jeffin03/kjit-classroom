"use client"

import { use, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAssignments } from "@/frontend/hooks/useAssignments"
import { useSubmissions } from "@/frontend/hooks/useSubmissions"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import SprintSubmitForm, {
  type SprintSubmitPayload,
} from "@/frontend/components/Student/SprintSubmitForm"
import type { Team } from "@/backend/types"
import Button from "@/frontend/components/Button"
import { PlusIcon, ArrowRightIcon } from "@/frontend/components/Icons"

type TeammateLookup = {
  rollNo: string
  githubUsername: string
  githubUserId?: number
  collegeEmail?: string
  displayName?: string
  classTeam: string
  status: string
}

type JoinableTeam = {
  id: string
  projectTitle: string
  memberCount: number
  members: {
    username: string
    displayName?: string
    rollNo: string
    isLead: boolean
  }[]
  createdAt: string
}

export default function AssignmentDetailPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = use(routeParams)
  const params = use(searchParams)
  const assignmentId =
    (typeof params.assignmentId === "string" ? params.assignmentId : null) ??
    id ??
    null
  const router = useRouter()
  const { username, isFaculty, loading: userLoading } = useSessionUser()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { submissions, refetch } = useSubmissions()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [joinableTeams, setJoinableTeams] = useState<JoinableTeam[]>([])
  const [joinOpen, setJoinOpen] = useState(false)
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null)
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [createTeamTitle, setCreateTeamTitle] = useState("")
  const [createTeamMembers, setCreateTeamMembers] = useState("")
  const [teammateLookup, setTeammateLookup] = useState<
    Record<string, TeammateLookup | null>
  >({})

  useEffect(() => {
    if (!userLoading && !username) {
      router.push("/")
    } else if (!userLoading && !!username && isFaculty) {
      router.push("/faculty")
    }
  }, [username, isFaculty, userLoading, router])

  const loadTeams = useCallback(async () => {
    if (!assignmentId) {
      setTeamsLoading(false)
      return
    }
    setTeamsLoading(true)
    try {
      const res = await fetch(
        `/api/teams?assignmentId=${encodeURIComponent(assignmentId)}`
      )
      if (!res.ok) throw new Error("Failed to load teams")
      const data = await res.json()
      setTeams(data?.teams || [])
      setJoinableTeams(data?.joinable || [])
    } catch {
      setTeams([])
      setJoinableTeams([])
    } finally {
      setTeamsLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    Promise.resolve().then(() => void loadTeams())
  }, [loadTeams])

  const lookupTeammate = async (rollNo: string) => {
    try {
      const res = await fetch(
        `/api/roster/lookup?rollNo=${encodeURIComponent(rollNo)}`
      )
      if (!res.ok) {
        setTeammateLookup((prev) => ({ ...prev, [rollNo]: null }))
        return
      }
      const data = await res.json()
      setTeammateLookup((prev) => ({ ...prev, [rollNo]: data }))
    } catch {
      setTeammateLookup((prev) => ({ ...prev, [rollNo]: null }))
    }
  }

  const parseRollNumbers = (value: string): string[] => {
    return value
      .split(",")
      .map((m) => m.trim().toUpperCase())
      .filter(Boolean)
  }

  const uniqueRollNos = (() => {
    const seen = new Set<string>()
    return parseRollNumbers(createTeamMembers).filter((r) => {
      if (seen.has(r)) return false
      seen.add(r)
      return true
    })
  })()

  const allTeammatesLookedUp = uniqueRollNos.every(
    (r) => teammateLookup[r] != null
  )

  const assignment = assignments.find((a) => a.id === assignmentId)
  const submission = submissions.find((s) => s.assignmentId === assignmentId)

  if (!userLoading && !assignmentsLoading && !assignmentId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-sm text-[var(--color-ink-muted)]">
        No assignment specified.
      </div>
    )
  }

  if (!userLoading && !assignmentsLoading && !assignment) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-sm text-[var(--color-ink-muted)]">
        Assignment not found.
      </div>
    )
  }

  const currentTeam = teams.find((t) =>
    t.members.some((m) => m.username === username)
  )

  const nextSprintNumber = submission
    ? submission.sprints.length
    : 0

  const handleSubmit = async (payload: SprintSubmitPayload) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      if ("abstractDocUrl" in payload) {
        const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data.error || "Failed to create submission")
        }
        await refetch()
        router.push(`/assignments/${assignmentId}`)
        return
      }

      if (!submission) {
        throw new Error("No submission to attach this sprint to")
      }

      const res = await fetch(`/api/submissions/${submission.id}/sprints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprintNumber: nextSprintNumber,
          repoUrl: payload.repoUrl,
          documentationUrl: payload.documentationUrl,
          summary: payload.summary,
          isPivot: payload.isPivot,
          previousRepoUrl: payload.previousRepoUrl,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit sprint")
      }
      await refetch()
      router.push(`/assignments/${assignmentId}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateTeam = async () => {
    setCreatingTeam(true)
    setSubmitError(null)
    try {
      if (!createTeamTitle.trim()) {
        setSubmitError("Give your project a title")
        setCreatingTeam(false)
        return
      }
      const rollNos = parseRollNumbers(createTeamMembers)
      if (rollNos.length > 2) {
        setSubmitError(
          "Add up to 2 teammates — you're added to the team automatically"
        )
        setCreatingTeam(false)
        return
      }
      const missingLookup = rollNos.filter((r) => !teammateLookup[r])
      if (missingLookup.length > 0) {
        setSubmitError(
          `Please look up roll numbers: ${missingLookup.join(", ")}`
        )
        setCreatingTeam(false)
        return
      }
      // Teammates only — the API adds the creator as the lead.
      const members = rollNos.map((r) => teammateLookup[r]!.githubUsername)
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          projectTitle: createTeamTitle.trim(),
          members,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create team")
      setCreatingTeam(false)
      setCreateTeamTitle("")
      setCreateTeamMembers("")
      setTeammateLookup({})
      await Promise.all([refetch(), loadTeams()])
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create team")
      setCreatingTeam(false)
    }
  }

  const handleJoinTeam = async (team: JoinableTeam) => {
    if (
      !window.confirm(
        `Join "${team.projectTitle}"? You'll work on this team's existing project.`
      )
    ) {
      return
    }
    setJoiningTeamId(team.id)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/teams/${team.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to join team")
      setJoinOpen(false)
      await Promise.all([refetch(), loadTeams()])
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to join team")
    } finally {
      setJoiningTeamId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {!userLoading && assignment ? (
        <>
          <header className="mb-8">
            <Link
              href="/assignments"
              className="inline-flex items-center gap-2 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            >
              <ArrowRightIcon className="size-4 mr-1.5" /> Back to assignments
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              {assignment.title}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {assignment.subject} &middot; Due{" "}
              {new Date(assignment.deadline).toLocaleDateString()}
            </p>
          </header>

          {submitError && (
            <div className="mb-6 rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-danger-text)]">
              {submitError}
            </div>
          )}

          {/* Team section */}
          <section className="mb-8 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                  Team
                </h2>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                  Teams of 1&ndash;3 per assignment. One submission per team.
                </p>
              </div>
            </div>

            {currentTeam ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-border)]/50 bg-[var(--color-canvas)]/50">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent font-medium text-sm">
                    {currentTeam.members[0]?.username.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                      {currentTeam.projectTitle}
                    </p>
                    <p className="text-xs font-mono text-[var(--color-ink-muted)]">
                      {currentTeam.members.map((m) => m.rollNo).join(" &middot; ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {currentTeam.members.map((m) => (
                      <span
                        key={m.username}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[var(--color-border)] bg-white text-xs text-[var(--color-ink-muted)]"
                      >
                        {m.displayName || m.username}
                        {m.isLead && (
                          <span className="text-[var(--color-accent)]">(lead)</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[var(--color-ink-muted)]">
                  Any team member can submit sprints for this team.
                </p>
              </div>
            ) : teamsLoading ? (
              <p className="text-sm text-[var(--color-ink-muted)]">
                Loading your team&hellip;
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[var(--color-ink-muted)]">
                  You need a team before you can submit Sprint 0. Create one or
                  join an existing team.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1.5">
                      Project title
                    </label>
                    <input
                      type="text"
                      value={createTeamTitle}
                      onChange={(e) => setCreateTeamTitle(e.target.value)}
                      placeholder="e.g. Smart Attendance System"
                      maxLength={200}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1.5">
                      Teammate roll numbers (optional, up to 2)
                    </label>
                    <input
                      type="text"
                      value={createTeamMembers}
                      onChange={(e) => {
                        setCreateTeamMembers(e.target.value)
                        const rollNos = parseRollNumbers(e.target.value)
                        rollNos.forEach((r) => {
                          if (!teammateLookup[r]) {
                            lookupTeammate(r)
                          }
                        })
                      }}
                      placeholder="e.g. 25MCAB24, 25MCAB25"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                    />
                    <p className="mt-1.5 text-xs text-[var(--color-ink-faint)]">
                      You ({username}) will be added as the team lead. Leave this
                      empty to work alone.
                    </p>
                    {uniqueRollNos.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {uniqueRollNos.map((r) => {
                          const lookup = teammateLookup[r]
                          if (!lookup) {
                            return (
                              <div key={r} className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                                <span className="font-mono">{r}</span>
                                <span className="text-[var(--color-caution-text)]">Looking up&hellip;</span>
                              </div>
                            )
                          }
                          if (!lookup.githubUsername) {
                            return (
                              <div key={r} className="flex items-center gap-2 text-xs text-[var(--color-caution-text)]">
                                <span className="font-mono">{r}</span>
                                <span>Not found on roster</span>
                              </div>
                            )
                          }
                          return (
                            <div key={r} className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                              <span className="font-mono">{r}</span>
                              <span className="text-[var(--color-ink-muted)]">&middot;</span>
                              <span className="font-medium">{lookup.displayName || lookup.githubUsername}</span>
                              <span className="text-[var(--color-ink-muted)]">({lookup.githubUsername})</span>
                              {lookup.collegeEmail && (
                                <span className="text-[var(--color-ink-muted)] truncate">({lookup.collegeEmail})</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="primary"
                      onClick={handleCreateTeam}
                      disabled={
                        creatingTeam ||
                        !allTeammatesLookedUp ||
                        uniqueRollNos.length > 2
                      }
                      className="w-full min-h-11"
                    >
                      {creatingTeam ? (
                        <span>Creating&hellip;</span>
                      ) : (
                        <>
                          <PlusIcon className="size-4 mr-2" /> Create a new team
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const next = !joinOpen
                        setJoinOpen(next)
                        if (next) void loadTeams()
                      }}
                      className="w-full min-h-11"
                    >
                      <ArrowRightIcon className="size-4 mr-2" /> Join an existing team
                    </Button>
                  </div>

                  {joinOpen && (
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                          Open teams for this assignment
                        </h3>
                        <button
                          type="button"
                          onClick={() => void loadTeams()}
                          className="text-xs text-[var(--color-accent)] hover:underline"
                        >
                          Refresh
                        </button>
                      </div>
                      {teamsLoading ? (
                        <p className="text-sm text-[var(--color-ink-muted)]">
                          Loading teams&hellip;
                        </p>
                      ) : joinableTeams.length === 0 ? (
                        <p className="text-sm text-[var(--color-ink-muted)]">
                          No open teams yet &mdash; create one above, or ask a
                          classmate to add you.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {joinableTeams.map((team) => (
                            <li
                              key={team.id}
                              className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                                  {team.projectTitle}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-[var(--color-ink-muted)]">
                                  {team.memberCount}/3 members &middot;{" "}
                                  {team.members
                                    .map((m) => m.displayName || m.rollNo)
                                    .join(", ")}
                                </p>
                              </div>
                              <Button
                                variant="primary"
                                onClick={() => handleJoinTeam(team)}
                                disabled={joiningTeamId !== null}
                                className="min-h-9 shrink-0 px-4 text-sm"
                              >
                                {joiningTeamId === team.id ? "Joining…" : "Join"}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Sprint submission section */}
          {currentTeam ? (
            <>
              <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-4">
                Submit Sprint {nextSprintNumber}
              </h2>

              {submission && submission.sprints.length > 0 && (
                <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-4">
                  <h3 className="text-sm font-medium text-[var(--color-ink-muted)] mb-3">
                    Sprint History
                  </h3>
                  <div className="space-y-2">
                    {submission.sprints.map((s) => (
                      <div
                        key={s.sprintNumber}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-[var(--color-border)]/50"
                      >
                        <span className="text-xs font-mono text-[var(--color-ink-muted)]">
                          Sprint {s.sprintNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            s.reviewedAt
                              ? "bg-[var(--color-success-soft)] text-[var(--color-success-text)]"
                              : "bg-[var(--color-caution-soft)] text-[var(--color-caution-text)]"
                          }`}
                        >
                          {s.reviewedAt ? "Reviewed" : "Pending"}
                        </span>
                        {s.sprintNumber === 0 && (
                          <span className="ml-auto text-xs text-[var(--color-ink-muted)]">
                            Abstract & Setup
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <SprintSubmitForm
                assignment={assignment}
                submission={submission}
                sprintNumber={nextSprintNumber}
                onSubmit={handleSubmit}
                loading={submitting}
                error={submitError}
                teams={teams}
              />

              {submission &&
                submission.sprints.length > 0 &&
                submission.sprints.at(-1)?.reviewedAt && (
                  <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-3">
                      Next Sprint
                    </h3>
                    <p className="text-sm text-[var(--color-ink-muted)] mb-4">
                      Sprint {submission.sprints.length} has been reviewed. Start
                      Sprint {submission.sprints.length} when you&rsquo;re ready.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => {
                        router.push(`/assignments/${assignmentId}`)
                      }}
                      className="w-full min-h-11"
                    >
                      <ArrowRightIcon className="size-4 mr-2" />
                      Start Sprint {submission.sprints.length}
                    </Button>
                  </div>
                )}
              </>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
