import { NextResponse } from "next/server"
import { getOrgToken } from "@/backend/github/client"
import { addTeamMaintainer, findTeam } from "@/backend/github/teams"
import {
  getPendingTeacherRequests,
  getTeacherByGithubUsername,
  approveTeacherRequest,
  denyTeacherRequest,
} from "@/backend/store/teachers"
import { authorize } from "@/backend/services/permissions"

/** Roles an owner may grant when approving a request. */
const GRANTABLE_ROLES = [
  "animator",
  "subject-teacher",
  "elective-teacher",
] as const

type GrantableRole = (typeof GRANTABLE_ROLES)[number]

function orgNotConfigured() {
  return NextResponse.json(
    { error: "GITHUB_ORG not configured" },
    { status: 500 }
  )
}

export async function GET() {
  const auth = await authorize("teacher.approve")
  if (!auth.ok) return auth.response

  if (!process.env.GITHUB_ORG) return orgNotConfigured()

  return NextResponse.json({ requests: getPendingTeacherRequests() })
}

export async function PUT(request: Request) {
  const auth = await authorize("teacher.approve")
  if (!auth.ok) return auth.response

  const { access } = auth.session

  const org = process.env.GITHUB_ORG
  if (!org) return orgNotConfigured()

  const body = await request.json()
  const { githubUsername, action } = body

  if (!githubUsername || !action) {
    return NextResponse.json(
      { error: "githubUsername and action are required" },
      { status: 400 }
    )
  }

  if (action === "approve") {
    const requestedRole = (body.role ?? "animator") as string
    if (!GRANTABLE_ROLES.includes(requestedRole as GrantableRole)) {
      return NextResponse.json(
        { error: `role must be one of: ${GRANTABLE_ROLES.join(", ")}` },
        { status: 400 }
      )
    }
    const role = requestedRole as GrantableRole

    const teacher = getTeacherByGithubUsername(githubUsername)
    if (!teacher || teacher.role !== "pending") {
      return NextResponse.json(
        { error: "No pending request found for this user" },
        { status: 404 }
      )
    }

    // Resolve every class team first so a typo cannot grant access for a class
    // the teacher does not actually teach.
    const token = await getOrgToken()
    const teams = []
    for (const className of teacher.classes) {
      const team = await findTeam(token, org, { name: className })
      if (!team) {
        return NextResponse.json(
          {
            error: `GitHub team "${className}" not found in organization ${org}. Create the team (Closed visibility) or fix the requested class before approving.`,
          },
          { status: 400 }
        )
      }
      teams.push(team)
    }

    const warnings: string[] = []
    for (const team of teams) {
      try {
        await addTeamMaintainer(token, org, team.slug, githubUsername)
      } catch (err) {
        warnings.push(
          `${team.name}: ${err instanceof Error ? err.message : "failed to grant maintainer access"}`
        )
      }
    }

    approveTeacherRequest(githubUsername, access.username, role)

    return NextResponse.json({
      message: "Request approved",
      role,
      warnings: warnings.length > 0 ? warnings : undefined,
    })
  }

  if (action === "deny") {
    denyTeacherRequest(githubUsername)
    return NextResponse.json({ message: "Request denied" })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
