import { NextResponse } from "next/server"
import {
  getSubmissionsForStudent,
  getSubmissionsForAssignment,
  getSubmissionsForFaculty,
  createSubmission,
} from "@/backend/services/submission.service"
import {
  authenticate,
  authorize,
  canAccessAssignment,
  canUseRepo,
  resolveAssignment,
} from "@/backend/services/permissions"
import { parseRepoUrl } from "@/backend/github/repos"
import { isStudentAssigned } from "@/backend/services/assignment.service"
import { jsonError, readJson } from "@/backend/http"
import { flushNow } from "@/backend/store/persistence"
import { getTeamByMemberAndAssignment } from "@/backend/store/teams"
import { csrfCheck } from "@/backend/csrf"
import { rateLimit, getClientIp } from "@/backend/rateLimit"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const assignmentId = searchParams.get("assignmentId")
  const student = searchParams.get("student")

  if (assignmentId) {
    const auth = await authorize("submission.readAll")
    if (!auth.ok) return auth.response

    const assignment = resolveAssignment(assignmentId)
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }
    if (!canAccessAssignment(auth.session.access, assignment)) {
      return NextResponse.json(
        { error: "This assignment is outside your classes" },
        { status: 403 }
      )
    }

    return NextResponse.json(getSubmissionsForAssignment(assignmentId))
  }

  const auth = await authenticate()
  if (!auth.ok) return auth.response
  const { access } = auth.session

  if (student) {
    const isSelf = access.username.toLowerCase() === student.toLowerCase()
    const isFaculty =
      access.isFaculty || access.capabilities.has("submission.readAll")

    if (!isSelf && !isFaculty) {
      return NextResponse.json(
        { error: "Not authorized to view this student's submissions" },
        { status: 403 }
      )
    }

    return NextResponse.json(getSubmissionsForStudent(student))
  }

  if (access.capabilities.has("submission.readAll")) {
    return NextResponse.json(getSubmissionsForFaculty(access.scopedClasses))
  }

  if (access.capabilities.has("submission.readOwn")) {
    return NextResponse.json(getSubmissionsForStudent(access.username))
  }

  return NextResponse.json([])
}

export async function POST(request: Request) {
  const csrf = csrfCheck(request)
  if (csrf) return csrf

  const ip = getClientIp(request)
  const rl = rateLimit(`submissions:post:${ip}`, { limit: 10, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  const auth = await authorize("submission.create")
  if (!auth.ok) return auth.response

  const { access, accessToken } = auth.session

  const body = await readJson<{
    assignmentId?: string
    repoUrl?: string
    abstractDocUrl?: string
    teamId?: string
    teamMembers?: string[]
  }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const { assignmentId, repoUrl, abstractDocUrl, teamId, teamMembers } = body

  if (
    typeof assignmentId !== "string" ||
    typeof repoUrl !== "string" ||
    typeof abstractDocUrl !== "string" ||
    !assignmentId ||
    !repoUrl ||
    !abstractDocUrl
  ) {
    return NextResponse.json(
      { error: "assignmentId, repoUrl, and abstractDocUrl are required" },
      { status: 400 }
    )
  }

  const assignment = resolveAssignment(assignmentId)
  if (!assignment) {
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 }
    )
  }

  if (!isStudentAssigned(assignment, access.team)) {
    return NextResponse.json(
      { error: "This assignment is not assigned to your team" },
      { status: 403 }
    )
  }

  // If a teamId is provided, verify the submitter is a member of that team.
  // Repo ownership check: any team member's repo is acceptable for a team
  // submission; otherwise the submitter must own the repo.
  let repoOwner: string
  try {
    ;({ owner: repoOwner } = parseRepoUrl(repoUrl))
  } catch {
    return NextResponse.json(
      { error: "Malformed repository URL" },
      { status: 400 }
    )
  }

  if (teamId) {
    const team = getTeamByMemberAndAssignment(access.username, assignmentId)
    if (!team || team.id !== teamId) {
      return NextResponse.json(
        { error: "You are not a member of this team for this assignment" },
        { status: 403 }
      )
    }
    // For team submissions, any member's repo is fine.
    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json(
        { error: "teamMembers is required for team submissions" },
        { status: 400 }
      )
    }
    if (!teamMembers.includes(access.username)) {
      return NextResponse.json(
        { error: "You must be listed in teamMembers" },
        { status: 403 }
      )
    }
  } else {
    // Solo submission: submitter must own the repo
    if (!canUseRepo(access, repoOwner)) {
      return NextResponse.json(
        { error: "You can only submit from your own repositories" },
        { status: 403 }
      )
    }
  }

  try {
    const submission = await createSubmission(
      {
        studentUsername: access.username,
        teamId,
        teamMembers,
        assignmentId,
        repoUrl,
        abstractDocUrl,
      },
      accessToken
    )
    await flushNow()
    return NextResponse.json(submission, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create submission"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
