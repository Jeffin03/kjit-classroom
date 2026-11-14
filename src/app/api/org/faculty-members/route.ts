import { NextResponse } from "next/server"
import { getOrgToken } from "@/backend/github/client"
import { isFacultyTeam, getTeamMembers, listTeams } from "@/backend/github/teams"
import { githubFetch } from "@/backend/github/client"
import { authorize } from "@/backend/services/permissions"

export interface FacultyMember {
  login: string
  name: string | null
  email: string | null
  avatar: string | null
  teams: string[]
}

export async function GET() {
  const auth = await authorize("teacher.approve")
  if (!auth.ok) return auth.response

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json({ error: "GITHUB_ORG not configured" }, { status: 500 })
  }

  const token = await getOrgToken(auth.session.accessToken).catch(() => null)
  if (!token) {
    return NextResponse.json({ error: "Org token unavailable" }, { status: 500 })
  }

  try {
    // Every team that counts as faculty, not just the first probe hit: the
    // production org's team is named "KJIT Faculty", and an org may hold both
    // a legacy "faculty" team and the new one during migration.
    const facultyTeams = (await listTeams(token, org).catch(() => [])).filter(
      isFacultyTeam
    )

    const byLogin = new Map<string, FacultyMember>()
    for (const team of facultyTeams) {
      const logins = await getTeamMembers(token, org, team.slug)
      for (const login of logins) {
        const key = login.toLowerCase()
        const existing = byLogin.get(key)
        if (existing) {
          existing.teams.push(team.name)
        } else {
          byLogin.set(key, {
            login,
            name: null,
            email: null,
            avatar: null,
            teams: [team.name],
          })
        }
      }
    }

    const members = await Promise.all(
      [...byLogin.values()].map(async (member) => {
        try {
          const res = await githubFetch(
            `/users/${encodeURIComponent(member.login)}`,
            token
          )
          if (res.ok) {
            const profile = await res.json()
            member.login = profile.login || member.login
            member.name =
              typeof profile.name === "string" && profile.name.trim()
                ? profile.name.trim()
                : null
            member.email =
              typeof profile.email === "string" ? profile.email.trim() : null
            member.avatar =
              typeof profile.avatar_url === "string" ? profile.avatar_url : null
          }
        } catch {
          // ignore profile fetch failure — the login alone still lists them
        }
        return member
      })
    )

    return NextResponse.json({
      members,
      teams: facultyTeams.map((t) => t.name),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
