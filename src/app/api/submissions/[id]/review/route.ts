import { NextResponse } from "next/server"
import { auth } from "@/backend/auth"
import { isFaculty } from "@/backend/services/auth.service"
import { getSubmissionById } from "@/backend/store/submissions"
import {
  reviewSprint,
  acceptSubmission,
} from "@/backend/services/submission.service"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
      { error: "Only faculty can add review notes" },
      { status: 403 }
    )
  }

  const { id } = await params
  const submission = getSubmissionById(id)
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  const body = await request.json()

  if (body.accept === true) {
    try {
      acceptSubmission(id, username)
      return NextResponse.json({ message: "Submission accepted" })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to accept submission"
      return NextResponse.json({ error: message }, { status: 404 })
    }
  }

  const { sprintSubmissionId, notes } = body
  if (!sprintSubmissionId || typeof notes !== "string") {
    return NextResponse.json(
      { error: "sprintSubmissionId and notes are required" },
      { status: 400 }
    )
  }

  try {
    reviewSprint(sprintSubmissionId, username, notes)
    return NextResponse.json({ message: "Review notes saved" })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save review notes"
    return NextResponse.json({ error: message }, { status: 404 })
  }
}