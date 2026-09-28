import { NextResponse } from "next/server"
import { getRoster, getRosterByClassTeam, getTeams } from "@/backend/store/roster"
import { authorize } from "@/backend/services/permissions"

export async function GET() {
  const auth = await authorize("roster.read")
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const scope = access.scopedClasses

  // Scoped teachers only see the class teams they teach — the roster rows AND
  // the team picker, otherwise a scoped teacher could select a class outside
  // their scope and only find out at submit time. Their own class list is
  // included even before any student is onboarded into it.
  const roster =
    scope === null
      ? getRoster()
      : scope.flatMap((team) => getRosterByClassTeam(team))
  const teams = scope === null ? getTeams() : [...scope].sort()

  return NextResponse.json({ roster, teams, scope })
}
