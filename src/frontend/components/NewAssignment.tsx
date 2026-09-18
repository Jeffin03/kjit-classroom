"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"

function ListInput({
  label,
  items,
  setter,
  placeholder,
}: {
  label: string
  items: string[]
  setter: React.Dispatch<React.SetStateAction<string[]>>
  placeholder: string
}) {
  const addListItem = () => {
    setter((prev) => [...prev, ""])
  }

  const updateListItem = (index: number, value: string) => {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  const removeListItem = (index: number) => {
    setter((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-ink-muted)] mb-2">
        {label}
      </label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => updateListItem(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
            />
            {items.length > 1 && (
              <button
                onClick={() => removeListItem(i)}
                className="text-[var(--color-ink-faint)] hover:text-[var(--color-danger)] px-2"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => addListItem()}
          className="text-sm text-[var(--color-accent)] hover:underline font-medium"
        >
          + Add more
        </button>
      </div>
    </div>
  )
}

export default function NewAssignment() {
  const router = useRouter()
  const { user, isFaculty, loading: userLoading } = useSessionUser()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [deadline, setDeadline] = useState("")
  const [problemStatement, setProblemStatement] = useState("")
  const [objectives, setObjectives] = useState<string[]>([""])
  const [requirements, setRequirements] = useState<string[]>([""])
  const [evaluationCriteria, setEvaluationCriteria] = useState<string[]>([""])
  const [teams, setTeams] = useState<string[]>([])
  const [assignedTeams, setAssignedTeams] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

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
        if (Array.isArray(data.teams)) setTeams(data.teams)
      })
      .catch(() => {})
  }, [])

  const toggleTeam = (team: string) => {
    setAssignedTeams((prev) =>
      prev.includes(team)
        ? prev.filter((t) => t !== team)
        : [...prev, team]
    )
  }

  const handleSubmit = async () => {
    if (
      !title ||
      !description ||
      !subject ||
      !deadline ||
      !problemStatement ||
      assignedTeams.length === 0
    ) {
      return
    }

    setSubmitting(true)
    setResult(null)

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          subject,
          deadline,
          problemStatement,
          assignedTeams,
          objectives: objectives.filter((o) => o.trim()),
          requirements: requirements.filter((r) => r.trim()),
          evaluationCriteria: evaluationCriteria.filter((c) => c.trim()),
        }),
      })
      const data = await res.json()

      if (res.ok) {
        setResult({
          type: "success",
          message: "Assignment created",
        })
      } else {
        setResult({ type: "error", message: data.error })
      }
    } catch {
      setResult({ type: "error", message: "Network error" })
    } finally {
      setSubmitting(false)
    }
  }

  if (userLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-48" />
          <div className="h-96 bg-[var(--color-border)] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Create Assignment</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-2">
          Set up a 4-sprint PBL assignment for one or more class teams
        </p>
      </div>

      {result && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            result.type === "success"
              ? "bg-[var(--color-success-soft)] text-[var(--color-success)] border border-[var(--color-border)]"
              : "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border border-[var(--color-border)]"
          }`}
        >
          <p>{result.message}</p>
          {result.type === "success" && (
            <div className="mt-3">
              <Link
                href="/faculty/assignments"
                className="text-[var(--color-success)] font-medium underline"
              >
                Back to assignments
              </Link>
            </div>
          )}
        </div>
      )}

      {!result || result.type === "error" ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-7 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-muted)] mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Portfolio Website"
                  className="w-full border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-muted)] mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Web Development"
                  className="w-full border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-muted)] mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the assignment"
                rows={2}
                className="w-full border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-muted)] mb-2">
                  Class Teams *
                </label>
                <div className="space-y-2">
                  {teams.map((team) => (
                    <label
                      key={team}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={assignedTeams.includes(team)}
                        onChange={() => toggleTeam(team)}
                        className="rounded border-[var(--color-border)] accent-[var(--color-accent)] focus:ring-[var(--color-accent-soft)]"
                      />
                      <span className="text-sm text-[var(--color-ink-muted)]">{team}</span>
                    </label>
                  ))}
                  {teams.length === 0 && (
                    <p className="text-sm text-[var(--color-ink-faint)]">
                      No class teams onboarded yet
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-muted)] mb-2">
                  Deadline *
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-muted)] mb-2">
                Problem Statement *
              </label>
              <textarea
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="Detailed problem statement for students"
                rows={4}
                className="w-full border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
              />
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-white p-7 space-y-6">
            <ListInput
              label="Objectives"
              items={objectives}
              setter={setObjectives}
              placeholder="What students will learn"
            />

            <ListInput
              label="Requirements"
              items={requirements}
              setter={setRequirements}
              placeholder="Tech stack or tools required"
            />

            <ListInput
              label="Evaluation Criteria"
              items={evaluationCriteria}
              setter={setEvaluationCriteria}
              placeholder="How students will be graded"
            />
          </div>

          <div className="flex justify-between">
            <Link
              href="/faculty/assignments"
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-medium"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={
                !title ||
                !description ||
                !subject ||
                !deadline ||
                !problemStatement ||
                assignedTeams.length === 0 ||
                submitting
              }
              className="bg-[var(--color-accent)] text-white px-6 py-2 rounded-md font-medium hover:bg-[#372FA8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Assignment"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}