"use client"

import type { SubmissionWithSprints, Assignment } from "@/backend/types"
import ChecklistProgress from "./ChecklistProgress"

export default function SubmissionCard({
  submission,
  assignment,
  href,
  showAccept,
  onAccept,
}: {
  submission: SubmissionWithSprints
  assignment?: Assignment
  href?: string
  showAccept?: boolean
  onAccept?: (submission: SubmissionWithSprints) => void
}) {
  const statusConfig = {
    active: { dot: "status-dot--active", label: "In Progress" },
    completed: { dot: "status-dot--review", label: "Awaiting Acceptance" },
    accepted: { dot: "status-dot--done", label: "Accepted" },
  } as const

  const config = statusConfig[submission.status]
  const sprintCount = assignment?.sprintCount ?? 4
  const lastSprint = submission.sprints[submission.sprints.length - 1]

  const inner = (
    <div className="card-interactive rounded-lg border border-[var(--color-border)] bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-4">
          <div className="w-10 h-10 bg-[var(--color-border)] rounded-full flex items-center justify-center text-[var(--color-ink-muted)] font-medium text-sm">
            {submission.studentUsername[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-[var(--color-ink)]">
              {assignment?.title || submission.assignmentId}
            </div>
            {assignment && (
              <div className="text-sm text-[var(--color-ink-muted)] mt-0.5">
                {assignment.subject}
              </div>
            )}
            <div
              className="text-xs text-[var(--color-ink-faint)] mt-1 font-mono"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              @{submission.studentUsername}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastSprint && (
            <a
              href={submission.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--color-accent)] hover:underline"
            >
              View Repo
            </a>
          )}
          <span className="inline-flex items-center text-[13px] font-medium text-[var(--color-ink-muted)]">
            <span className={`status-dot ${config.dot}`} />
            {config.label}
          </span>
          {showAccept && onAccept && submission.status !== "accepted" && (
            <button
              onClick={() => onAccept(submission)}
              className="bg-[var(--color-accent)] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#372FA8] transition-colors"
            >
              Accept
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <ChecklistProgress
          current={submission.sprints.length}
          total={sprintCount}
        />
      </div>
    </div>
  )

  return href ? (
    <a href={href} className="block">
      {inner}
    </a>
  ) : (
    inner
  )
}