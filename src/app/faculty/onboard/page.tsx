"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"

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

export default function OnboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>(1)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [csvRows, setCsvRows] = useState<CsvRow[]>([])
  const [csvPreview, setCsvPreview] = useState<string>("")
  const [matched, setMatched] = useState<MatchedStudent[]>([])
  const [unmatched, setUnmatched] = useState<UnmatchedStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [result, setResult] = useState<{
    addedToTeam: number
    invited: number
    alreadyMember: number
    noAccount: number
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
        fetch("/api/teachers").then((r) => r.json()),
        fetch("/api/org/teams").then((r) => r.json()),
      ]).then(([ownersData, teacherData, teamsData]) => {
        const isOwner = ownersData.owners?.includes(session.user?.name)
        const isAnimator = teacherData.profile?.role === "animator"

        if (!isOwner && !isAnimator) {
          router.push("/faculty/request")
          return
        }

        if (Array.isArray(teamsData.teams)) {
          setTeams(teamsData.teams)
        }
        setLoadingTeams(false)
      }).catch(() => setLoadingTeams(false))
    }
  }, [session, router])

  const parseCsv = (content: string) => {
    const lines = content.trim().split("\n")
    if (lines.length < 2) return []

    const header = lines[0].toLowerCase()
    const hasRollNo = header.includes("roll")
    const hasEmail = header.includes("email")

    const rows: CsvRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim())
      if (cols.length >= 2) {
        const rollNo = hasRollNo ? cols[0] : cols[0]
        const email = hasEmail ? cols[1] : cols[1]
        if (rollNo && email) {
          rows.push({ rollNo, collegeEmail: email })
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
    try {
      const res = await fetch("/api/onboard/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvRows, classTeam: selectedTeam }),
      })
      const data = await res.json()

      if (res.ok) {
        setMatched(
          data.matched.map((s: MatchedStudent) => ({ ...s, selected: true }))
        )
        setUnmatched(data.unmatched)
        setStep(3)
      }
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    setLoading(true)
    try {
      const selectedMatched = matched.filter((s) => s.selected)
      const res = await fetch("/api/onboard/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matched: selectedMatched,
          unmatched,
          classTeam: selectedTeam,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        setResult(data)
        setStep(5)
      }
    } catch {
      // handle error
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
    if (!unmatched.length) return
    const header = "roll_no,college_email,status\n"
    const rows = unmatched
      .map((s) => `${s.rollNo},${s.collegeEmail},no_github_account`)
      .join("\n")
    const blob = new Blob([header + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedTeam.replace(/\s+/g, "_")}_no_github_account.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (status === "loading" || loadingTeams) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Onboard Students
        </h1>
        <p className="text-gray-600 mt-2">
          Add students to your class team on GitHub
        </p>
      </div>

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
                        ? "bg-green-500 text-white"
                        : isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 text-gray-500"
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
                    className={`text-xs mt-2 ${isActive ? "text-indigo-600 font-medium" : "text-gray-500"}`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mt-[-20px] ${
                      isComplete ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Step 1: Select Class */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Class
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teams.map((team) => (
                <button
                  key={team.slug}
                  onClick={() => setSelectedTeam(team.name)}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    selectedTeam === team.name
                      ? "bg-indigo-50 border-indigo-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-gray-900">{team.name}</div>
                  <div className="text-sm text-gray-500">
                    {team.members_count} members
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedTeam}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Upload CSV */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Student CSV
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Format: <code className="bg-gray-100 px-1 rounded">roll_no, college_email</code>
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Example: <code className="bg-gray-100 px-1 rounded">25MCA024, 25mca024@kristujayanti.com</code>
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
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
            >
              <svg
                className="w-8 h-8 text-gray-400 mx-auto mb-2"
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
              <p className="text-gray-600">
                {csvRows.length > 0
                  ? `${csvRows.length} rows loaded`
                  : "Click to select CSV file"}
              </p>
            </button>

            {csvRows.length > 0 && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">
                  Preview (first 5 rows):
                </p>
                <div className="overflow-x-auto">
                  <table className="text-xs">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left pr-4 pb-1">Roll No</th>
                        <th className="text-left pb-1">College Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          <td className="pr-4 pb-1 text-gray-800">
                            {row.rollNo}
                          </td>
                          <td className="pb-1 text-gray-800">
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
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleMatch}
                disabled={!csvRows.length || loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Matching..." : "Match with GitHub"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verify Students */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Verify Students
            </h2>

            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">
                  Matched ({matched.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm text-gray-600">
                  Not on GitHub ({unmatched.length})
                </span>
              </div>
            </div>

            {matched.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Matched Students
                </h3>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {matched.map((student) => (
                    <label
                      key={student.rollNo}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={student.selected}
                        onChange={() => toggleStudent(student.rollNo)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <img
                        src={student.githubAvatar}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {student.rollNo} — @{student.githubUsername}
                        </div>
                        <div className="text-xs text-gray-500">
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
                  <h3 className="text-sm font-medium text-gray-700">
                    Not on GitHub
                  </h3>
                  <button
                    onClick={downloadNoAccountCsv}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Download List CSV
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {unmatched.map((student) => (
                    <div
                      key={student.rollNo}
                      className="flex items-center gap-3 p-3"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-medium">
                        ?
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.rollNo}
                        </div>
                        <div className="text-xs text-gray-500">
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
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={matched.filter((s) => s.selected).length === 0}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm & Invite */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm & Send Invites
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">
                  Students to add to team
                </span>
                <span className="font-medium text-gray-900">
                  {matched.filter((s) => s.selected).length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">
                  Students needing org invites
                </span>
                <span className="font-medium text-blue-600">
                  {matched.filter((s) => s.selected).length}
                </span>
              </div>
              {unmatched.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">
                    Students without GitHub accounts
                  </span>
                  <span className="font-medium text-red-600">
                    {unmatched.length}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleInvite}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Processing..." : "Confirm & Send Invites"}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 5 && result && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Onboarding Complete
            </h2>
            <p className="text-gray-600 mb-6">
              {selectedTeam}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 max-w-lg mx-auto">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {result.addedToTeam}
                </div>
                <div className="text-xs text-gray-500">Added to team</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {result.invited}
                </div>
                <div className="text-xs text-gray-500">Invites sent</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {result.alreadyMember}
                </div>
                <div className="text-xs text-gray-500">Already members</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {result.noAccount}
                </div>
                <div className="text-xs text-gray-500">No account</div>
              </div>
            </div>

            {unmatched.length > 0 && (
              <button
                onClick={downloadNoAccountCsv}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors mb-6"
              >
                Download No-Account List CSV
              </button>
            )}

            <div className="flex justify-center gap-4">
              <a
                href="/faculty/roster"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View Roster
              </a>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => {
                  setStep(1)
                  setSelectedTeam("")
                  setCsvRows([])
                  setCsvPreview("")
                  setMatched([])
                  setUnmatched([])
                  setResult(null)
                }}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Onboard Another Class
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
