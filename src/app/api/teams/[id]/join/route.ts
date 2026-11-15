import { NextResponse } from "next/server"
import { authenticate } from "@/backend/services/permissions"
import { joinTeam, getTeam } from "@/backend/store/teams"
import { jsonError, readJson } from "@/backend/http"
import { flushNow } from "@/backend/store/persistence"
import type { JoinTeamInput } from "@/backend/types"
import { csrfCheck } from "@/backend/csrf"
import { rateLimit, getClientIp } from "@/backend/rateLimit"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfCheck(request)
  if (csrf) return csrf

  const ip = getClientIp(request)
  const rl = rateLimit(`teams:join:${ip}`, { limit: 5, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  const auth = await authenticate()
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const { id } = await params
  const team = getTeam(id)
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 })
  }

  // Only students can join
  if (access.role !== "student") {
    return NextResponse.json(
      { error: "Only students can join teams" },
      { status: 403 }
    )
  }

  const body = await readJson<JoinTeamInput>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const { username, rollNo, consentToExistingProject } = body

  if (
    typeof username !== "string" ||
    typeof rollNo !== "string" ||
    !username ||
    !rollNo
  ) {
    return jsonError("username and rollNo are required")
  }

  // You can only join as yourself
  if (username.toLowerCase() !== access.username.toLowerCase()) {
    return NextResponse.json(
      { error: "You can only join as yourself" },
      { status: 403 }
    )
  }

  try {
    const updated = joinTeam({
      teamId: id,
      username,
      rollNo,
      consentToExistingProject: consentToExistingProject ?? true,
    })
    await flushNow()
    return NextResponse.json({ team: updated }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to join team"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
