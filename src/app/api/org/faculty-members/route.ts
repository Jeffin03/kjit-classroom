import { NextResponse } from "next/server"
import { getOrgToken } from "@/backend/github/client"
import { facultyTeamSlugs, findTeam, getTeamMembers } from "@/backend/github/teams"
import { githubFetch } from "@/backend/github/client"
import { authorize } from "@/backend/services/permissions"

export async function GET() {
  const auth = await authorize("teacher.approve")
  if (!auth.ok) return auth.response

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json({ error: "GITHUB_ORG not configured" }, { status: 500 })
  }

  const token = await getOrgToken().catch(() => null)
  if (!token) {
    return NextResponse.json({ error: "Org token unavailable" }, { status: 500 })
  }

  try {
    const slug = facultyTeamSlugs()[0]
    const team = await findTeam(token, org, { slug })
    if (!team) {
      return NextResponse.json({ members: [] })
    }

    const logins = await getTeamMembers(token, org, team.slug)
    const members = await Promise.all(
      logins.map(async (login) => {
        try {
          const res = await githubFetch(`/users/${encodeURIComponent(login)}`, token)
          if (res.ok) {
            const profile = await res.json()
            return {
              login: profile.login || login,
              email: typeof profile.email === "string" ? profile.email.trim() : null,
              avatar: typeof profile.avatar_url === "string" ? profile.avatar_url : null,
            }
          }
        } catch {
          // ignore profile fetch failure
        }
        return { login, email: null, avatar: null }
      })
    )

    return NextResponse.json({ members: members.filter(Boolean) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
