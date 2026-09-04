import { NextResponse } from "next/server"
import { auth } from "@/backend/auth"
import { getOrgToken, listTeams } from "@/backend/lib/github"

export async function GET() {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json({ teams: [] })
  }

  try {
    const token = await getOrgToken()
    const teams = await listTeams(token, org)
    return NextResponse.json({ teams })
  } catch {
    return NextResponse.json({ teams: [] })
  }
}
