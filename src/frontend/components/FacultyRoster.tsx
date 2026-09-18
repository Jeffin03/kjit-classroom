"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface RosterEntry {
  rollNo: string
  collegeEmail: string
  githubUsername?: string
  classTeam: string
  status: "invited" | "active" | "no-account"
  onboardedBy: string
  onboardedAt: string
}

export default function FacultyRoster() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTeam, setFilterTeam] = useState<string>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch("/api/roster")
        .then((res) => res.json())
        .then((data) => {
          setRoster(data.roster || [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [session])

  const classTeams = [...new Set(roster.map((r) => r.classTeam))].sort()

  const filtered = roster.filter((r) => {
    const matchesTeam = filterTeam === "all" || r.classTeam === filterTeam
    const matchesSearch =
      !search ||
      r.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      r.collegeEmail.toLowerCase().includes(search.toLowerCase()) ||
      r.githubUsername?.toLowerCase().includes(search.toLowerCase())
    return matchesTeam && matchesSearch
  })

  const stats = {
    total: filtered.length,
    active: filtered.filter((r) => r.status === "active").length,
    invited: filtered.filter((r) => r.status === "invited").length,
    noAccount: filtered.filter((r) => r.status === "no-account").length,
  }

  const getStatus = (status: string) => {
    switch (status) {
      case "active":
        return { dot: "bg-[var(--color-success)]", text: "text-[var(--color-success)]", label: "Active" }
      case "invited":
        return { dot: "bg-[var(--color-caution)]", text: "text-[var(--color-caution)]", label: "Invited" }
      case "no-account":
        return { dot: "bg-[var(--color-danger)]", text: "text-[var(--color-danger)]", label: "No GitHub Account" }
      default:
        return { dot: "bg-[var(--color-ink-faint)]", text: "text-[var(--color-ink-muted)]", label: status }
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-48" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-[var(--color-border)] rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
            Student Roster
          </h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-2">
            View all onboarded students across your classes
          </p>
        </div>
        <a
          href="/faculty/onboard"
          className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#372FA8] transition-colors"
        >
          Onboard Students
        </a>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by roll no, email, or GitHub username..."
            className="w-full border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)] focus:outline-none"
          />
        </div>
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)] focus:outline-none"
        >
          <option value="all">All Classes</option>
          {classTeams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <div className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{stats.total}</div>
          <div className="text-sm text-[var(--color-ink-muted)]">Total Students</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <div className="text-2xl font-semibold tracking-tight text-[var(--color-success)]">{stats.active}</div>
          <div className="text-sm text-[var(--color-ink-muted)]">Active</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <div className="text-2xl font-semibold tracking-tight text-[var(--color-caution)]">
            {stats.invited}
          </div>
          <div className="text-sm text-[var(--color-ink-muted)]">Invited</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <div className="text-2xl font-semibold tracking-tight text-[var(--color-danger)]">
            {stats.noAccount}
          </div>
          <div className="text-sm text-[var(--color-ink-muted)]">No GitHub Account</div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-ink-muted)]">
            No students found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-canvas)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-ink-muted)] uppercase">
                    Roll No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-ink-muted)] uppercase">
                    College Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-ink-muted)] uppercase">
                    GitHub
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-ink-muted)] uppercase">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-ink-muted)] uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-ink-muted)] uppercase">
                    Onboarded By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((entry) => {
                  const st = getStatus(entry.status)
                  return (
                    <tr
                      key={`${entry.rollNo}-${entry.classTeam}`}
                      className="hover:bg-[var(--color-canvas)] transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-[var(--color-ink)]">
                        {entry.rollNo}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-ink-muted)]">
                        {entry.collegeEmail}
                      </td>
                      <td className="px-6 py-4">
                        {entry.githubUsername ? (
                          <a
                            href={`https://github.com/${entry.githubUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-[var(--color-accent)] hover:underline"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            @{entry.githubUsername}
                          </a>
                        ) : (
                          <span className="text-sm text-[var(--color-ink-faint)]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-ink-muted)]">
                        {entry.classTeam}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                          <span className={`text-sm ${st.text}`}>{st.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-ink-muted)]">
                        {entry.onboardedBy}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
