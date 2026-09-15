"use client"

import { useState } from "react"
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
        alert("Please fill in the repository URL and abstract link")
        return
      }
      onSubmit({
        assignmentId: assignment.id,
        repoUrl,
        abstractDocUrl,
      })
      return
    }

    if (!repoUrl) {
      alert("Please provide the repository URL")
      return
    }
    if (!documentationUrl) {
      alert("Please provide a documentation link")
      return
    }
    onSubmit({
      repoUrl,
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
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
  const labelClass = "block text-sm font-medium text-gray-700 mb-2"

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isSprint0 ? "Submit Project — Sprint 0" : `Submit Sprint ${sprintNumber}`}
        </h1>
        <p className="mt-2 text-base text-gray-600">
          {isSprint0
            ? "Set up your project repository and submit your abstract"
            : `${assignment.title} · ${assignment.subject}`}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isSprint0 ? "Project Repository" : "Repository"}
          </h2>

          <div>
            <label className={labelClass}>
              GitHub Repository URL{isSprint0 && " *"}
            </label>
            <input
              type="url"
              className={inputClass}
              placeholder="https://github.com/username/repo-name"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              {isSprint0
                ? "Create a new repository on GitHub and paste the URL here"
                : "Your project repository"}
            </p>
          </div>

          {isSprint0 ? (
            <div>
              <label className={labelClass}>Abstract / Project Synopsis *</label>
              <input
                type="url"
                className={inputClass}
                placeholder="https://docs.google.com/document/d/..."
                value={abstractDocUrl}
                onChange={(e) => setAbstractDocUrl(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                Paste a link to your Google Doc with the project abstract
              </p>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-orange-600"
                  checked={isPivot}
                  onChange={(e) => setIsPivot(e.target.checked)}
                />
                <span className="text-sm text-gray-700">
                  I&apos;m starting fresh with a new repository / approach
                </span>
              </label>
            </div>
          )}

          {isPivot && (
            <div>
              <label className={labelClass}>New Repository URL *</label>
              <input
                type="url"
                className={inputClass}
                placeholder="https://github.com/username/new-repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
              <p className="mt-1 text-xs text-red-600">
                This will reset your baseline. Previous sprints will be marked as
                superseded.
              </p>
            </div>
          )}
        </div>

        {!isSprint0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
              <p className="mt-1 text-xs text-gray-400">
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
                      className="text-gray-400 hover:text-red-500 transition-colors px-2 text-lg leading-none"
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
                    className="text-gray-400 hover:text-green-500 transition-colors px-2 text-lg leading-none"
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

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <a
            href={isSprint0 ? "/assignments" : `#`}
            className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center"
          >
            ← {isSprint0 ? "Back to Assignments" : "Cancel"}
          </a>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
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