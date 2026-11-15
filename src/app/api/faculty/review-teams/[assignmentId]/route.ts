import { NextResponse } from "next/server"
import { authorize, canAccessAssignment } from "@/backend/services/permissions"
import { getTeamsByAssignment } from "@/backend/store/teams"
import {
  getSubmissionByStudentAndAssignment,
  getSprintSubmissions,
} from "@/backend/store/submissions"
import { getAssignment } from "@/backend/store/assignments"
import type { Submission } from "@/backend/types"

/**
 * Returns all teams for an assignment, sorted by the lowest roll number
 * among team members, enriched with their submission and sprint review status.
 * Used by the faculty PWA review card flow.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const auth = await authorize("submission.readAll")
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const { assignmentId } = await params

  const assignment = getAssignment(assignmentId)
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
  }

  if (!canAccessAssignment(access, assignment)) {
    return NextResponse.json(
      { error: "This assignment is outside your classes" },
      { status: 403 }
    )
  }

  const teams = getTeamsByAssignment(assignmentId)

  // Enrich each team with submission + sprint status + lowest roll number
  const enriched = teams.map((team) => {
    // Try each member to find a submission for this assignment
    let memberSubmission: Submission | null = null
    let submittingMember: { username: string; rollNo: string } | null = null
    for (const member of team.members) {
      const sub = getSubmissionByStudentAndAssignment(
        member.username,
        assignmentId
      )
      if (sub) {
        memberSubmission = sub
        submittingMember = { username: member.username, rollNo: member.rollNo }
        break
      }
    }

    // Get sprint status
    const sprintStatus: {
      submitted: number
      reviewed: number
      total: number
      currentSprint: number
      lastReviewedAt?: string
    } = {
      submitted: 0,
      reviewed: 0,
      total: assignment.sprintCount,
      currentSprint: 0,
      lastReviewedAt: undefined,
    }

    if (memberSubmission) {
      const sprints = getSprintSubmissions(memberSubmission.id)
      sprintStatus.submitted = sprints.length
      sprintStatus.reviewed = sprints.filter((s) => !!s.reviewedAt).length
      sprintStatus.currentSprint =
        sprints.length > 0
          ? Math.max(...sprints.map((s) => s.sprintNumber))
          : 0
      const lastReviewed = sprints
        .filter((s) => !!s.reviewedAt)
        .sort(
          (a, b) =>
            (b.reviewedAt || "").localeCompare(a.reviewedAt || "")
        )[0]
      sprintStatus.lastReviewedAt = lastReviewed?.reviewedAt
    }

    // Lowest roll number for sorting
    const rollNumbers = team.members
      .map((m) => m.rollNo)
      .filter(Boolean)
    const lowestRollNo =
      rollNumbers.length > 0 ? rollNumbers.sort()[0] : ""

    return {
      team,
      lowestRollNo,
      submission: memberSubmission,
      submittingMember,
      sprintStatus,
    }
  })

  // Sort by lowest roll number ascending
  enriched.sort((a, b) => a.lowestRollNo.localeCompare(b.lowestRollNo))

  return NextResponse.json({ teams: enriched })
}
