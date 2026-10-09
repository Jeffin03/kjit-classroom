import { NextResponse } from "next/server"
import { githubFetch, getOrgToken } from "@/backend/github/client"
import { authorize, canAccessClass } from "@/backend/services/permissions"

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

  const body = await request.json()
  const { csvRows, classTeam } = body

  if (!csvRows?.length || !classTeam) {
    return NextResponse.json(
      { error: "csvRows and classTeam are required" },
      { status: 400 }
    )
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
