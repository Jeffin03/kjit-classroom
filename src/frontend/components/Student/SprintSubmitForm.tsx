"use client"

import { useState } from "react"
import Link from "next/link"
import type { Assignment, SubmissionWithSprints } from "@/backend/types"

export interface Sprint0Payload {
  assignmentId: string
  repoUrl: string
  abstractDocUrl: string
}

export interface SprintNPayload {
  repoUrl: string
  documentationUrl: string
  summary: {
    completed: string[]
    changed: string
    blockers: string
    demoUrl?: string
  }
  isPivot: boolean
  previousRepoUrl?: string
}

export type SprintSubmitPayload = Sprint0Payload | SprintNPayload

export default function SprintSubmitForm({
  assignment,
  submission,
  sprintNumber,
  onSubmit,
  loading,
  error,
}: {
  assignment: Assignment
  submission?: SubmissionWithSprints
  sprintNumber: number
  onSubmit: (payload: SprintSubmitPayload) => void
  loading?: boolean
  error?: string | null
}) {
  const isSprint0 = sprintNumber === 0

  const [repoUrl, setRepoUrl] = useState(submission?.repoUrl || "")
  const [pivotRepoUrl, setPivotRepoUrl] = useState("")
  const [abstractDocUrl, setAbstractDocUrl] = useState("")
  const [documentationUrl, setDocumentationUrl] = useState(
    isSprint0 ? "" : submission?.sprints[sprintNumber - 1]?.documentationUrl || ""
  )
  const [completed, setCompleted] = useState<string[]>([])
  const [completedInput, setCompletedInput] = useState("")
  const [changed, setChanged] = useState("")
  const [blockers, setBlockers] = useState("")
  const [demoUrl, setDemoUrl] = useState("")
  const [isPivot, setIsPivot] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)

  const addCompleted = () => {
    const value = completedInput.trim()
    if (!value) return
    setCompleted([...completed, value])
    setCompletedInput("")
  }

  const removeCompleted = (idx: number) => {
    setCompleted(completed.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSprint0) {
      if (!repoUrl || !abstractDocUrl) {
        setClientError("Please fill in the repository URL and abstract link")
        return
      }
      onSubmit({
        assignmentId: assignment.id,
        repoUrl,
        abstractDocUrl,
      })
      return
    }

    const effectiveRepoUrl = isPivot ? pivotRepoUrl : submission?.repoUrl
    if (!effectiveRepoUrl) {
      setClientError("Please provide the repository URL")
      return
    }
    if (!documentationUrl) {
      setClientError("Please provide a documentation link")
      return
    }
    setClientError(null)
    onSubmit({
      repoUrl: effectiveRepoUrl,
      documentationUrl,
      summary: {
        completed,
        changed,
        blockers,
        demoUrl: demoUrl || undefined,
      },
      isPivot,
      previousRepoUrl: submission?.repoUrl,
    })
  }

  const inputClass =
    "w-full min-h-10 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]"
  const labelClass = "block text-sm font-medium text-[var(--color-ink-muted)] mb-2"

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          {isSprint0 ? "Submit Project — Sprint 0" : `Submit Sprint ${sprintNumber}`}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          {isSprint0
            ? "Set up your project repository and submit your abstract"
            : `${assignment.title} · ${assignment.subject}`}
        </p>
      </div>

      {isSprint0 ? (
        <div className="mb-6 rounded-xl border-l-4 border-accent bg-accent-soft p-5 text-sm leading-6 text-ink-muted">
          <strong className="text-ink">How this works</strong> — Create a{" "}
          <em>new repository in your own GitHub account</em>, paste its URL
          below, and attach your abstract doc. No fork, no pull request:
          faculty review a snapshot of your commit.
        </div>
      ) : (
        <div className="mb-6 rounded-xl border-l-4 border-accent bg-accent-soft p-5 text-sm leading-6 text-ink-muted">
          Submitting Sprint {sprintNumber}. We&apos;ll snapshot your
          repo&apos;s latest commit — you don&apos;t copy any hash by hand.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 space-y-6">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--color-ink)] mb-4">
            {isSprint0 ? "Project Repository" : "Repository"}
          </h2>

          <div>
            <label className={labelClass}>
              Your repository URL{isSprint0 && " *"}
            </label>
            <input
              type="url"
              className={inputClass}
              placeholder="https://github.com/your-username/your-project"
              value={isSprint0 ? repoUrl : submission?.repoUrl ?? ""}
              onChange={(e) => isSprint0 && setRepoUrl(e.target.value)}
              readOnly={!isSprint0}
              required
            />
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {isSprint0
                ? "Must be a repo you own — not a fork, not an org template."
                : "Your project repository — tick pivot below to switch"}
            </p>
          </div>

          {isSprint0 ? (
            <div>
              <label className={labelClass}>Abstract / synopsis link *</label>
              <input
                type="url"
                className={inputClass}
                placeholder="https://docs.google.com/document/d/..."
                value={abstractDocUrl}
                onChange={(e) => setAbstractDocUrl(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                Paste a link to your Google Doc with the project abstract
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-caution-soft)] p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-[var(--color-caution)]"
                  checked={isPivot}
                  onChange={(e) => setIsPivot(e.target.checked)}
                />
                <span className="text-sm text-[var(--color-ink-muted)]">
                  I&apos;m starting over in a new repository
                </span>
              </label>
            </div>
          )}

          {isPivot && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>New Repository URL *</label>
                <input
                  type="url"
                  className={inputClass}
                  placeholder="https://github.com/username/new-repo"
                  value={pivotRepoUrl}
                  onChange={(e) => setPivotRepoUrl(e.target.value)}
                  required
                />
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                  Your previous repo link stays attached to earlier sprints for
                  the record.
                </p>
              </div>
            </div>
          )}
        </div>

        {!isSprint0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 space-y-6 mt-6">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--color-ink)] mb-4">
              Documentation
            </h2>

            <div>
              <label className={labelClass}>Documentation Link *</label>
              <input
                type="url"
                className={inputClass}
                placeholder="https://docs.google.com/document/d/..."
                value={documentationUrl}
                onChange={(e) => setDocumentationUrl(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                Link to your updated project documentation
              </p>
            </div>

            <div>
              <label className={labelClass}>
                What was completed in this sprint? *
              </label>
              <div className="space-y-2">
                {completed.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      className={inputClass}
                      value={item}
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => removeCompleted(idx)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger-text)]"
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 items-center">
                  <input
                    className={inputClass}
                    placeholder="e.g. Implemented user auth"
                    value={completedInput}
                    onChange={(e) => setCompletedInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addCompleted()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCompleted}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-success-soft)] hover:text-[var(--color-success-text)]"
                    aria-label="Add item"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                What changed since the last sprint? *
              </label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="Brief description of changes..."
                value={changed}
                onChange={(e) => setChanged(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Blockers</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={2}
                placeholder="Any blockers or issues faced..."
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Demo Link (optional)</label>
              <input
                type="url"
                className={inputClass}
                placeholder="https://..."
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
              />
            </div>
          </div>
        )}

        {(error || clientError) && (
          <div className="mt-6 rounded-2xl border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-danger-text)]">
            {error || clientError}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Link
            href={
              isSprint0
                ? "/assignments"
                : `/assignments/timeline?assignmentId=${assignment.id}`
            }
            className="inline-flex min-h-10 items-center text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
          >
            ← {isSprint0 ? "Back to Assignments" : "Cancel"}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-10 items-center rounded-lg bg-[var(--color-accent)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
          >
            {loading
              ? "Submitting..."
              : isSprint0
                ? "Submit Sprint 0"
                : `Submit Sprint ${sprintNumber}`}
          </button>
        </div>
      </form>
    </div>
  )
}