"use client"

import type { ReactNode } from "react"
import Avatar from "./Avatar"
import ChecklistProgress from "./ChecklistProgress"
import type { SprintState } from "./SprintPill"
import type { BadgeStatus } from "./Badge"
import Badge from "./Badge"

export interface StudentCardRow {
  key: string
  rollNo: string
  studentUsername: string
  collegeEmail: string
  latestCommit?: string
  status: BadgeStatus
  statusLabel?: string
  sprintStates: SprintState[]
  sprintCount: number
  pivoted: boolean
  accepted: boolean
}

const chipTone: Record<SprintState, string> = {
  pending: "bg-canvas text-ink-faint",
  submitted: "bg-accent-soft text-accent",
  reviewed: "bg-success-soft text-success-text",
  pivot: "bg-caution-soft text-caution-text",
}

const chipLabel: Record<SprintState, string> = {
  pending: "·",
  submitted: "S",
  reviewed: "✓",
  pivot: "P",
}

export default function StudentCard({
  row,
  actions,
}: {
  row: StudentCardRow
  actions?: ReactNode
}) {
  const notStarted = row.sprintStates.every((state) => state === "pending")

  return (
    <article
      className={`rounded-2xl border bg-surface p-5 card-interactive ${
        row.accepted
          ? "border-success/40 ring-1 ring-success/10"
          : notStarted
            ? "border-dashed border-border"
            : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={row.rollNo || row.studentUsername || "?"} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.rollNo}</p>
            <p className="truncate text-xs text-ink-muted">
              {row.studentUsername ? (
                <span className="font-mono">@{row.studentUsername}</span>
              ) : (
                "No GitHub account"
              )}
            </p>
          </div>
        </div>
        <Badge status={row.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {row.sprintStates.map((state, index) => (
          <span
            key={index}
            title={`Sprint ${index}: ${state}`}
            className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-medium ${chipTone[state]}`}
          >
            {state === "pending" ? index : chipLabel[state]}
          </span>
        ))}
        {row.pivoted && (
          <span className="ml-1 rounded-full bg-caution-soft px-2 py-0.5 text-[11px] font-medium text-caution-text">
            Pivoted
          </span>
        )}
      </div>

      <div className="mt-3">
        <ChecklistProgress
          current={row.sprintStates.filter((s) => s !== "pending").length}
          total={row.sprintCount}
          compact
        />
      </div>

      <p className="mt-2 font-mono text-xs text-ink-faint">
        {row.latestCommit
          ? `Last commit ${row.latestCommit.slice(0, 7)}`
          : notStarted
            ? "Not started"
            : "No commit yet"}
      </p>

      {actions && (
        <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
          {actions}
        </div>
      )}
    </article>
  )
}
