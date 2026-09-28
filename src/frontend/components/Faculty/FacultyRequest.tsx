"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import FacultyPageHeader from "./FacultyPageHeader"

interface Team {
  name: string
  slug: string
  members_count?: number
}

export default function FacultyRequest() {
  const { data: session, status } = useSession()
  const {
    isFaculty,
    isOrgOwner,
    loading: accessLoading,
  } = useSessionUser()
  const router = useRouter()

  const [teams, setTeams] = useState<Team[]>([])
  const [teamsError, setTeamsError] = useState(false)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    if (accessLoading) return

    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    if (isOrgOwner) {
      router.push("/faculty/requests")
      return
    }

    if (isFaculty) {
      router.push("/faculty")
      return
    }

    fetch("/api/org/teams")
      .then((r) => {
        if (!r.ok) throw new Error("teams request failed")
        return r.json()
      })
      .then((teamsData) => {
        if (Array.isArray(teamsData.teams)) {
          setTeams(teamsData.teams)
        }
        setLoading(false)
      })
      .catch(() => {
        setTeamsError(true)
        setLoading(false)
      })
  }, [status, isOrgOwner, isFaculty, accessLoading, router])

  const toggleClass = (teamName: string) => {
    setSelectedClasses((prev) =>
      prev.includes(teamName)
        ? prev.filter((c) => c !== teamName)
        : [...prev, teamName]
    )
  }

  const handleSubmit = async () => {
    if (!session?.user?.name || !email || selectedClasses.length === 0) return

    setSubmitting(true)
    setResult(null)

    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          classes: selectedClasses,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        setResult({ type: "success", message: data.message })
      } else {
        setResult({ type: "error", message: data.error })
      }
    } catch {
      setResult({ type: "error", message: "Network error" })
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-64" />
          <div className="h-64 bg-[var(--color-border)] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <FacultyPageHeader
        title="Request Faculty Access"
        subtitle="Request a teaching role for your classes. An org admin will verify and approve your request."
      />

      {result && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            result.type === "success"
              ? "bg-[var(--color-success-soft)] text-[var(--color-success)] border border-[var(--color-border)]"
              : "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border border-[var(--color-border)]"
          }`}
        >
          {result.message}
        </div>
      )}

      {!result || result.type === "error" ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-7 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink-muted)] mb-2">
              Your college email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="25mca024@kristujayanti.com"
              className="w-full border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ink-muted)] mb-2">
              Select the classes you teach
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teamsError && (
                <p className="text-sm text-[var(--color-danger)] col-span-full">
                  Couldn&apos;t load classes. Refresh the page to try again.
                </p>
              )}
              {teams.map((team) => (
                <button
                  key={team.slug}
                  onClick={() => toggleClass(team.name)}
                  className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                    selectedClasses.includes(team.name)
                      ? "bg-[var(--color-accent-soft)] border-[var(--color-accent)] text-[var(--color-accent)]"
                      : "bg-white border-[var(--color-border)] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas)]"
                  }`}
                >
                  <div className="font-medium">{team.name}</div>
                  {typeof team.members_count === "number" && (
                    <div className="text-xs text-[var(--color-ink-faint)]">
                      {team.members_count} members
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!email || selectedClasses.length === 0 || submitting}
            className="w-full bg-[var(--color-accent)] text-white px-4 py-3 rounded-md font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-7 text-center">
          <div className="w-16 h-16 bg-[var(--color-success-soft)] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[var(--color-success)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--color-ink)] mb-2">
            Request Submitted
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-6">
            An org admin will review your request. You will be added as a
            maintainer to your class teams once approved.
          </p>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      )}
    </div>
  )
}
