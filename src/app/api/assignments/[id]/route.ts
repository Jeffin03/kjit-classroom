import { NextResponse } from "next/server"
import { auth } from "@/backend/auth"
import { isFaculty } from "@/backend/services/auth.service"
import { getAssignmentWithStats } from "@/backend/services/assignment.service"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const username = session.user?.name
  if (!username) {
    return NextResponse.json({ error: "No user info" }, { status: 400 })
  }

  const { id } = await params
  const data = getAssignmentWithStats(id)
  if (!data) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
  }

  const faculty = await isFaculty(username)
  if (!faculty) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(data)
}