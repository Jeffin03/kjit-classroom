import { NextResponse } from "next/server"
import { getOrgToken } from "@/backend/github/client"
import { addTeamMaintainer, findTeam } from "@/backend/github/teams"
import {
  getPendingTeacherRequests,
  getTeachers,
  addTeacherProfile,
  getTeacherByGithubUsername,
  approveTeacherRequest,
  denyTeacherRequest,
  removeTeacher,
} from "@/backend/store/teachers"
import { authorize } from "@/backend/services/permissions"
import type { ApprovedTeacherRole, TeacherProfile } from "@/backend/types"

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

  return NextResponse.json({
    requests: getPendingTeacherRequests(),
    teachers: getTeachers().filter((t) => t.role !== "pending"),
  })
}

export async function POST(request: Request) {
  const auth = await authorize("teacher.approve")
  if (!auth.ok) return auth.response

  const { access } = auth.session

  const org = process.env.GITHUB_ORG
  if (!org) return orgNotConfigured()

  const body = await request.json().catch(() => ({}))
  const githubUsername =
    typeof body?.githubUsername === "string"
      ? body.githubUsername.trim().replace(/^@/, "")
      : ""
  const role = body?.role as ApprovedTeacherRole
  const classes = Array.isArray(body?.classes) ? body.classes : []
  const email = typeof body?.email === "string" ? body.email.trim() : ""

  if (!githubUsername) {
    return NextResponse.json(
      { error: "githubUsername is required" },
      { status: 400 }
    )
  }

  if (!GRANTABLE_ROLES.includes(role as GrantableRole)) {
    return NextResponse.json(
      { error: `role must be one of: ${GRANTABLE_ROLES.join(", ")}` },
      { status: 400 }
    )
  }

  const token = await getOrgToken().catch(() => null)
  const warnings: string[] = []
  if (token) {
    for (const className of classes) {
      try {
        const team = await findTeam(token, org, { name: className })
        if (team) {
          await addTeamMaintainer(token, org, team.slug, githubUsername)
        }
      } catch (err) {
        warnings.push(
          `${className}: ${err instanceof Error ? err.message : "failed to grant maintainer access"}`
        )
      }
    }
  }

  const profile: TeacherProfile = {
    id: `teacher-${Date.now()}`,
    githubUsername,
    email,
    role,
    classes,
    approvedBy: access.username,
    approvedAt: new Date().toISOString(),
    requestedAt: new Date().toISOString(),
  }

  addTeacherProfile(profile)

  return NextResponse.json(
    { teacher: profile, warnings: warnings.length > 0 ? warnings : undefined },
    { status: 201 }
  )
}

export async function DELETE(request: Request) {
  const auth = await authorize("teacher.approve")
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username")
  if (!username) {
    return NextResponse.json(
      { error: "username query parameter is required" },
      { status: 400 }
    )
  }

  removeTeacher(username)
  return NextResponse.json({ message: `Teacher @${username} removed` })
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
