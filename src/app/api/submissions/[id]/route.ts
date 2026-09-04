import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getSubmissionById, updateSubmissionStatus } from "@/lib/data"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { status } = body

  if (!status) {
    return NextResponse.json(
      { error: "status is required" },
      { status: 400 }
    )
  }

  const validStatuses = ["forked", "submitted", "reviewed", "accepted", "merged"]
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    )
  }

  const submission = getSubmissionById(id)
  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 }
    )
  }

  const reviewedBy = session.user?.name || session.user?.email || "unknown"
  updateSubmissionStatus(id, status, reviewedBy)

  return NextResponse.json({ message: "Status updated", id, status })
}
