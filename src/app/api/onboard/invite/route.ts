import { NextResponse } from "next/server"
import { getOrgToken } from "@/backend/github/client"
import {
  inviteToOrg,
  checkOrgMember,
} from "@/backend/github/org"
import { addTeamMember, findTeam } from "@/backend/github/teams"
import { addRosterEntries } from "@/backend/store/roster"
import { authorize, canAccessClass } from "@/backend/services/permissions"
import { jsonError, readJson } from "@/backend/http"

const MAX_STUDENTS = 500

interface MatchedStudent {
  rollNo: string
  collegeEmail: string
  githubUsername: string
  githubId: number
}

export async function POST(request: Request) {
  const auth = await authorize("roster.write")
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const currentUser = access.username

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json(
      { error: "GITHUB_ORG not configured" },
      { status: 500 }
    )
  }

  const body = await readJson<{
    matched?: unknown
    unmatched?: unknown
    classTeam?: string
    classTeamSlug?: string
  }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const { classTeam, classTeamSlug } = body
  const matched = Array.isArray(body.matched) ? body.matched : []
  const unmatched = Array.isArray(body.unmatched) ? body.unmatched : []

  if (matched.length === 0 && unmatched.length === 0) {
    return NextResponse.json(
      { error: "No students to process" },
      { status: 400 }
    )
  }

  if (matched.length + unmatched.length > MAX_STUDENTS) {
    return NextResponse.json(
      {
        error: `Too many students (${matched.length + unmatched.length}). Split the class into batches of ${MAX_STUDENTS} or fewer.`,
      },
      { status: 400 }
    )
  }

  for (let i = 0; i < matched.length; i++) {
    const student = matched[i] as Partial<MatchedStudent> | null
    if (
      !student ||
      typeof student.githubUsername !== "string" ||
      !student.githubUsername.trim() ||
      typeof student.githubId !== "number" ||
      typeof student.rollNo !== "string" ||
      typeof student.collegeEmail !== "string"
    ) {
      return jsonError(`Matched student ${i + 1} is missing required fields`)
    }
  }

  for (let i = 0; i < unmatched.length; i++) {
    const student = unmatched[i] as {
      rollNo?: unknown
      collegeEmail?: unknown
    } | null
    if (
      !student ||
      typeof student.rollNo !== "string" ||
      typeof student.collegeEmail !== "string"
    ) {
      return jsonError(`Unmatched student ${i + 1} is missing required fields`)
    }
  }

  if (!classTeam || !canAccessClass(access, classTeam)) {
    return NextResponse.json(
      { error: "You are not permitted to onboard students for this class" },
      { status: 403 }
    )
  }

  try {
    const token = await getOrgToken()

    // Never derive the slug locally — look up the team GitHub actually
    // returned so onboarding cannot silently target a non-existent team.
    const team = await findTeam(token, org, {
      name: classTeam,
      slug: classTeamSlug,
    })

    if (!team) {
      return NextResponse.json(
        {
          error: `GitHub team "${classTeam}" not found in organization ${org}. It may not exist, or it may be a Secret team that is only visible to organization owners. Set the team visibility to Closed and reload.`,
        },
        { status: 400 }
      )
    }

    let addedToTeam = 0
    let invited = 0
    let alreadyMember = 0
    let alreadyInTeam = 0
    const errors: string[] = []

    for (const student of matched as MatchedStudent[]) {
      try {
        const isMember = await checkOrgMember(token, org, student.githubUsername)

        if (!isMember) {
          // Invite with the team attached. A pending invitee is not a valid
          // membership target yet, so calling addTeamMember here would fail.
          await inviteToOrg(
            token,
            org,
            {
              login: student.githubUsername,
              githubId: student.githubId,
              email: student.collegeEmail,
            },
            "direct_member",
            [team.id]
          )
          invited++
        } else {
          alreadyMember++
          const membership = await addTeamMember(
            token,
            org,
            team.slug,
            student.githubUsername
          )
          if (membership === "added") {
            addedToTeam++
          } else {
            alreadyInTeam++
          }
        }
      } catch (err) {
        errors.push(
          `${student.githubUsername}: ${err instanceof Error ? err.message : "Unknown error"}`
        )
      }
    }

    const now = new Date().toISOString()
    const rosterEntries = matched.map((s: MatchedStudent) => ({
      rollNo: s.rollNo,
      collegeEmail: s.collegeEmail,
      githubUsername: s.githubUsername,
      githubUserId: s.githubId,
      classTeam,
      status: "active" as const,
      onboardedBy: currentUser,
      onboardedAt: now,
    }))

    const unmatchedEntries = unmatched.map((s: { rollNo: string; collegeEmail: string }) => ({
      rollNo: s.rollNo,
      collegeEmail: s.collegeEmail,
      classTeam,
      status: "no-account" as const,
      onboardedBy: currentUser,
      onboardedAt: now,
    }))

    addRosterEntries([...rosterEntries, ...unmatchedEntries])

    return NextResponse.json({
      team: { name: team.name, slug: team.slug },
      addedToTeam,
      invited,
      alreadyMember,
      alreadyInTeam,
      noAccount: unmatched?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to invite" },
      { status: 500 }
    )
  }
}
