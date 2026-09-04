"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const announcements = [
  {
    id: 1,
    title: "Welcome to KJIT Classroom",
    date: "2026-09-01",
    content:
      "Welcome to the new KJIT Classroom platform! This semester, we're using a GitHub-native workflow where you'll fork assignment repos to your own account. Solve problems your way, and build a permanent developer portfolio.",
    author: "KJIT Nexus",
  },
  {
    id: 2,
    title: "Portfolio Website Assignment Live",
    date: "2026-09-02",
    content:
      "Your first assignment is now available! Fork the repo, read the problem statement, and start building your portfolio website. This project will help you showcase your skills to potential employers.",
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
  const { data: session, status } = useSession()
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
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-600 mt-2">Stay updated with the latest news and assignments</p>
      </div>

      <div className="space-y-6">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">{announcement.author}</span>
              <span className="text-sm text-gray-500">
                {new Date(announcement.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{announcement.title}</h2>
            <p className="text-gray-600">{announcement.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Want to receive notifications?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Click the &quot;Watch&quot; button on the{" "}
              <a href="#" className="text-indigo-600 hover:text-indigo-700 underline">Announcements repository</a>{" "}
              on GitHub to get email notifications for new announcements.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
