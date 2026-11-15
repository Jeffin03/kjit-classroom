"use client"

import Link from "next/link"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import { BookOpenIcon } from "@/frontend/components/Icons"

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
    title: "Review a team (PWA)",
    description:
      "Call teams up in roll-number order, mark sprints done with optional notes.",
    roles: ["subject-teacher", "elective-teacher", "animator", "owner"],
    steps: [
      {
        title: "Open the Review PWA",
        body: "Go to Faculty → Review PWA. Select your assignment from the dropdown.",
      },
      {
        title: "Call a team",
        body:
          "Teams are sorted by lowest roll number. Tap a team to open its review card.",
      },
      {
        title: "Mark sprint as done",
        body:
          "Optionally add review notes, then click Mark Done. The team sees the status on their timeline.",
      },
      {
        title: "Work offline",
        body:
          "No internet? Reviews are saved locally and sync automatically when you're back online.",
      },
      {
        title: "Print the list",
        body:
          "Tap Print in the bottom bar to print a tick-list of all teams and their review status.",
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

export default function HelpPage() {
  const { role, username, loading: userLoading } = useSessionUser()
  const roleGuides = guidesForRole(role)

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] p-4">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 rounded bg-[var(--color-border)]" />
            <div className="h-64 w-full rounded-2xl bg-[var(--color-border)]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <nav className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-bold tracking-tight text-ink hover:text-accent transition-colors"
          >
            ← KJIT Classroom
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Help &amp; Guides
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Role-based walkthroughs for KJIT Classroom. Find your role below.
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            Signed in as <strong>{username}</strong> ({role})
          </p>
        </div>

        <div className="space-y-6">
          {roleGuides.map((guide) => (
            <div
              key={guide.id}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6 shadow-sm"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-[var(--color-accent)]">
                  <BookOpenIcon className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ink">{guide.title}</h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {guide.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {guide.steps.map((step, idx) => (
                  <div
                    key={step.title}
                    className="flex gap-3"
                  >
                    <span
                      className="flex shrink-0 size-6 items-center justify-center rounded-full bg-[var(--color-canvas)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-ink-muted)]"
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-ink">
                        {step.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {roleGuides.length === 0 && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center">
              <p className="text-sm text-ink-muted">
                No guides available for your role yet.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
