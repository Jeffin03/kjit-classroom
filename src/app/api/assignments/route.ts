import { NextResponse } from "next/server"
import {
  createAssignment,
  getAssignmentsForStudent,
  getAssignmentsForFaculty,
  validateAssignmentInput,
} from "@/backend/services/assignment.service"
import { authenticate, authorize, canAccessClass } from "@/backend/services/permissions"
import { jsonError, readJson } from "@/backend/http"
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

  const body = await readJson<Partial<CreateAssignmentInput>>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const validation = validateAssignmentInput(body)
  if (!validation.ok) return jsonError(validation.error)

  const input = validation.value as CreateAssignmentInput
  const outsideScope = input.assignedTeams.filter((t) =>
    !canAccessClass(access, t)
  )
  if (outsideScope.length > 0) {
    return NextResponse.json(
      { error: `You cannot assign to these classes: ${outsideScope.join(", ")}` },
      { status: 403 }
    )
  }

  const assignment = createAssignment(input, access.username)
  return NextResponse.json(assignment, { status: 201 })
}
