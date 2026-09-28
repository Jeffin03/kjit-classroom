import { NextResponse } from "next/server"
import { getOrgToken } from "@/backend/github/client"
import { authorize, canAccessClass } from "@/backend/services/permissions"

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
}

interface UnmatchedStudent {
  rollNo: string
  collegeEmail: string
}

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
    const GITHUB_API = "https://api.github.com"

    const matched: MatchedStudent[] = []
    const unmatched: UnmatchedStudent[] = []

    for (const row of csvRows as CsvRow[]) {
      const email = row.collegeEmail.toLowerCase().trim()

      try {
        const searchRes = await fetch(
          `${GITHUB_API}/search/users?q=${encodeURIComponent(email)}+in:email`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
            },
          }
        )

        if (searchRes.ok) {
          const searchData = await searchRes.json()
          if (searchData.items?.length > 0) {
            const ghUser = searchData.items[0]
            matched.push({
              rollNo: row.rollNo,
              collegeEmail: row.collegeEmail,
              githubUsername: ghUser.login,
              githubAvatar: ghUser.avatar_url,
              githubId: ghUser.id,
            })
            continue
          }
        }
      } catch {
        // search failed, treat as unmatched
      }

      unmatched.push({
        rollNo: row.rollNo,
        collegeEmail: row.collegeEmail,
      })
    }

    return NextResponse.json({ matched, unmatched })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to match" },
      { status: 500 }
    )
  }
}
