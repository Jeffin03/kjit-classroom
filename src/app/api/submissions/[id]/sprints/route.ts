import { NextResponse } from "next/server"
import { getSubmissionById } from "@/backend/store/submissions"
import { submitSprint } from "@/backend/services/submission.service"
import { authorize, canUseRepo } from "@/backend/services/permissions"
import { parseRepoUrl } from "@/backend/github/repos"
import { jsonError, readJson } from "@/backend/http"
import type { SubmitSprintInput } from "@/backend/types"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorize("submission.create")
  if (!auth.ok) return auth.response

  const { access, accessToken } = auth.session

  const { id } = await params
  const submission = getSubmissionById(id)
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  if (submission.studentUsername !== access.username) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await readJson<
    Partial<SubmitSprintInput> & { sprintNumber: number }
  >(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const { sprintNumber, repoUrl, documentationUrl, summary, isPivot } = body

  if (typeof sprintNumber !== "number" || sprintNumber < 0) {
    return NextResponse.json(
      { error: "sprintNumber is required" },
      { status: 400 }
    )
  }

  if (documentationUrl !== undefined && typeof documentationUrl !== "string") {
    return jsonError("documentationUrl must be a string")
  }
  if (summary !== undefined && typeof summary !== "string") {
    return jsonError("summary must be a string")
  }
  if (isPivot !== undefined && typeof isPivot !== "boolean") {
    return jsonError("isPivot must be a boolean")
  }

  const effectiveRepoUrl = (isPivot ? repoUrl : submission.repoUrl) as string
  if (typeof effectiveRepoUrl !== "string" || !effectiveRepoUrl) {
    return NextResponse.json(
      { error: "repoUrl is required" },
      { status: 400 }
    )
  }

  // The commit is read with the caller's own token, which can see any repo they
  // can personally read. Without this check a student could record sprint
  // metrics from a private repo they merely collaborate on.
  let repoOwner: string
  try {
    ;({ owner: repoOwner } = parseRepoUrl(effectiveRepoUrl))
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
    const sprint = await submitSprint(
      id,
      {
        sprintNumber,
        repoUrl: effectiveRepoUrl,
        documentationUrl,
        summary,
        isPivot,
      },
      accessToken
    )
    return NextResponse.json(sprint, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit sprint"
    const status =
      message.includes("already") ||
      message.includes("is required") ||
      message.includes("deadline")
        ? 400
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}