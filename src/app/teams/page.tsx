"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import TeamManager from "@/frontend/components/Student/TeamManager"

export default function TeamsPage() {
  const router = useRouter()
  const { user, role, isFaculty, loading: userLoading } = useSessionUser()

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/")
    } else if (!userLoading && user && isFaculty) {
      router.push("/faculty")
    }
  }, [user, isFaculty, userLoading, router])

  if (userLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-border" />
          <div className="h-56 w-full rounded-2xl bg-border" />
        </div>
      </div>
    )
  }

  if (role === "unrostered") {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-canvas text-ink-faint mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 15l-3 3m0 0l-3-3m3 3V3.75" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-ink">Not on the roster yet</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Ask your class teacher to add you — teams and project submissions
          show up here once you are onboarded.
        </p>
      </div>
    )
  }

  return <TeamManager />
}
