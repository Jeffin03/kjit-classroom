import { NextResponse } from "next/server"
import { getSubmissionById } from "@/backend/store/submissions"
import {
  reviewSprint,
  acceptSubmission,
} from "@/backend/services/submission.service"
import { authorize, canAccessSubmission } from "@/backend/services/permissions"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json()
  const accepting = body?.accept === true

  const auth = await authorize(
    accepting ? "submission.accept" : "submission.review"
  )
  if (!auth.ok) return auth.response

  const { access } = auth.session

  const { id } = await params
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

  if (accepting) {
    try {
      acceptSubmission(id, access.username)
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
    reviewSprint(sprintSubmissionId, access.username, notes)
    return NextResponse.json({ message: "Review notes saved" })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save review notes"
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
