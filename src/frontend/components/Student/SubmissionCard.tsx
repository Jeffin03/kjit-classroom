"use client"

import type { SubmissionWithSprints, Assignment } from "@/backend/types"
import ChecklistProgress from "../ChecklistProgress"
import StatusPill, { type StatusTone } from "../StatusPill"

export default function SubmissionCard({
  submission,
  assignment,
  href,
}: {
  submission: SubmissionWithSprints
  assignment?: Assignment
  href?: string
}) {
  const statusConfig: Record<
    SubmissionWithSprints["status"],
    { label: string; tone: StatusTone }
  > = {
    active: { label: "In progress", tone: "accent" },
    completed: { label: "Awaiting acceptance", tone: "caution" },
    accepted: { label: "Accepted", tone: "success" },
  }

  const config = statusConfig[submission.status]
  const sprintCount = assignment?.sprintCount ?? 4
  const lastSprint = submission.sprints[submission.sprints.length - 1]
  const hasPivot = submission.sprints.some((s) => s.isPivot)

  const inner = (
    <div className="card-interactive relative rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
      {/* Whole-card link. Nested anchors are invalid HTML (the parser would
          reparent the inner ones), so the card links through a stretched
          overlay and the real controls sit above it. */}
      {href && (
        <a
          href={href}
          aria-label={`Open timeline for ${assignment?.title || submission.assignmentId}`}
          className="absolute inset-0 z-0"
        />
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-canvas)] text-sm font-medium text-[var(--color-ink-muted)] ring-1 ring-[var(--color-border)]"
          >
            {submission.studentUsername[0].toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold text-[var(--color-ink)]">
              {assignment?.title || submission.assignmentId}
            </div>
            {assignment && (
              <div className="mt-0.5 text-sm text-[var(--color-ink-muted)]">
                {assignment.subject}
              </div>
            )}
            <div
              className="mt-1 font-mono text-[13px] text-[var(--color-ink-muted)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              @{submission.studentUsername}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {lastSprint && (
            <a
              href={submission.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-soft)]"
            >
              View repo
            </a>
          )}
          {hasPivot ? <StatusPill tone="caution">Pivoted</StatusPill> : null}
          <StatusPill tone={config.tone}>{config.label}</StatusPill>
        </div>
      </div>

      <div className="mt-5">
        <ChecklistProgress
          current={submission.sprints.length}
          total={sprintCount}
        />
      </div>
    </div>
  )

  return inner
}