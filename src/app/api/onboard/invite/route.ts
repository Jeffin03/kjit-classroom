import { NextResponse } from "next/server"
import { getOrgToken } from "@/backend/github/client"
import {
  inviteToOrg,
  checkOrgMember,
} from "@/backend/github/org"
import { addTeamMember, findTeam } from "@/backend/github/teams"
import { addRosterEntries } from "@/backend/store/roster"
import { authorize, canAccessClass } from "@/backend/services/permissions"

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

  const body = await request.json()
  const { matched, unmatched, classTeam, classTeamSlug } = body

  if (!matched?.length && !unmatched?.length) {
    return NextResponse.json(
      { error: "No students to process" },
      { status: 400 }
    )
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
          await inviteToOrg(token, org, student.githubUsername, "direct_member", [
            team.id,
          ])
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
