import Link from "next/link"
import type { ReactNode } from "react"

interface AssignmentCardProps {
  subject: string
  title: string
  description: string
  deadlineDate: string
  submittedCount?: number
  totalStudents?: number
  isPastDeadline?: boolean
  href: string
  primaryAction?: ReactNode
}

export function AssignmentCard({
  subject,
  title,
  description,
  deadlineDate,
  submittedCount,
  totalStudents,
  isPastDeadline,
  href,
  primaryAction,
}: AssignmentCardProps) {
  const showCounts =
    submittedCount !== undefined &&
    totalStudents !== undefined &&
    totalStudents > 0

  return (
    <Link
      href={href}
      className="card-interactive group block rounded-lg border border-[var(--color-border)] bg-white p-7"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center rounded-md bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-accent)]">
              {subject}
            </span>
            {isPastDeadline && (
              <span className="inline-flex items-center text-xs font-medium text-[var(--color-danger)]">
                <span className="status-dot status-dot--overdue" />
                Deadline passed
              </span>
            )}
          </div>

          <h3 className="text-xl font-semibold tracking-tight text-[var(--color-ink)] mb-1.5">
            {title}
          </h3>

          <p className="text-sm leading-relaxed text-[var(--color-ink-muted)] mb-5 max-w-prose">
            {description}
          </p>
        </div>

        <span
          aria-hidden
          className="flex-shrink-0 mt-1 text-[var(--color-ink-faint)] transition-transform group-hover:translate-x-0.5"
        >
          →
        </span>
      </div>

      <div className="flex items-center justify-between gap-6 border-t border-[var(--color-border)] pt-4">
        <div className="flex items-center gap-5 text-[13px] text-[var(--color-ink-faint)]">
          <span>Due {deadlineDate}</span>
          {showCounts && (
            <>
              <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
              <span>
                <span className="text-[var(--color-ink-muted)] font-medium">
                  {submittedCount}
                </span>
                /{totalStudents} submitted
              </span>
            </>
          )}
        </div>

        {primaryAction ? (
          <span className="text-sm font-medium text-[var(--color-accent)]">
            {primaryAction}
          </span>
        ) : null}
      </div>
    </Link>
  )
}