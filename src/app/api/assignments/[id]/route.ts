import { NextResponse } from "next/server"
import { getAssignmentWithStats } from "@/backend/services/assignment.service"
import {
  authorize,
  canAccessAssignment,
  resolveAssignment,
} from "@/backend/services/permissions"

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
