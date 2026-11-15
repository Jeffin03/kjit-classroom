import { NextResponse } from "next/server"
import { authenticate } from "@/backend/services/permissions"
import { leaveTeam, getTeam } from "@/backend/store/teams"
import { flushNow } from "@/backend/store/persistence"
import { csrfCheck } from "@/backend/csrf"
import { rateLimit, getClientIp } from "@/backend/rateLimit"


export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfCheck(request)
  if (csrf) return csrf

  const ip = getClientIp(request)
  const rl = rateLimit(`teams:leave:${ip}`, { limit: 5, windowMs: 60_000 })
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

  // Only students can leave
  if (access.role !== "student") {
    return NextResponse.json(
      { error: "Only students can leave teams" },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => null) as
    | { username?: string }
    | null

  const username = body?.username ?? access.username

  if (username.toLowerCase() !== access.username.toLowerCase()) {
    return NextResponse.json(
      { error: "You can only leave as yourself" },
      { status: 403 }
    )
  }

  try {
    leaveTeam({ teamId: id, username })
    await flushNow()
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to leave team"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
