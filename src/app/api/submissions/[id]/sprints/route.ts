import { NextResponse } from "next/server"
import { auth } from "@/backend/auth"
import { getSubmissionById } from "@/backend/store/submissions"
import { submitSprint } from "@/backend/services/submission.service"
import type { SubmitSprintInput } from "@/backend/types"

export async function POST(
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

  const { id } = await params
  const submission = getSubmissionById(id)
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  if (submission.studentUsername !== username) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const {
    sprintNumber,
    repoUrl,
    documentationUrl,
    summary,
    isPivot,
  } = body as Partial<SubmitSprintInput> & { sprintNumber: number }

  if (typeof sprintNumber !== "number" || sprintNumber < 0) {
    return NextResponse.json(
      { error: "sprintNumber is required" },
      { status: 400 }
    )
  }

  const effectiveRepoUrl = (isPivot ? repoUrl : submission.repoUrl) as string
  if (!effectiveRepoUrl) {
    return NextResponse.json(
      { error: "repoUrl is required" },
      { status: 400 }
    )
  }

  try {
    const sprint = await submitSprint(id, {
      sprintNumber,
      repoUrl: effectiveRepoUrl,
      documentationUrl,
      summary,
      isPivot,
    })
    return NextResponse.json(sprint, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit sprint"
    const status = message.includes("already") || message.includes("is required")
      ? 400
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}