import { NextResponse } from "next/server"
import { getOrgToken } from "@/backend/github/client"
import { listTeams } from "@/backend/github/teams"
import { authorize } from "@/backend/services/permissions"
import { isDevTestAuthEnabled, TEST_CLASSES } from "@/backend/dev/testAccounts"

export async function GET() {
  const auth = await authorize("team.read")
  if (!auth.ok) return auth.response

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json({ teams: [] })
  }

  try {
    const { access } = auth.session
    let allTeams
    if (isDevTestAuthEnabled()) {
      allTeams = TEST_CLASSES.map((name, i) => ({
        id: i,
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description: null,
        members_count: 0,
      }))
    } else {
      allTeams = await listTeams(await getOrgToken(auth.session.accessToken), org).catch(() => [])
    }
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
  } catch (err) {
    // Surface the real reason (missing org token, bad credentials, ...) —
    // swallowing it here leaves the onboarding wizard with a dead-end
    // "the org request failed" box and no way to diagnose.
    return NextResponse.json({
      teams: [],
      error: err instanceof Error ? err.message : "Failed to load classes",
    })
  }
}
