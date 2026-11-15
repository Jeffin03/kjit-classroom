import { NextResponse } from "next/server"
import { authenticate } from "@/backend/services/permissions"
import { csrfCheck } from "@/backend/csrf"
import {
  getTeam,
  getTeamWithRoster,
  updateTeam,
  deleteTeam,
} from "@/backend/store/teams"
import { getRosterByGithubUsername } from "@/backend/store/roster"
import { jsonError, readJson } from "@/backend/http"
import { flushNow } from "@/backend/store/persistence"
import type { UpdateTeamInput } from "@/backend/types"

/**
 * For scoped faculty, verify that at least one member of the team belongs to
 * one of the faculty's assigned class teams. Unrestricted staff (owner,
 * animator) pass automatically.
 */
function teamInScopedClasses(
  team: { members: Array<{ username: string; rollNo: string }> },
  scopedClasses: string[] | null
): boolean {
  if (scopedClasses === null) return true
  return team.members.some((m) => {
    const entry = getRosterByGithubUsername(m.username)
    return entry ? scopedClasses.includes(entry.classTeam) : false
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate()
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const { id } = await params
  const team = getTeamWithRoster(id)
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 })
  }

  // Students can only see their own team; faculty can see any team in their classes
  if (access.role === "student") {
    const isMember = team.members.some(
      (m) => m.username.toLowerCase() === access.username.toLowerCase()
    )
    if (!isMember) {
      return NextResponse.json(
        { error: "Not authorized to view this team" },
        { status: 403 }
      )
    }
  } else if (access.capabilities.has("submission.readAll")) {
    // Faculty: enforce class scoping when scoped
    if (!teamInScopedClasses(team, access.scopedClasses)) {
      return NextResponse.json(
        { error: "This team is outside your classes" },
        { status: 403 }
      )
    }
  }

  return NextResponse.json({ team })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfCheck(request)
  if (csrf) return csrf

  const auth = await authenticate()
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const { id } = await params
  const team = getTeam(id)
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 })
  }

  // Only team members or faculty can update
  const isMember = team.members.some(
    (m) => m.username.toLowerCase() === access.username.toLowerCase()
  )
  const isFaculty = access.capabilities.has("submission.readAll")

  if (!isMember && !isFaculty) {
    return NextResponse.json(
      { error: "Not authorized to update this team" },
      { status: 403 }
    )
  }

  // Faculty updating a team outside their scoped classes is denied
  if (isFaculty && !isMember && !teamInScopedClasses(team, access.scopedClasses)) {
    return NextResponse.json(
      { error: "This team is outside your classes" },
      { status: 403 }
    )
  }

  const body = await readJson<UpdateTeamInput>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  try {
    const updated = updateTeam(id, body)
    if (!updated) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }
    await flushNow()
    return NextResponse.json({ team: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update team"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfCheck(request)
  if (csrf) return csrf

  const auth = await authenticate()
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const { id } = await params
  const team = getTeam(id)
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 })
  }

  // Only the team lead or faculty can delete
  const isLead =
    team.members.find(
      (m) => m.username.toLowerCase() === access.username.toLowerCase()
    )?.isLead ?? false
  const isFaculty = access.capabilities.has("submission.readAll")

  if (!isLead && !isFaculty) {
    return NextResponse.json(
      { error: "Only the team lead or faculty can delete a team" },
      { status: 403 }
    )
  }

  // Faculty deleting a team outside their scoped classes is denied
  if (isFaculty && !isLead && !teamInScopedClasses(team, access.scopedClasses)) {
    return NextResponse.json(
      { error: "This team is outside your classes" },
      { status: 403 }
    )
  }

  deleteTeam(id)
  await flushNow()
  return NextResponse.json({ deleted: id })
}
