import { NextResponse } from "next/server"
import {
  getRoster,
  getRosterByClassTeam,
  getTeams,
  addRosterEntries,
  removeRosterEntry,
} from "@/backend/store/roster"
import { authorize, canAccessClass } from "@/backend/services/permissions"
import { getOrgToken } from "@/backend/github/client"
import { addTeamMember, findTeam, removeTeamMember } from "@/backend/github/teams"
import { jsonError, readJson } from "@/backend/http"
import type { RosterEntry } from "@/backend/types"

export async function GET() {
  const auth = await authorize("roster.read")
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const scope = access.scopedClasses

  // Scoped teachers only see the class teams they teach — the roster rows AND
  // the team picker, otherwise a scoped teacher could select a class outside
  // their scope and only find out at submit time. Their own class list is
  // included even before any student is onboarded into it.
  const roster =
    scope === null
      ? getRoster()
      : scope.flatMap((team) => getRosterByClassTeam(team))
  const teams = scope === null ? getTeams() : [...scope].sort()

  return NextResponse.json({ roster, teams, scope })
}

/**
 * Removes one student from one class. Local roster first (that is the app's
 * source of truth), GitHub team membership best-effort afterwards so a team
 * hiccup cannot strand the record.
 */
export async function DELETE(request: Request) {
  const auth = await authorize("roster.write")
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const body = await readJson<{ rollNo?: string; classTeam?: string }>(request)
  if (!body) return jsonError("Request body must be valid JSON")
  const { rollNo, classTeam } = body

  if (
    typeof rollNo !== "string" ||
    typeof classTeam !== "string" ||
    !rollNo ||
    !classTeam
  ) {
    return NextResponse.json(
      { error: "rollNo and classTeam are required" },
      { status: 400 }
    )
  }

  if (!canAccessClass(access, classTeam)) {
    return NextResponse.json(
      { error: "This class is outside your classes." },
      { status: 403 }
    )
  }

  const removed = removeRosterEntry(rollNo, classTeam)
  if (!removed) {
    return NextResponse.json(
      { error: "Student not found in this class." },
      { status: 404 }
    )
  }

  const org = process.env.GITHUB_ORG
  if (org && removed.githubUsername) {
    try {
      const token = await getOrgToken()
      const team = await findTeam(token, org, { name: classTeam })
      if (team) {
        await removeTeamMember(token, org, team.slug, removed.githubUsername)
      }
    } catch {
      // Local removal already succeeded; GitHub membership catches up on the
      // next team sync.
    }
  }

  return NextResponse.json({ removed })
}

/**
 * Puts a previously removed student back — powers the Undo action on the
 * removal toast. Accepts the entry DELETE returned, so original onboarding
 * metadata survives the round trip.
 */
export async function POST(request: Request) {
  const auth = await authorize("roster.write")
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const body = await readJson<Partial<RosterEntry>>(request)
  if (!body) return jsonError("Request body must be valid JSON")
  const { rollNo, classTeam, collegeEmail } = body

  if (
    typeof rollNo !== "string" ||
    typeof classTeam !== "string" ||
    typeof collegeEmail !== "string" ||
    !rollNo ||
    !classTeam ||
    !collegeEmail
  ) {
    return NextResponse.json(
      { error: "rollNo, classTeam and collegeEmail are required" },
      { status: 400 }
    )
  }

  if (!canAccessClass(access, classTeam)) {
    return NextResponse.json(
      { error: "This class is outside your classes." },
      { status: 403 }
    )
  }

  const entry: RosterEntry = {
    rollNo,
    classTeam,
    collegeEmail,
    githubUsername: body.githubUsername || undefined,
    githubUserId: body.githubUserId,
    status:
      body.status === "invited" || body.status === "no-account"
        ? body.status
        : "active",
    onboardedBy: body.onboardedBy || access.username,
    onboardedAt: body.onboardedAt || new Date().toISOString(),
  }

  addRosterEntries([entry])

  const org = process.env.GITHUB_ORG
  if (org && entry.githubUsername) {
    try {
      const token = await getOrgToken()
      const team = await findTeam(token, org, { name: classTeam })
      if (team) {
        await addTeamMember(token, org, team.slug, entry.githubUsername)
      }
    } catch {
      // Local restore already succeeded; team membership follows on re-sync.
    }
  }

  return NextResponse.json({ restored: entry }, { status: 201 })
}
