import { NextResponse } from "next/server"
import { auth } from "@/backend/auth"
import { isFaculty } from "@/backend/services/auth.service"
import { getSubmissionById, getSprintSubmission } from "@/backend/store/submissions"
import { updateSprintCommitHash } from "@/backend/services/submission.service"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; sprint: string }> }
) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, sprint } = await params
  const sprintNumber = parseInt(sprint, 10)
  if (isNaN(sprintNumber)) {
    return NextResponse.json({ error: "Invalid sprint number" }, { status: 400 })
  }

  const submission = getSubmissionById(id)
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  const username = session.user?.name
  if (!username) {
    return NextResponse.json({ error: "No user info" }, { status: 400 })
  }

  const faculty = await isFaculty(username)
  if (!faculty && submission.studentUsername !== username) {
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
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const username = session.user?.name
  if (!username) {
    return NextResponse.json({ error: "No user info" }, { status: 400 })
  }

  const faculty = await isFaculty(username)
  if (!faculty) {
    return NextResponse.json(
      { error: "Only faculty can update a commit hash" },
      { status: 403 }
    )
  }

  const { id, sprint } = await params
  const sprintNumber = parseInt(sprint, 10)
  if (isNaN(sprintNumber)) {
    return NextResponse.json({ error: "Invalid sprint number" }, { status: 400 })
  }

  const body = await request.json()
  const { commitSha } = body
  if (!commitSha || typeof commitSha !== "string") {
    return NextResponse.json(
      { error: "commitSha is required" },
      { status: 400 }
    )
  }

  const submission = getSubmissionById(id)
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  try {
    updateSprintCommitHash(id, sprintNumber, commitSha, username)
    return NextResponse.json({ message: "Commit hash updated" })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update commit hash"
    const status = message.includes("not found") ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}