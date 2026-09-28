import { NextResponse } from "next/server"
import {
  createAssignment,
  getAssignmentsForStudent,
  getAssignmentsForFaculty,
} from "@/backend/services/assignment.service"
import { authenticate, authorize, canAccessClass } from "@/backend/services/permissions"
import type { CreateAssignmentInput } from "@/backend/types"

export async function GET() {
  const auth = await authenticate()
  if (!auth.ok) return auth.response

  const { access } = auth.session

  if (access.isFaculty) {
    return NextResponse.json(getAssignmentsForFaculty(access.scopedClasses))
  }

  // Unrostered users have nothing to see; an empty list keeps the UI clean
  // without leaking whether an assignment exists.
  if (!access.capabilities.has("assignment.read")) {
    return NextResponse.json([])
  }

  return NextResponse.json(getAssignmentsForStudent(access.username))
}

export async function POST(request: Request) {
  const auth = await authorize("assignment.create")
  if (!auth.ok) return auth.response

  const { access } = auth.session

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

  const outsideScope = assignedTeams.filter((t) => !canAccessClass(access, t))
  if (outsideScope.length > 0) {
    return NextResponse.json(
      { error: `You cannot assign to these classes: ${outsideScope.join(", ")}` },
      { status: 403 }
    )
  }

  const assignment = createAssignment(body, access.username)
  return NextResponse.json(assignment, { status: 201 })
}
