import { NextResponse } from "next/server"
import { auth } from "@/backend/auth"
import { isFaculty } from "@/backend/services/auth.service"
import {
  createAssignment,
  getAssignmentsForStudent,
  getAssignmentsForTeam,
} from "@/backend/services/assignment.service"
import type { CreateAssignmentInput } from "@/backend/types"

export async function GET() {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const username = session.user?.name
  if (!username) {
    return NextResponse.json({ error: "No user info" }, { status: 400 })
  }

  const faculty = await isFaculty(username)
  if (faculty) {
    return NextResponse.json(getAssignmentsForTeam(null))
  }

  return NextResponse.json(getAssignmentsForStudent(username))
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

  const faculty = await isFaculty(username)
  if (!faculty) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json()) as CreateAssignmentInput
  const {
    title,
    description,
    subject,
    deadline,
    problemStatement,
    assignedTeams,
  } = body

  if (!title || !description || !subject || !deadline || !problemStatement) {
    return NextResponse.json(
      {
        error:
          "title, description, subject, deadline, assignedTeams, and problemStatement are required",
      },
      { status: 400 }
    )
  }

  if (!assignedTeams || assignedTeams.length === 0) {
    return NextResponse.json(
      { error: "assignedTeams must contain at least one team" },
      { status: 400 }
    )
  }

  const assignment = createAssignment(body, username)
  return NextResponse.json(assignment, { status: 201 })
}