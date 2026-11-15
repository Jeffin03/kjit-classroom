"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import Button from "@/frontend/components/Button"
import ConfirmModal from "@/frontend/components/ConfirmModal"
import { PlusIcon, ArrowRightIcon, UsersIcon, TrashIcon } from "@/frontend/components/Icons"
import type { Team } from "@/backend/types"

/** Mobile-first team management: create, join, view, leave teams. */
export default function TeamManager() {
  const { username } = useSessionUser()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [leavingId, setLeavingId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  // Form state
  const [assignmentId, setAssignmentId] = useState("")
  const [projectTitle, setProjectTitle] = useState("")
  const [member1, setMember1] = useState(username || "")
  const [member2, setMember2] = useState("")
  const [member3, setMember3] = useState("")
  const [joinTeamId, setJoinTeamId] = useState("")
  const [joinRollNo, setJoinRollNo] = useState("")

  const currentTeam = teams.find((t) =>
    t.members.some((m) => m.username === username)
  )

  const refetch = () => {
    fetch("/api/teams")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load teams")
        return res.json()
      })
      .then((data) => setTeams(data?.teams || []))
      .catch(() => setError("Couldn't load your teams. Try again."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refetch()
  }, [])

  const memberUsernames = () =>
    [member1, member2, member3].filter(Boolean).map((u) => u.trim())

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const members = memberUsernames()
      if (members.length < 1 || members.length > 3) {
        setError("Add between 1 and 3 teammates")
        return
      }
      if (!members.includes(username || "")) {
        setError("You must include yourself in the team")
        return
      }
      if (!assignmentId) {
        setError("Select an assignment")
        return
      }
      if (!projectTitle.trim()) {
        setError("Give your project a title")
        return
      }

      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          projectTitle: projectTitle.trim(),
          members,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create team")

      setCreateOpen(false)
      setAssignmentId("")
      setProjectTitle("")
      setMember1(username || "")
      setMember2("")
      setMember3("")
      refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team")
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoining(true)
    setError(null)
    try {
      const res = await fetch(`/api/teams/${joinTeamId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          rollNo: joinRollNo,
          consentToExistingProject: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to join team")

      setJoinOpen(false)
      setJoinTeamId("")
      setJoinRollNo("")
      refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join team")
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!leavingId) return
    try {
      const res = await fetch(`/api/teams/${leavingId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to leave team")
      }
      setLeavingId(null)
      refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave team")
      setLeavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-border" />
          <div className="h-56 w-full rounded-2xl bg-border" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-6 sm:py-10">
      <header className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Your Team</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Teams of 1–3. One submission per team — anyone can submit.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-danger-text)]">
          {error}
        </div>
      )}

      {/* Current team card */}
      {currentTeam ? (
        <section className="mb-8 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                {currentTeam.projectTitle}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Status: {currentTeam.status.charAt(0).toUpperCase() + currentTeam.status.slice(1)}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              currentTeam.status === "accepted"
                ? "bg-[var(--color-success-soft)] text-[var(--color-success-text)] border border-[var(--color-success)]/20"
                : currentTeam.status === "submitted"
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)] border border-[var(--color-accent)]/20"
                  : currentTeam.status === "rejected"
                    ? "bg-[var(--color-danger-soft)] text-[var(--color-danger-text)] border border-[var(--color-danger)]/20"
                    : "bg-[var(--color-canvas)] text-[var(--color-ink-muted)] border border-[var(--color-border)]"
            }`}>
              {currentTeam.status.charAt(0).toUpperCase() + currentTeam.status.slice(1)}
            </span>
          </div>

          <div className="space-y-3">
            {currentTeam.members.map((m) => (
              <div
                key={m.username}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--color-border)]/50 bg-[var(--color-canvas)]/50"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-border)] text-[var(--color-ink-muted)] font-medium text-sm">
                  {m.username.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">
                    {m.displayName || m.username}
                  </p>
                  <p className="text-xs font-mono text-ink-muted truncate">
                    {m.rollNo} {m.isLead ? "· Lead" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href={`/assignments/timeline?assignmentId=${currentTeam.assignmentId}`}
              className="flex min-h-10 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Open project timeline <ArrowRightIcon className="size-4" />
            </Link>
            <button
              type="button"
              onClick={() => setLeavingId(currentTeam.id)}
              className="flex min-h-10 items-center justify-center rounded-lg border border-[var(--color-danger)] px-4 text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors"
            >
              <TrashIcon className="size-4 mr-1.5" /> Leave team
            </button>
          </div>
        </section>
      ) : (
        <section className="mb-8 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <UsersIcon className="size-5 text-ink-muted" />
            <span className="text-sm font-medium text-ink-muted">No team yet</span>
          </div>
          <p className="text-sm text-ink-muted mb-6">
            Create a team or join an existing one before submitting Sprint 0.
          </p>
          <Button
            variant="primary"
            onClick={() => setCreateOpen(true)}
            className="w-full min-h-11"
          >
            <PlusIcon className="size-4 mr-2" /> Create a team
          </Button>
          <Button
            variant="outline"
            onClick={() => setJoinOpen(true)}
            className="w-full min-h-11 mt-3"
          >
            <ArrowRightIcon className="size-4 mr-2" /> Join a team
          </Button>
        </section>
      )}

      {/* Create team modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={() => setCreateOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-team-title"
            className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl"
          >
            <h2 id="create-team-title" className="text-lg font-semibold text-ink mb-1">
              Create a team
            </h2>
            <p className="mt-1 mb-5 text-sm text-ink-muted">
              Pick your assignment, give the project a title, and add teammates.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  Assignment
                </label>
                <select
                  value={assignmentId}
                  onChange={(e) => setAssignmentId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
                  required
                >
                  <option value="">Select an assignment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  Project title
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Smart Attendance System"
                  maxLength={200}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  Teammates (max 3 total, including you)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={member1}
                    onChange={(e) => setMember1(e.target.value)}
                    placeholder="Your GitHub username"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
                    required
                  />
                  <input
                    type="text"
                    value={member2}
                    onChange={(e) => setMember2(e.target.value)}
                    placeholder="Teammate 2 (optional)"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
                  />
                  <input
                    type="text"
                    value={member3}
                    onChange={(e) => setMember3(e.target.value)}
                    placeholder="Teammate 3 (optional)"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
                  />
                </div>
                <p className="mt-1 text-xs text-ink-faint">
                  Teammates must already be on the class roster.
                </p>
              </div>

              {error && (
                <p className="text-xs text-[var(--color-danger-text)]">{error}</p>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={creating} loading={creating}>
                  {creating ? "Creating…" : "Create team"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join team modal */}
      {joinOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={() => setJoinOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-team-title"
            className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl"
          >
            <h2 id="join-team-title" className="text-lg font-semibold text-ink mb-1">
              Join a team
            </h2>
            <p className="mt-1 mb-5 text-sm text-ink-muted">
              Ask a teammate for the team ID, then enter it here along with your roll number.
            </p>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  Team ID
                </label>
                <input
                  type="text"
                  value={joinTeamId}
                  onChange={(e) => setJoinTeamId(e.target.value)}
                  placeholder="team-xxxx"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  Your roll number
                </label>
                <input
                  type="text"
                  value={joinRollNo}
                  onChange={(e) => setJoinRollNo(e.target.value)}
                  placeholder="e.g. 25MCAB24"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
                  required
                />
              </div>

              {error && (
                <p className="text-xs text-[var(--color-danger-text)]">{error}</p>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setJoinOpen(false)}
                  disabled={joining}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={joining} loading={joining}>
                  {joining ? "Joining…" : "Join team"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave confirmation modal */}
      <ConfirmModal
        open={!!leavingId}
        title="Leave this team?"
        body="You will be removed from the team. Any submission already made stays attached to the team."
        confirmLabel="Leave"
        busy={false}
        onConfirm={handleLeave}
        onCancel={() => setLeavingId(null)}
      />
    </div>
  )
}
