import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getOrgToken, getOrgOwners } from "@/lib/github"

export async function GET() {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json({ owners: [session.user?.name || ""] })
  }

  try {
    const token = await getOrgToken()
    const owners = await getOrgOwners(token, org)
    return NextResponse.json({ owners })
  } catch {
    return NextResponse.json({ owners: [session.user?.name || ""] })
  }
}
