"use client"

import FacultyPageHeader from "./FacultyPageHeader"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"

interface Team {
  name: string
  slug: string
  members_count: number
}

interface CsvRow {
  rollNo: string
  collegeEmail: string
}

interface MatchedStudent {
  rollNo: string
  collegeEmail: string
  githubUsername: string
  githubAvatar: string
  githubId: number
  selected?: boolean
}

interface UnmatchedStudent {
  rollNo: string
  collegeEmail: string
}

type Step = 1 | 2 | 3 | 4 | 5

const STEPS = [
  "Select Class",
  "Upload CSV",
  "Verify Students",
  "Confirm & Invite",
  "Complete",
]

export default function FacultyOnboard() {
  const { data: session, status } = useSession()
  const { capabilities, loading: accessLoading } = useSessionUser()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>(1)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [csvRows, setCsvRows] = useState<CsvRow[]>([])
  const [, setCsvPreview] = useState<string>("")
  const [matched, setMatched] = useState<MatchedStudent[]>([])
  const [unmatched, setUnmatched] = useState<UnmatchedStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [teamsLoaded, setTeamsLoaded] = useState(false)
  const [teamsError, setTeamsError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    team?: { name: string; slug: string }
    addedToTeam: number
    invited: number
    alreadyMember: number
    alreadyInTeam?: number
    noAccount: number
    errors?: string[]
  } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    if (accessLoading || !session) return

    if (!capabilities.includes("roster.write")) {
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
        setTeamsLoaded(true)
      })
      .catch(() => {
        setTeamsError(true)
        setTeamsLoaded(true)
      })
  }, [session, capabilities, accessLoading, router])

  const parseCsv = (content: string) => {
    const lines = content.trim().split("\n")
    if (lines.length < 2) return []

    const rows: CsvRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim())
      if (cols.length >= 2) {
        const [rollNo, collegeEmail] = cols
        if (rollNo && collegeEmail) {
          rows.push({ rollNo, collegeEmail })
        }
      }
    }
    return rows
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCsvPreview(content)
      const rows = parseCsv(content)
      setCsvRows(rows)
    }
    reader.readAsText(file)
  }

  const handleMatch = async () => {
    if (!csvRows.length || !selectedTeam) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/onboard/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvRows, classTeam: selectedTeam.name }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to match students")
        return
      }
      if (!Array.isArray(data.matched)) {
        setError("Unexpected response while matching students")
        return
      }

      setMatched(
        data.matched.map((s: MatchedStudent) => ({ ...s, selected: true }))
      )
      setUnmatched(data.unmatched)
      setStep(3)
    } catch {
      setError("Network error while matching students")
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!selectedTeam) return

    setLoading(true)
    setError(null)
    try {
      const selectedMatched = matched.filter((s) => s.selected)
      const res = await fetch("/api/onboard/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matched: selectedMatched,
          unmatched,
          classTeam: selectedTeam.name,
          classTeamSlug: selectedTeam.slug,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to invite students")
        return
      }

      setResult(data)
      setStep(5)
    } catch {
      setError("Network error while inviting students")
    } finally {
      setLoading(false)
    }
  }

  const toggleStudent = (rollNo: string) => {
    setMatched((prev) =>
      prev.map((s) =>
        s.rollNo === rollNo ? { ...s, selected: !s.selected } : s
      )
    )
  }

  const downloadNoAccountCsv = () => {
    if (!unmatched.length || !selectedTeam) return
    const header = "roll_no,college_email,status\n"
    const rows = unmatched
      .map((s) => `${s.rollNo},${s.collegeEmail},no_github_account`)
      .join("\n")
    const blob = new Blob([header + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedTeam.name.replace(/\s+/g, "_")}_no_github_account.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (status === "loading" || !teamsLoaded) {
    return (
      <div className="max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-64" />
          <div className="h-64 bg-[var(--color-border)] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-4xl">
        <FacultyPageHeader
          title="Onboard Students"
          subtitle="Add students to your class team on GitHub"
        />

        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => {
              const num = (i + 1) as Step
              const isActive = step === num
              const isComplete = step > num
              return (
                <div key={label} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        isComplete
                          ? "bg-[var(--color-success)] text-white"
                          : isActive
                            ? "bg-[var(--color-accent)] text-white"
                            : "bg-[var(--color-border)] text-[var(--color-ink-muted)]"
                      }`}
                    >
                      {isComplete ? (
                        <svg
                          className="w-5 h-5"
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
                      ) : (
                        num
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 ${isActive ? "text-[var(--color-accent)] font-medium" : "text-[var(--color-ink-muted)]"}`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mt-[-20px] ${
                        isComplete ? "bg-[var(--color-success)]" : "bg-[var(--color-border)]"
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-7">
          {error && (
            <div className="mb-5 rounded-md border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3">
              <p className="text-sm text-[var(--color-danger)]">{error}</p>
            </div>
          )}

          {/* Step 1: Select Class */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[var(--color-ink)] mb-4">
                Select Class
              </h2>
              {teams.length === 0 && teamsError ? (
                <div className="rounded-lg border border-dashed border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-6 text-center">
                  <h3 className="text-sm font-medium text-[var(--color-danger)] mb-2">
                    Couldn&apos;t load class teams
                  </h3>
                  <p className="text-sm text-[var(--color-danger)]">
                    The GitHub org request failed. Refresh the page to try
                    again.
                  </p>
                </div>
              ) : teams.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-canvas)] p-6 text-center">
                  <h3 className="text-sm font-medium text-[var(--color-ink)] mb-2">
                    No class teams found
                  </h3>
                  <p className="text-sm text-[var(--color-ink-muted)] mb-1">
                    Classes come from the teams in your GitHub organization. Create
                    one team per class to get started.
                  </p>
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    Make sure each team&apos;s visibility is set to{" "}
                    <span className="font-medium text-[var(--color-ink)]">Closed</span>{" "}
                    &mdash; teams left on the default <em>Secret</em> visibility are only
                    visible to organization owners and will not appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teams.map((team) => (
                    <button
                      key={team.slug}
                      onClick={() => setSelectedTeam(team)}
                      className={`text-left p-4 rounded-lg border transition-colors ${
                        selectedTeam?.slug === team.slug
                          ? "bg-[var(--color-accent-soft)] border-[var(--color-accent)]"
                          : "bg-white border-[var(--color-border)] hover:bg-[var(--color-canvas)]"
                      }`}
                    >
                      <div className="font-medium text-[var(--color-ink)]">{team.name}</div>
                      <div className="text-sm text-[var(--color-ink-muted)]">
                        {team.members_count} members
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedTeam}
                  className="bg-[var(--color-accent)] text-white px-6 py-2 rounded-md font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Upload CSV */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[var(--color-ink)] mb-2">
                Upload Student CSV
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)] mb-4">
                Format: <code className="bg-[var(--color-border)] px-1 rounded font-mono" style={{ fontFamily: "var(--font-mono)" }}>roll_no, college_email</code>
              </p>
              <p className="text-xs text-[var(--color-ink-faint)] mb-4">
                Example: <code className="bg-[var(--color-border)] px-1 rounded font-mono" style={{ fontFamily: "var(--font-mono)" }}>25MCA024, 25mca024@kristujayanti.com</code>
              </p>

              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[var(--color-border)] rounded-lg p-8 text-center hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-colors"
              >
                <svg
                  className="w-8 h-8 text-[var(--color-ink-faint)] mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-[var(--color-ink-muted)]">
                  {csvRows.length > 0
                    ? `${csvRows.length} rows loaded`
                    : "Click to select CSV file"}
                </p>
              </button>

              {csvRows.length > 0 && (
                <div className="mt-4 bg-[var(--color-canvas)] rounded-lg p-4 border border-[var(--color-border)]">
                  <p className="text-sm text-[var(--color-ink-muted)] mb-2">
                    Preview (first 5 rows):
                  </p>
                  <div className="overflow-x-auto">
                    <table className="text-xs">
                      <thead>
                        <tr className="text-[var(--color-ink-faint)]">
                          <th className="text-left pr-4 pb-1">Roll No</th>
                          <th className="text-left pb-1">College Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.slice(0, 5).map((row, i) => (
                          <tr key={i}>
                            <td className="pr-4 pb-1 text-[var(--color-ink)]">
                              {row.rollNo}
                            </td>
                            <td className="pb-1 text-[var(--color-ink)]">
                              {row.collegeEmail}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleMatch}
                  disabled={!csvRows.length || loading}
                  className="bg-[var(--color-accent)] text-white px-6 py-2 rounded-md font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Matching..." : "Match with GitHub"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Verify Students */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[var(--color-ink)] mb-4">
                Verify Students
              </h2>

              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[var(--color-success)] rounded-full" />
                  <span className="text-sm text-[var(--color-ink-muted)]">
                    Matched ({matched.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[var(--color-danger)] rounded-full" />
                  <span className="text-sm text-[var(--color-ink-muted)]">
                    Not on GitHub ({unmatched.length})
                  </span>
                </div>
              </div>

              {matched.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-[var(--color-ink-muted)] mb-2">
                    Matched Students
                  </h3>
                  <div className="border border-[var(--color-border)] rounded-lg divide-y divide-[var(--color-border)] max-h-64 overflow-y-auto">
                    {matched.map((student) => (
                      <label
                        key={student.rollNo}
                        className="flex items-center gap-3 p-3 hover:bg-[var(--color-canvas)] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={student.selected}
                          onChange={() => toggleStudent(student.rollNo)}
                          className="w-4 h-4 accent-[var(--color-accent)] rounded"
                        />
                        <img
                          src={student.githubAvatar}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[var(--color-ink)]">
                            {student.rollNo} — @{student.githubUsername}
                          </div>
                          <div className="text-xs text-[var(--color-ink-muted)]">
                            {student.collegeEmail}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {unmatched.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-[var(--color-ink-muted)]">
                      Not on GitHub
                    </h3>
                    <button
                      onClick={downloadNoAccountCsv}
                      className="text-sm text-[var(--color-accent)] hover:underline font-medium"
                    >
                      Download List CSV
                    </button>
                  </div>
                  <div className="border border-[var(--color-border)] rounded-lg divide-y divide-[var(--color-border)] max-h-48 overflow-y-auto">
                    {unmatched.map((student) => (
                      <div
                        key={student.rollNo}
                        className="flex items-center gap-3 p-3"
                      >
                        <div className="w-8 h-8 bg-[var(--color-danger-soft)] rounded-full flex items-center justify-center text-[var(--color-danger)] text-xs font-medium">
                          ?
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[var(--color-ink)]">
                            {student.rollNo}
                          </div>
                          <div className="text-xs text-[var(--color-ink-muted)]">
                            {student.collegeEmail}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-medium"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={matched.filter((s) => s.selected).length === 0}
                  className="bg-[var(--color-accent)] text-white px-6 py-2 rounded-md font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm & Invite */}
          {step === 4 && (
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[var(--color-ink)] mb-4">
                Confirm & Send Invites
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-[var(--color-canvas)] rounded-lg">
                  <span className="text-sm text-[var(--color-ink-muted)]">
                    Students to add to team
                  </span>
                  <span className="font-medium text-[var(--color-ink)]">
                    {matched.filter((s) => s.selected).length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[var(--color-canvas)] rounded-lg">
                  <span className="text-sm text-[var(--color-ink-muted)]">
                    Class team
                  </span>
                  <span className="font-medium text-[var(--color-accent)]">
                    {selectedTeam?.name}
                  </span>
                </div>
                {unmatched.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-[var(--color-canvas)] rounded-lg">
                    <span className="text-sm text-[var(--color-ink-muted)]">
                      Students without GitHub accounts
                    </span>
                    <span className="font-medium text-[var(--color-danger)]">
                      {unmatched.length}
                    </span>
                  </div>
                )}
              </div>

              <p className="mb-6 text-xs text-[var(--color-ink-muted)]">
                Each student is invited to the organization and added to the
                team in one step; students who are already members are added to
                the team directly.
              </p>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleInvite}
                  disabled={loading}
                  className="bg-[var(--color-accent)] text-white px-6 py-2 rounded-md font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Confirm & Send Invites"}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 5 && result && (
            <div className="text-center py-4">
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
                Onboarding Complete
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)] mb-6">
                {result?.team?.name ?? selectedTeam?.name}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 max-w-lg mx-auto">
                <div className="p-3 bg-[var(--color-canvas)] rounded-lg">
                  <div className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
                    {result.addedToTeam}
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">Added to team</div>
                </div>
                <div className="p-3 bg-[var(--color-canvas)] rounded-lg">
                  <div className="text-2xl font-semibold tracking-tight text-[var(--color-accent)]">
                    {result.invited}
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">Invites sent</div>
                </div>
                <div className="p-3 bg-[var(--color-canvas)] rounded-lg">
                  <div className="text-2xl font-semibold tracking-tight text-[var(--color-success)]">
                    {result.alreadyMember}
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">Already members</div>
                </div>
                <div className="p-3 bg-[var(--color-canvas)] rounded-lg">
                  <div className="text-2xl font-semibold tracking-tight text-[var(--color-danger)]">
                    {result.noAccount}
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)]">No account</div>
                </div>
              </div>

              {(result.alreadyInTeam ?? 0) > 0 && (
                <p className="mb-6 text-xs text-[var(--color-ink-muted)]">
                  {result.alreadyInTeam} of the already-joined members were
                  already on the team.
                </p>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="mx-auto mb-6 max-w-lg rounded-md border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3 text-left">
                  <p className="mb-2 text-sm font-medium text-[var(--color-danger)]">
                    {result.errors.length} student
                    {result.errors.length === 1 ? "" : "s"} could not be
                    processed
                  </p>
                  <ul className="space-y-1">
                    {result.errors.map((e) => (
                      <li
                        key={e}
                        className="break-words text-xs text-[var(--color-danger)]"
                      >
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {unmatched.length > 0 && (
                <button
                  onClick={downloadNoAccountCsv}
                  className="bg-white border border-[var(--color-border)] text-[var(--color-ink-muted)] px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--color-canvas)] transition-colors mb-6"
                >
                  Download No-Account List CSV
                </button>
              )}

              <div className="flex justify-center gap-4">
                <Link
                  href="/faculty/roster"
                  className="text-[var(--color-accent)] hover:underline font-medium"
                >
                  View Roster
                </Link>
                <span className="text-[var(--color-border)]">|</span>
                <button
                  onClick={() => {
                    setStep(1)
                    setSelectedTeam(null)
                    setCsvRows([])
                    setCsvPreview("")
                    setMatched([])
                    setUnmatched([])
                    setResult(null)
                    setError(null)
                  }}
                  className="text-[var(--color-accent)] hover:underline font-medium"
                >
                  Onboard Another Class
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
