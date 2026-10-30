import { NextResponse } from "next/server"
import { getSubmissionById, getSprintSubmission } from "@/backend/store/submissions"
import { updateSprintCommitHash } from "@/backend/services/submission.service"
import {
  authenticate,
  authorize,
  canAccessSubmission,
} from "@/backend/services/permissions"
import { jsonError, readJson } from "@/backend/http"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; sprint: string }> }
) {
  const auth = await authenticate()
  if (!auth.ok) return auth.response

  const { access } = auth.session

  const { id, sprint } = await params
  const sprintNumber = parseInt(sprint, 10)
  if (isNaN(sprintNumber)) {
    return NextResponse.json({ error: "Invalid sprint number" }, { status: 400 })
  }

  const submission = getSubmissionById(id)
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  if (!canAccessSubmission(access, submission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sprintData = getSprintSubmission(id, sprintNumber)
  if (!sprintData) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 })
  }

  return NextResponse.json(sprintData)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sprint: string }> }
) {
  const auth = await authorize("submission.commitOverride")
  if (!auth.ok) return auth.response

  const { access } = auth.session

  const { id, sprint } = await params
  const sprintNumber = parseInt(sprint, 10)
  if (isNaN(sprintNumber)) {
    return NextResponse.json({ error: "Invalid sprint number" }, { status: 400 })
  }

  const submission = getSubmissionById(id)
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  if (!canAccessSubmission(access, submission)) {
    return NextResponse.json(
      { error: "This submission is outside your classes" },
      { status: 403 }
    )
  }

  const body = await readJson<{ commitSha?: string }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const { commitSha } = body
  if (!commitSha || typeof commitSha !== "string") {
    return NextResponse.json(
      { error: "commitSha is required" },
      { status: 400 }
    )
  }

  try {
    updateSprintCommitHash(id, sprintNumber, commitSha, access.username)
    return NextResponse.json({ message: "Commit hash updated" })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update commit hash"
    const status = message.includes("not found") ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
