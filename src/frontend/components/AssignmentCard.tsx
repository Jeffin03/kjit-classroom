import Link from "next/link"
import type { ReactNode } from "react"
import Badge, { SubjectBadge, type BadgeStatus } from "./Badge"
import { CalendarIcon } from "./Icons"

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
  /** Latest sprint state, shown as a status badge. */
  status?: BadgeStatus
  /** Completed sprints out of 4 — drives the progress bar. */
  progress?: number
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
  status,
  progress,
}: AssignmentCardProps) {
  const showCounts =
    submittedCount !== undefined &&
    totalStudents !== undefined &&
    totalStudents > 0

  const complete = progress ?? 0
  const percent = showCounts
    ? Math.round(((submittedCount ?? 0) / (totalStudents || 1)) * 100)
    : complete * 25

  return (
    <Link
      href={href}
      className="card-interactive block rounded-2xl border border-border bg-surface p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <SubjectBadge subject={subject} />
        {isPastDeadline ? (
          <Badge status="overdue" className="ml-auto" />
        ) : status ? (
          <Badge status={status} className="ml-auto" />
        ) : null}
      </div>

      <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-muted">
        {description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink-subtle">
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="size-4" />
          Due {deadlineDate}
        </span>
        <span>Sprint 0 to 3</span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-ink-subtle">
        <span>
          {showCounts
            ? `${submittedCount} of ${totalStudents} submitted`
            : `${complete} of 4 sprints`}
        </span>
        <span className="inline-flex items-center font-medium text-accent">
          {primaryAction}
        </span>
      </div>
    </Link>
  )
}
