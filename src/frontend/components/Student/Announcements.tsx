"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import StatusPill from "@/frontend/components/StatusPill"

const announcements = [
  {
    id: 1,
    title: "Welcome to KJIT Classroom",
    date: "2026-09-01",
    content:
      "Welcome to the new KJIT Classroom platform! This semester, we're using a GitHub-native sprint workflow: build your own project repo, submit progress across Sprint 0–3 with commit hashes and docs, and build a permanent developer portfolio.",
    author: "KJIT Nexus",
  },
  {
    id: 2,
    title: "Portfolio Website Assignment Live",
    date: "2026-09-02",
    content:
      "Your first assignment is now live! Create your project repo, submit Sprint 0 (abstract + repo link), read the problem statement, and build your portfolio website across the sprints. This project will help you showcase your skills to potential employers.",
    author: "Faculty Team",
  },
  {
    id: 3,
    title: "GitHub Account Setup Guide",
    date: "2026-09-01",
    content:
      "Make sure your GitHub profile is complete before starting. Add a profile picture, bio, and enable two-factor authentication for security. Your GitHub account is your professional identity.",
    author: "KJIT Nexus",
  },
]

export default function Announcements() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-48" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[var(--color-border)] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          Announcements
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-2">
          Stay updated with the latest news and assignments
        </p>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="rounded-2xl border border-[var(--color-border)] bg-white p-6"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusPill tone="accent">{announcement.author}</StatusPill>
              <span className="text-[13px] text-[var(--color-ink-muted)]">
                {new Date(announcement.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--color-ink)] mb-2">
              {announcement.title}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
              {announcement.content}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-[var(--color-accent-soft)] p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[var(--color-accent)] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-[var(--color-ink)]">
              Want to receive notifications?
            </h3>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Click the &quot;Watch&quot; button on the Announcements repository
              on GitHub to get email notifications for new announcements.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
