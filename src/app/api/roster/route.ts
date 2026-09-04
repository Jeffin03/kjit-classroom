import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getRoster, getTeams } from "@/lib/data"

export async function GET() {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const roster = getRoster()
  const teams = getTeams()
  return NextResponse.json({ roster, teams })
}
