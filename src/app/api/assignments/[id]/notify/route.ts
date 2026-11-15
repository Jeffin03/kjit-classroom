import { NextResponse } from "next/server"
import { authorize, canAccessAssignment } from "@/backend/services/permissions"
import { getAssignment } from "@/backend/store/assignments"
import { createAnnouncement } from "@/backend/store/announcements"
import { jsonError, readJson } from "@/backend/http"
import { flushNow } from "@/backend/store/persistence"
import { csrfCheck } from "@/backend/csrf"
import { rateLimit, getClientIp } from "@/backend/rateLimit"

const MAX_TITLE = 120
const MAX_BODY = 2000

/**
 * POST — faculty notify the students of an assignment about a sprint deadline.
 * Creates a targeted announcement whose default heading is the sprint number.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfCheck(request)
  if (csrf) return csrf

  const ip = getClientIp(request)
  const rl = rateLimit(`assignments:notify:${ip}`, { limit: 10, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  const auth = await authorize("announcement.create")
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const { id } = await params
  const assignment = getAssignment(id)
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
  }
  if (!canAccessAssignment(access, assignment)) {
    return NextResponse.json(
      { error: "This assignment is outside your classes" },
      { status: 403 }
    )
  }

  const body = await readJson<{
    sprintNumber?: unknown
    title?: unknown
    message?: unknown
    deadline?: unknown
  }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const sprintNumber =
    typeof body.sprintNumber === "number" ? body.sprintNumber : undefined
  if (
    sprintNumber !== undefined &&
    (sprintNumber < 0 || sprintNumber >= (assignment.sprintCount ?? 4))
  ) {
    return jsonError("Invalid sprint number")
  }

  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : `Sprint ${sprintNumber ?? 0}`
  if (title.length > MAX_TITLE) {
    return jsonError(`Title must be ${MAX_TITLE} characters or fewer`)
  }

  const message = typeof body.message === "string" ? body.message.trim() : ""
  if (!message) return jsonError("A notification message is required")
  if (message.length > MAX_BODY) {
    return jsonError(`Message must be ${MAX_BODY} characters or fewer`)
  }

  let expiresAt: string | undefined
  if (typeof body.deadline === "string" && body.deadline) {
    const parsed = new Date(body.deadline)
    if (!Number.isNaN(parsed.getTime())) expiresAt = parsed.toISOString()
  }

  const authorRole =
    access.role === "owner" || access.role === "animator"
      ? "admin"
      : "subject-teacher"

  const announcement = createAnnouncement(
    {
      title,
      body: message,
      targetTeams: assignment.assignedTeams,
      ...(sprintNumber !== undefined && { targetSprint: sprintNumber }),
      ...(expiresAt && { expiresAt }),
    },
    access.username,
    authorRole
  )

  await flushNow()
  return NextResponse.json({ announcement }, { status: 201 })
}
