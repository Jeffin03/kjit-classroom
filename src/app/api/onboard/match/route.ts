import { NextResponse } from "next/server"
import { githubFetch, getOrgToken } from "@/backend/github/client"
import { authorize, canAccessClass } from "@/backend/services/permissions"
import { jsonError, readJson } from "@/backend/http"

const MAX_ROWS = 500

interface CsvRow {
  rollNo: string
  collegeEmail: string
  githubUsername?: string
}

interface MatchedStudent {
  rollNo: string
  collegeEmail: string
  githubUsername: string
  githubAvatar: string
  githubId: number
  matchedVia: "email" | "username"
}

interface UnmatchedStudent {
  rollNo: string
  collegeEmail: string
}

const isRateLimited = (status: number) => status === 403 || status === 429

export async function POST(request: Request) {
  const auth = await authorize("roster.write")
  if (!auth.ok) return auth.response

  const { access } = auth.session

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json(
      { error: "GITHUB_ORG not configured" },
      { status: 500 }
    )
  }

  const body = await readJson<{ csvRows?: unknown; classTeam?: string }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const { csvRows, classTeam } = body

  if (!Array.isArray(csvRows) || csvRows.length === 0 || !classTeam) {
    return NextResponse.json(
      { error: "csvRows and classTeam are required" },
      { status: 400 }
    )
  }

  if (csvRows.length > MAX_ROWS) {
    return NextResponse.json(
      {
        error: `Too many rows (${csvRows.length}). Split the file into batches of ${MAX_ROWS} or fewer.`,
      },
      { status: 400 }
    )
  }

  // Validate before the loop: every row drives at least one GitHub API call,
  // so a malformed row should fail fast rather than halfway through.
  for (let i = 0; i < csvRows.length; i++) {
    const row = csvRows[i] as Partial<CsvRow> | null
    if (
      !row ||
      typeof row.rollNo !== "string" ||
      !row.rollNo.trim() ||
      typeof row.collegeEmail !== "string" ||
      !row.collegeEmail.trim()
    ) {
      return jsonError(`Row ${i + 1} needs a rollNo and collegeEmail`)
    }
    if (
      row.githubUsername !== undefined &&
      typeof row.githubUsername !== "string"
    ) {
      return jsonError(`Row ${i + 1} has an invalid githubUsername`)
    }
  }

  if (!canAccessClass(access, classTeam)) {
    return NextResponse.json(
      { error: "You are not permitted to onboard students for this class" },
      { status: 403 }
    )
  }

  try {
    const token = await getOrgToken()

    const matched: MatchedStudent[] = []
    const unmatched: UnmatchedStudent[] = []
    const rows = csvRows as CsvRow[]
    let processed = 0

    for (const row of rows) {
      const username = row.githubUsername?.trim().replace(/^@/, "") ?? ""

      // A supplied username is authoritative and bypasses the search API
      // entirely — search only indexes public profile emails, so the
      // email path silently misses most students.
      if (username) {
        const res = await githubFetch(
          `/users/${encodeURIComponent(username)}`,
          token
        ).catch(() => null)

        if (res && isRateLimited(res.status)) {
          return NextResponse.json(
            {
              error: `GitHub API rate limit reached after ${processed} of ${rows.length} rows. Wait about a minute and try again, or remove the github_username column to fall back to email matching.`,
            },
            { status: 429 }
          )
        }

        if (res?.ok) {
          const ghUser = await res.json()
          if (
            typeof ghUser.login === "string" &&
            ghUser.login.toLowerCase() === username.toLowerCase()
          ) {
            matched.push({
              rollNo: row.rollNo,
              collegeEmail: row.collegeEmail,
              githubUsername: ghUser.login,
              githubAvatar: ghUser.avatar_url,
              githubId: ghUser.id,
              matchedVia: "username",
            })
            processed++
            continue
          }
        }
        // Lookup failed (unknown account, network error, or the column
        // doesn't hold a username) — fall through to email matching.
      }

      const email = row.collegeEmail.toLowerCase().trim()

      const searchRes = await githubFetch(
        `/search/users?q=${encodeURIComponent(email)}+in:email`,
        token
      ).catch(() => null)

      if (searchRes && isRateLimited(searchRes.status)) {
        return NextResponse.json(
          {
            error: `GitHub search rate limit reached (30 requests/min) after ${processed} of ${rows.length} rows. Wait about a minute and try again, or add a github_username column to skip search entirely.`,
          },
          { status: 429 }
        )
      }

      if (searchRes?.ok) {
        const searchData = await searchRes.json()
        if (searchData.items?.length > 0) {
          const ghUser = searchData.items[0]
          matched.push({
            rollNo: row.rollNo,
            collegeEmail: row.collegeEmail,
            githubUsername: ghUser.login,
            githubAvatar: ghUser.avatar_url,
            githubId: ghUser.id,
            matchedVia: "email",
          })
          processed++
          continue
        }
      }

      // Neither path found an account.
      unmatched.push({
        rollNo: row.rollNo,
        collegeEmail: row.collegeEmail,
      })
      processed++
    }

    return NextResponse.json({ matched, unmatched })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to match" },
      { status: 500 }
    )
  }
}
