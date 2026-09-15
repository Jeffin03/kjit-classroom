import { NextResponse } from "next/server"
import { auth } from "@/backend/auth"
import {
  getSubmissionsForStudent,
  getSubmissionsForAssignment,
  getAllSubmissions,
  createSubmission,
} from "@/backend/services/submission.service"
import { isFaculty } from "@/backend/services/auth.service"
import { getAssignment } from "@/backend/store/assignments"
import { isStudentAssigned } from "@/backend/services/assignment.service"
import { getTeamForUser } from "@/backend/services/roster.service"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const username = session.user?.name
  if (!username) {
    return NextResponse.json({ error: "No user info" }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const assignmentId = searchParams.get("assignmentId")

  if (assignmentId) {
    const faculty = await isFaculty(username)
    if (!faculty) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json(getSubmissionsForAssignment(assignmentId))
  }

  const faculty = await isFaculty(username)
  if (faculty) {
    return NextResponse.json(getAllSubmissions())
  }

  const submissions = getSubmissionsForStudent(username)
  return NextResponse.json(submissions)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const username = session.user?.name
  if (!username) {
    return NextResponse.json({ error: "No user info" }, { status: 400 })
  }

  const body = await request.json()
  const { assignmentId, repoUrl, abstractDocUrl } = body

  if (!assignmentId || !repoUrl || !abstractDocUrl) {
    return NextResponse.json(
      { error: "assignmentId, repoUrl, and abstractDocUrl are required" },
      { status: 400 }
    )
  }

  const assignment = getAssignment(assignmentId)
  if (!assignment) {
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 }
    )
  }

  const team = getTeamForUser(username)
  if (!isStudentAssigned(assignment, team)) {
    return NextResponse.json(
      { error: "This assignment is not assigned to your team" },
      { status: 403 }
    )
  }

  try {
    const submission = createSubmission({
      studentUsername: username,
      assignmentId,
      repoUrl,
      abstractDocUrl,
    })
    return NextResponse.json(submission, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create submission"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}