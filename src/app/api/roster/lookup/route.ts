import { NextResponse } from "next/server"
import { authenticate } from "@/backend/services/permissions"
import { getRoster } from "@/backend/store/roster"
import { jsonError } from "@/backend/http"

/**
 * Look up a student by roll number. Returns their GitHub username, display
 * name and class team — used for team formation so students can invite
 * teammates by roll number instead of GitHub handle.
 *
 * Faculty (roster.read) get the full record including college email. Students
 * can only look up classmates, and never see email addresses.
 */
export async function GET(request: Request) {
  const auth = await authenticate()
  if (!auth.ok) return auth.response

  const { access } = auth.session

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

  const isFaculty = access.capabilities.has("roster.read")

  // Students may only look up classmates.
  if (!isFaculty && (!access.team || entry.classTeam !== access.team)) {
    return NextResponse.json(
      { error: `No student found with roll number ${rollNo}` },
      { status: 404 }
    )
  }

  return NextResponse.json({
    rollNo: entry.rollNo,
    githubUsername: entry.githubUsername,
    githubUserId: entry.githubUserId,
    ...(isFaculty ? { collegeEmail: entry.collegeEmail } : {}),
    displayName: entry.displayName,
    classTeam: entry.classTeam,
    status: entry.status,
  })
}
