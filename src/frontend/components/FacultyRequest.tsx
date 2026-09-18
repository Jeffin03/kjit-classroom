"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Team {
  name: string
  slug: string
  members_count: number
}

export default function FacultyRequest() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [teams, setTeams] = useState<Team[]>([])
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
    if (session) {
      Promise.all([
        fetch("/api/org/owners").then((r) => r.json()),
        fetch("/api/org/teams").then((r) => r.json()),
      ]).then(([ownersData, teamsData]) => {
        if (ownersData.owners?.includes(session.user?.name)) {
          router.push("/faculty/requests")
          return
        }
        if (Array.isArray(teamsData.teams)) {
          setTeams(teamsData.teams)
        }
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [session, router])

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
          githubUsername: session.user.name,
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
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-64" />
          <div className="h-64 bg-[var(--color-border)] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          Request Faculty Access
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-2">
          Request to become a class animator. An org admin will verify and
          approve your request.
        </p>
      </div>

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
              Select the classes you are the animator for
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  <div className="text-xs text-[var(--color-ink-faint)]">
                    {team.members_count} members
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!email || selectedClasses.length === 0 || submitting}
            className="w-full bg-[var(--color-accent)] text-white px-4 py-3 rounded-md font-medium hover:bg-[#372FA8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <a
            href="/faculty"
            className="text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            Go to Faculty Dashboard
          </a>
        </div>
      )}
    </div>
  )
}
