"use client"

import type { SprintSubmission } from "@/backend/types"

function SprintCircle({
  sprint,
  completed,
  isLast,
}: {
  sprint: number
  completed: boolean
  isLast: boolean
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
          completed
            ? "bg-green-500 text-white"
            : "bg-gray-200 text-gray-500"
        }`}
      >
        {completed ? "✓" : sprint}
      </div>
      {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
    </div>
  )
}

function DiffBadge({ sprint }: { sprint: SprintSubmission }) {
  const m = sprint.diffMetrics
  if (!m) return null
  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-3">
      <div className="text-sm font-medium text-gray-900 mb-2">
        Changes since previous sprint
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{m.totalCommits}</span>{" "}
          commits
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{m.filesChanged}</span>{" "}
          files
        </div>
        <div className="text-sm text-gray-500">
          +{m.additions} -{m.deletions} lines
        </div>
        <div className="text-sm text-gray-500">
          {m.newFiles.length} new, {m.modifiedFiles.length} modified
        </div>
      </div>
      {(m.newFiles.length > 0 || m.modifiedFiles.length > 0) && (
        <div className="text-xs text-gray-500 mt-2">
          {m.newFiles.length > 0 && (
            <div>
              New: {m.newFiles.slice(0, 3).join(", ")}
              {m.newFiles.length > 3 && ` +${m.newFiles.length - 3} more`}
            </div>
          )}
          {m.modifiedFiles.length > 0 && (
            <div>
              Modified: {m.modifiedFiles.slice(0, 3).join(", ")}
              {m.modifiedFiles.length > 3 && ` +${m.modifiedFiles.length - 3} more`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SprintTimeline({
  sprints,
  sprintCount = 4,
  repoUrl,
  submissionId,
  onUpdateCommit,
}: {
  sprints: SprintSubmission[]
  sprintCount?: number
  repoUrl?: string
  submissionId?: string
  onUpdateCommit?: (sprintNumber: number) => void
}) {
  const entries: (SprintSubmission | null)[] = []
  for (let i = 0; i < sprintCount; i++) {
    entries.push(sprints.find((s) => s.sprintNumber === i) ?? null)
  }

  const latestSprint = sprints.length > 0 ? sprints[sprints.length - 1] : null

  return (
    <div className="flex">
      <div className="flex flex-col items-center mr-4">
        {entries.map((entry, idx) => (
          <SprintCircle
            key={idx}
            sprint={idx}
            completed={entry !== null}
            isLast={idx === entries.length - 1}
          />
        ))}
      </div>

      <div className="flex-1 space-y-6">
        {entries.map((entry, idx) => {
          if (!entry) {
            const isNext = sprints.length === idx
            return (
              <div key={idx} className="flex gap-4">
                <div className="flex-1">
                  <div className="text-base font-semibold text-gray-900">
                    Sprint {idx}
                  </div>
                  {idx === 0 && (
                    <div className="text-sm text-gray-500 mt-1 mb-2">
                      Abstract &amp; repository setup
                    </div>
                  )}
                  <div className="text-sm text-gray-500 mt-2">
                    Not submitted yet
                  </div>
                  {isNext && (
                    <a
                      href={
                        submissionId
                          ? `/assignments/submit?sprint=${idx}`
                          : "#"
                      }
                      className="inline-block mt-3 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Submit Sprint {idx}
                    </a>
                  )}
                </div>
              </div>
            )
          }

          const isPivot = entry.isPivot
          return (
            <div key={idx} className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-base font-semibold text-gray-900">
                    Sprint {idx}
                    {idx === 0 ? " — Abstract" : ""}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Submitted
                  </span>
                  {isPivot && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      Pivoted
                    </span>
                  )}
                </div>

                {repoUrl && latestSprint?.sprintNumber === idx && (
                  <div className="text-sm text-gray-600 mt-2">
                    Repo:{" "}
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      {repoUrl.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}

                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  {entry.previousRepoUrl && (
                    <div>
                      Previous repo:{" "}
                      <a
                        href={entry.previousRepoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        {entry.previousRepoUrl.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                  <div>
                    Commit:{" "}
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      {entry.commitSha.slice(0, 7)}
                    </span>{" "}
                    · {new Date(entry.submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div>
                    Documentation:{" "}
                    <a
                      href={entry.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      View →
                    </a>
                  </div>
                </div>

                {entry.summary && (
                  <div className="text-sm text-gray-600 mt-2">
                    <div>
                      <span className="font-medium">Summary:</span>{" "}
                      {entry.summary.changed}
                    </div>
                    {entry.summary.completed.length > 0 && (
                      <div className="mt-1">
                        <span className="font-medium">Completed:</span>{" "}
                        {entry.summary.completed.join(" · ")}
                      </div>
                    )}
                    {entry.summary.blockers && (
                      <div className="mt-1">
                        <span className="font-medium">Blockers:</span>{" "}
                        {entry.summary.blockers}
                      </div>
                    )}
                    {entry.summary.demoUrl && (
                      <div className="mt-1">
                        <span className="font-medium">Demo:</span>{" "}
                        <a
                          href={entry.summary.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          View →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <DiffBadge sprint={entry} />

                <div className="flex gap-3 mt-3">
                  {onUpdateCommit && (
                    <button
                      onClick={() => onUpdateCommit(entry.sprintNumber)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Update commit hash
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}