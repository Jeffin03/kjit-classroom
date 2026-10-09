"use client"

import FacultyPageHeader from "./FacultyPageHeader"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface TeacherRequest {
  id: string
  githubUsername: string
  email: string
  classes: string[]
  requestedAt: string
}

type GrantableRole = "animator" | "subject-teacher" | "elective-teacher"

const ROLE_LABELS: Record<GrantableRole, string> = {
  animator: "Animator",
  "subject-teacher": "Subject Teacher",
  "elective-teacher": "Elective Teacher",
}

const GRANTABLE_ROLES = Object.keys(ROLE_LABELS) as GrantableRole[]

export default function FacultyRequests() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [requests, setRequests] = useState<TeacherRequest[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, GrantableRole>>({})
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    if (!session) return

    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch("/api/requests")
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (res.ok) {
          setRequests(data.requests || [])
        } else {
          setLoadError(
            res.status === 403
              ? "Only org owners can review teacher requests."
              : data.error || "Failed to load requests."
          )
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [session])

  const handleAction = async (
    githubUsername: string,
    action: "approve" | "deny"
  ) => {
    setProcessing(githubUsername)
    setMessage(null)
    try {
      const res = await fetch("/api/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername,
          action,
          ...(action === "approve"
            ? { role: selectedRoles[githubUsername] ?? "animator" }
            : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMessage({ tone: "error", text: data.error || "Request failed" })
        return
      }

      if (data.warnings?.length) {
        setMessage({
          tone: "error",
          text: `Approved, but some team grants failed: ${data.warnings.join("; ")}`,
        })
      } else if (action === "approve") {
        setMessage({
          tone: "success",
          text: `@${githubUsername} approved as ${ROLE_LABELS[(data.role as GrantableRole) ?? "animator"]}.`,
        })
      }

      setRequests((prev) => prev.filter((r) => r.githubUsername !== githubUsername))
      if (action === "deny") {
        setMessage({
          tone: "success",
          text: `Denied @${githubUsername}.`,
        })
      }
    } catch {
      setMessage({ tone: "error", text: "Network error" })
    } finally {
      setProcessing(null)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-64" />
          <div className="space-y-3 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[var(--color-border)] rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-4xl">
        <FacultyPageHeader
          title="Faculty Requests"
          subtitle="Review and approve requests for teaching roles"
        />

        {message && (
          <div
            className={`mb-6 rounded-md border px-4 py-3 ${
              message.tone === "error"
                ? "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                : "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]"
            }`}
          >
            <p className="text-sm break-words">{message.text}</p>
          </div>
        )}

        {loadError ? (
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-center">
            <h2 className="text-lg font-medium text-[var(--color-ink)] mb-1">
              Requests unavailable
            </h2>
            <p className="text-sm text-[var(--color-ink-muted)]">{loadError}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-center">
            <div className="w-16 h-16 bg-[var(--color-border)] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[var(--color-ink-faint)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-[var(--color-ink)] mb-1">
              No pending requests
            </h2>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Teachers are onboarded by org owners directly; this queue only
              shows role-change requests.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.githubUsername}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[var(--color-border)] rounded-full flex items-center justify-center text-[var(--color-ink-muted)] font-medium text-lg">
                      {request.githubUsername[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--color-ink)]">
                        <span
                          className="font-mono text-sm"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          @{request.githubUsername}
                        </span>
                      </div>
                      <div className="text-sm text-[var(--color-ink-muted)]">
                        {request.email}
                      </div>
                      <div className="text-xs text-[var(--color-ink-faint)] mt-1">
                        Requested {new Date(request.requestedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <label className="text-xs text-[var(--color-ink-muted)]">
                      Grant role
                      <select
                        value={selectedRoles[request.githubUsername] ?? "animator"}
                        onChange={(e) =>
                          setSelectedRoles((prev) => ({
                            ...prev,
                            [request.githubUsername]: e.target.value as GrantableRole,
                          }))
                        }
                        disabled={processing === request.githubUsername}
                        className="mt-1 block rounded-md border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm text-[var(--color-ink)] disabled:opacity-50"
                      >
                        {GRANTABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleAction(request.githubUsername, "approve")
                        }
                        disabled={processing === request.githubUsername}
                        className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
                      >
                        {processing === request.githubUsername
                          ? "..."
                          : "Approve"}
                      </button>
                      <button
                        onClick={() =>
                          handleAction(request.githubUsername, "deny")
                        }
                        disabled={processing === request.githubUsername}
                        className="bg-white border border-[var(--color-border)] text-[var(--color-ink-muted)] px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--color-canvas)] transition-colors disabled:opacity-50"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm text-[var(--color-ink-muted)] mb-2">
                    Requested classes:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {request.classes.map((className) => (
                      <span
                        key={className}
                        className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent"
                      >
                        {className}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
