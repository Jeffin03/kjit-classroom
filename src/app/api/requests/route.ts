import { NextResponse } from "next/server"
import { getOrgToken } from "@/backend/github/client"
import {
  addTeamMaintainer,
  findTeam,
  facultyTeamSlugs,
  isTeamMember,
  removeTeamMember,
} from "@/backend/github/teams"
import { checkOrgMember } from "@/backend/github/org"
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
import { jsonError, readJson } from "@/backend/http"
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

  const body = await readJson<{
    githubUsername?: unknown
    role?: unknown
    classes?: unknown
    email?: unknown
  }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const githubUsername =
    typeof body.githubUsername === "string"
      ? body.githubUsername.trim().replace(/^@/, "")
      : ""
  const role = body.role as ApprovedTeacherRole
  const rawClasses = Array.isArray(body.classes) ? body.classes : []
  const classes = rawClasses
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
  if (classes.length !== rawClasses.length) {
    return jsonError("classes must be a list of class team names")
  }
  const email = typeof body.email === "string" ? body.email.trim() : ""

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

  const token = await getOrgToken(auth.session.accessToken).catch(() => null)
  const warnings: string[] = []
  if (token) {
    // A typo'd or not-yet-invited username would otherwise create a faculty
    // record that grants access to whoever later claims that login.
    try {
      const isMember = await checkOrgMember(token, org, githubUsername)
      if (!isMember) {
        return NextResponse.json(
          {
            error: `@${githubUsername} is not a member of the GitHub organization. Invite them to the org first (or check the spelling), then add them as faculty.`,
          },
          { status: 400 }
        )
      }
    } catch (err) {
      // Missing org permission / rate limit: don't block staffing over a
      // failed verification, but tell the owner it was not verified.
      warnings.push(
        err instanceof Error
          ? `Could not verify org membership: ${err.message}`
          : "Could not verify org membership"
      )
    }

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
  } else {
    warnings.push(
      "No org token configured — org membership was not verified and class teams were not updated"
    )
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

  const org = process.env.GITHUB_ORG
  if (!org) return orgNotConfigured()

  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username")
  if (!username) {
    return NextResponse.json(
      { error: "username query parameter is required" },
      { status: 400 }
    )
  }

  const teacher = getTeacherByGithubUsername(username)
  if (!teacher) {
    return NextResponse.json(
      { error: `No faculty record for @${username}` },
      { status: 404 }
    )
  }

  const token = await getOrgToken(auth.session.accessToken).catch(() => null)
  const warnings: string[] = []
  const removedFromClassTeams: string[] = []

  if (token) {
    for (const className of teacher.classes ?? []) {
      try {
        const team = await findTeam(token, org, { name: className })
        if (team && (await removeTeamMember(token, org, team.slug, username))) {
          removedFromClassTeams.push(team.name)
        }
      } catch (err) {
        warnings.push(
          `${className}: ${err instanceof Error ? err.message : "failed to remove team membership"}`
        )
      }
    }
  } else {
    warnings.push(
      "No org token configured — class team membership was not changed on GitHub"
    )
  }

  // Team membership is the source of truth for faculty access, so deleting the
  // in-app record alone does not revoke it. Report that honestly instead of
  // telling the owner the teacher was removed.
  let stillInFacultyTeam = false
  if (token) {
    for (const slug of facultyTeamSlugs()) {
      try {
        if (await isTeamMember(token, org, slug, username)) {
          stillInFacultyTeam = true
          break
        }
      } catch {
        // Unknown permissions/network: fall through to the generic wording.
      }
    }
  }

  removeTeacher(username)

  return NextResponse.json({
    message: stillInFacultyTeam
      ? `Removed @${username}'s class scope, but they are still in the GitHub faculty team and keep institute-wide access. Remove them from that team on github.com to revoke it.`
      : `Faculty access removed for @${username}.`,
    stillInFacultyTeam,
    removedFromClassTeams,
    warnings: warnings.length > 0 ? warnings : undefined,
  })
}

export async function PUT(request: Request) {
  const auth = await authorize("teacher.approve")
  if (!auth.ok) return auth.response

  const { access } = auth.session

  const org = process.env.GITHUB_ORG
  if (!org) return orgNotConfigured()

  const body = await readJson<{
    githubUsername?: string
    action?: string
    role?: string
  }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const { githubUsername, action } = body

  if (
    typeof githubUsername !== "string" ||
    typeof action !== "string" ||
    !githubUsername ||
    !action
  ) {
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
    const token = await getOrgToken(auth.session.accessToken)
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
