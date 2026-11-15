import { NextResponse } from "next/server"
import { authorize } from "@/backend/services/permissions"
import { setSprintDeadlines } from "@/backend/services/assignment.service"
import { canAccessAssignment } from "@/backend/services/permissions"
import { getAssignment } from "@/backend/store/assignments"
import { jsonError, readJson } from "@/backend/http"
import { flushNow } from "@/backend/store/persistence"
import { csrfCheck } from "@/backend/csrf"
import { rateLimit, getClientIp } from "@/backend/rateLimit"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfCheck(request)
  if (csrf) return csrf

  const ip = getClientIp(request)
  const rl = rateLimit(`assignments:deadlines:${ip}`, { limit: 10, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  const auth = await authorize("assignment.create")
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

  const body = await readJson<{ deadlines: Record<number, string> }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  if (!body.deadlines || typeof body.deadlines !== "object") {
    return jsonError("deadlines is required and must be an object")
  }

  // Validate each deadline is a valid date string
  for (const [sprintNum, dateStr] of Object.entries(body.deadlines)) {
    const sprint = parseInt(sprintNum, 10)
    if (isNaN(sprint) || sprint < 0 || sprint >= (assignment.sprintCount ?? 4)) {
      return jsonError(`Invalid sprint number: ${sprintNum}`)
    }
    if (typeof dateStr !== "string" || isNaN(new Date(dateStr).getTime())) {
      return jsonError(`Invalid deadline date for sprint ${sprint}`)
    }
  }

  try {
    const updated = setSprintDeadlines(id, body.deadlines)
    if (!updated) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }
    await flushNow()
    return NextResponse.json({ assignment: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to set deadlines"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
