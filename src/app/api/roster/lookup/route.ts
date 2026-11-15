import { NextResponse } from "next/server"
import { authorize } from "@/backend/services/permissions"
import { getRoster } from "@/backend/store/roster"
import { jsonError } from "@/backend/http"

/**
 * Look up a student by roll number. Returns their GitHub username, display
 * name, email, class team and roster status — used for team formation so
 * students can invite teammates by roll number instead of GitHub handle.
 */
export async function GET(request: Request) {
  const auth = await authorize("roster.read")
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const rollNo = searchParams.get("rollNo")
  if (!rollNo || typeof rollNo !== "string") {
    return jsonError("rollNo is required", 400)
  }

  const roster = getRoster()
  const entry = roster.find((r) => r.rollNo === rollNo)
  if (!entry) {
    return NextResponse.json(
      { error: `No student found with roll number ${rollNo}` },
      { status: 404 }
    )
  }

  return NextResponse.json({
    rollNo: entry.rollNo,
    githubUsername: entry.githubUsername,
    githubUserId: entry.githubUserId,
    collegeEmail: entry.collegeEmail,
    displayName: entry.displayName,
    classTeam: entry.classTeam,
    status: entry.status,
  })
}
