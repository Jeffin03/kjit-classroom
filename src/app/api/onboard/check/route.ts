import { NextResponse } from "next/server"
import { authenticate, authorize, canAccessClass } from "@/backend/services/permissions"
import { getOrgToken } from "@/backend/github/client"
import { findTeam, getTeamMembers } from "@/backend/github/teams"
import { getRosterByClassTeam } from "@/backend/store/roster"

/**
 * Check invitation status for a class: compare invited students against
 * current GitHub team members to show which invites have been accepted.
 */
export async function GET(request: Request) {
  const auth = await authenticate()
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const { searchParams } = new URL(request.url)
  const classTeam = searchParams.get("classTeam")

  if (!classTeam || typeof classTeam !== "string") {
    return NextResponse.json({ error: "classTeam is required" }, { status: 400 })
  }

  if (!canAccessClass(access, classTeam)) {
    return NextResponse.json({ error: "Access denied for this class" }, { status: 403 })
  }

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json({ error: "GITHUB_ORG not configured" }, { status: 500 })
  }

  const roster = getRosterByClassTeam(classTeam)
  const token = await getOrgToken().catch(() => null)

  if (!token) {
    return NextResponse.json({ error: "Org token unavailable" }, { status: 500 })
  }

  try {
    const team = await findTeam(token, org, { name: classTeam })
    if (!team) {
      return NextResponse.json({ error: "Class team not found" }, { status: 404 })
    }

    const members = await getTeamMembers(token, org, team.slug)
    const memberLogins = new Set(members)

    const invited = roster.filter(
      (entry) => entry.status === "invited" || entry.status === "active"
    )

    const statusList = invited.map((entry) => {
      const username = entry.githubUsername?.toLowerCase()
      const accepted = username ? memberLogins.has(username) : false
      return {
        rollNo: entry.rollNo,
        collegeEmail: entry.collegeEmail,
        githubUsername: entry.githubUsername,
        status: entry.status,
        accepted,
      }
    })

    return NextResponse.json({
      classTeam,
      totalInvited: invited.length,
      totalAccepted: statusList.filter((s) => s.accepted).length,
      students: statusList,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
