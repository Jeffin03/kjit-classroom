"use client"

import FacultyPageHeader from "./FacultyPageHeader"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Button from "@/frontend/components/Button"
import Avatar from "@/frontend/components/Avatar"
import type { TeacherProfile } from "@/backend/types"

interface TeacherRequest {
  id: string
  githubUsername: string
  email: string
  classes: string[]
  requestedAt: string
}

type GrantableRole = "animator" | "subject-teacher" | "elective-teacher"

const ROLE_LABELS: Record<GrantableRole, string> = {
  animator: "Animator",
  "subject-teacher": "Subject Teacher",
  "elective-teacher": "Elective Teacher",
}

const GRANTABLE_ROLES = Object.keys(ROLE_LABELS) as GrantableRole[]

export default function FacultyRequests() {
  const { status } = useSession()
  const router = useRouter()

  const [requests, setRequests] = useState<TeacherRequest[]>([])
  const [teachers, setTeachers] = useState<TeacherProfile[]>([])
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, GrantableRole>>({})
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null)

  // Add Faculty Modal state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [facultyMembers, setFacultyMembers] = useState<Array<{ login: string; email?: string | null; avatar?: string | null }>>([])
  const [newUsername, setNewUsername] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<GrantableRole>("subject-teacher")
  const [newClasses, setNewClasses] = useState<string[]>([])
  const [addingFaculty, setAddingFaculty] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!addModalOpen) return
    let cancelled = false
    async function loadFaculty() {
      try {
        const res = await fetch("/api/org/faculty-members")
        const data = await res.json().catch(() => ({ members: [] }))
        if (cancelled) return
        setFacultyMembers(data.members || [])
      } catch { /* ignore */ }
    }
    loadFaculty()
    return () => { cancelled = true }
  }, [addModalOpen])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [reqRes, teamsRes] = await Promise.all([
          fetch("/api/requests"),
          fetch("/api/org/teams"),
        ])
        const data = await reqRes.json().catch(() => ({}))
        const teamsData = await teamsRes.json().catch(() => ({}))

        if (cancelled) return

        if (reqRes.ok) {
          setRequests(data.requests || [])
          setTeachers(data.teachers || [])
        } else {
          setLoadError(
            reqRes.status === 403
              ? "Only org owners can manage faculty access."
              : data.error || "Failed to load requests."
          )
        }

        if (teamsRes.ok && Array.isArray(teamsData.teams)) {
          setAvailableTeams(
            teamsData.teams
              .map((t: { name?: string }) => t.name || "")
              .filter(Boolean)
          )
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const refetch = () => setRefreshKey((k) => k + 1)

  const handleAction = async (
    githubUsername: string,
    action: "approve" | "deny"
  ) => {
    setProcessing(githubUsername)
    setMessage(null)
    try {
      const res = await fetch("/api/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername,
          action,
          ...(action === "approve"
            ? { role: selectedRoles[githubUsername] ?? "animator" }
            : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMessage({ tone: "error", text: data.error || "Request failed" })
        return
      }

      if (data.warnings?.length) {
        setMessage({
          tone: "error",
          text: `Approved, but some team grants failed: ${data.warnings.join("; ")}`,
        })
      } else if (action === "approve") {
        setMessage({
          tone: "success",
          text: `@${githubUsername} approved as ${ROLE_LABELS[(data.role as GrantableRole) ?? "animator"]}.`,
        })
      }

      setRequests((prev) => prev.filter((r) => r.githubUsername !== githubUsername))
      if (action === "deny") {
        setMessage({
          tone: "success",
          text: `Denied @${githubUsername}.`,
        })
      }
      refetch()
    } catch {
      setMessage({ tone: "error", text: "Network error" })
    } finally {
      setProcessing(null)
    }
  }

  const handleRemoveTeacher = async (githubUsername: string) => {
    if (!confirm(`Are you sure you want to remove @${githubUsername} from faculty?`)) {
      return
    }
    setProcessing(githubUsername)
    setMessage(null)
    try {
      const res = await fetch(`/api/requests?username=${encodeURIComponent(githubUsername)}`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({ tone: "error", text: data.error || "Failed to remove teacher" })
        return
      }
      const warningText = data.warnings?.length
        ? ` ${data.warnings.join("; ")}`
        : ""
      const removedFromClassTeams: string[] = data.removedFromClassTeams ?? []
      setMessage({
        tone: data.stillInFacultyTeam ? "error" : "success",
        text:
          (data.message || `@${githubUsername} removed from faculty.`) +
          warningText +
          (removedFromClassTeams.length > 0
            ? ` Removed from class teams: ${removedFromClassTeams.join(", ")}.`
            : ""),
      })
      refetch()
    } catch {
      setMessage({ tone: "error", text: "Network error" })
    } finally {
      setProcessing(null)
    }
  }

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUsername.trim()) return

    setAddingFaculty(true)
    setMessage(null)
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername: newUsername.trim(),
          email: newEmail.trim(),
          role: newRole,
          classes: newClasses,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({ tone: "error", text: data.error || "Failed to add faculty member" })
        return
      }

      const warnings: string[] = data.warnings ?? []
      setMessage(
        warnings.length > 0
          ? {
              tone: "error",
              text: `@${newUsername} added as ${ROLE_LABELS[newRole]}, but: ${warnings.join("; ")}`,
            }
          : {
              tone: "success",
              text: `@${newUsername} added as ${ROLE_LABELS[newRole]}.`,
            }
      )
      setAddModalOpen(false)
      setNewUsername("")
      setNewEmail("")
      setNewClasses([])
      refetch()
    } catch {
      setMessage({ tone: "error", text: "Network error" })
    } finally {
      setAddingFaculty(false)
    }
  }

  const toggleClass = (cls: string) => {
    setNewClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    )
  }

  if (status === "loading" || loading) {
    return (
      <div className="max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-64" />
          <div className="space-y-3 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[var(--color-border)] rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-4xl space-y-8">
        <FacultyPageHeader
          title="Faculty & Access"
          subtitle="Manage faculty members and approve teaching roles"
          action={
            <Button onClick={() => setAddModalOpen(true)}>
              + Add Faculty Member
            </Button>
          }
        />

        {message && (
          <div
            className={`rounded-md border px-4 py-3 ${
              message.tone === "error"
                ? "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                : "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]"
            }`}
          >
            <p className="text-sm break-words">{message.text}</p>
          </div>
        )}

        {loadError ? (
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-center">
            <h2 className="text-lg font-medium text-[var(--color-ink)] mb-1">
              Access management unavailable
            </h2>
            <p className="text-sm text-[var(--color-ink-muted)]">{loadError}</p>
          </div>
        ) : (
          <>
            {/* Section 1: Pending Requests */}
            <div>
              <h2 className="text-lg font-semibold text-ink mb-3">
                Pending Requests ({requests.length})
              </h2>

              {requests.length === 0 ? (
                <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-ink-muted">
                  No pending access requests.
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div
                      key={request.githubUsername}
                      className="rounded-2xl border border-border bg-surface p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar name={request.githubUsername} size="md" />
                          <div>
                            <div className="font-medium text-[var(--color-ink)]">
                              <span
                                className="font-mono text-sm"
                                style={{ fontFamily: "var(--font-mono)" }}
                              >
                                @{request.githubUsername}
                              </span>
                            </div>
                            <div className="text-sm text-[var(--color-ink-muted)]">
                              {request.email}
                            </div>
                            <div className="text-xs text-[var(--color-ink-faint)] mt-1">
                              Requested {new Date(request.requestedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <label className="text-xs text-[var(--color-ink-muted)]">
                            Grant role
                            <select
                              value={selectedRoles[request.githubUsername] ?? "animator"}
                              onChange={(e) =>
                                setSelectedRoles((prev) => ({
                                  ...prev,
                                  [request.githubUsername]: e.target.value as GrantableRole,
                                }))
                              }
                              disabled={processing === request.githubUsername}
                              className="mt-1 block rounded-md border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm text-[var(--color-ink)] disabled:opacity-50"
                            >
                              {GRANTABLE_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleAction(request.githubUsername, "approve")
                              }
                              disabled={processing === request.githubUsername}
                              className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
                            >
                              {processing === request.githubUsername
                                ? "..."
                                : "Approve"}
                            </button>
                            <button
                              onClick={() =>
                                handleAction(request.githubUsername, "deny")
                              }
                              disabled={processing === request.githubUsername}
                              className="bg-white border border-[var(--color-border)] text-[var(--color-ink-muted)] px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--color-canvas)] transition-colors disabled:opacity-50"
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-sm text-[var(--color-ink-muted)] mb-2">
                          Requested classes:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {request.classes.map((className) => (
                            <span
                              key={className}
                              className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent"
                            >
                              {className}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Active Faculty Members */}
            <div>
              <h2 className="text-lg font-semibold text-ink mb-3">
                Active Faculty Members ({teachers.length})
              </h2>

              {teachers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-ink-muted">
                  No faculty members added yet. Click &quot;Add Faculty Member&quot; above to enroll teachers.
                </div>
              ) : (
                <div className="divide-y divide-border rounded-2xl border border-border bg-surface overflow-hidden">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.githubUsername}
                      className="p-5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={teacher.githubUsername} size="sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-ink">
                              @{teacher.githubUsername}
                            </span>
                            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                              {ROLE_LABELS[teacher.role as GrantableRole] || teacher.role}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {teacher.classes?.length ? (
                              teacher.classes.map((c) => (
                                <span
                                  key={c}
                                  className="rounded bg-canvas px-2 py-0.5 text-xs text-ink-muted"
                                >
                                  {c}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-ink-faint">
                                {teacher.role === "animator"
                                  ? "All classes (unrestricted)"
                                  : "No classes assigned — cannot see any class yet"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        onClick={() => handleRemoveTeacher(teacher.githubUsername)}
                        disabled={processing === teacher.githubUsername}
                        className="text-xs text-danger hover:bg-danger-soft"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Faculty Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl border border-border">
            <h3 className="text-lg font-semibold text-ink">Add Faculty Member</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Grant a teacher dashboard access and assign class teams.
            </p>

            <form onSubmit={handleAddFaculty} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">
                  Faculty Member *
                </label>
                <select
                  required
                  value={newUsername}
                  onChange={(e) => {
                    const login = e.target.value
                    setNewUsername(login)
                    const member = facultyMembers.find((m) => m.login.toLowerCase() === login.toLowerCase())
                    setNewEmail(member?.email ?? "")
                  }}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-accent bg-white"
                >
                  <option value="">Select faculty member...</option>
                  {facultyMembers.map((m) => (
                    <option key={m.login} value={m.login}>
                      {m.login} {m.email ? `— ${m.email.length > 30 ? m.email.slice(0, 30) + "…" : m.email}` : ""}
                    </option>
                  ))}
                </select>
                {facultyMembers.length === 0 && (
                  <p className="text-xs text-ink-faint mt-1">No faculty team members found. Ensure the faculty team is configured.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  placeholder="teacher@kristujayanti.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">
                  Teaching Role *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as GrantableRole)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-accent"
                >
                  {GRANTABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">
                  Assigned Classes
                </label>
                {availableTeams.length === 0 ? (
                  <p className="text-xs text-ink-faint">
                    No teams found in organization.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded-lg">
                    {availableTeams.map((team) => (
                      <button
                        key={team}
                        type="button"
                        onClick={() => toggleClass(team)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          newClasses.includes(team)
                            ? "bg-accent text-white"
                            : "bg-canvas text-ink-muted hover:bg-border"
                        }`}
                      >
                        {team}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  disabled={addingFaculty}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={addingFaculty}>
                  Save Faculty Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
