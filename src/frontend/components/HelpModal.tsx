"use client"

import { useState } from "react"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import { BookOpenIcon, ChevronRightIcon } from "./Icons"

interface HelpGuide {
  id: string
  title: string
  description: string
  steps: Array<{ title: string; body: string }>
  roles: string[]
}

const GUIDES: HelpGuide[] = [
  {
    id: "student-team",
    title: "Create or join a team",
    description: "Form a team of 1–3 students before submitting Sprint 0.",
    roles: ["student"],
    steps: [
      {
        title: "Open the Team page",
        body: "Click Team in the navigation bar to go to /teams.",
      },
      {
        title: "Create a team",
        body:
          "Select your assignment, give your project a title, and add teammates (max 3 including you). Click Create team.",
      },
      {
        title: "Or join a team",
        body:
          "Ask a teammate for the team ID. Enter it with your roll number and click Join team.",
      },
      {
        title: "Submit Sprint 0",
        body:
          "Go to Assignments, select your assignment, and submit your repo URL + abstract link. Any team member can submit.",
      },
    ],
  },
  {
    id: "student-submit",
    title: "Submit a sprint (1–3)",
    description: "Submit your sprint work with repo, docs, and a summary.",
    roles: ["student"],
    steps: [
      {
        title: "Open the assignment timeline",
        body: "From your dashboard, click View timeline on your assignment card.",
      },
      {
        title: "Submit the sprint",
        body:
          "Fill in the documentation link, what was completed, what changed, and any blockers. Click Submit Sprint.",
      },
      {
        title: "Pivot (if needed)",
        body:
          "Tick 'I'm starting over in a new repository' and enter the new repo URL. Your previous repo stays attached to earlier sprints.",
      },
    ],
  },
  {
    id: "student-review",
    title: "Check your review status",
    description: "See which sprints have been reviewed by faculty.",
    roles: ["student"],
    steps: [
      {
        title: "Open the assignment timeline",
        body: "From your dashboard, click View timeline on your assignment card.",
      },
      {
        title: "Look for the Reviewed badge",
        body:
          "Sprints reviewed by faculty show a green Reviewed badge with the review date and any notes.",
      },
    ],
  },
  {
    id: "faculty-review",
    title: "Review a team (in-class)",
    description:
      "Open an assignment from Faculty → Assignments, then review each team's sprints inline with Mark Done + optional notes.",
    roles: ["subject-teacher", "elective-teacher", "animator", "owner"],
    steps: [
      {
        title: "Open an assignment",
        body: "Go to Faculty → Assignments and click on an assignment title.",
      },
      {
        title: "Review a team",
        body:
          "Click Review next to any team. Mark their sprint as done and add optional feedback notes.",
      },
      {
        title: "Accept the submission",
        body:
          "Once all sprints are reviewed, click Accept to sign off the whole submission.",
      },
    ],
  },
  {
    id: "faculty-announce",
    title: "Post an announcement",
    description: "Send a message to your class, a specific sprint, or the whole college.",
    roles: ["subject-teacher", "elective-teacher", "animator", "owner"],
    steps: [
      {
        title: "Open Announcements",
        body: "Announcements appear on the dashboard and at /dashboard#announcements.",
      },
      {
        title: "Compose",
        body:
          "Click New announcement, enter a title and body. Optionally choose a specific sprint or expiry date.",
      },
      {
        title: "Post",
        body: "Click Post. The announcement appears immediately for the selected audience.",
      },
      {
        title: "Edit or delete",
        body:
          "You can edit or delete announcements you posted. Admin can edit or delete any announcement.",
      },
    ],
  },
  {
    id: "admin-onboard",
    title: "Onboard teachers (admin only)",
    description:
      "Create teacher accounts, assign classes, and approve faculty requests.",
    roles: ["owner"],
    steps: [
      {
        title: "Open Faculty Roster",
        body: "Go to Faculty → Faculty Roster & Staffing.",
      },
      {
        title: "Add a teacher",
        body:
          "Enter the teacher's GitHub username, select their role and classes, and save.",
      },
      {
        title: "Approve requests",
        body:
          "Pending teacher requests appear with an approve/deny button. Approve to grant access.",
      },
    ],
  },
]

function guidesForRole(role: string | null) {
  if (!role) return GUIDES.filter((g) => g.roles.includes("student"))
  return GUIDES.filter((g) => g.roles.includes(role))
}

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export default function HelpModal({
  open,
  onClose,
}: HelpModalProps) {
  const { role } = useSessionUser()
  const [activeGuide, setActiveGuide] = useState<string | null>(null)

  const allGuides = guidesForRole(role)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-[var(--color-ink)]/30 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close help"
        onClick={onClose}
        className="absolute inset-0 bg-transparent"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        className="relative w-full max-w-3xl rounded-2xl bg-white p-4 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id="help-modal-title" className="text-lg font-semibold text-[var(--color-ink)]">
              Help & Guides
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Role-based walkthroughs for KJIT Classroom
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--color-canvas)] text-[var(--color-ink-muted)] hover:bg-[var(--color-border)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {allGuides.map((guide) => (
            <div
              key={guide.id}
              className="rounded-xl border border-[var(--color-border)] bg-white p-4 hover:bg-[var(--color-canvas)]/50 transition-colors cursor-pointer"
              onClick={() => setActiveGuide(guide.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <BookOpenIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-ink)]">
                    {guide.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                    {guide.description}
                  </p>
                </div>
                <ChevronRightIcon className="size-4 text-[var(--color-ink-faint)]" />
              </div>
              {activeGuide === guide.id && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border)]/50 space-y-2">
                  {guide.steps.map((step, idx) => (
                    <div key={step.title} className="flex gap-3">
                      <span
                        className="flex shrink-0 size-6 items-center justify-center rounded-full bg-[var(--color-canvas)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-ink-muted)]"
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--color-ink)]">
                          {step.title}
                        </h4>
                        <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
