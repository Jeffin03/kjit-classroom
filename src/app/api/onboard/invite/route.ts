import { NextResponse } from "next/server"
import { auth } from "@/backend/auth"
import { getOrgToken, inviteToOrg, addTeamMember, checkOrgMember } from "@/backend/lib/github"
import { getTeacherByGithubUsername, addRosterEntries } from "@/backend/lib/data"

interface MatchedStudent {
  rollNo: string
  collegeEmail: string
  githubUsername: string
  githubId: number
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json(
      { error: "GITHUB_ORG not configured" },
      { status: 500 }
    )
  }

  const currentUser = session.user?.name
  if (!currentUser) {
    return NextResponse.json({ error: "No user info" }, { status: 400 })
  }

  const body = await request.json()
  const { matched, unmatched, classTeam } = body

  if (!matched?.length && !unmatched?.length) {
    return NextResponse.json(
      { error: "No students to process" },
      { status: 400 }
    )
  }

  try {
    const token = await getOrgToken()
    const teamSlug = classTeam
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    let addedToTeam = 0
    let invited = 0
    let alreadyMember = 0
    const errors: string[] = []

    for (const student of matched as MatchedStudent[]) {
      try {
        const isMember = await checkOrgMember(token, org, student.githubUsername)

        if (isMember) {
          alreadyMember++
        } else {
          await inviteToOrg(token, org, student.githubUsername)
          invited++
        }

        await addTeamMember(token, org, teamSlug, student.githubUsername)
        addedToTeam++
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
      addedToTeam,
      invited,
      alreadyMember,
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
