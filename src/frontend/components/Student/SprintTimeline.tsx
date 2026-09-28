"use client"

import { useRouter } from "next/navigation"
import type { SprintSubmission } from "@/backend/types"
import { SprintRow } from "./SprintRow"

export default function SprintTimeline({
  sprints,
  sprintCount = 4,
  repoUrl,
  submissionId,
  assignmentId,
}: {
  sprints: SprintSubmission[]
  sprintCount?: number
  repoUrl?: string
  submissionId?: string
  assignmentId?: string
}) {
  const router = useRouter()
  const entries: (SprintSubmission | null)[] = []
  for (let i = 0; i < sprintCount; i++) {
    entries.push(sprints.find((s) => s.sprintNumber === i) ?? null)
  }

  const latestSprint = sprints.length > 0 ? sprints[sprints.length - 1] : null

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white px-5 sm:px-6">
      {entries.map((entry, idx) => {
        const label = idx === 0 ? "Abstract" : ""

        if (!entry) {
          const isNext = sprints.length === idx
          return (
            <SprintRow
              key={idx}
              index={idx}
              label={label}
              status="pending"
              onSubmit={
                submissionId && assignmentId && isNext
                  ? () => {
                      router.push(
                        `/assignments/submit?assignmentId=${assignmentId}&sprint=${idx}`
                      )
                    }
                  : undefined
              }
            />
          )
        }

        const showRepo =
          latestSprint?.sprintNumber === idx ? repoUrl : undefined
        const fmtDate = new Date(
          entry.submittedAt
        ).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })

        return (
          <SprintRow
            key={idx}
            index={idx}
            label={label}
            status={
              entry.isPivot
                ? "pivot"
                : entry.reviewedAt
                  ? "reviewed"
                  : "submitted"
            }
            repoUrl={showRepo}
            previousRepoUrl={entry.previousRepoUrl}
            commitSha={entry.commitSha}
            submittedDate={fmtDate}
            documentationUrl={entry.documentationUrl}
            summaryDetail={entry.summary}
            diffMetrics={entry.diffMetrics}
          />
        )
      })}
    </div>
  )
}