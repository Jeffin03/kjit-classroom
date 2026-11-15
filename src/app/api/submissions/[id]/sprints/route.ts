import { NextResponse } from "next/server"
import { getSubmissionById } from "@/backend/store/submissions"
import { submitSprint } from "@/backend/services/submission.service"
import { authorize, canUseRepo } from "@/backend/services/permissions"
import { parseRepoUrl } from "@/backend/github/repos"
import { jsonError, readJson } from "@/backend/http"
import { flushNow } from "@/backend/store/persistence"
import { cleanSprintSummary } from "@/backend/validation"
import type { SubmitSprintInput } from "@/backend/types"
import { csrfCheck } from "@/backend/csrf"
import { rateLimit, getClientIp } from "@/backend/rateLimit"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfCheck(request)
  if (csrf) return csrf

  const ip = getClientIp(request)
  const rl = rateLimit(`sprints:post:${ip}`, { limit: 10, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  const auth = await authorize("submission.create")
  if (!auth.ok) return auth.response

  const { access, accessToken } = auth.session

  const { id } = await params
  const submission = getSubmissionById(id)
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  // The submitter or any team member may submit subsequent sprints.
  const isTeamMember =
    submission.teamMembers?.some(
      (m: string) => m.toLowerCase() === access.username.toLowerCase()
    ) ?? false
  if (
    submission.studentUsername.toLowerCase() !== access.username.toLowerCase() &&
    !isTeamMember
  ) {
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
  // `summary` is a structured SprintSummary (completed[]/changed/blockers),
  // not a free-text string — validate the shape the submit form actually sends.
  let cleanedSummary: SubmitSprintInput["summary"]
  if (summary === undefined || summary === null) {
    cleanedSummary = undefined
  } else {
    const cleaned = cleanSprintSummary(summary)
    if (!cleaned) {
      return jsonError(
        "summary must be an object like { completed: string[], changed: string, blockers: string }"
      )
    }
    cleanedSummary = cleaned
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

  // For team submissions, any team member's repo is acceptable.
  // For solo submissions, the submitter must own the repo.
  const isTeamSubmission =
    (submission.teamMembers?.length ?? 0) > 0
  if (!isTeamSubmission && !canUseRepo(access, repoOwner)) {
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
        summary: cleanedSummary,
        isPivot,
      },
      accessToken
    )
    await flushNow()
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