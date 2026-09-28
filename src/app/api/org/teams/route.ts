import { NextResponse } from "next/server"
import { getOrgToken } from "@/backend/github/client"
import { listTeams } from "@/backend/github/teams"
import { authorize } from "@/backend/services/permissions"

export async function GET() {
  const auth = await authorize("team.read")
  if (!auth.ok) return auth.response

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json({ teams: [] })
  }

  try {
    const { access } = auth.session
    const allTeams = await listTeams(await getOrgToken(), org)
    // Scoped teachers only ever pick from their own classes.
    const teams =
      access.scopedClasses === null
        ? allTeams
        : allTeams.filter((t) => access.scopedClasses!.includes(t.name))

    // Only faculty see team metadata; everyone else just needs the class names
    // to pick from when requesting a role.
    if (!access.isFaculty) {
      return NextResponse.json({
        teams: teams.map((t) => ({ name: t.name, slug: t.slug })),
      })
    }

    return NextResponse.json({ teams })
  } catch {
    return NextResponse.json({ teams: [] })
  }
}
