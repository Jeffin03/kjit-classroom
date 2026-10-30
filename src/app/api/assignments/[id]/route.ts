import { NextResponse } from "next/server"
import { getAssignmentWithStats, validateAssignmentInput } from "@/backend/services/assignment.service"
import {
  authorize,
  canAccessAssignment,
  canAccessClass,
  resolveAssignment,
} from "@/backend/services/permissions"
import { deleteAssignment, getAssignment, updateAssignment } from "@/backend/store/assignments"
import { deleteSubmissionsByAssignment } from "@/backend/store/submissions"
import { jsonError, readJson } from "@/backend/http"
import type { CreateAssignmentInput } from "@/backend/types"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorize("assignment.readStats")
  if (!auth.ok) return auth.response

  const { id } = await params

  const assignment = resolveAssignment(id)
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
  }

  if (!canAccessAssignment(auth.session.access, assignment)) {
    return NextResponse.json(
      { error: "This assignment is outside your classes" },
      { status: 403 }
    )
  }

  return NextResponse.json(getAssignmentWithStats(id))
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorize("assignment.create")
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const { id } = await params

  const assignment = resolveAssignment(id)
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
  }
  if (!canAccessAssignment(access, assignment)) {
    return NextResponse.json(
      { error: "This assignment is outside your classes" },
      { status: 403 }
    )
  }
  // A scoped teacher can only change an assignment that lives entirely inside
  // their classes; editing a shared assignment would affect other classes.
  if (
    access.scopedClasses !== null &&
    assignment.assignedTeams.some(
      (team) => !access.scopedClasses!.includes(team)
    )
  ) {
    return NextResponse.json(
      { error: "This assignment is shared with classes outside your scope" },
      { status: 403 }
    )
  }

  const body = await readJson<Partial<CreateAssignmentInput>>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const validation = validateAssignmentInput(body, { partial: true })
  if (!validation.ok) return jsonError(validation.error)

  const updates = validation.value
  if (updates.assignedTeams) {
    const outsideScope = updates.assignedTeams.filter(
      (team) => !canAccessClass(access, team)
    )
    if (outsideScope.length > 0) {
      return NextResponse.json(
        {
          error: `You cannot assign to these classes: ${outsideScope.join(", ")}`,
        },
        { status: 403 }
      )
    }
  }

  updateAssignment(id, updates)
  return NextResponse.json(getAssignment(id))
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorize("assignment.create")
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const { id } = await params

  const assignment = resolveAssignment(id)
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
  }
  if (!canAccessAssignment(access, assignment)) {
    return NextResponse.json(
      { error: "This assignment is outside your classes" },
      { status: 403 }
    )
  }
  if (
    access.scopedClasses !== null &&
    assignment.assignedTeams.some(
      (team) => !access.scopedClasses!.includes(team)
    )
  ) {
    return NextResponse.json(
      { error: "This assignment is shared with classes outside your scope" },
      { status: 403 }
    )
  }

  deleteSubmissionsByAssignment(id)
  deleteAssignment(id)
  return NextResponse.json({ deleted: id })
}
