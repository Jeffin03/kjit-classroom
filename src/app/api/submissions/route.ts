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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const assignmentId = searchParams.get("assignmentId")

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

  if (access.capabilities.has("submission.readAll")) {
    return NextResponse.json(getSubmissionsForFaculty(access.scopedClasses))
  }

  if (access.capabilities.has("submission.readOwn")) {
    return NextResponse.json(getSubmissionsForStudent(access.username))
  }

  return NextResponse.json([])
}

export async function POST(request: Request) {
  const auth = await authorize("submission.create")
  if (!auth.ok) return auth.response

  const { access, accessToken } = auth.session

  const body = await readJson<{
    assignmentId?: string
    repoUrl?: string
    abstractDocUrl?: string
  }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const { assignmentId, repoUrl, abstractDocUrl } = body

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

  // Sprint 0 must satisfy the same repo-ownership rule as every later sprint,
  // otherwise a submission could be started on someone else's repo and then
  // be impossible to advance.
  let repoOwner: string
  try {
    ;({ owner: repoOwner } = parseRepoUrl(repoUrl))
  } catch {
    return NextResponse.json(
      { error: "Malformed repository URL" },
      { status: 400 }
    )
  }

  if (!canUseRepo(access, repoOwner)) {
    return NextResponse.json(
      { error: "You can only submit from your own repositories" },
      { status: 403 }
    )
  }

  try {
    const submission = await createSubmission(
      {
        studentUsername: access.username,
        assignmentId,
        repoUrl,
        abstractDocUrl,
      },
      accessToken
    )
    return NextResponse.json(submission, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create submission"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
