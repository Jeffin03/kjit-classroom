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
    active: { color: "bg-blue-100 text-blue-700", label: "Active" },
    completed: { color: "bg-green-100 text-green-700", label: "Completed" },
    accepted: { color: "bg-purple-100 text-purple-700", label: "Accepted" },
  } as const

  const config = statusConfig[submission.status]
  const sprintCount = assignment?.sprintCount ?? 4
  const lastSprint = submission.sprints[submission.sprints.length - 1]

  const inner = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
            {submission.studentUsername[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {assignment?.title || submission.assignmentId}
            </div>
            {assignment && (
              <div className="text-sm text-gray-500 mt-0.5">
                {assignment.subject}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
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
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              View Repo
            </a>
          )}
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
          {showAccept && onAccept && submission.status !== "accepted" && (
            <button
              onClick={() => onAccept(submission)}
              className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
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