import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  getPendingTeacherRequests,
  getTeacherByGithubUsername,
  approveTeacherRequest,
  denyTeacherRequest,
} from "@/lib/data"
import { getOrgToken, getOrgOwners, addTeamMaintainer } from "@/lib/github"

export async function GET() {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json(
      { error: "GITHUB_ORG not configured" },
      { status: 500 }
    )
  }

  try {
    const token = await getOrgToken()
    const owners = await getOrgOwners(token, org)
    const currentUser = session.user?.name

    if (!currentUser || !owners.includes(currentUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const requests = getPendingTeacherRequests()
    return NextResponse.json({ requests })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json(
      { error: "GITHUB_ORG not configured" },
      { status: 500 }
    )
  }

  const body = await request.json()
  const { githubUsername, action } = body

  if (!githubUsername || !action) {
    return NextResponse.json(
      { error: "githubUsername and action are required" },
      { status: 400 }
    )
  }

  try {
    const token = await getOrgToken()
    const owners = await getOrgOwners(token, org)
    const currentUser = session.user?.name

    if (!currentUser || !owners.includes(currentUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (action === "approve") {
      const teacher = getTeacherByGithubUsername(githubUsername)
      if (!teacher || teacher.role !== "pending") {
        return NextResponse.json(
          { error: "No pending request found for this user" },
          { status: 404 }
        )
      }

      approveTeacherRequest(githubUsername, currentUser)

      for (const className of teacher.classes) {
        const teamSlug = className
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
        await addTeamMaintainer(token, org, teamSlug, githubUsername)
      }

      return NextResponse.json({ message: "Request approved" })
    } else if (action === "deny") {
      denyTeacherRequest(githubUsername)
      return NextResponse.json({ message: "Request denied" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    )
  }
}
