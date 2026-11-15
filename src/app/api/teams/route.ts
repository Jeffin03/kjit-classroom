import { NextResponse } from "next/server"
import {
  authenticate,
  canAccessAssignment,
} from "@/backend/services/permissions"
import {
  createTeam,
  getTeams,
  getTeamsByAssignment,
  getTeamByMember,
  getTeamByMemberAndAssignment,
} from "@/backend/store/teams"
import { getAssignment } from "@/backend/store/assignments"
import { isStudentAssigned } from "@/backend/services/assignment.service"
import { jsonError, readJson } from "@/backend/http"
import { flushNow } from "@/backend/store/persistence"
import type { CreateTeamInput } from "@/backend/types"
import { csrfCheck } from "@/backend/csrf"
import { rateLimit, getClientIp } from "@/backend/rateLimit"

export async function GET(request: Request) {
  const auth = await authenticate()
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const { searchParams } = new URL(request.url)
  const assignmentId = searchParams.get("assignmentId")

  if (assignmentId) {
    // Faculty viewing all teams for an assignment
    const assignment = getAssignment(assignmentId)
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    if (access.capabilities.has("submission.readAll")) {
      if (!canAccessAssignment(access, assignment)) {
        return NextResponse.json(
          { error: "This assignment is outside your classes" },
          { status: 403 }
        )
      }
      return NextResponse.json({ teams: getTeamsByAssignment(assignmentId) })
    }

    // Student: only see their own team, plus a lightweight summary of
    // teams that still have space so they can join one.
    if (!isStudentAssigned(assignment, access.team)) {
      return NextResponse.json(
        { error: "This assignment is not assigned to your team" },
        { status: 403 }
      )
    }

    const team = getTeamByMemberAndAssignment(access.username, assignmentId)
    const joinable = getTeamsByAssignment(assignmentId)
      .filter((t) => t.id !== team?.id && t.members.length < 3)
      .map((t) => ({
        id: t.id,
        projectTitle: t.projectTitle,
        memberCount: t.members.length,
        members: t.members.map((m) => ({
          username: m.username,
          displayName: m.displayName,
          rollNo: m.rollNo,
          isLead: m.isLead,
        })),
        createdAt: t.createdAt,
      }))
    return NextResponse.json({ teams: team ? [team] : [], joinable })
  }

  // No assignment filter: return teams the user can see
  if (access.capabilities.has("submission.readAll")) {
    return NextResponse.json({ teams: getTeams() })
  }

  const team = getTeamByMember(access.username)
  return NextResponse.json({ teams: team ? [team] : [] })
}

export async function POST(request: Request) {
  const csrf = csrfCheck(request)
  if (csrf) return csrf

  const ip = getClientIp(request)
  const rl = rateLimit(`teams:post:${ip}`, { limit: 5, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  const auth = await authenticate()
  if (!auth.ok) return auth.response

  const { access } = auth.session

  // Only students can create teams
  if (access.role !== "student") {
    return NextResponse.json(
      { error: "Only students can create teams" },
      { status: 403 }
    )
  }

  const body = await readJson<CreateTeamInput>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const { assignmentId, projectTitle, members, creatorRollNo } = body

  if (
    typeof assignmentId !== "string" ||
    typeof projectTitle !== "string" ||
    !Array.isArray(members)
  ) {
    return jsonError("assignmentId, projectTitle, and members are required")
  }

  if (!assignmentId || !projectTitle || members.length < 1 || members.length > 3) {
    return jsonError(
      "Invalid input: projectTitle required, members must be 1-3"
    )
  }

  const assignment = getAssignment(assignmentId)
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
  }

  if (!isStudentAssigned(assignment, access.team)) {
    return NextResponse.json(
      { error: "This assignment is not assigned to your team" },
      { status: 403 }
    )
  }

  // Creator must be in the members list
  if (!members.includes(access.username)) {
    return jsonError("You must include yourself in the team members list")
  }

  try {
    const team = createTeam({
      assignmentId,
      projectTitle: projectTitle.trim(),
      members,
      creatorRollNo,
    })
    await flushNow()
    return NextResponse.json({ team }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create team"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
