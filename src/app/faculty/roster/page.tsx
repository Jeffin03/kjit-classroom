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

export default function RosterPage() {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700"
      case "invited":
        return "bg-yellow-100 text-yellow-700"
      case "no-account":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
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
          <h1 className="text-3xl font-bold text-gray-900">Student Roster</h1>
          <p className="text-gray-600 mt-2">
            View all onboarded students across your classes
          </p>
        </div>
        <a
          href="/faculty/onboard"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.invited}
          </div>
          <div className="text-sm text-gray-600">Invited</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-red-600">
            {stats.noAccount}
          </div>
          <div className="text-sm text-gray-600">No GitHub Account</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No students found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Roll No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    College Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    GitHub
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Onboarded By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((entry) => (
                  <tr
                    key={`${entry.rollNo}-${entry.classTeam}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {entry.rollNo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {entry.collegeEmail}
                    </td>
                    <td className="px-6 py-4">
                      {entry.githubUsername ? (
                        <a
                          href={`https://github.com/${entry.githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          @{entry.githubUsername}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {entry.classTeam}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {entry.onboardedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
