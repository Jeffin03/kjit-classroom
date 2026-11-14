"use client"

import { useEffect, useState } from "react"
import { XMarkIcon } from "@/frontend/components/Icons"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"

interface CreateSubjectModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialClass?: string
}

interface FacultyOption {
  login: string
  name?: string | null
}

export default function CreateSubjectModal({
  open,
  onClose,
  onSuccess,
  initialClass,
}: CreateSubjectModalProps) {
  const { username, capabilities } = useSessionUser()
  const canCreate = capabilities.includes("assignment.create")

  const [teams, setTeams] = useState<string[]>([])
  const [faculty, setFaculty] = useState<FacultyOption[]>([])

  const [subject, setSubject] = useState("")
  const [selectedClass, setSelectedClass] = useState(initialClass || "")
  const [teacherMode, setTeacherMode] = useState<"self" | "other">("self")
  const [selectedTeacher, setSelectedTeacher] = useState<string>("")
  const [coTeacher, setCoTeacher] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function load() {
      try {
        const [teamsRes, facultyRes] = await Promise.all([
          fetch("/api/org/teams").then((r) => r.json().catch(() => ({ teams: [] }))),
          fetch("/api/org/faculty-members").then((r) =>
            r.ok ? r.json() : { members: [] }
          ),
        ])
        if (cancelled) return
        if (Array.isArray(teamsRes.teams)) {
          setTeams(
            teamsRes.teams
              .map((t: { name?: string }) => t.name)
              .filter(Boolean)
          )
        }
        if (Array.isArray(facultyRes.members)) {
          setFaculty(
            facultyRes.members.map((m: { login: string; name?: string | null }) => ({
              login: m.login,
              name: m.name,
            }))
          )
        }
      } catch {
        /* ignore */
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [open])

  const isValid = () => {
    if (!canCreate) return false
    if (!subject.trim()) return false
    if (!selectedClass) return false
    if (teacherMode === "other" && !selectedTeacher) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid()) return
    setError(null)
    setSubmitting(true)

    try {
      const body: {
        title: string
        description: string
        subject: string
        deadline: string
        problemStatement: string
        assignedTeams: string[]
        createdBy: string
        subjectTeacher?: string
        coTeacher?: string
      } = {
        title: subject.trim(),
        description: `Subject created for ${selectedClass}`,
        subject: subject.trim(),
        deadline: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .slice(0, 10),
        problemStatement: `PBL subject: ${subject.trim()} for class ${selectedClass}.`,
        assignedTeams: [selectedClass],
        createdBy: teacherMode === "self" ? username : selectedTeacher,
        subjectTeacher: teacherMode === "self" ? username : selectedTeacher,
      }

      if (coTeacher.trim()) {
        body.coTeacher = coTeacher.trim()
      }

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || "Failed to create subject")
        return
      }

      setSubmitting(false)
      onClose()
      onSuccess()
    } catch {
      setError("Network error")
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
          <h3 className="text-lg font-semibold text-ink">Create Subject</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-ink-muted hover:bg-canvas hover:text-ink transition-colors"
            aria-label="Close dialog"
          >
            <XMarkIcon className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Subject Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Web Development"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Class Team <span className="text-danger">*</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent-soft"
            >
              <option value="">Select a class</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Subject Teacher
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="teacherMode"
                  value="self"
                  checked={teacherMode === "self"}
                  onChange={() => setTeacherMode("self")}
                  className="text-accent focus:ring-accent"
                />
                <span className="text-sm text-ink">
                  {username ? `Me (@${username})` : "Me (unknown)"}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="teacherMode"
                  value="other"
                  checked={teacherMode === "other"}
                  onChange={() => setTeacherMode("other")}
                />
                <span className="text-sm text-ink">Another teacher</span>
              </label>
              {teacherMode === "other" && (
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent-soft"
                  disabled={teacherMode !== "other"}
                >
                  <option value="">Select a teacher</option>
                  {faculty.map((f) => (
                    <option key={f.login} value={f.login}>
                      {f.name || f.login} (@{f.login})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Co-teacher (optional)
            </label>
            <select
              value={coTeacher}
              onChange={(e) => setCoTeacher(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent-soft"
            >
              <option value="">No co-teacher</option>
              {faculty.map((f) => (
                <option key={`co-${f.login}`} value={f.login}>
                  {f.name || f.login} (@{f.login})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-xs text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-ink-muted hover:bg-canvas disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid() || submitting}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
